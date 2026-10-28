import { style } from '@vanilla-extract/css';

// 시각적으로만 숨긴 낭독용 글자가 이 루트를 기준으로 놓이게 하고, 글자 칸의 offsetLeft 기준이 된다.
export const root = style({
  position: 'relative',
});

// 글자 칸. transform이 먹으려면 inline-block이어야 한다.
export const cell = style({
  display: 'inline-block',
});
