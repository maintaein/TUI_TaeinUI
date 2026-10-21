import {
  useEffect,
  useRef,
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
  sideSheetContainer,
  sideSheet as sideSheetStyle,
  positionStyles,
  widthStyles,
  header,
  title as titleStyle,
  closeButton,
  content,
} from './SideSheet.css';
import { IconButton } from '../IconButton';
import { Glyph } from '../../_internal/glyph';
import { useFocusTrap } from '../../_internal/useFocusTrap';
import { createOverlayContext } from '../../_internal/createOverlayContext';
import { useOverlayTransition } from '../../_internal/useOverlayTransition';
import {
  addSheetOvershoot,
  addSheetStagger,
  setFloating,
  setFloatPaused,
} from '../../_internal/sheetFloat';
import { floatClass } from '../../_internal/sheetFloat.css';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { gsapDuration, gsapEasing } from '../../tokens/gsapEasing';

interface SideSheetContextValue {
  onClose: () => void;
  titleId: string;
}

const [SideSheetContext, useSideSheetContext] =
  createOverlayContext<SideSheetContextValue>('SideSheet');

/** 테스트 전용: 등장 타임라인과 내용 시차 타임라인을 시트 노드에 얹는다(BottomSheet와 같은 모양). */
type SideSheetTimelineHost = HTMLDivElement & {
  __sideSheetTimeline?: gsap.core.Timeline;
  __sideSheetStagger?: gsap.core.Timeline;
};

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
  /**
   * 오버레이를 그릴 DOM 위치. 안 주거나 `null`이면 `document.body`다.
   * 주면 그 안에 그려지고 body 스크롤도 잠그지 않는다(포커스 가두기·Esc는 그대로).
   * 화면이 그 안에 갇히려면 container가 `position: fixed`의 기준이어야 한다.
   * `contain: layout` 또는 `transform`을 주면 된다. 아니면 여전히 뷰포트 전체를 덮는다.
   */
  container?: HTMLElement | null;
  /** 닫기(X) 버튼 표시 @default false */
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
  container,
  showClose = false,
  className,
  'aria-labelledby': ariaLabelledby,
  ...props
}: SideSheetProps) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  /** 내용 시차. 등장 타임라인 **밖**의 별도 타임라인이다(이유는 `addSheetStagger`). */
  const staggerRef = useRef<gsap.core.Timeline | null>(null);
  const reduced = useReducedMotion();

  // 백드롭과 시트를 한 타임라인에 넣는다. 중단 지점에서 둘의 progress가
  // 갈라지지 않는다. `xPercent`는 시트 폭 기준이라 width variant가 바뀌어도
  // 화면 밖 위치가 따라온다(기존 `translateX(±100%)` 키프레임과 같은 양).
  // 넘침 16px도 같은 폭으로 환산된다. float 루프는 CSS `translate`라 따로 합성된다.
  const { shouldRender } = useOverlayTransition({
    open,
    buildTimeline: (timeline) => {
      const backdropEl = backdropRef.current;
      const sheet = sheetRef.current;

      if (backdropEl) {
        timeline.fromTo(
          backdropEl,
          { opacity: 0 },
          { opacity: 1, duration: gsapDuration.base, ease: gsapEasing.settle },
          0
        );
      }
      if (sheet) {
        (sheet as SideSheetTimelineHost).__sideSheetTimeline = timeline;
        addSheetOvershoot(
          timeline,
          sheet,
          'xPercent',
          position === 'left' ? -100 : 100
        );

        // 옆에서 와도 내용은 위로 뜬다. 헤더는 시트와 같이 들어오므로 대상이 아니다.
        const items = Array.from(
          sheet.querySelector(`.${content}`)?.children ?? []
        );
        // 다시 만들 때(축소 선호가 뒤집힐 때) 낡은 시차가 같은 대상을 놓고 다투지 않게 한다.
        staggerRef.current?.kill();
        staggerRef.current = addSheetStagger(timeline, items, reduced);
        if (staggerRef.current) {
          (sheet as SideSheetTimelineHost).__sideSheetStagger =
            staggerRef.current;
        }

        // 등장이 끝나면 둥실거리기 시작한다. 이후 시트가 사라질 때까지 붙어 있다.
        timeline.eventCallback('onComplete', () =>
          setFloating(sheetRef.current)
        );
      }
    },
  });

  // 닫는 중엔 둥실거림이 그 자리에 선다(떼지 않는다. 떼면 시트가 툭 떨어진다).
  // 내용 시차는 되감지 않고 끝 상태로 확정해 시트에 실려 나가게 한다.
  useEffect(() => {
    setFloatPaused(sheetRef.current, !open);
    if (!open) staggerRef.current?.progress(1);
  }, [open]);

  useEffect(
    () => () => {
      staggerRef.current?.kill();
    },
    []
  );

  useFocusTrap({
    open,
    onClose,
    closeOnEscape,
    containerRef: sheetRef,
    lockScroll: !container,
  });

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
  // compound 경로(SideSheet.Title)는 title prop이 없어 flatTitleId가 undefined다.
  // titleId로 최종 폴백해 SideSheet.Title이 같은 id를 받아 접근 가능 이름을 갖게 한다.
  const labelledby = ariaLabelledby ?? flatTitleId ?? titleId;

  const sheetContent = (
    <SideSheetContext.Provider value={contextValue}>
      <div className={sideSheetContainer}>
        <div
          ref={backdropRef}
          role="presentation"
          className={backdrop}
          onClick={handleBackdropClick}
          aria-hidden="true"
        />
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
        <div
          ref={sheetRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelledby}
          // 퇴장 중(open=false, shouldRender=true)엔 DOM이 잠깐 더 남아있어도
          // 포커스가 그 안으로 들어가거나 클릭될 수 없게 inert로 막는다.
          inert={!open}
          className={clsx(
            sideSheetStyle,
            floatClass[position],
            positionStyles[position],
            widthStyles[width],
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
                    <Glyph name="close" size="sm" />
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

  return createPortal(sheetContent, container ?? document.body);
};

SideSheetRoot.displayName = 'SideSheet';

// Compound API 서브 컴포넌트들
/** SideSheet.Header: 시트 헤더 영역 */
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
            <Glyph name="close" size="sm" />
          </IconButton>
        )}
      </header>
    );
  }
);

SideSheetHeader.displayName = 'SideSheetHeader';

/**
 * SideSheet.Title: 시트 제목
 *
 * `id`는 컴포넌트가 소유한다. 루트의 `aria-labelledby`가 이 id를 가리키므로
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

/** SideSheet.Content: 시트 본문 영역 */
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
