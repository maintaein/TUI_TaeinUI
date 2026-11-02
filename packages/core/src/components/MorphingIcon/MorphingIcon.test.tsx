import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { MorphingIcon } from './MorphingIcon';
import { IconButton } from '../IconButton';
import { MORPH_PAIRS, pointsAttr, type MorphingPair } from './morphPairs';
import { gsapEasing } from '../../tokens/gsapEasing';

/**
 * 컴포넌트가 만든 GSAP 트윈을 멈추고 시각을 직접 옮겨 DOM 값을 읽는다. 시험은 gsap을 직접 import하지 않으므로
 * (게이트 검사가 시험 파일도 훑는다) 진짜 gsap.to를 그대로 부르고 돌려받은 트윈만 기록한다(통과형 관측).
 */
interface Seekable {
  pause(): unknown;
  time(seconds?: number): unknown;
  progress(value: number): unknown;
  duration(): number;
  parent: unknown;
  vars: Record<string, unknown>;
}
const played = vi.hoisted(() => ({ animations: [] as unknown[] }));
vi.mock('gsap', async (importActual) => {
  const actual = (await importActual()) as {
    gsap: { to: (...args: unknown[]) => unknown };
  };
  const to = actual.gsap.to.bind(actual.gsap);
  actual.gsap.to = (...args: unknown[]) => {
    const tween = to(...args);
    played.animations.push(tween);
    return tween;
  };
  return actual;
});
const lastPlayed = () => {
  const animation = played.animations.at(-1) as Seekable | undefined;
  if (!animation) throw new Error('재생된 애니메이션이 없습니다');
  return animation;
};
/** 시계를 세우고 마지막 트윈을 시각 t(초)로 옮긴다 */
const seek = (t: number) => {
  const tween = lastPlayed();
  tween.pause();
  act(() => {
    tween.time(t);
  });
};

afterEach(() => {
  vi.unstubAllGlobals();
  played.animations.length = 0;
});

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

const pairs = Object.keys(MORPH_PAIRS) as MorphingPair[];
const polylines = (root: ParentNode) =>
  Array.from(root.querySelectorAll('polyline'));
/** 정의를 DOM에 그려지는 속성 문자열로 바꿔 비교한다 */
const expected = (pair: MorphingPair, active: boolean) =>
  MORPH_PAIRS[pair][active ? 1 : 0].map((l) => ({
    points: pointsAttr(l.points),
    opacity: `${l.opacity}`,
  }));
const drawn = (root: ParentNode) =>
  polylines(root).map((p) => ({
    points: p.getAttribute('points'),
    opacity: p.getAttribute('opacity'),
  }));
const numbers = (root: ParentNode) =>
  polylines(root).flatMap((p) => [
    ...(p.getAttribute('points') ?? '').split(/[ ,]/).map(Number),
    Number(p.getAttribute('opacity')),
  ]);

describe('MorphingIcon', () => {
  describe('첫 렌더(SSR 포함)', () => {
    it.each(pairs)('%s: active대로 정의 좌표를 그대로 그린 SVG다', (pair) => {
      for (const active of [false, true]) {
        const host = document.createElement('div');
        host.innerHTML = renderToString(
          <MorphingIcon pair={pair} active={active} />
        );
        expect(drawn(host)).toEqual(expected(pair, active));
      }
    });

    it('viewBox 24, 선 굵기 2, 둥근 선끝, 채움 없음, currentColor', () => {
      const host = document.createElement('div');
      host.innerHTML = renderToString(
        <MorphingIcon pair="menu-close" active={false} />
      );
      const svg = host.querySelector('svg')!;
      expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
      expect(svg.getAttribute('stroke')).toBe('currentColor');
      expect(svg.getAttribute('stroke-width')).toBe('2');
      expect(svg.getAttribute('stroke-linecap')).toBe('round');
      expect(svg.getAttribute('fill')).toBe('none');
    });

    it('마운트만으로는 트윈을 만들지 않는다', () => {
      render(<MorphingIcon pair="plus-check" active />);
      expect(played.animations).toHaveLength(0);
    });
  });

  describe('접근성', () => {
    it('SVG는 aria-hidden이고 포커스를 받지 않는다', () => {
      const { container } = render(
        <MorphingIcon pair="menu-close" active={false} />
      );
      const svg = container.querySelector('svg')!;
      expect(svg).toHaveAttribute('aria-hidden', 'true');
      expect(svg).toHaveAttribute('focusable', 'false');
      expect(svg).not.toHaveAttribute('tabindex');
    });

    it('className과 ref가 SVG에 닿는다', () => {
      const ref = createRef<SVGSVGElement>();
      const { container } = render(
        <MorphingIcon
          ref={ref}
          className="mine"
          pair="menu-close"
          active={false}
        />
      );
      const svg = container.querySelector('svg')!;
      expect(ref.current).toBe(svg);
      expect(svg).toHaveClass('mine');
    });
  });

  describe('움직임', () => {
    it('active가 바뀌면 300ms, settle 이징으로 옮긴다', () => {
      const { rerender } = render(
        <MorphingIcon pair="menu-close" active={false} />
      );
      rerender(<MorphingIcon pair="menu-close" active />);
      const tween = lastPlayed();
      expect(tween.duration()).toBeCloseTo(0.3, 5);
      expect(tween.vars.ease).toBe('power3.out');
      expect(tween.vars.ease).toBe(gsapEasing.settle);
    });

    it.each(pairs)('%s: 끝까지 옮기면 앞뒤 모두 정의와 정확히 같다', (pair) => {
      const { container, rerender } = render(
        <MorphingIcon pair={pair} active={false} />
      );
      rerender(<MorphingIcon pair={pair} active />);
      act(() => {
        lastPlayed().progress(1);
      });
      expect(drawn(container)).toEqual(expected(pair, true));
      rerender(<MorphingIcon pair={pair} active={false} />);
      act(() => {
        lastPlayed().progress(1);
      });
      expect(drawn(container)).toEqual(expected(pair, false));
    });

    it('도중에는 앞뒤 사이의 좌표이고 사라지는 선은 opacity도 같이 줄어든다', () => {
      const { container, rerender } = render(
        <MorphingIcon pair="menu-close" active={false} />
      );
      rerender(<MorphingIcon pair="menu-close" active />);
      seek(0.1);
      const [, middle] = polylines(container);
      const opacity = Number(middle.getAttribute('opacity'));
      expect(opacity).toBeGreaterThan(0);
      expect(opacity).toBeLessThan(1);
      const [x0, , x1] = (middle.getAttribute('points') ?? '')
        .split(/[ ,]/)
        .map(Number);
      expect(x0).toBeGreaterThan(4);
      expect(x0).toBeLessThan(12);
      expect(x1).toBeGreaterThan(12);
      expect(x1).toBeLessThan(20);
    });

    it('도중에 active가 바뀌면 지금 좌표에서 새 목표로 간다', () => {
      const { container, rerender } = render(
        <MorphingIcon pair="play-pause" active={false} />
      );
      rerender(<MorphingIcon pair="play-pause" active />);
      seek(0.1);
      const middle = drawn(container);
      expect(middle).not.toEqual(expected('play-pause', false));
      expect(middle).not.toEqual(expected('play-pause', true));
      const middleNumbers = numbers(container);

      rerender(<MorphingIcon pair="play-pause" active={false} />);
      // 새 트윈을 만들었어도 그 순간 좌표는 그대로다(앞이나 뒤 끝으로 튀지 않는다)
      expect(drawn(container)).toEqual(middle);
      seek(0.001);
      numbers(container).forEach((v, i) =>
        expect(v).toBeCloseTo(middleNumbers[i], 0)
      );
      act(() => {
        lastPlayed().progress(1);
      });
      expect(drawn(container)).toEqual(expected('play-pause', false));
    });

    it('짝을 바꾸면 새 짝으로 다시 그린다', () => {
      const { container, rerender } = render(
        <MorphingIcon pair="menu-close" active={false} />
      );
      rerender(<MorphingIcon pair="plus-check" active />);
      expect(drawn(container)).toEqual(expected('plus-check', true));
    });

    it('언마운트하면 돌던 트윈이 타임라인에서 빠진다', () => {
      const { rerender, unmount } = render(
        <MorphingIcon pair="menu-close" active={false} />
      );
      rerender(<MorphingIcon pair="menu-close" active />);
      const tween = lastPlayed();
      expect(tween.parent).not.toBeNull();
      unmount();
      expect(tween.parent).toBeNull();
    });
  });

  describe('축소 모션', () => {
    it('기다림 없이 바로 끝 모양이 된다', () => {
      stubReducedMotion();
      const { container, rerender } = render(
        <MorphingIcon pair="search-close" active={false} />
      );
      rerender(<MorphingIcon pair="search-close" active />);
      expect(drawn(container)).toEqual(expected('search-close', true));
      rerender(<MorphingIcon pair="search-close" active={false} />);
      expect(drawn(container)).toEqual(expected('search-close', false));
    });
  });

  describe('IconButton 안', () => {
    it('그대로 넣으면 단추의 aria-pressed가 상태를 전하고 아이콘은 가려진다', () => {
      const { getByRole, container, rerender } = render(
        <IconButton aria-label="메뉴 열기" aria-pressed={false}>
          <MorphingIcon pair="menu-close" active={false} />
        </IconButton>
      );
      expect(getByRole('button', { name: '메뉴 열기' })).toHaveAttribute(
        'aria-pressed',
        'false'
      );
      expect(container.querySelector('button svg')).toHaveAttribute(
        'aria-hidden',
        'true'
      );
      rerender(
        <IconButton aria-label="메뉴 닫기" aria-pressed>
          <MorphingIcon pair="menu-close" active />
        </IconButton>
      );
      expect(getByRole('button', { name: '메뉴 닫기' })).toHaveAttribute(
        'aria-pressed',
        'true'
      );
    });
  });
});
