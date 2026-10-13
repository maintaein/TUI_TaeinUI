import { style, styleVariants } from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';
import { mediaQuery } from '../../tokens/breakpoints.css';
import { focusRing } from '../../tokens/focusRing.css';

// 떠 있는 바의 기하. 출처는 CardNav(.claude/고도화/ex/CardNav.tsx:161-208)의
// 높이 60px, 폭 90%(최대 800px)다. 폭은 토큰 여백으로 바꾸고 최대 폭은 960px로 넓혔다.
/** 바 높이(px). header가 위 여백과 함께 이만큼 자리를 미리 차지한다. */
export const BAR_HEIGHT = 60;
/** 바 최대 폭(px). */
export const BAR_MAX_WIDTH = 960;

/** 좁은 화면 패널이 닫혀 있을 때 아래로 내려가 있는 거리(px). PillNav 모바일 메뉴의 리듬(PillNav.tsx:195-222). */
export const PANEL_OFFSET_Y = 8;
/** 패널과 바 사이 간격. */
const PANEL_GAP = themeContract.spacing[2];

// 햄버거 선. 출처는 CardNav(CardNav.tsx:186-194)의 선 둘과 간격 6px이고, 폭만 24px로 줄였다.
/** 햄버거 선 폭(px). */
export const HAMBURGER_LINE_WIDTH = 24;
/** 햄버거 선 굵기(px). */
export const HAMBURGER_LINE_HEIGHT = 2;
/** 햄버거 두 선 사이 간격(px). */
export const HAMBURGER_LINE_GAP = 6;
/** X로 모일 때 각 선이 가운데로 이동하는 거리(px): 두 선 중심 간격의 절반이다. */
const HAMBURGER_LINE_SHIFT = (HAMBURGER_LINE_HEIGHT + HAMBURGER_LINE_GAP) / 2;
/** X의 각도(deg). */
const HAMBURGER_X_ANGLE = 45;
/** 햄버거 버튼 한 변(px). 바 높이 안에서 누르기 쉬운 크기다. */
const HAMBURGER_SIZE = 44;

const settle = themeContract.animation.easing.settle;
const duration = themeContract.animation.duration;

// header는 위 여백만 가진다. 바(60px)가 높이를 정하고, 패널은 absolute라 높이를 바꾸지
// 않는다. 그래서 바가 아래로 열려도 내용을 밀지 않는다(레이아웃 미리 확보).
export const headerBar = style({
  boxSizing: 'border-box',
  width: '100%',
  paddingTop: themeContract.spacing[4],
  zIndex: themeContract.zIndex.sticky,
  // 바를 빼면 투명하다. 가장자리까지 닿는 면은 없다.
  pointerEvents: 'none',
});

export const stickyStyles = styleVariants({
  true: {
    position: 'sticky',
    top: 0,
  },
  false: {
    position: 'relative',
  },
});

export const bar = style({
  boxSizing: 'border-box',
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  gap: themeContract.spacing[3],
  width: `calc(100% - ${themeContract.spacing[4]} * 2)`,
  maxWidth: `${BAR_MAX_WIDTH}px`,
  height: `${BAR_HEIGHT}px`,
  marginLeft: 'auto',
  marginRight: 'auto',
  padding: themeContract.spacing[2],
  paddingLeft: themeContract.spacing[4],
  borderRadius: themeContract.borderRadius.lg,
  boxShadow: themeContract.shadow.md,
  // header의 pointerEvents: none을 바에서 되돌린다.
  pointerEvents: 'auto',
});

// bar보다 뒤에 선언해야 같은 특이도에서 boxShadow를 덮는다.
export const variantStyles = styleVariants({
  default: {
    backgroundColor: themeContract.color.background.default,
    color: themeContract.color.text.primary,
  },
  dark: {
    backgroundColor: themeContract.color.text.primary,
    color: themeContract.color.background.paper,
  },
  transparent: {
    backgroundColor: 'transparent',
    boxShadow: 'none',
    color: themeContract.color.text.primary,
  },
});

export const leftSection = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeContract.spacing[3],
  flexShrink: 1,
  minWidth: 0,
});

export const logo = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  maxHeight: '32px',

  '@media': {
    [mediaQuery.down.md]: {
      maxHeight: '28px',
    },
  },
});

export const title = style({
  fontSize: themeContract.font.size.lg,
  fontWeight: themeContract.font.weight.semibold,
  lineHeight: themeContract.font.lineHeight.tight,
  margin: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  minWidth: 0,

  '@media': {
    [mediaQuery.down.md]: {
      fontSize: themeContract.font.size.base,
    },
  },
});

export const centerSection = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: themeContract.spacing[4],
  flex: 1,
  minWidth: 0,

  '@media': {
    [mediaQuery.down.md]: {
      display: 'none',
    },
  },
});

export const rightSection = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeContract.spacing[2],
  flexShrink: 0,
  marginLeft: 'auto',
});

export const textNav = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeContract.spacing[1],
});

// 글자 항목. 라벨 아래 밑줄이 왼쪽에서 그어진다.
export const textItem = style({
  display: 'inline-flex',
  alignItems: 'center',
  padding: `${themeContract.spacing[2]} ${themeContract.spacing[3]}`,
  border: 'none',
  background: 'none',
  color: 'inherit',
  font: 'inherit',
  fontSize: themeContract.font.size.sm,
  fontWeight: themeContract.font.weight.medium,
  textDecoration: 'none',
  cursor: 'pointer',
  touchAction: 'manipulation',
  borderRadius: themeContract.borderRadius.sm,

  selectors: {
    '&:focus-visible': {
      ...focusRing('currentColor'),
    },
    '&[aria-current="page"]': {
      fontWeight: themeContract.font.weight.semibold,
    },
  },
});

export const textLabel = style({
  position: 'relative',
  display: 'inline-block',

  selectors: {
    // 쉬는 모습: 왼쪽 원점의 scaleX 0. 나갈 때는 fast로 접힌다.
    '&::after': {
      content: '""',
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: `calc(${themeContract.spacing[1]} * -1)`,
      height: '2px',
      backgroundColor: 'currentColor',
      transform: 'scaleX(0)',
      transformOrigin: 'left',
      transition: `transform ${duration.fast} ${settle}`,
    },
    // 지금 보고 있는 페이지는 늘 그어져 있다.
    [`${textItem}[aria-current="page"] &::after`]: {
      transform: 'scaleX(1)',
    },
    // 키보드 포커스는 호버 게이트 밖이다(터치에도 키보드는 있다).
    [`${textItem}:focus-visible &::after`]: {
      transform: 'scaleX(1)',
      transitionDuration: duration.base,
    },
  },

  '@media': {
    // 호버는 마우스 같은 정밀 포인터에서만. 터치는 탭 뒤 밑줄이 들러붙는다.
    '(hover: hover) and (pointer: fine)': {
      selectors: {
        [`${textItem}:hover &::after`]: {
          transform: 'scaleX(1)',
          transitionDuration: duration.base,
        },
      },
    },
    // 축소 선호: 밑줄은 전이 없이 즉시 그어지고 걷힌다.
    '(prefers-reduced-motion: reduce)': {
      selectors: {
        '&::after': {
          transition: 'none',
        },
      },
    },
  },
});

// 햄버거. 넓은 화면(768px 이상)에서는 숨는다.
export const hamburger = style({
  display: 'inline-flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: `${HAMBURGER_LINE_GAP}px`,
  width: `${HAMBURGER_SIZE}px`,
  height: `${HAMBURGER_SIZE}px`,
  padding: 0,
  border: 'none',
  background: 'none',
  color: 'inherit',
  cursor: 'pointer',
  touchAction: 'manipulation',
  borderRadius: themeContract.borderRadius.sm,

  selectors: {
    '&:focus-visible': {
      ...focusRing('currentColor'),
    },
  },

  '@media': {
    [mediaQuery.up.md]: {
      display: 'none',
    },
  },
});

export const hamburgerLine = style({
  display: 'block',
  width: `${HAMBURGER_LINE_WIDTH}px`,
  height: `${HAMBURGER_LINE_HEIGHT}px`,
  backgroundColor: 'currentColor',
  transformOrigin: 'center',
  transition: `transform ${duration.slow} ${settle}`,
});

export const hamburgerLineTop = style({
  selectors: {
    [`${hamburger}[aria-expanded="true"] &`]: {
      transform: `translateY(${HAMBURGER_LINE_SHIFT}px) rotate(${HAMBURGER_X_ANGLE}deg)`,
    },
  },
});

export const hamburgerLineBottom = style({
  selectors: {
    [`${hamburger}[aria-expanded="true"] &`]: {
      transform: `translateY(-${HAMBURGER_LINE_SHIFT}px) rotate(-${HAMBURGER_X_ANGLE}deg)`,
    },
  },
});

// 좁은 화면 세로 목록 판. 바 아래에 겹쳐 뜬다(내용을 밀지 않는다). 닫힌 모습이 CSS
// 기본이고, 열고 닫는 것은 GSAP이 opacity·visibility(autoAlpha)와 y를 쓴다.
export const panel = style({
  boxSizing: 'border-box',
  position: 'absolute',
  top: `calc(100% + ${PANEL_GAP})`,
  left: 0,
  right: 0,
  display: 'flex',
  flexDirection: 'column',
  padding: themeContract.spacing[2],
  borderRadius: themeContract.borderRadius.lg,
  boxShadow: themeContract.shadow.md,
  opacity: 0,
  visibility: 'hidden',
  transform: `translateY(${PANEL_OFFSET_Y}px)`,

  '@media': {
    [mediaQuery.up.md]: {
      display: 'none',
    },
  },
});

// 패널 면. transparent 바도 패널은 읽을 수 있는 면이 필요하다.
export const panelVariantStyles = styleVariants({
  default: {
    backgroundColor: themeContract.color.background.default,
    color: themeContract.color.text.primary,
  },
  dark: {
    backgroundColor: themeContract.color.text.primary,
    color: themeContract.color.background.paper,
  },
  transparent: {
    backgroundColor: themeContract.color.background.default,
    color: themeContract.color.text.primary,
  },
});

export const panelItem = style({
  width: '100%',
  justifyContent: 'flex-start',
  padding: themeContract.spacing[3],
  fontSize: themeContract.font.size.base,
});
