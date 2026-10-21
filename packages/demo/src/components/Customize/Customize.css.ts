import { themeContract } from '@taein-ui/core';
import { style } from '@vanilla-extract/css';
import { MONO, MUTED } from '../DocText';

const { spacing } = themeContract;

export const customize = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr)',
  gap: spacing[4],
});

export const control = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr)',
  gap: spacing[2],
});

// prop 이름은 코드에 쓰는 그대로 둔다(대문자로 바꾸면 buttonStyle이 BUTTONSTYLE이 된다)
export const controlLabel = style({
  fontFamily: MONO,
  fontSize: '0.8125rem',
  color: MUTED,
});

export const switches = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(124px, 1fr))',
  gap: `${spacing[3]} ${spacing[4]}`,
});
