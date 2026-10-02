import {
  useLayoutEffect,
  useRef,
  type ReactNode,
  type PointerEvent,
  type FocusEvent,
} from 'react';
import clsx from 'clsx';
import { gsap } from 'gsap';
import { settleMotion } from '../../hooks/gateMotion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { gsapDuration, gsapEasing } from '../../tokens/gsapEasing';
import {
  ITEM_SCALE_VAR,
  RESERVED_SIZE,
  ITEM_PITCH,
  MAX_SCALE,
  nav,
  item,
  pill,
} from './HeaderBarNav.css';

/** 근접 확대가 켜진 헤더 nav 항목 하나. */
export interface HeaderBarNavItem {
  /** 알약 안에 들어가는 내용. 아이콘 요소를 넣는 것이 일반적이다. */
  icon: ReactNode;
  /** 접근성 이름. 시각적으로는 보이지 않는다. React key로도 쓴다. */
  label: string;
  /** 주면 <a>, 없으면 <button>으로 렌더된다. */
  href?: string;
  onClick?: () => void;
}

export interface HeaderBarNavProps {
  items: HeaderBarNavItem[];
  /** <nav>의 접근성 이름. 기본값 '주요 메뉴'. */
  'aria-label'?: string;
  className?: string;
}

/** 컨테이너 왼쪽 기준 항목 i의 중심(px). 피치가 상수라 DOM을 읽지 않는다. */
export const itemCenter = (index: number): number =>
  RESERVED_SIZE / 2 + index * ITEM_PITCH;

/** 이 거리에서 영향이 0이 된다. 피치의 정확히 2배 — 이웃 한 칸은 절반, 두 칸은 0. */
const PROXIMITY_RADIUS = 2 * ITEM_PITCH;

/**
 * origin(컨테이너 왼쪽 기준 px, 또는 null=쉼)에서 각 항목의 배율을 낸다.
 * Math.max(0, …)이 가드 1을 구조적으로 보장한다 — 1 미만은 도달 불가능하다.
 */
export const proximityScales = (
  origin: number | null,
  count: number
): number[] =>
  Array.from({ length: count }, (_, index) => {
    if (origin === null) return 1;
    const distance = Math.abs(origin - itemCenter(index));
    const nearness = Math.max(0, 1 - distance / PROXIMITY_RADIUS);
    return 1 + (MAX_SCALE - 1) * nearness;
  });

/**
 * 테스트가 세터 배열을 읽는 통로. 공개 prop/state로 안 나가고 nav DOM 노드에
 * 얹는다 — 타입 전용 확장이라 값으로 export되지 않는다(Snackbar.tsx의
 * CountdownTweenHost와 같은 모양).
 */
interface NavScaleSetterHost extends HTMLElement {
  __navScaleSetters?: ReturnType<typeof gsap.quickTo>[];
}

/**
 * 커서에 가까울수록 항목이 부푸는 헤더 nav. 포커스도 같은 신호에 묶인다
 * (모션 명제:134). `HeaderBar`의 children/actions 슬롯은 임의의 ReactNode라
 * 항목 목록을 알 방법이 없어 별도 컴포넌트로 분리했다 — Ruling 61.
 */
export const HeaderBarNav = ({
  items,
  'aria-label': ariaLabel = '주요 메뉴',
  className,
}: HeaderBarNavProps) => {
  const reduced = useReducedMotion();
  const navRef = useRef<HTMLElement | null>(null);
  const pillRefs = useRef<(HTMLElement | null)[]>([]);
  // pointerenter에서 캐시한다. DOM 읽기는 여기 한 곳뿐이다 — 항목마다
  // getBoundingClientRect를 읽으면 pointermove마다 GSAP의 쓰기와 엮여 강제
  // 리플로가 난다(Ruling 59). 호버 중 창이 리사이즈되면 낡을 수 있으나
  // 다음 pointerenter에서 스스로 낫는다.
  const containerLeftRef = useRef(0);
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

  const applyOrigin = (origin: number | null): void => {
    const setters = settersRef.current;
    if (setters.length === 0) return; // reduced거나 아직 안 붙었다
    proximityScales(origin, setters.length).forEach((scale, index) => {
      setters[index](scale);
    });
  };

  return (
    <nav
      ref={navRef}
      aria-label={ariaLabel}
      className={clsx(nav, className)}
      onPointerEnter={() => {
        containerLeftRef.current =
          navRef.current?.getBoundingClientRect().left ?? 0;
      }}
      onPointerMove={(event: PointerEvent<HTMLElement>) => {
        applyOrigin(event.clientX - containerLeftRef.current);
      }}
      onPointerLeave={() => applyOrigin(null)}
      onPointerCancel={() => applyOrigin(null)}
      onBlur={(event: FocusEvent<HTMLElement>) => {
        // nav 밖으로 나가는 blur일 때만 쉼으로 되돌린다 — 항목 사이 이동은
        // 다음 항목의 onFocus가 곧바로 새 원점을 쓰므로 여기서 끊지 않는다.
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          applyOrigin(null);
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
          onClick: navItem.onClick,
          onFocus: () => applyOrigin(itemCenter(index)),
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
