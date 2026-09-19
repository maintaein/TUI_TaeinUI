import { useSyncExternalStore } from 'react';

// theme.css.ts의 전역 reduce 규칙과 같은 쿼리를 본다. CSS 쪽 탈출구와 JS 쪽
// 탈출구가 서로 다른 신호를 보면 둘 중 하나는 반드시 거짓말이 된다.
const REDUCE_QUERY = '(prefers-reduced-motion: reduce)';

// window가 아니라 globalThis를 본다. globalThis는 SSR·워커에도 있으므로
// 참조만으로 ReferenceError가 나는 경로가 없다.
const matchReduceQuery = (): MediaQueryList | null =>
  typeof globalThis.matchMedia === 'function'
    ? globalThis.matchMedia(REDUCE_QUERY)
    : null;

const subscribe = (onStoreChange: () => void): (() => void) => {
  const query = matchReduceQuery();
  query?.addEventListener('change', onStoreChange);

  return () => {
    query?.removeEventListener('change', onStoreChange);
  };
};

const getSnapshot = (): boolean => matchReduceQuery()?.matches ?? false;

// 서버에는 사용자 선호가 없다. CSS 기본값과 같은 쪽(축소 아님)으로 두고
// 하이드레이션 후 실제 값으로 맞춘다.
const getServerSnapshot = (): boolean => false;

// 사용자의 모션 축소 선호를 구독한다. 선호가 바뀌면 리렌더로 반영된다.
// 이 훅은 신호만 준다 — 진행 중인 애니메이션 처리는 gateMotion이 한다.
export const useReducedMotion = (): boolean =>
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
