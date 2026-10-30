import type { Polygon } from '../../_internal/jamoRegions';

/** 이 알파(0~255) 이상인 픽셀을 잉크로 본다. 가장자리 안티앨리어싱(약 12% 미만)은 획 찾기에서 뺀다. 끝에 진짜 글자로 바꿀 때 그 옅은 테두리만 나타나 눈에 안 띈다 */
export const ALPHA_MIN = 32;

/** 칸 넓이에서 이 비율 미만인 덩이는 붓 갈라짐 부스러기로 보고 가까운 획에 붙인다(0.2%. 40px 글자 칸에서 약 3픽셀, 마침표나 ㅏ의 짧은 삐침은 이보다 크다) */
export const SPECK_AREA = 0.002;

/** 같은 자모 안에서 시작점 높이가 이 이하(em)로 차이 나면 "같은 높이"로 보고 왼쪽부터 쓴다 */
const SAME_ROW_EM = 0.08;

/** 획 앞머리 가장자리 폭(em). 앞머리가 단단한 붓 맛(수정 1의 FEATHER)을 알파 경사 얇은 띠로 낸다 */
export const FEATHER_EM = 0.04;

export interface Stroke {
  /** 자모 번호(초성 0, 중성 1, 종성 2). 한글이 아닌 칸은 0 */
  jamo: number;
  /** 획의 길이(em). 가장 먼 픽셀까지의 측지 거리 */
  lengthEm: number;
  /** 가장 먼 픽셀까지의 측지 거리(픽셀) */
  maxDist: number;
  /** 시작점(칸 안 픽셀 좌표) */
  start: readonly [x: number, y: number];
  /** 획 픽셀 번호(y * 폭 + x)를 측지 거리 오름차순으로 */
  pixels: Int32Array;
  /** `pixels`와 같은 순서의 측지 거리(픽셀) */
  dist: Float32Array;
}

interface Blob {
  id: number;
  pixels: number[];
  /** 가까운 획에 붙인 부스러기 픽셀. 연결되어 있지 않아 측지 거리를 못 재므로 획이 끝날 때 나타난다 */
  specks: number[];
  cx: number;
  cy: number;
  /** 나눈 부분 덩이가 속한 자모 번호. 나누지 않은 덩이는 없고 무게중심으로 정한다 */
  jamo?: number;
}

const NEIGHBORS: ReadonlyArray<
  readonly [dx: number, dy: number, cost: number]
> = [
  [1, 0, 10],
  [-1, 0, 10],
  [0, 1, 10],
  [0, -1, 10],
  [1, 1, 14],
  [1, -1, 14],
  [-1, 1, 14],
  [-1, -1, 14],
];

/** 알파가 문턱 이상인 픽셀의 8이웃 연결 성분. `labels`는 성분 번호(1부터, 0은 잉크 아님) */
const labelBlobs = (
  data: Uint8ClampedArray,
  w: number,
  h: number
): { blobs: Blob[]; labels: Int32Array } => {
  const labels = new Int32Array(w * h);
  const blobs: Blob[] = [];
  const stack = new Int32Array(w * h);
  for (let seed = 0; seed < w * h; seed++) {
    if (labels[seed] !== 0 || data[seed * 4 + 3] < ALPHA_MIN) continue;
    const id = blobs.length + 1;
    const pixels: number[] = [];
    let top = 0;
    stack[top++] = seed;
    labels[seed] = id;
    let sx = 0;
    let sy = 0;
    while (top > 0) {
      const p = stack[--top];
      pixels.push(p);
      const x = p % w;
      const y = (p - x) / w;
      sx += x;
      sy += y;
      for (const [dx, dy] of NEIGHBORS) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const n = ny * w + nx;
        if (labels[n] !== 0 || data[n * 4 + 3] < ALPHA_MIN) continue;
        labels[n] = id;
        stack[top++] = n;
      }
    }
    blobs.push({
      id,
      pixels,
      specks: [],
      cx: sx / pixels.length,
      cy: sy / pixels.length,
    });
  }
  return { blobs, labels };
};

/** 작은 성분(부스러기)을 무게중심에서 가장 가까운 큰 성분의 픽셀에 붙인다. 큰 성분이 하나도 없으면 가장 큰 것이 남는다 */
const attachSpecks = (blobs: Blob[], w: number, minArea: number): Blob[] => {
  let big = blobs.filter((b) => b.pixels.length >= minArea);
  if (big.length === 0 && blobs.length > 0) {
    big = [blobs.reduce((a, b) => (b.pixels.length > a.pixels.length ? b : a))];
  }
  for (const small of blobs) {
    if (big.includes(small)) continue;
    let best = big[0];
    let bestD = Infinity;
    for (const b of big) {
      for (const p of b.pixels) {
        const x = p % w;
        const d = (x - small.cx) ** 2 + ((p - x) / w - small.cy) ** 2;
        if (d < bestD) {
          bestD = d;
          best = b;
        }
      }
    }
    best.specks.push(...small.pixels);
  }
  return big;
};

/** 최소 힙(키, 값). 측지 거리 계산에서 가장 가까운 픽셀부터 꺼낸다 */
class MinHeap {
  private keys: number[] = [];
  private vals: number[] = [];
  get size() {
    return this.keys.length;
  }
  push(key: number, val: number) {
    let i = this.keys.push(key) - 1;
    this.vals.push(val);
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.keys[parent] <= this.keys[i]) break;
      this.swap(i, parent);
      i = parent;
    }
  }
  pop(): [key: number, val: number] {
    const out: [number, number] = [this.keys[0], this.vals[0]];
    const lastKey = this.keys.pop() as number;
    const lastVal = this.vals.pop() as number;
    if (this.keys.length > 0) {
      this.keys[0] = lastKey;
      this.vals[0] = lastVal;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < this.keys.length && this.keys[l] < this.keys[m]) m = l;
        if (r < this.keys.length && this.keys[r] < this.keys[m]) m = r;
        if (m === i) break;
        this.swap(i, m);
        i = m;
      }
    }
    return out;
  }
  private swap(a: number, b: number) {
    [this.keys[a], this.keys[b]] = [this.keys[b], this.keys[a]];
    [this.vals[a], this.vals[b]] = [this.vals[b], this.vals[a]];
  }
}

/**
 * 성분 안쪽으로만 시작점에서 잰 측지 거리(10배 한 정수). 직선 거리가 아니라 획의 길을 따라 재서 꺾인 획이 꺾인 길대로 자란다.
 * 가로세로 한 칸 10, 대각선 한 칸 14로 잰다(오차 약 3%). 시작점은 성분 안에서 x + y가 가장 작은 픽셀(왼쪽 위)이다.
 * 이웃 성분이나 빈 픽셀은 지나지 않는다.
 */
const geodesic = (
  blob: Blob,
  labels: Int32Array,
  w: number,
  h: number
): { start: number; dist: Map<number, number> } => {
  let start = blob.pixels[0];
  for (const p of blob.pixels) {
    const x = p % w;
    const sx = start % w;
    const a = x + (p - x) / w;
    const b = sx + (start - sx) / w;
    if (a < b || (a === b && p < start)) start = p;
  }
  const dist = new Map<number, number>([[start, 0]]);
  const heap = new MinHeap();
  heap.push(0, start);
  while (heap.size > 0) {
    const [d, p] = heap.pop();
    if (d > (dist.get(p) as number)) continue;
    const x = p % w;
    const y = (p - x) / w;
    for (const [dx, dy, cost] of NEIGHBORS) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const n = ny * w + nx;
      if (labels[n] !== blob.id) continue;
      const nd = d + cost;
      const known = dist.get(n);
      if (known === undefined || nd < known) {
        dist.set(n, nd);
        heap.push(nd, n);
      }
    }
  }
  return { start, dist };
};

/**
 * 영역이 덩이 픽셀의 이 비율 이상이면 그 자모의 덩이가 거기 있다고 본다("주인 영역").
 * 나눔붓글씨 96px(dpr 2)에서 잰 값(리포트 수정 3): 이어 쓴 덩이의 이웃 영역 비율은 독(ㄷ+ㅗ) 36%, 나(ㄴ+ㅏ) 37%, 니(ㄴ+ㅣ) 48%이고,
 * 한 자모가 이웃 영역으로 넘친 덩이는 한의 ㅎ 15%, 구 15%, 획의 ㅎ 34%, 닭 26%다. 둘이 겹치는 글자가 있어(획의 ㅎ 34%와 독 36%)
 * 비율만으로는 못 갈라 35%로 두고 아래 `CUT_MAX`를 더한다.
 */
export const SPLIT_SHARE = 0.35;

/**
 * 나눴을 때 부분 덩이의 경계 픽셀(다른 부분과 맞닿은 픽셀) 수를 그 부분 넓이로 나눈 값의 상한.
 * 이어 쓴 두 자모를 가르는 선은 획의 굵기만큼 짧아서 독 0.008, 니 0.015, 나 0.08이다(나눔붓글씨 96px, dpr 2 실측).
 * 한 획을 길이 방향으로 가르는 선은 길어서 이 값을 넘는 경우가 있다(씁의 첫 덩이 0.134, 위 0.109). 넘으면 나누지 않는다.
 * 모든 경우를 거르지는 못한다: 각(0.057), 곽(0.043), 왕(0.021), 씁의 둘째 덩이(0.061)는 선이 짧아 이어 쓴 덩이와 구별되지 않아 나뉜다.
 */
export const CUT_MAX = 0.1;

/**
 * 한 덩이에서 주인 영역이 둘 이상이면 주인 영역 픽셀을 씨앗으로 덩이 안쪽으로만 다중 출발 BFS를 돌려
 * 나머지 픽셀을 가장 가까운 씨앗의 자모에 붙여 자모마다 부분 덩이로 나눈다. 부분 덩이가 여러 연결 조각이면 조각마다 덩이다.
 * `labels`를 새 번호로 고쳐 쓴다. 주인 영역이 하나뿐이면 덩이를 그대로 돌려준다.
 */
const splitBlob = (
  blob: Blob,
  labels: Int32Array,
  w: number,
  h: number,
  regionOf: (p: number) => number,
  regionCount: number,
  share: number,
  nextId: () => number
): Blob[] => {
  const count = new Array<number>(regionCount).fill(0);
  const jamoOf = new Map<number, number>();
  for (const p of blob.pixels) {
    const r = regionOf(p);
    jamoOf.set(p, r);
    count[r]++;
  }
  const owners = count.map((c) => c > 0 && c / blob.pixels.length >= share);
  if (owners.filter(Boolean).length < 2) return [blob];

  // 주인 영역의 픽셀이 씨앗. 거리 순으로 퍼뜨려 덩이 안의 나머지 픽셀이 가장 가까운 씨앗의 자모를 받는다
  const group = new Map<number, number>();
  let frontier: number[] = [];
  for (const p of blob.pixels) {
    const r = jamoOf.get(p) as number;
    if (owners[r]) {
      group.set(p, r);
      frontier.push(p);
    }
  }
  while (frontier.length > 0) {
    const next: number[] = [];
    for (const p of frontier) {
      const x = p % w;
      const y = (p - x) / w;
      for (const [dx, dy] of NEIGHBORS) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const n = ny * w + nx;
        if (labels[n] !== blob.id || group.has(n)) continue;
        group.set(n, group.get(p) as number);
        next.push(n);
      }
    }
    frontier = next;
  }

  // 가르는 선이 획을 길이 방향으로 지나면(경계 픽셀이 부분 넓이에 비해 많으면) 나누지 않는다
  const area = new Map<number, number>();
  const edge = new Map<number, number>();
  for (const p of blob.pixels) {
    const g = group.get(p) as number;
    area.set(g, (area.get(g) ?? 0) + 1);
    const x = p % w;
    const y = (p - x) / w;
    const touches = NEIGHBORS.slice(0, 4).some(([dx, dy]) => {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) return false;
      const n = ny * w + nx;
      return labels[n] === blob.id && group.get(n) !== g;
    });
    if (touches) edge.set(g, (edge.get(g) ?? 0) + 1);
  }
  for (const [g, a] of area)
    if ((edge.get(g) ?? 0) / a > CUT_MAX) return [blob];

  // 자모마다 연결 조각을 새 덩이로 떼어 낸다(labels는 아직 옛 번호인 픽셀이 방문 전)
  const parts: Blob[] = [];
  const stack: number[] = [];
  for (const seed of blob.pixels) {
    if (labels[seed] !== blob.id) continue;
    const g = group.get(seed) as number;
    const id = nextId();
    const pixels: number[] = [];
    let sx = 0;
    let sy = 0;
    labels[seed] = id;
    stack.push(seed);
    while (stack.length > 0) {
      const p = stack.pop() as number;
      pixels.push(p);
      const x = p % w;
      const y = (p - x) / w;
      sx += x;
      sy += y;
      for (const [dx, dy] of NEIGHBORS) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const n = ny * w + nx;
        if (labels[n] !== blob.id || group.get(n) !== g) continue;
        labels[n] = id;
        stack.push(n);
      }
    }
    parts.push({
      id,
      pixels,
      specks: [],
      cx: sx / pixels.length,
      cy: sy / pixels.length,
      jamo: g,
    });
  }
  return parts;
};

/** 점이 다각형 안인가(짝수 홀수 규칙) */
const inside = (poly: Polygon, x: number, y: number): boolean => {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
      c = !c;
  }
  return c;
};

export interface InkOptions {
  /** 1em의 픽셀 수(비트맵 기준) */
  emPx: number;
  /** `jamoRegions(char)`의 영역들. 한글 음절이 아니면 null(칸 전체가 한 덩이) */
  regions: readonly Polygon[] | null;
  /** 나누는 비율(`SPLIT_SHARE`). 시험이 0이나 1 넘는 값으로 나누기를 끄고 켠다 */
  splitShare?: number;
}

/**
 * 칸의 잉크 비트맵(RGBA)에서 획을 찾아 쓰는 순서대로 돌려준다.
 * 1) 연결 성분이 획 덩이이다.
 * 2) 한글이면 덩이의 픽셀을 자모 영역에 넣어 주인 영역(`SPLIT_SHARE` 이상)이 둘 이상인 덩이를 자모마다 부분 덩이로 나눈다
 *    (붓 글꼴이 ㄷ+ㅗ, ㄴ+ㅣ처럼 이어 쓴 덩이). 주인이 하나면 통째로 한 덩이고 무게중심이 든 영역이 그 자모다.
 * 3) 작은 덩이(부스러기)는 가까운 덩이에 붙는다.
 * 4) 자모 순서(초성, 중성, 종성), 한 자모 안은 시작점 기준 위에서 아래(같은 높이면 왼쪽에서 오른쪽). 한글이 아니면 왼쪽에서 오른쪽.
 * ponytail: 한 획이 영역 경계를 `SPLIT_SHARE` 이상 넘으면서 가르는 선이 짧으면 이어 쓴 덩이와 구별되지 않아 나뉜다.
 * 나눔붓글씨에서는 각, 곽, 왕, 씁에서 짧은 조각(씁은 ㅡ 0.12em, ㅂ 0.18em)이 따로 쓰이고, 획의 ㅎ은 34%라 문턱 바로 아래다.
 * 이어 쓴 덩이도 이웃 영역 비율이 아래거나 가르는 선이 길면 한 획으로 남는다. 글꼴 획 정보 없이 어느 글꼴에서나 되는 대신 생기는 한계라, 글꼴마다 맞추려면 두 값을 옵션으로 연다.
 */
export const inkStrokes = (
  data: Uint8ClampedArray,
  w: number,
  h: number,
  { emPx, regions, splitShare = SPLIT_SHARE }: InkOptions
): Stroke[] => {
  const { blobs: found, labels } = labelBlobs(data, w, h);
  const minArea = SPECK_AREA * w * h;
  // 칸 안 좌표(x는 칸 폭, y는 칸 가운데를 기준으로 1em)로 옮겨 영역에 넣는다
  // 영역들은 단위 정사각형을 빈틈없이 나누므로 안으로 모은 점은 어딘가에 든다. 경계 오차로 못 찾으면 초성으로 둔다
  const regionAt = (x: number, y: number): number =>
    regions
      ? Math.max(
          0,
          regions.findIndex((r) =>
            inside(
              r,
              Math.min(Math.max(x / w, 0), 1),
              Math.min(Math.max((y - (h - emPx) / 2) / emPx, 0), 1)
            )
          )
        )
      : 0;
  let ids = found.length;
  const blobs = regions
    ? found.flatMap((blob) =>
        blob.pixels.length < minArea
          ? [blob]
          : splitBlob(
              blob,
              labels,
              w,
              h,
              (p) => regionAt((p % w) + 0.5, Math.floor(p / w) + 0.5),
              regions.length,
              splitShare,
              () => ++ids
            )
      )
    : found;
  const big = attachSpecks(blobs, w, minArea);
  const strokes = big.map((blob) => {
    const { start, dist } = geodesic(blob, labels, w, h);
    let maxDist = 0;
    for (const d of dist.values()) maxDist = Math.max(maxDist, d);
    maxDist /= 10;
    const own = [...dist.entries()].sort((a, b) => a[1] - b[1]);
    const pixels = new Int32Array(own.length + blob.specks.length);
    const sorted = new Float32Array(pixels.length);
    own.forEach(([p, d], i) => {
      pixels[i] = p;
      sorted[i] = d / 10;
    });
    blob.specks.forEach((p, i) => {
      pixels[own.length + i] = p;
      sorted[own.length + i] = maxDist;
    });
    const jamo = blob.jamo ?? regionAt(blob.cx, blob.cy);
    const sx = start % w;
    return {
      jamo,
      lengthEm: maxDist / emPx,
      maxDist,
      start: [sx, (start - sx) / w] as const,
      pixels,
      dist: sorted,
    };
  });
  const tol = SAME_ROW_EM * emPx;
  return strokes.sort((a, b) => {
    if (a.jamo !== b.jamo) return a.jamo - b.jamo;
    if (regions && Math.abs(a.start[1] - b.start[1]) > tol)
      return a.start[1] - b.start[1];
    return a.start[0] - b.start[0] || a.start[1] - b.start[1];
  });
};

/** `dist`에서 `value` 이하가 끝나는 자리(상한 경계) */
const upperBound = (dist: Float32Array, value: number): number => {
  let lo = 0;
  let hi = dist.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (dist[mid] <= value) lo = mid + 1;
    else hi = mid;
  }
  return lo;
};

/**
 * 획 앞머리가 `from`에서 `to`(측지 거리, 픽셀)로 옮겨 갔을 때 바뀌는 픽셀만 `out`에 다시 쓴다.
 * 픽셀의 알파는 원본 알파 x clamp((앞머리 - 거리) / feather, 0, 1)이라 앞머리 뒤 얇은 띠만 비치고 그 뒤는 다 보인다.
 * 거리만의 함수라 앞으로도 뒤로도 같은 식이다(시각을 되감아도 맞다).
 * ponytail: 칸 전체 ImageData를 재사용하고 이 함수는 바뀐 픽셀만 쓴다. 칸이 아주 크면 putImageData를 dirty rect로 줄인다.
 */
export const paintFront = (
  src: Uint8ClampedArray,
  out: Uint8ClampedArray,
  stroke: Stroke,
  from: number,
  to: number,
  feather: number
): void => {
  const lo = upperBound(stroke.dist, Math.min(from, to) - feather) - 1;
  const hi = upperBound(stroke.dist, Math.max(from, to));
  for (let i = Math.max(lo, 0); i < hi; i++) {
    const p = stroke.pixels[i] * 4;
    const k = Math.min(Math.max((to - stroke.dist[i]) / feather, 0), 1);
    out[p] = src[p];
    out[p + 1] = src[p + 1];
    out[p + 2] = src[p + 2];
    out[p + 3] = src[p + 3] * k;
  }
};
