import type { HTMLAttributes } from 'react';
import clsx from 'clsx';
import { skeleton, variantStyles, animationStyles } from './Skeleton.css';

/**
 * 콘텐츠 로딩 중 표시하는 플레이스홀더 컴포넌트. 장식이라 스크린 리더에서
 * 숨는다(`aria-hidden`). 로딩 알림은 감싸는 영역에 `aria-busy`와 이름을 줘서 한다.
 */
export interface SkeletonProps extends HTMLAttributes<HTMLSpanElement> {
  /** 스켈레톤 형태 @default 'text' */
  variant?: 'text' | 'rect' | 'circle' | 'rounded';
  /** 애니메이션 타입. false로 비활성화 가능 @default 'wave' */
  animation?: 'wave' | 'pulse' | false;
  /** 너비 (숫자면 px, 문자열이면 CSS 단위) */
  width?: number | string;
  /** 높이 (숫자면 px, 문자열이면 CSS 단위) */
  height?: number | string;
}

// 숫자면 px, 문자열은 그대로. undefined는 인라인 크기를 달지 않는다.
const toCss = (value?: number | string) =>
  typeof value === 'number' ? `${value}px` : value;

export const Skeleton = ({
  variant = 'text',
  animation = 'wave',
  width,
  height,
  className,
  ...props
}: SkeletonProps) => (
  <span
    // 스켈레톤은 장식이다: 로딩 알림은 감싸는 영역(aria-busy와 이름)이 맡는다.
    // 소비자가 이름이나 role을 주면 숨기지 않는다(Badge 점과 같은 규칙).
    // role 없는 span의 aria-label은 이름이 되지 않을 수 있어 이름만 주면
    // role="img"를 같이 단다. 소비자 role은 {...props}가 덮어 이긴다.
    aria-hidden={props['aria-label'] || props.role ? undefined : true}
    role={props['aria-label'] ? 'img' : undefined}
    className={clsx(
      skeleton,
      variantStyles[variant],
      animation && animationStyles[animation],
      className
    )}
    // circle은 width만 주면 height도 같게 한다.
    style={{
      width: toCss(width),
      height: toCss(height ?? (variant === 'circle' ? width : undefined)),
    }}
    {...props}
  />
);

Skeleton.displayName = 'Skeleton';
