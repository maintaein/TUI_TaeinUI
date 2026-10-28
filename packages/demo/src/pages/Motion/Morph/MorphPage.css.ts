import { themeContract } from '@taein-ui/core';
import { style } from '@vanilla-extract/css';

const { color, palette, spacing, font } = themeContract;

// 카드 셋이 서는 무대. 상세 패널은 이 상자 전체를 덮는 자리로 자란다
export const board = style({
  position: 'relative',
  width: '100%',
  height: '11rem',
});

export const row = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  alignItems: 'center',
  gap: spacing[2],
  height: '100%',
});

// 카드가 빠진 칸도 열을 지킨다(빈 칸이 이웃을 끌어당기지 않게 칸마다 열을 정한다)
export const cell = style({ minWidth: 0 });

// 상세 패널이 앉는 자리. Morph 래퍼가 이 자리를 차지하고 그 래퍼가 카드 모양에서 커진다
export const panelSlot = style({
  position: 'absolute',
  inset: 0,
});

export const cardFace = style({
  display: 'grid',
  placeItems: 'center',
  gap: spacing[1],
  height: '4.5rem',
  fontFamily: font.family.sans,
  fontSize: font.size.sm,
  fontWeight: font.weight.semibold,
  color: palette.primary[900],
});

export const panel = style({
  height: '100%',
});

export const panelHead = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing[2],
  padding: `${spacing[2]} ${spacing[3]}`,
  fontFamily: font.family.sans,
  fontSize: font.size.base,
  fontWeight: font.weight.semibold,
  color: color.text.primary,
});

export const panelBody = style({
  margin: 0,
  padding: `0 ${spacing[3]} ${spacing[3]}`,
  fontFamily: font.family.sans,
  fontSize: font.size.sm,
  color: color.text.secondary,
});
