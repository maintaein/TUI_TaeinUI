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
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import gsap from 'gsap';
import prettier from 'prettier';

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

// `new URL(rel, import.meta.url)`는 Vite가 정적으로 가로채 에셋 URL로
// 바꿔치기한다(vitest가 이 파일을 import할 때 파일 경로 대신
// `http://localhost:3000/...`를 반환해 fileURLToPath가 던진다). 그 패턴을
// 피해 현재 파일 경로에서 직접 디렉터리를 구한다.
const OUT_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../src/tokens/animation.css.ts'
);

/**
 * 커밋되는 산출물은 lint-staged의 `prettier --write`를 거친 상태와
 * 같아야 한다(그래야 생성기가 진짜로 멱등이다). 여기서 같은 포매터를
 * 같은 설정으로 미리 적용해 둔다.
 */
export async function generateAnimationSource() {
  const easingLines = Object.entries(EASE_SOURCES)
    .map(([token, source]) => `  ${token}: '${sample(source)}', // ${source}`)
    .join('\n');

  const raw = `// 애니메이션 토큰 정의

export const duration = {
  fast: '150ms',
  base: '200ms',
  slow: '300ms',
  slower: '500ms',
} as const;

// 무한 반복 주기. 전이(A→B)가 아니라 한 바퀴의 길이라 duration 스케일과 다른
// 양이다. 같은 스케일에 끼우면 전이를 느리게 만드는 압력이 된다.
export const loop = {
  fast: '800ms',
  base: '1500ms',
} as const;

// scripts/build-easing.mjs가 GSAP 이징을 샘플링해 생성한다. 직접 고치지 말 것.
export const easing = {
${easingLines}
} as const;
`;

  const config = await prettier.resolveConfig(OUT_PATH);
  return prettier.format(raw, { ...config, filepath: OUT_PATH });
}

const isMain =
  process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isMain) {
  writeFileSync(OUT_PATH, await generateAnimationSource(), 'utf-8');
  console.log(`generated ${OUT_PATH}`);
}
