import { style, styleVariants } from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';
import { mediaQuery } from '../../tokens/breakpoints.css';

export const headerBar = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: themeContract.spacing[4],
  padding: `${themeContract.spacing[4]} ${themeContract.spacing[6]}`,
  transition: `box-shadow ${themeContract.animation.duration.base} ${themeContract.animation.easing.easeInOut}`,
  zIndex: themeContract.zIndex.sticky,
  transform: 'translateZ(0)',
  willChange: 'transform, backdrop-filter',
  backfaceVisibility: 'hidden',

  '@media': {
    [mediaQuery.down.md]: {
      padding: `${themeContract.spacing[3]} ${themeContract.spacing[4]}`,
      gap: themeContract.spacing[3],
    },
  },
});

export const variantStyles = styleVariants({
  default: {
    backgroundColor: themeContract.color.background.default,
    color: themeContract.color.text.primary,
  },
  dark: {
    backgroundColor: themeContract.color.text.primary,
    color: themeContract.color.background.paper,
  },
  transparent: {
    backgroundColor: themeContract.color.surface.default,
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    color: themeContract.color.text.primary,
    opacity: 0.9,
  },
});

export const stickyStyles = styleVariants({
  true: {
    position: 'sticky',
    top: 0,
  },
  false: {
    position: 'relative',
  },
});

export const elevationStyles = styleVariants({
  true: {
    boxShadow: themeContract.shadow.md,
  },
  false: {
    boxShadow: 'none',
  },
});

export const borderStyles = styleVariants({
  true: {
    borderBottom: `1px solid ${themeContract.color.border.default}`,
  },
  false: {
    borderBottom: 'none',
  },
});

export const leftSection = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeContract.spacing[3],
  flexShrink: 1,
  minWidth: 0,
});

export const logo = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  maxHeight: '32px',

  '@media': {
    [mediaQuery.down.md]: {
      maxHeight: '28px',
    },
  },
});

export const title = style({
  fontSize: themeContract.font.size.lg,
  fontWeight: themeContract.font.weight.semibold,
  lineHeight: themeContract.font.lineHeight.tight,
  margin: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  minWidth: 0,

  '@media': {
    [mediaQuery.down.md]: {
      fontSize: themeContract.font.size.base,
    },
  },
});

export const centerSection = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeContract.spacing[4],
  flex: 1,
  minWidth: 0,
  justifyContent: 'center',

  '@media': {
    [mediaQuery.down.md]: {
      gap: themeContract.spacing[2],
    },
  },
});

export const rightSection = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeContract.spacing[3],
  flexShrink: 0,

  '@media': {
    [mediaQuery.down.md]: {
      gap: themeContract.spacing[2],
    },
  },
});
