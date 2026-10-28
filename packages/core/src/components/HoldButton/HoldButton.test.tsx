import { createRef, type FormEvent } from 'react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { HoldButton } from './HoldButton';
import { gsapDuration, gsapEasing } from '../../tokens/gsapEasing';

// HoldButton.tsx가 채움 막대와 체크 노드에 얹는 손잡이(BurstToggle의 __burstDots와 같은 모양).
type Step = { vars: { x?: number } };
type FillHost = HTMLElement & {
  __holdTween?: gsap.core.Tween;
  __holdShake?: gsap.core.Timeline & {
    getChildren(nested?: boolean): Step[];
  };
};
type CheckHost = HTMLElement & { __holdPop?: gsap.core.Tween };

const HOLD_SECONDS = gsapDuration.slower * 3;
const DEFAULT_ARMED = '한 번 더 누르면 실행';

const button = (name: string | RegExp = '삭제') =>
  screen.getByRole('button', { name });
const fillOf = (container: HTMLElement) =>
  container.querySelector('[data-hold-fill]') as FillHost;
const checkOf = (container: HTMLElement) =>
  container.querySelector('[data-hold-check]') as CheckHost | null;
const inkOf = (container: HTMLElement) =>
  container.querySelector('[data-hold-ink]') as HTMLElement;
const inkValueOf = (container: HTMLElement) =>
  Number(inkOf(container).style.getPropertyValue('--hold-v'));
const labelOf = (container: HTMLElement) =>
  container.querySelector('[data-hold-label]') as HTMLElement;
const scaleOf = (el: HTMLElement) =>
  Number(el.style.transform.match(/scaleX\(([-\d.]+)\)/)?.[1] ?? NaN);

// GSAP이 글자 칸에 쓴 translate의 x. 쓴 적이 없으면 0이다
const shiftOf = (el: HTMLElement) =>
  Number(el.style.transform.match(/translate\(([-\d.]+)px/)?.[1] ?? 0);

const stubReducedMotion = () =>
  vi.stubGlobal(
    'matchMedia',
    (media: string): MediaQueryList =>
      ({
        matches: true,
        media,
        addEventListener: () => {},
        removeEventListener: () => {},
      }) as unknown as MediaQueryList
  );

const wait = (ms: number) =>
  act(() => new Promise<void>((resolve) => setTimeout(resolve, ms)));

/** 홀드를 시작하고 시계를 끝까지 몰아 완료시킨다 */
const holdToEnd = (container: HTMLElement) => {
  fireEvent.pointerDown(button());
  act(() => {
    fillOf(container).__holdTween?.progress(1);
  });
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('HoldButton', () => {
  describe('의미와 접근성', () => {
    it('type=button이고 ref가 button으로 가며 네이티브 속성과 className이 간다', () => {
      const ref = createRef<HTMLButtonElement>();
      render(
        <HoldButton ref={ref} onConfirm={() => {}} data-x="1" className="mine">
          삭제
        </HoldButton>
      );
      expect(ref.current).toBe(button());
      expect(button()).toHaveAttribute('type', 'button');
      expect(button()).toHaveAttribute('data-x', '1');
      expect(button()).toHaveClass('mine');
    });

    it('폼 안에서 click·click·Enter(반복 포함)에도 폼이 제출되지 않는다: type은 받지 않고 button으로 고정이다', () => {
      const onSubmit = vi.fn((event: FormEvent) => event.preventDefault());
      const onConfirm = vi.fn();
      render(
        <form onSubmit={onSubmit}>
          {/* @ts-expect-error type은 받지 않는다. 폼 제출은 onConfirm에서 requestSubmit으로 */}
          <HoldButton type="submit" onConfirm={onConfirm}>
            삭제
          </HoldButton>
        </form>
      );
      expect(button()).toHaveAttribute('type', 'button');
      fireEvent.click(button());
      fireEvent.click(button(DEFAULT_ARMED));
      expect(onConfirm).toHaveBeenCalledTimes(1);
      // 실행 뒤 잠금 중의 click
      fireEvent.click(button());
      // Enter 유지: keydown과 반복 keydown마다 브라우저는 click을 낸다
      fireEvent.keyDown(button(), { key: 'Enter' });
      fireEvent.click(button());
      fireEvent.keyDown(button(), { key: 'Enter', repeat: true });
      fireEvent.click(button());
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('평소 접근 가능한 이름은 children이고 채움은 aria-hidden이며 알림 영역은 비어 있다', () => {
      const { container } = render(
        <HoldButton onConfirm={() => {}}>삭제</HoldButton>
      );
      expect(fillOf(container)).toHaveAttribute('aria-hidden', 'true');
      expect(screen.getByRole('status').textContent).toBe('');
    });

    it('네이티브 onClick은 실행이 아니다: 눌러 뗄 때마다 불리지만 onConfirm은 불리지 않는다', () => {
      const onClick = vi.fn();
      const onConfirm = vi.fn();
      render(
        <HoldButton onClick={onClick} onConfirm={onConfirm}>
          삭제
        </HoldButton>
      );
      fireEvent.click(button());
      expect(onClick).toHaveBeenCalledTimes(1);
      expect(onConfirm).not.toHaveBeenCalled();
    });
  });

  describe('홀드', () => {
    it('홀드 시계는 토큰 배수(slower x 3 = 1.5초)이고 linear다', () => {
      const { container } = render(
        <HoldButton onConfirm={() => {}}>삭제</HoldButton>
      );
      fireEvent.pointerDown(button());
      const clock = fillOf(container).__holdTween;
      expect(clock?.duration()).toBeCloseTo(HOLD_SECONDS, 5);
      expect(HOLD_SECONDS).toBeCloseTo(1.5, 5);
      expect(clock?.vars.ease).toBe(gsapEasing.linear);
    });

    it('홀드를 다 채우면 onConfirm이 한 번 불리고 뒤따르는 click은 무시된다', () => {
      const onConfirm = vi.fn();
      const { container } = render(
        <HoldButton onConfirm={onConfirm}>삭제</HoldButton>
      );
      fireEvent.pointerDown(button());
      expect(onConfirm).not.toHaveBeenCalled();
      act(() => {
        fillOf(container).__holdTween?.progress(1);
      });
      expect(onConfirm).toHaveBeenCalledTimes(1);
      fireEvent.pointerUp(button());
      fireEvent.click(button());
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('다 차기 전에 떼면 onConfirm은 0회이고 채움이 0으로 되감긴다(base·settle)', () => {
      const onConfirm = vi.fn();
      const { container } = render(
        <HoldButton onConfirm={onConfirm}>삭제</HoldButton>
      );
      fireEvent.pointerDown(button());
      act(() => {
        fillOf(container).__holdTween?.progress(0.6);
      });
      expect(scaleOf(fillOf(container))).toBeCloseTo(0.6, 5);
      fireEvent.pointerUp(button());
      const rewind = fillOf(container).__holdTween;
      expect(rewind?.vars).toMatchObject({
        p: 0,
        ease: gsapEasing.settle,
        duration: gsapDuration.base,
      });
      act(() => {
        rewind?.progress(1);
      });
      expect(scaleOf(fillOf(container))).toBe(0);
      expect(onConfirm).not.toHaveBeenCalled();
    });

    it.each([
      ['pointerCancel', () => fireEvent.pointerCancel(button())],
      ['pointerLeave', () => fireEvent.pointerLeave(button())],
    ])('%s로도 되감기고 실행되지 않는다', (_name, release) => {
      const onConfirm = vi.fn();
      const { container } = render(
        <HoldButton onConfirm={onConfirm}>삭제</HoldButton>
      );
      fireEvent.pointerDown(button());
      const clock = fillOf(container).__holdTween;
      release();
      expect(fillOf(container).__holdTween).not.toBe(clock);
      expect(fillOf(container).__holdTween?.vars.p).toBe(0);
      // 시계는 죽어서 더는 차오르지 못한다
      expect(clock?.parent).toBeFalsy();
      expect(onConfirm).not.toHaveBeenCalled();
    });

    it('실제 시간으로 1.5초 넘게 누르고 있으면 실행된다', async () => {
      const onConfirm = vi.fn();
      render(<HoldButton onConfirm={onConfirm}>삭제</HoldButton>);
      fireEvent.pointerDown(button());
      await wait(HOLD_SECONDS * 1000 * 0.5);
      expect(onConfirm).not.toHaveBeenCalled();
      await wait(HOLD_SECONDS * 1000 * 0.5 + 400);
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('채움은 시계를 따라 연속으로 차오른다', () => {
      const { container } = render(
        <HoldButton onConfirm={() => {}}>삭제</HoldButton>
      );
      fireEvent.pointerDown(button());
      act(() => {
        fillOf(container).__holdTween?.progress(0.3);
      });
      expect(scaleOf(fillOf(container))).toBeCloseTo(0.3, 5);
    });
  });

  describe('채움 위 흰 글자', () => {
    it('흰 글자 겹은 aria-hidden이고 같은 글자 둘을 담으며 이름에 섞이지 않는다', () => {
      const { container } = render(
        <HoldButton onConfirm={() => {}} confirmLabel="한 번 더">
          삭제
        </HoldButton>
      );
      expect(inkOf(container)).toHaveAttribute('aria-hidden', 'true');
      expect(inkOf(container).textContent).toBe('삭제한 번 더');
      expect(button()).toBeInTheDocument();
    });

    it('자르기 값이 채움의 scaleX를 그대로 따라간다', () => {
      const { container } = render(
        <HoldButton onConfirm={() => {}}>삭제</HoldButton>
      );
      expect(inkValueOf(container)).toBe(0);
      fireEvent.pointerDown(button());
      act(() => {
        fillOf(container).__holdTween?.progress(0.3);
      });
      expect(inkValueOf(container)).toBeCloseTo(0.3, 5);
      expect(inkValueOf(container)).toBe(scaleOf(fillOf(container)));
    });

    it('무장(채움 절반)에서는 글자가 반만 흰색이다', () => {
      const { container } = render(
        <HoldButton onConfirm={() => {}}>삭제</HoldButton>
      );
      fireEvent.click(button());
      act(() => {
        fillOf(container).__holdTween?.progress(1);
      });
      expect(inkValueOf(container)).toBe(0.5);
    });

    it('축소 모드에서는 자르기도 채움과 같은 단계값이다', () => {
      stubReducedMotion();
      const { container } = render(
        <HoldButton onConfirm={() => {}}>삭제</HoldButton>
      );
      fireEvent.pointerDown(button());
      act(() => {
        fillOf(container).__holdTween?.progress(0.3);
      });
      expect(inkValueOf(container)).toBe(0.5);
    });

    it('떨림은 아래 글자와 흰 글자 겹에 함께 걸린다', () => {
      const { container } = render(
        <HoldButton onConfirm={() => {}}>삭제</HoldButton>
      );
      fireEvent.pointerDown(button());
      const shake = fillOf(container).__holdShake;
      const targets = shake?.getChildren(false)[0].targets() ?? [];
      expect(targets).toContain(labelOf(container));
      expect(targets).toHaveLength(2);
    });
  });

  describe('두 번 눌러 확정', () => {
    it('click 한 번은 무장이다: 글자가 confirmLabel로 바뀌고 role=status가 알린다', () => {
      const onConfirm = vi.fn();
      render(
        <HoldButton onConfirm={onConfirm} confirmLabel="한 번 더 누르면 삭제">
          삭제
        </HoldButton>
      );
      fireEvent.click(button());
      expect(onConfirm).not.toHaveBeenCalled();
      expect(button('한 번 더 누르면 삭제')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveTextContent(
        '한 번 더 누르면 삭제'
      );
    });

    it('confirmLabel 기본값은 "한 번 더 누르면 실행"이다', () => {
      render(<HoldButton onConfirm={() => {}}>삭제</HoldButton>);
      fireEvent.click(button());
      expect(button(DEFAULT_ARMED)).toBeInTheDocument();
    });

    it('click 두 번으로 onConfirm이 한 번 불린다', () => {
      const onConfirm = vi.fn();
      render(<HoldButton onConfirm={onConfirm}>삭제</HoldButton>);
      fireEvent.click(button());
      fireEvent.click(button(DEFAULT_ARMED));
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('무장하면 채움이 절반 자리로 가서 멈춘다', () => {
      const { container } = render(
        <HoldButton onConfirm={() => {}}>삭제</HoldButton>
      );
      fireEvent.click(button());
      const tween = fillOf(container).__holdTween;
      expect(tween?.vars).toMatchObject({
        p: 0.5,
        ease: gsapEasing.settle,
        duration: gsapDuration.base,
      });
      act(() => {
        tween?.progress(1);
      });
      expect(scaleOf(fillOf(container))).toBe(0.5);
    });

    it('홀드 중 손을 떼면 생기는 click은 무장으로 가고 채움은 절반 자리로 되감긴다', () => {
      const onConfirm = vi.fn();
      const { container } = render(
        <HoldButton onConfirm={onConfirm}>삭제</HoldButton>
      );
      fireEvent.pointerDown(button());
      act(() => {
        fillOf(container).__holdTween?.progress(0.8);
      });
      fireEvent.pointerUp(button());
      fireEvent.click(button());
      expect(onConfirm).not.toHaveBeenCalled();
      expect(button(DEFAULT_ARMED)).toBeInTheDocument();
      expect(fillOf(container).__holdTween?.vars.p).toBe(0.5);
      act(() => {
        fillOf(container).__holdTween?.progress(1);
      });
      expect(scaleOf(fillOf(container))).toBe(0.5);
    });

    it('홀드가 이어지는 동안 오는 click(Enter의 keydown click)은 무장이 아니다', () => {
      const { container } = render(
        <HoldButton onConfirm={() => {}}>삭제</HoldButton>
      );
      fireEvent.pointerDown(button());
      fireEvent.click(button());
      expect(button()).toBeInTheDocument();
      expect(fillOf(container).__holdTween?.vars.p).toBe(1);
    });

    it('첫 click 뒤 blur하면 무장이 풀리고 다음 click은 다시 무장만 한다', () => {
      const onConfirm = vi.fn();
      const { container } = render(
        <HoldButton onConfirm={onConfirm}>삭제</HoldButton>
      );
      fireEvent.click(button());
      fireEvent.blur(button(DEFAULT_ARMED));
      expect(button()).toBeInTheDocument();
      expect(fillOf(container).__holdTween?.vars.p).toBe(0);
      fireEvent.click(button());
      expect(onConfirm).not.toHaveBeenCalled();
      expect(button(DEFAULT_ARMED)).toBeInTheDocument();
    });

    it('무장에는 타이머가 없다: 오래 흘러도 무장이 유지되고 그때의 click이 실행한다', () => {
      vi.useFakeTimers();
      const onConfirm = vi.fn();
      render(<HoldButton onConfirm={onConfirm}>삭제</HoldButton>);
      fireEvent.click(button());
      act(() => {
        vi.advanceTimersByTime(60 * 60 * 1000);
      });
      expect(button(DEFAULT_ARMED)).toBeInTheDocument();
      fireEvent.click(button(DEFAULT_ARMED));
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });
  });

  describe('키보드', () => {
    it('Space keydown을 유지해 시계를 채우면 실행된다', () => {
      const onConfirm = vi.fn();
      const { container } = render(
        <HoldButton onConfirm={onConfirm}>삭제</HoldButton>
      );
      fireEvent.keyDown(button(), { key: ' ' });
      act(() => {
        fillOf(container).__holdTween?.progress(1);
      });
      expect(onConfirm).toHaveBeenCalledTimes(1);
      fireEvent.keyUp(button(), { key: ' ' });
      fireEvent.click(button());
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('repeat keydown은 무시한다: 시계가 다시 시작되지 않고 홀드 밖에서는 시작하지 않는다', () => {
      const { container } = render(
        <HoldButton onConfirm={() => {}}>삭제</HoldButton>
      );
      fireEvent.keyDown(button(), { key: ' ' });
      const clock = fillOf(container).__holdTween;
      fireEvent.keyDown(button(), { key: ' ', repeat: true });
      expect(fillOf(container).__holdTween).toBe(clock);
      fireEvent.keyUp(button(), { key: ' ' });
      const rewind = fillOf(container).__holdTween;
      fireEvent.keyDown(button(), { key: ' ', repeat: true });
      expect(fillOf(container).__holdTween).toBe(rewind);
    });

    it('Space를 짧게 눌렀다 떼면(keyup 뒤 click) 무장이다', () => {
      const onConfirm = vi.fn();
      render(<HoldButton onConfirm={onConfirm}>삭제</HoldButton>);
      fireEvent.keyDown(button(), { key: ' ' });
      fireEvent.keyUp(button(), { key: ' ' });
      fireEvent.click(button());
      expect(onConfirm).not.toHaveBeenCalled();
      expect(button(DEFAULT_ARMED)).toBeInTheDocument();
    });

    it('Enter를 짧게 눌렀다 떼면(keydown click은 무시, keyup) 무장이다', () => {
      const onConfirm = vi.fn();
      render(<HoldButton onConfirm={onConfirm}>삭제</HoldButton>);
      fireEvent.keyDown(button(), { key: 'Enter' });
      fireEvent.click(button());
      fireEvent.keyUp(button(), { key: 'Enter' });
      expect(onConfirm).not.toHaveBeenCalled();
      expect(button(DEFAULT_ARMED)).toBeInTheDocument();
    });

    it('Enter를 유지해 시계를 채우면 실행되고 keyup은 무장하지 않는다', () => {
      const onConfirm = vi.fn();
      const { container } = render(
        <HoldButton onConfirm={onConfirm}>삭제</HoldButton>
      );
      fireEvent.keyDown(button(), { key: 'Enter' });
      act(() => {
        fillOf(container).__holdTween?.progress(1);
      });
      fireEvent.keyUp(button(), { key: 'Enter' });
      expect(onConfirm).toHaveBeenCalledTimes(1);
      expect(screen.getByRole('status')).not.toHaveTextContent(DEFAULT_ARMED);
    });

    it('다른 키는 홀드를 시작하지 않는다', () => {
      const { container } = render(
        <HoldButton onConfirm={() => {}}>삭제</HoldButton>
      );
      fireEvent.keyDown(button(), { key: 'a' });
      expect(fillOf(container).__holdTween).toBeUndefined();
    });
  });

  describe('실행 뒤', () => {
    it('완료를 role=status로 알리고 aria-disabled로 잠그되 포커스는 유지한다', () => {
      const { container } = render(
        <HoldButton onConfirm={() => {}}>삭제</HoldButton>
      );
      button().focus();
      holdToEnd(container);
      expect(button()).toHaveAttribute('aria-disabled', 'true');
      expect(button()).toHaveFocus();
      expect(screen.getByRole('status').textContent).not.toBe('');
      expect(checkOf(container)).toHaveAttribute('aria-hidden', 'true');
    });

    it('잠겨 있는 동안 click·홀드·키보드 홀드가 다시 실행하지 않는다', () => {
      const onConfirm = vi.fn();
      const { container } = render(
        <HoldButton onConfirm={onConfirm}>삭제</HoldButton>
      );
      holdToEnd(container);
      const clock = fillOf(container).__holdTween;
      fireEvent.click(button());
      fireEvent.click(button());
      fireEvent.pointerDown(button());
      fireEvent.keyDown(button(), { key: ' ' });
      expect(fillOf(container).__holdTween).toBe(clock);
      act(() => {
        clock?.progress(1);
      });
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('두 번째 click으로 실행해도 같은 잠금과 알림이 선다', () => {
      const onConfirm = vi.fn();
      const { container } = render(
        <HoldButton onConfirm={onConfirm}>삭제</HoldButton>
      );
      fireEvent.click(button());
      fireEvent.click(button(DEFAULT_ARMED));
      expect(onConfirm).toHaveBeenCalledTimes(1);
      expect(button()).toHaveAttribute('aria-disabled', 'true');
      expect(checkOf(container)).not.toBeNull();
      fireEvent.click(button());
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('잠시 뒤 처음 상태로 돌아오고 그 뒤 다시 실행할 수 있다', () => {
      vi.useFakeTimers();
      const onConfirm = vi.fn();
      const { container } = render(
        <HoldButton onConfirm={onConfirm}>삭제</HoldButton>
      );
      holdToEnd(container);
      act(() => {
        vi.advanceTimersByTime(gsapDuration.slower * 4 * 1000 + 50);
      });
      expect(button()).toHaveAttribute('aria-disabled', 'false');
      expect(checkOf(container)).toBeNull();
      expect(fillOf(container).__holdTween?.vars.p).toBe(0);
      holdToEnd(container);
      expect(onConfirm).toHaveBeenCalledTimes(2);
    });

    it('체크는 spring으로 튕기며 나타난다', () => {
      const { container } = render(
        <HoldButton onConfirm={() => {}}>삭제</HoldButton>
      );
      holdToEnd(container);
      const pop = checkOf(container)?.__holdPop;
      expect(pop?.vars.ease).toBe(gsapEasing.spring);
      expect(pop?.progress()).toBeLessThan(1);
    });

    it('언마운트하면 돌던 시계를 죽여 실행하지 않는다', () => {
      const onConfirm = vi.fn();
      const { container, unmount } = render(
        <HoldButton onConfirm={onConfirm}>삭제</HoldButton>
      );
      fireEvent.pointerDown(button());
      const clock = fillOf(container).__holdTween;
      unmount();
      expect(clock?.parent).toBeFalsy();
      expect(onConfirm).not.toHaveBeenCalled();
    });
  });

  describe('떨림', () => {
    it('마지막 30% 구간에서 1~2px 좌우로 진폭이 커지다 0으로 돌아온다', () => {
      const { container } = render(
        <HoldButton onConfirm={() => {}}>삭제</HoldButton>
      );
      fireEvent.pointerDown(button());
      const shake = fillOf(container).__holdShake;
      expect(shake?.delay()).toBeCloseTo(HOLD_SECONDS * 0.7, 5);
      const xs = (shake?.getChildren(false) ?? []).map((s) => s.vars.x ?? NaN);
      expect(xs[xs.length - 1]).toBe(0);
      const swing = xs.slice(0, -1);
      expect(swing.length).toBeGreaterThan(3);
      swing.forEach((x, i) => {
        expect(Math.abs(x)).toBeGreaterThanOrEqual(1);
        expect(Math.abs(x)).toBeLessThanOrEqual(2);
        if (i > 0) {
          expect(Math.abs(x)).toBeGreaterThan(Math.abs(swing[i - 1]));
          expect(Math.sign(x)).toBe(-Math.sign(swing[i - 1]));
        }
      });
      expect(shake?.duration()).toBeCloseTo(HOLD_SECONDS * 0.3, 5);
    });

    it('손을 떼면 떨림이 죽고 글자는 제자리다', () => {
      const { container } = render(
        <HoldButton onConfirm={() => {}}>삭제</HoldButton>
      );
      fireEvent.pointerDown(button());
      const shake = fillOf(container).__holdShake;
      act(() => {
        shake?.progress(0.5);
      });
      fireEvent.pointerUp(button());
      expect(shake?.parent).toBeFalsy();
      expect(shiftOf(labelOf(container))).toBe(0);
    });
  });

  describe('움직임 줄이기', () => {
    it('홀드 시간은 그대로다: 지속 시간의 절반에 실행되지 않고 지속 시간 뒤 실행된다', async () => {
      stubReducedMotion();
      const onConfirm = vi.fn();
      render(<HoldButton onConfirm={onConfirm}>삭제</HoldButton>);
      fireEvent.pointerDown(button());
      expect(onConfirm).not.toHaveBeenCalled();
      await wait(HOLD_SECONDS * 1000 * 0.5);
      expect(onConfirm).not.toHaveBeenCalled();
      await wait(HOLD_SECONDS * 1000 * 0.5 + 400);
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('시계 트윈이 정리되지 않은 채 지속 시간 그대로 돈다', () => {
      stubReducedMotion();
      const { container } = render(
        <HoldButton onConfirm={() => {}}>삭제</HoldButton>
      );
      fireEvent.pointerDown(button());
      const clock = fillOf(container).__holdTween;
      expect(clock?.duration()).toBeCloseTo(HOLD_SECONDS, 5);
      expect(clock?.progress()).toBe(0);
      expect(clock?.parent).toBeTruthy();
    });

    it('차오름은 네 단계로 끊어 보인다', () => {
      stubReducedMotion();
      const { container } = render(
        <HoldButton onConfirm={() => {}}>삭제</HoldButton>
      );
      fireEvent.pointerDown(button());
      const seen = new Set<number>();
      for (const p of [0.05, 0.2, 0.26, 0.4, 0.51, 0.7, 0.76, 0.99]) {
        act(() => {
          fillOf(container).__holdTween?.progress(p);
        });
        seen.add(scaleOf(fillOf(container)));
      }
      expect([...seen].sort()).toEqual([0.25, 0.5, 0.75, 1]);
    });

    it('떨림과 튕김은 없다: 떨림은 끝 상태로 확정돼 글자가 제자리고 체크는 이미 앉아 있다', () => {
      stubReducedMotion();
      const { container } = render(
        <HoldButton onConfirm={() => {}}>삭제</HoldButton>
      );
      fireEvent.pointerDown(button());
      const shake = fillOf(container).__holdShake;
      expect(shake?.progress()).toBe(1);
      expect(shake?.parent).toBeFalsy();
      act(() => {
        fillOf(container).__holdTween?.progress(1);
      });
      expect(shiftOf(labelOf(container))).toBe(0);
      expect(checkOf(container)?.__holdPop?.progress()).toBe(1);
    });

    it('무장도 같은 절반 자리(두 번째 단계)에 선다', () => {
      stubReducedMotion();
      const { container } = render(
        <HoldButton onConfirm={() => {}}>삭제</HoldButton>
      );
      fireEvent.click(button());
      expect(scaleOf(fillOf(container))).toBe(0.5);
    });
  });

  describe('끝까지 누른 뒤', () => {
    it('홀드를 채운 뒤 처음 상태로 돌아온 다음에 떼도 click이 무장으로 새지 않는다', () => {
      vi.useFakeTimers();
      const onConfirm = vi.fn();
      const { container } = render(
        <HoldButton onConfirm={onConfirm}>삭제</HoldButton>
      );
      holdToEnd(container);
      act(() => {
        vi.advanceTimersByTime(gsapDuration.slower * 4 * 1000 + 50);
      });
      expect(button()).toHaveAttribute('data-state', 'idle');
      fireEvent.pointerUp(button());
      fireEvent.click(button());
      expect(button()).toHaveAttribute('data-state', 'idle');
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it.each([
      ['pointercancel', () => fireEvent.pointerCancel(button())],
      ['blur', () => fireEvent.blur(button())],
    ])(
      '%s가 오면 표지가 내려 click이 오지 않은 누름이 다음 보조기기 click을 삼키지 않는다',
      (_name, leave) => {
        vi.useFakeTimers();
        const { container } = render(
          <HoldButton onConfirm={() => {}}>삭제</HoldButton>
        );
        holdToEnd(container);
        act(() => {
          vi.advanceTimersByTime(gsapDuration.slower * 4 * 1000 + 50);
        });
        leave();
        fireEvent.click(button());
        expect(screen.getByRole('button')).toHaveAttribute(
          'data-state',
          'armed'
        );
      }
    );

    it('다음 누름이 시작되면 표지가 내려 그 누름의 click은 다시 무장한다', () => {
      vi.useFakeTimers();
      const { container } = render(
        <HoldButton onConfirm={() => {}}>삭제</HoldButton>
      );
      holdToEnd(container);
      act(() => {
        vi.advanceTimersByTime(gsapDuration.slower * 4 * 1000 + 50);
      });
      fireEvent.pointerUp(button());
      fireEvent.click(button());
      fireEvent.pointerDown(button());
      fireEvent.pointerUp(button());
      fireEvent.click(button());
      expect(screen.getByRole('button')).toHaveAttribute('data-state', 'armed');
    });
  });

  describe('disabled', () => {
    it('어떤 경로로도 실행되지 않고 시계도 시작하지 않는다', () => {
      const onConfirm = vi.fn();
      const { container } = render(
        <HoldButton onConfirm={onConfirm} disabled>
          삭제
        </HoldButton>
      );
      fireEvent.pointerDown(button());
      fireEvent.keyDown(button(), { key: ' ' });
      fireEvent.keyDown(button(), { key: 'Enter' });
      fireEvent.click(button());
      fireEvent.click(button());
      expect(fillOf(container).__holdTween).toBeUndefined();
      expect(onConfirm).not.toHaveBeenCalled();
      expect(button()).toBeDisabled();
    });

    it('홀드 도중 disabled가 켜지면 시간이 지나도 실행되지 않고 채움이 되감긴다', async () => {
      const onConfirm = vi.fn();
      const { container, rerender } = render(
        <HoldButton onConfirm={onConfirm}>삭제</HoldButton>
      );
      fireEvent.pointerDown(button());
      const clock = fillOf(container).__holdTween;
      rerender(
        <HoldButton onConfirm={onConfirm} disabled>
          삭제
        </HoldButton>
      );
      expect(clock?.parent).toBeFalsy();
      expect(fillOf(container).__holdTween?.vars.p).toBe(0);
      await wait(HOLD_SECONDS * 1000 + 400);
      expect(onConfirm).not.toHaveBeenCalled();
      expect(scaleOf(fillOf(container))).toBe(0);
    });

    it('무장 중에 disabled가 켜지면 무장이 풀리고 채움이 비워진다', () => {
      const onConfirm = vi.fn();
      const { container, rerender } = render(
        <HoldButton onConfirm={onConfirm}>삭제</HoldButton>
      );
      fireEvent.click(button());
      expect(screen.getByRole('button')).toHaveAttribute('data-state', 'armed');
      rerender(
        <HoldButton onConfirm={onConfirm} disabled>
          삭제
        </HoldButton>
      );
      expect(button()).toHaveAttribute('data-state', 'idle');
      expect(fillOf(container).__holdTween?.vars.p).toBe(0);
    });
  });
});
