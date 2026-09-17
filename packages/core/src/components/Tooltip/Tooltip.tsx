import {
  useState,
  useRef,
  useEffect,
  useId,
  type ReactNode,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import {
  tooltipContainer,
  tooltip,
  positionStyles,
  arrow,
  arrowPositionStyles,
} from './Tooltip.css';
import { addDocumentListener } from '../../_internal/dom';

// 마우스가 트리거 → 툴팁 사이 8px 간격(positionStyles)을 건너가는 동안
// 닫히지 않도록 두는 유예 시간(ms). delay(오픈 지연, 기본 200)는 "열기까지
// 기다리는 시간"이라 성격이 달라 별도 상수로 둔다.
const HIDE_GRACE_MS = 300;

/** 호버/포커스 시 추가 정보를 표시하는 툴팁 컴포넌트. 제어/비제어 모드 지원 */
export interface TooltipProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'content'
> {
  /** 트리거 요소 (호버/포커스 시 툴팁 표시) */
  children: ReactNode;
  /** 툴팁에 표시할 내용 */
  content: ReactNode;

  // 제어 모드
  /** 제어 모드: 툴팁 표시 여부 */
  open?: boolean;
  /** 제어 모드: 툴팁 표시 상태 변경 핸들러 */
  onOpenChange?: (open: boolean) => void;

  // 공통 props
  /** 툴팁 위치 @default 'top' */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** 표시 지연 시간(ms) @default 200 */
  delay?: number;
  /** 비활성화 상태 @default false */
  disabled?: boolean;
  /** 화살표 표시 @default true */
  arrow?: boolean;
  className?: string;
}

export const Tooltip = ({
  children,
  content,
  open: controlledOpen,
  onOpenChange,
  position = 'top',
  delay = 200,
  disabled = false,
  arrow: showArrow = true,
  className,
  ...props
}: TooltipProps) => {
  // 비제어 모드용 내부 상태
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const showTimerRef = useRef<NodeJS.Timeout | null>(null);
  // 트리거→툴팁 이동 유예(닫기 지연)용 타이머. showTimerRef(오픈 지연)와
  // 별도 ref로 둔다 — 같은 ref를 공유하면 열기 타이머와 닫기 타이머가 서로를 지운다.
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Escape로 닫힌 뒤, 포인터/포커스가 실제로 벗어나기 전까지는 재개방을 막는다.
  const escapeClosedRef = useRef(false);
  const tooltipId = useId();

  // 제어/비제어 판단
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;

  useEffect(() => {
    return () => {
      if (showTimerRef.current) {
        clearTimeout(showTimerRef.current);
      }
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  const setOpen = (newOpen: boolean) => {
    // 비제어 모드: 내부 상태 업데이트
    if (!isControlled) {
      setUncontrolledOpen(newOpen);
    }

    // onOpenChange 호출 (있는 경우)
    onOpenChange?.(newOpen);
  };

  // setOpen은 매 렌더마다 새로 생성되므로(:89-97, 변경하지 않음) effect의
  // 의존성 배열에 넣는 대신 ref로 최신 클로저를 참조한다.
  const escapeCloseRef = useRef<() => void>(() => {});
  useEffect(() => {
    escapeCloseRef.current = () => {
      if (showTimerRef.current) {
        clearTimeout(showTimerRef.current);
        showTimerRef.current = null;
      }
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
      escapeClosedRef.current = true;
      setOpen(false);
    };
  });

  // Escape로 닫힌 동안 열려 있었으면, 열려 있는 동안만 document에 Escape
  // 리스너를 건다 — 호버만 된 상태(포커스 없음)에서는 Escape가 document로 간다.
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        escapeCloseRef.current();
      }
    };

    return addDocumentListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleShow = () => {
    if (disabled || escapeClosedRef.current) return;

    // 유예 중(트리거→툴팁 이동 중)에 다시 들어오면 닫기를 취소한다
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    if (isOpen) return;

    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current);
    }

    if (delay === 0) {
      setOpen(true);
    } else {
      showTimerRef.current = setTimeout(() => {
        setOpen(true);
      }, delay);
    }
  };

  // Hoverable: 포인터가 트리거를 벗어나도 곧바로 닫지 않고 유예를 준다
  const handleMouseLeave = () => {
    escapeClosedRef.current = false;

    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }

    hideTimerRef.current = setTimeout(() => {
      hideTimerRef.current = null;
      setOpen(false);
    }, HIDE_GRACE_MS);
  };

  const handleBlur = () => {
    escapeClosedRef.current = false;

    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    setOpen(false);
  };

  return (
    <div
      className={clsx(tooltipContainer, className)}
      onMouseEnter={handleShow}
      onMouseLeave={handleMouseLeave}
      onFocus={handleShow}
      onBlur={handleBlur}
      aria-describedby={isOpen ? tooltipId : undefined}
      {...props}
    >
      {children}
      {isOpen && (
        <div
          id={tooltipId}
          role="tooltip"
          className={clsx(tooltip, positionStyles[position])}
        >
          {content}
          {showArrow && (
            <div className={clsx(arrow, arrowPositionStyles[position])} />
          )}
        </div>
      )}
    </div>
  );
};

Tooltip.displayName = 'Tooltip';
