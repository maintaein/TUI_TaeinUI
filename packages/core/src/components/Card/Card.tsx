import { forwardRef, type ReactNode, type HTMLAttributes } from 'react';
import clsx from 'clsx';
import { useClickable } from '../../_internal/useClickable';
import {
  cardRoot,
  variantStyles,
  clickable as clickableStyle,
  disabled as disabledStyle,
  cardImage,
  cardImageWrapper,
  cardImageOverlay,
  cardHeader,
  cardTitle,
  cardBody,
  cardFooter,
  paddingStyles,
} from './Card.css';

// ─── Card Root ───────────────────────────────────────────────────────

/** 콘텐츠를 그룹화하는 카드 컴포넌트. Compound 패턴(Card.Header/Body/Footer) 또는 Flat 패턴(title/footer prop) 지원 */
export interface CardProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'onClick'
> {
  /** 카드 콘텐츠 */
  children: ReactNode;
  /** 카드 시각적 스타일. interactive는 호버/클릭 효과 포함 @default 'elevated' */
  variant?: 'outlined' | 'elevated' | 'filled' | 'interactive';
  /** 클릭 핸들러. 설정 시 카드가 클릭 가능해짐 */
  onClick?: () => void;
  /** 비활성화 상태 */
  disabled?: boolean;
  /** 카드 상단 액센트 색상 (CSS 색상값) */
  accentColor?: string;
  /** Flat: 카드 제목 — 자동으로 header + title 구조 생성 */
  title?: string;
  /** Flat: 카드 헤더 영역 (title보다 우선) */
  header?: ReactNode;
  /** Flat: 카드 푸터 영역 */
  footer?: ReactNode;
  /** Flat: 이미지 URL */
  image?: string;
  /** Flat: 이미지 alt 텍스트 */
  imageAlt?: string;
  /** Flat: 본문 패딩 (Flat 모드에서만 적용) @default 'md' */
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const CardRoot = forwardRef<HTMLElement, CardProps>(
  (
    {
      children,
      variant = 'elevated',
      onClick,
      disabled: isDisabled = false,
      accentColor,
      title,
      header,
      footer,
      image,
      imageAlt = '',
      padding = 'md',
      className,
      style,
      ...props
    },
    ref
  ) => {
    const isClickable = !!onClick;
    const isFlat = !!(title || header || footer || image);

    const clickableProps = useClickable({
      onClick: onClick ? () => onClick() : undefined,
      disabled: isDisabled,
      role: 'button',
    });

    const rootClasses = clsx(
      cardRoot,
      variantStyles[variant],
      {
        [clickableStyle]: isClickable,
        [disabledStyle]: isDisabled,
      },
      className
    );

    const rootStyle = accentColor
      ? ({ ...style, '--accent-color': accentColor } as React.CSSProperties)
      : style;

    const content = isFlat ? (
      <>
        {image && (
          <div className={cardImageWrapper}>
            <img src={image} alt={imageAlt} className={cardImage} />
          </div>
        )}
        {header && <header className={cardHeader}>{header}</header>}
        {!header && title && (
          <header className={cardHeader}>
            <h3 className={cardTitle}>{title}</h3>
          </header>
        )}
        <div className={clsx(cardBody, paddingStyles[padding])}>{children}</div>
        {footer && <footer className={cardFooter}>{footer}</footer>}
      </>
    ) : (
      children
    );

    if (isClickable) {
      return (
        <button
          ref={ref as React.Ref<HTMLButtonElement>}
          type="button"
          className={rootClasses}
          style={rootStyle}
          onClick={clickableProps.onClick}
          onKeyDown={clickableProps.onKeyDown}
          disabled={isDisabled}
          aria-disabled={isDisabled}
          {...props}
        >
          {content}
        </button>
      );
    }

    return (
      <article
        ref={ref as React.Ref<HTMLElement>}
        className={rootClasses}
        style={rootStyle}
        {...props}
      >
        {content}
      </article>
    );
  }
);

CardRoot.displayName = 'Card';

// ─── Compound 서브 컴포넌트 ──────────────────────────────────────────

/** Card.Image — 카드 이미지 영역. 기본 비율은 16:9이며, `style={{ aspectRatio: '1' }}`로 덮어쓸 수 있다 */
export interface CardImageProps extends HTMLAttributes<HTMLDivElement> {
  /** 이미지 URL */
  src: string;
  /** 이미지 대체 텍스트 */
  alt?: string;
  /** 이미지 위에 오버레이할 콘텐츠 */
  children?: ReactNode;
}

export const CardImage = forwardRef<HTMLDivElement, CardImageProps>(
  ({ src, alt = '', children, className, ...props }, ref) => {
    return (
      <div ref={ref} className={clsx(cardImageWrapper, className)} {...props}>
        <img src={src} alt={alt} className={cardImage} />
        {children}
      </div>
    );
  }
);

CardImage.displayName = 'Card.Image';

/** Card.ImageOverlay — 이미지 위에 표시되는 오버레이 */
export interface CardImageOverlayProps extends HTMLAttributes<HTMLDivElement> {
  /** 오버레이 콘텐츠 */
  children: ReactNode;
}

export const CardImageOverlay = forwardRef<
  HTMLDivElement,
  CardImageOverlayProps
>(({ children, className, ...props }, ref) => {
  return (
    <div ref={ref} className={clsx(cardImageOverlay, className)} {...props}>
      {children}
    </div>
  );
});

CardImageOverlay.displayName = 'Card.ImageOverlay';

/** Card.Header — 카드 헤더 영역 */
export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  /** 헤더 콘텐츠 */
  children: ReactNode;
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <header ref={ref} className={clsx(cardHeader, className)} {...props}>
        {children}
      </header>
    );
  }
);

CardHeader.displayName = 'Card.Header';

/** Card.Title — 카드 제목 */
export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  /** 제목 텍스트 */
  children: ReactNode;
  /** 렌더링할 HTML 헤딩 태그 @default 'h3' */
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ children, as: Component = 'h3', className, ...props }, ref) => {
    return (
      <Component ref={ref} className={clsx(cardTitle, className)} {...props}>
        {children}
      </Component>
    );
  }
);

CardTitle.displayName = 'Card.Title';

/** Card.Body — 카드 본문 영역 */
export interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {
  /** 본문 콘텐츠 */
  children: ReactNode;
  /** 내부 여백 @default 'md' */
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const CardBody = forwardRef<HTMLDivElement, CardBodyProps>(
  ({ children, padding: bodyPadding = 'md', className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(cardBody, paddingStyles[bodyPadding], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardBody.displayName = 'Card.Body';

/** Card.Footer — 카드 푸터 영역 */
export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  /** 푸터 콘텐츠 */
  children: ReactNode;
}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <footer ref={ref} className={clsx(cardFooter, className)} {...props}>
        {children}
      </footer>
    );
  }
);

CardFooter.displayName = 'Card.Footer';

// ─── Card = CardRoot + Compound 서브 컴포넌트 ────────────────────────

export const Card = Object.assign(CardRoot, {
  Image: CardImage,
  ImageOverlay: CardImageOverlay,
  Header: CardHeader,
  Title: CardTitle,
  Body: CardBody,
  Footer: CardFooter,
});
