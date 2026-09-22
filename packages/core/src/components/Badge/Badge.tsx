import type { ReactNode, HTMLAttributes } from 'react';
import clsx from 'clsx';
import { badge, variantStyles, sizeStyles, dotStyles } from './Badge.css';

/** 숫자 또는 상태를 표시하는 배지 컴포넌트 */
export interface BadgeProps extends Omit<
  HTMLAttributes<HTMLSpanElement>,
  'children'
> {
  /** 배지에 표시할 내용. 숫자일 경우 max 초과 시 "max+" 형태로 표시 */
  children?: ReactNode;
  /** 배지 색상 테마 @default 'primary' */
  variant?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  /** 배지 크기 @default 'md' */
  size?: 'sm' | 'md' | 'lg';
  /** 숫자 최대값. 초과 시 "99+" 형태로 표시 @default 99 */
  max?: number;
  /** true면 내용 없이 작은 점만 표시 @default false */
  dot?: boolean;
  /** children이 0일 때 표시 여부 @default true */
  showZero?: boolean;
  /** 스크린 리더용 레이블 */
  'aria-label'?: string;
  /** 추가 CSS 클래스 */
  className?: string;
  /** 인라인 스타일 */
  style?: React.CSSProperties;
}

export const Badge = ({
  children,
  variant = 'primary',
  size = 'md',
  max = 99,
  dot = false,
  showZero = true,
  'aria-label': ariaLabel,
  className,
  style,
  ...props
}: BadgeProps) => {
  // dot 모드가 아닐 때 children 검증
  if (!dot) {
    // children이 없으면 렌더링하지 않음
    if (children === null || children === undefined) {
      return null;
    }

    // 빈 문자열은 렌더링하지 않음
    if (children === '') {
      return null;
    }

    // 0 처리
    if (children === 0 && !showZero) {
      return null;
    }
  }

  // 표시할 내용 결정
  const getDisplayContent = () => {
    if (dot) {
      return null;
    }

    // 숫자인 경우 max 처리
    const numValue = Number(children);
    const isNumeric =
      !isNaN(numValue) &&
      children !== '' &&
      children !== null &&
      children !== undefined;

    if (isNumeric) {
      // showZero가 false이고 값이 0이면 빈 문자열 반환 (렌더링되지 않도록)
      if (numValue === 0 && !showZero) {
        return '';
      }

      if (numValue > max) {
        return `${max}+`;
      }
      return String(numValue);
    }

    // 텍스트인 경우 그대로 반환
    return children;
  };

  const displayContent = getDisplayContent();

  // displayContent가 빈 문자열이면 렌더링하지 않음
  if (displayContent === '') {
    return null;
  }

  // aria-label 자동 생성
  const getAriaLabel = () => {
    if (ariaLabel) {
      return ariaLabel;
    }

    if (dot) {
      return '알림';
    }

    const numValue = Number(children);
    const isNumeric =
      !isNaN(numValue) &&
      children !== '' &&
      children !== null &&
      children !== undefined;

    if (isNumeric) {
      return `${displayContent}개의 알림`;
    }

    return String(children);
  };

  const finalAriaLabel = getAriaLabel();

  return (
    <span
      // 값이 바뀔 때만 재마운트해 valueEnter 교체 애니메이션을 다시 재생한다.
      // variant·size 등 다른 prop 변경으로는 재생하지 않는다.
      key={String(displayContent)}
      role="status"
      {...(finalAriaLabel ? { 'aria-label': finalAriaLabel } : {})}
      className={clsx(
        badge,
        variantStyles[variant],
        sizeStyles[size],
        dot && dotStyles,
        className
      )}
      style={style}
      {...props}
    >
      {displayContent}
    </span>
  );
};

Badge.displayName = 'Badge';
