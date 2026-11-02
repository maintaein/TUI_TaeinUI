import { createRef, useState } from 'react';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { ManuscriptFlip } from './ManuscriptFlip';

/** 재생된 GSAP 애니메이션을 멈추고 시각을 직접 옮겨 인라인 값을 읽는다. 시험은 gsap을 직접 import하지 않으므로 gateMotion이 돌려주는 값을 받아 둔다. */
interface Seekable {
  pause(): unknown;
  time(seconds?: number): unknown;
  duration(): number;
  progress(value: number): unknown;
  reversed(): boolean;
  paused(): boolean;
}
const played = vi.hoisted(() => ({ animations: [] as unknown[] }));
vi.mock('../../hooks/gateMotion', async (importActual) => {
  const actual = await importActual<typeof import('../../hooks/gateMotion')>();
  return {
    ...actual,
    // 진짜 gateMotion을 그대로 부르고 돌려받은 애니메이션만 기록한다
    gateMotion: ((...args: Parameters<typeof actual.gateMotion>) => {
      const animation = actual.gateMotion(...args);
      played.animations.push(animation);
      return animation;
    }) as typeof actual.gateMotion,
  };
});
const lastPlayed = () => {
  const animation = played.animations.at(-1) as Seekable | undefined;
  if (!animation) throw new Error('재생된 애니메이션이 없습니다');
  return animation;
};
/** 시계를 세우고 시각 t(초)로 옮긴다 */
const seek = (t: number) => {
  const tl = lastPlayed();
  tl.pause();
  act(() => {
    tl.time(t);
  });
};

/** 크기 변화를 직접 알리는 최소 ResizeObserver */
class FakeResizeObserver {
  static all: FakeResizeObserver[] = [];
  disconnected = false;
  constructor(private readonly callback: ResizeObserverCallback) {
    FakeResizeObserver.all.push(this);
  }
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {
    this.disconnected = true;
  }
  resize(width: number, height: number): void {
    this.callback(
      [{ contentRect: { width, height } } as ResizeObserverEntry],
      this as unknown as ResizeObserver
    );
  }
}
const installObserver = () => {
  FakeResizeObserver.all = [];
  vi.stubGlobal('ResizeObserver', FakeResizeObserver);
  return () => FakeResizeObserver.all.at(-1)!;
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
// 문서 루트로 옮겼다 되돌리므로, 레이아웃이 있는 것처럼 부모를 돌려준다(CodeSlots 시험과 같은 처방).
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
  played.animations.length = 0;
});

const faces = (container: HTMLElement) => {
  const root = container.firstElementChild as HTMLElement;
  return {
    root,
    front: root.children[0] as HTMLElement,
    back: root.children[1] as HTMLElement,
  };
};
const tilesOf = (container: HTMLElement) =>
  Array.from(
    container.querySelectorAll<HTMLElement>('[aria-hidden="true"] > div')
  );

const Flip = ({ flipped }: { flipped: boolean }) => (
  <ManuscriptFlip
    flipped={flipped}
    front={<p id="the-front">앞</p>}
    back={<p id="the-back">뒤</p>}
  />
);

// 320 x 200 상자는 7열 4행 = 28칸이다
const mountMeasured = (flipped = false) => {
  const observer = installObserver();
  const view = render(<Flip flipped={flipped} />);
  act(() => observer().resize(320, 200));
  return { ...view, observer };
};

describe('ManuscriptFlip', () => {
  describe('면', () => {
    it('앞면과 뒷면을 한 벌씩만 렌더한다(복제 0개)', () => {
      const { container, rerender } = mountMeasured();
      expect(container.querySelectorAll('#the-front')).toHaveLength(1);
      expect(container.querySelectorAll('#the-back')).toHaveLength(1);
      rerender(<Flip flipped />);
      seek(0.3);
      expect(container.querySelectorAll('#the-front')).toHaveLength(1);
      expect(container.querySelectorAll('#the-back')).toHaveLength(1);
    });

    it('보이지 않는 면은 inert이고 접근성 트리에서 빠진다', () => {
      const { container, rerender } = mountMeasured(false);
      let { front, back } = faces(container);
      expect(front).not.toHaveAttribute('inert');
      expect(back).toHaveAttribute('inert');
      expect(back.className).toMatch(/hidden/);

      rerender(<Flip flipped />);
      act(() => {
        lastPlayed().progress(1);
      });
      ({ front, back } = faces(container));
      expect(front).toHaveAttribute('inert');
      expect(front.className).toMatch(/hidden/);
      expect(back).not.toHaveAttribute('inert');
      expect(back.className).not.toMatch(/hidden/);
    });

    it('넘기는 도중에는 포커스가 있던 면을 포함해 두 면이 모두 inert이고 보인다', () => {
      const observer = installObserver();
      const { container, rerender } = render(
        <ManuscriptFlip
          flipped={false}
          front={<button type="button">앞 단추</button>}
          back={<button type="button">뒤 단추</button>}
        />
      );
      act(() => observer().resize(320, 200));
      screen.getByText('앞 단추').focus();

      rerender(
        <ManuscriptFlip
          flipped
          front={<button type="button">앞 단추</button>}
          back={<button type="button">뒤 단추</button>}
        />
      );
      seek(0.3);
      const { front, back } = faces(container);
      expect(front).toHaveAttribute('inert');
      expect(back).toHaveAttribute('inert');
      expect(front.className).not.toMatch(/hidden/);
      expect(back.className).not.toMatch(/hidden/);
    });

    it('되넘기는 도중에도 두 면이 모두 inert이다(목표인 앞면도 끝나기 전에는 살리지 않는다)', () => {
      const { container, rerender } = mountMeasured(true);
      rerender(<Flip flipped={false} />);
      seek(0.35);
      const { front, back } = faces(container);
      expect(front).toHaveAttribute('inert');
      expect(back).toHaveAttribute('inert');
    });

    it('넘김이 끝나는 순간 목표 면만 살아난다', () => {
      const { container, rerender } = mountMeasured(false);
      rerender(<Flip flipped />);
      seek(0.3);
      expect(faces(container).back).toHaveAttribute('inert');
      act(() => {
        lastPlayed().progress(1);
      });
      expect(faces(container).back).not.toHaveAttribute('inert');
      expect(faces(container).front).toHaveAttribute('inert');
    });

    it('className과 ref를 상자에 준다', () => {
      const ref = createRef<HTMLDivElement>();
      const { container } = render(
        <ManuscriptFlip
          ref={ref}
          className="mine"
          flipped={false}
          front="a"
          back="b"
        />
      );
      expect(ref.current).toBe(container.firstElementChild);
      expect(container.firstElementChild).toHaveClass('mine');
    });
  });

  describe('칸 나누기', () => {
    it('측정 전에는 타일이 없고, 측정하면 크기에서 정한 칸 수만큼 생긴다', () => {
      const observer = installObserver();
      const { container } = render(<Flip flipped={false} />);
      expect(tilesOf(container)).toHaveLength(0);
      act(() => observer().resize(320, 200));
      expect(tilesOf(container)).toHaveLength(28);
    });

    it('타일은 칸 격자 위에 퍼센트로 놓인다(7열 4행)', () => {
      const { container } = mountMeasured();
      const tiles = tilesOf(container);
      expect(tiles[0].style.left).toBe('0%');
      expect(tiles[0].style.top).toBe('0%');
      expect(parseFloat(tiles[0].style.width)).toBeCloseTo(100 / 7);
      expect(parseFloat(tiles[0].style.height)).toBeCloseTo(25);
      // 8번째 칸은 둘째 줄의 첫 칸
      expect(tiles[7].style.left).toBe('0%');
      expect(parseFloat(tiles[7].style.top)).toBeCloseTo(25);
    });

    it('큰 상자에서는 칸 수가 상한(48)을 넘지 않는다', () => {
      const observer = installObserver();
      const { container } = render(<Flip flipped={false} />);
      act(() => observer().resize(1600, 1200));
      expect(tilesOf(container).length).toBeLessThanOrEqual(48);
      expect(tilesOf(container).length).toBeGreaterThan(1);
    });

    it('크기가 바뀌면 칸을 다시 나눈다', () => {
      const { container, observer } = mountMeasured();
      act(() => observer().resize(100, 100));
      expect(tilesOf(container)).toHaveLength(4);
    });

    it('언마운트하면 ResizeObserver를 끊는다', () => {
      const { unmount, observer } = mountMeasured();
      const watcher = observer();
      unmount();
      expect(watcher.disconnected).toBe(true);
    });
  });

  describe('넘김', () => {
    it('칸이 글 쓰는 순서(앞 칸부터)로 뒤집히며 마스크가 이산적으로 바뀐다', () => {
      const { container, rerender } = mountMeasured();
      rerender(<Flip flipped />);
      const { front, back } = faces(container);

      seek(0);
      expect(front.style.clipPath).toBe('none');
      // 첫 칸은 100ms에 반쯤 돈다. 마지막 칸은 500 + 100 = 600ms
      seek(0.099);
      expect(front.style.clipPath).toBe('none');
      seek(0.101);
      const one = back.style.clipPath;
      expect(one).toContain('polygon');
      expect(one).toContain(`${Number(((1 / 7) * 100).toFixed(3))}%`);
      seek(0.35);
      const mid = back.style.clipPath;
      expect(mid).not.toBe(one);
      seek(0.599);
      expect(back.style.clipPath).not.toBe('none');
      seek(0.601);
      expect(back.style.clipPath).toBe('none');
      expect(front.style.clipPath).toContain('polygon(0% 0%, 0% 0%, 0% 0%)');
    });

    it('타일은 칸 순서대로 시작해 세로축으로 0도에서 180도까지 돌고 다 돌면 사라진다', () => {
      const { container, rerender } = mountMeasured();
      rerender(<Flip flipped />);
      const tiles = tilesOf(container);
      const turned = (el: HTMLElement) =>
        /rotateY\((-?[0-9.]+)deg\)/.exec(el.style.transform)?.[1];

      seek(0.1);
      // 첫 칸은 반쯤(90도), 마지막 칸은 아직 시작 전
      expect(Number(turned(tiles[0]))).toBeGreaterThan(30);
      expect(Number(turned(tiles[0]))).toBeLessThan(180);
      expect(Number(turned(tiles.at(-1)!) ?? 0)).toBe(0);
      expect(Number(tiles[0].style.opacity)).toBeGreaterThan(0.9);

      seek(0.25);
      // 첫 칸은 다 돌고 사라졌다
      expect(Number(turned(tiles[0]))).toBe(180);
      expect(Number(tiles[0].style.opacity)).toBe(0);
    });

    it('transform과 opacity만 애니메이션한다(레이아웃 속성을 건드리지 않는다)', () => {
      const { container, rerender } = mountMeasured();
      const tiles = tilesOf(container);
      const before = tiles.map((t) => [
        t.style.left,
        t.style.top,
        t.style.width,
        t.style.height,
      ]);
      rerender(<Flip flipped />);
      seek(0.3);
      expect(
        tiles.map((t) => [
          t.style.left,
          t.style.top,
          t.style.width,
          t.style.height,
        ])
      ).toEqual(before);
    });

    it('타일은 aria-hidden이고 포인터를 받지 않는다', () => {
      const { container } = mountMeasured();
      const layer = container.querySelector('[aria-hidden="true"]')!;
      expect(layer).toBeInTheDocument();
      expect(layer.className).toMatch(/tiles/);
    });

    it('전체 길이는 700ms다', () => {
      const { rerender } = mountMeasured();
      rerender(<Flip flipped />);
      expect(lastPlayed().duration()).toBeCloseTo(0.7);
    });

    it('칸이 하나인 작은 상자는 200ms다', () => {
      const observer = installObserver();
      const { rerender } = render(<Flip flipped={false} />);
      act(() => observer().resize(30, 30));
      rerender(<Flip flipped />);
      expect(lastPlayed().duration()).toBeCloseTo(0.2);
    });

    it('되넘길 때는 반대 순서로 앞면이 돌아온다', () => {
      const { container, rerender } = mountMeasured();
      rerender(<Flip flipped />);
      act(() => {
        lastPlayed().progress(1);
      });
      rerender(<Flip flipped={false} />);
      const tl = lastPlayed();
      expect(tl.reversed()).toBe(true);
      const { back } = faces(container);
      // 끝에서 시작해 뒷 칸부터 걷힌다
      seek(0.7);
      expect(back.style.clipPath).toBe('none');
      seek(0.599);
      expect(back.style.clipPath).not.toBe('none');
      seek(0.101);
      const early = back.style.clipPath;
      expect(early).toContain('polygon');
      seek(0.099);
      expect(back.style.clipPath).toBe('polygon(0% 0%, 0% 0%, 0% 0%)');
    });
  });

  describe('도중 되넘김', () => {
    it('넘기는 도중 flipped가 바뀌면 같은 타임라인이 지금 시각에서 거꾸로 간다', () => {
      const { container, rerender } = mountMeasured();
      rerender(<Flip flipped />);
      const tl = lastPlayed();
      seek(0.35);
      const midMask = faces(container).back.style.clipPath;
      rerender(<Flip flipped={false} />);
      expect(lastPlayed()).toBe(tl);
      expect(tl.reversed()).toBe(true);
      expect(tl.time()).toBeCloseTo(0.35, 1);
      // 시각이 그대로라 마스크도 그대로, 거꾸로 가면 칸이 줄어든다
      expect(faces(container).back.style.clipPath).toBe(midMask);
    });

    it('거꾸로 가다 0에 닿으면 앞면만 남고 busy가 풀린다', () => {
      const { container, rerender } = mountMeasured();
      rerender(<Flip flipped />);
      seek(0.35);
      rerender(<Flip flipped={false} />);
      act(() => {
        lastPlayed().progress(0);
      });
      const { front, back } = faces(container);
      expect(front).not.toHaveAttribute('inert');
      expect(back).toHaveAttribute('inert');
      expect(back.className).toMatch(/hidden/);
    });

    it('시간 0에서 되넘겨도 busy가 풀려 앞면이 살아난다', () => {
      const { container, rerender } = mountMeasured();
      rerender(<Flip flipped />);
      // 아직 한 틱도 돌지 않은 시각 0에서 바로 되넘긴다
      rerender(<Flip flipped={false} />);
      const { front, back } = faces(container);
      expect(front).not.toHaveAttribute('inert');
      expect(back).toHaveAttribute('inert');
    });

    it('끝 모양은 늘 마지막 의도와 같다(넘겼다 되넘겼다 다시 넘김)', () => {
      const { container, rerender } = mountMeasured();
      rerender(<Flip flipped />);
      seek(0.3);
      rerender(<Flip flipped={false} />);
      seek(0.2);
      rerender(<Flip flipped />);
      expect(lastPlayed().reversed()).toBe(false);
      act(() => {
        lastPlayed().progress(1);
      });
      const { front, back } = faces(container);
      expect(back).not.toHaveAttribute('inert');
      expect(front).toHaveAttribute('inert');
      expect(back.style.clipPath).toBe('none');
    });
  });

  describe('움직임 줄이기', () => {
    it('칸도 타일도 없다', () => {
      stubReducedMotion();
      const { container } = mountMeasured();
      expect(tilesOf(container)).toHaveLength(0);
    });

    it('두 면이 교차해 흐려지고 마스크는 쓰지 않는다', () => {
      stubReducedMotion();
      const { container, rerender } = mountMeasured();
      rerender(<Flip flipped />);
      const { front, back } = faces(container);
      seek(0.1);
      const f = Number(front.style.opacity);
      const b = Number(back.style.opacity);
      expect(f).toBeGreaterThan(0);
      expect(f).toBeLessThan(1);
      expect(b).toBeGreaterThan(0);
      expect(b).toBeLessThan(1);
      expect(f + b).toBeCloseTo(1, 0);
      expect(front.style.clipPath).toBe('');
      expect(back.style.clipPath).toBe('');
      expect(lastPlayed().duration()).toBeCloseTo(0.2);
    });

    it('결과는 같다: 끝나면 뒷면만 보이고 앞면은 inert', () => {
      stubReducedMotion();
      const { container, rerender } = mountMeasured();
      rerender(<Flip flipped />);
      act(() => {
        lastPlayed().progress(1);
      });
      const { front, back } = faces(container);
      expect(front).toHaveAttribute('inert');
      expect(front.className).toMatch(/hidden/);
      expect(back).not.toHaveAttribute('inert');
    });

    it('측정 없이도(ResizeObserver 없음) 교차 흐림이 돈다', () => {
      stubReducedMotion();
      const { container, rerender } = render(<Flip flipped={false} />);
      rerender(<Flip flipped />);
      expect(lastPlayed().duration()).toBeCloseTo(0.2);
      act(() => {
        lastPlayed().progress(1);
      });
      expect(faces(container).back).not.toHaveAttribute('inert');
    });
  });

  describe('SSR 첫 렌더', () => {
    it('flipped=false면 앞면만 보이고 뒷면은 inert이며 타일이 없다', () => {
      const html = renderToString(<Flip flipped={false} />);
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const root = doc.body.firstElementChild!;
      expect(root.children).toHaveLength(2);
      expect(root.children[0].hasAttribute('inert')).toBe(false);
      expect(root.children[1].hasAttribute('inert')).toBe(true);
      expect(root.children[1].className).toMatch(/hidden/);
      expect(root.querySelector('[aria-hidden="true"]')).toBeNull();
    });

    it('flipped=true면 뒷면만 보이고 앞면은 inert이며 타일이 없다', () => {
      const html = renderToString(<Flip flipped />);
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const root = doc.body.firstElementChild!;
      expect(root.children[0].hasAttribute('inert')).toBe(true);
      expect(root.children[0].className).toMatch(/hidden/);
      expect(root.children[1].hasAttribute('inert')).toBe(false);
      expect(root.querySelector('[aria-hidden="true"]')).toBeNull();
    });
  });

  describe('소비자 조작', () => {
    it('컴포넌트는 이벤트를 다루지 않는다: 소비자가 flipped를 쥔다', () => {
      const Host = () => {
        const [flipped, setFlipped] = useState(false);
        return (
          <>
            <button type="button" onClick={() => setFlipped((v) => !v)}>
              넘기기
            </button>
            <Flip flipped={flipped} />
          </>
        );
      };
      const observer = installObserver();
      const { container } = render(<Host />);
      act(() => observer().resize(320, 200));
      fireEvent.click(screen.getByText('넘기기'));
      act(() => {
        lastPlayed().progress(1);
      });
      const root = container.querySelector('#the-back')!.parentElement!;
      expect(root).not.toHaveAttribute('inert');
    });
  });
});
