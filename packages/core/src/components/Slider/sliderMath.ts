/** 한쪽에 돋는 눈금 개수. 양쪽 합 최대 10개. */
const TICKS_PER_SIDE = 5;

/** 트랙 폭 대비 눈금 최소 간격(%). step 간격이 이보다 촘촘하면 파생 간격을 쓴다. */
const MIN_TICK_GAP_PERCENT = 2;

/** 눈금 간격. step이 너무 촘촘하면 파생 간격을 쓴다. 범위가 없으면 0. */
export function tickInterval(min: number, max: number, step: number): number {
  const range = max - min;
  if (range <= 0) return 0;

  const stepGapPercent = (step / range) * 100;
  return stepGapPercent >= MIN_TICK_GAP_PERCENT
    ? step
    : (MIN_TICK_GAP_PERCENT / 100) * range;
}

/**
 * 중심 값 근방의 눈금 값 목록(중심 제외). step이 범위에 비해 너무 촘촘하면
 * `MIN_TICK_GAP_PERCENT`로 파생 간격을 써서 눈금이 붙지 않게 한다.
 */
export function computeTickValues(
  centerValue: number,
  min: number,
  max: number,
  step: number,
  perSide: number = TICKS_PER_SIDE
): number[] {
  const interval = tickInterval(min, max, step);
  if (interval <= 0) return [];

  const values: number[] = [];
  for (let i = 1; i <= perSide; i += 1) {
    const left = centerValue - i * interval;
    const right = centerValue + i * interval;
    if (left >= min) values.push(left);
    if (right <= max) values.push(right);
  }
  return values;
}

/**
 * wake 변형의 막대 값 목록: min에서 시작해 눈금 간격으로 max까지. 위치 계산은
 * `computeTickValues`를 그대로 쓴다(중심을 min에 두고 한쪽만 끝까지). 간격이
 * 트랙 폭의 2% 이상이라 막대는 최대 51개다.
 */
export function computeBarValues(
  min: number,
  max: number,
  step: number
): number[] {
  const interval = tickInterval(min, max, step);
  if (interval <= 0) return [];

  const perSide = Math.floor((max - min) / interval + 1e-9);
  return [min, ...computeTickValues(min, min, max, step, perSide)];
}

// wake 물결. 식과 상수는 WakeSlider.tsx(.claude/고도화/ex/WakeSlider.tsx)에서 옮겼다.

/** 막대 높이(px). 쉬는 높이는 기본 트랙 두께와 같다. */
export const WAKE_BAR_REST_HEIGHT = 6;
export const WAKE_BAR_MAX_HEIGHT = 20;

/** 막대 한 칸이 쉴 때의 scaleY. 막대 요소 높이는 최대 높이다. */
export const WAKE_REST_SCALE = WAKE_BAR_REST_HEIGHT / WAKE_BAR_MAX_HEIGHT;

/**
 * 머리 속도(트랙 %/s)가 이 값이면 물결이 최대다. WakeSlider.tsx:7 `FULL_SPEED`
 * 320. 거기서도 속도는 머리 위치(0~100%)의 변화율이라 단위가 같아 그대로다.
 */
const WAKE_FULL_SPEED = 320;

/** 최소·최대 반경(막대 단위). WakeSlider.tsx:8 `MIN_REACH` 1.5, :63 `reach` 6. */
const WAKE_MIN_REACH = 1.5;
const WAKE_REACH = 6;

/** 뒤는 넓게 앞은 좁게. WakeSlider.tsx:64 `skew` 0.6 (:107-108의 식). */
const WAKE_SKEW = 0.6;

/** 이 세기보다 작으면 평평하다. WakeSlider.tsx:9 `FLAT`. */
export const WAKE_FLAT = 0.002;

const clamp = (v: number, lo: number, hi: number): number =>
  Math.min(hi, Math.max(lo, v));
const smoothstep = (s: number): number => s * s * (3 - 2 * s);

/** 속도 -> 세기 0~1. WakeSlider.tsx:104. */
export function waveAmp(speed: number): number {
  return smoothstep(clamp(Math.abs(speed) / WAKE_FULL_SPEED, 0, 1));
}

/**
 * 머리에서 `d` 막대 떨어진 막대의 들림 0~1. `dir`은 머리가 가는 방향(1 또는 -1).
 * 머리 뒤쪽은 `r * (1 + skew)`, 앞쪽은 `r * (1 - skew / 2)` 안에서 cos^2로
 * 솟는다. WakeSlider.tsx:105-119.
 */
export function waveLift(d: number, dir: number, amp: number): number {
  const r = WAKE_MIN_REACH + (WAKE_REACH - WAKE_MIN_REACH) * amp;
  const behind = r * (1 + WAKE_SKEW);
  const ahead = r * (1 - 0.5 * WAKE_SKEW);
  const reach = d * dir < 0 ? behind : ahead;
  return Math.abs(d) < reach
    ? amp * Math.cos((Math.PI * d) / (2 * reach)) ** 2
    : 0;
}

/** 들림 -> 막대 scaleY. 쉬는 높이에서 최대 높이까지. WakeSlider.tsx:120. */
export function waveScale(lift: number): number {
  return WAKE_REST_SCALE + lift * (1 - WAKE_REST_SCALE);
}
