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

// default·bar 라인. 라인 자체가 머리 둘레에서 부푼다. 물결 식(`waveAmp`, `waveLift`)은
// wake와 같고, 막대 단위가 아니라 px 단위로 연속이다.

/** 라인 두께(px). 쉬는 두께와 마우스를 올린 두께. bar는 머리가 없어 조금 두껍다. */
export const LINE_REST = 6;
export const LINE_HOVER = 9;
export const LINE_BAR_REST = 8;
export const LINE_BAR_HOVER = 12;

/** 물결이 부풀릴 수 있는 최대 두께(px). */
export const LINE_WAVE_MAX = 20;

/** 라인을 그리는 SVG의 높이(px)와 그 가운데. 최대 두께가 들어가고도 남는다. */
export const LINE_BOX_HEIGHT = 24;
const LINE_CENTER = LINE_BOX_HEIGHT / 2;

/** 두께를 재는 x 간격(px). */
const LINE_STEP_PX = 2;

/** 폭을 아직 모를 때(SSR·첫 렌더) 쓰는 폭(px). */
export const LINE_DEFAULT_WIDTH = 200;

/** 네이티브 머리 폭(px). 머리 중심은 (폭 - 머리 폭) 위를 움직인다. */
export const THUMB_PX = 24;

/**
 * 머리에서 `d`px 떨어진 곳의 라인 두께. `base`는 바탕 두께(쉬는 두께 또는
 * 호버 두께)이고 물결이 `LINE_WAVE_MAX`까지 부풀린다. `waveLift`의 `gap`을 1로
 * 두어 반경을 px 그대로 쓴다.
 */
export function lineThickness(
  d: number,
  dir: number,
  amp: number,
  base: number
): number {
  return base + waveLift(d, dir, amp, 1) * (LINE_WAVE_MAX - base);
}

const round2 = (v: number): number => +v.toFixed(2);

/**
 * 두께 함수로 그린 알약 모양 닫힌 경로. 위·아래 가장자리를 2px 간격으로 재고
 * 양끝은 그 끝 두께의 반원이다. `inset`만큼 안쪽으로 들여 그린다(SVG 선은
 * 가운데에 그려지니 1px 테두리는 0.5 들인 경로에 그린다). 시계 방향.
 */
export function linePath(
  width: number,
  thickAt: (x: number) => number,
  inset = 0
): string {
  const half = (x: number): number => Math.max(thickAt(x) / 2 - inset, 0);
  const rL = half(0);
  const rR = half(width);
  const xL = inset + rL;
  const xR = Math.max(width - inset - rR, xL);
  const xs: number[] = [];
  for (let x = xL + LINE_STEP_PX; x < xR; x += LINE_STEP_PX) xs.push(x);
  const hs = xs.map(half);
  const c = LINE_CENTER;
  const pt = (x: number, y: number): string => `${round2(x)},${round2(y)}`;
  return [
    `M${pt(xL, c - rL)}`,
    ...xs.map((x, i) => `L${pt(x, c - hs[i])}`),
    `L${pt(xR, c - rR)}`,
    `A${round2(rR)},${round2(rR)} 0 0 1 ${pt(xR, c + rR)}`,
    ...xs.map((x, i) => `L${pt(x, c + hs[i])}`).reverse(),
    `L${pt(xL, c + rL)}`,
    `A${round2(rL)},${round2(rL)} 0 0 1 ${pt(xL, c - rL)}`,
    'Z',
  ].join('');
}

export interface LineState {
  /** 라인 폭(px) */
  width: number;
  /** 값의 위치(트랙 %) */
  fillPct: number;
  /** 채움 끝을 둥글게 한다(bar). 아니면 값 위치에서 곧게 잘린다. */
  roundEnd: boolean;
  /** 바탕 두께(px) */
  base: number;
  /** 머리 위치(트랙 %), 가는 방향(1 또는 -1), 물결 세기 0~1 */
  headPct: number;
  dir: number;
  amp: number;
}

/**
 * 라인 상태 -> 그림. `track`은 안 채운 알약(1px 테두리를 따라 0.5 들인 경로),
 * `fill`은 채운 알약의 바깥 모양, `clip`은 채움을 자르는 x(px)다. 채움은 값
 * 위치에서 잘린다. bar는 채움 모양 자체가 값 위치에서 둥글게 끝난다.
 */
export function lineShapes(s: LineState): {
  track: string;
  fill: string;
  clip: number;
} {
  const headX = THUMB_PX / 2 + (s.headPct / 100) * (s.width - THUMB_PX);
  const thickAt = (x: number): number =>
    lineThickness(x - headX, s.dir, s.amp, s.base);
  const clip = clamp((s.width * s.fillPct) / 100, 0, s.width);
  return {
    track: linePath(s.width, thickAt, 0.5),
    fill: linePath(s.roundEnd ? clip : s.width, thickAt),
    clip,
  };
}
