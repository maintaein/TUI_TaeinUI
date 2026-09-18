import {
  useRef,
  useState,
  useMemo,
  useId,
  forwardRef,
  type ReactNode,
  type HTMLAttributes,
} from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import {
  backdrop,
  backdropEnter,
  backdropExit,
  sideSheetContainer,
  sideSheet as sideSheetStyle,
  positionStyles,
  sideSheetEnterRight,
  sideSheetExitRight,
  sideSheetEnterLeft,
  sideSheetExitLeft,
  widthStyles,
  header,
  title as titleStyle,
  closeButton,
  content,
} from './SideSheet.css';
import { IconButton } from '../IconButton';
import { Icon } from '../Icon';
import { useFocusTrap } from '../../_internal/useFocusTrap';
import { createOverlayContext } from '../../_internal/createOverlayContext';

interface SideSheetContextValue {
  onClose: () => void;
  titleId: string;
}

const [SideSheetContext, useSideSheetContext] =
  createOverlayContext<SideSheetContextValue>('SideSheet');

/** 화면 좌/우에서 슬라이드되는 시트 컴포넌트. Compound 패턴(SideSheet.Header/Content) 또는 Flat 패턴(title prop) 지원 */
export interface SideSheetProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'title'
> {
  /** 시트 표시 여부 */
  open: boolean;
  /** 시트 닫기 콜백 */
  onClose: () => void;
  /** Flat 모드: 시트 제목 */
  title?: ReactNode;
  /** 시트 콘텐츠 */
  children: ReactNode;
  /** 시트 너비 @default 'md' */
  width?: 'sm' | 'md' | 'lg' | 'full';
  /** 시트 출현 위치 @default 'right' */
  position?: 'left' | 'right';
  /** 배경 클릭으로 닫기 허용 @default true */
  closeOnBackdropClick?: boolean;
  /** ESC 키로 닫기 허용 @default true */
  closeOnEscape?: boolean;
  /** 닫기(X) 버튼 표시 @default true */
  showClose?: boolean;
  className?: string;
}

const SideSheetRoot = ({
  open,
  onClose,
  title,
  children,
  width = 'md',
  position = 'right',
  closeOnBackdropClick = true,
  closeOnEscape = true,
  showClose = false,
  className,
  'aria-labelledby': ariaLabelledby,
  ...props
}: SideSheetProps) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  const [shouldRender, setShouldRender] = useState(open);

  if (open && !shouldRender) {
    setShouldRender(true);
  }

  useFocusTrap({ open, onClose, closeOnEscape, containerRef: sheetRef });

  // 애니메이션 종료 처리
  const handleAnimationEnd = (e: React.AnimationEvent) => {
    if (e.target !== e.currentTarget) return;

    if (!open) {
      setShouldRender(false);
    }
  };

  const contextValue = useMemo(
    () => ({ onClose, titleId }),
    [onClose, titleId]
  );

  if (!shouldRender) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && closeOnBackdropClick) {
      onClose();
    }
  };

  const getAnimationClass = () => {
    if (position === 'left') {
      return !open ? sideSheetExitLeft : sideSheetEnterLeft;
    }
    return !open ? sideSheetExitRight : sideSheetEnterRight;
  };

  const flatTitleId = title ? titleId : undefined;
  // compound 경로(SideSheet.Title)는 title prop이 없어 flatTitleId가 undefined다.
  // titleId로 최종 폴백해 SideSheet.Title이 같은 id를 받아 접근 가능 이름을 갖게 한다.
  const labelledby = ariaLabelledby ?? flatTitleId ?? titleId;

  const sheetContent = (
    <SideSheetContext.Provider value={contextValue}>
      <div className={sideSheetContainer}>
        <div
          role="presentation"
          className={clsx(backdrop, !open ? backdropExit : backdropEnter)}
          onClick={handleBackdropClick}
          aria-hidden="true"
        />
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
        <div
          ref={sheetRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelledby}
          onAnimationEnd={handleAnimationEnd}
          className={clsx(
            sideSheetStyle,
            positionStyles[position],
            widthStyles[width],
            getAnimationClass(),
            className
          )}
          onClick={(e) => e.stopPropagation()}
          {...props}
        >
          {title ? (
            <>
              <div className={header}>
                <h2 id={flatTitleId} className={titleStyle}>
                  {title}
                </h2>
                {showClose && (
                  <IconButton
                    variant="dark"
                    buttonStyle="weak"
                    size="sm"
                    onClick={onClose}
                    aria-label="닫기"
                    className={closeButton}
                  >
                    <Icon name="close" size="sm" />
                  </IconButton>
                )}
              </div>
              <div className={content}>{children}</div>
            </>
          ) : (
            children
          )}
        </div>
      </div>
    </SideSheetContext.Provider>
  );

  return createPortal(sheetContent, document.body);
};

SideSheetRoot.displayName = 'SideSheet';

// Compound API 서브 컴포넌트들
/** SideSheet.Header — 시트 헤더 영역 */
export interface SideSheetHeaderProps extends HTMLAttributes<HTMLElement> {
  /** 헤더 콘텐츠 */
  children: ReactNode;
  /** 닫기(X) 버튼 표시 @default false */
  showClose?: boolean;
  /** 추가 CSS 클래스 */
  className?: string;
}

export const SideSheetHeader = forwardRef<HTMLElement, SideSheetHeaderProps>(
  ({ children, showClose = false, className, ...props }, ref) => {
    const context = useSideSheetContext();

    return (
      <header ref={ref} className={clsx(header, className)} {...props}>
        <div style={{ flex: 1 }}>{children}</div>
        {showClose && context && (
          <IconButton
            variant="dark"
            buttonStyle="weak"
            size="sm"
            onClick={context.onClose}
            aria-label="닫기"
            className={closeButton}
          >
            <Icon name="close" size="sm" />
          </IconButton>
        )}
      </header>
    );
  }
);

SideSheetHeader.displayName = 'SideSheetHeader';

/**
 * SideSheet.Title — 시트 제목
 *
 * `id`는 컴포넌트가 소유한다 — 루트의 `aria-labelledby`가 이 id를 가리키므로
 * 소비자 `id`가 이기면 다이얼로그의 접근 가능 이름이 조용히 사라진다. 제목
 * 요소를 직접 참조해야 하면 루트에 `aria-labelledby`를 줘라.
 */
export interface SideSheetTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  /** 제목 텍스트 */
  children: ReactNode;
  /** 추가 CSS 클래스 */
  className?: string;
}

export const SideSheetTitle = forwardRef<
  HTMLHeadingElement,
  SideSheetTitleProps
>(({ children, className, ...props }, ref) => {
  const context = useSideSheetContext();

  return (
    <h2
      ref={ref}
      className={clsx(titleStyle, className)}
      {...props}
      id={context?.titleId}
    >
      {children}
    </h2>
  );
});

SideSheetTitle.displayName = 'SideSheetTitle';

/** SideSheet.Content — 시트 본문 영역 */
export interface SideSheetContentProps extends HTMLAttributes<HTMLDivElement> {
  /** 본문 콘텐츠 */
  children: ReactNode;
  /** 추가 CSS 클래스 */
  className?: string;
}

export const SideSheetContent = forwardRef<
  HTMLDivElement,
  SideSheetContentProps
>(({ children, className, ...props }, ref) => {
  return (
    <div ref={ref} className={clsx(content, className)} {...props}>
      {children}
    </div>
  );
});

SideSheetContent.displayName = 'SideSheetContent';

// ─── SideSheet = SideSheetRoot + Compound 서브 컴포넌트 ────────────────────────

export const SideSheet = Object.assign(SideSheetRoot, {
  Header: SideSheetHeader,
  Title: SideSheetTitle,
  Content: SideSheetContent,
});
