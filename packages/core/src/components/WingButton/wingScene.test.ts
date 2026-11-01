import { describe, expect, it } from 'vitest';
import { WING_DOWN, WING_RATIO, WING_UP, wingBeat } from './wingBeat';
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
  body: new three.Color(1, 1, 1),
  tip: new three.Color(0.2, 0.5, 1),
};
const deg = (rad: number) => (rad * 180) / Math.PI;
const OPEN = [1, 1, 1, 1] as const;
const FOLDED = [0, 0, 0, 0] as const;

describe('wingPose: 박자 값 -> 날개 자세', () => {
  it('날개각이 위 끝/아래 끝이면 어깨 회전이 그 각도이고 위 끝은 끝이 안쪽으로, 아래 끝은 앞으로 나온다', () => {
    const up = wingPose({ wingAngle: WING_UP, bud: 1, feathers: OPEN });
    const down = wingPose({ wingAngle: WING_DOWN, bud: 1, feathers: OPEN });
    expect(deg(up.roll)).toBeCloseTo(WING_UP);
    expect(deg(down.roll)).toBeCloseTo(WING_DOWN);
    // yaw 양수 = 끝이 화면 안쪽: 원근이 박자에 따라 달라지는 축
    expect(up.yaw).toBeGreaterThan(0);
    expect(down.yaw).toBeLessThan(0);
  });

  it('봉오리 0이면 배율 0, 1이면 1이고 snap의 넘침을 그대로 따른다', () => {
    const at = (bud: number) =>
      wingPose({ wingAngle: 0, bud, feathers: FOLDED }).scale;
    expect(at(0)).toBe(0);
    expect(at(1)).toBe(1);
    expect(at(1.09)).toBe(1.09);
  });

  it('깃 i가 0이면 모두 같은 접힌 각도로 포개지고 1이면 위에서 아래로 처지며 갈라진다', () => {
    const folded = wingPose({ wingAngle: 0, bud: 1, feathers: FOLDED });
    const open = wingPose({ wingAngle: 0, bud: 1, feathers: OPEN });
    expect(new Set(folded.feathers.map((f) => f.angle)).size).toBe(1);
    const angles = open.feathers.map((f) => f.angle);
    for (let i = 1; i < angles.length; i++)
      expect(angles[i]).toBeLessThan(angles[i - 1]);
    // 펼치면 접힌 각도보다 모두 아래다
    for (const angle of angles)
      expect(angle).toBeLessThan(folded.feathers[0].angle);
    // 접힌 깃은 펼친 깃보다 작다
    expect(folded.feathers[0].scale).toBeLessThan(open.feathers[0].scale);
    expect(open.feathers.every((f) => f.scale === 1)).toBe(true);
  });

  it('깃마다 따로 펼쳐진다: 안쪽 깃만 1이면 그 깃만 접힌 각도를 떠난다', () => {
    const pose = wingPose({ wingAngle: 0, bud: 1, feathers: [1, 0, 0, 0] });
    expect(pose.feathers[0].angle).not.toBe(pose.feathers[1].angle);
    expect(pose.feathers[1].angle).toBe(pose.feathers[2].angle);
    expect(pose.feathers[2].angle).toBe(pose.feathers[3].angle);
  });

  it('wingBeat의 출력을 그대로 받는다: 날갯짓이 박자표 구간 안에서 자세가 바뀐다', () => {
    const early = wingPose(wingBeat(100, GEOMETRY));
    const bottom = wingPose(wingBeat(950, GEOMETRY));
    expect(early.scale).toBe(0);
    expect(deg(bottom.roll)).toBeCloseTo(WING_DOWN);
    expect(bottom.scale).toBe(1);
  });
});

describe('buildWingRig: 장면', () => {
  const pose = { wingAngle: 20, bud: 1, feathers: OPEN };
  const tipOf = (rig: ReturnType<typeof buildWingRig>, side: 0 | 1) => {
    rig.scene.updateMatrixWorld(true);
    const feathers = rig.wings[side].children[0].children;
    const outer = feathers[feathers.length - 1] as import('three').Mesh;
    outer.geometry.computeBoundingBox();
    const box = outer.geometry.boundingBox as import('three').Box3;
    return outer.localToWorld(new three.Vector3(box.max.x, 0, 0));
  };

  it('날개 둘이 단추 양옆 가운데 높이에 서고 왼쪽은 오른쪽의 거울이다', () => {
    const rig = buildWingRig(three, GEOMETRY, colors);
    expect(rig.wings[0].position.x).toBe(-60);
    expect(rig.wings[1].position.x).toBe(60);
    expect(rig.wings[0].position.y).toBe(0);
    rig.apply(pose);
    const left = tipOf(rig, 0);
    const right = tipOf(rig, 1);
    expect(left.x).toBeCloseTo(-right.x, 4);
    expect(left.y).toBeCloseTo(right.y, 4);
    expect(left.z).toBeCloseTo(right.z, 4);
    // 날개각을 올리면 끝이 올라간다
    rig.apply({ ...pose, wingAngle: WING_UP });
    expect(tipOf(rig, 1).y).toBeGreaterThan(right.y);
    rig.dispose();
  });

  it('날개 길이는 단추 높이의 1.2배이고 바깥 깃이 가장 길다', () => {
    const rig = buildWingRig(three, GEOMETRY, colors);
    rig.apply({ wingAngle: 0, bud: 1, feathers: OPEN });
    // 아래로 펼쳐진 깃 각도를 빼고 길이만 재려고 각 깃의 기하 상자를 본다
    const lengths = rig.wings[1].children[0].children.map((feather) => {
      const mesh = feather as import('three').Mesh;
      mesh.geometry.computeBoundingBox();
      return (mesh.geometry.boundingBox as import('three').Box3).max.x;
    });
    expect(Math.max(...lengths)).toBeGreaterThan(44 * WING_RATIO);
    expect(Math.max(...lengths)).toBeLessThan(44 * WING_RATIO * 1.05);
    expect(lengths).toEqual([...lengths].sort((a, b) => a - b));
    rig.dispose();
  });

  it('깃이 층을 이룬다: 깊이가 서로 다르고 바깥 깃일수록 뒤이며 깃마다 두께가 있다(납작한 판이 아니다)', () => {
    const rig = buildWingRig(three, GEOMETRY, colors);
    const feathers = rig.wings[1].children[0]
      .children as import('three').Mesh[];
    const z = feathers.map((f) => f.position.z);
    expect(new Set(z).size).toBe(4);
    for (let i = 1; i < z.length; i++) expect(z[i]).toBeLessThan(z[i - 1]);
    for (const feather of feathers) {
      feather.geometry.computeBoundingBox();
      const box = feather.geometry.boundingBox as import('three').Box3;
      expect(box.max.z - box.min.z).toBeGreaterThan(1.5);
    }
    // 바깥 깃의 재질이 더 어둡다(뒤 깃은 그늘진다)
    const shade = feathers.map(
      (f) => (f.material as import('three').MeshStandardMaterial).color.r
    );
    for (let i = 1; i < shade.length; i++)
      expect(shade[i]).toBeLessThan(shade[i - 1]);
    rig.dispose();
  });

  it('재질은 무광 흰색 계열이고 금속성이 없으며 깃 끝만 파랗다(정점 색)', () => {
    const rig = buildWingRig(three, GEOMETRY, colors);
    const feather = rig.wings[1].children[0]
      .children[3] as import('three').Mesh;
    const material = feather.material as import('three').MeshStandardMaterial;
    expect(material.metalness).toBe(0);
    expect(material.roughness).toBeGreaterThan(0.8);
    const position = feather.geometry.getAttribute('position');
    const color = feather.geometry.getAttribute('color');
    feather.geometry.computeBoundingBox();
    const length = (feather.geometry.boundingBox as import('three').Box3).max.x;
    let root = -1;
    let tip = -1;
    for (let i = 0; i < position.count; i++) {
      if (position.getX(i) < length * 0.1 && root < 0) root = i;
      if (position.getX(i) > length * 0.98 && tip < 0) tip = i;
    }
    // 뿌리는 몸 색(흰색 그대로), 끝은 토큰 파랑(파랑 채널이 빨강보다 크다)
    expect(color.getX(root)).toBeCloseTo(colors.body.r, 4);
    expect(color.getZ(tip)).toBeGreaterThan(color.getX(tip) * 2);
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

  it('원근 카메라가 z=0 평면을 1 단위 = 1px로 본다', () => {
    const rig = buildWingRig(three, GEOMETRY, colors);
    expect(rig.camera.isPerspectiveCamera).toBe(true);
    const visibleHeight =
      2 * rig.camera.position.z * Math.tan((rig.camera.fov * Math.PI) / 360);
    expect(visibleHeight).toBeCloseTo(rig.size.height, 4);
    rig.dispose();
  });

  it('날갯짓에 따라 깊이가 바뀐다: 위 끝에서는 날개 끝이 안쪽(뒤), 아래 끝에서는 앞으로 나온다', () => {
    const rig = buildWingRig(three, GEOMETRY, colors);
    rig.apply({ wingAngle: WING_UP, bud: 1, feathers: OPEN });
    const up = tipOf(rig, 1).z;
    rig.apply({ wingAngle: WING_DOWN, bud: 1, feathers: OPEN });
    const down = tipOf(rig, 1).z;
    // 깃 층의 깊이 차이(8px 안팎)보다 훨씬 크게 앞뒤로 흔들린다
    expect(down - up).toBeGreaterThan(20);
    rig.dispose();
  });

  it('봉오리 0이면 날개가 보이지 않고 아주 작게라도 돋으면 보인다', () => {
    const rig = buildWingRig(three, GEOMETRY, colors);
    rig.apply({ wingAngle: 0, bud: 0, feathers: FOLDED });
    expect(rig.wings.map((w) => w.visible)).toEqual([false, false]);
    rig.apply({ wingAngle: 0, bud: 0.3, feathers: FOLDED });
    expect(rig.wings.map((w) => w.visible)).toEqual([true, true]);
    rig.dispose();
  });

  it('dispose는 지오메트리와 재질을 모두 놓는다', () => {
    const rig = buildWingRig(three, GEOMETRY, colors);
    const disposed = { geometry: 0, material: 0 };
    const feathers = rig.wings[1].children[0]
      .children as import('three').Mesh[];
    for (const f of feathers) {
      f.geometry.addEventListener('dispose', () => (disposed.geometry += 1));
      f.material.addEventListener('dispose', () => (disposed.material += 1));
    }
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
    scene.update({ wingAngle: 0, bud: 1, feathers: OPEN });
    scene.render();
    expect(calls.filter((c) => c === 'compile')).toHaveLength(1);
    expect(calls.indexOf('compile')).toBeLessThan(calls.indexOf('render'));
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
      const made: import('three').BufferGeometry[] = [];
      const real = fake.ExtrudeGeometry;
      let disposedGeometries = 0;
      (fake as { ExtrudeGeometry: unknown }).ExtrudeGeometry = class extends (
        real
      ) {
        constructor(...args: ConstructorParameters<typeof real>) {
          super(...args);
          made.push(this);
          this.addEventListener('dispose', () => (disposedGeometries += 1));
        }
      };
      expect(() => createWingScene(fake, options())).toThrow(failAt);
      expect(calls).toContain('dispose');
      expect(calls).toContain('forceContextLoss');
      expect(made).toHaveLength(4);
      expect(disposedGeometries).toBe(4);
    }
  );
});
