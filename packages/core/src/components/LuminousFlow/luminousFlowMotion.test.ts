import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  firstIndexAtLeast,
  shouldAnimate,
  visibleSegments,
} from './luminousFlowMotion';
import { POSE_COUNT, createScene } from './luminousFlowScene';
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

describe('visibleSegments (보이는 구간에 닿는 구간 번호 범위)', () => {
  it('손으로 만든 단조 배열에서 앞뒤 경계가 맞다', () => {
    // 점 5개의 y 범위: [0,10] [5,20] [15,30] [25,40] [35,50]
    const preMaxY = [10, 20, 30, 40, 50];
    const sufMinY = [0, 5, 15, 25, 35];
    // 25~27: 최댓값이 25 이상인 첫 점이 2라 구간 1부터, 최솟값이 28 이상인 첫 점이 4라 구간 3까지
    expect(visibleSegments(preMaxY, sufMinY, 25, 27, 0)).toEqual({
      first: 1,
      last: 3,
    });
    // 모두 덮으면 점 5개 사이의 구간 4개 전부
    expect(visibleSegments(preMaxY, sufMinY, -100, 500, 0)).toEqual({
      first: 0,
      last: 3,
    });
    // 전부 보이는 구간 위쪽 밖이면 first가 점 수라 last보다 크다
    const above = visibleSegments(preMaxY, sufMinY, 200, 220, 0);
    expect(above.first).toBe(5);
    expect(above.last).toBeLessThan(above.first);
    // 전부 보이는 구간 아래쪽 밖이면 last가 first보다 작다
    const below = visibleSegments(preMaxY, sufMinY, -100, -60, 0);
    expect(below.last).toBeLessThan(below.first);
  });

  // 되돌리면 빨개지는 것: 어느 한쪽 경계를 한 점 앞이나 뒤로 옮기면 직접 훑어 찾은 보이는 구간이 범위 밖으로 빠진다
  it('실제 장면에서 직접 훑어 찾은 보이는 구간을 하나도 빠뜨리지 않고, 훨씬 좁다', () => {
    const scene = createScene(12);
    const margin = 50;
    let narrowed = 0;
    let checked = 0;
    for (const strand of scene.strands) {
      const count = strand.poses[0].length;
      const { poses, preMaxY, sufMinY } = strand;
      for (const top of [-300, 0, 777, 2500, 4000, scene.height - 100]) {
        for (const span of [120, 900]) {
          const bottom = top + span;
          const { first, last } = visibleSegments(
            preMaxY,
            sufMinY,
            top,
            bottom
          );
          for (const fraction of [0, 0.37, 0.99]) {
            const pose = Math.floor(fraction * POSE_COUNT);
            const mix = fraction * POSE_COUNT - pose;
            const y = (sample: number) =>
              poses[pose][sample][1] +
              (poses[pose + 1][sample][1] - poses[pose][sample][1]) * mix;
            for (let sample = 0; sample < count - 1; sample++) {
              const drawn = !(
                Math.max(y(sample), y(sample + 1)) < top - margin ||
                Math.min(y(sample), y(sample + 1)) > bottom + margin
              );
              if (drawn) {
                checked++;
                expect(sample).toBeGreaterThanOrEqual(first);
                expect(sample).toBeLessThanOrEqual(last);
              }
            }
          }
          if (last - first + 1 < count / 4) narrowed++;
        }
      }
    }
    expect(checked).toBeGreaterThan(1000);
    expect(narrowed).toBeGreaterThan(100);
  });
});
