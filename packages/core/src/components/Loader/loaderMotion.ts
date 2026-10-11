/**
 * Loader의 물결(wave)과 자벌레(inchworm)가 쓰는 숫자와 순수 함수.
 * 키프레임을 반복문으로 만들기 때문에 시험이 값을 읽을 수 있게 .css.ts 밖에 둔다.
 */
import { SQUASH_PX } from '../SegmentedButtons/segmentedMotion';

type Size = 'sm' | 'md' | 'lg' | 'xl';

/** 물결 막대의 중심 간격(px). Slider wake와 같다(교훈 18). */
export const WAVE_PITCH_PX = 8;

export const WAVE_WIDTH_PX: Record<Size, number> = {
  sm: 48,
  md: 64,
  lg: 96,
  xl: 128,
};

export const WAVE_HEIGHT_PX: Record<Size, number> = {
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
};

/** 막대 개수 = 폭 / 간격 */
export const waveBarCount = (size: Size): number =>
  WAVE_WIDTH_PX[size] / WAVE_PITCH_PX;

/** 걸음 수. 몸이 왼쪽 밖에서 들어와 오른쪽 밖으로 나가려면 (100 + 25) / 25 = 5걸음이다. */
export const INCHWORM_STEPS = 5;

/** 쉬는 몸의 길이(트랙 폭의 %). 한 걸음에 가는 거리와 같다. */
const BODY_PCT = 25;

/** 한 정지점의 모양. L·R은 트랙 왼쪽 기준 %, `lPx`는 L에 더하는 지나침(px). */
export interface InchwormStop {
  /** 한 바퀴 안의 위치(%) */
  at: number;
  l: number;
  lPx: number;
  r: number;
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

/**
 * 걸음마다 ① 앞끝 R이 +25%(걸음의 0~40%) ② 뒤끝 L이 +25%에 3px 지나침(40~85%)
 * ③ 3px 되돌아옴(85~100%). 마지막 걸음 끝에서 몸은 오른쪽 밖(L 100, R 125)이다.
 */
export const inchwormStops = (): InchwormStop[] => {
  const span = 100 / INCHWORM_STEPS;
  const stops: InchwormStop[] = [];
  for (let k = 0; k < INCHWORM_STEPS; k += 1) {
    const at = k * span;
    const l = -BODY_PCT + BODY_PCT * k;
    const r = BODY_PCT * k;
    stops.push({ at: round2(at), l, lPx: 0, r });
    stops.push({ at: round2(at + span * 0.4), l, lPx: 0, r: r + BODY_PCT });
    stops.push({
      at: round2(at + span * 0.85),
      l: l + BODY_PCT,
      lPx: SQUASH_PX,
      r: r + BODY_PCT,
    });
  }
  stops.push({
    at: 100,
    l: -BODY_PCT + BODY_PCT * INCHWORM_STEPS,
    lPx: 0,
    r: BODY_PCT * INCHWORM_STEPS,
  });
  return stops;
};

/** 채움 층(트랙 전체 폭)을 몸 모양으로 오려 내는 clip-path. 끝이 둥글다. */
export const inchwormInset = ({ l, lPx, r }: InchwormStop): string =>
  `inset(0 calc(100% - ${r}%) 0 ${lPx ? `calc(${l}% + ${lPx}px)` : `${l}%`} round 2px)`;

/** keyframes()에 펼쳐 넣는 프레임. 끝 프레임을 뺀 정지점마다 그 구간의 커브를 건다. */
export const inchwormFrames = (
  ease: string
): Record<string, { clipPath: string; animationTimingFunction?: string }> => {
  const stops = inchwormStops();
  return Object.fromEntries(
    stops.map((stop, i) => [
      `${stop.at}%`,
      i === stops.length - 1
        ? { clipPath: inchwormInset(stop) }
        : { clipPath: inchwormInset(stop), animationTimingFunction: ease },
    ])
  );
};
