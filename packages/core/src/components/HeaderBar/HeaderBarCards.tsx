import {
  useId,
  useLayoutEffect,
  useRef,
  type ReactNode,
  type RefObject,
} from 'react';
import clsx from 'clsx';
import { gsap } from 'gsap';
import { Glyph } from '../../_internal/glyph';
import { settleMotion } from '../../hooks/gateMotion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { gsapDuration, gsapEasing } from '../../tokens/gsapEasing';
import { mediaQuery } from '../../tokens/breakpoints.css';
import type { HeaderBarItem, HeaderBarLink } from './HeaderBar';
import {
  BAR_HEIGHT,
  CARDS_OPEN_HEIGHT,
  CARDS_RISE_Y,
  CARDS_START_RATIO,
  CARDS_STAGGER,
  cardsSurface,
  cardsLayer,
  card as cardStyle,
  cardTitle,
  cardTitleLink,
  cardLinks,
  cardLink,
} from './HeaderBar.css';

// 아래 상수와 식의 출처는 전부 CardNav(.claude/고도화/ex/CardNav.tsx)다.
// 면 높이 트윈 :85-90, 카드 트윈 :96(y 50, 시차 0.08, 끝나기 0.1초 전 시작), 높이 재기 :47-82,
// 다시 만들기 :105-135, 열기·닫기 :137-149.

/**
 * 테스트가 타임라인을 집는 통로. 공개 prop/state로 안 나가고 면 DOM 노드에 얹는다
 * (타입 전용 확장이라 값으로 export되지 않는다. PillHost와 같은 모양).
 */
export interface CardsSurfaceHost extends HTMLDivElement {
  __cardsTimeline?: gsap.core.Timeline;
}

/** 좁은 화면인가. matchMedia가 없는 환경(SSR·옛 jsdom)은 넓은 화면으로 본다. */
const isNarrow = (): boolean =>
  typeof window.matchMedia === 'function' &&
  window.matchMedia(mediaQuery.down.md).matches;

/**
 * 펼친 면의 높이(px). 카드 층을 잠깐 보이게 펴서(static, height auto) 내용 높이를 재고
 * 되돌린다(:51-82). 층의 안쪽 여백이 카드 아래 여백까지 담는다. 넓은 화면은 CARDS_OPEN_HEIGHT
 * 아래로 내려가지 않고(:77), 좁은 화면은 잰 값 그대로다.
 */
const measureOpenHeight = (layer: HTMLElement): number => {
  const { visibility, position, height } = layer.style;
  layer.style.visibility = 'visible';
  layer.style.position = 'static';
  layer.style.height = 'auto';
  const measured = BAR_HEIGHT + layer.scrollHeight;
  layer.style.visibility = visibility;
  layer.style.position = position;
  layer.style.height = height;
  return isNarrow() ? measured : Math.max(CARDS_OPEN_HEIGHT, measured);
};

interface HeaderBarCardsProps {
  items: HeaderBarItem[];
  open: boolean;
  /** 햄버거 aria-controls가 가리키는 면의 id */
  surfaceId: string;
  surfaceRef: RefObject<CardsSurfaceHost | null>;
  /** 바 variant의 면 클래스(색 변수도 여기서 온다) */
  variantClassName: string;
  /** 링크·항목을 누른 뒤 닫는다(포커스를 햄버거로 돌리는 일까지 부모가 맡는다) */
  onNavigate: () => void;
}

/**
 * `HeaderBar`가 `navStyle="cards"`일 때 바 뒤에 깔리는 면. 공개 export가 아니다.
 * 면은 쉴 때 바와 같은 높이이고, 열면 아래로 자라며 안의 카드가 시차를 두고 솟는다.
 */
export const HeaderBarCards = ({
  items,
  open,
  surfaceId,
  surfaceRef,
  variantClassName,
  onNavigate,
}: HeaderBarCardsProps) => {
  const reduced = useReducedMotion();
  const idBase = useId();
  const layerRef = useRef<HTMLElement | null>(null);
  // 마지막으로 타임라인에 반영한 열림. 처음 마운트(닫힘)와 축소 선호만 바뀐 렌더를 가른다.
  const shownRef = useRef(false);
  // 다시 만들 때 지금 열려 있는지 알려 준다(커밋마다 갱신, 아래 효과들보다 먼저 선언한다).
  const openRef = useRef(open);
  useLayoutEffect(() => {
    openRef.current = open;
  });

  // 항목의 모양(제목과 링크 이름)이 바뀔 때만 다시 만든다. 부모가 같은 내용의 새 배열을
  // 렌더마다 넘겨도 도는 타임라인이 처음으로 돌아가지 않게 내용으로 비교한다.
  const shape = JSON.stringify(
    items.map((item) => [item.label, item.links?.map((link) => link.label)])
  );

  // 면 높이와 카드 층을 재서 멈춘 타임라인 하나를 만든다(:47-103). 마운트, 항목 변화,
  // 창 크기 변화 때 다시 만든다(:105-135). 열려 있으면 끝(progress 1), 닫혀 있으면 처음이다.
  useLayoutEffect(() => {
    const surface = surfaceRef.current;
    const layer = layerRef.current;
    if (!surface || !layer) return;

    const build = () => {
      surface.__cardsTimeline?.kill();
      const cards = Array.from(layer.children);
      // 지난 타임라인이 남긴 y·opacity가 잰 높이에 섞이지 않게 먼저 지운다.
      // gsap.set은 즉시 끝나는 트윈이라 settleMotion이 확정할 것이 없다(HeaderBarNav와 같은 관례).
      settleMotion(gsap.set(cards, { clearProps: 'transform,opacity' }));
      const target = measureOpenHeight(layer);
      layer.style.height = `${target - BAR_HEIGHT}px`;

      const common = { duration: gsapDuration.slow, ease: gsapEasing.settle };
      const timeline = gsap.timeline({
        paused: true,
        onReverseComplete: () => {
          layer.style.visibility = 'hidden';
        },
      });
      timeline.fromTo(
        surface,
        { height: BAR_HEIGHT },
        { height: target, ...common },
        0
      );
      timeline.fromTo(
        cards,
        { y: CARDS_RISE_Y, opacity: 0 },
        { y: 0, opacity: 1, ...common, stagger: CARDS_STAGGER },
        gsapDuration.slow * CARDS_START_RATIO
      );
      surface.__cardsTimeline = timeline;

      layer.style.visibility = openRef.current ? 'visible' : 'hidden';
      timeline.progress(openRef.current ? 1 : 0);
    };

    build();
    window.addEventListener('resize', build);
    return () => {
      window.removeEventListener('resize', build);
      surface.__cardsTimeline?.kill();
    };
  }, [surfaceRef, shape]);

  // 열고 닫기. 열기는 play()(닫히는 도중이면 지금 자리에서 앞으로), 닫기는 reverse()다
  // (카드가 먼저 가라앉고 면이 줄어든다). 축소 선호면 움직임 없이 끝·처음으로 간다.
  useLayoutEffect(() => {
    const layer = layerRef.current;
    const timeline = surfaceRef.current?.__cardsTimeline;
    if (!layer || !timeline) return;
    const changed = shownRef.current !== open;
    shownRef.current = open;
    if (reduced) {
      // 열림 상태가 그대로여도 돌던 타임라인이 있으면(축소 선호가 방금 켜졌다) 확정한다.
      if (!changed && !timeline.isActive()) return;
      timeline.pause().progress(open ? 1 : 0);
      layer.style.visibility = open ? 'visible' : 'hidden';
      return;
    }
    if (!changed) return;
    if (open) {
      layer.style.visibility = 'visible';
      timeline.play();
    } else {
      timeline.reverse();
    }
  }, [surfaceRef, open, reduced]);

  const renderLink = (link: HeaderBarLink): ReactNode => {
    const shared = {
      className: cardLink,
      onClick: () => {
        link.onClick?.();
        onNavigate();
      },
    };
    const content = (
      <>
        <Glyph name="arrow-up-right" size="sm" />
        {link.label}
      </>
    );
    return (
      <li key={link.label}>
        {link.href ? (
          <a href={link.href} {...shared}>
            {content}
          </a>
        ) : (
          <button type="button" {...shared}>
            {content}
          </button>
        )}
      </li>
    );
  };

  const renderCard = (item: HeaderBarItem, index: number): ReactNode => {
    const titleId = `${idBase}-card-${index}`;
    const hasLinks = Boolean(item.links?.length);
    const titleShared = {
      id: titleId,
      className: clsx(cardTitle, !hasLinks && cardTitleLink),
    };
    let title: ReactNode;
    if (hasLinks) {
      title = <span {...titleShared}>{item.label}</span>;
    } else {
      // links가 없으면 항목 자체를 누를 곳으로 둔다(다른 형태의 items를 그대로 넘겨도 된다).
      const press = {
        ...titleShared,
        'aria-current': item.active ? ('page' as const) : undefined,
        onClick: () => {
          item.onClick?.();
          onNavigate();
        },
      };
      title = item.href ? (
        <a href={item.href} {...press}>
          {item.label}
        </a>
      ) : (
        <button type="button" {...press}>
          {item.label}
        </button>
      );
    }
    return (
      <div
        key={item.label}
        role="group"
        aria-labelledby={titleId}
        className={cardStyle}
      >
        {title}
        {hasLinks && (
          <ul className={cardLinks}>{item.links?.map(renderLink)}</ul>
        )}
      </div>
    );
  };

  return (
    <div
      id={surfaceId}
      ref={surfaceRef}
      className={clsx(cardsSurface, variantClassName)}
    >
      <nav ref={layerRef} aria-label="메뉴 목록" className={cardsLayer}>
        {items.map(renderCard)}
      </nav>
    </div>
  );
};
