/**
 * `build-easing.mjs`의 타입 선언. 생성기는 빌드 타임 전용이라 `.mjs`로 두되,
 * `animation.build.test.ts`가 import하므로 strict에서 암묵적 any가 되지 않게
 * 시그니처만 여기 적는다. 소스의 export와 어긋나면 같이 고친다.
 */

/** 커밋된 `src/tokens/animation.css.ts`와 같아야 하는 생성 결과(prettier 적용 후). */
export declare function generateAnimationSource(): Promise<string>;
