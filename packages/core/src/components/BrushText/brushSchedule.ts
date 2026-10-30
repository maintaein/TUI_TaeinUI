import { gsapDuration } from '../../tokens/gsapEasing';

/** 획 하나가 1em을 가는 시간. base(200ms)라 0.5~0.85em 획이 100~170ms가 되어 참고 영상의 획 길이와 맞는다 */
export const EM_DURATION = gsapDuration.base;

/** 획 시간의 최소(점). fast(150ms)의 0.4배 = 60ms */
export const MIN_STROKE = gsapDuration.fast * 0.4;

/** 한 자모 안 획 사이 쉼. fast의 0.4배 = 60ms, 같은 자모 안에서는 붓을 짧게 든다 */
export const STROKE_GAP = gsapDuration.fast * 0.4;

/** 자모 사이 쉼. base(200ms)의 0.5배 = 100ms, 참고 영상에서 자모를 다 쓰고 붓을 들고 옮기는 쉼(100~170ms)의 아래쪽 */
export const JAMO_GAP = gsapDuration.base * 0.5;

/** 음절 사이 쉼. fast(150ms), 영상 쉼의 위쪽이다. 붓을 떼고 다음 글자로 옮긴다 */
export const SYLLABLE_GAP = gsapDuration.fast;

export interface Stroke {
  start: number;
  duration: number;
}

/**
 * 칸마다, 자모마다, 획마다 길이(em)를 받아 획별 시작 시각과 길이를 돌려준다.
 * 획 시간은 길이에 비례하고(최소 MIN_STROKE) 획은 겹치지 않는다. 쉼은 같은 자모 안 STROKE_GAP,
 * 자모 사이 JAMO_GAP, 음절 사이 SYLLABLE_GAP이다. 공백은 칸이 아니라 시간이 없다.
 * 전체 길이에 상한이 없다(사용자 결정). 긴 문장은 그만큼 오래 걸린다.
 */
export const brushSchedule = (
  lengths: readonly (readonly (readonly number[])[])[]
): { strokes: Stroke[][][]; total: number } => {
  let at = 0;
  const raw = lengths.map((cell, c) => {
    if (c > 0) at += SYLLABLE_GAP;
    return cell.map((jamo, j) => {
      if (j > 0) at += JAMO_GAP;
      return jamo.map((lengthEm, k) => {
        if (k > 0) at += STROKE_GAP;
        const stroke = {
          start: at,
          duration: Math.max(lengthEm * EM_DURATION, MIN_STROKE),
        };
        at += stroke.duration;
        return stroke;
      });
    });
  });
  return { strokes: raw, total: at };
};
