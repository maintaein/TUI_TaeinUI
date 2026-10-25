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
  /** 모서리 둥글기. 미지정이면 `sides='all'`은 'md', 부분 sides는 'none'(선 끝이 휘지 않는다). 명시하면 항상 우선한다 */
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  /** 내부 여백 @default 'none' */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /**
   * 단일 꼬리 빛이 둥근 테두리 길을 따라 3초에 한 바퀴 돌며 반바퀴마다 느려졌다 빨라지는 로더. 호버·포커스와 무관하며 `sides='all'`일 때만 나타난다.
   * 5초 넘게 계속 움직이므로(WCAG 2.2.2) 로딩이 끝나면 끈다. 축소 모션에서는 돌지 않고 빛이 한 자리에 멈춰 보인다 @default false
   */
  glow?: boolean;
  /** 추가 CSS 클래스 */
  className?: string;
}

export const Border = ({
  children,
  sides = 'all',
  variant = 'solid',
  width = 'thin',
  color = 'default',
  rounded,
  padding = 'none',
  glow = false,
  className,
  ...props
}: BorderProps) => {
  const resolvedRounded = rounded ?? (sides === 'all' ? 'md' : 'none');
  return (
    <div
      className={clsx(
        border,
        sidesStyles[sides],
        variantStyles[variant],
        widthStyles[width],
        colorStyles[color],
        roundedStyles[resolvedRounded],
        paddingStyles[padding],
        className
      )}
      {...props}
    >
      {/* 닫힌 테두리에서만 한 바퀴가 성립하며, 빛과 마스크를 분리할 실제 그릇이 필요하다. */}
      {glow && sides === 'all' && (
        <span className={glowRing} aria-hidden="true" />
      )}
      {children}
    </div>
  );
};

Border.displayName = 'Border';
