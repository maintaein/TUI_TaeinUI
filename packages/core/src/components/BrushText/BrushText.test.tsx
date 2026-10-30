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
    new DOMRect(0, 5000, 100, 20)
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

const q = (container: HTMLElement, name: string): HTMLElement[] => [
  ...container.querySelectorAll<HTMLElement>(`[data-brush-${name}]`),
];

/** 재생이 인라인으로 건 값이 하나라도 남았는가 */
const hasInlineMotion = (container: HTMLElement): boolean =>
  [...q(container, 'glyph'), ...q(container, 'stroke')].some(
    (el) =>
      el.style.opacity !== '' ||
      el.style.display !== '' ||
      el.style.getPropertyValue('--brush-p') !== ''
  );

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

/** 재생 타임라인을 멈추고 시각을 직접 옮겨 인라인 값을 읽는다. 시험은 gsap을 직접 import하지 않으므로 gateMotion이 돌려주는 값을 받아 둔다. */
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

    it('그림 층은 aria-hidden이고 글자와 획 조각 span은 접근성 트리에 없다', () => {
      const { container } = render(<BrushText text="한글 A" />);

      const visual = container.querySelector('[data-brush-visual]');
      expect(visual).toHaveAttribute('aria-hidden', 'true');
      const hidden = [...q(container, 'glyph'), ...q(container, 'stroke')];
      expect(hidden.length).toBeGreaterThan(0);
      for (const el of hidden) {
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

  describe('글자 칸과 획 조각', () => {
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

    it('한글 칸의 획 조각은 초성, 모음, (받침) 순서다 (하 → ㅎㅏ, 한 → ㅎㅏㄴ)', () => {
      const { container } = render(<BrushText text="하한" />);

      const jamo = q(container, 'cell').map((c) =>
        [...c.querySelectorAll<HTMLElement>('[data-brush-stroke]')].map(
          (j) => j.dataset.brushJamo
        )
      );
      expect(jamo).toEqual([
        ['ㅎ', 'ㅏ'],
        ['ㅎ', 'ㅏ', 'ㄴ'],
      ]);
    });

    it('조각은 자모 글자가 아니라 완성 글자 그대로를 담고 자모 영역으로 오려져 있다', () => {
      const { container } = render(<BrushText text="한" />);

      const pieces = q(container, 'stroke');
      expect(pieces.map((p) => p.textContent)).toEqual(['한', '한', '한']);
      const clips = pieces.map((p) => p.style.clipPath);
      expect(new Set(clips).size).toBe(3);
      for (const clip of clips) expect(clip).toMatch(/^polygon\(/);
    });

    it('조각마다 쓸기 방향과 구간이 자모를 따른다 (고: ㄱ 대각선, ㅗ 왼→오 / 가: ㅏ 위→아래)', () => {
      const { container } = render(<BrushText text="고가" />);

      const [gieok, o, , a] = q(container, 'stroke');
      const dir = (el: HTMLElement) => el.style.getPropertyValue('--brush-dir');
      const span = (el: HTMLElement) => [
        Number(el.style.getPropertyValue('--brush-from')),
        Number(el.style.getPropertyValue('--brush-to')),
      ];
      expect(dir(gieok)).toBe('to bottom right');
      expect(dir(o)).toBe('to right');
      expect(dir(a)).toBe('to bottom');
      // 가의 ㅏ 영역은 x 0.6~1, y 0~1이라 위→아래 구간은 0~1
      expect(span(a)).toEqual([0, 1]);
      // 고의 ㅗ 영역은 x 0~1이라 왼→오 구간은 0~1
      expect(span(o)).toEqual([0, 1]);
    });

    it('조합용 자모로 쓴 한글(NFD)도 글자 칸 하나와 자모 조각이 된다', () => {
      const nfd = '한';
      const { container } = render(<BrushText text={nfd} />);

      expect(q(container, 'cell')).toHaveLength(1);
      expect(q(container, 'glyph')[0].textContent).toBe('한');
      expect(q(container, 'stroke').map((j) => j.dataset.brushJamo)).toEqual([
        'ㅎ',
        'ㅏ',
        'ㄴ',
      ]);
      expect(screen.getByText(nfd)).toBeInTheDocument();
    });

    it('한글이 아닌 글자는 오리지 않은 조각 하나가 칸 전체를 왼→오로 쓴다', () => {
      const { container } = render(<BrushText text="A1.ㄱ" />);

      expect(q(container, 'cell')).toHaveLength(4);
      const pieces = q(container, 'stroke');
      expect(pieces).toHaveLength(4);
      for (const piece of pieces) {
        expect(piece.dataset.brushJamo).toBeUndefined();
        expect(piece.style.clipPath).toBe('');
        expect(piece.style.getPropertyValue('--brush-dir')).toBe('to right');
        expect(piece.style.getPropertyValue('--brush-h')).toBe('100%');
      }
    });

    it('ZWJ 이모지와 결합 부호가 붙은 칸도 칸 하나에 조각 하나다', () => {
      const family = '\u{1F468}‍\u{1F469}‍\u{1F467}';
      const { container } = render(<BrushText text={`${family}가́`} />);

      expect(q(container, 'cell')).toHaveLength(2);
      expect(q(container, 'stroke')).toHaveLength(2);
    });
  });

  describe('언제 숨기고 언제 쓰나', () => {
    it('IntersectionObserver가 없으면 아무것도 숨기지 않는다', () => {
      const { container } = render(<BrushText text="안녕하세요" />);

      expect(hasInlineMotion(container)).toBe(false);
    });

    it('축소 모션이면 관찰자가 있어도 숨기지 않고 관찰도 하지 않는다', () => {
      installObserver();
      placeBelowViewport();
      installReducedMotion();
      const { container } = render(<BrushText text="안녕하세요" />);

      expect(hasInlineMotion(container)).toBe(false);
      expect(FakeObserver.instances).toHaveLength(0);
    });

    it('마운트할 때 이미 화면 안이면 그려지기 전에 쓰기 전 상태로 바꾸고, 다 쓴 뒤 인라인 값을 걷는다', async () => {
      installObserver();
      const { container } = render(<BrushText text="한글" />);

      expect(q(container, 'glyph').map((g) => g.style.opacity)).toEqual([
        '0',
        '0',
      ]);
      const pieces = q(container, 'stroke');
      expect(pieces).toHaveLength(6);
      for (const piece of pieces) {
        expect(piece.style.display).toBe('block');
        expect(piece.style.getPropertyValue('--brush-p')).not.toBe('');
      }
      expect(FakeObserver.instances).toHaveLength(0);

      await waitFor(() => expect(hasInlineMotion(container)).toBe(false), {
        timeout: 4000,
      });
    });

    it('다 쓰면 조각 층이 걷히고 진짜 글자만 남는다 (인라인 값이 없고 글자 칸은 그대로)', async () => {
      installObserver();
      const { container } = render(<BrushText text="한글" />);
      await waitFor(() => expect(hasInlineMotion(container)).toBe(false), {
        timeout: 4000,
      });

      // 쉬는 상태의 숨김은 CSS(display: none)가 맡는다. 인라인 block이 남으면 조각이 글자 위에 덮인다.
      for (const piece of q(container, 'stroke')) {
        expect(piece.style.display).not.toBe('block');
      }
      expect(q(container, 'glyph').map((g) => g.textContent)).toEqual([
        '한',
        '글',
      ]);
      expect(screen.getByText('한글')).toBeInTheDocument();
    });

    it('화면 밖이면 첫 렌더는 완성 문장이고, 관찰자가 화면 밖이라고 알리면 숨기고, 들어오면 한 번 쓴다', async () => {
      installObserver();
      placeBelowViewport();
      const { container } = render(<BrushText text="한글" />);

      expect(hasInlineMotion(container)).toBe(false);
      expect(FakeObserver.instances).toHaveLength(1);
      const observer = FakeObserver.instances[0];

      act(() => observer.report(false));
      expect(q(container, 'glyph').every((g) => g.style.opacity === '0')).toBe(
        true
      );
      expect(observer.disconnected).toBe(false);

      act(() => observer.report(true));
      expect(observer.disconnected).toBe(true);
      await waitFor(() => expect(hasInlineMotion(container)).toBe(false), {
        timeout: 4000,
      });
    });

    it('처음부터 화면 안이라고 알려 오면 건드리지 않는다', () => {
      installObserver();
      placeBelowViewport();
      const { container } = render(<BrushText text="한글" />);

      act(() => FakeObserver.instances[0].report(true));

      expect(hasInlineMotion(container)).toBe(false);
    });

    it('다 쓴 뒤 text가 바뀌어도 다시 쓰지 않고 새 문장을 완성 상태로 보인다', async () => {
      installObserver();
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

    it('쓰는 도중 text가 바뀌면 인라인 값을 걷어 새 문장을 완성 상태로 보인다', () => {
      installObserver();
      const { container, rerender } = render(<BrushText text="한글" />);
      expect(hasInlineMotion(container)).toBe(true);

      rerender(<BrushText text="다른 문장" />);

      expect(hasInlineMotion(container)).toBe(false);
    });

    it('언마운트하면 타임라인을 죽여 떼어진 글자에 값을 더 쓰지 않는다', async () => {
      installObserver();
      const { container, unmount } = render(<BrushText text="한글" />);
      const els = [...q(container, 'glyph'), ...q(container, 'stroke')];

      unmount();
      await new Promise((resolveWait) => setTimeout(resolveWait, 300));

      for (const el of els) {
        expect(el.style.opacity).toBe('');
        expect(el.style.getPropertyValue('--brush-p')).toBe('');
      }
    });
  });

  describe('박자와 순서 (타임라인을 멈추고 시각을 옮겨 읽는다)', () => {
    // 획 150ms는 linear: 진행 x일 때 값은 x(참고 영상에서 잉크가 일정하게 늘어난다)
    const num = (el: HTMLElement, name: string) =>
      Number.parseFloat(el.style.getPropertyValue(name));
    const p = (el: HTMLElement) => num(el, '--brush-p');
    /** "각나다": 칸0(각)은 조각 3개(0, 0.25, 0.5에 시작), 칸1(나)은 조각 2개(0.8, 1.05), 칸2는 끝을 늦춰 칸1의 끝 시각이 타임라인 끝이 되지 않게 한다 */
    const play = (text = '각나다') => {
      installObserver();
      const { container } = render(<BrushText text={text} />);
      const cells = q(container, 'cell').map((c) => ({
        glyph: c.querySelector<HTMLElement>(
          '[data-brush-glyph]'
        ) as HTMLElement,
        pieces: [...c.querySelectorAll<HTMLElement>('[data-brush-stroke]')],
      }));
      return { seek: seekPlayback(), cells };
    };

    it('초성 → 중성 → 종성 순서로 쓴다 (겹침 없음)', () => {
      const {
        seek,
        cells: [first],
      } = play();
      const [initial, medial, final] = first.pieces;

      seek(0.075);
      expect(p(initial)).toBeCloseTo(0.5, 3);
      expect(p(medial)).toBe(0);
      expect(p(final)).toBe(0);

      seek(0.325);
      expect(p(initial)).toBe(1);
      expect(p(medial)).toBeCloseTo(0.5, 3);
      expect(p(final)).toBe(0);

      seek(0.575);
      expect(p(medial)).toBe(1);
      expect(p(final)).toBeCloseTo(0.5, 3);
    });

    it('획은 150ms에 다 열리고 그 전에는 다 열리지 않는다', () => {
      const {
        seek,
        cells: [first],
      } = play();

      seek(0.14);
      expect(p(first.pieces[0])).toBeLessThan(1);
      seek(0.15);
      expect(p(first.pieces[0])).toBe(1);
    });

    it('획 안에서는 일정한 속도로 자란다 (linear)', () => {
      const {
        seek,
        cells: [first],
      } = play();

      for (const x of [0.25, 0.5, 0.75]) {
        seek(0.15 * x);
        expect(p(first.pieces[0])).toBeCloseTo(x, 3);
      }
    });

    it('한 음절 안에서는 획 사이에 100ms 붓을 드는 쉼이 있다 (그동안 아무것도 안 바뀐다)', () => {
      const {
        seek,
        cells: [first],
      } = play();
      const [initial, medial] = first.pieces;

      // 초성은 0.15에 끝나고 중성은 0.25에 시작한다
      seek(0.16);
      const during = [p(initial), p(medial)];
      seek(0.24);
      expect([p(initial), p(medial)]).toEqual(during);
      expect(during).toEqual([1, 0]);
      seek(0.2501);
      expect(p(medial)).toBeGreaterThan(0);
    });

    it('다음 음절은 음절 사이 쉼 150ms 뒤에 시작한다', () => {
      const {
        seek,
        cells: [, second],
      } = play();

      // 각은 0.65초에 끝나고 나는 0.8초에 시작한다
      seek(0.79);
      expect(p(second.pieces[0])).toBe(0);
      seek(0.875);
      expect(p(second.pieces[0])).toBeCloseTo(0.5, 3);
    });

    it('칸의 조각 층은 그 칸의 마지막 획이 끝나는 순간에 숨고 그제야 완성 글자가 보인다', () => {
      const {
        seek,
        cells: [first, second],
      } = play();
      const layer = (c: typeof first) => c.pieces.map((q) => q.style.display);

      seek(0.64);
      expect(layer(first)).toEqual(['block', 'block', 'block']);
      expect(first.glyph.style.opacity).toBe('0');
      seek(0.65);
      expect(layer(first)).toEqual(['none', 'none', 'none']);
      expect(first.glyph.style.opacity).toBe('1');

      // 나는 1.05 + 0.15 = 1.2초에 끝난다
      seek(1.19);
      expect(layer(second)).toEqual(['block', 'block']);
      expect(second.glyph.style.opacity).toBe('0');
      seek(1.2);
      expect(layer(second)).toEqual(['none', 'none']);
      expect(second.glyph.style.opacity).toBe('1');
    });

    it('한글이 아닌 글자도 칸 하나가 150ms 한 번이다 (공백은 시간이 없다)', () => {
      installObserver();
      const { container } = render(<BrushText text="A B" />);
      const [a, b] = q(container, 'stroke');
      const seek = seekPlayback();

      seek(0.075);
      expect(p(a)).toBeCloseTo(0.5, 3);
      expect(p(b)).toBe(0);
      // B는 A가 0.15에 끝나고 음절 사이 쉼 0.15 뒤인 0.3초에 시작한다. 공백 칸이 없으니 그 사이에 더 늦지 않는다
      seek(0.29);
      expect(p(b)).toBe(0);
      seek(0.375);
      expect(p(b)).toBeCloseTo(0.5, 3);
    });

    it('긴 문장은 전체가 정확히 3초에 끝난다', () => {
      play('흩어진 조각이 맞물려 글자가 됩니다 붓으로 한 글자씩 씁니다');
      const timeline = played.timelines.at(-1) as SeekableTimeline;

      expect(timeline.duration()).toBeCloseTo(3, 6);
    });

    it('줄어든 문장은 획 길이와 쉼이 같은 비율로 줄어 그 비율대로 쓴다', () => {
      // 가 x 20: 3초를 넘어 줄어든다. 획 150ms와 음절 쉼 150ms가 같은 비율이라 둘째 음절은 정확히 한 획 + 한 쉼 = 2 획 길이 뒤에 시작한다
      const { seek, cells } = play('가'.repeat(20));
      const first = cells[0].pieces[0];
      const second = cells[1].pieces[0];
      const raw = 20 * 2 * 0.15 + 20 * 0.1 + 19 * 0.15;
      const scale = 3 / raw;
      const strokeLen = 0.15 * scale;
      // 첫 음절은 초성, 쉼, 모음 뒤 쉼을 지나 둘째 음절이 시작한다
      const secondStart = 2 * strokeLen + 0.1 * scale + 0.15 * scale;

      seek(secondStart - 0.001);
      expect(p(second)).toBe(0);
      seek(secondStart + strokeLen / 2);
      expect(p(second)).toBeCloseTo(0.5, 2);
      expect(p(first)).toBe(1);
    });

    it('짧은 문장은 줄이지 않는다', () => {
      play('가나');
      const timeline = played.timelines.at(-1) as SeekableTimeline;

      expect(timeline.duration()).toBeCloseTo(0.95, 6);
    });
  });

  describe('폰트 기다리기', () => {
    it('폰트가 오는 동안은 숨기지 않고 완성 문장 그대로이고, 오면 쓴다', async () => {
      installObserver();
      const fonts = installFonts();
      const { container } = render(<BrushText text="한글" />);

      expect(fonts.loads).toHaveLength(1);
      expect(fonts.loads[0].text).toBe('한글');
      expect(hasInlineMotion(container)).toBe(false);

      await act(async () => fonts.release());

      expect(
        q(container, 'stroke').every((p) => p.style.display === 'block')
      ).toBe(true);
      await waitFor(() => expect(hasInlineMotion(container)).toBe(false), {
        timeout: 4000,
      });
    });

    it('3초가 지나도 안 오면 있는 폰트로 쓴다', async () => {
      installObserver();
      installFonts();
      vi.useFakeTimers();
      const { container } = render(<BrushText text="한글" />);

      await act(async () => vi.advanceTimersByTime(2999));
      expect(hasInlineMotion(container)).toBe(false);

      await act(async () => vi.advanceTimersByTime(1));
      expect(
        q(container, 'stroke').every((p) => p.style.display === 'block')
      ).toBe(true);
    });

    it('폰트가 이미 있으면(check) load를 부르지 않고 바로 쓴다', () => {
      installObserver();
      const fonts = installFonts(true);
      const { container } = render(<BrushText text="한글" />);

      expect(fonts.loads).toHaveLength(0);
      expect(
        q(container, 'stroke').every((p) => p.style.display === 'block')
      ).toBe(true);
    });

    it('기다리는 동안 언마운트하면 폰트가 와도 아무것도 하지 않는다', async () => {
      installObserver();
      const fonts = installFonts();
      const { container, unmount } = render(<BrushText text="한글" />);
      const pieces = q(container, 'stroke');

      unmount();
      await act(async () => fonts.release());

      expect(FakeObserver.instances).toHaveLength(0);
      for (const piece of pieces) expect(piece.style.display).toBe('');
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
