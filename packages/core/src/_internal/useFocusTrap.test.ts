import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { RefObject } from 'react';
import { useFocusTrap } from './useFocusTrap';

describe('useFocusTrap', () => {
  let container: HTMLDivElement;
  let containerRef: RefObject<HTMLElement | null>;

  beforeEach(() => {
    container = document.createElement('div');
    container.innerHTML = `
      <button>First</button>
      <button>Middle</button>
      <button>Last</button>
    `;
    document.body.appendChild(container);
    containerRef = { current: container };
  });

  afterEach(() => {
    document.body.removeChild(container);
    document.body.style.overflow = '';
  });

  it('open이 true면 첫 번째 포커스 가능 요소로 포커스가 이동한다', () => {
    renderHook(() =>
      useFocusTrap({
        open: true,
        onClose: vi.fn(),
        closeOnEscape: true,
        containerRef,
      })
    );

    expect(container.querySelector('button')).toHaveFocus();
  });

  it('포커스 가능한 요소가 없으면 컨테이너 자체로 포커스가 이동한다', () => {
    const emptyContainer = document.createElement('div');
    document.body.appendChild(emptyContainer);
    const emptyRef: RefObject<HTMLElement | null> = { current: emptyContainer };

    renderHook(() =>
      useFocusTrap({
        open: true,
        onClose: vi.fn(),
        closeOnEscape: true,
        containerRef: emptyRef,
      })
    );

    expect(emptyContainer).toHaveFocus();
    document.body.removeChild(emptyContainer);
  });

  it('open이 false면 포커스를 바꾸지 않는다', () => {
    const activeBefore = document.activeElement;

    renderHook(() =>
      useFocusTrap({
        open: false,
        onClose: vi.fn(),
        closeOnEscape: true,
        containerRef,
      })
    );

    expect(document.activeElement).toBe(activeBefore);
  });

  it('ESC 키 입력 시 closeOnEscape가 true면 onClose가 호출된다', () => {
    const onClose = vi.fn();
    renderHook(() =>
      useFocusTrap({ open: true, onClose, closeOnEscape: true, containerRef })
    );

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closeOnEscape가 false면 ESC 키 입력 시 onClose가 호출되지 않는다', () => {
    const onClose = vi.fn();
    renderHook(() =>
      useFocusTrap({ open: true, onClose, closeOnEscape: false, containerRef })
    );

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(onClose).not.toHaveBeenCalled();
  });

  it('마지막 요소에서 Tab을 누르면 첫 요소로 순환한다', () => {
    renderHook(() =>
      useFocusTrap({
        open: true,
        onClose: vi.fn(),
        closeOnEscape: true,
        containerRef,
      })
    );

    const buttons = container.querySelectorAll('button');
    const first = buttons[0] as HTMLElement;
    const last = buttons[buttons.length - 1] as HTMLElement;

    last.focus();
    expect(last).toHaveFocus();

    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', bubbles: true })
    );

    expect(first).toHaveFocus();
  });

  it('첫 요소에서 Shift+Tab을 누르면 마지막 요소로 순환한다', () => {
    renderHook(() =>
      useFocusTrap({
        open: true,
        onClose: vi.fn(),
        closeOnEscape: true,
        containerRef,
      })
    );

    const buttons = container.querySelectorAll('button');
    const first = buttons[0] as HTMLElement;
    const last = buttons[buttons.length - 1] as HTMLElement;

    first.focus();
    expect(first).toHaveFocus();

    document.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true,
      })
    );

    expect(last).toHaveFocus();
  });

  it('중간 요소에서 Tab을 누르면 트랩이 개입하지 않는다', () => {
    renderHook(() =>
      useFocusTrap({
        open: true,
        onClose: vi.fn(),
        closeOnEscape: true,
        containerRef,
      })
    );

    const buttons = container.querySelectorAll('button');
    const middle = buttons[1] as HTMLElement;
    middle.focus();
    expect(middle).toHaveFocus();

    const tabEvent = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    });
    document.dispatchEvent(tabEvent);

    expect(tabEvent.defaultPrevented).toBe(false);
  });

  it('open이면 body의 overflow가 hidden이 된다', () => {
    renderHook(() =>
      useFocusTrap({
        open: true,
        onClose: vi.fn(),
        closeOnEscape: true,
        containerRef,
      })
    );

    expect(document.body.style.overflow).toBe('hidden');
  });

  it('unmount되면 body의 overflow가 복원된다', () => {
    const { unmount } = renderHook(() =>
      useFocusTrap({
        open: true,
        onClose: vi.fn(),
        closeOnEscape: true,
        containerRef,
      })
    );

    unmount();

    expect(document.body.style.overflow).toBe('');
  });

  it('lockScroll이 false면 body의 overflow를 건드리지 않는다', () => {
    renderHook(() =>
      useFocusTrap({
        open: true,
        onClose: vi.fn(),
        closeOnEscape: true,
        containerRef,
        lockScroll: false,
      })
    );

    expect(document.body.style.overflow).toBe('');
  });

  it('restoreFocusOnClose 기본값(true)이면 닫힐 때 이전 포커스 요소로 복원된다', () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();
    expect(trigger).toHaveFocus();

    const { rerender } = renderHook(
      ({ open }: { open: boolean }) =>
        useFocusTrap({
          open,
          onClose: vi.fn(),
          closeOnEscape: true,
          containerRef,
        }),
      { initialProps: { open: true } }
    );

    expect(container.querySelector('button')).toHaveFocus();

    rerender({ open: false });

    expect(trigger).toHaveFocus();
    document.body.removeChild(trigger);
  });

  it('restoreFocusOnClose가 false면 닫혀도 자동으로 포커스를 복원하지 않는다', () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();

    const { rerender } = renderHook(
      ({ open }: { open: boolean }) =>
        useFocusTrap({
          open,
          onClose: vi.fn(),
          closeOnEscape: true,
          containerRef,
          restoreFocusOnClose: false,
        }),
      { initialProps: { open: true } }
    );

    rerender({ open: false });

    expect(trigger).not.toHaveFocus();
    document.body.removeChild(trigger);
  });

  it('restoreFocusOnClose가 false여도 previousActiveElementRef로 이전 포커스 요소에 접근할 수 있다', () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();

    const { result } = renderHook(() =>
      useFocusTrap({
        open: true,
        onClose: vi.fn(),
        closeOnEscape: true,
        containerRef,
        restoreFocusOnClose: false,
      })
    );

    expect(result.current.previousActiveElementRef.current).toBe(trigger);
    document.body.removeChild(trigger);
  });

  describe('Tab 가두기', () => {
    const pressTab = (shiftKey = false) => {
      const event = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey,
        bubbles: true,
        cancelable: true,
      });
      document.dispatchEvent(event);
      return event;
    };
    const openTrap = (ref: RefObject<HTMLElement | null>) =>
      renderHook(() =>
        useFocusTrap({
          open: true,
          onClose: vi.fn(),
          closeOnEscape: true,
          containerRef: ref,
        })
      );

    it('포커스가 안에 있고 포커스 가능한 요소가 없으면 Tab을 막는다', () => {
      const empty = document.createElement('div');
      document.body.appendChild(empty);
      openTrap({ current: empty });
      expect(empty).toHaveFocus();

      expect(pressTab().defaultPrevented).toBe(true);
      document.body.removeChild(empty);
    });

    it('포커스가 밖에 있고 되돌릴 수 없으면 Tab을 막지 않는다', () => {
      const empty = document.createElement('div');
      const outside = document.createElement('button');
      document.body.append(empty, outside);
      openTrap({ current: empty });
      // 안으로 포커스가 못 들어가는 상태(예: inert인 상자 안)를 만든다.
      empty.removeAttribute('tabindex');
      outside.focus();
      expect(outside).toHaveFocus();

      expect(pressTab().defaultPrevented).toBe(false);
      expect(outside).toHaveFocus();
      document.body.removeChild(empty);
      document.body.removeChild(outside);
    });

    it('포커스가 밖에 있고 되돌릴 수 있으면 첫 요소로 되돌리고 Tab을 막는다', () => {
      const outside = document.createElement('button');
      document.body.appendChild(outside);
      openTrap(containerRef);
      outside.focus();

      expect(pressTab().defaultPrevented).toBe(true);
      expect(container.querySelector('button')).toHaveFocus();
      document.body.removeChild(outside);
    });

    it('열린 뒤 안에 생긴 요소까지 Tab이 돈다', () => {
      openTrap(containerRef);
      const extra = document.createElement('button');
      container.appendChild(extra);
      extra.focus();

      expect(pressTab().defaultPrevented).toBe(true);
      expect(container.querySelector('button')).toHaveFocus();
    });

    it('열린 뒤 안에 요소가 생기면 컨테이너에서 Tab이 그 안으로 간다', () => {
      const empty = document.createElement('div');
      document.body.appendChild(empty);
      openTrap({ current: empty });
      empty.appendChild(document.createElement('button'));

      expect(pressTab().defaultPrevented).toBe(false);
      document.body.removeChild(empty);
    });

    it('컨테이너에 포커스가 있을 때 Shift+Tab은 마지막 요소로 돈다', () => {
      const empty = document.createElement('div');
      document.body.appendChild(empty);
      openTrap({ current: empty });
      const added = document.createElement('button');
      empty.appendChild(added);

      expect(pressTab(true).defaultPrevented).toBe(true);
      expect(added).toHaveFocus();
      document.body.removeChild(empty);
    });
  });
});
