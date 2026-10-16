import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import clsx from 'clsx';
import { gsap } from 'gsap';
import { useClickable } from '../../_internal/useClickable';
import { useClickRebound } from '../../_internal/useClickRebound';
import { Glyph } from '../../_internal/glyph';
import { themeContract } from '../../tokens/theme.css';
import { gsapDuration, gsapEasing } from '../../tokens/gsapEasing';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { gateMotion } from '../../hooks/gateMotion';
import {
  chip,
  clickable as clickableStyle,
  action as actionStyle,
  selected as selectedStyle,
  disabled as disabledStyle,
  exiting as exitingStyle,
  label as labelStyle,
  iconContainer,
  deleteButton,
} from './Chip.css';

// 테스트가 현재 퇴장 타임라인을 읽는 손잡이(Modal·BoardRow의 __...Timeline과 같은 모양).
type ChipHost = HTMLElement & { __chipExitTimeline?: gsap.core.Timeline };

/** 태그, 필터, 선택 항목 등을 표시하는 칩 컴포넌트 */
export interface ChipProps {
  /** 칩에 표시할 텍스트 */
  label: string;
  /** 칩 크기 @default 'md' */
  size?: 'sm' | 'md' | 'lg';
  /** 칩 스타일 @default 'filled' */
  variant?: 'filled' | 'outlined';
  /** 칩 색상 @default 'default' */
  color?: 'default' | 'primary' | 'success' | 'error' | 'warning';
  /** 레이블 왼쪽에 표시할 아이콘 */
  icon?: ReactNode;
  /** 레이블 왼쪽에 표시할 아바타. icon과 함께 주면 둘 다 그려진다(아바타가 먼저) */
  avatar?: ReactNode;
  /** 삭제(X) 버튼 핸들러. 설정 시 삭제 버튼 표시. 퇴장 애니메이션이 끝난 뒤 불린다. 퇴장 중 칩이 언마운트되면 불리지 않는다. 칩을 목록에서 지우지 않으면 보이지 않는 채로 남는다 */
  onDelete?: () => void;
  /** 선택 상태. onClick이 있는 칩에 주면 토글 칩이라 aria-pressed로 알린다(안 주면 속성 없음). onClick 없이 주면 선택 모양만 나오고 aria-pressed는 없다 */
  selected?: boolean;
  /** 비활성화 상태 @default false */
  disabled?: boolean;
  /** 클릭 핸들러. 주면 눌리는 칩(button, 호버·포커스·누름 효과)이 된다 */
  onClick?: () => void;
  /** 추가 CSS 클래스 */
  className?: string;
}

export const Chip = ({
  label,
  size = 'md',
  variant = 'filled',
  color = 'default',
  icon,
  avatar,
  onDelete,
  selected,
  disabled = false,
  onClick,
  className,
}: ChipProps) => {
  // 선택 표식(::before)의 색 — 모양·전이는 Chip.css.ts가 갖고, 여기서는
  // 색만 커스텀 프로퍼티로 넘긴다(색상 axis가 recipe 밖에 있어 JS 계산이 필요).
  const markerColor = useMemo(() => {
    const colorMap = {
      default: themeContract.color.border.default,
      primary: themeContract.color.primary.main,
      success: themeContract.color.success.main,
      error: themeContract.color.error.main,
      warning: themeContract.color.warning.main,
    };

    return colorMap[color];
  }, [color]);

  const markerStyle = {
    '--chip-marker-color': markerColor,
  } as React.CSSProperties;

  const reduced = useReducedMotion();
  const rootRef = useRef<ChipHost | null>(null);
  // 퇴장 중 다시 눌러도 onDelete는 한 번이다. state는 렌더 뒤에야 바뀌므로 ref로 막는다.
  const exitingRef = useRef(false);
  const [exiting, setExiting] = useState(false);

  // 퇴장 200ms 동안 부모가 다시 그려질 수 있다. 클릭한 렌더의 onDelete를 그대로 부르면
  // 오래된 목록으로 setState해 앞서 지운 칩이 되살아나므로, 끝나는 시점의 최신 것을 부른다
  // (렌더 중 ref 쓰기는 lint가 막아 의존성 없는 layout effect로 갱신한다, Snackbar와 같다).
  const onDeleteRef = useRef(onDelete);
  useLayoutEffect(() => {
    onDeleteRef.current = onDelete;
  });

  // 언마운트 때 ref는 이미 비어 있어서 노드를 미리 잡아 둔다.
  useEffect(() => {
    const el = rootRef.current;
    return () => {
      el?.__chipExitTimeline?.kill();
    };
  }, []);

  // 삭제 버튼 클릭 핸들러. onDelete는 퇴장이 끝난 뒤 부른다. 부모가 칩을 바로
  // 지우면 애니메이션할 시간이 없다(BubbleMenu도 끝난 뒤 닫는다). 퇴장은 두 단계다.
  // 1) 가속하며 빨려 들어간다(scale 1 -> 0, ease-in). bubble이 사라지는 느낌이다.
  // 2) 보이지 않게 된 칩이 자기 자리를 닫아 오른쪽 칩이 미끄러져 온다.
  // 축소 모드는 gateMotion이 끝 상태로 확정해 onComplete가 즉시 불린다.
  const handleDelete = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    const el = rootRef.current;
    if (disabled || exitingRef.current || !el) return;
    exitingRef.current = true;
    setExiting(true);
    // CSS transition이 transform·opacity를 따라가면 GSAP이 매 프레임 쓰는 값과 다툰다.
    el.style.transition = 'none';
    // 값은 클릭 순간에 읽는다. 폭은 transform에 안 흔들리는 offsetWidth.
    const parentStyle = el.parentElement
      ? getComputedStyle(el.parentElement)
      : null;
    // ponytail: 가로 줄 배치(flex row·일반 흐름)만 닫는다. 가로 끝 여백이 grid나
    // flex 비row에서는 옆 칩을 당기지 못하거나 반대쪽을 당긴다. 세로·grid 칩
    // 목록이 실제로 생기면 그 축에 맞게 올린다.
    const closesGap =
      !!parentStyle &&
      !parentStyle.display.includes('grid') &&
      (!parentStyle.display.includes('flex') ||
        parentStyle.flexDirection === 'row');
    const columnGap = parseFloat(parentStyle?.columnGap ?? '') || 0;
    el.__chipExitTimeline = gateMotion(reduced, () => {
      const tl = gsap.timeline({ onComplete: () => onDeleteRef.current?.() });
      tl.to(el, {
        scale: 0,
        opacity: 0,
        transformOrigin: '50% 50%',
        duration: gsapDuration.base,
        ease: gsapEasing.exit,
      });
      // 폭을 0으로 줄이면 flex 항목의 min-width: auto(글자가 nowrap)에 걸려 안 줄고,
      // 줄여도 gap 하나가 남아 부모가 지울 때 그만큼 다시 튄다. 끝 여백을
      // -(폭 + gap)으로 주면 이 칩이 줄에서 차지하는 몫이 정확히 0이 되어 부모가
      // 지우는 순간 옆 칩의 이동이 0이다. 칩은 1이 끝나면 보이지 않고 inert라
      // 옆 칩이 그 위로 지나가도 무해하다. 1 다음에 하는 이유: exit(power2.in)는
      // 진행 60%에도 크기가 0.64라 겹치면 보이는 칩 위로 옆 칩이 지난다.
      // 넘침 없는 settle: 이동거리가 칩마다 다르다(40~130px). 넘치는 커브는 넘침이
      // 거리에 비례해 긴 칩에서 gap(8px)을 넘어 옆 칩이 왼쪽 칩을 덮는다.
      if (closesGap) {
        tl.to(el, {
          marginInlineEnd: -(el.offsetWidth + columnGap),
          duration: gsapDuration.base,
          ease: gsapEasing.settle,
        });
      }
      return tl;
    });
  };

  // onClick이 있으면 눌리는 칩이다.
  const isClickable = !!onClick;

  // useClickable 훅으로 Enter/Space 처리
  const clickableProps = useClickable({
    onClick: onClick
      ? () => {
          onClick();
        }
      : undefined,
    disabled,
    role: 'button',
  });

  // 누름 상태(data-pressed)와 Enter/Space 누름. 눌리는 칩에만 건다.
  const { pressed, handlers } = useClickRebound<HTMLButtonElement>(disabled, {
    onKeyDown: clickableProps.onKeyDown,
  });

  const chipClasses = clsx(
    chip({ size, variant, color }),
    isClickable && clickableStyle({ variant, color }),
    {
      [selectedStyle]: selected === true,
      [disabledStyle]: disabled,
      [exitingStyle]: exiting,
    },
    className
  );

  const chipContent = (
    <>
      {avatar && <span className={iconContainer}>{avatar}</span>}
      {icon && <span className={iconContainer}>{icon}</span>}
      <span className={labelStyle}>{label}</span>
    </>
  );

  // 삭제 버튼은 늘 진짜 button이다. 눌리는 칩이라도 주 동작 button의 자식이 아니라 형제다.
  const deleteNode = onDelete && (
    <button
      type="button"
      className={deleteButton}
      onClick={handleDelete}
      disabled={disabled}
      aria-disabled={disabled ? true : undefined}
      aria-label={`${label} 삭제`}
    >
      <Glyph name="close" size="sm" />
    </button>
  );

  // 눌리는 칩 하나(삭제 없음)는 루트가 곧 button이다.
  if (isClickable && !onDelete) {
    return (
      <button
        ref={rootRef as React.Ref<HTMLButtonElement>}
        type="button"
        inert={exiting}
        className={chipClasses}
        onClick={clickableProps.onClick}
        {...handlers}
        disabled={disabled}
        aria-disabled={disabled}
        aria-pressed={selected}
        aria-label={label}
        data-pressed={pressed ? '' : undefined}
        style={markerStyle}
      >
        {chipContent}
      </button>
    );
  }

  // 누르기 + 삭제: 칩 겉모습은 루트 div가 갖고, 주 동작 button과 삭제 button이
  // 나란히 놓인다(button 안에 button을 두지 않는다). 누름 표시는 칩 전체에 걸어야
  // 해서 data-pressed가 루트에 붙고, 삭제 button은 누름 핸들러가 없어 칩이 눌리지 않는다.
  if (isClickable) {
    return (
      <div
        ref={rootRef as React.Ref<HTMLDivElement>}
        inert={exiting}
        className={chipClasses}
        data-pressed={pressed ? '' : undefined}
        style={markerStyle}
      >
        <button
          type="button"
          className={actionStyle}
          onClick={clickableProps.onClick}
          {...handlers}
          disabled={disabled}
          aria-disabled={disabled}
          aria-pressed={selected}
          aria-label={label}
        >
          {chipContent}
        </button>
        {deleteNode}
      </div>
    );
  }

  return (
    <div
      ref={rootRef as React.Ref<HTMLDivElement>}
      inert={exiting}
      className={chipClasses}
      style={markerStyle}
    >
      {chipContent}
      {deleteNode}
    </div>
  );
};

Chip.displayName = 'Chip';
