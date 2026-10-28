import { describe, expect, it } from 'vitest';
import { shouldAnimate } from './luminousFlowMotion';
import { palette, paletteChannels } from './luminousFlowPalette';

const running = { reduced: false, hidden: false, visible: true, paused: false };

describe('shouldAnimate (rAF를 예약할지의 유일한 조건)', () => {
  it('아무것도 걸리지 않으면 이어 그린다', () => {
    expect(shouldAnimate(running)).toBe(true);
  });

  // 무엇을 되돌리면 빨개지는가: 네 조건 중 하나라도 식에서 빠지면 해당 줄이 빨개진다
  it.each([
    ['reduced', { reduced: true }],
    ['hidden', { hidden: true }],
    ['visible 아님', { visible: false }],
    ['paused', { paused: true }],
  ])('%s면 이어 그리지 않는다', (_name, override) => {
    expect(shouldAnimate({ ...running, ...override })).toBe(false);
  });
});

describe('고정 팔레트', () => {
  it('사용자가 정한 시안 팔레트 값 그대로다', () => {
    expect(palette).toEqual({
      background: '#000000',
      cyan: '#03b3c3',
      blue: '#0e5ea5',
      glow: '#7fe3ee',
      depth: '#324555',
    });
    expect(paletteChannels).toEqual({
      cyan: '3 179 195',
      blue: '14 94 165',
      glow: '127 227 238',
    });
  });
});
