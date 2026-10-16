import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import React, { createRef } from 'react';
import { NumericSpinner } from './NumericSpinner';
import { gsapDuration, gsapEasing } from '../../tokens/gsapEasing';

describe('NumericSpinner', () => {
  describe('렌더링 테스트', () => {
    it('기본 number input을 렌더링한다', () => {
      render(<NumericSpinner label="수량" />);
      const input = screen.getByLabelText('수량');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'number');
    });

    it('증가/감소 버튼을 렌더링한다', () => {
      render(<NumericSpinner label="수량" />);
      const incrementButton = screen.getByRole('button', { name: /증가/i });
      const decrementButton = screen.getByRole('button', { name: /감소/i });
      expect(incrementButton).toBeInTheDocument();
      expect(decrementButton).toBeInTheDocument();
    });

    it('label을 렌더링한다', () => {
      render(<NumericSpinner label="수량" />);
      const label = screen.getByText('수량');
      expect(label).toBeInTheDocument();
    });

    it('placeholder를 표시한다', () => {
      render(<NumericSpinner label="수량" placeholder="숫자를 입력하세요" />);
      const input = screen.getByPlaceholderText('숫자를 입력하세요');
      expect(input).toBeInTheDocument();
    });

    it('value를 표시한다', () => {
      render(<NumericSpinner label="수량" value={10} onChange={() => {}} />);
      const input = screen.getByLabelText('수량');
      expect(input).toHaveValue(10);
    });

    it('defaultValue를 표시한다', () => {
      render(<NumericSpinner label="수량" defaultValue={5} />);
      const input = screen.getByLabelText('수량');
      expect(input).toHaveValue(5);
    });
  });

  describe('size prop 테스트', () => {
    it('sm size를 적용한다', () => {
      render(<NumericSpinner label="수량" size="sm" />);
      const container =
        screen.getByLabelText('수량').parentElement?.parentElement;
      expect(container?.className).toContain('size_sm');
    });

    it('md size를 적용한다 (기본값)', () => {
      render(<NumericSpinner label="수량" />);
      const container =
        screen.getByLabelText('수량').parentElement?.parentElement;
      expect(container?.className).toContain('size_md');
    });

    it('lg size를 적용한다', () => {
      render(<NumericSpinner label="수량" size="lg" />);
      const container =
        screen.getByLabelText('수량').parentElement?.parentElement;
      expect(container?.className).toContain('size_lg');
    });
  });

  describe('증가/감소 버튼 동작 테스트', () => {
    it('증가 버튼 클릭 시 값이 1 증가한다', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<NumericSpinner label="수량" value={5} onChange={handleChange} />);

      const incrementButton = screen.getByRole('button', { name: /증가/i });
      await user.click(incrementButton);

      expect(handleChange).toHaveBeenCalledTimes(1);
    });

    it('감소 버튼 클릭 시 값이 1 감소한다', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<NumericSpinner label="수량" value={5} onChange={handleChange} />);

      const decrementButton = screen.getByRole('button', { name: /감소/i });
      await user.click(decrementButton);

      expect(handleChange).toHaveBeenCalledTimes(1);
    });

    it('step prop에 따라 증가량이 변경된다', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(
        <NumericSpinner
          label="수량"
          value={0}
          step={5}
          onChange={handleChange}
        />
      );

      const incrementButton = screen.getByRole('button', { name: /증가/i });
      await user.click(incrementButton);

      expect(handleChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('min/max 제약 테스트', () => {
    it('min 값보다 작아지지 않는다', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(
        <NumericSpinner
          label="수량"
          value={0}
          min={0}
          onChange={handleChange}
        />
      );

      const decrementButton = screen.getByRole('button', { name: /감소/i });
      await user.click(decrementButton);

      expect(handleChange).not.toHaveBeenCalled();
    });

    it('max 값보다 커지지 않는다', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(
        <NumericSpinner
          label="수량"
          value={10}
          max={10}
          onChange={handleChange}
        />
      );

      const incrementButton = screen.getByRole('button', { name: /증가/i });
      await user.click(incrementButton);

      expect(handleChange).not.toHaveBeenCalled();
    });

    it('min에 도달하면 감소 버튼이 비활성화된다', () => {
      render(
        <NumericSpinner label="수량" value={0} min={0} onChange={() => {}} />
      );

      const decrementButton = screen.getByRole('button', { name: /감소/i });
      expect(decrementButton).toBeDisabled();
    });

    it('max에 도달하면 증가 버튼이 비활성화된다', () => {
      render(
        <NumericSpinner label="수량" value={10} max={10} onChange={() => {}} />
      );

      const incrementButton = screen.getByRole('button', { name: /증가/i });
      expect(incrementButton).toBeDisabled();
    });
  });

  describe('상태 prop 테스트', () => {
    it('disabled 상태를 적용한다', () => {
      render(<NumericSpinner label="수량" disabled />);
      const input = screen.getByLabelText('수량');
      const incrementButton = screen.getByRole('button', { name: /증가/i });
      const decrementButton = screen.getByRole('button', { name: /감소/i });

      expect(input).toBeDisabled();
      expect(incrementButton).toBeDisabled();
      expect(decrementButton).toBeDisabled();
    });

    it('input은 읽기 전용이 아니다(직접 입력을 연다)', () => {
      render(<NumericSpinner label="수량" />);
      const input = screen.getByLabelText('수량');

      expect(input).not.toHaveAttribute('readonly');
    });

    it('required 상태를 적용한다', () => {
      render(<NumericSpinner label="수량" required />);
      const input = screen.getByLabelText(/수량/);
      const requiredMark = screen.getByText('*');

      expect(input).toBeRequired();
      expect(requiredMark).toBeInTheDocument();
    });

    it('error 상태를 적용한다', () => {
      render(<NumericSpinner label="수량" error />);
      const input = screen.getByLabelText('수량');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('errorMessage를 표시한다', () => {
      render(
        <NumericSpinner
          label="수량"
          error
          errorMessage="1 이상의 값을 입력하세요"
        />
      );
      const errorMsg = screen.getByText('1 이상의 값을 입력하세요');
      expect(errorMsg).toBeInTheDocument();
      expect(errorMsg.className).toContain('errorMessage');
    });

    it('helperText를 표시한다', () => {
      render(
        <NumericSpinner label="수량" helperText="최소 1개 이상 입력하세요" />
      );
      const helper = screen.getByText('최소 1개 이상 입력하세요');
      expect(helper).toBeInTheDocument();
      expect(helper.className).toContain('helperText');
    });

    it('error가 true이면 helperText 대신 errorMessage를 표시한다', () => {
      render(
        <NumericSpinner
          label="수량"
          error
          errorMessage="에러 메시지"
          helperText="도움말 텍스트"
        />
      );
      const errorMsg = screen.getByText('에러 메시지');
      const helper = screen.queryByText('도움말 텍스트');

      expect(errorMsg).toBeInTheDocument();
      expect(helper).not.toBeInTheDocument();
    });
  });

  describe('fullWidth prop 테스트', () => {
    it('fullWidth가 true이면 전체 너비를 사용한다', () => {
      render(<NumericSpinner label="수량" fullWidth />);
      const wrapper =
        screen.getByLabelText('수량').parentElement?.parentElement
          ?.parentElement;
      expect(wrapper?.className).toContain('fullWidth');
    });

    it('fullWidth가 false이면 기본 너비를 사용한다', () => {
      render(<NumericSpinner label="수량" />);
      const wrapper =
        screen.getByLabelText('수량').parentElement?.parentElement
          ?.parentElement;
      expect(wrapper?.className).not.toContain('fullWidth');
    });
  });

  describe('이벤트 핸들러 테스트', () => {
    it('버튼 클릭 시 onChange 이벤트가 호출된다', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<NumericSpinner label="수량" value={5} onChange={handleChange} />);

      const incrementButton = screen.getByRole('button', { name: /증가/i });
      await user.click(incrementButton);

      expect(handleChange).toHaveBeenCalled();
    });

    it('onFocus 이벤트가 호출된다', async () => {
      const user = userEvent.setup();
      const handleFocus = vi.fn();
      render(<NumericSpinner label="수량" onFocus={handleFocus} />);

      const input = screen.getByLabelText('수량');
      await user.click(input);

      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it('onBlur 이벤트가 호출된다', async () => {
      const user = userEvent.setup();
      const handleBlur = vi.fn();
      render(<NumericSpinner label="수량" onBlur={handleBlur} />);

      const input = screen.getByLabelText('수량');
      await user.click(input);
      await user.tab();

      expect(handleBlur).toHaveBeenCalledTimes(1);
    });
  });

  describe('접근성 테스트', () => {
    it('label과 input이 올바르게 연결된다', () => {
      render(<NumericSpinner label="수량" />);
      const input = screen.getByLabelText('수량');
      expect(input).toBeInTheDocument();
    });

    it('aria-invalid가 error 상태에 따라 설정된다', () => {
      const { rerender } = render(<NumericSpinner label="수량" />);
      const input = screen.getByLabelText('수량');
      expect(input).toHaveAttribute('aria-invalid', 'false');

      rerender(<NumericSpinner label="수량" error />);
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('aria-describedby가 helperText에 연결된다', () => {
      render(<NumericSpinner label="수량" helperText="도움말" />);
      const input = screen.getByLabelText('수량');
      const helper = screen.getByText('도움말');

      expect(input).toHaveAttribute('aria-describedby');
      expect(helper).toHaveAttribute(
        'id',
        input.getAttribute('aria-describedby')!
      );
    });

    it('aria-describedby가 errorMessage에 연결된다', () => {
      render(<NumericSpinner label="수량" error errorMessage="에러" />);
      const input = screen.getByLabelText('수량');
      const errorMsg = screen.getByText('에러');

      expect(input).toHaveAttribute('aria-describedby');
      expect(errorMsg).toHaveAttribute(
        'id',
        input.getAttribute('aria-describedby')!
      );
    });

    it('aria-disabled가 disabled 상태에 따라 설정된다', () => {
      const { rerender } = render(<NumericSpinner label="수량" />);
      const input = screen.getByLabelText('수량');
      expect(input).toHaveAttribute('aria-disabled', 'false');

      rerender(<NumericSpinner label="수량" disabled />);
      expect(input).toHaveAttribute('aria-disabled', 'true');
    });

    it('증가/감소 버튼에 aria-label이 있다', () => {
      render(<NumericSpinner label="수량" />);
      const incrementButton = screen.getByRole('button', { name: /증가/i });
      const decrementButton = screen.getByRole('button', { name: /감소/i });

      expect(incrementButton).toHaveAccessibleName();
      expect(decrementButton).toHaveAccessibleName();
    });
  });

  describe('키보드 인터랙션 테스트', () => {
    it('Tab 키로 첫 번째 버튼에 포커스할 수 있다', async () => {
      const user = userEvent.setup();
      render(<NumericSpinner label="수량" />);

      await user.tab();
      const decrementButton = screen.getByRole('button', { name: /감소/i });
      expect(decrementButton).toHaveFocus();
    });

    it('Tab 키로 input에 포커스할 수 있다', async () => {
      const user = userEvent.setup();
      render(<NumericSpinner label="수량" />);

      await user.tab();
      await user.tab();
      const input = screen.getByLabelText('수량');
      expect(input).toHaveFocus();
    });

    it('disabled 상태에서는 버튼이 비활성화된다', () => {
      render(<NumericSpinner label="수량" disabled />);

      const input = screen.getByLabelText('수량');
      const incrementButton = screen.getByRole('button', { name: /증가/i });

      expect(input).toBeDisabled();
      expect(incrementButton).toBeDisabled();
    });
  });

  describe('forwardRef 테스트', () => {
    it('ref를 input 요소에 전달한다', () => {
      const ref = createRef<HTMLInputElement>();
      render(<NumericSpinner label="수량" ref={ref} />);

      expect(ref.current).toBeInstanceOf(HTMLInputElement);
      expect(ref.current?.tagName).toBe('INPUT');
    });

    it('ref를 통해 focus() 메서드를 호출할 수 있다', () => {
      const ref = createRef<HTMLInputElement>();
      render(<NumericSpinner label="수량" ref={ref} />);

      ref.current?.focus();
      expect(ref.current).toHaveFocus();
    });

    it('ref를 통해 blur() 메서드를 호출할 수 있다', () => {
      const ref = createRef<HTMLInputElement>();
      render(<NumericSpinner label="수량" ref={ref} />);

      ref.current?.focus();
      expect(ref.current).toHaveFocus();

      ref.current?.blur();
      expect(ref.current).not.toHaveFocus();
    });
  });

  describe('비제어 모드 (Uncontrolled Mode) 테스트', () => {
    it('defaultValue로 초기값을 설정한다', () => {
      render(<NumericSpinner label="수량" defaultValue={5} />);
      const input = screen.getByLabelText('수량');
      expect(input).toHaveValue(5);
    });

    it('defaultValue 없으면 0으로 시작한다', () => {
      render(<NumericSpinner label="수량" />);
      const input = screen.getByLabelText('수량');
      expect(input).toHaveValue(0);
    });

    it('증가 버튼 클릭 시 내부 상태가 업데이트된다', () => {
      render(<NumericSpinner label="수량" defaultValue={1} step={1} />);

      const input = screen.getByLabelText('수량');
      const incrementButton = screen.getByRole('button', { name: /증가/i });

      expect(input).toHaveValue(1);
      fireEvent.click(incrementButton);
      expect(input).toHaveValue(2);

      fireEvent.click(incrementButton);
      expect(input).toHaveValue(3);
    });

    it('감소 버튼 클릭 시 내부 상태가 업데이트된다', () => {
      render(<NumericSpinner label="수량" defaultValue={5} step={1} />);

      const input = screen.getByLabelText('수량');
      const decrementButton = screen.getByRole('button', { name: /감소/i });

      expect(input).toHaveValue(5);
      fireEvent.click(decrementButton);
      expect(input).toHaveValue(4);
    });

    it('min/max 제약을 준수한다', () => {
      render(<NumericSpinner label="수량" defaultValue={5} min={1} max={10} />);

      const input = screen.getByLabelText('수량');
      const incrementButton = screen.getByRole('button', { name: /증가/i });
      const decrementButton = screen.getByRole('button', { name: /감소/i });

      // max 초과 불가
      fireEvent.click(incrementButton); // 6
      fireEvent.click(incrementButton); // 7
      fireEvent.click(incrementButton); // 8
      fireEvent.click(incrementButton); // 9
      fireEvent.click(incrementButton); // 10
      fireEvent.click(incrementButton); // 10 (변하지 않음)
      expect(input).toHaveValue(10);

      // min 이하로 감소 불가
      for (let i = 0; i < 15; i++) {
        fireEvent.click(decrementButton);
      }
      expect(input).toHaveValue(1);
    });

    it('onChange 콜백을 호출한다', () => {
      const handleChange = vi.fn();
      render(
        <NumericSpinner label="수량" defaultValue={1} onChange={handleChange} />
      );

      const incrementButton = screen.getByRole('button', { name: /증가/i });
      fireEvent.click(incrementButton);

      expect(handleChange).toHaveBeenCalledTimes(1);
      expect(handleChange).toHaveBeenCalledWith(2);
    });
  });

  describe('제어 모드 (Controlled Mode) 테스트', () => {
    it('value prop으로 값을 제어한다', () => {
      const { rerender } = render(
        <NumericSpinner label="수량" value={5} onChange={vi.fn()} />
      );
      const input = screen.getByLabelText('수량');
      expect(input).toHaveValue(5);

      rerender(<NumericSpinner label="수량" value={10} onChange={vi.fn()} />);
      expect(input).toHaveValue(10);
    });

    it('버튼 클릭 시 onChange를 호출하지만 내부 상태는 변하지 않는다', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<NumericSpinner label="수량" value={5} onChange={handleChange} />);

      const input = screen.getByLabelText('수량');
      const incrementButton = screen.getByRole('button', { name: /증가/i });

      await user.click(incrementButton);

      expect(handleChange).toHaveBeenCalledTimes(1);
      expect(input).toHaveValue(5); // 부모가 업데이트하지 않으면 변하지 않음
    });
  });

  describe('개발 환경 경고 테스트', () => {
    it('value와 defaultValue 동시 사용 시 경고한다', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const consoleWarn = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => {});

      render(
        <NumericSpinner
          label="수량"
          value={5}
          defaultValue={3}
          onChange={vi.fn()}
        />
      );

      expect(consoleWarn).toHaveBeenCalledWith(
        expect.stringContaining(
          'value와 defaultValue를 동시에 사용할 수 없습니다'
        )
      );

      consoleWarn.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('엣지 케이스 테스트', () => {
    it('label이 없으면 개발 환경에서 경고를 출력한다', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      // @ts-expect-error - label prop 누락 테스트
      render(<NumericSpinner />);

      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining('NumericSpinner: label prop은 필수입니다')
      );

      consoleError.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });

    it('빈 문자열 value를 처리할 수 있다', () => {
      render(
        <NumericSpinner
          label="수량"
          value={'' as unknown as number}
          onChange={() => {}}
        />
      );
      const input = screen.getByLabelText('수량');
      // Number('')는 0이 되므로 0이 표시됨
      expect(input).toHaveValue(0);
    });

    it('value와 onChange가 동시에 제공되면 제어 컴포넌트로 동작한다', () => {
      const ControlledSpinner = () => {
        const [value, setValue] = React.useState(0);
        return (
          <NumericSpinner label="수량" value={value} onChange={setValue} />
        );
      };

      render(<ControlledSpinner />);
      const input = screen.getByLabelText('수량');
      const incrementButton = screen.getByRole('button', { name: /증가/i });

      expect(input).toHaveValue(0);

      fireEvent.click(incrementButton);
      expect(input).toHaveValue(1);
    });
  });

  describe('직접 입력과 화살표 키 (M5 task-29)', () => {
    const setup = (
      props: Partial<React.ComponentProps<typeof NumericSpinner>> = {}
    ) => {
      const onChange = vi.fn();
      render(
        <NumericSpinner
          label="수량"
          defaultValue={5}
          min={0}
          max={10}
          onChange={onChange}
          {...props}
        />
      );
      return {
        onChange,
        input: screen.getByLabelText('수량') as HTMLInputElement,
      };
    };

    it('지우고 15를 치는 동안은 onChange가 안 불리고, blur 때 15로 확정한다', async () => {
      const user = userEvent.setup();
      const { onChange, input } = setup({ max: 100 });

      await user.clear(input);
      await user.type(input, '15');
      expect(input).toHaveValue(15);
      expect(onChange).not.toHaveBeenCalled();

      await user.tab();
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(15);
    });

    it('입력 중에는 범위 밖 숫자와 빈칸을 그대로 둔다', async () => {
      const user = userEvent.setup();
      const { onChange, input } = setup();

      await user.clear(input);
      expect(input).toHaveValue(null);
      await user.type(input, '999');
      expect(input).toHaveValue(999);
      expect(onChange).not.toHaveBeenCalled();
    });

    it('999는 max로 자른다', async () => {
      const user = userEvent.setup();
      const { onChange, input } = setup();

      await user.clear(input);
      await user.type(input, '999');
      await user.tab();

      expect(onChange).toHaveBeenCalledWith(10);
      expect(input).toHaveValue(10);
    });

    it('-5는 min으로 자른다', async () => {
      const user = userEvent.setup();
      const { onChange, input } = setup();

      await user.clear(input);
      await user.type(input, '-5');
      await user.tab();

      expect(onChange).toHaveBeenCalledWith(0);
      expect(input).toHaveValue(0);
    });

    it('빈칸으로 blur하면 직전 값으로 돌아오고 onChange는 안 불린다', async () => {
      const user = userEvent.setup();
      const { onChange, input } = setup();

      await user.clear(input);
      await user.tab();

      expect(input).toHaveValue(5);
      expect(onChange).not.toHaveBeenCalled();
    });

    it('숫자가 아닌 글자는 입력되지 않아 blur 때 직전 값으로 돌아온다', async () => {
      const user = userEvent.setup();
      const { onChange, input } = setup();

      await user.clear(input);
      await user.type(input, 'abc');
      await user.tab();

      expect(input).toHaveValue(5);
      expect(onChange).not.toHaveBeenCalled();
    });

    it('Enter도 확정한다', async () => {
      const user = userEvent.setup();
      const { onChange, input } = setup();

      await user.clear(input);
      await user.type(input, '7{Enter}');

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(7);
    });

    it('확정한 값이 직전 값과 같으면 onChange를 부르지 않는다', async () => {
      const user = userEvent.setup();
      const { onChange, input } = setup();

      await user.clear(input);
      await user.type(input, '5');
      await user.tab();

      expect(onChange).not.toHaveBeenCalled();
    });

    it('확정 뒤에도 사용자 onBlur는 불린다', async () => {
      const user = userEvent.setup();
      const onBlur = vi.fn();
      const { input } = setup({ onBlur });

      await user.click(input);
      await user.tab();

      expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('사용자 onKeyDown도 화살표 키 처리와 함께 불린다', async () => {
      const user = userEvent.setup();
      const onKeyDown = vi.fn();
      const { input } = setup({ onKeyDown });

      await user.click(input);
      await user.keyboard('{ArrowUp}');

      expect(onKeyDown).toHaveBeenCalledTimes(1);
      expect(input).toHaveValue(6);
    });

    it('위 화살표는 step만큼 올리고 아래 화살표는 step만큼 내린다', async () => {
      const user = userEvent.setup();
      const { onChange, input } = setup({ step: 2 });

      await user.click(input);
      await user.keyboard('{ArrowUp}');
      expect(input).toHaveValue(7);
      expect(onChange).toHaveBeenLastCalledWith(7);

      await user.keyboard('{ArrowDown}{ArrowDown}');
      expect(input).toHaveValue(3);
      expect(onChange).toHaveBeenLastCalledWith(3);
      expect(onChange).toHaveBeenCalledTimes(3);
    });

    it('화살표 키는 경계에서 자르고, 이미 경계면 onChange를 부르지 않는다', async () => {
      const user = userEvent.setup();
      const { onChange, input } = setup({ defaultValue: 9, step: 5 });

      await user.click(input);
      await user.keyboard('{ArrowUp}');
      expect(input).toHaveValue(10);
      expect(onChange).toHaveBeenCalledTimes(1);

      await user.keyboard('{ArrowUp}');
      expect(input).toHaveValue(10);
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('입력 중에 화살표를 누르면 친 글자를 기준으로 증감한다', async () => {
      const user = userEvent.setup();
      const { onChange, input } = setup();

      await user.clear(input);
      await user.type(input, '8{ArrowUp}');

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(9);
      expect(input).toHaveValue(9);
    });

    it('disabled면 화살표 키가 값을 바꾸지 못한다', () => {
      const { onChange, input } = setup({ disabled: true });

      fireEvent.keyDown(input, { key: 'ArrowUp' });

      expect(onChange).not.toHaveBeenCalled();
      expect(input).toHaveValue(5);
    });

    it('소수 step 0.1로 세 번 올리면 0.3이다(부동소수 오차 없음)', () => {
      const { onChange, input } = setup({
        defaultValue: 0,
        step: 0.1,
        min: undefined,
        max: undefined,
      });
      const up = screen.getByRole('button', { name: '값 증가' });

      fireEvent.click(up);
      fireEvent.click(up);
      fireEvent.click(up);

      expect(onChange).toHaveBeenLastCalledWith(0.3);
      expect(input).toHaveValue(0.3);
    });

    it('소수 step으로 내릴 때도 오차가 없다', () => {
      const { onChange } = setup({
        defaultValue: 0.3,
        step: 0.1,
        min: undefined,
        max: undefined,
      });
      const down = screen.getByRole('button', { name: '값 감소' });

      fireEvent.click(down);
      fireEvent.click(down);
      fireEvent.click(down);

      expect(onChange).toHaveBeenLastCalledWith(0);
    });

    it('제어 모드: 입력 중이 아니면 부모 value 변경이 칸에 반영된다', () => {
      const onChange = vi.fn();
      const { rerender } = render(
        <NumericSpinner label="수량" value={5} onChange={onChange} />
      );
      rerender(<NumericSpinner label="수량" value={9} onChange={onChange} />);

      expect(screen.getByLabelText('수량')).toHaveValue(9);
    });

    it('제어 모드: 입력 중에 부모 value가 바뀌어도 친 글자를 덮지 않는다', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const { rerender } = render(
        <NumericSpinner label="수량" value={5} onChange={onChange} />
      );
      const input = screen.getByLabelText('수량');

      await user.clear(input);
      await user.type(input, '42');
      rerender(<NumericSpinner label="수량" value={9} onChange={onChange} />);
      expect(input).toHaveValue(42);

      await user.tab();
      expect(onChange).toHaveBeenCalledWith(42);
      expect(input).toHaveValue(9); // 부모가 안 바꿨으니 부모 값으로 돌아온다
    });

    it('입력 중에 버튼을 누르면 친 글자를 먼저 확정하고 그 값에서 증감한다', async () => {
      const user = userEvent.setup();
      const { onChange, input } = setup();

      await user.clear(input);
      await user.type(input, '8');
      await user.click(screen.getByRole('button', { name: '값 증가' }));

      expect(onChange).toHaveBeenNthCalledWith(1, 8);
      expect(onChange).toHaveBeenNthCalledWith(2, 9);
      expect(input).toHaveValue(9);
    });

    it('포커스 이동 없이 버튼 클릭만 와도 친 글자에서 증감한다', async () => {
      const user = userEvent.setup();
      const { onChange, input } = setup();

      await user.clear(input);
      await user.type(input, '8');
      fireEvent.click(screen.getByRole('button', { name: '값 증가' }));

      expect(onChange).toHaveBeenLastCalledWith(9);
      expect(input).toHaveValue(9);
    });

    it('값이 max일 때 3을 입력 중이면 증가 버튼이 켜져 있고 누르면 4가 된다', () => {
      const { onChange, input } = setup({ defaultValue: 10 });
      const up = screen.getByRole('button', { name: '값 증가' });
      expect(up).toBeDisabled();

      fireEvent.change(input, { target: { value: '3' } });
      expect(up).toBeEnabled();

      fireEvent.click(up);
      expect(onChange).toHaveBeenLastCalledWith(4);
      expect(input).toHaveValue(4);
    });

    it('값이 5일 때 max인 10을 입력 중이면 증가 버튼이 꺼진다', () => {
      const { input } = setup();
      const up = screen.getByRole('button', { name: '값 증가' });
      expect(up).toBeEnabled();

      fireEvent.change(input, { target: { value: '10' } });
      expect(up).toBeDisabled();
    });

    it('값이 min일 때 7을 입력 중이면 감소 버튼이 켜진다', () => {
      const { input } = setup({ defaultValue: 0 });
      const down = screen.getByRole('button', { name: '값 감소' });
      expect(down).toBeDisabled();

      fireEvent.change(input, { target: { value: '7' } });
      expect(down).toBeEnabled();
    });

    it('입력 중에 disabled가 켜졌다 꺼지면 친 글자를 버리고 부모 값을 보여 준다', () => {
      const onChange = vi.fn();
      const { rerender } = render(
        <NumericSpinner label="수량" value={7} onChange={onChange} />
      );
      const input = screen.getByLabelText('수량');

      fireEvent.change(input, { target: { value: '42' } });
      expect(input).toHaveValue(42);

      rerender(
        <NumericSpinner label="수량" value={7} onChange={onChange} disabled />
      );
      rerender(<NumericSpinner label="수량" value={7} onChange={onChange} />);

      expect(input).toHaveValue(7);
      expect(onChange).not.toHaveBeenCalled();
    });

    it('step 격자 밖 값에서는 step과 지금 값 중 긴 소수 자릿수로 반올림한다', () => {
      const first = setup({
        defaultValue: 0.25,
        step: 0.1,
        min: undefined,
        max: undefined,
      });
      fireEvent.click(screen.getByRole('button', { name: '값 증가' }));
      expect(first.onChange).toHaveBeenLastCalledWith(0.35);
    });

    it('직접 입력한 1.234에서 위 화살표는 step 1을 더해 2.234가 된다', () => {
      const { onChange, input } = setup({
        defaultValue: 0,
        min: undefined,
        max: undefined,
      });

      fireEvent.change(input, { target: { value: '1.234' } });
      fireEvent.keyDown(input, { key: 'ArrowUp' });

      expect(onChange).toHaveBeenLastCalledWith(2.234);
    });

    it('소수 step 0.1을 세 번 올려도 0.3 그대로다(자릿수 확장이 오차를 키우지 않는다)', () => {
      const { onChange } = setup({
        defaultValue: 0,
        step: 0.1,
        min: undefined,
        max: undefined,
      });
      const up = screen.getByRole('button', { name: '값 증가' });

      fireEvent.click(up);
      fireEvent.click(up);
      fireEvent.click(up);

      expect(onChange).toHaveBeenLastCalledWith(0.3);
    });

    it('화살표 키는 기본 동작을 막는다(네이티브 증감과 겹치지 않는다)', () => {
      const { input } = setup();

      expect(fireEvent.keyDown(input, { key: 'ArrowUp' })).toBe(false);
      expect(fireEvent.keyDown(input, { key: 'ArrowDown' })).toBe(false);
    });

    it('소비자 onKeyDown이 preventDefault하면 화살표 증감을 하지 않는다', () => {
      const { onChange, input } = setup({
        onKeyDown: (e) => e.preventDefault(),
      });

      fireEvent.keyDown(input, { key: 'ArrowUp' });

      expect(onChange).not.toHaveBeenCalled();
      expect(input).toHaveValue(5);
    });

    it('소비자 onKeyDown이 preventDefault하면 Enter 확정도 하지 않는다', () => {
      const { onChange, input } = setup({
        onKeyDown: (e) => e.preventDefault(),
      });

      fireEvent.change(input, { target: { value: '8' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onChange).not.toHaveBeenCalled();
    });

    it('IME 조합 중의 Enter는 확정하지 않고, 조합이 끝난 Enter는 확정한다', () => {
      const { onChange, input } = setup();

      fireEvent.change(input, { target: { value: '8' } });
      fireEvent.keyDown(input, { key: 'Enter', isComposing: true });
      expect(onChange).not.toHaveBeenCalled();

      fireEvent.keyDown(input, { key: 'Enter' });
      expect(onChange).toHaveBeenCalledWith(8);
    });

    it('inputWidth prop은 없고 style로 너비를 준다', () => {
      render(
        // @ts-expect-error - inputWidth는 삭제됐다
        <NumericSpinner label="수량" inputWidth="60px" />
      );
      expect(screen.getByLabelText('수량').style.width).toBe('');

      render(<NumericSpinner label="너비" style={{ width: '60px' }} />);
      expect(screen.getByLabelText('너비').style.width).toBe('60px');
    });
  });

  describe('길게 누르기 반복·가속 (M3 T3d)', () => {
    // NumericSpinner.tsx의 모듈 내부 상수(공개 export 아님)와 값을 맞춘다.
    const REPEAT_RAMP_MS = 1200;
    const NUDGE_PX = 4;

    type PressTweenHost = HTMLElement & {
      __pressTween?: gsap.core.Tween | gsap.core.Timeline;
    };
    type InputNudgeHost = HTMLElement & {
      __nudgeTween?: gsap.core.Tween;
    };

    const readScale = (el: HTMLElement): number => {
      const match = el.style.transform.match(/scale\(([-\d.]+)/);
      return match ? Number(match[1]) : 1;
    };
    // translate(3d)?(x, y[, z]) 중 두 번째 성분(y)을 읽는다.
    const readY = (el: HTMLElement): number => {
      const match = el.style.transform.match(
        /translate(?:3d)?\([^,]+,\s*([-\d.]+)/
      );
      return match ? Number(match[1]) : 0;
    };

    /** pointerdown → pointerup → click까지 즉시 이어지는, 400ms 안의 짧은 탭. */
    const tap = (button: HTMLElement): void => {
      fireEvent.pointerDown(button);
      fireEvent.pointerUp(button);
      fireEvent.click(button);
    };

    beforeEach(() => {
      vi.useFakeTimers();
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it('400ms 안에 떼면 반복 없이 한 걸음만 간다', () => {
      render(<NumericSpinner label="수량" defaultValue={0} />);
      const incrementButton = screen.getByRole('button', { name: '값 증가' });
      const input = screen.getByLabelText('수량');

      act(() => {
        tap(incrementButton);
      });

      expect(input).toHaveValue(1);
    });

    it('400ms를 채우면 반복이 시작되고, 뒤이은 클릭은 더 늘리지 않는다', () => {
      render(<NumericSpinner label="수량" defaultValue={0} />);
      const incrementButton = screen.getByRole('button', { name: '값 증가' });
      const input = screen.getByLabelText('수량');

      fireEvent.pointerDown(incrementButton);
      act(() => {
        vi.advanceTimersByTime(400); // 첫 반복 tick
      });
      expect(input).toHaveValue(1);

      act(() => {
        vi.advanceTimersByTime(160); // 두 번째 tick(시작 시 간격은 정확히 160ms)
      });
      expect(input).toHaveValue(2);

      fireEvent.pointerUp(incrementButton);
      fireEvent.click(incrementButton); // 네이티브 click은 반복이 이미 한 몫을 했으니 씹혀야 한다

      expect(input).toHaveValue(2);
    });

    it('길게 누를수록 반복 간격이 좁아져 같은 시간에 더 많이 증가한다', () => {
      render(<NumericSpinner label="수량" defaultValue={0} />);
      const incrementButton = screen.getByRole('button', { name: '값 증가' });
      const input = screen.getByLabelText('수량') as HTMLInputElement;

      fireEvent.pointerDown(incrementButton);
      act(() => {
        vi.advanceTimersByTime(400); // 반복 시작
      });
      const valueRightAfterStart = Number(input.value);

      act(() => {
        vi.advanceTimersByTime(400); // 막 시작한 직후 400ms(간격 넓음)
      });
      const countEarly = Number(input.value) - valueRightAfterStart;

      act(() => {
        vi.advanceTimersByTime(2000); // 가속이 바닥까지 다 붙을 시간
      });
      const valueBeforeLateWindow = Number(input.value);

      act(() => {
        vi.advanceTimersByTime(400); // 가속이 다 붙은 뒤 같은 400ms(간격 좁음)
      });
      const countLate = Number(input.value) - valueBeforeLateWindow;

      expect(countLate).toBeGreaterThan(countEarly);

      fireEvent.pointerUp(incrementButton);
    });

    it('최댓값에 닿으면 반복이 스스로 멈춘다 (위험 5-나: disabled 전환)', () => {
      render(
        <NumericSpinner label="수량" defaultValue={8} max={10} step={1} />
      );
      const incrementButton = screen.getByRole('button', { name: '값 증가' });
      const input = screen.getByLabelText('수량');

      fireEvent.pointerDown(incrementButton);
      act(() => {
        vi.advanceTimersByTime(400); // tick1: 8 -> 9
      });
      expect(input).toHaveValue(9);

      act(() => {
        vi.advanceTimersByTime(160); // tick2: 9 -> 10(최댓값, 버튼 disabled 전환)
      });
      expect(input).toHaveValue(10);

      act(() => {
        vi.advanceTimersByTime(10000); // 다음 tick은 스스로 멈춰야 한다
      });
      expect(input).toHaveValue(10);
    });

    it(
      '제어 모드에서 부모가 값을 갱신하지 않으면 두 번째 tick에서 스스로 ' +
        '멈춘다 (위험 5-가)',
      () => {
        const onChange = vi.fn();
        render(<NumericSpinner label="수량" value={5} onChange={onChange} />);
        const incrementButton = screen.getByRole('button', {
          name: '값 증가',
        });

        fireEvent.pointerDown(incrementButton);
        act(() => {
          vi.advanceTimersByTime(400); // tick1: 값이 안 바뀌어도 최초 1회는 부른다
        });
        expect(onChange).toHaveBeenCalledTimes(1);

        act(() => {
          vi.advanceTimersByTime(1000); // tick2 이후로는 값이 그대로라 스스로 멈춘다
        });
        expect(onChange).toHaveBeenCalledTimes(1);

        fireEvent.pointerUp(incrementButton);
      }
    );

    it('누르는 도중 disabled가 되면 반복이 스스로 멈춘다 (위험 5-나)', () => {
      const Wrapper = (): React.JSX.Element => {
        const [disabled, setDisabled] = React.useState(false);
        return (
          <>
            <NumericSpinner label="수량" defaultValue={0} disabled={disabled} />
            <button type="button" onClick={() => setDisabled(true)}>
              끄기
            </button>
          </>
        );
      };
      render(<Wrapper />);
      const incrementButton = screen.getByRole('button', { name: '값 증가' });
      const input = screen.getByLabelText('수량');

      fireEvent.pointerDown(incrementButton);
      act(() => {
        vi.advanceTimersByTime(400); // tick1
      });
      expect(input).toHaveValue(1);

      act(() => {
        fireEvent.click(screen.getByText('끄기'));
      });

      act(() => {
        vi.advanceTimersByTime(2000); // 다음 tick에서 스스로 멈춰야 한다
      });
      expect(input).toHaveValue(1);
    });

    it('감소 버튼을 길게 누르면 같은 경로로 계속 줄어든다', () => {
      render(<NumericSpinner label="수량" defaultValue={10} />);
      const decrementButton = screen.getByRole('button', { name: '값 감소' });
      const input = screen.getByLabelText('수량');

      fireEvent.pointerDown(decrementButton);
      act(() => {
        vi.advanceTimersByTime(400);
      });
      expect(input).toHaveValue(9);

      act(() => {
        vi.advanceTimersByTime(160);
      });
      expect(input).toHaveValue(8);

      fireEvent.pointerUp(decrementButton);
    });

    it('키보드로 스페이스를 길게 누르면 같은 반복 경로를 탄다', () => {
      render(<NumericSpinner label="수량" defaultValue={0} />);
      const incrementButton = screen.getByRole('button', { name: '값 증가' });
      const input = screen.getByLabelText('수량');

      fireEvent.keyDown(incrementButton, { key: ' ' });
      act(() => {
        vi.advanceTimersByTime(400);
      });
      expect(input).toHaveValue(1);

      act(() => {
        vi.advanceTimersByTime(160);
      });
      expect(input).toHaveValue(2);

      fireEvent.keyUp(incrementButton, { key: ' ' });
      expect(input).toHaveValue(2); // 반복이 이미 몫을 다 했으니 keyup의 수동 tap은 씹힌다
    });

    it('키보드로 짧게 눌렀다 떼면 한 걸음만 간다', () => {
      render(<NumericSpinner label="수량" defaultValue={0} />);
      const incrementButton = screen.getByRole('button', { name: '값 증가' });
      const input = screen.getByLabelText('수량');

      fireEvent.keyDown(incrementButton, { key: 'Enter' });
      act(() => {
        vi.advanceTimersByTime(50);
      });
      fireEvent.keyUp(incrementButton, { key: 'Enter' });

      expect(input).toHaveValue(1);
    });

    it('OS 키 반복(event.repeat)은 새로 반복을 시작하지 않는다', () => {
      render(<NumericSpinner label="수량" defaultValue={0} />);
      const incrementButton = screen.getByRole('button', {
        name: '값 증가',
      }) as PressTweenHost;

      fireEvent.keyDown(incrementButton, { key: ' ' });
      const tweenAfterFirstDown = incrementButton.__pressTween;
      expect(tweenAfterFirstDown).toBeDefined();

      fireEvent.keyDown(incrementButton, { key: ' ', repeat: true });
      fireEvent.keyDown(incrementButton, { key: ' ', repeat: true });

      // 새 채널 A 트윈이 다시 시작되지 않았다. 같은 인스턴스를 계속 쓴다.
      expect(incrementButton.__pressTween).toBe(tweenAfterFirstDown);

      fireEvent.keyUp(incrementButton, { key: ' ' });
    });

    it(
      '채널 A: 누르면 버튼 0.90으로, 길게 누르면 0.86까지 깊어지고 떼면 ' +
        '현재 위치에서 1로 돌아온다',
      () => {
        render(<NumericSpinner label="수량" defaultValue={0} />);
        const incrementButton = screen.getByRole('button', {
          name: '값 증가',
        }) as PressTweenHost;

        fireEvent.pointerDown(incrementButton);
        const holdTimeline = incrementButton.__pressTween as gsap.core.Timeline;
        expect(holdTimeline).toBeDefined();

        const firstLegEnd =
          gsapDuration.fast / (gsapDuration.fast + REPEAT_RAMP_MS / 1000);

        act(() => {
          holdTimeline.progress(firstLegEnd);
        });
        expect(readScale(incrementButton)).toBeCloseTo(0.9, 2);

        act(() => {
          holdTimeline.progress((firstLegEnd + 1) / 2); // 2단계 진행 중
        });
        const scaleAtInterrupt = readScale(incrementButton);
        expect(scaleAtInterrupt).toBeLessThan(0.9);
        expect(scaleAtInterrupt).toBeGreaterThan(0.86);

        fireEvent.pointerUp(incrementButton);
        const releaseTimeline =
          incrementButton.__pressTween as gsap.core.Timeline;
        expect(releaseTimeline).not.toBe(holdTimeline);

        act(() => {
          releaseTimeline.progress(0.001);
        });
        // 뗀 직후엔 점프하지 않고 중단 당시 값에서 이어받는다.
        expect(
          Math.abs(readScale(incrementButton) - scaleAtInterrupt)
        ).toBeLessThan(0.05);

        act(() => {
          releaseTimeline.progress(1);
        });
        expect(readScale(incrementButton)).toBeCloseTo(1, 2);
      }
    );

    it('채널 B: 증가는 -4px에서, 감소는 +4px에서 제자리로 넛지된다', () => {
      render(<NumericSpinner label="수량" defaultValue={5} />);
      const incrementButton = screen.getByRole('button', { name: '값 증가' });
      const decrementButton = screen.getByRole('button', { name: '값 감소' });
      const input = screen.getByLabelText('수량') as InputNudgeHost;

      fireEvent.pointerDown(incrementButton);
      act(() => {
        vi.advanceTimersByTime(400); // 첫 tick에서 넛지 트윈이 생긴다
      });
      const incNudge = input.__nudgeTween!;
      expect(incNudge).toBeDefined();
      act(() => {
        incNudge.progress(0);
      });
      expect(readY(input)).toBeCloseTo(-NUDGE_PX, 1);
      act(() => {
        incNudge.progress(1);
      });
      expect(readY(input)).toBeCloseTo(0, 1);
      fireEvent.pointerUp(incrementButton);

      fireEvent.pointerDown(decrementButton);
      act(() => {
        vi.advanceTimersByTime(400);
      });
      const decNudge = input.__nudgeTween!;
      act(() => {
        decNudge.progress(0);
      });
      expect(readY(input)).toBeCloseTo(NUDGE_PX, 1);
      fireEvent.pointerUp(decrementButton);
    });

    it('모션 축소 선호에서는 시각 채널만 즉시 정착하고 반복 속도는 그대로다', () => {
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

      render(<NumericSpinner label="수량" defaultValue={0} />);
      const incrementButton = screen.getByRole('button', {
        name: '값 증가',
      }) as PressTweenHost;
      const input = screen.getByLabelText('수량');

      fireEvent.pointerDown(incrementButton);
      // gateMotion이 즉시 progress(1) 후 kill한다. 이미 다 깊어져 있다.
      expect(readScale(incrementButton)).toBeCloseTo(0.86, 2);
      expect(incrementButton.__pressTween!.parent).toBeNull();

      act(() => {
        vi.advanceTimersByTime(400); // 반복 타이머는 실시간 속도 그대로다(Ruling 34)
      });
      expect(input).toHaveValue(1);

      fireEvent.pointerUp(incrementButton);

      vi.unstubAllGlobals();
    });

    describe('채널 A는 숫자 칸에도 걸린다, 숫자는 더 깊게 (task-29 관문 3)', () => {
      const firstLegEnd =
        gsapDuration.fast / (gsapDuration.fast + REPEAT_RAMP_MS / 1000);

      const pressButton = (name: '값 증가' | '값 감소') =>
        screen.getByRole('button', { name }) as PressTweenHost;

      it('누르는 순간 버튼 0.90 숫자 0.82, 길게 누르면 버튼 0.86 숫자 0.76까지 깊어진다', () => {
        render(<NumericSpinner label="수량" defaultValue={0} />);
        const incrementButton = pressButton('값 증가');
        const input = screen.getByLabelText('수량');

        fireEvent.pointerDown(incrementButton);
        const holdTimeline = incrementButton.__pressTween as gsap.core.Timeline;

        act(() => {
          holdTimeline.progress(firstLegEnd);
        });
        expect(readScale(incrementButton)).toBeCloseTo(0.9, 2);
        expect(readScale(input)).toBeCloseTo(0.82, 2);

        act(() => {
          holdTimeline.progress((firstLegEnd + 1) / 2);
        });
        expect(readScale(incrementButton)).toBeLessThan(0.9);
        expect(readScale(incrementButton)).toBeGreaterThan(0.86);
        expect(readScale(input)).toBeLessThan(0.82);
        expect(readScale(input)).toBeGreaterThan(0.76);

        act(() => {
          holdTimeline.progress(1);
        });
        expect(readScale(incrementButton)).toBeCloseTo(0.86, 2);
        expect(readScale(input)).toBeCloseTo(0.76, 2);

        fireEvent.pointerUp(incrementButton);
      });

      it('누름 1단계는 떨림 없이 단단한 settle, 2단계는 drift이고 시간은 fast와 REPEAT_RAMP_MS다', () => {
        render(<NumericSpinner label="수량" defaultValue={0} />);
        const incrementButton = pressButton('값 증가');

        fireEvent.pointerDown(incrementButton);
        const [first, second] = (
          incrementButton.__pressTween as gsap.core.Timeline
        ).getChildren() as gsap.core.Tween[];

        expect(first.vars.ease).toBe(gsapEasing.settle);
        expect(first.duration()).toBeCloseTo(gsapDuration.fast, 5);
        expect(second.vars.ease).toBe(gsapEasing.drift);
        expect(second.duration()).toBeCloseTo(REPEAT_RAMP_MS / 1000, 5);

        fireEvent.pointerUp(incrementButton);
      });

      it('감소 버튼을 눌러도 숫자 칸이 같이 눌린다', () => {
        render(<NumericSpinner label="수량" defaultValue={5} />);
        const decrementButton = pressButton('값 감소');
        const input = screen.getByLabelText('수량');

        fireEvent.pointerDown(decrementButton);
        act(() => {
          (decrementButton.__pressTween as gsap.core.Timeline).progress(
            firstLegEnd
          );
        });
        expect(readScale(decrementButton)).toBeCloseTo(0.9, 2);
        expect(readScale(input)).toBeCloseTo(0.82, 2);

        fireEvent.pointerUp(decrementButton);
      });

      it('키보드(스페이스)로 눌러도 숫자 칸이 같이 눌린다', () => {
        render(<NumericSpinner label="수량" defaultValue={0} />);
        const incrementButton = pressButton('값 증가');
        const input = screen.getByLabelText('수량');

        fireEvent.keyDown(incrementButton, { key: ' ' });
        act(() => {
          (incrementButton.__pressTween as gsap.core.Timeline).progress(
            firstLegEnd
          );
        });
        expect(readScale(input)).toBeCloseTo(0.82, 2);

        fireEvent.keyUp(incrementButton, { key: ' ' });
      });

      it('눌림(scale)과 넛지(y)는 한 transform에서 서로를 지우지 않는다', () => {
        render(<NumericSpinner label="수량" defaultValue={0} />);
        const incrementButton = pressButton('값 증가');
        const input = screen.getByLabelText('수량') as InputNudgeHost;

        fireEvent.pointerDown(incrementButton);
        act(() => {
          vi.advanceTimersByTime(400); // 첫 tick에서 넛지가 생긴다
        });
        act(() => {
          (incrementButton.__pressTween as gsap.core.Timeline).progress(1);
          input.__nudgeTween!.progress(0);
        });
        expect(readY(input)).toBeCloseTo(-NUDGE_PX, 1);
        expect(readScale(input)).toBeCloseTo(0.76, 2);

        fireEvent.pointerUp(incrementButton);
      });

      it('눌림과 넛지는 <input>에만 걸리고 숫자 칸 상자와 컨테이너는 움직이지 않는다', () => {
        render(<NumericSpinner label="수량" defaultValue={0} />);
        const incrementButton = pressButton('값 증가');
        const input = screen.getByLabelText('수량');
        const box = input.parentElement!;

        fireEvent.pointerDown(incrementButton);
        act(() => {
          vi.advanceTimersByTime(400);
        });
        act(() => {
          (incrementButton.__pressTween as gsap.core.Timeline).progress(1);
        });
        expect(readScale(input)).toBeCloseTo(0.76, 2);
        expect(box.style.transform).toBe('');
        expect(box.parentElement!.style.transform).toBe('');

        const targets = (incrementButton.__pressTween as gsap.core.Timeline)
          .getChildren()
          .flatMap((child) => child.targets());
        expect(targets).not.toContain(box);

        fireEvent.pointerUp(incrementButton);
      });

      it('모션 축소 선호에서는 숫자 칸도 즉시 0.76에 정착하고 떼면 부풂 없이 즉시 1이다', () => {
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

        render(<NumericSpinner label="수량" defaultValue={0} />);
        const incrementButton = pressButton('값 증가');
        const input = screen.getByLabelText('수량');

        fireEvent.pointerDown(incrementButton);
        expect(readScale(input)).toBeCloseTo(0.76, 2);

        fireEvent.pointerUp(incrementButton);
        expect(readScale(input)).toBeCloseTo(1, 2);
        expect(readScale(incrementButton)).toBeCloseTo(1, 2);

        vi.unstubAllGlobals();
      });

      it('버튼의 눌림 트윈이 숫자 칸도 대상으로 삼고, 언마운트하면 함께 죽는다', () => {
        const { unmount } = render(
          <NumericSpinner label="수량" defaultValue={0} />
        );
        const incrementButton = pressButton('값 증가');
        const input = screen.getByLabelText('수량');

        fireEvent.pointerDown(incrementButton);
        const pressTween = incrementButton.__pressTween as gsap.core.Timeline;
        const targets = pressTween
          .getChildren()
          .flatMap((child) => child.targets());
        expect(targets).toContain(incrementButton);
        expect(targets).toContain(input);

        unmount();
        // kill()된 트윈은 parent를 잃는다. 숫자 칸의 트윈은 따로 없어 이것 하나로 끝난다.
        expect(pressTween.parent).toBeNull();
      });
    });

    describe('뗌은 부풀었다 내려앉는다 (task-29 관문 3)', () => {
      // 부풂 1.06(버튼)·1.12(숫자), 내려앉음 1. 타임라인 하나에 두 상이 든다.
      const releaseLegEnd =
        gsapDuration.fast / (gsapDuration.fast + gsapDuration.slow);

      /** 누름 타임라인을 끝(가장 깊은 값)까지 보낸 뒤 뗀다. */
      const pressAndRelease = (name: '값 증가' | '값 감소') => {
        const button = screen.getByRole('button', { name }) as PressTweenHost;
        fireEvent.pointerDown(button);
        const hold = button.__pressTween as gsap.core.Timeline;
        act(() => {
          hold.progress(1);
        });
        fireEvent.pointerUp(button);
        const release = button.__pressTween as gsap.core.Timeline;
        return { button, hold, release };
      };

      it('뗌은 타임라인 하나이고 1상 settle fast, 2상 drift slow 두 트윈을 담는다', () => {
        render(<NumericSpinner label="수량" defaultValue={0} />);
        const { hold, release } = pressAndRelease('값 증가');

        expect(release).not.toBe(hold);
        const legs = release.getChildren() as gsap.core.Tween[];
        expect(legs).toHaveLength(2);
        expect(legs[0].vars.ease).toBe(gsapEasing.settle);
        expect(legs[0].duration()).toBeCloseTo(gsapDuration.fast, 5);
        expect(legs[1].vars.ease).toBe(gsapEasing.drift);
        expect(legs[1].duration()).toBeCloseTo(gsapDuration.slow, 5);
      });

      it('1상 끝에서 버튼 1.06 숫자 1.12까지 부풀고, 2상 끝에서 둘 다 1로 내려앉는다', () => {
        render(<NumericSpinner label="수량" defaultValue={0} />);
        const input = screen.getByLabelText('수량');
        const { button, release } = pressAndRelease('값 증가');

        act(() => {
          release.progress(releaseLegEnd);
        });
        expect(readScale(button)).toBeCloseTo(1.06, 2);
        expect(readScale(input)).toBeCloseTo(1.12, 2);

        act(() => {
          release.progress((releaseLegEnd + 1) / 2);
        });
        expect(readScale(button)).toBeLessThan(1.06);
        expect(readScale(button)).toBeGreaterThan(1);
        expect(readScale(input)).toBeLessThan(1.12);
        expect(readScale(input)).toBeGreaterThan(1);

        act(() => {
          release.progress(1);
        });
        expect(readScale(button)).toBeCloseTo(1, 2);
        expect(readScale(input)).toBeCloseTo(1, 2);
      });

      it('감소 버튼도 같은 부풂을 한다', () => {
        render(<NumericSpinner label="수량" defaultValue={5} />);
        const input = screen.getByLabelText('수량');
        const { button, release } = pressAndRelease('값 감소');

        act(() => {
          release.progress(releaseLegEnd);
        });
        expect(readScale(button)).toBeCloseTo(1.06, 2);
        expect(readScale(input)).toBeCloseTo(1.12, 2);
      });

      it('부풂은 지금 자리에서 시작한다(깊게 눌린 값에서 점프하지 않는다)', () => {
        render(<NumericSpinner label="수량" defaultValue={0} />);
        const input = screen.getByLabelText('수량');
        const { button, release } = pressAndRelease('값 증가');

        act(() => {
          release.progress(0.001);
        });
        expect(Math.abs(readScale(button) - 0.86)).toBeLessThan(0.05);
        expect(Math.abs(readScale(input) - 0.76)).toBeLessThan(0.05);
      });

      it('뗌 도중 다시 누르면 뗌 타임라인이 죽고 누름이 지금 자리에서 시작한다', () => {
        render(<NumericSpinner label="수량" defaultValue={0} />);
        const input = screen.getByLabelText('수량');
        const { button, release } = pressAndRelease('값 증가');

        act(() => {
          release.progress(releaseLegEnd);
        });
        const swellButton = readScale(button);
        const swellInput = readScale(input);

        fireEvent.pointerDown(button);
        const nextHold = button.__pressTween as gsap.core.Timeline;
        expect(release.parent).toBeNull();
        expect(nextHold).not.toBe(release);
        expect(nextHold.parent).not.toBeNull();

        act(() => {
          nextHold.progress(0.001);
        });
        expect(Math.abs(readScale(button) - swellButton)).toBeLessThan(0.05);
        expect(Math.abs(readScale(input) - swellInput)).toBeLessThan(0.05);

        fireEvent.pointerUp(button);
      });

      it('언마운트하면 뗌 타임라인도 죽는다', () => {
        const { unmount } = render(
          <NumericSpinner label="수량" defaultValue={0} />
        );
        const { release } = pressAndRelease('값 증가');

        unmount();
        expect(release.parent).toBeNull();
      });
    });

    describe('두 버튼을 함께 누르면 숫자는 마지막 버튼을 뗄 때만 펴진다 (8차 기술 정리)', () => {
      type InputPressHost = HTMLElement & {
        __inputPressTween?: gsap.core.Tween;
      };
      const releaseLegEnd =
        gsapDuration.fast / (gsapDuration.fast + gsapDuration.slow);

      const press = (name: '값 증가' | '값 감소') =>
        screen.getByRole('button', { name }) as PressTweenHost;
      const timelineOf = (button: PressTweenHost) =>
        button.__pressTween as gsap.core.Timeline;

      /** 누름 타임라인을 끝(가장 깊은 값)까지 보낸다. */
      const down = (button: PressTweenHost) => {
        fireEvent.pointerDown(button);
        act(() => {
          timelineOf(button).progress(1);
        });
      };

      it('증가 누름, 감소 누름, 증가 뗌이면 숫자는 눌림에 남고 감소까지 떼면 부풀었다 1로 내려앉는다', () => {
        render(<NumericSpinner label="수량" defaultValue={5} />);
        const increment = press('값 증가');
        const decrement = press('값 감소');
        const input = screen.getByLabelText('수량') as InputPressHost;

        down(increment);
        down(decrement);
        expect(readScale(input)).toBeCloseTo(0.76, 2);

        fireEvent.pointerUp(increment);
        act(() => {
          timelineOf(increment).progress(1);
        });
        // 증가 버튼은 1로 돌아왔어도 감소가 눌려 있으니 숫자는 눌림 그대로다.
        expect(readScale(increment)).toBeCloseTo(1, 2);
        expect(readScale(input)).toBeCloseTo(0.76, 2);
        act(() => {
          input.__inputPressTween?.progress(1);
        });
        expect(readScale(input)).toBeCloseTo(0.76, 2);

        fireEvent.pointerUp(decrement);
        const release = timelineOf(decrement);
        act(() => {
          release.progress(releaseLegEnd);
        });
        expect(readScale(input)).toBeCloseTo(1.12, 2);
        act(() => {
          release.progress(1);
        });
        expect(readScale(input)).toBeCloseTo(1, 2);
        expect(readScale(decrement)).toBeCloseTo(1, 2);
      });

      it('감소를 먼저 누르고 먼저 떼도 같다(눌린 순서·뗀 순서에 상관없다)', () => {
        render(<NumericSpinner label="수량" defaultValue={5} />);
        const increment = press('값 증가');
        const decrement = press('값 감소');
        const input = screen.getByLabelText('수량');

        down(decrement);
        down(increment);
        fireEvent.pointerUp(decrement);
        act(() => {
          timelineOf(decrement).progress(1);
        });
        expect(readScale(input)).toBeCloseTo(0.76, 2);

        fireEvent.pointerUp(increment);
        act(() => {
          timelineOf(increment).progress(releaseLegEnd);
        });
        expect(readScale(input)).toBeCloseTo(1.12, 2);
      });

      it('나중에 누른 버튼을 먼저 떼면 숫자는 그대로 눌려 있다', () => {
        render(<NumericSpinner label="수량" defaultValue={5} />);
        const increment = press('값 증가');
        const decrement = press('값 감소');
        const input = screen.getByLabelText('수량');

        down(increment);
        down(decrement);
        fireEvent.pointerUp(decrement);
        act(() => {
          timelineOf(decrement).progress(1);
        });
        expect(readScale(input)).toBeCloseTo(0.76, 2);
        // 감소 버튼의 뗌은 숫자 칸을 건드리지 않는다.
        const targets = timelineOf(decrement)
          .getChildren()
          .flatMap((child) => child.targets());
        expect(targets).not.toContain(input);
      });

      it('먼저 누른 버튼이 1단계 도중에 떼어져도 숫자는 눌림 깊이로 이어서 간다', () => {
        render(<NumericSpinner label="수량" defaultValue={5} />);
        const increment = press('값 증가');
        const decrement = press('값 감소');
        const input = screen.getByLabelText('수량') as InputPressHost;

        fireEvent.pointerDown(increment);
        act(() => {
          timelineOf(increment).progress(0.01);
        });
        down(decrement);
        fireEvent.pointerUp(increment);

        const carry = input.__inputPressTween as gsap.core.Tween;
        expect(carry).toBeDefined();
        act(() => {
          carry.progress(1);
        });
        expect(readScale(input)).toBeCloseTo(0.76, 2);
      });

      it('한쪽을 뗐다가 다시 눌러도 다른 쪽이 눌려 있는 동안 숫자는 펴지지 않는다', () => {
        render(<NumericSpinner label="수량" defaultValue={5} />);
        const increment = press('값 증가');
        const decrement = press('값 감소');
        const input = screen.getByLabelText('수량');

        down(increment);
        down(decrement);
        fireEvent.pointerUp(increment);
        down(increment);
        fireEvent.pointerUp(decrement);
        act(() => {
          timelineOf(decrement).progress(1);
        });
        expect(readScale(input)).toBeCloseTo(0.76, 2);

        fireEvent.pointerUp(increment);
        act(() => {
          timelineOf(increment).progress(releaseLegEnd);
        });
        expect(readScale(input)).toBeCloseTo(1.12, 2);
      });

      it('한쪽 뗌이 도는 중에 반대 버튼을 누르면 숫자는 지금 자리에서 눌림 깊이로 가고 1로 돌아가지 않는다', () => {
        render(<NumericSpinner label="수량" defaultValue={5} />);
        const increment = press('값 증가');
        const decrement = press('값 감소');
        const input = screen.getByLabelText('수량');

        down(increment);
        fireEvent.pointerUp(increment);
        const release = timelineOf(increment);
        act(() => {
          release.progress(0.2);
        });

        down(decrement);
        expect(readScale(input)).toBeCloseTo(0.76, 2);

        // 먼저 뗀 쪽의 뗌 타임라인이 남아 있었다면 여기서 나중에 시작하는 2단계가
        // 새 눌림을 덮어 숫자를 1로 돌려놓는다.
        act(() => {
          release.progress(1);
        });
        expect(readScale(input)).toBeCloseTo(0.76, 2);

        fireEvent.pointerUp(decrement);
        act(() => {
          timelineOf(decrement).progress(releaseLegEnd);
        });
        expect(readScale(input)).toBeCloseTo(1.12, 2);
      });

      it('뗌의 2단계가 돌고 있을 때 반대 버튼을 눌러도 숫자는 눌림에 남는다', () => {
        render(<NumericSpinner label="수량" defaultValue={5} />);
        const increment = press('값 증가');
        const decrement = press('값 감소');
        const input = screen.getByLabelText('수량');

        down(increment);
        fireEvent.pointerUp(increment);
        const release = timelineOf(increment);
        act(() => {
          release.progress((releaseLegEnd + 1) / 2);
        });

        down(decrement);
        act(() => {
          release.progress(1);
        });
        expect(readScale(input)).toBeCloseTo(0.76, 2);
      });

      it('눌러 둔 버튼의 눌림이 아직 깊어지는 중에 반대 버튼을 눌러도 숫자는 계속 눌림 깊이까지 간다', () => {
        render(<NumericSpinner label="수량" defaultValue={5} />);
        const increment = press('값 증가');
        const decrement = press('값 감소');
        const input = screen.getByLabelText('수량');

        fireEvent.pointerDown(increment);
        act(() => {
          timelineOf(increment).progress(0.01);
        });
        fireEvent.pointerDown(decrement);
        act(() => {
          timelineOf(increment).progress(1);
        });
        expect(readScale(input)).toBeCloseTo(0.76, 2);
      });

      it('마지막 버튼을 떼면 이어 가던 숫자 트윈은 죽는다', () => {
        render(<NumericSpinner label="수량" defaultValue={5} />);
        const increment = press('값 증가');
        const decrement = press('값 감소');
        const input = screen.getByLabelText('수량') as InputPressHost;

        down(increment);
        down(decrement);
        fireEvent.pointerUp(increment);
        const carry = input.__inputPressTween as gsap.core.Tween;
        expect(carry.parent).not.toBeNull();

        fireEvent.pointerUp(decrement);
        expect(carry.parent).toBeNull();
      });

      it('언마운트하면 이어 가던 숫자 트윈도 죽는다', () => {
        const { unmount } = render(
          <NumericSpinner label="수량" defaultValue={5} />
        );
        const increment = press('값 증가');
        const decrement = press('값 감소');
        const input = screen.getByLabelText('수량') as InputPressHost;

        down(increment);
        down(decrement);
        fireEvent.pointerUp(increment);
        const carry = input.__inputPressTween as gsap.core.Tween;

        unmount();
        expect(carry.parent).toBeNull();
      });

      it('모션 축소 선호에서도 마지막 버튼을 뗄 때만 숫자가 1로 돌아온다', () => {
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
        render(<NumericSpinner label="수량" defaultValue={5} />);
        const increment = press('값 증가');
        const decrement = press('값 감소');
        const input = screen.getByLabelText('수량');

        fireEvent.pointerDown(increment);
        fireEvent.pointerDown(decrement);
        fireEvent.pointerUp(increment);
        expect(readScale(input)).toBeCloseTo(0.76, 2);
        fireEvent.pointerUp(decrement);
        expect(readScale(input)).toBeCloseTo(1, 2);

        vi.unstubAllGlobals();
      });
    });

    describe('빨리 누르면 크기가 남던 결함 (task-29 관문 2)', () => {
      // 원인: 누름 타임라인은 1단계(버튼 0.90)와 2단계(0.86)를 차례로 담는다. 1단계 도중에
      // 떼면 릴리즈 트윈의 overwrite: 'auto'는 돌고 있던 1단계만 죽이고, 아직 시작
      // 안 한 2단계는 살아남아 나중에 릴리즈를 덮고 0.86으로 간다. 그래서 시간이
      // 정말 흐르는 실제 타이머로 확인한다(가짜 타이머는 gsap 티커를 못 돌린다).
      const settle = (ms: number) =>
        act(() => new Promise<void>((resolve) => setTimeout(resolve, ms)));

      beforeEach(() => {
        vi.useRealTimers();
      });

      it('1단계 도중에 떼면 누름 타임라인이 죽고, 시간이 흘러도 버튼과 숫자는 1이다', async () => {
        render(<NumericSpinner label="수량" defaultValue={0} />);
        const button = screen.getByRole('button', {
          name: '값 증가',
        }) as PressTweenHost;
        const input = screen.getByLabelText('수량');

        fireEvent.pointerDown(button);
        const holdTimeline = button.__pressTween as gsap.core.Timeline;
        await settle(50);
        fireEvent.pointerUp(button);

        // kill()된 트윈은 parent를 잃는다(아래 언마운트 시험과 같은 판별).
        expect(holdTimeline.parent).toBeNull();

        await settle(1700);
        expect(readScale(button)).toBeCloseTo(1, 2);
        expect(readScale(input)).toBeCloseTo(1, 2);
      }, 10000);

      it('빠른 연속 누름 여섯 번 뒤에도 버튼과 숫자는 1로 돌아온다', async () => {
        render(<NumericSpinner label="수량" defaultValue={0} />);
        const button = screen.getByRole('button', { name: '값 증가' });
        const input = screen.getByLabelText('수량');

        for (let i = 0; i < 6; i += 1) {
          fireEvent.pointerDown(button);
          await settle(30);
          fireEvent.pointerUp(button);
          fireEvent.click(button);
          await settle(30);
        }
        await settle(1700);

        expect(readScale(button)).toBeCloseTo(1, 2);
        expect(readScale(input)).toBeCloseTo(1, 2);
      }, 10000);

      it('감소 버튼도 빠른 연속 누름 뒤 1로 돌아온다', async () => {
        render(<NumericSpinner label="수량" defaultValue={9} />);
        const button = screen.getByRole('button', { name: '값 감소' });
        const input = screen.getByLabelText('수량');

        for (let i = 0; i < 4; i += 1) {
          fireEvent.pointerDown(button);
          await settle(20);
          fireEvent.pointerUp(button);
          fireEvent.click(button);
          await settle(20);
        }
        await settle(1700);

        expect(readScale(button)).toBeCloseTo(1, 2);
        expect(readScale(input)).toBeCloseTo(1, 2);
      }, 10000);

      it('길게 눌러 2단계까지 간 뒤 떼면 1로 돌아온다', async () => {
        render(<NumericSpinner label="수량" defaultValue={0} />);
        const button = screen.getByRole('button', { name: '값 증가' });
        const input = screen.getByLabelText('수량');

        fireEvent.pointerDown(button);
        await settle(700);
        expect(readScale(button)).toBeLessThan(0.9);
        fireEvent.pointerUp(button);
        await settle(600);

        expect(readScale(button)).toBeCloseTo(1, 2);
        expect(readScale(input)).toBeCloseTo(1, 2);
      }, 10000);

      it('새로 누르면 남아 있던 릴리즈 트윈과 누름 타임라인을 정리하고 시작한다', () => {
        render(<NumericSpinner label="수량" defaultValue={0} />);
        const button = screen.getByRole('button', {
          name: '값 증가',
        }) as PressTweenHost;

        fireEvent.pointerDown(button);
        const firstTimeline = button.__pressTween as gsap.core.Timeline;
        fireEvent.pointerUp(button);
        const release = button.__pressTween as gsap.core.Timeline;

        fireEvent.pointerDown(button);
        const secondTimeline = button.__pressTween as gsap.core.Timeline;

        expect(release.parent).toBeNull();
        expect(firstTimeline.parent).toBeNull();
        expect(secondTimeline).not.toBe(release);
        expect(secondTimeline.parent).not.toBeNull();

        fireEvent.pointerUp(button);
      });
    });

    it('언마운트 시 타이머가 정리돼 이후 tick이 더 이상 실행되지 않는다', () => {
      const onChange = vi.fn();
      const { unmount } = render(
        <NumericSpinner label="수량" value={0} onChange={onChange} />
      );
      const incrementButton = screen.getByRole('button', { name: '값 증가' });

      fireEvent.pointerDown(incrementButton);
      act(() => {
        vi.advanceTimersByTime(400); // 반복 시작, tick1
      });
      const callsBeforeUnmount = onChange.mock.calls.length;
      expect(callsBeforeUnmount).toBeGreaterThan(0);

      unmount();

      act(() => {
        vi.advanceTimersByTime(5000); // 정리가 안 됐다면 tick이 계속 돌며 더 불렀을 것이다
      });
      expect(onChange.mock.calls.length).toBe(callsBeforeUnmount);
    });

    it('언마운트 시 진행 중이던 채널 A·B 트윈이 죽는다 (위험 5-다)', () => {
      const { unmount } = render(
        <NumericSpinner label="수량" defaultValue={0} />
      );
      const incrementButton = screen.getByRole('button', {
        name: '값 증가',
      }) as PressTweenHost;
      const input = screen.getByLabelText('수량') as InputNudgeHost;

      fireEvent.pointerDown(incrementButton);
      act(() => {
        vi.advanceTimersByTime(400); // 반복 시작: 채널 A·B 트윈이 생긴다
      });

      const pressTween = incrementButton.__pressTween;
      const nudgeTween = input.__nudgeTween;
      expect(pressTween).toBeDefined();
      expect(nudgeTween).toBeDefined();

      unmount();

      // kill()된 트윈은 parent를 잃는다. isActive()는 parent가 없어도 true를
      // 내므로(Slider.test.tsx:747과 같은 이유) kill 여부 판별에 못 쓴다.
      expect(pressTween?.parent).toBeNull();
      expect(nudgeTween?.parent).toBeNull();
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

describe('NumericSpinner 생성 CSS (숫자 칸 상자, task-29 관문 2)', () => {
  const rules = () => sheetRules('NumericSpinner_input');
  /** 클래스 이름(debugId) 뒤에 suffix가 정확히 붙은 규칙들. suffix는 정규식 조각이다. */
  const named = (name: string, suffix: string) =>
    rules().filter((rule) =>
      new RegExp(`^\\.NumericSpinner_${name}__\\w+${suffix}$`).test(
        rule.selectorText
      )
    );
  const one = (name: string, suffix: string) => {
    const found = named(name, suffix);
    expect(found, `${name}${suffix}`).toHaveLength(1);
    return found[0];
  };

  describe('DOM 구조', () => {
    it('입력칸은 숫자 칸 상자 안에 있고, 상자는 두 버튼 사이에 있다', () => {
      render(<NumericSpinner label="수량" />);
      const input = screen.getByLabelText('수량');
      const box = input.parentElement!;
      expect(box.className).toMatch(/NumericSpinner_inputBox__/);
      expect(box.children).toHaveLength(1);
      const container = box.parentElement!;
      expect(container.className).toMatch(/NumericSpinner_inputContainer__/);
      expect(Array.from(container.children).map((el) => el.tagName)).toEqual([
        'BUTTON',
        'SPAN',
        'BUTTON',
      ]);
    });

    it('className·rest·style은 상자가 아니라 <input>에 붙는다', () => {
      render(
        <NumericSpinner
          label="수량"
          className="mine"
          data-probe="x"
          style={{ width: '90px' }}
        />
      );
      const input = screen.getByLabelText('수량');
      expect(input).toHaveClass('mine');
      expect(input).toHaveAttribute('data-probe', 'x');
      expect(input.style.width).toBe('90px');
      expect(input.parentElement).not.toHaveClass('mine');
      expect(input.parentElement).not.toHaveAttribute('data-probe');
    });
  });

  describe('테두리와 겉모습은 상자가 가진다', () => {
    it('상자는 border.default 1px 테두리와 6px 반경을 갖고 넘치는 것을 자른다', () => {
      const box = one('inputBox', '');
      expect(box.style.getPropertyValue('border')).toMatch(
        /^1px solid var\(--color-border-default/
      );
      expect(box.style.getPropertyValue('border-radius')).toBe('6px');
      expect(box.style.getPropertyValue('overflow')).toBe('hidden');
      expect(box.style.getPropertyValue('display')).toBe('inline-flex');
      expect(box.style.getPropertyValue('background-color')).toContain('paper');
    });

    it('상자 :focus-within은 테두리 색만 primary로 바꾼다(후광도 외곽선도 없다)', () => {
      const focus = one('inputBox', ':focus-within');
      expect(focus.style.getPropertyValue('border-color')).toContain('primary');
      expect(focus.style.getPropertyValue('box-shadow')).toBe('');
      expect(focus.style.getPropertyValue('outline')).toBe('');
    });

    it('상자 비활성은 면을 surface.default로 바꾼다', () => {
      const disabled = one('inputBox', ':has\\(input:disabled\\)');
      expect(disabled.style.getPropertyValue('background-color')).toContain(
        'surface-default'
      );
    });

    it('상자 규칙 어디에도 transform이 없다(움직이는 것은 <input>뿐이다)', () => {
      const all = named('inputBox', '.*');
      expect(all.length).toBeGreaterThan(1);
      for (const rule of all) {
        expect(
          rule.style.getPropertyValue('transform'),
          rule.selectorText
        ).toBe('');
      }
    });

    it('상자의 어느 규칙에도 box-shadow와 outline-offset 선언이 없다', () => {
      for (const rule of named('inputBox', '.*')) {
        expect(
          rule.style.getPropertyValue('box-shadow'),
          rule.selectorText
        ).toBe('');
        expect(
          rule.style.getPropertyValue('outline-offset'),
          rule.selectorText
        ).toBe('');
      }
    });
  });

  describe('<input>은 투명하고 테두리가 없다', () => {
    it('테두리·면·외곽선이 없다', () => {
      const base = one('input', '');
      expect(base.style.getPropertyValue('border')).toMatch(/^(none|0)/);
      expect(base.style.getPropertyValue('background-color')).toBe(
        'transparent'
      );
      expect(base.style.getPropertyValue('outline')).toMatch(/^(none|0)/);
      expect(base.style.getPropertyValue('display')).toBe('block');
    });

    it('어느 규칙도 border-color·box-shadow·outline-offset을 건드리지 않고 :focus 규칙이 없다', () => {
      const all = named('input', '.*');
      expect(all.length).toBeGreaterThan(3);
      for (const rule of all) {
        for (const prop of ['border-color', 'box-shadow', 'outline-offset']) {
          expect(
            rule.style.getPropertyValue(prop),
            `${rule.selectorText} ${prop}`
          ).toBe('');
        }
      }
      expect(named('input', ':focus')).toEqual([]);
    });

    it('transform은 CSS가 아니라 GSAP이 소유한다(규칙에 transform·scale 전이가 없다)', () => {
      for (const rule of named('input', '.*')) {
        expect(
          rule.style.getPropertyValue('transform'),
          rule.selectorText
        ).toBe('');
      }
      expect(one('input', '').style.getPropertyValue('transition')).not.toMatch(
        /transform|scale|all/
      );
    });

    it('증감 버튼의 :focus-visible 링은 그대로다', () => {
      const ring = one('button', ':focus-visible');
      expect(ring.style.getPropertyValue('outline')).not.toBe('');
    });
  });

  describe('바깥 컨테이너에는 테두리가 없다', () => {
    it('inputContainer에 border가 없고 면과 반경은 남는다', () => {
      const container = one('inputContainer', '');
      expect(container.style.getPropertyValue('border')).toBe('');
      expect(container.style.getPropertyValue('border-color')).toBe('');
      expect(container.style.getPropertyValue('background-color')).toContain(
        'paper'
      );
      expect(container.style.getPropertyValue('border-radius')).toBe('8px');
    });

    it('inputContainer의 어느 규칙도 border-color를 건드리지 않는다(:has 규칙 포함)', () => {
      const all = named('inputContainer', '.*');
      expect(all.length).toBeGreaterThan(1);
      for (const rule of all) {
        expect(
          rule.style.getPropertyValue('border-color'),
          rule.selectorText
        ).toBe('');
      }
    });
  });

  describe('오류는 상자 테두리 하나만 빨갛다', () => {
    it('error 클래스는 상자에만 붙고 <input>과 컨테이너에는 붙지 않는다', () => {
      render(<NumericSpinner label="수량" error />);
      const input = screen.getByLabelText('수량');
      const box = input.parentElement!;
      expect(box.className).toMatch(/NumericSpinner_error__/);
      expect(input.className).not.toMatch(/NumericSpinner_error__/);
      expect(box.parentElement!.className).not.toMatch(
        /NumericSpinner_error__/
      );
    });

    it('error가 아니면 상자에 error 클래스가 없다', () => {
      render(<NumericSpinner label="수량" />);
      expect(
        screen.getByLabelText('수량').parentElement!.className
      ).not.toMatch(/NumericSpinner_error__/);
    });

    it('error 규칙은 포커스 때도 이기는 빨강 테두리 색뿐이고 후광과 :focus-within 규칙이 없다', () => {
      const error = one('error', '');
      expect(error.style.getPropertyValue('border-color')).toContain('error');
      expect(error.style.getPropertyPriority('border-color')).toBe('important');
      expect(error.style.getPropertyValue('box-shadow')).toBe('');
      expect(named('error', '\\W.*')).toEqual([]);
    });
  });
});
