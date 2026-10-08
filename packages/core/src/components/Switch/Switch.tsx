import {
  forwardRef,
  useId,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import type { ChangeEvent, InputHTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { gsap } from 'gsap';
import * as styles from './Switch.css';
import { gateMotion, settleMotion } from '../../hooks/gateMotion';
import { gsapDuration, gsapEasing } from '../../tokens/gsapEasing';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { ON_SCALE, thumbFrame } from './switchMotion';

// 켜진 크기로 바뀌는 시점: 이동 구간이 80% 지난 때. 이동하는 동안은 출발 크기로
// 늘었다 둥글어지고, 도착이 가까워서야 켜지면 커지고 꺼지면 작아진다.
const SIZE_CHANGE_RATIO = 0.8;

type SwitchSize = keyof typeof styles.thumbOffset;
type SwitchState = 'off' | 'on';

interface SwitchTimelineHost extends HTMLDivElement {
  __switchTimeline?: gsap.core.Timeline;
}

const attachSelfKill = (
  timeline: gsap.core.Timeline,
  track: SwitchTimelineHost,
  reduced: boolean
): void => {
  if (reduced) {
    track.__switchTimeline = undefined;
    return;
  }
  track.__switchTimeline = timeline;
  timeline.eventCallback('onComplete', () => {
    timeline.kill();
    track.__switchTimeline = undefined;
  });
};

// 켜짐·꺼짐 머리 움직임. 진행값 `p` 하나가 머리 x·늘임·파란 채움을 같이 움직이고,
// 켜진 크기(`base`)는 이동 80% 시점에 따로 바뀐다. 시작값은 DOM의 지금 값에서
// 읽으므로 진행 중에 반대로 바뀌어도 x·크기·늘임이 끊기지 않고 이어진다.
const buildTimeline = (
  sweep: HTMLSpanElement,
  thumb: HTMLSpanElement,
  size: SwitchSize,
  nextState: SwitchState,
  reduced: boolean
): gsap.core.Timeline =>
  gateMotion(reduced, () => {
    const on = nextState === 'on';
    const scaleX = Number(gsap.getProperty(thumb, 'scaleX'));
    const scaleY = Number(gsap.getProperty(thumb, 'scaleY'));
    const from = {
      x: Number(gsap.getProperty(thumb, 'x')),
      sweep: Number(gsap.getProperty(sweep, 'scaleX')),
      k: Math.sqrt(scaleX / scaleY),
    };
    const to = { x: on ? styles.thumbOffset[size] : 0, sweep: on ? 1 : 0 };
    const state = { p: 0, base: Math.sqrt(scaleX * scaleY) };

    const write = (): void => {
      const frame = thumbFrame(state.p, state.base, from.k);
      gsap.set(thumb, {
        x: from.x + (to.x - from.x) * state.p,
        scaleX: frame.scaleX,
        scaleY: frame.scaleY,
      });
      gsap.set(sweep, {
        scaleX: from.sweep + (to.sweep - from.sweep) * state.p,
      });
    };

    const timeline = gsap.timeline();
    timeline.to(
      state,
      {
        p: 1,
        duration: gsapDuration.slow,
        ease: gsapEasing.drift,
        onUpdate: write,
      },
      0
    );
    timeline.to(
      state,
      {
        base: on ? ON_SCALE[size] : 1,
        duration: gsapDuration.base,
        ease: gsapEasing.drift,
        onUpdate: write,
      },
      gsapDuration.slow * SIZE_CHANGE_RATIO
    );

    return timeline;
  });

const syncSwitchState = (
  inputEl: HTMLInputElement,
  track: SwitchTimelineHost,
  sweep: HTMLSpanElement,
  thumb: HTMLSpanElement,
  size: SwitchSize,
  stateRef: React.MutableRefObject<SwitchState | null>,
  nextState: SwitchState,
  reduced: boolean
): void => {
  // aria-checked의 진실 원천은 DOM이다 — JSX 프롭은 첫 페인트만 책임진다(Ruling 40).
  inputEl.setAttribute('aria-checked', String(nextState === 'on'));

  const prev = stateRef.current;

  if (prev === null) {
    // 켜진 채 마운트되면 머리는 처음부터 켜진 크기다.
    const base = nextState === 'on' ? ON_SCALE[size] : 1;
    gsap.set(thumb, {
      yPercent: -50,
      x: nextState === 'on' ? styles.thumbOffset[size] : 0,
      scaleX: base,
      scaleY: base,
    });
    gsap.set(sweep, { scaleX: nextState === 'on' ? 1 : 0 });
    stateRef.current = nextState;
    return;
  }

  if (prev === nextState) {
    if (reduced && track.__switchTimeline) {
      settleMotion(track.__switchTimeline);
      track.__switchTimeline = undefined;
    }
    return;
  }

  track.__switchTimeline?.kill();

  const timeline = buildTimeline(sweep, thumb, size, nextState, reduced);
  attachSelfKill(timeline, track, reduced);

  stateRef.current = nextState;
};

/** 토글 스위치 입력 컴포넌트 */
export interface SwitchProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'size'
> {
  /** 레이블 텍스트 */
  label: string;
  /** Switch size */
  size?: SwitchSize;
  /** 에러 상태 */
  error?: boolean;
  /** 에러 메시지 */
  errorMessage?: string;
  /** 도움말 텍스트 */
  helperText?: string;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  (
    {
      label,
      size = 'md',
      error = false,
      errorMessage,
      helperText,
      required = false,
      disabled = false,
      className,
      ...rest
    },
    ref
  ) => {
    const switchId = useId();
    const helperId = useId();
    const reduced = useReducedMotion();

    const internalRef = useRef<HTMLInputElement | null>(null);
    const trackRef = useRef<SwitchTimelineHost>(null);
    const sweepRef = useRef<HTMLSpanElement>(null);
    const thumbRef = useRef<HTMLSpanElement>(null);
    const switchStateRef = useRef<SwitchState | null>(null);

    // 첫 페인트에서만 쓰는 값 — 이후 렌더에서 다시 계산하면 React가 GSAP이 쓴
    // aria-checked를 다시 덮어써버린다(Checkbox의 d 버그와 같은 종류).
    const [initialAriaChecked] = useState(() =>
      Boolean(rest.checked ?? rest.defaultChecked)
    );

    // 개발 환경에서 label 검증
    if (process.env.NODE_ENV === 'development') {
      if (!label) {
        console.error(
          'Switch: label prop은 필수입니다. 접근성을 위해 label을 제공하세요.'
        );
      }
    }

    // helperText 또는 errorMessage 표시
    const showHelper = !error && helperText;
    const showError = error && errorMessage;

    useLayoutEffect(() => {
      const inputEl =
        (ref as React.RefObject<HTMLInputElement>)?.current ||
        internalRef.current;
      const track = trackRef.current;
      const sweep = sweepRef.current;
      const thumb = thumbRef.current;
      if (!inputEl || !track || !sweep || !thumb) return;

      const nextState: SwitchState = inputEl.checked ? 'on' : 'off';
      syncSwitchState(
        inputEl,
        track,
        sweep,
        thumb,
        size,
        switchStateRef,
        nextState,
        reduced
      );
    }, [rest.checked, reduced, size, ref]);

    useEffect(() => {
      const track = trackRef.current;
      return () => {
        track?.__switchTimeline?.kill();
      };
    }, []);

    const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
      const track = trackRef.current;
      const sweep = sweepRef.current;
      const thumb = thumbRef.current;
      const target = event.currentTarget;
      if (track && sweep && thumb) {
        const nextState: SwitchState = target.checked ? 'on' : 'off';
        syncSwitchState(
          target,
          track,
          sweep,
          thumb,
          size,
          switchStateRef,
          nextState,
          reduced
        );
      }
      rest.onChange?.(event);
    };

    return (
      <div className={styles.wrapper}>
        {/* Switch Container */}
        <label htmlFor={switchId} className={styles.switchLabel}>
          {/* Label Text */}
          <span className={styles.labelText}>
            {label}
            {required && <span className={styles.required}>*</span>}
          </span>

          {/* Switch Track */}
          <div
            ref={trackRef}
            className={clsx(
              styles.switchContainer,
              styles.size[size],
              error && styles.error
            )}
          >
            <span
              className={clsx(styles.sweepClip, error && styles.sweepInside)}
              aria-hidden="true"
            >
              <span className={styles.sweep} ref={sweepRef} />
            </span>
            <input
              ref={(element) => {
                internalRef.current = element;
                if (typeof ref === 'function') {
                  ref(element);
                } else if (ref) {
                  ref.current = element;
                }
              }}
              id={switchId}
              type="checkbox"
              role="switch"
              required={required}
              disabled={disabled}
              aria-checked={initialAriaChecked}
              aria-invalid={error}
              aria-disabled={disabled}
              aria-describedby={showHelper || showError ? helperId : undefined}
              className={clsx(
                styles.switchInput,
                error && styles.error,
                className
              )}
              {...rest}
              onChange={handleChange}
            />
            <span className={styles.thumbSize[size]} ref={thumbRef}>
              <span className={styles.thumbFace} />
            </span>
          </div>
        </label>

        {/* Helper Text or Error Message */}
        {showHelper && (
          <span id={helperId} className={styles.helperText}>
            {helperText}
          </span>
        )}
        {showError && (
          <span id={helperId} className={styles.errorMessage}>
            {errorMessage}
          </span>
        )}
      </div>
    );
  }
);

Switch.displayName = 'Switch';
