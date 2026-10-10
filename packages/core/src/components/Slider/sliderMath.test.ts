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
  WAKE_FULL_SPEED_PX,
  WAKE_MIN_BARS,
  WAKE_MIN_REACH_PX,
  WAKE_REACH_PX,
  WAKE_REST_SCALE,
  WAKE_SUBSTEP_S,
  WAKE_SETTLE,
  WAKE_GLIDE,
  WAKE_SMOOTHING,
  stepWakeSprings,
  wakeSpringsRested,
  nextDisplayLock,
  SNAP_PX,
  CAUGHT_PX,
  stepWidthPx,
  type WakeSprings,
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
  it('간격 8px마다 하나: 폭 129 -> 16개, 320 -> 40개, 806 -> 100개', () => {
    expect(wakeBarCount(129)).toBe(16);
    expect(wakeBarCount(320)).toBe(40);
    expect(wakeBarCount(806)).toBe(100);
    expect(wakeBarCount(WAKE_BAR_GAP_PX * 20)).toBe(20);
  });

  it('아주 좁아도 8개, 아주 넓어도 160개다 (1280px 트랙까지 간격 8px)', () => {
    expect(wakeBarCount(0)).toBe(WAKE_MIN_BARS);
    expect(wakeBarCount(30)).toBe(8);
    expect(wakeBarCount(1280)).toBe(160);
    expect(wakeBarCount(2000)).toBe(160);
    expect(wakeBarCount(5000)).toBe(WAKE_MAX_BARS);
    expect(WAKE_MIN_BARS).toBe(8);
    expect(WAKE_MAX_BARS).toBe(160);
  });

  it('기본 개수는 상하한 안에 있다', () => {
    expect(WAKE_DEFAULT_BARS).toBeGreaterThanOrEqual(WAKE_MIN_BARS);
    expect(WAKE_DEFAULT_BARS).toBeLessThanOrEqual(WAKE_MAX_BARS);
  });
});

describe('wake 물결 (WakeSlider.tsx:104-120과 같은 식)', () => {
  it('세기는 속도(px/s) 절댓값의 smoothstep이고 960에서 1로 포화한다', () => {
    expect(WAKE_FULL_SPEED_PX).toBe(960);
    expect(waveAmp(0)).toBe(0);
    expect(waveAmp(480)).toBeCloseTo(0.5, 10);
    expect(waveAmp(960)).toBe(1);
    expect(waveAmp(-960)).toBe(1);
    expect(waveAmp(5000)).toBe(1);
    expect(waveAmp(-480)).toBeCloseTo(0.5, 10);
  });

  it('약하게 끌면 약하고 세게 끌면 최대다: 300px/s는 0.5 미만, 960px/s 이상은 1', () => {
    expect(waveAmp(300)).toBeLessThan(0.5);
    expect(waveAmp(300)).toBeGreaterThan(0.1);
    expect(waveAmp(-300)).toBeLessThan(0.5);
    expect(waveAmp(960)).toBe(1);
    expect(waveAmp(1500)).toBe(1);
    // 옛 기준(150)에서는 150px/s가 이미 최대였다.
    expect(waveAmp(150)).toBeLessThan(0.1);
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

describe('wake 두 스프링 (WakeSlider.tsx:91-95)', () => {
  const REST: WakeSprings = { x: 0, v: 0, s: 0, ds: 0 };

  /** 목표를 100으로 계단 입력하고 frame초 간격으로 total초 동안 돌린 궤적. */
  const run = (frame: number, total: number): WakeSprings[] => {
    const out: WakeSprings[] = [];
    let state = REST;
    for (let t = 0; t < total - 1e-9; t += frame) {
      state = stepWakeSprings(state, 100, frame);
      out.push(state);
    }
    return out;
  };

  it('상수는 원본 값이다: SETTLE 9.23, glide 0.3, smoothing 100', () => {
    expect(WAKE_SETTLE).toBe(9.23);
    expect(WAKE_GLIDE).toBe(0.3);
    expect(WAKE_SMOOTHING).toBe(100);
  });

  it('머리는 임계 감쇠라 목표를 넘지 않고 줄곧 다가가 정착한다', () => {
    for (const frame of [0.001, 0.016, 0.064]) {
      const path = run(frame, 3);
      let prev = 0;
      for (const { x } of path) {
        expect(x).toBeLessThanOrEqual(100 + 1e-9);
        expect(x).toBeGreaterThanOrEqual(prev - 1e-9);
        prev = x;
      }
      expect(path[path.length - 1].x).toBeCloseTo(100, 3);
    }
  });

  it('걸러진 속도는 과감쇠라 머리 속도를 넘지 않고 음수로 흔들리지도 않는다', () => {
    const path = run(0.016, 3);
    const peakV = Math.max(...path.map(({ v }) => v));
    for (const { s } of path) {
      expect(s).toBeLessThanOrEqual(peakV + 1e-9);
      expect(s).toBeGreaterThanOrEqual(-1e-9);
    }
    // 걸러진 속도는 머리 속도보다 늦게 정점에 닿는다.
    const peakAt = (key: 'v' | 's') =>
      path.findIndex(
        (state) => state[key] === Math.max(...path.map((p) => p[key]))
      );
    expect(peakAt('s')).toBeGreaterThan(peakAt('v'));
  });

  it('계단 입력에 걸러진 속도가 0 기울기로 출발한다: 시간에 대해 3제곱으로 자란다', () => {
    const at = (ms: number): WakeSprings => {
      let state = REST;
      for (let i = 0; i < ms; i++) state = stepWakeSprings(state, 100, 0.001);
      return state;
    };
    const s5 = at(5).s;
    const s10 = at(10).s;

    expect(s5).toBeGreaterThan(0);
    // 기울기가 0에서 시작하면 두 배 시간에 8배(3제곱), 처음부터 기울기가 있으면 2배다.
    expect(s10 / s5).toBeGreaterThan(5);
    // 머리 속도는 같은 구간에서 선형으로 자란다(2배 근처).
    expect(at(10).v / at(5).v).toBeLessThan(2.2);
    // 처음 1ms에 걸러진 속도는 머리 속도의 1000분의 1도 안 된다.
    expect(at(1).s).toBeLessThan(at(1).v / 1000);
  });

  it('프레임 간격이 커도(200ms, 1s) 발산하지 않고 넘치지도 않는다', () => {
    for (const frame of [0.2, 1]) {
      const path = run(frame, 10);
      for (const { x, v, s } of path) {
        expect(
          Number.isFinite(x) && Number.isFinite(v) && Number.isFinite(s)
        ).toBe(true);
        expect(x).toBeLessThanOrEqual(100 + 1e-9);
        expect(s).toBeGreaterThanOrEqual(-1e-9);
        expect(s).toBeLessThan(1000);
      }
      expect(path[path.length - 1].x).toBeCloseTo(100, 3);
    }
  });

  it('하위 단계는 1ms다 (프레임이 이보다 크면 쪼개 적분한다)', () => {
    expect(WAKE_SUBSTEP_S).toBe(0.001);
    // 한 번에 200ms를 줘도 쪼개 돌린 것과 같다(같은 하위 단계 크기).
    const once = stepWakeSprings(REST, 100, 0.2);
    let split = REST;
    for (let i = 0; i < 200; i++) split = stepWakeSprings(split, 100, 0.001);
    expect(once.x).toBeCloseTo(split.x, 8);
    expect(once.s).toBeCloseTo(split.s, 8);
  });

  it('선형이다: 거리를 두 배로 하면 속도도 두 배라 px/s로 읽어도 폭과 무관하다', () => {
    const a = stepWakeSprings(REST, 50, 0.08);
    const b = stepWakeSprings(REST, 100, 0.08);
    expect(b.s).toBeCloseTo(2 * a.s, 9);
    expect(b.x).toBeCloseTo(2 * a.x, 9);
  });

  it('wakeSpringsRested: 목표에 닿고 속도가 없고 걸러진 속도가 물결이 안 될 만큼 작아야 쉰다', () => {
    const at = (state: Partial<WakeSprings>, target = 0): boolean =>
      wakeSpringsRested({ ...REST, ...state }, target, 2);

    expect(at({})).toBe(true);
    expect(at({ x: 0.001 })).toBe(true);
    expect(at({ x: 1 })).toBe(false);
    expect(at({ v: 5 })).toBe(false);
    expect(at({ s: 200 })).toBe(false);
    // 10 단위/s * 2px = 20px/s는 세기가 FLAT(0.002) 아래라 물결이 없다.
    expect(at({ s: 10 })).toBe(true);
  });
});

describe('보이는 위치 (값이 한 번에 바뀌어도 순간이동하지 않는다)', () => {
  const lock = (p: Partial<Parameters<typeof nextDisplayLock>[0]> = {}) =>
    nextDisplayLock({
      locked: false,
      dragging: true,
      stepPx: 7.8,
      gapPx: 0,
      jumpPx: 0,
      ...p,
    });

  it('상수: 한 단계 12px 이하면 그대로, 0.5px 안이면 따라잡음', () => {
    expect(SNAP_PX).toBe(12);
    expect(CAUGHT_PX).toBe(0.5);
  });

  it('stepWidthPx: 한 단계가 머리 중심이 움직이는 길이(트랙 폭 - 머리 24)에서 차지하는 몫이다', () => {
    // 폭 806px, step 1 / 범위 100 -> 782 * 0.01 = 7.82px
    expect(stepWidthPx(1, 0, 100, 806)).toBeCloseTo(7.82, 6);
    expect(stepWidthPx(50, 0, 100, 806)).toBeCloseTo(391, 6);
    // 200px 트랙, 범위 -50~50
    expect(stepWidthPx(5, -50, 50, 200)).toBeCloseTo(8.8, 6);
    // 범위가 없으면 0(0으로 나누지 않는다)
    expect(stepWidthPx(1, 10, 10, 200)).toBe(0);
  });

  it('끄는 중 한 단계가 12px 이하(7.8)면 머리가 목표를 그대로 따른다: 한 번에 두 단계가 바뀌어도 같다', () => {
    expect(lock({ stepPx: 7.8, locked: true, jumpPx: 15.6, gapPx: 30 })).toBe(
      true
    );
    expect(lock({ stepPx: SNAP_PX })).toBe(true);
  });

  it('끄는 중 한 단계가 12px을 넘으면(step 50, 403px) 늘 스프링이다: 잠겨 있었어도 풀린다', () => {
    expect(lock({ stepPx: 403 })).toBe(false);
    expect(lock({ stepPx: SNAP_PX + 0.01, locked: true })).toBe(false);
  });

  it('잡지 않은 변화(키보드, 값 prop)는 늘 스프링이다', () => {
    expect(lock({ dragging: false, gapPx: 0 })).toBe(false);
    expect(lock({ dragging: false, locked: true })).toBe(false);
  });

  it('누른 순간의 첫 점프(트랙 클릭)는 스프링이다: 잠기지 않고, 따라잡은 뒤 잠긴다', () => {
    expect(lock({ jumpPx: SNAP_PX + 0.01 })).toBe(false);
    expect(lock({ jumpPx: 0, gapPx: 281 })).toBe(false);
    expect(lock({ jumpPx: 0, gapPx: 0.49 })).toBe(true);
    expect(lock({ jumpPx: 0, gapPx: 0.5 })).toBe(false);
  });

  it('잠긴 뒤에는 빠른 끌기로 크게 바뀌어도 목표를 그대로 따른다', () => {
    expect(lock({ locked: true, jumpPx: 100, gapPx: 50 })).toBe(true);
  });

  it('목표가 200px 점프해도 넘치지 않고 0.3초 안에 0.5px 이내로 닿는다', () => {
    let state: WakeSprings = { x: 0, v: 0, s: 0, ds: 0 };
    let elapsed = 0;
    for (; elapsed < 300; elapsed += 16) {
      state = stepWakeSprings(state, 200, 0.016);
      expect(state.x).toBeLessThanOrEqual(200);
    }
    expect(state.x).toBeGreaterThan(0);
    expect(200 - state.x).toBeLessThan(0.5);
    // 첫 프레임은 아직 멀다(순간이동이 아니다).
    expect(
      stepWakeSprings({ x: 0, v: 0, s: 0, ds: 0 }, 200, 0.016).x
    ).toBeLessThan(20);
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
