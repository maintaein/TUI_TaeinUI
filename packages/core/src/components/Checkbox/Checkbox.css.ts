import { style, styleVariants } from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';
import { focusRing } from '../../tokens/focusRing.css';

export const wrapper = style({
  display: 'inline-flex',
  flexDirection: 'column',
  gap: '0.25rem',
});

export const checkboxLabel = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
  minWidth: '44px',
  minHeight: '44px',
  cursor: 'pointer',
  touchAction: 'manipulation',
  userSelect: 'none',

  selectors: {
    '&:has(input:disabled)': {
      cursor: 'not-allowed',
      opacity: 0.5,
    },
  },
});

export const checkboxContainer = style({
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
});

export const size = styleVariants({
  sm: {
    width: '16px',
    height: '16px',
  },
  md: {
    width: '20px',
    height: '20px',
  },
  lg: {
    width: '24px',
    height: '24px',
  },
});

export const checkbox = style({
  position: 'absolute',
  width: 0,
  height: 0,
  opacity: 0,
  cursor: 'pointer',
  touchAction: 'manipulation',

  selectors: {
    '&:disabled': {
      cursor: 'not-allowed',
    },
  },
});

export const checkmark = style({
  width: '100%',
  height: '100%',
  border: `2px solid ${themeContract.color.text.secondary}`,
  borderRadius: '4px',
  backgroundColor: themeContract.color.background.paper,
  transition: `background-color ${themeContract.animation.duration.fast} ${themeContract.animation.easing.settle}, border-color ${themeContract.animation.duration.fast} ${themeContract.animation.easing.settle}, box-shadow ${themeContract.animation.duration.fast} ${themeContract.animation.easing.settle}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',

  selectors: {
    '&:hover': {
      borderColor: themeContract.color.text.primary,
    },

    'input:focus-visible + &': {
      ...focusRing(),
    },

    'input:checked + &': {
      backgroundColor: themeContract.color.primary.main,
      borderColor: themeContract.color.primary.main,
    },

    'input:indeterminate + &': {
      backgroundColor: themeContract.color.primary.main,
      borderColor: themeContract.color.primary.main,
    },

    'input:disabled + &': {
      backgroundColor: themeContract.color.surface.default,
      borderColor: themeContract.color.border.default,
      cursor: 'not-allowed',
    },

    'input:disabled:checked + &': {
      backgroundColor: themeContract.color.text.disabled,
      borderColor: themeContract.color.text.disabled,
    },
  },
});

export const markSvg = style({
  width: '100%',
  height: '100%',
  display: 'block',
  overflow: 'visible',
});

export const markPath = style({
  fill: 'none',
  stroke: themeContract.color.primary.contrast,
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  // GSAP이 d·strokeDasharray·strokeDashoffset을 소유한다. 트랜지션 없음.
});

export const error = style({
  borderColor: `${themeContract.color.error.main} !important`,

  selectors: {
    'input:focus + &': {
      borderColor: `${themeContract.color.error.main} !important`,
      boxShadow: `0 0 0 3px ${themeContract.color.overlay.errorHalo}`,
    },
  },
});

export const labelText = style({
  fontSize: '0.875rem',
  fontWeight: 500,
  color: themeContract.color.text.primary,
  lineHeight: 1.5,
});

export const required = style({
  color: themeContract.color.error.main,
  marginLeft: '0.25rem',
});

export const helperText = style({
  fontSize: '0.75rem',
  color: themeContract.color.text.secondary,
  marginLeft: 'calc(16px + 0.5rem)',
});

export const errorMessage = style({
  fontSize: '0.75rem',
  color: themeContract.color.error.main,
  marginLeft: 'calc(16px + 0.5rem)',
});
