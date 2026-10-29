import { describe, it, expect } from 'vitest';
import { jamoRegions, polygonCss, type Polygon } from './jamoRegions';

const bounds = (polygon: Polygon) => {
  const xs = polygon.map(([x]) => x);
  const ys = polygon.map(([, y]) => y);
  return {
    left: Math.min(...xs),
    right: Math.max(...xs),
    top: Math.min(...ys),
    bottom: Math.max(...ys),
  };
};

/** 신발끈 공식 */
const area = (polygon: Polygon): number =>
  Math.abs(
    polygon.reduce((sum, [x, y], i) => {
      const [nx, ny] = polygon[(i + 1) % polygon.length];
      return sum + (x * ny - nx * y);
    }, 0)
  ) / 2;

const contains = (polygon: Polygon, px: number, py: number): boolean => {
  let inside = false;
  polygon.forEach(([x, y], i) => {
    const [nx, ny] = polygon[(i + 1) % polygon.length];
    if (y > py !== ny > py && px < ((nx - x) * (py - y)) / (ny - y) + x) {
      inside = !inside;
    }
  });
  return inside;
};

const regionsOf = (char: string) => {
  const regions = jamoRegions(char);
  if (!regions) throw new Error(`${char}은 한글 음절이어야 합니다`);
  return regions;
};

describe('jamoRegions', () => {
  describe('여섯 유형', () => {
    it('세로 모음, 받침 없음 (가): 초성은 왼쪽, 모음은 오른쪽', () => {
      const [initial, medial] = regionsOf('가');

      expect(regionsOf('가').map((r) => [r.kind, r.jamo])).toEqual([
        ['initial', 'ㄱ'],
        ['medial', 'ㅏ'],
      ]);
      expect(bounds(initial.region).right).toBeLessThanOrEqual(
        bounds(medial.region).left
      );
    });

    it('세로 모음, 받침 있음 (각): 받침이 맨 아래, 초성과 모음은 그 위 좌우', () => {
      const [initial, medial, final] = regionsOf('각');

      expect(regionsOf('각').map((r) => r.kind)).toEqual([
        'initial',
        'medial',
        'final',
      ]);
      expect(final.jamo).toBe('ㄱ');
      expect(bounds(final.region).top).toBeGreaterThanOrEqual(
        Math.max(bounds(initial.region).bottom, bounds(medial.region).bottom) -
          1e-9
      );
      expect(bounds(initial.region).right).toBeLessThanOrEqual(
        bounds(medial.region).left
      );
    });

    it('가로 모음, 받침 없음 (고): 초성은 위, 모음은 아래', () => {
      const [initial, medial] = regionsOf('고');

      expect(medial.jamo).toBe('ㅗ');
      expect(bounds(initial.region).bottom).toBeLessThanOrEqual(
        bounds(medial.region).top
      );
    });

    it('가로 모음, 받침 있음 (곡): 위에서 아래로 초성, 모음, 받침', () => {
      const [initial, medial, final] = regionsOf('곡');

      expect(bounds(initial.region).bottom).toBeLessThanOrEqual(
        bounds(medial.region).top
      );
      expect(bounds(medial.region).bottom).toBeLessThanOrEqual(
        bounds(final.region).top
      );
    });

    it('섞인 모음, 받침 없음 (과): 모음 영역이 초성 아래와 오른쪽을 감싼 ㄱ자다', () => {
      const [initial, medial] = regionsOf('과');

      expect(medial.jamo).toBe('ㅘ');
      // 직사각형이 아니다: 꼭짓점이 여섯 개다
      expect(medial.region).toHaveLength(6);
      // 초성의 바로 아래(왼쪽 아래)와 오른쪽 위가 모두 모음 영역이다
      const { right, bottom } = bounds(initial.region);
      expect(contains(medial.region, right / 2, (bottom + 1) / 2)).toBe(true);
      expect(contains(medial.region, (right + 1) / 2, bottom / 2)).toBe(true);
      expect(contains(medial.region, right / 2, bottom / 2)).toBe(false);
    });

    it('섞인 모음, 받침 있음 (곽): 받침은 맨 아래, 모음 ㄱ자는 그 위', () => {
      const [initial, medial, final] = regionsOf('곽');

      expect(regionsOf('곽').map((r) => r.jamo)).toEqual(['ㄱ', 'ㅘ', 'ㄱ']);
      expect(medial.region).toHaveLength(6);
      expect(bounds(medial.region).bottom).toBeLessThanOrEqual(
        bounds(final.region).top
      );
      expect(bounds(initial.region).bottom).toBeLessThanOrEqual(
        bounds(final.region).top
      );
    });

    it('겹받침과 쌍자음도 자모마다 하나씩이다 (닭 → ㄷ ㅏ ㄺ)', () => {
      expect(regionsOf('닭').map((r) => r.jamo)).toEqual(['ㄷ', 'ㅏ', 'ㄺ']);
      expect(regionsOf('깨').map((r) => r.jamo)).toEqual(['ㄲ', 'ㅐ']);
    });
  });

  describe('한글 음절이 아니면', () => {
    it.each([
      ['라틴', 'A'],
      ['숫자', '1'],
      ['공백', ' '],
      ['홀로 쓴 자모', 'ㄱ'],
      ['빈 문자열', ''],
      ['결합 부호가 붙은 칸', '가\u0301'],
      ['이모지', '😀'],
    ])('%s는 null이다', (_name, char) => {
      expect(jamoRegions(char)).toBeNull();
    });
  });

  describe('칸을 나누는 방식', () => {
    // 모음 21개 x 받침 유무로 여섯 유형이 모두 들어간다
    const syllables = [...'가개갸걔거게겨계고과괘괴교구궈궤귀규그긔기'].flatMap(
      (s) => [s, String.fromCharCode(s.charCodeAt(0) + 1)]
    );

    it.each(syllables)(
      '%s: 영역이 칸을 빈틈없이 겹침 없이 나눈다 (모든 점이 정확히 한 영역에 든다)',
      (char) => {
        const regions = regionsOf(char);
        const total = regions.reduce((sum, r) => sum + area(r.region), 0);
        expect(total).toBeCloseTo(1, 9);

        const N = 100;
        for (let i = 0; i < N; i++) {
          for (let j = 0; j < N; j++) {
            const hits = regions.filter((r) =>
              contains(r.region, (i + 0.5) / N, (j + 0.5) / N)
            );
            expect(hits, `${char} (${i},${j})`).toHaveLength(1);
          }
        }
      }
    );

    it('모든 꼭짓점이 0~1 안에 있다', () => {
      for (const char of syllables) {
        for (const { region } of regionsOf(char)) {
          for (const [x, y] of region) {
            expect(x).toBeGreaterThanOrEqual(0);
            expect(x).toBeLessThanOrEqual(1);
            expect(y).toBeGreaterThanOrEqual(0);
            expect(y).toBeLessThanOrEqual(1);
          }
        }
      }
    });
  });

  describe('polygonCss', () => {
    it('x는 칸 폭의 비율, y는 칸 가운데에서 1em 단위인 clip-path: polygon() 값으로 바꾼다', () => {
      expect(
        polygonCss([
          [0, 0],
          [0.5, 0.5],
          [1, 1],
          [0, 0.64],
        ])
      ).toBe(
        'polygon(0% calc(50% - 0.5em), 50% 50%, 100% calc(50% + 0.5em), 0% calc(50% + 0.14em))'
      );
    });
  });
});
