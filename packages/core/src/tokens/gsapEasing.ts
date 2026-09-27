/**
 * GSAP 런타임이 먹을 수 있는 이징 이름과 초 단위 duration (M3 T2 · 판정 10).
 *
 * `animation.css.ts`의 `easing`은 GSAP 이징을 24등분 샘플링해 구운 CSS
 * `linear()` 문자열이다 — CSS에는 그게 필요하지만 GSAP에는 못 넘긴다.
 * 원본 이름(`power3.out` 등)은 `scripts/build-easing.mjs`의 `EASE_SOURCES`에
 * 있고, 런타임 코드가 빌드 스크립트를 import할 수는 없다. 그래서 같은 6쌍을
 * 여기서 한 번 더 적고, `gsapEasing.test.ts`가 두 곳의 일치를 잠근다.
 *
 * 이 파일은 `.css.ts`가 아니다 — `.css.ts`는 생성·컴파일 대상이고, 이 값들은
 * 스타일이 아니라 JS가 GSAP에 넘기는 인자다.
 *
 * `tokens/index.ts` 배럴에 **일부러 넣지 않았다.** 공개 API가 아니다 — 소비자가
 * 쓰는 것은 CSS 변수로 나가는 `themeContract.animation`이고, 이 이름들은 core
 * 내부 컴포넌트가 GSAP에 넘기는 인자다. 배럴에 올리면 공개 표면이 된다.
 */
import { duration } from './animation.css';

/** 이징 토큰 이름 → GSAP 이징 이름. 새 커브를 만들지 않는다. */
export const gsapEasing = {
  settle: 'power3.out',
  snap: 'back.out(1.7)',
  spring: 'elastic.out(1, 0.5)',
  exit: 'power2.in',
  linear: 'none',
  drift: 'sine.inOut',
} as const;

/** 토큰의 ms 문자열을 GSAP의 초로 바꾼다. 저장소의 ms→s 변환 지점은 여기 하나다. */
const toSeconds = (ms: string): number => Number.parseFloat(ms) / 1000;

/**
 * duration 토큰의 초 환산. GSAP은 초 단위라 `'300ms'`를 그대로 넣으면
 * 300초짜리 트윈이 된다.
 */
export const gsapDuration = {
  fast: toSeconds(duration.fast),
  base: toSeconds(duration.base),
  slow: toSeconds(duration.slow),
  slower: toSeconds(duration.slower),
} as const;
