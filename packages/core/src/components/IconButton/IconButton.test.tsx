import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, it, expect, vi } from 'vitest';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, type ComponentProps } from 'react';
import { IconButton } from './IconButton';
import { themeContract } from '../../tokens/theme.css';
import { gsapDuration, gsapEasing } from '../../tokens/gsapEasing';

const TestIcon = () => (
  <svg data-testid="test-icon" width="24" height="24" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" />
  </svg>
);

describe('IconButton', () => {
  describe('렌더링 테스트', () => {
    it('기본적으로 렌더링된다', () => {
      render(
        <IconButton aria-label="테스트 버튼">
          <TestIcon />
        </IconButton>
      );

      const button = screen.getByRole('button', { name: '테스트 버튼' });
      expect(button).toBeInTheDocument();
      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    });

    it('aria-label이 필수이다', () => {
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(
        <IconButton aria-label="">
          <TestIcon />
        </IconButton>
      );

      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining(
          'IconButton: aria-label 또는 aria-labelledby가 필요합니다'
        )
      );

      consoleError.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });

    it('aria-labelledby가 제공되면 aria-label 없이도 렌더링된다', () => {
      render(
        <>
          <span id="button-label">삭제</span>
          <IconButton aria-labelledby="button-label">
            <TestIcon />
          </IconButton>
        </>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-labelledby', 'button-label');
    });
  });

  describe('variant prop 테스트 (weak·strong에만 적용된다)', () => {
    it('variant="primary"를 적용한다', () => {
      render(
        <IconButton variant="primary" buttonStyle="strong" aria-label="Primary">
          <TestIcon />
        </IconButton>
      );

      const button = screen.getByRole('button');
      expect(button.className).toContain('primary');
    });

    it('variant="dark"를 적용한다', () => {
      render(
        <IconButton variant="dark" buttonStyle="strong" aria-label="Dark">
          <TestIcon />
        </IconButton>
      );

      const button = screen.getByRole('button');
      expect(button.className).toContain('dark');
    });

    it('variant="danger"를 적용한다', () => {
      render(
        <IconButton variant="danger" buttonStyle="strong" aria-label="Danger">
          <TestIcon />
        </IconButton>
      );

      const button = screen.getByRole('button');
      expect(button.className).toContain('danger');
    });

    it('variant="light"를 적용한다', () => {
      render(
        <IconButton variant="light" buttonStyle="strong" aria-label="Light">
          <TestIcon />
        </IconButton>
      );

      const button = screen.getByRole('button');
      expect(button.className).toContain('light');
    });
  });

  describe('buttonStyle prop 테스트', () => {
    it('buttonStyle을 주지 않으면 ghost다(기본값)', () => {
      render(
        <IconButton aria-label="Default">
          <TestIcon />
        </IconButton>
      );

      const button = screen.getByRole('button');
      expect(button.className).toContain('ghost');
      expect(button.className).not.toContain('weak');
      expect(button.className).not.toContain('strong');
    });

    it('buttonStyle="strong"을 적용한다', () => {
      render(
        <IconButton buttonStyle="strong" aria-label="Strong">
          <TestIcon />
        </IconButton>
      );

      const button = screen.getByRole('button');
      expect(button.className).toContain('strong');
      expect(button.className).not.toContain('ghost');
    });

    it('buttonStyle="weak"를 적용한다', () => {
      render(
        <IconButton buttonStyle="weak" aria-label="Weak">
          <TestIcon />
        </IconButton>
      );

      const button = screen.getByRole('button');
      expect(button.className).toContain('weak');
    });
  });

  describe('size prop 테스트', () => {
    it('size="sm"을 적용한다', () => {
      render(
        <IconButton size="sm" aria-label="Small">
          <TestIcon />
        </IconButton>
      );

      const button = screen.getByRole('button');
      expect(button.className).toContain('sm');
    });

    it('size="md"를 기본값으로 적용한다', () => {
      render(
        <IconButton aria-label="Medium">
          <TestIcon />
        </IconButton>
      );

      const button = screen.getByRole('button');
      expect(button.className).toContain('md');
    });

    it('size="lg"를 적용한다', () => {
      render(
        <IconButton size="lg" aria-label="Large">
          <TestIcon />
        </IconButton>
      );

      const button = screen.getByRole('button');
      expect(button.className).toContain('lg');
    });

    it('size="xl"을 적용한다', () => {
      render(
        <IconButton size="xl" aria-label="Extra Large">
          <TestIcon />
        </IconButton>
      );

      const button = screen.getByRole('button');
      expect(button.className).toContain('xl');
    });
  });

  describe('아이콘 크기 테스트', () => {
    it('weak 모드에서 아이콘 래퍼에 size별 클래스가 적용된다', () => {
      const sizes = ['sm', 'md', 'lg', 'xl'] as const;

      sizes.forEach((size) => {
        const { unmount } = render(
          <IconButton
            buttonStyle="weak"
            size={size}
            aria-label={`icon-${size}`}
          >
            <TestIcon />
          </IconButton>
        );

        const button = screen.getByRole('button');
        const iconWrapper = button.querySelector('[aria-hidden="true"]');
        expect(iconWrapper).toBeInTheDocument();
        expect(iconWrapper?.className).toContain(size);
        unmount();
      });
    });

    it('ghost 모드에서 아이콘 래퍼에 size별 클래스가 적용된다', () => {
      const sizes = ['sm', 'md', 'lg', 'xl'] as const;

      sizes.forEach((size) => {
        const { unmount } = render(
          <IconButton
            buttonStyle="ghost"
            size={size}
            aria-label={`ghost-${size}`}
          >
            <TestIcon />
          </IconButton>
        );

        const button = screen.getByRole('button');
        const iconWrapper = button.querySelector('[aria-hidden="true"]');
        expect(iconWrapper).toBeInTheDocument();
        expect(iconWrapper?.className).toContain(size);
        unmount();
      });
    });

    it('ghost 모드에서 size에 따라 ghost 크기 클래스가 버튼에 적용된다', () => {
      const { unmount } = render(
        <IconButton buttonStyle="ghost" size="lg" aria-label="ghost-lg">
          <TestIcon />
        </IconButton>
      );

      const button = screen.getByRole('button');
      expect(button.className).toContain('lg');
      unmount();
    });
  });

  describe('상태 prop 테스트', () => {
    it('disabled 상태를 적용한다', () => {
      render(
        <IconButton disabled aria-label="Disabled">
          <TestIcon />
        </IconButton>
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('loading 상태를 적용한다', () => {
      render(
        <IconButton loading aria-label="Loading">
          <TestIcon />
        </IconButton>
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    it('loading 상태일 때 아이콘 대신 스피너를 표시한다', () => {
      render(
        <IconButton loading aria-label="Loading">
          <TestIcon />
        </IconButton>
      );

      expect(screen.queryByTestId('test-icon')).not.toBeInTheDocument();
    });
  });

  describe('이벤트 핸들러 테스트', () => {
    it('onClick 이벤트가 호출된다', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(
        <IconButton onClick={handleClick} aria-label="Click">
          <TestIcon />
        </IconButton>
      );

      const button = screen.getByRole('button');
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('disabled 상태에서는 onClick이 호출되지 않는다', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(
        <IconButton onClick={handleClick} disabled aria-label="Disabled">
          <TestIcon />
        </IconButton>
      );

      const button = screen.getByRole('button');
      await user.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('loading 상태에서는 onClick이 호출되지 않는다', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(
        <IconButton onClick={handleClick} loading aria-label="Loading">
          <TestIcon />
        </IconButton>
      );

      const button = screen.getByRole('button');
      await user.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('onFocus 이벤트가 호출된다', async () => {
      const user = userEvent.setup();
      const handleFocus = vi.fn();

      render(
        <IconButton onFocus={handleFocus} aria-label="Focus">
          <TestIcon />
        </IconButton>
      );

      const button = screen.getByRole('button');
      await user.tab();

      expect(handleFocus).toHaveBeenCalled();
      expect(button).toHaveFocus();
    });

    it('onBlur 이벤트가 호출된다', async () => {
      const user = userEvent.setup();
      const handleBlur = vi.fn();

      render(
        <IconButton onBlur={handleBlur} aria-label="Blur">
          <TestIcon />
        </IconButton>
      );

      await user.tab();
      await user.tab();

      expect(handleBlur).toHaveBeenCalled();
    });
  });

  describe('접근성 테스트', () => {
    it('button role을 가진다', () => {
      render(
        <IconButton aria-label="Accessible">
          <TestIcon />
        </IconButton>
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('aria-label이 올바르게 설정된다', () => {
      render(
        <IconButton aria-label="삭제 버튼">
          <TestIcon />
        </IconButton>
      );

      const button = screen.getByRole('button', { name: '삭제 버튼' });
      expect(button).toHaveAccessibleName('삭제 버튼');
    });

    it('disabled 상태가 스크린 리더에 전달된다', () => {
      render(
        <IconButton disabled aria-label="Disabled">
          <TestIcon />
        </IconButton>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('loading 상태가 스크린 리더에 전달된다', () => {
      render(
        <IconButton loading aria-label="Loading">
          <TestIcon />
        </IconButton>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    it('아이콘은 스크린 리더에서 숨겨진다', () => {
      render(
        <IconButton aria-label="Icon Hidden">
          <TestIcon />
        </IconButton>
      );

      const button = screen.getByRole('button');
      const iconWrapper = button.querySelector('[aria-hidden="true"]');
      expect(iconWrapper).toBeInTheDocument();
    });
  });

  describe('키보드 인터랙션 테스트', () => {
    it('Tab 키로 포커스할 수 있다', async () => {
      const user = userEvent.setup();

      render(
        <IconButton aria-label="Focus">
          <TestIcon />
        </IconButton>
      );

      const button = screen.getByRole('button');
      await user.tab();

      expect(button).toHaveFocus();
    });

    it('Enter 키로 클릭할 수 있다', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(
        <IconButton onClick={handleClick} aria-label="Enter">
          <TestIcon />
        </IconButton>
      );

      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard('{Enter}');

      expect(handleClick).toHaveBeenCalled();
    });

    it('Space 키로 클릭할 수 있다', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(
        <IconButton onClick={handleClick} aria-label="Space">
          <TestIcon />
        </IconButton>
      );

      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard(' ');

      expect(handleClick).toHaveBeenCalled();
    });

    it('disabled 상태에서는 포커스할 수 없다', () => {
      render(
        <IconButton disabled aria-label="No Focus">
          <TestIcon />
        </IconButton>
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('forwardRef 테스트', () => {
    it('ref를 button 요소에 전달한다', () => {
      const ref = createRef<HTMLButtonElement>();

      render(
        <IconButton ref={ref} aria-label="Ref">
          <TestIcon />
        </IconButton>
      );

      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });

    it('ref를 통해 focus()를 호출할 수 있다', () => {
      const ref = createRef<HTMLButtonElement>();

      render(
        <IconButton ref={ref} aria-label="Focus Ref">
          <TestIcon />
        </IconButton>
      );

      ref.current?.focus();
      expect(ref.current).toHaveFocus();
    });

    it('ref를 통해 blur()를 호출할 수 있다', () => {
      const ref = createRef<HTMLButtonElement>();

      render(
        <IconButton ref={ref} aria-label="Blur Ref">
          <TestIcon />
        </IconButton>
      );

      ref.current?.focus();
      expect(ref.current).toHaveFocus();

      ref.current?.blur();
      expect(ref.current).not.toHaveFocus();
    });
  });

  describe('추가 HTML 속성 테스트', () => {
    it('type 속성을 전달할 수 있다', () => {
      render(
        <IconButton type="submit" aria-label="Submit">
          <TestIcon />
        </IconButton>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('className을 추가할 수 있다', () => {
      render(
        <IconButton className="custom-class" aria-label="Custom">
          <TestIcon />
        </IconButton>
      );

      const button = screen.getByRole('button');
      expect(button.className).toContain('custom-class');
    });

    it('data 속성을 전달할 수 있다', () => {
      render(
        <IconButton data-testid="custom-button" aria-label="Data">
          <TestIcon />
        </IconButton>
      );

      const button = screen.getByTestId('custom-button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('buttonStyle="ghost" 테스트', () => {
    it('ghost 모드에서 렌더링된다', () => {
      render(
        <IconButton buttonStyle="ghost" aria-label="닫기">
          <TestIcon />
        </IconButton>
      );

      const button = screen.getByRole('button', { name: '닫기' });
      expect(button).toBeInTheDocument();
      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    });

    it('ghost 모드에서 ghost 스타일 클래스가 적용된다', () => {
      render(
        <IconButton buttonStyle="ghost" aria-label="닫기">
          <TestIcon />
        </IconButton>
      );

      const button = screen.getByRole('button');
      expect(button.className).toContain('ghost');
    });

    it('ghost에서는 variant가 무시된다(variant 클래스가 붙지 않는다)', () => {
      render(
        <IconButton buttonStyle="ghost" variant="danger" aria-label="닫기">
          <TestIcon />
        </IconButton>
      );

      const button = screen.getByRole('button');
      expect(button.className).toContain('ghost');
      expect(button.className).not.toContain('danger');
      expect(button.className).not.toContain('strong');
    });

    it('ghost 모드에서 sizeVariants가 적용되지 않는다', () => {
      render(
        <IconButton buttonStyle="ghost" size="lg" aria-label="닫기">
          <TestIcon />
        </IconButton>
      );

      const button = screen.getByRole('button');
      // ghost 모드에서는 정사각형 size 클래스 대신 ghost 클래스 사용
      expect(button.className).toContain('ghost');
    });

    it('ghost 모드에서 클릭 이벤트가 동작한다', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(
        <IconButton buttonStyle="ghost" onClick={handleClick} aria-label="닫기">
          <TestIcon />
        </IconButton>
      );

      await user.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('ghost 모드에서 disabled 상태가 동작한다', () => {
      render(
        <IconButton buttonStyle="ghost" disabled aria-label="닫기">
          <TestIcon />
        </IconButton>
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('ghost 모드에서 loading 상태가 동작한다', () => {
      render(
        <IconButton buttonStyle="ghost" loading aria-label="닫기">
          <TestIcon />
        </IconButton>
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(screen.queryByTestId('test-icon')).not.toBeInTheDocument();
    });

    it('ghost 모드에서 아이콘은 aria-hidden으로 감싸진다', () => {
      render(
        <IconButton buttonStyle="ghost" aria-label="닫기">
          <TestIcon />
        </IconButton>
      );

      const button = screen.getByRole('button');
      const iconWrapper = button.querySelector('[aria-hidden="true"]');
      expect(iconWrapper).toBeInTheDocument();
    });
  });

  describe('엣지 케이스 테스트', () => {
    it('children이 ReactNode를 렌더링한다', () => {
      render(
        <IconButton aria-label="Complex Icon">
          <div data-testid="complex-icon">
            <span>복잡한 아이콘</span>
          </div>
        </IconButton>
      );

      expect(screen.getByTestId('complex-icon')).toBeInTheDocument();
    });

    it('variant와 buttonStyle을 동시에 적용한다', () => {
      render(
        <IconButton variant="danger" buttonStyle="weak" aria-label="Combined">
          <TestIcon />
        </IconButton>
      );

      const button = screen.getByRole('button');
      expect(button.className).toContain('danger');
      expect(button.className).toContain('weak');
    });

    it('모든 size와 variant 조합이 작동한다', () => {
      const sizes = ['sm', 'md', 'lg', 'xl'] as const;
      const variants = ['primary', 'dark', 'danger', 'light'] as const;

      sizes.forEach((size) => {
        variants.forEach((variant) => {
          const { unmount } = render(
            <IconButton
              size={size}
              variant={variant}
              aria-label={`${size}-${variant}`}
            >
              <TestIcon />
            </IconButton>
          );

          const button = screen.getByRole('button');
          expect(button).toBeInTheDocument();
          unmount();
        });
      });
    });
  });
});

describe('IconButton 누름 효과는 입력 시간과 무관하게 완주한다', () => {
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
    render(
      <IconButton aria-label="탭">
        <TestIcon />
      </IconButton>
    );
    const button = screen.getByRole('button');

    pointerDown(button);
    expect(button).toHaveAttribute('data-pressed');
    wait(30);
    fireEvent.pointerUp(button);

    wait(59);
    expect(button).toHaveAttribute('data-pressed');
    wait(1);
    expect(button).not.toHaveAttribute('data-pressed');
  });

  it.each(['ghost', 'weak', 'strong'] as const)(
    '%s 모드도 같은 누름 상태를 갖는다',
    (buttonStyle) => {
      vi.useFakeTimers();
      render(
        <IconButton buttonStyle={buttonStyle} aria-label="탭">
          <TestIcon />
        </IconButton>
      );
      const button = screen.getByRole('button');

      pointerDown(button);
      wait(30);
      fireEvent.pointerUp(button);
      wait(59);
      expect(button).toHaveAttribute('data-pressed');
      wait(1);
      expect(button).not.toHaveAttribute('data-pressed');
    }
  );

  it.each(['ghost', 'weak', 'strong'] as const)(
    '%s 모드에도 pressable 클래스가 붙는다(will-change와 누름 규칙이 세 모드에 같이 걸린다)',
    (buttonStyle) => {
      render(
        <IconButton buttonStyle={buttonStyle} aria-label="탭">
          <TestIcon />
        </IconButton>
      );
      expect(screen.getByRole('button').className).toContain('pressable');
    }
  );

  it.each([
    ['Space', ' '],
    ['Enter', 'Enter'],
  ])('%s 30ms 탭도 90ms까지 data-pressed가 남고 그 뒤 사라진다', (_n, key) => {
    vi.useFakeTimers();
    render(
      <IconButton aria-label="키보드">
        <TestIcon />
      </IconButton>
    );
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

  it('키를 누르고 있어 repeat가 오는 동안 체류를 다시 세지 않는다', () => {
    vi.useFakeTimers();
    render(
      <IconButton aria-label="반복">
        <TestIcon />
      </IconButton>
    );
    const button = screen.getByRole('button');

    fireEvent.keyDown(button, { key: 'Enter' });
    wait(200);
    fireEvent.keyDown(button, { key: 'Enter', repeat: true });
    fireEvent.keyUp(button, { key: 'Enter' });
    // 길게 눌렀으니 뗀 즉시 사라진다. repeat가 체류를 다시 시작했다면 남는다.
    expect(button).not.toHaveAttribute('data-pressed');
  });

  it('보조 버튼(우클릭)은 누름 상태를 만들지 않는다', () => {
    render(
      <IconButton aria-label="우클릭">
        <TestIcon />
      </IconButton>
    );
    const button = screen.getByRole('button');

    pointerDown(button, 2);
    expect(button).not.toHaveAttribute('data-pressed');
  });

  it('누른 채 loading이 되면 누름 상태가 비워지고 다시 활성화돼도 남지 않는다', () => {
    vi.useFakeTimers();
    const { rerender } = render(
      <IconButton aria-label="로딩">
        <TestIcon />
      </IconButton>
    );
    const button = screen.getByRole('button');

    pointerDown(button);
    expect(button).toHaveAttribute('data-pressed');
    rerender(
      <IconButton loading aria-label="로딩">
        <TestIcon />
      </IconButton>
    );
    expect(button).not.toHaveAttribute('data-pressed');

    // pointerup이 유실됐고 체류 타이머가 만료돼도 다시 켜지지 않는다.
    wait(200);
    rerender(
      <IconButton aria-label="로딩">
        <TestIcon />
      </IconButton>
    );
    expect(button).not.toHaveAttribute('data-pressed');
  });

  it('소비자가 준 포인터·키보드 핸들러도 불린다', () => {
    const onPointerDown = vi.fn();
    const onKeyDown = vi.fn();
    render(
      <IconButton
        aria-label="합성"
        onPointerDown={onPointerDown}
        onKeyDown={onKeyDown}
      >
        <TestIcon />
      </IconButton>
    );
    const button = screen.getByRole('button');

    pointerDown(button);
    fireEvent.keyDown(button, { key: 'Enter' });
    expect(onPointerDown).toHaveBeenCalledTimes(1);
    expect(onKeyDown).toHaveBeenCalledTimes(1);
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

function iconButtonRules(): FlatRule[] {
  const sheet = Array.from(document.styleSheets).find((candidate) =>
    Array.from(candidate.cssRules).some((rule) =>
      rule.cssText.includes('IconButton_iconButton')
    )
  );
  if (!sheet) {
    throw new Error('IconButton.css.ts가 만든 스타일시트를 찾지 못했다');
  }

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

describe('IconButton 생성 CSS', () => {
  const withSelector = (part: string) =>
    iconButtonRules().filter(({ rule }) => rule.selectorText.includes(part));
  const ownRule = (className: string, media: string | null = null) =>
    iconButtonRules().find(
      ({ rule, media: m }) =>
        m === media &&
        new RegExp(`^\\.IconButton_${className}__\\w+$`).test(rule.selectorText)
    );
  const pressScale = () =>
    withSelector('[data-pressed]').find(
      ({ media, rule }) =>
        media === null && rule.style.getPropertyValue('transform') !== ''
    );

  it('호버 규칙 10곳(배경 9 + ghost 글자색 1)이 모두 (hover: hover) and (pointer: fine) 안에 있다', () => {
    const hovers = withSelector(':hover');
    expect(hovers).toHaveLength(10);
    for (const { media, rule } of hovers) {
      expect(media, rule.selectorText).toBe(
        '(hover: hover) and (pointer: fine)'
      );
    }
  });

  it('호버 규칙은 :not([data-pressed])를 달아 같은 특정도의 누름 색을 덮지 않는다', () => {
    for (const { rule } of withSelector(':hover')) {
      expect(rule.selectorText).toContain(':not([data-pressed])');
    }
  });

  it('호버는 배경색(과 글자색)만 바꾼다: transform과 타이밍 함수가 없다', () => {
    for (const { rule } of withSelector(':hover')) {
      expect(rule.style.getPropertyValue('transform'), rule.selectorText).toBe(
        ''
      );
      expect(
        rule.style.getPropertyValue('transition-timing-function'),
        rule.selectorText
      ).toBe('');
    }
  });

  it(':active 셀렉터를 쓰지 않는다(누름 상태는 data-pressed 하나가 가진다)', () => {
    expect(withSelector(':active')).toHaveLength(0);
  });

  it('translateY가 어느 규칙에도 없다', () => {
    for (const { rule } of iconButtonRules()) {
      expect(rule.style.getPropertyValue('transform')).not.toContain(
        'translateY'
      );
    }
  });

  it('data-pressed 규칙은 변형 8 + ghost 1 + pressable 1 = 10곳이고 scale(0.95)은 pressable에만 있다', () => {
    // 채움 층(fill)의 누름 색 규칙은 버튼의 규칙이 아니라 제외한다.
    const pressed = withSelector('[data-pressed]:not(:disabled)').filter(
      ({ media, rule }) =>
        media === null && !/IconButton_fill__/.test(rule.selectorText)
    );
    expect(pressed).toHaveLength(10);

    const scaled = pressed.filter(
      ({ rule }) => rule.style.getPropertyValue('transform') !== ''
    );
    expect(scaled).toHaveLength(1);
    expect(scaled[0].rule.selectorText).toMatch(/^\.IconButton_pressable__/);
    expect(scaled[0].rule.style.getPropertyValue('transform')).toBe(
      'scale(0.95)'
    );
  });

  it('진입은 fast+settle로 단단하다(ease-in이나 흔들리는 커브를 쓰지 않는다)', () => {
    const entry = pressScale()!.rule.style;
    expect(entry.getPropertyValue('transition-duration')).toBe(
      themeContract.animation.duration.fast
    );
    expect(entry.getPropertyValue('transition-timing-function')).toBe(
      themeContract.animation.easing.settle
    );
  });

  it('해제는 base 전이의 transform spring이 맡는다(변형·ghost 양쪽)', () => {
    const spring = `transform ${themeContract.animation.duration.base} ${themeContract.animation.easing.spring}`;
    for (const name of ['iconButton', 'ghostBase']) {
      const transition =
        ownRule(name)?.rule.style.getPropertyValue('transition');
      expect(transition, `${name} base 규칙을 찾지 못했다`).toBeDefined();
      // transform만 spring이다. 색은 settle로 간다.
      expect(transition).toContain(spring);
      expect(transition).toContain(
        `background-color ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}`
      );
    }
  });

  it('will-change: transform이 pressable 하나에 있고 축소 모드에서 auto다', () => {
    expect(
      ownRule('pressable')!.rule.style.getPropertyValue('will-change')
    ).toBe('transform');
    expect(
      ownRule(
        'pressable',
        '(prefers-reduced-motion: reduce)'
      )!.rule.style.getPropertyValue('will-change')
    ).toBe('auto');
  });

  it('축소 모드에서 data-pressed의 transform만 none이고 색 변화는 남는다', () => {
    const reduced = withSelector('[data-pressed]').filter(
      ({ media }) => media === '(prefers-reduced-motion: reduce)'
    );
    expect(reduced).toHaveLength(1);
    const { rule, order } = reduced[0];
    expect(rule.style.getPropertyValue('transform')).toBe('none');
    expect(rule.style.length).toBe(1);

    // 같은 특정도라 pressable의 scale(0.95)보다 문서 순서가 늦어야 이긴다.
    expect(order).toBeGreaterThan(pressScale()!.order);
  });

  it('ghost의 눌림 색은 예전 :active 값(gray[900] 글자, gray[200] 배경) 그대로다', () => {
    const ghostPressed = withSelector('[data-pressed]').find(
      ({ media, rule }) =>
        media === null &&
        rule.selectorText.startsWith('.IconButton_ghostBase__')
    )!;
    // 배경은 변수를 거친다. 변수는 ghostBase가 예전 :active 값으로 정의한다.
    const pressedVar = ghostPressed.rule.style
      .getPropertyValue('background-color')
      .match(/^var\((--[\w-]+)\)$/)![1];
    expect(ownRule('ghostBase')!.rule.style.getPropertyValue(pressedVar)).toBe(
      themeContract.palette.gray[200]
    );
    expect(ghostPressed.rule.style.getPropertyValue('color')).toBe(
      themeContract.palette.gray[900]
    );
  });

  it('소스에 40ms 지연이 없다(아이콘 span은 몸통을 따라 눌린다)', () => {
    const cssSource = readFileSync(
      resolve(__dirname, './IconButton.css.ts'),
      'utf-8'
    );
    expect(cssSource).not.toContain('40ms');
    expect(cssSource).not.toContain('iconMotion');
  });
});

describe('IconButton 아이콘 크기는 버튼이 정한다', () => {
  const wrapperOf = (size?: 'sm' | 'md' | 'lg' | 'xl') => {
    render(
      <IconButton size={size} aria-label="아이콘">
        <TestIcon />
      </IconButton>
    );
    return screen.getByRole('button').querySelector('[aria-hidden="true"]')!;
  };
  const rules = () => iconButtonRules();
  const slotClass = () =>
    wrapperOf()
      .className.split(/\s+/)
      .find((c) => c.includes('iconSlot'))!;

  it('아이콘 span이 iconSlot 클래스와 size 클래스를 함께 가진다', () => {
    const wrapper = wrapperOf('lg');
    expect(wrapper.className).toContain('iconSlot');
    expect(wrapper.className).toContain('lg');
  });

  it('svg 규칙은 :where로 감싸 특정도가 0이다(className·style이 이긴다)', () => {
    const slot = slotClass();
    const rule = rules().find(
      ({ rule: r }) =>
        r.selectorText.includes(slot) && r.selectorText.includes('svg')
    );
    expect(rule, 'iconSlot 안의 svg 규칙을 찾지 못했다').toBeDefined();
    // 선택자 전체가 :where(...) 하나다. 앞에 클래스가 붙으면 (0,1,x)가 돼 사용자 클래스에 진다.
    expect(rule!.rule.selectorText).toMatch(/^:where\(/);
    expect(rule!.rule.selectorText).toMatch(/\)$/);
  });

  it('svg는 1em x 1em이라 size별 fontSize(18/22/26/30px)를 따른다', () => {
    const slot = slotClass();
    const rule = rules().find(
      ({ rule: r }) =>
        r.selectorText.includes(slot) && r.selectorText.includes('svg')
    )!;
    expect(rule.rule.style.getPropertyValue('width')).toBe('1em');
    expect(rule.rule.style.getPropertyValue('height')).toBe('1em');
  });

  it('아이콘 span은 가운데 정렬 flex다(세로로 처지지 않는다)', () => {
    const slot = slotClass();
    const rule = rules().find(({ rule: r }) => r.selectorText === `.${slot}`)!;
    expect(rule.rule.style.getPropertyValue('display')).toBe('inline-flex');
    expect(rule.rule.style.getPropertyValue('align-items')).toBe('center');
    expect(rule.rule.style.getPropertyValue('justify-content')).toBe('center');
  });

  it('size별 fontSize는 그대로다(1em의 기준)', () => {
    const cssSource = readFileSync(
      resolve(__dirname, './IconButton.css.ts'),
      'utf-8'
    );
    for (const px of ['1.125rem', '1.375rem', '1.625rem', '1.875rem']) {
      expect(cssSource).toContain(`fontSize: '${px}'`);
    }
  });
});

describe('IconButton 방향 채움', () => {
  afterEach(() => vi.unstubAllGlobals());

  // IconButton.tsx가 채움 층 노드에 얹는 손잡이. gsap을 직접 import하지 않고 이걸로 읽는다.
  type Tween = {
    vars: { xPercent?: number; yPercent?: number; ease?: string };
    duration(): number;
    progress(value: number): unknown;
    // 죽은 트윈은 루트에서 떨어진다.
    parent: unknown;
  };
  type Fill = HTMLElement & { __iconButtonFill?: Tween };
  type At = { x?: number; y?: number; pointerType?: string };

  // jsdom에는 PointerEvent가 없다. React는 이름이 맞으면 받으므로 MouseEvent에
  // pointerType을 얹어 쏜다. React의 enter/leave는 over/out에서 만들어진다.
  const pointer = (
    el: HTMLElement,
    type: 'pointerover' | 'pointerout',
    { x = 22, y = 22, pointerType = 'mouse' }: At = {}
  ) =>
    act(() => {
      const event = new MouseEvent(type, {
        bubbles: true,
        clientX: x,
        clientY: y,
      });
      Object.defineProperty(event, 'pointerType', { value: pointerType });
      el.dispatchEvent(event);
    });
  const enter = (el: HTMLElement, at?: At) => pointer(el, 'pointerover', at);
  const leave = (el: HTMLElement, at?: At) => pointer(el, 'pointerout', at);

  // jsdom은 레이아웃이 없어 사각형이 전부 0이다. 그 인스턴스에서만 44x44로 둔다.
  const sized = (button: HTMLElement) => {
    button.getBoundingClientRect = () =>
      ({
        left: 0,
        top: 0,
        right: 44,
        bottom: 44,
        width: 44,
        height: 44,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }) as DOMRect;
    return button;
  };

  const setup = (props: Partial<ComponentProps<typeof IconButton>> = {}) => {
    const utils = render(
      <IconButton aria-label="채움" hoverEffect="directional" {...props}>
        <TestIcon />
      </IconButton>
    );
    return { ...utils, button: sized(screen.getByRole('button')) };
  };
  // 채움 층은 첫 자식이다(아이콘 칸보다 먼저 그려져 아이콘이 그 위에 올라온다).
  const fillOf = (button: HTMLElement) => button.firstElementChild as Fill;
  // 시작 위치는 gsap이 style.transform에 쓴 퍼센트로 읽는다.
  const at = (el: HTMLElement) => el.style.transform;

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

  it('hoverEffect 기본에서는 채움 층도 data-hover-effect도 없다', () => {
    render(
      <IconButton aria-label="기본">
        <TestIcon />
      </IconButton>
    );
    const button = screen.getByRole('button');

    expect(button).not.toHaveAttribute('data-hover-effect');
    expect(button.children).toHaveLength(1);
  });

  it("hoverEffect='none'을 명시해도 기본과 같다", () => {
    render(
      <IconButton aria-label="없음" hoverEffect="none">
        <TestIcon />
      </IconButton>
    );
    const button = screen.getByRole('button');

    expect(button).not.toHaveAttribute('data-hover-effect');
    expect(button.children).toHaveLength(1);
  });

  it("'directional'이면 aria-hidden 층이 아이콘 칸보다 앞에 있고 아래 모서리 밖에서 쉰다", () => {
    const { button } = setup();
    const layer = fillOf(button);

    expect(button).toHaveAttribute('data-hover-effect', 'directional');
    expect(button.children).toHaveLength(2);
    expect(layer).toHaveAttribute('aria-hidden', 'true');
    expect(layer).not.toContainElement(screen.getByTestId('test-icon'));
    expect(at(layer)).toMatch(/0(px|%)?, 101%/);
  });

  it.each([
    ['왼쪽', { x: 1, y: 22 }, /-101%, 0(px|%)?\)/],
    ['오른쪽', { x: 43, y: 22 }, /[^-]101%, 0(px|%)?\)/],
    ['위', { x: 22, y: 1 }, /0(px|%)?, -101%\)/],
    ['아래', { x: 22, y: 43 }, /0(px|%)?, 101%\)/],
  ])(
    '%s 모서리 가까이에서 들어오면 그 모서리 밖에서 출발한다',
    (_, point, start) => {
      const { button } = setup();
      const layer = fillOf(button);
      // 쉬던 자리(아래)와 다른 모서리에서 시작이 보이도록 한 번 들였다 빼 둔다.
      enter(button, { x: 22, y: 22 });
      layer.__iconButtonFill!.progress(1);
      leave(button, { x: 22, y: 22 });
      layer.__iconButtonFill!.progress(1);

      enter(button, point);

      expect(at(layer)).toMatch(start);
    }
  );

  it('들어올 때 slow settle로 0까지 간다', () => {
    const { button } = setup();
    enter(button);
    const tween = fillOf(button).__iconButtonFill!;

    expect(tween.vars.xPercent).toBe(0);
    expect(tween.vars.yPercent).toBe(0);
    expect(tween.vars.ease).toBe(gsapEasing.settle);
    expect(tween.duration()).toBe(gsapDuration.slow);
  });

  it('나갈 때 base settle로 나가는 쪽 모서리 밖으로 빠진다', () => {
    const { button } = setup();
    enter(button, { x: 1, y: 22 });
    fillOf(button).__iconButtonFill!.progress(1);

    leave(button, { x: 43, y: 22 });
    const tween = fillOf(button).__iconButtonFill!;

    expect(tween.vars.xPercent).toBe(101);
    expect(tween.vars.yPercent).toBe(0);
    expect(tween.vars.ease).toBe(gsapEasing.settle);
    expect(tween.duration()).toBe(gsapDuration.base);
  });

  it('위로 나가면 위 모서리 밖으로 빠진다', () => {
    const { button } = setup();
    enter(button);
    fillOf(button).__iconButtonFill!.progress(1);

    leave(button, { x: 22, y: -1 });

    expect(fillOf(button).__iconButtonFill!.vars.yPercent).toBe(-101);
  });

  it('반쯤 빠지던 중 다시 들어오면 새 모서리로 순간 이동하지 않고 지금 자리에서 간다', () => {
    const { button } = setup();
    const layer = fillOf(button);
    enter(button, { x: 1, y: 22 });
    layer.__iconButtonFill!.progress(1);
    leave(button, { x: 43, y: 22 });
    layer.__iconButtonFill!.progress(0.5);
    const mid = at(layer);
    expect(mid).not.toContain('101%');

    enter(button, { x: 22, y: 1 });

    // 위 모서리(-101%) 밖으로 다시 놓지 않았다.
    expect(at(layer)).toBe(mid);
    expect(layer.__iconButtonFill!.vars.xPercent).toBe(0);
  });

  it("pointerType 'touch'와 'pen'은 효과가 없다", () => {
    const { button } = setup();
    const layer = fillOf(button);
    const rest = at(layer);

    enter(button, { pointerType: 'touch' });
    enter(button, { pointerType: 'pen' });

    expect(layer.__iconButtonFill).toBeUndefined();
    expect(at(layer)).toBe(rest);
  });

  it('나갈 때도 터치는 효과가 없다', () => {
    const { button } = setup();
    enter(button);
    const tween = fillOf(button).__iconButtonFill!;
    tween.progress(1);

    leave(button, { pointerType: 'touch' });

    expect(fillOf(button).__iconButtonFill).toBe(tween);
  });

  it.each([
    ['disabled', { disabled: true }],
    ['loading', { loading: true }],
  ])('%s에서는 효과가 없다', (_, props) => {
    const { button } = setup(props);

    enter(button);

    expect(fillOf(button).__iconButtonFill).toBeUndefined();
  });

  it('층이 들어와 있다가 비활성이 되면 지금 자리에서 밖으로 나간다', () => {
    const { button, rerender } = setup();
    enter(button, { x: 1, y: 22 });
    fillOf(button).__iconButtonFill!.progress(1);
    expect(at(fillOf(button))).not.toContain('101%');

    rerender(
      <IconButton aria-label="채움" hoverEffect="directional" disabled>
        <TestIcon />
      </IconButton>
    );

    const tween = fillOf(button).__iconButtonFill!;
    expect(tween.vars.yPercent).toBe(101);
    expect(tween.duration()).toBe(gsapDuration.base);
  });

  it('키보드 포커스는 효과가 없다', () => {
    const { button } = setup();

    act(() => button.focus());

    expect(fillOf(button).__iconButtonFill).toBeUndefined();
  });

  it('사용자의 onPointerEnter와 onPointerLeave도 불린다', () => {
    const calls: string[] = [];
    const { button } = setup({
      onPointerEnter: () => calls.push('enter'),
      onPointerLeave: () => calls.push('leave'),
    });

    enter(button);
    expect(fillOf(button).__iconButtonFill).toBeDefined();
    leave(button);

    expect(calls).toEqual(['enter', 'leave']);
  });

  it('hoverEffect가 none이어도 사용자의 onPointerEnter는 불린다', () => {
    const onPointerEnter = vi.fn();
    render(
      <IconButton aria-label="없음" onPointerEnter={onPointerEnter}>
        <TestIcon />
      </IconButton>
    );

    enter(screen.getByRole('button'));

    expect(onPointerEnter).toHaveBeenCalledTimes(1);
  });

  it('축소 모드에서는 들어오면 즉시 덮고 나가면 즉시 빠진다', () => {
    stubReducedMotion();
    const { button } = setup();
    const layer = fillOf(button);

    enter(button, { x: 1, y: 22 });
    expect(at(layer)).not.toContain('101%');
    expect(layer.__iconButtonFill!.parent).toBeNull();

    leave(button, { x: 43, y: 22 });
    expect(at(layer)).toContain('101%');
  });

  it('언마운트하면 트윈을 죽인다', () => {
    const { button } = setup();
    enter(button);
    const tween = fillOf(button).__iconButtonFill!;
    expect(tween.parent).not.toBeNull();

    cleanup();

    expect(tween.parent).toBeNull();
  });
});

describe('IconButton 방향 채움의 생성 CSS', () => {
  const hoverBackgrounds = () =>
    iconButtonRules().filter(
      ({ rule }) =>
        rule.selectorText.includes(':hover') &&
        rule.style.getPropertyValue('background-color') !== ''
    );
  const layerRule = () =>
    iconButtonRules().find(
      ({ rule, media }) =>
        media === null && /^\.IconButton_fill__\w+$/.test(rule.selectorText)
    );
  const ownRule = (name: string) =>
    iconButtonRules().find(
      ({ rule, media }) =>
        media === null &&
        new RegExp(`^\\.IconButton_${name}__\\w+$`).test(rule.selectorText)
    );

  it('버튼 자신의 호버 배경 규칙 9곳은 data-hover-effect가 켜지면 걸리지 않는다', () => {
    const hovers = hoverBackgrounds();
    expect(hovers).toHaveLength(9);
    for (const { rule } of hovers) {
      expect(rule.selectorText).toContain(':not([data-hover-effect])');
    }
  });

  it('호버 글자색은 효과가 켜져도 버튼에서 바뀐다', () => {
    const colorHover = iconButtonRules().filter(
      ({ rule }) =>
        rule.selectorText.includes(':hover') &&
        rule.style.getPropertyValue('color') !== ''
    );
    expect(colorHover).toHaveLength(1);
    expect(colorHover[0].rule.selectorText).not.toContain(
      '[data-hover-effect]'
    );
    expect(colorHover[0].rule.selectorText).toMatch(/ghostBase/);
  });

  it('층의 배경은 버튼의 호버 규칙이 읽는 CSS 변수와 같은 것이다(색을 한 번만 적는다)', () => {
    const layer = layerRule()!.rule.style.getPropertyValue('background-color');
    expect(layer).toMatch(/^var\(--/);
    for (const { rule } of hoverBackgrounds()) {
      expect(rule.style.getPropertyValue('background-color')).toBe(layer);
    }
  });

  it('누름 중에는 층이 누름 색 변수를 읽는다', () => {
    const pressed = iconButtonRules().find(
      ({ rule }) =>
        /IconButton_fill__\w+$/.test(rule.selectorText) &&
        rule.selectorText.includes('[data-pressed]')
    );
    expect(pressed).toBeDefined();
    expect(pressed!.rule.style.getPropertyValue('background-color')).toMatch(
      /^var\(--/
    );
  });

  it('층은 inset 0으로 버튼을 덮고 포인터를 받지 않는다', () => {
    const style = layerRule()!.rule.style;
    expect(style.getPropertyValue('position')).toBe('absolute');
    expect(style.getPropertyValue('inset')).toBe('0');
    expect(style.getPropertyValue('border-radius')).toBe('inherit');
    expect(style.getPropertyValue('pointer-events')).toBe('none');
  });

  it('아이콘 칸과 로딩 칸은 position: relative로 층 위에 그려진다', () => {
    for (const name of ['iconSlot', 'loadingSlot']) {
      expect(ownRule(name)!.rule.style.getPropertyValue('position'), name).toBe(
        'relative'
      );
    }
  });
});
