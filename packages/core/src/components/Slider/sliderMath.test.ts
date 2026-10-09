import { describe, it, expect } from 'vitest';
import {
  computeBarValues,
  computeTickValues,
  waveAmp,
  waveLift,
  waveScale,
  WAKE_REST_SCALE,
} from './sliderMath';

describe('computeTickValues', () => {
  it('중심 양쪽에 step 간격으로 다섯 개씩, 중심은 빼고 돌려준다', () => {
    const values = computeTickValues(50, 0, 100, 10);

    expect([...values].sort((a, b) => a - b)).toEqual([
      0, 10, 20, 30, 40, 60, 70, 80, 90, 100,
    ]);
    expect(values).not.toContain(50);
  });

  it('step이 트랙 폭의 2%보다 촘촘하면 2% 간격으로 줄인다', () => {
    // step 1, 범위 1000 -> 0.1%라 20(2%) 간격을 쓴다.
    const values = computeTickValues(500, 0, 1000, 1);

    expect(values).toContain(480);
    expect(values).toContain(520);
    expect(values).not.toContain(499);
    expect(values).not.toContain(501);
  });

  it('범위를 벗어나는 쪽은 버린다', () => {
    expect(computeTickValues(0, 0, 100, 10)).toEqual([10, 20, 30, 40, 50]);
    expect(computeTickValues(100, 0, 100, 10)).toEqual([90, 80, 70, 60, 50]);
  });

  it('개수는 범위 크기와 무관하다: 전 구간을 만들지 않는다', () => {
    const small = computeTickValues(5, 0, 10, 1);
    const large = computeTickValues(50000, 0, 100000, 1);

    expect(small).toHaveLength(10);
    expect(large).toHaveLength(10);
  });

  it('범위가 없으면 빈 목록이다', () => {
    expect(computeTickValues(5, 5, 5, 1)).toEqual([]);
    expect(computeTickValues(5, 10, 0, 1)).toEqual([]);
  });

  it('perSide를 주면 한쪽 개수를 늘린다(기본 5)', () => {
    expect(computeTickValues(0, 0, 100, 10, 10)).toHaveLength(10);
    expect(computeTickValues(0, 0, 100, 10)).toHaveLength(5);
  });
});

describe('computeBarValues (wake 막대 위치)', () => {
  it('step이 성기면 step 간격으로 min부터 max까지', () => {
    expect(computeBarValues(0, 100, 25)).toEqual([0, 25, 50, 75, 100]);
  });

  it('step이 촘촘하면 트랙 폭 2% 간격으로 줄인다(막대 51개)', () => {
    const bars = computeBarValues(0, 100, 1);

    expect(bars).toHaveLength(51);
    expect(bars.slice(0, 3)).toEqual([0, 2, 4]);
    expect(bars[50]).toBe(100);
  });

  it('범위가 커져도 막대는 51개를 넘지 않는다', () => {
    expect(computeBarValues(0, 100000, 1)).toHaveLength(51);
  });

  it('min이 0이 아니어도 min에서 시작한다', () => {
    expect(computeBarValues(10, 20, 5)).toEqual([10, 15, 20]);
  });

  it('max가 간격에 안 맞으면 마지막 막대는 max 아래에서 끝난다', () => {
    expect(computeBarValues(0, 10, 3)).toEqual([0, 3, 6, 9]);
  });

  it('범위가 없으면 빈 목록이다', () => {
    expect(computeBarValues(5, 5, 1)).toEqual([]);
  });

  it('computeTickValues와 같은 계산이다: 중심 min에서 오른쪽으로 이어 붙인 것', () => {
    expect(computeBarValues(0, 100, 10).slice(1)).toEqual(
      computeTickValues(0, 0, 100, 10, 10)
    );
  });
});

describe('wake 물결 (WakeSlider.tsx:104-120과 같은 식)', () => {
  it('세기는 속도 절댓값의 smoothstep이고 320에서 1로 포화한다', () => {
    expect(waveAmp(0)).toBe(0);
    expect(waveAmp(160)).toBeCloseTo(0.5, 10);
    expect(waveAmp(320)).toBe(1);
    expect(waveAmp(-320)).toBe(1);
    expect(waveAmp(1000)).toBe(1);
    expect(waveAmp(-160)).toBeCloseTo(0.5, 10);
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

  it('세기 0이면 어디서도 솟지 않는다', () => {
    expect(waveLift(0, 1, 0)).toBe(0);
    expect(waveLift(-1, 1, 0)).toBe(0);
  });

  it('들림 -> scaleY: 0이면 쉬는 높이(6/20), 1이면 최대 높이', () => {
    expect(WAKE_REST_SCALE).toBeCloseTo(0.3, 12);
    expect(waveScale(0)).toBe(WAKE_REST_SCALE);
    expect(waveScale(1)).toBe(1);
    expect(waveScale(0.5)).toBeCloseTo(0.65, 12);
  });
});
