import { createRef } from 'react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SloshGauge } from './SloshGauge';
import { MAX_AMP } from './sloshMath';
import { loop } from '../../tokens/animation.css';

// SloshGauge.tsx가 물 svg에 얹는 손잡이(BurstToggle의 타임라인 손잡이와 같은 모양).
type Slosh = {
  level: number;
  amp: number;
  phi: number;
  flow: number;
  tl: gsap.core.Timeline | null;
};
type WaterHost = SVGElement & { __slosh?: Slosh };

const LOOP_S = Number.parseFloat(loop.base) / 1000;

const meter = () => screen.getByRole('meter');
const waterOf = (container: HTMLElement) =>
  container.querySelector('[data-slosh-water]') as WaterHost;
const slosh = (container: HTMLElement) => waterOf(container).__slosh as Slosh;
const surfaceYs = (container: HTMLElement) => {
  const d = waterOf(container).querySelector('path')?.getAttribute('d') ?? '';
  const ys = [...d.matchAll(/[ML]([\d.-]+) ([\d.-]+)/g)].map((m) =>
    Number(m[2])
  );
  return ys.slice(0, ys.length - 2); // 마지막 둘은 바닥 모서리
};
const isFlat = (container: HTMLElement) =>
  new Set(surfaceYs(container)).size === 1;

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

afterEach(() => {
  vi.unstubAllGlobals();
});

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

    it('값이 바뀌면 aria-valuenow는 애니메이션을 기다리지 않고 바로 새 값이다', () => {
      const { rerender } = render(<SloshGauge value={20} label="a" />);
      rerender(<SloshGauge value={90} label="a" />);
      expect(meter()).toHaveAttribute('aria-valuenow', '90');
    });

    it('통과 물은 aria-hidden이고 ref와 className은 루트로 간다', () => {
      const ref = createRef<HTMLDivElement>();
      const { container } = render(
        <SloshGauge ref={ref} className="mine" value={50} label="a" />
      );
      expect(ref.current).toBe(meter());
      expect(meter()).toHaveClass('mine');
      expect(waterOf(container).closest('[aria-hidden="true"]')).not.toBeNull();
    });
  });

  describe('출렁임', () => {
    it('처음 그릴 때는 출렁이지 않고 평평하다(자동 반복 없음)', () => {
      const { container } = render(<SloshGauge value={60} label="a" />);
      expect(slosh(container).tl).toBeNull();
      expect(slosh(container).amp).toBe(0);
      expect(isFlat(container)).toBe(true);
    });

    it('값이 바뀌면 수면이 출렁이고 첫 쏠림은 오르면 왼쪽이, 내리면 오른쪽이 높다', () => {
      const { container, rerender } = render(
        <SloshGauge value={20} label="a" />
      );
      rerender(<SloshGauge value={90} label="a" />);
      slosh(container).tl?.time(0);
      expect(slosh(container).amp).toBeCloseTo(MAX_AMP);
      const up = surfaceYs(container);
      expect(up[0]).toBeLessThan(up[up.length - 1]);
      slosh(container).tl?.progress(1);
      rerender(<SloshGauge value={0} label="a" />);
      slosh(container).tl?.time(0);
      const down = surfaceYs(container);
      expect(down[0]).toBeGreaterThan(down[down.length - 1]);
    });

    it('수위는 새 값으로 가고, 값이 같거나 잘려서 같으면 새 출렁임이 없다', () => {
      const { container, rerender } = render(
        <SloshGauge value={20} label="a" />
      );
      rerender(<SloshGauge value={90} label="a" />);
      const first = slosh(container).tl;
      first?.progress(1);
      expect(slosh(container).level).toBeCloseTo(0.9);
      rerender(<SloshGauge value={90} label="a" valueText="x" />);
      expect(slosh(container).tl).toBe(first);
      rerender(<SloshGauge value={150} label="a" />);
      const clipped = slosh(container).tl;
      rerender(<SloshGauge value={999} label="a" />);
      expect(slosh(container).tl).toBe(clipped);
    });

    it('진행 중 값을 바꿔도 수위가 튀지 않는다(직전 수위에서 이어진다)', () => {
      const { container, rerender } = render(
        <SloshGauge value={20} label="a" />
      );
      rerender(<SloshGauge value={90} label="a" />);
      slosh(container).tl?.time(0.2);
      const before = slosh(container).level;
      expect(before).toBeGreaterThan(0.2);
      expect(before).toBeLessThan(0.9);
      rerender(<SloshGauge value={30} label="a" />);
      expect(slosh(container).level).toBeCloseTo(before, 6);
      slosh(container).tl?.progress(1);
      expect(slosh(container).level).toBeCloseTo(0.3);
    });

    it('마지막 변경 뒤 loop.base 안에 잔잔해진다(남는 반복·트윈이 없다)', () => {
      const { container, rerender } = render(
        <SloshGauge value={20} label="a" />
      );
      rerender(<SloshGauge value={90} label="a" />);
      const tl = slosh(container).tl as gsap.core.Timeline;
      expect(tl.repeat()).toBe(0);
      expect(tl.totalDuration()).toBeLessThanOrEqual(LOOP_S);
      tl.time(LOOP_S);
      expect(slosh(container).amp).toBe(0);
      expect(isFlat(container)).toBe(true);
      expect(tl.progress()).toBe(1);
    });

    it('100ms마다 값을 열 번 바꿔도 진폭이 상한을 넘지 않고 마지막 변경에서 다시 loop.base 안에 끝난다', () => {
      const { container, rerender } = render(
        <SloshGauge value={0} label="a" />
      );
      let peak = 0;
      for (let i = 1; i <= 10; i += 1) {
        slosh(container).tl?.time(0.1);
        rerender(<SloshGauge value={i % 2 === 0 ? 0 : 100} label="a" />);
        peak = Math.max(peak, slosh(container).amp);
        expect(slosh(container).amp).toBeLessThanOrEqual(MAX_AMP + 1e-9);
      }
      expect(peak).toBeCloseTo(MAX_AMP);
      const tl = slosh(container).tl as gsap.core.Timeline;
      expect(tl.totalDuration()).toBeLessThanOrEqual(LOOP_S);
      tl.time(LOOP_S);
      expect(slosh(container).amp).toBe(0);
      expect(isFlat(container)).toBe(true);
    });

    it('언마운트하면 트윈이 죽는다', () => {
      const { container, rerender, unmount } = render(
        <SloshGauge value={20} label="a" />
      );
      rerender(<SloshGauge value={90} label="a" />);
      const s = slosh(container);
      expect(s.tl?.parent).toBeTruthy();
      unmount();
      expect(s.tl?.parent).toBeFalsy();
    });
  });

  describe('움직임 줄이기', () => {
    it('출렁임 없이 수위만 바로 바뀐다(진폭 0, 수면 평평, 트윈 없음)', () => {
      stubReducedMotion();
      const { container, rerender } = render(
        <SloshGauge value={20} label="a" />
      );
      rerender(<SloshGauge value={90} label="a" />);
      const s = slosh(container);
      expect(s.amp).toBe(0);
      expect(s.level).toBeCloseTo(0.9);
      expect(isFlat(container)).toBe(true);
      expect(s.tl?.progress()).toBe(1);
      expect(s.tl?.parent).toBeFalsy();
      expect(meter()).toHaveAttribute('aria-valuenow', '90');
    });
  });
});
