/**
 * GSAP 이징을 CSS `linear()` 곡선으로 구워 animation.css.ts를 생성한다.
 *
 * gsap.parseEase(name)이 반환하는 (progress) => value 함수를 24등분 샘플링해
 * linear() 문자열을 만든다. 빌드 타임에만 GSAP을 쓰고 산출물(animation.css.ts)을
 * 커밋하므로 소비자 번들에는 GSAP이 들어가지 않는다.
 *
 *   node scripts/build-easing.mjs
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import gsap from 'gsap';

/** 토큰 이름 → GSAP 이징 소스. 이름과 매핑은 모션 명제(M1 T2)가 확정했다. */
const EASE_SOURCES = {
  settle: 'power3.out',
  snap: 'back.out(1.7)',
  spring: 'elastic.out(1, 0.5)',
  exit: 'power2.in',
  linear: 'none',
};

function sample(name, steps = 24) {
  const ease = gsap.parseEase(name);
  return `linear(${Array.from({ length: steps + 1 }, (_, i) =>
    ease(i / steps).toFixed(4)
  ).join(',')})`;
}

export function generateAnimationSource() {
  const easingLines = Object.entries(EASE_SOURCES)
    .map(([token, source]) => `  ${token}: '${sample(source)}', // ${source}`)
    .join('\n');

  return `// 애니메이션 토큰 정의

export const duration = {
  fast: '150ms',
  base: '200ms',
  slow: '300ms',
  slower: '500ms',
} as const;

// scripts/build-easing.mjs가 GSAP 이징을 샘플링해 생성한다. 직접 고치지 말 것.
export const easing = {
${easingLines}
} as const;
`;
}

const isMain =
  process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isMain) {
  const outPath = fileURLToPath(
    new URL('../src/tokens/animation.css.ts', import.meta.url)
  );
  writeFileSync(outPath, generateAnimationSource(), 'utf-8');
  console.log(`generated ${outPath}`);
}
