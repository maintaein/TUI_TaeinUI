import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import clsx from 'clsx';
import {
  iconButton,
  iconSizeVariants,
  ghostBase,
  ghostSizeVariants,
  pressable,
  iconSlot,
  loadingSlot,
} from './IconButton.css';
import { Loader } from '../Loader';
import { useClickRebound } from '../../_internal/useClickRebound';

type IconButtonVariant = 'primary' | 'dark' | 'danger' | 'light';
type IconButtonStyle = 'ghost' | 'weak' | 'strong';

/**
 * 아이콘을 버튼으로 만드는 컴포넌트. lucide-react, react-icons 등 어느 아이콘
 * 라이브러리의 아이콘이든 children으로 넣으면 버튼이 된다. 아이콘 크기는 버튼
 * `size`가 정한다(아이콘의 svg가 1em). 아이콘에 직접 크기를 주려면 `size` prop이 아니라
 * `className`이나 `style`로 준다(`size` prop은 SVG 속성이라 버튼의 CSS 규칙에 진다).
 * aria-label 필수.
 */
export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** 버튼 색상 테마. weak·strong에만 적용된다(ghost는 회색 고정이라 무시된다) @default 'primary' */
  variant?: IconButtonVariant;
  /** 버튼 스타일. ghost: 배경 없음(호버에 옅은 배경), weak: 옅은 배경, strong: 진한 배경 @default 'ghost' */
  buttonStyle?: IconButtonStyle;
  /** 버튼 크기 @default 'md' */
  size?: 'sm' | 'md' | 'lg' | 'xl';
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
      buttonStyle = 'ghost',
      size = 'md',
      loading = false,
      disabled = false,
      children,
      className,
      onPointerDown,
      onPointerUp,
      onPointerLeave,
      onPointerCancel,
      onKeyDown,
      onKeyUp,
      onBlur,
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
          pressable,
          buttonStyle === 'ghost'
            ? [ghostBase, ghostSizeVariants[size]]
            : iconButton({ size, buttonStyle, variant }),
          className
        )}
        data-pressed={pressed ? '' : undefined}
        {...handlers}
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
            className={clsx(iconSlot, iconSizeVariants[size])}
          >
            {children}
          </span>
        )}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
