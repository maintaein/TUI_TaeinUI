import type { SVGAttributes } from 'react';
import clsx from 'clsx';
import { iconBase } from './Icon.css';

export type IconName =
  | 'close'
  | 'plus'
  | 'minus'
  | 'chevron-down'
  | 'chevron-up'
  | 'check-circle'
  | 'alert-circle'
  | 'alert-triangle'
  | 'info';

/** SVG 아이콘 컴포넌트. 내장 아이콘 세트 제공 */
export interface IconProps extends Omit<SVGAttributes<SVGSVGElement>, 'color'> {
  /** 아이콘 이름 */
  name: IconName;
  /** 아이콘 크기 (sm=16px, md=20px, lg=24px, xl=32px) @default 'md' */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** 아이콘 색상 (CSS 색상값) @default 'currentColor' */
  color?: string;
  /** 스크린 리더용 레이블. 장식용 아이콘이면 생략 */
  'aria-label'?: string;
  /** SVG title 요소 (툴팁 역할) */
  title?: string;
  /** 추가 CSS 클래스 */
  className?: string;
}

const SIZE_MAP = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
} as const;

// 아이콘 경로 레지스트리
const ICON_PATHS: Record<IconName, string> = {
  close: 'M18 6L6 18M6 6l12 12',
  plus: 'M12 5v14m-7-7h14',
  minus: 'M5 12h14',
  'chevron-down': 'M6 9l6 6 6-6',
  'chevron-up': 'M18 15l-6-6-6 6',
  'check-circle': 'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3',
  'alert-circle': 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20M12 8v4M12 16h.01',
  'alert-triangle':
    'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01',
  info: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20M12 16v-4M12 8h.01',
};

export const Icon = ({
  name,
  size = 'md',
  color = 'currentColor',
  'aria-label': ariaLabel,
  title,
  className,
  ...props
}: IconProps) => {
  // 개발 환경에서 유효하지 않은 아이콘 이름 경고
  if (process.env.NODE_ENV === 'development') {
    if (!ICON_PATHS[name]) {
      console.error(
        `Icon: "${name}"은(는) 유효하지 않은 아이콘 이름입니다. 사용 가능한 아이콘: ${Object.keys(ICON_PATHS).join(', ')}`
      );
    }
  }

  const iconSize = SIZE_MAP[size];
  const pathData = ICON_PATHS[name];

  // aria-label이 있으면 접근 가능하게, 없으면 장식용으로 처리
  const accessibilityProps = ariaLabel
    ? {
        role: 'img',
        'aria-label': ariaLabel,
      }
    : {
        'aria-hidden': 'true' as const,
      };

  return (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={clsx(iconBase, className)}
      style={{ color }}
      data-icon={name}
      {...accessibilityProps}
      {...props}
    >
      {title && <title>{title}</title>}
      <path
        d={pathData}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
};

Icon.displayName = 'Icon';
