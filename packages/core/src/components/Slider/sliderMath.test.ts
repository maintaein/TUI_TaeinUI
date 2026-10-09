import { describe, it, expect } from 'vitest';
import { computeTickValues } from './sliderMath';

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
});
