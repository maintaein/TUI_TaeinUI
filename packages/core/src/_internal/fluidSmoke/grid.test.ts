import { describe, it, expect } from 'vitest';
import {
  MAX_FRAME_MS,
  advanceIdle,
  canvasPixels,
  fadeFactor,
  fitGrid,
  isExpired,
  splatRadius,
} from './grid';

describe('canvasPixels', () => {
  it('DPR을 1.5로 자른다', () => {
    expect(canvasPixels(1440, 900, 3)).toEqual({ width: 2160, height: 1350 });
  });

  it('상한 아래의 DPR은 그대로 곱한다', () => {
    expect(canvasPixels(1440, 900, 1)).toEqual({ width: 1440, height: 900 });
  });

  it('DPR이 0이나 NaN이면 1로 본다', () => {
    expect(canvasPixels(100, 50, 0)).toEqual({ width: 100, height: 50 });
    expect(canvasPixels(100, 50, Number.NaN)).toEqual({
      width: 100,
      height: 50,
    });
  });

  it('상자가 0이어도 1픽셀 아래로 내려가지 않는다', () => {
    expect(canvasPixels(0, 0, 1)).toEqual({ width: 1, height: 1 });
  });
});

describe('fitGrid', () => {
  it('가로가 긴 화면은 짧은 변(세로)을 맞추고 긴 변을 비율대로 늘린다', () => {
    expect(fitGrid(1440, 900, 128)).toEqual({ width: 205, height: 128 });
  });

  it('세로가 긴 화면은 짧은 변(가로)을 맞춘다', () => {
    expect(fitGrid(900, 1440, 128)).toEqual({ width: 128, height: 205 });
  });

  it('짧은 변이 목표보다 작으면 키우지 않는다', () => {
    expect(fitGrid(200, 100, 128)).toEqual({ width: 200, height: 100 });
  });
});

describe('splatRadius', () => {
  it('짧은 변 대비 반지름의 제곱을 준다(가우시안의 분모)', () => {
    expect(splatRadius(50, 500)).toBeCloseTo(0.01);
  });

  it('짧은 변이 0이어도 유한하다', () => {
    expect(Number.isFinite(splatRadius(10, 0))).toBe(true);
  });
});

describe('수명(시뮬레이션 시간)', () => {
  it('큰 dt 한 번(5초)이 와도 수명은 프레임 상한만큼만 줄어든다', () => {
    expect(advanceIdle(0, 5000)).toBeCloseTo(MAX_FRAME_MS);
    expect(isExpired(advanceIdle(0, 5000))).toBe(false);
  });

  it('음수 dt는 0으로 본다', () => {
    expect(advanceIdle(100, -50)).toBe(100);
  });

  it('작은 dt를 모아 3초가 되면 접힌다', () => {
    let idle = 0;
    let frames = 0;
    while (!isExpired(idle)) {
      idle = advanceIdle(idle, 16);
      frames += 1;
    }
    expect(frames).toBe(Math.ceil(3000 / 16));
    expect(isExpired(idle - 16)).toBe(false);
  });

  it('알파 배율은 끝 0.7초에만 내려가 접는 순간 0이다', () => {
    expect(fadeFactor(0)).toBe(1);
    expect(fadeFactor(2300)).toBe(1);
    expect(fadeFactor(2650)).toBeCloseTo(0.5);
    expect(fadeFactor(3000)).toBe(0);
    expect(fadeFactor(9000)).toBe(0);
  });
});
