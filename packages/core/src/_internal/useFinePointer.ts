import { useSyncExternalStore } from 'react';

// 호버가 되는 정밀 포인터(마우스). 터치에서는 거짓이다. Button 등 CSS의 호버 게이트와 같은 질의다
const FINE_QUERY = '(hover: hover) and (pointer: fine)';

const matchFine = (): MediaQueryList | null =>
  typeof globalThis.matchMedia === 'function'
    ? globalThis.matchMedia(FINE_QUERY)
    : null;

const subscribe = (onStoreChange: () => void): (() => void) => {
  const query = matchFine();
  query?.addEventListener('change', onStoreChange);
  return () => query?.removeEventListener('change', onStoreChange);
};

// 서버에는 포인터가 없다. 포인터 핸들러를 달지 않는 쪽(거짓)으로 두고 하이드레이션 후 맞춘다.
export const useFinePointer = (): boolean =>
  useSyncExternalStore(
    subscribe,
    () => matchFine()?.matches ?? false,
    () => false
  );
