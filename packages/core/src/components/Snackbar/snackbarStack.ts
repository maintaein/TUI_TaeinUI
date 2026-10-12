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
 * 열린 순서(오래된 것이 앞)로 받은 한 위치의 목록에서 넘친 만큼 앞에서 골라,
 * 실제로 닫을 수 있는 것만 돌려준다. `onClose`가 없는 것은 닫을 수단이 없으니
 * 그대로 두고, 그 몫을 다른 것에게 돌리지도 않는다.
 */
export const overflowVictims = <
  T extends Pick<StackEntry, 'evicted' | 'getOnClose'>,
>(
  entriesOldestFirst: readonly T[],
  max: number
): T[] =>
  entriesOldestFirst
    .slice(0, Math.max(0, entriesOldestFirst.length - max))
    .filter((entry) => !entry.evicted && entry.getOnClose() !== undefined);

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

/** 열린 스낵바를 줄 끝(가장 새것)에 넣고, 넘친 가장 오래된 것의 `onClose`를 부른다. */
export const registerSnackbar = (
  id: symbol,
  position: string,
  height: number,
  getOnClose: StackEntry['getOnClose']
): void => {
  entries = [...entries, { id, position, height, evicted: false, getOnClose }];
  const victims = overflowVictims(
    entries.filter((entry) => entry.position === position),
    MAX_PER_POSITION
  );
  entries = entries.map((entry) =>
    victims.includes(entry) ? { ...entry, evicted: true } : entry
  );
  emit();
  for (const victim of victims) victim.getOnClose()?.();
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
