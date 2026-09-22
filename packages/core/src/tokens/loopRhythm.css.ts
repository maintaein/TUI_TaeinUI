import { themeContract } from './theme.css';

/**
 * 상태계(狀態系) 루프 공유 리듬.
 *
 * 왜: 모션 명제 S1 — 「`Loader` · `LoadingSpinner` · `Skeleton`이 같은
 * 방향 · 같은 리듬을 공유한다」. `Skeleton`의 wave 방향(좌→우)이 계열
 * 기준이고, 공유해야 하는 것은 값이 아니라 세 가지: 방향 · 커브 · 주기
 * (`loop.base`)다. 방향은 채널마다(translateX 부호·background-position
 * 부호 등) 표현이 달라 값으로 공유할 수 없으므로 각 소비자의 keyframes가
 * 직접 "좌→우"로 표현한다 — 이 파일은 커브 · 주기만 값으로 내보낸다.
 *
 * `LoadingSpinner`는 이 자산의 소비자가 아니다 — 주기가 `loop.fast`이고
 * 커브가 `linear` + 비등속 키프레임인 것은 명제가 요구하는 별도 리듬이다
 * (자세한 이유는 `LoadingSpinner.css.ts` 참고).
 *
 * `Skeleton.css.ts`가 아니라 `tokens/`에 두는 이유: `Skeleton.css.ts`가
 * 내보내면 `Loader`가 `Skeleton`을 `import`하게 되어 계열 리듬이라는
 * 횡단 관심사가 컴포넌트 간 결합으로 바뀐다. `tokens/index.ts`에는
 * 올리지 않는다 — 공개 API가 아니라 상태계 3개 컴포넌트만 상대 경로로
 * 가져다 쓰는 내부 공유 자산이다(`focusRing.css.ts`와 같은 가시성).
 */
export const loopRhythmDuration = themeContract.animation.loop.base;
export const loopRhythmEasing = themeContract.animation.easing.drift;
