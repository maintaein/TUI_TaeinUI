const clamp = (v: number, lo: number, hi: number): number =>
  Math.min(hi, Math.max(lo, v));
const smoothstep = (s: number): number => s * s * (3 - 2 * s);

// wake 막대 개수. 값 단계가 아니라 트랙 폭이 정한다.

/** 막대 사이 간격(px): 막대 폭 2px + 틈. 개수는 이 간격마다 하나다. */
export const WAKE_BAR_GAP_PX = 8;
export const WAKE_MIN_BARS = 8;
export const WAKE_MAX_BARS = 48;

/** 폭을 아직 모를 때(SSR·첫 렌더) 쓰는 개수. */
export const WAKE_DEFAULT_BARS = 32;

/** 트랙 폭(px) -> 막대 개수. 간격 8px마다 하나, 8~48개. */
export function wakeBarCount(width: number): number {
  return clamp(
    Math.floor(width / WAKE_BAR_GAP_PX),
    WAKE_MIN_BARS,
    WAKE_MAX_BARS
  );
}

// wake 물결. 식과 상수는 WakeSlider.tsx(.claude/고도화/ex/WakeSlider.tsx)에서 옮겼다.

/** 막대 높이(px). 쉬는 높이는 기본 트랙 두께와 같다. */
export const WAKE_BAR_REST_HEIGHT = 6;
export const WAKE_BAR_MAX_HEIGHT = 24;

/** 막대 한 칸이 쉴 때의 scaleY. 막대 요소 높이는 최대 높이다. */
export const WAKE_REST_SCALE = WAKE_BAR_REST_HEIGHT / WAKE_BAR_MAX_HEIGHT;

/**
 * 머리 속도(트랙 %/s)가 이 값이면 물결이 최대다. WakeSlider.tsx의 320에서
 * 120으로 낮췄다: 트랙 폭의 약 100%/s로 끌 때 들림이 0.8을 넘어야 한다
 * (smoothstep(100 / 120) = 0.92). 머리를 따라가는 quickTo는 속도를 깎지 않는다
 * (끄는 속도와 머리 속도가 같다). 320이면 같은 끌기에서 0.28이었다.
 */
const WAKE_FULL_SPEED = 120;

/**
 * 최소·최대 반경(px). WakeSlider.tsx의 `MIN_REACH` 1.5, `reach` 6(막대 단위)을
 * 막대 간격 8px로 환산한 값이다. 간격이 바뀌어도 물결의 물리적 폭은 같다.
 */
export const WAKE_MIN_REACH_PX = 12;
export const WAKE_REACH_PX = 48;

/** 뒤는 넓게 앞은 좁게. WakeSlider.tsx:64 `skew` 0.6 (:107-108의 식). */
const WAKE_SKEW = 0.6;

/** 이 세기보다 작으면 평평하다. WakeSlider.tsx:9 `FLAT`. */
export const WAKE_FLAT = 0.002;

/**
 * 속도 -> 세기 0~1. WakeSlider.tsx:104. `WAKE_FLAT`보다 작으면 0으로 잘라, 멈춘
 * 뒤 막대가 쉬는 높이에 딱 맞는다.
 */
export function waveAmp(speed: number): number {
  const amp = smoothstep(clamp(Math.abs(speed) / WAKE_FULL_SPEED, 0, 1));
  return amp < WAKE_FLAT ? 0 : amp;
}

/**
 * 머리에서 `d` 막대 떨어진 막대의 들림 0~1. `dir`은 머리가 가는 방향(1 또는 -1).
 * `gap`은 막대 간격(px)이고 반경(px)을 막대 단위로 바꾸는 데 쓴다. 머리 뒤쪽은
 * `r * (1 + skew)`, 앞쪽은 `r * (1 - skew / 2)` 안에서 cos^2로 솟는다.
 * WakeSlider.tsx:105-119.
 */
export function waveLift(
  d: number,
  dir: number,
  amp: number,
  gap: number = WAKE_BAR_GAP_PX
): number {
  const r =
    (WAKE_MIN_REACH_PX + (WAKE_REACH_PX - WAKE_MIN_REACH_PX) * amp) / gap;
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
