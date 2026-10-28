import { createRef, useState } from 'react';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  it,
  expect,
  vi,
} from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CodeSlots } from './CodeSlots';
import { themeContract } from '../../tokens/theme.css';

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
// 문서 루트로 옮겼다 되돌리므로, 레이아웃이 있는 것처럼 부모를 돌려준다(StampButton 시험과 같은 처방).
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
      expect(rollOffset(digitEl(container, 0))).toBeLessThan(0);
      await waitFor(() => expect(rollOffset(digitEl(container, 0))).toBe(0));
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

    it('success면 칸들이 합쳐진 상태 클래스가 붙고 error가 이긴다', () => {
      const { container, rerender } = render(<CodeSlots label="인증번호" />);
      const row = () => cells(container)[0].parentElement!;
      expect(row().className).not.toMatch(/merged/);
      rerender(<CodeSlots label="인증번호" success successMessage="맞음" />);
      expect(row().className).toMatch(/merged/);
      rerender(
        <CodeSlots
          label="인증번호"
          error
          errorMessage="틀림"
          success
          successMessage="맞음"
        />
      );
      expect(row().className).not.toMatch(/merged/);
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

    it('합쳐짐은 간격이 0이 되고 전이는 slower와 settle이다', () => {
      expect(byClass('merged')!.style.getPropertyValue('gap')).toBe('0');
      const cells = byClass('cells')!.style.getPropertyValue('transition');
      expect(cells).toContain(duration.slower);
      expect(cells).toContain(easing.settle);
    });

    it('테두리 색은 error는 error.main, success는 success.dark다', () => {
      expect(byClass('cellError')!.style.getPropertyValue('border-color')).toBe(
        themeContract.color.error.main
      );
      expect(
        byClass('cellSuccess')!.style.getPropertyValue('border-color')
      ).toBe(themeContract.color.success.dark);
    });

    it('합쳐진 동안은 칸별 포커스 링이 꺼지고 묶음(알약) 전체가 링을 가진다', () => {
      const merged = rules().filter((r) => /_merged__/.test(r.selectorText));
      // 칸별 링을 끄는 규칙: 묶음 포커스 + merged 아래 지금 칸
      const off = merged.find((r) => /data-active/.test(r.selectorText));
      expect(off).toBeDefined();
      expect(off!.selectorText).toMatch(/:focus-within/);
      expect(off!.style.getPropertyValue('outline')).toBe('none');
      // 알약 전체의 링: 묶음 포커스 아래 merged 자신. 둥글기를 알약과 같게 가져 링이 곡선을 따른다
      const ring = merged.find(
        (r) =>
          /:focus-within/.test(r.selectorText) &&
          !/data-active/.test(r.selectorText) &&
          / \.CodeSlots_merged__\w+$/.test(r.selectorText)
      );
      expect(ring).toBeDefined();
      expect(ring!.style.getPropertyValue('outline')).toContain('2px solid');
      expect(
        byClass('merged')!.style.getPropertyValue('border-radius')
      ).toContain('/ 2');
    });

    it('움직임 줄이기 미디어 질의에서 합쳐짐 전이가 꺼진다', () => {
      const sheet = Array.from(document.styleSheets).find((c) =>
        Array.from(c.cssRules).some((r) => r.cssText.includes('CodeSlots_cell'))
      )!;
      const reduced = Array.from(sheet.cssRules)
        .filter((r): r is CSSMediaRule => r instanceof CSSMediaRule)
        .filter((m) => /prefers-reduced-motion/.test(m.conditionText))
        .flatMap((m) => Array.from(m.cssRules) as CSSStyleRule[])
        .filter((r) => /CodeSlots_(cells|cell)__/.test(r.selectorText));
      // 간격(cells)과 칸의 테두리·둥글기 전이 둘 다 꺼진다
      expect(
        reduced.map((r) => r.style.getPropertyValue('transition'))
      ).toEqual(['none', 'none']);
    });

    it('지금 칸의 포커스 링은 묶음에 포커스가 있을 때만 켜진다', () => {
      const ring = rules().find(
        (r) =>
          /:focus-within/.test(r.selectorText) &&
          /data-active/.test(r.selectorText)
      );
      expect(ring).toBeDefined();
      expect(ring!.style.getPropertyValue('outline')).toContain('2px solid');
    });
  });
});
