/**
 * Loader의 물결(wave)과 자벌레(inchworm)가 쓰는 숫자와 순수 함수.
 * 키프레임을 반복문으로 만들기 때문에 시험이 값을 읽을 수 있게 .css.ts 밖에 둔다.
 */
import { SQUASH_PX } from '../SegmentedButtons/segmentedMotion';

type Size = 'sm' | 'md' | 'lg' | 'xl';

/** 물결 막대의 중심 간격(px). Slider wake와 같다(교훈 18). */
export const WAVE_PITCH_PX = 8;

export const WAVE_WIDTH_PX: Record<Size, number> = {
  sm: 48,
  md: 64,
  lg: 96,
  xl: 128,
};

export const WAVE_HEIGHT_PX: Record<Size, number> = {
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
};

/** 막대 개수 = 폭 / 간격 */
export const waveBarCount = (size: Size): number =>
  WAVE_WIDTH_PX[size] / WAVE_PITCH_PX;

/** 걸음 수. 몸이 왼쪽 밖에서 들어와 오른쪽 밖으로 나가려면 (100 + 25) / 25 = 5걸음이다. */
export const INCHWORM_STEPS = 5;

/** 쉬는 몸의 길이(트랙 폭의 %). 한 걸음에 가는 거리와 같다. */
const BODY_PCT = 25;

/** 한 정지점의 모양. L·R은 트랙 왼쪽 기준 %, `lPx`는 L에 더하는 지나침(px). */
export interface InchwormStop {
  /** 한 바퀴 안의 위치(%) */
  at: number;
  l: number;
  lPx: number;
  r: number;
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

/**
 * 걸음마다 ① 앞끝 R이 +25%(걸음의 0~40%) ② 뒤끝 L이 +25%에 3px 지나침(40~85%)
 * ③ 3px 되돌아옴(85~100%). 마지막 걸음 끝에서 몸은 오른쪽 밖(L 100, R 125)이다.
 */
export const inchwormStops = (): InchwormStop[] => {
  const span = 100 / INCHWORM_STEPS;
  const stops: InchwormStop[] = [];
  for (let k = 0; k < INCHWORM_STEPS; k += 1) {
    const at = k * span;
    const l = -BODY_PCT + BODY_PCT * k;
    const r = BODY_PCT * k;
    stops.push({ at: round2(at), l, lPx: 0, r });
    stops.push({ at: round2(at + span * 0.4), l, lPx: 0, r: r + BODY_PCT });
    stops.push({
      at: round2(at + span * 0.85),
      l: l + BODY_PCT,
      lPx: SQUASH_PX,
      r: r + BODY_PCT,
    });
  }
  stops.push({
    at: 100,
    l: -BODY_PCT + BODY_PCT * INCHWORM_STEPS,
    lPx: 0,
    r: BODY_PCT * INCHWORM_STEPS,
  });
  return stops;
};

/** 채움 층(트랙 전체 폭)을 몸 모양으로 오려 내는 clip-path. 끝이 둥글다. */
export const inchwormInset = ({ l, lPx, r }: InchwormStop): string =>
  `inset(0 calc(100% - ${r}%) 0 ${lPx ? `calc(${l}% + ${lPx}px)` : `${l}%`} round 3px)`;

/** keyframes()에 펼쳐 넣는 프레임. 끝 프레임을 뺀 정지점마다 그 구간의 커브를 건다. */
export const inchwormFrames = (
  ease: string
): Record<string, { clipPath: string; animationTimingFunction?: string }> => {
  const stops = inchwormStops();
  return Object.fromEntries(
    stops.map((stop, i) => [
      `${stop.at}%`,
      i === stops.length - 1
        ? { clipPath: inchwormInset(stop) }
        : { clipPath: inchwormInset(stop), animationTimingFunction: ease },
    ])
  );
};

/** 점 궤도의 점 개수 */
export const ORBIT_DOTS = 8;

/** 점 궤도 점의 지름(px) */
export const ORBIT_DOT_PX: Record<Size, number> = {
  sm: 3,
  md: 4,
  lg: 5,
  xl: 8,
};

/** 점 중심이 놓이는 원의 반지름(px) = (로더 크기 - 점 지름) / 2 */
export const ORBIT_RADIUS_PX: Record<Size, number> = {
  sm: 6.5,
  md: 10,
  lg: 13.5,
  xl: 20,
};

/** 도화선 불똥의 지름(px) */
export const FUSE_SPARK_PX: Record<Size, number> = {
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
};

/** 중심이 원점인 화면 좌표(y는 아래로 늘어난다) */
export interface Point {
  x: number;
  y: number;
}

/** 12시에서 시계 방향으로 i번째 점이 i × 45도인 원 위의 8점 */
export const ringPoints = (radius: number): Point[] =>
  Array.from({ length: ORBIT_DOTS }, (_, i) => {
    const theta = (i * 2 * Math.PI) / ORBIT_DOTS;
    return {
      x: round2(radius * Math.sin(theta)),
      y: round2(-radius * Math.cos(theta)),
    };
  });

const polylinePoints = (stops: Point[], count: number): Point[] => {
  const lengths = stops
    .slice(1)
    .map((to, i) => Math.hypot(to.x - stops[i].x, to.y - stops[i].y));
  const total = lengths.reduce((sum, len) => sum + len, 0);
  return Array.from({ length: count }, (_, k) => {
    let rest = (total * k) / (count - 1);
    let seg = 0;
    while (seg < lengths.length - 1 && rest > lengths[seg]) {
      rest -= lengths[seg];
      seg += 1;
    }
    const t = rest / lengths[seg];
    const from = stops[seg];
    const to = stops[seg + 1];
    return {
      x: round2(from.x + (to.x - from.x) * t),
      y: round2(from.y + (to.y - from.y) * t),
    };
  });
};

/**
 * 완료 표식 자리 8곳.
 * done은 체크 꺾은선 A(-0.55r, 0) → B(-0.15r, 0.4r) → C(0.6r, -0.45r)를 길이를
 * 따라 양끝 포함 고르게 나눈 점이다. error는 두 대각선에 4점씩이고 가운데는 비운다.
 */
export const markPoints = (kind: 'done' | 'error', radius: number): Point[] => {
  if (kind === 'done') {
    return polylinePoints(
      [
        { x: -0.55 * radius, y: 0 },
        { x: -0.15 * radius, y: 0.4 * radius },
        { x: 0.6 * radius, y: -0.45 * radius },
      ],
      ORBIT_DOTS
    );
  }
  const half = 0.6 * radius;
  return [-1, -0.4, 0.4, 1].flatMap((t) => [
    { x: round2(t * half), y: round2(t * half) },
    { x: round2(t * half), y: round2(-t * half) },
  ]);
};

/** 12시에서 시계 방향으로 잰 각도(0 이상 2π 미만) */
const angleFromTwelve = ({ x, y }: Point): number =>
  (Math.atan2(x, -y) + 2 * Math.PI) % (2 * Math.PI);

const indicesByAngle = (points: Point[]): number[] =>
  points
    .map((_, i) => i)
    .sort((a, b) => angleFromTwelve(points[a]) - angleFromTwelve(points[b]));

/**
 * 점(from)마다 받을 자리(to)를 돌려준다. 둘 다 12시부터 시계 방향 각도순으로 세워
 * 같은 순번끼리 짝짓는다. 경로가 덜 엇갈린다.
 */
export const pairByAngle = (from: Point[], to: Point[]): Point[] => {
  const result: Point[] = [];
  const toOrder = indicesByAngle(to);
  indicesByAngle(from).forEach((fromIndex, rank) => {
    result[fromIndex] = to[toOrder[rank]];
  });
  return result;
};

/** 진행률을 0~100으로 자른다. 숫자가 아니면 0. */
export const clampPercent = (value: number): number =>
  Number.isNaN(value) ? 0 : Math.min(100, Math.max(0, value));
