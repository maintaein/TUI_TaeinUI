import {
  forwardRef,
  useEffect,
  useLayoutEffect,
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
  fill,
  fillHost,
} from './IconButton.css';
import { Loader } from '../Loader';
import { useClickRebound } from '../../_internal/useClickRebound';
import { gsapDuration, gsapEasing } from '../../tokens/gsapEasing';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { gateMotion } from '../../hooks/gateMotion';

type IconButtonVariant = 'primary' | 'dark' | 'danger' | 'light';
type IconButtonStyle = 'ghost' | 'weak' | 'strong';
type IconButtonHoverEffect = 'none' | 'directional';

// 테스트가 현재 채움 트윈을 읽는 손잡이(Chip의 __chipExitTimeline과 같은 모양).
type FillHost = HTMLElement & { __iconButtonFill?: gsap.core.Tween };

// 층이 완전히 밖에 있는 위치. 100이면 가장자리에 반 픽셀 틈이 비쳐 101로 둔다
// (FlowingMenu와 같다).
// IconButton.css.ts의 fill이 CSS 초기값으로 같은 101%를 갖는다(SSR 쉬는 자리).
const OUTSIDE = 101;
const REST = { xPercent: 0, yPercent: OUTSIDE };
const INSIDE = { xPercent: 0, yPercent: 0 };

// 포인터에서 네 변까지 수직 거리 중 가장 가까운 변 밖의 자리. 같으면 먼저 오는 쪽.
const nearestOutside = (rect: DOMRect, clientX: number, clientY: number) => {
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  const edges = [
    { d: x, xPercent: -OUTSIDE, yPercent: 0 },
    { d: rect.width - x, xPercent: OUTSIDE, yPercent: 0 },
    { d: y, xPercent: 0, yPercent: -OUTSIDE },
    { d: rect.height - y, xPercent: 0, yPercent: OUTSIDE },
  ];
  const { xPercent, yPercent } = edges.reduce((a, b) => (b.d < a.d ? b : a));
  return { xPercent, yPercent };
};

const isOutside = (el: HTMLElement) =>
  Math.abs(Number(gsap.getProperty(el, 'xPercent'))) >= OUTSIDE ||
  Math.abs(Number(gsap.getProperty(el, 'yPercent'))) >= OUTSIDE;

// 층을 지금 자리에서 target으로 보낸다. 축소 모드는 gateMotion이 끝 상태로 확정한다.
const moveFill = (
  el: FillHost,
  target: { xPercent: number; yPercent: number },
  duration: number,
  reduced: boolean
) => {
  el.__iconButtonFill = gateMotion(reduced, () =>
    gsap.to(el, {
      ...target,
      duration,
      ease: gsapEasing.settle,
      overwrite: 'auto',
    })
  );
};

// CSS의 호버 게이트와 같은 조건. matchMedia가 없는 환경(일부 jsdom)에서는 거짓이다.
const canHover = () =>
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(hover: hover) and (pointer: fine)').matches;

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
   * 호버 효과. directional: 마우스가 들어온 가장 가까운 모서리에서 호버 색이 밀려
   * 들어오고, 나갈 때는 나가는 쪽 모서리로 빠진다. 마우스만 받고 터치·키보드 포커스에는
   * 없다. 모션 축소 선호에서는 색이 바로 바뀐다 @default 'none'
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
      hoverEffect = 'none',
      loading = false,
      disabled = false,
      children,
      className,
      onPointerDown,
      onPointerUp,
      onPointerEnter,
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

    const directional = hoverEffect === 'directional';
    const reduced = useReducedMotion();
    const fillRef = useRef<FillHost>(null);

    // 층은 쉴 때 아래 모서리 밖에 있다(CSS 초기값과 같은 자리). x, y를 0으로 같이 둔다:
    // GSAP은 처음 만질 때 CSS의 translateY(101%)를 계산된 transform에서 px(y)로 읽는다.
    // 그 위에 yPercent를 얹으면 두 배로 밀린다(Snackbar.css.ts의 transform 주석과 같은 함정).
    // 그래서 x, y를 0으로 같이 둔다. 인라인 none은 jsdom 때문이다: 거기서는 계산된 값이
    // matrix()가 아니라 translateY(101%) 그대로라 GSAP이 읽다가 NaN이 된다.
    // 언마운트하면 트윈을 죽인다.
    useLayoutEffect(() => {
      const el = fillRef.current;
      if (!el) return;
      el.style.transform = 'none';
      gsap.set(el, { x: 0, y: 0, ...REST });
      return () => {
        el.__iconButtonFill?.kill();
      };
    }, [directional]);

    // 비활성이 되는 순간 층이 들어와 있으면 지금 자리에서 밖으로 뺀다. 비활성에서 돌아온
    // 순간 포인터가 아직 위에 있으면(로딩 중에는 pointerenter가 다시 오지 않는다) 아래
    // 모서리에서 들인다. 좌표가 없어 방향은 쉬는 자리 그대로다.
    const wasDisabled = useRef(isDisabled);
    useEffect(() => {
      const returned = wasDisabled.current && !isDisabled;
      wasDisabled.current = isDisabled;
      const el = fillRef.current;
      if (!el) return;
      if (isDisabled) {
        if (!isOutside(el)) moveFill(el, REST, gsapDuration.base, reduced);
      } else if (
        returned &&
        canHover() &&
        el.parentElement?.matches(':hover')
      ) {
        if (isOutside(el)) gsap.set(el, REST);
        moveFill(el, INSIDE, gsapDuration.slow, reduced);
      }
    }, [isDisabled, reduced]);

    const handlePointerEnter = (event: PointerEvent<HTMLButtonElement>) => {
      onPointerEnter?.(event);
      const el = fillRef.current;
      if (!el || isDisabled || event.pointerType !== 'mouse') return;
      // 반쯤 빠지던 중이면 새 모서리로 옮기지 않고 지금 자리에서 들어온다.
      if (isOutside(el)) {
        gsap.set(
          el,
          nearestOutside(
            event.currentTarget.getBoundingClientRect(),
            event.clientX,
            event.clientY
          )
        );
      }
      moveFill(el, INSIDE, gsapDuration.slow, reduced);
    };

    const handlePointerLeave = (event: PointerEvent<HTMLButtonElement>) => {
      handlers.onPointerLeave(event);
      const el = fillRef.current;
      if (!el || isDisabled || event.pointerType !== 'mouse') return;
      moveFill(
        el,
        nearestOutside(
          event.currentTarget.getBoundingClientRect(),
          event.clientX,
          event.clientY
        ),
        gsapDuration.base,
        reduced
      );
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
          directional && fillHost,
          className
        )}
        data-pressed={pressed ? '' : undefined}
        data-hover-effect={directional ? hoverEffect : undefined}
        {...handlers}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        {...props}
      >
        {directional && (
          <span ref={fillRef} aria-hidden="true" className={fill} />
        )}
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
