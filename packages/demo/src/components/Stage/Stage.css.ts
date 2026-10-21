import { themeContract } from '@taein-ui/core';
import { style } from '@vanilla-extract/css';
import { FRAME, INK } from '../DocText';

const { color, spacing, borderRadius } = themeContract;

export const stage = style({
  position: 'relative',
  display: 'grid',
  placeItems: 'center',
  overflow: 'hidden',
  // position: fixed 자손(오버레이)의 기준이 된다. core container에 이 요소를 넘기면 무대 안에 갇혀 뜬다
  contain: 'layout',
  background: color.background.default,
  borderRadius: borderRadius.lg,
});

export const tools = style({
  position: 'absolute',
  top: spacing[3],
  right: spacing[3],
  zIndex: 2,
  display: 'flex',
  padding: spacing[1],
  background: FRAME,
  borderRadius: borderRadius.md,
});

// 부모 폭을 채우는 컴포넌트(fullWidth)가 보이도록 폭을 정해 두고, 그 안에서 가운데에 놓는다
export const inner = style({
  position: 'relative',
  zIndex: 0,
  display: 'grid',
  justifyItems: 'center',
  width: 'min(calc(100% - 2rem), 22rem)',
});

export const cursor = style({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '24px',
  height: '24px',
  color: INK,
  pointerEvents: 'none',
  zIndex: 1,
  visibility: 'hidden',
  // lucide MousePointer2의 화살촉은 24px 상자의 (4,4)
  marginLeft: '-4px',
  marginTop: '-4px',
});
