import { themeContract } from '@taein-ui/core';
import { style } from '@vanilla-extract/css';
import { BLUE, FRAME, INK, MONO, MUTED } from '../DocText';

const { color, spacing, borderRadius } = themeContract;

const COMPACT = '(max-width: 1024px)';
const MOBILE = '(max-width: 640px)';

// 액자: 옅은 회색 틀 안에 흰 상자
export const frame = style({
  display: 'grid',
  gap: spacing[2],
  padding: spacing[2],
  background: FRAME,
  borderRadius: borderRadius.xl,
});

export const frameInner = style({
  position: 'relative',
  display: 'grid',
  placeItems: 'center',
  minHeight: '180px',
  padding: spacing[5],
  background: color.background.default,
  borderRadius: borderRadius.lg,
  overflow: 'hidden',
});

// 카드 속 미니(Stage)가 상자를 채운다. 오버레이와 position: fixed 자손(Snackbar)은 Stage 안에 갇힌다
export const cardInner = style({ padding: 0, minHeight: '220px' });
// 오버레이는 열린 모습이 들어갈 만큼 높다
export const cardInnerTall = style({ minHeight: '280px' });

export const frameFoot = style({
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  padding: `${spacing[1]} ${spacing[2]}`,
});

export const frameTitle = style({
  fontSize: '1rem',
  fontWeight: 600,
  color: INK,
  selectors: { '&:hover': { color: BLUE } },
});

export const no = style({
  fontFamily: MONO,
  fontSize: '0.75rem',
  color: MUTED,
});

// 절 머리: 큰 제목과 옆 숫자
export const sectionHead = style({
  display: 'grid',
  gap: spacing[1],
  margin: `${spacing[20]} 0 ${spacing[6]}`,
  '@media': { [MOBILE]: { margin: `${spacing[12]} 0 ${spacing[4]}` } },
});

export const sectionTitle = style({
  fontSize: '2rem',
  fontWeight: 800,
  letterSpacing: '-0.03em',
  lineHeight: 1.2,
  color: INK,
  wordBreak: 'keep-all',
  '@media': { [MOBILE]: { fontSize: '1.5rem' } },
});

export const count = style({
  marginLeft: spacing[1],
  fontFamily: MONO,
  fontSize: '0.75rem',
  fontWeight: 400,
  verticalAlign: 'super',
  color: MUTED,
});

// 크기가 다른 칸이 섞인 벽. 좁아지면 둘, 더 좁으면 한 줄
export const bento = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gridAutoFlow: 'dense',
  gap: spacing[4],
  '@media': {
    [COMPACT]: {
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
      gap: spacing[3],
    },
    [MOBILE]: { gridTemplateColumns: 'minmax(0, 1fr)' },
  },
});

// 두 칸 배치에서 세로로 긴 칸을 풀어야 마지막 줄에 빈칸이 생기지 않는다
export const tall = style({
  gridRow: 'span 2',
  '@media': { [COMPACT]: { gridRow: 'auto' } },
});
export const tallInner = style({
  minHeight: '424px',
  '@media': { [COMPACT]: { minHeight: '180px' } },
});
export const wideCard = style({
  gridColumn: 'span 2',
  '@media': { [MOBILE]: { gridColumn: 'auto' } },
});
// 2열에서만 넓다. 3열에서는 한 칸
export const wide2Card = style({
  '@media': {
    [COMPACT]: { gridColumn: 'span 2' },
    [MOBILE]: { gridColumn: 'auto' },
  },
});
// 3열에서만 넓다. 2열에서는 한 칸이라 짝이 맞는다
export const wide3Card = style({
  gridColumn: 'span 2',
  '@media': { [COMPACT]: { gridColumn: 'auto' } },
});
