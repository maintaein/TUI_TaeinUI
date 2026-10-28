import { themeContract } from '@taein-ui/core';
import { style } from '@vanilla-extract/css';

const { color, spacing } = themeContract;

// as가 h1이든 p든 무대 속 글자는 h2 크기로 같게 보인다(as는 의미만 바꾼다)
export const sentence = style({
  margin: 0,
  fontSize: '1.75rem',
  fontWeight: 700,
  lineHeight: 1.4,
  letterSpacing: '-0.02em',
  color: color.text.primary,
  textAlign: 'center',
  wordBreak: 'keep-all',
});

export const stack = style({
  display: 'grid',
  justifyItems: 'center',
  gap: spacing[5],
});
