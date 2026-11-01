import type * as Three from 'three';
import { themeContract } from '../../tokens/theme.css';
import {
  WING_DOWN,
  WING_RATIO,
  WING_UP,
  type WingBeat,
  type WingGeometry,
} from './wingBeat';

// 3D 날개 장면(M7.1 T8). three 모듈은 인자로 받는다(값 import 금지: 첫 화면 번들에 three가 실리지 않게 loadThree가 따로 불러온다).
// 박자 함수(wingBeat)의 결과를 자세로 바꾸는 순수 함수(wingPose), 그 자세를 걸 장면(buildWingRig, WebGL 없이 만들어진다),
// 렌더러까지 묶은 createWingScene으로 나뉜다. 렌더러만 WebGL이 있어야 한다.

type ThreeModule = typeof Three;

/** 날개 한 벌이 박자 하나에서 받는 입력 */
export type WingInput = Pick<WingBeat, 'wingAngle' | 'bud' | 'feathers'>;

// 깃 4개: 길이는 날개 길이(L)에 대한 비, 펼친 각도(도, 날개 축 기준)는 위에서 아래로 처지며 갈라진다
const FEATHER_LENGTH = [0.62, 0.78, 0.9, 1] as const;
const SPREAD_DEG = [16, 2, -12, -26] as const;
// 접힌 깃은 모두 이 각도로 위에 포개진다. 펼치면 위 각도들로 내려오고, snap이 넘치면 조금 더 내려갔다 돌아온다
const FOLD_DEG = 60;
// 깃이 펼치기 전 길이/너비 비
const FOLD_SCALE = 0.4;
// 날갯짓에 따라 날개를 세로축으로 돌린다: 위 끝에서는 끝이 화면 안쪽으로, 아래 끝에서는 앞으로 나온다(원근이 바뀌는 축)
const YAW_UP_DEG = 26;
const YAW_DOWN_DEG = -20;
// 깃 사이의 깊이(날개 길이 L 비)와 깃마다의 앞뒤 기울기(rad). 안쪽(앞) 깃이 밝고 바깥(뒤) 깃은 그늘진다
const DEPTH_GAP = 0.05;
const PITCH_STEP = 0.1;
const SHADE_STEP = 0.08;
// 깃 두께와 모서리 둥글림(L 비)
const THICKNESS = 0.06;
const BEVEL = 0.018;
// 깃 끝 몇 퍼센트부터 연한 파랑으로 물드는지
const TIP_FROM = 0.72;
// 캔버스가 덮는 범위(날개 길이 L 비): 가로는 단추 양옆으로 L의 이 배수, 세로는 위아래로 L의 절반 이 배수
const REACH_X = 1.25;
const REACH_Y = 1.2;
const FOV = 40;
// devicePixelRatio는 2로 묶는다: 3 이상 화면에서 픽셀 수만 (9/4배) 늘고 흰 날개의 선명도 차이는 눈에 안 띈다
const MAX_DPR = 2;

const rad = (deg: number) => (deg * Math.PI) / 180;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export interface WingPose {
  /** 날개 전체 배율(봉오리). 0이면 안 보인다 */
  scale: number;
  /** 어깨 축(z)에서의 회전(rad). 양수가 위, 오른쪽 날개 기준 */
  roll: number;
  /** 세로축(y) 회전(rad). 양수는 끝이 화면 안쪽으로 */
  yaw: number;
  /** 깃마다 날개 축에 대한 각도(rad)와 배율 */
  feathers: readonly { angle: number; scale: number }[];
}

/** 박자 값 하나를 날개 자세로 바꾼다. 왼쪽 날개는 같은 자세를 거울 장면에 건다(buildWingRig) */
export const wingPose = (input: WingInput): WingPose => {
  const swing = (input.wingAngle - WING_DOWN) / (WING_UP - WING_DOWN);
  return {
    scale: input.bud,
    roll: rad(input.wingAngle),
    yaw: rad(lerp(YAW_DOWN_DEG, YAW_UP_DEG, swing)),
    feathers: input.feathers.map((open, i) => ({
      angle: rad(lerp(FOLD_DEG, SPREAD_DEG[i], open)),
      scale: lerp(FOLD_SCALE, 1, open),
    })),
  };
};

export interface WingColors {
  /** 깃 몸 (흰색에 가까운 토큰) */
  body: Three.Color;
  /** 깃 끝 (연한 파랑 토큰) */
  tip: Three.Color;
}

export interface WingRig {
  scene: Three.Scene;
  camera: Three.PerspectiveCamera;
  /** [왼쪽, 오른쪽] 날개의 어깨 묶음 */
  wings: readonly [Three.Group, Three.Group];
  /** 캔버스 CSS 크기(px) */
  size: { width: number; height: number };
  apply(input: WingInput): void;
  dispose(): void;
}

// 뿌리가 원점이고 끝이 +x인 잎 모양 깃을 얇게 민 입체. 끝쪽 정점 색을 연한 파랑으로 물들인다
const featherGeometry = (
  three: ThreeModule,
  length: number,
  thickness: number,
  bevel: number,
  colors: WingColors
) => {
  const half = length * 0.17;
  const shape = new three.Shape();
  shape.moveTo(0, -half * 0.5);
  shape.quadraticCurveTo(length * 0.5, -half * 1.15, length, 0);
  shape.quadraticCurveTo(length * 0.5, half * 1.05, 0, half * 0.5);
  shape.closePath();
  const geometry = new three.ExtrudeGeometry(shape, {
    depth: thickness,
    curveSegments: 14,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
  });
  geometry.translate(0, 0, -thickness / 2);
  const position = geometry.getAttribute('position');
  const paint = new three.Color();
  const rgb = new Float32Array(position.count * 3);
  for (let i = 0; i < position.count; i++) {
    const along = Math.min(
      Math.max((position.getX(i) / length - TIP_FROM) / (1 - TIP_FROM), 0),
      1
    );
    paint.copy(colors.body).lerp(colors.tip, along);
    rgb.set([paint.r, paint.g, paint.b], i * 3);
  }
  geometry.setAttribute('color', new three.BufferAttribute(rgb, 3));
  return geometry;
};

/**
 * 장면을 만든다(렌더러 없음). 단추 중심이 원점이고 1 단위가 CSS 1px인 z=0 평면을 원근 카메라가 정면으로 본다.
 * 왼쪽 날개는 오른쪽 날개 묶음에 x배율 -1을 건 거울이라 같은 자세를 그대로 받는다.
 */
export const buildWingRig = (
  three: ThreeModule,
  { width, height }: Pick<WingGeometry, 'width' | 'height'>,
  colors: WingColors
): WingRig => {
  const length = height * WING_RATIO;
  const size = {
    width: width + 2 * length * REACH_X,
    height: 2 * length * REACH_Y,
  };
  const scene = new three.Scene();
  const camera = new three.PerspectiveCamera(FOV, size.width / size.height);
  // z=0 평면에서 1 단위가 1px가 되는 거리
  camera.position.set(0, 0, size.height / 2 / Math.tan(rad(FOV / 2)));
  camera.far = camera.position.z + length * 4;
  camera.updateProjectionMatrix();

  // 왼쪽 위에서 오는 방향광 하나와 약한 주변광. 세기는 물리 기준(albedo/π)이라 방향광 2 + 주변광 1.8이 정면에서 거의 1이다
  const white = new three.Color().setScalar(1);
  const sun = new three.DirectionalLight(white, 2);
  sun.position.set(-0.6, 0.8, 1).multiplyScalar(length * 4);
  scene.add(sun, new three.AmbientLight(white, 1.8));

  const geometries = FEATHER_LENGTH.map((ratio) =>
    featherGeometry(
      three,
      length * ratio,
      length * THICKNESS,
      length * BEVEL,
      colors
    )
  );
  // 재질 색(곱해진다)이 바깥으로 갈수록 어두워 뒤 깃이 그늘진다
  const materials = FEATHER_LENGTH.map(
    (_, i) =>
      new three.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.92,
        metalness: 0,
        color: new three.Color().setScalar(1 - SHADE_STEP * i),
      })
  );

  const feathers: Three.Mesh[][] = [[], []];
  const wings = [-1, 1].map((side, s) => {
    const shoulder = new three.Group();
    shoulder.position.x = (side * width) / 2;
    shoulder.scale.x = side;
    const wing = new three.Group();
    shoulder.add(wing);
    geometries.forEach((geometry, i) => {
      const feather = new three.Mesh(geometry, materials[i]);
      feather.position.z = -i * length * DEPTH_GAP;
      feather.rotation.x = (i - 1.5) * PITCH_STEP;
      feathers[s].push(feather);
      wing.add(feather);
    });
    scene.add(shoulder);
    return shoulder;
  }) as unknown as WingRig['wings'];

  return {
    scene,
    camera,
    wings,
    size,
    apply(input) {
      const pose = wingPose(input);
      wings.forEach((shoulder, s) => {
        const wing = shoulder.children[0];
        // Euler XYZ는 z(어깨 회전)를 먼저, 그다음 y(세로축)를 건다
        wing.rotation.set(0, pose.yaw, pose.roll);
        wing.scale.setScalar(Math.max(pose.scale, 0));
        shoulder.visible = pose.scale > 0.001;
        feathers[s].forEach((feather, i) => {
          feather.rotation.z = pose.feathers[i].angle;
          feather.scale.set(pose.feathers[i].scale, pose.feathers[i].scale, 1);
        });
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
  WingGeometry,
  'width' | 'height'
> {
  /** 토큰 색을 읽을 DOM(테마가 걸린 곳). 비행 레이어 안의 단추 상자다 */
  host: HTMLElement;
}

/**
 * 날개 렌더러와 장면을 만든다. 컨텍스트를 못 만들면 던진다(부르는 쪽이 날개 없이 날아간다).
 * 연기와는 다른 WebGL 컨텍스트다: three가 GL 상태를 캐시해 한 컨텍스트를 나누면 서로 깬다.
 */
export const createWingScene = (
  three: ThreeModule,
  { host, width, height }: WingSceneOptions
): WingScene => {
  const renderer = new three.WebGLRenderer({ alpha: true, antialias: true });
  let rig: WingRig | undefined;
  let canvas: HTMLCanvasElement;
  // 중간에 하나라도 던지면 이미 만든 자원(컨텍스트 포함)을 놓고 던진다. 부르는 쪽이 날개 없이 난다
  try {
    rig = buildWingRig(
      three,
      { width, height },
      {
        body: readToken(three, host, themeContract.palette.gray[50]),
        tip: readToken(three, host, themeContract.palette.primary[200]),
      }
    );
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_DPR));
    renderer.setSize(rig.size.width, rig.size.height);
    // 첫 셰이더 컴파일을 미리 치른다. 안 그러면 봉오리가 처음 보이는 프레임(약 150ms)에 컴파일이 몰려 끊긴다.
    // 장면을 만든 직후에는 날개가 모두 보이는 상태라 재질이 컴파일 대상에 든다(숨김은 첫 update가 건다)
    renderer.compile(rig.scene, rig.camera);
    canvas = renderer.domElement;
    canvas.setAttribute('aria-hidden', 'true');
    Object.assign(canvas.style, {
      position: 'absolute',
      left: `${(width - rig.size.width) / 2}px`,
      top: `${(height - rig.size.height) / 2}px`,
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

// 날개 장면을 만드는 함수의 이음매. jsdom에는 WebGL이 없어 렌더러가 늘 던지므로, 연결(언제 만들고 언제 놓는지)을
// 목 없이 시험하려면 기록하는 손을 끼울 수 있어야 한다(smokeEngine·loadThree와 같은 모양).
let create = createWingScene;

export const makeWingScene = (three: ThreeModule, options: WingSceneOptions) =>
  create(three, options);

/** 시험이 장면 만드는 함수를 갈아 끼운다. 인자 없이 부르면 원래대로 */
export const replaceWingSceneFactory = (factory = createWingScene) => {
  create = factory;
};
