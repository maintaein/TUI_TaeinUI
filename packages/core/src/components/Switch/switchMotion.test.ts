import { describe, it, expect } from 'vitest';
import { ON_SCALE, STRETCH, thumbFrame } from './switchMotion';

describe('thumbFrame', () => {
  it('p 0과 1에서는 늘지 않고, 0.5에서 가장 길게 1.144배 늘어난다', () => {
    expect(thumbFrame(0, 1).k).toBe(1);
    expect(thumbFrame(1, 1).k).toBe(1);
    expect(thumbFrame(0.5, 1).k).toBeCloseTo(1.144, 10);
    expect(STRETCH).toBe(0.144);
  });

  it('늘임은 p = 0.5를 중심으로 좌우 대칭인 사인 종이다', () => {
    expect(thumbFrame(0.25, 1).k).toBeCloseTo(thumbFrame(0.75, 1).k, 10);
    expect(thumbFrame(0.25, 1).k).toBeGreaterThan(1);
    expect(thumbFrame(0.25, 1).k).toBeLessThan(thumbFrame(0.5, 1).k);
  });

  it('가로는 base x k, 세로는 base / k이고 곱은 항상 base 제곱(부피 보존)이다', () => {
    for (const base of [1, ON_SCALE.md]) {
      for (const p of [0, 0.1, 0.5, 0.9, 1]) {
        const { scaleX, scaleY, k } = thumbFrame(p, base);
        expect(scaleX).toBeCloseTo(base * k, 12);
        expect(scaleY).toBeCloseTo(base / k, 12);
        expect(scaleX * scaleY).toBeCloseTo(base * base, 12);
      }
    }
  });

  it('p 1에서 가로·세로는 정확히 base다', () => {
    const frame = thumbFrame(1, ON_SCALE.md);
    expect(frame.scaleX).toBe(ON_SCALE.md);
    expect(frame.scaleY).toBe(ON_SCALE.md);
  });

  it('k0이 있으면 p 0에서 k0로 시작해 p 1에서 1로 끝난다(늘임이 끊기지 않는다)', () => {
    expect(thumbFrame(0, 1, 1.144).k).toBe(1.144);
    expect(thumbFrame(1, 1, 1.144).k).toBe(1);
  });

  it('k0이 있어도 늘임은 사인 종 위에 시작 초과분이 (1 - p)로 줄어 얹힌다', () => {
    const k0 = 1.1;
    const p = 0.5;
    expect(thumbFrame(p, 1, k0).k).toBeCloseTo(
      1 + (k0 - 1) * (1 - p) + STRETCH * Math.sin(Math.PI * p),
      12
    );
    expect(thumbFrame(0.001, 1, k0).k).toBeCloseTo(k0, 3);
  });

  it('k0 기본값은 1이라 이어짐 항이 없다', () => {
    expect(thumbFrame(0.3, 1).k).toBe(thumbFrame(0.3, 1, 1).k);
  });
});

describe('ON_SCALE', () => {
  it.each([
    ['sm', 22, 16, 1.375],
    ['md', 26, 20, 1.3],
    ['lg', 30, 24, 1.25],
  ] as const)(
    '%s는 (트랙 높이 + 2) / 머리 = %i / %i = %f다',
    (size, grown, head, scale) => {
      expect(ON_SCALE[size]).toBeCloseTo(scale, 10);
      expect(ON_SCALE[size] * head).toBeCloseTo(grown, 10);
    }
  );
});
