import { describe, it, expect } from 'vitest';
import { jellyScale } from './jellyScale';

describe('jellyScale', () => {
  it('가운데 글자가 가장 크게 퍼지고 멀수록 약해진다', () => {
    const at = (d: number) => jellyScale(d).scaleX;
    expect(at(0)).toBeGreaterThan(at(0.5));
    expect(at(0.5)).toBeGreaterThan(at(1));
    expect(at(1)).toBeGreaterThan(at(1.5));
  });

  it('IconButton 호버의 젤리와 같은 1.15배까지 퍼진다', () => {
    expect(jellyScale(0).scaleX).toBeCloseTo(1.15, 10);
  });

  it('한 칸 떨어지면 퍼짐의 절반이다', () => {
    expect(jellyScale(1).scaleX - 1).toBeCloseTo(
      (jellyScale(0).scaleX - 1) / 2
    );
  });

  it('두 칸 이상 떨어지면 퍼지지 않는다(왼쪽도 같다)', () => {
    expect(jellyScale(2)).toEqual({ scaleX: 1, scaleY: 1 });
    expect(jellyScale(7)).toEqual({ scaleX: 1, scaleY: 1 });
    expect(jellyScale(-0.5)).toEqual(jellyScale(0.5));
  });

  it('부피를 지킨다: 가로 배율과 세로 배율의 곱이 언제나 1이다', () => {
    for (const d of [0, 0.3, 0.5, 1, 1.7, 2.4]) {
      const { scaleX, scaleY } = jellyScale(d);
      expect(scaleX * scaleY).toBeCloseTo(1, 10);
    }
  });
});
