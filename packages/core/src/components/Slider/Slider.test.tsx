import { describe, it, expect, vi, afterEach, beforeAll } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Slider } from './Slider';
import {
  LINE_BAR_HOVER,
  LINE_BAR_REST,
  LINE_BOX_HEIGHT,
  LINE_DEFAULT_WIDTH,
  LINE_HOVER,
  LINE_REST,
  LINE_WAVE_MAX,
  THUMB_PX,
  WAKE_DEFAULT_BARS,
  wakeBarCount,
  waveAmp,
  waveLift,
  waveScale,
  WAKE_REST_SCALE,
  stepWakeSprings,
  type WakeSprings,
} from './sliderMath';
import { gsapDuration, gsapEasing } from '../../tokens/gsapEasing';
import { VALUE_FOLLOWER_PERCENT_VAR } from './Slider.css';

/**
 * 테스트 전용 DOM 확장 읽기용 타입. `Slider.tsx`의 `ValueFollowerTweenHost`
 * (내보내지 않는 로컬 인터페이스)와 같은 모양이다.
 * Snackbar.test.tsx의 `CountdownTweenHost` 패턴을 그대로 따른다.
 */
type ValueFollowerTweenHost = HTMLSpanElement & {
  __valueFollowerTween?: gsap.core.Tween;
};

/** 잡을 때 나오던 눈금(옛 scrubTick 계열) DOM. 지금은 어느 변형에도 없다. */
const getScrubTickElements = (container: HTMLElement): NodeListOf<Element> =>
  container.querySelectorAll('[class*="scrubTick"]');

/** 테스트 전용. wake 막대 묶음에 달린 손잡이(Slider.tsx의 `WakeBarsHost`와 같은 모양). */
type WakeBarsHost = HTMLDivElement & {
  __wakeTick?: (time: number, deltaMs: number) => void;
  __wakeHead?: { pct: number };
  __hoverTween?: gsap.core.Tween;
};

const getWakeHost = (container: HTMLElement): WakeBarsHost | null =>
  container.querySelector('[class*="wakeBars__"]') as WakeBarsHost | null;

const getWakeBars = (container: HTMLElement): HTMLElement[] =>
  Array.from(container.querySelectorAll<HTMLElement>('[class*="wakeBar__"]'));

/** default·bar의 트랙 요소. 라인 SVG를 품고, 물결 손잡이가 달린다. */
const getLineHost = (container: HTMLElement): WakeBarsHost | null =>
  container.querySelector('[class*="sliderTrack__"]') as WakeBarsHost | null;

// jsdom에는 PointerEvent가 없다. React는 이름이 맞으면 받으므로 MouseEvent에
// pointerType을 얹어 쏜다. React의 enter/leave는 over/out에서 만들어진다.
const pointer = (
  el: HTMLElement,
  type: 'pointerover' | 'pointerout',
  pointerType = 'mouse'
) =>
  act(() => {
    const event = new MouseEvent(type, { bubbles: true });
    Object.defineProperty(event, 'pointerType', { value: pointerType });
    el.dispatchEvent(event);
  });

const getLine = (container: HTMLElement) => ({
  svg: container.querySelector('svg') as SVGSVGElement,
  track: container.querySelector(
    '[class*="sliderLineTrack__"]'
  ) as SVGPathElement,
  fill: container.querySelector(
    '[class*="sliderLineFill__"]'
  ) as SVGPathElement,
  clip: container.querySelector('rect') as SVGRectElement,
});

/** 경로의 M·L 점들. 호(A)의 끝점은 L이나 M이 아니라 A 뒤에 오므로 빠진다. */
const pathPoints = (d: string): { x: number; y: number }[] =>
  [...d.matchAll(/[ML]([\d.-]+),([\d.-]+)/g)].map((m) => ({
    x: Number(m[1]),
    y: Number(m[2]),
  }));

/** 안쪽 여백이 0인 경로의 위쪽 가장자리 점들의 두께(가운데선 12에서 2배). */
const thicknessProfile = (d: string): { x: number; t: number }[] =>
  pathPoints(d)
    .filter(({ y }) => y < LINE_BOX_HEIGHT / 2)
    .map(({ x, y }) => ({ x, t: 2 * (LINE_BOX_HEIGHT / 2 - y) }));

/** 폭을 모를 때(jsdom) 머리 중심의 x(px). 머리 중심은 (폭 - 머리 폭) 위를 움직인다. */
const headCenterX = (pct: number, width = LINE_DEFAULT_WIDTH): number =>
  THUMB_PX / 2 + (pct / 100) * (width - THUMB_PX);

/** 프레임 간격(ms). 시험이 ticker를 직접 돌릴 때 쓴다. */
const FRAME_MS = 16;

/** 프레임 콜백을 FRAME_MS씩 쪼개 총 `ms`만큼 돌린다. */
const runFrames = (host: WakeBarsHost, ms: number): void => {
  act(() => {
    for (let t = 0; t < ms; t += FRAME_MS) {
      host.__wakeTick!(0, Math.min(FRAME_MS, ms - t));
    }
  });
};

/**
 * 순수 스프링으로 같은 프레임을 돌려 낸 기대 상태(트랙 %). 컴포넌트가 같은 식을 쓰는지
 * 본다. 폭을 모르는 jsdom은 LINE_DEFAULT_WIDTH로 잰다.
 */
const springsAfter = (from: number, to: number, ms: number): WakeSprings => {
  let state: WakeSprings = { x: from, v: 0, s: 0, ds: 0 };
  for (let t = 0; t < ms; t += FRAME_MS) {
    state = stepWakeSprings(state, to, Math.min(FRAME_MS, ms - t) / 1000);
  }
  return state;
};
const ampAfter = (from: number, to: number, ms: number): number =>
  waveAmp((springsAfter(from, to, ms).s * LINE_DEFAULT_WIDTH) / 100);

// gsap 네임스페이스는 ambient 전역 타입이라 import 없이 참조된다
// (Checkbox.test.tsx·Switch.test.tsx와 같은 방식). ticker의 리스너 수는 실제
// gsap 모듈에서 읽는다(대역이 아니라 Slider.tsx가 쓰는 같은 인스턴스다).
// 소스 파일이 아니라 시험이라 gateMotion을 쓰지 않으므로 `from 'gsap'`를 피한다
// (gsapGateEnforcement 스캔은 `from 'gsap'`를 본다).
interface GsapTicker {
  _listeners: unknown[];
}
let gsapTicker: GsapTicker;
beforeAll(async () => {
  const actual = await vi.importActual<{ gsap: { ticker: GsapTicker } }>(
    'gsap'
  );
  gsapTicker = actual.gsap.ticker;
});
const tickerListeners = (): number => gsapTicker._listeners.length;

const barScale = (bar: HTMLElement): number =>
  Number(
    bar.style.getPropertyValue('transform').match(/scaleY\(([\d.e-]+)\)/)?.[1]
  );

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
    it('기본 fill 모양이 렌더링되고 값 위치에서 잘린다', () => {
      const { container } = render(
        <Slider label="슬라이더" value={50} onChange={() => {}} />
      );

      const { fill, clip } = getLine(container);
      expect(fill).toBeInTheDocument();
      expect(Number(clip.getAttribute('width'))).toBe(LINE_DEFAULT_WIDTH / 2);
      expect(fill.getAttribute('clip-path')).toBe(
        `url(#${clip.parentElement!.id})`
      );
    });

    it('trackColor로 fill 색상을 변경할 수 있다 (안 채운 부분은 그대로)', () => {
      const { container } = render(
        <Slider
          label="슬라이더"
          value={50}
          onChange={() => {}}
          trackColor="#ff0000"
        />
      );

      const { fill, track } = getLine(container);
      expect(fill.style.fill).toBe('#ff0000');
      expect(track.style.fill).toBe('');
    });

    it('value가 min일 때 fill이 잘려 보이지 않는다 (폭 0)', () => {
      const { container } = render(
        <Slider
          label="슬라이더"
          value={0}
          min={0}
          max={100}
          onChange={() => {}}
        />
      );

      expect(Number(getLine(container).clip.getAttribute('width'))).toBe(0);
    });

    it('value가 max일 때 fill이 트랙 전체를 덮는다 (폭 전부)', () => {
      const { container } = render(
        <Slider
          label="슬라이더"
          value={100}
          min={0}
          max={100}
          onChange={() => {}}
        />
      );

      expect(Number(getLine(container).clip.getAttribute('width'))).toBe(
        LINE_DEFAULT_WIDTH
      );
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

    it('기본에서는 잡아도 눈금 DOM이 없다', () => {
      const { container } = render(
        <Slider
          label="슬라이더"
          value={5}
          min={0}
          max={10}
          onChange={() => {}}
        />
      );

      expect(getScrubTickElements(container)).toHaveLength(0);
      fireEvent.pointerDown(screen.getByRole('slider'));

      expect(getFollower(container)).toBeInTheDocument();
      expect(getScrubTickElements(container)).toHaveLength(0);
      fireEvent.pointerUp(screen.getByRole('slider'));
      expect(getScrubTickElements(container)).toHaveLength(0);
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

    it('키보드(화살표)로도 같은 신호가 만들어진다: 값이 따라간다', () => {
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
      expect(getFollower(container)).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(600);
      });

      expect(getFollower(container)).not.toBeInTheDocument();
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
      expect(getFollower(container)).toBeInTheDocument();
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

      expect(getFollower(container)).not.toBeInTheDocument();
    });

    it('marks와 값 따라붙기가 동시에 켜진 경우를 렌더한다', () => {
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
      expect(getFollower(container)).toBeInTheDocument();
    });

    it('라인 SVG가 트랙의 자식이고 보조기술에는 숨겨진다', () => {
      const { container } = render(
        <Slider label="슬라이더" value={50} onChange={() => {}} />
      );
      const { svg, track, fill } = getLine(container);

      expect(getLineHost(container)).toContainElement(
        svg as unknown as HTMLElement
      );
      expect(svg).toContainElement(track as unknown as HTMLElement);
      expect(svg).toContainElement(fill as unknown as HTMLElement);
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('variant prop 테스트', () => {
    const wrapperOf = (container: HTMLElement) =>
      container.querySelector('[class*="sliderWrapper__"]') as HTMLElement;

    it('기본은 default이고 bar·wake 클래스가 붙지 않는다', () => {
      const { container } = render(<Slider label="슬라이더" />);

      expect(wrapperOf(container).className).toContain('variantStyles_default');
      expect(wrapperOf(container).className).not.toContain('variantStyles_bar');
    });

    it('variant="bar"는 wrapper에 bar 클래스를 붙이고 같은 입력으로 조작된다', () => {
      const onChange = vi.fn();
      const { container } = render(
        <Slider label="볼륨" variant="bar" onChange={onChange} />
      );
      const slider = screen.getByRole('slider');

      expect(wrapperOf(container).className).toContain('variantStyles_bar');
      fireEvent.change(slider, { target: { value: '40' } });
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(slider).toHaveValue('40');
    });

    it('variant는 input의 DOM 속성으로 새지 않는다', () => {
      render(<Slider label="슬라이더" variant="bar" />);

      expect(screen.getByRole('slider')).not.toHaveAttribute('variant');
    });

    it('bar에서도 채움 비율과 값 따라붙기가 그대로 동작한다', () => {
      const { container } = render(
        <Slider label="슬라이더" variant="bar" value={50} onChange={() => {}} />
      );

      expect(Number(getLine(container).clip.getAttribute('width'))).toBe(
        LINE_DEFAULT_WIDTH / 2
      );
      fireEvent.pointerDown(screen.getByRole('slider'));
      expect(getFollower(container)).toBeInTheDocument();
    });
  });

  describe('variant="wake" 테스트', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('기본에는 wake 막대가 없다', () => {
      const { container } = render(<Slider label="슬라이더" />);

      expect(getWakeHost(container)).not.toBeInTheDocument();
      expect(
        container.querySelector('[class*="sliderTrack__"]')
      ).toBeInTheDocument();
    });

    it('wake는 기존 트랙 선을 그리지 않고 막대를 트랙 위에 고르게 놓는다', () => {
      const { container } = render(
        <Slider
          label="슬라이더"
          variant="wake"
          min={0}
          max={10}
          step={1}
          value={4}
          onChange={() => {}}
        />
      );
      const bars = getWakeBars(container);

      expect(
        container.querySelector('[class*="sliderTrack__"]')
      ).not.toBeInTheDocument();
      // 처음과 끝 막대는 트랙 양끝, 그 사이는 같은 간격.
      expect(bars).toHaveLength(WAKE_DEFAULT_BARS);
      expect(bars.map((bar) => bar.style.left)).toEqual(
        bars.map((_, i) => `${(i / (bars.length - 1)) * 100}%`)
      );
      expect(bars[0].style.left).toBe('0%');
      expect(bars[bars.length - 1].style.left).toBe('100%');
    });

    it('막대 개수는 값 단계가 아니라 트랙 폭이 정한다: 폭을 모르면 기본 개수다', () => {
      const { container } = render(
        <Slider label="슬라이더" variant="wake" value={0} onChange={() => {}} />
      );

      // step 1이든 100이든 같다. 폭별 개수는 sliderMath.test.ts의 wakeBarCount가 맡는다.
      expect(getWakeBars(container)).toHaveLength(WAKE_DEFAULT_BARS);
      const coarse = render(
        <Slider
          label="슬라이더"
          variant="wake"
          step={50}
          value={0}
          onChange={() => {}}
        />
      );
      expect(getWakeBars(coarse.container)).toHaveLength(WAKE_DEFAULT_BARS);
    });

    it('값 이하 막대만 켜진다 (data-on)', () => {
      const { container, rerender } = render(
        <Slider
          label="슬라이더"
          variant="wake"
          min={0}
          max={10}
          value={4}
          onChange={() => {}}
        />
      );

      const on = () =>
        getWakeBars(container).map((bar) => bar.getAttribute('data-on'));
      // 막대 i의 위치(i / 31 * 100%)가 값(40%) 이하인 막대, i = 0..12
      expect(on()).toEqual([
        ...Array(13).fill('true'),
        ...Array(WAKE_DEFAULT_BARS - 13).fill('false'),
      ]);

      rerender(
        <Slider
          label="슬라이더"
          variant="wake"
          min={0}
          max={10}
          value={7}
          onChange={() => {}}
        />
      );
      // 70%: i = 0..21
      expect(on().filter((state) => state === 'true')).toHaveLength(22);
    });

    it('trackColor는 켜진 막대에만 입힌다', () => {
      const { container } = render(
        <Slider
          label="슬라이더"
          variant="wake"
          min={0}
          max={10}
          value={2}
          trackColor="rgb(255, 0, 0)"
          onChange={() => {}}
        />
      );
      const bars = getWakeBars(container);

      // 20%: i = 0..6
      expect(bars[0].style.backgroundColor).toBe('rgb(255, 0, 0)');
      expect(bars[6].style.backgroundColor).toBe('rgb(255, 0, 0)');
      expect(bars[7].style.backgroundColor).toBe('');
    });

    it('머리는 그대로 있고 막대 묶음은 aria-hidden이다', () => {
      const { container } = render(
        <Slider label="볼륨" variant="wake" value={3} onChange={() => {}} />
      );

      expect(screen.getByRole('slider', { name: '볼륨' })).toBeInTheDocument();
      expect(getWakeHost(container)).toHaveAttribute('aria-hidden', 'true');
    });

    /** 값을 from에서 to로 옮기고 ms만큼 프레임을 돌린다. */
    const swing = (from: number, to: number, ms = 112) => {
      const view = render(
        <Slider
          label="슬라이더"
          variant="wake"
          value={from}
          onChange={() => {}}
        />
      );
      view.rerender(
        <Slider
          label="슬라이더"
          variant="wake"
          value={to}
          onChange={() => {}}
        />
      );
      const host = getWakeHost(view.container)!;
      runFrames(host, ms);
      return {
        ...view,
        host,
        bars: getWakeBars(view.container),
        h: (host.__wakeHead!.pct / 100) * (WAKE_DEFAULT_BARS - 1),
        amp: ampAfter(from, to, ms),
      };
    };

    it('값이 바뀌면 머리 뒤로 막대가 솟고, 높이는 WakeSlider와 같은 식이다', () => {
      const { host, bars, h, amp } = swing(0, 60);

      expect(host.__wakeHead!.pct).toBeGreaterThan(0);
      expect(host.__wakeHead!.pct).toBeLessThan(60);
      expect(amp).toBeGreaterThan(0.5);
      bars.forEach((bar, i) => {
        expect(barScale(bar)).toBeCloseTo(
          waveScale(waveLift(i - h, 1, amp)),
          10
        );
      });
      expect(barScale(bars[Math.round(h)])).toBeGreaterThan(WAKE_REST_SCALE);
      expect(barScale(bars[0])).toBeCloseTo(WAKE_REST_SCALE, 10);
      expect(barScale(bars[bars.length - 1])).toBeCloseTo(WAKE_REST_SCALE, 10);
    });

    it('끄는 중 마지막 막대도 다른 막대와 같은 식이다(늘 최대 높이가 아니다)', () => {
      const { bars, h, amp } = swing(40, 100);
      const last = bars.length - 1;

      expect(barScale(bars[last])).toBeCloseTo(
        waveScale(waveLift(last - h, 1, amp)),
        10
      );
      expect(barScale(bars[last])).toBeLessThan(1);
    });

    it('머리가 맨 끝에 닿아도 마지막 막대는 멈춘 뒤 쉬는 높이다', () => {
      const { host, bars } = swing(20, 100);
      runFrames(host, 2000);

      expect(host.__wakeHead!.pct).toBe(100);
      expect(barScale(bars[bars.length - 1])).toBe(WAKE_REST_SCALE);
      expect(barScale(bars[bars.length - 2])).toBe(WAKE_REST_SCALE);
    });

    it('오른쪽으로 가면 머리 뒤(왼쪽)가 앞(오른쪽)보다 넓게 솟는다', () => {
      const { bars, h } = swing(0, 60);
      const base = Math.round(h);

      expect(barScale(bars[base - 6])).toBeGreaterThan(WAKE_REST_SCALE);
      expect(barScale(bars[base + 6])).toBeCloseTo(WAKE_REST_SCALE, 10);
    });

    it('왼쪽으로 가면 앞뒤가 뒤집힌다', () => {
      const { bars, h } = swing(100, 40);
      const base = Math.round(h);

      expect(barScale(bars[base + 6])).toBeGreaterThan(WAKE_REST_SCALE);
      expect(barScale(bars[base - 6])).toBeCloseTo(WAKE_REST_SCALE, 10);
    });

    it('머리가 멈추면 모든 막대가 쉬는 높이로 돌아가고, 이후 프레임은 계산하지 않는다', () => {
      const { host, bars } = swing(0, 60);
      runFrames(host, 2000);

      for (const bar of bars) {
        expect(barScale(bar)).toBeCloseTo(WAKE_REST_SCALE, 10);
      }

      // 멈춘 프레임은 건너뛴다: 막대에 표지를 두면 다음 프레임이 덮지 않는다.
      bars[10].style.setProperty('transform', 'scaleY(0.99)');
      runFrames(host, FRAME_MS);
      expect(barScale(bars[10])).toBe(0.99);
    });

    it('끄는 세기에 비례한다: 같은 시간에 센 끌기가 약한 끌기보다 물결이 높다', () => {
      const strong = swing(0, 60);
      const strongPeak = Math.max(...strong.bars.map(barScale));
      strong.unmount();
      const weak = swing(0, 12);
      const weakPeak = Math.max(...weak.bars.map(barScale));

      expect(weakPeak).toBeLessThan(strongPeak);
      expect(weakPeak).toBeGreaterThan(WAKE_REST_SCALE);
      expect(waveAmp(0)).toBe(0);
    });

    it('물결은 서서히 차오른다: 끌기 시작한 첫 프레임은 거의 평평하고 뒤로 갈수록 솟는다', () => {
      const view = render(
        <Slider label="슬라이더" variant="wake" value={0} onChange={() => {}} />
      );
      view.rerender(
        <Slider
          label="슬라이더"
          variant="wake"
          value={100}
          onChange={() => {}}
        />
      );
      const host = getWakeHost(view.container)!;
      const bars = getWakeBars(view.container);
      const peak = () => Math.max(...bars.map(barScale));

      runFrames(host, FRAME_MS);
      const first = peak();
      runFrames(host, 4 * FRAME_MS);
      const later = peak();

      expect(first).toBeLessThan(WAKE_REST_SCALE + 0.02);
      expect(later).toBeGreaterThan(first + 0.2);
    });

    it('프레임 간격이 아주 커도 머리가 발산하지 않고 한 프레임에 64ms만 흐른다', () => {
      const { host, bars } = swing(0, 100, 0);
      act(() => {
        host.__wakeTick!(0, 5000);
      });

      const capped = springsAfter(0, 100, 64).x;
      expect(host.__wakeHead!.pct).toBeCloseTo(capped, 6);
      expect(host.__wakeHead!.pct).toBeLessThan(100);
      for (const bar of bars) {
        expect(barScale(bar)).toBeGreaterThanOrEqual(WAKE_REST_SCALE - 1e-9);
        expect(barScale(bar)).toBeLessThanOrEqual(1);
      }
    });

    it('물결 세기는 px 속도로 잰다: 같은 px/s면 트랙 폭(129, 320, 806)과 무관하게 같은 물결이다', () => {
      // 폭마다 머리 목표를 100px 옮긴다(폭이 넓을수록 pct 변화는 작다).
      const STEP_PX = 100;
      const MS = 80;
      for (const width of [129, 320, 806]) {
        Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
          configurable: true,
          get: () => width,
        });
        try {
          const jsx = (value: number) => (
            <Slider
              label="슬라이더"
              variant="wake"
              step={0.001}
              value={value}
              onChange={() => {}}
            />
          );
          const { container, rerender, unmount } = render(jsx(10));
          const host = getWakeHost(container)!;
          const bars = getWakeBars(container);
          expect(bars).toHaveLength(wakeBarCount(width));
          rerender(jsx(10 + (STEP_PX / width) * 100));
          runFrames(host, MS);

          // 기대 세기는 px 단위로 돌린 스프링에서 나온다(폭과 무관).
          let state: WakeSprings = { x: 0, v: 0, s: 0, ds: 0 };
          for (let t = 0; t < MS; t += FRAME_MS) {
            state = stepWakeSprings(state, STEP_PX, FRAME_MS / 1000);
          }
          const amp = waveAmp(state.s);
          expect(amp).toBeGreaterThan(0.3);

          const gap = width / (bars.length - 1);
          const h = (host.__wakeHead!.pct / 100) * (bars.length - 1);
          bars.forEach((bar, i) => {
            expect(barScale(bar)).toBeCloseTo(
              waveScale(waveLift(i - h, 1, amp, gap)),
              10
            );
          });
          expect(Math.max(...bars.map(barScale))).toBeGreaterThan(
            WAKE_REST_SCALE + 0.1
          );
          unmount();
        } finally {
          delete (HTMLElement.prototype as { clientWidth?: number })
            .clientWidth;
        }
      }
    });

    it('키보드로 값이 바뀌어도 같은 물결이다 (잡지 않아도)', () => {
      const { container } = render(
        <Slider label="슬라이더" variant="wake" defaultValue={20} />
      );
      const host = getWakeHost(container)!;
      const slider = screen.getByRole('slider');

      fireEvent.change(slider, { target: { value: '80' } });
      runFrames(host, 112);

      expect(Math.max(...getWakeBars(container).map(barScale))).toBeGreaterThan(
        WAKE_REST_SCALE
      );
    });

    it('축소 선호에서는 물결이 없다: 티커도 머리 스프링도 없고 막대는 쉬는 높이, 색만 값을 따른다', () => {
      installReducedMotion();
      const before = tickerListeners();
      const { container, rerender } = render(
        <Slider
          label="슬라이더"
          variant="wake"
          min={0}
          max={10}
          value={2}
          onChange={() => {}}
        />
      );
      const host = getWakeHost(container)!;

      expect(tickerListeners()).toBe(before);
      expect(host.__wakeTick).toBeUndefined();
      expect(host.__wakeHead).toBeUndefined();

      rerender(
        <Slider
          label="슬라이더"
          variant="wake"
          min={0}
          max={10}
          value={8}
          onChange={() => {}}
        />
      );
      for (const bar of getWakeBars(container)) {
        expect(bar.style.getPropertyValue('transform')).toBe('');
      }
      // 80%: i = 0..24
      expect(
        getWakeBars(container).filter((bar) => bar.dataset.on === 'true')
      ).toHaveLength(25);
    });

    it('티커는 마운트에 하나 붙고 언마운트에 떼어진다', () => {
      const before = tickerListeners();
      const view = render(
        <Slider label="슬라이더" variant="wake" value={5} onChange={() => {}} />
      );

      expect(tickerListeners()).toBe(before + 1);

      view.unmount();
      expect(tickerListeners()).toBe(before);
    });

    it('변형이 wake에서 default로 바뀌어도 티커는 하나다 (막대 쪽은 떼고 라인 쪽을 붙인다)', () => {
      const before = tickerListeners();
      const { container, rerender } = render(
        <Slider label="슬라이더" variant="wake" value={5} onChange={() => {}} />
      );
      rerender(
        <Slider
          label="슬라이더"
          variant="default"
          value={5}
          onChange={() => {}}
        />
      );

      expect(tickerListeners()).toBe(before + 1);
      expect(getWakeHost(container)).not.toBeInTheDocument();
    });
  });

  describe('default·bar 라인 물결과 호버 두께', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    type LineVariant = 'default' | 'bar';
    const lineJsx = (variant: LineVariant, value: number, extra = {}) => (
      <Slider
        label="슬라이더"
        variant={variant}
        value={value}
        onChange={() => {}}
        {...extra}
      />
    );
    const fillProfile = (container: HTMLElement) =>
      thicknessProfile(getLine(container).fill.getAttribute('d')!);
    const peak = (profile: { t: number }[]) =>
      Math.max(...profile.map(({ t }) => t));

    /** 값을 from에서 to로 옮기고 ms만큼 프레임을 돌린다. amp는 같은 프레임을 순수 스프링으로 돌려 낸 세기다. */
    const lineSwing = (
      from: number,
      to: number,
      { ms = 112, variant = 'default' as LineVariant } = {}
    ) => {
      const view = render(lineJsx(variant, from));
      view.rerender(lineJsx(variant, to));
      const host = getLineHost(view.container)!;
      runFrames(host, ms);
      return {
        ...view,
        host,
        profile: fillProfile(view.container),
        headX: headCenterX(host.__wakeHead!.pct),
        amp: ampAfter(from, to, ms),
      };
    };

    it('쉬는 라인은 상수 두께 알약이다: default 6px, bar 8px, 끝은 반원', () => {
      const flat = render(lineJsx('default', 50));
      const { fill, track } = getLine(flat.container);

      expect(
        fillProfile(flat.container).every(({ t }) => t === LINE_REST)
      ).toBe(true);
      // 바깥 반지름 3, 1px 테두리를 따라 0.5 들인 안쪽 반지름 2.5
      expect(fill.getAttribute('d')!.match(/A3,3 0 0 1/g)).toHaveLength(2);
      expect(track.getAttribute('d')!.match(/A2\.5,2\.5 0 0 1/g)).toHaveLength(
        2
      );
      expect(getLineHost(flat.container)!.style.height).toBe(`${LINE_REST}px`);
      flat.unmount();

      const bar = render(lineJsx('bar', 50));
      expect(
        fillProfile(bar.container).every(({ t }) => t === LINE_BAR_REST)
      ).toBe(true);
      expect(getLineHost(bar.container)!.style.height).toBe(
        `${LINE_BAR_REST}px`
      );
    });

    it('끄면 머리 둘레가 세기만큼 부풀되 최대 20px을 넘지 않는다', () => {
      const { profile, headX, amp } = lineSwing(0, 60);
      const top = profile.reduce((a, b) => (b.t > a.t ? b : a));

      expect(amp).toBeGreaterThan(0.5);
      expect(peak(profile)).toBeLessThanOrEqual(LINE_WAVE_MAX + 0.02);
      expect(peak(profile)).toBeGreaterThan(LINE_REST + amp * 14 - 0.5);
      expect(Math.abs(top.x - headX)).toBeLessThanOrEqual(2);
      // 머리에서 멀면 쉬는 두께다.
      expect(profile[profile.length - 2].t).toBe(LINE_REST);
    });

    it('물결은 px 단위로 연속이다: 이웃 점의 두께 차가 작다', () => {
      const { profile } = lineSwing(0, 60);

      for (let i = 1; i < profile.length - 1; i++) {
        expect(Math.abs(profile[i].t - profile[i - 1].t)).toBeLessThan(2.5);
      }
    });

    it('오른쪽으로 가면 머리 뒤(왼쪽)가 앞(오른쪽)보다 넓게 부푼다', () => {
      const { profile, headX } = lineSwing(0, 60);
      const swollen = (side: (x: number) => boolean) =>
        profile.filter(({ x, t }) => side(x) && t > LINE_REST + 0.5).length;

      expect(swollen((x) => x < headX)).toBeGreaterThan(
        swollen((x) => x > headX)
      );
    });

    it('왼쪽으로 가면 앞뒤가 뒤집힌다', () => {
      const { profile, headX } = lineSwing(100, 40);
      const swollen = (side: (x: number) => boolean) =>
        profile.filter(({ x, t }) => side(x) && t > LINE_REST + 0.5).length;

      expect(swollen((x) => x > headX)).toBeGreaterThan(
        swollen((x) => x < headX)
      );
    });

    it('bar도 같은 물결이다: 바탕 두께 8px에서 20px까지', () => {
      const { profile, amp } = lineSwing(0, 60, { variant: 'bar' });

      expect(peak(profile)).toBeGreaterThan(
        LINE_BAR_REST + amp * (LINE_WAVE_MAX - LINE_BAR_REST) - 0.5
      );
      expect(peak(profile)).toBeLessThanOrEqual(LINE_WAVE_MAX + 0.02);
    });

    it('끄는 세기에 비례한다: 같은 시간에 센 끌기가 약한 끌기보다 더 부푼다', () => {
      const strong = lineSwing(0, 60);
      const strongPeak = peak(strong.profile);
      strong.unmount();
      const weak = lineSwing(0, 12);

      expect(peak(weak.profile)).toBeLessThan(strongPeak);
      expect(peak(weak.profile)).toBeGreaterThan(LINE_REST);
    });

    it('서서히 차오른다: 끌기 시작한 첫 프레임은 거의 평평하고 뒤로 갈수록 부푼다', () => {
      const view = render(lineJsx('default', 0));
      view.rerender(lineJsx('default', 100));
      const host = getLineHost(view.container)!;

      runFrames(host, FRAME_MS);
      const first = peak(fillProfile(view.container));
      runFrames(host, 4 * FRAME_MS);
      const later = peak(fillProfile(view.container));

      expect(first).toBeLessThan(LINE_REST + 0.5);
      expect(later).toBeGreaterThan(first + 5);
    });

    it('멈추면 매끈한 쉬는 두께로 돌아가고, 이후 프레임은 경로를 다시 쓰지 않는다', () => {
      const { host, container } = lineSwing(0, 60);
      runFrames(host, 2000);

      expect(fillProfile(container).every(({ t }) => t === LINE_REST)).toBe(
        true
      );

      // 멈춘 프레임은 건너뛴다: 경로에 표지를 두면 다음 프레임이 덮지 않는다.
      const { fill } = getLine(container);
      fill.setAttribute('d', 'M0,0');
      runFrames(host, FRAME_MS);
      expect(fill.getAttribute('d')).toBe('M0,0');
    });

    it('키보드로 값이 바뀌어도 같은 물결이다 (잡지 않아도)', () => {
      const { container } = render(
        <Slider label="슬라이더" defaultValue={20} />
      );
      const host = getLineHost(container)!;

      fireEvent.change(screen.getByRole('slider'), { target: { value: '80' } });
      runFrames(host, 112);

      expect(peak(fillProfile(container))).toBeGreaterThan(LINE_REST + 5);
    });

    it('채운 부분은 값 위치에서 잘린다: default는 곧게, bar는 둥글게', () => {
      const flat = render(lineJsx('default', 30));
      const flatLine = getLine(flat.container);
      const flatXs = pathPoints(flatLine.fill.getAttribute('d')!).map(
        (p) => p.x
      );

      expect(Number(flatLine.clip.getAttribute('width'))).toBe(
        LINE_DEFAULT_WIDTH * 0.3
      );
      // 모양은 트랙 전체이고, 값 위치에서 clipPath가 자른다.
      expect(Math.max(...flatXs)).toBeGreaterThan(LINE_DEFAULT_WIDTH - 4);
      flat.unmount();

      const bar = render(lineJsx('bar', 30));
      const barLine = getLine(bar.container);
      const barXs = pathPoints(barLine.fill.getAttribute('d')!).map((p) => p.x);

      expect(Number(barLine.clip.getAttribute('width'))).toBe(
        LINE_DEFAULT_WIDTH * 0.3
      );
      // 모양 자체가 값 위치에서 끝난다: 오른쪽 반원(반지름 4)이 값 위치에 닿는다.
      expect(Math.max(...barXs) + LINE_BAR_REST / 2).toBe(
        LINE_DEFAULT_WIDTH * 0.3
      );
      expect(barLine.fill.getAttribute('d')).toContain('A4,4 0 0 1');
    });

    it('값이 바뀌면 채움이 따라 바뀐다', () => {
      const { container, rerender } = render(lineJsx('default', 30));
      rerender(lineJsx('default', 80));

      expect(Number(getLine(container).clip.getAttribute('width'))).toBe(
        LINE_DEFAULT_WIDTH * 0.8
      );
    });

    it('폭을 읽으면 viewBox와 채움이 그 폭에 맞는다', () => {
      Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
        configurable: true,
        get: () => 320,
      });
      try {
        const { container } = render(lineJsx('default', 50));
        const { svg, clip } = getLine(container);

        expect(svg.getAttribute('viewBox')).toBe(`0 0 320 ${LINE_BOX_HEIGHT}`);
        expect(Number(clip.getAttribute('width'))).toBe(160);
      } finally {
        delete (HTMLElement.prototype as { clientWidth?: number }).clientWidth;
      }
    });

    it('티커는 default·bar도 마운트에 하나 붙고 언마운트에 떼어진다', () => {
      const before = tickerListeners();
      const view = render(lineJsx('default', 5));
      const bar = render(lineJsx('bar', 5));

      expect(tickerListeners()).toBe(before + 2);
      view.unmount();
      bar.unmount();
      expect(tickerListeners()).toBe(before);
    });

    it('축소 선호에서는 물결도 호버 두께도 없다: 티커도 트윈도 없고 쉬는 두께', () => {
      installReducedMotion();
      const before = tickerListeners();
      const { container, rerender } = render(lineJsx('default', 20));
      const host = getLineHost(container)!;

      expect(tickerListeners()).toBe(before);
      expect(host.__wakeTick).toBeUndefined();
      expect(host.__wakeHead).toBeUndefined();

      rerender(lineJsx('default', 80));
      pointer(screen.getByRole('slider').parentElement!, 'pointerover');
      expect(host.__hoverTween).toBeUndefined();
      expect(fillProfile(container).every(({ t }) => t === LINE_REST)).toBe(
        true
      );
      expect(host.style.height).toBe(`${LINE_REST}px`);
      // 값은 그대로 채움이 따른다.
      expect(Number(getLine(container).clip.getAttribute('width'))).toBe(
        LINE_DEFAULT_WIDTH * 0.8
      );
    });

    describe('호버 두께 (GSAP)', () => {
      const wrapperOf = (container: HTMLElement) =>
        container.querySelector('[class*="sliderWrapper__"]') as HTMLElement;
      const enter = (container: HTMLElement, pointerType = 'mouse') =>
        pointer(wrapperOf(container), 'pointerover', pointerType);

      it('마우스가 들어오면 바탕 두께가 slow spring 트윈으로 9px까지 간다', () => {
        const { container } = render(lineJsx('default', 50));
        const host = getLineHost(container)!;
        enter(container);

        const tween = host.__hoverTween!;
        expect(tween).toBeDefined();
        expect(tween.duration()).toBe(gsapDuration.slow);
        expect(tween.vars.ease).toBe(gsapEasing.spring);
        expect(tween.vars.base).toBe(LINE_HOVER);

        act(() => {
          tween.progress(1);
        });
        expect(host.style.height).toBe(`${LINE_HOVER}px`);
        expect(fillProfile(container).every(({ t }) => t === LINE_HOVER)).toBe(
          true
        );
      });

      it('나가면 base settle 트윈으로 쉬는 두께 6px로 돌아간다', () => {
        const { container } = render(lineJsx('default', 50));
        const host = getLineHost(container)!;
        enter(container);
        act(() => {
          host.__hoverTween!.progress(1);
        });
        pointer(wrapperOf(container), 'pointerout');

        const tween = host.__hoverTween!;
        expect(tween.duration()).toBe(gsapDuration.base);
        expect(tween.vars.ease).toBe(gsapEasing.settle);
        expect(tween.vars.base).toBe(LINE_REST);

        act(() => {
          tween.progress(1);
        });
        expect(host.style.height).toBe(`${LINE_REST}px`);
      });

      it('bar는 8px에서 12px까지 간다', () => {
        const { container } = render(lineJsx('bar', 50));
        const host = getLineHost(container)!;
        enter(container);
        act(() => {
          host.__hoverTween!.progress(1);
        });

        expect(host.__hoverTween!.vars.base).toBe(LINE_BAR_HOVER);
        expect(host.style.height).toBe(`${LINE_BAR_HOVER}px`);
      });

      it('호버 중에 값이 바뀌어도 두께가 쉬는 두께로 튕기지 않는다', () => {
        const { container, rerender } = render(lineJsx('default', 50));
        const host = getLineHost(container)!;
        enter(container);
        act(() => {
          host.__hoverTween!.progress(1);
        });
        rerender(lineJsx('default', 70));

        expect(host.style.height).toBe(`${LINE_HOVER}px`);
      });

      it('마우스만: 터치·펜은 두꺼워지지 않는다', () => {
        for (const pointerType of ['touch', 'pen']) {
          const { container, unmount } = render(lineJsx('default', 50));
          enter(container, pointerType);

          expect(getLineHost(container)!.__hoverTween).toBeUndefined();
          unmount();
        }
      });

      it('비활성이면 두꺼워지지 않는다', () => {
        const { container } = render(
          <Slider label="슬라이더" value={50} disabled onChange={() => {}} />
        );
        enter(container);

        expect(getLineHost(container)!.__hoverTween).toBeUndefined();
        expect(getLineHost(container)!.style.height).toBe(`${LINE_REST}px`);
      });
    });
  });
});
