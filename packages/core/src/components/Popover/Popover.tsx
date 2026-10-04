import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useId,
  cloneElement,
  type ReactElement,
  type ReactNode,
  type HTMLAttributes,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import clsx from 'clsx';
import {
  popoverContainer,
  popover,
  positionStyles,
  positionOpenStyles,
  arrow as arrowStyle,
  arrowPositionStyles,
} from './Popover.css';
import {
  addDocumentListener,
  getFirstFocusableElement,
} from '../../_internal/dom';
import { useBubblePresence } from '../../_internal/useBubblePresence';

// 퇴장 전이(calc(duration.slow * 0.65))와 맞춘 값이다. Popover.css.ts의
// closed 전이 길이(300ms * 0.65 = 195ms)를 바꾸면 이 상수도 같이 바꿔야
// CSS 전이가 끝나기 전에 DOM이 사라지거나 그 반대가 되지 않는다.
const EXIT_DURATION_MS = 195;

/** 트리거 요소 근처에 떠 있는 콘텐츠를 표시하는 팝오버 컴포넌트. 제어/비제어 모드 지원 */
export interface PopoverProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'content'
> {
  /**
   * 트리거 요소 (클릭 시 팝오버 표시). 받은 `onClick`과 `aria-*`를 자기 루트의
   * 상호작용 요소에 다는 단일 요소여야 한다 (`Button`, `IconButton`, `Avatar`).
   * `onClick`과 `aria-haspopup`·`aria-expanded`·`aria-controls`가 이 요소에
   * 직접 붙는다. 링크(`<a>`, `Avatar href`)는 트리거가 아니다. 누르면 이동한다.
   */
  children: ReactElement<HTMLAttributes<HTMLElement>>;
  /** 팝오버에 표시할 콘텐츠 */
  content: ReactNode;
  /** 제어 모드: 팝오버 표시 여부 */
  open?: boolean;
  /** 제어 모드: 표시 상태 변경 핸들러 */
  onOpenChange?: (open: boolean) => void;
  /** 팝오버 위치 @default 'bottom' */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** 외부 클릭 시 닫기 @default true */
  closeOnOutsideClick?: boolean;
  /** ESC 키로 닫기 @default true */
  closeOnEscape?: boolean;
  /** 화살표 표시 @default false */
  arrow?: boolean;
  /** 팝오버 최대 너비 (CSS 단위) */
  maxWidth?: string;
  /** 비활성화 상태 @default false */
  disabled?: boolean;
  /** 추가 CSS 클래스 */
  className?: string;
}

export const Popover = ({
  children,
  content,
  open: controlledOpen,
  onOpenChange,
  position = 'bottom',
  closeOnOutsideClick = true,
  closeOnEscape = true,
  arrow: showArrow = false,
  maxWidth,
  disabled = false,
  className,
  ...props
}: PopoverProps) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const popoverId = useId();

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;

  // isOpen이 꺼져도 DOM을 즉시 지우지 않고 퇴장 전이가 재생될 자리를 남겨 둔다.
  const { shouldRender, visible } = useBubblePresence(
    isOpen,
    EXIT_DURATION_MS,
    popoverRef
  );

  const setOpen = useCallback(
    (newOpen: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(newOpen);
      }
      onOpenChange?.(newOpen);
    },
    [isControlled, onOpenChange]
  );

  const handleTriggerClick = () => {
    if (disabled) return;
    setOpen(!isOpen);
  };

  // 바깥 클릭 감지
  useEffect(() => {
    if (!isOpen || !closeOnOutsideClick) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    return addDocumentListener('mousedown', handleOutsideClick);
  }, [isOpen, closeOnOutsideClick, setOpen]);

  // ESC 키 감지
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        // 트리거로 포커스 복귀
        const trigger = triggerRef.current
          ? getFirstFocusableElement(triggerRef.current)
          : null;
        trigger?.focus();
      }
    };

    return addDocumentListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEscape, setOpen]);

  // 포커스 관리
  useEffect(() => {
    if (!isOpen) return;

    // 다음 프레임에서 포커스 (렌더링 후)
    requestAnimationFrame(() => {
      const popoverEl = popoverRef.current;
      if (!popoverEl) return;

      const focusable = getFirstFocusableElement(popoverEl);
      if (focusable) {
        focusable.focus();
      }
    });
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      className={clsx(popoverContainer, className)}
      {...props}
    >
      <div ref={triggerRef}>
        {cloneElement(children, {
          onClick: (event: ReactMouseEvent<HTMLElement>) => {
            children.props.onClick?.(event);
            handleTriggerClick();
          },
          'aria-haspopup': 'dialog',
          'aria-expanded': isOpen,
          'aria-controls': isOpen ? popoverId : undefined,
        })}
      </div>
      {shouldRender && (
        <div
          ref={popoverRef}
          id={popoverId}
          role="dialog"
          className={clsx(
            popover,
            visible ? positionOpenStyles[position] : positionStyles[position]
          )}
          style={maxWidth ? { maxWidth } : undefined}
        >
          {content}
          {showArrow && (
            <div
              data-popover-arrow
              className={clsx(arrowStyle, arrowPositionStyles[position])}
            />
          )}
        </div>
      )}
    </div>
  );
};

Popover.displayName = 'Popover';
