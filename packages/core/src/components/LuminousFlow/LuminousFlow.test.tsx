import { createRef, StrictMode } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { LuminousFlow } from './LuminousFlow';

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

  it('대기층 SVG의 viewBox 높이는 scrollScene이면 2162, 아니면 318이다', () => {
    const compact = render(<LuminousFlow />);
    expect(compact.container.querySelector('svg')).toHaveAttribute(
      'viewBox',
      '0 0 492 318'
    );
    const scroll = render(<LuminousFlow scrollScene />);
    expect(scroll.container.querySelector('svg')).toHaveAttribute(
      'viewBox',
      '0 0 492 2162'
    );
  });

  it('scrollScene 루트에만 안개를 첫 화면 높이로 줄이는 클래스가 붙는다', () => {
    const compact = render(<LuminousFlow />);
    const scroll = render(<LuminousFlow scrollScene />);
    expect(compact.container.firstElementChild?.classList.length).toBe(1);
    expect(scroll.container.firstElementChild?.classList.length).toBe(2);
  });

  it('맥락이 없어도 오류 없이 마운트·paused 전환·scrollScene 전환·언마운트한다', () => {
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
        <LuminousFlow paused scrollScene />
      </StrictMode>
    );
    rerender(
      <StrictMode>
        <LuminousFlow scrollScene />
      </StrictMode>
    );
    expect(() => unmount()).not.toThrow();
  });
});

describe('리스너 등록과 해제', () => {
  type Target = Window | Document;
  const restores: Array<() => void> = [];
  afterEach(() => {
    while (restores.length) restores.pop()?.();
  });

  /** 실제 add/removeEventListener를 그대로 부르면서 호출만 기록한다(동작을 바꾸지 않는다). */
  const record = (target: Target, log: string[]) => {
    const add = target.addEventListener.bind(target);
    const remove = target.removeEventListener.bind(target);
    target.addEventListener = ((type: string, ...rest: never[]) => {
      log.push(`+${type}`);
      return add(type, ...(rest as [never]));
    }) as typeof target.addEventListener;
    target.removeEventListener = ((type: string, ...rest: never[]) => {
      log.push(`-${type}`);
      return remove(type, ...(rest as [never]));
    }) as typeof target.removeEventListener;
    restores.push(() => {
      target.addEventListener = add as typeof target.addEventListener;
      target.removeEventListener = remove as typeof target.removeEventListener;
    });
  };

  it('마운트부터 언마운트까지 등록한 리스너가 남지 않는다', () => {
    // ponytail: jsdom에는 canvas 2D가 없어 컴포넌트가 등록 전에 물러나므로 이 시험은 "새는 등록이 없다"만 잠근다.
    // 등록·해제 짝(scroll, wheel, visibilitychange, matchMedia change)은 실제 브라우저에서 확인한다. canvas 구현체를 시험에 들이면 바꾼다.
    const log: string[] = [];
    record(window, log);
    record(document, log);
    const { unmount } = render(<LuminousFlow />);
    unmount();
    const added = log.filter((entry) => entry.startsWith('+')).sort();
    const removed = log
      .filter((entry) => entry.startsWith('-'))
      .map((entry) => `+${entry.slice(1)}`)
      .sort();
    expect(removed).toEqual(added);
  });
});
