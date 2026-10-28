import {
  forwardRef,
  isValidElement,
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  type ElementType,
  type ForwardedRef,
  type ReactElement,
} from 'react';
import { gsap } from 'gsap';
import { gateMotion } from '../../hooks/gateMotion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { gsapDuration, gsapEasing } from '../../tokens/gsapEasing';
import { getFirstFocusableElement } from '../../_internal/dom';
import { rememberMorph, takeMorph, type MorphLook } from './morphRegistry';

export interface MorphProps {
  /** 짝을 찾는 이름. 같은 `morphId`로 사라진 요소의 모양을 새로 나타난 요소가 이어받는다. HTML `id`와 다르다 */
  morphId: string;
  /** 요소 하나. 종류나 `key`가 바뀌면 다른 요소로 보고 이전 모양을 이어받는다 */
  children: ReactElement;
  /** 움직일 래퍼 요소 @default 'div' */
  as?: 'div' | 'li' | 'section' | 'article';
  /** 래퍼에 더할 CSS 클래스 */
  className?: string;
}

/** 테스트가 현재 타임라인을 읽는 손잡이(StampButton의 __stampTimeline과 같은 모양). */
type MorphHost = HTMLElement & { __morphTimeline?: gsap.core.Timeline };

/**
 * 형태 변화 시간. Modal의 창 자람과 같은 성격이라 같은 길이(slower의 1.2배)를 쓴다.
 * 사각형이 가로지르는 거리를 읽을 시간을 주려고 slower보다 길다.
 */
const SHAPE_DURATION = gsapDuration.slower * 1.2;

// 위치 이동의 양 끝이 settle보다 덜 급한 drift를 쓴다(Modal과 같은 이유). 내용 페이드인은 settle.
const SHAPE_EASE = gsapEasing.drift;

const radiusPx = (style: CSSStyleDeclaration, width: number): number => {
  const raw = style.borderTopLeftRadius;
  const n = Number.parseFloat(raw);
  if (Number.isNaN(n)) return 0;
  return raw.endsWith('%') ? (n / 100) * width : n;
};

/**
 * 지금 보이는 모습을 찍는다. 이어받는 중이면 래퍼가 그 모습이고(둥글기는 확대 전 값이라 배율을 곱한다),
 * 쉬는 중이면 안쪽 요소가 모습이다. 래퍼가 안쪽 요소보다 크면 사각형이 어긋난다.
 * ponytail: 래퍼 사각형을 그대로 쓴다, 래퍼와 children 크기가 다른 레이아웃이 나오면 children 사각형으로 바꾼다.
 */
const lookOf = (el: HTMLElement, inFlight: boolean): MorphLook => {
  const rect = el.getBoundingClientRect();
  const source = inFlight ? el : (el.firstElementChild ?? el);
  const style = getComputedStyle(source);
  const scale = inFlight
    ? (Number(gsap.getProperty(el, 'scaleX')) +
        Number(gsap.getProperty(el, 'scaleY'))) /
      2
    : 1;
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
    // 알약(9999px)이 타원이 되지 않게 짧은 변의 절반으로 누른다
    radius: Math.min(
      radiusPx(style, rect.width) * scale,
      Math.min(rect.width, rect.height) / 2
    ),
    background: style.backgroundColor,
    focused: el.contains(document.activeElement),
  };
};

/** 래퍼 안 첫 포커스 가능 자손으로, 없으면 래퍼 자신으로 포커스를 옮긴다. 래퍼는 탭 순서에 넣지 않는다(tabindex -1). */
const moveFocusInto = (el: HTMLElement) => {
  const target = getFirstFocusableElement(el) ?? el;
  if (target === el) el.setAttribute('tabindex', '-1');
  target.focus();
};

/** 이어받으며 건 인라인 값을 걷어 소비자 스타일과 CSS가 다시 이긴다. */
const rest = (el: HTMLElement) => {
  gsap.set([el, ...Array.from(el.children)], { clearProps: 'transition' });
  // GSAP은 둥글기를 네 모서리 값으로 쓴다. 숏핸드 이름만 걷으면 jsdom에는 모서리 값이 남는다.
  gsap.set(el, {
    clearProps:
      'transform,backgroundColor,borderTopLeftRadius,borderTopRightRadius,borderBottomRightRadius,borderBottomLeftRadius',
  });
  gsap.set(Array.from(el.children), { clearProps: 'opacity' });
};

interface BodyProps extends Omit<MorphProps, 'children'> {
  forwardedRef: ForwardedRef<HTMLElement>;
  children: ReactElement;
}

const MorphBody = ({
  morphId,
  as = 'div',
  className,
  forwardedRef,
  children,
}: BodyProps) => {
  const Tag: ElementType = as;
  const reduced = useReducedMotion();
  const elRef = useRef<HTMLElement | null>(null);
  const setEl = useCallback((node: HTMLElement | null) => {
    elRef.current = node;
  }, []);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  useImperativeHandle(forwardedRef, () => elRef.current as HTMLElement);

  // 언마운트 직전, DOM이 아직 있을 때 겉모양을 맡긴다. 아래 효과의 정리(트윈 끄기)보다 먼저 선언해
  // 정리가 중간 모습을 지우기 전에 읽는다(같은 컴포넌트의 정리는 선언 순서로 돈다).
  useLayoutEffect(() => {
    const el = elRef.current;
    return () => {
      if (el) rememberMorph(morphId, lookOf(el, timelineRef.current !== null));
    };
  }, [morphId]);

  useLayoutEffect(() => {
    const el = elRef.current as MorphHost | null;
    const from = el ? takeMorph(morphId) : undefined;
    if (!el || !from) return;

    // 이전 요소에 있던 포커스는 body로 떨어지지 않게 움직임과 상관없이 옮긴다
    if (from.focused) moveFocusInto(el);

    const to = el.getBoundingClientRect();
    if (!from.width || !from.height || !to.width || !to.height) return;

    const content = Array.from(el.children);
    // 안쪽 요소가 opacity 같은 값에 CSS transition을 갖고 있으면(Card 등) 인라인 값이 한 박자 늦게 따라와 내용이 비쳐 보인다.
    // 움직이는 동안에는 래퍼와 내용의 transition을 끈다. 위 사각형 읽기가 이미 스타일을 계산했으므로 값을 바꾸기 전에 건다.
    gsap.set([el, ...content], { transition: 'none' });
    const look = getComputedStyle(el.firstElementChild ?? el);
    const scaleX = from.width / to.width;
    const scaleY = from.height / to.height;

    // 모서리가 확대에 늘어나지 않게, 확대 전 둥글기를 배율로 나눠 시작한다. 가로세로 비율이 크게 다르면 모서리가 살짝 타원이 된다.
    const timeline = gateMotion(reduced, () => {
      const tl = gsap.timeline({ onComplete: () => finish() });
      tl.fromTo(
        el,
        {
          x: from.left + from.width / 2 - (to.left + to.width / 2),
          y: from.top + from.height / 2 - (to.top + to.height / 2),
          scaleX,
          scaleY,
          borderRadius: from.radius / ((scaleX + scaleY) / 2),
          backgroundColor: from.background,
        },
        {
          x: 0,
          y: 0,
          scaleX: 1,
          scaleY: 1,
          borderRadius: radiusPx(look, to.width),
          backgroundColor: look.backgroundColor,
          duration: SHAPE_DURATION,
          ease: SHAPE_EASE,
        },
        0
      );
      // 형태가 바뀌는 동안 내용은 투명하고, 다 자리 잡은 뒤에 떠오른다
      tl.fromTo(
        content,
        { opacity: 0 },
        { opacity: 1, duration: gsapDuration.slow, ease: gsapEasing.settle },
        SHAPE_DURATION
      );
      return tl;
    });
    el.__morphTimeline = timeline;

    function finish() {
      timelineRef.current = null;
      rest(el as HTMLElement);
    }
    if (reduced) finish();
    else timelineRef.current = timeline;

    return () => {
      timeline.kill();
      finish();
    };
  }, [morphId, reduced]);

  return (
    <Tag ref={setEl} className={className} data-morph-id={morphId}>
      {children}
    </Tag>
  );
};

// 같은 종류의 요소로 다시 그려지는 것과 다른 요소로 바뀌는 것을 가르는 번호. 함수 컴포넌트는 이름이 겹칠 수 있어 번호로 센다.
let typeCount = 0;
const typeIds = new WeakMap<object, number>();
const kindOf = (type: ReactElement['type']): string => {
  if (typeof type === 'string') return type;
  let id = typeIds.get(type);
  if (id === undefined) typeIds.set(type, (id = ++typeCount));
  return `#${id}`;
};

/**
 * 같은 `morphId`로 사라진 요소의 모양(자리·크기·둥글기·배경)을 새로 나타난 요소가 이어받아 제 모습으로 바뀐다.
 * 카드에서 상세로, 썸네일에서 크게 보기로 쓴다. 움직임 줄이기에서는 즉시 바뀐다.
 * children의 종류나 `key`가 바뀌면 같은 Morph 안에서도 이어받는다(래퍼를 새로 그린다).
 */
export const Morph = forwardRef<HTMLElement, MorphProps>(
  ({ children, ...props }, ref) => (
    <MorphBody
      key={
        isValidElement(children)
          ? `${kindOf(children.type)}:${children.key ?? ''}`
          : ''
      }
      forwardedRef={ref}
      {...props}
    >
      {children}
    </MorphBody>
  )
);

Morph.displayName = 'Morph';
