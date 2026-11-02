import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { firstIndexAtLeast, shouldAnimate } from './luminousFlowMotion';
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

describe('팔레트가 한 파일에만 있다', () => {
  // 무엇을 되돌리면 빨개지는가: 다른 소스 파일에 `0x` 6자리 색(팔레트 사본)을 적으면 그 파일 이름이 찍힌다
  it('`0x` 6자리 색 숫자는 luminousFlowPalette.ts 밖의 소스에 없다', () => {
    const dir = __dirname;
    const offenders = readdirSync(dir)
      .filter((name) => /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name))
      .filter((name) => name !== 'luminousFlowPalette.ts')
      .filter((name) =>
        /\b0x[0-9a-f]{6}\b/i.test(readFileSync(join(dir, name), 'utf-8'))
      );
    expect(offenders).toEqual([]);
  });
});

describe('firstIndexAtLeast (알갱이 위치 이진 탐색)', () => {
  // 되돌리면 빨개지는 것: 이진 탐색의 경계(같은 값 반복, 처음, 끝, 없음)가 findIndex와 어긋나는 경우
  it('findIndex와 모든 경계에서 같은 인덱스를 낸다', () => {
    const lengths = new Float64Array([0, 0, 1.5, 1.5, 1.5, 4, 9, 9, 12]);
    const targets = [-1, 0, 0.0001, 1.5, 1.6, 4, 8.99, 9, 9.01, 12, 12.0001];
    for (const target of targets) {
      expect(firstIndexAtLeast(lengths, target)).toBe(
        lengths.findIndex((value) => value >= target)
      );
    }
    expect(firstIndexAtLeast(new Float64Array(0), 1)).toBe(-1);
    expect(firstIndexAtLeast([5], 5)).toBe(0);
  });

  it('긴 누적 길이에서도 모든 값에 findIndex와 같다', () => {
    const lengths = Array.from({ length: 1000 }, (_, i) => i * 3.7 + (i % 3));
    for (let target = -2; target < 3800; target += 7.3) {
      expect(firstIndexAtLeast(lengths, target)).toBe(
        lengths.findIndex((value) => value >= target)
      );
    }
  });
});
