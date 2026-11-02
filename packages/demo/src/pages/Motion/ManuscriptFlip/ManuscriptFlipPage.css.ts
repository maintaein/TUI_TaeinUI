import { themeContract } from '@taein-ui/core';
import { style } from '@vanilla-extract/css';

const { color, font, spacing, borderRadius } = themeContract;

export const stack = style({
  display: 'grid',
  justifyItems: 'center',
  gap: spacing[4],
});

// 가리키면 넘어가는 카드. 상자는 이 폭을 채우고 높이는 면이 정한다
export const card = style({
  width: '16rem',
  borderRadius: borderRadius.lg,
  overflow: 'hidden',
});

// 면은 상자를 꽉 채워야 칸 경계에서 바탕이 비치지 않는다
const face = {
  boxSizing: 'border-box',
  height: '100%',
  minHeight: '12rem',
  display: 'grid',
  alignContent: 'center',
  justifyItems: 'center',
  gap: spacing[3],
  padding: spacing[5],
  textAlign: 'center',
  wordBreak: 'keep-all',
} as const;

// 사진 자리. 사진 대신 큰 글자로 보인다
export const photo = style({
  ...face,
  backgroundColor: color.primary.main,
  color: color.primary.contrast,
});

export const photoWord = style({
  margin: 0,
  fontFamily: font.family.sans,
  fontSize: font.size['3xl'],
  fontWeight: font.weight.bold,
});

export const description = style({
  ...face,
  backgroundColor: color.background.paper,
  color: color.text.primary,
});

export const title = style({
  margin: 0,
  fontFamily: font.family.sans,
  fontSize: font.size.lg,
  fontWeight: font.weight.bold,
});

export const text = style({
  margin: 0,
  fontFamily: font.family.sans,
  fontSize: font.size.sm,
  color: color.text.secondary,
});
