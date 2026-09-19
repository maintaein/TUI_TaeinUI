import {
  useMemo,
  useEffect,
  useState,
  forwardRef,
  useId,
  useRef,
  type ReactNode,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import { createPortal } from 'react-dom';
import {
  backdrop,
  modalContainer,
  modalDialog,
  modalDialogExit,
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

// 퇴장 전이(exit CSS transition, duration.base)와 맞춘다 — 등장(slow, 300ms)의
// 66.7%로, 모션 명세 조항 3의 "퇴장은 등장의 60~70%" 범위를 만족한다.
const EXIT_DURATION_MS = 200;

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
  const titleId = useId();

  // open이 꺼져도 DOM을 즉시 지우지 않고 한 틱 늦춰 언마운트한다 — 퇴장 전이가
  // 재생될 자리를 남겨 둔다. 애니메이션 종료 이벤트가 아니라 타이머로 배선해
  // 빠른 연속 개폐에서도 정확성이 이벤트 발생 여부에 기대지 않는다.
  const [shouldRender, setShouldRender] = useState(open);

  if (open && !shouldRender) {
    setShouldRender(true);
  }

  useEffect(() => {
    if (open || !shouldRender) return;

    const timer = setTimeout(() => {
      setShouldRender(false);
    }, EXIT_DURATION_MS);

    return () => clearTimeout(timer);
  }, [open, shouldRender]);

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
          // 퇴장 중(open=false, shouldRender=true)엔 DOM이 200ms 더 남아있어도
          // 포커스가 그 안으로 들어가거나 클릭될 수 없게 inert로 막는다.
          inert={!open}
          className={clsx(
            modalDialog,
            sizeStyles[size],
            !open && modalDialogExit,
            className
          )}
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
