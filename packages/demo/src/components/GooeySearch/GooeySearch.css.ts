import { themeContract } from '@taein-ui/core';
import { keyframes, style } from '@vanilla-extract/css';

const { color, spacing, borderRadius, animation, shadow, font } = themeContract;
const REDUCED = '(prefers-reduced-motion: reduce)';
const MOBILE = '(max-width: 640px)';
const SIZE = spacing[10];
const END = `calc(100% - ${SIZE})`;
const INPUT_WIDTH = `calc(100% - ${SIZE} - ${spacing[4]})`;
// 원본의 느린 출발과 분리 비율에 맞춰 pill 800ms, 공 1000ms, 입력 지연 400ms를 slower에서 유도한다.
const PILL_MOVE = `calc(${animation.duration.slower} * 1.6) ${animation.easing.drift}`;
const BALL_MOVE = `calc(${animation.duration.slower} * 2) ${animation.easing.drift}`;
const fadeIn = keyframes({ from: { opacity: 0 }, to: { opacity: 1 } });

export const root = style({
  position: 'relative',
  flex: 1,
  minWidth: SIZE,
  height: SIZE,
  '@media': {
    [MOBILE]: {
      selectors: {
        '&[data-open="true"]': {
          position: 'absolute',
          left: spacing[2],
          right: spacing[2],
        },
      },
    },
  },
});

export const filterDefinition = style({
  position: 'absolute',
  width: 0,
  height: 0,
});

export const shapes = style({
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
});

export const mover = style({
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  transform: 'translateX(0)',
  transition: `transform ${BALL_MOVE}`,
  selectors: {
    [`${root}[data-open="true"] &`]: { transform: `translateX(${END})` },
  },
  '@media': { [REDUCED]: { transition: 'none' } },
});

export const pill = style({
  position: 'absolute',
  top: 0,
  left: 0,
  width: SIZE,
  height: SIZE,
  background: color.background.default,
  borderRadius: borderRadius.full,
  boxShadow: shadow.sm,
  transition: `width ${PILL_MOVE}`,
  selectors: { [`${root}[data-open="true"] &`]: { width: INPUT_WIDTH } },
  '@media': { [REDUCED]: { transition: 'none' } },
});

export const ball = style({
  position: 'absolute',
  left: 0,
  top: 0,
  width: SIZE,
  height: SIZE,
  borderRadius: borderRadius.full,
  background: color.primary.main,
});

export const input = style({
  position: 'absolute',
  inset: '0 auto 0 0',
  width: INPUT_WIDTH,
  minWidth: 0,
  padding: `0 ${spacing[4]}`,
  border: 0,
  borderRadius: borderRadius.full,
  background: 'transparent',
  color: color.text.primary,
  font: 'inherit',
  fontSize: font.size.base,
  visibility: 'hidden',
  opacity: 0,
  // 전역 축소 모션 규칙이 visibility까지 지연시키면 즉시 포커스를 받을 수 없다.
  transitionProperty: 'none',
  selectors: {
    [`${root}[data-open="true"] &`]: {
      visibility: 'visible',
      animation: `${fadeIn} ${animation.duration.fast} ${animation.easing.settle} calc(${animation.duration.slower} * 0.8) both`,
    },
    '&:focus-visible': {
      outline: `2px solid ${color.border.focus}`,
      outlineOffset: '2px',
    },
    '&::placeholder': { color: color.text.secondary },
  },
  '@media': {
    [REDUCED]: {
      selectors: {
        [`${root}[data-open="true"] &`]: { animation: 'none', opacity: 1 },
      },
    },
  },
});

export const trigger = style({
  position: 'absolute',
  left: 0,
  top: 0,
  display: 'grid',
  placeItems: 'center',
  width: SIZE,
  height: SIZE,
  padding: 0,
  border: 0,
  borderRadius: borderRadius.full,
  background: 'transparent',
  color: color.primary.contrast,
  cursor: 'pointer',
  pointerEvents: 'auto',
  selectors: {
    '&:focus-visible': {
      outline: `2px solid ${color.border.focus}`,
      outlineOffset: '2px',
    },
  },
});

export const results = style({
  position: 'absolute',
  top: `calc(100% + ${spacing[2]})`,
  left: 0,
  right: 0,
  boxShadow: shadow.md,
  borderRadius: borderRadius.md,
});
