import { style } from '@vanilla-extract/css';

// 시각적으로만 숨기는 글자. display: none·visibility: hidden은 접근성 트리에서도
// 지워져 쓸 수 없다. Loader·Snackbar·SegmentedButtons·HangulAssemble이 함께 쓴다.
export const visuallyHidden = style({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
});
