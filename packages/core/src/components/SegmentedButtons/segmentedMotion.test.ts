import { describe, it, expect } from 'vitest';
import { SQUASH_PX, rubberStages } from './segmentedMotion';

describe('rubberStages', () => {
  it('SQUASH_PX는 RubberSegment의 squash 기본값 3이다', () => {
    expect(SQUASH_PX).toBe(3);
  });

  it('오른쪽으로 가면 R이 앞 가장자리, L이 뒤 가장자리이고 뒤 가장자리가 새 칸 왼쪽을 3px 지나친다', () => {
    const a = { l: 0, r: 80 };
    const b = { l: 84, r: 164 };

    expect(rubberStages(a, b)).toEqual({
      dilate: { l: 0, r: 164 },
      lead: { edge: 'r', to: 164 },
      trail: { edge: 'l', overshoot: 87, rest: 84 },
    });
  });

  it('왼쪽으로 가면 L이 앞 가장자리, R이 뒤 가장자리이고 뒤 가장자리가 새 칸 오른쪽을 3px 지나친다', () => {
    const a = { l: 168, r: 248 };
    const b = { l: 84, r: 164 };

    expect(rubberStages(a, b)).toEqual({
      dilate: { l: 84, r: 248 },
      lead: { edge: 'l', to: 84 },
      trail: { edge: 'r', overshoot: 161, rest: 164 },
    });
  });

  it('폭이 다른 칸이면 늘어남은 두 칸의 합집합이고 끝값은 새 칸의 실제 가장자리다', () => {
    const a = { l: 0, r: 50 };
    const b = { l: 54, r: 200 };

    expect(rubberStages(a, b)).toEqual({
      dilate: { l: 0, r: 200 },
      lead: { edge: 'r', to: 200 },
      trail: { edge: 'l', overshoot: 57, rest: 54 },
    });

    // 반대로 넓은 칸에서 좁은 칸으로 왼쪽 이동
    expect(rubberStages(b, a)).toEqual({
      dilate: { l: 0, r: 200 },
      lead: { edge: 'l', to: 0 },
      trail: { edge: 'r', overshoot: 47, rest: 50 },
    });
  });
});
