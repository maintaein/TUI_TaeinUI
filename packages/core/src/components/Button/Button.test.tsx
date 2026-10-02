import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  act,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { createRef, useState } from 'react';
import { Button } from './Button';
import * as styles from './Button.css'; // 클래스명 검증을 위해 스타일 임포트
import { themeContract } from '../../tokens/theme.css';
import { themeTokens } from '../../tokens/contract';
import { contrastRatio, relativeLuminance } from '../../docs/llmsSections';

describe('Button', () => {
  describe('렌더링 및 기본 설정', () => {
    it('children으로 전달된 텍스트를 렌더링한다', () => {
      render(<Button>클릭하세요</Button>);
      expect(screen.getByText('클릭하세요')).toBeInTheDocument();
    });

    it('기본 HTML type은 "button"이다', () => {
      render(<Button>버튼</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    it('ref가 button 엘리먼트를 올바르게 참조한다', () => {
      const ref = createRef<HTMLButtonElement>();
      render(<Button ref={ref}>Ref 버튼</Button>);
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });
  });

  describe('스타일 및 Variant 테스트', () => {
    it('기본 스타일(fill + primary + md) 클래스가 적용된다', () => {
      render(<Button>기본</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass(
        styles.button({ size: 'md', buttonStyle: 'fill', variant: 'primary' })
      );
    });

    it('buttonStyle="weak"일 때 weak+danger 조합 클래스가 적용된다', () => {
      render(
        <Button buttonStyle="weak" variant="danger">
          삭제
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveClass(
        styles.button({ size: 'md', buttonStyle: 'weak', variant: 'danger' })
      );
    });

    it('모든 사이즈(sm, md, lg, xl) 클래스가 올바르게 적용된다', () => {
      const sizes = ['sm', 'md', 'lg', 'xl'] as const;
      sizes.forEach((size) => {
        const { unmount } = render(<Button size={size}>{size}</Button>);
        expect(screen.getByRole('button')).toHaveClass(
          styles.button({ size, buttonStyle: 'fill', variant: 'primary' })
        );
        unmount();
      });
    });

    it('fullWidth가 true일 때 해당 스타일이 적용된다', () => {
      render(<Button fullWidth>꽉 찬 버튼</Button>);
      expect(screen.getByRole('button')).toHaveClass(styles.fullWidth);
    });
  });

  describe('상태(Disabled, Loading) 테스트', () => {
    it('disabled 속성이 true일 때 버튼이 비활성화된다', () => {
      const handleClick = vi.fn();
      render(
        <Button disabled onClick={handleClick}>
          비활성
        </Button>
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-disabled', 'true');

      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('loading 속성이 true일 때 로딩 애니메이션을 보여주고 텍스트를 숨긴다', () => {
      render(<Button loading>저장 중</Button>);

      const button = screen.getByRole('button');
      // aria-busy 확인
      expect(button).toHaveAttribute('aria-busy', 'true');
      // Loader가 렌더링되는지 확인 (role="status"로 찾기)
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByLabelText('로딩 중')).toBeInTheDocument();
      // 구현상 !loading && children 이므로 텍스트는 없어야 함
      expect(screen.queryByText('저장 중')).not.toBeInTheDocument();
    });

    it('loading 속성이 true일 때 버튼이 비활성화된다', () => {
      const handleClick = vi.fn();
      render(
        <Button loading onClick={handleClick}>
          로딩
        </Button>
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();

      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('아이콘 테스트', () => {
    it('leftIcon과 rightIcon을 렌더링한다', () => {
      render(
        <Button
          leftIcon={<span data-testid="left">L</span>}
          rightIcon={<span data-testid="right">R</span>}
        >
          아이콘
        </Button>
      );

      expect(screen.getByTestId('left')).toBeInTheDocument();
      expect(screen.getByTestId('right')).toBeInTheDocument();
      expect(screen.getByText('아이콘')).toBeInTheDocument();
    });

    it('로딩 중에는 아이콘을 렌더링하지 않는다', () => {
      render(
        <Button loading leftIcon={<span data-testid="left">L</span>}>
          텍스트
        </Button>
      );

      expect(screen.queryByTestId('left')).not.toBeInTheDocument();
    });
  });

  describe('이벤트 및 키보드 인터랙션', () => {
    it('클릭 이벤트를 정상적으로 호출한다', async () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>클릭</Button>);

      // userEvent의 포인터 이벤트가 data-pressed 상태를 갱신하므로 act로 감싼다.
      await act(() => userEvent.click(screen.getByRole('button')));
      expect(handleClick).toHaveBeenCalledTimes(1);
      // 실제 타이머로도 최소 체류 뒤 누름 상태가 풀린다(act 밖 갱신을 기다려 준다).
      await waitFor(() =>
        expect(screen.getByRole('button')).not.toHaveAttribute('data-pressed')
      );
    });

    it('Enter 키 입력 시 동작한다', async () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>키보드</Button>);

      const button = screen.getByRole('button');
      button.focus();
      await act(() => userEvent.keyboard('{Enter}'));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('커스텀 색상 (color prop)', () => {
    it('color prop이 주어지면 customVariant 클래스와 기본 구조 클래스가 함께 적용된다', () => {
      render(
        <Button customColor={{ bg: '#8b5cf6', text: '#fff' }}>커스텀</Button>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveClass(styles.customVariant);
      expect(button).toHaveClass(
        styles.button({ size: 'md', buttonStyle: 'fill', variant: 'primary' })
      );
    });

    it('color prop이 주어지면 CSS 변수가 style에 설정된다', () => {
      render(
        <Button customColor={{ bg: '#8b5cf6', text: '#fff' }}>커스텀</Button>
      );
      const button = screen.getByRole('button');
      expect(button.style.getPropertyValue('--btn-bg')).toBe('#8b5cf6');
      expect(button.style.getPropertyValue('--btn-color')).toBe('#fff');
    });

    it('hoverBg/activeBg 미지정 시 filter 기본값이 설정된다', () => {
      render(
        <Button customColor={{ bg: '#059669', text: '#fff' }}>커스텀</Button>
      );
      const button = screen.getByRole('button');
      expect(button.style.getPropertyValue('--btn-hover-filter')).toBe(
        'brightness(0.9)'
      );
      expect(button.style.getPropertyValue('--btn-active-filter')).toBe(
        'brightness(0.8)'
      );
    });

    it('hoverBg/activeBg 지정 시 해당 CSS 변수가 설정된다', () => {
      render(
        <Button
          customColor={{
            bg: '#059669',
            text: '#fff',
            hoverBg: '#047857',
            activeBg: '#065f46',
          }}
        >
          커스텀
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button.style.getPropertyValue('--btn-hover-bg')).toBe('#047857');
      expect(button.style.getPropertyValue('--btn-active-bg')).toBe('#065f46');
      expect(button.style.getPropertyValue('--btn-hover-filter')).toBe('');
    });

    it('color prop과 함께 기존 style prop이 병합된다', () => {
      render(
        <Button
          customColor={{ bg: '#8b5cf6', text: '#fff' }}
          style={{ marginTop: '10px' }}
        >
          커스텀
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button.style.getPropertyValue('--btn-bg')).toBe('#8b5cf6');
      expect(button.style.marginTop).toBe('10px');
    });

    it('variant="light" + customColor이면 customOutlineVariant 클래스와 기본 구조 클래스가 함께 적용된다', () => {
      render(
        <Button variant="light" customColor={{ bg: '#e11d48', text: '' }}>
          아웃라인
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveClass(styles.customOutlineVariant);
      expect(button).not.toHaveClass(styles.customVariant);
      expect(button).toHaveClass(
        styles.button({ size: 'md', buttonStyle: 'fill', variant: 'light' })
      );
    });

    it('variant="light" + customColor이면 --btn-color에 bg 값이 설정된다', () => {
      render(
        <Button variant="light" customColor={{ bg: '#e11d48', text: '' }}>
          아웃라인
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button.style.getPropertyValue('--btn-color')).toBe('#e11d48');
      expect(button.style.getPropertyValue('--btn-bg')).toBe('');
    });

    it('variant="light" + customColor + hoverBg/activeBg가 설정된다', () => {
      render(
        <Button
          variant="light"
          customColor={{
            bg: '#e11d48',
            text: '',
            hoverBg: '#fce7f3',
            activeBg: '#fbcfe8',
          }}
        >
          아웃라인
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button.style.getPropertyValue('--btn-hover-bg')).toBe('#fce7f3');
      expect(button.style.getPropertyValue('--btn-active-bg')).toBe('#fbcfe8');
    });
  });

  describe('엣지 케이스 및 접근성', () => {
    it('custom className이 주어지면 기본 클래스와 함께 적용된다', () => {
      render(<Button className="custom-class">커스텀</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass(
        styles.button({ size: 'md', buttonStyle: 'fill', variant: 'primary' })
      );
      expect(button).toHaveClass('custom-class');
    });

    it('아이콘에는 aria-hidden="true"가 적용되어야 한다 (접근성)', () => {
      render(<Button leftIcon={<span>Icon</span>}>아이콘</Button>);
      // leftIcon을 감싸는 span에 aria-hidden이 있는지 확인
      const iconWrapper = screen.getByText('Icon').parentElement;
      expect(iconWrapper).toHaveAttribute('aria-hidden', 'true');
    });

    it('추가적인 HTML 속성(...props)이 버튼에 전달된다', () => {
      render(
        <Button name="submit-btn" data-info="test">
          속성
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('name', 'submit-btn');
      expect(button).toHaveAttribute('data-info', 'test');
    });
  });
});

describe('Button 누름 효과는 입력 시간과 무관하게 완주한다', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  // jsdom에는 PointerEvent가 없어 fireEvent.pointerDown은 button 값을 못 싣는다.
  // React는 이름이 pointerdown인 이벤트면 클래스와 무관하게 받으므로 MouseEvent로 쏜다.
  const pointerDown = (el: HTMLElement, button = 0) =>
    act(() => {
      el.dispatchEvent(
        new MouseEvent('pointerdown', { bubbles: true, button })
      );
    });
  const wait = (ms: number) => act(() => vi.advanceTimersByTime(ms));

  it('30ms 탭이어도 90ms까지 data-pressed가 남고 그 뒤 사라진다', () => {
    vi.useFakeTimers();
    render(<Button>탭</Button>);
    const button = screen.getByRole('button');

    pointerDown(button);
    expect(button).toHaveAttribute('data-pressed');
    wait(30);
    fireEvent.pointerUp(button);

    // 떼었지만 설정 후 89ms까지는 남아 있다.
    wait(59);
    expect(button).toHaveAttribute('data-pressed');
    wait(1);
    expect(button).not.toHaveAttribute('data-pressed');
  });

  it('길게(200ms) 누르면 pointerup 직후 사라진다', () => {
    vi.useFakeTimers();
    render(<Button>길게</Button>);
    const button = screen.getByRole('button');

    pointerDown(button);
    wait(200);
    expect(button).toHaveAttribute('data-pressed');
    fireEvent.pointerUp(button);
    expect(button).not.toHaveAttribute('data-pressed');
  });

  it.each([
    ['pointerleave', fireEvent.pointerLeave],
    ['pointercancel', fireEvent.pointerCancel],
  ])('%s도 같은 최소 체류를 따른다', (_name, fire) => {
    vi.useFakeTimers();
    render(<Button>이탈</Button>);
    const button = screen.getByRole('button');

    pointerDown(button);
    wait(30);
    fire(button);
    wait(59);
    expect(button).toHaveAttribute('data-pressed');
    wait(1);
    expect(button).not.toHaveAttribute('data-pressed');
  });

  it('체류 중에 다시 누르면 새로 90ms를 센다(연타)', () => {
    vi.useFakeTimers();
    render(<Button>연타</Button>);
    const button = screen.getByRole('button');

    pointerDown(button);
    wait(30);
    fireEvent.pointerUp(button);
    wait(10); // t=40, 첫 체류가 끝나기 전
    pointerDown(button);
    wait(10);
    fireEvent.pointerUp(button); // t=50

    // 첫 누름 기준(90)이 아니라 두 번째 누름 기준(130)까지 남는다.
    wait(79);
    expect(button).toHaveAttribute('data-pressed');
    wait(1);
    expect(button).not.toHaveAttribute('data-pressed');
  });

  it('보조 버튼(우클릭)은 누름 상태를 만들지 않는다', () => {
    render(<Button>우클릭</Button>);
    const button = screen.getByRole('button');

    pointerDown(button, 2);
    expect(button).not.toHaveAttribute('data-pressed');
  });

  it.each([
    ['Space', ' '],
    ['Enter', 'Enter'],
  ])('%s 30ms 탭도 90ms까지 data-pressed가 남고 그 뒤 사라진다', (_n, key) => {
    vi.useFakeTimers();
    render(<Button>키보드</Button>);
    const button = screen.getByRole('button');

    fireEvent.keyDown(button, { key });
    expect(button).toHaveAttribute('data-pressed');
    wait(30);
    fireEvent.keyUp(button, { key });

    wait(59);
    expect(button).toHaveAttribute('data-pressed');
    wait(1);
    expect(button).not.toHaveAttribute('data-pressed');
  });

  it('키를 길게 눌러 keydown이 반복돼도 타이머를 다시 시작하지 않는다', () => {
    vi.useFakeTimers();
    render(<Button>반복</Button>);
    const button = screen.getByRole('button');

    fireEvent.keyDown(button, { key: ' ' });
    wait(80);
    fireEvent.keyDown(button, { key: ' ', repeat: true });
    wait(10); // 첫 keydown 기준 t=90
    fireEvent.keyUp(button, { key: ' ' });
    expect(button).not.toHaveAttribute('data-pressed');
  });

  it('키를 누른 채 포커스가 떠나면(blur) 누름 상태가 풀린다', () => {
    vi.useFakeTimers();
    render(<Button>블러</Button>);
    const button = screen.getByRole('button');

    fireEvent.keyDown(button, { key: ' ' });
    wait(100);
    fireEvent.blur(button);
    expect(button).not.toHaveAttribute('data-pressed');
  });

  it('다른 키(Tab)는 누름 상태를 만들지 않는다', () => {
    render(<Button>탭키</Button>);
    const button = screen.getByRole('button');

    fireEvent.keyDown(button, { key: 'Tab' });
    expect(button).not.toHaveAttribute('data-pressed');
  });

  it('호출자의 키보드·blur 핸들러도 그대로 호출된다', () => {
    const onKeyDown = vi.fn();
    const onKeyUp = vi.fn();
    const onBlur = vi.fn();
    render(
      <Button onKeyDown={onKeyDown} onKeyUp={onKeyUp} onBlur={onBlur}>
        핸들러
      </Button>
    );
    const button = screen.getByRole('button');

    fireEvent.keyDown(button, { key: 'a' });
    fireEvent.keyUp(button, { key: 'a' });
    fireEvent.blur(button);

    expect(onKeyDown).toHaveBeenCalledTimes(1);
    expect(onKeyUp).toHaveBeenCalledTimes(1);
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it('Enter keydown 직후 loading이 켜지고 keyup이 오지 않아도 누름 상태가 풀린다', () => {
    vi.useFakeTimers();
    const Async = () => {
      const [loading, setLoading] = useState(false);
      return (
        <Button loading={loading} onClick={() => setLoading(true)}>
          제출
        </Button>
      );
    };
    render(<Async />);
    const button = screen.getByRole('button');

    // Enter는 keydown에서 click이 난다. keyup·blur는 오지 않는다.
    fireEvent.keyDown(button, { key: 'Enter' });
    fireEvent.click(button);
    wait(200);

    expect(button).toBeDisabled();
    expect(button).not.toHaveAttribute('data-pressed');
  });

  it('disabled로 바뀌면 포인터 누름 상태도 풀리고 다시 활성화돼도 남지 않는다', () => {
    vi.useFakeTimers();
    const { rerender } = render(<Button>포인터</Button>);
    const button = screen.getByRole('button');

    pointerDown(button);
    expect(button).toHaveAttribute('data-pressed');
    rerender(<Button disabled>포인터</Button>);
    expect(button).not.toHaveAttribute('data-pressed');

    // pointerup이 유실됐고 체류 타이머가 만료돼도 다시 켜지지 않는다.
    wait(200);
    rerender(<Button>포인터</Button>);
    expect(button).not.toHaveAttribute('data-pressed');
  });

  it('호출자의 포인터 핸들러도 그대로 호출된다', () => {
    const onPointerDown = vi.fn();
    const onPointerUp = vi.fn();
    const onPointerLeave = vi.fn();
    const onPointerCancel = vi.fn();
    render(
      <Button
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerLeave}
        onPointerCancel={onPointerCancel}
      >
        핸들러
      </Button>
    );
    const button = screen.getByRole('button');

    pointerDown(button);
    fireEvent.pointerUp(button);
    fireEvent.pointerLeave(button);
    fireEvent.pointerCancel(button);

    expect(onPointerDown).toHaveBeenCalledTimes(1);
    expect(onPointerUp).toHaveBeenCalledTimes(1);
    expect(onPointerLeave).toHaveBeenCalledTimes(1);
    expect(onPointerCancel).toHaveBeenCalledTimes(1);
  });
});

// 소스 텍스트로 확인하는 것: base transition 숏핸드와 customOutline 토큰.
// vanilla-extract가 만든 CSS를 읽는 검사는 'Button 생성 CSS'에 있다.
const cssSource = readFileSync(resolve(__dirname, './Button.css.ts'), 'utf-8');

describe('Button 모션 잠금', () => {
  it('base transition의 transform 구간이 base 길이의 spring을 쓴다(해제 되밀림)', () => {
    const transitionLine = cssSource.match(/transition: `([^`]*)`,/)?.[1];
    expect(transitionLine, 'base transition 선언을 찾지 못했다').toBeDefined();
    expect(transitionLine).toContain(
      'transform ${themeContract.animation.duration.base} ${themeContract.animation.easing.spring}'
    );
  });

  it('customOutlineVariant의 하드코딩 rgba가 surface 토큰으로 바뀌었다(T6b)', () => {
    expect(cssSource).not.toMatch(/rgba\(0, 0, 0, 0\.0[48]\)/);
    const outlineBlock = cssSource.match(
      /export const customOutlineVariant = style\(\{([\s\S]*?)\n\}\);/
    )?.[1];
    expect(
      outlineBlock,
      'customOutlineVariant 블록을 찾지 못했다'
    ).toBeDefined();
    expect(outlineBlock).toContain('themeContract.color.surface.hover');
    expect(outlineBlock).toContain('themeContract.color.surface.active');
  });
});

/**
 * vanilla-extract가 실제로 만든 CSS(jsdom에 주입된 <style>)를 CSSOM으로 읽는다.
 * @media 안의 규칙까지 펼쳐 문서 순서와 감싼 미디어 조건을 함께 들고 있다.
 */
interface FlatRule {
  rule: CSSStyleRule;
  media: string | null;
  order: number;
}

function buttonRules(): FlatRule[] {
  const sheet = Array.from(document.styleSheets).find((candidate) =>
    Array.from(candidate.cssRules).some((rule) =>
      rule.cssText.includes('Button_button')
    )
  );
  if (!sheet) throw new Error('Button.css.ts가 만든 스타일시트를 찾지 못했다');

  const flat: FlatRule[] = [];
  const walk = (rules: CSSRuleList, media: string | null) => {
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSMediaRule) {
        walk(rule.cssRules, rule.media.mediaText);
      } else if (rule instanceof CSSStyleRule) {
        flat.push({ rule, media, order: flat.length });
      }
    }
  };
  walk(sheet.cssRules, null);
  return flat;
}

describe('Button 생성 CSS', () => {
  const withSelector = (part: string) =>
    buttonRules().filter(({ rule }) => rule.selectorText.includes(part));

  const basePressed = () =>
    withSelector('[data-pressed]').find(
      ({ media, rule }) =>
        media === null &&
        rule.style.getPropertyValue('transform') === 'scale(0.95)'
    );

  it('호버 규칙 10곳 전부에 transform이 없다(float 재도입 가드)', () => {
    const hovers = withSelector(':hover');
    expect(hovers).toHaveLength(10);
    for (const { rule } of hovers) {
      expect(rule.style.getPropertyValue('transform'), rule.selectorText).toBe(
        ''
      );
    }
  });

  it('호버 규칙은 transition 타이밍 함수를 얹지 않는다(리뷰 C3: 목록을 무너뜨린다)', () => {
    for (const { rule } of withSelector(':hover')) {
      expect(rule.style.getPropertyValue('transition-timing-function')).toBe(
        ''
      );
    }
  });

  it('호버 규칙 전부가 (hover: hover) and (pointer: fine)으로 감싸여 있다', () => {
    const hovers = withSelector(':hover');
    expect(hovers).toHaveLength(10);
    for (const { media, rule } of hovers) {
      expect(media, rule.selectorText).toBe(
        '(hover: hover) and (pointer: fine)'
      );
    }
  });

  it('호버 규칙은 :not([data-pressed])를 달아 같은 특정도의 누름 색을 덮지 않는다', () => {
    // vanilla-extract는 @media를 selectors 뒤에 내보내 호버가 문서 순서에서 늦다.
    for (const { rule } of withSelector(':hover')) {
      expect(rule.selectorText).toContain(':not([data-pressed])');
    }
  });

  it(':active 셀렉터를 더 쓰지 않는다(누름 상태는 data-pressed 하나가 가진다)', () => {
    expect(withSelector(':active')).toHaveLength(0);
  });

  it('data-pressed 규칙이 base 1 + variant 8 + custom 2 = 11곳이다', () => {
    const pressed = withSelector('[data-pressed]:not(:disabled)').filter(
      ({ media }) => media === null
    );
    expect(pressed).toHaveLength(11);
  });

  it('scale(0.95)은 base의 data-pressed 한 곳에만 있다', () => {
    const scaled = withSelector('[data-pressed]').filter(
      ({ rule }) => rule.style.getPropertyValue('transform') === 'scale(0.95)'
    );
    expect(scaled).toHaveLength(1);
    expect(scaled[0].rule.selectorText).toMatch(/^\.Button_button__\w+\[/);
  });

  it('진입은 fast+settle로 단단하고, 해제는 base+spring으로 되밀린다', () => {
    const entry = basePressed()!.rule.style;
    expect(entry.getPropertyValue('transition-duration')).toBe(
      themeContract.animation.duration.fast
    );
    // ease-in(exit)이나 흔들리는 커브(spring·snap)를 진입에 쓰면 안 된다.
    expect(entry.getPropertyValue('transition-timing-function')).toBe(
      themeContract.animation.easing.settle
    );

    // 해제는 [data-pressed]가 떨어진 뒤 base 숏핸드의 transform 항이 정한다.
    // jsdom은 중간 프레임을 계산하지 못해 커브가 걸려 있다는 선까지만 확인한다.
    const baseRule = buttonRules().find(
      ({ media, rule }) =>
        media === null &&
        /^\.Button_button__\w+$/.test(rule.selectorText) &&
        rule.style.getPropertyValue('transition') !== ''
    );
    expect(baseRule, 'base 규칙을 찾지 못했다').toBeDefined();
    const transition = baseRule!.rule.style.getPropertyValue('transition');
    expect(transition).toContain(
      `transform ${themeContract.animation.duration.base} ${themeContract.animation.easing.spring}`
    );
  });

  it('축소 모드에서 data-pressed의 transform만 none이고 색 변화는 남는다', () => {
    const reduced = withSelector('[data-pressed]').filter(
      ({ media }) => media === '(prefers-reduced-motion: reduce)'
    );
    expect(reduced).toHaveLength(1);
    const { rule, order } = reduced[0];
    expect(rule.style.getPropertyValue('transform')).toBe('none');
    // 색·불투명도·그림자를 건드리면 "이동 없음"이 아니라 "효과 없음"이 된다.
    expect(rule.style.length).toBe(1);

    // 같은 특정도라 base의 scale(0.95)보다 문서 순서가 늦어야 이긴다.
    expect(order).toBeGreaterThan(basePressed()!.order);
  });
});

describe('Button 생성 CSS: 합성 레이어', () => {
  const rules = () => buttonRules();
  const baseRule = () =>
    rules().find(
      ({ media, rule }) =>
        media === null && /^\.Button_button__\w+$/.test(rule.selectorText)
    )!;

  it('레이어는 base의 backface-visibility: hidden 하나가 만든다', () => {
    expect(baseRule().rule.style.getPropertyValue('backface-visibility')).toBe(
      'hidden'
    );
  });

  it('will-change를 어느 자리에도 걸지 않는다(호버, 포커스, 눌림에서 레이어가 생기면 글자가 튄다)', () => {
    const offenders = rules().filter(
      ({ rule }) => rule.style.getPropertyValue('will-change') !== ''
    );
    expect(offenders.map(({ rule }) => rule.selectorText)).toEqual([]);
  });

  it('축소 모드에서는 레이어를 되돌린다(transform이 none이라 필요 없다)', () => {
    const reduced = rules().find(
      ({ media, rule }) =>
        media === '(prefers-reduced-motion: reduce)' &&
        /^\.Button_button__\w+$/.test(rule.selectorText)
    );
    expect(reduced, '축소 모드 base 규칙을 찾지 못했다').toBeDefined();
    expect(reduced!.rule.style.getPropertyValue('backface-visibility')).toBe(
      'visible'
    );
  });
});

describe('Button fill 변형의 색 단조성 (조항 2: rest < hover < pressed)', () => {
  const source = readFileSync(resolve(__dirname, './Button.css.ts'), 'utf-8');

  function tokenValue(ref: string): string {
    const value = ref
      .replace(/\[(\w+)\]/g, '.$1')
      .split('.')
      .reduce<unknown>(
        (node, key) => (node as Record<string, unknown>)[key],
        themeTokens as unknown
      );
    expect(typeof value, `themeContract.${ref}가 토큰에 없다`).toBe('string');
    return value as string;
  }

  const start = source.indexOf('compoundVariants: [');
  const compound = source.slice(start, source.indexOf('\n  ],', start));
  const fills: Record<
    string,
    { color: string; rest: string; hover: string; pressed: string }
  > = {};
  for (const chunk of compound.split('variants: { buttonStyle: ').slice(1)) {
    const head = chunk.match(/^'(\w+)', variant: '(\w+)' \}/);
    if (head?.[1] !== 'fill') continue;
    const ref = (re: RegExp) => chunk.match(re)?.[1] ?? '';
    fills[head[2]] = {
      color: ref(/\n\s+color: themeContract\.([\w.[\]]+)/),
      rest: ref(/\n\s+backgroundColor: themeContract\.([\w.[\]]+)/),
      hover: ref(
        /&:hover[^']*': \{\s*backgroundColor: themeContract\.([\w.[\]]+)/
      ),
      pressed: ref(
        /&\[data-pressed\][^']*': \{\s*backgroundColor: themeContract\.([\w.[\]]+)/
      ),
    };
  }

  it('fill 변형 네 곳 모두 눌린 색을 팔레트 단계로 갖는다', () => {
    expect(Object.keys(fills).sort()).toEqual([
      'danger',
      'dark',
      'light',
      'primary',
    ]);
    for (const [name, f] of Object.entries(fills)) {
      expect(f.rest, `${name} rest`).not.toBe('');
      expect(f.hover, `${name} hover`).not.toBe('');
      expect(f.pressed, `${name} pressed`).not.toBe('');
    }
  });

  it.each(['primary', 'dark', 'danger', 'light'])(
    'fill %s는 rest보다 hover가, hover보다 pressed가 어둡다',
    (name) => {
      const f = fills[name];
      const lum = (ref: string) => relativeLuminance(tokenValue(ref));
      expect(lum(f.hover), `${name} hover < rest`).toBeLessThan(lum(f.rest));
      expect(lum(f.pressed), `${name} pressed < hover`).toBeLessThan(
        lum(f.hover)
      );
    }
  );

  it.each(['primary', 'dark', 'danger', 'light'])(
    'fill %s의 글자색은 눌린 배경 위에서 AA(4.5:1)를 만족한다',
    (name) => {
      const f = fills[name];
      expect(
        contrastRatio(tokenValue(f.color), tokenValue(f.pressed))
      ).toBeGreaterThanOrEqual(4.5);
    }
  );
});
