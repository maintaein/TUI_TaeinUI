import { describe, expect, it } from 'vitest';
import { jamoRegions } from '../../_internal/jamoRegions';
import { inkStrokes, paintFront, type Stroke } from './inkStrokes';

/** 알파 255인 사각형(x0, y0, x1, y1, 끝은 포함 안 함)들을 그린 RGBA 비트맵 */
type Rect = readonly [x0: number, y0: number, x1: number, y1: number];
const bitmap = (w: number, h: number, rects: Rect[]): Uint8ClampedArray => {
  const data = new Uint8ClampedArray(w * h * 4);
  for (const [x0, y0, x1, y1] of rects)
    for (let y = y0; y < y1; y++)
      for (let x = x0; x < x1; x++) {
        const p = (y * w + x) * 4;
        data[p] = 20;
        data[p + 1] = 20;
        data[p + 2] = 20;
        data[p + 3] = 255;
      }
  return data;
};

const distAt = (stroke: Stroke, w: number, x: number, y: number): number => {
  const i = stroke.pixels.indexOf(y * w + x);
  expect(i, `(${x}, ${y})가 획에 없다`).toBeGreaterThanOrEqual(0);
  return stroke.dist[i];
};

const regionsOf = (char: string) =>
  (jamoRegions(char) ?? []).map((r) => r.region);

describe('획 찾기', () => {
  it('떨어진 막대 둘은 획 둘이다', () => {
    const strokes = inkStrokes(
      bitmap(60, 40, [
        [4, 10, 24, 14],
        [34, 10, 54, 14],
      ]),
      60,
      40,
      { emPx: 40, regions: null }
    );
    expect(strokes).toHaveLength(2);
  });

  it('칸 넓이의 0.2% 미만인 작은 점은 따로 쓰지 않고 가까운 획에 붙는다', () => {
    // 100 x 100 칸의 0.2%는 20픽셀. 2 x 2 점(4픽셀)은 가까운 막대에 붙는다
    const strokes = inkStrokes(
      bitmap(100, 100, [
        [10, 10, 60, 16],
        [70, 12, 72, 14],
      ]),
      100,
      100,
      { emPx: 100, regions: null }
    );
    expect(strokes).toHaveLength(1);
    expect(strokes[0].pixels).toHaveLength(50 * 6 + 4);
  });

  it('작은 성분뿐이어도(마침표) 가장 큰 것이 획으로 남는다', () => {
    const strokes = inkStrokes(bitmap(100, 100, [[48, 80, 51, 83]]), 100, 100, {
      emPx: 100,
      regions: null,
    });
    expect(strokes).toHaveLength(1);
  });

  it('잉크가 없으면 획도 없다', () => {
    expect(
      inkStrokes(bitmap(20, 20, []), 20, 20, { emPx: 20, regions: null })
    ).toEqual([]);
  });
});

describe('측지 거리', () => {
  // ㄷ꼴: 위 가로 -> 오른쪽 세로 내림 -> 아래 가로가 왼쪽으로 돌아옴. 아래 가로의 왼쪽 끝은 직선으로는 시작점 가까이지만 길로는 가장 멀다
  const W = 60;
  const hook = bitmap(W, 60, [
    [5, 5, 50, 8],
    [47, 5, 50, 50],
    [10, 47, 50, 50],
  ]);

  it('시작점은 왼쪽 위 끝이다', () => {
    const [stroke] = inkStrokes(hook, W, 60, { emPx: 60, regions: null });
    expect(stroke.start).toEqual([5, 5]);
  });

  it('꺾인 길을 따라 재서 아래 가로의 끝이 꺾인 곳보다 멀다 (직선 거리와 순서가 다르다)', () => {
    const [stroke] = inkStrokes(hook, W, 60, { emPx: 60, regions: null });
    const corner = distAt(stroke, W, 49, 49);
    const tail = distAt(stroke, W, 10, 49);
    const topEnd = distAt(stroke, W, 49, 6);

    expect(topEnd).toBeLessThan(corner);
    expect(tail).toBeGreaterThan(corner);
    // 직선으로 재면 (10, 49)는 시작점 (5, 5)에서 약 44, 꺾인 곳 (49, 49)는 약 62라 순서가 반대다
    expect(Math.hypot(10 - 5, 49 - 5)).toBeLessThan(Math.hypot(49 - 5, 49 - 5));
  });

  it('획 길이(em)는 가장 먼 픽셀까지의 거리를 em으로 나눈 값이다', () => {
    const [stroke] = inkStrokes(hook, W, 60, { emPx: 60, regions: null });
    expect(stroke.lengthEm).toBeCloseTo(stroke.maxDist / 60, 6);
    // 가로 44 + 세로 43 + 가로 37 정도의 길이를 따라간다
    expect(stroke.maxDist).toBeGreaterThan(110);
  });

  it('픽셀은 거리 오름차순으로 정렬돼 있다', () => {
    const [stroke] = inkStrokes(hook, W, 60, { emPx: 60, regions: null });
    for (let i = 1; i < stroke.dist.length; i++)
      expect(stroke.dist[i]).toBeGreaterThanOrEqual(stroke.dist[i - 1]);
  });
});

describe('자모 배정과 순서', () => {
  it('가: 왼쪽 덩이는 초성, 오른쪽 덩이는 모음이고 모음이 더 위에서 시작해도 초성이 먼저다', () => {
    const strokes = inkStrokes(
      bitmap(40, 40, [
        [4, 12, 20, 16],
        [28, 2, 31, 38],
      ]),
      40,
      40,
      { emPx: 40, regions: regionsOf('가') }
    );
    expect(strokes.map((s) => s.jamo)).toEqual([0, 1]);
    expect(strokes[0].start[0]).toBeLessThan(strokes[1].start[0]);
  });

  it('ㅗ꼴(위 짧은 세로 + 아래 긴 가로)은 세로가 먼저다', () => {
    // 고: 초성 ㄱ(위 가로), 모음 ㅗ. 세로와 가로 사이는 한 픽셀 비워 둔다
    const strokes = inkStrokes(
      bitmap(40, 40, [
        [8, 4, 30, 7],
        [18, 22, 21, 27],
        [6, 28, 34, 31],
      ]),
      40,
      40,
      { emPx: 40, regions: regionsOf('고') }
    );
    expect(strokes.map((s) => s.jamo)).toEqual([0, 1, 1]);
    expect(strokes[1].start[1]).toBeLessThan(strokes[2].start[1]);
    expect(strokes[1].start).toEqual([18, 22]);
  });

  it('ㅜ꼴(위 가로 + 아래 세로)은 가로가 먼저다', () => {
    const strokes = inkStrokes(
      bitmap(40, 40, [
        [8, 4, 30, 7],
        [6, 24, 34, 27],
        [18, 28, 21, 36],
      ]),
      40,
      40,
      { emPx: 40, regions: regionsOf('구') }
    );
    const medial = strokes.filter((s) => s.jamo === 1);
    expect(medial.map((s) => s.start)).toEqual([
      [6, 24],
      [18, 28],
    ]);
  });

  it('받침 덩이가 마지막이다', () => {
    const strokes = inkStrokes(
      bitmap(40, 40, [
        [6, 32, 34, 36],
        [4, 6, 20, 10],
        [28, 4, 31, 20],
      ]),
      40,
      40,
      { emPx: 40, regions: regionsOf('각') }
    );
    expect(strokes.map((s) => s.jamo)).toEqual([0, 1, 2]);
  });

  it('한글이 아니면 칸 전체가 한 덩이로 왼쪽에서 오른쪽 순서다 (오른쪽이 더 높아도)', () => {
    const strokes = inkStrokes(
      bitmap(60, 40, [
        [40, 4, 50, 8],
        [6, 24, 16, 28],
      ]),
      60,
      40,
      { emPx: 40, regions: null }
    );
    expect(strokes.map((s) => s.jamo)).toEqual([0, 0]);
    expect(strokes.map((s) => s.start[0])).toEqual([6, 40]);
  });

  it('자모 배정을 무시하면 순서가 달라진다 (같은 가의 배치)', () => {
    const data = bitmap(40, 40, [
      [4, 12, 20, 16],
      [28, 2, 31, 38],
    ]);
    const assigned = inkStrokes(data, 40, 40, {
      emPx: 40,
      regions: regionsOf('가'),
    });
    const ignored = inkStrokes(data, 40, 40, { emPx: 40, regions: null });
    // 배정하면 초성(왼쪽 아래)이 먼저, 한 덩이로 보면 x가 작은 쪽이 먼저라 같지만 jamo 번호가 다르다
    expect(assigned.map((s) => s.jamo)).toEqual([0, 1]);
    expect(ignored.map((s) => s.jamo)).toEqual([0, 0]);
  });
});

describe('이어 쓴 덩이 나누기', () => {
  // 가: 초성은 x < 0.6, 모음은 x >= 0.6인 칸. 60 x 40 칸, 1em = 40px
  const opts = (splitShare?: number) => ({
    emPx: 40,
    regions: regionsOf('가'),
    splitShare,
  });

  it('두 영역에 걸쳐 이어진 막대는 자모마다 한 획씩 두 획이 되고 초성이 먼저다', () => {
    // x 16..56: 초성 영역(x < 36)에 20열, 모음 영역에 20열이 걸린다
    const bar = bitmap(60, 40, [[16, 18, 56, 22]]);
    const strokes = inkStrokes(bar, 60, 40, opts());

    expect(strokes.map((s) => s.jamo)).toEqual([0, 1]);
    expect(strokes[0].start[0]).toBeLessThan(strokes[1].start[0]);
    // 나뉜 획은 각자 자기 픽셀만 그린다(겹치지 않고 합이 막대 전체)
    const all = new Set([...strokes[0].pixels, ...strokes[1].pixels]);
    expect(strokes[0].pixels.length + strokes[1].pixels.length).toBe(all.size);
    expect(all.size).toBe(40 * 4);
  });

  it('나뉜 획의 거리는 자기 부분 안에서 0부터 잰다 (둘째 획도 자기 시작점에서)', () => {
    const bar = bitmap(60, 40, [[16, 18, 56, 22]]);
    const [first, second] = inkStrokes(bar, 60, 40, opts());

    expect(first.dist[0]).toBe(0);
    expect(second.dist[0]).toBe(0);
    expect(second.start[0]).toBeGreaterThanOrEqual(36);
    expect(first.maxDist).toBeLessThan(25);
  });

  it('한 영역에 대부분 있고 이웃 영역으로 조금(비율 아래) 넘친 덩이는 한 획이다', () => {
    // x 4..50: 모음 영역(x >= 36)에 14열(30%)이 걸려 35% 아래
    const bar = bitmap(60, 40, [[4, 18, 50, 22]]);

    expect(inkStrokes(bar, 60, 40, opts())).toHaveLength(1);
  });

  it('비율을 0으로 하면 같은 덩이가 둘로 나뉜다 (비율이 한 획으로 남기는 것임을 보인다)', () => {
    const bar = bitmap(60, 40, [[4, 18, 50, 22]]);

    expect(inkStrokes(bar, 60, 40, opts(0))).toHaveLength(2);
  });

  it('획을 길이 방향으로 가르는 경계(영역 경계에 걸친 가로 막대)는 나누지 않는다', () => {
    // 구: 초성은 y < 0.54. 막대가 y 16..28로 경계(21.6)에 걸려 반반이어도 가르는 선이 막대만큼 길다
    const bar = bitmap(40, 40, [[6, 16, 34, 28]]);
    const strokes = inkStrokes(bar, 40, 40, {
      emPx: 40,
      regions: regionsOf('구'),
    });

    expect(strokes).toHaveLength(1);
  });

  it('한글이 아니면(영역 없음) 나누지 않는다', () => {
    const bar = bitmap(60, 40, [[16, 18, 56, 22]]);

    expect(inkStrokes(bar, 60, 40, { emPx: 40, regions: null })).toHaveLength(
      1
    );
  });
});

describe('paintFront', () => {
  const W = 40;
  const src = bitmap(W, 10, [[2, 4, 38, 6]]);
  const stroke = inkStrokes(src, W, 10, { emPx: 10, regions: null })[0];
  const alphaOf = (out: Uint8ClampedArray, x: number, y = 4) =>
    out[(y * W + x) * 4 + 3];

  it('앞머리 뒤는 다 보이고 앞은 비어 있고 앞머리 얇은 띠만 비친다', () => {
    const out = new Uint8ClampedArray(src.length);
    paintFront(src, out, stroke, 0, 20, 4);

    expect(alphaOf(out, 2)).toBe(255);
    expect(alphaOf(out, 10)).toBe(255);
    // 시작(x = 2)에서 거리 20 = x 22. 앞머리 4px 안쪽(x 18~22)은 비치는 띠다
    const band = alphaOf(out, 20);
    expect(band).toBeGreaterThan(0);
    expect(band).toBeLessThan(255);
    expect(alphaOf(out, 30)).toBe(0);
  });

  it('앞머리가 끝(maxDist + feather)에 닿으면 획이 다 보인다', () => {
    const out = new Uint8ClampedArray(src.length);
    paintFront(src, out, stroke, 0, stroke.maxDist + 4, 4);
    for (let x = 2; x < 38; x++) expect(alphaOf(out, x)).toBe(255);
  });

  it('조금씩 나아가며 그려도 한 번에 그린 것과 같다', () => {
    const stepped = new Uint8ClampedArray(src.length);
    let prev = 0;
    for (const to of [3, 9, 17, 17, 30, stroke.maxDist + 4]) {
      paintFront(src, stepped, stroke, prev, to, 4);
      prev = to;
    }
    const once = new Uint8ClampedArray(src.length);
    paintFront(src, once, stroke, 0, stroke.maxDist + 4, 4);
    expect(stepped).toEqual(once);
  });

  it('되감으면 앞머리 앞쪽이 다시 비워진다', () => {
    const out = new Uint8ClampedArray(src.length);
    paintFront(src, out, stroke, 0, 30, 4);
    paintFront(src, out, stroke, 30, 10, 4);
    expect(alphaOf(out, 25)).toBe(0);
    expect(alphaOf(out, 5)).toBe(255);
  });
});
