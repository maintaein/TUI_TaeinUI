import { style } from '@vanilla-extract/css';

// 시각적으로만 숨긴 낭독용 글자가 이 루트를 기준으로 놓이게 한다.
export const root = style({
  position: 'relative',
});

// 글자 칸. 완성 글자가 칸의 크기를 정하고 자모 조각은 그 위에 겹친다.
export const cell = style({
  position: 'relative',
  display: 'inline-block',
});

// 인쇄에서는 재생 중이던 인라인 값을 !important로 이겨 언제나 완성 문장만 보이게 한다.
export const glyph = style({
  display: 'inline-block',
  '@media': {
    print: { opacity: '1 !important', transform: 'none !important' },
  },
});

// 자모 조각. 쉬는 상태는 투명이다(재생 전 흩어진 자리와 투명도는 JS가 인라인으로 건다).
export const jamo = style({
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  opacity: 0,
  pointerEvents: 'none',
  userSelect: 'none',
  '@media': {
    print: { opacity: '0 !important' },
  },
});
