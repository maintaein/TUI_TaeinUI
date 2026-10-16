import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import clsx from 'clsx';
import {
  button,
  customVariant,
  customOutlineVariant,
  fullWidth,
  loadingSlot,
} from './Button.css';
import { Loader } from '../Loader';
import { useClickRebound } from '../../_internal/useClickRebound';

type ButtonVariant = 'primary' | 'dark' | 'danger' | 'light';
type ButtonStyle = 'strong' | 'weak';

/** 커스텀 색상 설정 */
export interface ButtonCustomColor {
  /** 배경색 */
  bg: string;
  /** 텍스트 색상 */
  text: string;
  /** 호버 시 배경색 */
  hoverBg?: string;
  /** 클릭 시 배경색 */
  activeBg?: string;
}

/** 다양한 스타일과 크기를 지원하는 버튼 컴포넌트 */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** 버튼 색상 테마 @default 'primary' */
  variant?: ButtonVariant;
  /** 버튼 채우기 스타일. strong: 배경 채움, weak: 배경 투명 @default 'strong' */
  buttonStyle?: ButtonStyle;
  /** 버튼 크기 @default 'md' */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** 부모 너비에 맞춰 확장 @default false */
  fullWidth?: boolean;
  /** 로딩 상태. true면 스피너 표시 및 클릭 비활성화 @default false */
  loading?: boolean;
  /** 비활성화 상태 @default false */
  disabled?: boolean;
  /** 텍스트 왼쪽에 표시할 아이콘 */
  leftIcon?: ReactNode;
  /** 텍스트 오른쪽에 표시할 아이콘 */
  rightIcon?: ReactNode;
  /** variant 대신 사용하는 커스텀 색상 */
  customColor?: ButtonCustomColor;
  /** 버튼 내용 */
  children: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      buttonStyle = 'strong',
      size = 'md',
      fullWidth: isFullWidth = false,
      loading = false,
      disabled = false,
      leftIcon,
      rightIcon,
      customColor,
      children,
      className,
      style,
      onPointerDown,
      onPointerUp,
      onPointerLeave,
      onPointerCancel,
      onKeyDown,
      onKeyUp,
      onBlur,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    // 누름 상태의 수명은 useClickRebound가 정한다(:active 대신 data-pressed).
    const { pressed, handlers } = useClickRebound<HTMLButtonElement>(
      isDisabled,
      {
        onPointerDown,
        onPointerUp,
        onPointerLeave,
        onPointerCancel,
        onKeyDown,
        onKeyUp,
        onBlur,
      }
    );

    const isOutlineCustom = customColor && variant === 'light';

    const variantClass = clsx(
      button({ size, buttonStyle, variant }),
      customColor && (isOutlineCustom ? customOutlineVariant : customVariant)
    );

    const mergedStyle = customColor
      ? isOutlineCustom
        ? {
            '--btn-color': customColor.bg,
            ...(customColor.hoverBg && {
              '--btn-hover-bg': customColor.hoverBg,
            }),
            ...(customColor.activeBg && {
              '--btn-active-bg': customColor.activeBg,
            }),
            ...style,
          }
        : {
            '--btn-bg': customColor.bg,
            '--btn-color': customColor.text,
            ...(customColor.hoverBg
              ? { '--btn-hover-bg': customColor.hoverBg }
              : { '--btn-hover-filter': 'brightness(0.9)' }),
            ...(customColor.activeBg
              ? { '--btn-active-bg': customColor.activeBg }
              : { '--btn-active-filter': 'brightness(0.8)' }),
            ...style,
          }
      : style;

    return (
      <button
        ref={ref}
        type="button"
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={loading}
        className={clsx(variantClass, isFullWidth && fullWidth, className)}
        style={mergedStyle}
        data-pressed={pressed ? '' : undefined}
        {...handlers}
        {...props}
      >
        {loading && (
          <Loader
            type="dots"
            className={loadingSlot}
            size="sm"
            color="currentColor"
            aria-label="로딩 중"
          />
        )}
        {!loading && leftIcon && <span aria-hidden="true">{leftIcon}</span>}
        {!loading && <span>{children}</span>}
        {!loading && rightIcon && <span aria-hidden="true">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
