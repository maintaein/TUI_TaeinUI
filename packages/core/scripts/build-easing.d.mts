/**
 * `build-easing.mjs`의 타입 선언. 생성기는 빌드 타임 전용이라 `.mjs`로 두되,
 * `animation.build.test.ts`가 import하므로 strict에서 암묵적 any가 되지 않게
 * 시그니처만 여기 적는다. 소스의 export와 어긋나면 같이 고친다.
 */

/** 커밋된 `src/tokens/animation.css.ts`와 같아야 하는 생성 결과(prettier 적용 후). */
export declare function generateAnimationSource(): Promise<string>;

/**
 * 토큰 이름 → GSAP 이징 소스. `src/tokens/gsapEasing.ts`가 같은 6쌍을 런타임용으로
 * 내보내고 `gsapEasing.test.ts`가 두 곳의 일치를 잠근다.
 */
export declare const EASE_SOURCES: Record<string, string>;
