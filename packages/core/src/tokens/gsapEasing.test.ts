/**
 * gsapEasing.ts와 scripts/build-easing.mjs의 EASE_SOURCES가 갈라지지 않는지
 * 검사한다 (M3 T2 · 판정 10).
 *
 * animation.css.ts는 GSAP 이징을 CSS `linear()`로 **구운 결과**만 들고 있어
 * 런타임 GSAP에 먹일 수 없다. 그래서 같은 6쌍의 GSAP 이름을 gsapEasing.ts가
 * 따로 내보낸다 — 출처가 둘이 되는 순간 CSS 커브와 GSAP 커브가 조용히 갈라진다.
 * 이 검사가 그 갈라짐을 막는다. (animation.build.test.ts가 `.mjs`를 직접
 * import하는 선례를 이미 만들어 뒀다.)
 */
import { describe, it, expect } from 'vitest';
import { EASE_SOURCES } from '../../scripts/build-easing.mjs';
import { duration } from './animation.css';
import { gsapDuration, gsapEasing } from './gsapEasing';

describe('gsapEasing과 build-easing.mjs 일치 검사', () => {
  it('gsapEasing이 생성기의 EASE_SOURCES와 정확히 같다', () => {
    expect({ ...gsapEasing }).toEqual(EASE_SOURCES);
  });

  it('모션 명제가 확정한 6쌍 그대로다 — 새 커브를 만들지 않았다', () => {
    expect({ ...gsapEasing }).toEqual({
      settle: 'power3.out',
      snap: 'back.out(1.7)',
      spring: 'elastic.out(1, 0.5)',
      exit: 'power2.in',
      linear: 'none',
      drift: 'sine.inOut',
    });
  });
});

describe('gsapDuration — ms 토큰의 초 환산', () => {
  it('duration 토큰과 키가 같다', () => {
    expect(Object.keys(gsapDuration)).toEqual(Object.keys(duration));
  });

  it('토큰의 ms 값을 1000으로 나눈 초 값이다', () => {
    for (const [name, ms] of Object.entries(duration)) {
      expect(gsapDuration[name as keyof typeof duration]).toBeCloseTo(
        Number.parseFloat(ms) / 1000,
        6
      );
    }
  });

  it('GSAP에 넘어가는 값이 문자열이 아니라 초 단위 숫자다', () => {
    for (const value of Object.values(gsapDuration)) {
      expect(typeof value).toBe('number');
      expect(value).toBeLessThan(1);
    }
  });
});
