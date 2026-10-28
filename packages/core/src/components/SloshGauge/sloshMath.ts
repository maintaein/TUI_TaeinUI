// 수면 좌표계. 물 svg의 viewBox가 100 x 160이다(통 비율 1 : 1.6과 같다).
export const VIEW_W = 100;
export const VIEW_H = 160;

// 출렁임 진폭의 상한. 통 높이의 8%다. 이보다 크면 낮은 수위에서 물이 바닥 밖으로 드러나고 높은 수위에서는
// 통 위로 넘쳐 "게이지"가 아니라 "철렁이는 물"로 읽힌다. 출렁임은 값이 바뀔 때만 생기고 바뀐 양만큼 커지되
// 연속 변경에서도 이 값을 넘지 못한다(사용자 결정 2026-10-27).
export const MAX_AMP = 0.08;

// 바뀐 양(범위에 대한 비율) 대비 진폭. 범위의 32%만 움직여도 상한에 닿는다.
// 1%씩 오르는 진행률은 0.25%로 거의 안 보이고 20에서 90 같은 큰 변경은 상한까지 출렁인다.
export const GAIN = 0.25;

// 한 번의 출렁임에서 쏠림이 오가는 횟수와 물결이 흘러가는 바퀴 수(마지막 변경 뒤 loop.base 동안)
export const SWAY_TURNS = 2;
export const FLOW_TURNS = 2;

// 수면 높이의 변위 중 기울기가 맡는 몫. 나머지는 물결이 맡아 둘의 합이 진폭을 넘지 않는다.
const TILT_SHARE = 0.6;
// 통 폭에 걸리는 물결 수
const WAVES = 2;
const STEP = 2.5;

/** 바뀐 양(범위 비율, 부호 있음) -> 첫 쏠림의 부호 있는 진폭. 바뀐 양에 비례하고 상한에서 잘린다. */
export const sloshKick = (change: number): number =>
  Math.sign(change) * Math.min(Math.abs(change) * GAIN, MAX_AMP);

export interface SloshState {
  amp: number;
  phi: number;
}

/**
 * 진행 중인 출렁임(진폭 amp, 위상 phi: 기울기 = amp x cos phi)에 새 킥을 더한다.
 * 기울기를 그대로 이어 더하므로 변경 순간 수면이 튀지 않고, 합은 상한에서 잘린다.
 */
export const addKick = ({ amp, phi }: SloshState, kick: number): SloshState => {
  const x = amp * Math.cos(phi) + kick;
  const y = amp * Math.sin(phi);
  return { amp: Math.min(Math.hypot(x, y), MAX_AMP), phi: Math.atan2(y, x) };
};

/**
 * 수면의 y(viewBox 좌표). level은 0~1, amp는 통 높이 비율, phi는 기울기 위상, flow는 물결 위상.
 * phi 0이면 왼쪽이 높다(오른쪽 y가 크다).
 */
export const surfaceY = (
  x: number,
  level: number,
  amp: number,
  phi: number,
  flow: number
): number => {
  const half = VIEW_W / 2;
  const tilt = Math.cos(phi) * ((x - half) / half);
  const wave = Math.sin((2 * Math.PI * WAVES * x) / VIEW_W - flow);
  return (
    VIEW_H * (1 - level) +
    VIEW_H * amp * (TILT_SHARE * tilt + (1 - TILT_SHARE) * wave)
  );
};

/** 물 path의 d. 수면 곡선을 따라 그린 뒤 바닥 모서리 둘로 닫는다. */
export const surfacePath = (
  level: number,
  amp: number,
  phi: number,
  flow: number
): string => {
  let d = '';
  for (let x = 0; x <= VIEW_W; x += STEP) {
    const y = surfaceY(x, level, amp, phi, flow).toFixed(2);
    d += `${x === 0 ? 'M' : 'L'}${x} ${y}`;
  }
  return `${d}L${VIEW_W} ${VIEW_H + 1}L0 ${VIEW_H + 1}Z`;
};
