import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react';
import clsx from 'clsx';
import { useFinePointer } from '../../_internal/useFinePointer';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { gsapDuration } from '../../tokens/gsapEasing';
import { themeContract } from '../../tokens/theme.css';
import { FAN_PUSH, FAN_RADIUS, fanOffset, nearestFanItem } from './fanGeometry';
import * as styles from './FanMenu.css';

export interface FanMenuItem {
  /** 원형 단추 안에 그릴 아이콘 */
  icon: ReactNode;
  /** 항목의 접근 가능한 이름이자 가리켰을 때 뜨는 이름표 */
  label: string;
  /** 고르면 한 번 불린 뒤 메뉴가 접힌다 */
  onSelect: () => void;
}

export interface FanMenuProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children' | 'type' | 'onSelect'
> {
  /** 허브 단추의 접근 가능한 이름. 열림과 무관하게 고정이고 열림은 aria-expanded가 전한다 */
  label: string;
  /** 부채꼴에 놓일 항목. 2~8개이고 8개를 넘으면 앞 8개만 그린다 */
  items: FanMenuItem[];
  /** 비활성화 상태 @default false */
  disabled?: boolean;
}

const MIN_ITEMS = 2;
const MAX_ITEMS = 8;
// 열 때 항목 사이 시차는 fast의 0.3배(45ms), 닫을 때는 0.2배(30ms). 토큰 사이 값이라 배수로 유도한다.
const FAST = themeContract.animation.duration.fast;
// 열고 닫는 전이가 다 끝나는 때: 항목 transform(slower)에 가장 늦은 시차(8개일 때 7 x 45ms)를 더한다
const SETTLE_MS =
  gsapDuration.slower * 1000 + (MAX_ITEMS - 1) * gsapDuration.fast * 0.3 * 1000;
// 번쩍임 길이는 slower의 0.75배(375ms). FanMenu.css.ts의 flash와 같은 식이다.
const PICK_MS = gsapDuration.slower * 0.75 * 1000;

/**
 * 부채꼴 메뉴. 가운데 + 단추를 누르면 아이콘이 위쪽 반원(반지름 104px)에 차례로 튀어나오고(×로 돈다), 점선 호 위로
 * 빛이 그어진다. 정밀 포인터(마우스)로 가리킨 쪽 아이콘이 커지며 이름표가 뜬다. 터치는 방향 추적 없이 누른 아이콘이
 * 선택된다. 열림은 내부 상태(비제어)이고, 펼침은 위 반원 하나다. 화면 가장자리 처리는 하지 않으므로 소비자가 호가
 * 들어갈 자리(위로 약 130px, 좌우 약 130px)를 잡는다. 움직임 줄이기에서는 차례와 안내선 없이 제자리에 바로 나타난다.
 */
export const FanMenu = forwardRef<HTMLButtonElement, FanMenuProps>(
  (
    {
      label,
      items,
      disabled = false,
      className,
      onClick,
      onKeyDown,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const reduced = useReducedMotion();
    const fine = useFinePointer();
    const menuId = useId();
    const shown = items.slice(0, MAX_ITEMS);
    const count = shown.length;

    const [open, setOpen] = useState(false);
    // 열고 닫는 중. 이 동안만 항목 시차가 걸린다
    const [settling, setSettling] = useState(false);
    // 로빙 tabindex가 가리키는 항목
    const [active, setActive] = useState(0);
    const [focused, setFocused] = useState(-1);
    // 허브에 포커스가 있는 동안은 항목이 Tab 순서에 없다(Tab은 접고 다음 요소로 간다). 항목은 방향키로만 들어간다
    const [hubFocused, setHubFocused] = useState(false);
    const [pointerHot, setPointerHot] = useState(-1);
    const [picked, setPicked] = useState(-1);
    const [tagIndex, setTagIndex] = useState(0);

    const hubRef = useRef<HTMLButtonElement | null>(null);
    const rootRef = useRef<HTMLSpanElement>(null);
    const tagRef = useRef<HTMLSpanElement>(null);
    const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const pickTimer = useRef<number>(undefined);
    const settleTimer = useRef<number>(undefined);
    // 키보드로 열었으면 열린 직후 첫 항목으로 포커스를 옮긴다
    const focusFirst = useRef(false);
    const keyedOpen = useRef(false);

    // 개발 경고는 개수가 범위를 벗어난 때 한 번만 낸다
    const outOfRange = items.length < MIN_ITEMS || items.length > MAX_ITEMS;
    useEffect(() => {
      if (process.env.NODE_ENV === 'development' && outOfRange) {
        console.warn(
          `FanMenu: items는 ${MIN_ITEMS}~${MAX_ITEMS}개여야 합니다. ` +
            `${MAX_ITEMS}개를 넘으면 앞 ${MAX_ITEMS}개만 그립니다.`
        );
      }
    }, [outOfRange]);

    useEffect(
      () => () => {
        window.clearTimeout(pickTimer.current);
        window.clearTimeout(settleTimer.current);
      },
      []
    );

    // 항목 수가 줄어도 로빙 위치는 범위 안에 있다
    const roving = Math.min(active, count - 1);
    const hot = open ? (pointerHot >= 0 ? pointerHot : focused) : -1;
    // 이름표는 사라지는 동안에도 마지막 글자를 쥔다(렌더 중 이전값 비교)
    if (hot >= 0 && hot !== tagIndex) setTagIndex(hot);

    const settle = useCallback(() => {
      setSettling(true);
      window.clearTimeout(settleTimer.current);
      settleTimer.current = window.setTimeout(
        () => setSettling(false),
        SETTLE_MS
      );
    }, []);

    // 열 때마다 로빙 위치를 첫 항목으로 되돌린다
    const openMenu = () => {
      setActive(0);
      settle();
      setOpen(true);
    };

    const closeMenu = useCallback(
      (toHub: boolean) => {
        window.clearTimeout(pickTimer.current);
        setPicked(-1);
        setPointerHot(-1);
        setFocused(-1);
        settle();
        setOpen(false);
        if (toHub) hubRef.current?.focus();
      },
      [settle]
    );

    useLayoutEffect(() => {
      if (open && focusFirst.current) {
        focusFirst.current = false;
        itemRefs.current[roving]?.focus();
      }
    }, [open, roving]);

    // 바깥을 누르면 접힌다. pointerdown이 아니라 mousedown인 것은 Popover와 같은 까닭이다: 데모 무대의 다른 대본이 합성 pointerdown만 쏴도 이 메뉴가 접히지 않는다(진짜 마우스와 터치 탭은 mousedown도 낸다).
    // 정밀 포인터에서는 가운데에서 포인터까지의 방향으로 가리킴을 따라간다.
    // 이벤트의 isTrusted는 거르지 않는다(데모 대본이 합성 이벤트를 쏜다).
    useEffect(() => {
      if (!open) return;
      const onDown = (event: Event) => {
        if (!rootRef.current?.contains(event.target as Node)) closeMenu(false);
      };
      // 이름표 위로 올라온 포인터는 가리킴을 바꾸지 않는다(1.4.13: 이름표로 포인터를 옮겨도 남는다)
      const onMove = (event: PointerEvent) => {
        const hub = hubRef.current;
        if (!hub || tagRef.current?.contains(event.target as Node)) return;
        const rect = hub.getBoundingClientRect();
        setPointerHot(
          nearestFanItem(
            event.clientX - (rect.left + rect.width / 2),
            rect.top + rect.height / 2 - event.clientY,
            count
          )
        );
      };
      document.addEventListener('mousedown', onDown);
      if (fine) document.addEventListener('pointermove', onMove);
      return () => {
        document.removeEventListener('mousedown', onDown);
        document.removeEventListener('pointermove', onMove);
      };
    }, [open, fine, count, closeMenu]);

    const select = (index: number) => {
      if (picked >= 0) return;
      shown[index].onSelect();
      if (reduced) {
        closeMenu(true);
        return;
      }
      setPicked(index);
      pickTimer.current = window.setTimeout(() => closeMenu(true), PICK_MS);
    };

    const onRootKeyDown = (event: KeyboardEvent<HTMLElement>) => {
      if (event.key === 'Escape' && open) {
        event.preventDefault();
        closeMenu(true);
      }
    };

    // Left/Right와 Up/Down 모두 호를 따라 간다(끝에서 감긴다). Home/End는 양 끝
    const onItemKeyDown = (event: KeyboardEvent, index: number) => {
      const target: Record<string, number> = {
        ArrowRight: index + 1,
        ArrowDown: index + 1,
        ArrowLeft: index - 1,
        ArrowUp: index - 1,
        Home: 0,
        End: count - 1,
      };
      if (event.key in target) {
        event.preventDefault();
        // 포커스가 가리킴을 이어받도록 포인터 가리킴을 거둔다
        setPointerHot(-1);
        itemRefs.current[(target[event.key] + count) % count]?.focus();
      }
    };

    const onHubKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
      onKeyDown?.(event);
      if (event.defaultPrevented) return;
      if (event.key === 'Enter' || event.key === ' ') keyedOpen.current = true;
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        if (open) {
          itemRefs.current[roving]?.focus();
        } else {
          focusFirst.current = true;
          openMenu();
        }
      }
    };

    const onHubClick = (event: MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      if (event.defaultPrevented) {
        keyedOpen.current = false;
        return;
      }
      if (open) {
        closeMenu(false);
      } else {
        focusFirst.current = keyedOpen.current;
        openMenu();
      }
      keyedOpen.current = false;
    };

    // Tab 등으로 포커스가 메뉴 밖으로 나가면 접는다(포커스는 옮기지 않는다)
    const onRootBlur = (event: FocusEvent<HTMLElement>) => {
      const to = event.relatedTarget;
      if (open && to instanceof Node && !event.currentTarget.contains(to))
        closeMenu(false);
    };

    const setHubRef = (node: HTMLButtonElement | null) => {
      hubRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    };

    const arcPath = `M${-FAN_RADIUS} 0 A${FAN_RADIUS} ${FAN_RADIUS} 0 0 1 ${FAN_RADIUS} 0`;

    return (
      <span
        ref={rootRef}
        className={clsx(styles.root, className)}
        data-open={open ? '' : undefined}
        data-settling={settling ? '' : undefined}
        // Esc와 포커스 이탈을 안쪽 단추들에서 올라오는 이벤트로 한곳에서 받는 위임 자리라 의미 없는 상자다
        role="presentation"
        onKeyDown={onRootKeyDown}
        onBlur={onRootBlur}
      >
        <svg
          aria-hidden="true"
          className={styles.arc}
          viewBox="-130 -130 260 260"
        >
          <path className={styles.guide} d={arcPath} />
          <path className={styles.glow} pathLength={100} d={arcPath} />
        </svg>
        <button
          {...props}
          ref={setHubRef}
          type="button"
          className={styles.hub}
          disabled={disabled}
          aria-label={label}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={menuId}
          onKeyDown={onHubKeyDown}
          onClick={onHubClick}
          onFocus={(event) => {
            setHubFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setHubFocused(false);
            onBlur?.(event);
          }}
        >
          <svg
            aria-hidden="true"
            className={styles.plus}
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
        <span
          id={menuId}
          role="menu"
          aria-label={label}
          className={styles.menu}
          inert={!open}
        >
          {shown.map((item, i) => {
            const rest = fanOffset(i, count, FAN_RADIUS);
            const pushed = fanOffset(i, count, FAN_RADIUS + FAN_PUSH);
            // 열릴 때는 차례로, 닫힐 때는 거꾸로
            const delay = open
              ? `calc(${FAST} * 0.3 * ${i})`
              : `calc(${FAST} * 0.2 * ${count - 1 - i})`;
            return (
              <button
                key={i}
                ref={(node) => {
                  itemRefs.current[i] = node;
                }}
                type="button"
                role="menuitem"
                aria-label={item.label}
                tabIndex={open && !hubFocused && i === roving ? 0 : -1}
                className={styles.item}
                data-hot={hot === i ? '' : undefined}
                style={
                  {
                    '--fan-x': `${rest.x}px`,
                    '--fan-y': `${rest.y}px`,
                    '--fan-hx': `${pushed.x}px`,
                    '--fan-hy': `${pushed.y}px`,
                    // 가리킨 항목의 커짐은 열고 닫는 중에도 시차 없이 바로 따라온다
                    '--fan-delay': hot === i ? '0ms' : delay,
                  } as CSSProperties
                }
                onFocus={() => {
                  setActive(i);
                  setFocused(i);
                }}
                onBlur={() => setFocused(-1)}
                onKeyDown={(event) => onItemKeyDown(event, i)}
                onClick={() => select(i)}
              >
                <span aria-hidden="true" className={styles.icon}>
                  {item.icon}
                </span>
                <span
                  aria-hidden="true"
                  className={styles.flash}
                  data-on={picked === i ? '' : undefined}
                />
              </button>
            );
          })}
        </span>
        <span
          ref={tagRef}
          aria-hidden="true"
          className={styles.tag}
          data-on={hot >= 0 ? '' : undefined}
        >
          {shown[tagIndex]?.label}
        </span>
      </span>
    );
  }
);

FanMenu.displayName = 'FanMenu';
