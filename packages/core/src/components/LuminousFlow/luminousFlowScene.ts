import { palette } from './luminousFlowPalette';

// 장면 좌표계. 폭 492는 고정이고, 높이는 scrollScene이면 긴 물길 전체(2162), 아니면 맨 위 318만 보인다.
export const SCENE_WIDTH = 492;
export const SCENE_HEIGHT = 2162;
export const SCENE_HEIGHT_COMPACT = 318;

// x, y, 반폭: 넓은 못과 좁고 빛나는 굽이가 번갈아 나온다.
const anchors = [
  [540, -50, 48],
  [342, 65, 24],
  [251, 112, 55],
  [178, 219, 2],
  [282, 267, 37],
  [390, 410, 67],
  [295, 535, 23],
  [85, 635, 76],
  [32, 710, 3],
  [202, 818, 72],
  [348, 970, 26],
  [468, 1130, 65],
  [453, 1230, 4],
  [249, 1350, 79],
  [38, 1493, 3],
  [214, 1602, 58],
  [424, 1715, 24],
  [463, 1792, 47],
  [294, 1870, 54],
  [110, 1860, 20],
  [-40, 1925, 38],
];
const constrictions = [-3, 3, 8, 12, 14, 17, 24];

// 한 점은 [x, y, 폭, 법선 x, 법선 y, 곡률]
export const centerline = anchors.slice(0, -1).flatMap((anchor, segment) => {
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

export const centerlinePath = createCurve(centerline);

// 굽이 안쪽만 곡률 제한이 필요하다. 바깥쪽 가지는 마음껏 퍼져도 된다.
const normalOffset = (offset: number, curvature: number, limit: number) =>
  offset / Math.sqrt(1 + (Math.max(0, offset * curvature) / limit) ** 2);

export const envelopePaths = Array.from({ length: 80 }, (_, layer) => {
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

export const POSE_COUNT = 16;

export const strands = Array.from({ length: 28 }, (_, index) => {
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
        ((Math.sin(travel * (0.014 + (index % 5) * 0.001) + phase - clock * 2) *
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
    blue,
    index,
    color: blue ? palette.blue : colors[index % colors.length],
  };
});

// 빛이 번지는 굽이 자리(가장 가까운 중심선 점)
export const bends = [219, 710, 1230, 1493, 1792].map((y) =>
  centerline
    .reduce((nearest, point) =>
      Math.abs(point[1] - y) < Math.abs(nearest[1] - y) ? point : nearest
    )
    .slice(0, 2)
);

export const atoms = Array.from({ length: 48 }, (_, index) => ({
  index,
  strand: (index * 11 + 3) % strands.length,
  phase: ((index * 0.618034 + 0.07) % 1).toFixed(4),
  duration: 58 + (index % 7) * 6,
  radius: 0.65 + (index % 5) * 0.3,
}));
