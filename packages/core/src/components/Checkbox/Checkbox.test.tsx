import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { createRef, useState } from 'react';
import { Checkbox } from './Checkbox';
import { SQUEEZE, SWELL, progressFrame } from './checkboxProgress';
import { gsapDuration, gsapEasing } from '../../tokens/gsapEasing';
import { themeContract } from '../../tokens/theme.css';

/** `spring` 토큰(`elastic.out(1, 0.5)`)의 정점 1.2044에서 1을 뺀 값. */
const SPRING_OVERSHOOT = 0.2044;

// gsap 네임스페이스는 ambient 전역 타입이라 import 없이 참조된다
// (Snackbar.test.tsx의 CountdownTweenHost와 같은 방식) — 이 파일에서
// `from 'gsap'`가 없어야 gsapGateEnforcement 스캔에 안 걸린다.
type MarkTweenHost = SVGPathElement & { __markTween?: gsap.core.Animation };

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

/** 상자(`checkmark`)와 그 안의 채움 층. 입력 바로 뒤 형제가 상자다. */
const getBox = (container: HTMLElement): HTMLElement =>
  container.querySelector('input + span') as HTMLElement;
const getFill = (container: HTMLElement): HTMLElement =>
  getBox(container).firstElementChild as HTMLElement;

/** 인라인 `transform: scale(n)`의 n. */
const scaleOf = (el: HTMLElement): number =>
  Number(/scale\(([^)]+)\)/.exec(el.style.transform)?.[1]);

/**
 * 진입·해제 타임라인의 자식: 진행값(채움·부풂) 트윈, 획 트윈, 상자 `s` 둘(움츠림·되튐).
 * 시작 위치로 정렬되는 순서에 기대지 않도록 vars로 찾는다.
 */
const childrenOf = (container: HTMLElement) => {
  const timeline = getMarkPath(container).__markTween as gsap.core.Timeline;
  const all = timeline.getChildren() as gsap.core.Tween[];
  const progress = all.find((c) => c.vars.t !== undefined) as gsap.core.Tween;
  const stroke = all.find(
    (c) => c.vars.strokeDashoffset !== undefined
  ) as gsap.core.Tween;
  const squeeze = all.find((c) => c.vars.s === SQUEEZE) as gsap.core.Tween;
  const rebound = all.find((c) => c.vars.s === 1) as gsap.core.Tween;
  return { timeline, all, progress, stroke, squeeze, rebound };
};

/** 트윈을 0..1로 훑으며 매 걸음의 (채움, 상자, 획) 읽기를 모은다. */
const sweep = (container: HTMLElement) => {
  const tween = getMarkPath(container).__markTween as gsap.core.Animation;
  const fills: number[] = [];
  const boxes: number[] = [];
  const offsets: number[] = [];
  for (let step = 0; step <= 200; step += 1) {
    tween.progress(step / 200);
    fills.push(scaleOf(getFill(container)));
    boxes.push(scaleOf(getBox(container)));
    offsets.push(Number(getMarkPath(container).style.strokeDashoffset));
  }
  return { fills, boxes, offsets };
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

  describe('스프링 (M5 task-16)', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    const mount = (props: { checked: boolean; indeterminate?: boolean }) => (
      <Checkbox label="동의" onChange={() => {}} {...props} />
    );

    it('체크: 진행값이 1로 slower spring 트윈한다', () => {
      const { container, rerender } = render(mount({ checked: false }));
      rerender(mount({ checked: true }));

      const { progress } = childrenOf(container);
      expect(progress.vars.t).toBe(1);
      expect(progress.duration()).toBe(gsapDuration.slower);
      expect(progress.vars.ease).toBe(gsapEasing.spring);
    });

    it('체크: 획은 스프링이 아니라 slow settle로 0까지 그어진다', () => {
      const { container, rerender } = render(mount({ checked: false }));
      rerender(mount({ checked: true }));

      const { stroke } = childrenOf(container);
      expect(stroke.vars.strokeDashoffset).toBe(0);
      expect(stroke.duration()).toBe(gsapDuration.slow);
      expect(stroke.vars.ease).toBe(gsapEasing.settle);
    });

    it('체크 타임라인은 자식 넷: 움츠림 0 base drift, 되튐·채움 slower spring과 획 slow settle은 base에서 시작한다', () => {
      const { container, rerender } = render(mount({ checked: false }));
      rerender(mount({ checked: true }));
      const entering = childrenOf(container);
      expect(entering.all).toHaveLength(4);
      expect(entering.squeeze.startTime()).toBe(0);
      expect(entering.squeeze.duration()).toBe(gsapDuration.base);
      expect(entering.squeeze.vars.ease).toBe(gsapEasing.drift);
      expect(entering.squeeze.vars.s).toBe(0.88);
      expect(entering.rebound.startTime()).toBe(gsapDuration.base);
      expect(entering.rebound.duration()).toBe(gsapDuration.slower);
      expect(entering.rebound.vars.ease).toBe(gsapEasing.spring);
      expect(entering.progress.startTime()).toBe(gsapDuration.base);
      expect(entering.progress.vars.t).toBe(1);
      expect(entering.progress.duration()).toBe(gsapDuration.slower);
      expect(entering.progress.vars.ease).toBe(gsapEasing.spring);
      expect(entering.stroke.startTime()).toBe(gsapDuration.base);
      expect(entering.stroke.vars.strokeDashoffset).toBe(0);
      expect(entering.stroke.duration()).toBe(gsapDuration.slow);
      expect(entering.stroke.vars.ease).toBe(gsapEasing.settle);
    });

    it('해제 타임라인: 채움·획은 위치 0 slow x 0.65 exit 그대로, 움츠림 0, 되튐 base', () => {
      const { container, rerender } = render(mount({ checked: true }));
      rerender(mount({ checked: false }));

      rerender(mount({ checked: false }));
      const leaving = childrenOf(container);
      expect(leaving.all).toHaveLength(4);
      expect(leaving.progress.startTime()).toBe(0);
      expect(leaving.stroke.startTime()).toBe(0);
      expect(leaving.squeeze.startTime()).toBe(0);
      expect(leaving.rebound.startTime()).toBe(gsapDuration.base);
      expect(leaving.progress.duration()).toBeCloseTo(
        gsapDuration.slow * 0.65,
        10
      );
      expect(leaving.progress.vars.ease).toBe(gsapEasing.exit);
      expect(leaving.stroke.duration()).toBeCloseTo(
        gsapDuration.slow * 0.65,
        10
      );
      expect(leaving.stroke.vars.ease).toBe(gsapEasing.exit);
    });

    it('체크 도중 획은 t의 스프링을 따르지 않는다(획이 t보다 먼저 끝나지 않는다)', () => {
      const { container, rerender } = render(mount({ checked: false }));
      rerender(mount({ checked: true }));

      const { timeline } = childrenOf(container);
      // 채움·획이 시작한 뒤 길이의 16%(약 48ms)에서 스프링 t는 1을 지났지만 settle 획은 아직 그어지는 중이다.
      timeline.time(gsapDuration.base + gsapDuration.slow * 0.16);
      expect(
        Number(getMarkPath(container).style.strokeDashoffset)
      ).toBeGreaterThan(19.8 * 0.2);
    });

    it('해제: 진행값과 획 모두 slow x 0.65 exit로 간다', () => {
      const { container, rerender } = render(mount({ checked: true }));
      rerender(mount({ checked: false }));

      const { progress, stroke } = childrenOf(container);
      expect(progress.vars.t).toBe(0);
      expect(progress.duration()).toBeCloseTo(gsapDuration.slow * 0.65, 10);
      expect(progress.vars.ease).toBe(gsapEasing.exit);
      expect(stroke.vars.strokeDashoffset).toBe(19.8);
      expect(stroke.duration()).toBeCloseTo(gsapDuration.slow * 0.65, 10);
      expect(stroke.vars.ease).toBe(gsapEasing.exit);
    });

    it('모프 도중 해제하면 d와 dasharray를 즉시 확정하지 않고 해제 타임라인이 같이 트윈한다', () => {
      const { container, rerender } = render(mount({ checked: true }));
      rerender(mount({ checked: true, indeterminate: true }));
      const path = getMarkPath(container);
      path.__markTween?.progress(0.1);
      const midD = path.getAttribute('d');
      expect(midD).not.toBe('M5 12 L19 12');

      rerender(mount({ checked: false }));

      expect(path.getAttribute('d')).toBe(midD);
      const { stroke } = childrenOf(container);
      expect(stroke.vars.morphSVG).toBe('M5 12 L19 12');
      expect(stroke.vars.strokeDasharray).toBe(14);
      expect(stroke.duration()).toBeCloseTo(gsapDuration.slow * 0.65, 10);
      expect(stroke.vars.ease).toBe(gsapEasing.exit);

      path.__markTween?.progress(1);
      expect(path.getAttribute('d')).toBe('M5 12 L19 12');
      expect(Number(path.style.strokeDashoffset)).toBe(14);
    });

    it('indeterminate 진입도 체크와 같은 트윈이고 획은 대시 path다', () => {
      const { container, rerender } = render(mount({ checked: false }));
      rerender(mount({ checked: false, indeterminate: true }));

      const path = getMarkPath(container);
      const { timeline, progress, stroke } = childrenOf(container);
      expect(progress.vars.t).toBe(1);
      expect(progress.duration()).toBe(gsapDuration.slower);
      expect(progress.vars.ease).toBe(gsapEasing.spring);
      expect(stroke.vars.ease).toBe(gsapEasing.settle);
      expect(path.getAttribute('d')).toBe('M5 12 L19 12');
      expect(Number(path.style.strokeDashoffset)).toBe(14);

      timeline.progress(1);
      expect(Number(path.style.strokeDashoffset)).toBe(0);
    });

    it('체크를 훑으면 채움은 1을 넘고 상자는 움츠렸다가 최대 약 1.098배까지 부풀며 획은 음수가 되지 않는다', () => {
      const { container, rerender } = render(mount({ checked: false }));
      rerender(mount({ checked: true }));

      const { fills, boxes, offsets } = sweep(container);
      expect(Math.max(...fills)).toBeGreaterThan(1.15);
      expect(Math.max(...boxes)).toBeCloseTo(1.098, 2);
      expect(Math.min(...boxes)).toBeLessThan(0.9);
      expect(Math.min(...boxes)).toBeGreaterThan(0.87);
      expect(Math.min(...offsets)).toBe(0);
      expect(fills.at(-1)).toBe(1);
      expect(boxes.at(-1)).toBe(1);
      expect(offsets.at(-1)).toBe(0);
    });

    it('해제를 훑으면 채움이 0으로 줄고 상자는 안으로 움츠렸다 돌아오며 획은 길이로 돌아온다', () => {
      const { container, rerender } = render(mount({ checked: true }));
      rerender(mount({ checked: false }));

      const { fills, boxes, offsets } = sweep(container);
      expect(Math.min(...boxes)).toBeLessThan(0.9);
      expect(Math.min(...boxes)).toBeGreaterThan(0.87);
      expect(Math.max(...boxes)).toBeLessThan(1.03);
      expect(Math.max(...fills)).toBeLessThanOrEqual(1);
      expect(Math.min(...fills)).toBe(0);
      expect(Math.max(...offsets)).toBe(19.8);
      expect(fills.at(-1)).toBe(0);
      expect(boxes.at(-1)).toBe(1);
      expect(offsets.at(-1)).toBe(19.8);
    });

    it('해제: 상자 s가 SQUEEZE로 base drift 움츠린 뒤 1로 slower spring 되튄다', () => {
      const { container, rerender } = render(mount({ checked: true }));
      rerender(mount({ checked: false }));

      const { all, squeeze, rebound } = childrenOf(container);
      expect(all).toHaveLength(4);
      expect(squeeze.vars.s).toBe(0.88);
      expect(squeeze.duration()).toBe(gsapDuration.base);
      expect(squeeze.vars.ease).toBe(gsapEasing.drift);
      expect(squeeze.startTime()).toBe(0);
      expect(rebound.vars.s).toBe(1);
      expect(rebound.duration()).toBe(gsapDuration.slower);
      expect(rebound.vars.ease).toBe(gsapEasing.spring);
      expect(rebound.startTime()).toBe(
        squeeze.startTime() + squeeze.duration()
      );
    });

    it('움츠림 끝에서 상자는 0.88배이고 채움·획은 해제를 따로 간다', () => {
      const { container, rerender } = render(mount({ checked: true }));
      rerender(mount({ checked: false }));

      const { timeline } = childrenOf(container);
      timeline.time(gsapDuration.base);
      expect(scaleOf(getBox(container))).toBeCloseTo(0.88, 3);
    });

    it('SQUEEZE는 0.88 독립 상수이고 체크 정점 증가분과 짝이 아니다', () => {
      expect(SQUEEZE).toBe(0.88);
      expect(1 - SQUEEZE).toBeGreaterThan(SWELL * SPRING_OVERSHOOT);
    });

    it('합성 정점: t와 s가 같은 spring 정점에 동시에 닿으면 상자 정점이 약 1.098배다', () => {
      // t는 1 + SPRING_OVERSHOOT, s는 SQUEEZE에서 1로 가는 같은 커브라 SQUEEZE + (1 - SQUEEZE) × 같은 값.
      const peak = 1 + SPRING_OVERSHOOT;
      const apex = progressFrame(peak, SQUEEZE + (1 - SQUEEZE) * peak).box;
      expect(Math.abs(apex - 1.098)).toBeLessThan(0.005);
    });

    it('움츠린 채(해제 도중) 체크하면 움츠림은 거의 움직이지 않고 되튐이 지금 값에서 시작한다', () => {
      const { container, rerender } = render(mount({ checked: true }));
      rerender(mount({ checked: false }));
      (getMarkPath(container).__markTween as gsap.core.Timeline).time(
        gsapDuration.base
      );
      const squeezed = scaleOf(getBox(container));
      expect(squeezed).toBeCloseTo(SQUEEZE, 3);

      rerender(mount({ checked: true }));
      const { timeline } = childrenOf(container);
      timeline.time(gsapDuration.base / 2);
      expect(scaleOf(getBox(container))).toBeCloseTo(SQUEEZE, 1);
      timeline.progress(1);
      expect(scaleOf(getBox(container))).toBe(1);
    });

    it('checked → indeterminate는 모양 바뀜 타임라인 하나이고 진행값·상자 트윈이 없다', () => {
      const { container, rerender } = render(mount({ checked: true }));
      rerender(mount({ checked: true, indeterminate: true }));

      const path = getMarkPath(container);
      const { timeline, all } = childrenOf(container);
      expect(all).toHaveLength(1);
      timeline.progress(0.5);
      expect(scaleOf(getFill(container))).toBe(1);
      expect(getBox(container).style.transform).toBe('');
      expect(Number(path.style.strokeDashoffset)).toBe(0);
    });

    it('indeterminate → checked도 같다', () => {
      const { container, rerender } = render(
        mount({ checked: true, indeterminate: true })
      );
      rerender(mount({ checked: true }));

      expect(childrenOf(container).all).toHaveLength(1);
    });

    it('진입이 중단된 채 모프로 넘어오면 같은 타임라인이 t와 s도 1로 데려간다', () => {
      const { container, rerender } = render(mount({ checked: false }));
      rerender(mount({ checked: true }));
      (getMarkPath(container).__markTween as gsap.core.Timeline).time(
        gsapDuration.base + gsapDuration.slow * 0.02
      );
      expect(scaleOf(getFill(container))).toBeGreaterThan(0);
      expect(scaleOf(getFill(container))).toBeLessThan(1);

      rerender(mount({ checked: true, indeterminate: true }));
      const { timeline, all } = childrenOf(container);
      expect(all.filter((c) => c.vars.t === 1)).toHaveLength(1);
      expect(all.filter((c) => c.vars.s === 1)).toHaveLength(1);
      timeline.progress(1);
      expect(scaleOf(getFill(container))).toBe(1);
      expect(scaleOf(getBox(container))).toBe(1);
    });

    it('부풂 한가운데서 모프로 넘어와도 상자는 1로 돌아온다', () => {
      const { container, rerender } = render(mount({ checked: false }));
      rerender(mount({ checked: true }));
      const tween = getMarkPath(container).__markTween;
      // spring 정점 근처로 seek해 t가 1을 넘은 자리에서 멈춘다.
      for (let step = 0; step <= 200; step += 1) {
        tween?.progress(step / 200);
        if (scaleOf(getBox(container)) > 1.06) break;
      }
      expect(scaleOf(getBox(container))).toBeGreaterThan(1.06);

      rerender(mount({ checked: true, indeterminate: true }));
      getMarkPath(container).__markTween?.progress(1);
      expect(scaleOf(getBox(container))).toBe(1);
    });

    it('움츠림 도중(체크 후 fast의 절반) 모프로 넘어와도 상자는 1로 돌아온다', () => {
      const { container, rerender } = render(mount({ checked: false }));
      rerender(mount({ checked: true }));
      (getMarkPath(container).__markTween as gsap.core.Timeline).time(
        gsapDuration.base / 2
      );
      expect(scaleOf(getBox(container))).toBeLessThan(0.95);

      rerender(mount({ checked: true, indeterminate: true }));
      const { all, timeline } = childrenOf(container);
      const restore = all.find((c) => c.vars.s === 1) as gsap.core.Tween;
      expect(restore.startTime()).toBe(0);
      expect(restore.duration()).toBe(gsapDuration.base);
      expect(restore.vars.ease).toBe(gsapEasing.settle);
      timeline.progress(1);
      expect(scaleOf(getBox(container))).toBe(1);
    });

    it('되튐 도중(체크 후 base 뒤 96ms) 모프로 넘어와도 상자는 1로 돌아온다', () => {
      const { container, rerender } = render(mount({ checked: false }));
      rerender(mount({ checked: true }));
      (getMarkPath(container).__markTween as gsap.core.Timeline).time(
        gsapDuration.base + 0.096
      );
      expect(scaleOf(getBox(container))).not.toBe(1);

      rerender(mount({ checked: true, indeterminate: true }));
      getMarkPath(container).__markTween?.progress(1);
      expect(scaleOf(getBox(container))).toBe(1);
    });

    it('해제가 끝난 뒤 되튐 중에 다른 모양으로 진입하면 획을 새 길이로 다시 가린다', () => {
      const { container, rerender } = render(mount({ checked: true }));
      rerender(mount({ checked: false }));
      // 획 지우기(195ms)는 끝났고 상자 되튐으로 타임라인은 아직 산다.
      (getMarkPath(container).__markTween as gsap.core.Timeline).time(0.3);
      expect(getMarkPath(container).__markTween).toBeDefined();
      expect(Number(getMarkPath(container).style.strokeDashoffset)).toBe(19.8);

      rerender(mount({ checked: false, indeterminate: true }));
      const path = getMarkPath(container);
      expect(Number(path.style.strokeDasharray)).toBe(14);
      expect(Number(path.style.strokeDashoffset)).toBe(14);
    });

    it('진행 중 반대로 바뀌면 이전 트윈이 죽고 하나만 산다', () => {
      const { container, rerender } = render(mount({ checked: false }));
      rerender(mount({ checked: true }));
      const path = getMarkPath(container);
      const first = path.__markTween as gsap.core.Timeline;
      first.progress(0.3);
      expect(first.parent).not.toBeNull();

      rerender(mount({ checked: false }));
      const second = childrenOf(container);
      expect(second.timeline).not.toBe(first);
      expect(first.parent).toBeNull();
      expect(second.timeline.parent).not.toBeNull();
      expect(second.progress.vars.t).toBe(0);
      expect(second.stroke.vars.strokeDashoffset).toBe(19.8);
    });

    it('반대로 바뀔 때 지금 값에서 이어진다(되감기 아님)', () => {
      const { container, rerender } = render(mount({ checked: false }));
      rerender(mount({ checked: true }));
      (getMarkPath(container).__markTween as gsap.core.Timeline).time(
        gsapDuration.base + gsapDuration.slower * 0.02
      );
      const fillBefore = scaleOf(getFill(container));
      const offsetBefore = getMarkPath(container).style.strokeDashoffset;
      expect(fillBefore).toBeGreaterThan(0);
      expect(fillBefore).toBeLessThan(1);
      expect(Number(offsetBefore)).toBeGreaterThan(0);
      expect(Number(offsetBefore)).toBeLessThan(19.8);

      rerender(mount({ checked: false }));
      expect(scaleOf(getFill(container))).toBe(fillBefore);
      expect(getMarkPath(container).style.strokeDashoffset).toBe(offsetBefore);

      // 획 트윈이 지금 dashoffset에서 출발해 길이로 간다(0에서 다시 시작하지 않는다).
      const { timeline } = childrenOf(container);
      timeline.time(0.001);
      expect(Number(getMarkPath(container).style.strokeDashoffset)).toBeCloseTo(
        Number(offsetBefore),
        0
      );
      timeline.progress(1);
      expect(Number(getMarkPath(container).style.strokeDashoffset)).toBe(19.8);
    });

    it('마운트에서는 트윈이 없고 처음 상태가 마크업에 박혀 있다', () => {
      const off = render(mount({ checked: false }));
      expect(getMarkPath(off.container).__markTween).toBeUndefined();
      expect(getFill(off.container).style.transform).toBe('scale(0)');
      expect(Number(getMarkPath(off.container).style.strokeDashoffset)).toBe(
        19.8
      );
      off.unmount();

      const on = render(mount({ checked: true }));
      expect(getMarkPath(on.container).__markTween).toBeUndefined();
      expect(getFill(on.container).style.transform).toBe('scale(1)');
      expect(Number(getMarkPath(on.container).style.strokeDashoffset)).toBe(0);
      on.unmount();

      const dash = render(mount({ checked: false, indeterminate: true }));
      expect(getMarkPath(dash.container).__markTween).toBeUndefined();
      expect(getFill(dash.container).style.transform).toBe('scale(1)');
    });

    it('채움 층은 aria-hidden이고 상자 안 첫 자식이며 체크 svg보다 앞이다', () => {
      const { container } = render(mount({ checked: false }));
      const fill = getFill(container);
      expect(fill).toHaveAttribute('aria-hidden', 'true');
      expect(fill.nextElementSibling?.tagName.toLowerCase()).toBe('svg');
    });

    it('키보드(Space)로 바꿔도 애니메이션한다', async () => {
      const { container } = render(<Checkbox label="동의" />);
      screen.getByRole('checkbox').focus();
      await userEvent.keyboard(' ');

      const { timeline, progress } = childrenOf(container);
      expect(timeline).toBeDefined();
      expect(progress.vars.t).toBe(1);
      expect(progress.vars.ease).toBe(gsapEasing.spring);
    });

    it('축소 선호에서는 체크가 즉시 끝 상태다(채움 1, 상자 1, 획 끝)', () => {
      installReducedMotion();
      const { container, rerender } = render(mount({ checked: false }));
      rerender(mount({ checked: true }));

      expect(getMarkPath(container).__markTween).toBeUndefined();
      expect(scaleOf(getFill(container))).toBe(1);
      expect(scaleOf(getBox(container))).toBe(1);
      expect(Number(getMarkPath(container).style.strokeDashoffset)).toBe(0);
    });

    it('축소 선호에서는 해제도 즉시 끝 상태다(채움 0, 상자 1, 획 가림)', () => {
      installReducedMotion();
      const { container, rerender } = render(mount({ checked: true }));
      rerender(mount({ checked: false }));

      expect(getMarkPath(container).__markTween).toBeUndefined();
      expect(scaleOf(getFill(container))).toBe(0);
      expect(scaleOf(getBox(container))).toBe(1);
      expect(Number(getMarkPath(container).style.strokeDashoffset)).toBe(19.8);
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

      it('퇴장(checked→unchecked) 중단 후 다시 checked로 전이하면 등장 목표로 수렴하고 현재 위치에서 이어진다(1조 ③)', () => {
        const { container, rerender } = render(
          <Checkbox label="동의" checked={false} onChange={() => {}} />
        );

        rerender(<Checkbox label="동의" checked onChange={() => {}} />);
        getMarkPath(container).__markTween?.progress(1);

        rerender(<Checkbox label="동의" checked={false} onChange={() => {}} />);
        getMarkPath(container).__markTween?.progress(0.15); // 퇴장 중단(타임라인 700ms 중 약 105ms, 획 지우기 195ms 도중)

        rerender(<Checkbox label="동의" checked onChange={() => {}} />); // 다시 등장
        const path = getMarkPath(container);

        const resumed = Number(path.style.strokeDashoffset);
        expect(resumed).toBeGreaterThan(0);
        expect(resumed).toBeLessThan(19.8); // 19.8 = 되감긴 값

        path.__markTween?.progress(1);

        expect(path.getAttribute('d')).toBe('M5 13 L9 17 L19 7');
        expect(Number(path.style.strokeDasharray)).toBe(19.8);
        expect(Number(path.style.strokeDashoffset)).toBe(0);
      });
    });
  });
});

/** vanilla-extract가 실제로 만든 CSS(jsdom에 주입된 <style>)를 CSSOM으로 읽는다. */
const checkboxRules = (): CSSStyleRule[] => {
  const sheet = Array.from(document.styleSheets).find((candidate) =>
    Array.from(candidate.cssRules).some((rule) =>
      rule.cssText.includes('Checkbox_checkmark')
    )
  );
  if (!sheet) throw new Error('Checkbox 스타일시트를 찾지 못했다');
  return Array.from(sheet.cssRules).filter(
    (rule): rule is CSSStyleRule => rule instanceof CSSStyleRule
  );
};

describe('Checkbox 생성 CSS (M5 task-16)', () => {
  const own = (className: string) =>
    checkboxRules().find((rule) =>
      new RegExp(`^\\.Checkbox_${className}__\\w+$`).test(rule.selectorText)
    );

  it('채움 층은 상자 가운데 원점에서 상자를 덮고 모서리를 물려받는다', () => {
    const fill = own('markFill');
    expect(fill).toBeDefined();
    expect(fill?.style.getPropertyValue('position')).toBe('absolute');
    expect(fill?.style.getPropertyValue('transform-origin')).toBe('center');
    expect(fill?.style.getPropertyValue('border-radius')).toBe('inherit');
  });

  it('채움은 테두리 두께만큼 바깥으로 깔려 padding box 모서리를 빈틈없이 덮는다', () => {
    const border = own('checkmark')?.style.getPropertyValue('border');
    const width = border?.match(/^(\d+)px/)?.[1];
    expect(width).toBeDefined();
    expect(own('markFill')?.style.getPropertyValue('inset')).toBe(
      `-${width}px`
    );
  });

  it('상자는 overflow hidden으로 채움의 넘침을 자른다', () => {
    expect(own('checkmark')?.style.getPropertyValue('overflow')).toBe('hidden');
  });

  it('상자 자신의 배경색은 체크·indeterminate·비활성 체크로 바뀌지 않는다', () => {
    const stateRules = checkboxRules().filter(
      (rule) =>
        rule.selectorText.includes('Checkbox_checkmark') &&
        /:checked|:indeterminate/.test(rule.selectorText)
    );
    expect(stateRules.length).toBeGreaterThan(0);
    for (const rule of stateRules) {
      expect(
        rule.style.getPropertyValue('background-color'),
        rule.selectorText
      ).toBe('');
    }
  });

  it('채움 색은 체크 여부를 따르지 않는다(해제 중에도 색을 지킨다), 비활성만 다르다', () => {
    const fillRules = checkboxRules().filter((rule) =>
      rule.selectorText.includes('Checkbox_markFill')
    );
    for (const rule of fillRules) {
      expect(rule.selectorText).not.toMatch(/:checked|:indeterminate/);
    }
    const disabled = fillRules.find((rule) =>
      rule.selectorText.includes('input:disabled')
    );
    expect(disabled?.style.getPropertyValue('background-color')).toBe(
      themeContract.color.text.disabled
    );
    expect(own('markFill')?.style.getPropertyValue('background-color')).toBe(
      themeContract.color.primary.main
    );
  });
});
