import {
  useState,
  useMemo,
  Children,
  cloneElement,
  isValidElement,
  type ImgHTMLAttributes,
  type ReactNode,
  type ReactElement,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import {
  avatar,
  sizeStyles,
  variantStyles,
  avatarClip,
  image,
  fallbackText,
  clickable,
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
  ...props
}: AvatarProps) => {
  const [imageError, setImageError] = useState(false);

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
        className
      )}
      {...rootProps}
      {...rootAria}
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
