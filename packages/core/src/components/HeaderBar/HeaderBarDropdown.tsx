import { useEffect, useId, useRef, type FocusEvent } from 'react';
import clsx from 'clsx';
import { addDocumentListener } from '../../_internal/dom';
import { Glyph } from '../../_internal/glyph';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import type { HeaderBarLink } from './HeaderBar';
import { usePanelTween, type PanelTweenHost } from './usePanelTween';
import {
  textItem,
  textLabel,
  dropdownSlot,
  dropdownTrigger,
  dropdownChevron,
  dropdownPanel,
  dropdownLink,
} from './HeaderBar.css';

interface HeaderBarDropdownItemProps {
  label: string;
  links: HeaderBarLink[];
  open: boolean;
  /** 한 번에 하나만 열리는 규칙은 부모가 state로 지킨다 */
  onOpenChange: (open: boolean) => void;
}

/**
 * `navStyle="dropdown"`에서 하위 링크가 있는 항목 하나. 항목 버튼과 그 아래 작은 판이다.
 * 공개 export가 아니다.
 */
export const HeaderBarDropdownItem = ({
  label,
  links,
  open,
  onOpenChange,
}: HeaderBarDropdownItemProps) => {
  const reduced = useReducedMotion();
  const panelId = useId();
  const slotRef = useRef<HTMLDivElement | null>(null);
  // 마우스가 슬롯 안에 있는가. 클릭이 마우스에서 왔는지 가리는 데 쓴다.
  const mouseInside = useRef(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<(HTMLUListElement & PanelTweenHost) | null>(null);
  usePanelTween(panelRef, open, reduced);

  // 열려 있는 동안 Esc와 밖 누름으로 닫는다. 항목 버튼 자신의 누름은 제외한다:
  // 버튼의 mousedown이 먼저 닫아 버리면 이어지는 click이 다시 열기 때문이다.
  useEffect(() => {
    if (!open) return;
    const offKey = addDocumentListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      onOpenChange(false);
      triggerRef.current?.focus();
    });
    const offMouse = addDocumentListener('mousedown', (event) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (slotRef.current?.contains(target)) return;
      onOpenChange(false);
    });
    return () => {
      offKey();
      offMouse();
    };
  }, [open, onOpenChange]);

  // 포커스가 슬롯 밖의 다른 곳으로 가면 닫는다. 도착지가 없는 blur(판 안쪽 빈 곳을
  // 누를 때 포커스가 body로 가는 경우)는 닫지 않는다. 밖 누름은 위 mousedown이 맡는다.
  const closeOnFocusLeave = (event: FocusEvent<HTMLElement>) => {
    const next = event.relatedTarget;
    if (open && next instanceof Node && !event.currentTarget.contains(next)) {
      onOpenChange(false);
    }
  };

  return (
    <div
      ref={slotRef}
      className={dropdownSlot}
      onBlur={closeOnFocusLeave}
      onPointerEnter={(event) => {
        if (event.pointerType !== 'mouse') return;
        mouseInside.current = true;
        onOpenChange(true);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType !== 'mouse') return;
        mouseInside.current = false;
        if (open) onOpenChange(false);
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        className={clsx(textItem, dropdownTrigger)}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={(event) => {
          // 마우스 클릭(detail 1 이상)은 열기만 한다. 호버로 이미 열린 판이 클릭에 닫히면
          // 안 된다. 키보드의 Enter·Space는 detail 0이라, 터치·펜은 마우스가 아니라 지금처럼
          // 열고 닫는다.
          const fromMouse = mouseInside.current && event.detail > 0;
          onOpenChange(fromMouse ? true : !open);
        }}
      >
        <span className={textLabel}>{label}</span>
        <span className={dropdownChevron}>
          <Glyph name="chevron-down" size="sm" />
        </span>
      </button>
      <ul id={panelId} ref={panelRef} className={dropdownPanel}>
        {links.map((link) => {
          const shared = {
            className: clsx(textItem, dropdownLink),
            onClick: () => {
              link.onClick?.();
              onOpenChange(false);
              // 포커스가 숨는 판 안에서 떠나므로 항목 버튼으로 돌려 둔다.
              triggerRef.current?.focus();
            },
          };
          const text = <span className={textLabel}>{link.label}</span>;
          return (
            <li key={link.label}>
              {link.href ? (
                <a href={link.href} {...shared}>
                  {text}
                </a>
              ) : (
                <button type="button" {...shared}>
                  {text}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};
