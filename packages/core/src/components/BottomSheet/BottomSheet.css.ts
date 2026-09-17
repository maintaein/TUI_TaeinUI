import { style, styleVariants, keyframes } from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';
import { focusRing } from '../../tokens/focusRing.css';

const fadeIn = keyframes({
  '0%': { opacity: 0 },
  '100%': { opacity: 1 },
});

const fadeOut = keyframes({
  '0%': { opacity: 1 },
  '100%': { opacity: 0 },
});

const slideUp = keyframes({
  '0%': {
    transform: 'translateY(100%)',
  },
  '100%': {
    transform: 'translateY(0)',
  },
});

const slideDown = keyframes({
  '0%': {
    transform: 'translateY(0)',
  },
  '100%': {
    transform: 'translateY(100%)',
  },
});

export const bottomSheetContainer = style({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: themeContract.zIndex.modal,
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
});

export const backdrop = style({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  zIndex: -1,
});

export const backdropEnter = style({
  animation: `${fadeIn} ${themeContract.animation.duration.base} ${themeContract.animation.easing.easeOut}`,
});

export const backdropExit = style({
  animation: `${fadeOut} ${themeContract.animation.duration.base} ${themeContract.animation.easing.easeOut} forwards`,
});

export const bottomSheet = style({
  position: 'relative',
  backgroundColor: themeContract.color.background.default,
  borderTopLeftRadius: themeContract.borderRadius.xl,
  borderTopRightRadius: themeContract.borderRadius.xl,
  boxShadow: themeContract.shadow['2xl'],
  width: '100%',
  maxWidth: '600px',
  maxHeight: '90vh',
  outline: 'none',
  display: 'flex',
  flexDirection: 'column',

  ':focus': {
    outline: 'none',
  },
});

export const bottomSheetEnter = style({
  animation: `${slideUp} ${themeContract.animation.duration.slow} ${themeContract.animation.easing.easeOut}`,
});

export const bottomSheetExit = style({
  animation: `${slideDown} ${themeContract.animation.duration.slow} ${themeContract.animation.easing.easeOut} forwards`,
});

export const heightStyles = styleVariants({
  auto: {
    height: 'auto',
  },
  sm: {
    height: '30vh',
  },
  md: {
    height: '50vh',
  },
  lg: {
    height: '70vh',
  },
  full: {
    height: '100vh',
    maxHeight: '100vh',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
});

export const handle = style({
  width: '48px',
  height: '4px',
  backgroundColor: themeContract.color.border.default,
  borderRadius: themeContract.borderRadius.full,
  margin: `${themeContract.spacing[3]} auto ${themeContract.spacing[2]}`,
  cursor: 'grab',

  ':active': {
    cursor: 'grabbing',
  },
});

export const header = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${themeContract.spacing[4]} ${themeContract.spacing[6]}`,
  borderBottom: `1px solid ${themeContract.color.border.default}`,
  flexShrink: 0,
});

export const title = style({
  margin: 0,
  fontSize: themeContract.font.size.lg,
  fontWeight: themeContract.font.weight.semibold,
  color: themeContract.color.text.primary,
  lineHeight: themeContract.font.lineHeight.tight,
});

export const closeButton = style({
  padding: themeContract.spacing[2],
  backgroundColor: 'transparent',
  border: 'none',
  cursor: 'pointer',
  borderRadius: themeContract.borderRadius.md,
  color: themeContract.color.text.secondary,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: `background-color ${themeContract.animation.duration.fast} ${themeContract.animation.easing.easeInOut}`,

  ':hover': {
    backgroundColor: themeContract.color.background.paper,
  },

  ':focus-visible': {
    ...focusRing(),
  },
});

export const content = style({
  padding: themeContract.spacing[6],
  overflowY: 'auto',
  flex: 1,
});
