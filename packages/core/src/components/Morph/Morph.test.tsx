import { createRef, StrictMode, type ReactNode } from 'react';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { render } from '@testing-library/react';
import { Morph } from './Morph';
import { gsapDuration } from '../../tokens/gsapEasing';

// Morph.tsx가 래퍼에 얹는 손잡이(StampButton의 __stampTimeline과 같은 모양).
type MorphHost = HTMLElement & { __morphTimeline?: gsap.core.Timeline };

const SHAPE = gsapDuration.slower * 1.2;

interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}
const CARD: Box = { left: 100, top: 200, width: 80, height: 40 };
const PANEL: Box = { left: 300, top: 100, width: 400, height: 300 };
const BOXES: Record<string, Box> = { card: CARD, panel: PANEL };
const NO_BOX: Box = { left: 0, top: 0, width: 0, height: 0 };

/** transform 문자열에서 `fn(a, b)`의 두 수를 읽는다. 없거나 하나뿐이면 fallback(scale(s)는 두 축이 같다). */
const pairOf = (t: string, re: RegExp, fallback: number): [number, number] => {
  const [a, b] = (re.exec(t)?.[1] ?? '').split(',').map(parseFloat);
  const first = Number.isNaN(a) || a === undefined ? fallback : a;
  return [
    first,
    b === undefined || Number.isNaN(b)
      ? fallback === 1
        ? first
        : fallback
      : b,
  ];
};

/**
 * jsdom은 레이아웃이 없어 getBoundingClientRect가 늘 0이다. 이 환경에 없는 값을 넣어 준다:
 * 래퍼(또는 그 첫 자식)의 data-box가 쉬는 사각형이고, 래퍼에 GSAP이 건 translate와 scale은 중심 기준으로 반영해
 * 브라우저처럼 "지금 보이는 사각형"을 돌려준다.
 */
const installLayout = () => {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(
    function (this: Element) {
      const host = this as HTMLElement;
      const key =
        host.dataset.box ??
        (host.firstElementChild as HTMLElement | null)?.dataset.box;
      const base = (key && BOXES[key]) || NO_BOX;
      const t = host.style?.transform ?? '';
      const [tx, ty] = pairOf(t, /translate\(([^)]*)\)/, 0);
      const [sx, sy] = pairOf(t, /scale\(([^)]*)\)/, 1);
      const width = base.width * sx;
      const height = base.height * sy;
      const left = base.left + base.width / 2 + tx - width / 2;
      const top = base.top + base.height / 2 + ty - height / 2;
      return {
        left,
        top,
        width,
        height,
        x: left,
        y: top,
        right: left + width,
        bottom: top + height,
        toJSON: () => ({}),
      } as DOMRect;
    }
  );
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

// jsdom에는 offsetParent가 늘 null이다. GSAP이 그런 요소의 transform을 읽을 때 요소를 문서 루트로 옮겼다 되돌려
// 포커스를 잃게 하므로, 레이아웃이 있는 것처럼 부모를 돌려준다(StampButton 시험의 선례).
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
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const cardStyle = {
  borderTopLeftRadius: '12px',
  backgroundColor: 'rgb(255, 0, 0)',
};
const panelStyle = {
  borderTopLeftRadius: '20px',
  backgroundColor: 'rgb(0, 0, 255)',
};

const Card = ({ children }: { children?: ReactNode }) => (
  <div data-box="card" style={cardStyle}>
    <button type="button">카드</button>
    {children}
  </div>
);
const Panel = () => (
  <div data-box="panel" style={panelStyle}>
    <button type="button">닫기</button>
  </div>
);

/** 두 자리: 카드 Morph가 사라지고 같은 id의 패널 Morph가 나타난다. */
const Scene = ({ open }: { open: boolean }) => (
  <>
    {!open && (
      <Morph morphId="m">
        <Card />
      </Morph>
    )}
    {open && (
      <Morph morphId="m">
        <Panel />
      </Morph>
    )}
  </>
);

const wrapper = (container: HTMLElement) =>
  container.querySelector('[data-morph-id]') as MorphHost;
const timelineOf = (container: HTMLElement) =>
  wrapper(container).__morphTimeline as gsap.core.Timeline;
/** GSAP이 건 transform에서 이동과 배율을 읽는다. */
const transformOf = (el: HTMLElement) => {
  const [x, y] = pairOf(el.style.transform, /translate\(([^)]*)\)/, 0);
  const [sx, sy] = pairOf(el.style.transform, /scale\(([^)]*)\)/, 1);
  return { x, y, sx, sy };
};

describe('Morph', () => {
  describe('짝이 없으면 아무것도 하지 않는다', () => {
    it('처음 마운트에는 인라인 스타일도 타임라인도 없다', () => {
      installLayout();
      const { container } = render(<Scene open={false} />);
      const el = wrapper(container);
      expect(el.getAttribute('style')).toBeNull();
      expect(el.__morphTimeline).toBeUndefined();
    });

    it('morphId가 다르면 이어받지 않는다', () => {
      installLayout();
      const { container, rerender } = render(
        <Morph morphId="one">
          <Card />
        </Morph>
      );
      rerender(
        <Morph morphId="two">
          <Panel />
        </Morph>
      );
      expect(wrapper(container).__morphTimeline).toBeUndefined();
    });

    it('사각형을 못 읽으면(크기 0) 움직임 없이 그대로 선다', () => {
      // 레이아웃을 보급하지 않은 jsdom 기본값
      const { container, rerender } = render(<Scene open={false} />);
      rerender(<Scene open />);
      expect(wrapper(container).__morphTimeline).toBeUndefined();
      expect(wrapper(container).getAttribute('style')).toBeNull();
    });
  });

  describe('이전 모양에서 출발해 제 모습으로 간다', () => {
    it('새 래퍼가 이전 요소의 중심 이동, 배율, 둥글기, 배경색에서 시작한다', () => {
      installLayout();
      const { container, rerender } = render(<Scene open={false} />);
      rerender(<Scene open />);
      const el = wrapper(container);
      // 카드 중심 (140, 220), 패널 중심 (500, 250)
      const { x, y, sx, sy } = transformOf(el);
      expect(x).toBeCloseTo(-360, 3);
      expect(y).toBeCloseTo(-30, 3);
      expect(sx).toBeCloseTo(80 / 400, 3);
      expect(sy).toBeCloseTo(40 / 300, 3);
      // 확대 전 둥글기 12px가 평균 배율 1/6으로 나뉘어, 배율을 곱한 화면에서 12px로 보인다
      expect(parseFloat(el.style.borderTopLeftRadius)).toBeCloseTo(72, 0);
      expect(el.style.backgroundColor).toBe('rgb(255, 0, 0)');
    });

    it('내용은 형태가 바뀌는 동안 투명하고 그 뒤에 떠오른다', () => {
      installLayout();
      const { container, rerender } = render(<Scene open={false} />);
      rerender(<Scene open />);
      const tl = timelineOf(container);
      const content = wrapper(container).firstElementChild as HTMLElement;
      expect(content.style.opacity).toBe('0');
      // 내용의 CSS transition(Card 등)이 인라인 opacity를 한 박자 늦게 따라와 비치지 않도록 움직이는 동안 끈다
      expect(content.style.transition).toBe('none');
      expect(wrapper(container).style.transition).toBe('none');
      tl.time(SHAPE * 0.99);
      expect(content.style.opacity).toBe('0');
      tl.time(SHAPE + gsapDuration.slow / 2);
      expect(Number(content.style.opacity)).toBeGreaterThan(0);
      expect(Number(content.style.opacity)).toBeLessThan(1);
    });

    it('형태가 끝나면 새 요소의 둥글기와 배경색에 닿고, 다 끝나면 인라인 값을 걷는다', () => {
      installLayout();
      const { container, rerender } = render(<Scene open={false} />);
      rerender(<Scene open />);
      const el = wrapper(container);
      timelineOf(container).time(SHAPE);
      expect(el.style.backgroundColor).toBe('rgb(0, 0, 255)');
      expect(parseFloat(el.style.borderTopLeftRadius)).toBeCloseTo(20, 3);
      expect(transformOf(el)).toMatchObject({ x: 0, y: 0, sx: 1, sy: 1 });

      timelineOf(container).progress(1);
      expect(el.style.transform).toBe('');
      expect(el.style.borderTopLeftRadius).toBe('');
      expect(el.style.backgroundColor).toBe('');
      expect((el.firstElementChild as HTMLElement).style.opacity).toBe('');
      expect((el.firstElementChild as HTMLElement).style.transition).toBe('');
      expect(el.style.transition).toBe('');
    });

    it('위치와 크기는 transform으로만 바꾸고 레이아웃 속성은 건드리지 않는다', () => {
      installLayout();
      const { container, rerender } = render(<Scene open={false} />);
      rerender(<Scene open />);
      const el = wrapper(container);
      for (const t of [0, SHAPE / 2, SHAPE]) {
        timelineOf(container).time(t);
        for (const prop of ['width', 'height', 'top', 'left']) {
          expect(el.style.getPropertyValue(prop)).toBe('');
        }
      }
    });

    it('같은 Morph 안에서 children의 종류가 바뀌어도 이어받는다', () => {
      installLayout();
      const { container, rerender } = render(
        <Morph morphId="m">
          <Card />
        </Morph>
      );
      rerender(
        <Morph morphId="m">
          <Panel />
        </Morph>
      );
      expect(transformOf(wrapper(container)).sx).toBeCloseTo(0.2, 3);
    });

    it('같은 종류와 key로 다시 그려지면 이어받지 않고 래퍼도 그대로다', () => {
      installLayout();
      const { container, rerender } = render(
        <Morph morphId="m">
          <Card />
        </Morph>
      );
      const first = wrapper(container);
      rerender(
        <Morph morphId="m">
          <Card>바뀐 내용</Card>
        </Morph>
      );
      expect(wrapper(container)).toBe(first);
      expect(first.__morphTimeline).toBeUndefined();
    });
  });

  describe('포커스', () => {
    it('이전 요소 안에 포커스가 있었으면 새 래퍼의 첫 포커스 가능 자손으로 옮긴다', () => {
      installLayout();
      const { container, rerender } = render(<Scene open={false} />);
      (container.querySelector('button') as HTMLButtonElement).focus();
      rerender(<Scene open />);
      // 내용이 inert인 형태 변화 동안은 래퍼가 포커스를 맡아 body로 떨어지지 않는다
      expect(document.activeElement).toBe(wrapper(container));
      timelineOf(container).progress(1);
      expect(document.activeElement).toBe(container.querySelector('button'));
      expect(document.activeElement?.textContent).toBe('닫기');
    });

    it('형태가 바뀌는 동안 내용은 inert라 단추가 포커스를 받지 못하고 끝나면 원래대로다', () => {
      installLayout();
      const { container, rerender } = render(<Scene open={false} />);
      rerender(<Scene open />);
      const content = wrapper(container).firstElementChild as HTMLElement;
      expect(content).toHaveAttribute('inert');
      expect(wrapper(container)).not.toHaveAttribute('inert');
      timelineOf(container).progress(1);
      expect(content).not.toHaveAttribute('inert');
    });

    it('원래 inert였던 내용은 끝나도 inert로 남는다', () => {
      installLayout();
      const { container, rerender } = render(
        <Morph morphId="m">
          <Card />
        </Morph>
      );
      rerender(
        <Morph morphId="m">
          <div data-box="panel" inert>
            <button type="button">닫기</button>
          </div>
        </Morph>
      );
      timelineOf(container).progress(1);
      expect(wrapper(container).firstElementChild).toHaveAttribute('inert');
    });

    it('포커스 가능 자손이 없으면 래퍼 자신이 포커스를 받고 탭 순서에는 들지 않는다', () => {
      installLayout();
      const { container, rerender } = render(
        <Morph morphId="m">
          <Card />
        </Morph>
      );
      (container.querySelector('button') as HTMLButtonElement).focus();
      rerender(
        <Morph morphId="m">
          <div data-box="panel">글</div>
        </Morph>
      );
      expect(document.activeElement).toBe(wrapper(container));
      expect(wrapper(container)).toHaveAttribute('tabindex', '-1');
    });

    it('이전 요소에 포커스가 없었으면 포커스를 뺏지 않는다', () => {
      installLayout();
      const outside = document.createElement('button');
      document.body.appendChild(outside);
      const { rerender } = render(<Scene open={false} />);
      outside.focus();
      rerender(<Scene open />);
      expect(document.activeElement).toBe(outside);
      outside.remove();
    });

    it('사각형을 못 읽는 환경에서도 포커스는 옮긴다', () => {
      const { container, rerender } = render(<Scene open={false} />);
      (container.querySelector('button') as HTMLButtonElement).focus();
      rerender(<Scene open />);
      expect(document.activeElement?.textContent).toBe('닫기');
    });
  });

  describe('끼어들기', () => {
    it('진행 중 반대로 전환하면 지금 보이는 사각형에서 이어받는다(점프 없음)', () => {
      installLayout();
      const { container, rerender } = render(<Scene open={false} />);
      rerender(<Scene open />);
      timelineOf(container).time(SHAPE * 0.4);
      const mid = wrapper(container).getBoundingClientRect();
      rerender(<Scene open={false} />);
      const next = wrapper(container).getBoundingClientRect();
      for (const key of ['left', 'top', 'width', 'height'] as const) {
        expect(next[key]).toBeCloseTo(mid[key], 1);
      }
    });

    it('진행 중 이어받는 배경색도 중간 값에서 이어간다', () => {
      installLayout();
      const { container, rerender } = render(<Scene open={false} />);
      rerender(<Scene open />);
      timelineOf(container).time(SHAPE * 0.5);
      const midColor = wrapper(container).style.backgroundColor;
      expect(midColor).not.toBe('rgb(255, 0, 0)');
      expect(midColor).not.toBe('rgb(0, 0, 255)');
      rerender(<Scene open={false} />);
      expect(wrapper(container).style.backgroundColor).toBe(midColor);
    });

    it('진행 중 언마운트하면 타임라인이 죽고 인라인 스타일이 남지 않으며 복제본 표지도 없다', () => {
      installLayout();
      const { container, rerender, unmount } = render(<Scene open={false} />);
      rerender(<Scene open />);
      const el = wrapper(container);
      const tl = timelineOf(container);
      expect(el.style.transform).not.toBe('');
      unmount();
      expect(tl.parent).toBeFalsy();
      expect(el.getAttribute('style') ?? '').not.toMatch(
        /transform|border-radius|background/
      );
      expect(document.querySelectorAll('[data-morph-ghost]').length).toBe(0);
    });
  });

  describe('움직임 줄이기', () => {
    it('즉시 바뀐다: 트윈이 남지 않고 인라인 값이 없다', () => {
      stubReducedMotion();
      installLayout();
      const { container, rerender } = render(<Scene open={false} />);
      rerender(<Scene open />);
      const el = wrapper(container);
      const tl = timelineOf(container);
      expect(tl.progress()).toBe(1);
      expect(tl.parent).toBeFalsy();
      expect(el.style.transform).toBe('');
      expect(el.style.borderTopLeftRadius).toBe('');
      expect(el.style.backgroundColor).toBe('');
      expect((el.firstElementChild as HTMLElement).style.opacity).toBe('');
    });

    it('포커스 규칙은 같다', () => {
      stubReducedMotion();
      installLayout();
      const { container, rerender } = render(<Scene open={false} />);
      (container.querySelector('button') as HTMLButtonElement).focus();
      rerender(<Scene open />);
      expect(document.activeElement?.textContent).toBe('닫기');
    });
  });

  describe('소비자 스타일', () => {
    const StyledPanel = () => (
      <div
        data-box="panel"
        style={{ ...panelStyle, opacity: 0.5, transition: 'color 1s' }}
      >
        <button type="button">닫기</button>
      </div>
    );

    it('자식에 건 인라인 opacity와 transition은 이어받은 뒤 같은 값으로 돌아온다', () => {
      installLayout();
      const { container, rerender } = render(<Scene open={false} />);
      rerender(
        <Morph morphId="m">
          <StyledPanel />
        </Morph>
      );
      const content = wrapper(container).firstElementChild as HTMLElement;
      expect(content.style.transition).toBe('none');
      timelineOf(container).progress(1);
      expect(content.style.opacity).toBe('0.5');
      expect(content.style.transition).toBe('color 1s');
    });

    it('끝난 뒤 morphId가 바뀌어 정리가 한 번 더 돌아도 소비자가 바꾼 opacity가 유지된다', () => {
      installLayout();
      const { container, rerender } = render(<Scene open={false} />);
      rerender(
        <Morph morphId="m">
          <StyledPanel />
        </Morph>
      );
      const content = wrapper(container).firstElementChild as HTMLElement;
      timelineOf(container).progress(1);
      expect(content.style.opacity).toBe('0.5');
      // 끝난 뒤 소비자가 직접 바꾼 값
      content.style.opacity = '0.8';
      rerender(
        <Morph morphId="n">
          <StyledPanel />
        </Morph>
      );
      expect(content.style.opacity).toBe('0.8');
    });

    it('쉬는 opacity가 1이 아닌 자식은 페이드가 그 값에서 끝나 끝 정리 때 튀지 않는다', () => {
      installLayout();
      const { container, rerender } = render(<Scene open={false} />);
      rerender(
        <Morph morphId="m">
          <StyledPanel />
        </Morph>
      );
      const tl = timelineOf(container);
      const content = wrapper(container).firstElementChild as HTMLElement;
      tl.time(tl.duration() - 0.001);
      expect(Number(content.style.opacity)).toBeCloseTo(0.5, 2);
    });

    it('이어받는 동안 래퍼의 포커스 링을 끄고 끝나면 되돌린다', () => {
      installLayout();
      const { container, rerender } = render(<Scene open={false} />);
      rerender(<Scene open />);
      const el = wrapper(container);
      expect(el.style.outline).toBe('none');
      timelineOf(container).progress(1);
      expect(el.style.outline).toBe('');
    });
  });

  describe('StrictMode', () => {
    it('짝 없는 첫 마운트는 제 기록을 이어받지 않는다(타임라인 없음, 내용 불투명)', () => {
      installLayout();
      const { container } = render(
        <StrictMode>
          <Morph morphId="solo">
            <Card />
          </Morph>
        </StrictMode>
      );
      const el = wrapper(container);
      expect(el.__morphTimeline).toBeUndefined();
      expect((el.firstElementChild as HTMLElement).style.opacity).toBe('');
      expect(el.style.transform).toBe('');
    });

    it('A가 사라지고 B가 나타나면 StrictMode 안에서도 A의 사각형에서 이어받는다', () => {
      installLayout();
      const { container, rerender } = render(
        <StrictMode>
          <Scene open={false} />
        </StrictMode>
      );
      rerender(
        <StrictMode>
          <Scene open />
        </StrictMode>
      );
      const { sx, x } = transformOf(wrapper(container));
      expect(sx).toBeCloseTo(0.2, 3);
      expect(x).toBeCloseTo(-360, 3);
      expect(timelineOf(container).progress()).toBeLessThan(1);
    });
  });

  describe('같은 id가 둘일 때', () => {
    it('같은 id로 사라지는 것이 둘이면 정리 순서에서 나중 것의 모양을 이어받는다', () => {
      installLayout();
      const { container, rerender } = render(
        <div key="old">
          <Morph morphId="m">
            <Card />
          </Morph>
        </div>
      );
      // 카드 뒤(트리 순서로 나중)에 같은 id의 패널이 마운트된다
      rerender(
        <div key="old">
          <Morph morphId="m">
            <Card />
          </Morph>
          <Morph morphId="m">
            <Panel />
          </Morph>
        </div>
      );
      // 둘 다 사라지고 카드 크기의 새 요소가 나타난다: 나중 것(패널) 사각형에서 출발하니 배율이 5배다
      rerender(
        <div key="new">
          <Morph morphId="m" className="next">
            <div data-box="card">
              <button type="button">카드</button>
            </div>
          </Morph>
        </div>
      );
      const sx = transformOf(
        container.querySelector('.next') as HTMLElement
      ).sx;
      expect(sx).toBeCloseTo(400 / 80, 3);
    });

    it('같은 id로 나타나는 것이 둘이면 트리 앞쪽이 이어받고 뒤쪽은 이어받지 않는다', () => {
      installLayout();
      const { container, rerender } = render(
        <div key="old">
          <Morph morphId="m">
            <Card />
          </Morph>
        </div>
      );
      rerender(
        <div key="new">
          <Morph morphId="m" className="first">
            <Panel />
          </Morph>
          <Morph morphId="m" className="second">
            <Panel />
          </Morph>
        </div>
      );
      const first = container.querySelector('.first') as MorphHost;
      const second = container.querySelector('.second') as MorphHost;
      expect(first.__morphTimeline).toBeDefined();
      expect(second.__morphTimeline).toBeUndefined();
    });
  });

  describe('래퍼', () => {
    it('div를 그리고 className과 morphId 표지를 주며 ref가 래퍼로 간다', () => {
      const ref = createRef<HTMLElement>();
      const { container } = render(
        <Morph morphId="m" className="mine" ref={ref}>
          <Card />
        </Morph>
      );
      expect(ref.current).toBe(wrapper(container));
      expect(ref.current?.tagName).toBe('DIV');
      expect(ref.current).toHaveClass('mine');
      expect(ref.current).toHaveAttribute('data-morph-id', 'm');
    });

    it('as로 다른 요소를 받는다', () => {
      const { container } = render(
        <ul>
          <Morph morphId="m" as="li">
            <Card />
          </Morph>
        </ul>
      );
      expect(wrapper(container).tagName).toBe('LI');
    });
  });
});
