import {
  useMemo,
  forwardRef,
  useId,
  useRef,
  type ReactNode,
  type HTMLAttributes,
  type RefObject,
} from 'react';
import clsx from 'clsx';
import { createPortal } from 'react-dom';
import {
  backdrop,
  modalContainer,
  modalDialog,
  sizeStyles,
  modalHeader as modalHeaderStyle,
  modalHeaderContent,
  modalTitle as modalTitleStyle,
  modalCloseButton,
  modalContent as modalContentStyle,
  modalFooter as modalFooterStyle,
  footerAlignStyles,
} from './Modal.css';
import { useFocusTrap } from '../../_internal/useFocusTrap';
import { createOverlayContext } from '../../_internal/createOverlayContext';
import { useOverlayTransition } from '../../_internal/useOverlayTransition';
import { gsapDuration, gsapEasing } from '../../tokens/gsapEasing';

/**
 * 트리거를 못 읽을 때의 시작 상태 — 화면 가운데에서 살짝 위·작게 자란다.
 * 이전 `slideIn` 키프레임의 0% 프레임과 같은 값이다(y -20px · scale 0.95).
 */
const CENTER_START = { opacity: 0, x: 0, y: -20, scale: 0.95 } as const;

/**
 * 트리거에서 자랄 때의 시작 배율.
 *
 * 버튼 폭 / 다이얼로그 폭 비율(보통 0.15~0.25)을 그대로 쓰면 본문 16px이 3px로
 * 찌그러져 첫 프레임이 글자 뭉개진 판이 된다. 가독성이 유일한 하드 제약이므로
 * 배율을 고정하고, "저 버튼에서 나왔다"는 신호는 **위치**(중심 이동)가 맡는다 —
 * 실제로 출처를 읽히게 하는 채널도 크기보다 위치다. 0.8이면 16px 본문이 최악의
 * 프레임에서도 12.8px로, 정지 화면으로 얼려 놓아도 읽힌다.
 */
const GROW_SCALE = 0.8;

/**
 * 등장 시작 상태. 트리거를 읽을 수 있으면 다이얼로그 중심을 트리거 중심으로
 * 당겨 두고(transform만 쓴다 — top/left/width/height는 건드리지 않아 레이아웃이
 * 다시 계산되지 않는다), 못 읽으면 조용히 `CENTER_START`로 물러난다.
 *
 * 못 읽는 경우: ref 미전달 · `.current`가 null · 문서에서 떼어진 요소 ·
 * 크기 0(숨겨졌거나 레이아웃 없는 환경). 어느 쪽도 예외를 던지지 않는다 —
 * 모달이 열리지 않는 것보다 가운데에서 자라는 게 낫다.
 */
const enterStart = (
  dialog: HTMLElement,
  trigger: HTMLElement | null | undefined
): { opacity: number; x: number; y: number; scale: number } => {
  if (!trigger?.isConnected) return CENTER_START;

  const from = trigger.getBoundingClientRect();
  const to = dialog.getBoundingClientRect();
  if (
    from.width === 0 ||
    from.height === 0 ||
    to.width === 0 ||
    to.height === 0
  ) {
    return CENTER_START;
  }

  // translate는 scale보다 먼저 적용되고(GSAP/CSS 합성 순서) 배율은 요소 중심을
  // 기준으로 돈다 — 두 중심의 차이를 그대로 넣으면 중심이 정확히 겹친다.
  return {
    opacity: 0,
    x: from.left + from.width / 2 - (to.left + to.width / 2),
    y: from.top + from.height / 2 - (to.top + to.height / 2),
    scale: GROW_SCALE,
  };
};

// Context로 onClose·titleId 전달 (Header의 닫기 버튼, Title의 id 연결에서 사용)
interface ModalContextValue {
  onClose: () => void;
  titleId: string;
}

const [ModalContext, useModalContext] =
  createOverlayContext<ModalContextValue>('Modal');

/** 모달 다이얼로그 컴포넌트. Compound 패턴(Modal.Header/Content/Footer) 또는 Flat 패턴(title/footer prop) 지원 */
export interface ModalProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'title'
> {
  /** 모달 표시 여부 */
  open: boolean;
  /** 모달 닫기 콜백 */
  onClose: () => void;
  /** 모달 콘텐츠 */
  children: ReactNode;
  /** 모달 너비 @default 'md' */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** 배경 클릭으로 닫기 허용 @default true */
  closeOnBackdropClick?: boolean;
  /**
   * 모달을 연 버튼. 주면 다이얼로그가 그 버튼 자리에서 자라 나온다 —
   * 어디서 열렸는지가 위치로 보인다. 읽을 수 없으면 조용히 가운데에서 자란다.
   */
  triggerRef?: RefObject<HTMLElement | null>;
  /** ESC 키로 닫기 허용 @default true */
  closeOnEscape?: boolean;
  /** 제목 요소 ID 참조 (접근성) */
  'aria-labelledby'?: string;
  /** 설명 요소 ID 참조 (접근성) */
  'aria-describedby'?: string;
  /** 스크린 리더용 레이블 */
  'aria-label'?: string;
  /** 추가 CSS 클래스 */
  className?: string;
  /** Flat: 모달 제목 — 자동으로 Header + Title 구조 생성 */
  title?: string;
  /** Flat: 닫기(X) 버튼 표시 (title과 함께 사용) @default false */
  showClose?: boolean;
  /** Flat: 모달 푸터 영역 */
  footer?: ReactNode;
  /** Flat: 푸터 버튼 정렬 @default 'right' */
  footerAlign?: 'left' | 'center' | 'right';
}

const ModalRoot = ({
  open,
  onClose,
  children,
  size = 'md',
  closeOnBackdropClick = true,
  closeOnEscape = true,
  triggerRef,
  'aria-labelledby': ariaLabelledby,
  'aria-describedby': ariaDescribedby,
  'aria-label': ariaLabel,
  className,
  title,
  showClose = false,
  footer,
  footerAlign = 'left',
  ...props
}: ModalProps) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  // 백드롭과 다이얼로그를 **한 타임라인**에 넣는다. 따로 두면 여는 도중 닫았을 때
  // 둘의 progress가 갈라져 배경만 남거나 판만 남는 프레임이 생긴다.
  const { shouldRender } = useOverlayTransition({
    open,
    buildTimeline: (timeline) => {
      const backdropEl = backdropRef.current;
      const dialog = dialogRef.current;

      if (backdropEl) {
        timeline.fromTo(
          backdropEl,
          { opacity: 0 },
          {
            opacity: 1,
            duration: gsapDuration.base,
            ease: gsapEasing.settle,
          },
          0
        );
      }
      if (dialog) {
        timeline.fromTo(
          dialog,
          enterStart(dialog, triggerRef?.current),
          {
            opacity: 1,
            x: 0,
            y: 0,
            scale: 1,
            duration: gsapDuration.slow,
            ease: gsapEasing.settle,
          },
          0
        );
      }
    },
  });

  useFocusTrap({ open, onClose, closeOnEscape, containerRef: dialogRef });

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

  const isFlat = !!(title || footer);
  const flatTitleId = title ? titleId : undefined;
  // compound 경로(Modal.Title)는 title prop이 없어 flatTitleId가 undefined다.
  // titleId로 최종 폴백해 Modal.Title이 같은 id를 받아 접근 가능 이름을 갖게 한다.
  const labelledby = ariaLabelledby ?? flatTitleId ?? titleId;

  const content = isFlat ? (
    <>
      {title && (
        <header className={modalHeaderStyle}>
          <div className={modalHeaderContent}>
            <h2 id={flatTitleId} className={modalTitleStyle}>
              {title}
            </h2>
          </div>
          {showClose && (
            <button
              type="button"
              className={modalCloseButton}
              onClick={onClose}
              aria-label="닫기"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M15 5L5 15M5 5L15 15"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </header>
      )}
      <div className={modalContentStyle}>{children}</div>
      {footer && (
        <footer
          className={clsx(modalFooterStyle, footerAlignStyles[footerAlign])}
        >
          {footer}
        </footer>
      )}
    </>
  ) : (
    children
  );

  const modalContentElement = (
    <ModalContext.Provider value={contextValue}>
      <div className={modalContainer}>
        <div
          ref={backdropRef}
          role="presentation"
          className={backdrop}
          onClick={handleBackdropClick}
          data-backdrop="true"
          aria-hidden="true"
        />
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelledby}
          aria-describedby={ariaDescribedby}
          aria-label={ariaLabel}
          // 퇴장 중(open=false, shouldRender=true)엔 DOM이 잠깐 더 남아있어도
          // 포커스가 그 안으로 들어가거나 클릭될 수 없게 inert로 막는다.
          inert={!open}
          className={clsx(modalDialog, sizeStyles[size], className)}
          onClick={(e) => e.stopPropagation()}
          {...props}
        >
          {content}
        </div>
      </div>
    </ModalContext.Provider>
  );

  return createPortal(modalContentElement, document.body);
};

ModalRoot.displayName = 'Modal';

// ─── Compound 서브 컴포넌트 ──────────────────────────────────────────

// ModalHeader
/** Modal.Header — 모달 헤더 영역 */
export interface ModalHeaderProps extends HTMLAttributes<HTMLDivElement> {
  /** 헤더 콘텐츠 */
  children: ReactNode;
  /** 닫기(X) 버튼 표시 @default false */
  showClose?: boolean;
}

export const ModalHeader = forwardRef<HTMLDivElement, ModalHeaderProps>(
  ({ children, showClose = false, className, ...props }, ref) => {
    const context = useModalContext();

    return (
      <header
        ref={ref}
        className={clsx(modalHeaderStyle, className)}
        {...props}
      >
        <div className={modalHeaderContent}>{children}</div>
        {showClose && (
          <button
            type="button"
            className={modalCloseButton}
            onClick={context?.onClose}
            aria-label="닫기"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M15 5L5 15M5 5L15 15"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </header>
    );
  }
);

ModalHeader.displayName = 'ModalHeader';

// ModalTitle
/**
 * Modal.Title — 모달 제목
 *
 * `id`는 컴포넌트가 소유한다 — 루트의 `aria-labelledby`가 이 id를 가리키므로
 * 소비자 `id`가 이기면 다이얼로그의 접근 가능 이름이 조용히 사라진다. 제목
 * 요소를 직접 참조해야 하면 루트에 `aria-labelledby`를 줘라.
 */
export interface ModalTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  /** 제목 텍스트 */
  children: ReactNode;
  /** 렌더링할 HTML 헤딩 태그 @default 'h2' */
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export const ModalTitle = forwardRef<HTMLHeadingElement, ModalTitleProps>(
  ({ children, as: Component = 'h2', className, ...props }, ref) => {
    const context = useModalContext();

    return (
      <Component
        ref={ref}
        className={clsx(modalTitleStyle, className)}
        {...props}
        id={context?.titleId}
      >
        {children}
      </Component>
    );
  }
);

ModalTitle.displayName = 'ModalTitle';

// ModalContent
/** Modal.Content — 모달 본문 영역 */
export interface ModalContentProps extends HTMLAttributes<HTMLDivElement> {
  /** 본문 콘텐츠 */
  children: ReactNode;
}

export const ModalContent = forwardRef<HTMLDivElement, ModalContentProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div ref={ref} className={clsx(modalContentStyle, className)} {...props}>
        {children}
      </div>
    );
  }
);

ModalContent.displayName = 'ModalContent';

// ModalFooter
/** Modal.Footer — 모달 푸터 영역 (보통 액션 버튼 배치) */
export interface ModalFooterProps extends HTMLAttributes<HTMLDivElement> {
  /** 푸터 콘텐츠 */
  children: ReactNode;
  /** 콘텐츠 정렬 @default 'left' */
  align?: 'left' | 'center' | 'right';
}

export const ModalFooter = forwardRef<HTMLDivElement, ModalFooterProps>(
  ({ children, align = 'left', className, ...props }, ref) => {
    return (
      <footer
        ref={ref}
        className={clsx(modalFooterStyle, footerAlignStyles[align], className)}
        {...props}
      >
        {children}
      </footer>
    );
  }
);

ModalFooter.displayName = 'ModalFooter';

// ─── Modal = ModalRoot + Compound 서브 컴포넌트 ────────────────────────

export const Modal = Object.assign(ModalRoot, {
  Header: ModalHeader,
  Title: ModalTitle,
  Content: ModalContent,
  Footer: ModalFooter,
});
