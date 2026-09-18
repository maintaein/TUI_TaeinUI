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
  transition: `all ${themeContract.animation.duration.fast} ${themeContract.animation.easing.easeInOut}`,
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

    'input:checked + &::after': {
      content: '',
      position: 'absolute',
      display: 'block',
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%) rotate(45deg)',
      width: '30%',
      height: '60%',
      border: `solid ${themeContract.color.primary.contrast}`,
      borderWidth: '0 2px 2px 0',
    },

    'input:indeterminate + &': {
      backgroundColor: themeContract.color.primary.main,
      borderColor: themeContract.color.primary.main,
    },

    'input:indeterminate + &::after': {
      content: '',
      position: 'absolute',
      display: 'block',
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
      width: '60%',
      height: '2px',
      backgroundColor: themeContract.color.primary.contrast,
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
