import type { ElementType, ReactNode } from 'react';
import { clsx } from 'clsx';
import * as styles from './Text.css';

/** 타이포그래피 컴포넌트. variant에 따라 자동으로 적절한 HTML 태그 사용 */
export interface TextProps {
  /** 텍스트 내용 */
  children?: ReactNode;
  /** 텍스트 variant (기본값: body1) */
  variant?:
    | 'h1'
    | 'h2'
    | 'h3'
    | 'h4'
    | 'h5'
    | 'h6'
    | 'body1'
    | 'body2'
    | 'body3';
  /** HTML 태그 (variant보다 우선) */
  as?: ElementType;
  /** 텍스트 색상 */
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  /** 폰트 굵기 */
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
  /** 텍스트 정렬 */
  align?: 'left' | 'center' | 'right';
  /** 텍스트 줄 수 제한 (1~3) */
  truncate?: 1 | 2 | 3;
  /** 숫자를 고정폭으로 렌더링 (표·지표처럼 자릿수를 세로로 맞춰야 할 때) */
  tabularNums?: boolean;
  /** 추가 CSS 클래스 */
  className?: string;
}

// variant에 따른 기본 HTML 태그 매핑
const DEFAULT_TAGS: Record<string, ElementType> = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
  body1: 'p',
  body2: 'p',
  body3: 'p',
};

export function Text({
  children,
  variant = 'body1',
  as,
  color,
  weight,
  align,
  truncate,
  tabularNums,
  className,
}: TextProps) {
  // children이 없으면 렌더링하지 않음
  if (!children) {
    return null;
  }

  // as prop이 있으면 우선 사용, 없으면 variant에 따른 기본 태그 사용
  const Component = as || DEFAULT_TAGS[variant];

  // 스타일 클래스 조합
  const classNames = clsx(
    styles.base,
    styles.variant[variant],
    color && styles.color[color],
    weight && styles.weight[weight],
    align && styles.align[align],
    truncate && styles.truncate,
    tabularNums && styles.tabularNums,
    className
  );

  // truncate를 위한 style 객체
  const style = truncate
    ? {
        WebkitLineClamp: truncate,
      }
    : undefined;

  return (
    <Component className={classNames} style={style}>
      {children}
    </Component>
  );
}
