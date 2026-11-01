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
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WingButton } from './WingButton';
import { gsapDuration, gsapEasing } from '../../tokens/gsapEasing';
import { BEAT, BEAT_END, wingBeat } from './wingBeat';
import { replaceSmokeFactory } from './smokeEngine';
import { replaceThreeImporter, type ThreeModule } from './loadThree';
import { replaceWingSceneFactory, type WingInput } from './wingScene';

// WingButton.tsx가 바깥 상자에 얹는 손잡이(BurstToggle의 타임라인 손잡이와 같은 모양).
type WingHost = HTMLElement & {
  __wingTimeline?: gsap.core.Timeline;
  __wingCrouch?: gsap.core.Tween;
  __wingOutcome?: { status: string };
};

const GEOMETRY = { width: 120, height: 44, distance: 0 };
const button = (name: string | RegExp = '보내기') =>
  screen.getByRole('button', { name });
const hostOf = (container: HTMLElement) =>
  container.firstElementChild as WingHost;
const layerOf = (parent: ParentNode = document) =>
  parent.querySelector('[data-wing-layer]') as HTMLElement | null;
const markOf = (parent: ParentNode = document) =>
  parent.querySelector('[data-wing-mark]') as HTMLElement | null;
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

describe('WingButton', () => {
  describe('의미와 접근성', () => {
    it('type=button이고 ref가 button으로 가며 네이티브 속성과 className이 간다', () => {
      const ref = createRef<HTMLButtonElement>();
      render(
        <WingButton ref={ref} data-x="1" className="mine">
          보내기
        </WingButton>
      );
      expect(ref.current).toBe(button());
      expect(button()).toHaveAttribute('type', 'button');
      expect(button()).toHaveAttribute('data-x', '1');
      expect(button()).toHaveClass('mine');
    });

    it('누르기 전에는 표지도 비행 레이어도 없다', () => {
      const { container } = render(<WingButton>보내기</WingButton>);
      expect(markOf(container)).toBeNull();
      expect(layerOf()).toBeNull();
    });
  });

  describe('click에서 날고 표지가 선다', () => {
    it('click 한 번에 onClick 1회, 날아간 뒤 sentLabel 표지가 서고 단추는 자리를 지킨다', () => {
      const onClick = vi.fn();
      const { container } = render(
        <WingButton onClick={onClick}>보내기</WingButton>
      );
      const host = hostOf(container);
      fireEvent.click(button());
      expect(onClick).toHaveBeenCalledTimes(1);
      finish(host.__wingTimeline as gsap.core.Timeline);
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
        <WingButton sentLabel="전송 완료">보내기</WingButton>
      );
      fireEvent.click(button());
      expect(markOf(container)).toHaveTextContent('전송 완료');
    });

    it('onClick은 pointerdown에서 불리지 않는다', () => {
      const onClick = vi.fn();
      const { container } = render(
        <WingButton onClick={onClick}>보내기</WingButton>
      );
      fireEvent.pointerDown(button());
      expect(onClick).not.toHaveBeenCalled();
      expect(markOf(container)).toBeNull();
      expect(layerOf()).toBeNull();
    });

    it('비행 중 복제본이 화면 전체 레이어에 원래 단추의 자리와 크기로 서고 aria-hidden, inert, id 없음이다', () => {
      render(
        <WingButton id="send" data-x="1">
          보내기
        </WingButton>
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
      const craft = clone.closest('[data-wing-layer] > div') as HTMLElement;
      expect(craft.style.left).toBe('100px');
      expect(craft.style.top).toBe('200px');
      expect(craft.style.width).toBe('120px');
      expect(craft.style.height).toBe('44px');
    });

    it('누르고 있다 뗄 때(단추가 눌린 scale(0.95)이고 웅크린 채) click해도 복제본은 원래 단추의 사각형에서 출발한다', async () => {
      const user = userEvent.setup();
      const { container } = render(<WingButton>보내기</WingButton>);
      await user.pointer({ keys: '[MouseLeft>]', target: button() });
      act(
        () =>
          void (hostOf(container).__wingCrouch as gsap.core.Tween).progress(1)
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
        <WingButton data-testid="send" data-x="1">
          <span data-y="2">보내기</span>
        </WingButton>
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
        const view = render(<WingButton container={stage}>보내기</WingButton>);
        fireEvent.click(button());
        const tl = hostOf(view.container).__wingTimeline as gsap.core.Timeline;
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
      const { container } = render(<WingButton>보내기</WingButton>);
      fireEvent.click(button());
      expect(layerOf()).not.toBeNull();
      finish(hostOf(container).__wingTimeline as gsap.core.Timeline);
      expect(layerOf()).toBeNull();
      expect(markOf(container)).toBeInTheDocument();
    });

    it('container를 주면 레이어가 그 안에 생기고 body에는 생기지 않는다', () => {
      const stage = document.createElement('div');
      document.body.appendChild(stage);
      render(<WingButton container={stage}>보내기</WingButton>);
      fireEvent.click(button());
      expect(layerOf(stage)).not.toBeNull();
      expect(layerOf(stage)).toHaveAttribute('data-contained');
      expect(layerOf(document.body)?.parentElement).toBe(stage);
      stage.remove();
    });

    it('소비자 onClick이 preventDefault하면 날지 않고 웅크림도 되감긴다', () => {
      const { container } = render(
        <WingButton onClick={(event) => event.preventDefault()}>
          보내기
        </WingButton>
      );
      const host = hostOf(container);
      fireEvent.pointerDown(button());
      fireEvent.click(button());
      expect(layerOf()).toBeNull();
      expect(markOf(container)).toBeNull();
      // 되감기 트윈이 끝 자세(제자리)로 간다
      const rewind = host.__wingCrouch as gsap.core.Tween;
      expect(rewind.vars.x).toBe(0);
      expect(rewind.vars.scale).toBe(1);
    });

    it('disabled면 onClick이 불리지 않고 웅크리지도 날지도 않는다', async () => {
      const onClick = vi.fn();
      const user = userEvent.setup();
      const { container } = render(
        <WingButton disabled onClick={onClick}>
          보내기
        </WingButton>
      );
      fireEvent.pointerDown(button());
      await user.click(button());
      expect(onClick).not.toHaveBeenCalled();
      expect(hostOf(container).__wingCrouch).toBeUndefined();
      expect(layerOf()).toBeNull();
      expect(markOf(container)).toBeNull();
    });

    it('key를 바꿔 다시 그리면 원래 단추로 돌아온다', () => {
      const { container, rerender } = render(
        <WingButton key="a">보내기</WingButton>
      );
      fireEvent.click(button());
      rerender(<WingButton key="b">보내기</WingButton>);
      expect(markOf(container)).toBeNull();
      expect(layerOf()).toBeNull();
      expect(button()).toBeVisible();
    });

    it('폼 안의 submit 단추는 첫 click에서 제출되고 날아간 뒤에는 이중 제출되지 않는다', async () => {
      const onSubmit = vi.fn((event: FormEvent) => event.preventDefault());
      const user = userEvent.setup();
      const { container } = render(
        <form onSubmit={onSubmit}>
          <WingButton type="submit">보내기</WingButton>
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
      const { container } = render(<WingButton>보내기</WingButton>);
      const host = hostOf(container);
      const wrap = button().parentElement as HTMLElement;
      fireEvent.pointerDown(button());
      const press = host.__wingCrouch as gsap.core.Tween;
      expect(press.duration()).toBeCloseTo(gsapDuration.fast, 5);
      expect(press.vars.ease).toBe(gsapEasing.settle);
      act(() => void press.progress(1));
      expect(wrap.style.transform).toContain('translate(-2px, 2px)');
      expect(wrap.style.transform).toContain('scale(0.97');

      fireEvent.pointerCancel(button());
      const rewind = host.__wingCrouch as gsap.core.Tween;
      expect(rewind).not.toBe(press);
      act(() => void rewind.progress(1));
      expect(wrap.style.transform).not.toContain('-2px');
      expect(wrap.style.transform).not.toContain('0.97');
      // 날지 않았다
      expect(layerOf()).toBeNull();
      expect(markOf(container)).toBeNull();
    });

    it('pointerleave에도 되감긴다', () => {
      const { container } = render(<WingButton>보내기</WingButton>);
      const host = hostOf(container);
      const wrap = button().parentElement as HTMLElement;
      fireEvent.pointerDown(button());
      act(() => void (host.__wingCrouch as gsap.core.Tween).progress(1));
      fireEvent.pointerLeave(button());
      act(() => void (host.__wingCrouch as gsap.core.Tween).progress(1));
      expect(wrap.style.transform).not.toContain('-2px');
    });

    it('웅크린 중 다시 누르기는 무시한다', () => {
      const { container } = render(<WingButton>보내기</WingButton>);
      const host = hostOf(container);
      fireEvent.pointerDown(button());
      const first = host.__wingCrouch;
      fireEvent.pointerDown(button());
      expect(host.__wingCrouch).toBe(first);
    });

    it('주 단추가 아닌 누름에는 웅크리지 않는다(click이 오지 않아 눌린 채 남는다)', async () => {
      const user = userEvent.setup();
      const { container } = render(<WingButton>보내기</WingButton>);
      await user.pointer({ keys: '[MouseRight>]', target: button() });
      expect(hostOf(container).__wingCrouch).toBeUndefined();
    });
  });

  describe('박자와 비행', () => {
    const launch = () => {
      const view = render(<WingButton>보내기</WingButton>);
      fireEvent.click(button());
      const layer = layerOf() as HTMLElement;
      const craft = layer.firstElementChild as HTMLElement;
      const tl = hostOf(view.container).__wingTimeline as gsap.core.Timeline;
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
      expect(translateOf(craft).y).toBeCloseTo(wingBeat(1400, GEOMETRY).y, 3);
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
      render(<WingButton>보내기</WingButton>);
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
      const view = render(<WingButton onClick={onClick}>보내기</WingButton>);
      const original = button();
      fireEvent.click(original);
      const tl = hostOf(view.container).__wingTimeline as gsap.core.Timeline;
      act(() => void tl.time(1));
      fireEvent.click(original);
      fireEvent.click(original);
      expect(onClick).toHaveBeenCalledTimes(1);
      expect(hostOf(view.container).__wingTimeline).toBe(tl);
      expect(document.querySelectorAll('[data-wing-layer]')).toHaveLength(1);
      finish(tl);
      fireEvent.click(original);
      expect(onClick).toHaveBeenCalledTimes(1);
      expect(view.container.querySelectorAll('[data-wing-mark]')).toHaveLength(
        1
      );
      expect(markOf(view.container)).toHaveTextContent('보냈어요');
      expect(markOf(view.container)).toHaveStyle({ opacity: '1' });
      expect(screen.getByRole('status')).toHaveTextContent('보냈어요');
    });
  });

  // 장면을 그릴 three는 가리킬 때 불러온다. jsdom에는 WebGL2가 없으니 있는 것으로 보이게 하고, 불러오는 함수를 손으로 갈아 끼운다.
  describe('three 불러오기와 꼬리날개 없는 비행', () => {
    const withWebGL2 = () => vi.stubGlobal('WebGL2RenderingContext', class {});
    const counting = () => {
      const calls = { n: 0 };
      replaceThreeImporter(() => {
        calls.n += 1;
        return import('three');
      });
      return calls;
    };
    const failing = () => {
      const calls = { n: 0 };
      replaceThreeImporter(() => {
        calls.n += 1;
        return Promise.reject<ThreeModule>(new Error('network'));
      });
      return calls;
    };
    afterEach(() => {
      replaceThreeImporter();
      replaceWingSceneFactory();
    });

    it('가리키면(pointerenter) 불러오고 이미 불렀으면 포커스가 가도 다시 부르지 않는다', () => {
      withWebGL2();
      const calls = counting();
      render(<WingButton>보내기</WingButton>);
      expect(calls.n).toBe(0);
      fireEvent.pointerEnter(button());
      expect(calls.n).toBe(1);
      fireEvent.pointerEnter(button());
      fireEvent.focus(button());
      expect(calls.n).toBe(1);
    });

    it('포커스만으로도 불러온다', () => {
      withWebGL2();
      const calls = counting();
      render(<WingButton>보내기</WingButton>);
      fireEvent.focus(button());
      expect(calls.n).toBe(1);
    });

    it('소비자의 onPointerEnter와 onFocus도 불린다', () => {
      withWebGL2();
      counting();
      const onPointerEnter = vi.fn();
      const onFocus = vi.fn();
      render(
        <WingButton onPointerEnter={onPointerEnter} onFocus={onFocus}>
          보내기
        </WingButton>
      );
      fireEvent.pointerEnter(button());
      fireEvent.focus(button());
      expect(onPointerEnter).toHaveBeenCalledTimes(1);
      expect(onFocus).toHaveBeenCalledTimes(1);
    });

    it('실패한 뒤 다시 가리키면 다시 시도한다', async () => {
      withWebGL2();
      const calls = failing();
      render(<WingButton>보내기</WingButton>);
      fireEvent.pointerEnter(button());
      expect(calls.n).toBe(1);
      await act(async () => {});
      fireEvent.pointerEnter(button());
      expect(calls.n).toBe(2);
    });

    it('움직임 줄이기에서는 가리켜도 포커스가 가도 눌러도 부르지 않는다', () => {
      stubReducedMotion();
      withWebGL2();
      const calls = counting();
      render(<WingButton>보내기</WingButton>);
      fireEvent.pointerEnter(button());
      fireEvent.focus(button());
      fireEvent.click(button());
      expect(calls.n).toBe(0);
    });

    it('비활성이면 부르지 않는다', () => {
      withWebGL2();
      const calls = counting();
      render(<WingButton disabled>보내기</WingButton>);
      fireEvent.pointerEnter(button());
      fireEvent.focus(button());
      expect(calls.n).toBe(0);
    });

    it('WebGL2가 없으면 받지 않고 no-webgl2로 꼬리날개 없이 난다', async () => {
      const calls = counting();
      const { container } = render(<WingButton>보내기</WingButton>);
      fireEvent.pointerEnter(button());
      fireEvent.click(button());
      // 누른 순간 멈칫 없이 비행이 선다
      expect(layerOf()).not.toBeNull();
      expect(hostOf(container).__wingOutcome).toBeUndefined();
      await waitFor(() =>
        expect(hostOf(container).__wingOutcome?.status).toBe('no-webgl2')
      );
      expect(calls.n).toBe(0);
    });

    it('누르기 전에 받아 두었으면 ready이고 누른 뒤에 다시 받지 않는다', async () => {
      withWebGL2();
      // jsdom에는 WebGL이 없어 진짜 장면은 컨텍스트를 못 만들고 failed가 된다: ready 자체만 보려고 빈 장면을 끼운다
      replaceWingSceneFactory(() => ({
        canvas: document.createElement('canvas'),
        update: () => {},
        render: () => {},
        dispose: () => {},
      }));
      const calls = counting();
      const { container } = render(<WingButton>보내기</WingButton>);
      fireEvent.pointerEnter(button());
      await act(async () => {
        await import('three');
      });
      fireEvent.click(button());
      await waitFor(() =>
        expect(hostOf(container).__wingOutcome?.status).toBe('ready')
      );
      expect(calls.n).toBe(1);
    });

    it('불러오기가 실패하면 failed이고 꼬리날개 없이 날며 알림과 포커스 규칙은 같다', async () => {
      withWebGL2();
      failing();
      const { container } = render(<WingButton>보내기</WingButton>);
      button().focus();
      fireEvent.click(button());
      expect(layerOf()).not.toBeNull();
      await waitFor(() =>
        expect(hostOf(container).__wingOutcome?.status).toBe('failed')
      );
      expect(markOf(container)).toHaveFocus();
      expect(screen.getByRole('status')).toHaveTextContent('');
      finish(hostOf(container).__wingTimeline as gsap.core.Timeline);
      expect(layerOf()).toBeNull();
      expect(markOf(container)).toHaveFocus();
      expect(markOf(container)).toHaveStyle({ opacity: '1' });
    });

    it('300ms 안에 안 오면 timeout이고 나중에 와도 바뀌지 않는다', async () => {
      withWebGL2();
      let arrive: (three: ThreeModule) => void = () => {};
      replaceThreeImporter(
        () => new Promise<ThreeModule>((resolve) => (arrive = resolve))
      );
      const { container } = render(<WingButton>보내기</WingButton>);
      fireEvent.click(button());
      expect(hostOf(container).__wingOutcome).toBeUndefined();
      await waitFor(
        () => expect(hostOf(container).__wingOutcome?.status).toBe('timeout'),
        { timeout: 2000 }
      );
      arrive(await import('three'));
      await act(async () => {});
      expect(hostOf(container).__wingOutcome?.status).toBe('timeout');
      // 꼬리날개와 불꽃 없이 연기만으로 날아 상태 알림 규칙은 같다
      finish(hostOf(container).__wingTimeline as gsap.core.Timeline);
      expect(screen.getByRole('status')).toHaveTextContent('보냈어요');
    });
  });

  describe('포커스', () => {
    it('포커스가 있었으면 표지로 옮기고 표지에는 role이 없으며 알림 영역은 비어 있다(두 번 낭독 방지)', () => {
      const { container } = render(<WingButton>보내기</WingButton>);
      button().focus();
      fireEvent.click(button());
      finish(hostOf(container).__wingTimeline as gsap.core.Timeline);
      const label = markOf(container) as HTMLElement;
      expect(label).toHaveFocus();
      expect(label).toHaveAttribute('tabindex', '-1');
      expect(label).not.toHaveAttribute('role');
      expect(screen.getByRole('status')).toHaveTextContent('');
    });

    it('포커스가 없었으면 옮기지 않고, 마운트 때부터 있던 빈 알림 영역에 비행이 끝난 뒤 글이 들어간다', () => {
      const { container } = render(<WingButton>보내기</WingButton>);
      // 새로 삽입된 live 영역은 읽히지 않을 수 있어 처음부터 DOM에 있어야 한다
      const status = screen.getByRole('status');
      expect(status).toHaveTextContent('');
      expect(button()).not.toHaveFocus();
      fireEvent.click(button());
      expect(screen.getByRole('status')).toBe(status);
      expect(status).toHaveTextContent('');
      finish(hostOf(container).__wingTimeline as gsap.core.Timeline);
      const label = markOf(container) as HTMLElement;
      expect(label).not.toHaveFocus();
      expect(label).not.toHaveAttribute('role');
      expect(screen.getByRole('status')).toBe(status);
      expect(status).toHaveTextContent('보냈어요');
    });

    it('비행이 끝나도 포커스는 표지에 남는다', () => {
      const { container } = render(<WingButton>보내기</WingButton>);
      button().focus();
      fireEvent.click(button());
      finish(hostOf(container).__wingTimeline as gsap.core.Timeline);
      expect(markOf(container)).toHaveFocus();
    });
  });

  describe('움직임 줄이기', () => {
    it('로켓도 비행도 없이 단추가 표지로 교차 페이드한다', () => {
      stubReducedMotion();
      const { container } = render(<WingButton>보내기</WingButton>);
      const host = hostOf(container);
      const wrap = button().parentElement as HTMLElement;
      fireEvent.click(button());
      expect(layerOf()).toBeNull();
      expect(container.querySelector('[data-wing]')).toBeNull();
      const label = markOf(container) as HTMLElement;
      const tl = host.__wingTimeline as gsap.core.Timeline;
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
      const { container } = render(<WingButton>보내기</WingButton>);
      button().focus();
      fireEvent.click(button());
      expect(markOf(container)).toHaveFocus();
      expect(markOf(container)).not.toHaveAttribute('role');
    });

    it('웅크리지 않는다', () => {
      stubReducedMotion();
      const { container } = render(<WingButton>보내기</WingButton>);
      fireEvent.pointerDown(button());
      expect(hostOf(container).__wingCrouch).toBeUndefined();
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
      const { container } = render(<WingButton>보내기</WingButton>);
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
      const view = render(<WingButton container={stage}>보내기</WingButton>);
      fireEvent.click(button());
      const tl = hostOf(view.container).__wingTimeline as gsap.core.Timeline;
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
        expect(wingBeat(c.t, GEOMETRY).flame).toBeGreaterThan(0);
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
      const [left, right] = wingBeat(460, GEOMETRY).smokeAt;
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
      const beat = wingBeat(t, GEOMETRY);
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

  // 로켓 장면(3D)을 만들고 갱신하고 놓는 연결. jsdom에는 WebGL이 없어 장면 자리에 호출을 기록하는 손을 끼운다(replaceWingSceneFactory).
  // 장면의 모양은 wingScene.test.ts(WebGL 없이 장면 그래프)와 e2e(Chromium의 소프트웨어 WebGL 픽셀)가 본다.
  describe('3D 로켓', () => {
    const withWebGL2 = () => vi.stubGlobal('WebGL2RenderingContext', class {});
    const record = (fail = false) => {
      const log = {
        made: 0,
        updates: [] as WingInput[],
        renders: 0,
        disposed: 0,
      };
      replaceWingSceneFactory(() => {
        log.made += 1;
        if (fail) throw new Error('컨텍스트 생성 실패');
        const canvas = document.createElement('canvas');
        return {
          canvas,
          update: (input) => log.updates.push(input),
          render: () => (log.renders += 1),
          dispose: () => {
            log.disposed += 1;
            canvas.remove();
          },
        };
      });
      return log;
    };
    const wingCanvas = () =>
      document.querySelector<HTMLCanvasElement>('[data-wing-layer] canvas');
    const inputAt = (ms: number) => {
      const beat = wingBeat(ms, GEOMETRY);
      return {
        fins: beat.fins,
        flame: beat.flame,
      };
    };
    // 가리켜 three를 미리 받아 두고 누른다
    const pressWithThree = async (ui: ReturnType<typeof render>) => {
      fireEvent.pointerEnter(button());
      await act(async () => {
        await import('three');
      });
      fireEvent.click(button());
      // 시계를 세워 시험이 박자 시각을 정한다
      const tl = hostOf(ui.container).__wingTimeline as gsap.core.Timeline;
      tl.pause();
      await waitFor(() =>
        expect(hostOf(ui.container).__wingOutcome?.status).toBe('ready')
      );
      // GSAP 타임라인은 then을 가져 async 함수가 그대로 돌려주면 끝날 때까지 기다린다: 상자에 담아 돌려준다
      return { tl };
    };
    // three가 우리가 정한 때에 도착하게 한다
    const lateThree = () => {
      const gate = { arrive: (_three: ThreeModule) => {} };
      replaceThreeImporter(
        () => new Promise<ThreeModule>((resolve) => (gate.arrive = resolve))
      );
      return gate;
    };
    afterEach(() => {
      replaceWingSceneFactory();
      replaceThreeImporter();
    });

    it('three가 와 있으면 canvas가 비행 층의 단추 상자 맨 아래에 서고 같은 프레임의 박자 값으로 그린다', async () => {
      withWebGL2();
      const log = record();
      const ui = render(<WingButton>보내기</WingButton>);
      const { tl } = await pressWithThree(ui);
      expect(log.made).toBe(1);
      const canvas = wingCanvas() as HTMLCanvasElement;
      const craft = layerOf()?.firstElementChild as HTMLElement;
      // 단추 복제본 뒤에 깔린다
      expect(craft.firstElementChild).toBe(canvas);
      act(() => void tl.time(0.95));
      expect(log.updates.at(-1)).toMatchObject(inputAt(950));
      // 갱신마다 같은 프레임에 그린다(별도 루프 없음)
      expect(log.renders).toBe(log.updates.length);
    });

    it('비행이 끝나면 한 번 놓고 canvas가 사라진다', async () => {
      withWebGL2();
      const log = record();
      const ui = render(<WingButton>보내기</WingButton>);
      const { tl } = await pressWithThree(ui);
      expect(log.disposed).toBe(0);
      finish(tl);
      expect(log.disposed).toBe(1);
      expect(wingCanvas()).toBeNull();
      expect(layerOf()).toBeNull();
    });

    it('비행 중간에 언마운트해도 한 번 놓는다', async () => {
      withWebGL2();
      const log = record();
      const ui = render(<WingButton>보내기</WingButton>);
      await pressWithThree(ui);
      ui.unmount();
      expect(log.disposed).toBe(1);
      expect(wingCanvas()).toBeNull();
    });

    it('끝난 뒤 언마운트해도 두 번 놓지 않는다', async () => {
      withWebGL2();
      const log = record();
      const ui = render(<WingButton>보내기</WingButton>);
      const { tl } = await pressWithThree(ui);
      finish(tl);
      ui.unmount();
      expect(log.disposed).toBe(1);
    });

    it('300ms 안에 늦게 오면 온 시점의 박자 값으로 바로 그리기 시작한다', async () => {
      withWebGL2();
      const log = record();
      const gate = lateThree();
      const ui = render(<WingButton>보내기</WingButton>);
      fireEvent.click(button());
      const tl = hostOf(ui.container).__wingTimeline as gsap.core.Timeline;
      // 웅크림은 이미 돈다: 200ms 시점에 three가 도착한다
      tl.pause();
      act(() => void tl.time(0.2));
      expect(log.made).toBe(0);
      gate.arrive(await import('three'));
      await waitFor(() => expect(log.made).toBe(1));
      expect(inputAt(200).fins).toBeGreaterThan(0.5);
      expect(log.updates[0]).toMatchObject(inputAt(200));
      expect(log.renders).toBe(1);
    });

    it('언마운트한 뒤에 온 three로는 만들지 않는다', async () => {
      withWebGL2();
      const log = record();
      const gate = lateThree();
      const ui = render(<WingButton>보내기</WingButton>);
      fireEvent.click(button());
      ui.unmount();
      gate.arrive(await import('three'));
      await act(async () => {});
      expect(log.made).toBe(0);
    });

    it('렌더러 컨텍스트를 못 만들면 failed로 보고 꼬리날개 없이 날며 알림과 포커스 규칙은 같다', async () => {
      withWebGL2();
      const log = record(true);
      const ui = render(<WingButton>보내기</WingButton>);
      button().focus();
      fireEvent.pointerEnter(button());
      await act(async () => {
        await import('three');
      });
      fireEvent.click(button());
      await waitFor(() =>
        expect(hostOf(ui.container).__wingOutcome?.status).toBe('failed')
      );
      expect(log.made).toBe(1);
      expect(wingCanvas()).toBeNull();
      expect(layerOf()).not.toBeNull();
      expect(markOf(ui.container)).toHaveFocus();
      expect(screen.getByRole('status')).toHaveTextContent('');
      finish(hostOf(ui.container).__wingTimeline as gsap.core.Timeline);
      expect(layerOf()).toBeNull();
      expect(markOf(ui.container)).toHaveFocus();
      expect(log.disposed).toBe(0);
    });

    it.each(['update', 'render'] as const)(
      '비행 도중 %s가 던지면 그 비행에서 장면을 걷고 비행과 알림과 연기는 계속된다',
      async (method) => {
        withWebGL2();
        const log = { made: 0, disposed: 0, calls: 0 };
        replaceWingSceneFactory(() => {
          log.made += 1;
          const canvas = document.createElement('canvas');
          const boom = () => {
            log.calls += 1;
            // 만든 직후 첫 그리기는 지나고 비행 중 프레임에서 컨텍스트가 소실된 것처럼 던진다
            if (log.calls > 1) throw new Error('context lost');
          };
          return {
            canvas,
            update: () => (method === 'update' ? boom() : undefined),
            render: () => (method === 'render' ? boom() : undefined),
            dispose: () => {
              log.disposed += 1;
              canvas.remove();
            },
          };
        });
        const emits: number[] = [];
        replaceSmokeFactory(() => ({
          canvas: document.createElement('canvas'),
          emit: () => emits.push(1),
          burst: () => {},
          dispose: () => {},
        }));
        const ui = render(<WingButton>보내기</WingButton>);
        const { tl } = await pressWithThree(ui);
        expect(wingCanvas()).not.toBeNull();
        // 점화한 구간으로 보내면 tick이 던진다
        act(() => void tl.time(0.8));
        expect(log.disposed).toBe(1);
        expect(wingCanvas()).toBeNull();
        expect(hostOf(ui.container).__wingOutcome?.status).toBe('failed');
        // 비행과 연기는 이어진다
        expect(layerOf()).not.toBeNull();
        expect(emits.length).toBeGreaterThan(0);
        // 끝까지 가도 두 번 놓지 않고 알림은 같다
        finish(tl);
        expect(log.disposed).toBe(1);
        expect(layerOf()).toBeNull();
        expect(screen.getByRole('status')).toHaveTextContent('보냈어요');
        replaceSmokeFactory();
      }
    );

    it('three 불러오기가 실패하면 장면을 만들지 않는다', async () => {
      withWebGL2();
      const log = record();
      replaceThreeImporter(() => Promise.reject<ThreeModule>(new Error('x')));
      const ui = render(<WingButton>보내기</WingButton>);
      fireEvent.click(button());
      await waitFor(() =>
        expect(hostOf(ui.container).__wingOutcome?.status).toBe('failed')
      );
      expect(log.made).toBe(0);
      expect(wingCanvas()).toBeNull();
    });

    it('WebGL2가 없으면 장면을 만들지 않는다', async () => {
      const log = record();
      const ui = render(<WingButton>보내기</WingButton>);
      fireEvent.click(button());
      await waitFor(() =>
        expect(hostOf(ui.container).__wingOutcome?.status).toBe('no-webgl2')
      );
      expect(log.made).toBe(0);
      expect(wingCanvas()).toBeNull();
    });

    it('300ms가 지나서 온 three로는 만들지 않는다(timeout은 확정)', async () => {
      withWebGL2();
      const log = record();
      const gate = lateThree();
      const ui = render(<WingButton>보내기</WingButton>);
      fireEvent.click(button());
      await waitFor(
        () =>
          expect(hostOf(ui.container).__wingOutcome?.status).toBe('timeout'),
        { timeout: 2000 }
      );
      gate.arrive(await import('three'));
      await act(async () => {});
      expect(log.made).toBe(0);
      expect(wingCanvas()).toBeNull();
    });

    it('움직임 줄이기에서는 three를 받지도 장면을 만들지도 않는다', async () => {
      stubReducedMotion();
      withWebGL2();
      const log = record();
      render(<WingButton>보내기</WingButton>);
      fireEvent.pointerEnter(button());
      fireEvent.click(button());
      await act(async () => {});
      expect(log.made).toBe(0);
      expect(wingCanvas()).toBeNull();
    });

    it('smoke={false}여도 로켓은 그린다(연기만 없다)', async () => {
      withWebGL2();
      const log = record();
      const ui = render(<WingButton smoke={false}>보내기</WingButton>);
      await pressWithThree(ui);
      expect(log.made).toBe(1);
      expect(wingCanvas()).not.toBeNull();
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
      const { container } = render(<WingButton>보내기</WingButton>);
      expect(attempts).not.toHaveBeenCalled();
      fireEvent.click(button());
      expect(attempts).toHaveBeenCalledTimes(1);
      expect(attempts).toHaveBeenCalledWith('webgl2', expect.anything());
      expect(layerOf()).not.toBeNull();
      const tl = hostOf(container).__wingTimeline as gsap.core.Timeline;
      finish(tl);
      expect(layerOf()).toBeNull();
      expect(markOf(container)).toHaveStyle({ opacity: '1' });
    });

    it('smoke={false}면 엔진을 만들려 하지 않고 비행은 그대로다', () => {
      const attempts = contextAttempts();
      render(<WingButton smoke={false}>보내기</WingButton>);
      fireEvent.click(button());
      expect(attempts).not.toHaveBeenCalled();
      expect(layerOf()).not.toBeNull();
    });

    it('소비자 onClick이 막으면 엔진을 만들지 않는다', () => {
      const attempts = contextAttempts();
      render(
        <WingButton onClick={(event) => event.preventDefault()}>
          보내기
        </WingButton>
      );
      fireEvent.click(button());
      expect(attempts).not.toHaveBeenCalled();
    });
  });
});
