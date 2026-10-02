import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react';
import clsx from 'clsx';
import {
  button,
  customVariant,
  customOutlineVariant,
  fullWidth,
  loadingSlot,
} from './Button.css';
import { Loader } from '../Loader';

// 왜 90ms인가: press-in(200ms, power3.out)의 45%. 그 시점에 scale은 목표 거리의
// 83%(1-(1-0.45)^3)에 닿아서 30ms 탭도 눌렸다는 것이 읽힌다. 이보다 길게
// 붙잡으면 빠른 연타가 굼떠 보인다.
// 토큰 스케일(fast 150 / base 200 ...)에 대응 값이 없다. CSS가 아니라 JS가
// 해제 시점을 정하는 값이라 duration 토큰이 아니고, 옵션으로 열지 않는다.
const MIN_PRESS_MS = 90;

type ButtonVariant = 'primary' | 'dark' | 'danger' | 'light';
type ButtonStyle = 'fill' | 'weak';

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
  /** 버튼 채우기 스타일. fill: 배경 채움, weak: 배경 투명 @default 'fill' */
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
      buttonStyle = 'fill',
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

    // data-pressed는 :active 대신 누름 상태의 수명을 JS가 정하게 하는 손잡이다.
    // 해제 요청이 설정 후 MIN_PRESS_MS 안에 오면 남은 시간만큼 미룬다.
    // 포인터와 키보드(Enter/Space)가 같은 경로를 쓴다. 포커스된 버튼의 Space
    // 활성화는 클릭과 같은 단일 행동이라 포인터 사용자만 피드백을 받으면 안 된다.
    const [pressed, setPressed] = useState(false);
    const minHoldRef = useRef(false);
    const releaseAskedRef = useRef(false);
    const holdTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    useEffect(() => () => clearTimeout(holdTimerRef.current), []);

    // 비활성이 되는 순간 누름 상태를 비운다. Enter는 keydown에서 click이 나서
    // onClick이 loading을 켜면 버튼이 곧바로 disabled가 되고, 그러면 keyup과 blur가
    // 오지 않아 눌린 모양이 다시 활성화된 뒤까지 남는다. 상태는 렌더 중에 맞추고
    // (effect 안 setState는 연쇄 렌더라 lint가 막는다), ref와 타이머는 effect가 정리한다.
    const [wasDisabled, setWasDisabled] = useState(isDisabled);
    if (wasDisabled !== isDisabled) {
      setWasDisabled(isDisabled);
      if (isDisabled) setPressed(false);
    }

    useEffect(() => {
      if (!isDisabled) return;
      clearTimeout(holdTimerRef.current);
      minHoldRef.current = false;
      releaseAskedRef.current = false;
    }, [isDisabled]);

    const press = () => {
      clearTimeout(holdTimerRef.current);
      minHoldRef.current = true;
      releaseAskedRef.current = false;
      setPressed(true);
      holdTimerRef.current = setTimeout(() => {
        minHoldRef.current = false;
        if (releaseAskedRef.current) setPressed(false);
      }, MIN_PRESS_MS);
    };

    const release = () => {
      if (minHoldRef.current) releaseAskedRef.current = true;
      else setPressed(false);
    };

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
        onPointerDown={(event) => {
          onPointerDown?.(event);
          // 보조 버튼(우클릭)에는 걸지 않는다. 우클릭에 :active가 켜지지 않던
          // 기존 동작과 같다. (macOS ctrl+click은 button이 0이라 이 가드가 못 막는다.)
          if (event.button !== 0) return;
          press();
        }}
        onPointerUp={(event) => {
          onPointerUp?.(event);
          release();
        }}
        onPointerLeave={(event) => {
          onPointerLeave?.(event);
          release();
        }}
        onPointerCancel={(event) => {
          onPointerCancel?.(event);
          release();
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          // 길게 누르면 keydown이 반복해 오므로 repeat은 타이머를 다시 시작하지 않는다.
          if (event.repeat) return;
          if (event.key === 'Enter' || event.key === ' ') press();
        }}
        onKeyUp={(event) => {
          onKeyUp?.(event);
          if (event.key === 'Enter' || event.key === ' ') release();
        }}
        onBlur={(event) => {
          onBlur?.(event);
          // 키를 누른 채 포커스가 떠나면 keyup이 오지 않는다.
          release();
        }}
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
