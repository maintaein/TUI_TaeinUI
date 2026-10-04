import {
  useState,
  useRef,
  useEffect,
  useId,
  cloneElement,
  type ReactElement,
  type ReactNode,
  type HTMLAttributes,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import clsx from 'clsx';
import {
  tooltipContainer,
  tooltip,
  positionStyles,
  positionOpenStyles,
  arrow,
  arrowPositionStyles,
} from './Tooltip.css';
import { addDocumentListener } from '../../_internal/dom';
import { useBubblePresence } from '../../_internal/useBubblePresence';
import {
  closeOtherTooltip,
  isTooltipWarm,
  markTooltipClosed,
  registerTooltip,
} from '../../_internal/tooltipWarmth';

// 마우스가 트리거 → 툴팁 사이 8px 간격(positionStyles)을 건너가는 동안
// 닫히지 않도록 두는 유예 시간(ms). delay(오픈 지연, 기본 200)는 "열기까지
// 기다리는 시간"이라 성격이 달라 별도 상수로 둔다. 닫힌 뒤 다음 툴팁이 지연
// 없이 뜨는 시간(WARM_MS)과는 값이 같아도 뜻이 달라 상수를 나눈다.
const HIDE_GRACE_MS = 300;

// 퇴장 전이(calc(duration.base * 0.65))와 맞춘 값이다. Tooltip.css.ts의
// closed 전이 길이(200ms * 0.65 = 130ms)를 바꾸면 이 상수도 같이 바꿔야
// CSS 전이가 끝나기 전에 DOM이 사라지거나 그 반대가 되지 않는다. Popover의
// EXIT_DURATION_MS(195)보다 짧다. Tooltip은 duration.base를 쓴다.
const EXIT_DURATION_MS = 130;

/** 호버/포커스 시 추가 정보를 표시하는 툴팁 컴포넌트. 제어/비제어 모드 지원 */
export interface TooltipProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'content'
> {
  /**
   * 트리거 요소 (호버/포커스 시 툴팁 표시). 단일 요소여야 한다.
   * `aria-describedby`가 이 요소에 직접 붙는다. 받은 `aria-*`와 `onClick`도
   * 이 요소로 넘어간다 (`<Popover><Tooltip>...</Tooltip></Popover>` 중첩용).
   */
  children: ReactElement<HTMLAttributes<HTMLElement>>;
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
  onClick,
  ...restProps
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
  const tooltipRef = useRef<HTMLDivElement>(null);
  // 따뜻한 상태에서 열릴 때만 true. 등장 전이 없이 열림 클래스로 처음부터 뜬다.
  const [instantEnter, setInstantEnter] = useState(false);

  // 제어/비제어 판단
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;

  // isOpen이 꺼져도 DOM을 즉시 지우지 않고 퇴장 전이가 재생될 자리를 130ms
  // 남겨 둔다. 유예(HIDE_GRACE_MS) 타이머는 isOpen 자체를 바꾸지 않으므로
  // 이 퇴장과 간섭하지 않는다. 유예 중엔 isOpen이 그대로라 전이도 돌지 않는다.
  const { shouldRender, visible, unmountNow } = useBubblePresence(
    isOpen,
    EXIT_DURATION_MS,
    tooltipRef,
    instantEnter
  );

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

  const setOpen = (newOpen: boolean, instant = false) => {
    setInstantEnter(newOpen && instant);

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

  // 다른 툴팁이 열리면 이 툴팁은 유예도 퇴장 전이도 없이 사라진다. 열려 있는
  // 툴팁과 새 툴팁이 동시에 보이는 순간이 없어야 한다. 제어 모드에서는
  // onOpenChange(false)로 요청만 하고 상태를 덮어쓰지 않는다. 부모가 따르지
  // 않으면 unmountNow를 렌더 중 보정이 되살린다.
  const forceCloseRef = useRef<() => void>(() => {});
  useEffect(() => {
    forceCloseRef.current = () => {
      if (showTimerRef.current) {
        clearTimeout(showTimerRef.current);
        showTimerRef.current = null;
      }
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
      if (isOpen) setOpen(false);
      unmountNow();
    };
  });
  const [self] = useState(() => ({ close: () => forceCloseRef.current() }));

  // DOM이 남아 있는 동안(퇴장 중 포함) 연달아 보는 상태에 참여한다. disabled는
  // 참여하지 않는다.
  useEffect(() => {
    if (!shouldRender || disabled) return;
    return registerTooltip(self);
  }, [shouldRender, disabled, self]);

  // 닫힌 시각만 남긴다. "방금 닫혔다"는 퇴장이 끝난 때가 아니라 닫힌 때 기준이다.
  useEffect(() => {
    if (!isOpen || disabled) return;
    return markTooltipClosed;
  }, [isOpen, disabled]);

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

  // 지연이 끝난 시점에도 다시 본다. 기다리는 사이 다른 툴팁이 열렸을 수 있다.
  const openNow = () => {
    const warm = isTooltipWarm();
    closeOtherTooltip(self);
    setOpen(true, warm);
  };

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

    // 다른 툴팁이 열려 있거나 방금 닫혔으면(따뜻함) 지연도 등장 전이도 건너뛴다.
    if (delay === 0 || isTooltipWarm()) {
      openNow();
    } else {
      showTimerRef.current = setTimeout(openNow, delay);
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

  // Popover 안에 들어가면 Popover가 이 컴포넌트에 onClick·aria-haspopup·
  // aria-expanded·aria-controls를 단다. 그것들은 포커스되는 요소에 붙어야 해서
  // 래퍼가 아니라 자식으로 보낸다. 나머지는 래퍼로 간다.
  const triggerAria: Record<string, unknown> = {};
  const wrapperProps: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(restProps)) {
    (key.startsWith('aria-') ? triggerAria : wrapperProps)[key] = value;
  }

  // 자식이 이미 가진 aria-describedby, 받은 것, 자기 것을 공백으로 합친다.
  const describedBy =
    [
      children.props['aria-describedby'],
      triggerAria['aria-describedby'],
      isOpen ? tooltipId : undefined,
    ]
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    // 호버·포커스 핸들러는 자식이 아니라 래퍼에 둔다. 래퍼는 툴팁 노드까지 DOM
    // 자손으로 감싸서, 포인터가 트리거 → 틈 → 툴팁으로 넘어갈 때 mouseenter가
    // 래퍼에 다시 걸려 닫기 유예(HIDE_GRACE_MS)를 취소한다. 툴팁 위에 포인터를
    // 둘 수 있어야 한다는 WCAG 1.4.13(호버 가능)이다. 핸들러를 자식으로 옮기면
    // 포인터가 툴팁에 올라가는 순간 닫힌다. Popover는 반대로 자식에 직접 단다.
    // onFocus·onBlur는 버블링되므로 래퍼에서도 자식의 포커스를 받는다.
    <div
      className={clsx(tooltipContainer, className)}
      onMouseEnter={handleShow}
      onMouseLeave={handleMouseLeave}
      onFocus={handleShow}
      onBlur={handleBlur}
      {...wrapperProps}
    >
      {cloneElement(children, {
        ...triggerAria,
        onClick: (event: ReactMouseEvent<HTMLElement>) => {
          children.props.onClick?.(event);
          onClick?.(event);
        },
        'aria-describedby': describedBy,
      })}
      {shouldRender && (
        <div
          ref={tooltipRef}
          id={tooltipId}
          role="tooltip"
          className={clsx(
            tooltip,
            visible ? positionOpenStyles[position] : positionStyles[position]
          )}
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
