/**
 * 같은 위치에 열린 스낵바가 줄을 서는 규칙 (M5 task-21).
 *
 * 순수 함수 둘(`stackOffsets`, `overflowVictims`)은 값만 넣고 값만 받는다.
 * 저장소(`registerSnackbar` 등)는 모듈 상태를 쓰므로 시험마다 만든 것을 직접
 * 해제해서 새지 않게 한다(내보내는 초기화 함수는 없다).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { themeTokens } from '../../tokens/contract';
import {
  MAX_PER_POSITION,
  STACK_GAP_PX,
  overflowVictims,
  registerSnackbar,
  setSnackbarHeight,
  stackOffsetOf,
  stackOffsets,
  subscribeStack,
  unregisterSnackbar,
} from './snackbarStack';

describe('stackOffsets', () => {
  it('새것(맨 앞)은 0이고 안쪽으로 갈수록 더 새로운 것들의 높이 합 + 간격이 쌓인다', () => {
    expect(stackOffsets([40, 56, 72], 8)).toEqual([0, 48, 112]);
  });

  it('높이가 서로 달라도 각 단계가 앞 높이를 그대로 더한다', () => {
    expect(stackOffsets([100, 20, 30], 10)).toEqual([0, 110, 140]);
  });

  it('간격이 0이면 높이 합만 남는다', () => {
    expect(stackOffsets([40, 56, 72], 0)).toEqual([0, 40, 96]);
  });

  it('하나뿐이면 [0]이고 없으면 []이다', () => {
    expect(stackOffsets([40], 8)).toEqual([0]);
    expect(stackOffsets([], 8)).toEqual([]);
  });
});

describe('overflowVictims', () => {
  const entry = (name: string, closable = true, evicted = false) => ({
    name,
    evicted,
    getOnClose: () => (closable ? () => {} : undefined),
  });

  it('최대 이하이면 아무도 내보내지 않는다', () => {
    const list = [entry('a'), entry('b'), entry('c')];
    expect(overflowVictims(list, 3)).toEqual([]);
  });

  it('넘친 만큼, 가장 오래된 것(앞)부터 내보낸다', () => {
    const [a, b, c, d, e] = ['a', 'b', 'c', 'd', 'e'].map((n) => entry(n));
    expect(overflowVictims([a, b, c, d], 3)).toEqual([a]);
    expect(overflowVictims([a, b, c, d, e], 3)).toEqual([a, b]);
  });

  it('onClose가 없는 것은 내보내지 못하고, 그 자리를 다른 것이 대신하지도 않는다', () => {
    const [a, b, c, d] = [
      entry('a', false),
      entry('b'),
      entry('c'),
      entry('d'),
    ];
    expect(overflowVictims([a, b, c, d], 3)).toEqual([]);
  });

  it('이미 내보내기로 한 것은 다시 고르지 않는다', () => {
    const [a, b, c, d] = [
      entry('a', true, true),
      entry('b'),
      entry('c'),
      entry('d'),
    ];
    expect(overflowVictims([a, b, c, d], 3)).toEqual([]);
  });
});

describe('상수', () => {
  it('위치당 최대는 3개다 (사용자 결정)', () => {
    expect(MAX_PER_POSITION).toBe(3);
  });

  it('간격은 spacing[2]의 px 값이다', () => {
    expect(STACK_GAP_PX).toBe(parseFloat(themeTokens.spacing[2]) * 16);
    expect(STACK_GAP_PX).toBe(8);
  });
});

describe('저장소', () => {
  const ids: symbol[] = [];
  const open = (
    position: string,
    height: number,
    onClose?: () => void
  ): symbol => {
    const id = Symbol('t');
    ids.push(id);
    registerSnackbar(id, position, height, () => onClose);
    return id;
  };

  afterEach(() => {
    for (const id of ids.splice(0)) unregisterSnackbar(id);
  });

  it('열린 순서대로 새것이 0, 먼저 연 것이 안쪽으로 밀린다', () => {
    const a = open('bottom-center', 40);
    const b = open('bottom-center', 56);
    const c = open('bottom-center', 72);
    expect([stackOffsetOf(c), stackOffsetOf(b), stackOffsetOf(a)]).toEqual([
      0, 80, 144,
    ]);
  });

  it('다른 위치끼리는 서로 영향을 주지 않는다', () => {
    const a = open('bottom-center', 40);
    const b = open('top-center', 40);
    expect(stackOffsetOf(a)).toBe(0);
    expect(stackOffsetOf(b)).toBe(0);
  });

  it('해제하면 나머지가 메워진다', () => {
    const a = open('bottom-center', 40);
    const b = open('bottom-center', 56);
    const c = open('bottom-center', 72);
    unregisterSnackbar(b);
    expect(stackOffsetOf(c)).toBe(0);
    expect(stackOffsetOf(a)).toBe(80);
  });

  it('높이가 바뀌면 그 위에 쌓인 것의 오프셋이 따라간다', () => {
    const a = open('bottom-center', 40);
    const b = open('bottom-center', 56);
    setSnackbarHeight(b, 100);
    expect(stackOffsetOf(a)).toBe(108);
  });

  it('등록되지 않은 id의 오프셋은 0이다', () => {
    expect(stackOffsetOf(Symbol('none'))).toBe(0);
  });

  it('등록·해제·높이 변경은 구독자에게 알린다', () => {
    let calls = 0;
    const off = subscribeStack(() => {
      calls += 1;
    });
    const a = open('bottom-center', 40);
    expect(calls).toBe(1);
    setSnackbarHeight(a, 50);
    expect(calls).toBe(2);
    setSnackbarHeight(a, 50);
    expect(calls).toBe(2);
    unregisterSnackbar(a);
    expect(calls).toBe(3);
    off();
    open('bottom-center', 40);
    expect(calls).toBe(3);
  });

  it('넷째를 등록하면 가장 오래된 것의 onClose만 한 번 불린다', () => {
    const closed: string[] = [];
    const named = (n: string) => () => closed.push(n);
    open('bottom-center', 40, named('a'));
    open('bottom-center', 40, named('b'));
    open('bottom-center', 40, named('c'));
    expect(closed).toEqual([]);
    open('bottom-center', 40, named('d'));
    expect(closed).toEqual(['a']);
  });

  it('같은 일괄 처리에서 다섯째까지 오면 이미 내보낸 a를 다시 부르지 않는다', () => {
    const closed: string[] = [];
    const named = (n: string) => () => closed.push(n);
    for (const n of ['a', 'b', 'c', 'd', 'e']) {
      open('bottom-center', 40, named(n));
    }
    expect(closed).toEqual(['a', 'b']);
  });

  it('다른 위치의 스낵바는 넘침에 세지 않는다', () => {
    const closed: string[] = [];
    const named = (n: string) => () => closed.push(n);
    open('top-center', 40, named('x'));
    open('bottom-center', 40, named('a'));
    open('bottom-center', 40, named('b'));
    open('bottom-center', 40, named('c'));
    expect(closed).toEqual([]);
  });
});
