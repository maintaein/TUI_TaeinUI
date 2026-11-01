import { describe, expect, it } from 'vitest';
import {
  FLAME_PEAK,
  FLAME_RATIO,
  NOZZLE_RATIO,
  NOZZLE_X,
  rocketBeat,
} from './rocketBeat';
import {
  buildWingRig,
  createWingScene,
  wingPose,
  type WingColors,
} from './wingScene';
import type { ThreeModule } from './loadThree';

// WebGL 없이 장면 그래프만 만든다(렌더러는 e2e가 Chromium에서 본다). 진짜 three를 쓴다
const three = (await import('three')) as ThreeModule;
const GEOMETRY = { width: 120, height: 44, distance: 400 };
const colors: WingColors = {
  fin: new three.Color(0.1, 0.4, 0.8),
  nozzle: new three.Color(0.05, 0.25, 0.6),
  flame: new three.Color(0.4, 0.7, 1),
  core: new three.Color(0.9, 0.95, 1),
};
const deg = (rad: number) => (rad * 180) / Math.PI;
const OPEN = { fins: 1, flame: 1 } as const;
const FOLDED = { fins: 0, flame: 0 } as const;

describe('wingPose: 박자 값 -> 로켓 자세', () => {
  it('꼬리날개는 fins 0이면 단추 뒤로 90도 접혀 있고 1이면 펴지며 snap의 넘침은 조금 더 펴진 쪽이다', () => {
    expect(deg(wingPose(FOLDED, 44).fold)).toBeCloseTo(90);
    expect(wingPose(OPEN, 44).fold).toBeCloseTo(0);
    expect(deg(wingPose({ fins: 0.5, flame: 0 }, 44).fold)).toBeCloseTo(45);
    expect(wingPose({ fins: 1.1, flame: 0 }, 44).fold).toBeLessThan(0);
  });

  it('분사구는 fins에 따라 단추 밑면에서 내려와 1이면 분사구 길이만큼 내려와 있다', () => {
    expect(wingPose(FOLDED, 44).nozzleDrop).toBe(0);
    expect(wingPose(OPEN, 44).nozzleDrop).toBeCloseTo(NOZZLE_RATIO * 44);
    expect(wingPose({ fins: 0.5, flame: 0 }, 100).nozzleDrop).toBeCloseTo(
      NOZZLE_RATIO * 50
    );
  });

  it('불꽃 길이는 박자 값의 배수에 기본 길이(단추 높이의 FLAME_RATIO배)를 곱한 px이고 꺼지면 0이다', () => {
    expect(wingPose({ fins: 1, flame: 0 }, 44).flameLength).toBe(0);
    expect(wingPose({ fins: 1, flame: 1 }, 44).flameLength).toBeCloseTo(
      FLAME_RATIO * 44
    );
    expect(wingPose({ fins: 1, flame: 2 }, 44).flameLength).toBeCloseTo(
      2 * FLAME_RATIO * 44
    );
    expect(wingPose({ fins: 1, flame: -0.1 }, 44).flameLength).toBe(0);
  });

  it('rocketBeat의 출력을 그대로 받는다: 점화 전에는 꺼져 있고 발사 끝에는 가장 길다', () => {
    const early = wingPose(rocketBeat(100, GEOMETRY), GEOMETRY.height);
    const hover = wingPose(rocketBeat(1500, GEOMETRY), GEOMETRY.height);
    const late = wingPose(rocketBeat(3040, GEOMETRY), GEOMETRY.height);
    expect(early.flameLength).toBe(0);
    expect(hover.fold).toBeCloseTo(0);
    expect(hover.flameLength).toBeGreaterThan(0);
    expect(late.flameLength).toBeGreaterThan(hover.flameLength * 1.8);
  });
});

describe('buildWingRig: 장면', () => {
  const tipOf = (rig: ReturnType<typeof buildWingRig>, side: 0 | 1) => {
    rig.scene.updateMatrixWorld(true);
    const fin = rig.fins[side].children[0] as import('three').Mesh;
    fin.geometry.computeBoundingBox();
    const box = fin.geometry.boundingBox as import('three').Box3;
    // 꼬리날개의 바깥 아래 꼭짓점(삼각형의 끝)
    return fin.localToWorld(new three.Vector3(box.max.x, box.min.y, 0));
  };

  it('꼬리날개 둘이 단추 양옆에 서고 왼쪽은 오른쪽의 거울이다', () => {
    const rig = buildWingRig(three, GEOMETRY, colors);
    const [leftHinge, rightHinge] = rig.fins;
    // 단추 옆면(+-폭/2)에 닿게 조금 안쪽으로 박힌다
    expect((rightHinge.parent as import('three').Group).position.x).toBeCloseTo(
      60 - 0.04 * 44
    );
    expect(-(leftHinge.parent as import('three').Group).position.x).toBeCloseTo(
      (rightHinge.parent as import('three').Group).position.x
    );
    for (const input of [OPEN, { fins: 0.4, flame: 0 }]) {
      rig.apply(input);
      const left = tipOf(rig, 0);
      const right = tipOf(rig, 1);
      expect(left.x).toBeCloseTo(-right.x, 4);
      expect(left.y).toBeCloseTo(right.y, 4);
      expect(left.z).toBeCloseTo(right.z, 4);
    }
    // 다 펴지면 끝이 단추 바깥으로 뻗고 밑면보다 아래로 젖혀진다(뒤로 젖힌 삼각)
    rig.apply(OPEN);
    expect(tipOf(rig, 1).x).toBeGreaterThan(60 + 20);
    expect(tipOf(rig, 1).y).toBeLessThan(-22);
    rig.dispose();
  });

  it('접히면 꼬리날개가 단추 뒤(깊이 쪽)로 들어가고 펴지면 z=0 둘레로 나온다', () => {
    const rig = buildWingRig(three, GEOMETRY, colors);
    rig.apply({ fins: 0.2, flame: 0 });
    const folded = tipOf(rig, 1);
    rig.apply(OPEN);
    const open = tipOf(rig, 1);
    // 접힌 끝은 뒤(z가 음수)로 멀리 가 있고 x 폭이 줄어 단추 옆면에 모인다
    expect(folded.z).toBeLessThan(open.z - 15);
    expect(folded.x).toBeLessThan(open.x - 15);
    // 펴진 끝은 단추 두께의 절반(깊이 한쪽)을 벗어나지 않는다
    expect(Math.abs(open.z)).toBeLessThan(15);
    rig.dispose();
  });

  it('fins가 0이면 꼬리날개와 분사구는 그려지지 않고 조금이라도 펴지면 보인다', () => {
    const rig = buildWingRig(three, GEOMETRY, colors);
    rig.apply(FOLDED);
    expect(
      rig.fins.map((h) => (h.parent as import('three').Group).visible)
    ).toEqual([false, false]);
    expect(rig.jets.map((j) => j.visible)).toEqual([false, false]);
    rig.apply({ fins: 0.3, flame: 0 });
    expect(
      rig.fins.map((h) => (h.parent as import('three').Group).visible)
    ).toEqual([true, true]);
    expect(rig.jets.map((j) => j.visible)).toEqual([true, true]);
    rig.dispose();
  });

  it('분사구 둘은 폭의 1/3, 2/3 자리에서 fins에 따라 단추 밑면 아래로 내려온다', () => {
    const rig = buildWingRig(three, GEOMETRY, colors);
    expect(rig.jets[0].position.x).toBeCloseTo(-GEOMETRY.width * NOZZLE_X);
    expect(rig.jets[1].position.x).toBeCloseTo(GEOMETRY.width * NOZZLE_X);
    expect(NOZZLE_X * GEOMETRY.width * 3).toBeCloseTo(GEOMETRY.width / 2);
    rig.apply({ fins: 0.01, flame: 0 });
    const hidden = rig.jets[1].position.y;
    rig.apply(OPEN);
    // 다 내려오면 분사구 끝이 단추 밑면(-높이/2)에서 분사구 길이만큼 아래다
    expect(rig.jets[1].position.y).toBeCloseTo(
      -GEOMETRY.height / 2 - NOZZLE_RATIO * GEOMETRY.height
    );
    expect(rig.jets[1].position.y).toBeLessThan(hidden);
    // 내려오기 전에는 분사구가 밑면 위(단추 뒤)에 있다
    expect(hidden).toBeGreaterThan(-GEOMETRY.height / 2 - 1);
    rig.dispose();
  });

  it('불꽃은 분사구 끝에서 아래로 곧게 뻗고 길이는 박자 값을 따르며 꺼지면 숨는다', () => {
    const rig = buildWingRig(three, GEOMETRY, colors);
    rig.apply({ fins: 1, flame: 1 });
    const [outer, core] = rig.flames[1];
    expect(outer.visible).toBe(true);
    expect(outer.scale.y).toBeCloseTo(FLAME_RATIO * GEOMETRY.height);
    // 심지는 바깥보다 짧다
    expect(core.scale.y).toBeLessThan(outer.scale.y);
    // 밑면이 분사구 끝(원점)이고 꼭짓점이 아래(-y)다
    outer.geometry.computeBoundingBox();
    const box = outer.geometry.boundingBox as import('three').Box3;
    expect(box.max.y).toBeCloseTo(0);
    expect(box.min.y).toBeCloseTo(-1);
    // 분사구 묶음 안에 있어 분사구가 내려오면 불꽃도 따라 내려온다
    expect(outer.parent).toBe(rig.jets[1]);
    rig.apply({ fins: 1, flame: 2 });
    expect(outer.scale.y).toBeCloseTo(2 * FLAME_RATIO * GEOMETRY.height);
    rig.apply({ fins: 1, flame: 0 });
    expect(rig.flames.flat().map((m) => m.visible)).toEqual([
      false,
      false,
      false,
      false,
    ]);
    rig.dispose();
  });

  it('캔버스는 가장 긴 불꽃의 끝까지 덮는다', () => {
    const rig = buildWingRig(three, GEOMETRY, colors);
    const nozzleTip = GEOMETRY.height * (0.5 + NOZZLE_RATIO);
    expect(rig.size.down).toBeGreaterThanOrEqual(
      nozzleTip + FLAME_PEAK * FLAME_RATIO * GEOMETRY.height - 1e-9
    );
    expect(rig.size.height).toBeCloseTo(rig.size.up + rig.size.down);
    rig.dispose();
  });

  it('꼬리날개와 분사구는 primary 무광이고 불꽃은 빛을 더하는 합성이며 끝으로 갈수록 투명해진다', () => {
    const rig = buildWingRig(three, GEOMETRY, colors);
    const fin = rig.fins[1].children[0] as import('three').Mesh;
    const finMaterial = fin.material as import('three').MeshStandardMaterial;
    expect(finMaterial.metalness).toBe(0);
    expect(finMaterial.roughness).toBeGreaterThan(0.8);
    expect(finMaterial.color.equals(colors.fin)).toBe(true);
    // 분사구는 더 어두운 단계
    const nozzle = rig.jets[1].children[0] as import('three').Mesh;
    expect(
      (nozzle.material as import('three').MeshStandardMaterial).color.equals(
        colors.nozzle
      )
    ).toBe(true);
    // 불꽃 바깥(밝은 단계)과 심지(흰색)가 둘 다 더하는 합성
    const [outer, core] = rig.flames[1];
    for (const flame of [outer, core]) {
      const material = flame.material as import('three').MeshBasicMaterial;
      expect(material.blending).toBe(three.AdditiveBlending);
      expect(material.transparent).toBe(true);
      expect(material.depthWrite).toBe(false);
      const position = flame.geometry.getAttribute('position');
      const color = flame.geometry.getAttribute('color');
      expect(color.itemSize).toBe(4);
      let tip = -1;
      let base = -1;
      for (let i = 0; i < position.count; i++) {
        if (position.getY(i) < -0.99 && tip < 0) tip = i;
        if (position.getY(i) > -0.01 && base < 0) base = i;
      }
      expect(color.getW(tip)).toBeCloseTo(0, 5);
      expect(color.getW(base)).toBeGreaterThan(0.8);
    }
    const outerColor = outer.geometry.getAttribute('color');
    expect(outerColor.getX(0)).toBeCloseTo(colors.flame.r, 5);
    const coreColor = core.geometry.getAttribute('color');
    // 심지 색은 호출자가 준 흰색 토큰이다(코드에 흰색을 박지 않는다)
    expect(coreColor.getX(0)).toBeCloseTo(colors.core.r, 5);
    expect(coreColor.getY(0)).toBeCloseTo(colors.core.g, 5);
    expect(coreColor.getZ(0)).toBeCloseTo(colors.core.b, 5);
    rig.dispose();
  });

  it('빛은 왼쪽 위에서 오는 방향광 하나와 주변광이다', () => {
    const rig = buildWingRig(three, GEOMETRY, colors);
    const suns: import('three').DirectionalLight[] = [];
    const ambient: import('three').AmbientLight[] = [];
    rig.scene.traverse((o) => {
      if ((o as import('three').DirectionalLight).isDirectionalLight)
        suns.push(o as import('three').DirectionalLight);
      if ((o as import('three').AmbientLight).isAmbientLight)
        ambient.push(o as import('three').AmbientLight);
    });
    expect(suns).toHaveLength(1);
    expect(ambient).toHaveLength(1);
    expect(suns[0].position.x).toBeLessThan(0);
    expect(suns[0].position.y).toBeGreaterThan(0);
    expect(suns[0].position.z).toBeGreaterThan(0);
    expect(ambient[0].intensity).toBeLessThan(suns[0].intensity);
    rig.dispose();
  });

  it('원근 카메라가 z=0 평면을 1 단위 = 1px로 보고 캔버스가 아래로 치우친 만큼 카메라도 내려가 있다', () => {
    const rig = buildWingRig(three, GEOMETRY, colors);
    expect(rig.camera.isPerspectiveCamera).toBe(true);
    const visibleHeight =
      2 * rig.camera.position.z * Math.tan((rig.camera.fov * Math.PI) / 360);
    expect(visibleHeight).toBeCloseTo(rig.size.height, 4);
    expect(rig.camera.position.y).toBeCloseTo(
      (rig.size.up - rig.size.down) / 2
    );
    expect(rig.camera.position.y).toBeLessThan(0);
    rig.dispose();
  });

  it('dispose는 지오메트리와 재질을 모두 놓는다', () => {
    const rig = buildWingRig(three, GEOMETRY, colors);
    const disposed = { geometry: 0, material: 0 };
    const meshes: import('three').Mesh[] = [];
    rig.scene.traverse((o) => {
      if ((o as import('three').Mesh).isMesh)
        meshes.push(o as import('three').Mesh);
    });
    // 지오메트리와 재질은 꼬리날개 둘, 분사구 둘, 불꽃들이 나눠 쓴다: 한 번씩만 센다
    for (const geometry of new Set(meshes.map((m) => m.geometry)))
      geometry.addEventListener('dispose', () => (disposed.geometry += 1));
    for (const material of new Set(
      meshes.map((m) => m.material as import('three').Material)
    ))
      material.addEventListener('dispose', () => (disposed.material += 1));
    rig.dispose();
    expect(disposed).toEqual({ geometry: 4, material: 4 });
  });
});

// jsdom에는 WebGL이 없어 진짜 WebGLRenderer는 컨텍스트를 못 만들고 던진다. 렌더러 자리에만 호출을 기록하는 손을 끼우고
// 나머지(장면, 지오메트리, 재질)는 진짜 three를 쓴다. 컨텍스트를 놓는 두 호출(dispose, forceContextLoss)이 이어지는지 본다.
describe('createWingScene: 렌더러 수명', () => {
  const standIn = (failAt?: 'setSize' | 'compile') => {
    const calls: string[] = [];
    class Renderer {
      domElement = document.createElement('canvas');
      setPixelRatio() {
        calls.push('setPixelRatio');
      }
      setSize() {
        calls.push('setSize');
        if (failAt === 'setSize') throw new Error('setSize');
      }
      compile() {
        calls.push('compile');
        if (failAt === 'compile') throw new Error('compile');
      }
      render() {
        calls.push('render');
      }
      dispose() {
        calls.push('dispose');
      }
      forceContextLoss() {
        calls.push('forceContextLoss');
      }
    }
    const fake = {
      ...three,
      WebGLRenderer: Renderer,
    } as unknown as ThreeModule;
    return { fake, calls };
  };
  const options = () => ({ host: document.body, ...GEOMETRY });

  it('만들 때 첫 셰이더 컴파일을 한 번 미리 치르고 그린 것은 그 뒤다', () => {
    const { fake, calls } = standIn();
    const scene = createWingScene(fake, options());
    scene.update(OPEN);
    scene.render();
    expect(calls.filter((c) => c === 'compile')).toHaveLength(1);
    expect(calls.indexOf('compile')).toBeLessThan(calls.indexOf('render'));
    scene.dispose();
  });

  it('canvas는 단추 복제본 상자 안에서 가로 가운데, 단추 위쪽보다 위로 조금, 아래로는 불꽃 길이만큼 놓인다', () => {
    const { fake } = standIn();
    const scene = createWingScene(fake, options());
    const rig = buildWingRig(three, GEOMETRY, colors);
    expect(scene.canvas.style.left).toBe(
      `${(GEOMETRY.width - rig.size.width) / 2}px`
    );
    expect(scene.canvas.style.top).toBe(
      `${GEOMETRY.height / 2 - rig.size.up}px`
    );
    expect(scene.canvas.style.pointerEvents).toBe('none');
    expect(scene.canvas.getAttribute('aria-hidden')).toBe('true');
    rig.dispose();
    scene.dispose();
  });

  it('dispose는 렌더러 dispose와 컨텍스트 강제 해제를 한 번씩만 부르고 canvas를 뗀다', () => {
    const { fake, calls } = standIn();
    const scene = createWingScene(fake, options());
    document.body.append(scene.canvas);
    scene.dispose();
    scene.dispose();
    expect(calls.filter((c) => c === 'dispose')).toHaveLength(1);
    expect(calls.filter((c) => c === 'forceContextLoss')).toHaveLength(1);
    expect(scene.canvas.isConnected).toBe(false);
    // 놓은 뒤에는 그리지 않는다
    scene.render();
    expect(calls).not.toContain('render');
  });

  it.each(['setSize', 'compile'] as const)(
    '%s에서 던지면 이미 만든 렌더러(컨텍스트)와 지오메트리를 놓고 던진다',
    (failAt) => {
      const { fake, calls } = standIn(failAt);
      // 장면이 만드는 지오메트리(꼬리날개, 분사구, 불꽃 둘)를 만든 대로 세고 놓은 대로 센다
      let made = 0;
      let disposedGeometries = 0;
      const track = <
        T extends new (...args: never[]) => import('three').BufferGeometry,
      >(
        Base: T
      ) =>
        class extends Base {
          constructor(...args: ConstructorParameters<T>) {
            super(...args);
            made += 1;
            this.addEventListener('dispose', () => (disposedGeometries += 1));
          }
        };
      Object.assign(fake, {
        ExtrudeGeometry: track(fake.ExtrudeGeometry),
        CylinderGeometry: track(fake.CylinderGeometry),
        ConeGeometry: track(fake.ConeGeometry),
      });
      expect(() => createWingScene(fake, options())).toThrow(failAt);
      expect(calls).toContain('dispose');
      expect(calls).toContain('forceContextLoss');
      expect(made).toBe(4);
      expect(disposedGeometries).toBe(4);
    }
  );
});
