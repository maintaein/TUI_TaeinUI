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
import { settleMotion } from '../../hooks/gateMotion';
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
  valueFollower,
  VALUE_FOLLOWER_PERCENT_VAR,
} from './Slider.css';

/** 슬라이더 트랙 위에 표시되는 마크 */
export interface SliderMark {
  /** 마크 위치 (min~max 범위 내 값) */
  value: number;
  /** 마크 레이블 텍스트 */
  label: string;
}

/** 테스트 전용. 값 따라붙기 quickTo가 만든 트윈에 `progress()`로 접근하는 손잡이. */
interface ValueFollowerTweenHost extends HTMLSpanElement {
  __valueFollowerTween?: gsap.core.Tween;
}

/** 잡았다는 신호를 만드는 키. */
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

    // 잡은 동안 값이 썸을 따라간다.
    const reduced = useReducedMotion();
    const [isGrabbed, setIsGrabbed] = useState(false);

    // setTimeout 콜백이 항상 최신 값을 읽도록. 키보드 유휴 타이머는 render 여러
    // 번 뒤에 발화할 수 있어 클로저가 그 시점의 값을 못 잡는다.
    const currentValueRef = useRef(currentValue);
    useLayoutEffect(() => {
      currentValueRef.current = currentValue;
    });

    const keyboardReleaseTimerRef = useRef<ReturnType<
      typeof setTimeout
    > | null>(null);
    const followerRef = useRef<HTMLSpanElement>(null);
    const followerSetterRef = useRef<
      ((value: number, start?: number) => void) | null
    >(null);

    const handleRelease = useCallback(() => {
      if (disabled) return;
      if (keyboardReleaseTimerRef.current !== null) {
        clearTimeout(keyboardReleaseTimerRef.current);
        keyboardReleaseTimerRef.current = null;
      }
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

    // keyboardReleaseTimerRef 마운트 범위 정리. 재잡음·해제 경로만 정리하면
    // 유휴창(≤500ms) 안에 언마운트될 때 정리할 곳이 없어 언마운트 뒤에
    // setState가 돈다. 마운트 스코프 cleanup 하나로 닫는다.
    useEffect(() => {
      return () => {
        if (keyboardReleaseTimerRef.current !== null) {
          clearTimeout(keyboardReleaseTimerRef.current);
          keyboardReleaseTimerRef.current = null;
        }
      };
    }, []);

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
        el.style.setProperty(VALUE_FOLLOWER_PERCENT_VAR, String(percent));
        return;
      }

      const setPercent = gsap.quickTo(el, VALUE_FOLLOWER_PERCENT_VAR, {
        duration: gsapDuration.fast,
        ease: gsapEasing.settle,
      });
      setPercent(percent, percent);
      followerSetterRef.current = setPercent;
      (el as ValueFollowerTweenHost).__valueFollowerTween = setPercent.tween;

      return () => {
        // 끝 상태(마지막 목표 값)로 확정한 뒤 죽인다.
        settleMotion(setPercent.tween);
        followerSetterRef.current = null;
        delete (el as ValueFollowerTweenHost).__valueFollowerTween;
      };
    }, [isGrabbed, reduced, min, max]);

    useEffect(() => {
      if (!isGrabbed) return;
      const percent = valueToPercent(currentValue, min, max);

      if (reduced) {
        followerRef.current?.style.setProperty(
          VALUE_FOLLOWER_PERCENT_VAR,
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
