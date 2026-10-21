import { useEffect, useRef, type RefObject } from 'react';
import {
  addDocumentListener,
  getActiveHTMLElement,
  getFocusableElements,
  lockBodyScroll,
} from './dom';

export interface UseFocusTrapOptions {
  /** 트랩 활성화 여부 (오버레이가 열려있는지) */
  open: boolean;
  /** 닫기 콜백 */
  onClose: () => void;
  /** ESC 키로 닫기 허용 여부 */
  closeOnEscape: boolean;
  /** 포커스를 가둘 컨테이너 엘리먼트의 ref */
  containerRef: RefObject<HTMLElement | null>;
  /**
   * 닫힐 때 이전 포커스 요소로 자동 복원할지 여부.
   * 닫힘에 애니메이션이 있어 복원 시점을 직접 제어해야 하는 컴포넌트는
   * false로 두고, 반환된 previousActiveElementRef를 직접 사용한다.
   * @default true
   */
  restoreFocusOnClose?: boolean;
  /**
   * 열려 있는 동안 body 스크롤을 잠글지 여부.
   * 오버레이가 페이지 안의 상자(`container`)에 갇혀 그려질 때는 페이지를 잠글 이유가 없다.
   * @default true
   */
  lockScroll?: boolean;
}

export interface UseFocusTrapReturn {
  /** 트랩이 열리기 직전 포커스가 있던 엘리먼트 */
  previousActiveElementRef: RefObject<HTMLElement | null>;
}

/**
 * 오버레이(Modal/BottomSheet/SideSheet 등)의 포커스 트랩 + ESC 처리 +
 * 바디 스크롤 잠금을 담당하는 내부 훅.
 */
export const useFocusTrap = ({
  open,
  onClose,
  closeOnEscape,
  containerRef,
  restoreFocusOnClose = true,
  lockScroll = true,
}: UseFocusTrapOptions): UseFocusTrapReturn => {
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    previousActiveElementRef.current = getActiveHTMLElement();

    const container = containerRef.current;
    if (!container) return;

    const focusableElements = getFocusableElements(container);
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    if (firstFocusable) {
      firstFocusable.focus();
    } else {
      container.setAttribute('tabindex', '-1');
      container.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape) {
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        if (focusableElements.length === 0) {
          e.preventDefault();
          return;
        }

        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable?.focus();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable?.focus();
          }
        }
      }
    };

    const removeKeyDownListener = addDocumentListener('keydown', handleKeyDown);
    const restoreBodyScroll = lockScroll ? lockBodyScroll() : undefined;

    return () => {
      removeKeyDownListener();
      restoreBodyScroll?.();

      if (restoreFocusOnClose && previousActiveElementRef.current) {
        previousActiveElementRef.current.focus();
      }
    };
  }, [
    open,
    closeOnEscape,
    onClose,
    restoreFocusOnClose,
    lockScroll,
    containerRef,
  ]);

  return { previousActiveElementRef };
};
