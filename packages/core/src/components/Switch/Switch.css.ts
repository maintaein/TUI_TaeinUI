import { style, styleVariants } from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';
import { focusRing } from '../../tokens/focusRing.css';

// Wrapper
export const wrapper = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  width: 'fit-content',
});

// Switch Label
export const switchLabel = style({
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  minWidth: '44px',
  minHeight: '44px',
  cursor: 'pointer',
  userSelect: 'none',
});

// Label Text
export const labelText = style({
  fontSize: '0.875rem',
  fontWeight: 500,
  color: themeContract.color.text.primary,
  order: -1,
});

// Required Indicator
export const required = style({
  color: themeContract.color.error.main,
  marginLeft: '0.125rem',
});

// Switch Container (Track)
export const switchContainer = style({
  position: 'relative',
  display: 'inline-block',
  flexShrink: 0,
});

// Hidden Native Input
export const switchInput = style({
  position: 'absolute',
  width: 0,
  height: 0,
  opacity: 0,
  cursor: 'pointer',

  selectors: {
    '&:disabled': {
      cursor: 'not-allowed',
    },
  },
});

// Size Variants for Container (Track)
const baseSizeContainer = {
  sm: { width: '36px', height: '20px', borderRadius: '10px' },
  md: { width: '44px', height: '24px', borderRadius: '12px' },
  lg: { width: '52px', height: '28px', borderRadius: '14px' },
};

export const size = styleVariants(baseSizeContainer, (baseStyle) => [
  baseStyle,
  {
    backgroundColor: themeContract.color.text.secondary,
    border: '2px solid transparent',
    transition: `all ${themeContract.animation.duration.fast} ${themeContract.animation.easing.easeInOut}`,
    position: 'relative',
    display: 'inline-block',
    flexShrink: 0,
    cursor: 'pointer',

    selectors: {
      [`&:has(input:checked)`]: {
        backgroundColor: themeContract.color.primary.main,
      },

      [`&:has(input:focus-visible)`]: {
        ...focusRing(),
      },

      [`&:has(input:disabled)`]: {
        backgroundColor: themeContract.color.surface.track,
        cursor: 'not-allowed',
      },

      [`&:has(input:checked:disabled)`]: {
        backgroundColor: themeContract.color.primary.light,
      },
    },
  },
]);

// Thumb Size Variants
export const thumbSize = styleVariants(
  {
    sm: { width: '16px', height: '16px', offset: '14px' },
    md: { width: '20px', height: '20px', offset: '18px' },
    lg: { width: '24px', height: '24px', offset: '22px' },
  },
  (config) => ({
    position: 'absolute',
    top: '50%',
    left: '2px',
    transform: 'translateY(-50%)',
    width: config.width,
    height: config.height,
    borderRadius: '50%',
    backgroundColor: themeContract.color.background.paper,
    transition: `all ${themeContract.animation.duration.fast} ${themeContract.animation.easing.easeInOut}`,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',

    selectors: {
      [`input:checked + &`]: {
        transform: `translate(${config.offset}, -50%)`,
      },

      [`input:disabled + &`]: {
        backgroundColor: themeContract.color.background.paper,
        boxShadow: 'none',
        opacity: 0.8,
      },
    },
  })
);

// Error State
export const error = style({
  borderColor: `${themeContract.color.error.main} !important`,

  selectors: {
    'input:focus ~ &': {
      borderColor: `${themeContract.color.error.main} !important`,
      boxShadow: '0 0 0 3px rgba(211, 47, 47, 0.1) !important',
    },
  },
});

// Helper Text
export const helperText = style({
  fontSize: '0.75rem',
  color: themeContract.color.text.secondary,
  marginLeft: '0.25rem',
});

// Error Message
export const errorMessage = style({
  fontSize: '0.75rem',
  color: themeContract.color.error.main,
  marginLeft: '0.25rem',
});
