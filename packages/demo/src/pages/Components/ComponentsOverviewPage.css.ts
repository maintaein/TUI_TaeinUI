import { themeContract } from '@taein-ui/core';
import { keyframes, style } from '@vanilla-extract/css';
import { LINE } from '../../components/DocText';

const { color, spacing, borderRadius, animation } = themeContract;

export const page = style({
  maxWidth: '1200px',
  margin: '0 auto',
});

export const head = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'flex-end',
  justifyContent: 'space-between',
  gap: spacing[4],
  padding: `${spacing[12]} 0 0`,
});

// 한 줄로 쓴다. 좁은 화면에서도 줄이 꺾이지 않는 크기
export const total = style({
  fontSize: 'clamp(2.25rem, 10vw, 5rem)',
  whiteSpace: 'nowrap',
});

export const dock = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[2],
  width: 'fit-content',
  maxWidth: '100%',
  margin: `${spacing[6]} 0`,
  padding: spacing[2],
  background: color.background.default,
  border: `1px solid ${LINE}`,
  borderRadius: borderRadius.xl,
  overflowX: 'auto',
  scrollbarWidth: 'none',
});

const fadeIn = keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
});

export const cardGroup = style({
  animation: `${fadeIn} ${animation.duration.fast} ${animation.easing.settle}`,
  '@media': {
    '(prefers-reduced-motion: reduce)': { animation: 'none' },
  },
});
