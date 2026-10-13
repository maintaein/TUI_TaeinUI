import {
  useEffect,
  useId,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import clsx from 'clsx';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { addDocumentListener } from '../../_internal/dom';
import { HeaderBarNav } from './HeaderBarNav';
import { HeaderBarPillNav } from './HeaderBarPill';
import { HeaderBarDropdownItem } from './HeaderBarDropdown';
import { HeaderBarCards, type CardsSurfaceHost } from './HeaderBarCards';
import { usePanelTween, type PanelTweenHost } from './usePanelTween';
import {
  pillVariantStyles,
  panelGroup,
  panelGroupLabel,
  panelSubItem,
  headerBar,
  stickyStyles,
  bar,
  barCards,
  variantStyles,
  cardsVariantStyles,
  leftSection,
  logo as logoStyle,
  title as titleStyle,
  centerSection,
  rightSection,
  textNav,
  textItem as textItemStyle,
  textLabel,
  hamburger,
  hamburgerAlways,
  hamburgerLine,
  hamburgerLineTop,
  hamburgerLineBottom,
  panel as panelStyle,
  panelVariantStyles,
  panelItem,
} from './HeaderBar.css';

/** `navStyle="dropdown"`·`"cards"`의 하위 링크 하나. href가 있으면 <a>, 없으면 <button> */
export interface HeaderBarLink {
  label: string;
  href?: string;
  onClick?: () => void;
}

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
  /**
   * 하위 링크. `navStyle="dropdown"`(항목이 누르면 판이 열리는 버튼이 된다)과
   * `"cards"`(카드 안 링크 목록)에서 쓰이고 다른 형태에서는 무시된다.
   */
  links?: HeaderBarLink[];
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
        /**
         * 항목이 보이는 모습. text는 글자 링크, pill은 호버하면 원이 차오르며 글자가
         * 바뀌는 알약, dropdown은 `links`가 있는 항목을 누르면 아래에 작은 판이 열린다,
         * cards는 햄버거를 누르면 바가 아래로 자라며 항목마다 카드가 솟는다(항목은 바 안이
         * 아니라 카드에만 있고 햄버거가 모든 폭에서 보인다. 카드는 셋 이하를 권한다),
         * icon은 아이콘 알약 @default 'text'
         */
        navStyle?: 'text' | 'pill' | 'dropdown' | 'cards';
        /**
         * 가운데 항목. 768px 미만에서는 햄버거 뒤 세로 목록으로 들어간다(`cards`는 어느
         * 폭에서나 카드로 연다)
         */
        items?: HeaderBarItem[];
      }
    | {
        navStyle: 'icon';
        /** 모든 항목에 icon이 필요하다 */
        items?: HeaderBarIconItem[];
      }
  );

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
  // dropdown에서 열린 항목의 label. 한 번에 하나만 열린다.
  const [dropdownKey, setDropdownKey] = useState<string | null>(null);
  const hamburgerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<PanelTweenHost | null>(null);
  const surfaceRef = useRef<CardsSurfaceHost | null>(null);
  usePanelTween(panelRef, open, reduced);

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
      if (surfaceRef.current?.contains(target)) return;
      if (hamburgerRef.current?.contains(target)) return;
      setOpen(false);
    });
    return () => {
      offKey();
      offMouse();
    };
  }, [open]);

  const renderTextItem = (
    item: HeaderBarLink & { active?: boolean },
    inPanel: boolean,
    sub = false
  ) => {
    const shared = {
      className: clsx(textItemStyle, inPanel && panelItem, sub && panelSubItem),
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
  const isCards = navStyle === 'cards';

  // 좁은 화면 세로 목록 판. dropdown의 links 항목은 접기 없이 하위 링크를 들여 써서 펼쳐 둔다.
  const renderPanelItem = (item: HeaderBarItem, index: number) => {
    if (navStyle !== 'dropdown' || !item.links?.length) {
      return renderTextItem(item, true);
    }
    const groupId = `${panelId}-group-${index}`;
    return (
      <div
        key={item.label}
        role="group"
        aria-labelledby={groupId}
        className={panelGroup}
      >
        <span id={groupId} className={panelGroupLabel}>
          {item.label}
        </span>
        {item.links.map((link) => renderTextItem(link, true, true))}
      </div>
    );
  };

  const renderDropdownItem = (item: HeaderBarItem) =>
    item.links?.length ? (
      <HeaderBarDropdownItem
        key={item.label}
        label={item.label}
        links={item.links}
        open={dropdownKey === item.label}
        onOpenChange={(next) => setDropdownKey(next ? item.label : null)}
        panelFaceClassName={panelVariantStyles[variant]}
      />
    ) : (
      renderTextItem(item, false)
    );

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
      <div className={clsx(bar, variantStyles[variant], isCards && barCards)}>
        {(logo || title) && (
          <div className={leftSection}>
            {logo && <div className={logoStyle}>{logo}</div>}
            {title && <h1 className={titleStyle}>{title}</h1>}
          </div>
        )}

        {hasItems && !isCards && (
          <div className={centerSection}>
            {iconItems ? (
              <HeaderBarNav items={iconItems} />
            ) : navStyle === 'pill' ? (
              <HeaderBarPillNav
                items={itemList}
                variantClassName={pillVariantStyles[variant]}
              />
            ) : (
              <nav aria-label="주요 메뉴" className={textNav}>
                {itemList.map((item) =>
                  navStyle === 'dropdown'
                    ? renderDropdownItem(item)
                    : renderTextItem(item, false)
                )}
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
              className={clsx(hamburger, isCards && hamburgerAlways)}
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

        {hasItems && !isCards && (
          <nav
            id={panelId}
            ref={panelRef}
            aria-label="메뉴 목록"
            className={clsx(panelStyle, panelVariantStyles[variant])}
          >
            {itemList.map(renderPanelItem)}
          </nav>
        )}

        {hasItems && isCards && (
          <HeaderBarCards
            items={itemList}
            open={open}
            surfaceId={panelId}
            surfaceRef={surfaceRef}
            variantClassName={cardsVariantStyles[variant]}
            onNavigate={() => {
              setOpen(false);
              // 포커스가 숨는 카드 층 안에서 떠나므로 햄버거로 돌려 둔다.
              hamburgerRef.current?.focus();
            }}
          />
        )}
      </div>
    </header>
  );
};

HeaderBar.displayName = 'HeaderBar';
