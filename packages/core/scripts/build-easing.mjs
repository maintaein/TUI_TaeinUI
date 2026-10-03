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

/**
 * 토큰 이름 → GSAP 이징 소스. 이름과 매핑은 모션 명제(M1 T2)가 확정했다.
 *
 * M2 T2가 모션 명제(`.claude/고도화/plan/spec/모션-명제.md`) §1 4조항·§2 6계열
 * 채널이 이 집합으로 전부 표현되는지 대조했다. 전문은 T2 보고서에 있고, 여기는
 * 결론만 남긴다 — 이 파일이 "왜 이 커브 집합인가"를 물을 때 실제로 열리는
 * 자리이기 때문이다(보고서는 마일스톤 종료 시 지워진다).
 *
 * - 조항 1(중단·역재생 가능)·조항 4(색 단독 금지)는 커브가 아니라 메커니즘·채널
 *   요구라 해당 없음.
 * - 조항 2(강도 순서 rest≤hover≤active)·조항 3(퇴장은 등장의 60~70%·가속)은
 *   out 셋(`settle`·`snap`·`spring`)이 등장, `exit`가 퇴장을 맡는다.
 * - §2 6계열(입력·행동·오버레이·상태·표시·장식) 채널은 out/exit/linear 조합으로
 *   전부 표현된다 — 상태 전이는 어디서든 settle/snap/exit로 간다. 유일하게
 *   못 덮는 자리가 **자율 루프**였다: 다섯 토큰 중 어느 것도 오버슛·급정지 없이
 *   등속으로 반복되지 않는다.
 *
 * **청구 1(inOut 계열 부재) — 인정, `drift` 추가.** M2의 14개 안에 inOut 모양
 * 리터럴이 6선언 있다. 상태 전이 4건(`BoardRow` `grid-template-rows` ·
 * `Card` hover 3채널)은 조항 3이 settle/snap/exit로 흡수하지만, 자율 루프
 * 4건(`Loader` 스윕 · `LoadingSpinner` 점 페이드 · `Skeleton` pulse·wave)은
 * 흡수할 데가 없다 — `linear`는 기계적이고 out 셋은 매 주기 급출발하며
 * `exit`는 매 주기 급정지한다. `sine.inOut`은 최댓값이 1.0이라 오버슛이 없어
 * 어떤 속성에도 안전하다.
 *
 * **청구 2(delay/stagger 토큰 부재) — 기각.** `IconButton`의 아이콘 지연
 * 40ms가 유일한 소비자다(`M2-모션-번역.md`가 직접 "청구 2의 유일한 소비자"라고
 * 적는다). 상태계 stagger 후보였던 `LoadingSpinner` 점 3개는 이미
 * `duration.base`의 배수(0·200·400ms) 리터럴로 표현돼 있고 그대로 둔다.
 * 소비자 하나를 위해 `duration`·`loop`와 나란한 새 토큰 카테고리를 여는 것은
 * 과설계다. `theme.css.ts`의 전역 `*` 규칙이 축소 모드에서
 * `transition-delay`·`animation-delay`를 이미 덮으므로 리터럴로 남겨도
 * 기능적 위험이 없다 — 깨지는 것은 `contract.ts` 단일 출처 원칙뿐이고, 소비자가
 * 하나뿐인 지금은 감수한다. 소비자가 둘 이상으로 늘면 그때 다시 청구한다.
 */
export const EASE_SOURCES = {
  settle: 'power3.out',
  snap: 'back.out(1.7)',
  spring: 'elastic.out(1, 0.5)',
  exit: 'power2.in',
  linear: 'none',
  drift: 'sine.inOut',
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
  slow: '6000ms',
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
