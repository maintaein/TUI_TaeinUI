import { gsap } from 'gsap';
import { gsapDuration, gsapEasing } from '../../tokens/gsapEasing';

// 로켓 박자 하나에서 단추의 움직임, 불꽃 길이, 연기 내뿜기, 표지를 함께 뽑는 순수 함수(설계서 8절 로켓 전송).
// 시각 t(ms, 누른 순간 0)만 받는다. 움직임은 이징 곡선이 아니라 물리 모형(용수철, 추력)이고 난수가 없어
// 같은 t에는 늘 같은 값이다. 이징은 토큰 settle을 gsap.parseEase로 평가할 뿐 시계를 돌리지 않는다.

const ms = (seconds: number) => Math.round(seconds * 1000);
const FAST = ms(gsapDuration.fast);
const BASE = ms(gsapDuration.base);
const SLOW = ms(gsapDuration.slow);
const SLOWER = ms(gsapDuration.slower);

const settle = gsap.parseEase(gsapEasing.settle);
// 시험이 토큰 이름을 직접 적어 기대값을 계산하는 길(시험 파일은 gsap을 직접 import하지 않는다)
export const easeAt = (
  token: (typeof gsapEasing)[keyof typeof gsapEasing],
  p: number
) => gsap.parseEase(token)(p);

export type RocketPhase = 'ignite' | 'rise' | 'hover' | 'launch' | 'sent';

/**
 * 단계 시작 시각(ms). 토큰 시간과 그 배수다: 점화 4 x fast, 떠오름 slower, 둥실은 10 x slow에 끝나고,
 * 발사는 4 x slower다. 영상은 불꽃이 켜진 채 약 300ms에 뜨지만 무게감이 있게 점화를 길게 잡았다
 */
export const BEAT = {
  ignite: 0,
  rise: 4 * FAST,
  hover: 4 * FAST + SLOWER,
  launch: 10 * SLOW,
  sent: 10 * SLOW + 4 * SLOWER,
} as const;
/** 표지가 다 떠오르는 시각(ms). 시계는 여기서 끝난다 */
export const BEAT_END = BEAT.sent + BASE;

/** 눌렀다 뗀 click이 이어받는 웅크림 자세 */
export const CROUCH = { x: -2, y: 2, scale: 0.97 } as const;
/** 웅크림이 풀리는 정도 1에서 0. 풀림은 fast 동안 settle이다 */
export const crouchWeight = (tMs: number) =>
  1 - settle(Math.min(1, Math.max(0, tMs / FAST)));

// 점화: 불꽃이 발사대에 닿는 동안 단추가 떤다. 떨림은 점화 중간에 가장 크고(사인 한 봉우리) 뜨기 직전에 잦아든다
const SHAKE = 0.8;

// 떠오름: 용수철이 RISE(영상 실측 24px)까지 끌어올린다. 먼저 OVERSHOOT(영상은 3~4px 내려앉는다)만큼 넘쳤다 선다.
// 넘침 비율에서 감쇠비가, 첫 꼭짓점 시각(SLOW, 영상은 약 300ms)에서 진동수가 나온다
const RISE = 24;
const OVERSHOOT = 3;
const LOG_OVER = Math.log(OVERSHOOT / RISE);
const ZETA = -LOG_OVER / Math.hypot(Math.PI, LOG_OVER);
const OMEGA_D = Math.PI / (SLOW / 1000);
const DECAY = (ZETA * OMEGA_D) / Math.sqrt(1 - ZETA * ZETA);
const springUp = (seconds: number) =>
  seconds <= 0
    ? 0
    : 1 -
      Math.exp(-DECAY * seconds) *
        (Math.cos(OMEGA_D * seconds) +
          (DECAY / OMEGA_D) * Math.sin(OMEGA_D * seconds));

// 둥실: 영상은 3초 가까이 +-1~2px다. 둥실 구간에 사인이 한 번 반(1.5 주기) 돌아 처음과 끝이 0이다
const BOB = 1.5;
const HOVER_FOR = BEAT.launch - BEAT.hover;

// 발사: 추력이 커져 가속한다. 위로 가는 거리는 p^2와 p^3의 합이라 속도가 처음 0에서 단조 증가하고,
// 오른쪽은 p^4라 가속을 늦게 키워 처음엔 곧게 오르다 서서히 휜다. 끝 진행각은 atan(0.4)로 약 22도다.
// 기울기는 그 순간 속도 방향을 따르되 TILT_MAX로 묶는다(영상은 속도 방향으로 15~20도, 느려지면 수평)
const LAUNCH_FOR = BEAT.sent - BEAT.launch;
const THRUST_GROWTH = 1.5;
const SWAY = 0.26;
const TILT_MAX = 20;
const FAR_SCALE = 0.85;
const lift = (p: number) =>
  (p * p + THRUST_GROWTH * p ** 3) / (1 + THRUST_GROWTH);
const liftSpeed = (p: number) =>
  (2 * p + 3 * THRUST_GROWTH * p * p) / (1 + THRUST_GROWTH);
const sway = (p: number) => SWAY * p ** 4;
const swaySpeed = (p: number) => 4 * SWAY * p ** 3;
const END_SPEED = Math.hypot(liftSpeed(1), swaySpeed(1));

// 분사구 둘: 단추 밑면 폭의 1/3, 2/3 자리(중심 기준 +-폭/6), 아래로 벌어지는 사다리꼴. 크기는 단추 폭과 높이의 비다
export const NOZZLE_X = 1 / 6;
export const NOZZLE_HEIGHT = 0.16;
export const NOZZLE_BOTTOM = 0.17;
export const FLAME_WIDTH = 0.15;

// 불꽃(px): 발사대는 분사구 끝에서 SEAT 아래의 면이다. 불꽃은 단추가 앉은 자리에서 발사대까지, 떠오르면 그만큼 더 길게 닿는다
// (영상은 단추 높이의 2~3배로 바닥까지 닿는다). 발사 중에는 속도에 비례해 STRETCH까지 길어진다. 길이는 FLICKER 비율로 떨린다
const SEAT = 52;
const STRETCH = 80;
const FLICKER = 0.08;
/** 불꽃이 가질 수 있는 가장 긴 길이(px). 불꽃 요소의 높이이고 길이는 scaleY로 맞춘다 */
export const FLAME_MAX = Math.ceil(
  (SEAT + RISE + OVERSHOOT + STRETCH) * (1 + FLICKER)
);
/** 발사 거리에 더하는 여유(px): 불꽃이 끝까지 레이어 밖으로 나가는 데 필요한 길이. 기울기와 배율로 줄어드는 폭은 단추 높이가 덮는다 */
export const FLAME_REACH = FLAME_MAX;

// 연기: 발사대에서는 두 분사구 아래에서 PAD_GAP(ms) 간격으로 양옆으로(바닥을 구르는 느낌), 발사 중에는 불꽃 끝에서
// TAIL_GAP 간격으로 몸체 아래 방향으로 JET_PUSH(CSS px/초)로 내보낸다. 매 프레임 내보내면 발사 첫머리(속도 0)에 한 자리로 몰려
// 큰 덩이가 되고 무대가 연기로 덮였다. 가장 빠를 때도 TAIL_GAP 동안 움직이는 거리(약 40px)가 방울 반지름(30px)과 비슷해 점선이 안 된다
const PAD_GAP = 100;
const TAIL_GAP = 50;
const PAD_ROLL = 320;
const JET_PUSH = 500;

/** 시각 t의 결정적인 깜빡임 -1에서 1. 난수가 아니라 서로 다른 주기(약 107ms, 182ms)의 사인 둘이라 시험이 같은 값을 본다 */
const wave = (t: number) => (Math.sin(t / 17) + Math.sin(t / 29 + 1)) / 2;

export interface RocketGeometry {
  /** 단추 크기(px) */
  width: number;
  height: number;
  /** 발사에서 위로 나가는 거리(px). 단추가 불꽃 끝까지 레이어 밖으로 나가는 거리다 */
  distance: number;
}

/** 연기 한 방울: 원래 자리의 단추 중심 기준 위치(px)와 방향(CSS px/초). 오른쪽과 아래가 + */
export interface Puff {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface RocketBeat {
  phase: RocketPhase;
  /** 단추 이동(px, 오른쪽과 아래가 +). 점화 떨림이 들어 있다 */
  x: number;
  y: number;
  /** 회전(도, 시계 방향 +). 발사 속도 방향을 따르고 `TILT_MAX`를 넘지 않는다 */
  rotation: number;
  scale: number;
  /** 불꽃 길이(px). 0이면 꺼졌다 */
  flame: number;
  /** 지금 내보낼 연기. `gap`(ms)은 내보내는 최소 간격, 비어 있으면 내보내지 않는다 */
  smoke: { gap: number; puffs: readonly Puff[] };
  /** "보냈어요" 표지의 불투명도 0에서 1 */
  mark: number;
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const phaseAt = (t: number): RocketPhase => {
  if (t >= BEAT.sent) return 'sent';
  if (t >= BEAT.launch) return 'launch';
  if (t >= BEAT.hover) return 'hover';
  if (t >= BEAT.rise) return 'rise';
  return 'ignite';
};

export const rocketBeat = (
  tMs: number,
  geometry: RocketGeometry
): RocketBeat => {
  const phase = phaseAt(tMs);
  // 보냈어요 단계에서도 자세는 발사 끝에 머문다
  const t = Math.min(Math.max(tMs, 0), BEAT.sent);

  // 점화 떨림
  const fade = t < BEAT.rise ? Math.sin((Math.PI * t) / BEAT.rise) : 0;
  const shakeX = SHAKE * fade * ((Math.sin(t / 7) + Math.sin(t / 11 + 2)) / 2);
  const shakeY = SHAKE * fade * ((Math.sin(t / 9 + 1) + Math.sin(t / 13)) / 2);

  // 떠오른 높이(위가 +): 용수철과 둥실
  const u = clamp01((t - BEAT.hover) / HOVER_FOR);
  const height =
    RISE * springUp((t - BEAT.rise) / 1000) + BOB * Math.sin(3 * Math.PI * u);

  // 발사
  const p = clamp01((t - BEAT.launch) / LAUNCH_FOR);
  const climb = geometry.distance * lift(p);
  const drift = geometry.distance * sway(p);
  const speed = Math.hypot(liftSpeed(p), swaySpeed(p)) / END_SPEED;
  const heading = (Math.atan2(swaySpeed(p), liftSpeed(p)) * 180) / Math.PI;
  const rotation = Math.min(TILT_MAX, heading);
  const scale = 1 + (FAR_SCALE - 1) * p * p;

  const x = shakeX + drift;
  const y = shakeY - height - climb;

  // 불꽃: 점화로 발사대에 닿고, 떠오른 높이만큼 길어지며, 발사 속도만큼 더 길어진다
  const lit = settle(clamp01(t / BEAT.rise));
  const flame =
    tMs >= BEAT.sent
      ? 0
      : (lit * (SEAT + height) + STRETCH * speed) * (1 + FLICKER * wave(t));

  // 연기
  const halfHeight = geometry.height / 2;
  const nozzleTip = halfHeight + geometry.height * NOZZLE_HEIGHT;
  const mouths = [-1, 1].map((side) => side * geometry.width * NOZZLE_X);
  let puffs: Puff[] = [];
  let gap = Infinity;
  if (flame > 0 && phase !== 'launch') {
    // 발사대: 단추가 있던 자리의 분사구 끝에서 SEAT 아래
    gap = PAD_GAP / Math.max(lit, 0.3);
    puffs = mouths.map((mx) => ({
      x: mx,
      y: nozzleTip + SEAT,
      vx: Math.sign(mx) * PAD_ROLL,
      vy: 0,
    }));
  } else if (flame > 0) {
    // 불꽃 끝: 단추 중심 기준 자리에 기울기와 배율을 걸고 이동을 더한다. 연기는 몸체 아래 방향으로 나간다
    gap = TAIL_GAP;
    const rad = (rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    puffs = mouths.map((mx) => {
      const ly = nozzleTip + flame;
      return {
        x: x + scale * (mx * cos - ly * sin),
        y: y + scale * (mx * sin + ly * cos),
        vx: -sin * JET_PUSH,
        vy: cos * JET_PUSH,
      };
    });
  }

  return {
    phase,
    x,
    y,
    rotation,
    scale,
    flame,
    smoke: { gap, puffs },
    mark: settle(clamp01((tMs - BEAT.sent) / BASE)),
  };
};
