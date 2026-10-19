import { themeContract } from '@taein-ui/core';
import { style } from '@vanilla-extract/css';

const { color, spacing, borderRadius, shadow, font } = themeContract;

export const root = style({
  maxWidth: '44rem',
  margin: `0 auto ${spacing[16]}`,
});

// 무대 높이는 가장 큰 장면(카드)에 맞춰 고정한다. 장면이 바뀌어도 페이지가 출렁이지 않는다.
export const stage = style({
  position: 'relative',
  height: '20rem',
  overflow: 'hidden',
  background: color.background.paper,
  border: `1px solid ${color.border.default}`,
  borderRadius: borderRadius.lg,
});

// 자식이 없는 절대 위치 상자. 크기·반경은 gsap이 정한다.
export const shell = style({
  position: 'absolute',
  inset: 0,
  margin: 'auto',
  boxSizing: 'border-box',
  background: color.background.default,
  border: `1px solid ${color.border.default}`,
  boxShadow: shadow.lg,
});

// 내용 층. 크기는 내용이 정하고, 틀이 이 크기를 잰다.
export const layer = style({
  position: 'absolute',
  inset: 0,
  margin: 'auto',
  boxSizing: 'border-box',
  width: 'max-content',
  height: 'max-content',
  maxWidth: `calc(100% - ${spacing[4]})`,
  padding: `${spacing[3]} ${spacing[8]}`,
  selectors: {
    '&[data-shape="card"]': { padding: spacing[6] },
  },
});

export const column = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: spacing[4],
});

export const field = style({
  width: '16rem',
  maxWidth: '100%',
});

export const chips = style({
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
  gap: spacing[2],
  maxWidth: '16rem',
});

export const stats = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[2],
  width: '14rem',
  maxWidth: '100%',
});

export const statsLabel = style({
  height: '1.25rem',
  fontSize: font.size.sm,
  color: color.text.secondary,
});

export const statsRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[3],
  height: '2.5rem',
});

export const statsValue = style({
  fontSize: font.size['3xl'],
  fontWeight: font.weight.bold,
  color: color.text.primary,
});

export const cursor = style({
  position: 'absolute',
  top: 0,
  left: 0,
  zIndex: 2,
  pointerEvents: 'none',
  color: color.text.primary,
  transition: 'opacity 150ms',
  selectors: {
    '[data-playing="false"] &': { opacity: 0 },
  },
});

export const control = style({
  position: 'absolute',
  top: spacing[1],
  right: spacing[1],
  zIndex: 3,
});

export const footer = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: spacing[3],
  minHeight: spacing[10],
  marginTop: spacing[3],
});

export const caption = style({
  margin: 0,
  fontSize: font.size.sm,
  fontWeight: font.weight.medium,
  color: color.text.secondary,
});
