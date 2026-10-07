import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import React, { createRef } from 'react';
import { TextField } from './TextField';

describe('TextField', () => {
  describe('렌더링 테스트', () => {
    it('기본 input을 렌더링한다', () => {
      render(<TextField label="이름" />);
      const input = screen.getByLabelText('이름');
      expect(input).toBeInTheDocument();
      expect(input.tagName).toBe('INPUT');
    });

    it('placeholder를 표시한다', () => {
      render(<TextField label="이메일" placeholder="example@email.com" />);
      const input = screen.getByPlaceholderText('example@email.com');
      expect(input).toBeInTheDocument();
    });

    it('value를 표시한다', () => {
      render(<TextField label="이름" value="홍길동" onChange={() => {}} />);
      const input = screen.getByDisplayValue('홍길동');
      expect(input).toBeInTheDocument();
    });

    it('defaultValue를 표시한다', () => {
      render(<TextField label="이름" defaultValue="홍길동" />);
      const input = screen.getByDisplayValue('홍길동');
      expect(input).toBeInTheDocument();
    });
  });

  describe('type prop 테스트', () => {
    it('text type을 렌더링한다 (기본값)', () => {
      render(<TextField label="이름" />);
      const input = screen.getByLabelText('이름');
      expect(input).toHaveAttribute('type', 'text');
    });

    it('email type을 렌더링한다', () => {
      render(<TextField label="이메일" type="email" />);
      const input = screen.getByLabelText('이메일');
      expect(input).toHaveAttribute('type', 'email');
    });

    it('password type을 렌더링한다', () => {
      render(<TextField label="비밀번호" type="password" />);
      const input = screen.getByLabelText('비밀번호');
      expect(input).toHaveAttribute('type', 'password');
    });

    it('number type을 렌더링한다', () => {
      render(<TextField label="나이" type="number" />);
      const input = screen.getByLabelText('나이');
      expect(input).toHaveAttribute('type', 'number');
    });

    it('tel type을 렌더링한다', () => {
      render(<TextField label="전화번호" type="tel" />);
      const input = screen.getByLabelText('전화번호');
      expect(input).toHaveAttribute('type', 'tel');
    });

    it('url type을 렌더링한다', () => {
      render(<TextField label="웹사이트" type="url" />);
      const input = screen.getByLabelText('웹사이트');
      expect(input).toHaveAttribute('type', 'url');
    });
  });

  describe('size prop 테스트', () => {
    it('sm size를 적용한다', () => {
      render(<TextField label="이름" size="sm" />);
      expect(screen.getByLabelText('이름').className).toContain('size_sm');
    });

    it('md size를 적용한다 (기본값)', () => {
      render(<TextField label="이름" />);
      expect(screen.getByLabelText('이름').className).toContain('size_md');
    });

    it('lg size를 적용한다', () => {
      render(<TextField label="이름" size="lg" />);
      expect(screen.getByLabelText('이름').className).toContain('size_lg');
    });
  });

  describe('상태 prop 테스트', () => {
    it('disabled 상태를 적용한다', () => {
      render(<TextField label="이름" disabled />);
      const input = screen.getByLabelText('이름');
      expect(input).toBeDisabled();
    });

    it('readOnly 상태를 적용한다', () => {
      render(
        <TextField label="이름" readOnly value="홍길동" onChange={() => {}} />
      );
      const input = screen.getByLabelText('이름');
      expect(input).toHaveAttribute('readonly');
    });

    it('required 상태를 적용한다', () => {
      render(<TextField label="이름" required />);
      const input = screen.getByRole('textbox', { name: /이름/ });
      expect(input).toBeRequired();
    });
  });

  describe('error prop 테스트', () => {
    it('error가 true이면 error 상태를 적용한다', () => {
      render(<TextField label="이메일" error />);
      expect(screen.getByLabelText('이메일').className).toContain('error');
    });

    it('error message를 표시한다', () => {
      render(
        <TextField
          label="이메일"
          error
          errorMessage="올바른 이메일을 입력하세요"
        />
      );
      expect(
        screen.getByText('올바른 이메일을 입력하세요')
      ).toBeInTheDocument();
    });

    it('error가 false이면 error message를 표시하지 않는다', () => {
      render(
        <TextField label="이메일" errorMessage="올바른 이메일을 입력하세요" />
      );
      expect(
        screen.queryByText('올바른 이메일을 입력하세요')
      ).not.toBeInTheDocument();
    });
  });

  describe('helperText prop 테스트', () => {
    it('helperText를 표시한다', () => {
      render(<TextField label="비밀번호" helperText="8자 이상 입력하세요" />);
      expect(screen.getByText('8자 이상 입력하세요')).toBeInTheDocument();
    });

    it('error가 true이면 helperText 대신 errorMessage를 표시한다', () => {
      render(
        <TextField
          label="비밀번호"
          helperText="8자 이상 입력하세요"
          error
          errorMessage="비밀번호가 너무 짧습니다"
        />
      );
      expect(screen.getByText('비밀번호가 너무 짧습니다')).toBeInTheDocument();
      expect(screen.queryByText('8자 이상 입력하세요')).not.toBeInTheDocument();
    });
  });

  describe('fullWidth prop 테스트', () => {
    it('fullWidth가 true이면 전체 너비를 차지한다', () => {
      render(<TextField label="이름" fullWidth />);
      const wrapper = screen.getByLabelText('이름').parentElement;
      expect(wrapper?.className).toContain('fullWidth');
    });
  });

  describe('이벤트 핸들러 테스트', () => {
    it('onChange 이벤트를 호출한다', async () => {
      const handleChange = vi.fn();
      render(<TextField label="이름" onChange={handleChange} />);
      const input = screen.getByLabelText('이름');

      await userEvent.type(input, '홍길동');
      expect(handleChange).toHaveBeenCalled();
    });

    it('onFocus 이벤트를 호출한다', () => {
      const handleFocus = vi.fn();
      render(<TextField label="이름" onFocus={handleFocus} />);
      const input = screen.getByLabelText('이름');

      fireEvent.focus(input);
      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it('onBlur 이벤트를 호출한다', () => {
      const handleBlur = vi.fn();
      render(<TextField label="이름" onBlur={handleBlur} />);
      const input = screen.getByLabelText('이름');

      fireEvent.focus(input);
      fireEvent.blur(input);
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });
  });

  describe('ref 전달 테스트 (forwardRef)', () => {
    it('ref를 input 요소에 전달한다', () => {
      const ref = createRef<HTMLInputElement>();
      render(<TextField label="이름" ref={ref} />);

      expect(ref.current).toBeInstanceOf(HTMLInputElement);
      expect(ref.current?.tagName).toBe('INPUT');
    });

    it('ref를 통해 focus()를 호출할 수 있다', () => {
      const ref = createRef<HTMLInputElement>();
      render(<TextField label="이름" ref={ref} />);

      ref.current?.focus();
      expect(ref.current).toHaveFocus();
    });

    it('ref를 통해 blur()를 호출할 수 있다', () => {
      const ref = createRef<HTMLInputElement>();
      render(<TextField label="이름" ref={ref} />);

      ref.current?.focus();
      expect(ref.current).toHaveFocus();

      ref.current?.blur();
      expect(ref.current).not.toHaveFocus();
    });
  });

  describe('접근성 테스트', () => {
    it('label과 input이 올바르게 연결된다', () => {
      render(<TextField label="이름" />);
      const input = screen.getByLabelText('이름');
      expect(input).toBeInTheDocument();
    });

    it('required일 때 label에 * 표시가 있다', () => {
      render(<TextField label="이름" required />);
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('error일 때 aria-invalid가 true이다', () => {
      render(<TextField label="이메일" error />);
      const input = screen.getByLabelText('이메일');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('error가 아닐 때 aria-invalid가 false이다', () => {
      render(<TextField label="이메일" />);
      const input = screen.getByLabelText('이메일');
      expect(input).toHaveAttribute('aria-invalid', 'false');
    });

    it('errorMessage가 있을 때 aria-describedby가 설정된다', () => {
      render(
        <TextField
          label="이메일"
          error
          errorMessage="올바른 이메일을 입력하세요"
        />
      );
      const input = screen.getByLabelText('이메일');
      const describedBy = input.getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();
      expect(screen.getByText('올바른 이메일을 입력하세요')).toHaveAttribute(
        'id',
        describedBy!
      );
    });

    it('helperText가 있을 때 aria-describedby가 설정된다', () => {
      render(<TextField label="비밀번호" helperText="8자 이상 입력하세요" />);
      const input = screen.getByLabelText('비밀번호');
      const describedBy = input.getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();
      expect(screen.getByText('8자 이상 입력하세요')).toHaveAttribute(
        'id',
        describedBy!
      );
    });

    it('disabled일 때 aria-disabled가 true이다', () => {
      render(<TextField label="이름" disabled />);
      const input = screen.getByLabelText('이름');
      expect(input).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('키보드 인터랙션 테스트', () => {
    it('Tab 키로 포커스를 이동할 수 있다', async () => {
      render(
        <div>
          <TextField label="이름" />
          <TextField label="이메일" />
        </div>
      );

      const nameInput = screen.getByLabelText('이름');
      const emailInput = screen.getByLabelText('이메일');

      nameInput.focus();
      expect(nameInput).toHaveFocus();

      await userEvent.tab();
      expect(emailInput).toHaveFocus();
    });

    it('Enter 키를 누르면 onChange가 호출된다', async () => {
      const handleChange = vi.fn();
      render(<TextField label="검색" onChange={handleChange} />);
      const input = screen.getByLabelText('검색');

      await userEvent.type(input, 'test{Enter}');
      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe('엣지 케이스 테스트', () => {
    it('매우 긴 텍스트를 입력할 수 있다', () => {
      render(<TextField label="설명" />);
      const input = screen.getByLabelText('설명');
      const longText = 'a'.repeat(100);

      fireEvent.change(input, { target: { value: longText } });
      expect(input).toHaveValue(longText);
    });

    it('value와 onChange가 동시에 제공되면 제어 컴포넌트로 동작한다', () => {
      const ControlledTextField = () => {
        const [value, setValue] = React.useState('');
        return (
          <TextField
            label="이름"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        );
      };

      render(<ControlledTextField />);
      const input = screen.getByLabelText('이름');

      fireEvent.change(input, { target: { value: 'test' } });
      expect(input).toHaveValue('test');
    });
  });

  describe('타이핑 효과 없음 (task-15)', () => {
    it.each([
      ['text'],
      ['email'],
      ['tel'],
      ['url'],
      ['password'],
      ['number'],
    ] as const)(
      'type="%s"는 input 하나만 그린다: 글자를 따로 겹쳐 그리는 오버레이가 없다',
      (type) => {
        const { container } = render(<TextField label="입력" type={type} />);
        expect(container.querySelector('[aria-hidden="true"]')).toBeNull();
        expect(container.querySelectorAll('input')).toHaveLength(1);
      }
    );
  });
});

/** jsdom에 주입된 생성 CSS(CSSOM)에서 규칙을 평탄하게 읽는다. */
function sheetRules(marker: string): CSSStyleRule[] {
  const sheet = Array.from(document.styleSheets).find((candidate) =>
    Array.from(candidate.cssRules).some((rule) => rule.cssText.includes(marker))
  );
  if (!sheet) {
    throw new Error(`${marker}를 가진 스타일시트를 찾지 못했다`);
  }
  const flat: CSSStyleRule[] = [];
  const walk = (rules: CSSRuleList) => {
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSStyleRule) flat.push(rule);
      else if ('cssRules' in rule) walk((rule as CSSGroupingRule).cssRules);
    }
  };
  walk(sheet.cssRules);
  return flat;
}

describe('TextField 생성 CSS (포커스 모양, task-15)', () => {
  const rules = () => sheetRules('TextField_input');
  const inputRule = (suffix: string) =>
    rules().find((rule) =>
      new RegExp(`^\\.TextField_input__\\w+${suffix}$`).test(rule.selectorText)
    );
  const errorRule = (suffix: string) =>
    rules().find((rule) =>
      new RegExp(`^\\.TextField_error__\\w+${suffix}$`).test(rule.selectorText)
    );

  it('클릭(:focus)과 키보드(:focus-visible) 모두 호버와 같은 테두리 색을 쓴다', () => {
    const hover = inputRule(':hover:not\\(:disabled\\)');
    const focus = inputRule(':focus');
    expect(hover).toBeDefined();
    expect(focus).toBeDefined();
    expect(focus!.style.getPropertyValue('border-color')).toBe(
      hover!.style.getPropertyValue('border-color')
    );
    expect(inputRule(':focus-visible')).toBeUndefined();
  });

  it('포커스에는 3px 후광(box-shadow)도 2px 바깥 링(outline)도 없다', () => {
    const focus = inputRule(':focus')!;
    expect(focus.style.getPropertyValue('box-shadow')).toBe('');
    expect(focus.style.getPropertyValue('outline')).toBe('');
    expect(focus.style.getPropertyValue('outline-offset')).toBe('');
  });

  it('error 상태에는 포커스 후광이 없고 테두리 색만 남는다', () => {
    const error = errorRule('')!;
    expect(error.style.getPropertyValue('border-color')).toContain('error');
    for (const rule of rules()) {
      if (rule.selectorText.includes('TextField_error')) {
        expect(
          rule.style.getPropertyValue('box-shadow'),
          rule.selectorText
        ).toBe('');
      }
    }
  });

  it('transition 목록에 쓸모없어진 box-shadow가 없다', () => {
    const base = inputRule('')!;
    expect(base.style.getPropertyValue('transition')).not.toContain(
      'box-shadow'
    );
  });
});
