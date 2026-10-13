import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import clsx from 'clsx';
import { gsap } from 'gsap';
import { gateMotion, settleMotion } from '../../hooks/gateMotion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { addDocumentListener } from '../../_internal/dom';
import { gsapDuration, gsapEasing } from '../../tokens/gsapEasing';
import { HeaderBarNav } from './HeaderBarNav';
import {
  PANEL_OFFSET_Y,
  headerBar,
  stickyStyles,
  bar,
  variantStyles,
  leftSection,
  logo as logoStyle,
  title as titleStyle,
  centerSection,
  rightSection,
  textNav,
  textItem as textItemStyle,
  textLabel,
  hamburger,
  hamburgerLine,
  hamburgerLineTop,
  hamburgerLineBottom,
  panel as panelStyle,
  panelVariantStyles,
  panelItem,
} from './HeaderBar.css';

/** 헤더바 항목 하나. */
export interface HeaderBarItem {
  /** 보이는 글자이자 접근 이름. React key로도 쓴다 */
  label: string;
  /** 주면 <a>, 없으면 <button> */
  href?: string;
  onClick?: () => void;
  /** navStyle="icon"에서 알약 안에 들어간다(그때 필수) */
  icon?: ReactNode;
  /** 지금 보고 있는 페이지. aria-current="page" */
  active?: boolean;
}

/** `navStyle="icon"`의 항목. `icon`이 필수다. */
export type HeaderBarIconItem = HeaderBarItem & { icon: ReactNode };

/** 페이지 상단에 떠 있는 둥근 헤더바. 로고, 제목, 항목, 액션 영역 포함 */
interface HeaderBarBaseProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'title' | 'children'
> {
  /** 왼쪽 로고 영역 */
  logo?: ReactNode;
  /** 로고 옆 제목 */
  title?: ReactNode;
  /** 오른쪽 액션 영역 (버튼, 아이콘 등) */
  actions?: ReactNode;
  /** 스크롤 시 화면 위에 붙어 따라온다(위 여백 유지) @default false */
  sticky?: boolean;
  /** 바 배경 스타일. transparent는 면과 그림자가 없다 @default 'default' */
  variant?: 'default' | 'dark' | 'transparent';
  /** 스크린 리더용 레이블 */
  'aria-label'?: string;
  /** 추가 CSS 클래스 */
  className?: string;
}

export type HeaderBarProps = HeaderBarBaseProps &
  (
    | {
        /** 항목이 보이는 모습. text는 글자 링크, icon은 아이콘 알약 @default 'text' */
        navStyle?: 'text';
        /** 가운데 항목. 768px 미만에서는 햄버거 뒤 세로 목록으로 들어간다 */
        items?: HeaderBarItem[];
      }
    | {
        navStyle: 'icon';
        /** 모든 항목에 icon이 필요하다 */
        items?: HeaderBarIconItem[];
      }
  );

/**
 * 테스트가 열림·닫힘 트윈을 집는 통로. 공개 prop/state로 안 나가고 패널 DOM 노드에
 * 얹는다(타입 전용 확장이라 값으로 export되지 않는다. HeaderBarNav의
 * NavScaleSetterHost와 같은 모양).
 */
interface PanelTweenHost extends HTMLElement {
  __panelTween?: gsap.core.Tween;
}

export const HeaderBar = ({
  logo,
  title,
  actions,
  sticky = false,
  variant = 'default',
  items,
  navStyle,
  'aria-label': ariaLabel,
  className,
  ...props
}: HeaderBarProps) => {
  const reduced = useReducedMotion();
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const hamburgerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<PanelTweenHost | null>(null);
  // 마지막으로 트윈을 건 열림 상태. 처음 마운트(닫힘)와 축소 선호만 바뀐 렌더에서
  // 같은 방향 트윈을 또 걸지 않게 한다.
  const shownRef = useRef(false);

  // 열림: opacity 0 -> 1, y 8 -> 0, base settle. 닫힘: 반대로 fast settle.
  // autoAlpha가 opacity와 visibility를 함께 쓴다(닫힌 목록이 탭 순서에서 빠진다).
  // overwrite: 'auto'라 도중에 뒤집으면 지금 자리에서 이어진다.
  useLayoutEffect(() => {
    const panelEl = panelRef.current;
    if (!panelEl) return;
    if (shownRef.current === open) {
      // 열림 상태는 그대로인데 축소 선호가 켜졌다. 돌던 트윈을 끝 상태로 확정한다.
      if (reduced && panelEl.__panelTween) settleMotion(panelEl.__panelTween);
      return;
    }
    shownRef.current = open;
    panelEl.__panelTween = gateMotion(reduced, () =>
      gsap.to(
        panelEl,
        open
          ? {
              autoAlpha: 1,
              y: 0,
              duration: gsapDuration.base,
              ease: gsapEasing.settle,
              overwrite: 'auto',
            }
          : {
              autoAlpha: 0,
              y: PANEL_OFFSET_Y,
              duration: gsapDuration.fast,
              ease: gsapEasing.settle,
              overwrite: 'auto',
            }
      )
    );
  }, [open, reduced]);

  useEffect(() => {
    const panelEl = panelRef.current;
    return () => {
      panelEl?.__panelTween?.kill();
    };
  }, []);

  // 열려 있는 동안 Esc와 판 밖 누름으로 닫는다. 햄버거 자체의 누름은 제외한다.
  // 햄버거의 mousedown이 먼저 닫아 버리면 이어지는 click이 다시 열기 때문이다.
  useEffect(() => {
    if (!open) return;
    const offKey = addDocumentListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      hamburgerRef.current?.focus();
    });
    const offMouse = addDocumentListener('mousedown', (event) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (panelRef.current?.contains(target)) return;
      if (hamburgerRef.current?.contains(target)) return;
      setOpen(false);
    });
    return () => {
      offKey();
      offMouse();
    };
  }, [open]);

  const renderTextItem = (item: HeaderBarItem, inPanel: boolean) => {
    const shared = {
      className: clsx(textItemStyle, inPanel && panelItem),
      'aria-current': item.active ? ('page' as const) : undefined,
      onClick: () => {
        item.onClick?.();
        if (!inPanel) return;
        setOpen(false);
        // 포커스가 숨는 판 안에서 떠나므로 햄버거로 돌려 둔다.
        hamburgerRef.current?.focus();
      },
    };
    const label = <span className={textLabel}>{item.label}</span>;
    return item.href ? (
      <a key={item.label} href={item.href} {...shared}>
        {label}
      </a>
    ) : (
      <button key={item.label} type="button" {...shared}>
        {label}
      </button>
    );
  };

  // 판별 유니온은 구조 분해 뒤에도 navStyle로 좁혀진다. icon이면 items가 아이콘 항목이다.
  const iconItems = navStyle === 'icon' ? items : undefined;
  const itemList: HeaderBarItem[] = items ?? [];
  const hasItems = itemList.length > 0;

  return (
    <header
      role="banner"
      aria-label={ariaLabel}
      className={clsx(
        headerBar,
        stickyStyles[sticky.toString() as 'true' | 'false'],
        className
      )}
      {...props}
    >
      <div className={clsx(bar, variantStyles[variant])}>
        {(logo || title) && (
          <div className={leftSection}>
            {logo && <div className={logoStyle}>{logo}</div>}
            {title && <h1 className={titleStyle}>{title}</h1>}
          </div>
        )}

        {hasItems && (
          <div className={centerSection}>
            {iconItems ? (
              <HeaderBarNav items={iconItems} />
            ) : (
              <nav aria-label="주요 메뉴" className={textNav}>
                {itemList.map((item) => renderTextItem(item, false))}
              </nav>
            )}
          </div>
        )}

        <div className={rightSection}>
          {actions}
          {hasItems && (
            <button
              ref={hamburgerRef}
              type="button"
              className={hamburger}
              aria-expanded={open}
              aria-controls={panelId}
              aria-label={open ? '메뉴 닫기' : '메뉴 열기'}
              onClick={() => setOpen((prev) => !prev)}
            >
              <span className={clsx(hamburgerLine, hamburgerLineTop)} />
              <span className={clsx(hamburgerLine, hamburgerLineBottom)} />
            </button>
          )}
        </div>

        {hasItems && (
          <nav
            id={panelId}
            ref={panelRef}
            aria-label="메뉴 목록"
            className={clsx(panelStyle, panelVariantStyles[variant])}
          >
            {itemList.map((item) => renderTextItem(item, true))}
          </nav>
        )}
      </div>
    </header>
  );
};

HeaderBar.displayName = 'HeaderBar';
