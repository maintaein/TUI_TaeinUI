import { describe, it, expect } from 'vitest';
import { SWELL, progressFrame } from './checkboxProgress';

describe('progressFrame (진행값 t가 채움·상자를 정하는 식)', () => {
  it('t 0.5: 채움 절반, 상자 그대로', () => {
    expect(progressFrame(0.5)).toEqual({ fill: 0.5, box: 1 });
  });

  it('t 1: 채움 가득, 상자 그대로', () => {
    expect(progressFrame(1)).toEqual({ fill: 1, box: 1 });
  });

  it('t 1.2: 채움은 1을 넘고 상자가 부푼다', () => {
    const frame = progressFrame(1.2);
    expect(frame.fill).toBeCloseTo(1.2, 10);
    expect(frame.box).toBeCloseTo(1 + 0.35 * 0.2, 10);
  });

  it('t -0.2: 채움은 0에서 잘리고 상자는 부풀지 않는다', () => {
    expect(progressFrame(-0.2)).toEqual({ fill: 0, box: 1 });
  });

  it('t 0: 채움 없음', () => {
    expect(progressFrame(0)).toEqual({ fill: 0, box: 1 });
  });

  it('획 항목이 없다(획은 t를 따르지 않는다)', () => {
    expect(Object.keys(progressFrame(0.5))).toEqual(['fill', 'box']);
  });

  it('SWELL은 0.35이고 spring 정점 1.2044에서 상자가 1.0715배다', () => {
    expect(SWELL).toBe(0.35);
    expect(progressFrame(1.2044).box).toBeCloseTo(1.0715, 4);
  });
});
