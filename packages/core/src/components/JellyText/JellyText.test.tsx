import { createRef } from 'react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { act, isInaccessible, render, screen } from '@testing-library/react';
import { gsapDuration } from '../../tokens/gsapEasing';
import { JellyText } from './JellyText';

const FINE = '(hover: hover) and (pointer: fine)';
const REDUCE = '(prefers-reduced-motion: reduce)';

// 질의마다 change 리스너가 실제로 불리는 matchMedia 보급품(useReducedMotion 시험과 같은 방식)
class FakeQuery extends EventTarget {
  constructor(
    readonly media: string,
    public matches: boolean
  ) {
    super();
  }
  set(next: boolean) {
    this.matches = next;
    this.dispatchEvent(new Event('change'));
  }
}
const installMedia = ({ fine = true, reduced = false } = {}) => {
  const queries: Record<string, FakeQuery> = {
    [FINE]: new FakeQuery(FINE, fine),
    [REDUCE]: new FakeQuery(REDUCE, reduced),
  };
  vi.stubGlobal('matchMedia', (q: string) => queries[q]);
  return { fine: queries[FINE], reduced: queries[REDUCE] };
};

type Jelly = HTMLElement & { __jellyTimeline?: gsap.core.Timeline };

const cells = (container: HTMLElement) => [
  ...container.querySelectorAll<Jelly>('[data-jelly-cell]'),
];

// jsdom은 레이아웃이 없다. 글자 칸을 폭 20, 높이 20으로 한 줄에 나란히 놓은 것으로 만든다(칸 i의 가운데 x는 20i+10)
const layOut = (container: HTMLElement) => {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue(
    new DOMRect(0, 0, 400, 20)
  );
  // offsetLeft를 읽은 횟수. 레이아웃을 다시 읽었는지 세는 데 쓴다
  const reads = { left: 0 };
  cells(container).forEach((c, i) => {
    Object.defineProperties(c, {
      offsetLeft: {
        get: () => {
          reads.left += 1;
          return i * 20;
        },
        configurable: true,
      },
      offsetTop: { value: 0, configurable: true },
      offsetWidth: { value: 20, configurable: true },
      offsetHeight: { value: 20, configurable: true },
    });
  });
  return reads;
};

// jsdom에는 PointerEvent가 없다. React는 이름이 맞으면 받으므로 MouseEvent를 쏜다.
// 합성 이벤트(isTrusted false)라 데모 무대 대본과 같은 길이다.
const fire = (el: Element, type: string, clientX = 0, clientY = 10) =>
  act(() => {
    el.dispatchEvent(new MouseEvent(type, { bubbles: true, clientX, clientY }));
  });
const enter = (el: Element) => fire(el, 'pointerover');
const move = (el: Element, x: number, y = 10) => fire(el, 'pointermove', x, y);

const setup = (text = '말랑한 글자 hi') => {
  const utils = render(<JellyText text={text} />);
  const root = utils.container.firstElementChild as HTMLElement;
  const reads = layOut(utils.container);
  return { ...utils, root, reads };
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('JellyText', () => {
  describe('구조와 접근성', () => {
    it('완성 문장이 접근성 트리에 한 번 있고 시각 묶음과 글자 칸은 가려져 있다', () => {
      const { container } = render(<JellyText text="말랑한 글자" as="p" />);
      expect(screen.getByText('말랑한 글자')).toBeInTheDocument();

      const visual = container.querySelector('[data-jelly-visual]');
      expect(visual).toHaveAttribute('aria-hidden', 'true');
      expect(cells(container)).toHaveLength(5);
      for (const c of cells(container)) expect(isInaccessible(c)).toBe(true);
    });

    it('기본 요소는 p이고 as로 바꾼다', () => {
      const { container, rerender } = render(<JellyText text="안녕" />);
      expect(container.firstElementChild?.tagName).toBe('P');
      rerender(<JellyText text="안녕" as="h2" />);
      expect(
        screen.getByRole('heading', { level: 2, name: '안녕' })
      ).toBeTruthy();
    });

    it('className과 ref가 루트 요소로 간다', () => {
      const ref = createRef<HTMLElement>();
      const { container } = render(
        <JellyText text="안녕" className="custom" ref={ref} />
      );
      expect(container.firstElementChild).toHaveClass('custom');
      expect(ref.current).toBe(container.firstElementChild);
    });

    it('공백으로 나뉜 낱말마다 묶음이 하나씩이고 공백은 묶음 사이에 그대로 있다', () => {
      const { container } = render(<JellyText text="안녕 하세요  hello" />);
      const words = [...container.querySelectorAll('[data-jelly-word]')];
      expect(words.map((w) => w.textContent)).toEqual([
        '안녕',
        '하세요',
        'hello',
      ]);
      const visual = container.querySelector('[data-jelly-visual]');
      expect(visual?.childNodes[1].textContent).toBe(' ');
      expect(visual?.childNodes[3].textContent).toBe('  ');
    });
  });

  describe('포인터 게이트', () => {
    it('호버 정밀 포인터가 아니면(터치) 지나가도 글자 칸에 transform도 타임라인도 없다', () => {
      installMedia({ fine: false });
      const { root, container } = setup();
      enter(root);
      move(root, 50);
      for (const c of cells(container)) {
        expect(c.__jellyTimeline).toBeUndefined();
        expect(c.style.transform).toBe('');
      }
    });

    it('matchMedia가 없는 환경에서도 평범한 글자다', () => {
      const { root, container } = setup();
      enter(root);
      move(root, 50);
      for (const c of cells(container))
        expect(c.__jellyTimeline).toBeUndefined();
    });

    it('축소 모션이면 지나가도 글자 칸에 transform도 타임라인도 없다', () => {
      installMedia({ reduced: true });
      const { root, container } = setup();
      enter(root);
      move(root, 50);
      for (const c of cells(container)) {
        expect(c.__jellyTimeline).toBeUndefined();
        expect(c.style.transform).toBe('');
      }
    });

    it('마우스이면 가장 가까운 글자와 양옆에만 타임라인이 걸린다', () => {
      installMedia();
      const { root, container } = setup();
      enter(root);
      move(root, 50); // 칸 2의 가운데
      const hit = cells(container).map((c) => c.__jellyTimeline !== undefined);
      expect(hit.slice(0, 6)).toEqual([false, true, true, true, false, false]);
    });

    it('포인터 매체 질의가 바뀌면 따라가고, 꺼질 때 걸려 있던 값을 걷는다', () => {
      const media = installMedia();
      const { root, container } = setup();
      enter(root);
      move(root, 50);
      const running = cells(container)[2];
      const tl = running.__jellyTimeline!;
      tl.seek(gsapDuration.fast);
      expect(running.style.transform).not.toBe('');

      act(() => media.fine.set(false));
      expect(running.style.transform).toBe('');
      expect(running.__jellyTimeline).toBeUndefined();
      expect(tl.parent).toBeNull();

      move(root, 50);
      expect(
        cells(container).every((c) => c.__jellyTimeline === undefined)
      ).toBe(true);

      act(() => media.fine.set(true));
      move(root, 50);
      expect(cells(container)[2].__jellyTimeline).toBeDefined();
    });

    it('움직임 줄이기가 켜지면 걸려 있던 값을 걷는다', () => {
      const media = installMedia();
      const { root, container } = setup();
      enter(root);
      move(root, 50);
      const c = cells(container)[2];
      c.__jellyTimeline!.seek(gsapDuration.fast);
      expect(c.style.transform).not.toBe('');

      act(() => media.reduced.set(true));
      expect(c.style.transform).toBe('');
      expect(c.__jellyTimeline).toBeUndefined();
    });
  });

  describe('퍼짐', () => {
    const spreadOf = (c: Jelly) => {
      const [spread] = c.__jellyTimeline!.getChildren(false);
      return spread.vars as {
        scaleX: number;
        scaleY: number;
        transformOrigin: string;
      };
    };

    it('가까운 글자가 먼 글자보다 크게 퍼지고 부피를 지킨다', () => {
      installMedia();
      const { root, container } = setup();
      enter(root);
      move(root, 50);
      const [, one, two, three] = cells(container);
      expect(spreadOf(two).scaleX).toBeGreaterThan(spreadOf(one).scaleX);
      expect(spreadOf(two).scaleX).toBeGreaterThan(spreadOf(three).scaleX);
      for (const c of [one, two, three]) {
        const { scaleX, scaleY } = spreadOf(c);
        expect(scaleX).toBeGreaterThan(1);
        expect(scaleX * scaleY).toBeCloseTo(1, 10);
      }
    });

    it('글자 칸 아래 가운데를 기준으로 퍼진다', () => {
      installMedia();
      const { root, container } = setup();
      enter(root);
      move(root, 50);
      expect(spreadOf(cells(container)[2]).transformOrigin).toBe('50% 100%');
    });

    it('퍼진 뒤 1로 돌아오는 스프링이 이어진다', () => {
      installMedia();
      const { root, container } = setup();
      enter(root);
      move(root, 50);
      const steps = cells(container)[2].__jellyTimeline!.getChildren(false);
      expect(steps).toHaveLength(2);
      expect(steps[1].vars).toMatchObject({ scaleX: 1, scaleY: 1 });
    });

    it('다른 줄에 있는 글자는 같은 x여도 반응하지 않는다', () => {
      installMedia();
      const { root, container } = setup();
      enter(root);
      move(root, 50, 80);
      for (const c of cells(container))
        expect(c.__jellyTimeline).toBeUndefined();
    });

    it('진행 중인 글자 위로 다시 오면 옛 타임라인을 죽이고 새로 시작한다', () => {
      installMedia();
      const { root, container } = setup();
      enter(root);
      move(root, 50);
      const first = cells(container)[2].__jellyTimeline!;
      first.seek(gsapDuration.fast + 0.1);

      move(root, 52);
      const second = cells(container)[2].__jellyTimeline!;
      expect(second).not.toBe(first);
      expect(first.parent).toBeNull();
    });

    it('pointermove마다 레이아웃을 다시 읽지 않고 들어올 때 한 번 잰다', () => {
      installMedia();
      const { root, reads } = setup();
      enter(root);
      const afterEnter = reads.left;
      expect(afterEnter).toBeGreaterThan(0);
      for (let x = 10; x < 200; x += 10) move(root, x);
      expect(reads.left).toBe(afterEnter);
    });
  });

  describe('정리', () => {
    it('언마운트하면 타임라인을 죽여 떼어진 글자에 값을 더 쓰지 않는다', () => {
      installMedia();
      const { root, container, unmount } = setup();
      enter(root);
      move(root, 50);
      const tl = cells(container)[2].__jellyTimeline!;
      unmount();
      expect(tl.parent).toBeNull();
    });
  });
});
