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
import { HangulAssemble } from './HangulAssemble';

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
  ...container.querySelectorAll<HTMLElement>(`[data-hangul-${name}]`),
];

/** 재생이 인라인으로 건 값이 하나라도 남았는가 */
const hasInlineMotion = (container: HTMLElement): boolean =>
  [...q(container, 'glyph'), ...q(container, 'jamo')].some(
    (el) => el.style.opacity !== '' || el.style.transform !== ''
  );

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('HangulAssemble', () => {
  describe('구조와 접근성', () => {
    it('완성 문장이 접근성 트리에 한 번 있고 제목 이름도 그 문장이다', () => {
      render(<HangulAssemble text="안녕하세요" as="h1" />);

      const sentence = screen.getByText('안녕하세요');
      expect(isInaccessible(sentence)).toBe(false);
      expect(
        screen.getByRole('heading', { level: 1, name: '안녕하세요' })
      ).toBeInTheDocument();
    });

    it('루트에 aria-label을 쓰지 않는다', () => {
      const { container } = render(<HangulAssemble text="안녕" />);
      expect(container.firstElementChild).not.toHaveAttribute('aria-label');
    });

    it('시각 묶음은 aria-hidden이고 글자와 자모 span은 접근성 트리에 없다', () => {
      const { container } = render(<HangulAssemble text="한글 A" />);

      const visual = container.querySelector('[data-hangul-visual]');
      expect(visual).toHaveAttribute('aria-hidden', 'true');
      const hidden = [...q(container, 'glyph'), ...q(container, 'jamo')];
      expect(hidden.length).toBeGreaterThan(0);
      for (const el of hidden) {
        expect(isInaccessible(el), el.textContent ?? '').toBe(true);
      }
    });

    it('기본 요소는 p이고 as로 바꾼다', () => {
      const { container, rerender } = render(<HangulAssemble text="가" />);
      expect(container.firstElementChild?.tagName).toBe('P');

      rerender(<HangulAssemble text="가" as="span" />);
      expect(container.firstElementChild?.tagName).toBe('SPAN');
    });

    it('className과 ref가 루트 요소로 간다', () => {
      const ref = createRef<HTMLElement>();
      const { container } = render(
        <HangulAssemble text="가" className="custom" ref={ref} />
      );

      expect(container.firstElementChild).toHaveClass('custom');
      expect(ref.current).toBe(container.firstElementChild);
    });
  });

  describe('글자 칸', () => {
    it('공백으로 나뉜 낱말마다 묶음이 하나씩이고 공백은 묶음 사이에 그대로 있다', () => {
      const { container } = render(
        <HangulAssemble text="안녕 하세요  hello" />
      );

      // 자모 조각의 글자는 빼고 완성 글자만 읽는다.
      const glyphsOf = (el: Element) =>
        [...el.querySelectorAll('[data-hangul-glyph]')]
          .map((g) => g.textContent)
          .join('');
      expect(q(container, 'word').map(glyphsOf)).toEqual([
        '안녕',
        '하세요',
        'hello',
      ]);
      const visual = container.querySelector('[data-hangul-visual]');
      expect(visual?.childNodes[1].textContent).toBe(' ');
      expect(visual?.childNodes[3].textContent).toBe('  ');
    });

    it('한글 글자 칸에는 자모 조각이 2개 또는 3개 있다 (하 → ㅎㅏ, 한 → ㅎㅏㄴ)', () => {
      const { container } = render(<HangulAssemble text="하한" />);

      const pieces = q(container, 'cell').map((c) =>
        [...c.querySelectorAll('[data-hangul-jamo]')].map((j) => j.textContent)
      );
      expect(pieces).toEqual([
        ['ㅎ', 'ㅏ'],
        ['ㅎ', 'ㅏ', 'ㄴ'],
      ]);
    });

    it('조합용 자모로 쓴 한글(NFD)도 글자 칸 하나와 자모 조각이 된다', () => {
      // U+1112 U+1161 U+11AB = 한(NFD). 낭독용 숨은 문장은 원문 그대로다.
      const nfd = '\u1112\u1161\u11AB';
      const { container } = render(<HangulAssemble text={nfd} />);

      expect(q(container, 'cell')).toHaveLength(1);
      expect(q(container, 'glyph')[0].textContent).toBe('한');
      expect(q(container, 'jamo').map((j) => j.textContent)).toEqual([
        'ㅎ',
        'ㅏ',
        'ㄴ',
      ]);
      expect(screen.getByText(nfd)).toBeInTheDocument();
    });

    it('ZWJ로 이은 이모지는 글자 칸 하나이고 자모 조각이 없다', () => {
      const family = '\u{1F468}\u200D\u{1F469}\u200D\u{1F467}';
      const { container } = render(<HangulAssemble text={family} />);

      expect(q(container, 'cell')).toHaveLength(1);
      expect(q(container, 'glyph')[0].textContent).toBe(family);
      expect(q(container, 'jamo')).toHaveLength(0);
    });

    it('음절 뒤에 결합 부호가 붙은 칸은 통째로 한 그림이고 자모 조각이 없다', () => {
      const accented = '가\u0301';
      const { container } = render(<HangulAssemble text={accented} />);

      expect(q(container, 'cell')).toHaveLength(1);
      expect(q(container, 'glyph')[0].textContent).toBe(accented);
      expect(q(container, 'jamo')).toHaveLength(0);
    });

    it('비한글 글자(라틴, 숫자, 문장부호, 홀로 쓴 자모)에는 자모 조각이 없다', () => {
      const { container } = render(<HangulAssemble text="A1.ㄱ" />);

      expect(q(container, 'cell')).toHaveLength(4);
      expect(q(container, 'jamo')).toHaveLength(0);
    });
  });

  describe('언제 숨기고 언제 재생하나', () => {
    it('IntersectionObserver가 없으면 아무것도 숨기지 않는다', () => {
      const { container } = render(<HangulAssemble text="안녕하세요" />);

      expect(hasInlineMotion(container)).toBe(false);
    });

    it('축소 모션이면 관찰자가 있어도 숨기지 않고 관찰도 하지 않는다', () => {
      installObserver();
      placeBelowViewport();
      installReducedMotion();
      const { container } = render(<HangulAssemble text="안녕하세요" />);

      expect(hasInlineMotion(container)).toBe(false);
      expect(FakeObserver.instances).toHaveLength(0);
    });

    it('마운트할 때 이미 화면 안이면 그려지기 전에 재생 전 상태로 바꾸고, 재생한 뒤 인라인 값을 걷는다', async () => {
      installObserver();
      const { container } = render(<HangulAssemble text="한글" />);

      // render가 돌아온 시점이 곧 첫 그림 전이다(레이아웃 효과가 이미 끝났다).
      expect(q(container, 'glyph').map((g) => g.style.opacity)).toEqual([
        '0',
        '0',
      ]);
      const pieces = q(container, 'jamo');
      expect(pieces).toHaveLength(6);
      for (const piece of pieces) {
        expect(piece.style.opacity).toBe('0');
        expect(piece.style.transform).not.toBe('');
      }
      expect(FakeObserver.instances).toHaveLength(0);

      await waitFor(() => expect(hasInlineMotion(container)).toBe(false), {
        timeout: 4000,
      });
    });

    it('흩어진 자리는 조각마다 다르고 렌더마다 같다', () => {
      installObserver();
      const place = (c: HTMLElement) =>
        q(c, 'jamo').map((j) => j.style.transform);
      const first = render(<HangulAssemble text="한글" />);
      const a = place(first.container);
      first.unmount();
      const second = render(<HangulAssemble text="한글" />);

      expect(place(second.container)).toEqual(a);
      expect(new Set(a).size).toBe(a.length);
    });

    it('화면 밖이면 첫 렌더는 완성 문장이고, 관찰자가 화면 밖이라고 알리면 숨기고, 들어오면 한 번 재생한다', async () => {
      installObserver();
      placeBelowViewport();
      const { container } = render(<HangulAssemble text="한글" />);

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
      const { container } = render(<HangulAssemble text="한글" />);

      act(() => FakeObserver.instances[0].report(true));

      expect(hasInlineMotion(container)).toBe(false);
    });

    it('재생이 끝난 뒤 text가 바뀌면 다시 재생하지 않고 새 문장을 완성 상태로 보인다', async () => {
      installObserver();
      const { container, rerender } = render(<HangulAssemble text="한글" />);
      await waitFor(() => expect(hasInlineMotion(container)).toBe(false), {
        timeout: 4000,
      });

      rerender(<HangulAssemble text="다른 문장" />);

      expect(hasInlineMotion(container)).toBe(false);
      expect(q(container, 'cell')).toHaveLength(4);
    });

    it('재생 도중 text가 바뀌면 인라인 값을 걷어 새 문장을 완성 상태로 보인다', () => {
      installObserver();
      const { container, rerender } = render(<HangulAssemble text="한글" />);
      expect(hasInlineMotion(container)).toBe(true);

      rerender(<HangulAssemble text="다른 문장" />);

      expect(hasInlineMotion(container)).toBe(false);
    });

    it('언마운트하면 타임라인을 죽여 떼어진 글자에 값을 더 쓰지 않는다', async () => {
      installObserver();
      const { container, unmount } = render(<HangulAssemble text="한글" />);
      const glyphs = q(container, 'glyph');
      const pieces = q(container, 'jamo');

      unmount();
      // 타임라인이 살아 있으면 다음 틱에 떼어진 요소에 인라인 값을 다시 쓴다.
      await new Promise((resolveWait) => setTimeout(resolveWait, 300));

      for (const el of [...glyphs, ...pieces]) {
        expect(el.style.opacity).toBe('');
        expect(el.style.transform).toBe('');
      }
    });
  });

  describe('인쇄', () => {
    it('인쇄에서는 인라인 값을 !important로 이겨 완성 글자만 보인다', () => {
      const css = readFileSync(
        resolve(__dirname, './HangulAssemble.css.ts'),
        'utf-8'
      );
      expect(css).toMatch(/print:[^}]*opacity: '1 !important'/);
      expect(css).toMatch(/print:[^}]*opacity: '0 !important'/);
    });
  });
});
