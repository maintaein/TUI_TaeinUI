import { style, styleVariants } from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';
import { focusRing } from '../../tokens/focusRing.css';

export const avatar = style({
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  backgroundColor: themeContract.color.background.paper,
  color: themeContract.color.text.primary,
  fontWeight: themeContract.font.weight.medium,
  userSelect: 'none',
  flexShrink: 0,
});

// Avatar 크기 스타일
export const sizeStyles = styleVariants({
  xs: {
    width: '24px',
    height: '24px',
    fontSize: themeContract.font.size.xs,
  },
  sm: {
    width: '32px',
    height: '32px',
    fontSize: themeContract.font.size.sm,
  },
  md: {
    width: '40px',
    height: '40px',
    fontSize: themeContract.font.size.base,
  },
  lg: {
    width: '48px',
    height: '48px',
    fontSize: themeContract.font.size.lg,
  },
  xl: {
    width: '64px',
    height: '64px',
    fontSize: themeContract.font.size.xl,
  },
});

export const variantStyles = styleVariants({
  circular: {
    borderRadius: '50%',
  },
  rounded: {
    borderRadius: themeContract.borderRadius.md,
  },
  square: {
    borderRadius: '0',
  },
});

export const image = style({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
});

export const fallbackText = style({
  lineHeight: 1,
});

// 상태 뱃지 스타일
export const statusBadge = style({
  position: 'absolute',
  bottom: '0',
  right: '0',
  width: '25%',
  height: '25%',
  borderRadius: '50%',
  border: `2px solid ${themeContract.color.background.paper}`,
});

export const statusOnline = style({
  backgroundColor: themeContract.color.success.main,
});

export const statusOffline = style({
  backgroundColor: themeContract.color.text.disabled,
});

export const statusBusy = style({
  backgroundColor: themeContract.color.error.main,
});

export const statusAway = style({
  backgroundColor: themeContract.color.warning.main,
});

// 클릭 가능 Avatar
export const clickable = style({
  cursor: 'pointer',
  touchAction: 'manipulation',
  border: 'none',
  padding: 0,
  background: 'none',
  textDecoration: 'none',
  color: 'inherit',
  font: 'inherit',
  transition: `filter ${themeContract.animation.duration.base} ease, transform ${themeContract.animation.duration.fast} ease`,

  ':hover': {
    filter: 'brightness(0.9)',
  },

  ':active': {
    transform: 'scale(0.95)',
  },

  ':focus-visible': {
    ...focusRing(),
  },
});

export const avatarGroup = style({
  display: 'flex',
  alignItems: 'center',
});

export const spacingStyles = styleVariants({
  sm: {
    marginLeft: '-8px',
  },
  md: {
    marginLeft: '-12px',
  },
  lg: {
    marginLeft: '-16px',
  },
});

export const groupAvatar = style({
  border: `2px solid ${themeContract.color.background.paper}`,
  selectors: {
    '&:first-child': {
      marginLeft: '0',
    },
  },
});

// 나머지 개수 표시 Avatar
export const excessAvatar = style({
  backgroundColor: themeContract.color.surface.hover,
  color: themeContract.color.text.secondary,
  fontSize: themeContract.font.size.sm,
  fontWeight: themeContract.font.weight.semibold,
});
