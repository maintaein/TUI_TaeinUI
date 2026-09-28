import {
  useCallback,
  useRef,
  type ReactNode,
  type KeyboardEvent,
  useEffect,
  useState,
} from 'react';
import clsx from 'clsx';
import { gsap } from 'gsap';
import {
  container,
  sizeVariants,
  fullWidth as fullWidthClass,
  button,
  buttonContent,
  iconWrapper,
  labelText,
  radioInput,
  activeIndicator,
} from './SegmentedButtons.css';
import { gateMotion } from '../../hooks/gateMotion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { gsapEasing, gsapDuration } from '../../tokens/gsapEasing';

/** 이동 중 진행 방향으로 늘어나는 배율(Ruling 33). 왜곡은 의도된 연출이다. */
const TRAVEL_STRETCH = 1.12;

/** 전체 이동 시간 중 늘어나는 구간의 비율. Switch.tsx의 SQUASH_PORTION과 같은 모양이다. */
const STRETCH_PORTION = 0.4;
/** 나머지 — 늘어난 것이 1로 되돌아오는 정착 구간의 비율. 둘의 합은 항상 1이다. */
const SETTLE_PORTION = 1 - STRETCH_PORTION;

/**
 * 인디케이터의 진행 중 타임라인을 테스트가 읽을 수 있는 통로. 공개 prop/state로
 * 내보내지 않고 span DOM 노드에 얹는다 — 타입 전용 확장이라 값으로 export되지
 * 않고 `SegmentedButtonsProps`에도 없으니 공개 API·`dist` 표면에 안 나간다
 * (Snackbar.tsx의 CountdownTweenHost와 같은 패턴). 테스트는 실제 GSAP 인스턴스를
 * 그대로 받아 `progress()`로 seek한다(무모킹).
 */
interface IndicatorTimelineHost extends HTMLSpanElement {
  __indicatorTimeline?: gsap.core.Timeline;
}

/** 개별 세그먼트 옵션 */
export interface SegmentedButtonOption {
  /** 옵션 값 */
  value: string;
  /** 옵션 레이블 */
  label: string;
  /** 옵션 아이콘 */
  icon?: ReactNode;
  /** 아이콘만 표시 (레이블 숨김) */
  iconOnly?: boolean;
  /** 개별 옵션 비활성화 */
  disabled?: boolean;
}

/** 여러 옵션 중 하나를 선택하는 세그먼트 버튼 그룹. 제어/비제어 모드 지원 */
export interface SegmentedButtonsProps {
  /** 옵션 목록 */
  options: SegmentedButtonOption[];

  // 제어 모드
  /** 제어 모드: 선택된 값 */
  value?: string;
  /** 제어 모드: 값 변경 핸들러 */
  onChange?: (value: string) => void;

  // 비제어 모드
  /** 비제어 모드: 초기 선택 값 */
  defaultValue?: string;

  // 공통 props
  /** 크기 */
  size?: 'sm' | 'md' | 'lg';
  /** 전체 너비 사용 */
  fullWidth?: boolean;
  /** 전체 비활성화 */
  disabled?: boolean;
  /** 접근성: 그룹 레이블 */
  'aria-label'?: string;
  /** 추가 클래스명 */
  className?: string;
}

export const SegmentedButtons = ({
  options,
  value: controlledValue,
  defaultValue,
  onChange,
  size = 'md',
  fullWidth = false,
  disabled = false,
  'aria-label': ariaLabel,
  className,
}: SegmentedButtonsProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // 비제어 모드용 내부 상태
  const [uncontrolledValue, setUncontrolledValue] = useState<string>(
    defaultValue ?? options[0]?.value ?? ''
  );

  // 제어/비제어 판단
  const isControlled = controlledValue !== undefined;
  const currentValue = isControlled ? controlledValue : uncontrolledValue;

  // 개발 환경 경고
  if (process.env.NODE_ENV === 'development') {
    if (controlledValue !== undefined && defaultValue !== undefined) {
      console.warn(
        'SegmentedButtons: value와 defaultValue를 동시에 사용할 수 없습니다. ' +
          '제어 컴포넌트는 value를, 비제어 컴포넌트는 defaultValue를 사용하세요.'
      );
    }
    if (!isControlled && !defaultValue && options.length > 0) {
      console.info(
        'SegmentedButtons: value와 defaultValue가 모두 없습니다. ' +
          `첫 번째 옵션 "${options[0]?.value}"이 기본값으로 사용됩니다.`
      );
    }
  }

  const reduced = useReducedMotion();
  const indicatorRef = useRef<HTMLSpanElement>(null);
  // 인디케이터의 직전 위치. null이면 "이전 위치가 없다"는 뜻이라 미끄러지지도
  // 늘어나지도 않는다(위험 4 — 마운트 시, 그리고 무효 값에서 되돌아올 때).
  const prevIndicatorRectRef = useRef<{ left: number; width: number } | null>(
    null
  );
  const indicatorTimelineRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const indicator = indicatorRef.current;
    if (!container || !indicator) return;
    const labels = Array.from(container.querySelectorAll('label'));
    const selectedLabel = labels.find(
      (_, i) => options[i].value === currentValue
    );

    if (!selectedLabel) {
      // 값이 options에 없다 — 인디케이터는 숨어 있는다(width 0). 다음에
      // 유효한 값으로 돌아오면 "처음 놓는 것"처럼 다시 취급한다.
      gsap.set(indicator, { width: 0 });
      prevIndicatorRectRef.current = null;
      return;
    }

    const rect = selectedLabel.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const left = rect.left - containerRect.left;
    const width = rect.width;

    const prev = prevIndicatorRectRef.current;
    prevIndicatorRectRef.current = { left, width };

    if (!prev) {
      // 첫 배치 — 이전 위치가 없으므로 미끄러지지도 늘어나지도 않는다.
      gsap.set(indicator, { x: left, width, scaleX: 1 });
      return;
    }

    const direction =
      left === prev.left ? null : left > prev.left ? 'right' : 'left';

    // 새 타임라인을 매번 새로 만든다(재사용 금지) — overwrite:'auto'가
    // 진행 중이던 이전 타임라인을 현재 값에서 죽이고, 이 타임라인은 그
    // 현재 값에서 이어받는다(Article 1③ — 이 작업의 핵심 잠금).
    const timeline = gateMotion(reduced, () => {
      const tl = gsap.timeline({ defaults: { overwrite: 'auto' } });

      tl.to(
        indicator,
        {
          x: left,
          width,
          duration: gsapDuration.slow,
          ease: gsapEasing.settle,
        },
        0
      );

      if (direction) {
        // 이동 중 진행 방향으로 살짝 늘어난다(왜곡은 의도된 연출, Ruling 33).
        // 앞 40%는 늘고 뒤 60%는 되돌아온다 — 한 타임라인 안 두 트윈 체인이며,
        // GSAP keyframes 옵션은 일부러 쓰지 않는다(@keyframes 금지 스캐너 혼동 방지).
        tl.set(
          indicator,
          {
            transformOrigin:
              direction === 'right' ? 'left center' : 'right center',
          },
          0
        );
        tl.to(
          indicator,
          {
            scaleX: TRAVEL_STRETCH,
            duration: gsapDuration.slow * STRETCH_PORTION,
            ease: gsapEasing.settle,
          },
          0
        );
        tl.to(
          indicator,
          {
            scaleX: 1,
            duration: gsapDuration.slow * SETTLE_PORTION,
            ease: gsapEasing.exit,
          },
          gsapDuration.slow * STRETCH_PORTION
        );
      }

      return tl;
    });

    indicatorTimelineRef.current = timeline;
    (indicator as IndicatorTimelineHost).__indicatorTimeline = timeline;
  }, [currentValue, options, reduced]);

  // 언마운트 시 진행 중인 타임라인을 정리한다. 위 effect는 currentValue·
  // options·reduced가 바뀔 때마다 재실행되므로, 정리 전용 effect를 빈 배열로
  // 따로 둔다.
  useEffect(() => {
    return () => {
      indicatorTimelineRef.current?.kill();
    };
  }, []);

  const handleSelect = useCallback(
    (newValue: string) => {
      // 비제어 모드: 내부 상태 업데이트
      if (!isControlled) {
        setUncontrolledValue(newValue);
      }

      // onChange 호출 (있는 경우)
      onChange?.(newValue);
    },
    [isControlled, onChange]
  );

  const handleOptionClick = useCallback(
    (optionValue: string, optionDisabled?: boolean) => {
      if (disabled || optionDisabled) return;
      handleSelect(optionValue);
    },
    [disabled, handleSelect]
  );

  const handleLabelClick = useCallback(
    (
      event: React.MouseEvent<HTMLLabelElement>,
      optionValue: string,
      optionDisabled?: boolean
    ) => {
      event.preventDefault();
      if (disabled || optionDisabled) return;
      handleSelect(optionValue);
    },
    [disabled, handleSelect]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLLabelElement>, index: number) => {
      if (disabled) return;

      const enabledOptions = options.filter((opt) => !opt.disabled);
      const currentEnabledIndex = enabledOptions.findIndex(
        (opt) => opt.value === options[index].value
      );

      let nextIndex = -1;

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        nextIndex = (currentEnabledIndex + 1) % enabledOptions.length;
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        nextIndex =
          (currentEnabledIndex - 1 + enabledOptions.length) %
          enabledOptions.length;
      } else if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        if (!options[index].disabled) {
          handleSelect(options[index].value);
        }
        return;
      } else {
        return;
      }

      const nextOption = enabledOptions[nextIndex];
      const nextOptionIndex = options.findIndex(
        (opt) => opt.value === nextOption.value
      );

      if (nextOptionIndex !== -1) {
        const nextLabel =
          containerRef.current?.querySelectorAll('label')[nextOptionIndex];
        if (nextLabel) {
          nextLabel.focus();
          handleSelect(nextOption.value);
        }
      }
    },
    [disabled, options, handleSelect]
  );

  return (
    <div
      ref={containerRef}
      role="radiogroup"
      aria-label={ariaLabel}
      className={clsx(
        container,
        sizeVariants[size],
        fullWidth && fullWidthClass,
        className
      )}
    >
      <span ref={indicatorRef} className={activeIndicator} />

      {options.map((option, index) => {
        const isSelected = currentValue === option.value;
        const isDisabled = disabled || option.disabled;

        return (
          // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
          <label
            key={option.value}
            className={clsx(
              button,
              isSelected && 'selected',
              isDisabled && 'disabled',
              option.iconOnly && 'iconOnly'
            )}
            tabIndex={isDisabled ? -1 : 0}
            onClick={(e) => handleLabelClick(e, option.value, option.disabled)}
            onKeyDown={(e) => handleKeyDown(e, index)}
          >
            <input
              type="radio"
              className={radioInput}
              value={option.value}
              checked={isSelected}
              disabled={isDisabled}
              onChange={() => handleOptionClick(option.value, option.disabled)}
              aria-checked={isSelected}
              aria-disabled={isDisabled}
              aria-label={option.label}
              tabIndex={-1}
            />
            <span className={buttonContent}>
              {option.icon && (
                <span className={iconWrapper} aria-hidden="true">
                  {option.icon}
                </span>
              )}
              {!option.iconOnly && (
                <span className={labelText}>{option.label}</span>
              )}
            </span>
          </label>
        );
      })}
    </div>
  );
};

SegmentedButtons.displayName = 'SegmentedButtons';
