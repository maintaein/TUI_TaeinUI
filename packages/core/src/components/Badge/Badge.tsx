import { useState, type ReactNode, type HTMLAttributes } from 'react';
import clsx from 'clsx';
import {
  badge,
  variantStyles,
  sizeStyles,
  dotStyles,
  valueCurrent,
  valueExiting,
} from './Badge.css';

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
  // 표시할 내용 결정 — 아래 훅보다 먼저 계산해 둔다. 훅은 이 컴포넌트가
  // 렌더될 때마다 같은 순서로 호출돼야 하므로, 조기 return이 있는 검증
  // 블록들보다 앞에 와야 한다.
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

  // 값 교체 애니메이션: 직전 값을 훅 상태로 들고 있다가 값이 바뀌면 그
  // 직전 값을 퇴장 노드로 넘긴다 — 이펙트 없이 렌더 중에 상태를 조정하는
  // 패턴이다. dot 모드는 표시값이 없어 대상에서 뺀다. prevValue가
  // null/undefined였다면(예: children이 잠깐 비었다가 돌아온 경우) 퇴장시킬
  // "헌 값"이 없으므로 exitingValue는 건드리지 않는다.
  const [prevValue, setPrevValue] = useState(displayContent);
  const [exitingValue, setExitingValue] = useState<typeof displayContent>(null);

  if (!dot && displayContent !== prevValue) {
    if (prevValue != null) {
      setExitingValue(prevValue);
    }
    setPrevValue(displayContent);
  }

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
    // key를 여기 두지 않는다: 이 span이 role="status" 라이브 리전이라,
    // 값이 바뀔 때마다 재마운트하면 스크린 리더가 매번 새 라이브 리전으로
    // 취급해 알림이 불안정해진다. 재마운트는 아래 값 노드에서만 일어난다.
    <span
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
      {!dot && exitingValue !== null && (
        // 퇴장 중인 헌 값. aria-hidden은 접근성 목적(라이브 리전이 헌 값을
        // 다시 읽지 않게)이지, getByText 다중 매치를 막으려는 게 아니다
        // — getByText는 aria-hidden을 무시하지 않는다. 값이 바뀌면
        // key가 바뀌어 재마운트되면서 valueExit이 처음부터 다시 재생된다.
        <span
          key={String(exitingValue)}
          aria-hidden="true"
          className={valueExiting}
          onAnimationEnd={() => setExitingValue(null)}
        >
          {exitingValue}
        </span>
      )}
      {!dot && (
        // 현재 값. 값이 바뀔 때만 재마운트해 valueEnter를 다시 재생한다.
        // variant·size 등 다른 prop 변경으로는 재생하지 않는다.
        <span key={String(displayContent)} className={valueCurrent}>
          {displayContent}
        </span>
      )}
    </span>
  );
};

Badge.displayName = 'Badge';
