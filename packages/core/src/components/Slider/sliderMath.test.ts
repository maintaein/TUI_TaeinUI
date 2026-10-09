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
