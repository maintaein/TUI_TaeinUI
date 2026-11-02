import { palette } from './luminousFlowPalette';

// 장면 좌표계. 폭 492는 고정이고, 높이는 굽이 수가 정한다(createScene).
export const SCENE_WIDTH = 492;
// 굽이 수가 고정이던 때의 장면 높이. 알갱이 밀도와 속도, 빛줄기 색 그라디언트 주기, 안개 줄 간격의 기준이다.
export const REFERENCE_HEIGHT = 2162;
export const POSE_COUNT = 16;

type Anchor = [number, number, number];

// 앵커는 x, y, 반폭이다. 넓은 못과 좁고 빛나는 굽이가 번갈아 나온다.
// 장면은 머리 + 가운데 한 벌(UNIT)을 k번 + 마감으로 이어 만든다. 한 벌은 굽이 하나다.
// 한 벌은 홀수 번째마다, 마감은 한 벌 수가 짝수일 때 좌우를 뒤집어(x -> 492 - x) 굽이 방향이 번갈아 맞물린다.
// 굽이 수 n = 머리 2 + k + 마감 3. 마지막 굽이가 오른쪽(R)이면 끝은 왼쪽 밖으로, 왼쪽(L)이면 오른쪽 밖으로 빠진다.
// 머리: 옛 고정 장면의 앵커 0~7. 첫 굽이(y 219)와 오른쪽 못 위의 굽이(y 410)가 있다.
const HEAD: Anchor[] = [
  [540, -50, 48],
  [342, 65, 24],
  [251, 112, 55],
  [178, 219, 2],
  [282, 267, 37],
  [390, 410, 67],
  [295, 535, 23],
  [85, 635, 76],
];
const HEAD_BENDS = [219, 410];
// 한 벌: 옛 앵커 8~11(왼쪽 굽이에서 오른쪽 못까지). y는 한 벌의 시작(왼쪽 굽이)에서 잰 값이다.
const UNIT_START = 710;
const UNIT_HEIGHT = 520;
const UNIT: Anchor[] = [
  [32, 0, 3],
  [202, 108, 72],
  [348, 260, 26],
  [468, 420, 65],
];
// 마감: 옛 앵커 12~20. y는 마감의 시작(오른쪽 굽이)에서 잰 값이다. 첫 앵커는 한 벌 첫 앵커의 좌우 뒤집음이 되게
// (453, 4) -> (460, 3)으로 맞췄다. 끝은 왼쪽 밖 [-40]이다.
const TAIL: Anchor[] = [
  [460, 0, 3],
  [249, 120, 79],
  [38, 263, 3],
  [214, 372, 58],
  [424, 485, 24],
  [463, 562, 47],
  [294, 640, 54],
  [110, 630, 20],
  [-40, 695, 38],
];
const TAIL_BENDS = [0, 263, 562];
const BOTTOM_MARGIN = 40;
const UNIT_ANCHORS = UNIT.length;

export const MIN_BENDS = HEAD_BENDS.length + TAIL_BENDS.length;
const MAX_UNITS = 40;
// ponytail: 한 벌 40개(굽이 45, 장면 높이 약 22000)에서 멈춘다. 물길 띠 80겹의 경로 문자열이 길이에 비례해 커지므로, 더 늘리려면 띠 겹수나 그리는 방식을 먼저 본다
export const MAX_BENDS = MIN_BENDS + MAX_UNITS;

const heightFor = (units: number) =>
  UNIT_START + units * UNIT_HEIGHT + TAIL[TAIL.length - 1][1] + BOTTOM_MARGIN;

const clampUnits = (units: number) =>
  Math.min(MAX_UNITS, Math.max(0, Math.round(units)));

/** 상자 폭·높이(px)에서 굽이 수를 고른다. 장면(폭 492)을 폭에 맞춰 같은 배율로 펴고, 그 높이가 상자를 덮는 가장 작은 수다 */
export const bendsForBox = (width: number, height: number) => {
  if (!(width > 0 && height > 0)) return MIN_BENDS;
  const needed = (height * SCENE_WIDTH) / width;
  return (
    MIN_BENDS + clampUnits(Math.ceil((needed - heightFor(0)) / UNIT_HEIGHT))
  );
};

const buildScene = (units: number) => {
  const height = heightFor(units);
  const place = (list: Anchor[], top: number, flip: boolean): Anchor[] =>
    list.map(([x, y, halfWidth]) => [
      flip ? SCENE_WIDTH - x : x,
      top + y,
      halfWidth,
    ]);
  const tailTop = UNIT_START + units * UNIT_HEIGHT;
  const anchors = [
    ...HEAD,
    ...Array.from({ length: units }, (_, unit) =>
      place(UNIT, UNIT_START + unit * UNIT_HEIGHT, unit % 2 === 1)
    ).flat(),
    ...place(TAIL, tailTop, units % 2 === 0),
  ];
  // 굽이(좁은 목) 자리의 앵커 번호. 목마다 폭이 2로 잘록해지고 사이에서 한 번 넓게 퍼진다.
  const tailIndex = HEAD.length + units * UNIT_ANCHORS;
  const constrictions = [
    -3,
    3,
    ...Array.from(
      { length: units + 1 },
      (_, unit) => HEAD.length + unit * UNIT_ANCHORS
    ),
    tailIndex + 2,
    tailIndex + 5,
    tailIndex + 12,
  ];

  // 한 점은 [x, y, 폭, 법선 x, 법선 y, 곡률]
  const centerline = anchors.slice(0, -1).flatMap((anchor, segment) => {
    const previous = anchors[Math.max(segment - 1, 0)];
    const next = anchors[segment + 1];
    const after = anchors[Math.min(segment + 2, anchors.length - 1)];
    return Array.from(
      { length: segment === anchors.length - 2 ? 7 : 6 },
      (_, step) => {
        const t = step / 6;
        const controls = [previous, anchor, next, after];
        // 3차 B-스플라인은 매듭에서 위치·접선·곡률이 이어진다.
        const basis = [
          (1 - t) ** 3,
          3 * t ** 3 - 6 * t * t + 4,
          -3 * t ** 3 + 3 * t * t + 3 * t + 1,
          t ** 3,
        ];
        const coordinates = [0, 1].map((axis) =>
          controls.reduce(
            (sum, point, index) => sum + (point[axis] * basis[index]) / 6,
            0
          )
        );
        const velocity = [
          -0.5 * (1 - t) ** 2,
          1.5 * t * t - 2 * t,
          -1.5 * t * t + t + 0.5,
          0.5 * t * t,
        ];
        const acceleration = [1 - t, 3 * t - 2, 1 - 3 * t, t];
        const [dx, dy] = [0, 1].map((axis) =>
          controls.reduce(
            (sum, point, index) => sum + point[axis] * velocity[index],
            0
          )
        );
        const [ax, ay] = [0, 1].map((axis) =>
          controls.reduce(
            (sum, point, index) => sum + point[axis] * acceleration[index],
            0
          )
        );
        const length = Math.hypot(dx, dy);
        const curvature = (dx * ay - dy * ax) / length ** 3;
        // 굽이마다 혹이 나지 않고, 굽이 사이에서 한 번 넓게 퍼졌다 좁아진다.
        const position = segment + t;
        const interval = constrictions.findIndex(
          (knot, index) => index > 0 && knot >= position
        );
        const start = constrictions[interval - 1],
          end = constrictions[interval];
        const progress = (position - start) / (end - start);
        const peak =
          Math.max(
            ...anchors
              .slice(Math.max(0, start), Math.min(anchors.length, end + 1))
              .map((point) => point[2])
          ) *
          1.35 *
          Math.min(1, (end - start) / 3);
        const width = 2 + (peak - 2) * 64 * progress ** 3 * (1 - progress) ** 3;
        return [...coordinates, width, -dy / length, dx / length, curvature];
      }
    );
  });

  let distance = 0;
  const distances = centerline.map(([x, y], index) => {
    if (index)
      distance += Math.hypot(
        x - centerline[index - 1][0],
        y - centerline[index - 1][1]
      );
    return distance;
  });

  const createCurve = (points: number[][]) => {
    const coordinate = (point: number[]) =>
      point
        .slice(0, 2)
        .map((value) => value.toFixed(3))
        .join(' ');
    return (
      `M ${coordinate(points[0])}` +
      points
        .slice(0, -1)
        .map((point, sample) => {
          const before = points[Math.max(sample - 1, 0)];
          const next = points[sample + 1];
          const after = points[Math.min(sample + 2, points.length - 1)];
          const control1 = point.map(
            (value, axis) => value + (next[axis] - before[axis]) / 6
          );
          const control2 = next.map(
            (value, axis) => value - (after[axis] - point[axis]) / 6
          );
          return ` C ${coordinate(control1)} ${coordinate(control2)} ${coordinate(next)}`;
        })
        .join('')
    );
  };

  // 굽이 안쪽만 곡률 제한이 필요하다. 바깥쪽 가지는 마음껏 퍼져도 된다.
  const normalOffset = (offset: number, curvature: number, limit: number) =>
    offset / Math.sqrt(1 + (Math.max(0, offset * curvature) / limit) ** 2);

  // 물길 띠(80겹)와 빛줄기(28가닥)는 물길 전체를 따라 달리므로 길이가 늘어도 개수가 같아야 가로 단면의 밀도가 같다.
  const envelopePaths = Array.from({ length: 80 }, (_, layer) => {
    const edges = [-1, 1].map((side) =>
      centerline.map(([x, y, width, nx, ny, curvature]) => {
        const offset = normalOffset(
          side * (25 + width) * (1 - layer / 80),
          curvature,
          0.65
        );
        return [x + nx * offset, y + ny * offset];
      })
    );
    return `${createCurve(edges[0])}${createCurve(edges[1].reverse()).replace(/^M/, 'L')} Z`;
  });

  const strands = Array.from({ length: 28 }, (_, index) => {
    const phase = index * 2.399963;
    const lane = Math.sin(phase) * 0.73;
    const createPath = (clock: number) =>
      centerline.map(([x, y, width, nx, ny, curvature], sample) => {
        const travel = distances[sample];
        const wanderingLane =
          lane +
          Math.sin(travel * 0.007 + phase - clock) * 0.28 +
          Math.sin(travel * 0.003 + phase * 0.7 + clock) * 0.18;
        const ripple =
          ((Math.sin(
            travel * (0.014 + (index % 5) * 0.001) + phase - clock * 2
          ) *
            3 +
            Math.sin(travel * 0.009 + index * 0.7 - clock) * 5) *
            width) /
          35;
        const offset = normalOffset(
          wanderingLane * width + ripple,
          curvature,
          0.2
        );
        return [x + nx * offset, y + ny * offset];
      });
    const poses = Array.from({ length: POSE_COUNT }, (_, frame) =>
      createPath((frame / POSE_COUNT) * Math.PI * 2)
    );
    // 이음매에서 첫 포즈와 정확히 같게 맞춘다(반올림 포함).
    poses.push(poses[0]);
    // 포즈마다 점 사이 거리의 누적. 점선 위상은 보이는 첫 구간 앞의 길이(현재 포즈를 섞은 값)를 쓰므로 포즈별로 둔다.
    // 알갱이는 첫 포즈 것(lengths)만 쓴다(위치는 점 사이 보간이라 길이가 포즈마다 조금 달라도 어긋나지 않는다)
    const poseLengths = poses.map((pose) => {
      const total = new Float64Array(pose.length);
      for (let sample = 1; sample < total.length; sample++)
        total[sample] =
          total[sample - 1] +
          Math.hypot(
            pose[sample][0] - pose[sample - 1][0],
            pose[sample][1] - pose[sample - 1][1]
          );
      return total;
    });
    const lengths = poseLengths[0];
    // 점마다 모든 포즈에 걸친 y 범위의 앞쪽 최댓값과 뒤쪽 최솟값. 둘 다 점 번호에 단조라서 보이는 구간의 점 범위를 이진 탐색으로 좁힌다
    const preMaxY = new Float64Array(lengths.length);
    const sufMinY = new Float64Array(lengths.length);
    for (let sample = 0; sample < lengths.length; sample++) {
      const ys = poses.map((pose) => pose[sample][1]);
      preMaxY[sample] = Math.max(
        ...ys,
        sample ? preMaxY[sample - 1] : -Infinity
      );
    }
    for (let sample = lengths.length - 1; sample >= 0; sample--) {
      const ys = poses.map((pose) => pose[sample][1]);
      sufMinY[sample] = Math.min(
        ...ys,
        sample < lengths.length - 1 ? sufMinY[sample + 1] : Infinity
      );
    }
    const blue = index % 7 === 0;
    const colors = [
      palette.cyan,
      palette.glow,
      palette.cyan,
      palette.blue,
      palette.depth,
    ];
    return {
      poses,
      lengths,
      poseLengths,
      preMaxY,
      sufMinY,
      blue,
      index,
      color: blue ? palette.blue : colors[index % colors.length],
    };
  });

  // 빛이 번지는 굽이 자리(가장 가까운 중심선 점). 개수가 굽이 수 n이다.
  const bends = [
    ...HEAD_BENDS,
    ...Array.from(
      { length: units },
      (_, unit) => UNIT_START + unit * UNIT_HEIGHT
    ),
    ...TAIL_BENDS.map((y) => tailTop + y),
  ].map((y) =>
    centerline
      .reduce((nearest, point) =>
        Math.abs(point[1] - y) < Math.abs(nearest[1] - y) ? point : nearest
      )
      .slice(0, 2)
  );

  // 알갱이는 가닥 전체를 한 바퀴 도므로 길이에 비례해 늘리고 한 바퀴 시간도 늘려, 단위 높이당 개수와 속도를 지킨다.
  const growth = height / REFERENCE_HEIGHT;
  const atoms = Array.from({ length: Math.round(48 * growth) }, (_, index) => ({
    index,
    strand: (index * 11 + 3) % strands.length,
    phase: ((index * 0.618034 + 0.07) % 1).toFixed(4),
    duration: (58 + (index % 7) * 6) * growth,
    radius: 0.65 + (index % 5) * 0.3,
  }));

  return {
    height,
    centerline,
    centerlinePath: createCurve(centerline),
    envelopePaths,
    strands,
    bends,
    atoms,
  };
};

export type Scene = ReturnType<typeof buildScene>;

// ponytail: 첫 생성은 메인 스레드를 막는다(헤드리스 개발 빌드 실측: 굽이 11은 약 0.06초, 41은 장면 0.22초에 마운트 전체 약 0.3초). 장면 생성은 한 덩어리라 유휴 시간으로 미뤄도 같은 시간이 한 번 막히므로 미루지 않는다. 20000px 넘는 상자를 흔히 쓰게 되면 포즈를 Float64Array로 바꾸고 생성을 나눠 한다. 장면 하나는 수십 MB다
// 굽이 수를 훑으며 크기를 바꾸면 장면이 쌓이므로 최근 몇 개만 둔다(긴 장면 하나가 수십 MB다).
const CACHE_LIMIT = 4;
const cache = new Map<number, Scene>();

/** 굽이 수 n(MIN_BENDS~MAX_BENDS로 잘림)의 장면. 같은 n이면 같은 객체다 */
export const createScene = (bends: number): Scene => {
  const units = clampUnits(bends - MIN_BENDS);
  const cached = cache.get(units);
  const scene = cached ?? buildScene(units);
  // 맨 뒤로 옮겨 가장 오래 안 쓴 것부터 버린다
  cache.delete(units);
  cache.set(units, scene);
  if (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value!);
  return scene;
};
