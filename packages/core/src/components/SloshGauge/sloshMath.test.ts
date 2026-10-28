import { describe, it, expect } from 'vitest';
import {
  GAIN,
  MAX_AMP,
  VIEW_H,
  VIEW_W,
  addKick,
  sloshKick,
  surfacePath,
  surfaceY,
} from './sloshMath';

// path 문자열에서 수면 꼭짓점의 y만 뽑는다(M, L 명령. 마지막 둘은 바닥 모서리라 뺀다)
const surfaceYs = (d: string) => {
  const ys = [...d.matchAll(/[ML]([\d.-]+) ([\d.-]+)/g)].map((m) =>
    Number(m[2])
  );
  return ys;
};

describe('sloshKick', () => {
  it('바뀐 양에 비례한다(부호는 바뀐 방향)', () => {
    expect(sloshKick(0.1)).toBeCloseTo(0.1 * GAIN);
    expect(sloshKick(0.2)).toBeCloseTo(2 * sloshKick(0.1));
    expect(sloshKick(-0.1)).toBeCloseTo(-0.1 * GAIN);
  });

  it('상한에서 잘린다', () => {
    expect(sloshKick(1)).toBe(MAX_AMP);
    expect(sloshKick(-1)).toBe(-MAX_AMP);
  });

  it('상한은 통 높이의 8%다', () => {
    expect(MAX_AMP).toBe(0.08);
  });
});

describe('addKick', () => {
  it('잔잔한 상태에서는 킥이 그대로 첫 쏠림이 된다(오르면 phi 0, 내리면 phi π)', () => {
    expect(addKick({ amp: 0, phi: 0 }, 0.05)).toEqual({ amp: 0.05, phi: 0 });
    const down = addKick({ amp: 0, phi: 0 }, -0.05);
    expect(down.amp).toBeCloseTo(0.05);
    expect(Math.cos(down.phi)).toBeCloseTo(-1);
  });

  it('진행 중이던 쏠림에 킥을 더한다(쏠림 값이 이어진다)', () => {
    const before = { amp: 0.04, phi: 1 };
    const after = addKick(before, 0.02);
    expect(after.amp * Math.cos(after.phi)).toBeCloseTo(
      before.amp * Math.cos(before.phi) + 0.02
    );
    expect(after.amp * Math.sin(after.phi)).toBeCloseTo(
      before.amp * Math.sin(before.phi)
    );
  });

  it('쌓여도 상한을 넘지 않는다', () => {
    let s = { amp: 0, phi: 0 };
    for (let i = 0; i < 20; i += 1) s = addKick(s, MAX_AMP);
    expect(s.amp).toBeCloseTo(MAX_AMP);
    expect(s.amp).toBeLessThanOrEqual(MAX_AMP);
  });
});

describe('surfaceY / surfacePath', () => {
  it('진폭 0이면 수면은 수위 높이에서 평평하다', () => {
    for (const x of [0, 25, 50, 80, 100]) {
      expect(surfaceY(x, 0.25, 0, 1.3, 2.2)).toBeCloseTo(VIEW_H * 0.75);
    }
    const ys = surfaceYs(surfacePath(0.25, 0, 0, 0));
    expect(new Set(ys.slice(0, -2)).size).toBe(1);
  });

  it('진폭이 있으면 수면 꼭짓점 높이가 서로 다르다', () => {
    const ys = surfaceYs(surfacePath(0.5, MAX_AMP, 0, 0));
    expect(new Set(ys.slice(0, -2)).size).toBeGreaterThan(1);
  });

  it('출렁임은 수위에서 통 높이 x 진폭을 넘지 않는다', () => {
    for (let phi = 0; phi < 6.3; phi += 0.4) {
      for (let x = 0; x <= VIEW_W; x += 5) {
        const dev = Math.abs(
          surfaceY(x, 0.5, MAX_AMP, phi, phi * 2) - VIEW_H / 2
        );
        expect(dev).toBeLessThanOrEqual(VIEW_H * MAX_AMP + 1e-9);
      }
    }
  });

  it('phi 0에서는 왼쪽이 높고(y가 작다) π에서는 오른쪽이 높다', () => {
    expect(surfaceY(0, 0.5, 0.05, 0, 0)).toBeLessThan(
      surfaceY(VIEW_W, 0.5, 0.05, 0, 0)
    );
    expect(surfaceY(0, 0.5, 0.05, Math.PI, 0)).toBeGreaterThan(
      surfaceY(VIEW_W, 0.5, 0.05, Math.PI, 0)
    );
  });

  it('flow가 바뀌면 물결이 옮겨 간다', () => {
    expect(surfaceY(30, 0.5, 0.05, 0, 0)).not.toBeCloseTo(
      surfaceY(30, 0.5, 0.05, 0, 1)
    );
  });
});
