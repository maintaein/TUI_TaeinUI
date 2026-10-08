import { describe, it, expect, vi, afterEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { createRef, useState } from 'react';
import { Switch } from './Switch';
import { themeContract } from '../../tokens/theme.css';
import { gsapDuration, gsapEasing } from '../../tokens/gsapEasing';
import { ON_SCALE } from './switchMotion';

describe('Switch', () => {
  describe('렌더링 테스트', () => {
    it('기본 switch를 렌더링한다', () => {
      render(<Switch label="알림 허용" />);
      const switchElement = screen.getByRole('switch', { name: '알림 허용' });
      expect(switchElement).toBeInTheDocument();
    });

    it('checked 상태를 렌더링한다', () => {
      render(<Switch label="활성화" checked onChange={() => {}} />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toBeChecked();
    });

    it('unchecked 상태를 렌더링한다', () => {
      render(<Switch label="비활성화" />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).not.toBeChecked();
    });
  });

  describe('size prop 테스트', () => {
    it('sm size를 적용한다', () => {
      render(<Switch label="작은 스위치" size="sm" />);
      const switchElement = screen.getByRole('switch');
      const thumb = switchElement.nextElementSibling;
      expect(thumb?.className).toContain('thumbSize_sm');
    });

    it('md size를 적용한다 (기본값)', () => {
      render(<Switch label="중간 스위치" />);
      const switchElement = screen.getByRole('switch');
      const thumb = switchElement.nextElementSibling;
      expect(thumb?.className).toContain('thumbSize_md');
    });

    it('lg size를 적용한다', () => {
      render(<Switch label="큰 스위치" size="lg" />);
      const switchElement = screen.getByRole('switch');
      const thumb = switchElement.nextElementSibling;
      expect(thumb?.className).toContain('thumbSize_lg');
    });
  });

  describe('상태 prop 테스트', () => {
    it('disabled 상태를 적용한다', () => {
      render(<Switch label="비활성 스위치" disabled />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toBeDisabled();
    });

    it('required 상태를 적용한다', () => {
      render(<Switch label="필수 스위치" required />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toBeRequired();
      expect(screen.getByText('*')).toBeInTheDocument();
    });
  });

  describe('error prop 테스트', () => {
    it('error 상태를 적용한다', () => {
      render(<Switch label="에러 스위치" error />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('aria-invalid', 'true');
    });

    it('errorMessage를 표시한다', () => {
      render(<Switch label="스위치" error errorMessage="필수 항목입니다" />);
      expect(screen.getByText('필수 항목입니다')).toBeInTheDocument();
    });

    it('error가 없으면 errorMessage를 표시하지 않는다', () => {
      render(<Switch label="스위치" errorMessage="에러" />);
      expect(screen.queryByText('에러')).not.toBeInTheDocument();
    });
  });

  describe('helperText prop 테스트', () => {
    it('helperText를 표시한다', () => {
      render(
        <Switch label="스위치" helperText="알림을 받으려면 활성화하세요" />
      );
      expect(
        screen.getByText('알림을 받으려면 활성화하세요')
      ).toBeInTheDocument();
    });

    it('error가 있으면 helperText를 표시하지 않는다', () => {
      render(
        <Switch label="스위치" helperText="도움말" error errorMessage="에러" />
      );
      expect(screen.queryByText('도움말')).not.toBeInTheDocument();
      expect(screen.getByText('에러')).toBeInTheDocument();
    });
  });

  describe('이벤트 핸들러 테스트', () => {
    it('onChange 이벤트를 호출한다', async () => {
      const handleChange = vi.fn();
      render(<Switch label="스위치" onChange={handleChange} />);
      const switchElement = screen.getByRole('switch');

      await userEvent.click(switchElement);
      expect(handleChange).toHaveBeenCalledTimes(1);
    });

    it('label 클릭 시 onChange를 호출한다', async () => {
      const handleChange = vi.fn();
      render(<Switch label="스위치" onChange={handleChange} />);
      const label = screen.getByText('스위치');

      await userEvent.click(label);
      expect(handleChange).toHaveBeenCalledTimes(1);
    });

    it('disabled 상태에서는 onChange가 호출되지 않는다', async () => {
      const handleChange = vi.fn();
      render(<Switch label="스위치" disabled onChange={handleChange} />);
      const switchElement = screen.getByRole('switch');

      await userEvent.click(switchElement).catch(() => {});
      expect(handleChange).not.toHaveBeenCalled();
    });

    it('onFocus 이벤트를 호출한다', async () => {
      const handleFocus = vi.fn();
      render(<Switch label="스위치" onFocus={handleFocus} />);
      const switchElement = screen.getByRole('switch');

      await userEvent.click(switchElement);
      expect(handleFocus).toHaveBeenCalled();
    });

    it('onBlur 이벤트를 호출한다', async () => {
      const handleBlur = vi.fn();
      render(<Switch label="스위치" onBlur={handleBlur} />);
      const switchElement = screen.getByRole('switch');

      switchElement.focus();
      switchElement.blur();
      expect(handleBlur).toHaveBeenCalled();
    });
  });

  describe('ref 전달 테스트', () => {
    it('forwardRef로 ref를 전달한다', () => {
      const ref = createRef<HTMLInputElement>();
      render(<Switch label="스위치" ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
      expect(ref.current?.type).toBe('checkbox');
    });

    it('ref를 통해 focus를 호출할 수 있다', () => {
      const ref = createRef<HTMLInputElement>();
      render(<Switch label="스위치" ref={ref} />);
      ref.current?.focus();
      expect(ref.current).toHaveFocus();
    });

    it('ref를 통해 checked 상태를 확인할 수 있다', () => {
      const ref = createRef<HTMLInputElement>();
      render(<Switch label="스위치" checked onChange={() => {}} ref={ref} />);
      expect(ref.current?.checked).toBe(true);
    });
  });

  describe('접근성 테스트', () => {
    it('role="switch"를 가진다', () => {
      render(<Switch label="스위치" />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toBeInTheDocument();
    });

    it('aria-checked 속성을 올바르게 설정한다', () => {
      const { rerender } = render(
        <Switch label="스위치" checked={false} onChange={() => {}} />
      );
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('aria-checked', 'false');

      rerender(<Switch label="스위치" checked onChange={() => {}} />);
      expect(switchElement).toHaveAttribute('aria-checked', 'true');
    });

    it('aria-disabled 속성을 설정한다', () => {
      render(<Switch label="스위치" disabled />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('aria-disabled', 'true');
    });

    it('aria-invalid를 error 상태에서 설정한다', () => {
      render(<Switch label="스위치" error />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('aria-invalid', 'true');
    });

    it('aria-describedby를 helperText와 연결한다', () => {
      render(<Switch label="스위치" helperText="도움말 텍스트" />);
      const switchElement = screen.getByRole('switch');
      const describedBy = switchElement.getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();
      expect(screen.getByText('도움말 텍스트')).toHaveAttribute(
        'id',
        describedBy
      );
    });

    it('aria-describedby를 errorMessage와 연결한다', () => {
      render(<Switch label="스위치" error errorMessage="에러 메시지" />);
      const switchElement = screen.getByRole('switch');
      const describedBy = switchElement.getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();
      expect(screen.getByText('에러 메시지')).toHaveAttribute(
        'id',
        describedBy
      );
    });

    it('label과 input이 올바르게 연결된다', () => {
      render(<Switch label="테스트 스위치" />);
      const switchElement = screen.getByRole('switch');
      const labelElement = screen.getByText('테스트 스위치');
      expect(switchElement.id).toBeTruthy();
      expect(labelElement.closest('label')).toHaveAttribute(
        'for',
        switchElement.id
      );
    });
  });

  describe('키보드 인터랙션 테스트', () => {
    it('Space 키로 토글할 수 있다', async () => {
      const handleChange = vi.fn();
      render(<Switch label="스위치" onChange={handleChange} />);
      const switchElement = screen.getByRole('switch');

      switchElement.focus();
      await userEvent.keyboard(' ');
      expect(handleChange).toHaveBeenCalledTimes(1);
    });

    it('Tab 키로 포커스를 이동할 수 있다', async () => {
      render(
        <div>
          <Switch label="스위치 1" />
          <Switch label="스위치 2" />
        </div>
      );

      await userEvent.tab();
      expect(screen.getByRole('switch', { name: '스위치 1' })).toHaveFocus();

      await userEvent.tab();
      expect(screen.getByRole('switch', { name: '스위치 2' })).toHaveFocus();
    });
  });

  describe('엣지 케이스 테스트', () => {
    it('label이 없으면 개발 환경에서 경고한다', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      render(<Switch label="" />);

      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining('Switch: label prop은 필수입니다')
      );

      process.env.NODE_ENV = originalEnv;
      consoleError.mockRestore();
    });

    it('value와 onChange가 동시에 제공되면 제어 컴포넌트로 동작한다', () => {
      const ControlledSwitch = () => {
        const [checked, setChecked] = useState(false);
        return (
          <Switch
            label="제어 스위치"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
          />
        );
      };

      render(<ControlledSwitch />);
      const switchElement = screen.getByRole('switch');

      expect(switchElement).not.toBeChecked();

      fireEvent.click(switchElement);
      expect(switchElement).toBeChecked();

      fireEvent.click(switchElement);
      expect(switchElement).not.toBeChecked();
    });

    it('className prop을 전달할 수 있다', () => {
      render(<Switch label="스위치" className="custom-class" />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveClass('custom-class');
    });
  });

  describe('GSAP 모션 테스트 (Task 6)', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    // gsap 네임스페이스는 ambient 전역 타입이라 import 없이 참조된다
    // (Checkbox.test.tsx·Snackbar.test.tsx와 같은 방식) — 이 파일에서
    // `from 'gsap'`가 없어야 gsapGateEnforcement 스캔에 안 걸린다.
    type SwitchTimelineHost = HTMLDivElement & {
      __switchTimeline?: gsap.core.Timeline;
    };

    // 이동 하나의 길이. 켜진 크기 변화는 이동의 80% 시점에 시작한다.
    const MOVE = gsapDuration.slow;

    const getTrack = (switchElement: HTMLElement): SwitchTimelineHost =>
      switchElement.parentElement as SwitchTimelineHost;
    // DOM 순서는 자르는 칸(안에 스윕) → input → 썸이다(칸을 input 앞으로 둬서
    // size prop 테스트의 nextElementSibling=썸 가정을 안 깼다. task-6-report.md 참고).
    const getSweep = (switchElement: HTMLElement): HTMLElement =>
      (switchElement.previousElementSibling as HTMLElement)
        .firstElementChild as HTMLElement;
    const getThumb = (switchElement: HTMLElement): HTMLElement =>
      switchElement.nextElementSibling as HTMLElement;

    // yPercent(-50)가 "translate(0%, -50%)"로 따로 렌더되고, x는 px 단위의
    // 별도 translate(...)로 렌더된다 — px 표기가 있는 쪽만 집어야 x다.
    // 트윈 도중에는 GPU 합성용 translate3d(...)로 렌더된다.
    const readX = (el: HTMLElement): number => {
      const match = el.style.transform.match(/translate(?:3d)?\(([-\d.]+)px/);
      return match ? Number(match[1]) : 0;
    };
    const readScaleX = (el: HTMLElement): number => {
      const match = el.style.transform.match(/scale[XY]?\(([-\d.]+)/);
      return match ? Number(match[1]) : 1;
    };
    const readScaleY = (el: HTMLElement): number => {
      const match = el.style.transform.match(/scale\(([-\d.]+),\s*([-\d.]+)/);
      return match ? Number(match[2]) : 1;
    };

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

    it('off → on 전이에서 스윕이 scaleX 트윈으로 생기고, 인라인 backgroundColor는 건드리지 않는다(Ruling 42)', () => {
      const { rerender } = render(
        <Switch label="스위치" checked={false} onChange={() => {}} />
      );
      const switchElement = screen.getByRole('switch');
      rerender(<Switch label="스위치" checked onChange={() => {}} />);

      const track = getTrack(switchElement);
      const timeline = track.__switchTimeline;
      expect(timeline).toBeDefined();
      expect(timeline?.parent).not.toBeNull();

      const sweep = getSweep(switchElement);
      expect(sweep.style.backgroundColor).toBe('');
      expect(readScaleX(sweep)).toBe(0);

      timeline?.progress(1);
      expect(readScaleX(sweep)).toBe(1);
    });

    it('on 전이 중 썸이 이동하며 늘었다 끝에서 켜진 크기로 머문다', () => {
      const { rerender } = render(
        <Switch label="스위치" checked={false} onChange={() => {}} />
      );
      const switchElement = screen.getByRole('switch');
      rerender(<Switch label="스위치" checked onChange={() => {}} />);

      const timeline = getTrack(switchElement).__switchTimeline;
      const thumb = getThumb(switchElement);

      timeline?.time(MOVE / 2);
      expect(readScaleX(thumb)).toBeGreaterThan(1);
      expect(readScaleY(thumb)).toBeLessThan(1);

      timeline?.progress(1);
      expect(readScaleX(thumb)).toBeCloseTo(ON_SCALE.md, 10);
      expect(readScaleY(thumb)).toBeCloseTo(ON_SCALE.md, 10);
      expect(readX(thumb)).toBe(18); // md 사이즈의 thumbOffset
    });

    it('on → off 전이는 역재생이 아니라 새로 짠 타임라인이다(Ruling 41): 끝에서 x·스윕이 함께 빠진다', () => {
      const { rerender } = render(
        <Switch label="스위치" checked onChange={() => {}} />
      );
      const switchElement = screen.getByRole('switch');
      rerender(<Switch label="스위치" checked={false} onChange={() => {}} />);

      const track = getTrack(switchElement);
      const timeline = track.__switchTimeline;
      const thumb = getThumb(switchElement);
      const sweep = getSweep(switchElement);

      expect(timeline).toBeDefined();
      timeline?.progress(1);
      expect(readX(thumb)).toBe(0);
      expect(readScaleX(sweep)).toBe(0);
    });

    it('제어되지 않는(uncontrolled) 스위치를 클릭해도 aria-checked가 실제 상태를 따라간다(Ruling 40 회귀)', async () => {
      render(<Switch label="스위치" defaultChecked={false} />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('aria-checked', 'false');

      await userEvent.click(switchElement);
      expect(switchElement).toHaveAttribute('aria-checked', 'true');

      await userEvent.click(switchElement);
      expect(switchElement).toHaveAttribute('aria-checked', 'false');
    });

    it('축소 선호에서는 진행 중 트윈 없이 최종 상태로 곧장 정지한다', () => {
      installReducedMotion();
      const { rerender } = render(
        <Switch label="스위치" checked={false} onChange={() => {}} />
      );
      const switchElement = screen.getByRole('switch');
      rerender(<Switch label="스위치" checked onChange={() => {}} />);

      const track = getTrack(switchElement);
      const thumb = getThumb(switchElement);
      const sweep = getSweep(switchElement);

      expect(track.__switchTimeline).toBeUndefined();
      expect(readScaleX(sweep)).toBe(1);
      expect(readX(thumb)).toBe(18);
      expect(readScaleX(thumb)).toBeCloseTo(ON_SCALE.md, 10);
      expect(readScaleY(thumb)).toBeCloseTo(ON_SCALE.md, 10);
    });

    it('언마운트 후 인스턴스당 살아 있는 gsap 객체가 0개다', () => {
      const { rerender, unmount } = render(
        <Switch label="스위치" checked={false} onChange={() => {}} />
      );
      const switchElement = screen.getByRole('switch');
      rerender(<Switch label="스위치" checked onChange={() => {}} />);

      const track = getTrack(switchElement);
      const timeline = track.__switchTimeline;
      expect(timeline?.parent).not.toBeNull();

      unmount();

      expect(timeline?.parent).toBeNull();
    });

    describe('속도 비례 늘임과 켜진 크기 (M5 task-17)', () => {
      type Tween = gsap.core.Tween;
      // 켜진 크기로 바뀌는 시점: 이동 구간의 80%.
      const SIZE_AT = MOVE * 0.8;

      const children = (switchElement: HTMLElement): Tween[] =>
        (getTrack(switchElement).__switchTimeline?.getChildren() ??
          []) as Tween[];
      const timelineOf = (switchElement: HTMLElement) =>
        getTrack(switchElement).__switchTimeline;
      const moveTween = (switchElement: HTMLElement): Tween =>
        children(switchElement).find((t) => t.vars.p === 1) as Tween;
      const sizeTween = (switchElement: HTMLElement): Tween =>
        children(switchElement).find((t) => t.vars.base !== undefined) as Tween;
      // 늘임 k는 scaleX / scaleY의 제곱근이고, 켜진 크기 base는 곱의 제곱근이다.
      const stretchOf = (el: HTMLElement): number =>
        Math.sqrt(readScaleX(el) / readScaleY(el));
      const baseOf = (el: HTMLElement): number =>
        Math.sqrt(readScaleX(el) * readScaleY(el));

      const enter = (
        checked: boolean,
        props: { size?: 'sm' | 'md' | 'lg' } = {}
      ) => {
        const view = render(
          <Switch
            label="스위치"
            checked={!checked}
            onChange={() => {}}
            {...props}
          />
        );
        view.rerender(
          <Switch
            label="스위치"
            checked={checked}
            onChange={() => {}}
            {...props}
          />
        );
        return { ...view, switchElement: screen.getByRole('switch') };
      };

      it.each([true, false])(
        '이동 진행값 p는 slow drift로 0에서 1까지 가고 켜짐·꺼짐(%s)이 같다',
        (checked) => {
          const { switchElement } = enter(checked);
          const move = moveTween(switchElement);
          expect(move.startTime()).toBe(0);
          expect(move.duration()).toBeCloseTo(gsapDuration.slow, 10);
          expect(move.vars.ease).toBe(gsapEasing.drift);
        }
      );

      it.each([true, false])(
        '출발 전 늘임이 없다: 머리와 채움을 직접 트윈하지 않고 모든 트윈은 p와 base 객체를 움직인다(%s)',
        (checked) => {
          const { switchElement } = enter(checked);
          const thumb = getThumb(switchElement);
          const sweep = getSweep(switchElement);
          const tweens = children(switchElement);
          expect(tweens).toHaveLength(2);
          for (const tween of tweens) {
            expect(tween.targets()[0]).not.toBe(thumb);
            expect(tween.targets()[0]).not.toBe(sweep);
            expect(tween.vars.scaleX).toBeUndefined();
            expect(tween.vars.ease).not.toBe(gsapEasing.exit);
          }
        }
      );

      it('켜짐: 크기는 이동 80% 시점에 ON_SCALE까지 base drift로 바뀐다', () => {
        const { switchElement } = enter(true);
        const size = sizeTween(switchElement);
        expect(size.vars.base).toBe(ON_SCALE.md);
        expect(size.startTime()).toBeCloseTo(SIZE_AT, 10);
        expect(size.duration()).toBeCloseTo(gsapDuration.base, 10);
        expect(size.vars.ease).toBe(gsapEasing.drift);
      });

      it('꺼짐: 크기는 이동 80% 시점에 1까지 base drift로 바뀐다', () => {
        const { switchElement } = enter(false);
        const size = sizeTween(switchElement);
        expect(size.vars.base).toBe(1);
        expect(size.startTime()).toBeCloseTo(SIZE_AT, 10);
        expect(size.duration()).toBeCloseTo(gsapDuration.base, 10);
        expect(size.vars.ease).toBe(gsapEasing.drift);
      });

      it('켜짐 끝에서 머리 scale이 ON_SCALE에 머물고 x는 18, 채움은 1이다. 타임라인은 스스로 죽는다', () => {
        const { switchElement } = enter(true);
        const thumb = getThumb(switchElement);
        timelineOf(switchElement)?.progress(1);
        expect(readScaleX(thumb)).toBeCloseTo(ON_SCALE.md, 10);
        expect(readScaleY(thumb)).toBeCloseTo(ON_SCALE.md, 10);
        expect(readX(thumb)).toBe(18);
        expect(readScaleX(getSweep(switchElement))).toBe(1);
        expect(getTrack(switchElement).__switchTimeline).toBeUndefined();
      });

      it('꺼짐 끝에서 머리 scale이 1이고 x는 0, 채움은 0이다', () => {
        const { switchElement } = enter(false);
        const thumb = getThumb(switchElement);
        timelineOf(switchElement)?.progress(1);
        expect(readScaleX(thumb)).toBe(1);
        expect(readScaleY(thumb)).toBe(1);
        expect(readX(thumb)).toBe(0);
        expect(readScaleX(getSweep(switchElement))).toBe(0);
      });

      it('이동 한가운데서 가장 길게 늘어(가로 1.144배) 부피는 지킨다', () => {
        const { switchElement } = enter(true);
        const thumb = getThumb(switchElement);
        timelineOf(switchElement)?.time(MOVE / 2);
        expect(readScaleX(thumb)).toBeCloseTo(1.144, 3);
        expect(readScaleY(thumb)).toBeCloseTo(1 / 1.144, 3);
        expect(readScaleX(thumb) * readScaleY(thumb)).toBeCloseTo(1, 3);
        expect(readX(thumb)).toBeCloseTo(9, 3);
      });

      it('늘임은 이동 속도를 따른다: 출발과 도착 직전에는 거의 늘지 않고 한가운데가 가장 길다', () => {
        const { switchElement } = enter(true);
        const thumb = getThumb(switchElement);
        const at = (fraction: number): number => {
          timelineOf(switchElement)?.time(MOVE * fraction);
          return stretchOf(thumb);
        };
        const early = at(0.05);
        const middle = at(0.5);
        expect(early).toBeLessThan(1.01);
        expect(middle).toBeGreaterThan(early);
        expect(at(0.3)).toBeLessThan(middle);
        expect(at(0.7)).toBeLessThan(middle);
      });

      it('켜질 때 이동하는 동안 크기는 1이고 80% 시점에서야 커지기 시작해 끝에서 ON_SCALE이다', () => {
        const { switchElement } = enter(true);
        const thumb = getThumb(switchElement);
        const timeline = timelineOf(switchElement);
        timeline?.time(SIZE_AT - 0.001);
        expect(baseOf(thumb)).toBeCloseTo(1, 4);
        timeline?.time(SIZE_AT + gsapDuration.base / 2);
        expect(baseOf(thumb)).toBeGreaterThan(1.01);
        expect(baseOf(thumb)).toBeLessThan(ON_SCALE.md);
        timeline?.progress(1);
        expect(baseOf(thumb)).toBeCloseTo(ON_SCALE.md, 10);
      });

      it('꺼질 때 이동하는 동안 크기는 켜진 크기이고 80% 시점에서야 작아지기 시작해 끝에서 1이다', () => {
        const { switchElement } = enter(false);
        const thumb = getThumb(switchElement);
        const timeline = timelineOf(switchElement);
        timeline?.time(SIZE_AT - 0.001);
        expect(baseOf(thumb)).toBeCloseTo(ON_SCALE.md, 3);
        timeline?.time(SIZE_AT + gsapDuration.base / 2);
        expect(baseOf(thumb)).toBeLessThan(ON_SCALE.md - 0.01);
        expect(baseOf(thumb)).toBeGreaterThan(1);
        timeline?.progress(1);
        expect(baseOf(thumb)).toBe(1);
      });

      it('파란 채움은 머리와 같은 p를 따라 켤 때 0에서 1로, 끌 때 1에서 0으로 간다', () => {
        for (const checked of [true, false]) {
          const { switchElement, unmount } = enter(checked);
          const thumb = getThumb(switchElement);
          const sweep = getSweep(switchElement);
          for (const fraction of [0.2, 0.5, 0.8]) {
            timelineOf(switchElement)?.time(MOVE * fraction);
            expect(readScaleX(sweep)).toBeCloseTo(readX(thumb) / 18, 3);
          }
          unmount();
        }
      });

      it.each([
        ['sm', 20, 16],
        ['md', 24, 20],
        ['lg', 28, 24],
      ] as const)(
        '%s의 ON_SCALE은 (트랙 높이 %i + 2) / 머리 %i이고 CSS 높이와 같은 값을 읽는다',
        (size, track, head) => {
          const trackRule = switchRules().find((rule) =>
            new RegExp(`^\\.Switch_size_${size}__\\w+$`).test(rule.selectorText)
          );
          const headRule = switchRules().find((rule) =>
            new RegExp(`^\\.Switch_thumbSize_${size}__\\w+$`).test(
              rule.selectorText
            )
          );
          expect(trackRule?.style.getPropertyValue('height')).toBe(
            `${track}px`
          );
          expect(headRule?.style.getPropertyValue('height')).toBe(`${head}px`);
          expect(ON_SCALE[size]).toBeCloseTo((track + 2) / head, 10);

          const on = enter(true, { size });
          timelineOf(on.switchElement)?.progress(1);
          expect(head * readScaleY(getThumb(on.switchElement))).toBeCloseTo(
            track + 2,
            5
          );
        }
      );

      it('켜진 md 머리의 세로는 26px로 24px 트랙을 위아래 1px씩 넘어선다', () => {
        const { switchElement } = enter(true);
        timelineOf(switchElement)?.progress(1);
        expect(20 * readScaleY(getThumb(switchElement))).toBeCloseTo(26, 5);
      });

      it('마운트: 켜져 있으면 처음부터 ON_SCALE이고 꺼져 있으면 1이며 둘 다 타임라인이 없다', () => {
        const on = render(<Switch label="켜짐" checked onChange={() => {}} />);
        const onSwitch = screen.getByRole('switch');
        expect(getTrack(onSwitch).__switchTimeline).toBeUndefined();
        expect(readX(getThumb(onSwitch))).toBe(18);
        expect(readScaleX(getThumb(onSwitch))).toBeCloseTo(ON_SCALE.md, 10);
        expect(readScaleY(getThumb(onSwitch))).toBeCloseTo(ON_SCALE.md, 10);
        on.unmount();

        render(<Switch label="꺼짐" checked={false} onChange={() => {}} />);
        const offSwitch = screen.getByRole('switch');
        expect(getTrack(offSwitch).__switchTimeline).toBeUndefined();
        expect(readX(getThumb(offSwitch))).toBe(0);
        expect(readScaleX(getThumb(offSwitch))).toBe(1);
        expect(readScaleY(getThumb(offSwitch))).toBe(1);
      });

      it.each([
        ['sm', 14],
        ['lg', 22],
      ] as const)(
        '마운트(켜짐) %s 머리도 자기 크기의 ON_SCALE이다',
        (size, x) => {
          render(
            <Switch label="켜짐" size={size} checked onChange={() => {}} />
          );
          const thumb = getThumb(screen.getByRole('switch'));
          expect(readX(thumb)).toBe(x);
          expect(readScaleX(thumb)).toBeCloseTo(ON_SCALE[size], 10);
        }
      );

      it('비활성이어도 켜져 있으면 ON_SCALE이다', () => {
        render(<Switch label="비활성" checked disabled onChange={() => {}} />);
        expect(readScaleX(getThumb(screen.getByRole('switch')))).toBeCloseTo(
          ON_SCALE.md,
          10
        );
      });

      it('축소 선호에서는 켜면 ON_SCALE, 끄면 1로 타임라인 없이 곧장 정지한다', () => {
        installReducedMotion();
        const on = enter(true);
        const onThumb = getThumb(on.switchElement);
        expect(getTrack(on.switchElement).__switchTimeline).toBeUndefined();
        expect(readX(onThumb)).toBe(18);
        expect(readScaleX(onThumb)).toBeCloseTo(ON_SCALE.md, 10);
        expect(readScaleY(onThumb)).toBeCloseTo(ON_SCALE.md, 10);
        on.unmount();

        const off = enter(false);
        const offThumb = getThumb(off.switchElement);
        expect(getTrack(off.switchElement).__switchTimeline).toBeUndefined();
        expect(readX(offThumb)).toBe(0);
        expect(readScaleX(offThumb)).toBe(1);
        expect(readScaleY(offThumb)).toBe(1);
        expect(readScaleX(getSweep(off.switchElement))).toBe(0);
      });

      it('늘어난 한가운데서 반대로 바뀌어도 늘임이 끊기지 않는다(전환 직전과 직후의 k가 같다)', () => {
        const { switchElement, rerender } = enter(true);
        const thumb = getThumb(switchElement);
        const first = timelineOf(switchElement);
        first?.time(MOVE / 2);
        const before = stretchOf(thumb);
        const beforeX = readX(thumb);
        const beforeSweep = readScaleX(getSweep(switchElement));
        expect(before).toBeGreaterThan(1.14);

        rerender(<Switch label="스위치" checked={false} onChange={() => {}} />);
        const second = timelineOf(switchElement);
        expect(second).not.toBe(first);
        expect(first?.parent).toBeNull();
        second?.time(0.001);
        expect(stretchOf(thumb)).toBeCloseTo(before, 3);
        expect(readX(thumb)).toBeCloseTo(beforeX, 1);
        expect(readScaleX(getSweep(switchElement))).toBeCloseTo(beforeSweep, 2);
      });

      it('이어진 늘임은 새 이동이 끝나는 쪽으로 줄어 끝에서 둘 다 1이다', () => {
        const { switchElement, rerender } = enter(true);
        const thumb = getThumb(switchElement);
        timelineOf(switchElement)?.time(MOVE / 2);
        rerender(<Switch label="스위치" checked={false} onChange={() => {}} />);
        const second = timelineOf(switchElement);

        second?.time(MOVE * 0.9);
        expect(stretchOf(thumb)).toBeLessThan(1.05);

        second?.progress(1);
        expect(readScaleX(thumb)).toBe(1);
        expect(readScaleY(thumb)).toBe(1);
        expect(readX(thumb)).toBe(0);
        expect(readScaleX(getSweep(switchElement))).toBe(0);
      });

      it('크기가 바뀌는 중에 반대로 바뀌어도 크기가 튀지 않고 끝은 off 정준값이다', () => {
        const { switchElement, rerender } = enter(true);
        const thumb = getThumb(switchElement);
        timelineOf(switchElement)?.time(SIZE_AT + gsapDuration.base / 2);
        const before = baseOf(thumb);
        expect(before).toBeGreaterThan(1.01);

        rerender(<Switch label="스위치" checked={false} onChange={() => {}} />);
        const second = timelineOf(switchElement);
        second?.time(0.001);
        expect(baseOf(thumb)).toBeCloseTo(before, 3);

        second?.progress(1);
        expect(readScaleX(thumb)).toBe(1);
        expect(readScaleY(thumb)).toBe(1);
        expect(readX(thumb)).toBe(0);
      });

      it('키보드(Space)로 켜고 꺼도 같은 p 트윈이 돈다', async () => {
        render(<Switch label="스위치" />);
        const switchElement = screen.getByRole('switch');
        switchElement.focus();

        await userEvent.keyboard(' ');
        expect(moveTween(switchElement).vars.ease).toBe(gsapEasing.drift);
        expect(sizeTween(switchElement).vars.base).toBe(ON_SCALE.md);
        timelineOf(switchElement)?.progress(1);

        await userEvent.keyboard(' ');
        expect(moveTween(switchElement).vars.ease).toBe(gsapEasing.drift);
        expect(sizeTween(switchElement).vars.base).toBe(1);
      });

      it('호버 부풂은 머리 안쪽 면에만 걸리고 GSAP이 쓰는 머리의 transform에는 섞이지 않는다', () => {
        render(<Switch label="스위치" />);
        const thumb = getThumb(screen.getByRole('switch'));
        const face = thumb.firstElementChild as HTMLElement;
        expect(face).not.toBeNull();
        expect(face.className).toContain('thumbFace');
        expect(face.style.transform).toBe('');
        expect(thumb.style.transform).not.toContain('1.06');
      });
    });

    describe('중단 매트릭스 (Ruling 77 회귀)', () => {
      it('on 전이를 이동 초반(늘임이 막 시작된 때)에 중단하고 off로 전이하면 썸의 scaleX·scaleY가 모두 1로 되돌아온다(Critical-1 회귀)', () => {
        const { rerender } = render(
          <Switch label="스위치" checked={false} onChange={() => {}} />
        );
        const switchElement = screen.getByRole('switch');
        const thumb = getThumb(switchElement);
        const sweep = getSweep(switchElement);

        rerender(<Switch label="스위치" checked onChange={() => {}} />);
        getTrack(switchElement).__switchTimeline?.time(MOVE * 0.1); // 이동 초반 중단
        expect(readScaleY(thumb)).toBeLessThan(1);

        rerender(<Switch label="스위치" checked={false} onChange={() => {}} />);
        const timeline = getTrack(switchElement).__switchTimeline;
        timeline?.progress(1);

        expect(readScaleX(thumb)).toBe(1);
        expect(readScaleY(thumb)).toBe(1);
        expect(readX(thumb)).toBe(0);
        expect(readScaleX(sweep)).toBe(0);
      });

      it('on 전이를 이동 구간에서 중단하고 off로 전이해도 채널 전체가 off 정준값으로 수렴한다', () => {
        const { rerender } = render(
          <Switch label="스위치" checked={false} onChange={() => {}} />
        );
        const switchElement = screen.getByRole('switch');
        const thumb = getThumb(switchElement);
        const sweep = getSweep(switchElement);

        rerender(<Switch label="스위치" checked onChange={() => {}} />);
        getTrack(switchElement).__switchTimeline?.time(MOVE / 2); // 이동 한가운데 중단

        rerender(<Switch label="스위치" checked={false} onChange={() => {}} />);
        const timeline = getTrack(switchElement).__switchTimeline;
        timeline?.progress(1);

        expect(readScaleX(thumb)).toBe(1);
        expect(readScaleY(thumb)).toBe(1);
        expect(readX(thumb)).toBe(0);
        expect(readScaleX(sweep)).toBe(0);
      });

      it('off 전이를 중단하고 다시 on으로 전이하면 채널 전체가 on 정준값으로 수렴한다', () => {
        const { rerender } = render(
          <Switch label="스위치" checked onChange={() => {}} />
        );
        const switchElement = screen.getByRole('switch');
        const thumb = getThumb(switchElement);
        const sweep = getSweep(switchElement);
        getTrack(switchElement).__switchTimeline?.progress(1); // on 완전 착지

        rerender(<Switch label="스위치" checked={false} onChange={() => {}} />);
        getTrack(switchElement).__switchTimeline?.time(MOVE / 2); // off 이동 한가운데 중단

        rerender(<Switch label="스위치" checked onChange={() => {}} />); // 다시 on
        const timeline = getTrack(switchElement).__switchTimeline;
        timeline?.progress(1);

        expect(readX(thumb)).toBe(18); // md 사이즈의 thumbOffset
        expect(readScaleX(thumb)).toBeCloseTo(ON_SCALE.md, 10);
        expect(readScaleY(thumb)).toBeCloseTo(ON_SCALE.md, 10);
        expect(readScaleX(sweep)).toBe(1);
      });
    });
  });
});

/** vanilla-extract가 실제로 만든 CSS(jsdom에 주입된 <style>)를 CSSOM으로 읽는다. */
const switchRules = (): CSSStyleRule[] => {
  const sheet = Array.from(document.styleSheets).find((candidate) =>
    Array.from(candidate.cssRules).some((rule) =>
      rule.cssText.includes('Switch_sweep')
    )
  );
  if (!sheet) throw new Error('Switch 스타일시트를 찾지 못했다');
  return Array.from(sheet.cssRules).filter(
    (rule): rule is CSSStyleRule => rule instanceof CSSStyleRule
  );
};

describe('Switch 생성 CSS (M5 task-17)', () => {
  const own = (className: string) =>
    switchRules().find((rule) =>
      new RegExp(`^\\.Switch_${className}__\\w+$`).test(rule.selectorText)
    );

  it('자르는 칸은 테두리 두께만큼 바깥으로 깔려 트랙 테두리까지 덮는다', () => {
    const border = own('size_md')?.style.getPropertyValue('border');
    const width = border?.match(/^(\d+)px/)?.[1];
    expect(width).toBeDefined();
    expect(own('sweepClip')?.style.getPropertyValue('inset')).toBe(
      `-${width}px`
    );
  });

  it('자르는 칸은 overflow hidden이고 트랙의 바깥 반경을 물려받는다', () => {
    const clip = own('sweepClip');
    expect(clip?.style.getPropertyValue('overflow')).toBe('hidden');
    expect(clip?.style.getPropertyValue('border-radius')).toBe('inherit');
    expect(clip?.style.getPropertyValue('pointer-events')).toBe('none');
  });

  it('채움은 자르는 칸 안의 직사각형이다(반경이 없고 칸을 꽉 채운다)', () => {
    render(<Switch label="스위치" checked onChange={() => {}} />);
    const clip = screen.getByRole('switch')
      .previousElementSibling as HTMLElement;
    const sweep = clip.firstElementChild as HTMLElement;
    expect(clip.className).toContain('Switch_sweepClip__');
    expect(sweep.className).toContain('Switch_sweep__');
    expect(own('sweep')?.style.getPropertyValue('inset')).toBe('0');
    expect(own('sweep')?.style.getPropertyValue('border-radius')).toBe('');
    expect(own('sweep')?.style.getPropertyValue('overflow')).toBe('');
  });

  it('트랙은 overflow hidden을 걸지 않는다(머리가 트랙 밖으로 나가야 한다)', () => {
    const tracks = ['switchContainer', 'size_sm', 'size_md', 'size_lg'].map(
      (name) => own(name)
    );
    for (const rule of tracks) {
      expect(rule).toBeDefined();
      expect(rule?.style.getPropertyValue('overflow')).not.toBe('hidden');
    }
  });

  it('에러가 아니면 칸은 테두리 밖으로 깔리고, 에러면 테두리 안쪽에 머문다', () => {
    const { rerender } = render(
      <Switch label="스위치" checked onChange={() => {}} />
    );
    const clip = screen.getByRole('switch')
      .previousElementSibling as HTMLElement;
    expect(clip.className).not.toContain('sweepInside');

    rerender(<Switch label="스위치" error checked onChange={() => {}} />);
    expect(clip.className).toContain('sweepInside');
    expect(own('sweepInside')?.style.getPropertyValue('inset')).toBe('0');
  });

  it('켜진 에러 스위치는 트랙에 에러 테두리 색이 남고 채움이 그 위를 덮지 않는다', () => {
    render(<Switch label="스위치" error checked onChange={() => {}} />);
    const input = screen.getByRole('switch');
    const track = input.parentElement as HTMLElement;
    expect(track.className).toContain('Switch_error__');
    expect(own('error')?.style.getPropertyValue('border-color')).toContain(
      themeContract.color.error.main
    );
    expect((input.previousElementSibling as HTMLElement).className).toContain(
      'Switch_sweepInside__'
    );
  });

  describe('호버 부풂', () => {
    interface Flat {
      rule: CSSStyleRule;
      media: string | null;
    }
    // @media 안의 규칙까지 펼쳐 감싼 미디어 조건과 함께 돌려준다.
    const flatRules = (): Flat[] => {
      const sheet = Array.from(document.styleSheets).find((candidate) =>
        Array.from(candidate.cssRules).some((rule) =>
          rule.cssText.includes('Switch_sweep')
        )
      );
      if (!sheet) throw new Error('Switch 스타일시트를 찾지 못했다');
      const flat: Flat[] = [];
      const walk = (rules: CSSRuleList, media: string | null) => {
        for (const rule of Array.from(rules)) {
          if (rule instanceof CSSMediaRule) {
            walk(rule.cssRules, rule.media.mediaText);
          } else if (rule instanceof CSSStyleRule) {
            flat.push({ rule, media });
          }
        }
      };
      walk(sheet.cssRules, null);
      return flat;
    };
    const hovers = () =>
      flatRules().filter(({ rule }) => rule.selectorText.includes(':hover'));

    it('머리 면이 1.06배로 부푸는 호버 규칙이 하나 있다', () => {
      expect(hovers()).toHaveLength(1);
      const { rule } = hovers()[0];
      expect(rule.style.getPropertyValue('transform')).toBe('scale(1.06)');
      expect(rule.selectorText).toMatch(/Switch_thumbFace__\w+$/);
    });

    it('마우스에서만: (hover: hover) and (pointer: fine) 안에 있다', () => {
      expect(hovers()[0].media).toBe('(hover: hover) and (pointer: fine)');
    });

    it('비활성이면 부풀지 않는다', () => {
      expect(hovers()[0].rule.selectorText).toContain('input:not(:disabled)');
    });

    it('축소 모드 전용 규칙을 더하지 않고, 호버 밖 기본 면에는 transform이 없다', () => {
      const rules = flatRules();
      expect(
        rules.filter(({ media }) => media?.includes('prefers-reduced-motion'))
      ).toHaveLength(0);
      const base = own('thumbFace');
      expect(base).toBeDefined();
      expect(base?.style.getPropertyValue('transform')).toBe('');
    });

    it('부풂은 base settle 트랜지션이고, GSAP이 쓰는 머리 칸에는 transform도 scale도 없다', () => {
      const transition = own('thumbFace')?.style.getPropertyValue('transition');
      expect(transition).toContain('transform');
      expect(transition).toContain(themeContract.animation.duration.base);
      expect(transition).toContain(themeContract.animation.easing.settle);
      for (const size of ['sm', 'md', 'lg']) {
        const head = own(`thumbSize_${size}`);
        expect(head?.style.getPropertyValue('transform')).toBe('');
        expect(head?.style.getPropertyValue('scale')).toBe('');
      }
    });
  });
});
