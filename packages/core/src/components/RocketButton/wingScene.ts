import type * as Three from 'three';
import { themeContract } from '../../tokens/theme.css';
import {
  FLAME_PEAK,
  FLAME_RATIO,
  NOZZLE_RATIO,
  NOZZLE_X,
  type RocketBeat,
  type RocketGeometry,
} from './rocketBeat';

// 로켓 장면(M7.1 T8). 꼬리날개 둘, 분사구 둘, 불꽃 둘을 three로 그린다. three 모듈은 인자로 받는다
// (값 import 금지: 첫 화면 번들에 three가 실리지 않게 loadThree가 따로 불러온다).
// 박자 함수(rocketBeat)의 결과를 자세로 바꾸는 순수 함수(wingPose), 그 자세를 걸 장면(buildWingRig, WebGL 없이 만들어진다),
// 렌더러까지 묶은 createWingScene으로 나뉜다. 렌더러만 WebGL이 있어야 한다.

type ThreeModule = typeof Three;

/** 로켓이 박자 하나에서 받는 입력 */
export type WingInput = Pick<RocketBeat, 'fins' | 'flame'>;

// 꼬리날개(오른쪽 기준): 단추 옆면에 박힌 뿌리가 높이 방향으로 길고 끝이 바깥 아래로 젖혀진 삼각형. 단추 높이(H)에 대한 비
const FIN_ROOT_TOP = 0.45;
const FIN_ROOT_BOTTOM = -0.45;
const FIN_TIP = { x: 0.7, y: -1.0 };
// 경첩 자리(단추 중심에서 아래로). 꼬리날개 아래쪽이 단추 밑면을 지나 늘어진다
const FIN_HINGE_Y = -0.15;
// 단추 옆면보다 안쪽으로 박아 뿌리가 단추에 가려지게 한다(캔버스는 단추 복제본 뒤에 깔린다)
const FIN_TUCK = 0.04;
// 접힌 꼬리날개는 경첩(단추 옆면의 세로선)을 축으로 단추 뒤(깊이 쪽)로 이 각도만큼 접혀 있다. 90이면 단추에 가려 안 보인다
const FOLD_DEG = 90;
// 꼬리날개 두께와 모서리 둥글림(H 비), 빛을 비스듬히 받도록 바깥 축으로 기울인 각(rad)
const FIN_THICKNESS = 0.1;
const FIN_BEVEL = 0.025;
const FIN_PITCH = 0.2;
// 분사구: 아래로 벌어진 짧은 종 모양. 반지름은 H 비, 몸통은 보이는 길이(NOZZLE_RATIO)보다 위로 길어 snap이 넘쳐도 틈이 안 생긴다
const NOZZLE_RADIUS = 0.2;
const NOZZLE_TOP = 0.6;
const NOZZLE_OVERLAP = 1.3;
// 불꽃: 분사구 끝에서 곧게 아래로 뻗는 가는 원뿔(바깥은 primary 밝은 단계, 속은 흰색 심지). 반지름은 H 비, 심지 길이는 바깥의 비
const FLAME_RADIUS = 0.17;
const CORE_RADIUS = 0.08;
const CORE_LENGTH = 0.7;
// 정점 알파는 밑에서 이 값이고 꼭짓점에서 0이라 끝이 빛처럼 스러진다
const FLAME_ALPHA = 0.9;
// 캔버스가 덮는 범위(H 비): 가로는 꼬리날개 바깥으로 이만큼 더, 위로는 단추 위로 이만큼
const REACH_X = 0.4;
const REACH_UP = 0.3;
const FOV = 40;
// devicePixelRatio는 2로 묶는다: 3 이상 화면에서 픽셀 수만 (9/4배) 늘고 가는 불꽃의 선명도 차이는 눈에 안 띈다
const MAX_DPR = 2;

const rad = (deg: number) => (deg * Math.PI) / 180;

export interface WingPose {
  /** 꼬리날개를 단추 뒤로 접은 각(rad). 0이면 다 펴졌고 snap이 넘치면 조금 음수다 */
  fold: number;
  /** 분사구가 단추 밑면에서 내려온 거리(px) */
  nozzleDrop: number;
  /** 불꽃 길이(px). 0이면 꺼졌다 */
  flameLength: number;
}

/** 박자 값 하나를 로켓 자세로 바꾼다. 왼쪽 꼬리날개는 같은 자세를 거울 장면에 건다(buildWingRig) */
export const wingPose = (input: WingInput, height: number): WingPose => ({
  fold: rad(FOLD_DEG) * (1 - input.fins),
  nozzleDrop: NOZZLE_RATIO * height * input.fins,
  flameLength: Math.max(input.flame, 0) * FLAME_RATIO * height,
});

export interface WingColors {
  /** 꼬리날개 (단추와 같은 primary) */
  fin: Three.Color;
  /** 분사구 (primary의 어두운 단계) */
  nozzle: Three.Color;
  /** 불꽃 바깥 (primary의 밝은 단계) */
  flame: Three.Color;
  /** 불꽃 심지 (흰색 토큰) */
  core: Three.Color;
}

export interface WingRig {
  scene: Three.Scene;
  camera: Three.PerspectiveCamera;
  /** [왼쪽, 오른쪽] 꼬리날개의 경첩(접힘이 걸리는 묶음). 부모가 위치와 거울(왼쪽)을 맡는다 */
  fins: readonly [Three.Group, Three.Group];
  /** [왼쪽, 오른쪽] 분사구 묶음. 원점이 분사구 끝이고 내려온 만큼 내려가며 그 끝에서 불꽃이 아래로 뻗는다 */
  jets: readonly [Three.Group, Three.Group];
  /** 분사구마다 불꽃 원뿔 [바깥, 심지]. 길이를 y 배율로 건다 */
  flames: readonly (readonly [Three.Mesh, Three.Mesh])[];
  /** 캔버스 CSS 크기(px)와 단추 중심에서 캔버스 위·아래 가장자리까지의 거리 */
  size: { width: number; height: number; up: number; down: number };
  apply(input: WingInput): void;
  dispose(): void;
}

// 뿌리가 원점(경첩 선)이고 끝이 +x 바깥 아래인 삼각형을 얇게 민 입체
const finGeometry = (three: ThreeModule, height: number) => {
  const shape = new three.Shape();
  shape.moveTo(0, FIN_ROOT_TOP * height);
  shape.lineTo(0, FIN_ROOT_BOTTOM * height);
  shape.lineTo(FIN_TIP.x * height, FIN_TIP.y * height);
  shape.closePath();
  const geometry = new three.ExtrudeGeometry(shape, {
    depth: FIN_THICKNESS * height,
    bevelEnabled: true,
    bevelThickness: FIN_BEVEL * height,
    bevelSize: FIN_BEVEL * height,
    bevelSegments: 2,
  });
  geometry.translate(0, 0, (-FIN_THICKNESS * height) / 2);
  return geometry;
};

// 분사구 끝이 원점(y=0)이고 몸통이 위(+y)로 선 종 모양
const nozzleGeometry = (three: ThreeModule, height: number) => {
  const body = NOZZLE_RATIO * NOZZLE_OVERLAP * height;
  const geometry = new three.CylinderGeometry(
    NOZZLE_RADIUS * NOZZLE_TOP * height,
    NOZZLE_RADIUS * height,
    body,
    24
  );
  geometry.translate(0, body / 2, 0);
  return geometry;
};

// 밑면(분사구 쪽)이 원점이고 꼭짓점이 아래(y=-1)인 길이 1의 원뿔
const flameGeometry = (
  three: ThreeModule,
  radius: number,
  color: Three.Color
) => {
  const geometry = new three.ConeGeometry(radius, 1, 24, 1, true);
  geometry.rotateX(Math.PI);
  geometry.translate(0, -0.5, 0);
  const position = geometry.getAttribute('position');
  const rgba = new Float32Array(position.count * 4);
  for (let i = 0; i < position.count; i++) {
    rgba.set(
      [color.r, color.g, color.b, FLAME_ALPHA * (1 + position.getY(i))],
      i * 4
    );
  }
  geometry.setAttribute('color', new three.BufferAttribute(rgba, 4));
  return geometry;
};

/**
 * 장면을 만든다(렌더러 없음). 단추 중심이 원점이고 1 단위가 CSS 1px인 z=0 평면을 원근 카메라가 정면으로 본다.
 * 왼쪽 꼬리날개는 오른쪽 날개 어깨에 x배율 -1을 건 거울이라 같은 자세를 그대로 받는다.
 */
export const buildWingRig = (
  three: ThreeModule,
  { width, height }: Pick<RocketGeometry, 'width' | 'height'>,
  colors: WingColors
): WingRig => {
  // 위로는 꼬리날개 위까지, 아래로는 불꽃이 가장 길 때(꼬리날개 끝보다 더 아래다) 끝까지 덮는다
  const up = height * (0.5 + REACH_UP);
  const down = height * (0.5 + NOZZLE_RATIO + FLAME_RATIO * FLAME_PEAK);
  const size = {
    width: width + 2 * height * (FIN_TIP.x + REACH_X),
    height: up + down,
    up,
    down,
  };
  const scene = new three.Scene();
  const camera = new three.PerspectiveCamera(FOV, size.width / size.height);
  // z=0 평면에서 1 단위가 1px가 되는 거리. 캔버스가 단추 중심에서 아래로 치우쳐 카메라도 그만큼 내린다
  camera.position.set(
    0,
    (up - down) / 2,
    size.height / 2 / Math.tan(rad(FOV / 2))
  );
  camera.far = camera.position.z + height * 4;
  camera.updateProjectionMatrix();

  // 왼쪽 위에서 오는 방향광 하나와 약한 주변광. 세기는 물리 기준(albedo/π)이라 방향광 2 + 주변광 1.8이 정면에서 거의 1이다
  const white = new three.Color().setScalar(1);
  const sun = new three.DirectionalLight(white, 2);
  sun.position.set(-0.6, 0.8, 1).multiplyScalar(height * 10);
  scene.add(sun, new three.AmbientLight(white, 1.8));

  const geometries = [
    finGeometry(three, height),
    nozzleGeometry(three, height),
    flameGeometry(three, FLAME_RADIUS * height, colors.flame),
    flameGeometry(three, CORE_RADIUS * height, colors.core),
  ];
  const matte = (color: Three.Color) =>
    new three.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0 });
  // 불꽃은 빛을 더하는 합성이라 겹친 곳이 밝아지고 가장자리는 알파로 스러진다
  const glow = () =>
    new three.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      blending: three.AdditiveBlending,
      depthWrite: false,
    });
  const materials = [matte(colors.fin), matte(colors.nozzle), glow(), glow()];

  const shoulders: Three.Group[] = [];
  const hinges = [-1, 1].map((side) => {
    const shoulder = new three.Group();
    shoulder.position.set(
      side * (width / 2 - FIN_TUCK * height),
      FIN_HINGE_Y * height,
      0
    );
    shoulder.scale.x = side;
    const hinge = new three.Group();
    const fin = new three.Mesh(geometries[0], materials[0]);
    fin.rotation.x = FIN_PITCH;
    hinge.add(fin);
    shoulder.add(hinge);
    scene.add(shoulder);
    shoulders.push(shoulder);
    return hinge;
  }) as unknown as WingRig['fins'];

  const flames: [Three.Mesh, Three.Mesh][] = [];
  const jets = [-1, 1].map((side) => {
    const jet = new three.Group();
    jet.position.x = side * width * NOZZLE_X;
    const flame: [Three.Mesh, Three.Mesh] = [
      new three.Mesh(geometries[2], materials[2]),
      new three.Mesh(geometries[3], materials[3]),
    ];
    flames.push(flame);
    jet.add(new three.Mesh(geometries[1], materials[1]), ...flame);
    scene.add(jet);
    return jet;
  }) as unknown as WingRig['jets'];

  return {
    scene,
    camera,
    fins: hinges,
    jets,
    flames,
    size,
    apply(input) {
      const pose = wingPose(input, height);
      // 펴지기 전(fins 0)에는 단추 뒤에 접혀 있으니 아예 그리지 않는다
      const shown = input.fins > 0.001;
      hinges.forEach((hinge) => (hinge.rotation.y = pose.fold));
      shoulders.forEach((shoulder) => (shoulder.visible = shown));
      jets.forEach((jet) => {
        jet.visible = shown;
        jet.position.y = -height / 2 - pose.nozzleDrop;
      });
      const lit = pose.flameLength > 0.5;
      flames.forEach(([flame, flameCore]) => {
        flame.visible = lit;
        flameCore.visible = lit;
        flame.scale.y = pose.flameLength;
        flameCore.scale.y = pose.flameLength * CORE_LENGTH;
      });
    },
    dispose() {
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
    },
  };
};

/** 토큰 var()를 DOM에 풀어 computed style로 읽는다(색 리터럴을 코드에 두지 않는다) */
const readToken = (three: ThreeModule, parent: HTMLElement, token: string) => {
  const probe = document.createElement('span');
  probe.style.color = token;
  parent.append(probe);
  const channels = getComputedStyle(probe).color.match(/[\d.]+/g) ?? [];
  probe.remove();
  const [r = 255, g = 255, b = 255] = channels.slice(0, 3).map(Number);
  return new three.Color().setRGB(
    r / 255,
    g / 255,
    b / 255,
    three.SRGBColorSpace
  );
};

export interface WingScene {
  readonly canvas: HTMLCanvasElement;
  update(input: WingInput): void;
  render(): void;
  dispose(): void;
}

export interface WingSceneOptions extends Pick<
  RocketGeometry,
  'width' | 'height'
> {
  /** 토큰 색을 읽을 DOM(테마가 걸린 곳). 비행 레이어 안의 단추 상자다 */
  host: HTMLElement;
}

/**
 * 로켓 렌더러와 장면을 만든다. 컨텍스트를 못 만들면 던진다(부르는 쪽이 꼬리날개와 불꽃 없이 날아간다).
 * 연기와는 다른 WebGL 컨텍스트다: three가 GL 상태를 캐시해 한 컨텍스트를 나누면 서로 깬다.
 */
export const createWingScene = (
  three: ThreeModule,
  { host, width, height }: WingSceneOptions
): WingScene => {
  const renderer = new three.WebGLRenderer({ alpha: true, antialias: true });
  let rig: WingRig | undefined;
  let canvas: HTMLCanvasElement;
  // 중간에 하나라도 던지면 이미 만든 자원(컨텍스트 포함)을 놓고 던진다. 부르는 쪽이 로켓 없이 난다
  try {
    rig = buildWingRig(
      three,
      { width, height },
      {
        fin: readToken(three, host, themeContract.color.primary.main),
        nozzle: readToken(three, host, themeContract.palette.primary[900]),
        flame: readToken(three, host, themeContract.palette.primary[300]),
        core: readToken(three, host, themeContract.color.text.inverse),
      }
    );
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_DPR));
    renderer.setSize(rig.size.width, rig.size.height);
    // 첫 셰이더 컴파일을 미리 치른다. 안 그러면 꼬리날개가 처음 보이는 프레임(약 170ms)에 컴파일이 몰려 끊긴다.
    // 장면을 만든 직후에는 모두 보이는 상태라 재질이 컴파일 대상에 든다(숨김은 첫 update가 건다)
    renderer.compile(rig.scene, rig.camera);
    canvas = renderer.domElement;
    canvas.setAttribute('aria-hidden', 'true');
    // 단추 복제본 상자(단추 크기) 안에서 중심을 맞추고 아래로 치우친다
    Object.assign(canvas.style, {
      position: 'absolute',
      left: `${(width - rig.size.width) / 2}px`,
      top: `${height / 2 - rig.size.up}px`,
      pointerEvents: 'none',
    });
  } catch (error) {
    rig?.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    throw error;
  }
  const live = rig;
  let disposed = false;
  return {
    canvas,
    update: (input) => live.apply(input),
    render: () => {
      if (!disposed) renderer.render(live.scene, live.camera);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      live.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
};

// 로켓 장면을 만드는 함수의 이음매. jsdom에는 WebGL이 없어 렌더러가 늘 던지므로, 연결(언제 만들고 언제 놓는지)을
// 목 없이 시험하려면 기록하는 손을 끼울 수 있어야 한다(smokeEngine·loadThree와 같은 모양).
let create = createWingScene;

export const makeWingScene = (three: ThreeModule, options: WingSceneOptions) =>
  create(three, options);

/** 시험이 장면 만드는 함수를 갈아 끼운다. 인자 없이 부르면 원래대로 */
export const replaceWingSceneFactory = (factory = createWingScene) => {
  create = factory;
};
