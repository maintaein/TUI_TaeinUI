import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRef } from 'react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import {
  isInaccessible,
  render,
  screen,
  waitFor,
  act,
} from '@testing-library/react';
import { BrushText } from './BrushText';

/** jsdom에는 IntersectionObserver가 없다. 필요한 시험만 직접 만든 관찰자를 깐다. */
class FakeObserver {
  static instances: FakeObserver[] = [];
  disconnected = false;
  constructor(private readonly callback: IntersectionObserverCallback) {
    FakeObserver.instances.push(this);
  }
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {
    this.disconnected = true;
  }
  report(isIntersecting: boolean): void {
    this.callback(
      [{ isIntersecting } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver
    );
  }
}

const installObserver = (): void => {
  FakeObserver.instances = [];
  vi.stubGlobal('IntersectionObserver', FakeObserver);
};

/** jsdom은 레이아웃이 없어 모든 사각형이 0이다. 화면 아래 먼 곳에 있는 것으로 만든다. */
const placeBelowViewport = (): void => {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue(
    new DOMRect(0, 5000, 40, 40)
  );
};

/** 글자 칸이 화면 안에 있고 40 x 40 크기인 것으로 만든다. */
const placeInView = (): void => {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue(
    new DOMRect(0, 0, 40, 40)
  );
};

/** jsdom은 matchMedia를 구현하지 않는다. 축소 선호 경로를 열려면 깔아야 한다. */
const installReducedMotion = (): void => {
  vi.stubGlobal(
    'matchMedia',
    (media: string): MediaQueryList =>
      ({
        matches: true,
        media,
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
        onchange: null,
      }) as unknown as MediaQueryList
  );
};

/** 칸마다 캔버스에 써 넣은 잉크(알파 > 0 픽셀 수)를 읽는 기록 */
interface InkLog {
  /** putImageData가 불린 때마다 그 캔버스에 남은 잉크 수 */
  puts: Array<{ canvas: HTMLCanvasElement; ink: number }>;
  /** 칸별(캔버스별) 마지막 잉크 수 */
  lastInk: (canvas: Element | null) => number;
}

/**
 * jsdom에는 캔버스 2D가 없다(`ImageData`도 없다). 같은 글자를 어느 폰트로 그려도 글자 칸 가운데에 가로 막대 하나(20 x 4, 초성 영역 안)가
 * 나오는 최소 2D 컨텍스트를 끼운다. 글자 모양이 아니라 획 하나의 길이(0.5em)와 시각을 시험하려는 용도다.
 */
const installCanvas = (): InkLog => {
  const log: InkLog = {
    puts: [],
    lastInk: (canvas) =>
      [...log.puts].reverse().find((p) => p.canvas === canvas)?.ink ?? 0,
  };
  vi.stubGlobal('ImageData', class {});
  const contextOf = (canvas: HTMLCanvasElement) => {
    const { width: w, height: h } = canvas;
    const pixels = new Uint8ClampedArray(w * h * 4);
    return {
      font: '',
      fillStyle: '',
      textBaseline: '',
      scale() {},
      setTransform() {},
      clearRect() {},
      measureText: () => ({
        fontBoundingBoxAscent: 32,
        fontBoundingBoxDescent: 8,
      }),
      fillText() {
        for (let y = 18; y < 22; y++)
          for (let x = 2; x < 22; x++) pixels[(y * w + x) * 4 + 3] = 255;
      },
      getImageData: () => ({ data: pixels.slice(), width: w, height: h }),
      createImageData: () => ({
        data: new Uint8ClampedArray(w * h * 4),
        width: w,
        height: h,
      }),
      putImageData(img: { data: Uint8ClampedArray }) {
        let ink = 0;
        for (let i = 3; i < img.data.length; i += 4) if (img.data[i] > 0) ink++;
        log.puts.push({ canvas, ink });
      },
    } as unknown as CanvasRenderingContext2D;
  };
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
    function (this: HTMLCanvasElement) {
      return contextOf(this);
    } as unknown as typeof HTMLCanvasElement.prototype.getContext
  );
  // jsdom은 font-size 같은 값을 상속하지 않아 글자 칸에 직접 준다
  const sheet = document.createElement('style');
  sheet.textContent = '[data-brush-glyph]{font-size:40px}';
  document.head.appendChild(sheet);
  cleanups.push(() => sheet.remove());
  return log;
};
const cleanups: Array<() => void> = [];

const q = (container: HTMLElement, name: string): HTMLElement[] => [
  ...container.querySelectorAll<HTMLElement>(`[data-brush-${name}]`),
];

/** 재생이 인라인으로 건 값이나 붙여 둔 캔버스가 하나라도 남았는가 */
const hasInlineMotion = (container: HTMLElement): boolean =>
  q(container, 'canvas').length > 0 ||
  q(container, 'glyph').some((el) => el.style.opacity !== '');

/** jsdom에는 document.fonts가 없다. load가 시험이 쥔 약속을 돌려주는 최소 객체를 끼운다. check는 폰트가 이미 있는지다. */
const installFonts = (loaded = false) => {
  const loads: Array<{ font: string; text: string }> = [];
  let release: () => void = () => {};
  const pending = new Promise<void>((resolveLoad) => {
    release = resolveLoad;
  });
  Object.defineProperty(document, 'fonts', {
    configurable: true,
    value: {
      check: () => loaded,
      load: (font: string, text: string) => {
        loads.push({ font, text });
        return pending;
      },
    },
  });
  return { loads, release };
};

/** 재생 타임라인을 멈추고 시각을 직접 옮겨 읽는다. 시험은 gsap을 직접 import하지 않으므로 gateMotion이 돌려주는 값을 받아 둔다. */
interface SeekableTimeline {
  pause(): unknown;
  time(seconds: number): unknown;
  duration(): number;
}
const played = vi.hoisted(() => ({ timelines: [] as unknown[] }));
vi.mock('../../hooks/gateMotion', async (importActual) => {
  const actual = await importActual<typeof import('../../hooks/gateMotion')>();
  return {
    ...actual,
    // 진짜 gateMotion을 그대로 부르고 돌려받은 타임라인만 기록한다
    gateMotion: ((...args: Parameters<typeof actual.gateMotion>) => {
      const animation = actual.gateMotion(...args);
      played.timelines.push(animation);
      return animation;
    }) as typeof actual.gateMotion,
  };
});
const seekPlayback = (): ((seconds: number) => void) => {
  const timeline = played.timelines.at(-1) as SeekableTimeline | undefined;
  if (!timeline) throw new Error('재생 타임라인이 없습니다');
  timeline.pause();
  return (seconds) => void timeline.time(seconds);
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
  for (const cleanup of cleanups.splice(0)) cleanup();
  // 시험이 끼운 document.fonts를 걷어 jsdom 원래대로(없음) 돌린다
  Reflect.deleteProperty(document, 'fonts');
});

describe('BrushText', () => {
  describe('구조와 접근성', () => {
    it('완성 문장이 접근성 트리에 한 번 있고 제목 이름도 그 문장이다', () => {
      render(<BrushText text="안녕하세요" as="h1" />);

      const sentence = screen.getByText('안녕하세요');
      expect(isInaccessible(sentence)).toBe(false);
      expect(
        screen.getByRole('heading', { level: 1, name: '안녕하세요' })
      ).toBeInTheDocument();
    });

    it('루트에 aria-label을 쓰지 않는다', () => {
      const { container } = render(<BrushText text="안녕" />);
      expect(container.firstElementChild).not.toHaveAttribute('aria-label');
    });

    it('그림 층은 aria-hidden이고 글자 span은 접근성 트리에 없다', () => {
      const { container } = render(<BrushText text="한글 A" />);

      const visual = container.querySelector('[data-brush-visual]');
      expect(visual).toHaveAttribute('aria-hidden', 'true');
      const glyphs = q(container, 'glyph');
      expect(glyphs.length).toBeGreaterThan(0);
      for (const el of glyphs) {
        expect(isInaccessible(el), el.textContent ?? '').toBe(true);
      }
    });

    it('기본 요소는 p이고 as로 바꾼다', () => {
      const { container, rerender } = render(<BrushText text="가" />);
      expect(container.firstElementChild?.tagName).toBe('P');

      rerender(<BrushText text="가" as="span" />);
      expect(container.firstElementChild?.tagName).toBe('SPAN');
    });

    it('className과 ref가 루트 요소로 간다', () => {
      const ref = createRef<HTMLElement>();
      const { container } = render(
        <BrushText text="가" className="custom" ref={ref} />
      );

      expect(container.firstElementChild).toHaveClass('custom');
      expect(ref.current).toBe(container.firstElementChild);
    });
  });

  describe('글자 칸', () => {
    it('공백으로 나뉜 낱말마다 묶음이 하나씩이고 공백은 묶음 사이에 그대로 있다', () => {
      const { container } = render(<BrushText text="안녕 하세요  hello" />);

      const glyphsOf = (el: Element) =>
        [...el.querySelectorAll('[data-brush-glyph]')]
          .map((g) => g.textContent)
          .join('');
      expect(q(container, 'word').map(glyphsOf)).toEqual([
        '안녕',
        '하세요',
        'hello',
      ]);
      const visual = container.querySelector('[data-brush-visual]');
      expect(visual?.childNodes[1].textContent).toBe(' ');
      expect(visual?.childNodes[3].textContent).toBe('  ');
    });

    it('조합용 자모로 쓴 한글(NFD)도 글자 칸 하나가 된다', () => {
      const nfd = '한';
      const { container } = render(<BrushText text={nfd} />);

      expect(q(container, 'cell')).toHaveLength(1);
      expect(q(container, 'glyph')[0].textContent).toBe('한');
      expect(screen.getByText(nfd)).toBeInTheDocument();
    });

    it('ZWJ 이모지와 결합 부호가 붙은 칸도 칸 하나다', () => {
      const family = '\u{1F468}‍\u{1F469}‍\u{1F467}';
      const { container } = render(<BrushText text={`${family}가́`} />);

      expect(q(container, 'cell')).toHaveLength(2);
    });
  });

  describe('캔버스를 쓸 수 없을 때', () => {
    it('마운트할 때 이미 화면 안이어도 아무것도 숨기지 않고 완성 문장으로 끝난다 (오류 없음)', () => {
      installObserver();
      placeInView();
      const before = played.timelines.length;
      const { container } = render(<BrushText text="한글" />);

      expect(hasInlineMotion(container)).toBe(false);
      expect(played.timelines).toHaveLength(before);
      expect(screen.getByText('한글')).toBeInTheDocument();
    });

    it('IntersectionObserver가 없으면 아무것도 숨기지 않는다', () => {
      const { container } = render(<BrushText text="안녕하세요" />);

      expect(hasInlineMotion(container)).toBe(false);
    });
  });

  describe('언제 숨기고 언제 쓰나', () => {
    it('축소 모션이면 관찰자가 있어도 숨기지 않고 관찰도 하지 않는다', () => {
      installObserver();
      installCanvas();
      placeBelowViewport();
      installReducedMotion();
      const { container } = render(<BrushText text="안녕하세요" />);

      expect(hasInlineMotion(container)).toBe(false);
      expect(FakeObserver.instances).toHaveLength(0);
    });

    it('마운트할 때 이미 화면 안이면 그려지기 전에 글자를 숨기고 칸마다 캔버스를 붙이고, 다 쓴 뒤 둘 다 걷는다', async () => {
      installObserver();
      installCanvas();
      placeInView();
      const { container } = render(<BrushText text="한글" />);

      expect(q(container, 'glyph').map((g) => g.style.opacity)).toEqual([
        '0',
        '0',
      ]);
      const canvases = q(container, 'canvas');
      expect(canvases).toHaveLength(2);
      for (const canvas of canvases) {
        expect(canvas.parentElement).toHaveAttribute('data-brush-cell');
      }
      expect(FakeObserver.instances).toHaveLength(0);

      await waitFor(() => expect(hasInlineMotion(container)).toBe(false), {
        timeout: 4000,
      });
      expect(screen.getByText('한글')).toBeInTheDocument();
      expect(q(container, 'glyph').map((g) => g.textContent)).toEqual([
        '한',
        '글',
      ]);
    });

    it('화면 밖이면 첫 렌더는 완성 문장이고, 관찰자가 화면 밖이라고 알리면 숨기고, 들어오면 한 번 쓴다', async () => {
      installObserver();
      installCanvas();
      placeBelowViewport();
      const { container } = render(<BrushText text="한글" />);

      expect(hasInlineMotion(container)).toBe(false);
      expect(FakeObserver.instances).toHaveLength(1);
      const observer = FakeObserver.instances[0];

      act(() => observer.report(false));
      expect(q(container, 'glyph').every((g) => g.style.opacity === '0')).toBe(
        true
      );
      expect(q(container, 'canvas')).toHaveLength(2);
      expect(observer.disconnected).toBe(false);

      act(() => observer.report(true));
      expect(observer.disconnected).toBe(true);
      await waitFor(() => expect(hasInlineMotion(container)).toBe(false), {
        timeout: 4000,
      });
    });

    it('처음부터 화면 안이라고 알려 오면 건드리지 않는다', () => {
      installObserver();
      installCanvas();
      placeBelowViewport();
      const { container } = render(<BrushText text="한글" />);

      act(() => FakeObserver.instances[0].report(true));

      expect(hasInlineMotion(container)).toBe(false);
    });

    it('다 쓴 뒤 text가 바뀌어도 다시 쓰지 않고 새 문장을 완성 상태로 보인다', async () => {
      installObserver();
      installCanvas();
      placeInView();
      const { container, rerender } = render(<BrushText text="한글" />);
      await waitFor(() => expect(hasInlineMotion(container)).toBe(false), {
        timeout: 4000,
      });
      const before = played.timelines.length;

      rerender(<BrushText text="다른 문장" />);

      expect(hasInlineMotion(container)).toBe(false);
      expect(q(container, 'cell')).toHaveLength(4);
      expect(played.timelines).toHaveLength(before);
    });

    it('쓰는 도중 text가 바뀌면 캔버스와 인라인 값을 걷어 새 문장을 완성 상태로 보인다', () => {
      installObserver();
      installCanvas();
      placeInView();
      const { container, rerender } = render(<BrushText text="한글" />);
      expect(hasInlineMotion(container)).toBe(true);

      rerender(<BrushText text="다른 문장" />);

      expect(hasInlineMotion(container)).toBe(false);
    });

    it('언마운트하면 타임라인을 죽여 떼어진 캔버스에 값을 더 쓰지 않는다', async () => {
      installObserver();
      const log = installCanvas();
      placeInView();
      const { unmount } = render(<BrushText text="한글" />);
      const before = log.puts.length;

      unmount();
      await new Promise((resolveWait) => setTimeout(resolveWait, 300));

      // settleMotion이 끝 상태를 한 번 그리는 것은 있어도 그 뒤로는 더 안 그린다
      const after = log.puts.length;
      await new Promise((resolveWait) => setTimeout(resolveWait, 300));
      expect(log.puts.length).toBe(after);
      expect(after).toBeGreaterThanOrEqual(before);
    });
  });

  describe('박자와 그리기 (타임라인을 멈추고 시각을 옮겨 읽는다)', () => {
    // 칸 하나는 가로 막대 하나(20px = 0.5em)이고 한글 '가'의 초성 영역 안이라 나뉘지 않는다. 획의 가장 먼 픽셀까지 측지 거리는 약 20.2px = 0.505em라 획 시간은 약 101ms
    const STROKE = 0.101;
    const BAR = 20 * 4;
    const play = (text: string) => {
      installObserver();
      const log = installCanvas();
      placeInView();
      const { container } = render(<BrushText text={text} />);
      const canvases = q(container, 'canvas');
      return { seek: seekPlayback(), log, canvases, container };
    };

    it('획은 길이에 비례한 시간 동안 일정한 속도로 자란다 (linear)', () => {
      const { seek, log, canvases } = play('가');
      const total = STROKE;

      // 앞머리 가장자리 띠(0.04em = 1.6px)가 있어 잉크 수는 앞머리 거리에 거의 비례한다
      seek(total * 0.25);
      const quarter = log.lastInk(canvases[0]);
      seek(total * 0.5);
      const half = log.lastInk(canvases[0]);
      seek(total * 0.75);
      const threeQuarters = log.lastInk(canvases[0]);

      expect(half / quarter).toBeCloseTo(2, 0);
      expect(threeQuarters / quarter).toBeCloseTo(3, 0);
      expect(half).toBeLessThan(BAR);
    });

    it('획이 끝나면 캔버스가 숨고 그제야 진짜 글자가 보인다', () => {
      const { seek, canvases, container } = play('가가');
      const glyph = q(container, 'glyph')[0];

      seek(STROKE - 0.01);
      expect(glyph.style.opacity).toBe('0');
      expect(canvases[0].style.display).not.toBe('none');
      seek(STROKE + 0.002);
      expect(glyph.style.opacity).toBe('1');
      expect(canvases[0].style.display).toBe('none');
    });

    it('다음 음절은 음절 사이 쉼 150ms 뒤에 시작한다 (그동안 아무것도 안 바뀐다)', () => {
      const { seek, log, canvases } = play('가가');

      seek(STROKE + 0.01);
      const during = log.lastInk(canvases[1]);
      seek(STROKE + 0.14);
      expect(log.lastInk(canvases[1])).toBe(during);
      expect(during).toBe(0);
      seek(STROKE + 0.15 + 0.05);
      expect(log.lastInk(canvases[1])).toBeGreaterThan(0);
    });

    it('공백은 시간이 없다', () => {
      const { seek, log, canvases } = play('가 가');

      seek(STROKE + 0.15 + 0.05);
      expect(log.lastInk(canvases[1])).toBeGreaterThan(0);
    });

    it('긴 문장도 줄이지 않고 길이 비례 시간과 쉼 그대로 끝까지 간다', () => {
      play('가'.repeat(30));
      const timeline = played.timelines.at(-1) as SeekableTimeline;

      expect(timeline.duration()).toBeCloseTo(30 * STROKE + 29 * 0.15, 2);
    });
  });

  describe('폰트 기다리기', () => {
    it('폰트가 오는 동안은 숨기지 않고 완성 문장 그대로이고, 오면 쓴다', async () => {
      installObserver();
      installCanvas();
      placeInView();
      const fonts = installFonts();
      const { container } = render(<BrushText text="한글" />);

      expect(fonts.loads).toHaveLength(1);
      expect(fonts.loads[0].text).toBe('한글');
      expect(hasInlineMotion(container)).toBe(false);

      await act(async () => fonts.release());

      expect(q(container, 'canvas')).toHaveLength(2);
      await waitFor(() => expect(hasInlineMotion(container)).toBe(false), {
        timeout: 4000,
      });
    });

    it('3초가 지나도 안 오면 있는 폰트로 쓴다', async () => {
      installObserver();
      installCanvas();
      placeInView();
      installFonts();
      vi.useFakeTimers();
      const { container } = render(<BrushText text="한글" />);

      await act(async () => vi.advanceTimersByTime(2999));
      expect(hasInlineMotion(container)).toBe(false);

      await act(async () => vi.advanceTimersByTime(1));
      expect(q(container, 'canvas')).toHaveLength(2);
    });

    it('폰트가 이미 있으면(check) load를 부르지 않고 바로 쓴다', () => {
      installObserver();
      installCanvas();
      placeInView();
      const fonts = installFonts(true);
      const { container } = render(<BrushText text="한글" />);

      expect(fonts.loads).toHaveLength(0);
      expect(q(container, 'canvas')).toHaveLength(2);
    });

    it('기다리는 동안 언마운트하면 폰트가 와도 아무것도 하지 않는다', async () => {
      installObserver();
      installCanvas();
      placeInView();
      const fonts = installFonts();
      const { container, unmount } = render(<BrushText text="한글" />);
      const glyphs = q(container, 'glyph');

      unmount();
      await act(async () => fonts.release());

      expect(FakeObserver.instances).toHaveLength(0);
      for (const glyph of glyphs) expect(glyph.style.opacity).toBe('');
    });
  });

  describe('인쇄', () => {
    it('인쇄에서는 인라인 값을 !important로 이겨 완성 글자만 보인다', () => {
      const css = readFileSync(
        resolve(__dirname, './BrushText.css.ts'),
        'utf-8'
      );
      expect(css).toMatch(/print:[^}]*opacity: '1 !important'/);
      expect(css).toMatch(/print:[^}]*display: 'none !important'/);
    });
  });
});
