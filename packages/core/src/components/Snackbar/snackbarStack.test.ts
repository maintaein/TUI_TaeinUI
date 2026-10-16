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
  setSnackbarStack,
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
  const entry = (
    name: string,
    closable = true,
    evicted = false,
    stack = true
  ) => ({
    name,
    evicted,
    stack,
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

describe('overflowVictims: 쌓지 않는 것(stack=false)', () => {
  const entry = (name: string, stack = true, closable = true) => ({
    name,
    stack,
    evicted: false,
    getOnClose: () => (closable ? () => {} : undefined),
  });

  it('가장 새 항목이 쌓지 않는 것이면 나머지 전부가 대상이다', () => {
    const [a, b, c, s] = [
      entry('a'),
      entry('b'),
      entry('c'),
      entry('s', false),
    ];
    expect(overflowVictims([a, b, c, s], 3)).toEqual([a, b, c]);
    expect(overflowVictims([a, s], 3)).toEqual([a]);
  });

  it('쌓지 않는 것이 먼저 있고 뒤에 아무것이나 열리면 쌓지 않는 것이 대상이다', () => {
    const [s, a] = [entry('s', false), entry('a')];
    expect(overflowVictims([s, a], 3)).toEqual([s]);
  });

  it('쌓지 않는 것 뒤에 쌓지 않는 것이 열려도 앞의 것이 대상이다 (새것이 이긴다)', () => {
    const [s1, s2] = [entry('s1', false), entry('s2', false)];
    expect(overflowVictims([s1, s2], 3)).toEqual([s1]);
  });

  it('쌓지 않는 것이 모두인 줄은 늘 마지막 하나만 남는다', () => {
    const list = ['a', 'b', 'c', 'd'].map((n) => entry(n, false));
    expect(overflowVictims(list, 3)).toEqual(list.slice(0, 3));
  });

  it('쌓는 것들의 넘침은 쌓지 않는 것이 끼어 있어도 쌓는 것끼리만 센다', () => {
    const [a, s, b, c, d] = [
      entry('a'),
      entry('s', false),
      entry('b'),
      entry('c'),
      entry('d'),
    ];
    // s는 새것 뒤에 있으니 대상. 쌓는 것은 a b c d 네 개라 a도 대상.
    expect(overflowVictims([a, s, b, c, d], 3)).toEqual([a, s]);
  });

  it('닫을 수 없는(onClose 없는) 쌓지 않는 것은 대상에서 빠진다', () => {
    const [s, a] = [entry('s', false, false), entry('a')];
    expect(overflowVictims([s, a], 3)).toEqual([]);
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
    onClose?: () => void,
    stack = true
  ): symbol => {
    const id = Symbol('t');
    ids.push(id);
    registerSnackbar(id, position, height, () => onClose, stack);
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

  it('쌓지 않는 것이 열리면 같은 위치의 열린 것들만 닫히고 다른 위치는 그대로다', () => {
    const closed: string[] = [];
    const named = (n: string) => () => closed.push(n);
    open('top-center', 40, named('x'));
    open('bottom-center', 40, named('a'));
    open('bottom-center', 40, named('b'));
    open('bottom-center', 40, named('s'), false);
    expect(closed).toEqual(['a', 'b']);
  });

  it('쌓지 않는 것이 열려 있는 위치에 새것이 열리면 쌓지 않는 것이 닫힌다', () => {
    const closed: string[] = [];
    const named = (n: string) => () => closed.push(n);
    open('bottom-center', 40, named('s'), false);
    open('bottom-center', 40, named('a'));
    expect(closed).toEqual(['s']);
  });

  it('쌓지 않는 것이 다른 위치에 있으면 서로 상관없다', () => {
    const closed: string[] = [];
    const named = (n: string) => () => closed.push(n);
    open('top-center', 40, named('s'), false);
    open('bottom-center', 40, named('a'));
    expect(closed).toEqual([]);
  });

  it('stack 값을 열린 뒤에 바꾸면 다음 계산에 반영된다', () => {
    const closed: string[] = [];
    const named = (n: string) => () => closed.push(n);
    const a = open('bottom-center', 40, named('a'));
    setSnackbarStack(a, false);
    open('bottom-center', 40, named('b'));
    expect(closed).toEqual(['a']);
  });

  describe('넘침 onClose가 던질 때', () => {
    /** a b c를 열고 쌓지 않는 s로 셋 모두를 내보내게 하는 줄. 이름대로 부르고 던질 이름을 받는다 */
    const openThree = (throwing: string[], closed: string[]) => {
      const handler = (n: string) => () => {
        closed.push(n);
        if (throwing.includes(n)) throw new Error(`던짐 ${n}`);
      };
      for (const n of ['a', 'b', 'c']) {
        open('bottom-center', 40, handler(n));
      }
    };

    it('가운데 것이 던져도 뒤의 것을 부르고, 그 오류를 다시 던진다', () => {
      const closed: string[] = [];
      openThree(['b'], closed);

      expect(() => open('bottom-center', 40, () => {}, false)).toThrow(
        '던짐 b'
      );
      expect(closed).toEqual(['a', 'b', 'c']);
    });

    it('오류가 하나면 감싸지 않고 그 오류를 그대로 던진다', () => {
      const closed: string[] = [];
      openThree(['a'], closed);

      let caught: unknown;
      try {
        open('bottom-center', 40, () => {}, false);
      } catch (error) {
        caught = error;
      }
      expect(caught).toBeInstanceOf(Error);
      expect(caught).not.toBeInstanceOf(AggregateError);
      expect((caught as Error).message).toBe('던짐 a');
    });

    it('여럿이 던지면 전부 부른 뒤 AggregateError에 모아 던진다', () => {
      const closed: string[] = [];
      openThree(['a', 'c'], closed);

      let caught: unknown;
      try {
        open('bottom-center', 40, () => {}, false);
      } catch (error) {
        caught = error;
      }
      expect(closed).toEqual(['a', 'b', 'c']);
      expect(caught).toBeInstanceOf(AggregateError);
      expect(
        (caught as AggregateError).errors.map((e: Error) => e.message)
      ).toEqual(['던짐 a', '던짐 c']);
    });

    it('던진 뒤에도 줄은 그대로 이어진다 (던진 것도 내보내기로 한 표시를 가진다)', () => {
      const closed: string[] = [];
      openThree(['b'], closed);
      expect(() => open('bottom-center', 40, () => {}, false)).toThrow();

      // 같은 줄에 새것이 오면 이미 내보낸 a b c는 다시 고르지 않는다
      open('bottom-center', 40, () => {});
      expect(closed).toEqual(['a', 'b', 'c']);
    });
  });
});
