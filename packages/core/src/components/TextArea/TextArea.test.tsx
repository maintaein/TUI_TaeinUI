import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import React, { createRef } from 'react';
import { TextArea } from './TextArea';

describe('TextArea', () => {
  describe('렌더링 테스트', () => {
    it('기본 textarea를 렌더링한다', () => {
      render(<TextArea label="설명" />);
      const textarea = screen.getByLabelText('설명');
      expect(textarea).toBeInTheDocument();
      expect(textarea.tagName).toBe('TEXTAREA');
    });

    it('placeholder를 표시한다', () => {
      render(<TextArea label="메모" placeholder="메모를 입력하세요" />);
      const textarea = screen.getByPlaceholderText('메모를 입력하세요');
      expect(textarea).toBeInTheDocument();
    });

    it('value를 표시한다', () => {
      render(<TextArea label="설명" value="테스트 내용" onChange={() => {}} />);
      const textarea = screen.getByDisplayValue('테스트 내용');
      expect(textarea).toBeInTheDocument();
    });

    it('defaultValue를 표시한다', () => {
      render(<TextArea label="설명" defaultValue="기본 내용" />);
      const textarea = screen.getByDisplayValue('기본 내용');
      expect(textarea).toBeInTheDocument();
    });
  });

  describe('autoResize prop 테스트', () => {
    it('autoResize가 false이면 고정 높이로 렌더링된다 (기본값)', () => {
      render(<TextArea label="설명" />);
      const textarea = screen.getByLabelText('설명');
      expect(textarea.style.overflow).toBe('auto');
    });

    it('autoResize가 true이면 자동 높이 조정이 활성화된다', () => {
      render(<TextArea label="설명" autoResize />);
      const textarea = screen.getByLabelText('설명');
      expect(textarea.style.overflow).toBe('hidden');
    });

    it('autoResize가 true일 때 텍스트 입력 시 높이가 조정된다', async () => {
      render(<TextArea label="설명" autoResize />);
      const textarea = screen.getByLabelText('설명') as HTMLTextAreaElement;

      // scrollHeight를 모킹하여 테스트
      Object.defineProperty(textarea, 'scrollHeight', {
        configurable: true,
        value: 200,
      });

      await userEvent.type(
        textarea,
        '첫 줄\n두 번째 줄\n세 번째 줄\n네 번째 줄'
      );

      // autoResize가 활성화되면 scrollHeight에 따라 높이가 설정됨
      expect(textarea.style.height).toBe('200px');
    });
  });

  describe('height prop 테스트', () => {
    it('height를 설정할 수 있다', () => {
      render(<TextArea label="설명" height="200px" />);
      const textarea = screen.getByLabelText('설명');
      expect(textarea.style.minHeight).toBe('200px');
    });

    it('height를 숫자로 설정할 수 있다', () => {
      render(<TextArea label="설명" height={150} />);
      const textarea = screen.getByLabelText('설명');
      expect(textarea.style.minHeight).toBe('150px');
    });

    it('height 기본값은 120px이다', () => {
      render(<TextArea label="설명" />);
      const textarea = screen.getByLabelText('설명');
      expect(textarea.style.minHeight).toBe('120px');
    });
  });

  describe('size prop 테스트', () => {
    it('sm size를 적용한다', () => {
      render(<TextArea label="메모" size="sm" />);
      const container = screen.getByLabelText('메모').parentElement;
      expect(container?.className).toContain('size_sm');
    });

    it('md size를 적용한다 (기본값)', () => {
      render(<TextArea label="메모" />);
      const container = screen.getByLabelText('메모').parentElement;
      expect(container?.className).toContain('size_md');
    });

    it('lg size를 적용한다', () => {
      render(<TextArea label="메모" size="lg" />);
      const container = screen.getByLabelText('메모').parentElement;
      expect(container?.className).toContain('size_lg');
    });
  });

  describe('상태 prop 테스트', () => {
    it('disabled 상태를 적용한다', () => {
      render(<TextArea label="설명" disabled />);
      const textarea = screen.getByLabelText('설명');
      expect(textarea).toBeDisabled();
    });

    it('readOnly 상태를 적용한다', () => {
      render(
        <TextArea label="설명" readOnly value="읽기 전용" onChange={() => {}} />
      );
      const textarea = screen.getByLabelText('설명');
      expect(textarea).toHaveAttribute('readonly');
    });

    it('required 상태를 적용한다', () => {
      render(<TextArea label="설명" required />);
      const textarea = screen.getByRole('textbox', { name: /설명/ });
      expect(textarea).toBeRequired();
    });
  });

  describe('error prop 테스트', () => {
    it('error가 true이면 error 상태를 적용한다', () => {
      render(<TextArea label="설명" error />);
      const container = screen.getByLabelText('설명').parentElement;
      expect(container?.className).toContain('error');
    });

    it('error message를 표시한다', () => {
      render(
        <TextArea label="설명" error errorMessage="필수 입력 항목입니다" />
      );
      expect(screen.getByText('필수 입력 항목입니다')).toBeInTheDocument();
    });

    it('error가 false이면 error message를 표시하지 않는다', () => {
      render(<TextArea label="설명" errorMessage="필수 입력 항목입니다" />);
      expect(
        screen.queryByText('필수 입력 항목입니다')
      ).not.toBeInTheDocument();
    });
  });

  describe('helperText prop 테스트', () => {
    it('helperText를 표시한다', () => {
      render(
        <TextArea label="설명" helperText="최대 500자까지 입력 가능합니다" />
      );
      expect(
        screen.getByText('최대 500자까지 입력 가능합니다')
      ).toBeInTheDocument();
    });

    it('error가 true이면 helperText 대신 errorMessage를 표시한다', () => {
      render(
        <TextArea
          label="설명"
          helperText="최대 500자까지 입력 가능합니다"
          error
          errorMessage="내용이 너무 짧습니다"
        />
      );
      expect(screen.getByText('내용이 너무 짧습니다')).toBeInTheDocument();
      expect(
        screen.queryByText('최대 500자까지 입력 가능합니다')
      ).not.toBeInTheDocument();
    });
  });

  describe('fullWidth prop 테스트', () => {
    it('fullWidth가 true이면 전체 너비를 차지한다', () => {
      render(<TextArea label="설명" fullWidth />);
      const wrapper =
        screen.getByLabelText('설명').parentElement?.parentElement;
      expect(wrapper?.className).toContain('fullWidth');
    });
  });

  describe('이벤트 핸들러 테스트', () => {
    it('onChange 이벤트를 호출한다', async () => {
      const handleChange = vi.fn();
      render(<TextArea label="설명" onChange={handleChange} />);
      const textarea = screen.getByLabelText('설명');

      await userEvent.type(textarea, '테스트');
      expect(handleChange).toHaveBeenCalled();
    });

    it('onFocus 이벤트를 호출한다', () => {
      const handleFocus = vi.fn();
      render(<TextArea label="설명" onFocus={handleFocus} />);
      const textarea = screen.getByLabelText('설명');

      fireEvent.focus(textarea);
      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it('onBlur 이벤트를 호출한다', () => {
      const handleBlur = vi.fn();
      render(<TextArea label="설명" onBlur={handleBlur} />);
      const textarea = screen.getByLabelText('설명');

      fireEvent.focus(textarea);
      fireEvent.blur(textarea);
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });
  });

  describe('ref 전달 테스트 (forwardRef)', () => {
    it('ref를 textarea 요소에 전달한다', () => {
      const ref = createRef<HTMLTextAreaElement>();
      render(<TextArea label="설명" ref={ref} />);

      expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
      expect(ref.current?.tagName).toBe('TEXTAREA');
    });

    it('ref를 통해 focus()를 호출할 수 있다', () => {
      const ref = createRef<HTMLTextAreaElement>();
      render(<TextArea label="설명" ref={ref} />);

      ref.current?.focus();
      expect(ref.current).toHaveFocus();
    });

    it('ref를 통해 blur()를 호출할 수 있다', () => {
      const ref = createRef<HTMLTextAreaElement>();
      render(<TextArea label="설명" ref={ref} />);

      ref.current?.focus();
      expect(ref.current).toHaveFocus();

      ref.current?.blur();
      expect(ref.current).not.toHaveFocus();
    });
  });

  describe('접근성 테스트', () => {
    it('label과 textarea가 올바르게 연결된다', () => {
      render(<TextArea label="설명" />);
      const textarea = screen.getByLabelText('설명');
      expect(textarea).toBeInTheDocument();
    });

    it('required일 때 label에 * 표시가 있다', () => {
      render(<TextArea label="설명" required />);
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('error일 때 aria-invalid가 true이다', () => {
      render(<TextArea label="설명" error />);
      const textarea = screen.getByLabelText('설명');
      expect(textarea).toHaveAttribute('aria-invalid', 'true');
    });

    it('error가 아닐 때 aria-invalid가 false이다', () => {
      render(<TextArea label="설명" />);
      const textarea = screen.getByLabelText('설명');
      expect(textarea).toHaveAttribute('aria-invalid', 'false');
    });

    it('errorMessage가 있을 때 aria-describedby가 설정된다', () => {
      render(
        <TextArea label="설명" error errorMessage="필수 입력 항목입니다" />
      );
      const textarea = screen.getByLabelText('설명');
      const describedBy = textarea.getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();
      expect(screen.getByText('필수 입력 항목입니다')).toHaveAttribute(
        'id',
        describedBy!
      );
    });

    it('helperText가 있을 때 aria-describedby가 설정된다', () => {
      render(
        <TextArea label="설명" helperText="최대 500자까지 입력 가능합니다" />
      );
      const textarea = screen.getByLabelText('설명');
      const describedBy = textarea.getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();
      expect(
        screen.getByText('최대 500자까지 입력 가능합니다')
      ).toHaveAttribute('id', describedBy!);
    });

    it('disabled일 때 aria-disabled가 true이다', () => {
      render(<TextArea label="설명" disabled />);
      const textarea = screen.getByLabelText('설명');
      expect(textarea).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('키보드 인터랙션 테스트', () => {
    it('Tab 키로 포커스를 이동할 수 있다', async () => {
      render(
        <div>
          <TextArea label="설명1" />
          <TextArea label="설명2" />
        </div>
      );

      const textarea1 = screen.getByLabelText('설명1');
      const textarea2 = screen.getByLabelText('설명2');

      textarea1.focus();
      expect(textarea1).toHaveFocus();

      await userEvent.tab();
      expect(textarea2).toHaveFocus();
    });
  });

  describe('엣지 케이스 테스트', () => {
    it('매우 긴 텍스트를 입력할 수 있다', () => {
      render(<TextArea label="설명" />);
      const textarea = screen.getByLabelText('설명');
      const longText = 'a'.repeat(1000);

      fireEvent.change(textarea, { target: { value: longText } });
      expect(textarea).toHaveValue(longText);
    });

    it('value와 onChange가 동시에 제공되면 제어 컴포넌트로 동작한다', () => {
      const ControlledTextArea = () => {
        const [value, setValue] = React.useState('');
        return (
          <TextArea
            label="설명"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        );
      };

      render(<ControlledTextArea />);
      const textarea = screen.getByLabelText('설명');

      fireEvent.change(textarea, { target: { value: 'test content' } });
      expect(textarea).toHaveValue('test content');
    });

    it('줄바꿈이 포함된 텍스트를 입력할 수 있다', () => {
      render(<TextArea label="설명" />);
      const textarea = screen.getByLabelText('설명');
      const multilineText = '첫 번째 줄\n두 번째 줄\n세 번째 줄';

      fireEvent.change(textarea, { target: { value: multilineText } });
      expect(textarea).toHaveValue(multilineText);
    });

    it('autoResize와 height를 함께 사용할 수 있다', () => {
      render(<TextArea label="설명" autoResize height="100px" />);
      const textarea = screen.getByLabelText('설명');
      expect(textarea.style.overflow).toBe('hidden');
      expect(textarea.style.minHeight).toBe('100px');
    });
  });

  describe('미러 오버레이 테스트 (Task 7)', () => {
    it('기본 상태에서는 미러 오버레이가 렌더된다', () => {
      const { container } = render(<TextArea label="설명" />);
      expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
    });

    it('disabled에서는 미러 오버레이가 렌더되지 않는다 (Ruling 49)', () => {
      const { container } = render(<TextArea label="설명" disabled />);
      expect(container.querySelector('[aria-hidden="true"]')).toBeNull();
    });

    it('readOnly에서는 미러 오버레이가 렌더되지 않는다 (Ruling 49)', () => {
      const { container } = render(
        <TextArea label="설명" readOnly value="값" onChange={() => {}} />
      );
      expect(container.querySelector('[aria-hidden="true"]')).toBeNull();
    });
  });
});
