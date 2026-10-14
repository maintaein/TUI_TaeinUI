import type { HTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';
import {
  divider,
  orientationStyles,
  variantStyles,
  spacingStyles,
  textAlignStyles,
  dividerWithText,
  line,
  lineVertical,
  textContent,
  textContentVertical,
} from './Divider.css';

/** 콘텐츠를 시각적으로 구분하는 구분선 컴포넌트. 텍스트 포함 가능 */
export interface DividerProps extends HTMLAttributes<HTMLDivElement> {
  /** 구분선 안에 표시할 텍스트. 설정 시 텍스트가 포함된 구분선 */
  children?: ReactNode;
  /** 구분선 방향 @default 'horizontal' */
  orientation?: 'horizontal' | 'vertical';
  /** 구분선 스타일 @default 'solid' */
  variant?: 'solid' | 'dashed' | 'dotted';
  /** 구분선 간격. 가로는 위아래, 세로는 좌우 @default 'md' */
  spacing?: 'sm' | 'md' | 'lg';
  /** 텍스트 정렬 (children이 있을 때) @default 'center' */
  textAlign?: 'left' | 'center' | 'right';
}

export const Divider = ({
  children,
  orientation = 'horizontal',
  variant = 'solid',
  spacing = 'md',
  textAlign = 'center',
  className,
  ...props
}: DividerProps) => {
  const isVertical = orientation === 'vertical';

  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={clsx(
        divider,
        orientationStyles[orientation],
        variantStyles[variant],
        spacingStyles[spacing],
        children && [textAlignStyles[textAlign], dividerWithText],
        className
      )}
      {...props}
    >
      {children ? (
        <>
          {(textAlign === 'center' || textAlign === 'right') && (
            <div className={isVertical ? lineVertical : line} />
          )}
          <div className={isVertical ? textContentVertical : textContent}>
            {children}
          </div>
          {(textAlign === 'center' || textAlign === 'left') && (
            <div className={isVertical ? lineVertical : line} />
          )}
        </>
      ) : null}
    </div>
  );
};

Divider.displayName = 'Divider';
