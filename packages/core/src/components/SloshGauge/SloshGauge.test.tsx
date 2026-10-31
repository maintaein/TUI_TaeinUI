import { createRef, StrictMode } from 'react';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { SloshGauge } from './SloshGauge';

// 손으로 돌리는 rAF 대기열. 예약된 콜백만 쌓고 frame()이 한 번 비우며 16ms를 흘린다
let queue = new Map<number, (now: number) => void>();
let next = 1;
let clock = 0;
const frame = (count = 1) => {
  for (let i = 0; i < count; i += 1) {
    const callbacks = [...queue.values()];
    queue.clear();
    clock += 16;
    act(() => callbacks.forEach((callback) => callback(clock)));
  }
};
const pending = () => queue.size;

beforeEach(() => {
  queue = new Map();
  next = 1;
  clock = performance.now();
  vi.stubGlobal('requestAnimationFrame', (callback: (now: number) => void) => {
    queue.set(next, callback);
    return next++;
  });
  vi.stubGlobal('cancelAnimationFrame', (handle: number) => {
    queue.delete(handle);
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  Object.defineProperty(document, 'hidden', {
    value: false,
    configurable: true,
  });
});

const meter = () => screen.getByRole('meter');
const waterOf = (container: HTMLElement) =>
  container.querySelector('[data-slosh-water]') as SVGElement;
const attr = (container: HTMLElement, selector: string, name: string) =>
  waterOf(container).querySelector(selector)?.getAttribute(name) ?? '';
// 수면 테두리(rim)는 그릇 안 클립 그룹의 세 번째 path다. 클래스가 해시라 위치로 고른다
const rimD = (container: HTMLElement) =>
  waterOf(container)
    .querySelectorAll('g[clip-path] > path')[2]
    .getAttribute('d') ?? '';
const frontD = (container: HTMLElement) =>
  waterOf(container)
    .querySelectorAll('g[clip-path] > path')[1]
    .getAttribute('d') ?? '';
const bowlTransform = (container: HTMLElement) =>
  attr(container, 'g[transform]', 'transform');
// 곡선의 꼭짓점 y만 뽑는다: M x y 다음 C마다 숫자 여섯(조절점 둘과 꼭짓점)
const rimYs = (container: HTMLElement) => {
  const nums = (rimD(container).match(/-?[\d.]+/g) ?? []).map(Number);
  const ys = [nums[1]];
  for (let k = 2; k + 5 < nums.length; k += 6) ys.push(nums[k + 5]);
  return ys;
};

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

describe('SloshGauge', () => {
  describe('의미와 접근성', () => {
    it('role=meter이고 이름은 label, 값은 aria-valuenow·min·max·valuetext로 나간다', () => {
      render(<SloshGauge value={60} label="저장 공간" />);
      expect(screen.getByRole('meter', { name: '저장 공간' })).toBe(meter());
      expect(meter()).toHaveAttribute('aria-valuenow', '60');
      expect(meter()).toHaveAttribute('aria-valuemin', '0');
      expect(meter()).toHaveAttribute('aria-valuemax', '100');
      expect(meter()).toHaveAttribute('aria-valuetext', '60%');
    });

    it('valueText가 있으면 보이는 값 글과 aria-valuetext가 그것이다', () => {
      render(
        <SloshGauge value={60} label="저장 공간" valueText="6GB / 10GB" />
      );
      expect(meter()).toHaveAttribute('aria-valuetext', '6GB / 10GB');
      expect(screen.getByText('6GB / 10GB')).toBeVisible();
    });

    it('valueText가 없으면 백분율이고 min·max를 반영한다', () => {
      render(<SloshGauge value={5} min={0} max={20} label="할당량" />);
      expect(meter()).toHaveAttribute('aria-valuemax', '20');
      expect(meter()).toHaveAttribute('aria-valuetext', '25%');
      expect(screen.getByText('25%')).toBeInTheDocument();
    });

    it('범위 밖 값은 잘린다', () => {
      const { rerender } = render(<SloshGauge value={150} label="a" />);
      expect(meter()).toHaveAttribute('aria-valuenow', '100');
      expect(meter()).toHaveAttribute('aria-valuetext', '100%');
      rerender(<SloshGauge value={-5} label="a" />);
      expect(meter()).toHaveAttribute('aria-valuenow', '0');
      expect(meter()).toHaveAttribute('aria-valuetext', '0%');
    });

    it('값이 바뀌면 aria-valuenow는 물이 오르기를 기다리지 않고 바로 새 값이다', () => {
      const { rerender } = render(<SloshGauge value={20} label="a" />);
      rerender(<SloshGauge value={90} label="a" />);
      expect(meter()).toHaveAttribute('aria-valuenow', '90');
    });

    it('그릇과 물은 aria-hidden이고 ref와 className은 루트로 간다', () => {
      const ref = createRef<HTMLDivElement>();
      const { container } = render(
        <SloshGauge ref={ref} className="mine" value={50} label="a" />
      );
      expect(ref.current).toBe(meter());
      expect(meter()).toHaveClass('mine');
      expect(waterOf(container).closest('[aria-hidden="true"]')).not.toBeNull();
    });
  });

  describe('쉬는 동안의 잔물결과 출렁임', () => {
    // 되돌리면 빨개지는 것: 쉬는 잔물결(위상 진행)을 빼면 값이 그대로여도 그림이 같아져 빨개진다
    it('값이 그대로여도 프레임마다 다음 프레임을 예약하고 수면이 일렁인다', () => {
      const { container } = render(<SloshGauge value={60} label="a" />);
      expect(pending()).toBe(1);
      frame();
      const first = rimD(container);
      frame(10);
      expect(pending()).toBe(1);
      expect(rimD(container)).not.toBe(first);
      expect(bowlTransform(container)).toContain('rotate(0.000');
    });

    it('값이 크게 바뀌면 그릇이 살짝 기울고 시간이 지나면 다시 반듯하다', () => {
      const { container, rerender } = render(
        <SloshGauge value={20} label="a" />
      );
      frame(3);
      rerender(<SloshGauge value={90} label="a" />);
      frame(12);
      const angle = Number(
        /rotate\((-?[\d.]+)/.exec(bowlTransform(container))?.[1]
      );
      expect(Math.abs(angle)).toBeGreaterThan(0.3);
      expect(Math.abs(angle)).toBeLessThanOrEqual(1.25);
      frame(240);
      expect(
        Math.abs(
          Number(/rotate\((-?[\d.]+)/.exec(bowlTransform(container))?.[1])
        )
      ).toBeLessThan(0.02);
    });

    it('언마운트하면 예약된 프레임이 걷힌다', () => {
      const { unmount } = render(<SloshGauge value={60} label="a" />);
      expect(pending()).toBe(1);
      unmount();
      expect(pending()).toBe(0);
    });

    it('StrictMode의 이중 마운트에서도 예약이 하나다', () => {
      render(
        <StrictMode>
          <SloshGauge value={60} label="a" />
        </StrictMode>
      );
      expect(pending()).toBe(1);
    });
  });

  describe('paused', () => {
    // 되돌리면 빨개지는 것: shouldAnimate에서 paused를 빼거나 LuminousFlow 루프 대신 늘 예약하면 빨개진다
    it('paused면 정지 장면 한 장만 그리고 다음 프레임을 예약하지 않는다', () => {
      const { container } = render(<SloshGauge value={60} label="a" paused />);
      expect(pending()).toBe(1);
      frame();
      expect(pending()).toBe(0);
      const still = rimD(container);
      frame(5);
      expect(rimD(container)).toBe(still);
    });

    it('흐르다 paused가 되면 지금 모습에서 서고, 풀면 이어서 다시 일렁인다', () => {
      const { container, rerender } = render(
        <SloshGauge value={60} label="a" />
      );
      frame(8);
      rerender(<SloshGauge value={60} label="a" paused />);
      frame();
      const stopped = rimD(container);
      expect(pending()).toBe(0);
      frame(5);
      expect(rimD(container)).toBe(stopped);
      rerender(<SloshGauge value={60} label="a" />);
      expect(pending()).toBe(1);
      frame(10);
      expect(rimD(container)).not.toBe(stopped);
    });

    // 되돌리면 빨개지는 것: 멈춤 중에도 용수철을 적분하게 하면 새 값 그림과 달라져 빨개진다
    it('paused에서 값이 바뀌면 출렁임 없이 수위가 바로 새 값이 된다', () => {
      const { container, rerender } = render(
        <SloshGauge value={20} label="a" paused />
      );
      frame();
      rerender(<SloshGauge value={90} label="a" paused />);
      frame();
      const fresh = render(<SloshGauge value={90} label="a" paused />);
      expect(frontD(container)).toBe(frontD(fresh.container));
      expect(rimD(container)).toBe(rimD(fresh.container));
      expect(bowlTransform(container)).toBe(bowlTransform(fresh.container));
      expect(pending()).toBe(1);
      frame();
      expect(pending()).toBe(0);
    });
  });

  describe('움직임 줄이기', () => {
    it('이어 그리지 않고 수면이 평평하다', () => {
      stubReducedMotion();
      const { container } = render(<SloshGauge value={60} label="a" />);
      frame();
      expect(pending()).toBe(0);
      expect(new Set(rimYs(container)).size).toBe(1);
      expect(bowlTransform(container)).toContain('rotate(0.000');
    });

    // 되돌리면 빨개지는 것: 축소 모션에서도 용수철을 돌리면 값 변경 직후 그림이 새 값 그림과 달라져 빨개진다
    it('값이 바뀌면 수위만 바로 바뀌고 aria 값도 즉시 새 값이다', () => {
      stubReducedMotion();
      const { container, rerender } = render(
        <SloshGauge value={20} label="a" />
      );
      frame();
      rerender(<SloshGauge value={90} label="a" />);
      frame();
      expect(pending()).toBe(0);
      const fresh = render(<SloshGauge value={90} label="a" />);
      frame();
      expect(rimD(container)).toBe(rimD(fresh.container));
      expect(screen.getAllByRole('meter')[0]).toHaveAttribute(
        'aria-valuenow',
        '90'
      );
    });
  });

  describe('화면 밖과 탭 숨김', () => {
    let notify: ((entries: Array<{ isIntersecting: boolean }>) => void) | null =
      null;
    beforeEach(() => {
      class FakeObserver {
        constructor(
          callback: (entries: Array<{ isIntersecting: boolean }>) => void
        ) {
          notify = callback;
        }
        observe() {}
        disconnect() {}
      }
      vi.stubGlobal('IntersectionObserver', FakeObserver);
    });

    it('화면 밖으로 나가면 그리기를 멈추고 돌아오면 이어 간다', () => {
      render(<SloshGauge value={60} label="a" />);
      frame(3);
      expect(pending()).toBe(1);
      act(() => notify?.([{ isIntersecting: false }]));
      expect(pending()).toBe(0);
      act(() => notify?.([{ isIntersecting: true }]));
      expect(pending()).toBe(1);
    });

    it('탭이 숨겨지면 그리기를 멈추고 다시 보이면 이어 간다', () => {
      render(<SloshGauge value={60} label="a" />);
      frame(3);
      Object.defineProperty(document, 'hidden', {
        value: true,
        configurable: true,
      });
      act(() => {
        document.dispatchEvent(new Event('visibilitychange'));
      });
      expect(pending()).toBe(0);
      Object.defineProperty(document, 'hidden', {
        value: false,
        configurable: true,
      });
      act(() => {
        document.dispatchEvent(new Event('visibilitychange'));
      });
      expect(pending()).toBe(1);
    });

    it('화면 밖에서 값이 바뀌면 돌아왔을 때 이미 새 수위다(출렁임을 기다리지 않는다)', () => {
      const { container, rerender } = render(
        <SloshGauge value={20} label="a" />
      );
      frame(3);
      act(() => notify?.([{ isIntersecting: false }]));
      rerender(<SloshGauge value={90} label="a" />);
      act(() => notify?.([{ isIntersecting: true }]));
      frame();
      const fresh = render(<SloshGauge value={90} label="a" />);
      frame();
      // 수위만 같은지 본다: 기울기·잔물결은 시계가 달라 다르다
      const y = (c: HTMLElement) =>
        rimYs(c).reduce((a, b) => a + b, 0) / rimYs(c).length;
      expect(Math.abs(y(container) - y(fresh.container))).toBeLessThan(2.5);
    });
  });
});
