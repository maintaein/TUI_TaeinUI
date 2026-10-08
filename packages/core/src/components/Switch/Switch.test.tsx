import { describe, it, expect, vi, afterEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { createRef, useState } from 'react';
import { Switch } from './Switch';
import { themeContract } from '../../tokens/theme.css';

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

    const getTrack = (switchElement: HTMLElement): SwitchTimelineHost =>
      switchElement.parentElement as SwitchTimelineHost;
    // DOM 순서는 스윕 → input → 썸이다(스윕을 input 앞으로 둬서 size prop
    // 테스트의 nextElementSibling=썸 가정을 안 깼다 — task-6-report.md 참고).
    const getSweep = (switchElement: HTMLElement): HTMLElement =>
      switchElement.previousElementSibling as HTMLElement;
    const getThumb = (switchElement: HTMLElement): HTMLElement =>
      switchElement.nextElementSibling as HTMLElement;

    // yPercent(-50)가 "translate(0%, -50%)"로 따로 렌더되고, x는 px 단위의
    // 별도 translate(...)로 렌더된다 — px 표기가 있는 쪽만 집어야 x다.
    const readX = (el: HTMLElement): number => {
      const match = el.style.transform.match(/translate\(([-\d.]+)px/);
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

    it('on 전이 중 썸이 눌렸다 펴진다 — 스쿼시 구간 끝에서 scaleX>1·scaleY<1, 완료 시점엔 둘 다 1', () => {
      const { rerender } = render(
        <Switch label="스위치" checked={false} onChange={() => {}} />
      );
      const switchElement = screen.getByRole('switch');
      rerender(<Switch label="스위치" checked onChange={() => {}} />);

      const track = getTrack(switchElement);
      const timeline = track.__switchTimeline;
      const thumb = getThumb(switchElement);

      // SQUASH_PORTION(0.2) 지점 — 눌림이 정점을 찍고 이동·복원이 시작되는 경계.
      timeline?.progress(0.2);
      expect(readScaleX(thumb)).toBeGreaterThan(1);
      expect(readScaleY(thumb)).toBeLessThan(1);

      timeline?.progress(1);
      expect(readScaleX(thumb)).toBe(1);
      expect(readScaleY(thumb)).toBe(1);
      expect(readX(thumb)).toBe(18); // md 사이즈의 thumbOffset
    });

    it('on → off 전이는 역재생이 아니라 짧은 exit 트윈 하나다(Ruling 41) — squash 없이 x·스윕이 함께 빠진다', () => {
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
      expect(readScaleX(thumb)).toBe(1);
      expect(readScaleY(thumb)).toBe(1);
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

    describe('중단 매트릭스 (Ruling 77 회귀)', () => {
      it('on 전이를 스쿼시 구간에서 중단하고 off로 전이하면 썸의 scaleX·scaleY가 모두 1로 되돌아온다(Critical-1 회귀)', () => {
        const { rerender } = render(
          <Switch label="스위치" checked={false} onChange={() => {}} />
        );
        const switchElement = screen.getByRole('switch');
        const thumb = getThumb(switchElement);
        const sweep = getSweep(switchElement);

        rerender(<Switch label="스위치" checked onChange={() => {}} />);
        getTrack(switchElement).__switchTimeline?.progress(0.1); // 스쿼시 구간 중단
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
        getTrack(switchElement).__switchTimeline?.progress(0.6); // 이동·복원 구간 중단

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
        getTrack(switchElement).__switchTimeline?.progress(0.3); // off 중단

        rerender(<Switch label="스위치" checked onChange={() => {}} />); // 다시 on
        const timeline = getTrack(switchElement).__switchTimeline;
        timeline?.progress(1);

        expect(readX(thumb)).toBe(18); // md 사이즈의 thumbOffset
        expect(readScaleX(thumb)).toBe(1);
        expect(readScaleY(thumb)).toBe(1);
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

  it('채움은 테두리 두께만큼 바깥으로 깔려 트랙 테두리까지 덮는다', () => {
    const border = own('size_md')?.style.getPropertyValue('border');
    const width = border?.match(/^(\d+)px/)?.[1];
    expect(width).toBeDefined();
    expect(own('sweep')?.style.getPropertyValue('inset')).toBe(`-${width}px`);
  });

  it('채움은 트랙의 바깥 반경을 물려받는다', () => {
    expect(own('sweep')?.style.getPropertyValue('border-radius')).toBe(
      'inherit'
    );
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

  it('에러가 아니면 채움은 테두리 밖으로 깔리고, 에러면 테두리 안쪽에 머문다', () => {
    const { rerender } = render(
      <Switch label="스위치" checked onChange={() => {}} />
    );
    const sweep = screen.getByRole('switch')
      .previousElementSibling as HTMLElement;
    expect(sweep.className).not.toContain('sweepInside');

    rerender(<Switch label="스위치" error checked onChange={() => {}} />);
    expect(sweep.className).toContain('sweepInside');
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
});
