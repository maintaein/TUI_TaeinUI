import { themeContract } from '@taein-ui/core';
import { style } from '@vanilla-extract/css';

const { color, font, spacing } = themeContract;

// 단추 다섯 개가 한 줄로 서고, 좁으면 줄을 바꾼다
export const row = style({
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
  alignItems: 'flex-start',
  gap: spacing[6],
});

export const item = style({
  display: 'grid',
  justifyItems: 'center',
  gap: spacing[2],
});

export const caption = style({
  margin: 0,
  fontFamily: font.family.sans,
  fontSize: font.size.sm,
  color: color.text.secondary,
  wordBreak: 'keep-all',
  textAlign: 'center',
});
