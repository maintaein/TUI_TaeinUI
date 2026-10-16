/**
 * 같은 `position`에 열린 스낵바가 줄을 서는 규칙과 저장소 (M5 task-21).
 *
 * 공개 API가 아니다. `Snackbar.tsx`만 쓰고 `index.ts`로 내보내지 않는다.
 *
 * 모듈 상태(`entries`)는 `Snackbar`의 effect 안에서만 바뀐다. 렌더 중에는 읽기만
 * 한다. 서버에서는 effect가 돌지 않으므로 요청끼리 상태가 섞일 길이 없다.
 */

/** 사용자 결정(task-21): 한 위치에 동시에 최대 3개. 넘치면 가장 오래된 것이 닫힌다. */
export const MAX_PER_POSITION = 3;

/** 스낵바 사이 간격. `spacing[2]`(0.5rem)의 px 값이다. */
export const STACK_GAP_PX = 8;

interface StackEntry {
  readonly id: symbol;
  readonly position: string;
  readonly height: number;
  /** false면 같은 위치에 혼자 있는 스낵바(`Snackbar`의 `stack` prop) */
  readonly stack: boolean;
  /** 넘쳐서 내보내기로 한 것. 같은 일에 `onClose`를 두 번 부르지 않으려는 표시 */
  readonly evicted: boolean;
  /** 부모가 새 `onClose`를 넘겨도 최신을 읽도록 호출 시점에 꺼낸다 */
  readonly getOnClose: () => (() => void) | undefined;
}

/**
 * 새것부터 센 높이로 각 스낵바의 안쪽 밀림(px, 0 이상)을 구한다.
 * 새것은 0이고, 그 안쪽은 더 새로운 것들의 높이 합 + 간격 수만큼이다.
 */
export const stackOffsets = (
  heightsNewestFirst: readonly number[],
  gapPx: number
): number[] => {
  let sum = 0;
  return heightsNewestFirst.map((height) => {
    const offset = sum;
    sum += height + gapPx;
    return offset;
  });
};

/**
 * 열린 순서(오래된 것이 앞)로 받은 한 위치의 목록에서 내보낼 것을 골라,
 * 실제로 닫을 수 있는 것만 돌려준다.
 *
 * - 가장 새 항목이 쌓지 않는 것(`stack=false`)이면 나머지 전부가 대상이다.
 * - 가장 새 항목이 아닌 쌓지 않는 것은 대상이다(새것이 이긴다).
 * - 남은 쌓는 것들은 `max`를 넘은 만큼 가장 오래된 것부터 대상이다.
 *
 * `onClose`가 없는 것은 닫을 수단이 없으니 그대로 두고, 그 몫을 다른 것에게
 * 돌리지도 않는다.
 */
export const overflowVictims = <
  T extends Pick<StackEntry, 'evicted' | 'getOnClose' | 'stack'>,
>(
  entriesOldestFirst: readonly T[],
  max: number
): T[] => {
  const newest = entriesOldestFirst[entriesOldestFirst.length - 1];
  if (!newest) return [];
  const stackers = entriesOldestFirst.filter((entry) => entry.stack);
  const overflowed = stackers.slice(0, Math.max(0, stackers.length - max));
  return entriesOldestFirst
    .filter((entry) =>
      entry === newest
        ? false
        : !newest.stack || !entry.stack || overflowed.includes(entry)
    )
    .filter((entry) => !entry.evicted && entry.getOnClose() !== undefined);
};

let entries: readonly StackEntry[] = [];
const listeners = new Set<() => void>();

const emit = () => {
  for (const listener of listeners) listener();
};

export const subscribeStack = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/**
 * 열린 스낵바를 줄 끝(가장 새것)에 넣고, 내보낼 것의 `onClose`를 부른다.
 * 던진 `onClose`가 있어도 나머지를 모두 부르고, 오류는 마이크로태스크에서 하나씩 다시 던진다.
 */
export const registerSnackbar = (
  id: symbol,
  position: string,
  height: number,
  getOnClose: StackEntry['getOnClose'],
  stack: boolean
): void => {
  entries = [
    ...entries,
    { id, position, height, stack, evicted: false, getOnClose },
  ];
  const victims = overflowVictims(
    entries.filter((entry) => entry.position === position),
    MAX_PER_POSITION
  );
  entries = entries.map((entry) =>
    victims.includes(entry) ? { ...entry, evicted: true } : entry
  );
  emit();
  // 하나가 던져도 나머지는 부른다. 던진 것은 삼키지 않고 하나씩 마이크로태스크에서 다시
  // 던진다. 여기서 던지면 호출한 effect가 끊겨 새 스낵바의 정리(cleanup)가 만들어지지 않는다.
  for (const victim of victims) {
    try {
      victim.getOnClose()?.();
    } catch (error) {
      queueMicrotask(() => {
        throw error;
      });
    }
  }
};

export const unregisterSnackbar = (id: symbol): void => {
  if (!entries.some((entry) => entry.id === id)) return;
  entries = entries.filter((entry) => entry.id !== id);
  emit();
};

export const setSnackbarHeight = (id: symbol, height: number): void => {
  const current = entries.find((entry) => entry.id === id);
  if (!current || current.height === height) return;
  entries = entries.map((entry) =>
    entry === current ? { ...entry, height } : entry
  );
  emit();
};

/** 열린 뒤에 `stack`이 바뀐 것을 저장소에 반영한다. 다음 등록의 계산부터 쓰인다. */
export const setSnackbarStack = (id: symbol, stack: boolean): void => {
  const current = entries.find((entry) => entry.id === id);
  if (!current || current.stack === stack) return;
  entries = entries.map((entry) =>
    entry === current ? { ...entry, stack } : entry
  );
};

/** 이 스낵바가 안쪽으로 밀려난 거리(px, 0 이상). 등록 전이면 0이다. */
export const stackOffsetOf = (id: symbol): number => {
  const mine = entries.find((entry) => entry.id === id);
  if (!mine) return 0;
  const newestFirst = entries
    .filter((entry) => entry.position === mine.position)
    .reverse();
  return stackOffsets(
    newestFirst.map((entry) => entry.height),
    STACK_GAP_PX
  )[newestFirst.indexOf(mine)];
};
