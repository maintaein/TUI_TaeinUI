import { style, styleVariants } from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';
import { focusRing } from '../../tokens/focusRing.css';

// input container 스타일
export const inputContainer = style({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
});

// size variants
export const size = styleVariants({
  sm: {
    height: '44px',
    fontSize: '0.875rem',
  },
  md: {
    height: '44px',
    fontSize: '1rem',
  },
  lg: {
    height: '52px',
    fontSize: '1.125rem',
  },
});

// input 기본 스타일
export const input = style({
  width: '100%',
  padding: '0 1rem',
  border: `1px solid ${themeContract.color.text.secondary}`,
  borderRadius: '8px',
  backgroundColor: themeContract.color.background.paper,
  color: themeContract.color.text.primary,
  fontFamily: 'inherit',
  outline: 'none',
  transition: `all ${themeContract.animation.duration.fast} ${themeContract.animation.easing.easeInOut}`,

  selectors: {
    '&::placeholder': {
      color: themeContract.color.text.secondary,
    },
    '&:hover:not(:disabled)': {
      borderColor: themeContract.color.primary.main,
    },
    '&:focus-visible': {
      borderColor: themeContract.color.border.focus,
      boxShadow: `0 0 0 3px ${themeContract.color.overlay.focusHalo}`,
      ...focusRing(),
    },
    '&:disabled': {
      backgroundColor: themeContract.color.surface.default,
      color: themeContract.color.text.disabled,
      borderColor: themeContract.color.border.default,
      cursor: 'not-allowed',
    },
    '&:disabled::placeholder': {
      color: themeContract.color.text.disabled,
    },
    '&:read-only:not(:disabled)': {
      backgroundColor: themeContract.color.surface.default,
      borderColor: themeContract.color.border.strong,
      cursor: 'default',
    },
  },
});

// error 상태
export const error = style({
  borderColor: `${themeContract.color.error.main} !important`,

  selectors: {
    '&:focus': {
      borderColor: `${themeContract.color.error.main} !important`,
      boxShadow: `0 0 0 3px ${themeContract.color.overlay.errorHalo}`,
    },
  },
});
