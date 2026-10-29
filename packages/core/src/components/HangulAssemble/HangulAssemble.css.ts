import { style } from '@vanilla-extract/css';

// 시각적으로만 숨긴 낭독용 글자가 이 루트를 기준으로 놓이게 한다.
export const root = style({
  position: 'relative',
});

// 글자 칸. 완성 글자가 칸의 크기를 정하고 오린 조각은 그 위에 겹친다.
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

// 오린 조각. 완성 글자와 같은 칸에 같은 글자를 그리고 clip-path로 자모 영역만 남긴다.
// 칸 크기와 줄 높이를 글자와 같게 두어야 맞물린 조각이 완성 글자와 같은 픽셀에 앉는다.
// 영역 좌표는 줄 높이와 무관하게 1em 기준이라 clip-path 쪽(polygonCss)에서 맞춘다.
// 쉬는 상태는 숨김이다(재생 전 흩어진 자리와 display는 JS가 인라인으로 건다).
export const piece = style({
  position: 'absolute',
  inset: 0,
  whiteSpace: 'nowrap',
  display: 'none',
  pointerEvents: 'none',
  userSelect: 'none',
  '@media': {
    print: { display: 'none !important' },
  },
});
