import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
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
  selected as selectedStyle,
  disabled as disabledStyle,
  exiting as exitingStyle,
  glow as glowStyle,
  label as labelStyle,
  iconContainer,
  deleteButton,
} from './Chip.css';

// 테스트가 현재 퇴장 트윈을 읽는 손잡이(Avatar의 __avatarPress와 같은 모양).
type ChipHost = HTMLElement & { __chipExitTween?: gsap.core.Tween };

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
  /** 삭제(X) 버튼 핸들러. 설정 시 삭제 버튼 표시. 퇴장 애니메이션이 끝난 뒤 불린다. 칩을 목록에서 지우지 않으면 보이지 않는 채로 남는다 */
  onDelete?: () => void;
  /** 클릭 가능 여부. true면 호버/포커스 효과 추가 @default false */
  clickable?: boolean;
  /** 선택 상태 @default false */
  selected?: boolean;
  /** 비활성화 상태 @default false */
  disabled?: boolean;
  /** 클릭 핸들러 */
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
  clickable = false,
  selected = false,
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

  // 언마운트 때 ref는 이미 비어 있어서 노드를 미리 잡아 둔다.
  useEffect(() => {
    const el = rootRef.current;
    return () => {
      el?.__chipExitTween?.kill();
    };
  }, []);

  // 삭제 버튼 클릭 핸들러. onDelete는 퇴장이 끝난 뒤 부른다. 부모가 칩을 바로
  // 지우면 애니메이션할 시간이 없다(BubbleMenu도 끝난 뒤 닫는다). 가속하며
  // 빨려 들어가는 것이 bubble이 사라지는 느낌이다(scale 1 -> 0, ease-in).
  // 축소 모드는 gateMotion이 끝 상태로 확정해 onComplete가 즉시 불린다.
  const handleDelete = (
    e: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>
  ) => {
    e.stopPropagation();
    const el = rootRef.current;
    if (disabled || exitingRef.current || !el) return;
    exitingRef.current = true;
    setExiting(true);
    // CSS transition이 transform·opacity를 따라가면 GSAP이 매 프레임 쓰는 값과 다툰다.
    el.style.transition = 'none';
    el.__chipExitTween = gateMotion(reduced, () =>
      gsap.to(el, {
        scale: 0,
        opacity: 0,
        transformOrigin: '50% 50%',
        duration: gsapDuration.base,
        ease: gsapEasing.exit,
        onComplete: () => onDelete?.(),
      })
    );
  };

  // 클릭 가능 여부에 따라 button 또는 div로 렌더링
  const isClickable = clickable && onClick;

  // useClickable 훅으로 클릭 가능한 div 처리
  const clickableProps = useClickable({
    onClick: onClick
      ? () => {
          onClick();
        }
      : undefined,
    disabled,
    role: 'button',
  });

  // 삭제 버튼용 useClickable
  const deleteButtonProps = useClickable({
    onClick: onDelete ? handleDelete : undefined,
    disabled,
    role: 'button',
  });

  // 누름 상태(data-pressed)와 Enter/Space 누름. 클릭 가능한 칩에만 건다.
  const { pressed, handlers } = useClickRebound<HTMLButtonElement>(disabled, {
    onKeyDown: clickableProps.onKeyDown,
  });

  const chipClasses = clsx(
    chip({ size, variant, color }),
    isClickable && clickableStyle({ variant, color }),
    {
      [selectedStyle]: selected,
      [disabledStyle]: disabled,
      [exitingStyle]: exiting,
    },
    className
  );

  const chipContent = (
    <>
      <span className={glowStyle} aria-hidden="true" />
      {avatar && <span className={iconContainer}>{avatar}</span>}
      {icon && <span className={iconContainer}>{icon}</span>}
      <span className={labelStyle}>{label}</span>
      {onDelete && (
        <span
          {...deleteButtonProps}
          // 삭제 버튼을 누를 때 칩 전체가 눌려 보이지 않게 한다.
          onPointerDown={(e) => e.stopPropagation()}
          className={deleteButton}
          aria-label={`${label} 삭제`}
        >
          <Glyph name="close" size="sm" />
        </span>
      )}
    </>
  );

  if (isClickable) {
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

  return (
    <div
      ref={rootRef as React.Ref<HTMLDivElement>}
      inert={exiting}
      className={chipClasses}
      style={markerStyle}
    >
      {chipContent}
    </div>
  );
};

Chip.displayName = 'Chip';
