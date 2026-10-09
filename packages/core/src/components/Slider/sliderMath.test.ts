import { describe, it, expect } from 'vitest';
import {
  wakeBarCount,
  waveAmp,
  waveLift,
  waveScale,
  WAKE_BAR_GAP_PX,
  WAKE_BAR_MAX_HEIGHT,
  WAKE_DEFAULT_BARS,
  WAKE_MAX_BARS,
  WAKE_MIN_BARS,
  WAKE_MIN_REACH_PX,
  WAKE_REACH_PX,
  WAKE_REST_SCALE,
  LINE_BAR_HOVER,
  LINE_BAR_REST,
  LINE_HOVER,
  LINE_REST,
  LINE_WAVE_MAX,
  THUMB_PX,
  lineShapes,
  linePath,
  lineThickness,
} from './sliderMath';

describe('wakeBarCount (트랙 폭 -> 막대 개수)', () => {
  it('간격 8px마다 하나: 폭 129 -> 16개, 320 -> 40개', () => {
    expect(wakeBarCount(129)).toBe(16);
    expect(wakeBarCount(320)).toBe(40);
    expect(wakeBarCount(WAKE_BAR_GAP_PX * 20)).toBe(20);
  });

  it('아주 좁아도 8개, 아주 넓어도 48개다', () => {
    expect(wakeBarCount(0)).toBe(WAKE_MIN_BARS);
    expect(wakeBarCount(30)).toBe(8);
    expect(wakeBarCount(384)).toBe(48);
    expect(wakeBarCount(5000)).toBe(WAKE_MAX_BARS);
    expect(WAKE_MIN_BARS).toBe(8);
    expect(WAKE_MAX_BARS).toBe(48);
  });

  it('기본 개수는 상하한 안에 있다', () => {
    expect(WAKE_DEFAULT_BARS).toBeGreaterThanOrEqual(WAKE_MIN_BARS);
    expect(WAKE_DEFAULT_BARS).toBeLessThanOrEqual(WAKE_MAX_BARS);
  });
});

describe('wake 물결 (WakeSlider.tsx:104-120과 같은 식)', () => {
  it('세기는 속도 절댓값의 smoothstep이고 120에서 1로 포화한다', () => {
    expect(waveAmp(0)).toBe(0);
    expect(waveAmp(60)).toBeCloseTo(0.5, 10);
    expect(waveAmp(120)).toBe(1);
    expect(waveAmp(-120)).toBe(1);
    expect(waveAmp(1000)).toBe(1);
    expect(waveAmp(-60)).toBeCloseTo(0.5, 10);
  });

  it('트랙 폭의 100%/s로 끌면 들림이 0.8을 넘는다', () => {
    expect(waveAmp(100)).toBeGreaterThan(0.8);
    expect(waveAmp(-100)).toBeGreaterThan(0.8);
  });

  it('아주 느린 속도는 0으로 잘려 막대가 쉬는 높이에 딱 맞는다', () => {
    expect(waveAmp(0.1)).toBe(0);
    expect(waveScale(waveLift(0, 1, waveAmp(0.1)))).toBe(WAKE_REST_SCALE);
  });

  it('머리 자리는 세기 그대로 솟는다', () => {
    expect(waveLift(0, 1, 1)).toBe(1);
    expect(waveLift(0, -1, 0.5)).toBe(0.5);
  });

  it('머리 뒤쪽이 앞쪽보다 넓게 솟는다 (오른쪽으로 갈 때 d<0이 뒤)', () => {
    // 속도 최대: r=6, 뒤 9.6, 앞 4.2
    expect(waveLift(-2, 1, 1)).toBeCloseTo(0.8966766701, 9);
    expect(waveLift(2, 1, 1)).toBeCloseTo(0.5373650468, 9);
    expect(waveLift(-9.5, 1, 1)).toBeGreaterThan(0);
    expect(waveLift(-9.7, 1, 1)).toBe(0);
    expect(waveLift(4.1, 1, 1)).toBeGreaterThan(0);
    expect(waveLift(4.3, 1, 1)).toBe(0);
  });

  it('왼쪽으로 가면 앞뒤가 뒤집힌다', () => {
    expect(waveLift(2, -1, 1)).toBeCloseTo(0.8966766701, 9);
    expect(waveLift(-2, -1, 1)).toBeCloseTo(0.5373650468, 9);
    expect(waveLift(4.3, -1, 1)).toBeCloseTo(0.5814477366, 9);
  });

  it('속도가 느리면 반경이 줄어 물결이 좁고 낮다', () => {
    // 속도 160 -> amp 0.5: r=3.75, 뒤 6, 앞 2.625
    expect(waveLift(-1, 1, 0.5)).toBeCloseTo(0.4665063509, 9);
    expect(waveLift(1, 1, 0.5)).toBeCloseTo(0.3413352561, 9);
    expect(waveLift(-6.1, 1, 0.5)).toBe(0);
  });

  it('반경은 px 기준이다: 간격 8px에서 48px는 6막대, 간격이 달라지면 막대 수가 달라진다', () => {
    expect(WAKE_REACH_PX).toBe(48);
    expect(WAKE_MIN_REACH_PX).toBe(12);
    // 최대 세기: 앞쪽 반경 = 48 * 0.7 px
    const ahead = WAKE_REACH_PX * 0.7;
    expect(waveLift(ahead / 8 - 0.01, 1, 1, 8)).toBeGreaterThan(0);
    expect(waveLift(ahead / 8 + 0.01, 1, 1, 8)).toBe(0);
    // 뒤쪽 반경 = 48 * 1.6 px = 6 * 1.6 막대
    expect(waveLift(-(6 * 1.6) + 0.01, 1, 1, 8)).toBeGreaterThan(0);
    expect(waveLift(-(6 * 1.6) - 0.01, 1, 1, 8)).toBe(0);
    // 간격이 좁으면(4px) 같은 48px가 12막대다
    expect(waveLift(-(12 * 1.6) + 0.01, 1, 1, 4)).toBeGreaterThan(0);
    expect(waveLift(-(12 * 1.6) - 0.01, 1, 1, 4)).toBe(0);
    // 최소 반경 12px는 간격 8에서 1.5막대
    expect(waveLift(1.5 * 1.6 - 0.01, 1, 0.003, 8)).toBe(0);
    expect(waveLift(-(1.5 * 1.6) + 0.01, 1, 0.003, 8)).toBeGreaterThan(0);
  });

  it('세기 0이면 어디서도 솟지 않는다', () => {
    expect(waveLift(0, 1, 0)).toBe(0);
    expect(waveLift(-1, 1, 0)).toBe(0);
  });

  it('들림 -> scaleY: 0이면 쉬는 높이(6/24), 1이면 최대 높이(24px)', () => {
    expect(WAKE_BAR_MAX_HEIGHT).toBe(24);
    expect(WAKE_REST_SCALE).toBeCloseTo(0.25, 12);
    expect(waveScale(0)).toBe(WAKE_REST_SCALE);
    expect(waveScale(1)).toBe(1);
    expect(waveScale(0.5)).toBeCloseTo(0.625, 12);
  });
});

describe('라인 두께 T(x) (default·bar)', () => {
  const sweep = (dir: number, amp: number, base = LINE_REST) =>
    Array.from({ length: 241 }, (_, i) => i - 120).map((d) => ({
      d,
      t: lineThickness(d, dir, amp, base),
    }));

  it('쉬는 상태(세기 0)에서는 어디서나 바탕 두께다', () => {
    for (const { t } of sweep(1, 0)) expect(t).toBe(LINE_REST);
    for (const { t } of sweep(1, 0, LINE_HOVER)) expect(t).toBe(LINE_HOVER);
  });

  it('두께 상수: 쉬는 6 / 호버 9, bar는 8 / 12, 물결 최대 20', () => {
    expect([LINE_REST, LINE_HOVER]).toEqual([6, 9]);
    expect([LINE_BAR_REST, LINE_BAR_HOVER]).toEqual([8, 12]);
    expect(LINE_WAVE_MAX).toBe(20);
  });

  it('물결 중에는 머리 자리가 가장 두껍고 세기 1이면 정확히 20px이다', () => {
    const swing = sweep(1, 1);
    const top = swing.reduce((a, b) => (b.t > a.t ? b : a));

    expect(top.d).toBe(0);
    expect(top.t).toBe(LINE_WAVE_MAX);
    expect(lineThickness(0, 1, 0.5, LINE_REST)).toBeCloseTo(6 + 0.5 * 14, 12);
  });

  it('어떤 세기·바탕에서도 20px을 넘지 않고 바탕 아래로 얇아지지 않는다', () => {
    for (const base of [LINE_REST, LINE_HOVER, LINE_BAR_REST, LINE_BAR_HOVER]) {
      for (const amp of [0.1, 0.5, 1]) {
        for (const dir of [1, -1]) {
          for (const { t } of sweep(dir, amp, base)) {
            expect(t).toBeLessThanOrEqual(LINE_WAVE_MAX);
            expect(t).toBeGreaterThanOrEqual(base);
          }
        }
      }
    }
  });

  it('뒤쪽 범위가 앞쪽보다 넓다 (오른쪽으로 가면 왼쪽이 뒤)', () => {
    const swollen = (dir: number, side: (d: number) => boolean) =>
      sweep(dir, 1).filter(({ d, t }) => side(d) && t > LINE_REST).length;

    expect(swollen(1, (d) => d < 0)).toBeGreaterThan(swollen(1, (d) => d > 0));
    expect(swollen(-1, (d) => d > 0)).toBeGreaterThan(
      swollen(-1, (d) => d < 0)
    );
    // 같은 식: 뒤 반경 48 * 1.6, 앞 반경 48 * 0.7 (px, 세기 1)
    expect(lineThickness(-48 * 1.6 + 1, 1, 1, LINE_REST)).toBeGreaterThan(
      LINE_REST
    );
    expect(lineThickness(-48 * 1.6 - 1, 1, 1, LINE_REST)).toBe(LINE_REST);
    expect(lineThickness(48 * 0.7 - 1, 1, 1, LINE_REST)).toBeGreaterThan(
      LINE_REST
    );
    expect(lineThickness(48 * 0.7 + 1, 1, 1, LINE_REST)).toBe(LINE_REST);
  });

  it('wake와 같은 식이다: 들림은 waveLift를 px 그대로(gap 1) 쓴다', () => {
    for (const d of [-60, -20, -3, 0, 5, 20, 30]) {
      expect(lineThickness(d, 1, 0.7, LINE_REST)).toBeCloseTo(
        LINE_REST + waveLift(d, 1, 0.7, 1) * (LINE_WAVE_MAX - LINE_REST),
        12
      );
    }
  });
});

describe('linePath (두께 배열 -> 경로)', () => {
  const points = (d: string) =>
    [...d.matchAll(/[ML]([\d.-]+),([\d.-]+)/g)].map((m) => ({
      x: Number(m[1]),
      y: Number(m[2]),
    }));

  it('상수 두께면 알약이다: 위 가장자리 y=9, 아래 y=15, 끝은 반지름 3의 반원 둘', () => {
    const d = linePath(200, () => 6);
    const ys = points(d).map((p) => p.y);

    expect(new Set(ys)).toEqual(new Set([9, 15]));
    expect(d.match(/A3,3 0 0 1/g)).toHaveLength(2);
    expect(d.startsWith('M3,9')).toBe(true);
    expect(d.endsWith('Z')).toBe(true);
    // 오른쪽 반원의 중심 x는 200 - 3
    expect(Math.max(...points(d).map((p) => p.x))).toBe(197);
  });

  it('inset은 안쪽으로 들인다: 0.5 들이면 위 9.5, 반지름 2.5', () => {
    const d = linePath(200, () => 6, 0.5);

    expect(new Set(points(d).map((p) => p.y))).toEqual(new Set([9.5, 14.5]));
    expect(d.match(/A2\.5,2\.5 0 0 1/g)).toHaveLength(2);
    expect(d.startsWith('M3,9.5')).toBe(true);
  });

  it('두께가 변하면 가장자리가 따라간다: 가운데가 부푼다', () => {
    const d = linePath(200, (x) => (x === 101 ? 20 : 6));
    const mid = points(d).find((p) => p.x === 101 && p.y < 12);

    expect(mid?.y).toBe(2);
  });

  it('표본은 2px 간격이다', () => {
    const xs = points(linePath(200, () => 6))
      .map((p) => p.x)
      .filter((x, i, all) => all.indexOf(x) === i);

    for (let i = 2; i < xs.length - 1; i++) expect(xs[i] - xs[i - 1]).toBe(2);
  });
});

describe('lineShapes (상태 -> 그림)', () => {
  const base = {
    width: 200,
    fillPct: 30,
    roundEnd: false,
    base: LINE_REST,
    headPct: 30,
    dir: 1,
    amp: 0,
  };

  it('clip은 값 위치(폭 * 값%)이고 폭 안으로 잘린다', () => {
    expect(lineShapes(base).clip).toBe(60);
    expect(lineShapes({ ...base, fillPct: 150 }).clip).toBe(200);
    expect(lineShapes({ ...base, fillPct: -5 }).clip).toBe(0);
  });

  it('default는 채움 모양이 트랙 전체, bar는 값 위치에서 둥글게 끝난다', () => {
    expect(lineShapes(base).fill).toBe(linePath(200, () => 6));
    expect(lineShapes({ ...base, roundEnd: true }).fill).toBe(
      linePath(60, () => 6)
    );
  });

  it('안 채운 부분은 테두리 선이 가운데에 그려지도록 0.5 들인다', () => {
    expect(lineShapes(base).track).toBe(linePath(200, () => 6, 0.5));
  });

  it('머리 중심은 (폭 - 머리 폭) 위를 움직인다: 물결은 그 x에서 가장 두껍다', () => {
    const shape = lineShapes({ ...base, headPct: 50, amp: 1 }).fill;
    const headX = THUMB_PX / 2 + 0.5 * (200 - THUMB_PX);
    const top = [...shape.matchAll(/[ML]([\d.-]+),([\d.-]+)/g)]
      .map((m) => ({ x: Number(m[1]), y: Number(m[2]) }))
      .filter((p) => p.y < 12)
      .reduce((a, b) => (b.y < a.y ? b : a));

    expect(Math.abs(top.x - headX)).toBeLessThanOrEqual(2);
    expect(top.y).toBeCloseTo(12 - LINE_WAVE_MAX / 2, 1);
  });
});
