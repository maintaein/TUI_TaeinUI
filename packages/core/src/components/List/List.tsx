import type { HTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';
import {
  list,
  spacingStyles,
  withDivider,
  listItem,
  layoutStyles,
  label as labelStyle,
  value as valueStyle,
  horizontalGap,
  verticalGap,
} from './List.css';

/** 항목 목록을 표시하는 리스트 컴포넌트 */
export interface ListProps extends HTMLAttributes<HTMLUListElement> {
  /** ListItem 컴포넌트들 */
  children: ReactNode;
  /** 항목 간 간격 @default 'md' */
  spacing?: 'none' | 'sm' | 'md' | 'lg';
  /** 항목 사이 구분선 표시 @default false */
  divider?: boolean;
}

/** 리스트 내 개별 항목. label-value 쌍 또는 children 자유 배치 */
export interface ListItemProps extends HTMLAttributes<HTMLLIElement> {
  /** 항목 레이블 (왼쪽 또는 상단) */
  label?: ReactNode;
  /** 항목 값 (오른쪽 또는 하단) */
  value?: ReactNode;
  /** 자유 배치용 콘텐츠. 있으면 label·value·layout을 쓰지 않는다 */
  children?: ReactNode;
  /** 레이아웃 방향 @default 'horizontal' */
  layout?: 'horizontal' | 'vertical';
  /** label 영역 고정 너비 (CSS 단위) */
  labelWidth?: string;
}

export const List = ({
  children,
  spacing = 'md',
  divider = false,
  className,
  ...props
}: ListProps) => {
  return (
    <ul
      className={clsx(
        list,
        spacingStyles[spacing],
        divider && withDivider,
        className
      )}
      {...props}
    >
      {children}
    </ul>
  );
};

List.displayName = 'List';

export const ListItem = ({
  label,
  value,
  children,
  layout = 'horizontal',
  labelWidth,
  className,
  ...props
}: ListItemProps) => {
  // children이 있으면 자유 레이아웃 모드
  if (children) {
    return (
      <li className={clsx(listItem, className)} {...props}>
        {children}
      </li>
    );
  }

  // 기존 label-value 구조
  return (
    <li
      className={clsx(
        listItem,
        layoutStyles[layout],
        layout === 'horizontal' ? horizontalGap : verticalGap,
        className
      )}
      {...props}
    >
      <div
        className={labelStyle}
        style={labelWidth ? { width: labelWidth } : undefined}
      >
        {label}
      </div>
      <div className={valueStyle}>{value}</div>
    </li>
  );
};

ListItem.displayName = 'ListItem';
