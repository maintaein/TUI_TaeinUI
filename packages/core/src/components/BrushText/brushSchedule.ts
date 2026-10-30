import { gsapDuration } from '../../tokens/gsapEasing';

/** 자모 하나(또는 한글이 아닌 글자 하나)를 쓰는 시간. base(200ms) */
export const STROKE_DURATION = gsapDuration.base;

/** 음절 사이 숨 고르기. fast(150ms)의 0.4배 = 60ms, 한글 조립의 음절 간격과 같은 근거다 */
export const BREATH = gsapDuration.fast * 0.4;

/** 전체 상한(초). 넘으면 모든 시간을 같은 비율로 줄인다 */
export const MAX_TOTAL = 3;

export interface Stroke {
  start: number;
  duration: number;
}

/**
 * 칸마다 획 수(한글 음절은 자모 수, 그 밖의 글자는 1)를 받아 획별 시작 시각과 길이를 돌려준다.
 * 획은 겹치지 않고 이어지며 음절 사이에만 숨 고르기가 있다. 공백은 칸이 아니라 시간이 없다.
 * 전체가 MAX_TOTAL을 넘으면 길이와 숨 고르기를 같은 비율로 줄여 정확히 MAX_TOTAL에 끝낸다.
 */
export const brushSchedule = (
  strokeCounts: readonly number[]
): { strokes: Stroke[][]; total: number } => {
  let at = 0;
  const raw = strokeCounts.map((count, i) => {
    if (i > 0) at += BREATH;
    return Array.from({ length: count }, () => {
      const stroke = { start: at, duration: STROKE_DURATION };
      at += STROKE_DURATION;
      return stroke;
    });
  });
  const scale = at > MAX_TOTAL ? MAX_TOTAL / at : 1;
  return {
    strokes: raw.map((cell) =>
      cell.map(({ start, duration }) => ({
        start: start * scale,
        duration: duration * scale,
      }))
    ),
    total: at * scale,
  };
};
