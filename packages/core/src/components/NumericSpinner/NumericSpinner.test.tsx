import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import React, { createRef } from 'react';
import { NumericSpinner } from './NumericSpinner';
import { gsapDuration } from '../../tokens/gsapEasing';

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
      const container = screen.getByLabelText('수량').parentElement;
      expect(container?.className).toContain('size_sm');
    });

    it('md size를 적용한다 (기본값)', () => {
      render(<NumericSpinner label="수량" />);
      const container = screen.getByLabelText('수량').parentElement;
      expect(container?.className).toContain('size_md');
    });

    it('lg size를 적용한다', () => {
      render(<NumericSpinner label="수량" size="lg" />);
      const container = screen.getByLabelText('수량').parentElement;
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

    it('input은 항상 readOnly 상태이다', () => {
      render(<NumericSpinner label="수량" />);
      const input = screen.getByLabelText('수량');

      expect(input).toHaveAttribute('readonly');
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
        screen.getByLabelText('수량').parentElement?.parentElement;
      expect(wrapper?.className).toContain('fullWidth');
    });

    it('fullWidth가 false이면 기본 너비를 사용한다', () => {
      render(<NumericSpinner label="수량" />);
      const wrapper =
        screen.getByLabelText('수량').parentElement?.parentElement;
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
          vi.advanceTimersByTime(400); // tick1 — 값이 안 바뀌어도 최초 1회는 부른다
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

      // 새 채널 A 트윈이 다시 시작되지 않았다 — 같은 인스턴스를 계속 쓴다.
      expect(incrementButton.__pressTween).toBe(tweenAfterFirstDown);

      fireEvent.keyUp(incrementButton, { key: ' ' });
    });

    it(
      '채널 A: 누르면 0.92로, 길게 누르면 0.86까지 깊어지고 떼면 현재 ' +
        '위치에서 1로 돌아온다',
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
        expect(readScale(incrementButton)).toBeCloseTo(0.92, 2);

        act(() => {
          holdTimeline.progress((firstLegEnd + 1) / 2); // 2단계 진행 중
        });
        const scaleAtInterrupt = readScale(incrementButton);
        expect(scaleAtInterrupt).toBeLessThan(0.92);
        expect(scaleAtInterrupt).toBeGreaterThan(0.86);

        fireEvent.pointerUp(incrementButton);
        const releaseTween = incrementButton.__pressTween as gsap.core.Tween;
        expect(releaseTween).not.toBe(holdTimeline);

        act(() => {
          releaseTween.progress(0.001);
        });
        // 뗀 직후엔 1로 점프하지 않고 중단 당시 값에서 이어받는다.
        expect(
          Math.abs(readScale(incrementButton) - scaleAtInterrupt)
        ).toBeLessThan(0.05);

        act(() => {
          releaseTween.progress(1);
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
      // gateMotion이 즉시 progress(1) 후 kill한다 — 이미 다 깊어져 있다.
      expect(readScale(incrementButton)).toBeCloseTo(0.86, 2);
      expect(incrementButton.__pressTween!.parent).toBeNull();

      act(() => {
        vi.advanceTimersByTime(400); // 반복 타이머는 실시간 속도 그대로다(Ruling 34)
      });
      expect(input).toHaveValue(1);

      fireEvent.pointerUp(incrementButton);

      vi.unstubAllGlobals();
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
        vi.advanceTimersByTime(400); // 반복 시작 — 채널 A·B 트윈이 생긴다
      });

      const pressTween = incrementButton.__pressTween;
      const nudgeTween = input.__nudgeTween;
      expect(pressTween).toBeDefined();
      expect(nudgeTween).toBeDefined();

      unmount();

      // kill()된 트윈은 parent를 잃는다 — isActive()는 parent가 없어도 true를
      // 내므로(Slider.test.tsx:747과 같은 이유) kill 여부 판별에 못 쓴다.
      expect(pressTween?.parent).toBeNull();
      expect(nudgeTween?.parent).toBeNull();
    });
  });
});
