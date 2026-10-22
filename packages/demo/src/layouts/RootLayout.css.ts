import { themeContract } from '@taein-ui/core';
import { style } from '@vanilla-extract/css';

const { color, spacing, borderRadius, animation, zIndex } = themeContract;

// 서랍과 한 줄 배치로 바뀌는 폭. hooks/useMediaQuery의 breakpoints.compact와 같다
const COMPACT = '(max-width: 1024px)';
const MOBILE = '(max-width: 640px)';

const INK = color.text.primary;
const MUTED = color.text.secondary;
const FRAME = color.surface.hover;
const LINE = color.border.default;
const BLUE = color.primary.main;
const MONO =
  'ui-monospace, SFMono-Regular, Menlo, Consolas, "Pretendard Variable", monospace';

const SLIDE = `transform ${animation.duration.base} ${animation.easing.settle}`;

export const skipToContent = style({
  position: 'absolute',
  top: '-100%',
  left: '1rem',
  zIndex: 9999,
  padding: '0.75rem 1.5rem',
  backgroundColor: BLUE,
  color: color.primary.contrast,
  fontWeight: 600,
  fontSize: '0.875rem',
  borderRadius: '0 0 0.5rem 0.5rem',
  textDecoration: 'none',
  selectors: {
    '&:focus': {
      top: 0,
      outline: `2px solid ${color.border.focus}`,
      outlineOffset: '2px',
    },
  },
});

// 한국어 줄바꿈: 어절 단위로 끊고, 끊을 곳이 없는 긴 영문 토큰만 넘칠 때 자른다
export const page = style({
  minHeight: '100vh',
  paddingTop: '88px',
  // 붙박이 판이 펴지면 왼쪽 칸이 벌어져 본문을 민다(칸 폭 전이라 margin을 움직이지 않는다)
  display: 'grid',
  gridTemplateColumns: '0px minmax(0, 1fr)',
  alignContent: 'start',
  transition: `grid-template-columns ${animation.duration.base} ${animation.easing.settle}`,
  backgroundColor: color.background.default,
  color: INK,
  wordBreak: 'keep-all',
  overflowWrap: 'break-word',
  '@media': { [MOBILE]: { paddingTop: '80px' } },
});

// 본문
export const main = style({
  gridColumn: 2,
  padding: '0 2rem 2rem',
  '@media': { [COMPACT]: { padding: '0 1rem 1rem' } },
});

export const pageDocked = style({
  gridTemplateColumns: '280px minmax(0, 1fr)',
});

// ── 떠 있는 알약 헤더 ────────────────────────────────────────
export const pill = style({
  position: 'fixed',
  top: spacing[3],
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: zIndex.sticky,
  display: 'flex',
  alignItems: 'center',
  gap: spacing[4],
  width: 'min(760px, calc(100% - 24px))',
  height: '52px',
  padding: `0 ${spacing[2]}`,
  background: FRAME,
  border: `1px solid ${LINE}`,
  borderRadius: borderRadius.lg,
});

export const brand = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[2],
  fontWeight: 800,
  color: INK,
});

export const brandLogo = style({ height: '24px', width: 'auto' });

export const pillLinks = style({
  display: 'flex',
  gap: spacing[4],
  marginLeft: 'auto',
  // 좁은 화면에서는 같은 링크가 서랍 안에 있다
  '@media': { [MOBILE]: { display: 'none' } },
});

export const link = style({
  fontSize: '0.875rem',
  color: MUTED,
  selectors: {
    '&:hover': { color: INK },
    '&[aria-current="page"]': { color: INK, fontWeight: 600 },
  },
});

export const keyHint = style({ '@media': { [MOBILE]: { display: 'none' } } });

export const keyBtn = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: spacing[1],
  minWidth: '36px',
  height: '36px',
  padding: `0 ${spacing[2]}`,
  border: 0,
  borderRadius: borderRadius.base,
  background: color.background.default,
  fontFamily: MONO,
  fontSize: '0.75rem',
  color: INK,
  cursor: 'pointer',
  // 좁은 화면에서는 링크가 빠지므로 오른쪽 끝으로 민다
  '@media': { [MOBILE]: { marginLeft: 'auto' } },
});

// ── 탐색: 넓은 화면의 문서 쪽은 붙박이 판(햄버거로 접고 편다), 그 밖에는 덮는 서랍 ──
export const side = style({
  position: 'fixed',
  top: '88px',
  bottom: spacing[4],
  left: spacing[4],
  width: '248px',
  padding: `${spacing[6]} ${spacing[4]} ${spacing[6]} ${spacing[3]}`,
  background: FRAME,
  borderRadius: borderRadius.xl,
  overflowY: 'auto',
  zIndex: zIndex.dropdown,
  transition: SLIDE,
});

// 접힌 판·닫힌 서랍은 왼쪽 밖으로 밀어 둔다(inert라 포커스도 못 들어간다)
export const offscreen = style({
  transform: 'translateX(calc(-100% - 32px))',
});

export const drawer = style({
  top: spacing[3],
  bottom: spacing[3],
  left: spacing[3],
  width: 'min(300px, calc(100vw - 48px))',
  paddingTop: spacing[3],
  zIndex: zIndex.modal,
  border: `1px solid ${LINE}`,
});

export const drawerHead = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `0 0 ${spacing[4]} ${spacing[3]}`,
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: MUTED,
});

export const drawerFoot = style({
  display: 'flex',
  gap: spacing[4],
  padding: `${spacing[6]} 0 0 ${spacing[3]}`,
});

export const backdrop = style({
  position: 'fixed',
  inset: 0,
  zIndex: zIndex.overlay,
  background: color.overlay.scrim,
  opacity: 0,
  pointerEvents: 'none',
  transition: `opacity ${animation.duration.base} ${animation.easing.settle}`,
});

export const backdropOn = style({ opacity: 1, pointerEvents: 'auto' });

// ── 눈금자 사이드바 ──────────────────────────────────────────
export const ruler = style({
  display: 'grid',
  gap: spacing[5],
  listStyle: 'none',
});

export const rulerGroup = style({ display: 'grid', gap: '2px' });

export const rulerHead = style({
  paddingLeft: '44px',
  marginBottom: spacing[1],
  fontSize: '0.75rem',
  fontWeight: 600,
  lineHeight: 1.4,
  color: MUTED,
});

export const rulerItem = style({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  gap: spacing[2],
  height: '28px',
  paddingLeft: '44px',
  fontSize: '0.875rem',
  color: MUTED,
  transition: `color ${animation.duration.fast} ${animation.easing.settle}, padding ${animation.duration.base} ${animation.easing.settle}`,
  selectors: {
    // 눈금: 짧은 가로선. 지금 페이지는 길고 파랗다
    '&::before': {
      content: '""',
      position: 'absolute',
      left: 0,
      top: '50%',
      width: '52px',
      height: '1px',
      background: LINE,
      // 28px 눈금을 52px 눈금의 가로 배율로 그려 폭 대신 transform으로 늘인다
      transform: 'scaleX(0.5385)',
      transformOrigin: 'left',
      transition: `transform ${animation.duration.base} ${animation.easing.settle}, background-color ${animation.duration.fast} ${animation.easing.settle}`,
    },
    '&:hover': { color: INK },
    '&[aria-current="page"]': { color: BLUE, paddingLeft: '64px' },
    '&[aria-current="page"]::before': {
      transform: 'scaleX(1)',
      background: BLUE,
    },
  },
});

export const rulerNo = style({
  fontFamily: MONO,
  fontSize: '0.75rem',
  minWidth: '18px',
});

// ── 검색 모달 ───────────────────────────────────────────────
export const searchBody = style({ padding: spacing[4] });
