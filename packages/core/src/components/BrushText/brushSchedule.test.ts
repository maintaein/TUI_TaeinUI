import { describe, expect, it } from 'vitest';
import {
  BREATH,
  MAX_TOTAL,
  STROKE_DURATION,
  brushSchedule,
} from './brushSchedule';

describe('brushSchedule', () => {
  it('토큰에서 유도한 값이다: 획 200ms, 숨 고르기 60ms, 상한 3초', () => {
    expect(STROKE_DURATION).toBeCloseTo(0.2);
    expect(BREATH).toBeCloseTo(0.06);
    expect(MAX_TOTAL).toBe(3);
  });

  it('"가나": 초성 0, 중성 0.2, 다음 음절은 숨 고르기 0.06 뒤인 0.46', () => {
    const { strokes, total } = brushSchedule([2, 2]);
    expect(strokes.map((c) => c.map((s) => s.start))).toEqual([
      [0, 0.2],
      [0.46, 0.66].map((v) => expect.closeTo(v, 6)),
    ]);
    expect(strokes.flat().every((s) => s.duration === 0.2)).toBe(true);
    expect(total).toBeCloseTo(0.86);
  });

  it('받침 있는 음절은 획이 셋이고 이어서 쓴다', () => {
    const { strokes } = brushSchedule([3, 2]);
    expect(strokes[0].map((s) => s.start)).toEqual(
      [0, 0.2, 0.4].map((v) => expect.closeTo(v, 6))
    );
    expect(strokes[1][0].start).toBeCloseTo(0.66);
  });

  it('한글이 아닌 글자는 획 하나가 200ms다', () => {
    const { strokes } = brushSchedule([1, 2]);
    expect(strokes[0]).toEqual([{ start: 0, duration: 0.2 }]);
    expect(strokes[1][0].start).toBeCloseTo(0.26);
  });

  it('칸이 없으면 시간도 없다', () => {
    expect(brushSchedule([])).toEqual({ strokes: [], total: 0 });
  });

  it('긴 문장은 정확히 3초에 끝나고 모든 시간이 같은 비율로 준다', () => {
    const counts = Array.from({ length: 30 }, () => 3);
    const raw = 30 * 3 * 0.2 + 29 * 0.06;
    const scale = MAX_TOTAL / raw;
    const { strokes, total } = brushSchedule(counts);

    expect(total).toBeCloseTo(MAX_TOTAL, 9);
    const last = strokes[29][2];
    expect(last.start + last.duration).toBeCloseTo(MAX_TOTAL, 9);
    expect(last.duration).toBeCloseTo(0.2 * scale, 9);
    // 숨 고르기도 같은 비율: 첫 음절 끝에서 다음 음절 시작까지
    const gap =
      strokes[1][0].start - (strokes[0][2].start + strokes[0][2].duration);
    expect(gap).toBeCloseTo(0.06 * scale, 9);
  });

  it('상한 안이면 줄이지 않는다', () => {
    const counts = Array.from({ length: 4 }, () => 3);
    const { total } = brushSchedule(counts);
    expect(total).toBeCloseTo(4 * 3 * 0.2 + 3 * 0.06);
    expect(total).toBeLessThan(MAX_TOTAL);
  });
});
