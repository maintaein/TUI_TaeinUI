import { gsap } from 'gsap';
import { gsapDuration, gsapEasing } from '../../tokens/gsapEasing';

// 로켓 박자 하나에서 단추의 움직임, 분출 심지 길이, 연기 내뿜기, 표지를 함께 뽑는 순수 함수(설계서 8절 로켓 전송).
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

export type RocketPhase = 'emerge' | 'build' | 'launch' | 'sent';

/**
 * 단계 시작 시각(ms). 전부 토큰 시간의 배수다.
 * - emerge: 분사구가 단추 아래 테두리에서 빠져나온다. 2 x slow(사용자 요구는 slow 이상)
 * - build: 서서히 분출하고 연기가 쌓인다. 4 x slower(사용자 요구는 1초 이상 넉넉하게)
 * - launch: 무겁게 천천히 떠올라 가속한다. 5 x slower
 * 떠오름 넘침과 둥실은 뺐다(사용자 순서에 없다)
 */
export const BEAT = {
  emerge: 0,
  build: 2 * SLOW,
  launch: 2 * SLOW + 4 * SLOWER,
  sent: 2 * SLOW + 9 * SLOWER,
} as const;
/** 표지가 다 떠오르는 시각(ms). 시계는 여기서 끝난다 */
export const BEAT_END = BEAT.sent + BASE;

/** 눌렀다 뗀 click이 이어받는 웅크림 자세 */
export const CROUCH = { x: -2, y: 2, scale: 0.97 } as const;
/** 웅크림이 풀리는 정도 1에서 0. 풀림은 fast 동안 settle이다 */
export const crouchWeight = (tMs: number) =>
  1 - settle(Math.min(1, Math.max(0, tMs / FAST)));

// 발사: 추력이 커져 가속한다. 위로 가는 거리는 p^2와 p^3의 합이라 속도가 처음 0에서 단조 증가하고(무겁게 천천히 뜬다),
// 오른쪽은 p^4라 가속을 늦게 키워 처음엔 곧게 오르다 서서히 휜다. 끝 진행각은 atan(0.4)로 약 22도다.
// 기울기는 그 순간 속도 방향을 따르되 TILT_MAX로 묶는다(영상은 속도 방향으로 15~20도, 느려지면 수평)
const LAUNCH_FOR = BEAT.sent - BEAT.launch;
const THRUST_GROWTH = 1.5;
const SWAY = 0.26;
const TILT_MAX = 20;
// 끝에서 0.85배: 멀어지는 느낌만 주는 약한 원근(영상 실측 없음, 0.6은 단추가 너무 빨리 작아져 읽기 어려웠다)
const FAR_SCALE = 0.85;
const lift = (p: number) =>
  (p * p + THRUST_GROWTH * p ** 3) / (1 + THRUST_GROWTH);
const liftSpeed = (p: number) =>
  (2 * p + 3 * THRUST_GROWTH * p * p) / (1 + THRUST_GROWTH);
const sway = (p: number) => SWAY * p ** 4;
const swaySpeed = (p: number) => 4 * SWAY * p ** 3;
const END_SPEED = Math.hypot(liftSpeed(1), swaySpeed(1));

// 분사구 둘: 단추 폭 중심에서 좌우 30% 자리의 작은 덩이(단추 몸체 뒤). 크기는 단추 높이의 비로, 높이 44px 기준 14 x 8px
// (영상의 작은 분사구를 눈대중으로 옮긴 값)이고 위쪽 NOZZLE_TUCK만큼은 몸체 밑면에 가려진다. 입은 덩이 아랫면의 얇고 납작한 틈이다
export const NOZZLE_X = 0.3;
export const NOZZLE_WIDTH = 14 / 44;
export const NOZZLE_HEIGHT = 8 / 44;
export const NOZZLE_TUCK = 3 / 44;
export const MOUTH_WIDTH = 0.5;
export const MOUTH_HEIGHT = 2 / 44;
// 분출은 불꽃 줄기가 아니라 입 바로 아래의 짧은 심지와 둘레의 빛무리다(사용자: 가늘고 길게 하는 게 아니라 광휘처럼).
// 심지 길이는 분출 세기에 따라 단추 높이의 WICK_MIN~WICK_MAX배이고 WICK_FLICKER 비율로 빠르게 깜빡인다
const WICK_MIN = 0.2;
const WICK_MAX = 0.5;
const WICK_FLICKER = 0.1;
/** 심지가 가질 수 있는 가장 긴 길이(단추 높이의 배). DOM 심지 요소의 높이이고 길이는 scaleY로 맞춘다 */
export const WICK_LONGEST = WICK_MAX * (1 + WICK_FLICKER);
/** 발사 거리에 더하는 여유(px): 먼 빛무리(반지름 약 100px)까지 레이어 밖으로 나가는 데 필요한 길이 */
export const JET_REACH = 100;

// 가상의 땅: 분사구 입에서 GROUND_DROP(px) 아래, 단추가 있던 자리 기준으로 고정이다(비행 내내 같은 높이).
// 심지(최대 약 24px)보다 조금 더 깊어 분출이 땅에 막 닿는 모양이다
const GROUND_DROP = 34;
// 분출이 땅에 닿는 세기는 올라간 높이(px)에 따라 1 / (1 + 높이 / ALTITUDE_HALF)로 줄어든다. 150px에서 절반이다(눈대중)
const ALTITUDE_HALF = 150;
// 연기: 땅 연기는 두 분사구 아래 땅에서 양옆으로 PAD_ROLL(CSS px/초)로 구르며 PAD_GAP(ms) / 세기 간격으로 내보낸다
// (세기가 낮아도 GAP_FLOOR 아래로는 떨어지지 않아 최대 PAD_GAP / GAP_FLOOR 간격이다). 간격이 짧으면 무대가 덮였다(M7.1 T8 로켓 60ms).
// 꼬리 연기는 발사 중에만 심지 끝 한가운데에서 몸체 아래 방향으로 JET_PUSH로 TAIL_GAP 간격으로 한 방울씩 내보낸다(땅 연기보다 약하게:
// 방울 수가 절반이다). 가장 빠를 때도 TAIL_GAP 동안 움직이는 거리가 방울 반지름(30px)의 두 배 안쪽이라 점선이 안 된다
const PAD_GAP = 100;
const GAP_FLOOR = 0.2;
const PAD_ROLL = 320;
const JET_PUSH = 500;
const TAIL_GAP = 70;
// 발사 속도(0에서 1)가 이보다 느리면 꼬리 연기를 내지 않는다(막 뜰 때는 땅 연기가 맡는다)
const TAIL_MIN_SPEED = 0.12;

/** 시각 t의 결정적인 깜빡임 -1에서 1. 난수가 아니라 서로 다른 주기(약 50ms, 82ms)의 사인 둘이라 빠르게 떨고 시험이 같은 값을 본다 */
const wave = (t: number) => (Math.sin(t / 8) + Math.sin(t / 13 + 2)) / 2;

export interface RocketGeometry {
  /** 단추 크기(px) */
  width: number;
  height: number;
  /** 발사에서 위로 나가는 거리(px). 단추가 빛무리까지 레이어 밖으로 나가는 거리다 */
  distance: number;
}

/** 연기 한 방울: 원래 자리의 단추 중심 기준 위치(px)와 방향(CSS px/초). 오른쪽과 아래가 + */
export interface Puff {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

/** 연기 한 갈래: `gap`(ms)은 내보내는 최소 간격이고 `puffs`가 비어 있으면 내보내지 않는다 */
export interface SmokeChannel {
  gap: number;
  puffs: readonly Puff[];
}

/** 분사구 입 한 곳: 원래 자리의 단추 중심 기준 위치(px)와 분출 방향(단위 벡터, 몸체 아래 방향) */
export interface Mouth {
  x: number;
  y: number;
  dx: number;
  dy: number;
}

export interface RocketBeat {
  phase: RocketPhase;
  /** 분사구가 단추 아래 테두리에서 빠져나온 정도 0에서 1 */
  nozzle: number;
  /** 서서히 오르는 분출 세기 0에서 1. 0이면 분출도 연기도 없다 */
  strength: number;
  /** 단추 이동(px, 오른쪽과 아래가 +) */
  x: number;
  y: number;
  /** 회전(도, 시계 방향 +). 발사 속도 방향을 따르고 `TILT_MAX`를 넘지 않는다 */
  rotation: number;
  scale: number;
  /** 입 아래 심지 길이(px, 단추 기준: 배율 전). 0이면 꺼졌다 */
  wick: number;
  /** 분사구 입 둘(왼쪽, 오른쪽). 기울기와 배율과 이동이 반영된 자리라 엔진의 분출 위치다 */
  mouths: readonly [Mouth, Mouth];
  /** 가상의 땅의 y(px, 단추 중심 기준). 비행 내내 같다 */
  groundY: number;
  /** 입에서 땅까지 이어지는 배기 기둥의 짙기 0에서 1. 올라갈수록 옅어지고 비행이 끝나면 0이다 */
  column: number;
  smoke: {
    /** 가상의 땅에 닿는 분출이 양옆으로 구르는 연기. 올라간 높이에 따라 줄어든다 */
    ground: SmokeChannel;
    /** 발사 중 심지 끝에서 몸체 아래 방향으로 남기는 꼬리. 땅 연기보다 약하다 */
    tail: SmokeChannel;
  };
  /** "보냈어요" 표지의 불투명도 0에서 1 */
  mark: number;
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const phaseAt = (t: number): RocketPhase => {
  if (t >= BEAT.sent) return 'sent';
  if (t >= BEAT.launch) return 'launch';
  if (t >= BEAT.build) return 'build';
  return 'emerge';
};

const NONE: SmokeChannel = { gap: Infinity, puffs: [] };

export const rocketBeat = (
  tMs: number,
  geometry: RocketGeometry
): RocketBeat => {
  const phase = phaseAt(tMs);
  // 보냈어요 단계에서도 자세는 발사 끝에 머문다
  const t = Math.min(Math.max(tMs, 0), BEAT.sent);

  // 분사구: 테두리에서 빠져나옴(settle). 그동안 분출도 연기도 없다
  const nozzle = settle(
    clamp01((t - BEAT.emerge) / (BEAT.build - BEAT.emerge))
  );
  // 분출 세기: build 동안 코사인으로 0에서 1로 서서히 오른다(단조, 양끝 기울기 0이라 급등이 없다). 발사 중에는 1
  const strength =
    tMs >= BEAT.sent
      ? 0
      : 0.5 -
        0.5 *
          Math.cos(
            Math.PI * clamp01((t - BEAT.build) / (BEAT.launch - BEAT.build))
          );

  // 발사
  const p = clamp01((t - BEAT.launch) / LAUNCH_FOR);
  const x = geometry.distance * sway(p);
  const y = -geometry.distance * lift(p);
  const speed = Math.hypot(liftSpeed(p), swaySpeed(p)) / END_SPEED;
  const heading = (Math.atan2(swaySpeed(p), liftSpeed(p)) * 180) / Math.PI;
  const rotation = Math.min(TILT_MAX, heading);
  const scale = 1 + (FAR_SCALE - 1) * p * p;

  const wick =
    strength === 0
      ? 0
      : geometry.height *
        (WICK_MIN + (WICK_MAX - WICK_MIN) * strength) *
        (1 + WICK_FLICKER * wave(t));

  // 입: 덩이가 끝까지 나왔을 때 아랫면(몸체 밑면에서 덩이 높이 - 가려진 만큼 아래)
  const mouthY = geometry.height * (0.5 + NOZZLE_HEIGHT - NOZZLE_TUCK);
  const groundY = mouthY + GROUND_DROP;
  const rad = (rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const mouth = (side: number): Mouth => {
    const lx = side * geometry.width * NOZZLE_X;
    return {
      x: x + scale * (lx * cos - mouthY * sin),
      y: y + scale * (lx * sin + mouthY * cos),
      dx: -sin,
      dy: cos,
    };
  };
  const mouths: readonly [Mouth, Mouth] = [mouth(-1), mouth(1)];
  const column =
    strength === 0
      ? 0
      : (strength / (1 + Math.max(0, -y) / ALTITUDE_HALF)) * (1 - p * p);

  // 연기
  const mouthXs = [-1, 1].map((side) => side * geometry.width * NOZZLE_X);
  const ground =
    strength === 0
      ? NONE
      : {
          // 땅에 닿는 세기는 올라간 높이에 따라 줄어든다. 세기가 낮으면 간격이 벌어진다
          gap:
            PAD_GAP /
            Math.max(
              strength / (1 + Math.max(0, -y) / ALTITUDE_HALF),
              GAP_FLOOR
            ),
          // 땅은 단추가 있던 자리 기준으로 고정이고 로켓 바로 아래(x는 로켓을 따라간다)에서 양옆으로 구른다
          puffs: mouthXs.map((mx) => ({
            x: x + mx,
            y: groundY,
            vx: Math.sign(mx) * PAD_ROLL,
            vy: 0,
          })),
        };
  let tail = NONE;
  if (strength > 0 && speed > TAIL_MIN_SPEED) {
    // 심지 끝 한가운데: 단추 중심 기준 자리에 기울기와 배율을 걸고 이동을 더한다. 연기는 몸체 아래 방향으로 나간다
    const ly = mouthY + wick;
    tail = {
      gap: TAIL_GAP,
      puffs: [
        {
          x: x - scale * ly * sin,
          y: y + scale * ly * cos,
          vx: -sin * JET_PUSH,
          vy: cos * JET_PUSH,
        },
      ],
    };
  }

  return {
    phase,
    nozzle,
    strength,
    x,
    y,
    rotation,
    scale,
    wick,
    mouths,
    groundY,
    column,
    smoke: { ground, tail },
    mark: settle(clamp01((tMs - BEAT.sent) / BASE)),
  };
};
