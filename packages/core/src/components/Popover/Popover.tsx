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
   * 트리거 요소 (클릭 시 팝오버 표시). 상호작용 가능한 단일 요소여야 한다
   * (`Button`, `IconButton`, `onClick`을 받는 `Avatar` 등). `onClick`과
   * `aria-haspopup`·`aria-expanded`·`aria-controls`가 이 요소에 직접 붙는다.
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

  // isOpen이 꺼져도 DOM을 즉시 지우지 않고 퇴장 전이가 재생될 자리를 195ms
  // 남겨 둔다(Modal.tsx의 shouldRender 패턴과 동일한 배선).
  const [shouldRender, setShouldRender] = useState(isOpen);
  // shouldRender와 별개로, 마운트 첫 프레임엔 닫힘 스타일을 칠하고 그 다음
  // 프레임(페인트 이후 useEffect)에서 열림 스타일로 넘어가야 전이가 실제로
  // 재생된다 — 처음부터 열림 클래스를 주면 "변화"가 없어 전이가 안 돈다.
  const [visible, setVisible] = useState(false);

  if (isOpen && !shouldRender) {
    setShouldRender(true);
  }

  useEffect(() => {
    if (isOpen || !shouldRender) return;

    const timer = setTimeout(() => {
      setShouldRender(false);
    }, EXIT_DURATION_MS);

    return () => clearTimeout(timer);
  }, [isOpen, shouldRender]);

  useEffect(() => {
    // 렌더 중에 바로 open 스타일을 칠하면 닫힘→열림의 "변화"가 없어 전이가
    // 재생되지 않는다(마운트 첫 프레임과 목표 프레임이 같은 값이 되어 버림).
    // 페인트 이후 한 틱 늦게 넘어가는 것이 목적이라 의도적으로 effect에서
    // setState한다(Snackbar.tsx의 liveMessage와 같은 이유).
    setVisible(isOpen);
  }, [isOpen]);

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
