import { themeContract } from '@taein-ui/core';
import { globalStyle, style } from '@vanilla-extract/css';
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

export const chips = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: spacing[2],
});

// prop 이름은 코드에 쓰는 그대로 둔다(대문자로 바꾸면 buttonStyle이 BUTTONSTYLE이 된다)
const nameTag = {
  fontFamily: MONO,
  fontSize: '0.8125rem',
  fontWeight: 400,
  lineHeight: 'inherit',
  color: MUTED,
} as const;

export const controlLabel = style(nameTag);

// 글자 칸과 켜기 칸의 이름은 core가 그리는 label이다. 요소를 하나 더 두지 않고 같은 이름표 모양으로 덮는다
export const field = style({});
globalStyle(`${field} label`, nameTag);

export const switches = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(124px, 1fr))',
  gap: `${spacing[3]} ${spacing[4]}`,
});

globalStyle(`${switches} label > span:first-child`, nameTag);
