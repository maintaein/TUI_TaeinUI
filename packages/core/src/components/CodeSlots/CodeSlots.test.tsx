import { createRef, StrictMode, useState } from 'react';
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
import { CodeSlots } from './CodeSlots';
import { fadeName, mergeName } from './CodeSlots.css';
import { themeContract } from '../../tokens/theme.css';
import { gsapDuration } from '../../tokens/gsapEasing';

/** 재생된 GSAP 애니메이션을 멈추고 시각을 직접 옮겨 인라인 값을 읽는다. 시험은 gsap을 직접 import하지 않으므로 gateMotion이 돌려주는 값을 받아 둔다. */
interface Seekable {
  pause(): unknown;
  time(seconds?: number): unknown;
  duration(): number;
  progress(value: number): unknown;
  play(): unknown;
  reverse(): unknown;
  reversed(): boolean;
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

const input = () => screen.getByLabelText('인증번호') as HTMLInputElement;
// 칸 그림(aria-hidden)의 칸들
const cells = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('[aria-hidden="true"] > span'));
// 굴러 들어오는 숫자만 읽는다(아래로 빠지는 복사본은 뺀다)
const digits = (container: HTMLElement) =>
  cells(container).map(
    (c) => c.querySelector('[class*="digit"]')?.textContent ?? ''
  );

/** jsdom에 주입된 생성 CSS(CSSOM)에서 규칙을 읽는다. */
function sheetRules(marker: string): CSSStyleRule[] {
  const sheet = Array.from(document.styleSheets).find((candidate) =>
    Array.from(candidate.cssRules).some((rule) => rule.cssText.includes(marker))
  );
  if (!sheet) throw new Error(`${marker}를 가진 스타일시트를 찾지 못했다`);
  return Array.from(sheet.cssRules).filter(
    (rule): rule is CSSStyleRule => rule instanceof CSSStyleRule
  );
}

// GSAP이 yPercent를 transform에 쓴다. 0이면 자리에 앉은 것이고 음수면 아직 위에서 내려오는 중이다
const rollOffset = (el: Element) =>
  Number(
    /,\s*(-?[0-9.]+)%/.exec((el as HTMLElement).style.transform)?.[1] ?? 0
  );
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
// 문서 루트로 옮겼다 되돌리므로, 레이아웃이 있는 것처럼 부모를 돌려준다(WingButton 시험과 같은 처방).
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

describe('CodeSlots', () => {
  describe('입력', () => {
    it('타이핑하면 칸에 숫자가 차고 onChange가 값을 받는다', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const { container } = render(
        <CodeSlots label="인증번호" onChange={onChange} />
      );
      await user.type(input(), '123');
      expect(digits(container)).toEqual(['1', '2', '3', '', '', '']);
      expect(onChange).toHaveBeenLastCalledWith('123');
      expect(onChange).toHaveBeenCalledTimes(3);
    });

    it('length자가 다 차면 onComplete가 한 번 불린다', async () => {
      const user = userEvent.setup();
      const onComplete = vi.fn();
      render(<CodeSlots label="인증번호" onComplete={onComplete} />);
      await user.type(input(), '12345');
      expect(onComplete).not.toHaveBeenCalled();
      await user.type(input(), '6');
      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(onComplete).toHaveBeenCalledWith('123456');
      // 다 찬 뒤의 입력은 maxLength가 막아 다시 불리지 않는다
      await user.type(input(), '7');
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('이미 찬 값과 같은 값으로 잘리는 입력은 onChange도 onComplete도 부르지 않는다', () => {
      const onChange = vi.fn();
      const onComplete = vi.fn();
      render(
        <CodeSlots
          label="인증번호"
          defaultValue="123456"
          onChange={onChange}
          onComplete={onComplete}
        />
      );
      // maxLength를 넘는 값은 사용자 입력으로는 못 오지만 스크립트 입력은 올 수 있다
      fireEvent.change(input(), { target: { value: '1234567' } });
      expect(onChange).not.toHaveBeenCalled();
      expect(onComplete).not.toHaveBeenCalled();
      expect(input().value).toBe('123456');
    });

    it('지웠다 다시 채우면 onComplete가 다시 불린다', async () => {
      const user = userEvent.setup();
      const onComplete = vi.fn();
      render(<CodeSlots label="인증번호" onComplete={onComplete} />);
      await user.type(input(), '123456');
      await user.keyboard('{Backspace}');
      await user.keyboard('9');
      expect(onComplete).toHaveBeenCalledTimes(2);
      expect(onComplete).toHaveBeenLastCalledWith('123459');
    });

    it('숫자가 아닌 글자는 버린다', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const { container } = render(
        <CodeSlots label="인증번호" onChange={onChange} />
      );
      await user.type(input(), 'a1-b2 ');
      expect(input().value).toBe('12');
      expect(digits(container).slice(0, 3)).toEqual(['1', '2', '']);
      expect(onChange).toHaveBeenCalledTimes(2);
    });

    it('붙여넣기 한 번으로 차고 onComplete가 한 번 불린다', async () => {
      const user = userEvent.setup();
      const onComplete = vi.fn();
      const { container } = render(
        <CodeSlots label="인증번호" onComplete={onComplete} />
      );
      await user.click(input());
      await user.paste('123456');
      expect(digits(container)).toEqual(['1', '2', '3', '4', '5', '6']);
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('length를 넘는 붙여넣기는 잘린다', async () => {
      const user = userEvent.setup();
      const { container } = render(<CodeSlots label="인증번호" />);
      await user.click(input());
      await user.paste('1234567890');
      expect(input().value).toBe('123456');
      expect(digits(container)).toHaveLength(6);
    });

    it.each([
      ['123 456'],
      ['123-456'],
      ['인증번호는 123456입니다'],
      ['G-123456'],
    ])(
      '구분자나 글이 낀 붙여넣기(%s)도 숫자만 남아 채워지고 onComplete가 한 번 불린다',
      async (text) => {
        const user = userEvent.setup();
        const onComplete = vi.fn();
        const { container } = render(
          <CodeSlots label="인증번호" onComplete={onComplete} />
        );
        await user.click(input());
        await user.paste(text);
        expect(input().value).toBe('123456');
        expect(digits(container)).toEqual(['1', '2', '3', '4', '5', '6']);
        expect(onComplete).toHaveBeenCalledTimes(1);
        expect(onComplete).toHaveBeenCalledWith('123456');
      }
    );

    it('짧은 조각이 넘치면 length까지 잘린다', async () => {
      const user = userEvent.setup();
      render(<CodeSlots label="인증번호" defaultValue="1234" />);
      await user.click(input());
      await user.paste('5-6 7');
      expect(input().value).toBe('123456');
    });

    it('length자 이상을 붙여넣으면 값 전체가 바뀌고 짧은 조각은 이어 붙는다', async () => {
      const user = userEvent.setup();
      const onComplete = vi.fn();
      render(
        <CodeSlots label="인증번호" defaultValue="12" onComplete={onComplete} />
      );
      await user.click(input());
      await user.paste('654321');
      expect(input().value).toBe('654321');
      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(onComplete).toHaveBeenCalledWith('654321');
    });

    it('꽉 찬 값에 새 번호를 붙여넣으면 교체된다', async () => {
      const user = userEvent.setup();
      const onComplete = vi.fn();
      render(
        <CodeSlots
          label="인증번호"
          defaultValue="123456"
          onComplete={onComplete}
        />
      );
      await user.click(input());
      await user.paste('999999');
      expect(input().value).toBe('999999');
      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(onComplete).toHaveBeenCalledWith('999999');
    });

    it('짧은 조각은 현재 값 뒤에 붙는다', async () => {
      const user = userEvent.setup();
      const onComplete = vi.fn();
      render(
        <CodeSlots label="인증번호" defaultValue="12" onComplete={onComplete} />
      );
      await user.click(input());
      await user.paste('34');
      expect(input().value).toBe('1234');
      expect(onComplete).not.toHaveBeenCalled();
    });

    it('length로 칸 수가 정해진다', async () => {
      const user = userEvent.setup();
      const onComplete = vi.fn();
      const { container } = render(
        <CodeSlots label="PIN" length={4} onComplete={onComplete} />
      );
      expect(cells(container)).toHaveLength(4);
      expect(screen.getByLabelText('PIN')).toHaveAttribute('maxlength', '4');
      await user.type(screen.getByLabelText('PIN'), '1234');
      expect(onComplete).toHaveBeenCalledWith('1234');
    });

    it('Backspace는 끝에서부터 지운다', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <CodeSlots label="인증번호" defaultValue="123" />
      );
      await user.click(input());
      await user.keyboard('{Backspace}');
      expect(input().value).toBe('12');
      expect(digits(container).slice(0, 3)).toEqual(['1', '2', '']);
    });

    it('커서가 끝이 아닌 곳으로 가면 끝으로 되돌린다', async () => {
      const user = userEvent.setup();
      render(<CodeSlots label="인증번호" defaultValue="123" />);
      await user.click(input());
      input().setSelectionRange(0, 0);
      fireEvent.keyUp(input());
      expect(input().selectionStart).toBe(3);
      expect(input().selectionEnd).toBe(3);
    });

    it('disabled면 입력되지 않는다', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<CodeSlots label="인증번호" disabled onChange={onChange} />);
      expect(input()).toBeDisabled();
      await user.type(input(), '123');
      expect(onChange).not.toHaveBeenCalled();
      expect(input().value).toBe('');
    });
  });

  describe('제어와 비제어', () => {
    it('value를 쥐면 부모가 값을 정한다', async () => {
      const user = userEvent.setup();
      const Controlled = () => {
        const [code, setCode] = useState('');
        return (
          <>
            <CodeSlots label="인증번호" value={code} onChange={setCode} />
            <button onClick={() => setCode('')}>다시</button>
          </>
        );
      };
      const { container } = render(<Controlled />);
      await user.type(input(), '12');
      expect(digits(container).slice(0, 3)).toEqual(['1', '2', '']);
      await user.click(screen.getByRole('button', { name: '다시' }));
      expect(input().value).toBe('');
      expect(digits(container).every((d) => d === '')).toBe(true);
    });

    it('부모가 받아들이지 않으면 값이 바뀌지 않는다', async () => {
      const user = userEvent.setup();
      render(<CodeSlots label="인증번호" value="12" onChange={() => {}} />);
      await user.type(input(), '3');
      expect(input().value).toBe('12');
    });

    it('defaultValue로 시작하는 비제어는 스스로 값을 쥔다', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <CodeSlots label="인증번호" defaultValue="12" />
      );
      expect(digits(container).slice(0, 3)).toEqual(['1', '2', '']);
      await user.type(input(), '3');
      expect(input().value).toBe('123');
    });

    it('value에 섞인 숫자 아닌 글자와 넘치는 글자는 걸러서 그린다', () => {
      const { container } = render(
        <CodeSlots label="인증번호" value="1a2345678" onChange={() => {}} />
      );
      expect(digits(container)).toEqual(['1', '2', '3', '4', '5', '6']);
    });
  });

  describe('접근성과 입력 구조', () => {
    it('label이 접근 가능한 이름이고 입력은 input 하나다', () => {
      const { container } = render(<CodeSlots label="인증번호" />);
      expect(screen.getByRole('textbox', { name: '인증번호' })).toBe(input());
      expect(container.querySelectorAll('input')).toHaveLength(1);
    });

    it('자동 채움 속성을 갖는다', () => {
      render(<CodeSlots label="인증번호" />);
      expect(input()).toHaveAttribute('autocomplete', 'one-time-code');
      expect(input()).toHaveAttribute('inputmode', 'numeric');
      expect(input()).toHaveAttribute('pattern', '\\d*');
      expect(input()).toHaveAttribute('maxlength', '6');
    });

    it('숨은 input은 display:none이 아니라 투명하게 겹쳐 있다', () => {
      render(<CodeSlots label="인증번호" />);
      // vanilla-extract 클래스는 jsdom 계산 스타일에 안 실려 생성 CSS 규칙을 읽는다
      const rule = sheetRules('CodeSlots_input').find((r) =>
        input().classList.contains(r.selectorText.slice(1))
      )!;
      expect(rule.style.getPropertyValue('display')).not.toBe('none');
      expect(rule.style.getPropertyValue('visibility')).not.toBe('hidden');
      expect(rule.style.getPropertyValue('position')).toBe('absolute');
      expect(rule.style.getPropertyValue('opacity')).toBe('0');
      expect(getComputedStyle(input()).display).not.toBe('none');
    });

    it('칸 그림은 aria-hidden이다', () => {
      const { container } = render(
        <CodeSlots label="인증번호" defaultValue="12" />
      );
      const picture = cells(container)[0].parentElement!;
      expect(picture).toHaveAttribute('aria-hidden', 'true');
      expect(picture.contains(input())).toBe(false);
    });

    it('error면 aria-invalid이고 errorMessage가 aria-describedby로 이어진다', () => {
      render(
        <CodeSlots label="인증번호" error errorMessage="번호가 틀렸습니다" />
      );
      expect(input()).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByText('번호가 틀렸습니다')).toHaveAttribute(
        'id',
        input().getAttribute('aria-describedby')!
      );
    });

    it('error가 아니면 aria-invalid는 false다', () => {
      render(<CodeSlots label="인증번호" />);
      expect(input()).toHaveAttribute('aria-invalid', 'false');
    });

    it('success면 successMessage가 보이고 연결된다', () => {
      render(
        <CodeSlots label="인증번호" success successMessage="확인했습니다" />
      );
      const message = screen.getByText('확인했습니다');
      expect(message).toBeVisible();
      expect(message).toHaveAttribute(
        'id',
        input().getAttribute('aria-describedby')!
      );
    });

    it('helperText는 오류도 성공도 아닐 때 연결된다', () => {
      render(<CodeSlots label="인증번호" helperText="문자로 보냈습니다" />);
      expect(screen.getByText('문자로 보냈습니다')).toHaveAttribute(
        'id',
        input().getAttribute('aria-describedby')!
      );
    });

    it('ref는 숨은 input으로 가고 name·autoFocus와 className이 간다', () => {
      const ref = createRef<HTMLInputElement>();
      const { container } = render(
        <CodeSlots
          ref={ref}
          label="인증번호"
          name="otp"
          // 통과 여부를 보는 시험이라 쓴다
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
          className="mine"
        />
      );
      expect(ref.current).toBe(input());
      expect(input()).toHaveAttribute('name', 'otp');
      expect(input()).toHaveFocus();
      expect(container.firstElementChild).toHaveClass('mine');
    });
  });

  describe('지금 칸', () => {
    const active = (container: HTMLElement) =>
      cells(container).findIndex(
        (c) => c.getAttribute('data-active') === 'true'
      );

    it('지금 입력할 칸을 표시하고 다 차면 마지막 칸이다', async () => {
      const user = userEvent.setup();
      const { container } = render(<CodeSlots label="인증번호" />);
      expect(active(container)).toBe(0);
      await user.type(input(), '12');
      expect(active(container)).toBe(2);
      await user.type(input(), '3456');
      expect(active(container)).toBe(5);
    });
  });

  describe('움직임', () => {
    const ghosts = (container: HTMLElement) =>
      container.querySelectorAll('[class*="ghost"]');
    const digitEl = (container: HTMLElement, i: number) =>
      cells(container)[i].querySelector('[class*="digit"]')!;

    it('숫자가 들어오면 그 칸의 숫자가 위에서 내려와 자리에 앉는다', async () => {
      const user = userEvent.setup();
      const { container } = render(<CodeSlots label="인증번호" />);
      await user.type(input(), '1');
      // 실시간 시계에 기대지 않는다. 부하로 입력이 굴림(base)보다 오래 걸려도 같은 결과여야 해서 굴림을 세워 시각을 직접 옮긴다
      const roll = lastPlayed();
      roll.pause();
      act(() => void roll.time(0.01));
      expect(rollOffset(digitEl(container, 0))).toBeLessThan(0);
      act(() => void roll.progress(1));
      expect(rollOffset(digitEl(container, 0))).toBe(0);
      // 다른 칸은 비어 있다
      expect(digits(container).slice(1)).toEqual(['', '', '', '', '']);
    });

    it('지우면 숫자가 아래로 빠지는 복사본이 남았다가 끝나면 사라진다', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <CodeSlots label="인증번호" defaultValue="12" />
      );
      await user.click(input());
      await user.keyboard('{Backspace}');
      expect(ghosts(container)).toHaveLength(1);
      expect(ghosts(container)[0]).toHaveTextContent('2');
      expect(cells(container)[1]).toContainElement(
        ghosts(container)[0] as HTMLElement
      );
      await waitFor(() => expect(ghosts(container)).toHaveLength(0));
    });

    it('부모가 값을 한꺼번에 비우면 지워진 칸마다 빠진다', async () => {
      const { container, rerender } = render(
        <CodeSlots label="인증번호" value="123" onChange={() => {}} />
      );
      rerender(<CodeSlots label="인증번호" value="" onChange={() => {}} />);
      expect(ghosts(container)).toHaveLength(3);
      await waitFor(() => expect(ghosts(container)).toHaveLength(0));
    });

    it('error가 걸리면 칸마다 시차를 둔 물결 클래스가 붙는다', () => {
      const { container, rerender } = render(<CodeSlots label="인증번호" />);
      expect(container.querySelectorAll('[class*="wave"]')).toHaveLength(0);
      rerender(<CodeSlots label="인증번호" error errorMessage="틀림" />);
      const waved = cells(container);
      expect(waved.every((c) => /wave/.test(c.className))).toBe(true);
      const delays = waved.map((c) => (c as HTMLElement).style.animationDelay);
      expect(new Set(delays).size).toBe(6);
    });

    it('처음부터 error면 물결치지 않고, 다시 걸릴 때마다 물결 클래스가 번갈아 바뀐다', () => {
      const wave = (container: HTMLElement) =>
        cells(container)[0]
          .className.split(' ')
          .find((n) => /wave/.test(n));
      const { container, rerender } = render(
        <CodeSlots label="인증번호" error errorMessage="틀림" />
      );
      expect(wave(container)).toBeUndefined();
      rerender(<CodeSlots label="인증번호" error={false} />);
      rerender(<CodeSlots label="인증번호" error errorMessage="틀림" />);
      const first = wave(container);
      expect(first).toBeDefined();
      rerender(<CodeSlots label="인증번호" error={false} />);
      rerender(<CodeSlots label="인증번호" error errorMessage="틀림" />);
      expect(wave(container)).toBeDefined();
      expect(wave(container)).not.toBe(first);
    });

    it('success면 칸들이 합쳐진 상태 클래스가 붙고 error가 함께 켜져 있으면 붙지 않는다', () => {
      const { container, rerender } = render(<CodeSlots label="인증번호" />);
      const row = () => cells(container)[0].parentElement!;
      expect(row().className).not.toMatch(/merged/);
      rerender(<CodeSlots label="인증번호" success successMessage="맞음" />);
      expect(row().className).toMatch(/merged/);
      const both = render(
        <CodeSlots
          label="인증번호"
          error
          errorMessage="틀림"
          success
          successMessage="맞음"
        />
      );
      expect(cells(both.container)[0].parentElement!.className).not.toMatch(
        /merged/
      );
    });
  });

  describe('성공 합쳐짐 두 박자', () => {
    const { base, slower } = gsapDuration;
    // settle(power3.out)의 진행도. 선형이면 0.5가 되는 자리에서 0.9375가 되어 이징이 settle인지 가른다
    const settle = (t: number) => 1 - (1 - t) ** 4;
    const row = (container: HTMLElement) =>
      cells(container)[0].parentElement as HTMLElement;
    const fade = (container: HTMLElement) =>
      Number(row(container).style.getPropertyValue(fadeName));
    const merge = (container: HTMLElement) =>
      Number(row(container).style.getPropertyValue(mergeName));
    // 합쳐짐 타임라인: 길이가 두 박자의 합인 것
    const mergeTimeline = () => {
      const found = (played.animations as Seekable[])
        .filter((a) => Math.abs(a.duration() - (base + slower)) < 1e-6)
        .at(-1);
      if (!found) throw new Error('합쳐짐 타임라인이 없습니다');
      return found;
    };
    // 성공을 켠 뒤 타임라인을 세운다(시각은 시험이 옮긴다)
    const succeed = () => {
      const view = render(<CodeSlots label="인증번호" />);
      view.rerender(
        <CodeSlots label="인증번호" success successMessage="맞음" />
      );
      const tl = mergeTimeline();
      tl.pause();
      return { ...view, tl };
    };
    const at = (tl: Seekable, seconds: number) =>
      act(() => void tl.time(seconds));

    it('① 칸 테두리와 바탕이 base 동안 settle로 흐려지고 그동안 칸은 모이지 않는다', () => {
      const { container, tl } = succeed();
      at(tl, 0);
      expect([fade(container), merge(container)]).toEqual([1, 0]);
      at(tl, base / 2);
      expect(fade(container)).toBeCloseTo(1 - settle(0.5), 2);
      expect(merge(container)).toBe(0);
      at(tl, base);
      expect([fade(container), merge(container)]).toEqual([0, 0]);
    });

    it('② 칸이 모이고 묶음이 알약이 되는 숫자가 slower 동안 settle로 가고 그동안 흐림은 끝나 있다', () => {
      const { container, tl } = succeed();
      at(tl, base + slower / 2);
      expect(merge(container)).toBeCloseTo(settle(0.5), 2);
      expect(fade(container)).toBe(0);
      at(tl, base + slower);
      expect([fade(container), merge(container)]).toEqual([0, 1]);
      // 폭은 칸 줄을 따라 변하는 레이아웃이라 transform(scale)을 쓰지 않는다
      for (const el of [row(container), row(container).firstElementChild!]) {
        expect((el as HTMLElement).style.transform).toBe('');
      }
    });

    it('묶음은 칸 뒤(첫 자식)에 깔린 aria-hidden 요소 하나이고 칸 목록에 끼지 않는다', () => {
      const { container } = succeed();
      const bundle = row(container).firstElementChild as HTMLElement;
      expect(bundle.tagName).toBe('DIV');
      expect(bundle.className).toMatch(/bundle/);
      expect(bundle.closest('[aria-hidden="true"]')).toBe(row(container));
      expect(cells(container)).toHaveLength(6);
    });

    it('성공을 끄면 같은 길을 거꾸로 간다(② 뒤 ①). 처음부터 다시 재생하지 않는다', () => {
      const { container, rerender, tl } = succeed();
      act(() => void tl.progress(1));
      rerender(<CodeSlots label="인증번호" />);
      expect(tl.reversed()).toBe(true);
      // 끝에서 시작해 거꾸로 돈다(0으로 되돌아가 다시 시작하지 않는다)
      expect(Number(tl.time())).toBeGreaterThan(base + slower - 0.1);
      at(tl, base + slower / 2);
      expect(merge(container)).toBeCloseTo(settle(0.5), 2);
      expect(fade(container)).toBe(0);
      at(tl, base / 2);
      expect(merge(container)).toBe(0);
      expect(fade(container)).toBeCloseTo(1 - settle(0.5), 2);
    });

    it('① 도중에 성공이 풀리면 지금 자리에서 거꾸로 가고 끝 모양은 성공이 아니다', () => {
      const { container, rerender, tl } = succeed();
      at(tl, base / 2);
      rerender(<CodeSlots label="인증번호" />);
      expect(tl.reversed()).toBe(true);
      expect(Number(tl.time())).toBeLessThan(base);
      // 거꾸로 가는 동안은 합쳐진 모양(윤곽 자르기·색 전이 끔)을 쥐고, 0에 닿으면 놓는다
      expect(row(container).className).toMatch(/merged/);
      act(() => void tl.progress(0, false));
      expect([fade(container), merge(container)]).toEqual([1, 0]);
      expect(row(container).className).not.toMatch(/merged/);
    });

    it('② 도중에 성공이 풀리면 지금 자리에서 거꾸로 가고, 다시 켜지면 지금 자리에서 앞으로 가 끝 모양이 성공이다', () => {
      const { container, rerender, tl } = succeed();
      at(tl, base + slower / 2);
      rerender(<CodeSlots label="인증번호" />);
      expect(tl.reversed()).toBe(true);
      const time = Number(tl.time());
      expect(time).toBeGreaterThan(base);
      expect(time).toBeLessThan(base + slower);
      rerender(<CodeSlots label="인증번호" success successMessage="맞음" />);
      expect(tl.reversed()).toBe(false);
      expect(Number(tl.time())).toBeGreaterThanOrEqual(time - 0.05);
      act(() => void tl.progress(1));
      expect([fade(container), merge(container)]).toEqual([0, 1]);
      expect(row(container).className).toMatch(/merged/);
    });

    // 켠 직후(GSAP이 한 틱도 돌기 전)에 바뀌는 경로. 값이 실제 틱이 돈 뒤에도 처음 모양에 서 있어야 한다(앞 렌더의 play가 살아 있으면 fade 0, merge 1까지 재생된다)
    const settleTicks = () => new Promise((r) => setTimeout(r, 1000));
    const successOn = (
      <CodeSlots label="인증번호" success successMessage="맞음" />
    );
    const errorOn = (
      <CodeSlots
        label="인증번호"
        error
        errorMessage="틀림"
        success
        successMessage="맞음"
      />
    );
    const wrappers = [
      ['일반', undefined],
      ['StrictMode', StrictMode],
    ] as const;

    it.each(wrappers)(
      '성공을 켠 직후 한 틱도 돌기 전에 끄면 틱이 돈 뒤에도 처음 모양이고 합쳐진 모양이 없다(%s)',
      async (_name, wrapper) => {
        const { container, rerender } = render(<CodeSlots label="인증번호" />, {
          wrapper,
        });
        rerender(successOn);
        rerender(<CodeSlots label="인증번호" />);
        await settleTicks();
        expect(row(container).className).not.toMatch(/merged/);
        expect([fade(container), merge(container)]).toEqual([1, 0]);
      }
    );

    it.each(wrappers)(
      '성공을 켠 직후 error를 켜도 틱이 돈 뒤에 처음 모양이고 합쳐진 모양이 없다(%s)',
      async (_name, wrapper) => {
        const { container, rerender } = render(<CodeSlots label="인증번호" />, {
          wrapper,
        });
        rerender(successOn);
        rerender(errorOn);
        await settleTicks();
        expect(row(container).className).not.toMatch(/merged/);
        expect([fade(container), merge(container)]).toEqual([1, 0]);
        expect(cells(container)[0].className).toMatch(/cellError/);
      }
    );

    it('켜고 끄고(즉시) 다시 켜면 정상으로 합쳐진다', async () => {
      const { container, rerender } = render(<CodeSlots label="인증번호" />);
      rerender(successOn);
      rerender(<CodeSlots label="인증번호" />);
      rerender(successOn);
      await settleTicks();
      expect([fade(container), merge(container)]).toEqual([0, 1]);
      expect(row(container).className).toMatch(/merged/);
    });

    it('처음부터 success면 전이 없이 합쳐진 끝 모양으로 서 있다', () => {
      const { container } = render(<CodeSlots label="인증번호" success />);
      expect([fade(container), merge(container)]).toEqual([0, 1]);
      expect(row(container).className).toMatch(/merged/);
    });

    it('error가 success를 이기면 합쳐지지 않고 error 모양이다', () => {
      const { container, rerender } = render(
        <CodeSlots label="인증번호" success />
      );
      rerender(
        <CodeSlots
          label="인증번호"
          error
          errorMessage="틀림"
          success
          successMessage="맞음"
        />
      );
      const tl = mergeTimeline();
      expect(tl.reversed()).toBe(true);
      act(() => void tl.progress(0, false));
      // 묶음의 불투명도(1 - fade)가 0이라 보이지 않는다
      expect([fade(container), merge(container)]).toEqual([1, 0]);
      expect(row(container).className).not.toMatch(/merged/);
      expect(cells(container)[0].className).toMatch(/cellError/);
      expect(input()).toHaveAttribute('aria-invalid', 'true');
    });

    it('움직임 줄이기에서는 타임라인 없이 끝 모양이 바로 서고 풀리면 바로 돌아온다', () => {
      stubReducedMotion();
      const before = played.animations.length;
      const { container, rerender } = render(<CodeSlots label="인증번호" />);
      rerender(<CodeSlots label="인증번호" success successMessage="맞음" />);
      expect(row(container).className).toMatch(/settled/);
      expect(row(container).className).toMatch(/merged/);
      expect(row(container).style.getPropertyValue(fadeName)).toBe('');
      expect(
        (played.animations as Seekable[])
          .slice(before)
          .some((a) => Math.abs(a.duration() - (base + slower)) < 1e-6)
      ).toBe(false);
      rerender(<CodeSlots label="인증번호" />);
      expect(row(container).className).not.toMatch(/settled/);
    });
  });

  describe('움직임 줄이기', () => {
    it('굴러 들어옴·빠짐·물결 없이 숫자와 색만 바뀐다', async () => {
      stubReducedMotion();
      const user = userEvent.setup();
      const { container, rerender } = render(<CodeSlots label="인증번호" />);
      await user.type(input(), '12');
      expect(digits(container).slice(0, 3)).toEqual(['1', '2', '']);
      // 숫자는 처음부터 자리에 앉아 있다(transform에 내려오는 오프셋이 없다)
      const els = [...container.querySelectorAll('[class*="digit"]')];
      expect(els).toHaveLength(2);
      expect(els.map(rollOffset)).toEqual([0, 0]);
      await user.keyboard('{Backspace}');
      expect(container.querySelectorAll('[class*="ghost"]')).toHaveLength(0);
      rerender(<CodeSlots label="인증번호" error errorMessage="틀림" />);
      rerender(<CodeSlots label="인증번호" />);
      rerender(<CodeSlots label="인증번호" error errorMessage="틀림" />);
      expect(container.querySelectorAll('[class*="wave"]')).toHaveLength(0);
      expect(cells(container)[0].className).toMatch(/cellError/);
    });
  });

  describe('생성 CSS', () => {
    const rules = () => sheetRules('CodeSlots_cell');
    const byClass = (name: string) =>
      rules().find((r) =>
        new RegExp(`^\\.CodeSlots_${name}__\\w+$`).test(r.selectorText)
      );
    const { duration, easing } = themeContract.animation;

    it('물결은 TextField 흔들림과 같은 slower와 drift이고 둘이 이름이 다르며 fill-mode가 없다', () => {
      const a = byClass('wave_a')!.style.getPropertyValue('animation');
      const b = byClass('wave_b')!.style.getPropertyValue('animation');
      for (const animation of [a, b]) {
        expect(animation).toContain(duration.slower);
        expect(animation).toContain(easing.drift);
        expect(animation).not.toMatch(/\b(infinite|forwards|both)\b/);
      }
      expect(a.split(' ')[0]).not.toBe(b.split(' ')[0]);
    });

    it('칸 줄의 간격과 둥글기는 merge에서, 묶음의 불투명도는 fade에서 유도되고 성공 끝 모양은 settled가 세운다', () => {
      const cellsRule = byClass('cells')!;
      // 처음 모양: fade 1, merge 0
      expect(cellsRule.style.getPropertyValue(fadeName)).toBe('1');
      expect(cellsRule.style.getPropertyValue(mergeName)).toBe('0');
      expect(cellsRule.style.getPropertyValue('gap')).toContain(
        `* (1 - var(${mergeName}))`
      );
      // 끝 모양(움직임 줄이기): fade 0, merge 1
      const settled = byClass('settled')!;
      expect(settled.style.getPropertyValue(fadeName)).toBe('0');
      expect(settled.style.getPropertyValue(mergeName)).toBe('1');
      // 묶음은 fade가 줄수록 나타난다
      expect(byClass('bundle')!.style.getPropertyValue('opacity')).toBe(
        `calc(1 - var(${fadeName}))`
      );
    });

    it('묶음은 흰 면과 success.dark 테두리이고 scale 없이 칸 줄을 따라 폭이 변한다', () => {
      const bundle = byClass('bundle')!.style;
      expect(bundle.getPropertyValue('border')).toContain(
        themeContract.color.success.dark
      );
      expect(bundle.getPropertyValue('background-color')).toBe(
        themeContract.color.background.paper
      );
      expect(bundle.getPropertyValue('position')).toBe('absolute');
      expect(bundle.getPropertyValue('inset')).toBe('0');
      // 폭을 따로 쥐지 않고 칸 줄(inset 0)을 따라가며 transform은 어디에도 없다
      expect(bundle.getPropertyValue('width')).toBe('');
      expect(bundle.getPropertyValue('transform')).toBe('');
      expect(byClass('cells')!.style.getPropertyValue('transform')).toBe('');
      // 모서리 밖은 칸 줄이 잘라 낸다
      expect(byClass('merged')!.style.getPropertyValue('overflow')).toBe(
        'hidden'
      );
    });

    it('칸의 테두리와 바탕은 fade만큼만 남고 색 전이는 칸 전체에 있되 합쳐진 동안만 꺼진다', () => {
      const border = (name: string) =>
        byClass(name)!.style.getPropertyValue('border-color');
      expect(
        byClass('cell')!.style.getPropertyValue('background-color')
      ).toContain(fadeName);
      expect(border('cellError')).toContain(themeContract.color.error.main);
      expect(border('cellError')).toContain(fadeName);
      const transition = byClass('cell')!.style.getPropertyValue('transition');
      expect(transition).toContain('border-color');
      expect(transition).toContain(duration.fast);
      expect(transition).toContain(easing.settle);
      expect(byClass('cellError')!.style.getPropertyValue('transition')).toBe(
        ''
      );
      // 합쳐진 동안(fade를 모는 동안)은 전이가 뒤처지지 않게 끈다
      const off = rules().find(
        (r) =>
          / \.CodeSlots_cell__\w+$/.test(r.selectorText) &&
          /_merged__/.test(r.selectorText) &&
          !/data-active/.test(r.selectorText)
      );
      expect(off!.style.getPropertyValue('transition')).toBe('none');
      // 성공 색은 칸이 아니라 묶음의 것이다
      expect(byClass('cellSuccess')).toBeUndefined();
    });

    // 포커스 규칙: 묶음 안에 포커스가 있을 때 지금 칸(data-active)
    const focusRule = (name: string) =>
      rules().find(
        (r) =>
          /:focus-within/.test(r.selectorText) &&
          /data-active/.test(r.selectorText) &&
          new RegExp(`\\.CodeSlots_${name}__\\w+\\[`).test(r.selectorText)
      );

    it('포커스면 지금 칸의 테두리 색이 primary로 바뀐다(fade를 따른다)', () => {
      const focus = focusRule('cell')!.style.getPropertyValue('border-color');
      expect(focus).toContain(themeContract.color.primary.main);
      expect(focus).toContain(fadeName);
    });

    it('오류 색이 포커스 색을 이긴다: 같은 포커스 규칙이 error 색이고 cell의 것보다 뒤에 있다', () => {
      const all = rules();
      const cell = focusRule('cell')!;
      const error = focusRule('cellError')!;
      expect(error.style.getPropertyValue('border-color')).toContain(
        themeContract.color.error.main
      );
      // 특정도가 같으므로 뒤에 놓인 쪽이 이긴다
      expect(all.indexOf(error)).toBeGreaterThan(all.indexOf(cell));
    });

    it('합쳐진 뒤 포커스면 묶음 테두리가 색은 그대로 1px에서 2px로 굵어지고 축소 모션이면 전이가 없다', () => {
      const base = byClass('bundle')!.style;
      expect(base.getPropertyValue('border')).toContain('1px solid');
      const focus = rules().find(
        (r) =>
          /:focus-within/.test(r.selectorText) &&
          /\.CodeSlots_bundle__\w+$/.test(r.selectorText)
      )!;
      expect(focus.style.getPropertyValue('border-width')).toBe('2px');
      // 색은 성공을 나타내므로 바꾸지 않고 링도 더하지 않는다
      expect(focus.style.getPropertyValue('border-color')).toBe('');
      expect(focus.style.length).toBe(1);
      const transition = base.getPropertyValue('transition');
      expect(transition).toContain('border-width');
      expect(transition).toContain(duration.fast);
      expect(transition).toContain(easing.settle);
    });

    it('비활성 칸은 포커스 규칙에서도 비활성 색이다: 포커스 규칙이 cell의 것보다 뒤에 있다', () => {
      const all = rules();
      const cell = focusRule('cell')!;
      const disabled = focusRule('cellDisabled')!;
      expect(disabled.style.getPropertyValue('border-color')).toContain(
        themeContract.color.border.default
      );
      expect(all.indexOf(disabled)).toBeGreaterThan(all.indexOf(cell));
    });

    it('바깥 포커스 링(outline)을 어디에도 쓰지 않고 합쳐진 모양은 윤곽 자르기만 가진다', () => {
      for (const rule of rules()) {
        expect(rule.style.getPropertyValue('outline')).toBe('');
        expect(rule.style.getPropertyValue('outline-offset')).toBe('');
      }
      const merged = byClass('merged')!.style;
      expect(merged.getPropertyValue('overflow')).toBe('hidden');
      expect(merged.length).toBe(1);
      expect(
        rules().filter((r) => /_merged__\w+$/.test(r.selectorText))
      ).toHaveLength(1);
    });

    it('움직임 줄이기 미디어 질의에서 칸의 색 전이와 묶음의 굵기 전이가 꺼진다', () => {
      const sheet = Array.from(document.styleSheets).find((c) =>
        Array.from(c.cssRules).some((r) => r.cssText.includes('CodeSlots_cell'))
      )!;
      const reduced = Array.from(sheet.cssRules)
        .filter((r): r is CSSMediaRule => r instanceof CSSMediaRule)
        .filter((m) => /prefers-reduced-motion/.test(m.conditionText))
        .flatMap((m) => Array.from(m.cssRules) as CSSStyleRule[])
        .filter((r) => /CodeSlots_(cell|bundle)__\w+$/.test(r.selectorText));
      // 칸의 색 전이와 묶음의 굵기 전이
      expect(
        reduced.map((r) => r.style.getPropertyValue('transition'))
      ).toEqual(['none', 'none']);
    });
  });
});
