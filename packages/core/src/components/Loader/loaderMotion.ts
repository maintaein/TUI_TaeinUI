/** Loader 그래픽의 숫자와 순수 함수. */

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

const round2 = (n: number): number => Math.round(n * 100) / 100;

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
