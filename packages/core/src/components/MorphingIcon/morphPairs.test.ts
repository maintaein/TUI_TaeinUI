import { describe, expect, it } from 'vitest';
import {
  flatten,
  MORPH_PAIRS,
  pointsAttr,
  type MorphingPair,
} from './morphPairs';

const pairs = Object.keys(MORPH_PAIRS) as MorphingPair[];

describe('morphPairs', () => {
  it('짝은 다섯이다', () => {
    expect(pairs).toEqual([
      'menu-close',
      'plus-check',
      'play-pause',
      'search-close',
      'expand-collapse',
    ]);
  });

  describe.each(pairs)('%s', (pair) => {
    const [from, to] = MORPH_PAIRS[pair];

    it('두 상태의 선 개수가 같다', () => {
      expect(from.length).toBe(to.length);
    });

    it('선마다 끝점 수가 같다', () => {
      expect(from.map((l) => l.points.length)).toEqual(
        to.map((l) => l.points.length)
      );
    });

    it('끝점은 둘 이상이고 좌표 수가 짝수다', () => {
      for (const l of [...from, ...to]) {
        expect(l.points.length).toBeGreaterThanOrEqual(4);
        expect(l.points.length % 2).toBe(0);
      }
    });

    it('모든 좌표가 0 이상 24 이하다', () => {
      for (const l of [...from, ...to]) {
        for (const v of l.points) {
          expect(v).toBeGreaterThanOrEqual(0);
          expect(v).toBeLessThanOrEqual(24);
        }
      }
    });

    it('opacity 0인 선은 길이 0(모든 끝점이 한 점)이고 보이는 선은 길이가 있다', () => {
      for (const l of [...from, ...to]) {
        const xs = l.points.filter((_, i) => i % 2 === 0);
        const ys = l.points.filter((_, i) => i % 2 === 1);
        const dot = new Set(xs).size === 1 && new Set(ys).size === 1;
        expect(dot).toBe(l.opacity === 0);
      }
    });

    it('편 배열의 길이도 두 상태가 같다', () => {
      expect(Object.keys(flatten(from))).toEqual(Object.keys(flatten(to)));
    });
  });

  it('menu-close는 가운데 줄만 사라지고 닫기는 X 두 줄이다', () => {
    const [menu, close] = MORPH_PAIRS['menu-close'];
    expect(menu.map((l) => l.opacity)).toEqual([1, 1, 1]);
    expect(close.map((l) => l.opacity)).toEqual([1, 0, 1]);
  });

  it('pointsAttr은 좌표를 x,y 쌍으로 잇고 군더더기 소수를 자른다', () => {
    expect(pointsAttr([1, 2, 3.5, 4])).toBe('1,2 3.5,4');
    expect(pointsAttr([0.1 + 0.2, 1 / 3])).toBe('0.3,0.333');
  });
});
