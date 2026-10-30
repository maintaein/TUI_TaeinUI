import { describe, expect, it } from 'vitest';
import { jamoRegions } from '../../_internal/jamoRegions';
import { strokeDirection, sweepSpan } from './strokeSweep';

describe('strokeDirection', () => {
  it.each([...'ㅗㅛㅜㅠㅡ'])('가로 주인 모음 %s는 왼→오', (jamo) => {
    expect(strokeDirection(jamo)).toBe('right');
  });

  it.each([...'ㅏㅐㅑㅒㅓㅔㅕㅖㅣ'])('세로 주인 모음 %s는 위→아래', (jamo) => {
    expect(strokeDirection(jamo)).toBe('down');
  });

  it.each([...'ㅘㅙㅚㅝㅞㅟㅢ'])('섞인 모음 %s는 대각선', (jamo) => {
    expect(strokeDirection(jamo)).toBe('diagonal');
  });

  it.each(['ㄱ', 'ㅎ', 'ㄲ', 'ㅅ', 'ㄺ', 'ㅄ'])(
    '자음 %s(겹받침 포함)는 대각선',
    (jamo) => {
      expect(strokeDirection(jamo)).toBe('diagonal');
    }
  );

  it('빈 문자열은 가로 주인으로 잘못 읽히지 않는다', () => {
    expect(strokeDirection('')).toBe('diagonal');
  });
});

describe('sweepSpan', () => {
  const regionOf = (char: string, kind: string) =>
    jamoRegions(char)?.find((r) => r.kind === kind)?.region ?? [];

  it('왼→오는 영역의 x 범위다 (가의 ㅏ: 0.6~1)', () => {
    expect(sweepSpan(regionOf('가', 'medial'), 'right')).toEqual([0.6, 1]);
  });

  it('위→아래는 영역의 y 범위다 (곽의 받침 ㄱ: 0.65~1)', () => {
    const [from, to] = sweepSpan(regionOf('곽', 'final'), 'down');
    expect(from).toBeCloseTo(0.65);
    expect(to).toBe(1);
  });

  it('대각선은 (x + y) / 2의 범위다 (곽의 ㄱ자 모음 영역)', () => {
    const [from, to] = sweepSpan(regionOf('곽', 'medial'), 'diagonal');
    expect(from).toBeCloseTo((0 + 0.48) / 2);
    expect(to).toBeCloseTo((1 + 0.65) / 2);
  });
});
