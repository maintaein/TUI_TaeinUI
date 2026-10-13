import { style } from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';
import { focusRing } from '../../tokens/focusRing.css';
import { TINT_HOVER, TINT_PRESS } from './HeaderBar.css';

/** GSAP이 프레임마다 쓰는 배율 채널. transform은 이 변수만 읽는다 — Ruling 55. */
export const ITEM_SCALE_VAR = '--header-bar-nav-item-scale';

/** 보이는 알약의 한 변(px). */
export const PILL_SIZE = 40;
/** 커서(또는 포커스)가 올라간 항목의 배율. Dock의 70/50과 같은 비율이다. */
export const MAX_SCALE = 1.4;
/** 히트 영역 = 예약 박스의 한 변(px). PILL_SIZE * MAX_SCALE이어야 한다 — 가드 2. */
export const RESERVED_SIZE = PILL_SIZE * MAX_SCALE;
/** 예약 박스 사이 간격(px). 히트 영역이 8px 이상 떨어지게 한다. */
export const ITEM_GAP = 8;

export const nav = style({
  display: 'flex',
  alignItems: 'center',
  gap: `${ITEM_GAP}px`,
});

// item을 pill보다 먼저 선언해야 아래 pill의 selectors에서 참조할 수 있다.
export const item = style({
  width: `${RESERVED_SIZE}px`,
  height: `${RESERVED_SIZE}px`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  touchAction: 'manipulation',
  flexShrink: 0,
  textDecoration: 'none',
  color: 'inherit',
  // transform 없음. transition 없음 — 가드 2(레이아웃을 미리 확보한다).
  // 히트 영역은 절대 변형되지 않는다.

  selectors: {
    '&:focus-visible': {
      ...focusRing(),
    },
  },
});

export const pill = style({
  width: `${PILL_SIZE}px`,
  height: `${PILL_SIZE}px`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: themeContract.borderRadius.full,
  flexShrink: 0,
  transform: `scale(var(${ITEM_SCALE_VAR}, 1))`,
  // background-color만 전이한다 — Ruling 58. transform을 넣으면 GSAP이 프레임마다
  // 변수를 바꿀 때 CSS 전이가 매번 새로 시작해 두 겹으로 움직이고 추종이 늦어진다.
  transition: `background-color ${themeContract.animation.duration.fast} ${themeContract.animation.easing.settle}`,

  selectors: {
    // currentColor 섞음이라 어두운 바에서도 글자색에 맞는다(surface.hover는 밝은 면이다).
    [`${item}:hover &`]: {
      backgroundColor: TINT_HOVER,
    },
    [`${item}:focus-visible &`]: {
      backgroundColor: TINT_HOVER,
    },
    // 지금 보고 있는 페이지는 바탕이 늘 깔려 있다.
    [`${item}[aria-current="page"] &`]: {
      backgroundColor: TINT_HOVER,
    },
    [`${item}:active &`]: {
      backgroundColor: TINT_PRESS,
      transform: `scale(var(${ITEM_SCALE_VAR}, 1)) translateY(1px)`,
    },
  },
});
