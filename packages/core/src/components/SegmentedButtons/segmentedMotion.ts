/**
 * 표시(파란 알약)가 옮겨 갈 때의 단계별 끝값을 정하는 순수 함수.
 *
 * 표시는 두 가장자리 L·R(트랙 왼쪽 기준 px)로 그린다. 옮겨 가면 먼저 옛 칸과 새 칸을
 * 함께 덮도록 늘어나고, 진행 방향 쪽 앞 가장자리가 새 칸 끝에 앉고, 뒤 가장자리가
 * 새 칸 끝을 살짝 지나쳤다가 제자리로 돌아온다(RubberSegment.tsx의 travel·land).
 */

/** RubberSegment의 `squash` 기본값(3px, RubberSegment.tsx:97). 뒤 가장자리가 지나치는 길이다. */
export const SQUASH_PX = 3;

/** 칸 하나의 왼쪽·오른쪽 끝(트랙 왼쪽 기준 px). */
export interface Slot {
  l: number;
  r: number;
}

export type Edge = 'l' | 'r';

export interface RubberStages {
  /** 1. 늘어남: 옛 칸과 새 칸의 합집합 */
  dilate: Slot;
  /** 2~3. 앞 가장자리: 진행 방향 쪽, 새 칸 끝 */
  lead: { edge: Edge; to: number };
  /** 4~5. 뒤 가장자리: 새 칸 끝 + 진행 방향 x SQUASH_PX까지 갔다가 새 칸 끝으로 */
  trail: { edge: Edge; overshoot: number; rest: number };
}

/** `a`(옛 칸)에서 `b`(새 칸)로 옮겨 갈 때 단계별 끝값. 방향은 두 칸 중심으로 정한다. */
export const rubberStages = (a: Slot, b: Slot): RubberStages => {
  const dir = b.l + b.r >= a.l + a.r ? 1 : -1;
  const dilate = { l: Math.min(a.l, b.l), r: Math.max(a.r, b.r) };

  return dir > 0
    ? {
        dilate,
        lead: { edge: 'r', to: b.r },
        trail: { edge: 'l', overshoot: b.l + SQUASH_PX, rest: b.l },
      }
    : {
        dilate,
        lead: { edge: 'l', to: b.l },
        trail: { edge: 'r', overshoot: b.r - SQUASH_PX, rest: b.r },
      };
};
