import {
  useState,
  useId,
  useRef,
  useEffect,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import clsx from 'clsx';
import { gsap } from 'gsap';
import { Glyph } from '../../_internal/glyph';
import { addSheetStagger } from '../../_internal/sheetFloat';
import { gateMotion, settleMotion } from '../../hooks/gateMotion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { gsapDuration, gsapEasing } from '../../tokens/gsapEasing';
import {
  boardRow,
  variantStyles,
  header,
  title as titleStyle,
  iconContainer,
  iconExpanded,
  contentWrapper,
  content,
  contentInner,
} from './BoardRow.css';

/**
 * 펼칠 때 목표 높이를 지나치는 거리(px). 이동거리 × 커브 정점이 2px 미만이면
 * 안 보이고 24px를 넘으면 만화가 된다. 시트는 16px였는데, 행은 넘친 높이가
 * 아래 행들을 같이 밀어서 같은 px라도 더 크게 읽히므로 12로 낮춘다.
 */
const OVERSHOOT_PX = 12;
/** 접힘의 길이 비율. 물러날 때는 진입 길이의 60~70%로 짧다(조항 3). */
const EXIT_RATIO = 0.65;

/**
 * 테스트 전용: 현재 높이 타임라인과 내용 시차 타임라인을 래퍼 노드에 얹는다
 * (BottomSheet의 `__bottomSheetTimeline`과 같은 모양).
 */
type BoardRowTimelineHost = HTMLDivElement & {
  __boardRowTimeline?: gsap.core.Timeline;
  __boardRowStagger?: gsap.core.Timeline;
};

/** 접을 수 있는 아코디언 행 컴포넌트. 제어/비제어 모드 지원 */
export interface BoardRowProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'title' | 'onChange'
> {
  /** 행 제목 (항상 표시됨) */
  title: ReactNode;
  /** 접히는 영역의 콘텐츠 */
  children: ReactNode;
  /** 시각적 스타일 @default 'default' */
  variant?: 'default' | 'outlined' | 'filled';
  /** 비제어 모드: 초기 펼침 상태 @default false */
  defaultExpanded?: boolean;
  /** 제어 모드: 펼침 상태 */
  expanded?: boolean;
  /** 제어 모드: 펼침 상태 변경 핸들러 */
  onChange?: (expanded: boolean) => void;
  /** 비활성화 상태 */
  disabled?: boolean;
  /** 추가 CSS 클래스 */
  className?: string;
}

export const BoardRow = ({
  title,
  children,
  variant = 'default',
  defaultExpanded = false,
  expanded: controlledExpanded,
  onChange,
  disabled = false,
  className,
  ...props
}: BoardRowProps) => {
  const headerId = useId();
  const contentId = useId();

  // 제어모드와 비제어모드
  const isControlled = controlledExpanded !== undefined;
  const [uncontrolledExpanded, setUncontrolledExpanded] =
    useState(defaultExpanded);
  const isExpanded = isControlled ? controlledExpanded : uncontrolledExpanded;

  const reduced = useReducedMotion();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const regionRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const staggerRef = useRef<gsap.core.Timeline | null>(null);
  const lastExpandedRef = useRef(isExpanded);
  // 처음 그릴 때의 모습(닫힘이면 높이 0과 inert)은 마크업에 박아 두고 이후엔
  // 건드리지 않는다. 이 값은 바뀌지 않으므로 React가 다시 쓰지 않아 GSAP이
  // 쓰는 인라인 height·inert와 다투지 않는다. 마운트 때는 애니메이션하지 않는다.
  const [initial] = useState(() => ({
    style: isExpanded ? undefined : { height: 0 },
    inert: !isExpanded,
  }));

  // 펼침·접힘은 토글마다 지금 높이에서 새 타임라인을 만든다. 역재생에 기대지
  // 않는다: 내용 높이는 열린 동안 바뀔 수 있어 열 때 잰 h로 되감으면 틀리다.
  useEffect(() => {
    // 마운트(StrictMode의 재실행 포함)와 축소 선호 변경은 토글이 아니다.
    if (lastExpandedRef.current === isExpanded) return;
    lastExpandedRef.current = isExpanded;

    const wrapper = wrapperRef.current as BoardRowTimelineHost | null;
    const region = regionRef.current;
    const inner = innerRef.current;
    if (!wrapper || !region || !inner) return;

    // 트윈 중이면 중간값이다. 죽이기 전에 읽는다.
    const from = wrapper.getBoundingClientRect().height;
    timelineRef.current?.kill();
    // 접을 때는 시차를 끝 상태로 확정해 내용이 그대로 높이에 잘리며 사라지게
    // 한다(시트와 같다). 펼칠 때 살아 있는 시차는 없다. 펼침은 언제나 접힘(시차를
    // 확정하고 비운다) 뒤에 오고, 열린 채 마운트하거나 덜 접힌 채 다시 펼치면
    // 시차를 만들지 않는다.
    if (staggerRef.current) settleMotion(staggerRef.current);
    staggerRef.current = null;

    if (isExpanded) {
      region.removeAttribute('inert');
      const target = region.scrollHeight;
      const timeline = gateMotion(reduced, () => {
        const tl = gsap.timeline();
        tl.fromTo(
          wrapper,
          { height: from },
          {
            height: target + OVERSHOOT_PX,
            duration: gsapDuration.slow,
            ease: gsapEasing.settle,
          },
          0
        );
        // 끝나면 auto로 되돌린다. 고정 px로 두면 내용이나 폭이 바뀔 때 잘린다.
        tl.fromTo(
          wrapper,
          { height: target + OVERSHOOT_PX },
          {
            height: target,
            duration: gsapDuration.base,
            ease: gsapEasing.drift,
            clearProps: 'height',
            immediateRender: false,
          },
          gsapDuration.slow
        );
        // 내용은 직계 자식마다 시차를 두고 뜬다. 세 번째 소비자다(시트 둘 다음).
        // 접히던 도중(from이 0이 아니면) 다시 펼치는 거라면 내용은 접힐 때 이미
        // 끝 상태로 확정돼 보이고 있다. 시차가 opacity 0으로 리셋하면 번쩍인다.
        // 0과의 비교는 부동소수점이라 1 미만으로 본다.
        staggerRef.current =
          from < 1
            ? addSheetStagger(tl, Array.from(inner.children), reduced)
            : null;
        return tl;
      });
      wrapper.__boardRowTimeline = timeline;
      if (staggerRef.current) wrapper.__boardRowStagger = staggerRef.current;
      timelineRef.current = timeline;
      return;
    }

    const timeline = gateMotion(reduced, () => {
      // 접힘이 끝나면 내용 영역을 inert로 막는다(Tab이 들어가지 못하게).
      const tl = gsap.timeline({
        onComplete: () => region.setAttribute('inert', ''),
      });
      // 살짝 부풀었다가(예비동작) 접힌다.
      tl.fromTo(
        wrapper,
        { height: from },
        {
          height: from + OVERSHOOT_PX,
          duration: gsapDuration.base * EXIT_RATIO,
          ease: gsapEasing.drift,
        },
        0
      );
      tl.fromTo(
        wrapper,
        { height: from + OVERSHOOT_PX },
        {
          height: 0,
          duration: gsapDuration.slow * EXIT_RATIO,
          ease: gsapEasing.exit,
          immediateRender: false,
        },
        gsapDuration.base * EXIT_RATIO
      );
      return tl;
    });
    wrapper.__boardRowTimeline = timeline;
    timelineRef.current = timeline;
  }, [isExpanded, reduced]);

  // 도는 도중 축소 선호가 켜지면 진행 중인 트윈을 끝 상태로 확정한다.
  // 토글 effect는 이 변화를 토글이 아니라며 건너뛴다.
  useEffect(() => {
    if (!reduced) return;
    if (timelineRef.current) settleMotion(timelineRef.current);
    if (staggerRef.current) settleMotion(staggerRef.current);
  }, [reduced]);

  useEffect(
    () => () => {
      timelineRef.current?.kill();
      staggerRef.current?.kill();
    },
    []
  );

  const handleToggle = () => {
    if (disabled) return;

    if (isControlled) {
      onChange?.(!controlledExpanded);
    } else {
      setUncontrolledExpanded((prev) => !prev);
    }
  };

  return (
    <div
      className={clsx(boardRow, variantStyles[variant], className)}
      {...props}
    >
      <button
        id={headerId}
        type="button"
        className={header}
        onClick={handleToggle}
        disabled={disabled}
        aria-expanded={isExpanded}
        aria-controls={contentId}
      >
        <div className={titleStyle}>{title}</div>
        <div className={clsx(iconContainer, isExpanded && iconExpanded)}>
          <Glyph name="chevron-down" size="md" />
        </div>
      </button>

      <div ref={wrapperRef} className={contentWrapper} style={initial.style}>
        <div
          ref={regionRef}
          id={contentId}
          role="region"
          aria-labelledby={headerId}
          className={content}
          inert={initial.inert}
        >
          <div ref={innerRef} className={contentInner}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

BoardRow.displayName = 'BoardRow';
