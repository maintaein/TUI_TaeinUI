import {
  forwardRef,
  useId,
  useState,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type InputHTMLAttributes,
  type ChangeEvent,
  type KeyboardEvent,
} from 'react';
import clsx from 'clsx';
import { gsap } from 'gsap';
import { gateMotion } from '../../hooks/gateMotion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { gsapEasing, gsapDuration } from '../../tokens/gsapEasing';
import {
  container,
  labelContainer,
  label as labelClass,
  required as requiredClass,
  valueDisplay,
  sliderWrapper,
  sliderTrack,
  sliderFillTrack,
  slider as sliderClass,
  sizeVariants,
  helperText as helperTextClass,
  marksContainer,
  mark,
  markLabel,
  scrubTicksContainer,
  scrubTick,
  scrubTickLanded,
  valueFollower,
} from './Slider.css';

/** 슬라이더 트랙 위에 표시되는 마크 */
export interface SliderMark {
  /** 마크 위치 (min~max 범위 내 값) */
  value: number;
  /** 마크 레이블 텍스트 */
  label: string;
}

/**
 * 테스트 전용. 눈금 그룹의 등장·퇴장 타임라인을 `progress()`로 직접 seek하기
 * 위한 DOM 확장(Snackbar의 `CountdownTweenHost`와 같은 패턴). 공개 API로
 * 내보내지 않는다 — `components/Slider/index.ts`는 `Slider`·`SliderProps`·
 * `SliderMark`만 named export한다.
 */
interface ScrubTicksTimelineHost extends HTMLDivElement {
  __scrubTicksTimeline?: gsap.core.Timeline;
}

/** 테스트 전용. 값 따라붙기 quickTo가 만든 트윈에 `progress()`로 접근하는 손잡이. */
interface ValueFollowerTweenHost extends HTMLSpanElement {
  __valueFollowerTween?: gsap.core.Tween;
}

/** 한쪽에 돋는 눈금 개수. 양쪽 합 10개 + 놓은 자리 1개 = 최대 11개(브리프 필수 1번). */
const TICKS_PER_SIDE = 5;

/** 트랙 폭 대비 눈금 최소 간격(%). step 간격이 이보다 촘촘하면 파생 간격을 쓴다. */
const MIN_TICK_GAP_PERCENT = 2;

/** 가라앉기는 돋음의 65% — 모션 명제 조항 3. useOverlayTransition.ts:19의 산술. */
const TICK_EXIT_RATIO = 0.65;

/** 눈금 돋음 신호를 만드는 키. 이미 잠긴 키보드 테스트 6개와 정확히 대응한다. */
const GRAB_KEYS = new Set([
  'ArrowRight',
  'ArrowLeft',
  'ArrowUp',
  'ArrowDown',
  'Home',
  'End',
]);

/**
 * 키보드로 "놓았다"를 알 방법이 없다(pointerup 대응 없음) — 마지막 키 입력 후
 * 이 시간 동안 입력이 없으면 놓은 것으로 본다. `duration.slower`(500ms) 근방을
 * 쓰라는 브리프 지시를 그대로 gsapDuration에서 가져온다(초→ms 환산 한 곳).
 */
const KEYBOARD_RELEASE_MS = gsapDuration.slower * 1000;

/** value → 트랙 폭 대비 %. Ruling 23: getBoundingClientRect() 대신 값에서 계산한다. */
function valueToPercent(value: number, min: number, max: number): number {
  return max !== min ? ((value - min) / (max - min)) * 100 : 0;
}

/**
 * 썸 근방에 돋을 눈금 값 목록(중심 제외 — 중심은 썸 자체가, 놓은 뒤엔
 * scrubTickLanded가 표시한다). step이 범위에 비해 너무 촘촘하면
 * `MIN_TICK_GAP_PERCENT`로 파생 간격을 써서 눈금이 붙지 않게 한다.
 */
function computeTickValues(
  centerValue: number,
  min: number,
  max: number,
  step: number
): number[] {
  const range = max - min;
  if (range <= 0) return [];

  const stepGapPercent = (step / range) * 100;
  const interval =
    stepGapPercent >= MIN_TICK_GAP_PERCENT
      ? step
      : (MIN_TICK_GAP_PERCENT / 100) * range;
  if (interval <= 0) return [];

  const values: number[] = [];
  for (let i = 1; i <= TICKS_PER_SIDE; i += 1) {
    const left = centerValue - i * interval;
    const right = centerValue + i * interval;
    if (left >= min) values.push(left);
    if (right <= max) values.push(right);
  }
  return values;
}

/** 범위 내 값을 선택하는 슬라이더 컴포넌트 */
export interface SliderProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'size' | 'type'
> {
  /** 레이블 텍스트 */
  label: string;
  /** 슬라이더 크기 */
  size?: 'sm' | 'md' | 'lg';
  /** 최소값 */
  min?: number;
  /** 최대값 */
  max?: number;
  /** 증감 단위 */
  step?: number;
  /** 현재 값 표시 여부 */
  showValue?: boolean;
  /** 도움말 텍스트 */
  helperText?: string;
  /** 필수 입력 */
  required?: boolean;
  /** 마크 표시 */
  marks?: SliderMark[];
  /** 트랙 채움 색상 */
  trackColor?: string;
  /** 추가 클래스명 */
  className?: string;
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  (
    {
      label,
      size = 'md',
      min = 0,
      max = 100,
      step = 1,
      showValue = false,
      helperText,
      required = false,
      marks,
      trackColor,
      disabled = false,
      value,
      defaultValue = 0,
      onChange,
      className,
      ...props
    },
    ref
  ) => {
    const helperId = useId();
    const isControlled = value !== undefined;

    // 비제어 모드에서 fill 트랙을 위한 내부 상태
    const [internalValue, setInternalValue] = useState(Number(defaultValue));

    const currentValue = isControlled ? Number(value) : internalValue;
    const fillPercent =
      max !== min ? ((currentValue - min) / (max - min)) * 100 : 0;

    const handleChange = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => {
        if (!isControlled) {
          setInternalValue(Number(e.target.value));
        }
        onChange?.(e);
      },
      [isControlled, onChange]
    );

    // M3 T4 — 잡은 동안 눈금이 돋고 값이 썸을 따라간다(브리프 필수 1·2·4번).
    const reduced = useReducedMotion();
    const [isGrabbed, setIsGrabbed] = useState(false);
    const [renderTicks, setRenderTicks] = useState(false);
    const [landedValue, setLandedValue] = useState<number | null>(null);

    // setTimeout 콜백이 항상 최신 값을 읽도록. 키보드 유휴 타이머는 render 여러
    // 번 뒤에 발화할 수 있어 클로저가 그 시점의 값을 못 잡는다.
    const currentValueRef = useRef(currentValue);
    useLayoutEffect(() => {
      currentValueRef.current = currentValue;
    });

    if (isGrabbed && !renderTicks) {
      setRenderTicks(true);
    }

    const ticksContainerRef = useRef<HTMLDivElement>(null);
    const ticksTimelineRef = useRef<gsap.core.Timeline | null>(null);
    const ticksExitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
      null
    );
    const keyboardReleaseTimerRef = useRef<ReturnType<
      typeof setTimeout
    > | null>(null);
    const followerRef = useRef<HTMLSpanElement>(null);
    const followerSetterRef = useRef<
      ((value: number, start?: number) => void) | null
    >(null);

    const tickValues = renderTicks
      ? computeTickValues(currentValue, min, max, step)
      : [];

    const handleRelease = useCallback(() => {
      if (disabled) return;
      if (keyboardReleaseTimerRef.current !== null) {
        clearTimeout(keyboardReleaseTimerRef.current);
        keyboardReleaseTimerRef.current = null;
      }
      setLandedValue(currentValueRef.current);
      setIsGrabbed(false);
    }, [disabled]);

    const handleGrab = () => {
      if (disabled) return;
      setIsGrabbed(true);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      if (!GRAB_KEYS.has(e.key)) return;
      handleGrab();
      if (keyboardReleaseTimerRef.current !== null) {
        clearTimeout(keyboardReleaseTimerRef.current);
      }
      keyboardReleaseTimerRef.current = setTimeout(
        handleRelease,
        KEYBOARD_RELEASE_MS
      );
    };

    const handleBlur = () => {
      if (isGrabbed) handleRelease();
    };

    // 눈금 타임라인 생성 — renderTicks가 켜진 뒤(DOM이 붙은 layout 단계)
    // 한 번. fromTo의 시작값이 즉시 적용돼(immediateRender) 첫 페인트가 가라앉은
    // 상태로 나온다(useOverlayTransition.ts:99-101과 같은 이유).
    useLayoutEffect(() => {
      if (!renderTicks) return;
      const el = ticksContainerRef.current;
      if (!el) return;

      const timeline = gateMotion(reduced, () => {
        const created = gsap.timeline({ paused: true });
        created.fromTo(
          el,
          { opacity: 0, scaleY: 0.4 },
          {
            opacity: 1,
            scaleY: 1,
            duration: gsapDuration.fast,
            ease: gsapEasing.settle,
          }
        );
        return created;
      });
      ticksTimelineRef.current = timeline;
      (el as ScrubTicksTimelineHost).__scrubTicksTimeline = timeline;

      return () => {
        timeline.kill();
        ticksTimelineRef.current = null;
        delete (el as ScrubTicksTimelineHost).__scrubTicksTimeline;
      };
    }, [renderTicks, reduced]);

    // 재생·역재생 — useOverlayTransition.ts:124-171의 산술을 그대로 옮긴다(훅
    // 자체는 shouldRender 수명을 오버레이 전용으로 소유하므로 가져다 쓰지 않는다).
    useEffect(() => {
      if (!renderTicks) return;
      const timeline = ticksTimelineRef.current;

      const clearExitTimer = () => {
        if (ticksExitTimerRef.current !== null) {
          clearTimeout(ticksExitTimerRef.current);
          ticksExitTimerRef.current = null;
        }
      };

      if (isGrabbed) {
        clearExitTimer();
        timeline?.eventCallback('onReverseComplete', null);
        // 가라앉던 도중 다시 잡으면 현재 progress에서 정방향으로 이어진다.
        if (!reduced) timeline?.timeScale(1).play();
        return;
      }

      let settled = false;
      const settleExit = () => {
        if (settled) return;
        settled = true;
        clearExitTimer();
        setRenderTicks(false);
      };

      if (reduced || !timeline) {
        timeline?.kill();
        settleExit();
        return;
      }

      const remainingMs = timeline.time() * TICK_EXIT_RATIO * 1000;
      timeline.eventCallback('onReverseComplete', settleExit);
      timeline.timeScale(1 / TICK_EXIT_RATIO).reverse();
      ticksExitTimerRef.current = setTimeout(settleExit, remainingMs);

      return clearExitTimer;
    }, [isGrabbed, renderTicks, reduced]);

    // 값 따라붙기 quickTo — 잡은 순간 생성해 즉시 현재 위치로 점프(관성 없이),
    // 이후 값이 바뀔 때마다 아래 effect가 관성 있게 좇는다(M0.5 I2 · 계획서가
    // quickTo()를 명시로 요구한 자리). gateMotion을 거치지 않는다 — quickTo는
    // 잡는 동안 반복해서 resetTo되는 장기 트윈이라 "확정 후 kill" 의미론과
    // 구조가 안 맞는다(한 번 죽이면 다음 resetTo가 죽은 트윈을 건드린다). 대신
    // reduced를 직접 분기해 애니메이션 자체를 만들지 않는다.
    useLayoutEffect(() => {
      if (!isGrabbed) {
        followerSetterRef.current = null;
        return;
      }
      const el = followerRef.current;
      if (!el) return;

      const percent = valueToPercent(currentValueRef.current, min, max);

      if (reduced) {
        el.style.setProperty(
          '--slider-value-follower-percent',
          String(percent)
        );
        return;
      }

      const setPercent = gsap.quickTo(el, '--slider-value-follower-percent', {
        duration: gsapDuration.fast,
        ease: gsapEasing.settle,
      });
      setPercent(percent, percent);
      followerSetterRef.current = setPercent;
      (el as ValueFollowerTweenHost).__valueFollowerTween = setPercent.tween;

      return () => {
        followerSetterRef.current = null;
        delete (el as ValueFollowerTweenHost).__valueFollowerTween;
      };
    }, [isGrabbed, reduced, min, max]);

    useEffect(() => {
      if (!isGrabbed) return;
      const percent = valueToPercent(currentValue, min, max);

      if (reduced) {
        followerRef.current?.style.setProperty(
          '--slider-value-follower-percent',
          String(percent)
        );
        return;
      }
      followerSetterRef.current?.(percent);
    }, [currentValue, isGrabbed, reduced, min, max]);

    return (
      <div className={clsx(container, className)}>
        <div className={labelContainer}>
          <label className={labelClass}>
            {label}
            {required && <span className={requiredClass}>*</span>}
          </label>
          {showValue && <span className={valueDisplay}>{currentValue}</span>}
        </div>

        <div className={clsx(sliderWrapper, sizeVariants[size])}>
          <div className={sliderTrack}>
            <div
              className={sliderFillTrack}
              style={
                {
                  // 비율(0~1)로 한 번만 나눠서 넘긴다(fillPercent는 0~100).
                  '--slider-fill-scale': fillPercent / 100,
                  ...(trackColor ? { backgroundColor: trackColor } : {}),
                } as React.CSSProperties
              }
            />
          </div>
          {renderTicks && (
            <div
              className={scrubTicksContainer}
              aria-hidden
              ref={ticksContainerRef}
            >
              {tickValues.map((tickValue) => (
                <span
                  key={tickValue}
                  className={scrubTick}
                  style={{ left: `${valueToPercent(tickValue, min, max)}%` }}
                />
              ))}
            </div>
          )}
          {!isGrabbed && landedValue !== null && (
            <span
              className={scrubTickLanded}
              aria-hidden
              style={{ left: `${valueToPercent(landedValue, min, max)}%` }}
            />
          )}
          {isGrabbed && (
            <span className={valueFollower} aria-hidden ref={followerRef}>
              {currentValue}
            </span>
          )}
          <input
            ref={ref}
            type="range"
            className={sliderClass}
            min={min}
            max={max}
            step={step}
            {...(isControlled ? { value } : { defaultValue })}
            disabled={disabled}
            required={required}
            onChange={handleChange}
            onPointerDown={handleGrab}
            onPointerUp={handleRelease}
            onPointerCancel={handleRelease}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            aria-label={label}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={currentValue}
            aria-disabled={disabled}
            aria-describedby={helperText ? helperId : undefined}
            {...props}
          />
        </div>

        {marks && marks.length > 0 && (
          <div className={marksContainer}>
            {marks.map((markItem) => (
              <div
                key={markItem.value}
                className={mark}
                style={{
                  left: `${((markItem.value - min) / (max - min)) * 100}%`,
                }}
              >
                <span className={markLabel}>{markItem.label}</span>
              </div>
            ))}
          </div>
        )}

        {helperText && (
          <p id={helperId} className={helperTextClass}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Slider.displayName = 'Slider';
