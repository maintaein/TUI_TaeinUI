import { createVar, style, styleVariants } from '@vanilla-extract/css';
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

// minWidth를 0으로 두지 않는다: 내용보다 좁아지면 알약 줄이 왼쪽 제목 위로 넘쳐 그려진다.
// 공간이 모자라면 줄어드는 쪽은 leftSection의 제목(말줄임)이다.
export const centerSection = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: themeContract.spacing[4],
  flex: 1,

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

/**
 * 호버·키보드 포커스·선택된 항목의 옅은 바탕. currentColor라 어두운 바에서도 글자색에
 * 맞는다. 글자 항목(text·dropdown·판 안 링크)과 icon 알약이 같이 쓴다.
 */
export const TINT_HOVER = 'color-mix(in srgb, currentColor 10%, transparent)';
/** 누르는 동안의 바탕(icon 알약). */
export const TINT_PRESS = 'color-mix(in srgb, currentColor 16%, transparent)';

// 글자 항목. 호버·키보드 포커스에서 옅은 바탕이 깔리고, 선택된 항목은 그 바탕이 늘 깔린다.
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
  borderRadius: themeContract.borderRadius.full,
  transition: `background-color ${duration.fast} ${settle}`,

  selectors: {
    // 키보드 포커스는 호버 게이트 밖이다(터치에도 키보드는 있다).
    '&:focus-visible': {
      ...focusRing('currentColor'),
      backgroundColor: TINT_HOVER,
    },
    // 지금 보고 있는 페이지는 바탕이 늘 깔려 있다.
    '&[aria-current="page"]': {
      fontWeight: themeContract.font.weight.semibold,
      backgroundColor: TINT_HOVER,
    },
  },

  '@media': {
    // 호버는 마우스 같은 정밀 포인터에서만. 터치는 탭 뒤 바탕이 들러붙는다.
    '(hover: hover) and (pointer: fine)': {
      selectors: {
        '&:hover': {
          backgroundColor: TINT_HOVER,
        },
      },
    },
    // 축소 선호: 바탕은 전이 없이 바로 깔리고 걷힌다.
    '(prefers-reduced-motion: reduce)': {
      transition: 'none',
    },
  },
});

export const textLabel = style({
  display: 'inline-block',
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

// 좁은 화면 판의 하위 링크 묶음. dropdown의 links 항목은 접기 없이 펼쳐 둔다.
export const panelGroup = style({
  display: 'flex',
  flexDirection: 'column',
});

export const panelGroupLabel = style({
  padding: themeContract.spacing[3],
  fontSize: themeContract.font.size.base,
  fontWeight: themeContract.font.weight.semibold,
});

export const panelSubItem = style({
  paddingLeft: themeContract.spacing[6],
});

// ---------------------------------------------------------------------------
// 알약(navStyle="pill"). 출처는 PillNav(.claude/고도화/ex/PillNav.tsx:228-330)다.
// ---------------------------------------------------------------------------

/** 바깥 알약 높이(px). PillNav의 --nav-h(PillNav.tsx:243)에 가깝고 바 안쪽(44px)에 들어간다. */
export const PILL_NAV_HEIGHT = 40;
/** 바깥 알약 안쪽 여백(px). PillNav.tsx:303의 p-[3px]. */
export const PILL_NAV_PADDING = 3;
/** 알약 사이 간격(px). PillNav의 --pill-gap(PillNav.tsx:246). */
export const PILL_GAP = 3;
// 선택된 항목의 광휘. 값은 Loader의 loaderGlow(Loader.css.ts:18-19)와 같다: 0 0 6px,
// 광휘 색 45%. loaderGlow는 Loader 시험이 그 정의 글자를 잠가 옮기지 못해 같은 값을 둔다.
/** 광휘 번짐 반경(px). */
const GLOW_BLUR_PX = 6;
/** 광휘 색의 진하기(%). */
const GLOW_MIX_PERCENT = 45;
const pillGlow = (color: string): string =>
  `0 0 ${GLOW_BLUR_PX}px color-mix(in srgb, ${color} ${GLOW_MIX_PERCENT}%, transparent)`;

// variant가 면·글자·원 색을 바꾼다. 알약 부품은 이 변수만 읽는다.
const pillFace = createVar();
const pillBase = createVar();
const pillText = createVar();
const pillCircleColor = createVar();
const pillCoverColor = createVar();
const pillGlowColor = createVar();

const pillLightVars = {
  [pillFace]: themeContract.color.surface.hover,
  [pillBase]: themeContract.color.background.default,
  [pillText]: themeContract.color.text.primary,
  [pillCircleColor]: themeContract.color.primary.main,
  [pillCoverColor]: themeContract.color.primary.contrast,
  [pillGlowColor]: themeContract.color.primary.contrast,
};

export const pillVariantStyles = styleVariants({
  default: { vars: pillLightVars },
  // 어두운 바: 바깥 알약은 바보다 한 단계 밝은 어두운 면, 원은 어두운 면 위에서 읽히는 밝은 파랑.
  // 그 위에 얹는 글자는 어두운 색(text.primary)이라 대비가 난다.
  dark: {
    vars: {
      [pillFace]: themeContract.color.text.secondary,
      [pillBase]: themeContract.color.text.primary,
      [pillText]: themeContract.color.text.inverse,
      [pillCircleColor]: themeContract.color.primary.light,
      [pillCoverColor]: themeContract.color.text.primary,
      [pillGlowColor]: themeContract.color.background.paper,
    },
  },
  transparent: { vars: pillLightVars },
});

export const pillNav = style({
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  gap: `${PILL_GAP}px`,
  height: `${PILL_NAV_HEIGHT}px`,
  padding: `${PILL_NAV_PADDING}px`,
  borderRadius: themeContract.borderRadius.full,
  backgroundColor: pillFace,
});

export const pillItem = style({
  boxSizing: 'border-box',
  position: 'relative',
  overflow: 'hidden',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: `${PILL_NAV_HEIGHT - 2 * PILL_NAV_PADDING}px`,
  padding: `0 ${themeContract.spacing[4]}`,
  border: 'none',
  borderRadius: themeContract.borderRadius.full,
  backgroundColor: pillBase,
  color: pillText,
  font: 'inherit',
  fontSize: themeContract.font.size.sm,
  fontWeight: themeContract.font.weight.semibold,
  textDecoration: 'none',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  touchAction: 'manipulation',

  selectors: {
    '&:focus-visible': {
      ...focusRing('currentColor'),
    },
  },
});

// 위치·크기·모양만 정한다. 지름·bottom·scale·기준점은 JS가 잰 뒤 쓴다(PillNav.tsx:53-73).
export const pillCircle = style({
  position: 'absolute',
  left: '50%',
  bottom: 0,
  display: 'block',
  borderRadius: themeContract.borderRadius.full,
  backgroundColor: pillCircleColor,
  pointerEvents: 'none',
  zIndex: 1,
});

export const pillLabelStack = style({
  position: 'relative',
  display: 'inline-block',
  lineHeight: 1,
  zIndex: 2,
});

export const pillLabel = style({
  position: 'relative',
  display: 'inline-block',
  lineHeight: 1,
});

// 덮는 글자. 레이아웃 전에는 투명이라 깜박이지 않는다. 움직임은 GSAP이 맡는다.
export const pillCover = style({
  position: 'absolute',
  left: 0,
  top: 0,
  display: 'inline-block',
  lineHeight: 1,
  color: pillCoverColor,
  opacity: 0,
  zIndex: 3,

  selectors: {
    // 선택된 항목은 늘 채워져 있고, 덮는 글자에 움직이지 않는 광휘가 걸린다.
    [`${pillItem}[aria-current="page"] &`]: {
      textShadow: pillGlow(pillGlowColor),
    },
  },
});

// ---------------------------------------------------------------------------
// 드롭다운(navStyle="dropdown")
// ---------------------------------------------------------------------------

/** 드롭다운 판 최소 폭. 짧은 하위 링크도 누르기 쉬운 폭을 갖는다. */
const DROPDOWN_MIN_WIDTH = '10rem';
/**
 * 드롭다운 항목 버튼의 높이(px). 버튼은 바 안에서 세로 가운데라, 높이를 정해 두어야
 * 버튼 아래 끝에서 판 위 끝까지의 틈(아래 다리의 높이)을 식으로 낼 수 있다.
 */
export const DROPDOWN_ITEM_HEIGHT = 36;
/** 판 위 끝에서 버튼 아래 끝까지: 판과 바 사이 간격 + 바 아래쪽 남는 높이의 절반 */
const DROPDOWN_BRIDGE_HEIGHT = `calc(${PANEL_GAP} + ${(BAR_HEIGHT - DROPDOWN_ITEM_HEIGHT) / 2}px)`;

export const dropdownTrigger = style({
  height: `${DROPDOWN_ITEM_HEIGHT}px`,
});

// 슬롯은 위치를 잡지 않는다. 그래야 absolute인 판의 기준이 슬롯이 아니라 바가 되어
// "바 아래 spacing[2]"가 된다(가로는 static position이 항목 왼쪽을 준다).
export const dropdownSlot = style({
  display: 'flex',
});

export const dropdownChevron = style({
  display: 'inline-flex',
  marginLeft: themeContract.spacing[1],
  transition: `transform ${duration.base} ${settle}`,

  selectors: {
    [`${textItem}[aria-expanded="true"] &`]: {
      transform: 'rotate(180deg)',
    },
  },

  '@media': {
    '(prefers-reduced-motion: reduce)': {
      transition: 'none',
    },
  },
});

export const dropdownPanel = style({
  boxSizing: 'border-box',
  position: 'absolute',
  top: `calc(100% + ${PANEL_GAP})`,
  left: 'auto',
  minWidth: DROPDOWN_MIN_WIDTH,
  margin: 0,
  padding: themeContract.spacing[2],
  listStyle: 'none',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: themeContract.borderRadius.md,
  boxShadow: themeContract.shadow.md,
  opacity: 0,
  visibility: 'hidden',
  transform: `translateY(${PANEL_OFFSET_Y}px)`,

  selectors: {
    // 보이지 않는 다리. 마우스가 버튼에서 판으로 틈을 지나는 동안 슬롯을 나간 것으로
    // 치지 않게 판 위쪽을 버튼 아래 끝까지 이어 붙인다. visibility를 판에서 물려받아
    // 판이 닫혀 있으면 다리도 숨는다. 타이머는 쓰지 않는다.
    '&::before': {
      content: '""',
      position: 'absolute',
      bottom: '100%',
      left: 0,
      right: 0,
      height: DROPDOWN_BRIDGE_HEIGHT,
    },
  },
});

export const dropdownLink = style({
  width: '100%',
  justifyContent: 'flex-start',
  padding: `${themeContract.spacing[2]} ${themeContract.spacing[3]}`,
});

// ---------------------------------------------------------------------------
// 카드 펼침(navStyle="cards"). 출처는 CardNav(.claude/고도화/ex/CardNav.tsx)다.
// 바(60px, 흐름 안) 뒤에 면 하나가 깔리고, 햄버거를 누르면 면만 아래로 자란다.
// ---------------------------------------------------------------------------

/** 넓은 화면에서 펼친 면의 최소 높이(px). CardNav의 260(:77 calculateHeight 기본값). */
export const CARDS_OPEN_HEIGHT = 260;
/** 카드가 솟기 전 아래로 내려가 있는 거리(px). CardNav.tsx:96의 y: 50. */
export const CARDS_RISE_Y = 50;
/** 카드 사이 시차(초). CardNav.tsx:96의 stagger: 0.08. */
export const CARDS_STAGGER = 0.08;
/**
 * 카드가 면 트윈의 어디에서 시작하는가(0~1). CardNav는 0.4초 트윈이 끝나기 0.1초
 * 전('-=0.1', :96)에 시작하니 3/4 지점이다.
 */
export const CARDS_START_RATIO = 3 / 4;

// 바에서 배경과 그림자를 걷고 쌓임 맥락을 만든다. 면(z-index -1)이 이 맥락 안에서 바의
// 줄 뒤에 깔린다. variantStyles보다 뒤에 선언해야 같은 특이도에서 배경을 덮는다.
export const barCards = style({
  isolation: 'isolate',
  backgroundColor: 'transparent',
  boxShadow: 'none',
});

// 햄버거는 모든 폭에서 보인다. hamburger의 up.md 숨김을 되돌린다(뒤에 선언).
export const hamburgerAlways = style({
  '@media': {
    [mediaQuery.up.md]: {
      display: 'inline-flex',
    },
  },
});

// 카드 색. 카드 바탕·카드 글자를 면의 variant가 채운다.
const cardFace = createVar();
const cardText = createVar();

// 자라는 면. 높이는 쉴 때 BAR_HEIGHT이고 GSAP이 키운다. absolute라 header의 높이와
// 문서 흐름은 바뀌지 않는다. 아래 cardsVariantStyles보다 먼저 선언해야 transparent가 그림자를 덮는다.
export const cardsSurface = style({
  boxSizing: 'border-box',
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: `${BAR_HEIGHT}px`,
  zIndex: -1,
  overflow: 'hidden',
  borderRadius: themeContract.borderRadius.lg,
  boxShadow: themeContract.shadow.md,
});

// 면은 바의 variant 색을 대신 그린다. transparent는 면이 투명하고 그림자가 없다.
export const cardsVariantStyles = styleVariants({
  default: {
    vars: {
      [cardFace]: themeContract.color.surface.hover,
      [cardText]: themeContract.color.text.primary,
    },
    backgroundColor: themeContract.color.background.default,
    color: themeContract.color.text.primary,
  },
  dark: {
    vars: {
      [cardFace]: themeContract.color.text.secondary,
      [cardText]: themeContract.color.text.inverse,
    },
    backgroundColor: themeContract.color.text.primary,
    color: themeContract.color.background.paper,
  },
  transparent: {
    vars: {
      [cardFace]: themeContract.color.surface.hover,
      [cardText]: themeContract.color.text.primary,
    },
    backgroundColor: 'transparent',
    boxShadow: 'none',
    color: themeContract.color.text.primary,
  },
});

// 카드 층. 높이는 잰 값으로 고정(JS가 인라인으로 쓴다)이라 면이 자라도 카드가 다시
// 배치되지 않는다. 닫힌 모습이 CSS 기본이다.
export const cardsLayer = style({
  boxSizing: 'border-box',
  position: 'absolute',
  top: `${BAR_HEIGHT}px`,
  left: 0,
  right: 0,
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'stretch',
  gap: themeContract.spacing[3],
  padding: themeContract.spacing[2],
  visibility: 'hidden',

  '@media': {
    [mediaQuery.down.md]: {
      flexDirection: 'column',
      gap: themeContract.spacing[2],
    },
  },
});

export const card = style({
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  flex: '1 1 0',
  minWidth: 0,
  padding: `${themeContract.spacing[3]} ${themeContract.spacing[4]}`,
  // 바 반경에서 층 안쪽 여백을 뺀 동심원(CardNav.tsx:218의 rounded-[calc(0.75rem-0.2rem)]).
  borderRadius: `calc(${themeContract.borderRadius.lg} - ${themeContract.spacing[2]})`,
  backgroundColor: cardFace,
  color: cardText,

  '@media': {
    [mediaQuery.down.md]: {
      flex: 'none',
      minHeight: `${BAR_HEIGHT}px`,
    },
  },
});

export const cardTitle = style({
  margin: 0,
  fontSize: themeContract.font.size.xl,
  fontWeight: themeContract.font.weight.medium,
  lineHeight: themeContract.font.lineHeight.tight,

  '@media': {
    [mediaQuery.down.md]: {
      fontSize: themeContract.font.size.lg,
    },
  },
});

export const cardLinks = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  margin: 0,
  marginTop: 'auto',
  padding: 0,
  listStyle: 'none',
});

// 카드 안 링크와 제목 링크가 나눠 쓰는 누르는 면: 글자색을 잇고, 호버(정밀 포인터)에서
// opacity 0.75(CardNav.tsx:233의 hover:opacity-75).
const cardPress = {
  // 글자 크기와 링크 사이 2px은 그대로 두고 누르는 높이만 24px로(WCAG 2.5.8, Chip 선례).
  minHeight: '24px',
  padding: 0,
  border: 'none',
  background: 'none',
  color: 'inherit',
  fontFamily: 'inherit',
  textAlign: 'left',
  textDecoration: 'none',
  cursor: 'pointer',
  touchAction: 'manipulation',
  transition: `opacity ${duration.base} ${settle}`,

  selectors: {
    '&:focus-visible': {
      ...focusRing('currentColor'),
    },
  },

  '@media': {
    '(hover: hover) and (pointer: fine)': {
      selectors: {
        '&:hover': {
          opacity: 0.75,
        },
      },
    },
    '(prefers-reduced-motion: reduce)': {
      transition: 'none',
    },
  },
} as const;

export const cardLink = style({
  ...cardPress,
  display: 'inline-flex',
  alignItems: 'center',
  gap: themeContract.spacing[1],
  fontSize: themeContract.font.size.base,
});

// links가 없는 항목: 제목 자리에 놓인 링크. cardTitle의 글자 크기·굵기를 그대로 쓴다.
export const cardTitleLink = style({
  ...cardPress,
  alignSelf: 'flex-start',
});
