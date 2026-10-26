import { themeContract } from '@taein-ui/core';
import { style } from '@vanilla-extract/css';

const { color, spacing, borderRadius, animation, shadow, font } = themeContract;
const REDUCED = '(prefers-reduced-motion: reduce)';
const MOBILE = '(max-width: 640px)';
const SIZE = spacing[10];
const END = `calc(100% - ${SIZE})`;
const INPUT_WIDTH = `calc(100% - ${SIZE} - ${spacing[4]})`;
// 기존 분리 비율을 유지하며 25% 단축한 pill 600ms와 공 750ms를 slower에서 유도한다.
const PILL_DURATION = `calc(${animation.duration.slower} * 1.2)`;
const PILL_MOVE = `${PILL_DURATION} ${animation.easing.drift}`;
const BALL_MOVE = `calc(${animation.duration.slower} * 1.5) ${animation.easing.drift}`;

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
  clipPath: `inset(0 calc(100% - ${SIZE}) 0 0)`,
  // 닫히는 동안에도 입력의 오른쪽 끝이 pill을 따라가도록 숨김을 늦춘다.
  transition: `clip-path ${PILL_MOVE}, opacity ${PILL_MOVE}, visibility 0s linear ${PILL_DURATION}`,
  selectors: {
    [`${root}[data-open="true"] &`]: {
      visibility: 'visible',
      opacity: 1,
      clipPath: 'inset(0 0 0 0)',
      transition: `clip-path ${PILL_MOVE}, opacity ${PILL_MOVE}, visibility 0s`,
    },
    '&:focus-visible': {
      outline: `2px solid ${color.border.focus}`,
      outlineOffset: '-2px',
    },
    '&::placeholder': { color: color.text.secondary },
  },
  '@media': {
    [REDUCED]: {
      transition: 'none',
      selectors: {
        [`${root}[data-open="true"] &`]: { transition: 'none' },
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
