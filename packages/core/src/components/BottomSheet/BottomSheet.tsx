import {
  useEffect,
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
  bottomSheetContainer,
  bottomSheet as bottomSheetStyle,
  bottomSheetEnter,
  bottomSheetExit,
  heightStyles,
  handle,
  header,
  title as titleStyle,
  closeButton,
  content,
} from './BottomSheet.css';
import { IconButton } from '../IconButton';
import { Icon } from '../Icon';
import { useFocusTrap } from '../../_internal/useFocusTrap';
import { createOverlayContext } from '../../_internal/createOverlayContext';

interface BottomSheetContextValue {
  onClose: () => void;
  titleId: string;
}

const [BottomSheetContext, useBottomSheetContext] =
  createOverlayContext<BottomSheetContextValue>('BottomSheet');

// 퇴장 전이(exit CSS transition, duration.base)와 맞춘다 — 등장(slow, 300ms)의
// 66.7%로, 모션 명세 조항 3의 "퇴장은 등장의 60~70%" 범위를 만족한다.
// `themeContract.animation.duration.base`와 같은 값이다 — 한쪽을 바꾸면 다른
// 쪽도 바꿔야 CSS 퇴장이 끝나기 전에 DOM이 사라지거나 그 반대가 된다.
const EXIT_DURATION_MS = 200;

/** 화면 하단에서 올라오는 시트 컴포넌트. Compound 패턴(BottomSheet.Header/Content) 또는 Flat 패턴(title prop) 지원 */
export interface BottomSheetProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'title'
> {
  /** 시트 표시 여부 */
  open: boolean;
  /** 시트 닫기 콜백 */
  onClose: () => void;
  /** Flat 모드: 시트 제목. 설정 시 자동으로 헤더 생성 */
  title?: ReactNode;
  /** 시트 콘텐츠 */
  children: ReactNode;
  /** 시트 높이 @default 'auto' */
  height?: 'auto' | 'sm' | 'md' | 'lg' | 'full';
  /** 배경 클릭으로 닫기 허용 @default true */
  closeOnBackdropClick?: boolean;
  /** ESC 키로 닫기 허용 @default true */
  closeOnEscape?: boolean;
  /** 상단 드래그 핸들 표시 @default true */
  showHandle?: boolean;
  /** 닫기(X) 버튼 표시 @default false */
  showClose?: boolean;
  /** 드래그로 닫기 허용 @default true */
  enableDrag?: boolean;
  /** 추가 CSS 클래스 */
  className?: string;
}

const BottomSheetRoot = ({
  open,
  onClose,
  title,
  children,
  height = 'auto',
  closeOnBackdropClick = true,
  closeOnEscape = true,
  showHandle = true,
  showClose = false,
  enableDrag = true,
  className,
  'aria-labelledby': ariaLabelledby,
  ...props
}: BottomSheetProps) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  const startYRef = useRef<number>(0);
  const isDraggingRef = useRef(false);
  const isClosingViaDragRef = useRef(false);
  const dragCloseFallbackRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const [shouldRender, setShouldRender] = useState(open);

  if (open && !shouldRender) {
    setShouldRender(true);
  }

  useEffect(() => {
    if (open) {
      isClosingViaDragRef.current = false;
    } else if (!open && sheetRef.current) {
      if (!isClosingViaDragRef.current) {
        sheetRef.current.style.transform = '';
        sheetRef.current.style.transition = '';
        sheetRef.current.style.animation = '';
      }
    }
  }, [open]);

  // 접근성(포커스 트랩 + ESC) 및 스크롤 제어 — 퇴장 전이가 끝난 뒤 포커스를
  // 복원해야 하므로 restoreFocusOnClose는 false로 두고, 아래 언마운트 타이머에서
  // previousActiveElementRef를 직접 사용해 복원한다(기존 타이밍 그대로 유지).
  const { previousActiveElementRef } = useFocusTrap({
    open,
    onClose,
    closeOnEscape,
    containerRef: sheetRef,
    restoreFocusOnClose: false,
  });

  // open이 꺼져도 DOM을 즉시 지우지 않고 퇴장 전이가 재생될 자리를 남겨 둔다.
  // 애니메이션 종료 이벤트가 아니라 타이머로 배선해, animationcancel로
  // animationend가 오지 않으면 시트가 영영 안 닫히던 경로를 없앤다.
  useEffect(() => {
    if (open || !shouldRender) return;

    const timer = setTimeout(() => {
      setShouldRender(false);
      previousActiveElementRef.current?.focus();
    }, EXIT_DURATION_MS);

    return () => clearTimeout(timer);
  }, [open, shouldRender, previousActiveElementRef]);

  //드래그 제어 로직
  useEffect(() => {
    if (!enableDrag || !open) return;

    const sheet = sheetRef.current;
    if (!sheet) return;

    const finishDrag = (diff: number) => {
      isDraggingRef.current = false;

      if (diff > 100) {
        isClosingViaDragRef.current = true;

        // 드래그로 닫기 성공
        sheet.style.transition = 'transform 0.2s ease-out';
        sheet.style.transform = 'translateY(100%)';

        let settled = false;
        const settle = () => {
          if (settled) return;
          settled = true;

          sheet.removeEventListener('transitionend', handleTransitionEnd);
          if (dragCloseFallbackRef.current) {
            clearTimeout(dragCloseFallbackRef.current);
            dragCloseFallbackRef.current = null;
          }

          setShouldRender(false);
          onClose();
        };

        const handleTransitionEnd = () => settle();
        sheet.addEventListener('transitionend', handleTransitionEnd);

        // transitionend 폴백: 드래그가 중단돼 transition이 시작되지 않으면
        // 시트가 영영 안 닫히는 것을 막는다. 위 transition(0.2s)보다 여유를 둬
        // 정상 케이스에선 transitionend가 먼저 오게 한다.
        dragCloseFallbackRef.current = setTimeout(settle, 300);
      } else {
        // 원위치로 복구
        sheet.style.transition = 'transform 0.2s ease-out';
        sheet.style.transform = 'translateY(0)';
        const handleTransitionEnd = () => {
          sheet.removeEventListener('transitionend', handleTransitionEnd);
          sheet.style.transition = '';
        };
        sheet.addEventListener('transitionend', handleTransitionEnd);
      }
    };
    const handleTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      const isInteractive = target.closest(
        'button, a, input, select, textarea'
      );
      if (isInteractive) return;
      startYRef.current = e.touches[0].clientY;
      isDraggingRef.current = true;
      sheet.style.transition = '';
      sheet.style.animation = 'none';
      sheet.style.transform = 'translateY(0)';
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current) return;
      const diff = e.touches[0].clientY - startYRef.current;
      if (diff > 0) {
        sheet.style.transform = `translateY(${diff}px)`;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isDraggingRef.current) return;
      const diff = e.changedTouches[0].clientY - startYRef.current;
      finishDrag(diff);
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      // handle 영역 또는 header 영역에서만 드래그 시작 (버튼 클릭과 구분)
      const target = e.target as HTMLElement;
      const isInteractive = target.closest(
        'button, a, input, select, textarea'
      );
      if (isInteractive) return;
      startYRef.current = e.clientY;
      isDraggingRef.current = true;
      sheet.style.transition = '';
      sheet.style.animation = 'none';
      sheet.style.transform = 'translateY(0)';
    };

    // mousemove/mouseup은 document에 등록 — 마우스가 시트 밖으로 나가도 감지
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const diff = e.clientY - startYRef.current;
      if (diff > 0) {
        sheet.style.transform = `translateY(${diff}px)`;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const diff = e.clientY - startYRef.current;
      finishDrag(diff);
    };

    sheet.addEventListener('touchstart', handleTouchStart, { passive: true });
    sheet.addEventListener('touchmove', handleTouchMove, { passive: true });
    sheet.addEventListener('touchend', handleTouchEnd, { passive: true });
    sheet.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      sheet.removeEventListener('touchstart', handleTouchStart);
      sheet.removeEventListener('touchmove', handleTouchMove);
      sheet.removeEventListener('touchend', handleTouchEnd);
      sheet.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      if (dragCloseFallbackRef.current) {
        clearTimeout(dragCloseFallbackRef.current);
        dragCloseFallbackRef.current = null;
      }
    };
  }, [enableDrag, open, onClose]);

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

  const flatTitleId = title ? titleId : undefined;
  // compound 경로(BottomSheet.Title)는 title prop이 없어 flatTitleId가 undefined다.
  // titleId로 최종 폴백해 BottomSheet.Title이 같은 id를 받아 접근 가능 이름을 갖게 한다.
  const labelledby = ariaLabelledby ?? flatTitleId ?? titleId;

  const sheetContent = (
    <BottomSheetContext.Provider value={contextValue}>
      <div className={bottomSheetContainer}>
        <div
          role="presentation"
          className={clsx(backdrop, !open ? backdropExit : backdropEnter)}
          onClick={handleBackdropClick}
          aria-hidden="true"
        />
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions -- dialog 내부 클릭이 backdrop으로 전파되는 것을 막기 위한 stopPropagation */}
        <div
          ref={sheetRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelledby}
          // 퇴장 중(open=false, shouldRender=true)엔 DOM이 200ms 더 남아있어도
          // 포커스가 그 안으로 들어가거나 클릭될 수 없게 inert로 막는다.
          inert={!open}
          className={clsx(
            bottomSheetStyle,
            heightStyles[height],
            !open ? bottomSheetExit : bottomSheetEnter,
            className
          )}
          onClick={(e) => e.stopPropagation()}
          {...props}
        >
          {showHandle && (
            <div className={handle} data-testid="bottomsheet-handle" />
          )}

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
    </BottomSheetContext.Provider>
  );

  return createPortal(sheetContent, document.body);
};

BottomSheetRoot.displayName = 'BottomSheet';

// Compound API 서브 컴포넌트들
/** BottomSheet 헤더 영역. Compound 패턴에서 사용 */
export interface BottomSheetHeaderProps extends HTMLAttributes<HTMLElement> {
  /** 헤더 콘텐츠 */
  children: ReactNode;
  /** 닫기(X) 버튼 표시 @default false */
  showClose?: boolean;
  /** 추가 CSS 클래스 */
  className?: string;
}

export const BottomSheetHeader = forwardRef<
  HTMLElement,
  BottomSheetHeaderProps
>(({ children, showClose = false, className, ...props }, ref) => {
  const context = useBottomSheetContext();

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
});

BottomSheetHeader.displayName = 'BottomSheetHeader';

/**
 * BottomSheet.Title — 시트 제목. Compound 패턴에서 사용
 *
 * `id`는 컴포넌트가 소유한다 — 루트의 `aria-labelledby`가 이 id를 가리키므로
 * 소비자 `id`가 이기면 다이얼로그의 접근 가능 이름이 조용히 사라진다. 제목
 * 요소를 직접 참조해야 하면 루트에 `aria-labelledby`를 줘라.
 */
export interface BottomSheetTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  /** 제목 텍스트 */
  children: ReactNode;
  /** 추가 CSS 클래스 */
  className?: string;
}

export const BottomSheetTitle = forwardRef<
  HTMLHeadingElement,
  BottomSheetTitleProps
>(({ children, className, ...props }, ref) => {
  const context = useBottomSheetContext();

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

BottomSheetTitle.displayName = 'BottomSheetTitle';

/** BottomSheet 본문 영역. Compound 패턴에서 사용 */
export interface BottomSheetContentProps extends HTMLAttributes<HTMLDivElement> {
  /** 본문 콘텐츠 */
  children: ReactNode;
  /** 추가 CSS 클래스 */
  className?: string;
}

export const BottomSheetContent = forwardRef<
  HTMLDivElement,
  BottomSheetContentProps
>(({ children, className, ...props }, ref) => {
  return (
    <div ref={ref} className={clsx(content, className)} {...props}>
      {children}
    </div>
  );
});

BottomSheetContent.displayName = 'BottomSheetContent';

// ─── BottomSheet = BottomSheetRoot + Compound 서브 컴포넌트 ────────────────────────

export const BottomSheet = Object.assign(BottomSheetRoot, {
  Header: BottomSheetHeader,
  Title: BottomSheetTitle,
  Content: BottomSheetContent,
});
