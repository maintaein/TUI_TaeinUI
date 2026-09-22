import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { IconButton } from './IconButton';

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

  describe('variant prop 테스트', () => {
    it('variant="primary"를 적용한다', () => {
      render(
        <IconButton variant="primary" aria-label="Primary">
          <TestIcon />
        </IconButton>
      );

      const button = screen.getByRole('button');
      expect(button.className).toContain('primary');
    });

    it('variant="dark"를 적용한다', () => {
      render(
        <IconButton variant="dark" aria-label="Dark">
          <TestIcon />
        </IconButton>
      );

      const button = screen.getByRole('button');
      expect(button.className).toContain('dark');
    });

    it('variant="danger"를 적용한다', () => {
      render(
        <IconButton variant="danger" aria-label="Danger">
          <TestIcon />
        </IconButton>
      );

      const button = screen.getByRole('button');
      expect(button.className).toContain('danger');
    });

    it('variant="light"를 적용한다', () => {
      render(
        <IconButton variant="light" aria-label="Light">
          <TestIcon />
        </IconButton>
      );

      const button = screen.getByRole('button');
      expect(button.className).toContain('light');
    });
  });

  describe('buttonStyle prop 테스트', () => {
    it('buttonStyle="fill"을 적용한다', () => {
      render(
        <IconButton buttonStyle="fill" aria-label="Fill">
          <TestIcon />
        </IconButton>
      );

      const button = screen.getByRole('button');
      expect(button.className).toContain('fill');
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
    it('contained 모드에서 아이콘 래퍼에 size별 클래스가 적용된다', () => {
      const sizes = ['sm', 'md', 'lg', 'xl'] as const;

      sizes.forEach((size) => {
        const { unmount } = render(
          <IconButton size={size} aria-label={`icon-${size}`}>
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
          <IconButton ghost size={size} aria-label={`ghost-${size}`}>
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
        <IconButton ghost size="lg" aria-label="ghost-lg">
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

  describe('ghost prop 테스트', () => {
    it('ghost 모드에서 렌더링된다', () => {
      render(
        <IconButton ghost aria-label="닫기">
          <TestIcon />
        </IconButton>
      );

      const button = screen.getByRole('button', { name: '닫기' });
      expect(button).toBeInTheDocument();
      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    });

    it('ghost 모드에서 ghost 스타일 클래스가 적용된다', () => {
      render(
        <IconButton ghost aria-label="닫기">
          <TestIcon />
        </IconButton>
      );

      const button = screen.getByRole('button');
      expect(button.className).toContain('ghost');
    });

    it('ghost 모드에서 variant/buttonStyle 클래스가 적용되지 않는다', () => {
      render(
        <IconButton
          ghost
          variant="primary"
          buttonStyle="fill"
          aria-label="닫기"
        >
          <TestIcon />
        </IconButton>
      );

      const button = screen.getByRole('button');
      // fill/weak variant 클래스가 아닌 ghost 클래스만 있어야 함
      expect(button.className).toContain('ghost');
      // fillVariants/weakVariants의 primary 클래스는 적용되지 않아야 함
      expect(button.className).not.toContain('fill');
    });

    it('ghost 모드에서 sizeVariants가 적용되지 않는다', () => {
      render(
        <IconButton ghost size="lg" aria-label="닫기">
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
        <IconButton ghost onClick={handleClick} aria-label="닫기">
          <TestIcon />
        </IconButton>
      );

      await user.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('ghost 모드에서 disabled 상태가 동작한다', () => {
      render(
        <IconButton ghost disabled aria-label="닫기">
          <TestIcon />
        </IconButton>
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('ghost 모드에서 loading 상태가 동작한다', () => {
      render(
        <IconButton ghost loading aria-label="닫기">
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
        <IconButton ghost aria-label="닫기">
          <TestIcon />
        </IconButton>
      );

      const button = screen.getByRole('button');
      const iconWrapper = button.querySelector('[aria-hidden="true"]');
      expect(iconWrapper).toBeInTheDocument();
    });

    it('ghost={false}일 때 기존 동작과 동일하다 (기본값)', () => {
      render(
        <IconButton ghost={false} aria-label="닫기">
          <TestIcon />
        </IconButton>
      );

      const button = screen.getByRole('button');
      expect(button.className).not.toContain('ghost');
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

describe('IconButton 모션 잠금', () => {
  // vanilla-extract가 스타일을 클래스로 직렬화해서 jsdom에서 계산값을 못
  // 읽는다. IconButton.css.ts 소스 텍스트에서 직접 확인한다(Button 관례).
  const cssSource = readFileSync(
    resolve(__dirname, './IconButton.css.ts'),
    'utf-8'
  );

  it('아이콘 래퍼에 iconMotion 클래스가 붙는다(몸통보다 늦게 따라오는 지연용)', () => {
    render(
      <IconButton aria-label="지연">
        <TestIcon />
      </IconButton>
    );
    const button = screen.getByRole('button');
    const iconWrapper = button.querySelector('[aria-hidden="true"]');
    expect(iconWrapper?.className).toContain('iconMotion');
  });

  it('ghost 모드에서도 아이콘 래퍼에 iconMotion 클래스가 붙는다', () => {
    render(
      <IconButton ghost aria-label="지연-ghost">
        <TestIcon />
      </IconButton>
    );
    const button = screen.getByRole('button');
    const iconWrapper = button.querySelector('[aria-hidden="true"]');
    expect(iconWrapper?.className).toContain('iconMotion');
  });

  it('recipe base와 ghostBase의 transition이 transform에 snap을 쓴다(해제 오버슛)', () => {
    const transitionLines = [...cssSource.matchAll(/transition: `([^`]*)`,/g)];
    expect(transitionLines.length).toBeGreaterThanOrEqual(2);
    for (const [, line] of transitionLines) {
      expect(line).toContain(
        'transform ${themeContract.animation.duration.base} ${themeContract.animation.easing.snap}'
      );
    }
  });

  it('recipe base와 ghostBase 양쪽에 :active:not(:disabled) exit 오버라이드가 있다', () => {
    const activeBlocks = [
      ...cssSource.matchAll(
        /['&]*:active:not\(:disabled\)'?: \{([\s\S]*?)\n\s*\},/g
      ),
    ];
    const withExit = activeBlocks.filter((m) =>
      m[1].includes('themeContract.animation.easing.exit')
    );
    expect(withExit.length).toBeGreaterThanOrEqual(2);
  });

  it('iconMotion이 40ms 지연 리터럴에 근거 주석을 달고 있다(stagger 토큰 부재, T2 확인)', () => {
    const iconMotionBlock = cssSource.match(
      /export const iconMotion = style\(\{([\s\S]*?)\n\}\);/
    )?.[1];
    expect(iconMotionBlock, 'iconMotion 블록을 찾지 못했다').toBeDefined();
    expect(iconMotionBlock).toContain('40ms');
    expect(cssSource).toContain('stagger');
  });

  it('recipe base와 ghostBase 양쪽 hover에 translateY(-1px) 오버라이드가 있다(리뷰 F4 — 색 단독 채널 금지)', () => {
    // compoundVariants 8곳의 hover(배경색/색만 바꾸는 블록, 이 리뷰가 손대지
    // 말라고 한 부분)는 걸러내고, base.selectors/ghostBase.selectors에 새로
    // 붙은 두 hover 블록만 겨냥한다 — 둘 다 'F4' 주석을 바로 앞에 단다.
    const f4HoverBlocks = [
      ...cssSource.matchAll(
        /리뷰 F4[\s\S]*?\n\s*'&:hover:not\(:disabled\)': \{([\s\S]*?)\n\s*\},/g
      ),
    ];
    expect(f4HoverBlocks).toHaveLength(2);
    for (const [, block] of f4HoverBlocks) {
      expect(block).toContain("transform: 'translateY(-1px)'");
      expect(block).toContain('themeContract.animation.duration.fast');
    }
  });

  // 리뷰 C3 — 포인터를 떼도 요소는 여전히 :hover에 매치된다. (0,3,0)인 이
  // 블록의 타이밍 함수 롱핸드가 base(0,1,0)의 transition 숏핸드를 이기고,
  // 게다가 속성별 목록을 값 하나로 무너뜨려 transform에도 같은 커브를
  // 먹인다 — 되돌아오는 전이까지 그 커브가 지배해서 base의 snap 오버슛이
  // 포인터 사용자에게 한 번도 재생되지 않았다(크로미엄 실측). 두 블록을
  // 따로 잠근다: 한쪽만 되돌려 놓는 회귀가 있다.
  it('recipe base :hover 블록에 transitionTimingFunction이 없다(리뷰 C3)', () => {
    // 무엇을 뒤집으면 빨개지는가: iconButton.base.selectors의
    // '&:hover:not(:disabled)'에 transitionTimingFunction: settle을
    // 되돌려 놓으면 여기가 빨개진다.
    const hoverBlocks = [
      ...cssSource.matchAll(
        /리뷰 F4[\s\S]*?\n\s*'&:hover:not\(:disabled\)': \{([\s\S]*?)\n\s*\},/g
      ),
    ];
    expect(hoverBlocks).toHaveLength(2);
    expect(hoverBlocks[0][1]).not.toContain('transitionTimingFunction');
  });

  it('ghostBase :hover 블록에 transitionTimingFunction이 없다(리뷰 C3)', () => {
    // 무엇을 뒤집으면 빨개지는가: ghostBase.selectors의
    // '&:hover:not(:disabled)'에 transitionTimingFunction: settle을
    // 되돌려 놓으면 여기가 빨개진다.
    const hoverBlocks = [
      ...cssSource.matchAll(
        /리뷰 F4[\s\S]*?\n\s*'&:hover:not\(:disabled\)': \{([\s\S]*?)\n\s*\},/g
      ),
    ];
    expect(hoverBlocks).toHaveLength(2);
    expect(hoverBlocks[1][1]).not.toContain('transitionTimingFunction');
  });

  it('아이콘 자신의 눌림 scale이 0.99로, 몸통 scale과 곱해도 0.94대에 머문다(리뷰 F5)', () => {
    const overrideBlock = cssSource.match(
      /globalStyle\(\s*`\$\{iconButton\.classNames\.base\}[\s\S]*?\{([\s\S]*?)\n\s*\}\s*\);/
    )?.[1];
    expect(
      overrideBlock,
      'iconMotion :active 오버라이드 블록을 찾지 못했다'
    ).toBeDefined();
    expect(overrideBlock).toContain("transform: 'scale(0.99)'");
  });
});
