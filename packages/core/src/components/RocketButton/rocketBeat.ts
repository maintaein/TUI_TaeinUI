import { gsap } from 'gsap';
import { gsapDuration, gsapEasing } from '../../tokens/gsapEasing';

// 로켓 박자 하나에서 꼬리날개 펼침, 불꽃 길이, 단추의 움직임, 연기 내뿜기를 함께 뽑는 순수 함수(설계서 8절 박자표).
// 시각 t(ms, 누른 순간 0)만 받는다. 이징은 GSAP 토큰을 gsap.parseEase로 평가할 뿐 시계를 돌리지 않는다.

const ms = (seconds: number) => Math.round(seconds * 1000);
const FAST = ms(gsapDuration.fast);
const BASE = ms(gsapDuration.base);
const SLOW = ms(gsapDuration.slow);
const SLOWER = ms(gsapDuration.slower);

const settle = gsap.parseEase(gsapEasing.settle);
const snap = gsap.parseEase(gsapEasing.snap);
const spring = gsap.parseEase(gsapEasing.spring);
const drift = gsap.parseEase(gsapEasing.drift);
const exit = gsap.parseEase(gsapEasing.exit);
// 시험이 토큰 이름을 직접 적어 기대값을 계산하는 길(시험 파일은 gsap을 직접 import하지 않는다). 구현의 단계별 매핑은 쓰지 않는다
export const easeAt = (
  token: (typeof gsapEasing)[keyof typeof gsapEasing],
  p: number
) => gsap.parseEase(token)(p);

export type RocketPhase =
  | 'crouch'
  | 'fins'
  | 'ignite'
  | 'hover'
  | 'launch'
  | 'sent';

/** 단계 시작 시각(ms). 박자표의 시작 열 그대로다. ignite는 점화와 떠오름이 함께 시작하는 단계다 */
export const BEAT = {
  crouch: 0,
  fins: 150,
  ignite: 450,
  hover: 950,
  launch: 2250,
  sent: 3050,
} as const;
/** 표지가 다 떠오르는 시각(ms). 시계는 여기서 끝난다 */
export const BEAT_END = BEAT.sent + BASE;

export const CROUCH = { x: -2, y: 2, scale: 0.97 } as const;

// 떠오름: slower(500ms) 동안 spring으로 이만큼(px) 오른다. 영상의 약 25px다. spring이 넘쳤다 앉는다
const RISE = 25;
// 둥실: 떠오른 자리에서 몇 px 위아래로 한 번 흔들린다(위로 BOB, 아래로 BOB, 제자리). 단계 사이는 drift다
const BOB = 4;
const BOB_STOPS = [
  { u: 0, y: 0 },
  { u: 0.25, y: -BOB },
  { u: 0.75, y: BOB },
  { u: 1, y: 0 },
] as const;
const HOVER_FOR = BEAT.launch - BEAT.hover;

// 발사: 오른쪽 위 45도로 exit 가속하며 0.6배까지 작아진다.
// 기울기는 윗면이 진행 방향(오른쪽 위)을 향하게 시계 방향 TILT도다. 영상은 진행 방향으로 -20~+10도 기울었지만
// 알약 단추는 그 정도로는 기운 것이 안 읽혀 30도로 키웠다(진행 방향 45도보다는 덜 기울어 미끄러지며 난다).
// 몸체와 함께 기울어 불꽃은 진행 반대(왼쪽 아래)로 뻗는다. 둥실 동안은 기울지 않는다
const LAUNCH_FOR = BEAT.sent - BEAT.launch;
const TILT = 30;
const FAR_SCALE = 0.6;

// 분사구 둘: 단추 밑면에서 폭의 1/3, 2/3 자리(중심 기준 +-폭/6), 길이는 단추 높이의 비
export const NOZZLE_X = 1 / 6;
export const NOZZLE_RATIO = 0.3;
// 불꽃 길이 1(기본)은 단추 높이의 이 배수다. 점화 뒤 깜빡이고, 발사 속도에 따라 최대 FLAME_PEAK배까지 길어진다
export const FLAME_RATIO = 1.7;
const FLICKER = 0.1;
const STRETCH = 1.2;
export const FLAME_PEAK = 1 + FLICKER + STRETCH;
// 발사가 끝날 때 꼬리날개와 불꽃(진행 반대쪽으로 늘어진다)까지 레이어 가장자리를 넘어 나가는 거리(단추 높이의 비)
export const TAIL_REACH = 2;

/** 시각 t의 결정적인 깜빡임 -1에서 1. 난수가 아니라 서로 다른 주기(약 107ms, 182ms)의 사인 둘이라 시험이 같은 값을 본다 */
const wave = (t: number) => (Math.sin(t / 17) + Math.sin(t / 29 + 1)) / 2;

// 발사 속도(0에서 1): exit 곡선의 기울기를 끝(최대)의 기울기로 나눈 값이다. 곡선이 바뀌어도 따라간다
const SLOPE_STEP = 0.01;
const slope = (p: number) => {
  const a = Math.max(p - SLOPE_STEP, 0);
  const b = Math.min(p + SLOPE_STEP, 1);
  return (exit(b) - exit(a)) / (b - a);
};
const MAX_SLOPE = slope(1);

export interface RocketGeometry {
  /** 단추 크기(px) */
  width: number;
  height: number;
  /** 발사에서 오른쪽과 위로 각각 나가는 거리(px). 45도다 */
  distance: number;
}

export interface RocketBeat {
  phase: RocketPhase;
  /** 꼬리날개가 펴진 정도이자 분사구가 내려온 정도. 0에서 1(snap이라 끝 직전에 조금 넘친다) */
  fins: number;
  /** 불꽃 길이(기본 길이의 배수). 0이면 꺼졌다. 점화 뒤 깜빡이고 발사 중 속도에 따라 `FLAME_PEAK`까지 길어진다 */
  flame: number;
  /** 단추의 이동(px, 오른쪽과 아래가 +), 회전(도, 시계 방향 +), 배율 */
  x: number;
  y: number;
  rotation: number;
  scale: number;
  /** 연기를 내뿜는 중이다(불꽃이 켜진 동안) */
  smoke: boolean;
  /** 내뿜는 자리 [왼쪽 분사구, 오른쪽 분사구] 끝. 단추 중심 기준 px(이동·회전·배율을 걸기 전), 오른쪽과 아래가 + */
  smokeAt: readonly [{ x: number; y: number }, { x: number; y: number }];
  /** "보냈어요" 표지의 불투명도 0에서 1 */
  mark: number;
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const phaseAt = (t: number): RocketPhase => {
  if (t >= BEAT.sent) return 'sent';
  if (t >= BEAT.launch) return 'launch';
  if (t >= BEAT.hover) return 'hover';
  if (t >= BEAT.ignite) return 'ignite';
  if (t >= BEAT.fins) return 'fins';
  return 'crouch';
};

/** 둥실의 위아래(px, 아래가 +) */
const bobAt = (t: number) => {
  const u = clamp01((t - BEAT.hover) / HOVER_FOR);
  for (let i = 1; i < BOB_STOPS.length; i++) {
    const from = BOB_STOPS[i - 1];
    const to = BOB_STOPS[i];
    if (u <= to.u) {
      return from.y + (to.y - from.y) * drift((u - from.u) / (to.u - from.u));
    }
  }
  return 0;
};

export const rocketBeat = (
  tMs: number,
  geometry: RocketGeometry
): RocketBeat => {
  const phase = phaseAt(tMs);
  // 보냈어요 단계에서도 자세는 발사 끝에 머문다
  const t = Math.min(Math.max(tMs, 0), BEAT.sent);

  // 단추의 웅크림과 풀림(풀림은 꼬리날개가 펴지기 시작하는 구간에서 snap으로)
  let x = 0;
  let y = 0;
  let scale = 1;
  if (t < BEAT.fins) {
    const p = settle(clamp01(t / FAST));
    x = CROUCH.x * p;
    y = CROUCH.y * p;
    scale = 1 + (CROUCH.scale - 1) * p;
  } else if (t < BEAT.fins + FAST) {
    const p = snap((t - BEAT.fins) / FAST);
    x = CROUCH.x * (1 - p);
    y = CROUCH.y * (1 - p);
    scale = CROUCH.scale + (1 - CROUCH.scale) * p;
  }

  // 떠오름과 둥실
  y += -RISE * spring(clamp01((t - BEAT.ignite) / SLOWER)) + bobAt(t);

  // 발사
  let rotation = 0;
  let speed = 0;
  if (t >= BEAT.launch) {
    const p = (t - BEAT.launch) / LAUNCH_FOR;
    const travel = geometry.distance * exit(p);
    x += travel;
    y -= travel;
    rotation = TILT * settle(p);
    scale = 1 + (FAR_SCALE - 1) * p;
    speed = clamp01(slope(p) / MAX_SLOPE);
  }

  // 불꽃: 점화(fast, settle)로 켜진 뒤 깜빡이고 발사 속도만큼 길어진다. 보냈어요에서는 꺼진다
  const lit = settle(clamp01((t - BEAT.ignite) / FAST));
  const flame =
    tMs >= BEAT.sent ? 0 : lit * (1 + FLICKER * wave(t) + STRETCH * speed);

  const nozzle = {
    x: geometry.width * NOZZLE_X,
    y: geometry.height * (0.5 + NOZZLE_RATIO),
  };

  return {
    phase,
    fins: snap(clamp01((t - BEAT.fins) / SLOW)),
    flame,
    x,
    y,
    rotation,
    scale,
    smoke: flame > 0,
    smokeAt: [
      { x: -nozzle.x, y: nozzle.y },
      { x: nozzle.x, y: nozzle.y },
    ],
    mark: settle(clamp01((tMs - BEAT.sent) / BASE)),
  };
};
