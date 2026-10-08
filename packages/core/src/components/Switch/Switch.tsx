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
// 도착 효과. 사용자 결정(M5 task-17): 켜질 때 20px 머리가 26px까지 커져 24px
// 트랙을 위아래 1px씩 넘어서고(세로 1.3), 꺼질 때는 17px까지 작아졌다 돌아온다
// (0.85). 크기는 md 기준이고 sm·lg도 같은 비율(scale)로 간다. 가로 1.2는 세로가
// 더 큰 젤리 모양을 만든다. md에서 가로 24px가 트랙 바깥 오른쪽 끝(44px 중 끝)에
// 닿는 값이다.
const THUMB_SWELL_X = 1.2;
const THUMB_SWELL_Y = 1.3;
const THUMB_SHRINK = 0.85;
// 도착 부풂이 시작하는 시점: 이동 구간이 80% 지난 때.
const ARRIVE_RATIO = 0.8;

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

// 켜짐·꺼짐 머리 움직임의 공통 뼈대. 출발 전 늘임, 이동과 같은 커브·길이로 늘임
// 풀기(settle은 출발이 가장 빨라서 빨리 움직일 때 길고 느려지면 둥글어진다),
// 도착 부풂(켜짐 커짐, 꺼짐 작아짐), 500ms 스프링 되튐 순서다.
const addThumbMotion = (
  timeline: gsap.core.Timeline,
  thumb: HTMLSpanElement,
  x: number,
  arrival: { scaleX: number; scaleY: number }
): void => {
  const squashDuration = gsapDuration.slow * SQUASH_PORTION;
  const moveDuration = gsapDuration.slow - squashDuration;
  const arriveAt = squashDuration + moveDuration * ARRIVE_RATIO;

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
  // 이동과 늘임 풀기는 같은 구간에서 같은 커브로 겹친다. 의도된 겹침이다.
  timeline.to(
    thumb,
    { x, duration: moveDuration, ease: gsapEasing.settle },
    squashDuration
  );
  timeline.to(
    thumb,
    { scaleX: 1, scaleY: 1, duration: moveDuration, ease: gsapEasing.settle },
    squashDuration
  );
  // 늘임 풀기와 끝 20%가 겹치는데, overwrite 'auto'가 부풂이 시작될 때 풀기의
  // scale 값만 거두어 간다.
  timeline.to(
    thumb,
    { ...arrival, duration: gsapDuration.fast, ease: gsapEasing.settle },
    arriveAt
  );
  timeline.to(
    thumb,
    {
      scaleX: 1,
      scaleY: 1,
      duration: gsapDuration.slower,
      ease: gsapEasing.spring,
    },
    arriveAt + gsapDuration.fast
  );
};

const buildOnTimeline = (
  sweep: HTMLSpanElement,
  thumb: HTMLSpanElement,
  size: SwitchSize,
  reduced: boolean
): gsap.core.Timeline =>
  gateMotion(reduced, () => {
    const timeline = gsap.timeline({ defaults: { overwrite: 'auto' } });

    timeline.to(
      sweep,
      { scaleX: 1, duration: gsapDuration.slow, ease: gsapEasing.settle },
      0
    );
    addThumbMotion(timeline, thumb, styles.thumbOffset[size], {
      scaleX: THUMB_SWELL_X,
      scaleY: THUMB_SWELL_Y,
    });

    return timeline;
  });

const buildOffTimeline = (
  sweep: HTMLSpanElement,
  thumb: HTMLSpanElement,
  reduced: boolean
): gsap.core.Timeline =>
  gateMotion(reduced, () => {
    const timeline = gsap.timeline({ defaults: { overwrite: 'auto' } });

    // 역재생하지 않는다(Ruling 41). 스윕은 지금 길이의 exit으로 빠지고, 머리는
    // 켜짐과 같은 늘임으로 출발한다. 머리 타임라인이 길어도 스윕 길이는 그대로다.
    // scale을 1로 되돌리는 트윈이 머리 움직임에 들어 있어서, on 타임라인이
    // 눌림 구간에서 끊겨도 눌린 채 정지하지 않는다(Ruling 77).
    timeline.to(
      sweep,
      {
        scaleX: 0,
        duration: gsapDuration.slow * EXIT_RATIO,
        ease: gsapEasing.exit,
      },
      0
    );
    addThumbMotion(timeline, thumb, 0, {
      scaleX: THUMB_SHRINK,
      scaleY: THUMB_SHRINK,
    });

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
            <span
              className={clsx(styles.sweep, error && styles.sweepInside)}
              ref={sweepRef}
              aria-hidden="true"
            />
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
