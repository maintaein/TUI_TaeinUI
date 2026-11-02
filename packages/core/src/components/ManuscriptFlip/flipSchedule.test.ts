import { describe, expect, it } from 'vitest';
import {
  FLIP_TOTAL,
  MAX_CELLS,
  cellStarts,
  flippedCount,
  gridFor,
  maskClips,
} from './flipSchedule';

describe('gridFor', () => {
  it('작은 상자: 한 변 48px 안팎의 정수 열·행으로 나눈다', () => {
    expect(gridFor(100, 100)).toEqual({ cols: 2, rows: 2 });
    expect(gridFor(320, 200)).toEqual({ cols: 7, rows: 4 });
  });

  it('칸 한 변이 40~56px 안에 든다(상한에 걸리지 않는 크기)', () => {
    for (const [w, h] of [
      [320, 200],
      [400, 240],
      [250, 300],
    ]) {
      const { cols, rows } = gridFor(w, h);
      expect(w / cols).toBeGreaterThanOrEqual(40);
      expect(w / cols).toBeLessThanOrEqual(56);
      expect(h / rows).toBeGreaterThanOrEqual(40);
      expect(h / rows).toBeLessThanOrEqual(56);
    }
  });

  it('큰 상자: 칸 수가 상한을 넘지 않고 칸이 커진다', () => {
    const { cols, rows } = gridFor(1200, 800);
    expect(cols * rows).toBeLessThanOrEqual(MAX_CELLS);
    expect(1200 / cols).toBeGreaterThan(56);
    // 가로세로 비율을 따라 정사각에 가깝다
    expect(1200 / cols / (800 / rows)).toBeGreaterThan(0.6);
    expect(1200 / cols / (800 / rows)).toBeLessThan(1.6);
  });

  it('크기가 0이거나 아주 작아도 최소 한 칸이다', () => {
    expect(gridFor(0, 0)).toEqual({ cols: 1, rows: 1 });
    expect(gridFor(20, 10)).toEqual({ cols: 1, rows: 1 });
  });

  it('열·행은 늘 1 이상의 정수다', () => {
    for (const [w, h] of [
      [1, 1],
      [47, 300],
      [999, 33],
      [5000, 5000],
    ]) {
      const { cols, rows } = gridFor(w, h);
      expect(Number.isInteger(cols) && cols >= 1).toBe(true);
      expect(Number.isInteger(rows) && rows >= 1).toBe(true);
      expect(cols * rows).toBeLessThanOrEqual(MAX_CELLS);
    }
  });
});

describe('cellStarts', () => {
  it('전체 길이는 칸 수와 상관없이 700ms다', () => {
    expect(FLIP_TOTAL).toBeCloseTo(0.7);
    for (const n of [2, 6, 28, 48]) {
      const starts = cellStarts(n);
      // 마지막 칸이 시작한 뒤 칸 하나(200ms)가 끝나면 전체가 끝난다
      expect(starts[n - 1] + 0.2).toBeCloseTo(0.7);
    }
  });

  it('첫 칸은 0, 마지막 칸은 500ms에 시작하고 사이는 같은 간격이다', () => {
    const starts = cellStarts(6);
    expect(starts[0]).toBe(0);
    expect(starts[5]).toBeCloseTo(0.5);
    for (let i = 1; i < 6; i += 1) {
      expect(starts[i] - starts[i - 1]).toBeCloseTo(0.5 / 5);
    }
  });

  it('칸이 하나면 0에 시작하고 전체는 칸 하나의 200ms다', () => {
    expect(cellStarts(1)).toEqual([0]);
  });

  it('칸이 없으면 시작 시각도 없다', () => {
    expect(cellStarts(0)).toEqual([]);
  });
});

describe('flippedCount', () => {
  const starts = cellStarts(6);
  it('칸은 시작한 뒤 100ms(반쯤 돌았을 때) 뒤집힌 것으로 센다', () => {
    expect(flippedCount(starts, 0)).toBe(0);
    expect(flippedCount(starts, 0.099)).toBe(0);
    expect(flippedCount(starts, 0.1)).toBe(1);
    expect(flippedCount(starts, 0.1 + starts[1] - 0.001)).toBe(1);
    expect(flippedCount(starts, 0.1 + starts[1])).toBe(2);
  });

  it('끝에서는 모든 칸이 뒤집혀 있다', () => {
    expect(flippedCount(starts, FLIP_TOTAL)).toBe(6);
  });

  it('시간이 줄면 칸 수도 줄어 글 쓰는 순서의 반대로 돌아온다', () => {
    const counts = [0.7, 0.5, 0.4, 0.3, 0.2, 0.1, 0].map((t) =>
      flippedCount(starts, t)
    );
    for (let i = 1; i < counts.length; i += 1) {
      expect(counts[i]).toBeLessThanOrEqual(counts[i - 1]);
    }
    expect(counts[0]).toBe(6);
    expect(counts.at(-1)).toBe(0);
  });
});

describe('maskClips', () => {
  const HIDDEN = 'polygon(0% 0%, 0% 0%, 0% 0%)';

  it('아무 칸도 안 뒤집혔으면 앞면만 온전하고 뒷면은 가려진다', () => {
    expect(maskClips(0, 3, 2)).toEqual({ front: 'none', back: HIDDEN });
  });

  it('모든 칸이 뒤집혔으면 뒷면만 온전하고 앞면은 가려진다', () => {
    expect(maskClips(6, 3, 2)).toEqual({ front: HIDDEN, back: 'none' });
  });

  it('윗줄이 다 뒤집히면 뒷면은 윗줄 띠, 앞면은 아랫줄 띠다', () => {
    const { front, back } = maskClips(3, 3, 2);
    expect(back).toBe(
      'polygon(0% 0%, 100% 0%, 100% 50%, 0% 50%, 0% 100%, 0% 100%)'
    );
    expect(front).toBe(
      'polygon(0% 50%, 100% 50%, 100% 100%, 0% 100%, 0% 100%, 0% 100%)'
    );
  });

  it('줄 가운데까지 뒤집히면 뒷면은 계단 모양, 앞면은 그 보수다', () => {
    // 4열 3행에서 6칸: 윗줄 4칸 + 둘째 줄 2칸
    const { front, back } = maskClips(6, 4, 3);
    expect(back).toBe(
      'polygon(0% 0%, 100% 0%, 100% 33.333%, 50% 33.333%, 50% 66.667%, 0% 66.667%)'
    );
    expect(front).toBe(
      'polygon(50% 33.333%, 100% 33.333%, 100% 100%, 0% 100%, 0% 66.667%, 50% 66.667%)'
    );
  });

  it('첫 줄 안에서는 뒤집힌 칸만큼의 띠다', () => {
    const { back } = maskClips(1, 4, 2);
    expect(back).toBe(
      'polygon(0% 0%, 100% 0%, 100% 0%, 25% 0%, 25% 50%, 0% 50%)'
    );
  });
});
