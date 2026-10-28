import { describe, it, expect, afterEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useFinePointer } from './useFinePointer';

const FINE_QUERY = '(hover: hover) and (pointer: fine)';

// useReducedMotion 시험과 같은 방식: change 리스너가 실제로 불리는 EventTarget 기반 보급품
class FakeMediaQueryList extends EventTarget {
  readonly media = FINE_QUERY;
  constructor(public matches: boolean) {
    super();
  }
  setMatches(next: boolean): void {
    this.matches = next;
    this.dispatchEvent(new Event('change'));
  }
}

const installMatchMedia = (matches: boolean): FakeMediaQueryList => {
  const list = new FakeMediaQueryList(matches);
  vi.stubGlobal('matchMedia', (query: string): MediaQueryList => {
    if (query !== FINE_QUERY) throw new Error(`예상하지 못한 질의: ${query}`);
    return list as unknown as MediaQueryList;
  });
  return list;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useFinePointer', () => {
  it('matchMedia가 없으면 false다', () => {
    expect(renderHook(() => useFinePointer()).result.current).toBe(false);
  });

  it('질의가 맞으면 true이고 질의가 바뀌면 따라간다', () => {
    const list = installMatchMedia(true);
    const { result } = renderHook(() => useFinePointer());
    expect(result.current).toBe(true);

    act(() => list.setMatches(false));
    expect(result.current).toBe(false);
  });
});
