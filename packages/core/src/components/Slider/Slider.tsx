import {
  forwardRef,
  useId,
  useState,
  useCallback,
  type InputHTMLAttributes,
  type ChangeEvent,
} from 'react';
import clsx from 'clsx';
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
} from './Slider.css';

/** 슬라이더 트랙 위에 표시되는 마크 */
export interface SliderMark {
  /** 마크 위치 (min~max 범위 내 값) */
  value: number;
  /** 마크 레이블 텍스트 */
  label: string;
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
          <div className={sliderTrack} />
          <div
            className={sliderFillTrack}
            style={
              {
                // Slider.css.ts의 transform: scaleX(var(--slider-fill-scale))가
                // translateY(-50%)와 합성한다 — 여기서 transform 문자열을 직접
                // 조립하면 세로 정렬이 두 곳에 흩어진다. 비율(0~1)로 한 번만
                // 나눠서 넘긴다(fillPercent는 0~100).
                '--slider-fill-scale': fillPercent / 100,
                ...(trackColor ? { backgroundColor: trackColor } : {}),
              } as React.CSSProperties
            }
          />
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
