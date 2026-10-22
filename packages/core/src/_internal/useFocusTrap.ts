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

    const firstFocusable = getFocusableElements(container)[0];

    if (firstFocusable) {
      firstFocusable.focus();
    } else {
      container.setAttribute('tabindex', '-1');
      container.focus();
    }

    // 포커스를 안으로 옮기지 못했으면(상자가 inert 등) 닫을 때 되돌릴 포커스도 없다.
    // 되돌리면 그사이 다른 곳으로 옮겨 간 포커스를 빼앗고 브라우저가 그 요소로 스크롤한다.
    if (!container.contains(document.activeElement)) {
      previousActiveElementRef.current = null;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape) {
        onClose();
        return;
      }

      if (e.key !== 'Tab') return;

      // 내용은 열린 뒤에도 바뀐다. 누를 때마다 다시 계산한다.
      const focusableElements = getFocusableElements(container);
      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];

      if (!container.contains(document.activeElement)) {
        // 포커스가 밖이면 안으로 되돌린다. 못 되돌리면(inert 등) 페이지 Tab을
        // 삼키지 않고 브라우저에 맡긴다.
        (first ?? container).focus();
        if (container.contains(document.activeElement)) e.preventDefault();
        return;
      }

      if (!first) {
        e.preventDefault();
        return;
      }

      const active = document.activeElement;
      if (e.shiftKey) {
        if (active === first || active === container) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last) {
        e.preventDefault();
        first.focus();
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
