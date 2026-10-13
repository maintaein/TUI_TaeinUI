import { useLayoutEffect, useRef, type FocusEvent } from 'react';
import { gsap } from 'gsap';
import { settleMotion } from '../../hooks/gateMotion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import type { HeaderBarIconItem } from './HeaderBar';
import { gsapDuration, gsapEasing } from '../../tokens/gsapEasing';
import { ITEM_SCALE_VAR, MAX_SCALE, nav, item, pill } from './HeaderBarNav.css';

interface HeaderBarNavProps {
  items: HeaderBarIconItem[];
}

/**
 * 테스트가 세터 배열을 읽는 통로. 공개 prop/state로 안 나가고 nav DOM 노드에
 * 얹는다 — 타입 전용 확장이라 값으로 export되지 않는다(Snackbar.tsx의
 * CountdownTweenHost와 같은 모양).
 */
interface NavScaleSetterHost extends HTMLElement {
  __navScaleSetters?: ReturnType<typeof gsap.quickTo>[];
}

/**
 * 커서(또는 키보드 포커스)가 올라간 항목만 커지는 헤더 nav. 이웃은 그대로다
 * (모션 명제:134, fix 2에서 근접 보간을 걷었다). `HeaderBar`가 `navStyle="icon"`일 때 그리는 내부 컴포넌트이고
 * 공개 export가 아니다(M5 task-24, 옛 공개 `HeaderBarNav`를 합쳤다).
 */
export const HeaderBarNav = ({ items }: HeaderBarNavProps) => {
  const reduced = useReducedMotion();
  const navRef = useRef<HTMLElement | null>(null);
  const pillRefs = useRef<(HTMLElement | null)[]>([]);
  const settersRef = useRef<ReturnType<typeof gsap.quickTo>[]>([]);

  // 아래 effect의 deps. `items` 자체는 매 렌더 새 배열이라 쓸모가 없고,
  // `items.length`는 길이가 같은 채 label만 바뀌는 경우를 놓친다 — key={label}이라
  // DOM 노드가 교체되는데 세터는 떨어져 나간 노드를 계속 가리킨다. key와 같은
  // 재료에서 만든 파생 문자열이라 값 비교로 걸리고, 그래서 useMemo 없이 매 렌더
  // 계산해도 안전하다.
  const labelKey = items.map((navItem) => navItem.label).join('\0');

  useLayoutEffect(() => {
    const pills = pillRefs.current.filter(
      (el): el is HTMLElement => el !== null
    );
    const navEl = navRef.current as NavScaleSetterHost | null;
    if (pills.length === 0) return;

    if (reduced) {
      // Ruling 54: 마운트 뒤에 축소 선호가 켜졌을 때 부푼 항목을 쉼으로 정착시킨다.
      settleMotion(gsap.set(pills, { [ITEM_SCALE_VAR]: 1 }));
      settersRef.current = [];
      if (navEl) navEl.__navScaleSetters = [];
      return;
    }

    const setters = pills.map((pillEl) =>
      gsap.quickTo(pillEl, ITEM_SCALE_VAR, {
        duration: gsapDuration.base,
        ease: gsapEasing.settle,
      })
    );
    settersRef.current = setters;
    if (navEl) navEl.__navScaleSetters = setters;

    return () => {
      settersRef.current.forEach((setter) => setter.tween.kill());
      settersRef.current = [];
      if (navEl) delete navEl.__navScaleSetters;
    };
  }, [reduced, labelKey]);

  // index번째 항목만 MAX_SCALE로, 나머지는 1로. null이면 전부 쉼.
  const select = (index: number | null): void => {
    settersRef.current.forEach((setter, position) => {
      setter(position === index ? MAX_SCALE : 1);
    });
  };

  return (
    <nav
      ref={navRef}
      aria-label="주요 메뉴"
      className={nav}
      onBlur={(event: FocusEvent<HTMLElement>) => {
        // nav 밖으로 나가는 blur일 때만 쉼으로 되돌린다 — 항목 사이 이동은
        // 다음 항목의 onFocus가 곧바로 새 항목을 고르므로 여기서 끊지 않는다.
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          select(null);
        }
      }}
    >
      {items.map((navItem, index) => {
        const setPillRef = (el: HTMLElement | null) => {
          pillRefs.current[index] = el;
        };
        const sharedProps = {
          className: item,
          'aria-label': navItem.label,
          'aria-current': navItem.active ? ('page' as const) : undefined,
          onClick: navItem.onClick,
          onPointerEnter: () => select(index),
          onPointerLeave: () => select(null),
          onFocus: () => select(index),
        };
        const pillNode = (
          <span ref={setPillRef} className={pill} aria-hidden="true">
            {navItem.icon}
          </span>
        );

        return navItem.href ? (
          <a key={navItem.label} href={navItem.href} {...sharedProps}>
            {pillNode}
          </a>
        ) : (
          <button key={navItem.label} type="button" {...sharedProps}>
            {pillNode}
          </button>
        );
      })}
    </nav>
  );
};

HeaderBarNav.displayName = 'HeaderBarNav';
