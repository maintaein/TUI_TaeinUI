import { themeContract } from '@taein-ui/core';
import { style } from '@vanilla-extract/css';

const { color } = themeContract;

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

// 대본의 커서가 문장 너비만큼만 훑도록 상자를 문장에 맞춘다
export const track = style({
  width: 'fit-content',
  maxWidth: '100%',
});
