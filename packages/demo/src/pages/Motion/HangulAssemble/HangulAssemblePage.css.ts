import { themeContract } from '@taein-ui/core';
import { globalStyle, style } from '@vanilla-extract/css';

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
  // 무대 폭(22rem)에서 마지막 줄에 낱말 하나만 남지 않게 줄 길이를 고르게 나눈다
  textWrap: 'balance',
});

export const stack = style({
  display: 'grid',
  justifyItems: 'center',
  gap: spacing[5],
});

// 움직임 멈춤: 재생 값이 인라인으로 걸려도 완성 글자만 보인다(core의 인쇄 규칙과 같은 방식). core에는 멈춤 prop이 없다
export const still = style({});
globalStyle(`${still} [data-hangul-glyph]`, {
  opacity: '1 !important',
  transform: 'none !important',
});
globalStyle(`${still} [data-hangul-jamo]`, { display: 'none !important' });
