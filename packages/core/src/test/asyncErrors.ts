/**
 * `queueMicrotask(() => { throw })`로 다시 던진 오류를 잡아 돌려준다.
 *
 * 그런 오류는 처리되지 않은 전역 오류가 되어 vitest가 실행 전체를 실패시킨다.
 * 잡는 동안만 vitest의 처리기를 떼어 두고 끝나면 되돌린다. `run`을 부른 뒤 마이크로태스크
 * 줄을 한 번 비워, 그 안에서 예약된 던짐까지 받는다.
 */
export const collectAsyncErrors = async (
  run: () => void
): Promise<unknown[]> => {
  const errors: unknown[] = [];
  const saved = process.listeners('uncaughtException');
  process.removeAllListeners('uncaughtException');
  const collect = (error: unknown) => {
    errors.push(error);
  };
  process.on('uncaughtException', collect);
  try {
    run();
    await new Promise<void>((resolve) => queueMicrotask(resolve));
  } finally {
    process.off('uncaughtException', collect);
    for (const listener of saved) process.on('uncaughtException', listener);
  }
  return errors;
};
