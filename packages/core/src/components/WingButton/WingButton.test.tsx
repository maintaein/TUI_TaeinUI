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
import { WingButton } from './WingButton';
import { gsapDuration, gsapEasing } from '../../tokens/gsapEasing';

// WingButton.tsx가 바깥 상자에 얹는 손잡이(StampButton의 __stampTimeline과 같은 모양).
type WingHost = HTMLElement & {
  __wingTimeline?: gsap.core.Timeline;
  __wingCrouch?: gsap.core.Tween;
};

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

    it('이륙 거리는 container의 가까운 가장자리를 넘어 왼쪽 날개 끝까지 나가는 거리다', () => {
      // 단추는 레이어 안 (100, 200), 높이 44. 위쪽으로 나가려면 200 + 44, 오른쪽이면 폭 - 100. 날개 길이는 높이의 1.2배
      const wing = 44 * 1.2;
      const takeoffX = (width: number) => {
        const stage = document.createElement('div');
        Object.defineProperty(stage, 'clientWidth', { value: width });
        Object.defineProperty(stage, 'clientHeight', { value: 600 });
        document.body.appendChild(stage);
        const view = render(<WingButton container={stage}>보내기</WingButton>);
        fireEvent.click(button());
        const tl = hostOf(view.container).__wingTimeline as gsap.core.Timeline;
        const craft = layerOf(stage)?.firstElementChild as HTMLElement;
        const fly = tweensOf(tl, craft).find(
          (t) => t.vars.y !== undefined && t.vars.y !== 0
        );
        view.unmount();
        stage.remove();
        return fly?.vars.x as number;
      };
      // 위가 가깝다(상자 폭 1000): 244 + 날개
      expect(takeoffX(1000)).toBeCloseTo(244 + wing, 5);
      // 오른쪽이 가깝다(상자 폭 150): 50 + 날개
      expect(takeoffX(150)).toBeCloseTo(50 + wing, 5);
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

  describe('날개와 비행', () => {
    const launch = () => {
      const view = render(<WingButton>보내기</WingButton>);
      fireEvent.click(button());
      const layer = layerOf() as HTMLElement;
      const craft = layer.firstElementChild as HTMLElement;
      const tl = hostOf(view.container).__wingTimeline as gsap.core.Timeline;
      return { ...view, layer, craft, tl };
    };

    it('날개는 양 끝에 둘이고 깃털이 네 장씩이다', () => {
      const { layer } = launch();
      const wings = layer.querySelectorAll('[data-wing]');
      expect(Array.from(wings).map((w) => w.getAttribute('data-side'))).toEqual(
        ['left', 'right']
      );
      wings.forEach((w) =>
        expect(w.querySelectorAll('svg [data-feather]')).toHaveLength(4)
      );
    });

    it('깃털은 snap으로 접힌 자세에서 부채로 펴진다', () => {
      const { layer, tl } = launch();
      const feathers = Array.from(layer.querySelectorAll('[data-feather]'));
      const unfurl = tweensOf(tl, feathers[0]).find(
        (t) => t.vars.rotation !== undefined
      ) as gsap.core.Tween;
      expect(unfurl.vars.ease).toBe(gsapEasing.snap);
      // 접힌 자세(처음)와 펴진 자세(끝)가 다르다
      tl.progress(0);
      const pose = () => feathers.map((f) => (f as SVGElement).style.transform);
      const folded = pose();
      tl.progress(1);
      const spread = pose();
      expect(new Set(folded.slice(0, 4)).size).toBe(1);
      expect(new Set(spread.slice(0, 4)).size).toBe(4);
      expect(spread[0]).toContain('rotate(-68deg)');
    });

    it('웅크린 자세로 시작해 snap으로 풀린 뒤 이륙한다(exit, 0.8초, 기울기 -15deg, 0.6배)', () => {
      const { craft, tl } = launch();
      const tweens = tweensOf(tl, craft);
      const release = tweens.find((t) => t.vars.scale === 1);
      expect(release?.vars.ease).toBe(gsapEasing.snap);
      expect(release?.startTime()).toBe(0);

      const fly = tweens.find((t) => t.vars.y !== undefined && t.vars.y !== 0);
      expect(fly?.vars.ease).toBe(gsapEasing.exit);
      expect(fly?.duration()).toBeCloseTo(gsapDuration.base * 4, 5);
      expect(fly?.startTime()).toBeCloseTo(gsapDuration.base * 3, 5);
      // 오른쪽 위: x는 늘고 y는 준다. 45도
      expect(fly?.vars.x as number).toBeGreaterThan(0);
      expect(fly?.vars.y as number).toBe(-(fly?.vars.x as number));

      const tilt = tweens.find((t) => t.vars.rotation !== undefined);
      expect(tilt?.vars.rotation).toBe(-15);
      const shrink = tweens.find((t) => t.vars.scale === 0.6);
      expect(shrink?.duration()).toBeCloseTo(gsapDuration.base * 4, 5);
      expect(shrink?.startTime()).toBeCloseTo(gsapDuration.base * 3, 5);

      tl.progress(0);
      expect(craft.style.transform).toContain('translate(-2px, 2px)');
      tl.progress(1);
      expect(craft.style.transform).toContain('rotate(-15deg)');
      expect(craft.style.transform).toContain('scale(0.6');
    });

    it('날개는 ±20deg로 한 번에 base씩 퍼덕이고 이륙 중에도 이어진다', () => {
      const { layer, tl } = launch();
      const [left, right] = Array.from(layer.querySelectorAll('[data-wing]'));
      const flapR = tweensOf(tl, right)[1];
      const flapL = tweensOf(tl, left)[1];
      expect(flapR.vars.rotation).toBe(20);
      expect(flapL.vars.rotation).toBe(-20);
      expect(flapR.vars.yoyo).toBe(true);
      expect(flapR.vars.ease).toBe(gsapEasing.drift);
      // 한 번(왕복)이 base
      expect(flapR.duration() * 2).toBeCloseTo(gsapDuration.base, 5);
      // 웅크림 뒤 세 번(0.6초)에 이륙 중까지 이어져 전체 길이를 덮는다
      expect(flapR.totalDuration()).toBeCloseTo(gsapDuration.base * 7, 5);
    });

    it('표지는 비행이 끝난 뒤에야 settle로 떠오르고 그 전에는 보이지 않으며 그 순간 레이어를 걷는다', () => {
      const { container, tl } = launch();
      const label = markOf(container) as HTMLElement;
      const fade = tweensOf(tl, label)[0];
      const landing = gsapDuration.base * 7;
      expect(fade.vars.ease).toBe(gsapEasing.settle);
      expect(fade.startTime()).toBeCloseTo(landing, 5);
      expect(fade.endTime()).toBeCloseTo(tl.duration(), 5);
      // 비행이 끝나기 직전까지 표지는 투명하고 복제본이 날고 있다
      act(() => void tl.time(landing - 0.01));
      expect(label.style.opacity).toBe('0');
      expect(layerOf()).not.toBeNull();
      act(() => void tl.time(landing));
      expect(layerOf()).toBeNull();
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
    it('날개도 비행도 없이 단추가 표지로 교차 페이드한다', () => {
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
});
