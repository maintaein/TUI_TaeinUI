import { style } from '@vanilla-extract/css';

// 크기는 글자 크기를 따른다(1em). IconButton의 아이콘 칸이 fontSize로 크기를 정하므로 그대로 넣으면 맞는다.
// 색은 SVG 속성의 currentColor라 담는 단추의 글자색을 따른다
export const icon = style({
  width: '1em',
  height: '1em',
  flexShrink: 0,
});
