import { style } from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';

const { color, shadow } = themeContract;

// 두 면과 타일 층이 한 격자 칸에 겹친다. 높이는 더 큰 면이 정하고, 폭은 부모를 채운다.
// 상자에 안쪽 여백을 주면 타일 층(칸 격자)과 면의 경계가 어긋나므로 여백은 면 안에 둔다.
export const root = style({
  display: 'grid',
  width: '100%',
});

export const face = style({
  gridArea: '1 / 1',
  minWidth: 0,
});

// 넘김이 끝난 뒤 보이지 않는 면. 접근성 트리에서도 빠진다
export const hidden = style({ visibility: 'hidden' });

// 칸 타일의 층. 포인터를 받지 않고 면 위에 얹힌다
export const tiles = style({
  gridArea: '1 / 1',
  position: 'relative',
  pointerEvents: 'none',
  userSelect: 'none',
  '@media': { print: { display: 'none' } },
});

// 얇은 무지 종이 한 장. 평소엔 투명하고 타임라인이 칸 위에서 세로축으로 돌리며 잠깐 드러낸다.
// 위치와 크기는 칸 수에서 퍼센트로 정한다(JS가 인라인으로 준다).
export const tile = style({
  position: 'absolute',
  boxSizing: 'border-box',
  opacity: 0,
  backgroundColor: color.surface.default,
  boxShadow: shadow.sm,
});
