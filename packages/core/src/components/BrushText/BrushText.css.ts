import { style } from '@vanilla-extract/css';

// 시각적으로만 숨긴 낭독용 글자가 이 루트를 기준으로 놓이게 한다.
export const root = style({
  position: 'relative',
});

// 글자 칸. 완성 글자가 칸의 크기를 정하고 쓰는 동안만 캔버스가 그 위에 겹친다.
export const cell = style({
  position: 'relative',
  display: 'inline-block',
});

// 인쇄에서는 재생 중이던 인라인 값을 !important로 이겨 언제나 완성 문장만 보이게 한다.
export const glyph = style({
  display: 'inline-block',
  '@media': {
    print: { opacity: '1 !important' },
  },
});

// 잉크를 재서 획을 따라 그리는 캔버스(JS가 쓰는 동안만 칸에 붙인다). 글자 칸 크기에 맞춰 늘어난다.
export const canvas = style({
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  pointerEvents: 'none',
  userSelect: 'none',
  '@media': {
    print: { display: 'none !important' },
  },
});
