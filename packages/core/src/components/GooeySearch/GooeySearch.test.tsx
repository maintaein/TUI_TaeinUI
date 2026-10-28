import { createRef, useState } from 'react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { GooeySearch, type GooeySearchProps } from './GooeySearch';

/** jsdom은 matchMedia를 구현하지 않는다. 축소 선호 경로를 열려면 깔아야 한다. */
const installReducedMotion = (): void => {
  vi.stubGlobal(
    'matchMedia',
    (media: string): MediaQueryList =>
      ({
        matches: true,
        media,
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
        onchange: null,
      }) as unknown as MediaQueryList
  );
};

afterEach(() => {
  vi.unstubAllGlobals();
});

const setup = (props: Partial<GooeySearchProps> = {}) => {
  const onOpenChange = vi.fn();
  const utils = render(
    <>
      <button type="button">바깥</button>
      <GooeySearch open onOpenChange={onOpenChange} {...props} />
    </>
  );
  return { onOpenChange, ...utils };
};

// jsdom에는 TransitionEvent가 없어 fireEvent로는 propertyName을 못 싣는다. 이름이 맞는 이벤트를 직접 쏜다.
const endTransition = (propertyName: string): void => {
  const event = new Event('transitionend', { bubbles: true });
  Object.defineProperty(event, 'propertyName', { value: propertyName });
  act(() => {
    input().dispatchEvent(event);
  });
};

const trigger = () => screen.getByRole('button', { name: /^검색/ });
const input = () => screen.getByLabelText('검색');

describe('GooeySearch', () => {
  describe('열고 닫기', () => {
    it('닫힌 트리거를 누르면 onOpenChange(true, click 이벤트)가 불린다', () => {
      const { onOpenChange } = setup({ open: false });
      fireEvent.click(trigger());
      expect(onOpenChange).toHaveBeenCalledTimes(1);
      const [next, event] = onOpenChange.mock.calls[0];
      expect(next).toBe(true);
      expect(event).toBeInstanceOf(Event);
      expect((event as Event).type).toBe('click');
    });

    it('열린 트리거를 누르면 onOpenChange(false, click 이벤트)가 불린다', () => {
      const { onOpenChange } = setup();
      fireEvent.click(trigger());
      expect(onOpenChange).toHaveBeenCalledWith(false, expect.any(Event));
      expect((onOpenChange.mock.calls[0][1] as Event).type).toBe('click');
    });

    it('열린 채 Esc를 누르면 onOpenChange(false, keydown 이벤트)와 함께 트리거로 포커스가 간다', () => {
      const { onOpenChange } = setup();
      input().focus();
      fireEvent.keyDown(input(), { key: 'Escape' });
      expect(onOpenChange).toHaveBeenCalledTimes(1);
      const [next, event] = onOpenChange.mock.calls[0];
      expect(next).toBe(false);
      expect((event as Event).type).toBe('keydown');
      expect(trigger()).toHaveFocus();
    });

    it('닫혀 있으면 Esc를 들어 주지 않는다', () => {
      const { onOpenChange } = setup({ open: false });
      fireEvent.keyDown(document.body, { key: 'Escape' });
      expect(onOpenChange).not.toHaveBeenCalled();
    });

    it('바깥 pointerdown은 onOpenChange(false, pointerdown 이벤트)를 부른다', () => {
      const { onOpenChange } = setup();
      fireEvent.pointerDown(screen.getByText('바깥'));
      expect(onOpenChange).toHaveBeenCalledTimes(1);
      const [next, event] = onOpenChange.mock.calls[0];
      expect(next).toBe(false);
      expect((event as Event).type).toBe('pointerdown');
    });

    it('안쪽 pointerdown(입력창, 트리거, 결과)은 닫지 않는다', () => {
      const { onOpenChange } = setup({ children: <p>결과 한 줄</p> });
      fireEvent.pointerDown(input());
      fireEvent.pointerDown(trigger());
      fireEvent.pointerDown(screen.getByText('결과 한 줄'));
      expect(onOpenChange).not.toHaveBeenCalled();
    });

    it('열린 채 onOpenChange가 다른 함수로 바뀌어도 Esc와 바깥 pointerdown은 새 함수를 부른다', () => {
      const first = vi.fn();
      const second = vi.fn();
      const { rerender } = render(
        <>
          <button type="button">바깥</button>
          <GooeySearch open onOpenChange={first} />
        </>
      );
      rerender(
        <>
          <button type="button">바깥</button>
          <GooeySearch open onOpenChange={second} />
        </>
      );
      fireEvent.keyDown(document.body, { key: 'Escape' });
      fireEvent.pointerDown(screen.getByText('바깥'));
      expect(first).not.toHaveBeenCalled();
      expect(second).toHaveBeenCalledTimes(2);
    });

    it('제어 소비자가 상태를 쥐면 트리거로 열고 닫을 수 있다', () => {
      const Controlled = () => {
        const [open, setOpen] = useState(false);
        return <GooeySearch open={open} onOpenChange={setOpen} />;
      };
      const { container } = render(<Controlled />);
      const root = container.firstElementChild as HTMLElement;
      expect(root).toHaveAttribute('data-open', 'false');
      fireEvent.click(trigger());
      expect(root).toHaveAttribute('data-open', 'true');
      fireEvent.click(trigger());
      expect(root).toHaveAttribute('data-open', 'false');
    });
  });

  describe('이름과 접근성', () => {
    it('기본 이름: 닫힘 "검색 열기", 열림 "검색 닫기", 입력창 "검색"', () => {
      const { rerender, onOpenChange } = setup({ open: false });
      expect(trigger()).toHaveAccessibleName('검색 열기');
      expect(input()).toBeInTheDocument();
      rerender(<GooeySearch open onOpenChange={onOpenChange} />);
      expect(trigger()).toHaveAccessibleName('검색 닫기');
    });

    it('이름 prop과 placeholder가 그대로 간다', () => {
      setup({
        open: false,
        openLabel: '찾기 열기',
        closeLabel: '찾기 닫기',
        inputLabel: '찾기',
        placeholder: '무엇을 찾나요',
      });
      expect(screen.getByRole('button', { name: '찾기 열기' })).toBeTruthy();
      expect(screen.getByLabelText('찾기')).toHaveAttribute(
        'placeholder',
        '무엇을 찾나요'
      );
    });

    it('트리거의 aria-expanded가 open을 따르고 입력창 id를 aria-controls로 가리킨다', () => {
      const { rerender, onOpenChange } = setup({ open: false });
      expect(trigger()).toHaveAttribute('aria-expanded', 'false');
      expect(trigger()).toHaveAttribute('aria-controls', input().id);
      rerender(<GooeySearch open onOpenChange={onOpenChange} />);
      expect(trigger()).toHaveAttribute('aria-expanded', 'true');
    });

    it('닫혀 있으면 입력창이 inert이고 열리면 풀린다', () => {
      const { rerender, onOpenChange } = setup({ open: false });
      expect(input()).toHaveAttribute('inert');
      rerender(<GooeySearch open onOpenChange={onOpenChange} />);
      expect(input()).not.toHaveAttribute('inert');
    });

    it('트리거 아이콘은 열림에 따라 search와 close로 바뀐다', () => {
      const { rerender, onOpenChange } = setup({ open: false });
      expect(trigger().querySelector('svg')).toHaveAttribute(
        'data-icon',
        'search'
      );
      rerender(<GooeySearch open onOpenChange={onOpenChange} />);
      expect(trigger().querySelector('svg')).toHaveAttribute(
        'data-icon',
        'close'
      );
    });
  });

  describe('inputProps와 children', () => {
    it('value, onChange, onKeyDown, role, aria-*가 입력창에 닿는다', () => {
      const onChange = vi.fn();
      const onKeyDown = vi.fn();
      setup({
        inputProps: {
          value: '버튼',
          onChange,
          onKeyDown,
          role: 'combobox',
          'aria-expanded': true,
        },
      });
      const field = screen.getByRole('combobox', { name: '검색' });
      expect(field).toHaveValue('버튼');
      expect(field).toHaveAttribute('aria-expanded', 'true');
      fireEvent.change(field, { target: { value: '버튼2' } });
      expect(onChange).toHaveBeenCalledTimes(1);
      fireEvent.keyDown(field, { key: 'ArrowDown' });
      expect(onKeyDown).toHaveBeenCalledTimes(1);
    });

    it('children은 루트 안 결과 자리에 그려진다', () => {
      const { container } = setup({ children: <ul aria-label="결과" /> });
      const root = container.querySelector('[data-testid="gooey-search"]');
      expect(root).toContainElement(screen.getByLabelText('결과'));
    });

    it('children이 없으면 결과 자리를 만들지 않는다', () => {
      const { container } = setup();
      const root = container.querySelector('[data-testid="gooey-search"]')!;
      // 결과 자리가 있다면 트리거를 감싼 상자 뒤에 온다
      expect(root.lastElementChild).toContainElement(trigger());
    });
  });

  describe('포커스', () => {
    it('clip-path 전이가 끝나면 입력창에 포커스가 간다', () => {
      setup();
      expect(input()).not.toHaveFocus();
      endTransition('opacity');
      expect(input()).not.toHaveFocus();
      endTransition('clip-path');
      expect(input()).toHaveFocus();
    });

    it('소비자의 onTransitionEnd도 함께 불린다', () => {
      const onTransitionEnd = vi.fn();
      setup({ inputProps: { onTransitionEnd } });
      endTransition('clip-path');
      expect(onTransitionEnd).toHaveBeenCalledTimes(1);
      expect(input()).toHaveFocus();
    });

    it('닫힌 채 clip-path 전이가 끝나도(닫힘 전이) 포커스를 주지 않는다', () => {
      setup({ open: false });
      endTransition('clip-path');
      expect(input()).not.toHaveFocus();
    });

    it('움직임 줄이기에서는 열리자마자 입력창에 포커스가 간다', () => {
      installReducedMotion();
      setup();
      expect(input()).toHaveFocus();
    });
  });

  describe('구조', () => {
    it('data-testid 셋이 있고 gooey-shapes의 첫 자식이 알약, 둘째가 공을 담은 이동 상자다', () => {
      const { container } = setup();
      const shapes = container.querySelector('[data-testid="gooey-shapes"]')!;
      expect(
        container.querySelector('[data-testid="gooey-search"]')
      ).toBeTruthy();
      expect(shapes).toHaveAttribute('aria-hidden', 'true');
      expect(shapes.children).toHaveLength(2);
      expect(shapes.firstElementChild?.children).toHaveLength(0);
      expect(shapes.lastElementChild).toContainElement(
        container.querySelector('[data-testid="gooey-ball"]') as HTMLElement
      );
    });

    it('goo 필터가 shapes에 걸린다', () => {
      const { container } = setup();
      const shapes = container.querySelector<HTMLElement>(
        '[data-testid="gooey-shapes"]'
      )!;
      const id = container.querySelector('filter')!.id;
      expect(shapes.style.filter).toContain(id);
    });

    it('className과 ref가 루트로, triggerRef가 트리거 button으로 간다', () => {
      const ref = createRef<HTMLDivElement>();
      const triggerRef = createRef<HTMLButtonElement>();
      const { container } = setup({ className: 'custom', ref, triggerRef });
      const root = container.querySelector('[data-testid="gooey-search"]');
      expect(root).toHaveClass('custom');
      expect(ref.current).toBe(root);
      expect(triggerRef.current).toBe(trigger());
    });
  });
});
