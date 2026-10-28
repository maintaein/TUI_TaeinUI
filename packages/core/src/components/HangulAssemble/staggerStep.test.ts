import { describe, expect, it } from 'vitest';
import { MAX_SPREAD, STAGGER, staggerStep } from './staggerStep';

describe('staggerStep', () => {
  it('짧은 문장은 기본 간격 그대로다', () => {
    expect(staggerStep(5)).toBe(STAGGER);
  });

  it('긴 문장은 마지막 칸이 상한 안에서 시작한다', () => {
    expect(staggerStep(77)).toBeLessThan(STAGGER);
    expect((77 - 1) * staggerStep(77)).toBeLessThanOrEqual(MAX_SPREAD);
  });

  it('칸이 하나이거나 없으면 0이다', () => {
    expect(staggerStep(1)).toBe(0);
    expect(staggerStep(0)).toBe(0);
  });
});
