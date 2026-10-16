import { describe, it, expect, afterEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useReducedMotion } from './useReducedMotion';

const REDUCE_QUERY = '(prefers-reduced-motion: reduce)';

// jsdom은 matchMedia를 구현하지 않는다. 호출 횟수만 세는 껍데기 대신 EventTarget을
// 상속한 진짜 동작 객체를 깐다. setMatches로 값을 바꾸면 change 리스너가 실제로
// 호출된다. 플랫폼 API 공백을 메우는 환경 보급이지 협력자 모킹이 아니다.
class FakeMediaQueryList extends EventTarget {
  matches: boolean;
  readonly media = REDUCE_QUERY;
  // 구독 누수를 잡기 위한 카운터. dispatch 자체는 EventTarget 구현을 그대로 쓴다.
  listenerCount = 0;

  constructor(matches: boolean) {
    super();
    this.matches = matches;
  }

  override addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions
  ): void {
    this.listenerCount += 1;
    super.addEventListener(type, listener, options);
  }

  override removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | EventListenerOptions
  ): void {
    this.listenerCount -= 1;
    super.removeEventListener(type, listener, options);
  }

  setMatches(next: boolean): void {
    this.matches = next;
    this.dispatchEvent(new Event('change'));
  }
}

const installMatchMedia = (matches: boolean): FakeMediaQueryList => {
  const list = new FakeMediaQueryList(matches);

  vi.stubGlobal('matchMedia', (query: string): MediaQueryList => {
    // 훅이 다른 쿼리를 물으면 여기서 터진다. 쿼리 문자열도 같이 잠근다.
    if (query !== REDUCE_QUERY) {
      throw new Error(`예상하지 못한 미디어 쿼리: ${query}`);
    }
    return list as unknown as MediaQueryList;
  });

  return list;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useReducedMotion', () => {
  it('축소 선호가 켜져 있으면 true를 반환해야 한다', () => {
    installMatchMedia(true);

    const { result } = renderHook(() => useReducedMotion());

    expect(result.current).toBe(true);
  });

  it('축소 선호가 꺼져 있으면 false를 반환해야 한다', () => {
    installMatchMedia(false);

    const { result } = renderHook(() => useReducedMotion());

    expect(result.current).toBe(false);
  });

  it('미디어 쿼리 변경 이벤트를 반영해야 한다', () => {
    const list = installMatchMedia(false);
    const { result } = renderHook(() => useReducedMotion());

    act(() => {
      list.setMatches(true);
    });
    expect(result.current).toBe(true);

    act(() => {
      list.setMatches(false);
    });
    expect(result.current).toBe(false);
  });

  it('언마운트하면 구독을 해제해야 한다', () => {
    const list = installMatchMedia(false);
    const { unmount } = renderHook(() => useReducedMotion());

    expect(list.listenerCount).toBe(1);

    unmount();

    expect(list.listenerCount).toBe(0);
  });

  it('matchMedia가 없는 환경에서도 터지지 않고 false를 반환해야 한다', () => {
    // jsdom 기본 상태 그대로. window는 있지만 matchMedia가 없다.
    expect(window.matchMedia).toBeUndefined();

    const { result, unmount } = renderHook(() => useReducedMotion());

    expect(result.current).toBe(false);
    expect(() => unmount()).not.toThrow();
  });
});
