import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { createRef } from 'react';
import { Button } from './Button';
import * as styles from './Button.css'; // 클래스명 검증을 위해 스타일 임포트

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
      // LoadingSpinner가 렌더링되는지 확인 (role="status"로 찾기)
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

      await userEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('Enter 키 입력 시 동작한다', async () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>키보드</Button>);

      const button = screen.getByRole('button');
      button.focus();
      await userEvent.keyboard('{Enter}');

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

describe('Button 모션 잠금', () => {
  // vanilla-extract가 스타일을 클래스로 직렬화해서 jsdom에서 계산값을 못
  // 읽는다. Button.css.ts 소스 텍스트에서 직접 확인한다(Card·Chip 관례).
  const cssSource = readFileSync(
    resolve(__dirname, './Button.css.ts'),
    'utf-8'
  );

  it('base transition의 transform 구간이 snap을 쓴다(해제 오버슛)', () => {
    const transitionLine = cssSource.match(/transition: `([^`]*)`,/)?.[1];
    expect(transitionLine, 'base transition 선언을 찾지 못했다').toBeDefined();
    expect(transitionLine).toContain(
      'transform ${themeContract.animation.duration.base} ${themeContract.animation.easing.snap}'
    );
  });

  it(':hover:not(:disabled)이 translateY(-1px)/settle을 새로 만든다(조항 4: 색 단독 금지)', () => {
    const hover = cssSource.match(
      /['&]*:hover:not\(:disabled\)'?: \{([\s\S]*?)\n\s*\},/
    )?.[1];
    expect(hover, ':hover:not(:disabled) 블록을 찾지 못했다').toBeDefined();
    expect(hover).toContain("transform: 'translateY(-1px)'");
    expect(hover).toContain('themeContract.animation.easing.settle');
  });

  it(':active:not(:disabled)이 exit 한 줄로 변형 10곳의 커브를 덮는다', () => {
    const active = cssSource.match(
      /['&]*:active:not\(:disabled\)'?: \{([\s\S]*?)\n\s*\},/
    )?.[1];
    expect(active, ':active:not(:disabled) 블록을 찾지 못했다').toBeDefined();
    expect(active).toContain('themeContract.animation.easing.exit');
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
