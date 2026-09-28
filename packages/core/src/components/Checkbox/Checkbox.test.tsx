import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { createRef, useState } from 'react';
import { Checkbox } from './Checkbox';

// gsap 네임스페이스는 ambient 전역 타입이라 import 없이 참조된다
// (Snackbar.test.tsx의 CountdownTweenHost와 같은 방식) — 이 파일에서
// `from 'gsap'`가 없어야 gsapGateEnforcement 스캔에 안 걸린다.
type MarkTweenHost = SVGPathElement & { __markTween?: gsap.core.Tween };

const getMarkPath = (container: HTMLElement): MarkTweenHost =>
  container.querySelector('svg path') as MarkTweenHost;

/** jsdom은 matchMedia를 구현하지 않는다 — 축소 선호 경로를 열려면 깔아야 한다. */
const installReducedMotion = (): void => {
  vi.stubGlobal(
    'matchMedia',
    (media: string): MediaQueryList =>
      ({
        matches: true,
        media,
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
        onchange: null,
      }) as unknown as MediaQueryList
  );
};

describe('Checkbox', () => {
  describe('렌더링 테스트', () => {
    it('기본 checkbox를 렌더링한다', () => {
      render(<Checkbox label="동의" />);
      const checkbox = screen.getByRole('checkbox', { name: '동의' });
      expect(checkbox).toBeInTheDocument();
    });

    it('label 텍스트를 표시한다', () => {
      render(<Checkbox label="이용약관에 동의합니다" />);
      expect(screen.getByText('이용약관에 동의합니다')).toBeInTheDocument();
    });

    it('checked 상태를 렌더링한다', () => {
      render(<Checkbox label="동의" checked onChange={() => {}} />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeChecked();
    });

    it('unchecked 상태를 렌더링한다', () => {
      render(<Checkbox label="동의" />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeChecked();
    });
  });

  describe('size prop 테스트', () => {
    it('sm size를 적용한다', () => {
      render(<Checkbox label="동의" size="sm" />);
      const container = screen.getByRole('checkbox').parentElement;
      expect(container?.className).toContain('size_sm');
    });

    it('md size를 적용한다 (기본값)', () => {
      render(<Checkbox label="동의" />);
      const container = screen.getByRole('checkbox').parentElement;
      expect(container?.className).toContain('size_md');
    });

    it('lg size를 적용한다', () => {
      render(<Checkbox label="동의" size="lg" />);
      const container = screen.getByRole('checkbox').parentElement;
      expect(container?.className).toContain('size_lg');
    });
  });

  describe('상태 prop 테스트', () => {
    it('disabled 상태를 적용한다', () => {
      render(<Checkbox label="동의" disabled />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeDisabled();
    });

    it('indeterminate 상태를 적용한다', () => {
      render(<Checkbox label="동의" indeterminate />);
      const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
      expect(checkbox.indeterminate).toBe(true);
    });

    it('required 상태를 적용한다', () => {
      render(<Checkbox label="동의" required />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeRequired();
    });
  });

  describe('error prop 테스트', () => {
    it('error가 true이면 error 상태를 적용한다', () => {
      render(<Checkbox label="동의" error />);
      const container = screen.getByRole('checkbox').parentElement;
      expect(container?.className).toContain('error');
    });

    it('error message를 표시한다', () => {
      render(<Checkbox label="동의" error errorMessage="필수 항목입니다" />);
      expect(screen.getByText('필수 항목입니다')).toBeInTheDocument();
    });

    it('error가 false이면 error message를 표시하지 않는다', () => {
      render(<Checkbox label="동의" errorMessage="필수 항목입니다" />);
      expect(screen.queryByText('필수 항목입니다')).not.toBeInTheDocument();
    });
  });

  describe('helperText prop 테스트', () => {
    it('helperText를 표시한다', () => {
      render(<Checkbox label="동의" helperText="선택사항입니다" />);
      expect(screen.getByText('선택사항입니다')).toBeInTheDocument();
    });

    it('error가 true이면 helperText 대신 errorMessage를 표시한다', () => {
      render(
        <Checkbox
          label="동의"
          helperText="선택사항입니다"
          error
          errorMessage="필수 항목입니다"
        />
      );
      expect(screen.getByText('필수 항목입니다')).toBeInTheDocument();
      expect(screen.queryByText('선택사항입니다')).not.toBeInTheDocument();
    });
  });

  describe('이벤트 핸들러 테스트', () => {
    it('onChange 이벤트를 호출한다', () => {
      const handleChange = vi.fn();
      render(<Checkbox label="동의" onChange={handleChange} />);
      const checkbox = screen.getByRole('checkbox');

      fireEvent.click(checkbox);
      expect(handleChange).toHaveBeenCalledTimes(1);
    });

    it('label 클릭 시에도 onChange가 호출된다', () => {
      const handleChange = vi.fn();
      render(<Checkbox label="동의" onChange={handleChange} />);
      const label = screen.getByText('동의');

      fireEvent.click(label);
      expect(handleChange).toHaveBeenCalledTimes(1);
    });

    it('disabled 상태에서는 onChange가 호출되지 않는다', async () => {
      const handleChange = vi.fn();
      render(<Checkbox label="동의" disabled onChange={handleChange} />);
      const checkbox = screen.getByRole('checkbox');

      // userEvent는 disabled 요소 클릭을 실제처럼 무시함
      await userEvent.click(checkbox).catch(() => {});
      expect(handleChange).not.toHaveBeenCalled();
    });

    it('onFocus 이벤트를 호출한다', () => {
      const handleFocus = vi.fn();
      render(<Checkbox label="동의" onFocus={handleFocus} />);
      const checkbox = screen.getByRole('checkbox');

      fireEvent.focus(checkbox);
      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it('onBlur 이벤트를 호출한다', () => {
      const handleBlur = vi.fn();
      render(<Checkbox label="동의" onBlur={handleBlur} />);
      const checkbox = screen.getByRole('checkbox');

      fireEvent.focus(checkbox);
      fireEvent.blur(checkbox);
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });
  });

  describe('ref 전달 테스트 (forwardRef)', () => {
    it('ref를 checkbox 요소에 전달한다', () => {
      const ref = createRef<HTMLInputElement>();
      render(<Checkbox label="동의" ref={ref} />);

      expect(ref.current).toBeInstanceOf(HTMLInputElement);
      expect(ref.current?.type).toBe('checkbox');
    });

    it('ref를 통해 focus()를 호출할 수 있다', () => {
      const ref = createRef<HTMLInputElement>();
      render(<Checkbox label="동의" ref={ref} />);

      ref.current?.focus();
      expect(ref.current).toHaveFocus();
    });

    it('ref를 통해 blur()를 호출할 수 있다', () => {
      const ref = createRef<HTMLInputElement>();
      render(<Checkbox label="동의" ref={ref} />);

      ref.current?.focus();
      expect(ref.current).toHaveFocus();

      ref.current?.blur();
      expect(ref.current).not.toHaveFocus();
    });

    it('ref를 통해 indeterminate 속성을 설정할 수 있다', () => {
      const ref = createRef<HTMLInputElement>();
      render(<Checkbox label="동의" ref={ref} />);

      if (ref.current) {
        ref.current.indeterminate = true;
      }
      expect(ref.current?.indeterminate).toBe(true);
    });
  });

  describe('접근성 테스트', () => {
    it('label과 checkbox가 올바르게 연결된다', () => {
      render(<Checkbox label="동의" />);
      const checkbox = screen.getByRole('checkbox', { name: '동의' });
      expect(checkbox).toBeInTheDocument();
    });

    it('required일 때 label에 * 표시가 있다', () => {
      render(<Checkbox label="동의" required />);
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('error일 때 aria-invalid가 true이다', () => {
      render(<Checkbox label="동의" error />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('aria-invalid', 'true');
    });

    it('error가 아닐 때 aria-invalid가 false이다', () => {
      render(<Checkbox label="동의" />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('aria-invalid', 'false');
    });

    it('errorMessage가 있을 때 aria-describedby가 설정된다', () => {
      render(<Checkbox label="동의" error errorMessage="필수 항목입니다" />);
      const checkbox = screen.getByRole('checkbox');
      const describedBy = checkbox.getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();
      expect(screen.getByText('필수 항목입니다')).toHaveAttribute(
        'id',
        describedBy!
      );
    });

    it('helperText가 있을 때 aria-describedby가 설정된다', () => {
      render(<Checkbox label="동의" helperText="선택사항입니다" />);
      const checkbox = screen.getByRole('checkbox');
      const describedBy = checkbox.getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();
      expect(screen.getByText('선택사항입니다')).toHaveAttribute(
        'id',
        describedBy!
      );
    });

    it('disabled일 때 aria-disabled가 true이다', () => {
      render(<Checkbox label="동의" disabled />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('키보드 인터랙션 테스트', () => {
    it('Space 키로 체크/체크 해제할 수 있다', async () => {
      const handleChange = vi.fn();
      render(<Checkbox label="동의" onChange={handleChange} />);
      const checkbox = screen.getByRole('checkbox');

      checkbox.focus();
      await userEvent.keyboard(' ');

      expect(handleChange).toHaveBeenCalledTimes(1);
    });

    it('Tab 키로 포커스를 이동할 수 있다', async () => {
      render(
        <div>
          <Checkbox label="동의1" />
          <Checkbox label="동의2" />
        </div>
      );

      const checkbox1 = screen.getByRole('checkbox', { name: '동의1' });
      const checkbox2 = screen.getByRole('checkbox', { name: '동의2' });

      checkbox1.focus();
      expect(checkbox1).toHaveFocus();

      await userEvent.tab();
      expect(checkbox2).toHaveFocus();
    });
  });

  describe('엣지 케이스 테스트', () => {
    it('label이 없으면 console.error를 호출한다 (개발 환경)', () => {
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const originalEnv = process.env.NODE_ENV;

      process.env.NODE_ENV = 'development';
      render(<Checkbox label="" />);
      expect(consoleError).toHaveBeenCalledWith(
        'Checkbox: label prop은 필수입니다. 접근성을 위해 label을 제공하세요.'
      );

      process.env.NODE_ENV = originalEnv;
      consoleError.mockRestore();
    });

    it('value와 onChange가 동시에 제공되면 제어 컴포넌트로 동작한다', () => {
      const ControlledCheckbox = () => {
        const [checked, setChecked] = useState(false);
        return (
          <Checkbox
            label="동의"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
          />
        );
      };

      render(<ControlledCheckbox />);
      const checkbox = screen.getByRole('checkbox');

      expect(checkbox).not.toBeChecked();

      fireEvent.click(checkbox);
      expect(checkbox).toBeChecked();

      fireEvent.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });

    it('indeterminate와 checked가 함께 있을 때 indeterminate가 우선한다', () => {
      render(
        <Checkbox label="동의" checked indeterminate onChange={() => {}} />
      );
      const checkbox = screen.getByRole('checkbox') as HTMLInputElement;

      expect(checkbox.checked).toBe(true);
      expect(checkbox.indeterminate).toBe(true);
    });
  });

  describe('GSAP 모션 테스트 (Task 6)', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('unchecked → checked에서 dashoffset이 길이에서 0으로 가는 트윈이 생긴다', () => {
      const { container, rerender } = render(
        <Checkbox label="동의" checked={false} onChange={() => {}} />
      );
      rerender(<Checkbox label="동의" checked onChange={() => {}} />);

      const path = getMarkPath(container);
      const tween = path.__markTween;
      expect(tween).toBeDefined();
      expect(tween?.parent).not.toBeNull();

      expect(Number(path.style.strokeDashoffset)).toBeGreaterThan(0);
      tween?.progress(1);
      expect(Number(path.style.strokeDashoffset)).toBe(0);
    });

    it('checked → indeterminate 전이는 morphSVG이고, 중간 progress의 d가 양 끝과 모두 다르다', () => {
      const { container, rerender } = render(
        <Checkbox label="동의" checked onChange={() => {}} />
      );
      const path = getMarkPath(container);
      const startD = path.getAttribute('d');

      rerender(
        <Checkbox label="동의" checked indeterminate onChange={() => {}} />
      );
      const tween = path.__markTween;
      expect(tween).toBeDefined();

      tween?.progress(0.5);
      const midD = path.getAttribute('d');
      expect(midD).not.toBe(startD);
      expect(midD).not.toBe('M5 12 L19 12');

      tween?.progress(1);
      expect(path.getAttribute('d')).toBe('M5 12 L19 12');
    });

    it('3상태를 빠르게 연타해도 최종 d가 정확히 목표 문자열과 일치한다', () => {
      const { container, rerender } = render(
        <Checkbox label="동의" checked={false} onChange={() => {}} />
      );

      rerender(<Checkbox label="동의" checked onChange={() => {}} />);
      rerender(
        <Checkbox label="동의" checked indeterminate onChange={() => {}} />
      );
      rerender(<Checkbox label="동의" checked onChange={() => {}} />);

      const path = getMarkPath(container);
      const tween = path.__markTween;
      tween?.progress(1);

      expect(path.getAttribute('d')).toBe('M5 13 L9 17 L19 7');
    });

    it('축소 선호에서는 진행 중 트윈 없이 최종 상태로 곧장 정지한다', () => {
      installReducedMotion();
      const { container, rerender } = render(
        <Checkbox label="동의" checked={false} onChange={() => {}} />
      );

      rerender(<Checkbox label="동의" checked onChange={() => {}} />);

      const path = getMarkPath(container);
      expect(path.__markTween).toBeUndefined();
      expect(path.getAttribute('d')).toBe('M5 13 L9 17 L19 7');
      expect(Number(path.style.strokeDashoffset)).toBe(0);
    });

    it('언마운트 후 인스턴스당 살아 있는 gsap 객체가 0개다', () => {
      const { container, rerender, unmount } = render(
        <Checkbox label="동의" checked={false} onChange={() => {}} />
      );
      rerender(<Checkbox label="동의" checked onChange={() => {}} />);

      const path = getMarkPath(container);
      const tween = path.__markTween;
      expect(tween?.parent).not.toBeNull();

      unmount();

      expect(tween?.parent).toBeNull();
    });

    describe('중단 매트릭스 (Ruling 77 회귀)', () => {
      it('등장(unchecked→checked) 중단 후 퇴장(unchecked)으로 전이하면 완전히 숨은 정준 모양으로 수렴한다', () => {
        const { container, rerender } = render(
          <Checkbox label="동의" checked={false} onChange={() => {}} />
        );

        rerender(<Checkbox label="동의" checked onChange={() => {}} />);
        getMarkPath(container).__markTween?.progress(0.3); // 등장 중단

        rerender(<Checkbox label="동의" checked={false} onChange={() => {}} />);
        const path = getMarkPath(container);
        path.__markTween?.progress(1);

        expect(path.getAttribute('d')).toBe('M5 13 L9 17 L19 7');
        expect(Number(path.style.strokeDasharray)).toBe(19.8);
        expect(Number(path.style.strokeDashoffset)).toBe(19.8);
      });

      it('등장(unchecked→checked) 중단 후 모프(indeterminate)로 전이하면 dashoffset도 0으로 수렴한다', () => {
        const { container, rerender } = render(
          <Checkbox label="동의" checked={false} onChange={() => {}} />
        );

        rerender(<Checkbox label="동의" checked onChange={() => {}} />);
        getMarkPath(container).__markTween?.progress(0.4); // 등장 중단 — dashoffset이 중간값에 걸림

        rerender(
          <Checkbox label="동의" checked indeterminate onChange={() => {}} />
        );
        const path = getMarkPath(container);
        path.__markTween?.progress(1);

        expect(path.getAttribute('d')).toBe('M5 12 L19 12');
        expect(Number(path.style.strokeDasharray)).toBe(14);
        expect(Number(path.style.strokeDashoffset)).toBe(0);
      });

      it('checked↔indeterminate 모프 중단 후 퇴장(unchecked)으로 전이하면 조각 없이 prev 정준 모양으로 수렴한다(Critical-2 회귀)', () => {
        const { container, rerender } = render(
          <Checkbox label="동의" checked={false} onChange={() => {}} />
        );

        rerender(<Checkbox label="동의" checked onChange={() => {}} />);
        getMarkPath(container).__markTween?.progress(1); // checked 완전 착지

        rerender(
          <Checkbox label="동의" checked indeterminate onChange={() => {}} />
        );
        getMarkPath(container).__markTween?.progress(0.5); // 모프 중단

        rerender(<Checkbox label="동의" checked={false} onChange={() => {}} />);
        const path = getMarkPath(container);
        path.__markTween?.progress(1);

        // 중단 시점의 논리 상태는 indeterminate였다 — prev는 checked가 아니라 indeterminate다.
        expect(path.getAttribute('d')).toBe('M5 12 L19 12');
        expect(Number(path.style.strokeDasharray)).toBe(14);
        expect(Number(path.style.strokeDashoffset)).toBe(14);
      });

      it('checked→indeterminate 모프 중단 후 다시 checked로 되돌리면 반대쪽 정준 모양으로 수렴한다', () => {
        const { container, rerender } = render(
          <Checkbox label="동의" checked={false} onChange={() => {}} />
        );

        rerender(<Checkbox label="동의" checked onChange={() => {}} />);
        getMarkPath(container).__markTween?.progress(1);

        rerender(
          <Checkbox label="동의" checked indeterminate onChange={() => {}} />
        );
        getMarkPath(container).__markTween?.progress(0.4); // 모프 중단

        rerender(<Checkbox label="동의" checked onChange={() => {}} />); // 반대 방향 모프
        const path = getMarkPath(container);
        path.__markTween?.progress(1);

        expect(path.getAttribute('d')).toBe('M5 13 L9 17 L19 7');
        expect(Number(path.style.strokeDasharray)).toBe(19.8);
        expect(Number(path.style.strokeDashoffset)).toBe(0);
      });

      it('퇴장(checked→unchecked) 중단 후 다시 checked로 전이하면 등장 목표로 수렴한다', () => {
        const { container, rerender } = render(
          <Checkbox label="동의" checked={false} onChange={() => {}} />
        );

        rerender(<Checkbox label="동의" checked onChange={() => {}} />);
        getMarkPath(container).__markTween?.progress(1);

        rerender(<Checkbox label="동의" checked={false} onChange={() => {}} />);
        getMarkPath(container).__markTween?.progress(0.3); // 퇴장 중단

        rerender(<Checkbox label="동의" checked onChange={() => {}} />); // 다시 등장
        const path = getMarkPath(container);
        path.__markTween?.progress(1);

        expect(path.getAttribute('d')).toBe('M5 13 L9 17 L19 7');
        expect(Number(path.style.strokeDasharray)).toBe(19.8);
        expect(Number(path.style.strokeDashoffset)).toBe(0);
      });
    });
  });
});
