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

/** multiline은 true/false 리터럴만 받으므로(판별 유니온) boolean 변수는 여기서 가른다. */
function renderField(
  multiline: boolean,
  props: {
    required?: boolean;
    error?: boolean;
    errorMessage?: string;
    helperText?: string;
    disabled?: boolean;
  }
) {
  return multiline
    ? render(<TextField label="항목" multiline {...props} />)
    : render(<TextField label="항목" {...props} />);
}

describe('TextField multiline (task-15)', () => {
  describe('렌더링', () => {
    it('multiline이면 textarea를 그리고 input은 그리지 않는다', () => {
      const { container } = render(<TextField label="소개" multiline />);
      expect(screen.getByLabelText('소개').tagName).toBe('TEXTAREA');
      expect(container.querySelector('input')).toBeNull();
    });

    it('multiline이 없으면 input이고 textarea는 없다', () => {
      const { container } = render(<TextField label="이름" />);
      expect(screen.getByLabelText('이름').tagName).toBe('INPUT');
      expect(container.querySelector('textarea')).toBeNull();
    });

    it('multiline={false}도 input이다', () => {
      render(<TextField label="이름" multiline={false} />);
      expect(screen.getByLabelText('이름').tagName).toBe('INPUT');
    });

    it('multiline 속성이 DOM에 새지 않는다', () => {
      render(<TextField label="소개" multiline />);
      expect(screen.getByLabelText('소개')).not.toHaveAttribute('multiline');
    });

    it('placeholder, value, defaultValue를 표시한다', () => {
      render(
        <>
          <TextField label="a" multiline placeholder="메모를 입력하세요" />
          <TextField label="b" multiline value="값" onChange={() => {}} />
          <TextField label="c" multiline defaultValue="기본" />
        </>
      );
      expect(
        screen.getByPlaceholderText('메모를 입력하세요')
      ).toBeInTheDocument();
      expect(screen.getByDisplayValue('값')).toBeInTheDocument();
      expect(screen.getByDisplayValue('기본')).toBeInTheDocument();
    });

    it('줄바꿈이 포함된 텍스트를 입력할 수 있다', () => {
      render(<TextField label="소개" multiline />);
      const textarea = screen.getByLabelText('소개');
      fireEvent.change(textarea, { target: { value: '첫 줄\n둘째 줄' } });
      expect(textarea).toHaveValue('첫 줄\n둘째 줄');
    });
  });

  describe('rows', () => {
    it('기본값은 4줄이다', () => {
      render(<TextField label="소개" multiline />);
      expect(screen.getByLabelText('소개')).toHaveAttribute('rows', '4');
    });

    it('rows로 줄 수를 정한다', () => {
      render(<TextField label="소개" multiline rows={8} />);
      expect(screen.getByLabelText('소개')).toHaveAttribute('rows', '8');
    });
  });

  describe('autoResize', () => {
    it('꺼져 있으면 overflow가 auto이고 height를 건드리지 않는다 (기본값)', () => {
      render(<TextField label="소개" multiline />);
      const textarea = screen.getByLabelText('소개');
      expect(textarea.style.overflow).toBe('auto');
      expect(textarea.style.height).toBe('');
    });

    it('켜져 있으면 overflow가 hidden이다', () => {
      render(<TextField label="소개" multiline autoResize />);
      expect(screen.getByLabelText('소개').style.overflow).toBe('hidden');
    });

    it('켜져 있으면 입력할 때 높이가 scrollHeight로 바뀐다', async () => {
      render(<TextField label="소개" multiline autoResize />);
      const textarea = screen.getByLabelText('소개');
      Object.defineProperty(textarea, 'scrollHeight', {
        configurable: true,
        value: 200,
      });

      await userEvent.type(textarea, '첫 줄\n둘째 줄');

      expect(textarea.style.height).toBe('200px');
    });

    it('켜져 있으면 처음 그릴 때도 높이를 맞춘다', () => {
      const original = Object.getOwnPropertyDescriptor(
        HTMLElement.prototype,
        'scrollHeight'
      );
      Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
        configurable: true,
        get: () => 150,
      });
      try {
        render(
          <TextField label="소개" multiline autoResize defaultValue="a" />
        );
        expect(screen.getByLabelText('소개').style.height).toBe('150px');
      } finally {
        if (original) {
          Object.defineProperty(
            HTMLElement.prototype,
            'scrollHeight',
            original
          );
        } else {
          Reflect.deleteProperty(HTMLElement.prototype, 'scrollHeight');
        }
      }
    });

    it('꺼져 있으면 입력해도 높이를 바꾸지 않는다', async () => {
      render(<TextField label="소개" multiline />);
      const textarea = screen.getByLabelText('소개');
      Object.defineProperty(textarea, 'scrollHeight', {
        configurable: true,
        value: 200,
      });
      await userEvent.type(textarea, 'a');
      expect(textarea.style.height).toBe('');
    });

    it('높이를 맞춘 뒤 사용자 onChange를 부른다', async () => {
      const seen: string[] = [];
      render(
        <TextField
          label="소개"
          multiline
          autoResize
          onChange={(e) => seen.push(e.target.style.height)}
        />
      );
      const textarea = screen.getByLabelText('소개');
      Object.defineProperty(textarea, 'scrollHeight', {
        configurable: true,
        value: 90,
      });
      await userEvent.type(textarea, 'a');
      expect(seen).toEqual(['90px']);
    });

    it('사용자 style을 받아도 overflow 규칙이 살아 있다', () => {
      render(
        <TextField
          label="소개"
          multiline
          autoResize
          style={{ minHeight: 200 }}
        />
      );
      const textarea = screen.getByLabelText('소개');
      expect(textarea.style.minHeight).toBe('200px');
      expect(textarea.style.overflow).toBe('hidden');
    });
  });

  describe('단일 줄과 같은 라벨, 도움말, 에러, aria 연결', () => {
    it.each([[false], [true]] as const)(
      'multiline=%s: label이 컨트롤과 연결되고 필수 표시가 붙는다',
      (multiline) => {
        renderField(multiline, { required: true });
        expect(screen.getByLabelText(/항목/)).toBeRequired();
        expect(screen.getByText('*')).toBeInTheDocument();
      }
    );

    it.each([[false], [true]] as const)(
      'multiline=%s: error면 aria-invalid=true이고 errorMessage가 aria-describedby에 연결된다',
      (multiline) => {
        renderField(multiline, { error: true, errorMessage: '잘못됐습니다' });
        const control = screen.getByLabelText('항목');
        expect(control).toHaveAttribute('aria-invalid', 'true');
        expect(screen.getByText('잘못됐습니다')).toHaveAttribute(
          'id',
          control.getAttribute('aria-describedby')!
        );
      }
    );

    it.each([[false], [true]] as const)(
      'multiline=%s: error가 아니면 aria-invalid=false이고 helperText가 aria-describedby에 연결된다',
      (multiline) => {
        renderField(multiline, { helperText: '도움말' });
        const control = screen.getByLabelText('항목');
        expect(control).toHaveAttribute('aria-invalid', 'false');
        expect(screen.getByText('도움말')).toHaveAttribute(
          'id',
          control.getAttribute('aria-describedby')!
        );
      }
    );

    it.each([[false], [true]] as const)(
      'multiline=%s: disabled면 비활성이고 aria-disabled=true이다',
      (multiline) => {
        renderField(multiline, { disabled: true });
        const control = screen.getByLabelText('항목');
        expect(control).toBeDisabled();
        expect(control).toHaveAttribute('aria-disabled', 'true');
      }
    );

    it('readOnly를 적용한다', () => {
      render(
        <TextField
          label="공지"
          multiline
          readOnly
          value="x"
          onChange={() => {}}
        />
      );
      expect(screen.getByLabelText('공지')).toHaveAttribute('readonly');
    });

    it('error면 컨트롤에 error 클래스가 붙는다', () => {
      render(<TextField label="항목" multiline error />);
      expect(screen.getByLabelText('항목').className).toContain('error');
    });
  });

  describe('크기와 너비', () => {
    it.each([['sm'], ['md'], ['lg']] as const)(
      'size="%s"를 textarea에 적용한다',
      (size) => {
        render(<TextField label="소개" multiline size={size} />);
        expect(screen.getByLabelText('소개').className).toContain(
          `multilineSize_${size}`
        );
      }
    );

    it('size를 생략하면 md다', () => {
      render(<TextField label="소개" multiline />);
      expect(screen.getByLabelText('소개').className).toContain(
        'multilineSize_md'
      );
    });

    it('fullWidth면 래퍼가 전체 너비를 차지한다', () => {
      render(<TextField label="소개" multiline fullWidth />);
      expect(screen.getByLabelText('소개').parentElement?.className).toContain(
        'fullWidth'
      );
    });

    it('단일 줄 크기 클래스(고정 height)는 textarea에 붙지 않는다', () => {
      render(<TextField label="소개" multiline />);
      expect(screen.getByLabelText('소개').className).not.toMatch(
        /TextField_size_/
      );
    });
  });

  describe('ref와 이벤트', () => {
    it('ref는 HTMLTextAreaElement이다', () => {
      const ref = createRef<HTMLTextAreaElement>();
      render(<TextField label="소개" multiline ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
    });

    it('콜백 ref도 textarea를 받는다', () => {
      let received: HTMLTextAreaElement | null = null;
      render(
        <TextField
          label="소개"
          multiline
          ref={(el) => {
            received = el;
          }}
        />
      );
      expect(received).toBeInstanceOf(HTMLTextAreaElement);
    });

    it('ref로 focus()와 blur()를 부를 수 있다', () => {
      const ref = createRef<HTMLTextAreaElement>();
      render(<TextField label="소개" multiline ref={ref} />);
      ref.current?.focus();
      expect(ref.current).toHaveFocus();
      ref.current?.blur();
      expect(ref.current).not.toHaveFocus();
    });

    it('단일 줄의 ref는 여전히 HTMLInputElement이다', () => {
      const ref = createRef<HTMLInputElement>();
      render(<TextField label="이름" ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });

    it('onChange, onFocus, onBlur를 호출한다', async () => {
      const onChange = vi.fn();
      const onFocus = vi.fn();
      const onBlur = vi.fn();
      render(
        <TextField
          label="소개"
          multiline
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      );
      await userEvent.type(screen.getByLabelText('소개'), 'a');
      await userEvent.tab();
      expect(onChange).toHaveBeenCalled();
      expect(onFocus).toHaveBeenCalledTimes(1);
      expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('Tab으로 단일 줄에서 여러 줄로 넘어간다', async () => {
      render(
        <div>
          <TextField label="이름" />
          <TextField label="소개" multiline />
        </div>
      );
      screen.getByLabelText('이름').focus();
      await userEvent.tab();
      expect(screen.getByLabelText('소개')).toHaveFocus();
    });
  });

  describe('타입 (@ts-expect-error가 잠근다)', () => {
    it('단일 줄에 rows나 autoResize를 줄 수 없고, multiline에 type을 줄 수 없다', () => {
      render(
        <>
          {/* @ts-expect-error rows는 multiline일 때만 받는다 */}
          <TextField label="a" rows={3} />
          {/* @ts-expect-error autoResize는 multiline일 때만 받는다 */}
          <TextField label="b" autoResize />
          {/* @ts-expect-error multiline에는 type이 없다 */}
          <TextField label="c" multiline type="email" />
        </>
      );
    });

    it('기존 단일 줄 ref(객체 ref, 콜백 ref)가 그대로 컴파일된다', () => {
      const objectRef = createRef<HTMLInputElement>();
      let callbackValue: HTMLInputElement | null = null;
      render(
        <>
          <TextField label="a" ref={objectRef} />
          <TextField
            label="b"
            ref={(el) => {
              callbackValue = el;
            }}
          />
          <TextField label="c" type="email" onChange={(e) => e.target.value} />
        </>
      );
      expect(objectRef.current).toBeInstanceOf(HTMLInputElement);
      expect(callbackValue).toBeInstanceOf(HTMLInputElement);
    });

    it('multiline의 ref는 HTMLTextAreaElement이고 input용 ref는 받지 않는다', () => {
      const textareaRef = createRef<HTMLTextAreaElement>();
      const inputRef = createRef<HTMLInputElement>();
      render(
        <>
          <TextField label="a" multiline ref={textareaRef} />
          {/* @ts-expect-error multiline의 ref는 HTMLTextAreaElement다 */}
          <TextField label="b" multiline ref={inputRef} />
        </>
      );
    });
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

  it('multiline의 textarea도 같은 input 클래스를 써서 포커스·호버 규칙을 공유한다', () => {
    render(<TextField label="소개" multiline />);
    expect(screen.getByLabelText('소개').className).toMatch(
      /TextField_input__\w+/
    );
  });

  it('multiline은 resize: none이고 줄 높이가 1.5다', () => {
    const rule = rules().find((r) =>
      new RegExp('^\\.TextField_multiline__\\w+$').test(r.selectorText)
    );
    expect(rule).toBeDefined();
    expect(rule!.style.getPropertyValue('resize')).toBe('none');
    expect(rule!.style.getPropertyValue('line-height')).toBe('1.5');
  });

  it('multiline의 크기별 글자 크기와 좌우 패딩이 단일 줄과 같다 (1rem)', () => {
    const fontSize = { sm: '0.875rem', md: '1rem', lg: '1.125rem' };
    for (const size of ['sm', 'md', 'lg'] as const) {
      const multi = rules().find((r) =>
        new RegExp(`^\\.TextField_multilineSize_${size}__\\w+$`).test(
          r.selectorText
        )
      );
      const single = rules().find((r) =>
        new RegExp(`^\\.TextField_size_${size}__\\w+$`).test(r.selectorText)
      );
      expect(multi?.style.getPropertyValue('font-size')).toBe(fontSize[size]);
      expect(single?.style.getPropertyValue('font-size')).toBe(fontSize[size]);
      expect(multi?.style.getPropertyValue('padding')).toMatch(/ 1rem$/);
    }
  });
});
