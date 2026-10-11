import { themeContract } from './theme.css';

/**
 * 상태계(狀態系) 루프 공유 리듬.
 *
 * 왜: 모션 명제 S1 — 「통합 로더(`Loader`) · `Skeleton`이 같은
 * 방향 · 같은 리듬을 공유한다」. `Skeleton`의 wave 방향(좌→우)이 계열
 * 기준이고, 공유해야 하는 것은 값이 아니라 세 가지: 방향 · 커브 · 주기
 * (`loop.base`)다. 방향은 채널마다(translateX 부호·background-position
 * 부호 등) 표현이 달라 값으로 공유할 수 없으므로 각 소비자의 keyframes가
 * 직접 "좌→우"로 표현한다 — 이 파일은 커브만 값으로 내보낸다.
 *
 * 주기(`loop.base`)는 재수출하지 않는다: `animationBoundary.test.ts`의
 * 시간 슬롯 스캐너가 `animation.duration.*`·`animation.loop.*` 텍스트를
 * 소스에서 직접 찾아 duration/delay를 구간별 위치로 가른다. 이 값을 다른
 * 이름으로 재수출하면(예: 예전에 있었던 `loopRhythmDuration`) 그 텍스트가
 * 소비자 파일에서 사라져 duration 슬롯이 안 보이게 되고, 뒤따르는 delay
 * 리터럴(Skeleton의 wave 0.5s 등)이 duration으로 잘못 분류된다 — 실측으로
 * 걸렸다. 소비자가 `themeContract.animation.loop.base`를 직접 쓰면 이 문제가
 * 없으니 주기는 토큰을 그대로 쓰고, 이 파일은 새 토큰(`drift`)인 커브만
 * 공유 자산으로 내보낸다.
 *
 * `Loader`는 스윕(`barFill`)과 점 궤도(`orbitDot`, 주기 `loop.fast`), 버블 점의
 * 예비동작(`dotBody`)과 축소 선호의 투명도 깜빡임(`dot`)으로 이 자산을 소비한다:
 * 구간 커브가 `Skeleton`의 wave와 같다(스윕과 깜빡임은 주기도 같다). 버블 점의
 * 솟음은 넘치는 커브(`snap`)라 이 자산이 아니다. 제외되는 건 컴포넌트가 아니라
 * 회전(`spinner`) 하나다: 주기가 `loop.fast`이고 커브가 `linear` + 비등속 키프레임인 것은
 * 명제가 요구하는 별도 리듬이다(자세한 이유는 `Loader.css.ts` 참고).
 *
 * `Skeleton.css.ts`가 아니라 `tokens/`에 두는 이유: `Skeleton.css.ts`가
 * 내보내면 `Loader`가 `Skeleton`을 `import`하게 되어 계열 리듬이라는
 * 횡단 관심사가 컴포넌트 간 결합으로 바뀐다. `tokens/index.ts`에는
 * 올리지 않는다 — 공개 API가 아니라 상태계 컴포넌트(`Loader`·`Skeleton`)만 상대 경로로
 * 가져다 쓰는 내부 공유 자산이다(`focusRing.css.ts`와 같은 가시성).
 */
export const loopRhythmEasing = themeContract.animation.easing.drift;
