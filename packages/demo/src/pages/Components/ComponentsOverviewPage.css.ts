import { themeContract } from '@taein-ui/core';
import { style } from '@vanilla-extract/css';
import { FRAME, LINE, MUTED } from '../../components/DocText';

const { color, spacing, borderRadius } = themeContract;

const MOBILE = '(max-width: 640px)';

export const page = style({
  maxWidth: '1200px',
  margin: '0 auto',
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

export const empty = style({
  margin: `${spacing[20]} 0`,
  textAlign: 'center',
  color: MUTED,
});

// 머리 아래에 놓였다가 스크롤하면 알약 헤더 밑에 붙어 따라온다. 쉬는 자리에서는 카드를 가리지 않는다
export const dock = style({
  position: 'sticky',
  top: '76px',
  zIndex: 15,
  display: 'flex',
  alignItems: 'center',
  gap: spacing[2],
  width: 'fit-content',
  maxWidth: '100%',
  margin: `${spacing[6]} 0`,
  padding: spacing[2],
  background: color.background.default,
  border: `1px solid ${LINE}`,
  borderRadius: borderRadius.xl,
  overflowX: 'auto',
  scrollbarWidth: 'none',
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
