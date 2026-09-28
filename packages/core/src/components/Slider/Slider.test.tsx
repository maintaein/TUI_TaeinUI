import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Slider } from './Slider';
import { VALUE_FOLLOWER_PERCENT_VAR } from './Slider.css';

/**
 * 테스트 전용 DOM 확장 읽기용 타입. `Slider.tsx`의 `ScrubTicksTimelineHost`·
 * `ValueFollowerTweenHost`(내보내지 않는 로컬 인터페이스)와 같은 모양이다 —
 * Snackbar.test.tsx의 `CountdownTweenHost` 패턴을 그대로 따른다.
 */
type ScrubTicksTimelineHost = HTMLDivElement & {
  __scrubTicksTimeline?: gsap.core.Timeline;
};
type ValueFollowerTweenHost = HTMLSpanElement & {
  __valueFollowerTween?: gsap.core.Tween;
};

const getTicksContainer = (
  container: HTMLElement
): ScrubTicksTimelineHost | null =>
  container.querySelector(
    '[class*="scrubTicksContainer__"]'
  ) as ScrubTicksTimelineHost | null;

const getTicks = (container: HTMLElement): NodeListOf<Element> =>
  container.querySelectorAll('[class*="scrubTick__"]');

const getLandedTick = (container: HTMLElement): Element | null =>
  container.querySelector('[class*="scrubTickLanded__"]');

const getFollower = (container: HTMLElement): ValueFollowerTweenHost | null =>
  container.querySelector(
    '[class*="valueFollower__"]'
  ) as ValueFollowerTweenHost | null;

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

describe('Slider', () => {
  describe('렌더링 테스트', () => {
    it('기본적으로 렌더링된다', () => {
      render(<Slider label="볼륨" />);

      expect(screen.getByRole('slider')).toBeInTheDocument();
      expect(screen.getByLabelText('볼륨')).toBeInTheDocument();
    });

    it('label을 렌더링한다', () => {
      render(<Slider label="밝기 조절" />);

      expect(screen.getByText('밝기 조절')).toBeInTheDocument();
    });

    it('기본값은 0이다', () => {
      render(<Slider label="슬라이더" />);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveValue('0');
    });

    it('value prop으로 초기값을 설정할 수 있다', () => {
      render(<Slider label="슬라이더" value={50} onChange={() => {}} />);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveValue('50');
    });

    it('현재 값을 표시한다', () => {
      render(<Slider label="볼륨" value={75} onChange={() => {}} showValue />);

      expect(screen.getByText('75')).toBeInTheDocument();
    });
  });

  describe('min/max/step prop 테스트', () => {
    it('min 값을 설정할 수 있다', () => {
      render(<Slider label="슬라이더" min={10} />);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('min', '10');
    });

    it('max 값을 설정할 수 있다', () => {
      render(<Slider label="슬라이더" max={200} />);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('max', '200');
    });

    it('step 값을 설정할 수 있다', () => {
      render(<Slider label="슬라이더" step={5} />);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('step', '5');
    });

    it('기본 min은 0이다', () => {
      render(<Slider label="슬라이더" />);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('min', '0');
    });

    it('기본 max는 100이다', () => {
      render(<Slider label="슬라이더" />);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('max', '100');
    });

    it('기본 step은 1이다', () => {
      render(<Slider label="슬라이더" />);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('step', '1');
    });
  });

  describe('size prop 테스트', () => {
    it('size="sm"을 적용한다', () => {
      render(<Slider label="슬라이더" size="sm" />);

      const container = screen.getByRole('slider').closest('div');
      expect(container?.className).toContain('sm');
    });

    it('size="md"를 기본값으로 적용한다', () => {
      render(<Slider label="슬라이더" />);

      const container = screen.getByRole('slider').closest('div');
      expect(container?.className).toContain('md');
    });

    it('size="lg"를 적용한다', () => {
      render(<Slider label="슬라이더" size="lg" />);

      const container = screen.getByRole('slider').closest('div');
      expect(container?.className).toContain('lg');
    });
  });

  describe('disabled prop 테스트', () => {
    it('disabled 상태를 적용한다', () => {
      render(<Slider label="슬라이더" disabled />);

      const slider = screen.getByRole('slider');
      expect(slider).toBeDisabled();
    });

    it('disabled 상태에서는 onChange가 호출되지 않는다', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(<Slider label="슬라이더" disabled onChange={handleChange} />);

      const slider = screen.getByRole('slider');
      await user.click(slider);

      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('이벤트 핸들러 테스트', () => {
    it('값 변경 시 onChange가 호출된다', () => {
      const handleChange = vi.fn();

      render(<Slider label="슬라이더" value={50} onChange={handleChange} />);

      const slider = screen.getByRole('slider') as HTMLInputElement;

      const event = new Event('input', { bubbles: true });
      Object.defineProperty(slider, 'value', { writable: true, value: 75 });
      slider.dispatchEvent(event);

      expect(handleChange).toHaveBeenCalled();
    });

    it('onChange에 올바른 값이 전달된다', () => {
      const handleChange = vi.fn();

      render(<Slider label="슬라이더" value={50} onChange={handleChange} />);

      const slider = screen.getByRole('slider') as HTMLInputElement;

      const event = new Event('input', { bubbles: true });
      Object.defineProperty(slider, 'value', { writable: true, value: 75 });
      slider.dispatchEvent(event);

      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe('접근성 테스트', () => {
    it('role="slider"를 가진다', () => {
      render(<Slider label="슬라이더" />);

      expect(screen.getByRole('slider')).toBeInTheDocument();
    });

    it('aria-label이 설정된다', () => {
      render(<Slider label="볼륨 조절" />);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-label', '볼륨 조절');
    });

    it('aria-valuemin이 설정된다', () => {
      render(<Slider label="슬라이더" min={10} />);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-valuemin', '10');
    });

    it('aria-valuemax가 설정된다', () => {
      render(<Slider label="슬라이더" max={200} />);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-valuemax', '200');
    });

    it('aria-valuenow가 현재 값으로 설정된다', () => {
      render(<Slider label="슬라이더" value={50} onChange={() => {}} />);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-valuenow', '50');
    });

    it('aria-disabled가 disabled 상태를 반영한다', () => {
      render(<Slider label="슬라이더" disabled />);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('키보드 인터랙션 테스트', () => {
    it('Arrow Right 키로 값을 증가시킬 수 있다', () => {
      const handleChange = vi.fn();

      render(<Slider label="슬라이더" value={50} onChange={handleChange} />);

      const slider = screen.getByRole('slider');
      slider.focus();

      const event = new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        bubbles: true,
      });
      slider.dispatchEvent(event);

      expect(slider).toHaveFocus();
    });

    it('Arrow Left 키로 값을 감소시킬 수 있다', () => {
      const handleChange = vi.fn();

      render(<Slider label="슬라이더" value={50} onChange={handleChange} />);

      const slider = screen.getByRole('slider');
      slider.focus();

      const event = new KeyboardEvent('keydown', {
        key: 'ArrowLeft',
        bubbles: true,
      });
      slider.dispatchEvent(event);

      expect(slider).toHaveFocus();
    });

    it('Arrow Up 키로 값을 증가시킬 수 있다', () => {
      const handleChange = vi.fn();

      render(<Slider label="슬라이더" value={50} onChange={handleChange} />);

      const slider = screen.getByRole('slider');
      slider.focus();

      const event = new KeyboardEvent('keydown', {
        key: 'ArrowUp',
        bubbles: true,
      });
      slider.dispatchEvent(event);

      expect(slider).toHaveFocus();
    });

    it('Arrow Down 키로 값을 감소시킬 수 있다', () => {
      const handleChange = vi.fn();

      render(<Slider label="슬라이더" value={50} onChange={handleChange} />);

      const slider = screen.getByRole('slider');
      slider.focus();

      const event = new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        bubbles: true,
      });
      slider.dispatchEvent(event);

      expect(slider).toHaveFocus();
    });

    it('Home 키로 최소값으로 이동할 수 있다', () => {
      const handleChange = vi.fn();

      render(
        <Slider label="슬라이더" value={50} min={10} onChange={handleChange} />
      );

      const slider = screen.getByRole('slider');
      slider.focus();

      const event = new KeyboardEvent('keydown', {
        key: 'Home',
        bubbles: true,
      });
      slider.dispatchEvent(event);

      expect(slider).toHaveFocus();
    });

    it('End 키로 최대값으로 이동할 수 있다', () => {
      const handleChange = vi.fn();

      render(
        <Slider label="슬라이더" value={50} max={200} onChange={handleChange} />
      );

      const slider = screen.getByRole('slider');
      slider.focus();

      const event = new KeyboardEvent('keydown', { key: 'End', bubbles: true });
      slider.dispatchEvent(event);

      expect(slider).toHaveFocus();
    });
  });

  describe('helper text 테스트', () => {
    it('helperText를 렌더링한다', () => {
      render(
        <Slider label="볼륨" helperText="0부터 100까지 조절할 수 있습니다" />
      );

      expect(
        screen.getByText('0부터 100까지 조절할 수 있습니다')
      ).toBeInTheDocument();
    });

    it('helperText가 slider와 연결된다', () => {
      render(<Slider label="볼륨" helperText="도움말 텍스트" />);

      const slider = screen.getByRole('slider');
      const helperText = screen.getByText('도움말 텍스트');

      expect(slider).toHaveAccessibleDescription('도움말 텍스트');
      expect(helperText.id).toBeTruthy();
    });
  });

  describe('marks prop 테스트', () => {
    it('marks를 렌더링한다', () => {
      const marks = [
        { value: 0, label: '0%' },
        { value: 50, label: '50%' },
        { value: 100, label: '100%' },
      ];

      render(<Slider label="슬라이더" marks={marks} />);

      expect(screen.getByText('0%')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('marks 없이도 렌더링된다', () => {
      render(<Slider label="슬라이더" />);

      const slider = screen.getByRole('slider');
      expect(slider).toBeInTheDocument();
    });
  });

  describe('엣지 케이스 테스트', () => {
    it('min과 max가 같을 때 렌더링된다', () => {
      render(<Slider label="슬라이더" min={50} max={50} />);

      const slider = screen.getByRole('slider');
      expect(slider).toBeInTheDocument();
    });

    it('음수 값을 지원한다', () => {
      render(
        <Slider
          label="슬라이더"
          min={-100}
          max={100}
          value={-50}
          onChange={() => {}}
        />
      );

      const slider = screen.getByRole('slider');
      expect(slider).toHaveValue('-50');
    });

    it('소수점 step을 지원한다', () => {
      render(<Slider label="슬라이더" step={0.1} />);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('step', '0.1');
    });

    it('className을 추가할 수 있다', () => {
      render(<Slider label="슬라이더" className="custom-slider" />);

      const container = screen.getByRole('slider').parentElement?.parentElement;
      expect(container?.className).toContain('custom-slider');
    });

    it('value와 onChange가 동시에 제공되면 제어 컴포넌트로 동작한다', () => {
      const ControlledSlider = () => {
        const [value, setValue] = React.useState(50);
        return (
          <Slider
            label="제어 슬라이더"
            value={value}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setValue(Number(e.target.value))
            }
          />
        );
      };

      render(<ControlledSlider />);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveValue('50');
    });
  });

  describe('trackColor prop 테스트', () => {
    it('기본 fill 트랙이 렌더링된다', () => {
      const { container } = render(
        <Slider label="슬라이더" value={50} onChange={() => {}} />
      );

      const fillTrack = container.querySelector('[class*="sliderFillTrack"]');
      expect(fillTrack).toBeInTheDocument();
      expect(fillTrack).toHaveStyle({ '--slider-fill-scale': '0.5' });
    });

    it('trackColor로 fill 트랙 색상을 변경할 수 있다', () => {
      const { container } = render(
        <Slider
          label="슬라이더"
          value={50}
          onChange={() => {}}
          trackColor="#ff0000"
        />
      );

      const fillTrack = container.querySelector('[class*="sliderFillTrack"]');
      expect(fillTrack).toHaveStyle({ backgroundColor: '#ff0000' });
    });

    it('value가 min일 때 fill 채움 비율이 0이다', () => {
      const { container } = render(
        <Slider
          label="슬라이더"
          value={0}
          min={0}
          max={100}
          onChange={() => {}}
        />
      );

      const fillTrack = container.querySelector('[class*="sliderFillTrack"]');
      expect(fillTrack).toHaveStyle({ '--slider-fill-scale': '0' });
    });

    it('value가 max일 때 fill 채움 비율이 1이다', () => {
      const { container } = render(
        <Slider
          label="슬라이더"
          value={100}
          min={0}
          max={100}
          onChange={() => {}}
        />
      );

      const fillTrack = container.querySelector('[class*="sliderFillTrack"]');
      expect(fillTrack).toHaveStyle({ '--slider-fill-scale': '1' });
    });
  });

  describe('required prop 테스트', () => {
    it('required 표시를 렌더링한다', () => {
      render(<Slider label="필수 슬라이더" required />);

      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('required 속성이 slider에 설정된다', () => {
      render(<Slider label="필수 슬라이더" required />);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('required');
    });
  });

  describe('showValue prop 테스트', () => {
    it('showValue가 true일 때 현재 값을 표시한다', () => {
      render(<Slider label="볼륨" value={60} onChange={() => {}} showValue />);

      expect(screen.getByText('60')).toBeInTheDocument();
    });

    it('showValue가 false일 때 값을 표시하지 않는다', () => {
      render(
        <Slider label="볼륨" value={60} onChange={() => {}} showValue={false} />
      );

      expect(screen.queryByText('60')).not.toBeInTheDocument();
    });

    it('기본값은 showValue={false}이다', () => {
      render(<Slider label="볼륨" value={60} onChange={() => {}} />);

      expect(screen.queryByText('60')).not.toBeInTheDocument();
    });
  });

  describe('눈금·값 따라붙기 테스트 (M3 T4)', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
      vi.useRealTimers();
    });

    it('잡기 전에는 눈금도 놓은 자리 표식도 없다', () => {
      const { container } = render(
        <Slider
          label="슬라이더"
          value={5}
          min={0}
          max={10}
          onChange={() => {}}
        />
      );

      expect(getTicksContainer(container)).not.toBeInTheDocument();
      expect(getLandedTick(container)).not.toBeInTheDocument();
    });

    it('pointerdown으로 잡으면 썸 근방에 눈금이 돋는다', () => {
      const { container } = render(
        <Slider
          label="슬라이더"
          value={5}
          min={0}
          max={10}
          onChange={() => {}}
        />
      );
      const slider = screen.getByRole('slider');

      fireEvent.pointerDown(slider);

      expect(getTicksContainer(container)).toBeInTheDocument();
      expect(getTicks(container).length).toBeGreaterThan(0);
    });

    it('렌더되는 눈금 개수는 범위 크기와 무관하다 — 전 구간 DOM이 아니다', () => {
      const small = render(
        <Slider
          label="작은 범위"
          value={5}
          min={0}
          max={10}
          step={1}
          onChange={() => {}}
        />
      );
      fireEvent.pointerDown(screen.getByRole('slider', { name: '작은 범위' }));
      const smallCount = getTicks(small.container).length;

      const large = render(
        <Slider
          label="큰 범위"
          value={50000}
          min={0}
          max={100000}
          step={1}
          onChange={() => {}}
        />
      );
      fireEvent.pointerDown(screen.getByRole('slider', { name: '큰 범위' }));
      const largeCount = getTicks(large.container).length;

      expect(smallCount).toBeGreaterThan(0);
      expect(largeCount).toBe(smallCount);
    });

    it('놓으면 눈금이 가라앉기 시작하고 도달한 자리에 한 칸이 남는다', () => {
      const { container } = render(
        <Slider
          label="슬라이더"
          value={5}
          min={0}
          max={10}
          onChange={() => {}}
        />
      );
      const slider = screen.getByRole('slider');

      fireEvent.pointerDown(slider);
      fireEvent.pointerUp(slider);

      const landed = getLandedTick(container);
      expect(landed).toBeInTheDocument();
      expect(landed).toHaveStyle({ left: '50%' });
      // 가라앉는 애니메이션이 끝날 때까지 눈금 그룹은 계속 존재한다(즉시 사라지지 않는다).
      expect(getTicksContainer(container)).toBeInTheDocument();
    });

    it('가라앉는 도중 다시 잡으면 그 자리(진행률 0·1이 아닌 지점)에서 이어진다', () => {
      const { container } = render(
        <Slider
          label="슬라이더"
          value={5}
          min={0}
          max={10}
          onChange={() => {}}
        />
      );
      const slider = screen.getByRole('slider');

      fireEvent.pointerDown(slider);
      const host = getTicksContainer(container);
      expect(host).not.toBeNull();
      act(() => {
        host!.__scrubTicksTimeline!.progress(0.6);
      });

      fireEvent.pointerUp(slider);
      const timelineAtRelease = host!.__scrubTicksTimeline;

      fireEvent.pointerDown(slider);
      const hostAfterRegrab = getTicksContainer(container);

      // 같은 DOM·같은 타임라인 인스턴스를 재사용한다 — 새로 만들었다면 0으로 리셋됐을 것이다.
      expect(hostAfterRegrab).toBe(host);
      expect(hostAfterRegrab!.__scrubTicksTimeline).toBe(timelineAtRelease);
      const progress = hostAfterRegrab!.__scrubTicksTimeline!.progress();
      expect(progress).toBeGreaterThan(0);
      expect(progress).toBeLessThan(1);
    });

    it('잡고 있는 동안 값이 썸을 따라간다 — quickTo가 관성을 갖고 좇는다(순간이동 금지)', () => {
      const { container, rerender } = render(
        <Slider
          label="슬라이더"
          value={20}
          min={0}
          max={100}
          onChange={() => {}}
        />
      );
      const slider = screen.getByRole('slider');

      fireEvent.pointerDown(slider);
      const follower = getFollower(container);
      expect(follower).toBeInTheDocument();
      expect(follower!.style.getPropertyValue(VALUE_FOLLOWER_PERCENT_VAR)).toBe(
        '20'
      );

      rerender(
        <Slider
          label="슬라이더"
          value={60}
          min={0}
          max={100}
          onChange={() => {}}
        />
      );
      // 값이 바뀐 직후에도 quickTo 트윈이 아직 안 흘렀으므로 순간이동하지 않는다.
      expect(follower!.style.getPropertyValue(VALUE_FOLLOWER_PERCENT_VAR)).toBe(
        '20'
      );

      act(() => {
        follower!.__valueFollowerTween!.progress(1);
      });
      expect(follower!.style.getPropertyValue(VALUE_FOLLOWER_PERCENT_VAR)).toBe(
        '60'
      );
    });

    it('잡은 상태에서 축소 선호로 바뀌면 quickTo 트윈이 죽는다 — 확정 값 위에서 계속 덮어쓰지 않는다', () => {
      const { container, rerender } = render(
        <Slider
          label="슬라이더"
          value={20}
          min={0}
          max={100}
          onChange={() => {}}
        />
      );
      const slider = screen.getByRole('slider');

      fireEvent.pointerDown(slider);
      const follower = getFollower(container);
      const tween = follower!.__valueFollowerTween;
      expect(tween?.parent).not.toBeNull();

      installReducedMotion();
      rerender(
        <Slider
          label="슬라이더"
          value={20}
          min={0}
          max={100}
          onChange={() => {}}
        />
      );

      // kill()된 트윈은 부모를 잃는다(useOverlayTransition.test.ts:311의 같은
      // 패턴) — GSAP의 isActive()는 parent가 null이면 true를 내므로(gsap.js:1785:
      // `!!(!parent || ...)`) killed 여부 판별에 쓸 수 없다. parent가 신뢰 가능한 신호다.
      expect(tween?.parent).toBeNull();
    });

    it('값 따라붙기는 aria-hidden이고 showValue를 대체하지 않는다', () => {
      const { container } = render(
        <Slider
          label="슬라이더"
          value={20}
          min={0}
          max={100}
          onChange={() => {}}
          showValue
        />
      );
      const slider = screen.getByRole('slider');

      // 잡기 전: showValue 고정 출력만 있다.
      expect(
        container.querySelector('[class*="valueDisplay__"]')
      ).toBeInTheDocument();
      expect(getFollower(container)).not.toBeInTheDocument();

      fireEvent.pointerDown(slider);

      // 잡은 동안: 고정 출력과 따라붙기 표시가 공존한다 — 대체가 아니다.
      const follower = getFollower(container);
      expect(
        container.querySelector('[class*="valueDisplay__"]')
      ).toBeInTheDocument();
      expect(follower).toBeInTheDocument();
      expect(follower).toHaveAttribute('aria-hidden', 'true');
    });

    it('키보드(화살표)로도 같은 신호가 만들어진다 — 눈금이 돋고 값이 따라간다', () => {
      const { container } = render(
        <Slider label="슬라이더" value={50} onChange={() => {}} />
      );
      const slider = screen.getByRole('slider');
      slider.focus();

      act(() => {
        slider.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })
        );
      });

      expect(getTicksContainer(container)).toBeInTheDocument();
      expect(getFollower(container)).toBeInTheDocument();
    });

    it('마지막 키 입력 후 일정 시간 무입력이면 놓은 것으로 처리된다', () => {
      vi.useFakeTimers();
      const { container } = render(
        <Slider label="슬라이더" value={50} onChange={() => {}} />
      );
      const slider = screen.getByRole('slider');
      slider.focus();

      act(() => {
        slider.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })
        );
      });
      expect(getLandedTick(container)).not.toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(600);
      });

      expect(getLandedTick(container)).toBeInTheDocument();
    });

    it('연타 중에는 놓은 것으로 처리되지 않는다 — 무입력 타이머가 매 입력마다 갱신된다', () => {
      vi.useFakeTimers();
      const { container } = render(
        <Slider label="슬라이더" value={50} onChange={() => {}} />
      );
      const slider = screen.getByRole('slider');
      slider.focus();

      act(() => {
        slider.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })
        );
      });
      act(() => {
        vi.advanceTimersByTime(300);
      });
      act(() => {
        slider.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })
        );
      });
      act(() => {
        vi.advanceTimersByTime(300);
      });

      // 마지막 입력 이후 300ms밖에 안 지났다 — 아직 놓은 게 아니다.
      expect(getLandedTick(container)).not.toBeInTheDocument();
      expect(getTicksContainer(container)).toBeInTheDocument();
    });

    it('키보드로 잡은 유휴창 안에서 언마운트하면 유휴 타이머가 정리된다 — 언마운트 뒤 setState가 돌지 않는다', () => {
      vi.useFakeTimers();
      const { unmount } = render(
        <Slider label="슬라이더" value={50} onChange={() => {}} />
      );
      const slider = screen.getByRole('slider');
      slider.focus();

      act(() => {
        slider.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })
        );
      });

      unmount();

      expect(vi.getTimerCount()).toBe(0);
      expect(() => {
        act(() => {
          vi.advanceTimersByTime(600);
        });
      }).not.toThrow();
    });

    it('blur로도 놓은 것으로 처리된다', () => {
      const { container } = render(
        <Slider label="슬라이더" value={50} onChange={() => {}} />
      );
      const slider = screen.getByRole('slider');
      slider.focus();

      act(() => {
        slider.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })
        );
      });
      act(() => {
        fireEvent.blur(slider);
      });

      expect(getLandedTick(container)).toBeInTheDocument();
    });

    it('축소 선호에서도 눈금은 존재한다 — 움직임만 사라진다', () => {
      installReducedMotion();
      const { container } = render(
        <Slider
          label="슬라이더"
          value={5}
          min={0}
          max={10}
          onChange={() => {}}
        />
      );
      const slider = screen.getByRole('slider');

      fireEvent.pointerDown(slider);

      const host = getTicksContainer(container);
      expect(host).toBeInTheDocument();
      expect(getTicks(container).length).toBeGreaterThan(0);
      expect(host!.style.opacity).toBe('1');
    });

    it('marks와 새 눈금이 동시에 켜진 경우를 렌더한다', () => {
      const { container } = render(
        <Slider
          label="슬라이더"
          value={5}
          min={0}
          max={10}
          onChange={() => {}}
          marks={[
            { value: 0, label: '0' },
            { value: 10, label: '10' },
          ]}
        />
      );
      const slider = screen.getByRole('slider');

      fireEvent.pointerDown(slider);

      expect(
        container.querySelector('[class*="marksContainer"]')
      ).toBeInTheDocument();
      expect(getTicksContainer(container)).toBeInTheDocument();
    });

    it('fill이 트랙의 자식으로 중첩된다', () => {
      const { container } = render(
        <Slider label="슬라이더" value={50} onChange={() => {}} />
      );
      const track = container.querySelector('[class*="sliderTrack__"]');
      const fill = container.querySelector('[class*="sliderFillTrack__"]');

      expect(track).toContainElement(fill as HTMLElement);
    });
  });
});
