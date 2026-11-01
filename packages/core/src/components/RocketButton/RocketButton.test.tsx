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
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RocketButton } from './RocketButton';
import { gsapDuration, gsapEasing } from '../../tokens/gsapEasing';
import { BEAT, BEAT_END, rocketBeat } from './rocketBeat';
import { replaceSmokeFactory } from './smokeEngine';

// RocketButton.tsx가 바깥 상자에 얹는 손잡이(BurstToggle의 타임라인 손잡이와 같은 모양).
type WingHost = HTMLElement & {
  __rocketTimeline?: gsap.core.Timeline;
  __rocketCrouch?: gsap.core.Tween;
};

const GEOMETRY = { width: 120, height: 44, distance: 0 };
const button = (name: string | RegExp = '보내기') =>
  screen.getByRole('button', { name });
const hostOf = (container: HTMLElement) =>
  container.firstElementChild as WingHost;
const layerOf = (parent: ParentNode = document) =>
  parent.querySelector('[data-rocket-layer]') as HTMLElement | null;
const markOf = (parent: ParentNode = document) =>
  parent.querySelector('[data-rocket-mark]') as HTMLElement | null;
const tweensOf = (tl: gsap.core.Timeline, target: Element | null) =>
  tl
    .getChildren(false)
    .filter((child) =>
      (child as gsap.core.Tween).targets().includes(target)
    ) as gsap.core.Tween[];
// 타임라인을 끝까지 돌린다. 끝나면 컴포넌트가 상태를 바꾸므로 act로 감싼다
const finish = (tl: gsap.core.Timeline) => act(() => void tl.progress(1));

// 단추 복제본 상자의 이동(px). GSAP이 translate(x, y)로 쓴다
const translateOf = (el: HTMLElement) => {
  const m = /translate\((-?[\d.e-]+)px(?:, (-?[\d.e-]+)px)?\)/.exec(
    el.style.transform
  );
  return { x: Number(m?.[1] ?? 0), y: Number(m?.[2] ?? 0) };
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

// jsdom에는 레이아웃이 없어 offsetParent가 늘 null이다. GSAP은 그런 요소의 transform을 읽을 때 요소를 잠깐
// 문서 루트로 옮겼다 되돌리는데, 단추를 품은 상자가 옮겨지면 jsdom이 포커스를 잃는다. 브라우저에서는 일어나지 않는 일이라
// 포커스 시험이 시간에 따라 흔들리지 않도록 레이아웃이 있는 것처럼 부모를 돌려준다.
const originalOffsetParent = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  'offsetParent'
);
// 같은 이유로 단추의 화면 사각형도 돌려준다(복제본이 그 자리에 놓이는지 보려면 0이 아닌 값이 필요하다).
// 브라우저의 레이아웃을 그대로 흉내 낸다: 단추는 누름(data-pressed)의 scale(0.95)가 사각형을 줄이고, 단추를 감싼 상자는
// 자기 transform(웅크림 scale(0.97))만 사각형에 받으며 자식의 transform은 받지 않는다.
const originalRect = Element.prototype.getBoundingClientRect;
const BUTTON_RECT = { left: 100, top: 200, width: 120, height: 44 };
const scaledRect = (scale: number) => {
  const width = BUTTON_RECT.width * scale;
  const height = BUTTON_RECT.height * scale;
  const left = BUTTON_RECT.left + (BUTTON_RECT.width - width) / 2;
  const top = BUTTON_RECT.top + (BUTTON_RECT.height - height) / 2;
  return {
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    x: left,
    y: top,
    toJSON: () => ({}),
  };
};
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
    configurable: true,
    get() {
      return this.parentElement;
    },
  });
  Element.prototype.getBoundingClientRect = function () {
    if (this.tagName === 'BUTTON') {
      return scaledRect(this.hasAttribute('data-pressed') ? 0.95 : 1);
    }
    if (this.firstElementChild?.tagName === 'BUTTON') {
      const crouched = (this as HTMLElement).style.transform.includes('0.97');
      return scaledRect(crouched ? 0.97 : 1);
    }
    return originalRect.call(this);
  };
});
afterAll(() => {
  Element.prototype.getBoundingClientRect = originalRect;
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

describe('RocketButton', () => {
  describe('의미와 접근성', () => {
    it('type=button이고 ref가 button으로 가며 네이티브 속성과 className이 간다', () => {
      const ref = createRef<HTMLButtonElement>();
      render(
        <RocketButton ref={ref} data-x="1" className="mine">
          보내기
        </RocketButton>
      );
      expect(ref.current).toBe(button());
      expect(button()).toHaveAttribute('type', 'button');
      expect(button()).toHaveAttribute('data-x', '1');
      expect(button()).toHaveClass('mine');
    });

    it('누르기 전에는 표지도 비행 레이어도 없다', () => {
      const { container } = render(<RocketButton>보내기</RocketButton>);
      expect(markOf(container)).toBeNull();
      expect(layerOf()).toBeNull();
    });
  });

  describe('click에서 날고 표지가 선다', () => {
    it('click 한 번에 onClick 1회, 날아간 뒤 sentLabel 표지가 서고 단추는 자리를 지킨다', () => {
      const onClick = vi.fn();
      const { container } = render(
        <RocketButton onClick={onClick}>보내기</RocketButton>
      );
      const host = hostOf(container);
      fireEvent.click(button());
      expect(onClick).toHaveBeenCalledTimes(1);
      finish(host.__rocketTimeline as gsap.core.Timeline);
      expect(markOf(container)).toHaveTextContent('보냈어요');
      expect(markOf(container)).toHaveStyle({ opacity: '1' });
      // 자리 유지: 단추는 같은 상자 안에 그대로 있고 보이지 않을 뿐이다(레이아웃 크기는 e2e가 잰다)
      expect(host).toContainElement(
        screen.getByRole('button', { hidden: true })
      );
      expect(
        (
          screen.getByRole('button', { hidden: true })
            .parentElement as HTMLElement
        ).style.visibility
      ).toBe('hidden');
    });

    it('sentLabel을 바꾸면 표지 글자가 따라간다', () => {
      const { container } = render(
        <RocketButton sentLabel="전송 완료">보내기</RocketButton>
      );
      fireEvent.click(button());
      expect(markOf(container)).toHaveTextContent('전송 완료');
    });

    it('onClick은 pointerdown에서 불리지 않는다', () => {
      const onClick = vi.fn();
      const { container } = render(
        <RocketButton onClick={onClick}>보내기</RocketButton>
      );
      fireEvent.pointerDown(button());
      expect(onClick).not.toHaveBeenCalled();
      expect(markOf(container)).toBeNull();
      expect(layerOf()).toBeNull();
    });

    it('비행 중 복제본이 화면 전체 레이어에 원래 단추의 자리와 크기로 서고 aria-hidden, inert, id 없음이다', () => {
      render(
        <RocketButton id="send" data-x="1">
          보내기
        </RocketButton>
      );
      fireEvent.click(button());
      const layer = layerOf() as HTMLElement;
      expect(layer.parentElement).toBe(document.body);
      expect(layer).toHaveAttribute('aria-hidden', 'true');
      expect(layer).toHaveAttribute('inert');
      const clone = layer.querySelector('button') as HTMLElement;
      expect(clone).toHaveTextContent('보내기');
      expect(clone).toHaveAttribute('aria-hidden', 'true');
      expect(clone).toHaveAttribute('inert');
      expect(clone).not.toHaveAttribute('id');
      expect(document.querySelectorAll('#send')).toHaveLength(1);
      const craft = clone.closest('[data-rocket-layer] > div') as HTMLElement;
      expect(craft.style.left).toBe('100px');
      expect(craft.style.top).toBe('200px');
      expect(craft.style.width).toBe('120px');
      expect(craft.style.height).toBe('44px');
    });

    it('누르고 있다 뗄 때(단추가 눌린 scale(0.95)이고 웅크린 채) click해도 복제본은 원래 단추의 사각형에서 출발한다', async () => {
      const user = userEvent.setup();
      const { container } = render(<RocketButton>보내기</RocketButton>);
      await user.pointer({ keys: '[MouseLeft>]', target: button() });
      act(
        () =>
          void (hostOf(container).__rocketCrouch as gsap.core.Tween).progress(1)
      );
      // 시험의 전제: 단추는 눌려 있고 웅크림이 걸려 있다
      expect(button()).toHaveAttribute('data-pressed');
      expect((button().parentElement as HTMLElement).style.transform).toContain(
        '0.97'
      );
      fireEvent.click(button());
      const craft = layerOf()?.firstElementChild as HTMLElement;
      expect(craft.style.left).toBe('100px');
      expect(craft.style.top).toBe('200px');
      expect(craft.style.width).toBe('120px');
      expect(craft.style.height).toBe('44px');
    });

    it('복제본에는 소비자의 data-* 속성이 하나도 남지 않는다(장식이다)', () => {
      render(
        <RocketButton data-testid="send" data-x="1">
          <span data-y="2">보내기</span>
        </RocketButton>
      );
      fireEvent.pointerDown(button());
      fireEvent.click(button());
      const clone = layerOf()?.querySelector('button') as HTMLElement;
      const names = [clone, ...clone.querySelectorAll('*')].flatMap((node) =>
        node.getAttributeNames()
      );
      expect(names.filter((name) => name.startsWith('data-'))).toEqual([]);
    });

    it('발사 거리는 container의 가까운 가장자리를 넘어 꼬리날개와 불꽃이 나가는 높이의 2배만큼 더 나가는 거리다', () => {
      // 단추는 레이어 안 (100, 200), 높이 44. 위쪽으로 나가려면 200 + 44, 오른쪽이면 폭 - 100. 더 나가는 거리는 높이의 2배(TAIL_REACH)
      const reach = 44 * 2;
      const launchX = (width: number) => {
        const stage = document.createElement('div');
        Object.defineProperty(stage, 'clientWidth', { value: width });
        Object.defineProperty(stage, 'clientHeight', { value: 600 });
        document.body.appendChild(stage);
        const view = render(
          <RocketButton container={stage}>보내기</RocketButton>
        );
        fireEvent.click(button());
        const tl = hostOf(view.container)
          .__rocketTimeline as gsap.core.Timeline;
        const craft = layerOf(stage)?.firstElementChild as HTMLElement;
        // 발사가 끝나는 순간(3.05초) 단추가 가 있는 곳이 그 거리다
        act(() => void tl.time(BEAT.sent / 1000));
        const x = translateOf(craft).x;
        view.unmount();
        stage.remove();
        return x;
      };
      // 위가 가깝다(상자 폭 1000): 244 + 더 나가는 거리
      expect(launchX(1000)).toBeCloseTo(244 + reach, 5);
      // 오른쪽이 가깝다(상자 폭 150): 50 + 더 나가는 거리
      expect(launchX(150)).toBeCloseTo(50 + reach, 5);
    });

    it('비행이 끝나면 복제본 레이어를 치운다', () => {
      const { container } = render(<RocketButton>보내기</RocketButton>);
      fireEvent.click(button());
      expect(layerOf()).not.toBeNull();
      finish(hostOf(container).__rocketTimeline as gsap.core.Timeline);
      expect(layerOf()).toBeNull();
      expect(markOf(container)).toBeInTheDocument();
    });

    it('container를 주면 레이어가 그 안에 생기고 body에는 생기지 않는다', () => {
      const stage = document.createElement('div');
      document.body.appendChild(stage);
      render(<RocketButton container={stage}>보내기</RocketButton>);
      fireEvent.click(button());
      expect(layerOf(stage)).not.toBeNull();
      expect(layerOf(stage)).toHaveAttribute('data-contained');
      expect(layerOf(document.body)?.parentElement).toBe(stage);
      stage.remove();
    });

    it('소비자 onClick이 preventDefault하면 날지 않고 웅크림도 되감긴다', () => {
      const { container } = render(
        <RocketButton onClick={(event) => event.preventDefault()}>
          보내기
        </RocketButton>
      );
      const host = hostOf(container);
      fireEvent.pointerDown(button());
      fireEvent.click(button());
      expect(layerOf()).toBeNull();
      expect(markOf(container)).toBeNull();
      // 되감기 트윈이 끝 자세(제자리)로 간다
      const rewind = host.__rocketCrouch as gsap.core.Tween;
      expect(rewind.vars.x).toBe(0);
      expect(rewind.vars.scale).toBe(1);
    });

    it('disabled면 onClick이 불리지 않고 웅크리지도 날지도 않는다', async () => {
      const onClick = vi.fn();
      const user = userEvent.setup();
      const { container } = render(
        <RocketButton disabled onClick={onClick}>
          보내기
        </RocketButton>
      );
      fireEvent.pointerDown(button());
      await user.click(button());
      expect(onClick).not.toHaveBeenCalled();
      expect(hostOf(container).__rocketCrouch).toBeUndefined();
      expect(layerOf()).toBeNull();
      expect(markOf(container)).toBeNull();
    });

    it('key를 바꿔 다시 그리면 원래 단추로 돌아온다', () => {
      const { container, rerender } = render(
        <RocketButton key="a">보내기</RocketButton>
      );
      fireEvent.click(button());
      rerender(<RocketButton key="b">보내기</RocketButton>);
      expect(markOf(container)).toBeNull();
      expect(layerOf()).toBeNull();
      expect(button()).toBeVisible();
    });

    it('폼 안의 submit 단추는 첫 click에서 제출되고 날아간 뒤에는 이중 제출되지 않는다', async () => {
      const onSubmit = vi.fn((event: FormEvent) => event.preventDefault());
      const user = userEvent.setup();
      const { container } = render(
        <form onSubmit={onSubmit}>
          <RocketButton type="submit">보내기</RocketButton>
        </form>
      );
      const original = container.querySelector('form button') as HTMLElement;
      await user.click(button());
      expect(onSubmit).toHaveBeenCalledTimes(1);
      // 날아간 뒤 보이지 않는 단추에 click이 와도(폼의 Enter 암묵 제출) 막는다
      fireEvent.click(original);
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
  });

  describe('웅크림', () => {
    it('pointerdown에 왼쪽 아래로 눌리고 pointercancel에 되감긴다', () => {
      const { container } = render(<RocketButton>보내기</RocketButton>);
      const host = hostOf(container);
      const wrap = button().parentElement as HTMLElement;
      fireEvent.pointerDown(button());
      const press = host.__rocketCrouch as gsap.core.Tween;
      expect(press.duration()).toBeCloseTo(gsapDuration.fast, 5);
      expect(press.vars.ease).toBe(gsapEasing.settle);
      act(() => void press.progress(1));
      expect(wrap.style.transform).toContain('translate(-2px, 2px)');
      expect(wrap.style.transform).toContain('scale(0.97');

      fireEvent.pointerCancel(button());
      const rewind = host.__rocketCrouch as gsap.core.Tween;
      expect(rewind).not.toBe(press);
      act(() => void rewind.progress(1));
      expect(wrap.style.transform).not.toContain('-2px');
      expect(wrap.style.transform).not.toContain('0.97');
      // 날지 않았다
      expect(layerOf()).toBeNull();
      expect(markOf(container)).toBeNull();
    });

    it('pointerleave에도 되감긴다', () => {
      const { container } = render(<RocketButton>보내기</RocketButton>);
      const host = hostOf(container);
      const wrap = button().parentElement as HTMLElement;
      fireEvent.pointerDown(button());
      act(() => void (host.__rocketCrouch as gsap.core.Tween).progress(1));
      fireEvent.pointerLeave(button());
      act(() => void (host.__rocketCrouch as gsap.core.Tween).progress(1));
      expect(wrap.style.transform).not.toContain('-2px');
    });

    it('웅크린 중 다시 누르기는 무시한다', () => {
      const { container } = render(<RocketButton>보내기</RocketButton>);
      const host = hostOf(container);
      fireEvent.pointerDown(button());
      const first = host.__rocketCrouch;
      fireEvent.pointerDown(button());
      expect(host.__rocketCrouch).toBe(first);
    });

    it('주 단추가 아닌 누름에는 웅크리지 않는다(click이 오지 않아 눌린 채 남는다)', async () => {
      const user = userEvent.setup();
      const { container } = render(<RocketButton>보내기</RocketButton>);
      await user.pointer({ keys: '[MouseRight>]', target: button() });
      expect(hostOf(container).__rocketCrouch).toBeUndefined();
    });
  });

  describe('박자와 비행', () => {
    const launch = () => {
      const view = render(<RocketButton>보내기</RocketButton>);
      fireEvent.click(button());
      const layer = layerOf() as HTMLElement;
      const craft = layer.firstElementChild as HTMLElement;
      const tl = hostOf(view.container).__rocketTimeline as gsap.core.Timeline;
      const at = (ms: number) => act(() => void tl.time(ms / 1000));
      return { ...view, layer, craft, tl, at };
    };

    it('시계 하나가 0에서 3250ms까지 돌며 단추를 박자대로 움직인다(웅크림, 떠오름, 둥실)', () => {
      const { craft, tl, at } = launch();
      expect(tl.duration()).toBeCloseTo(BEAT_END / 1000, 5);
      at(0);
      expect(translateOf(craft)).toEqual({ x: 0, y: 0 });
      at(150);
      expect(craft.style.transform).toContain('translate(-2px, 2px)');
      expect(craft.style.transform).toContain('scale(0.97');
      at(300);
      expect(translateOf(craft).y).toBeCloseTo(0, 5);
      // 떠오름이 약 25px 자리에 앉고, 둥실 한가운데 근처(1400ms)에서는 박자 함수와 같은 높이다
      at(BEAT.hover);
      expect(translateOf(craft).y).toBeCloseTo(-25, 5);
      at(1400);
      expect(translateOf(craft).y).toBeCloseTo(rocketBeat(1400, GEOMETRY).y, 3);
      expect(Math.abs(translateOf(craft).y + 25)).toBeGreaterThan(1);
    });

    it('발사는 오른쪽 위로 가며 윗면이 진행 방향을 향해 30deg 기울고 0.6배가 된다', () => {
      const { craft, at } = launch();
      at(BEAT.launch);
      const hover = translateOf(craft);
      expect(hover.x).toBeCloseTo(0, 5);
      at(BEAT.sent);
      const end = translateOf(craft);
      expect(end.x).toBeGreaterThan(0);
      // 45도: 오른쪽으로 간 만큼 위로 간다
      expect(end.y - hover.y).toBeCloseTo(-end.x, 5);
      expect(craft.style.transform).toContain('rotate(30deg)');
      expect(craft.style.transform).toContain('scale(0.6');
    });

    it('눌렀다 뗀 click이면 복제본은 웅크린 자세로 이어받는다', () => {
      render(<RocketButton>보내기</RocketButton>);
      fireEvent.pointerDown(button());
      fireEvent.click(button());
      const craft = layerOf()?.firstElementChild as HTMLElement;
      expect(craft.style.transform).toContain('translate(-2px, 2px)');
      expect(craft.style.transform).toContain('scale(0.97');
    });

    it('표지는 비행이 끝나는 3050ms에야 떠오르기 시작하고 그 순간 레이어를 걷는다', () => {
      const { container, at } = launch();
      const label = markOf(container) as HTMLElement;
      at(BEAT.sent - 10);
      expect(label.style.opacity).toBe('0');
      expect(layerOf()).not.toBeNull();
      at(BEAT.sent);
      expect(layerOf()).toBeNull();
      at(BEAT.sent + 100);
      expect(Number(label.style.opacity)).toBeGreaterThan(0.5);
      expect(Number(label.style.opacity)).toBeLessThan(1);
      at(BEAT_END);
      expect(label.style.opacity).toBe('1');
    });

    it('비행 중 다시 누르면 무시한다: 두 번째 비행도 두 번째 onClick도 없고 끝 모양이 같다', () => {
      const onClick = vi.fn();
      const view = render(
        <RocketButton onClick={onClick}>보내기</RocketButton>
      );
      const original = button();
      fireEvent.click(original);
      const tl = hostOf(view.container).__rocketTimeline as gsap.core.Timeline;
      act(() => void tl.time(1));
      fireEvent.click(original);
      fireEvent.click(original);
      expect(onClick).toHaveBeenCalledTimes(1);
      expect(hostOf(view.container).__rocketTimeline).toBe(tl);
      expect(document.querySelectorAll('[data-rocket-layer]')).toHaveLength(1);
      finish(tl);
      fireEvent.click(original);
      expect(onClick).toHaveBeenCalledTimes(1);
      expect(
        view.container.querySelectorAll('[data-rocket-mark]')
      ).toHaveLength(1);
      expect(markOf(view.container)).toHaveTextContent('보냈어요');
      expect(markOf(view.container)).toHaveStyle({ opacity: '1' });
      expect(screen.getByRole('status')).toHaveTextContent('보냈어요');
    });
  });

  describe('포커스', () => {
    it('포커스가 있었으면 표지로 옮기고 표지에는 role이 없으며 알림 영역은 비어 있다(두 번 낭독 방지)', () => {
      const { container } = render(<RocketButton>보내기</RocketButton>);
      button().focus();
      fireEvent.click(button());
      finish(hostOf(container).__rocketTimeline as gsap.core.Timeline);
      const label = markOf(container) as HTMLElement;
      expect(label).toHaveFocus();
      expect(label).toHaveAttribute('tabindex', '-1');
      expect(label).not.toHaveAttribute('role');
      expect(screen.getByRole('status')).toHaveTextContent('');
    });

    it('포커스가 없었으면 옮기지 않고, 마운트 때부터 있던 빈 알림 영역에 비행이 끝난 뒤 글이 들어간다', () => {
      const { container } = render(<RocketButton>보내기</RocketButton>);
      // 새로 삽입된 live 영역은 읽히지 않을 수 있어 처음부터 DOM에 있어야 한다
      const status = screen.getByRole('status');
      expect(status).toHaveTextContent('');
      expect(button()).not.toHaveFocus();
      fireEvent.click(button());
      expect(screen.getByRole('status')).toBe(status);
      expect(status).toHaveTextContent('');
      finish(hostOf(container).__rocketTimeline as gsap.core.Timeline);
      const label = markOf(container) as HTMLElement;
      expect(label).not.toHaveFocus();
      expect(label).not.toHaveAttribute('role');
      expect(screen.getByRole('status')).toBe(status);
      expect(status).toHaveTextContent('보냈어요');
    });

    it('비행이 끝나도 포커스는 표지에 남는다', () => {
      const { container } = render(<RocketButton>보내기</RocketButton>);
      button().focus();
      fireEvent.click(button());
      finish(hostOf(container).__rocketTimeline as gsap.core.Timeline);
      expect(markOf(container)).toHaveFocus();
    });
  });

  describe('움직임 줄이기', () => {
    it('로켓도 비행도 없이 단추가 표지로 교차 페이드한다', () => {
      stubReducedMotion();
      const { container } = render(<RocketButton>보내기</RocketButton>);
      const host = hostOf(container);
      const wrap = button().parentElement as HTMLElement;
      fireEvent.click(button());
      expect(layerOf()).toBeNull();
      expect(container.querySelector('[data-rocket]')).toBeNull();
      const label = markOf(container) as HTMLElement;
      const tl = host.__rocketTimeline as gsap.core.Timeline;
      const out = tweensOf(tl, wrap)[0];
      const into = tweensOf(tl, label)[0];
      expect(out.duration()).toBeCloseTo(gsapDuration.base, 5);
      expect(into.duration()).toBeCloseTo(gsapDuration.base, 5);
      finish(tl);
      expect(label.style.opacity).toBe('1');
      expect(wrap.style.visibility).toBe('hidden');
    });

    it('움직임이 없어도 포커스 규칙은 같다', () => {
      stubReducedMotion();
      const { container } = render(<RocketButton>보내기</RocketButton>);
      button().focus();
      fireEvent.click(button());
      expect(markOf(container)).toHaveFocus();
      expect(markOf(container)).not.toHaveAttribute('role');
    });

    it('웅크리지 않는다', () => {
      stubReducedMotion();
      const { container } = render(<RocketButton>보내기</RocketButton>);
      fireEvent.pointerDown(button());
      expect(hostOf(container).__rocketCrouch).toBeUndefined();
      expect((button().parentElement as HTMLElement).style.transform).toBe('');
    });

    it('비행 도중 움직임 줄이기가 켜지면 끝 상태로 확정되고 레이어가 걷힌다', () => {
      let reduce = false;
      let notify = () => {};
      vi.stubGlobal(
        'matchMedia',
        (media: string): MediaQueryList =>
          ({
            get matches() {
              return reduce;
            },
            media,
            addEventListener: (_: string, listener: () => void) => {
              notify = listener;
            },
            removeEventListener: () => {},
          }) as unknown as MediaQueryList
      );
      const { container } = render(<RocketButton>보내기</RocketButton>);
      fireEvent.click(button());
      expect(layerOf()).not.toBeNull();
      reduce = true;
      act(() => notify());
      expect(layerOf()).toBeNull();
      expect(markOf(container)).toHaveStyle({ opacity: '1' });
    });
  });

  // 분사구 끝 연기를 내보내는 연결(박자 함수의 smoke를 엔진 emit으로 바꾸는 곳)을 시험한다. jsdom에는 엔진이 없어
  // 엔진 자리에 emit 호출을 기록하는 손을 끼운다(replaceSmokeFactory).
  describe('분사구 끝 연기', () => {
    type Call = {
      kind: 'emit' | 'burst';
      x: number;
      y: number;
      vx: number;
      vy: number;
      t: number;
    };
    const record = () => {
      const calls: Call[] = [];
      const now = { t: 0 };
      replaceSmokeFactory(() => ({
        canvas: document.createElement('canvas'),
        emit: (x, y, vx, vy) =>
          calls.push({ kind: 'emit', x, y, vx, vy, t: now.t }),
        burst: (x, y) =>
          calls.push({ kind: 'burst', x, y, vx: 0, vy: 0, t: now.t }),
        dispose: () => {},
      }));
      return { calls, now };
    };
    afterEach(() => replaceSmokeFactory());

    // 10ms씩 시계를 보내며 엔진 호출을 모은다. 바닥이 있는 상자(높이 600)에서 날린다(jsdom은 창 높이가 0이다)
    const fly = (stageHeight = 600) => {
      const { calls, now } = record();
      const stage = document.createElement('div');
      Object.defineProperty(stage, 'clientWidth', { value: 1000 });
      Object.defineProperty(stage, 'clientHeight', { value: stageHeight });
      document.body.appendChild(stage);
      const view = render(
        <RocketButton container={stage}>보내기</RocketButton>
      );
      fireEvent.click(button());
      const tl = hostOf(view.container).__rocketTimeline as gsap.core.Timeline;
      for (let ms = 0; ms <= BEAT_END; ms += 10) {
        now.t = ms;
        act(() => void tl.time(ms / 1000));
      }
      view.unmount();
      stage.remove();
      // 분사구 끝에서 몸체 아래로 나가는 것(vy > 0)과 바닥에서 옆으로 퍼지는 것(vy = 0)
      return {
        all: calls,
        jets: calls.filter((c) => c.kind === 'emit' && c.vy > 0),
        floor: calls.filter((c) => c.kind === 'emit' && c.vy === 0),
      };
    };

    it('불꽃이 켜진 동안에만 내보내고 점화 전(0~450ms)과 보냈어요(3050ms 뒤)에는 내보내지 않는다', () => {
      const { jets } = fly();
      expect(jets.length).toBeGreaterThan(0);
      for (const c of jets)
        expect(rocketBeat(c.t, GEOMETRY).flame).toBeGreaterThan(0);
      expect(jets.filter((c) => c.t <= 450)).toEqual([]);
      expect(jets.filter((c) => c.t >= BEAT.sent)).toEqual([]);
      // 점화하는 첫 프레임(460ms)부터 나온다
      expect(Math.min(...jets.map((c) => c.t))).toBe(460);
    });

    it('두 분사구에서 같은 시각에 하나씩, 둥실 동안은 100ms 간격으로 아래로 내보낸다', () => {
      const { jets } = fly();
      const hover = jets.filter((c) => c.t >= 460 && c.t < BEAT.launch);
      const times = [...new Set(hover.map((c) => c.t))];
      expect(times.slice(0, 5)).toEqual([460, 560, 660, 760, 860]);
      for (const t of times)
        expect(hover.filter((c) => c.t === t)).toHaveLength(2);
      // 몸체가 반듯하니 아래로 곧게(vx 0) 나가고 자리는 박자 함수의 분사구 끝이다
      const [left, right] = rocketBeat(460, GEOMETRY).smokeAt;
      const first = hover.filter((c) => c.t === 460);
      expect(first.every((c) => c.vx === 0 && c.vy > 0)).toBe(true);
      expect(first.map((c) => [c.x, c.y])).toEqual([
        [left.x, left.y],
        [right.x, right.y],
      ]);
    });

    it('발사 중에는 매 프레임 내보내고 몸체의 아래 방향(진행 반대쪽)으로 나간다', () => {
      const { jets } = fly();
      const launch = jets.filter((c) => c.t >= BEAT.launch);
      const times = [...new Set(launch.map((c) => c.t))];
      // 2250ms는 불꽃 간격(100ms) 안이라 건너뛸 수 있다: 이후는 10ms마다 있다
      for (let t = 2300; t < BEAT.sent; t += 10) expect(times).toContain(t);
      // 시계 방향으로 기운 몸체의 아래는 왼쪽 아래다
      for (const c of launch.filter((c) => c.t >= 2400)) {
        expect(c.vx).toBeLessThan(0);
        expect(Math.hypot(c.vx, c.vy)).toBeCloseTo(500, 3);
      }
    });

    it('내보내는 자리는 박자 함수의 분사구 끝에 이동 없이 기울기와 배율을 건 창 좌표다', () => {
      const { jets } = fly();
      // jsdom에서 복제본 상자의 사각형은 0이라 중심은 (0, 0)이다
      const t = 2600;
      const beat = rocketBeat(t, GEOMETRY);
      const rad = (beat.rotation * Math.PI) / 180;
      const expected = beat.smokeAt.map((p) => [
        beat.scale * (p.x * Math.cos(rad) - p.y * Math.sin(rad)),
        beat.scale * (p.x * Math.sin(rad) + p.y * Math.cos(rad)),
      ]);
      const near = jets.filter((c) => c.t === t);
      expect(near).toHaveLength(2);
      near.forEach((c, i) => {
        expect(c.x).toBeCloseTo(expected[i][0], 3);
        expect(c.y).toBeCloseTo(expected[i][1], 3);
      });
    });

    it('바닥(상자 아래 가장자리) 근처에서 분사구 바깥쪽 옆으로 퍼지는 띠는 발사 전 불꽃이 켜진 동안만 쌓인다', () => {
      const { floor } = fly();
      expect(floor.length).toBeGreaterThan(0);
      // 상자 높이 600 - 12px, 왼쪽 분사구는 왼쪽으로 오른쪽 분사구는 오른쪽으로
      for (const c of floor) {
        expect(c.y).toBe(600 - 12);
        expect(Math.abs(c.vx)).toBe(320);
        expect(c.t).toBeGreaterThanOrEqual(460);
        expect(c.t).toBeLessThan(BEAT.launch);
      }
      const at460 = floor.filter((c) => c.t === 460);
      expect(at460.map((c) => Math.sign(c.vx))).toEqual([-1, 1]);
      // 바깥쪽 분사구 위치(x)에서 퍼진다
      expect(at460.map((c) => c.x)).toEqual([
        -GEOMETRY.width / 6,
        GEOMETRY.width / 6,
      ]);
    });

    it('바닥이 분사구보다 위이면 바닥 띠는 만들지 않는다', () => {
      const { floor, jets } = fly(20);
      expect(floor).toEqual([]);
      expect(jets.length).toBeGreaterThan(0);
    });

    it('이륙 터짐은 없다: 연기는 분사구에서만 나온다', () => {
      const { all } = fly();
      expect(all.filter((c) => c.kind === 'burst')).toEqual([]);
    });
  });

  // jsdom에는 WebGL이 없어 엔진은 늘 null이다. 목을 쓰지 않고 "엔진이 문맥을 얻으려 했는가"를 canvas.getContext('webgl2')
  // 호출로 본다(WebGL2RenderingContext만 있는 것으로 보이게 하고 getContext는 jsdom처럼 null을 돌려준다).
  describe('유체 연기', () => {
    const contextAttempts = () => {
      vi.stubGlobal('WebGL2RenderingContext', class {});
      return vi
        .spyOn(HTMLCanvasElement.prototype, 'getContext')
        .mockImplementation(() => null);
    };
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('click 확정 때 엔진을 한 번 만들려 하고, 엔진이 null이어도 비행과 표지는 그대로다', () => {
      const attempts = contextAttempts();
      const { container } = render(<RocketButton>보내기</RocketButton>);
      expect(attempts).not.toHaveBeenCalled();
      fireEvent.click(button());
      expect(attempts).toHaveBeenCalledTimes(1);
      expect(attempts).toHaveBeenCalledWith('webgl2', expect.anything());
      expect(layerOf()).not.toBeNull();
      const tl = hostOf(container).__rocketTimeline as gsap.core.Timeline;
      finish(tl);
      expect(layerOf()).toBeNull();
      expect(markOf(container)).toHaveStyle({ opacity: '1' });
    });

    it('smoke={false}면 엔진을 만들려 하지 않고 비행은 그대로다', () => {
      const attempts = contextAttempts();
      render(<RocketButton smoke={false}>보내기</RocketButton>);
      fireEvent.click(button());
      expect(attempts).not.toHaveBeenCalled();
      expect(layerOf()).not.toBeNull();
    });

    it('소비자 onClick이 막으면 엔진을 만들지 않는다', () => {
      const attempts = contextAttempts();
      render(
        <RocketButton onClick={(event) => event.preventDefault()}>
          보내기
        </RocketButton>
      );
      fireEvent.click(button());
      expect(attempts).not.toHaveBeenCalled();
    });
  });
});
