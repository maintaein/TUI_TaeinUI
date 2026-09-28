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

const THUMB_STRETCH_X = 1.18;
const THUMB_SQUASH_Y = 0.82;
const SQUASH_PORTION = 0.2;
const EXIT_RATIO = 0.65;

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

const buildOnTimeline = (
  sweep: HTMLSpanElement,
  thumb: HTMLSpanElement,
  size: SwitchSize,
  reduced: boolean
): gsap.core.Timeline =>
  gateMotion(reduced, () => {
    const timeline = gsap.timeline({ defaults: { overwrite: 'auto' } });
    const squashDuration = gsapDuration.slow * SQUASH_PORTION;
    const settleDuration = gsapDuration.slow * (1 - SQUASH_PORTION);

    timeline.to(
      sweep,
      { scaleX: 1, duration: gsapDuration.slow, ease: gsapEasing.settle },
      0
    );
    timeline.to(
      thumb,
      {
        scaleX: THUMB_STRETCH_X,
        scaleY: THUMB_SQUASH_Y,
        duration: squashDuration,
        ease: gsapEasing.exit,
      },
      0
    );
    // 이동(snap)과 눌림 복원(spring)은 같은 구간에서 겹친다 — 의도된 겹침이다.
    timeline.to(
      thumb,
      {
        x: styles.thumbOffset[size],
        duration: settleDuration,
        ease: gsapEasing.snap,
      },
      squashDuration
    );
    timeline.to(
      thumb,
      {
        scaleX: 1,
        scaleY: 1,
        duration: settleDuration,
        ease: gsapEasing.spring,
      },
      squashDuration
    );

    return timeline;
  });

const buildOffTimeline = (
  sweep: HTMLSpanElement,
  thumb: HTMLSpanElement,
  reduced: boolean
): gsap.core.Timeline =>
  gateMotion(reduced, () => {
    const timeline = gsap.timeline({ defaults: { overwrite: 'auto' } });
    const duration = gsapDuration.slow * EXIT_RATIO;

    // 역재생하지 않는다(Ruling 41) — squash 없이 exit 이징 하나로 짧게 빠진다.
    timeline.to(thumb, { x: 0, duration, ease: gsapEasing.exit }, 0);
    timeline.to(sweep, { scaleX: 0, duration, ease: gsapEasing.exit }, 0);

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
    gsap.set(thumb, {
      yPercent: -50,
      x: nextState === 'on' ? styles.thumbOffset[size] : 0,
      scaleX: 1,
      scaleY: 1,
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

  const timeline =
    nextState === 'on'
      ? buildOnTimeline(sweep, thumb, size, reduced)
      : buildOffTimeline(sweep, thumb, reduced);
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
            <span className={styles.sweep} ref={sweepRef} aria-hidden="true" />
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
            <span className={styles.thumbSize[size]} ref={thumbRef} />
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
