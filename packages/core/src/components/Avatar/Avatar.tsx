import {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
  Children,
  cloneElement,
  isValidElement,
  type ImgHTMLAttributes,
  type PointerEvent,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
  type ReactElement,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import { gsap } from 'gsap';
import { gsapDuration, gsapEasing } from '../../tokens/gsapEasing';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { settleMotion } from '../../hooks/gateMotion';
import {
  avatar,
  sizeStyles,
  variantStyles,
  avatarClip,
  image,
  fallbackText,
  clickable,
  bouncyStyle,
  statusBadge,
  statusOnline,
  statusOffline,
  statusBusy,
  statusAway,
  avatarGroup,
  spacingStyles,
  groupAvatar,
  excessAvatar,
} from './Avatar.css';

// 짧은 클릭에서도 확대가 보이게 해제를 미루는 최소 누름 시간. Button의
// MIN_PRESS_MS와 같은 근거(30ms 탭이면 확대가 시작되자마자 해제가 이어받아
// 거의 안 보인다)이고 값만 같다. 공유하지 않고 여기 둔다.
const MIN_PRESS_MS = 90;

// 테스트가 현재 트윈을 읽는 손잡이(NumericSpinner의 __pressTween과 같은 모양).
type AvatarHost = HTMLElement & {
  __avatarFloat?: gsap.core.Tween;
  __avatarPress?: gsap.core.Tween;
};

/** 사용자 프로필 이미지 또는 이니셜을 표시하는 아바타 컴포넌트 */
export interface AvatarProps extends Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  'src' | 'onClick'
> {
  /** 이미지 URL. 없거나 로드 실패 시 이니셜 fallback 표시 */
  src?: string;
  /** 대체 텍스트. 이미지 없을 때 이니셜 생성에도 사용됨 */
  alt: string;
  /** 아바타 크기 @default 'md' */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** 아바타 모양 @default 'circular' */
  variant?: 'circular' | 'rounded' | 'square';
  /** 온라인 상태 표시 배지 */
  status?: 'online' | 'offline' | 'busy' | 'away';
  /** 커스텀 fallback 콘텐츠. 이미지 없을 때 이니셜 대신 표시 */
  children?: ReactNode;
  /** 추가 CSS 클래스 */
  className?: string;
  /** 이미지 로드 실패 시 호출되는 콜백 */
  onError?: () => void;
  /** 클릭 핸들러. 설정 시 버튼처럼 동작 */
  onClick?: () => void;
  /** 링크 URL. 설정 시 앵커 태그로 렌더링 */
  href?: string;
  /** 링크 타겟 (href와 함께 사용) */
  target?: string;
  /**
   * 호버·키보드 포커스 시 살짝 튀며 떠오르고, 누르면 떠오른 채 커지는 선택 효과.
   * `onClick` 또는 `href`가 있어 클릭할 수 있을 때만 동작하고, 아니면 무시된다.
   * 모션 축소 선호에서는 움직이지 않는다. @default false
   */
  bouncy?: boolean;
}

// fallback 텍스트 생성 함수
const getInitials = (name: string): string => {
  if (!name || name.trim() === '') return '?';

  const trimmedName = name.trim();
  const words = trimmedName.split(/\s+/).filter((word) => word.length > 0);

  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  } else {
    return words[0][0].toUpperCase();
  }
};

export const Avatar = ({
  src,
  alt,
  size = 'md',
  variant = 'circular',
  status,
  children,
  className,
  onError,
  onClick,
  href,
  target,
  bouncy = false,
  ...props
}: AvatarProps) => {
  const [imageError, setImageError] = useState(false);
  const reduced = useReducedMotion();
  const rootRef = useRef<AvatarHost | null>(null);
  const setRoot = useCallback((el: HTMLElement | null) => {
    rootRef.current = el;
  }, []);
  // 떠 있어야 할 이유 둘. 하나라도 남아 있으면 뜬다.
  const hoveredRef = useRef(false);
  const focusVisibleRef = useRef(false);
  const pressedAtRef = useRef<number | null>(null);

  const handleImageError = () => {
    setImageError(true);
    onError?.();
  };

  const showImage = src && !imageError;

  // 상태 뱃지 스타일 매핑
  const statusBadgeClass = status
    ? {
        online: statusOnline,
        offline: statusOffline,
        busy: statusBusy,
        away: statusAway,
      }[status]
    : null;

  const isClickable = !!onClick || !!href;
  const RootTag = href ? 'a' : onClick ? 'button' : 'div';
  const rootProps = href
    ? {
        href,
        target,
        rel: target === '_blank' ? 'noopener noreferrer' : undefined,
        'aria-label': alt,
      }
    : onClick
      ? { type: 'button' as const, onClick, 'aria-label': alt }
      : {};

  // 클릭할 수 없는 아바타가 떠오르면 누를 수 있다고 거짓말을 한다.
  const live = bouncy && isClickable;

  // 축소 모드에서는 트윈을 만들지 않는다. gateMotion은 끝 상태(떠오른 자리)로
  // 확정하는데 STANDARDS는 위치 변화를 없애라고 한다. 대신 이미 떠 있던 것은 원위치로.
  const float = () => {
    const el = rootRef.current;
    if (!el || reduced) return;
    const up = hoveredRef.current || focusVisibleRef.current;
    el.__avatarFloat = gsap.to(
      el,
      up
        ? {
            yPercent: -15,
            duration: gsapDuration.slower,
            ease: gsapEasing.spring,
            overwrite: 'auto',
          }
        : {
            yPercent: 0,
            duration: gsapDuration.base,
            ease: gsapEasing.settle,
            overwrite: 'auto',
          }
    );
  };

  const press = () => {
    const el = rootRef.current;
    if (!el || reduced || pressedAtRef.current !== null) return;
    pressedAtRef.current = performance.now();
    el.__avatarPress = gsap.to(el, {
      scale: 1.1,
      duration: gsapDuration.slow,
      ease: gsapEasing.spring,
      overwrite: 'auto',
    });
  };

  const release = () => {
    const el = rootRef.current;
    if (!el || pressedAtRef.current === null) return;
    const heldMs = performance.now() - pressedAtRef.current;
    pressedAtRef.current = null;
    if (reduced) return;
    el.__avatarPress = gsap.to(el, {
      scale: 1,
      duration: gsapDuration.base,
      ease: gsapEasing.settle,
      delay: Math.max(0, (MIN_PRESS_MS - heldMs) / 1000),
      overwrite: 'auto',
    });
  };

  const bouncyHandlers = live
    ? {
        onPointerEnter: (event: PointerEvent<HTMLElement>) => {
          if (event.pointerType === 'touch') return;
          hoveredRef.current = true;
          float();
        },
        onPointerLeave: () => {
          hoveredRef.current = false;
          float();
          release();
        },
        onPointerDown: (event: PointerEvent<HTMLElement>) => {
          if (event.button === 0) press();
        },
        onPointerUp: release,
        onPointerCancel: release,
        // 마우스 클릭으로 생긴 포커스에는 떠오르지 않는다. 클릭 뒤 내려오지 않는다.
        onFocus: (event: FocusEvent<HTMLElement>) => {
          focusVisibleRef.current =
            event.currentTarget.matches(':focus-visible');
          float();
        },
        onBlur: () => {
          focusVisibleRef.current = false;
          float();
          release();
        },
        onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
          if (!event.repeat && (event.key === 'Enter' || event.key === ' ')) {
            press();
          }
        },
        onKeyUp: (event: KeyboardEvent<HTMLElement>) => {
          if (event.key === 'Enter' || event.key === ' ') release();
        },
      }
    : {};

  // 언마운트·bouncy 해제·축소 모드 진입 때 트윈을 죽이고, 떠 있던 자리는 원위치로.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const end = () => {
      el.__avatarFloat?.kill();
      el.__avatarPress?.kill();
    };
    if ((!live || reduced) && (el.__avatarFloat || el.__avatarPress)) {
      end();
      settleMotion(gsap.set(el, { yPercent: 0, scale: 1 }));
    }
    return end;
  }, [live, reduced]);

  // 상호작용 루트(button/a)면 aria-* 는 포커스를 받는 루트로 보낸다(Popover가
  // 넘기는 aria-expanded 등). <img>에 붙으면 스크린 리더가 읽지 못한다.
  const rootAria: Record<string, unknown> = {};
  const imgProps: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    (isClickable && key.startsWith('aria-') ? rootAria : imgProps)[key] = value;
  }

  return (
    <RootTag
      className={clsx(
        avatar,
        sizeStyles[size],
        variantStyles[variant],
        isClickable && clickable,
        live && bouncyStyle,
        className
      )}
      ref={setRoot}
      {...rootProps}
      {...rootAria}
      {...bouncyHandlers}
    >
      <span className={avatarClip}>
        {showImage ? (
          <img
            src={src}
            alt={alt}
            className={image}
            onError={handleImageError}
            {...imgProps}
          />
        ) : (
          <div role="img" aria-label={alt} className={fallbackText}>
            {children || getInitials(alt)}
          </div>
        )}
      </span>

      {status && (
        <span
          className={clsx(statusBadge, statusBadgeClass)}
          aria-hidden="true"
        />
      )}
    </RootTag>
  );
};

Avatar.displayName = 'Avatar';

/** 여러 Avatar를 겹쳐서 그룹으로 표시하는 컴포넌트 */
export interface AvatarGroupProps extends HTMLAttributes<HTMLDivElement> {
  /** Avatar 컴포넌트들 */
  children: ReactNode;
  /** 최대 표시 개수. 초과분은 "+N" 으로 표시 */
  max?: number;
  /** 그룹 내 아바타 크기 (개별 Avatar의 size를 오버라이드) @default 'md' */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** 아바타 간 겹침 간격 @default 'md' */
  spacing?: 'sm' | 'md' | 'lg';
  /** 추가 CSS 클래스 */
  className?: string;
}

export const AvatarGroup = ({
  children,
  max,
  size,
  spacing = 'md',
  className,
  ...props
}: AvatarGroupProps) => {
  const { displayedChildren, excessCount } = useMemo(() => {
    const childrenArray = Children.toArray(children);
    const totalCount = childrenArray.length;
    const displayCount = max ? Math.min(max, totalCount) : totalCount;
    const excess = max && totalCount > max ? totalCount - max : 0;

    const displayed = childrenArray
      .slice(0, displayCount)
      .map((child, index) => {
        if (isValidElement(child)) {
          return cloneElement(child as ReactElement<AvatarProps>, {
            key: index,
            size: size || (child.props as AvatarProps).size,
            className: clsx(
              (child.props as AvatarProps).className,
              groupAvatar,
              spacingStyles[spacing]
            ),
          });
        }
        return child;
      });

    return { displayedChildren: displayed, excessCount: excess };
  }, [children, max, size, spacing]);

  return (
    <div className={clsx(avatarGroup, className)} {...props}>
      {displayedChildren}
      {excessCount > 0 && (
        <div
          role="img"
          aria-label={`${excessCount}명 더 보기`}
          className={clsx(
            avatar,
            sizeStyles[size || 'md'],
            variantStyles.circular,
            excessAvatar,
            groupAvatar,
            spacingStyles[spacing]
          )}
        >
          <span className={fallbackText}>+{excessCount}</span>
        </div>
      )}
    </div>
  );
};

AvatarGroup.displayName = 'AvatarGroup';
