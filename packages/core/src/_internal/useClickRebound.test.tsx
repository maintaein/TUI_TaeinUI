import { describe, it, expect, vi, afterEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { useClickRebound } from './useClickRebound';

const Probe = ({
  disabled = false,
  onPointerDown,
}: {
  disabled?: boolean;
  onPointerDown?: () => void;
}) => {
  const { pressed, handlers } = useClickRebound<HTMLButtonElement>(disabled, {
    onPointerDown,
  });
  return (
    <button type="button" data-pressed={pressed ? '' : undefined} {...handlers}>
      probe
    </button>
  );
};

// jsdom에는 PointerEvent가 없어 fireEvent.pointerDown은 button을 못 싣는다.
const pointer = (el: HTMLElement, type: string, button = 0) =>
  act(() => {
    el.dispatchEvent(new MouseEvent(type, { bubbles: true, button }));
  });

describe('useClickRebound', () => {
  afterEach(() => vi.useRealTimers());

  it('짧은 누름도 90ms는 유지하고 그 뒤에 해제한다', () => {
    vi.useFakeTimers();
    render(<Probe />);
    const el = screen.getByRole('button');

    pointer(el, 'pointerdown');
    expect(el).toHaveAttribute('data-pressed');
    pointer(el, 'pointerup');
    expect(el).toHaveAttribute('data-pressed');

    act(() => {
      vi.advanceTimersByTime(89);
    });
    expect(el).toHaveAttribute('data-pressed');
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(el).not.toHaveAttribute('data-pressed');
  });

  it('90ms 넘게 누르면 떼는 즉시 해제한다', () => {
    vi.useFakeTimers();
    render(<Probe />);
    const el = screen.getByRole('button');

    pointer(el, 'pointerdown');
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(el).toHaveAttribute('data-pressed');
    pointer(el, 'pointerup');
    expect(el).not.toHaveAttribute('data-pressed');
  });

  it('Enter와 Space도 같은 경로로 누른다', () => {
    render(<Probe />);
    const el = screen.getByRole('button');

    fireEvent.keyDown(el, { key: 'Enter' });
    expect(el).toHaveAttribute('data-pressed');
    fireEvent.blur(el);

    fireEvent.keyDown(el, { key: ' ' });
    expect(el).toHaveAttribute('data-pressed');
  });

  it('다른 키는 누르지 않는다', () => {
    render(<Probe />);
    const el = screen.getByRole('button');

    fireEvent.keyDown(el, { key: 'a' });
    expect(el).not.toHaveAttribute('data-pressed');
  });

  it('repeat keydown은 타이머를 다시 시작하지 않는다', () => {
    vi.useFakeTimers();
    render(<Probe />);
    const el = screen.getByRole('button');

    fireEvent.keyDown(el, { key: 'Enter' });
    act(() => {
      vi.advanceTimersByTime(60);
    });
    fireEvent.keyDown(el, { key: 'Enter', repeat: true });
    fireEvent.keyUp(el, { key: 'Enter' });
    act(() => {
      vi.advanceTimersByTime(30);
    });
    // repeat이 타이머를 다시 시작했다면 아직 눌려 있다.
    expect(el).not.toHaveAttribute('data-pressed');
  });

  it('주 버튼(0)만 누른다', () => {
    render(<Probe />);
    const el = screen.getByRole('button');

    pointer(el, 'pointerdown', 2);
    expect(el).not.toHaveAttribute('data-pressed');
  });

  it('소비자 핸들러를 먼저 부른다', () => {
    const onPointerDown = vi.fn();
    render(<Probe onPointerDown={onPointerDown} />);

    pointer(screen.getByRole('button'), 'pointerdown', 2);
    expect(onPointerDown).toHaveBeenCalledTimes(1);
  });

  it('비활성이 되는 순간 누름 상태를 비운다', () => {
    const { rerender } = render(<Probe />);
    const el = screen.getByRole('button');

    fireEvent.keyDown(el, { key: 'Enter' });
    expect(el).toHaveAttribute('data-pressed');
    rerender(<Probe disabled />);
    expect(el).not.toHaveAttribute('data-pressed');
  });
});
