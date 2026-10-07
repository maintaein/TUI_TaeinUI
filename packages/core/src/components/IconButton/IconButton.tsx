import {
  forwardRef,
  useEffect,
  useRef,
  type ButtonHTMLAttributes,
  type PointerEvent,
  type ReactNode,
} from 'react';
import clsx from 'clsx';
import { gsap } from 'gsap';
import {
  iconButton,
  iconSizeVariants,
  ghostBase,
  ghostSizeVariants,
  pressable,
  iconSlot,
  loadingSlot,
  jellySlot,
} from './IconButton.css';
import { Loader } from '../Loader';
import { useClickRebound } from '../../_internal/useClickRebound';
import { gsapDuration, gsapEasing } from '../../tokens/gsapEasing';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { gateMotion } from '../../hooks/gateMotion';

type IconButtonVariant = 'primary' | 'dark' | 'danger' | 'light';
type IconButtonStyle = 'ghost' | 'weak' | 'strong';
type IconButtonHoverEffect = 'none' | 'jelly';

// 테스트가 현재 타임라인을 읽는 손잡이(Chip의 __chipExitTimeline과 같은 모양).
type JellyHost = HTMLElement & { __iconButtonJelly?: gsap.core.Timeline };

// 가로로 퍼지는 최대 배율. SquishSwitch의 최대 늘임(0.4)에 기본 강도(0.36)를 곱한 1.144를
// 올림했다. 세로는 1 / 가로라 부피가 지켜진다(SquishSwitch의 scaleY = h / scaleX).
const JELLY_STRETCH = 1.15;

/**
 * 아이콘을 버튼으로 만드는 컴포넌트. lucide-react, react-icons 등 어느 아이콘
 * 라이브러리의 아이콘이든 children으로 넣으면 버튼이 된다. 아이콘 크기는 버튼
 * `size`가 정한다(아이콘의 svg가 1em). 아이콘에 직접 크기를 주려면 `size` prop이 아니라
 * `className`이나 `style`로 준다(`size` prop은 SVG 속성이라 버튼의 CSS 규칙에 진다).
 * 소비자의 전역 요소 규칙(예: `svg { width: 24px }`)에도 진다. 클래스와 `style`은 이긴다.
 * aria-label 필수.
 */
export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** 버튼 색상 테마. weak·strong에만 적용된다(ghost는 회색 고정이라 무시된다) @default 'primary' */
  variant?: IconButtonVariant;
  /** 버튼 스타일. ghost: 배경 없음(호버에 옅은 배경), weak: 옅은 배경, strong: 진한 배경 @default 'ghost' */
  buttonStyle?: IconButtonStyle;
  /** 버튼 크기 @default 'md' */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /**
   * 호버 효과. jelly: 마우스가 들어오면 아이콘이 부피를 지키며 옆으로 퍼졌다가 출렁이며
   * 돌아온다. 한 번 도는 동안 다시 들어와도 무시한다. 마우스만 받고 터치·키보드 포커스에는
   * 없으며 비활성·로딩에서도 없다. 모션 축소 선호에서는 움직이지 않는다. 기본으로 켜져
   * 있고 `'none'`으로 끈다 @default 'jelly'
   */
  hoverEffect?: IconButtonHoverEffect;
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
      hoverEffect = 'jelly',
      loading = false,
      disabled = false,
      children,
      className,
      onPointerDown,
      onPointerEnter,
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

    const jelly = hoverEffect === 'jelly';
    const reduced = useReducedMotion();
    const slotRef = useRef<JellyHost>(null);

    // 아이콘 칸이 바뀌거나(로딩) 효과가 꺼지거나 언마운트하면 돌던 타임라인을 죽이고
    // 중간 배율이 남지 않게 transform을 걷는다. 손잡이도 비워야 다시 켰을 때 죽은 것이
    // "도는 중"으로 읽혀 무시되지 않는다.
    useEffect(() => {
      const el = slotRef.current;
      return () => {
        if (!el?.__iconButtonJelly) return;
        el.__iconButtonJelly.kill();
        el.__iconButtonJelly = undefined;
        gsap.set(el, { clearProps: 'transform' });
      };
    }, [jelly, loading]);

    const handlePointerEnter = (event: PointerEvent<HTMLButtonElement>) => {
      onPointerEnter?.(event);
      const el = slotRef.current;
      if (!el || !jelly || isDisabled || event.pointerType !== 'mouse') return;
      // 도는 중이면 무시한다. 처음부터 다시 시작하면 빠르게 드나들 때 매번 끊겨 보인다.
      // isActive()는 첫 프레임 전에 거짓이라 progress로 읽는다.
      if ((el.__iconButtonJelly?.progress() ?? 1) < 1) return;
      el.__iconButtonJelly = gateMotion(reduced, () => {
        const tl = gsap.timeline();
        tl.to(el, {
          scaleX: JELLY_STRETCH,
          scaleY: 1 / JELLY_STRETCH,
          transformOrigin: '50% 100%',
          duration: gsapDuration.fast,
          ease: gsapEasing.settle,
        });
        // elastic.out은 정점이 120%라 1을 지나쳤다가 감쇠 진동하며 앉는다. 500ms라
        // 진동이 약 4Hz로 보인다(200ms면 떨림이 된다).
        tl.to(el, {
          scaleX: 1,
          scaleY: 1,
          duration: gsapDuration.slower,
          ease: gsapEasing.spring,
        });
        return tl;
      });
    };

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
        onPointerEnter={handlePointerEnter}
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
            ref={slotRef}
            aria-hidden="true"
            className={clsx(
              iconSlot,
              iconSizeVariants[size],
              jelly && jellySlot
            )}
          >
            {children}
          </span>
        )}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
