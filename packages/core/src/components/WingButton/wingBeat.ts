import { gsap } from 'gsap';
import { gsapDuration, gsapEasing } from '../../tokens/gsapEasing';

// 날갯짓 박자 하나에서 날개 각도, 단추의 움직임, 연기 내뿜기를 함께 뽑는 순수 함수(설계서 8절 박자표).
// 시각 t(ms, 누른 순간 0)만 받는다. 이징은 GSAP 토큰을 gsap.parseEase로 평가할 뿐 시계를 돌리지 않는다.

const ms = (seconds: number) => Math.round(seconds * 1000);
const FAST = ms(gsapDuration.fast);
const BASE = ms(gsapDuration.base);
const SLOW = ms(gsapDuration.slow);

const settle = gsap.parseEase(gsapEasing.settle);
const snap = gsap.parseEase(gsapEasing.snap);
const drift = gsap.parseEase(gsapEasing.drift);
const exit = gsap.parseEase(gsapEasing.exit);

export type WingPhase =
  | 'crouch'
  | 'bud'
  | 'unfurl'
  | 'flap'
  | 'takeoff'
  | 'sent';

/** 단계 시작 시각(ms). 박자표의 시작 열 그대로다 */
export const BEAT = {
  crouch: 0,
  bud: 150,
  unfurl: 300,
  flap: 750,
  takeoff: 2250,
  sent: 3050,
} as const;
/** 표지가 다 떠오르는 시각(ms). 시계는 여기서 끝난다 */
export const BEAT_END = BEAT.sent + BASE;

export const CROUCH = { x: -2, y: 2, scale: 0.97 } as const;
// 깃 4개가 안쪽부터 45ms 간격으로 slow 동안 펴진다. 마지막 깃은 735ms에 끝나 날갯짓 시작(750) 직전에 닿는다
const FEATHERS = 4;
const FEATHER_GAP = 45;
const FEATHER_FOR = SLOW;

/**
 * 날개 각도(도). 오른쪽 날개 기준이고 왼쪽은 거울이다. 0은 단추 옆으로 수평, 양수는 위.
 * 위 끝은 날개가 접혀 올라간 자세이고 아래 끝은 아래로 처진 자세다.
 */
export const WING_UP = 35;
export const WING_DOWN = -30;

// 날갯짓 세 번: 아래 base(settle) + 위 slow(drift). 아래 끝마다 단추가 이만큼(px) 떠 있다(칠수록 높이)
const FLAP_COUNT = 3;
const LIFTS = [6, 10, 14] as const;
// i번째 날갯짓의 아래치기가 끝날 때의 높이. 이륙의 날갯짓(3번째 뒤)은 높이를 더하지 않고 이동이 이어받는다
const liftAfter = (i: number) =>
  i < 0 ? 0 : LIFTS[Math.min(i, FLAP_COUNT - 1)];
// 이륙의 날갯짓은 토큰 한 단계씩 빨라진다: 아래 base -> fast, 위 slow -> base. 한 번 500ms가 350ms가 된다(0.7배)
const TAKEOFF_DOWN = FAST;
const TAKEOFF_UP = BASE;

// 이륙: 오른쪽 위 45도로 exit 가속, 진행 방향으로 -15도 기울고 0.6배까지 작아진다
const TAKEOFF_FOR = BEAT.sent - BEAT.takeoff;
const TILT = -15;
const FAR_SCALE = 0.6;
// 연기를 내뿜는 자리: 날개 길이(단추 높이의 1.2배) 중 뿌리에서 이 비율 지점의 아래쪽
export const WING_RATIO = 1.2;
const SMOKE_ALONG = 0.75;

interface Stroke {
  start: number;
  down: number;
  up: number;
}

const strokes: Stroke[] = [];
for (let i = 0; i < FLAP_COUNT; i++) {
  strokes.push({
    start: BEAT.flap + i * (BASE + SLOW),
    down: BASE,
    up: SLOW,
  });
}
for (
  let start = BEAT.takeoff;
  start < BEAT.sent;
  start += TAKEOFF_DOWN + TAKEOFF_UP
) {
  strokes.push({ start, down: TAKEOFF_DOWN, up: TAKEOFF_UP });
}

export interface WingGeometry {
  /** 단추 크기(px) */
  width: number;
  height: number;
  /** 이륙에서 오른쪽과 위로 각각 나가는 거리(px). 45도다 */
  distance: number;
}

export interface WingBeat {
  phase: WingPhase;
  /** 날개 각도(도). `WING_DOWN`(-30)과 `WING_UP`(35) 사이, 오른쪽 날개 기준이고 왼쪽은 거울 */
  wingAngle: number;
  /** 날개가 아래로 치는 중이다. 연기는 이때만 나온다 */
  downstroke: boolean;
  /** 봉오리가 돋은 정도. 0에서 1(snap이라 끝 직전에 조금 넘친다) */
  bud: number;
  /** 깃 4개의 펼침 정도, 안쪽부터. 각각 0에서 1(snap이라 조금 넘친다) */
  feathers: readonly [number, number, number, number];
  /** 단추의 이동(px, 오른쪽과 아래가 +), 회전(도, 시계 방향 +), 배율 */
  x: number;
  y: number;
  rotation: number;
  scale: number;
  /** 연기를 내뿜는 중이다(아래로 칠 때만) */
  smoke: boolean;
  /** 내뿜는 자리 [왼쪽 날개, 오른쪽 날개]. 단추 중심 기준 px(이동·회전·배율을 걸기 전), 오른쪽과 아래가 + */
  smokeAt: readonly [{ x: number; y: number }, { x: number; y: number }];
  /** "보냈어요" 표지의 불투명도 0에서 1 */
  mark: number;
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/** t가 속한 날갯짓. 아래치기면 진행(0에서 1)과 함께, 위치기면 downstroke=false로 */
const strokeAt = (t: number) => {
  for (let i = strokes.length - 1; i >= 0; i--) {
    const stroke = strokes[i];
    if (t < stroke.start) continue;
    const into = t - stroke.start;
    if (into < stroke.down)
      return { index: i, down: true, p: into / stroke.down };
    return {
      index: i,
      down: false,
      p: clamp01((into - stroke.down) / stroke.up),
    };
  }
  return null;
};

const phaseAt = (t: number): WingPhase => {
  if (t >= BEAT.sent) return 'sent';
  if (t >= BEAT.takeoff) return 'takeoff';
  if (t >= BEAT.flap) return 'flap';
  if (t >= BEAT.unfurl) return 'unfurl';
  if (t >= BEAT.bud) return 'bud';
  return 'crouch';
};

export const wingBeat = (tMs: number, geometry: WingGeometry): WingBeat => {
  const phase = phaseAt(tMs);
  // 보냈어요 단계에서도 날개 자세는 이륙 끝에 머문다
  const t = Math.min(Math.max(tMs, 0), BEAT.sent);

  // 단추의 웅크림과 풀림
  let x = 0;
  let y = 0;
  let scale = 1;
  if (t < BEAT.bud) {
    const p = settle(clamp01(t / FAST));
    x = CROUCH.x * p;
    y = CROUCH.y * p;
    scale = 1 + (CROUCH.scale - 1) * p;
  } else if (t < BEAT.unfurl) {
    const p = snap((t - BEAT.bud) / FAST);
    x = CROUCH.x * (1 - p);
    y = CROUCH.y * (1 - p);
    scale = CROUCH.scale + (1 - CROUCH.scale) * p;
  }

  // 날갯짓: 각도와 들림
  const stroke = strokeAt(t);
  let wingAngle: number = WING_UP;
  let hover = 0;
  if (stroke) {
    wingAngle = stroke.down
      ? WING_UP + (WING_DOWN - WING_UP) * settle(stroke.p)
      : WING_DOWN + (WING_UP - WING_DOWN) * drift(stroke.p);
    // 들림은 아래치기에서 오르고 위치기에서는 머문다
    const from = liftAfter(stroke.index - 1);
    const to = liftAfter(stroke.index);
    hover = stroke.down ? from + (to - from) * settle(stroke.p) : to;
  }
  const downstroke = !!stroke?.down && phase !== 'sent';
  y -= hover;

  // 이륙
  let rotation = 0;
  if (t >= BEAT.takeoff) {
    const p = (t - BEAT.takeoff) / TAKEOFF_FOR;
    const travel = geometry.distance * exit(p);
    x += travel;
    y -= travel;
    rotation = TILT * settle(p);
    scale = 1 + (FAR_SCALE - 1) * p;
  }

  const rad = (wingAngle * Math.PI) / 180;
  const reach = geometry.height * WING_RATIO * SMOKE_ALONG;
  const dx = geometry.width / 2 + reach * Math.cos(rad);
  const dy = -reach * Math.sin(rad);

  return {
    phase,
    wingAngle,
    downstroke,
    bud: snap(clamp01((t - BEAT.bud) / FAST)),
    feathers: Array.from({ length: FEATHERS }, (_, i) =>
      snap(clamp01((t - BEAT.unfurl - i * FEATHER_GAP) / FEATHER_FOR))
    ) as unknown as WingBeat['feathers'],
    x,
    y,
    rotation,
    scale,
    smoke: downstroke,
    smokeAt: [
      { x: -dx, y: dy },
      { x: dx, y: dy },
    ],
    mark: settle(clamp01((tMs - BEAT.sent) / BASE)),
  };
};
