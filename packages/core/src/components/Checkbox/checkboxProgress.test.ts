import { describe, it, expect } from 'vitest';
import { SWELL, clamp01, progressFrame } from './checkboxProgress';

const LENGTH = 19.8;

describe('progressFrame (진행값 t가 채움·상자·획을 정하는 식)', () => {
  it('t 0.5: 채움 절반, 상자 그대로, 획 절반 남음', () => {
    expect(progressFrame(0.5, LENGTH)).toEqual({
      fill: 0.5,
      box: 1,
      dashoffset: LENGTH * 0.5,
    });
  });

  it('t 1: 채움 가득, 상자 그대로, 획 다 그어짐', () => {
    expect(progressFrame(1, LENGTH)).toEqual({
      fill: 1,
      box: 1,
      dashoffset: 0,
    });
  });

  it('t 1.2: 채움은 1을 넘고 상자가 부풀며 획은 0에서 잘린다', () => {
    const frame = progressFrame(1.2, LENGTH);
    expect(frame.fill).toBeCloseTo(1.2, 10);
    expect(frame.box).toBeCloseTo(1 + 0.35 * 0.2, 10);
    expect(frame.dashoffset).toBe(0);
  });

  it('t -0.2: 채움은 0에서 잘리고 상자는 부풀지 않으며 획은 길이에서 잘린다', () => {
    expect(progressFrame(-0.2, LENGTH)).toEqual({
      fill: 0,
      box: 1,
      dashoffset: LENGTH,
    });
  });

  it('t 0: 채움 없음, 획 전부 가림', () => {
    expect(progressFrame(0, LENGTH)).toEqual({
      fill: 0,
      box: 1,
      dashoffset: LENGTH,
    });
  });

  it('획 길이가 dashoffset의 배율이다(대시 14)', () => {
    expect(progressFrame(0.25, 14).dashoffset).toBeCloseTo(10.5, 10);
  });

  it('SWELL은 0.35이고 spring 정점 1.2044에서 상자가 1.0715배다', () => {
    expect(SWELL).toBe(0.35);
    expect(progressFrame(1.2044, LENGTH).box).toBeCloseTo(1.0715, 4);
  });

  it('clamp01은 0과 1 사이로 자른다', () => {
    expect(clamp01(-3)).toBe(0);
    expect(clamp01(0.4)).toBe(0.4);
    expect(clamp01(7)).toBe(1);
  });
});
