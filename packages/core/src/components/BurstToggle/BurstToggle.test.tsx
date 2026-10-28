import { useState } from 'react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { BurstToggle, type BurstToggleProps } from './BurstToggle';
import { gsapDuration, gsapEasing } from '../../tokens/gsapEasing';

// BurstToggle.tsx가 DOM 노드에 얹는 손잡이(IconButton의 __iconButtonJelly와 같은 모양).
type Step = {
  vars: {
    scaleX?: number;
    scaleY?: number;
    scale?: number;
    ease?: string;
    opacity?: number;
  };
  duration(): number;
  startTime(): number;
  endTime(): number;
};
type Handle = {
  getChildren(nested?: boolean): Step[];
  progress(value?: number): unknown;
  parent: unknown;
};
type SquashHost = HTMLElement & { __burstSquash?: Handle };
type RingHost = HTMLElement & { __burstDots?: Handle };

const Off = () => <svg data-testid="off" />;
const On = () => <svg data-testid="on" />;

/** 소비자가 상태를 쥔 모양. 단추 click이 켜고 끈다 */
const Controlled = (props: Partial<BurstToggleProps>) => {
  const [selected, setSelected] = useState(false);
  return (
    <BurstToggle
      aria-label="좋아요"
      selected={selected}
      onClick={() => setSelected(!selected)}
      selectedIcon={<On />}
      {...props}
    >
      <Off />
    </BurstToggle>
  );
};

const dots = (container: HTMLElement) =>
  container.querySelectorAll('[data-burst-dot]');
const ringOf = (container: HTMLElement) =>
  container.querySelector('[data-burst-ring]') as RingHost;
const button = () => screen.getByRole('button', { name: '좋아요' });
const slotOf = () => button().querySelector('[data-burst-slot]') as SquashHost;
const squash = () => slotOf().__burstSquash;

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

afterEach(() => vi.unstubAllGlobals());

describe('BurstToggle', () => {
  describe('의미와 접근성', () => {
    it('aria-pressed가 selected를 따른다', () => {
      const { rerender } = render(
        <BurstToggle aria-label="좋아요" selected={false} selectedIcon={<On />}>
          <Off />
        </BurstToggle>
      );
      expect(button()).toHaveAttribute('aria-pressed', 'false');
      rerender(
        <BurstToggle aria-label="좋아요" selected selectedIcon={<On />}>
          <Off />
        </BurstToggle>
      );
      expect(button()).toHaveAttribute('aria-pressed', 'true');
    });

    it('켜면 selectedIcon이, 끄면 children이 보이고 둘이 함께 있지 않다', () => {
      render(<Controlled />);
      expect(screen.getByTestId('off')).toBeInTheDocument();
      expect(screen.queryByTestId('on')).toBeNull();
      fireEvent.click(button());
      expect(screen.getByTestId('on')).toBeInTheDocument();
      expect(screen.queryByTestId('off')).toBeNull();
      fireEvent.click(button());
      expect(screen.getByTestId('off')).toBeInTheDocument();
    });

    it('접근 가능한 이름은 상태와 무관하게 aria-label이다', () => {
      render(<Controlled />);
      expect(button()).toBeInTheDocument();
      fireEvent.click(button());
      expect(
        screen.getByRole('button', { name: '좋아요' })
      ).toBeInTheDocument();
    });

    it('type=button이고 ref가 button으로 간다', () => {
      let node: HTMLButtonElement | null = null;
      render(
        <BurstToggle
          aria-label="좋아요"
          selected={false}
          selectedIcon={<On />}
          ref={(el) => {
            node = el;
          }}
        >
          <Off />
        </BurstToggle>
      );
      expect(node).toBe(button());
      expect(button()).toHaveAttribute('type', 'button');
    });

    it('네이티브 속성과 className이 단추로 간다', () => {
      render(<Controlled data-x="1" className="mine" />);
      expect(button()).toHaveAttribute('data-x', '1');
      expect(button()).toHaveClass('mine');
    });

    it('disabled면 onClick이 불리지 않고 점도 없다', () => {
      const onClick = vi.fn();
      const { container } = render(
        <BurstToggle
          aria-label="좋아요"
          selected={false}
          selectedIcon={<On />}
          onClick={onClick}
          disabled
        >
          <Off />
        </BurstToggle>
      );
      fireEvent.click(button());
      expect(onClick).not.toHaveBeenCalled();
      expect(dots(container)).toHaveLength(0);
    });
  });

  describe('터짐', () => {
    it('켜는 click 뒤 점 8개가 생기고 점 고리는 aria-hidden이다', () => {
      const { container } = render(<Controlled />);
      expect(dots(container)).toHaveLength(0);
      fireEvent.click(button());
      expect(dots(container)).toHaveLength(8);
      expect(ringOf(container)).toHaveAttribute('aria-hidden', 'true');
    });

    it('끄는 click 뒤에는 점이 생기지 않는다', () => {
      const { container } = render(<Controlled />);
      fireEvent.click(button());
      act(() => {
        ringOf(container).__burstDots?.progress(1);
      });
      expect(dots(container)).toHaveLength(0);
      fireEvent.click(button());
      expect(button()).toHaveAttribute('aria-pressed', 'false');
      expect(dots(container)).toHaveLength(0);
    });

    it('마운트 때 selected=true면 점이 없다', () => {
      const { container } = render(
        <BurstToggle aria-label="좋아요" selected selectedIcon={<On />}>
          <Off />
        </BurstToggle>
      );
      expect(dots(container)).toHaveLength(0);
    });

    it('바깥에서 selected만 바뀌면(click 없이) 점이 없다', () => {
      const { container, rerender } = render(
        <BurstToggle aria-label="좋아요" selected={false} selectedIcon={<On />}>
          <Off />
        </BurstToggle>
      );
      rerender(
        <BurstToggle aria-label="좋아요" selected selectedIcon={<On />}>
          <Off />
        </BurstToggle>
      );
      expect(screen.getByTestId('on')).toBeInTheDocument();
      expect(dots(container)).toHaveLength(0);
    });

    it('터짐이 끝나면 점 노드가 DOM에 남지 않는다', () => {
      const { container } = render(<Controlled />);
      fireEvent.click(button());
      act(() => {
        ringOf(container).__burstDots?.progress(1);
      });
      expect(dots(container)).toHaveLength(0);
      expect(ringOf(container)).toBeNull();
    });

    it('실제 시간이 흘러도 스스로 끝나 점이 사라진다', async () => {
      const { container } = render(<Controlled />);
      fireEvent.click(button());
      expect(dots(container)).toHaveLength(8);
      await act(
        () =>
          new Promise((resolve) =>
            setTimeout(resolve, gsapDuration.slower * 1000 + 600)
          )
      );
      expect(dots(container)).toHaveLength(0);
    });

    it('켜는 중 다시 눌러 끄면 남은 점이 그 자리에서 거둬진다', () => {
      const { container } = render(<Controlled />);
      fireEvent.click(button());
      const timeline = ringOf(container).__burstDots as Handle;
      expect(dots(container)).toHaveLength(8);
      fireEvent.click(button());
      expect(dots(container)).toHaveLength(0);
      expect(button()).toHaveAttribute('aria-pressed', 'false');
      expect(timeline.parent).toBeFalsy();
    });

    it('소비자가 onClick에서 상태를 안 바꾸면(거절) 점도 납작 트윈도 없다', () => {
      const onClick = vi.fn();
      const { container } = render(
        <BurstToggle
          aria-label="좋아요"
          selected={false}
          selectedIcon={<On />}
          onClick={onClick}
        >
          <Off />
        </BurstToggle>
      );
      fireEvent.click(button());
      fireEvent.click(button());
      expect(onClick).toHaveBeenCalledTimes(2);
      expect(dots(container)).toHaveLength(0);
      expect(squash()).toBeUndefined();
    });

    it('소비자가 onClick에서 preventDefault하면 상태를 바꿔도 터짐도 납작 트윈도 없다', () => {
      const Prevented = () => {
        const [selected, setSelected] = useState(false);
        return (
          <BurstToggle
            aria-label="좋아요"
            selected={selected}
            selectedIcon={<On />}
            onClick={(event) => {
              event.preventDefault();
              setSelected(!selected);
            }}
          >
            <Off />
          </BurstToggle>
        );
      };
      const { container } = render(<Prevented />);
      fireEvent.click(button());
      expect(button()).toHaveAttribute('aria-pressed', 'true');
      expect(dots(container)).toHaveLength(0);
      fireEvent.click(button());
      expect(button()).toHaveAttribute('aria-pressed', 'false');
      expect(squash()).toBeUndefined();
    });

    it('소비자가 상태를 바꾸면 그 렌더에서 점 8개가 터진다', () => {
      const { container } = render(<Controlled />);
      expect(dots(container)).toHaveLength(0);
      fireEvent.click(button());
      expect(dots(container)).toHaveLength(8);
    });

    it('표지는 한 번 쓰고 지운다: 터진 뒤 바깥에서 껐다 켜도 터지지 않는다', () => {
      const { container, rerender } = render(
        <BurstToggle
          aria-label="좋아요"
          selected={false}
          selectedIcon={<On />}
          onClick={() => {}}
        >
          <Off />
        </BurstToggle>
      );
      // 클릭 뒤 소비자가 켠다(비동기 소비자와 같은 순서: click이 먼저, 켜짐은 나중)
      fireEvent.click(button());
      rerender(
        <BurstToggle aria-label="좋아요" selected selectedIcon={<On />}>
          <Off />
        </BurstToggle>
      );
      expect(dots(container)).toHaveLength(8);
      act(() => {
        ringOf(container).__burstDots?.progress(1);
      });
      rerender(
        <BurstToggle aria-label="좋아요" selected={false} selectedIcon={<On />}>
          <Off />
        </BurstToggle>
      );
      rerender(
        <BurstToggle aria-label="좋아요" selected selectedIcon={<On />}>
          <Off />
        </BurstToggle>
      );
      expect(dots(container)).toHaveLength(0);
    });

    it('점은 settle로 바깥으로 퍼지고 linear로 작아지다 뒤늦게 사라진다(slower)', () => {
      const { container } = render(<Controlled />);
      fireEvent.click(button());
      const [spread, shrink, fade] =
        ringOf(container).__burstDots?.getChildren(false) ?? [];
      expect(spread.vars.ease).toBe(gsapEasing.settle);
      expect(spread.duration()).toBe(gsapDuration.slower);
      expect(shrink.vars.scale).toBeLessThan(1);
      expect(shrink.vars.scale).toBeGreaterThanOrEqual(0.5);
      expect(shrink.vars.ease).toBe(gsapEasing.linear);
      expect(shrink.duration()).toBe(gsapDuration.slower);
      expect(fade.vars.opacity).toBe(0);
      expect(fade.vars.ease).toBe(gsapEasing.linear);
      // 사라짐은 처음부터 돌지 않고 끝은 터짐과 같이 맞는다
      expect(fade.startTime()).toBeGreaterThan(0);
      expect(fade.endTime()).toBeCloseTo(gsapDuration.slower, 5);
    });

    it('언마운트하면 돌던 터짐 트윈을 죽인다', () => {
      const { container, unmount } = render(<Controlled />);
      fireEvent.click(button());
      const timeline = ringOf(container).__burstDots as Handle;
      expect(timeline.parent).toBeTruthy();
      unmount();
      expect(timeline.parent).toBeFalsy();
    });
  });

  describe('아이콘 움직임', () => {
    it('켤 때 납작해졌다가(fast·settle) 1.2배를 넘겨 커지고 spring으로 1에 앉는다', () => {
      render(<Controlled />);
      fireEvent.click(button());
      const [flat, pop, rest] = squash()?.getChildren(false) ?? [];
      expect(flat.vars.scaleY).toBeCloseTo(0.7, 1);
      expect(flat.vars.scaleX).toBeCloseTo(1.15, 1);
      expect(flat.vars.ease).toBe(gsapEasing.settle);
      expect(flat.duration()).toBe(gsapDuration.fast);
      expect(pop.vars.scale).toBeGreaterThan(1.2);
      expect(rest.vars.scale).toBe(1);
      expect(rest.vars.ease).toBe(gsapEasing.spring);
    });

    it('끌 때는 작은 누름만 있고 납작·튕김이 없다', () => {
      render(<Controlled />);
      fireEvent.click(button());
      const onTimeline = squash() as Handle;
      fireEvent.click(button());
      // 켜는 중 끄면 켜기 타임라인은 죽고 새 타임라인이 선다
      expect(onTimeline.parent).toBeFalsy();
      expect(squash()).not.toBe(onTimeline);
      const steps = squash()?.getChildren(false) ?? [];
      expect(steps).toHaveLength(2);
      for (const step of steps) {
        expect(step.vars.scaleY).toBeUndefined();
        expect(step.vars.scale ?? 1).toBeLessThanOrEqual(1);
        expect(step.vars.ease).not.toBe(gsapEasing.spring);
      }
    });

    it('언마운트하면 돌던 아이콘 트윈을 죽인다', () => {
      const { unmount } = render(<Controlled />);
      fireEvent.click(button());
      const timeline = squash() as Handle;
      expect(timeline.parent).toBeTruthy();
      unmount();
      expect(timeline.parent).toBeFalsy();
    });
  });

  describe('움직임 줄이기', () => {
    it('click 뒤 아이콘만 바뀌고 점도 납작 트윈도 없다', () => {
      stubReducedMotion();
      const { container } = render(<Controlled />);
      fireEvent.click(button());
      expect(screen.getByTestId('on')).toBeInTheDocument();
      expect(button()).toHaveAttribute('aria-pressed', 'true');
      expect(dots(container)).toHaveLength(0);
      // 게이트가 끝 상태로 확정하고 죽인다. 살아 있는 트윈이 없고 납작한 배율이 남지 않는다
      expect(squash()?.parent).toBeFalsy();
      expect(slotOf().style.transform).not.toMatch(/0\.7|1\.15|1\.3/);
    });
  });
});
