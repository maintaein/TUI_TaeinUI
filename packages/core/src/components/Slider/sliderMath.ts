const clamp = (v: number, lo: number, hi: number): number =>
  Math.min(hi, Math.max(lo, v));
const smoothstep = (s: number): number => s * s * (3 - 2 * s);

// wake 막대 개수. 값 단계가 아니라 트랙 폭이 정한다.

/** 막대 사이 간격(px): 막대 폭 2px + 틈. 개수는 이 간격마다 하나다. */
export const WAKE_BAR_GAP_PX = 8;
export const WAKE_MIN_BARS = 8;
export const WAKE_MAX_BARS = 160;

/** 폭을 아직 모를 때(SSR·첫 렌더) 쓰는 개수. */
export const WAKE_DEFAULT_BARS = 32;

/** 트랙 폭(px) -> 막대 개수. 간격 8px마다 하나, 8~160개(1280px 트랙까지 8px 간격). */
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
 * 머리 속도(px/s)가 이 값이면 물결이 최대다. WakeSlider.tsx:7 `FULL_SPEED` 320(%/s)을
 * 원본 트랙의 기준 폭 300px로 환산한 값이다: 320 * 3 = 960px/s. 150px/s는 거의 모든
 * 끌기를 최대로 만들어 약하게 끌어도 세게 끈 것과 같았다. px/s로 재므로 트랙 길이와
 * 무관하게 같은 손 속도는 같은 세기를 낸다.
 */
export const WAKE_FULL_SPEED_PX = 960;

// 머리와 속도를 두 스프링으로 따라가 물결 세기가 서서히 차오르고 빠지게 한다.
// GSAP 트윈이 아니라 ticker 안의 물리 적분이라 길이·커브 토큰으로 쓸 수 없다. 상수는
// WakeSlider.tsx에서 왔다.

/** 머리 스프링이 정착하는 데 드는 무차원 값. WakeSlider.tsx:6 `SETTLE`. */
export const WAKE_SETTLE = 9.23;
/** 머리가 목표를 따라가는 시간(s). WakeSlider.tsx:65 `glide` 기본값. */
export const WAKE_GLIDE = 0.3;
/** 속도를 거르는 정도(클수록 느리게 차오른다). WakeSlider.tsx:66 `smoothing` 기본값. */
export const WAKE_SMOOTHING = 100;

/** 머리 스프링의 고유 진동수. WakeSlider.tsx:91 `w0`. 감쇠 2 * w0은 임계 감쇠다. */
const HEAD_W0 = WAKE_SETTLE / WAKE_GLIDE;
/** 속도 스프링의 고유 진동수. WakeSlider.tsx:94 `wv`. 감쇠 2.5 * wv는 과감쇠(1.25)다. */
const SPEED_WV = 2000 / WAKE_SMOOTHING;

/**
 * 한 번 적분하는 시간 간격(s). 스프링이 빨라(w0 약 31/s) 한 걸음이 크면 발산하므로
 * 프레임 간격을 이 크기로 쪼갠다(1ms는 w0 * dt가 0.03이라 어떤 프레임 간격에서도
 * 안정이고, 임계·과감쇠 해를 넘침 없이 따라간다). 닫힌 해는 두 번째 스프링의 입력(첫
 * 스프링의 속도)이 계속 바뀌어 쓰기 어렵다.
 */
export const WAKE_SUBSTEP_S = 0.001;

/** 한 프레임에 흘리는 시간의 상한(s). 탭이 뒤에 있다 돌아와도 한꺼번에 튀지 않는다. */
export const WAKE_MAX_FRAME_S = 0.064;

/** 머리 스프링과 속도 스프링의 상태. 위치와 속도는 단위가 같으면 어느 것이든 된다. */
export interface WakeSprings {
  /** 머리 위치 */
  x: number;
  /** 머리 속도(x 단위/s) */
  v: number;
  /** 걸러진 속도(v와 같은 단위) */
  s: number;
  /** 걸러진 속도의 변화율 */
  ds: number;
}

/**
 * `dtSec`초 동안 두 스프링을 `target`을 향해 적분한다. 머리는 임계 감쇠
 * (a = w0^2 (target - x) - 2 w0 v)라 넘치지 않고, 걸러진 속도는 머리 속도를 과감쇠
 * (a = wv^2 (v - s) - 2.5 wv ds)로 따라가 0에서 0 기울기로 출발한다.
 * WakeSlider.tsx:91-95.
 */
export function stepWakeSprings(
  state: WakeSprings,
  target: number,
  dtSec: number
): WakeSprings {
  let { x, v, s, ds } = state;
  const steps = Math.max(1, Math.ceil(dtSec / WAKE_SUBSTEP_S - 1e-9));
  const h = dtSec / steps;
  for (let i = 0; i < steps; i++) {
    v += (HEAD_W0 * HEAD_W0 * (target - x) - 2 * HEAD_W0 * v) * h;
    x += v * h;
    ds += (SPEED_WV * SPEED_WV * (v - s) - 2.5 * SPEED_WV * ds) * h;
    s += ds * h;
  }
  return { x, v, s, ds };
}

/**
 * 두 스프링이 모두 쉬었는가: 머리가 목표에 닿았고 속도가 거의 없고, 걸러진 속도가
 * 물결이 안 보일 만큼(세기 `WAKE_FLAT` 미만) 작다. `pxPerUnit`은 위치 한 단위가 몇
 * px인지(걸러진 속도를 px/s로 읽는 데 쓴다)다.
 */
export function wakeSpringsRested(
  state: WakeSprings,
  target: number,
  pxPerUnit: number
): boolean {
  return (
    Math.abs(target - state.x) < 0.005 &&
    Math.abs(state.v) < 0.05 &&
    waveAmp(state.s * pxPerUnit) === 0
  );
}

// 보이는 위치(display). 값이 한 번에 바뀌어도 머리와 채움이 순간이동하지 않도록 값의
// 위치를 머리 스프링(w0 = WAKE_SETTLE / WAKE_GLIDE)과 같은 임계 감쇠 스프링으로 따라간다.

/**
 * 끄는 중 한 단계 폭(px)이 이 값 이하면 머리가 커서(목표)를 그대로 따른다. 이보다 넓은
 * 단계(큰 step 스냅, 마크)는 늘 스프링으로 간다. 한 번에 바뀐 양이 아니라 단계 폭으로
 * 가르는 이유: 빠르게 끌어 값이 두세 단계씩 바뀌어도 보통 끌기는 늘 같은 규칙이다.
 */
export const SNAP_PX = 12;

/** 보이는 위치가 목표와 이 거리(px) 안이면 따라잡았다고 본다. */
export const CAUGHT_PX = 0.5;

/** 한 단계 폭(px): 머리 중심이 움직이는 길이 `travelPx`(`headTravelPx`)에서 `step`이 차지하는 몫. */
export function stepWidthPx(
  step: number,
  min: number,
  max: number,
  travelPx: number
): number {
  return max > min ? (step / (max - min)) * travelPx : 0;
}

/**
 * 보이는 위치가 목표를 스프링 없이 그대로 따라붙는 중인가(잠금). 스프링만 쓰면 끄는 동안
 * 머리가 커서보다 `2 / w0 * 속도`만큼 뒤처진다(300px/s에서 약 20px). 그래서 포인터로
 * 끄는 동안 한 단계가 `SNAP_PX` 이하면 목표를 그대로 쓴다. 잡지 않은 변화(키보드, 값
 * prop)와 넓은 단계는 늘 스프링이다. 누른 순간의 첫 점프(트랙 클릭)도 스프링이라, 한
 * 번에 `SNAP_PX`보다 크게 바뀌면 잠기지 않고, 목표를 따라잡은(`CAUGHT_PX`) 뒤 잠긴다.
 * 잠긴 뒤에는 변화가 커도 목표를 그대로 따른다(빠른 끌기). `gapPx`는 바뀌기 전 목표와
 * 보이는 위치의 거리, `jumpPx`는 이번 변화의 크기다.
 */
export function nextDisplayLock(p: {
  locked: boolean;
  dragging: boolean;
  stepPx: number;
  gapPx: number;
  jumpPx: number;
}): boolean {
  if (!p.dragging || p.stepPx > SNAP_PX) return false;
  return p.locked || (p.gapPx < CAUGHT_PX && p.jumpPx <= SNAP_PX);
}

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
 * 속도(px/s) -> 세기 0~1. WakeSlider.tsx:104. `WAKE_FLAT`보다 작으면 0으로 잘라, 멈춘
 * 뒤 막대가 쉬는 높이에 딱 맞는다.
 */
export function waveAmp(speed: number): number {
  const amp = smoothstep(clamp(Math.abs(speed) / WAKE_FULL_SPEED_PX, 0, 1));
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
 * 머리 중심이 실제로 움직이는 길이(px). 위치 1%가 이 길이의 1/100이라 물결 세기(px/s)와
 * 한 단계 폭이 이 길이로 잰다. default·bar는 호스트가 트랙 전체라 머리 폭을 빼고, wake는
 * 막대 묶음이 이미 좌우 12px씩 들여져 있어(머리 폭만큼 좁다) 호스트 폭이 곧 이동 길이다.
 */
export function headTravelPx(hostPx: number, isWake: boolean): number {
  return isWake ? hostPx : hostPx - THUMB_PX;
}

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
