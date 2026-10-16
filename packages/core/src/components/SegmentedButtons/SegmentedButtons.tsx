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
  indicatorShadow,
  indicatorLabels,
  INDICATOR_RADIUS,
} from './SegmentedButtons.css';
import { gateMotion, settleMotion } from '../../hooks/gateMotion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { gsapEasing, gsapDuration } from '../../tokens/gsapEasing';
import { rubberStages, type Slot } from './segmentedMotion';

/**
 * 표시의 두 가장자리로 `clip-path`를 만든다. 표시 층은 트랙 전체 폭이라 왼쪽 inset은
 * L, 오른쪽 inset은 `100% - R`이다(둘 다 트랙 왼쪽 기준 px). 둥근 끝은 트랙과 같은 중심의
 * 반경(INDICATOR_RADIUS)이 맡아 늘어나도 납작해지지 않는다.
 */
const clipPathOf = ({ l, r }: Slot): string =>
  `inset(0 calc(100% - ${r}px) 0 ${l}px round ${INDICATOR_RADIUS})`;

/**
 * 인디케이터의 진행 중 타임라인을 테스트가 읽을 수 있는 통로. 공개 prop/state로
 * 내보내지 않고 span DOM 노드에 얹는다, 타입 전용 확장이라 값으로 export되지
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
interface SegmentedButtonsBaseProps {
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
  /** 크기. sm은 보이는 높이 36px, 누르는 영역은 보이지 않는 띠로 44px */
  size?: 'sm' | 'md' | 'lg';
  /** 전체 너비 사용 */
  fullWidth?: boolean;
  /** 전체 비활성화 */
  disabled?: boolean;
  /** 추가 클래스명 */
  className?: string;
}

/** 그룹 이름은 필수다. `aria-label` 또는 `aria-labelledby` 중 하나는 있어야 한다 */
type SegmentedButtonsName =
  | {
      /** 접근성: 그룹 레이블 */
      'aria-label': string;
      /** 접근성: 그룹 레이블을 담은 요소의 id */
      'aria-labelledby'?: string;
    }
  | {
      'aria-label'?: string;
      'aria-labelledby': string;
    };

export type SegmentedButtonsProps = SegmentedButtonsBaseProps &
  SegmentedButtonsName;

export const SegmentedButtons = ({
  options,
  value: controlledValue,
  defaultValue,
  onChange,
  size = 'md',
  fullWidth = false,
  disabled = false,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
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

  // 개발 환경 경고. 렌더마다가 아니라 둘이 함께 주어진 때 한 번만 낸다.
  const bothValues = isControlled && defaultValue !== undefined;
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && bothValues) {
      console.warn(
        'SegmentedButtons: value와 defaultValue를 동시에 사용할 수 없습니다. ' +
          '제어 컴포넌트는 value를, 비제어 컴포넌트는 defaultValue를 사용하세요.'
      );
    }
  }, [bothValues]);

  const reduced = useReducedMotion();
  const indicatorRef = useRef<HTMLSpanElement>(null);
  // 표시의 직전 칸 자리. null이면 "이전 위치가 없다"는 뜻이라 미끄러지지도
  // 늘어나지도 않는다(위험 4, 마운트 시, 그리고 무효 값에서 되돌아올 때).
  const prevSlotRef = useRef<Slot | null>(null);
  // prevSlotRef를 만든 때의 선택 값. 값이 그대로인데 좌표만 바뀐 것(레이아웃 변화)과
  // 값이 바뀌어 옮겨 가는 것을 가른다.
  const prevValueRef = useRef<string | null>(null);
  // GSAP이 트윈하는 두 가장자리. 타임라인이 바뀌어도 이 객체 하나가 지금 값을 쥔다.
  const edgesRef = useRef<Slot>({ l: 0, r: 0 });
  const indicatorTimelineRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const indicator = indicatorRef.current;
    if (!container || !indicator) return;
    const labels = Array.from(container.querySelectorAll('label'));
    const selectedLabel = labels.find(
      (_, i) => options[i].value === currentValue
    );
    const edges = edgesRef.current;
    const paint = () => {
      indicator.style.clipPath = clipPathOf(edges);
    };
    // 놓일 자리가 바뀌면 진행 중이던 타임라인은 죽는다. 지금 가장자리 값은 edges에
    // 남아 있어, 새 타임라인이 거기서 이어받는다(Article 1③, 손잡이는 하나).
    const restAt = (slot: Slot) => {
      indicatorTimelineRef.current?.kill();
      indicatorTimelineRef.current = null;
      edges.l = slot.l;
      edges.r = slot.r;
      paint();
    };

    if (!selectedLabel) {
      // 값이 options에 없다, 표시는 폭 0으로 숨는다. 다음에 유효한 값으로
      // 돌아오면 "처음 놓는 것"처럼 다시 취급한다.
      restAt({ l: 0, r: 0 });
      prevSlotRef.current = null;
      return;
    }

    const rect = selectedLabel.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const left = rect.left - containerRect.left;
    const slot = { l: left, r: left + rect.width };

    const prev = prevSlotRef.current;
    const prevValue = prevValueRef.current;
    prevValueRef.current = currentValue;
    // 같은 자리면 건드리지 않는다. 부모가 options 배열을 매번 새로 만들어도 이
    // effect는 다시 도는데, 그때 진행 중인 타임라인을 끊으면 안 된다. 다만 진행 중에
    // 모션 축소 선호가 켜졌으면(이 effect가 reduced 변화로 다시 돈 것) 지금 모양에서
    // 멈추지 않도록 끝 자리로 확정한다.
    if (prev && prev.l === slot.l && prev.r === slot.r) {
      const running = indicatorTimelineRef.current;
      if (reduced && running && running.progress() < 1) settleMotion(running);
      return;
    }
    prevSlotRef.current = slot;

    // 이전 위치가 없으면(첫 배치) 미끄러지지도 늘어나지도 않는다. 값이 그대로인데
    // 칸 좌표만 바뀐 것(폰트 로딩, 폭 변화)도 옮겨 가는 게 아니라 새 자리에 바로
    // 앉는다. 고무는 선택 값이 바뀔 때만 돈다.
    if (!prev || prevValue === currentValue) {
      restAt(slot);
      return;
    }

    indicatorTimelineRef.current?.kill();
    const { dilate, lead, trail } = rubberStages(prev, slot);

    // RubberSegment의 다섯 단계(travel·land)를 한 타임라인에 담는다. 같은 가장자리를
    // 쥔 트윈이 겹쳐도(늘어남과 앞 가장자리) 시점이 늦은 쪽이 나중에 그려져 이어받는다.
    const timeline = gateMotion(reduced, () => {
      const tl = gsap.timeline({ onUpdate: paint });
      const settle = { ease: gsapEasing.settle };

      // 1. 늘어남: 두 가장자리가 옛 칸과 새 칸을 함께 덮도록 벌어진다.
      tl.to(edges, { ...dilate, duration: gsapDuration.base, ...settle }, 0);
      // 2~3. 넘겨줌 뒤 앞 가장자리가 새 칸 끝에 앉는다. 늘어남과 겹친다.
      tl.to(
        edges,
        { [lead.edge]: lead.to, duration: gsapDuration.slow, ...settle },
        gsapDuration.fast
      );
      // 4. 뒤 가장자리가 새 칸 끝을 지나쳐 따라온다.
      tl.to(
        edges,
        {
          [trail.edge]: trail.overshoot,
          duration: gsapDuration.slow,
          ...settle,
        },
        gsapDuration.fast
      );
      // 5. 풀림: 4가 끝난 뒤 새 칸 끝으로 돌아온다.
      tl.to(
        edges,
        { [trail.edge]: trail.rest, duration: gsapDuration.fast, ...settle },
        '>'
      );

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
      // 라벨의 기본 동작을 막았으니 포커스는 숨은 라디오로 직접 옮긴다(방향키가 이어지도록).
      event.currentTarget.querySelector('input')?.focus();
    },
    [disabled, handleSelect]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>, index: number) => {
      if (disabled) return;

      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        if (!options[index].disabled) {
          handleSelect(options[index].value);
        }
        return;
      }

      // 브라우저 단축키(Alt+←로 뒤로 가기 등)는 막지 않고 놓아 준다
      if (event.altKey || event.ctrlKey || event.metaKey) return;

      // index에서 방향으로 가장 가까운 활성 옵션. 포커스가 비활성 옵션에 있어도 그 자리에서
      // 시작하고, 끝을 넘으면 돌아온다.
      const step = (direction: 1 | -1) => {
        for (let i = 1; i <= options.length; i++) {
          const candidate =
            options[(index + direction * i + options.length) % options.length];
          if (!candidate.disabled) return candidate;
        }
        return undefined;
      };

      let nextOption: SegmentedButtonOption | undefined;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        nextOption = step(1);
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        nextOption = step(-1);
      } else if (event.key === 'Home') {
        nextOption = options.find((opt) => !opt.disabled);
      } else if (event.key === 'End') {
        nextOption = [...options].reverse().find((opt) => !opt.disabled);
      } else {
        return;
      }
      event.preventDefault();

      if (!nextOption) return;
      const inputs = containerRef.current?.querySelectorAll('input');
      inputs?.[options.indexOf(nextOption)]?.focus();
      if (nextOption.value !== currentValue) handleSelect(nextOption.value);
    },
    [disabled, options, currentValue, handleSelect]
  );

  // 로빙 탭 순서: 그룹에서 Tab 순서에 있는 옵션은 하나다. 선택된 옵션, 선택이 없거나
  // 비활성이면 첫 활성 옵션.
  const tabStopValue = (
    options.find((o) => o.value === currentValue && !o.disabled) ??
    options.find((o) => !o.disabled)
  )?.value;

  // 진짜 라벨과 표시 안의 라벨 한 벌이 같은 클래스 목록·같은 내용을 쓴다. 두 줄의
  // 배치가 픽셀 단위로 같아야 글자색이 표시 가장자리에서 정확히 갈린다.
  const labelClass = (option: SegmentedButtonOption) =>
    clsx(
      button,
      currentValue === option.value && 'selected',
      (disabled || option.disabled) && 'disabled',
      option.iconOnly && 'iconOnly'
    );

  const renderContent = (option: SegmentedButtonOption) => (
    <span className={buttonContent}>
      {option.icon && (
        <span className={iconWrapper} aria-hidden="true">
          {option.icon}
        </span>
      )}
      {!option.iconOnly && <span className={labelText}>{option.label}</span>}
    </span>
  );

  return (
    <div
      ref={containerRef}
      role="radiogroup"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledby}
      className={clsx(
        container,
        sizeVariants[size],
        fullWidth && fullWidthClass,
        className
      )}
    >
      <span className={indicatorShadow} aria-hidden="true">
        <span ref={indicatorRef} className={activeIndicator}>
          <span className={indicatorLabels}>
            {options.map((option) => (
              <span key={option.value} className={labelClass(option)}>
                {renderContent(option)}
              </span>
            ))}
          </span>
        </span>
      </span>

      {options.map((option, index) => {
        const isSelected = currentValue === option.value;
        const isDisabled = disabled || option.disabled;

        return (
          // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events -- 키보드는 안의 라디오 input이 받는다
          <label
            key={option.value}
            className={labelClass(option)}
            onClick={(e) => handleLabelClick(e, option.value, option.disabled)}
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
              tabIndex={!isDisabled && option.value === tabStopValue ? 0 : -1}
              onKeyDown={(e) => handleKeyDown(e, index)}
            />
            {renderContent(option)}
          </label>
        );
      })}
    </div>
  );
};

SegmentedButtons.displayName = 'SegmentedButtons';
