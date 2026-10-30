import { describe, expect, it } from 'vitest';
import {
  MAX_TOTAL,
  STROKE_DURATION,
  STROKE_GAP,
  SYLLABLE_GAP,
  brushSchedule,
} from './brushSchedule';

const near = (values: number[]) => values.map((v) => expect.closeTo(v, 6));

describe('brushSchedule', () => {
  it('토큰에서 유도한 값이다: 획 150ms, 자모 사이 100ms, 음절 사이 150ms, 상한 3초', () => {
    expect(STROKE_DURATION).toBeCloseTo(0.15);
    expect(STROKE_GAP).toBeCloseTo(0.1);
    expect(SYLLABLE_GAP).toBeCloseTo(0.15);
    expect(MAX_TOTAL).toBe(3);
  });

  it('"가나": 초성 0, 중성 0.25(획 0.15 + 쉼 0.1), 다음 음절은 쉼 0.15 뒤인 0.55', () => {
    const { strokes, total } = brushSchedule([2, 2]);
    expect(strokes.map((c) => c.map((s) => s.start))).toEqual([
      near([0, 0.25]),
      near([0.55, 0.8]),
    ]);
    expect(strokes.flat().every((s) => s.duration === 0.15)).toBe(true);
    expect(total).toBeCloseTo(0.95);
  });

  it('받침 있는 음절은 획이 셋이고 획마다 100ms 쉬고 쓴다', () => {
    const { strokes } = brushSchedule([3, 2]);
    expect(strokes[0].map((s) => s.start)).toEqual(near([0, 0.25, 0.5]));
    // 받침이 0.5~0.65에 끝나고 음절 쉼 0.15 뒤
    expect(strokes[1][0].start).toBeCloseTo(0.8);
  });

  it('한글이 아닌 글자는 자모 하나와 같은 길이의 획 하나다', () => {
    const { strokes } = brushSchedule([1, 2]);
    expect(strokes[0]).toEqual([{ start: 0, duration: 0.15 }]);
    expect(strokes[1][0].start).toBeCloseTo(0.3);
  });

  it('칸이 없으면 시간도 없다', () => {
    expect(brushSchedule([])).toEqual({ strokes: [], total: 0 });
  });

  it('긴 문장은 정확히 3초에 끝나고 획 길이와 두 쉼이 모두 같은 비율로 준다', () => {
    const counts = Array.from({ length: 30 }, () => 3);
    const raw = 30 * 3 * 0.15 + 30 * 2 * 0.1 + 29 * 0.15;
    const scale = MAX_TOTAL / raw;
    const { strokes, total } = brushSchedule(counts);

    expect(total).toBeCloseTo(MAX_TOTAL, 9);
    const last = strokes[29][2];
    expect(last.start + last.duration).toBeCloseTo(MAX_TOTAL, 9);
    expect(last.duration).toBeCloseTo(0.15 * scale, 9);
    const [a, b, c] = strokes[0];
    // 음절 안 자모 사이 쉼
    expect(b.start - (a.start + a.duration)).toBeCloseTo(0.1 * scale, 9);
    expect(c.start - (b.start + b.duration)).toBeCloseTo(0.1 * scale, 9);
    // 음절 사이 쉼
    expect(strokes[1][0].start - (c.start + c.duration)).toBeCloseTo(
      0.15 * scale,
      9
    );
  });

  it('상한 안이면 줄이지 않는다', () => {
    const { total } = brushSchedule([3, 3, 3]);
    expect(total).toBeCloseTo(3 * 3 * 0.15 + 3 * 2 * 0.1 + 2 * 0.15);
    expect(total).toBeLessThan(MAX_TOTAL);
  });
});
