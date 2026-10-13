import { useLayoutEffect, useRef, type PointerEvent } from 'react';
import { gsap } from 'gsap';
import { gateMotion } from '../../hooks/gateMotion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { gsapDuration, gsapEasing } from '../../tokens/gsapEasing';
import type { HeaderBarItem } from './HeaderBar';
import {
  pillNav,
  pillItem,
  pillCircle,
  pillLabelStack,
  pillLabel,
  pillCover,
} from './HeaderBar.css';

// 아래 상수와 식의 출처는 전부 PillNav(.claude/고도화/ex/PillNav.tsx)다.

/**
 * 알약 타임라인의 길이(초). 원본 그대로 2초로 만들고(:87-95) 실제 시간은 tweenTo의
 * duration이 정한다. 타임라인 안의 상대 길이라 duration 토큰이 아니다.
 */
const TIMELINE_LENGTH = 2;
/** 원이 끝에서 커지는 배율(:87). */
export const CIRCLE_SCALE_END = 1.2;
/** 원래 글자가 위로 빠질 때 알약 높이에 더하는 여유(px, :90). */
const LABEL_EXIT_GAP = 8;
/** 덮는 글자가 아래에서 시작할 때 알약 높이에 더하는 거리(px, :94). :79의 12는 곧바로 덮어써진다. */
const COVER_ENTER_GAP = 100;

/** 알약 폭·높이에서 나오는 원과 글자의 기하(:60-63, :90, :94). */
export interface PillGeometry {
  /** 원 지름(px) */
  diameter: number;
  /** 원 바닥이 알약 바닥 아래로 내려가는 거리(px) */
  delta: number;
  /** 원의 transform-origin y(px). 알약 바닥 아래 한 점이라 원이 아래에서 둥글게 차오른다 */
  originY: number;
  /** 원래 글자의 끝 y */
  labelTo: number;
  /** 덮는 글자의 시작 y */
  coverFrom: number;
}

/**
 * 알약 폭 w와 높이 h로 원이 알약 윗모서리 두 곳을 정확히 덮는 크기를 구한다.
 * 레이아웃 전(0 x 0)에는 R이 0/0이 되므로 0으로 둔다.
 */
export const pillGeometry = (w: number, h: number): PillGeometry => {
  const R = h > 0 ? ((w * w) / 4 + h * h) / (2 * h) : 0;
  const diameter = Math.ceil(2 * R) + 2;
  const delta = Math.ceil(R - Math.sqrt(Math.max(0, R * R - (w * w) / 4))) + 1;
  return {
    diameter,
    delta,
    originY: diameter - delta,
    labelTo: -(h + LABEL_EXIT_GAP),
    coverFrom: Math.ceil(h + COVER_ENTER_GAP),
  };
};

/**
 * 테스트가 타임라인과 지금 도는 tweenTo를 집는 통로. 공개 prop/state로 안 나가고
 * 알약 DOM 노드에 얹는다(HeaderBarNav의 NavScaleSetterHost와 같은 모양).
 */
interface PillHost extends HTMLElement {
  __pillTimeline?: gsap.core.Timeline;
  __pillTween?: gsap.core.Tween;
}

interface HeaderBarPillItemProps {
  item: HeaderBarItem;
}

const HeaderBarPillItem = ({ item }: HeaderBarPillItemProps) => {
  const reduced = useReducedMotion();
  const pillRef = useRef<PillHost | null>(null);
  const circleRef = useRef<HTMLSpanElement | null>(null);
  const labelRef = useRef<HTMLSpanElement | null>(null);
  const coverRef = useRef<HTMLSpanElement | null>(null);
  // 마우스, 키보드 포커스, 선택(active)이 따로 채운다. 셋 중 하나라도 있으면 채워 둔다.
  const held = useRef({
    pointer: false,
    focus: false,
    active: Boolean(item.active),
  });

  // 알약 크기를 재서 원과 글자를 놓고 멈춘 타임라인 하나를 만든다(:52-100).
  // 마운트, 글자(=폭) 변화, 창 크기, 글꼴 로딩 때 다시 잰다(:102-109).
  // 다시 만들면 진행 중 상태는 0으로 돌아간다.
  useLayoutEffect(() => {
    const pill = pillRef.current;
    const circle = circleRef.current;
    const label = labelRef.current;
    const cover = coverRef.current;
    if (!pill || !circle || !label || !cover) return;

    const layout = () => {
      pill.__pillTween?.kill();
      pill.__pillTimeline?.kill();
      const { width, height } = pill.getBoundingClientRect();
      const g = pillGeometry(width, height);

      circle.style.width = `${g.diameter}px`;
      circle.style.height = `${g.diameter}px`;
      circle.style.bottom = `-${g.delta}px`;
      gsap.set(circle, {
        xPercent: -50,
        scale: 0,
        transformOrigin: `50% ${g.originY}px`,
      });
      gsap.set(label, { y: 0 });
      gsap.set(cover, { y: g.coverFrom, opacity: 0 });

      const timeline = gsap.timeline({ paused: true });
      // 타임라인 안 트윈은 linear다. 감속은 바깥 tweenTo(settle) 하나만 건다. PillNav는
      // 안과 밖이 둘 다 power3.out이라(:87-95, :142-162) 감속이 겹쳐 눈에는 약 70ms에
      // 다 찬다.
      const common = {
        duration: TIMELINE_LENGTH,
        ease: gsapEasing.linear,
        overwrite: 'auto',
      } as const;
      timeline.to(
        circle,
        { scale: CIRCLE_SCALE_END, xPercent: -50, ...common },
        0
      );
      timeline.to(label, { y: g.labelTo, ...common }, 0);
      timeline.to(cover, { y: 0, opacity: 1, ...common }, 0);
      pill.__pillTimeline = timeline;
      // 선택된 항목은 늘 채워진 끝 상태다. 재생이 아니라 자리를 잡는 것이다.
      timeline.progress(held.current.active ? 1 : 0);
    };

    layout();
    window.addEventListener('resize', layout);
    let cancelled = false;
    // document.fonts는 jsdom과 일부 환경에 없다.
    document.fonts?.ready.then(() => {
      if (!cancelled) layout();
    });

    return () => {
      cancelled = true;
      window.removeEventListener('resize', layout);
      pill.__pillTween?.kill();
      pill.__pillTimeline?.kill();
    };
  }, [item.label]);

  // 들어오면 끝으로 slow, 나가면 0으로 base. 도중이면 지금 자리에서 이어받는다(:142-162).
  const play = (toEnd: boolean) => {
    const pill = pillRef.current;
    const timeline = pill?.__pillTimeline;
    if (!pill || !timeline) return;
    pill.__pillTween?.kill();
    pill.__pillTween = gateMotion(reduced, () =>
      timeline.tweenTo(toEnd ? timeline.duration() : 0, {
        duration: toEnd ? gsapDuration.slow : gsapDuration.base,
        ease: gsapEasing.settle,
        overwrite: 'auto',
      })
    );
  };

  const hold = (key: 'pointer' | 'focus' | 'active', on: boolean) => {
    const state = held.current;
    const before = state.pointer || state.focus || state.active;
    state[key] = on;
    const after = state.pointer || state.focus || state.active;
    if (before !== after) play(after);
  };

  // 다른 페이지로 넘어가 active가 바뀌면 새 항목은 들어옴, 옛 항목은 나감이다
  // (호버와 같은 경로). 마운트 때는 이미 맞아 있어 아무 일도 없다.
  useLayoutEffect(() => {
    hold('active', Boolean(item.active));
    // hold는 렌더마다 새로 만들어지지만 읽는 것은 ref뿐이라 active만 본다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.active]);

  const interaction = {
    // 터치에서는 호버가 없고 원이 들러붙는다. 마우스만.
    onPointerEnter: (event: PointerEvent<HTMLElement>) => {
      if (event.pointerType === 'mouse') hold('pointer', true);
    },
    onPointerLeave: (event: PointerEvent<HTMLElement>) => {
      if (event.pointerType === 'mouse') hold('pointer', false);
    },
    // 키보드 포커스만. 클릭으로 생긴 포커스는 채움을 남기지 않는다.
    onFocus: (event: { currentTarget: HTMLElement }) => {
      if (event.currentTarget.matches(':focus-visible')) hold('focus', true);
    },
    onBlur: () => hold('focus', false),
    onClick: item.onClick,
    'aria-current': item.active ? ('page' as const) : undefined,
    className: pillItem,
    ref: (el: PillHost | null) => {
      pillRef.current = el;
    },
  };

  const content = (
    <>
      <span ref={circleRef} className={pillCircle} aria-hidden="true" />
      <span className={pillLabelStack}>
        <span ref={labelRef} className={pillLabel}>
          {item.label}
        </span>
        <span ref={coverRef} className={pillCover} aria-hidden="true">
          {item.label}
        </span>
      </span>
    </>
  );

  return item.href ? (
    <a href={item.href} {...interaction}>
      {content}
    </a>
  ) : (
    <button type="button" {...interaction}>
      {content}
    </button>
  );
};

interface HeaderBarPillNavProps {
  items: HeaderBarItem[];
  variantClassName: string;
}

/** `HeaderBar`가 `navStyle="pill"`일 때 그리는 내부 컴포넌트. 공개 export가 아니다. */
export const HeaderBarPillNav = ({
  items,
  variantClassName,
}: HeaderBarPillNavProps) => (
  <nav aria-label="주요 메뉴" className={`${pillNav} ${variantClassName}`}>
    {items.map((item) => (
      <HeaderBarPillItem key={item.label} item={item} />
    ))}
  </nav>
);
