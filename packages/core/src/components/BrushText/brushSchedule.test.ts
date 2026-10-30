import { describe, expect, it } from 'vitest';
import {
  EM_DURATION,
  JAMO_GAP,
  MIN_STROKE,
  STROKE_GAP,
  SYLLABLE_GAP,
  brushSchedule,
} from './brushSchedule';

const near = (values: number[]) => values.map((v) => expect.closeTo(v, 6));
const starts = (jamo: { start: number }[][]) =>
  jamo.map((strokes) => strokes.map((s) => s.start));

describe('brushSchedule', () => {
  it('토큰에서 유도한 값이다: 1em 200ms, 최소 60ms, 같은 자모 안 쉼 60ms, 자모 사이 100ms, 음절 사이 150ms', () => {
    expect(EM_DURATION).toBeCloseTo(0.2);
    expect(MIN_STROKE).toBeCloseTo(0.06);
    expect(STROKE_GAP).toBeCloseTo(0.06);
    expect(JAMO_GAP).toBeCloseTo(0.1);
    expect(SYLLABLE_GAP).toBeCloseTo(0.15);
  });

  it('획 시간은 길이에 비례한다 (0.5em은 100ms, 0.85em은 170ms)', () => {
    const { strokes } = brushSchedule([[[0.5], [0.85]]]);
    expect(strokes[0][0][0].duration).toBeCloseTo(0.1);
    expect(strokes[0][1][0].duration).toBeCloseTo(0.17);
  });

  it('아주 짧은 획(점)은 최소 60ms다', () => {
    const { strokes } = brushSchedule([[[0.01]]]);
    expect(strokes[0][0][0].duration).toBeCloseTo(0.06);
  });

  it('세 종류 쉼: 같은 자모 안 60ms, 자모 사이 100ms, 음절 사이 150ms', () => {
    // 첫 음절: 자모 둘(획 2개와 1개), 둘째 음절: 자모 하나. 획은 모두 0.5em = 100ms
    const { strokes, total } = brushSchedule([[[0.5, 0.5], [0.5]], [[0.5]]]);

    expect(starts(strokes[0])).toEqual([near([0, 0.16]), near([0.36])]);
    // 첫 음절은 0.36 + 0.1 = 0.46에 끝나고 음절 사이 0.15 뒤
    expect(starts(strokes[1])).toEqual([near([0.61])]);
    expect(total).toBeCloseTo(0.71);
  });

  it('칸이 없으면 시간도 없다', () => {
    expect(brushSchedule([])).toEqual({ strokes: [], total: 0 });
  });

  it('긴 문장도 줄이지 않고 길이 비례 시간과 쉼 그대로 끝까지 간다 (상한 없음)', () => {
    const cell = [[0.5, 0.5], [0.5]];
    const perCell = 3 * 0.1 + 0.06 + 0.1;
    const { strokes, total } = brushSchedule(
      Array.from({ length: 30 }, () => cell)
    );

    expect(total).toBeCloseTo(30 * perCell + 29 * 0.15, 9);
    expect(total).toBeGreaterThan(3);
    const [[a, b], [c]] = strokes[0];
    expect(a.duration).toBeCloseTo(0.1, 9);
    expect(b.start - (a.start + a.duration)).toBeCloseTo(0.06, 9);
    expect(c.start - (b.start + b.duration)).toBeCloseTo(0.1, 9);
    expect(strokes[1][0][0].start - (c.start + c.duration)).toBeCloseTo(
      0.15,
      9
    );
  });
});
