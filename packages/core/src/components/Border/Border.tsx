import type { HTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';
import {
  border,
  glowRing,
  sidesStyles,
  variantStyles,
  widthStyles,
  colorStyles,
  roundedStyles,
  paddingStyles,
} from './Border.css';

/** 자식 요소에 테두리를 추가하는 래퍼 컴포넌트 */
export interface BorderProps extends HTMLAttributes<HTMLDivElement> {
  /** 테두리로 감쌀 콘텐츠 */
  children: ReactNode;
  /** 테두리를 적용할 방향 @default 'all' */
  sides?:
    | 'all'
    | 'top'
    | 'right'
    | 'bottom'
    | 'left'
    | 'horizontal'
    | 'vertical';
  /** 테두리 선 스타일 @default 'solid' */
  variant?: 'solid' | 'dashed' | 'dotted';
  /** 테두리 두께 @default 'thin' */
  width?: 'thin' | 'medium' | 'thick';
  /** 테두리 색상 @default 'default' */
  color?: 'default' | 'primary' | 'success' | 'error' | 'warning';
  /** 모서리 둥글기 @default 'none' */
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  /** 내부 여백 @default 'none' */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** 추가 CSS 클래스 */
  className?: string;
}

export const Border = ({
  children,
  sides = 'all',
  variant = 'solid',
  width = 'thin',
  color = 'default',
  rounded = 'none',
  padding = 'none',
  className,
  ...props
}: BorderProps) => {
  return (
    <div
      className={clsx(
        border,
        sidesStyles[sides],
        variantStyles[variant],
        widthStyles[width],
        colorStyles[color],
        roundedStyles[rounded],
        paddingStyles[padding],
        className
      )}
      {...props}
    >
      {/* 빛 루프는 닫힌 테두리(sides='all')에서만 "한 바퀴"가 성립한다.
          회전하는 그라디언트를 가둘 그릇이라 실제 DOM 노드여야 한다
          (pseudo-element는 자기 자식 pseudo-element를 못 갖는다 — 리뷰 C2). */}
      {sides === 'all' && <span className={glowRing} aria-hidden="true" />}
      {children}
    </div>
  );
};

Border.displayName = 'Border';
