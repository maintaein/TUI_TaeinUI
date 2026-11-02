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
import {
  BEAT,
  BEAT_END,
  FLAME_MAX,
  NOZZLE_HEIGHT,
  FLAME_REACH,
  rocketBeat,
} from './rocketBeat';
import { replaceSmokeFactory } from './smokeEngine';

// RocketButton.tsx가 바깥 상자에 얹는 손잡이(BurstToggle의 타임라인 손잡이와 같은 모양).
type RocketHost = HTMLElement & {
  __rocketTimeline?: gsap.core.Timeline;
  __rocketCrouch?: gsap.core.Tween;
};

// 시험의 단추: 폭 120, 높이 44, 레이어 위에서 200px 아래라 발사 거리는 200 + 44 + FLAME_REACH다
const GEOMETRY_AT_CLICK = {
  width: 120,
  height: 44,
  distance: 200 + 44 + FLAME_REACH,
};
const button = (name: string | RegExp = '보내기') =>
  screen.getByRole('button', { name });
const hostOf = (container: HTMLElement) =>
  container.firstElementChild as RocketHost;
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

    it('발사 거리는 단추 윗면이 레이어 위 가장자리를 넘고 불꽃 끝까지 나가는 거리다', () => {
      // 레이어 안에서 단추 위쪽까지 200px(화면 전체), 단추 높이 44
      const climbed = (boxTop: number | null) => {
        const stage = document.createElement('div');
        if (boxTop !== null) {
          Object.defineProperty(stage, 'getBoundingClientRect', {
            value: () => ({ ...scaledRect(1), top: boxTop }),
          });
          document.body.appendChild(stage);
        }
        const view = render(
          <RocketButton container={stage}>보내기</RocketButton>
        );
        fireEvent.click(button());
        const tl = hostOf(view.container)
          .__rocketTimeline as gsap.core.Timeline;
        const craft = layerOf(stage)?.firstElementChild as HTMLElement;
        act(() => void tl.time(BEAT.sent / 1000));
        const y = translateOf(craft).y;
        view.unmount();
        stage.remove();
        return -y;
      };
      // 상자 위가 창 위와 같다(0): 단추까지 200, 단추 높이 44, 불꽃 FLAME_REACH
      expect(climbed(0)).toBeCloseTo(200 + 44 + FLAME_REACH, 0);
      // 상자가 100 아래에 있다: 단추까지 100이라 그만큼 짧다
      expect(climbed(100)).toBeCloseTo(100 + 44 + FLAME_REACH, 0);
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

    it('시계 하나가 0에서 끝까지 돌며 단추를 박자 함수대로 움직인다(제자리에서 분출하다 발사)', () => {
      const { craft, tl, at } = launch();
      expect(tl.duration()).toBeCloseTo(BEAT_END / 1000, 5);
      [0, 300, BEAT.build, 1500, BEAT.launch, 3500, 4200, 4900].forEach((t) => {
        at(t);
        const want = rocketBeat(t, GEOMETRY_AT_CLICK);
        expect(translateOf(craft).x).toBeCloseTo(want.x, 2);
        expect(translateOf(craft).y).toBeCloseTo(want.y, 2);
      });
      // 발사 전에는 단추 높이 그대로다(떠오르거나 둥실거리지 않는다)
      for (const t of [100, 800, 1500, 2500]) {
        at(t);
        expect(translateOf(craft)).toEqual({ x: 0, y: 0 });
      }
    });

    it('발사는 처음엔 곧게 위로 가다 오른쪽으로 휘며 윗면이 속도 방향을 따라 최대 20deg 기울고 작아진다', () => {
      const { craft, at } = launch();
      const rotation = () =>
        Number(/rotate\((-?[\d.]+)deg\)/.exec(craft.style.transform)?.[1] ?? 0);
      at(BEAT.launch);
      expect(translateOf(craft).x).toBeCloseTo(0, 5);
      expect(rotation()).toBe(0);
      at(BEAT.launch + 400);
      const early = rotation();
      expect(early).toBeLessThan(2);
      at(4500);
      expect(rotation()).toBeGreaterThan(early);
      at(BEAT.sent);
      expect(translateOf(craft).x).toBeGreaterThan(0);
      expect(rotation()).toBeCloseTo(20, 5);
      expect(craft.style.transform).toContain('scale(0.85');
    });

    it('분사구는 단추 아래 테두리에서 시작하는 잘림 상자 안에서 내려와 몸체 위로는 나오지 않는다', () => {
      const { craft, at } = launch();
      const clips = [
        ...craft.querySelectorAll<HTMLElement>('[data-rocket-nozzle]'),
      ];
      expect(clips).toHaveLength(2);
      const run = 44 * NOZZLE_HEIGHT;
      for (const clip of clips) {
        // 잘림 상자는 단추 밑면(top = 높이)에서 시작해 아래로만 있다
        expect(clip.style.top).toBe('44px');
        expect(parseFloat(clip.style.height)).toBeCloseTo(run, 5);
      }
      const bodies = [
        ...craft.querySelectorAll<HTMLElement>('[data-rocket-nozzle-body]'),
      ];
      const shiftY = (el: HTMLElement) =>
        Number(
          /translate\(0px, (-?[\d.]+)px\)/.exec(el.style.transform)?.[1] ?? 0
        );
      // 처음엔 상자 높이만큼 위에 숨어 있고(전부 잘려 안 보임) 서서히 내려와 build에서 제자리다
      const shifts = [0, 100, 200, 300, 400, 500, BEAT.build].map((t) => {
        at(t);
        return shiftY(bodies[0]);
      });
      expect(shifts[0]).toBeCloseTo(-run, 5);
      for (let i = 1; i < shifts.length; i++)
        expect(shifts[i]).toBeGreaterThan(shifts[i - 1]);
      expect(shifts.at(-1)).toBeCloseTo(0, 5);
      // 위로 숨는 쪽만 있다: 아래로 더 나가는 일은 없다
      expect(Math.max(...shifts)).toBeLessThanOrEqual(0.0001);
      expect(shiftY(bodies[1])).toBe(shiftY(bodies[0]));
    });

    it('분사구 둘과 불꽃 둘이 복제본 안에 있고 불꽃은 scaleY로만 길이가 바뀐다', () => {
      const { craft, at } = launch();
      const flames = [
        ...craft.querySelectorAll<HTMLElement>('[data-rocket-flame]'),
      ];
      expect(flames).toHaveLength(2);
      expect(craft.querySelectorAll('[data-rocket-nozzle]')).toHaveLength(2);
      // 불꽃, 분사구 순으로 단추 앞에 깔린다(문서 순서)
      const order = [...craft.children].map((node) =>
        node.hasAttribute('data-rocket-flame')
          ? 'flame'
          : node.hasAttribute('data-rocket-nozzle')
            ? 'nozzle'
            : 'clone'
      );
      expect(order).toEqual(['flame', 'flame', 'nozzle', 'nozzle', 'clone']);
      const scaleY = (el: HTMLElement) =>
        Number(/scale\(1, ?([\d.]+)\)/.exec(el.style.transform)?.[1] ?? NaN);
      at(BEAT.build);
      expect(scaleY(flames[0])).toBe(0);
      at(BEAT.build + 800);
      const building = scaleY(flames[0]);
      expect(building).toBeGreaterThan(0);
      at(BEAT.launch - 10);
      const lit = scaleY(flames[0]);
      expect(lit).toBeGreaterThan(building);
      at(4800);
      expect(scaleY(flames[0])).toBeGreaterThan(lit);
      expect(scaleY(flames[0])).toBeLessThanOrEqual(1);
      expect(scaleY(flames[1])).toBe(scaleY(flames[0]));
      // 레이아웃 속성(높이)은 건드리지 않는다
      expect(flames[0].style.height).toBe(`${FLAME_MAX}px`);
    });

    it('눌렀다 뗀 click이면 복제본은 웅크린 자세로 이어받는다', () => {
      render(<RocketButton>보내기</RocketButton>);
      fireEvent.pointerDown(button());
      fireEvent.click(button());
      const craft = layerOf()?.firstElementChild as HTMLElement;
      expect(craft.style.transform).toContain('translate(-2px, 2px)');
      expect(craft.style.transform).toContain('scale(0.97');
    });

    it('표지는 비행이 끝나는 5000ms에야 떠오르기 시작하고 그 순간 레이어를 걷는다', () => {
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
      expect(document.querySelector('[data-rocket-flame]')).toBeNull();
      expect(document.querySelector('[data-rocket-nozzle]')).toBeNull();
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

  // 박자 함수가 주는 연기(발사대, 불꽃 끝)를 엔진 emit으로 바꾸는 연결을 시험한다. jsdom에는 엔진이 없어
  // 엔진 자리에 emit 호출을 기록하는 손을 끼운다(replaceSmokeFactory).
  describe('연기 내뿜기', () => {
    type Call = { x: number; y: number; vx: number; vy: number; t: number };
    const record = () => {
      const calls: Call[] = [];
      const now = { t: 0 };
      replaceSmokeFactory(() => ({
        canvas: document.createElement('canvas'),
        emit: (x, y, vx, vy) => calls.push({ x, y, vx, vy, t: now.t }),
        burst: () => {
          throw new Error('이륙 터짐은 없다');
        },
        dispose: () => {},
      }));
      return { calls, now };
    };
    afterEach(() => replaceSmokeFactory());

    // 10ms씩 시계를 보내며 엔진 호출을 모은다
    const fly = () => {
      const { calls, now } = record();
      const view = render(<RocketButton>보내기</RocketButton>);
      fireEvent.click(button());
      const tl = hostOf(view.container).__rocketTimeline as gsap.core.Timeline;
      for (let ms = 0; ms <= BEAT_END; ms += 10) {
        now.t = ms;
        act(() => void tl.time(ms / 1000));
      }
      view.unmount();
      return calls;
    };
    // 단추 상자의 중심(jsdom에서 BUTTON_RECT). 박자가 주는 자리는 이 중심 기준이다
    const center = {
      x: BUTTON_RECT.left + BUTTON_RECT.width / 2,
      y: BUTTON_RECT.top + BUTTON_RECT.height / 2,
    };

    // 땅 연기는 양옆으로 구르는 것(vy 0), 꼬리 연기는 몸체 아래로 나가는 것(vy > 0)이다
    const split = (calls: ReturnType<typeof fly>) => ({
      ground: calls.filter((c) => c.vy === 0),
      tail: calls.filter((c) => c.vy > 0),
    });

    it('분출이 시작되기 전(분사구가 나오는 동안)과 보냈어요(5000ms 뒤)에는 내보내지 않는다', () => {
      const calls = fly();
      expect(calls.length).toBeGreaterThan(0);
      expect(calls.filter((c) => c.t <= BEAT.build)).toEqual([]);
      expect(calls.filter((c) => c.t >= BEAT.sent)).toEqual([]);
      // build가 시작되고 첫 프레임부터 나온다
      expect(Math.min(...calls.map((c) => c.t))).toBe(BEAT.build + 10);
    });

    it('땅 연기는 두 분사구 아래 땅에서 양옆으로 박자 함수가 정한 간격마다 비행이 끝날 때까지 내보낸다', () => {
      const { ground } = split(fly());
      const times = [...new Set(ground.map((c) => c.t))];
      times.forEach((t, i) => {
        const at = ground.filter((c) => c.t === t);
        expect(at).toHaveLength(2);
        const beat = rocketBeat(t, GEOMETRY_AT_CLICK);
        at.forEach((c, k) => {
          expect(c.x).toBeCloseTo(center.x + beat.smoke.ground.puffs[k].x, 3);
          expect(c.y).toBeCloseTo(center.y + beat.smoke.ground.puffs[k].y, 3);
        });
        expect([at[0].vx, at[1].vx]).toEqual([-320, 320]);
        if (i > 0)
          expect(t - times[i - 1]).toBeGreaterThanOrEqual(
            beat.smoke.ground.gap
          );
      });
      // 땅은 비행 내내 같은 높이다: 연기 자리 y가 모두 같고 비행 중에도 계속 나온다
      expect(new Set(ground.map((c) => c.y)).size).toBe(1);
      expect(
        ground.filter((c) => c.t >= BEAT.launch + 1500).length
      ).toBeGreaterThan(0);
      // 빈도가 폭주하지 않는다(매 프레임이면 무대가 덮인다)
      expect(times.length).toBeLessThan(BEAT.sent / 90);
    });

    it('땅 연기는 올라갈수록 뜸해진다', () => {
      const { ground } = split(fly());
      const times = [...new Set(ground.map((c) => c.t))];
      const count = (from: number, to: number) =>
        times.filter((t) => t >= from && t < to).length;
      // 같은 길이(800ms)의 구간: 분출이 다 오른 발사 직전이 높이 오른 끝보다 촘촘하다
      expect(count(BEAT.launch - 800, BEAT.launch)).toBeGreaterThan(
        count(BEAT.sent - 800, BEAT.sent)
      );
    });

    it('발사 중에는 꼬리 연기가 불꽃 끝에서 몸체 아래 방향(진행 반대쪽)으로 한 방울씩 나가고 땅 연기보다 적다', () => {
      const calls = fly();
      const { tail, ground } = split(calls);
      expect(tail.length).toBeGreaterThan(0);
      expect(tail.every((c) => c.t >= BEAT.launch)).toBe(true);
      const times = [...new Set(tail.map((c) => c.t))];
      times.forEach((t, i) => {
        expect(tail.filter((c) => c.t === t)).toHaveLength(1);
        if (i > 0) expect(t - times[i - 1]).toBeGreaterThanOrEqual(70);
      });
      const t = times.find((time) => time >= 4000)!;
      const c = tail.find((call) => call.t === t)!;
      const puff = rocketBeat(t, GEOMETRY_AT_CLICK).smoke.tail.puffs[0];
      expect(c.x).toBeCloseTo(center.x + puff.x, 3);
      expect(c.y).toBeCloseTo(center.y + puff.y, 3);
      expect([c.vx, c.vy]).toEqual([puff.vx, puff.vy]);
      // 시계 방향으로 기운 몸체의 아래는 왼쪽 아래다
      for (const call of tail.filter((call) => call.t >= 4000))
        expect(call.vx).toBeLessThan(0);
      // 발사 구간에서 땅 연기 방울 수가 꼬리 방울 수보다 많다
      expect(ground.filter((g) => g.t >= BEAT.launch).length).toBeGreaterThan(
        tail.length
      );
    });

    it('불꽃 끝이 비행 층 위로 나가면 연기를 내보내지 않는다(아래로 밀려 무대로 쏟아진다)', () => {
      const calls = fly();
      expect(calls.every((c) => c.y >= 0)).toBe(true);
      // 나가기 전에는 내보냈다
      expect(calls.some((c) => c.vy > 0 && c.t >= 4000)).toBe(true);
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

    it('smoke={false}면 엔진을 만들려 하지 않고 움직임과 불꽃은 그대로다', () => {
      const attempts = contextAttempts();
      const { container } = render(
        <RocketButton smoke={false}>보내기</RocketButton>
      );
      fireEvent.click(button());
      expect(attempts).not.toHaveBeenCalled();
      expect(layerOf()).not.toBeNull();
      const tl = hostOf(container).__rocketTimeline as gsap.core.Timeline;
      act(() => void tl.time(4500 / 1000));
      const craft = layerOf()?.firstElementChild as HTMLElement;
      expect(translateOf(craft).y).toBeLessThan(-20);
      expect(layerOf()?.querySelectorAll('[data-rocket-flame]')).toHaveLength(
        2
      );
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
