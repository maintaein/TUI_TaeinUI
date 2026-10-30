import { gsapDuration } from '../../tokens/gsapEasing';

/** 자모 하나(또는 한글이 아닌 글자 하나)를 쓰는 시간. fast(150ms), 참고 영상의 획 100~170ms 가운데 */
export const STROKE_DURATION = gsapDuration.fast;

/** 한 음절 안 자모 사이에 붓을 드는 쉼. base(200ms)의 0.5배 = 100ms, 영상의 획 사이 쉼 100~170ms의 아래쪽 */
export const STROKE_GAP = gsapDuration.base * 0.5;

/** 음절 사이 쉼. fast(150ms), 영상 쉼의 위쪽이다. 붓을 떼고 다음 글자로 옮긴다 */
export const SYLLABLE_GAP = gsapDuration.fast;

/** 전체 상한(초). 넘으면 모든 시간을 같은 비율로 줄인다 */
export const MAX_TOTAL = 3;

export interface Stroke {
  start: number;
  duration: number;
}

/**
 * 칸마다 획 수(한글 음절은 자모 수, 그 밖의 글자는 1)를 받아 획별 시작 시각과 길이를 돌려준다.
 * 획은 겹치지 않고, 획 사이(음절 안은 STROKE_GAP, 음절 사이는 SYLLABLE_GAP)에 붓을 드는 쉼이 있다. 공백은 칸이 아니라 시간이 없다.
 * 전체가 MAX_TOTAL을 넘으면 길이와 쉼을 같은 비율로 줄여 정확히 MAX_TOTAL에 끝낸다.
 */
export const brushSchedule = (
  strokeCounts: readonly number[]
): { strokes: Stroke[][]; total: number } => {
  let at = 0;
  const raw = strokeCounts.map((count, i) => {
    if (i > 0) at += SYLLABLE_GAP;
    return Array.from({ length: count }, (_, k) => {
      if (k > 0) at += STROKE_GAP;
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
