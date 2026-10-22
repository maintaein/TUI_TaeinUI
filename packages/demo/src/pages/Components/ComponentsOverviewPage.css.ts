import { themeContract } from '@taein-ui/core';
import { style } from '@vanilla-extract/css';
import { FRAME, LINE, MUTED } from '../../components/DocText';

const { color, spacing, borderRadius } = themeContract;

const MOBILE = '(max-width: 640px)';

export const page = style({
  maxWidth: '1200px',
  margin: '0 auto',
  // 떠 있는 찾기 막대가 마지막 카드를 가리지 않을 만큼 비워 둔다
  paddingBottom: '120px',
});

export const head = style({
  display: 'grid',
  gap: spacing[2],
  padding: `${spacing[12]} 0 0`,
});

export const total = style({
  display: 'grid',
  gap: spacing[2],
  fontSize: 'clamp(3.5rem, 12vw, 5rem)',
});

// h1 안의 꼬리표는 본문 크기로 되돌린다
export const tag = style({
  fontSize: '0.8125rem',
  fontWeight: 600,
  letterSpacing: 0,
  lineHeight: 1.4,
  color: MUTED,
});

export const empty = style({
  margin: `${spacing[20]} 0`,
  textAlign: 'center',
  color: MUTED,
});

// 화면 아래 떠 있는 찾기 막대
export const dock = style({
  position: 'fixed',
  bottom: spacing[6],
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 15,
  display: 'flex',
  alignItems: 'center',
  gap: spacing[2],
  padding: spacing[2],
  background: color.background.default,
  border: `1px solid ${LINE}`,
  borderRadius: borderRadius.xl,
  maxWidth: 'calc(100% - 32px)',
  overflowX: 'auto',
  scrollbarWidth: 'none',
  '@media': {
    [MOBILE]: {
      left: spacing[3],
      right: spacing[3],
      transform: 'none',
      maxWidth: 'none',
      bottom: spacing[4],
    },
  },
});

export const search = style({
  flexShrink: 0,
  width: '220px',
  height: '36px',
  padding: `0 ${spacing[3]}`,
  border: 0,
  borderRadius: borderRadius.md,
  background: FRAME,
  font: 'inherit',
  fontSize: '0.875rem',
  '@media': { [MOBILE]: { width: '150px' } },
});
