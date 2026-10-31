// 물 장면의 순수 계산. 좌표계는 물방울 그릇의 viewBox(가로 100, 세로 160)이고 y는 아래로 커진다.
// 참고 영상(water.mp4)의 실측은 water-spec-notes.md의 것이고, 아래 상수마다 그 근거를 적는다.

const BOWL_W = 100;
export const BOWL_H = 160;

// 물방울 윤곽: 위(50, 0)가 뾰족하고 아래가 반지름 50의 원. 꼭짓점에서 원에 접선을 그었다.
const R = 50;
const CX = BOWL_W / 2;
const CY = BOWL_H - R;
const TANGENT_Y = CY - (R * R) / CY; // 접점의 y. 꼭짓점-원 중심 거리가 CY이므로 접점은 CY - R^2 / CY
const TANGENT_HALF = (R * Math.sqrt(CY * CY - R * R)) / CY;
export const DROP_PATH = `M${CX} 0L${CX + TANGENT_HALF} ${TANGENT_Y}A${R} ${R} 0 1 1 ${CX - TANGENT_HALF} ${TANGENT_Y}Z`;

const widthAt = (y: number) =>
  y <= TANGENT_Y
    ? (2 * TANGENT_HALF * y) / TANGENT_Y
    : 2 * Math.sqrt(Math.max(0, R * R - (y - CY) ** 2));

// 바닥에서 위로 쌓은 넓이. fill 하나당 수면 높이는 이 표를 거꾸로 읽어 얻는다
const SLICES = 320;
const dy = BOWL_H / SLICES;
const areaBelow = new Float64Array(SLICES + 1);
for (let i = 1; i <= SLICES; i += 1) {
  areaBelow[i] = areaBelow[i - 1] + widthAt(BOWL_H - (i - 0.5) * dy) * dy;
}

/** 넓이 비율(0~1) -> 수면 높이 비율(0~1). 아래가 넓은 물방울이라 50%의 수면은 높이 중간보다 아래다 */
export const levelForFill = (fill: number): number => {
  const target = Math.min(1, Math.max(0, fill)) * areaBelow[SLICES];
  let i = 1;
  while (i < SLICES && areaBelow[i] < target) i += 1;
  const span = areaBelow[i] - areaBelow[i - 1];
  const part = span > 0 ? (target - areaBelow[i - 1]) / span : 0;
  return (i - 1 + part) / SLICES;
};

// 수위 용수철. 영상 실측: stiffness 약 120, damping 약 10이면 목표를 약 20% 넘고 1.0~1.5초에 잔잔하다
const LEVEL_STIFFNESS = 120;
const LEVEL_DAMPING = 10;
// 기울기 용수철. 영상은 0.3~0.5초마다 반대로 흔들리며 감쇠한다: sqrt(90) rad/s는 반주기 0.33초
const TILT_STIFFNESS = 90;
const TILT_DAMPING = 7;
// 수위 속도(높이 비율/초) 당 수면 기울기(y/x). 영상의 15~20도(기울기 0.27~0.36)가 큰 변화의 정점에서 나오게 맞췄다
const TILT_PER_SPEED = 0.1;
const MAX_SLOPE = 0.36;
// 프레임 간격 상한(초). 탭 복귀나 부하로 간격이 커져도 용수철이 터지지 않게 묶는다
// ponytail: 0.05초 자르기라 20fps 아래의 느린 화면에서는 물이 실제보다 느리게 돈다, 그런 화면이 문제가 되면 자르기를 키우고 조각 수를 늘린다
export const MAX_DT = 0.05;
const SUBSTEP = 1 / 240;

// 쉴 때 늘 남는 잔물결의 높이(viewBox 단위). 영상의 8~12px(그릇 높이의 1.5%대)는 크다고 해서 그릇 높이의 1.25%로 줄였다
const REST_AMP = 2;
// 흔들릴 때 더해지는 물결 높이. 그릇 높이의 4.4%
const ACTIVE_AMP = 7;
// 물결 위상이 흐르는 속도(rad/s). 쉴 때는 느리게(주기 약 4초), 흔들릴 때는 빠르게
const REST_SPEED = 1.6;
const ACTIVE_SPEED = 5;
// 폭에 걸리는 물결 수. 영상 추천값: 파장 1.2와 0.7의 사인 두 겹이 반대 위상으로 흐른다
const FRONT_WAVES = 1.2;
const BACK_WAVES = 0.7;
// 앞 물결 높이에 대한 뒤 물결 높이. 영상의 뒤 물결이 한쪽으로 더 솟아 보인다
const BACK_AMP_RATIO = 1.2;
// 흔들림 세기 1에 해당하는 수위 속도와 기울기. 큰 변화(20에서 90)의 정점이 1 근처가 되게 맞췄다
const FULL_SPEED = 2.5;
const FULL_SLOPE = 0.3;

export const MAX_BUBBLES = 8;
// 흔들림 세기가 이 값을 넘을 때만 거품이 생긴다. 쉬는 동안(영상은 10~15개)은 0개다
const BUBBLE_THRESHOLD = 0.35;
// 세기 1일 때 초당 생기는 거품 수
const BUBBLE_RATE = 18;

export interface Bubble {
  x: number;
  y: number;
  r: number;
  rise: number;
}

export interface SloshSim {
  /** 수면 높이 비율 0~1(용수철 위치. 목표를 넘으면 1 위나 0 아래도 된다) */
  level: number;
  speed: number;
  /** 수면 기울기(y/x). 양수면 왼쪽이 높다 */
  tilt: number;
  tiltSpeed: number;
  phase: number;
  bubbles: Bubble[];
}

export const createSim = (level: number): SloshSim => ({
  level,
  speed: 0,
  tilt: 0,
  tiltSpeed: 0,
  phase: 0,
  bubbles: [],
});

interface Spring {
  x: number;
  v: number;
}

/** 용수철 한 걸음. 간격이 커도 터지지 않게 잘게 나눠 적분하고 dt는 MAX_DT에서 자른다 */
export const springStep = (
  state: Spring,
  target: number,
  dt: number,
  stiffness: number,
  damping: number
): void => {
  // ponytail: stepSlosh도 같은 자르기를 해 중복이다, springStep을 단독으로 쓰지 않게 되면 한 곳만 남긴다
  const total = Math.min(MAX_DT, Math.max(0, dt));
  const steps = Math.max(1, Math.ceil(total / SUBSTEP));
  const h = total / steps;
  for (let i = 0; i < steps; i += 1) {
    state.v += (stiffness * (target - state.x) - damping * state.v) * h;
    state.x += state.v * h;
  }
};

/** 흔들림 세기 0~1. 수위 속도와 기울기에서 곧바로 읽으므로 값이 자주 바뀌어도 쌓이지 않는다 */
export const agitation = ({ speed, tilt }: SloshSim): number =>
  Math.min(1, Math.hypot(speed / FULL_SPEED, tilt / FULL_SLOPE));

/** 수위만 목표에 바로 둔다(축소 모션, 멈춤 중의 값 변경). 기울기와 물결은 지금 모습 그대로다 */
export const settleSim = (sim: SloshSim, level: number): void => {
  sim.level = level;
  sim.speed = 0;
};

/** 시뮬레이션 한 걸음 */
export const stepSlosh = (
  sim: SloshSim,
  target: number,
  dt: number,
  random: () => number = Math.random
): void => {
  const total = Math.min(MAX_DT, Math.max(0, dt));
  const level = { x: sim.level, v: sim.speed };
  springStep(level, target, total, LEVEL_STIFFNESS, LEVEL_DAMPING);
  sim.level = level.x;
  sim.speed = level.v;

  // 오를 때 왼쪽이 높다: 기울기의 목표는 수위 속도에 비례한다
  const slope = { x: sim.tilt, v: sim.tiltSpeed };
  const tiltTarget = Math.max(
    -MAX_SLOPE,
    Math.min(MAX_SLOPE, sim.speed * TILT_PER_SPEED)
  );
  springStep(slope, tiltTarget, total, TILT_STIFFNESS, TILT_DAMPING);
  sim.tilt = slope.x;
  sim.tiltSpeed = slope.v;

  const energy = agitation(sim);
  sim.phase += total * (REST_SPEED + (ACTIVE_SPEED - REST_SPEED) * energy);

  // 거품: 바닥에서 떠올라 수면 아래에서 사라진다. 세기가 문턱을 넘을 때만 생기고 8개를 넘지 않는다
  const surface = BOWL_H * (1 - clampLevel(sim.level));
  sim.bubbles = sim.bubbles
    .map((b) => ({ ...b, y: b.y - b.rise * total }))
    .filter((b) => b.y - b.r > surface);
  const excess = (energy - BUBBLE_THRESHOLD) / (1 - BUBBLE_THRESHOLD);
  if (
    excess > 0 &&
    sim.bubbles.length < MAX_BUBBLES &&
    random() < excess * BUBBLE_RATE * total
  ) {
    // 반지름 2.5~6: 120px 폭 그릇에서 3~8px 느낌
    // ponytail: 거품이 좌우로 흔들리지 않고 곧게만 오른다, 영상만큼의 사실감이 필요해지면 x에 사인 흔들림을 더한다
    const r = 2.5 + random() * 3.5;
    sim.bubbles.push({
      x: 30 + random() * 40,
      y: BOWL_H - 10,
      r,
      rise: 30 + random() * 20,
    });
  }
};

const clampLevel = (level: number) => Math.min(1, Math.max(0, level));

export interface ScenePaths {
  back: string;
  front: string;
  rim: string;
  /** 그릇 전체에 거는 transform. 큰 변화 때 1도 남짓 기울고 1% 미만 늘어난다 */
  bowl: string;
  bubbles: Bubble[];
}

/** x에서의 수면 y. calm이면 잔물결 없이 평평하다 */
export const surfaceY = (
  x: number,
  sim: SloshSim,
  layer: 'front' | 'back',
  calm = false
): number => {
  const level = clampLevel(sim.level);
  // 거의 빈 그릇에서는 물결이 바닥 밖으로 드러나지 않게 줄인다
  const fade = Math.min(1, level * 12);
  const amp = calm ? 0 : (REST_AMP + ACTIVE_AMP * agitation(sim)) * fade;
  const base = BOWL_H * (1 - level) + (calm ? 0 : sim.tilt * (x - CX));
  const turn = (2 * Math.PI * x) / BOWL_W;
  return layer === 'front'
    ? base + amp * Math.sin(turn * FRONT_WAVES + sim.phase)
    : base +
        amp *
          BACK_AMP_RATIO *
          Math.sin(
            turn * BACK_WAVES - sim.phase * (BACK_WAVES / FRONT_WAVES) + 1.3
          );
};

const X0 = -6;
const X1 = BOWL_W + 6;
const STEP = 7;

/** 점들을 지나는 매끈한 곡선(Catmull-Rom을 3차 베지어로 바꾼다). 직선 조각 꺾임이 보이지 않는다 */
export const smoothPath = (
  points: ReadonlyArray<readonly [number, number]>
) => {
  let d = `M${points[0][0]} ${points[0][1].toFixed(2)}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const before = points[Math.max(i - 1, 0)];
    const p = points[i];
    const next = points[i + 1];
    const after = points[Math.min(i + 2, points.length - 1)];
    d +=
      `C${(p[0] + (next[0] - before[0]) / 6).toFixed(2)} ${(p[1] + (next[1] - before[1]) / 6).toFixed(2)}` +
      ` ${(next[0] - (after[0] - p[0]) / 6).toFixed(2)} ${(next[1] - (after[1] - p[1]) / 6).toFixed(2)}` +
      ` ${next[0]} ${next[1].toFixed(2)}`;
  }
  return d;
};

const surfacePoints = (
  sim: SloshSim,
  layer: 'front' | 'back',
  calm: boolean
) => {
  const points: Array<[number, number]> = [];
  for (let x = X0; x <= X1; x += STEP) {
    points.push([x, surfaceY(x, sim, layer, calm)]);
  }
  return points;
};

const closed = (d: string) => `${d}L${X1} ${BOWL_H + 10}L${X0} ${BOWL_H + 10}Z`;

const BOWL_TILT_DEG = 1.2;
const BOWL_STRETCH = 0.008;

/** 지금 장면의 그릴 것 전부. 순수 함수라 jsdom에서 그대로 시험한다 */
export const scenePaths = (sim: SloshSim, calm = false): ScenePaths => {
  const rim = smoothPath(surfacePoints(sim, 'front', calm));
  const angle = calm
    ? 0
    : (Math.max(-MAX_SLOPE, Math.min(MAX_SLOPE, sim.tilt)) / MAX_SLOPE) *
      BOWL_TILT_DEG;
  const stretch = calm ? 0 : BOWL_STRETCH * Math.min(1, agitation(sim));
  return {
    back: closed(smoothPath(surfacePoints(sim, 'back', calm))),
    front: closed(rim),
    rim,
    // 바닥 가운데를 기준으로 기울고 위로 늘어난다(가로는 부피를 지키려 조금 줄인다)
    bowl: `rotate(${angle.toFixed(3)} ${CX} ${BOWL_H}) translate(${CX} ${BOWL_H}) scale(${(1 - stretch / 2).toFixed(4)} ${(1 + stretch).toFixed(4)}) translate(${-CX} ${-BOWL_H})`,
    bubbles: calm ? [] : sim.bubbles,
  };
};
