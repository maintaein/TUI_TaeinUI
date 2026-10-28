import { createRef, type FormEvent } from 'react';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  it,
  expect,
  vi,
} from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StampButton } from './StampButton';
import { gsapDuration, gsapEasing } from '../../tokens/gsapEasing';

// StampButton.tsx가 도장 노드에 얹는 손잡이(BurstToggle의 __burstDots와 같은 모양).
type StampHost = HTMLElement & { __stampTimeline?: gsap.core.Timeline };

const button = (name: string | RegExp = '제출') =>
  screen.getByRole('button', { name });
const markOf = (container: HTMLElement) =>
  container.querySelector('[data-stamp-mark]') as StampHost | null;
const faceOf = (container: HTMLElement) =>
  container.querySelector('[data-stamp-face]') as HTMLElement | null;
const inkOf = (container: HTMLElement) =>
  container.querySelector('[data-stamp-ink]') as SVGElement | null;
const circleOf = (container: HTMLElement) =>
  container.querySelector('[data-stamp-ink] mask circle') as SVGElement;
const inkRadiusOf = (container: HTMLElement) =>
  Number(circleOf(container).getAttribute('r'));
// 마스크 원이 viewBox(100x60) 모서리까지 닿는 반지름(가운데에서 모서리까지 약 58.3)
const COVERS_CORNERS = 58.3;

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

// jsdom에는 레이아웃이 없어 offsetParent가 늘 null이다. GSAP은 그런 요소의 transform을 읽을 때 요소를 잠깐
// 문서 루트로 옮겼다 되돌리는데, 단추를 품은 상자가 옮겨지면 jsdom이 포커스를 잃는다. 브라우저에서는 일어나지 않는 일이라
// 포커스 시험이 시간에 따라 흔들리지 않도록 레이아웃이 있는 것처럼 부모를 돌려준다.
const originalOffsetParent = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  'offsetParent'
);
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
    configurable: true,
    get() {
      return this.parentElement;
    },
  });
});
afterAll(() => {
  if (originalOffsetParent) {
    Object.defineProperty(
      HTMLElement.prototype,
      'offsetParent',
      originalOffsetParent
    );
  } else {
    Reflect.deleteProperty(HTMLElement.prototype, 'offsetParent');
  }
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('StampButton', () => {
  describe('의미와 접근성', () => {
    it('type=button이고 ref가 button으로 가며 네이티브 속성과 className이 간다', () => {
      const ref = createRef<HTMLButtonElement>();
      render(
        <StampButton ref={ref} data-x="1" className="mine">
          제출
        </StampButton>
      );
      expect(ref.current).toBe(button());
      expect(button()).toHaveAttribute('type', 'button');
      expect(button()).toHaveAttribute('data-x', '1');
      expect(button()).toHaveClass('mine');
    });

    it('찍기 전에는 도장이 없고 알림 영역은 비어 있다', () => {
      const { container } = render(<StampButton>제출</StampButton>);
      expect(markOf(container)).toBeNull();
      expect(screen.getByRole('status').textContent).toBe('');
      expect(button()).toHaveAttribute('aria-disabled', 'false');
    });

    it('찍은 뒤에도 접근 가능한 이름은 children이고 도장 그림은 aria-hidden이다', () => {
      const { container } = render(<StampButton>제출</StampButton>);
      fireEvent.click(button());
      expect(button()).toBeInTheDocument();
      expect(markOf(container)?.parentElement).toHaveAttribute(
        'aria-hidden',
        'true'
      );
    });

    it('찍으면 role=status가 stampLabel 도장을 찍었다고 알린다(기본 글자는 승인)', () => {
      render(<StampButton>제출</StampButton>);
      fireEvent.click(button());
      expect(screen.getByRole('status').textContent).toBe(
        '승인 도장을 찍었습니다'
      );
    });

    it('stampLabel을 바꾸면 도장 글자와 알림 문장이 따라간다', () => {
      const { container } = render(
        <StampButton stampLabel="반려">제출</StampButton>
      );
      fireEvent.click(button());
      expect(faceOf(container)?.textContent).toBe('반려');
      expect(screen.getByRole('status').textContent).toBe(
        '반려 도장을 찍었습니다'
      );
    });
  });

  describe('한 번만 찍힌다', () => {
    it('click 한 번에 onClick 1회, 도장이 보이고 aria-disabled이며 포커스가 남는다', async () => {
      const onClick = vi.fn();
      const user = userEvent.setup();
      const { container } = render(
        <StampButton onClick={onClick}>제출</StampButton>
      );
      await user.click(button());
      expect(onClick).toHaveBeenCalledTimes(1);
      expect(faceOf(container)).toBeInTheDocument();
      expect(button()).toHaveAttribute('aria-disabled', 'true');
      expect(button()).not.toBeDisabled();
      expect(button()).toHaveFocus();
    });

    it('찍힌 뒤 click, Enter, Space는 onClick을 부르지 않는다', async () => {
      const onClick = vi.fn();
      const user = userEvent.setup();
      render(<StampButton onClick={onClick}>제출</StampButton>);
      await user.click(button());
      await user.click(button());
      await user.keyboard('{Enter}');
      await user.keyboard(' ');
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('찍힌 뒤 다시 눌러도 도장이 하나이고 알림이 그대로다', async () => {
      const user = userEvent.setup();
      const { container } = render(<StampButton>제출</StampButton>);
      await user.click(button());
      await user.click(button());
      expect(container.querySelectorAll('[data-stamp-mark]')).toHaveLength(1);
      expect(screen.getByRole('status').textContent).toBe(
        '승인 도장을 찍었습니다'
      );
    });

    it('폼 안의 submit 단추는 찍힌 뒤 다시 눌러도 onSubmit이 한 번만 불린다', async () => {
      const onSubmit = vi.fn((event: FormEvent) => event.preventDefault());
      const user = userEvent.setup();
      render(
        <form onSubmit={onSubmit}>
          <StampButton type="submit">제출</StampButton>
        </form>
      );
      await user.click(button());
      await user.click(button());
      await user.keyboard('{Enter}');
      await user.keyboard(' ');
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it('onClick이 기본 동작을 막으면 찍히지 않는다', () => {
      const { container } = render(
        <StampButton onClick={(event) => event.preventDefault()}>
          제출
        </StampButton>
      );
      fireEvent.click(button());
      expect(markOf(container)).toBeNull();
      expect(button()).toHaveAttribute('aria-disabled', 'false');
    });

    it('disabled면 찍히지 않고 onClick도 불리지 않는다', async () => {
      const onClick = vi.fn();
      const user = userEvent.setup();
      const { container } = render(
        <StampButton disabled onClick={onClick}>
          제출
        </StampButton>
      );
      await user.click(button());
      expect(onClick).not.toHaveBeenCalled();
      expect(markOf(container)).toBeNull();
    });

    it('key를 바꿔 다시 그리면 처음 상태로 돌아가 다시 찍힌다', () => {
      const onClick = vi.fn();
      const { container, rerender } = render(
        <StampButton key="a" onClick={onClick}>
          제출
        </StampButton>
      );
      fireEvent.click(button());
      rerender(
        <StampButton key="b" onClick={onClick}>
          제출
        </StampButton>
      );
      expect(markOf(container)).toBeNull();
      expect(button()).toHaveAttribute('aria-disabled', 'false');
      expect(screen.getByRole('status').textContent).toBe('');
      fireEvent.click(button());
      expect(onClick).toHaveBeenCalledTimes(2);
      expect(markOf(container)).toBeInTheDocument();
    });
  });

  describe('움직임', () => {
    const stamp = () => {
      const view = render(<StampButton>제출</StampButton>);
      fireEvent.click(button());
      const mark = markOf(view.container) as StampHost;
      const root = view.container.firstElementChild as HTMLElement;
      return {
        ...view,
        mark,
        root,
        tl: mark.__stampTimeline as gsap.core.Timeline,
      };
    };
    const tweensOf = (tl: gsap.core.Timeline, target: Element | null) =>
      tl
        .getChildren(false)
        .filter((child) =>
          (child as gsap.core.Tween).targets().includes(target)
        ) as gsap.core.Tween[];

    it('도장은 단추 높이의 1.5배 위에서 1.6배 크기, -8deg로 시작해 exit과 slow로 내려온다', () => {
      const { mark, tl } = stamp();
      const fall = tweensOf(tl, mark).find((t) => t.vars.y === 0);
      expect(fall?.vars.ease).toBe(gsapEasing.exit);
      expect(fall?.duration()).toBeCloseTo(gsapDuration.slow, 5);
      tl.progress(0);
      expect(mark.style.transform).toContain('translate(0px, -66px)');
      expect(mark.style.transform).toContain('rotate(-8deg)');
      expect(mark.style.transform).toContain('scale(1.6');
    });

    it('끝 상태는 y 0, 1배, -8deg 그대로다', () => {
      const { mark, tl } = stamp();
      tl.progress(1);
      expect(mark.style.transform).toContain('rotate(-8deg)');
      expect(mark.style.transform).not.toContain('scale(1.6');
      expect(mark.style.transform).not.toContain('-66px');
    });

    it('닿는 순간 단추 전체가 1px 눌렸다 돌아오고 도장 면이 납작했다 돌아온다', () => {
      const { container, root, tl } = stamp();
      const face = faceOf(container);
      const [knock] = tweensOf(tl, root);
      const [squash] = tweensOf(tl, face);
      expect(knock.vars.y).toBe(1);
      expect(knock.vars.yoyo).toBe(true);
      expect(knock.duration() * 2).toBeCloseTo(gsapDuration.fast, 5);
      expect(squash.vars.scaleY).toBeCloseTo(0.92, 5);
      expect(squash.vars.yoyo).toBe(true);
      // 도장이 내려오는 동안은 쾅이 아니다. 닿은 뒤에 시작하고 둘이 같이 시작한다
      expect(knock.startTime()).toBeGreaterThan(0);
      expect(squash.startTime()).toBeCloseTo(knock.startTime(), 5);
      tl.progress(1);
      expect(root.style.transform).not.toContain('1px');
      expect(face?.style.transform ?? '').not.toContain('0.92');
    });

    it('인주 마스크는 닿은 뒤 slower와 settle로 0에서 도장보다 크게 번진다', () => {
      const { container, tl } = stamp();
      const [bloom] = tweensOf(tl, circleOf(container));
      expect(bloom.vars.ease).toBe(gsapEasing.settle);
      expect(bloom.duration()).toBeCloseTo(gsapDuration.slower, 5);
      expect(bloom.startTime()).toBeGreaterThan(0);
      tl.progress(0);
      expect(inkRadiusOf(container)).toBe(0);
      tl.progress(1);
      expect(inkRadiusOf(container)).toBeGreaterThan(COVERS_CORNERS);
    });

    it('인주는 도장 면과 같은 상자 안에서 아주 옅게 깔린다', () => {
      const { container } = stamp();
      expect(inkOf(container)?.parentElement).toBe(
        faceOf(container)?.parentElement
      );
      const alpha = Number(
        inkOf(container)?.querySelector('path')?.getAttribute('fill-opacity')
      );
      expect(alpha).toBeGreaterThan(0);
      expect(alpha).toBeLessThanOrEqual(0.2);
    });
  });

  describe('움직임 줄이기', () => {
    it('찍은 직후 도장과 인주가 끝 상태로 확정되고 트윈이 남지 않는다', () => {
      stubReducedMotion();
      const { container } = render(<StampButton>제출</StampButton>);
      fireEvent.click(button());
      const mark = markOf(container) as StampHost;
      const tl = mark.__stampTimeline as gsap.core.Timeline;
      expect(tl.progress()).toBe(1);
      expect(tl.parent).toBeFalsy();
      expect(inkRadiusOf(container)).toBeGreaterThan(COVERS_CORNERS);
      expect(mark.style.transform).toContain('rotate(-8deg)');
      expect(mark.style.transform).not.toContain('scale(1.6');
      expect(mark.style.transform).not.toContain('-66px');
      const root = container.firstElementChild as HTMLElement;
      expect(root.style.transform).not.toContain('1px');
    });

    it('움직임이 없어도 잠금과 알림은 그대로다', () => {
      stubReducedMotion();
      const onClick = vi.fn();
      render(<StampButton onClick={onClick}>제출</StampButton>);
      fireEvent.click(button());
      fireEvent.click(button());
      expect(onClick).toHaveBeenCalledTimes(1);
      expect(button()).toHaveAttribute('aria-disabled', 'true');
      expect(screen.getByRole('status').textContent).toBe(
        '승인 도장을 찍었습니다'
      );
    });
  });
});
