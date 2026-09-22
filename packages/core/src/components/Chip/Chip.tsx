import { useMemo, type ReactNode } from 'react';
import clsx from 'clsx';
import { useClickable } from '../../_internal/useClickable';
import { Icon } from '../Icon';
import { themeContract } from '../../tokens/theme.css';
import {
  chip,
  clickable as clickableStyle,
  selected as selectedStyle,
  disabled as disabledStyle,
  label as labelStyle,
  iconContainer,
  deleteButton,
} from './Chip.css';

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
  /** 레이블 왼쪽에 표시할 아바타 (icon보다 우선) */
  avatar?: ReactNode;
  /** 삭제(X) 버튼 클릭 핸들러. 설정 시 삭제 버튼 표시 */
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

  // 삭제 버튼 클릭 핸들러
  const handleDelete = (
    e: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>
  ) => {
    e.stopPropagation();
    if (disabled) return;
    onDelete?.();
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

  const chipClasses = clsx(
    chip({ size, variant, color }),
    {
      [clickableStyle]: isClickable,
      [selectedStyle]: selected,
      [disabledStyle]: disabled,
    },
    className
  );

  const chipContent = (
    <>
      {avatar && <span className={iconContainer}>{avatar}</span>}
      {icon && <span className={iconContainer}>{icon}</span>}
      <span className={labelStyle}>{label}</span>
      {onDelete && (
        <span
          {...deleteButtonProps}
          className={deleteButton}
          aria-label={`${label} 삭제`}
        >
          <Icon name="close" size="sm" />
        </span>
      )}
    </>
  );

  if (isClickable) {
    return (
      <button
        type="button"
        className={chipClasses}
        onClick={clickableProps.onClick}
        onKeyDown={clickableProps.onKeyDown}
        disabled={disabled}
        aria-disabled={disabled}
        aria-label={label}
        style={markerStyle}
      >
        {chipContent}
      </button>
    );
  }

  return (
    <div className={chipClasses} style={markerStyle}>
      {chipContent}
    </div>
  );
};

Chip.displayName = 'Chip';
