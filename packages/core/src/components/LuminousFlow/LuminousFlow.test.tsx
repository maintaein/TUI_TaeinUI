import { createRef, StrictMode } from 'react';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { act, render } from '@testing-library/react';
import { LuminousFlow } from './LuminousFlow';
import { MIN_BENDS, bendsForBox, createScene } from './luminousFlowScene';

// jsdom의 getContext는 null을 돌려주면서 "Not implemented" 오류를 콘솔에 쏟는다. 값은 같고 소음만 없앤다.
const original = HTMLCanvasElement.prototype.getContext;
beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = (() => null) as typeof original;
});
afterAll(() => {
  HTMLCanvasElement.prototype.getContext = original;
});

// jsdom에는 canvas 2D가 없어 getContext('2d')가 null이다. 컴포넌트는 그때 조용히 아무것도 하지 않아야 하고,
// 맥락이 있는 경로(그리기·rAF 예약)는 순수 함수(luminousFlowMotion.test.ts)와 실제 브라우저 확인이 맡는다.
describe('LuminousFlow (jsdom, canvas 2D 없음)', () => {
  it('루트는 aria-hidden이고 포인터 이벤트를 받지 않는다', () => {
    const { container } = render(<LuminousFlow />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute('aria-hidden', 'true');
    expect(getComputedStyle(root).pointerEvents).toBe('none');
  });

  it('부모 상자를 채운다(absolute, inset 0, 넘침 자름)', () => {
    const { container } = render(<LuminousFlow />);
    const style = getComputedStyle(container.firstElementChild as HTMLElement);
    expect(style.position).toBe('absolute');
    expect(style.overflow).toBe('hidden');
    expect(style.getPropertyValue('inset')).toBe('0');
  });

  it('className을 루트에 얹고 ref는 루트 div를 가리킨다', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(<LuminousFlow className="mine" ref={ref} />);
    const root = container.firstElementChild;
    expect(root).toHaveClass('mine');
    expect(ref.current).toBe(root);
    expect(root?.tagName).toBe('DIV');
  });

  it('잰 크기가 없으면 대기층 SVG는 가장 짧은 장면(굽이 수 최소)의 viewBox를 쓴다', () => {
    const { container } = render(<LuminousFlow />);
    expect(container.querySelector('svg')).toHaveAttribute(
      'viewBox',
      `0 0 492 ${createScene(MIN_BENDS).height}`
    );
  });

  it('맥락이 없어도 오류 없이 마운트·paused 전환·언마운트한다', () => {
    const { rerender, unmount } = render(
      <StrictMode>
        <LuminousFlow />
      </StrictMode>
    );
    rerender(
      <StrictMode>
        <LuminousFlow paused />
      </StrictMode>
    );
    rerender(
      <StrictMode>
        <LuminousFlow />
      </StrictMode>
    );
    expect(() => unmount()).not.toThrow();
  });
});

// 크기를 직접 알리는 최소 ResizeObserver. jsdom에는 레이아웃이 없어 상자 크기는 clientWidth/Height로 건넨다.
class FakeResizeObserver {
  static all: FakeResizeObserver[] = [];
  disconnected = false;
  constructor(private readonly callback: ResizeObserverCallback) {
    FakeResizeObserver.all.push(this);
  }
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {
    this.disconnected = true;
  }
  fire(): void {
    this.callback([], this as unknown as ResizeObserver);
  }
}

describe('LuminousFlow 크기에 따른 장면 (jsdom)', () => {
  const box = { width: 492, height: 300 };
  const sizeOf = (name: 'clientWidth' | 'clientHeight') => ({
    configurable: true,
    get: () => box[name === 'clientWidth' ? 'width' : 'height'],
  });
  const originalWidth = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    'clientWidth'
  );
  const originalHeight = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    'clientHeight'
  );
  beforeAll(() => {
    Object.defineProperty(
      HTMLElement.prototype,
      'clientWidth',
      sizeOf('clientWidth')
    );
    Object.defineProperty(
      HTMLElement.prototype,
      'clientHeight',
      sizeOf('clientHeight')
    );
  });
  afterAll(() => {
    if (originalWidth)
      Object.defineProperty(
        HTMLElement.prototype,
        'clientWidth',
        originalWidth
      );
    if (originalHeight)
      Object.defineProperty(
        HTMLElement.prototype,
        'clientHeight',
        originalHeight
      );
  });
  afterEach(() => vi.unstubAllGlobals());

  const mount = (paused = false) => {
    FakeResizeObserver.all = [];
    vi.stubGlobal('ResizeObserver', FakeResizeObserver);
    const view = render(
      <StrictMode>
        <LuminousFlow paused={paused} />
      </StrictMode>
    );
    const resizeTo = (width: number, height: number) => {
      box.width = width;
      box.height = height;
      act(() => FakeResizeObserver.all.forEach((observer) => observer.fire()));
    };
    const viewBox = () =>
      view.container.querySelector('svg')!.getAttribute('viewBox');
    const route = () =>
      view.container.querySelector('defs path')!.getAttribute('d')!;
    return { ...view, resizeTo, viewBox, route };
  };

  it('아주 짧은 상자(40px)와 아주 긴 상자(20000px)에서 예외 없이 상자를 덮는 장면을 쓴다', () => {
    const { resizeTo, viewBox } = mount();
    resizeTo(492, 40);
    expect(viewBox()).toBe(`0 0 492 ${createScene(MIN_BENDS).height}`);
    resizeTo(492, 20000);
    const n = bendsForBox(492, 20000);
    expect(n).toBeGreaterThan(MIN_BENDS);
    expect(viewBox()).toBe(`0 0 492 ${createScene(n).height}`);
    expect(createScene(n).height).toBeGreaterThanOrEqual(20000);
  });

  it('굽이 수의 짝홀을 넘는 크기 변경에서 장면이 바뀌고 마감 방향이 뒤집힌다(paused여도)', () => {
    const { resizeTo, viewBox, route } = mount(true);
    // 가장 짧은 장면(굽이 5, 홀수)은 오른쪽 밖으로 끝난다. 520px 더 긴 상자는 굽이 6(짝수)이라 왼쪽 밖이다
    resizeTo(492, 1000);
    const shortRoute = route();
    const shortBox = viewBox();
    const endsRight = (d: string) => Number(d.trim().split(' ').at(-2)) > 492;
    expect(endsRight(shortRoute)).toBe(true);
    resizeTo(492, 1446 + 1);
    expect(bendsForBox(492, 1447)).toBe(MIN_BENDS + 1);
    expect(viewBox()).not.toBe(shortBox);
    expect(endsRight(route())).toBe(false);
    resizeTo(492, 1446 + 520 + 1);
    expect(endsRight(route())).toBe(true);
  });

  // 그리기 효과가 한 번 돌 때마다 캔버스에서 getContext('2d')를 부른다. jsdom은 null을 돌려줘 효과가 바로 끝나므로
  // 그 호출 수가 곧 효과가 시작된 횟수다(값은 그대로 null이고 세기만 한다).
  // 무엇을 되돌리면 빨개지는가: 효과 의존성에 장면 객체를 되돌리면 둘째 단언이, 굽이 수를 빼면 마지막 단언이 빨개진다
  it('그리기 효과는 굽이 수가 바뀔 때만 다시 돌고, 같은 굽이 수의 장면 객체가 캐시에서 밀려나도 돌지 않는다', () => {
    const silent = HTMLCanvasElement.prototype.getContext;
    let runs = 0;
    HTMLCanvasElement.prototype.getContext = (() => {
      runs++;
      return null;
    }) as typeof original;
    try {
      FakeResizeObserver.all = [];
      vi.stubGlobal('ResizeObserver', FakeResizeObserver);
      box.width = 492;
      box.height = 300;
      const { rerender } = render(<LuminousFlow />);
      const resizeTo = (height: number) => {
        box.height = height;
        act(() =>
          FakeResizeObserver.all.forEach((observer) => observer.fire())
        );
      };
      resizeTo(300);
      expect(runs).toBe(1);
      const before = createScene(MIN_BENDS);
      // 다른 굽이 수의 장면 넷을 만들어 캐시(최근 4개)에서 밀어낸 뒤 다시 그린다
      for (let n = MIN_BENDS + 1; n <= MIN_BENDS + 4; n++) createScene(n);
      rerender(<LuminousFlow className="again" />);
      expect(createScene(MIN_BENDS)).not.toBe(before);
      expect(runs).toBe(1);
      resizeTo(2000);
      expect(runs).toBe(2);
    } finally {
      HTMLCanvasElement.prototype.getContext = silent;
    }
  });

  it('언마운트하면 크기 관찰을 끊는다', () => {
    const { unmount } = mount();
    unmount();
    expect(FakeResizeObserver.all.every((o) => o.disconnected)).toBe(true);
  });
});
