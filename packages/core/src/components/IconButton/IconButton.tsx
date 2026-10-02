import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import clsx from 'clsx';
import {
  iconButton,
  iconSizeVariants,
  ghostBase,
  ghostSizeVariants,
  iconMotion,
  loadingSlot,
} from './IconButton.css';
import { Loader } from '../Loader';

type IconButtonVariant = 'primary' | 'dark' | 'danger' | 'light';
type IconButtonStyle = 'fill' | 'weak';

/** 아이콘만 표시하는 버튼 컴포넌트. aria-label 필수 */
export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** 버튼 색상 테마 @default 'primary' */
  variant?: IconButtonVariant;
  /** 버튼 채우기 스타일 @default 'fill' */
  buttonStyle?: IconButtonStyle;
  /** 버튼 크기 @default 'md' */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** 투명 배경 모드 @default false */
  ghost?: boolean;
  /** 로딩 상태 @default false */
  loading?: boolean;
  /** 비활성화 상태 @default false */
  disabled?: boolean;
  /** 아이콘 요소 */
  children: ReactNode;
  /** 스크린 리더용 레이블 (필수 권장) */
  'aria-label'?: string;
  /** 외부 레이블 요소 ID 참조 */
  'aria-labelledby'?: string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      variant = 'primary',
      buttonStyle = 'fill',
      size = 'md',
      ghost = false,
      loading = false,
      disabled = false,
      children,
      className,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledby,
      ...props
    },
    ref
  ) => {
    // 개발 환경에서 접근성 검증
    if (process.env.NODE_ENV === 'development') {
      if ((!ariaLabel || ariaLabel.trim() === '') && !ariaLabelledby) {
        console.error(
          'IconButton: aria-label 또는 aria-labelledby가 필요합니다. 접근성을 위해 버튼의 용도를 설명하는 레이블을 제공하세요.'
        );
      }
    }

    const isDisabled = disabled || loading;

    const variantClass = iconButton({ size, buttonStyle, variant });

    return (
      <button
        ref={ref}
        type="button"
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={loading}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
        className={clsx(
          ghost ? [ghostBase, ghostSizeVariants[size]] : variantClass,
          className
        )}
        {...props}
      >
        {loading ? (
          <Loader
            type="spinner"
            className={loadingSlot}
            size="sm"
            color="currentColor"
            aria-label="로딩 중"
          />
        ) : (
          <span
            aria-hidden="true"
            className={clsx(iconMotion, iconSizeVariants[size])}
          >
            {children}
          </span>
        )}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
