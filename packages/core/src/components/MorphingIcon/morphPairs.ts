/**
 * 모양 바뀌는 아이콘의 짝 정의. viewBox 24 안의 꺾은선(polyline)만 쓴다.
 * 짝마다 두 상태의 선 개수와 각 선의 끝점 수가 같아야 끝점끼리 일대일로 옮겨 간다.
 * 사라져야 하는 선은 두 끝점이 한 점(길이 0)이고 opacity 0이다(둥근 선끝이 점으로 남지 않게).
 */
export type MorphingPair =
  | 'menu-close'
  | 'plus-check'
  | 'play-pause'
  | 'search-close'
  | 'expand-collapse';

export interface MorphLine {
  /** x0, y0, x1, y1, ... 평평하게 편 끝점 좌표 */
  readonly points: readonly number[];
  readonly opacity: 0 | 1;
}

export type MorphState = readonly MorphLine[];

const line = (points: number[], opacity: 0 | 1 = 1): MorphLine => ({
  points,
  opacity,
});

const round2 = (v: number) => Math.round(v * 100) / 100;

// 원을 직선 16마디로 근사한다(곡선 대신 끝점 수를 맞추기 위함). 시작 각도에서 시계 방향으로 한 바퀴 돌아 시작점에서 닫는다
const ring = (cx: number, cy: number, r: number, startDeg: number) =>
  Array.from({ length: 17 }, (_, k) => {
    const rad = ((startDeg + k * 22.5) * Math.PI) / 180;
    return [round2(cx + r * Math.cos(rad)), round2(cy + r * Math.sin(rad))];
  }).flat();

// 닫힌 원 근사 선(시작점 = 끝점)이 직선 하나로 접힐 때의 끝 모양. 시작점과 마지막 점은 한쪽 끝에, 가운데(맞은편) 점은 반대쪽 끝에 두고
// 그 사이는 왔다가 되돌아온다. 원의 두 반쪽이 각자 선 위로 납작해지므로 중간 프레임에서 선이 자기와 꼬이지 않는다(끝점 수는 그대로).
const fold = (x0: number, y0: number, x1: number, y1: number, n: number) =>
  Array.from({ length: n }, (_, k) => {
    const half = (n - 1) / 2;
    const f = (k <= half ? k : n - 1 - k) / half;
    return [round2(x0 + (x1 - x0) * f), round2(y0 + (y1 - y0) * f)];
  }).flat();

export const MORPH_PAIRS: Record<
  MorphingPair,
  readonly [MorphState, MorphState]
> = {
  // 가로 세 줄 / X 두 줄 + 가운데 줄이 한 점으로 줄어 사라짐
  'menu-close': [
    [line([4, 6, 20, 6]), line([4, 12, 20, 12]), line([4, 18, 20, 18])],
    [line([6, 6, 18, 18]), line([12, 12, 12, 12], 0), line([6, 18, 18, 6])],
  ],
  // 더하기의 두 선 / 체크의 짧은 획과 긴 획
  'plus-check': [
    [line([4, 12, 20, 12]), line([12, 4, 12, 20])],
    [line([10, 18, 19, 7]), line([5, 13, 10, 18])],
  ],
  // 삼각형(왼쪽 변과 아래 변 / 위 변) / 두 막대(두 번째 끝점은 막대 끝에 겹친다)
  'play-pause': [
    [line([7, 5, 7, 19, 18, 12]), line([7, 5, 12.5, 8.5, 18, 12])],
    [line([8, 5, 8, 19, 8, 19]), line([16, 5, 16, 12, 16, 19])],
  ],
  // 돋보기(원 근사 + 손잡이) / X. 손잡이는 긴 획으로 자라고 원은 반으로 접혀 다른 획이 된다
  'search-close': [
    [line(ring(10.5, 10.5, 6.5, 315)), line([15.1, 15.1, 20, 20])],
    [line(fold(18, 6, 6, 18, 17)), line([6, 6, 18, 18])],
  ],
  // 아래를 가리키는 셰브론 / 위를 가리키는 셰브론
  'expand-collapse': [
    [line([6, 9, 12, 15, 18, 9])],
    [line([6, 15, 12, 9, 18, 15])],
  ],
};

/** 한 상태를 (좌표들, opacity)가 선마다 이어진 숫자들로 펴서 번호를 키로 둔다. GSAP이 이 객체의 숫자를 한꺼번에 트윈한다 */
export const flatten = (state: MorphState): Record<number, number> =>
  Object.fromEntries(state.flatMap((l) => [...l.points, l.opacity]).entries());

/** x, y가 이어진 좌표를 SVG `points` 속성 문자열로 쓴다. 트윈 중간값의 군더더기 소수는 3자리에서 자른다 */
export const pointsAttr = (coords: readonly number[]): string => {
  const pairs: string[] = [];
  for (let i = 0; i < coords.length; i += 2) {
    pairs.push(
      `${Math.round(coords[i] * 1000) / 1000},${Math.round(coords[i + 1] * 1000) / 1000}`
    );
  }
  return pairs.join(' ');
};
