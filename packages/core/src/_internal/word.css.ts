import { style } from '@vanilla-extract/css';

// 글자 효과 컴포넌트(HangulAssemble, BrushText)의 낱말 하나.
// 한국어 낱말이 줄 끝에서 갈리면 안 되어 한 덩어리로 묶는다.
export const word = style({
  whiteSpace: 'nowrap',
});
