import { themeContract } from '@taein-ui/core';
import { globalStyle, style } from '@vanilla-extract/css';
import { BLUE, INK, LINE, MONO, MUTED } from '../DocText';

const { color, spacing } = themeContract;

const MOBILE = '(max-width: 640px)';

export const list = style({ display: 'grid', borderTop: `1px solid ${LINE}` });

export const item = style({
  display: 'grid',
  gridTemplateColumns: '180px minmax(0, 1fr)',
  gap: spacing[6],
  padding: `${spacing[5]} 0`,
  borderBottom: `1px solid ${LINE}`,
  '@media': {
    [MOBILE]: {
      gridTemplateColumns: 'minmax(0, 1fr)',
      gap: spacing[2],
      padding: `${spacing[4]} 0`,
    },
  },
});

export const name = style({
  display: 'flex',
  alignItems: 'baseline',
  flexWrap: 'wrap',
  gap: spacing[2],
  fontFamily: MONO,
  fontSize: '0.9375rem',
  fontWeight: 600,
  color: BLUE,
});

export const required = style({
  fontSize: '0.75rem',
  fontWeight: 600,
  color: color.error.main,
  fontFamily: 'inherit',
});

export const body = style({ display: 'grid', gap: spacing[2], margin: 0 });

export const meta = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'baseline',
  columnGap: spacing[2],
  rowGap: spacing[1],
  fontSize: '0.875rem',
  color: MUTED,
});

globalStyle(`${meta} code`, {
  fontFamily: MONO,
  fontSize: '0.8125rem',
  color: INK,
  overflowWrap: 'anywhere',
});

export const key = style({
  fontWeight: 600,
  selectors: { '&:not(:first-child)': { marginLeft: spacing[2] } },
});
