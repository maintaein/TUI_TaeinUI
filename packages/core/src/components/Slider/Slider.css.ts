import { style, styleVariants } from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';

// Container
export const container = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  width: '100%',
});

// Label Container
export const labelContainer = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '0.25rem',
});

// Label
export const label = style({
  fontSize: themeContract.font.size.sm,
  fontWeight: themeContract.font.weight.medium,
  color: themeContract.color.text.primary,
  fontFamily: themeContract.font.family.sans,
});

// Required
export const required = style({
  color: themeContract.color.error.main,
  marginLeft: '0.25rem',
});

// Value Display
export const valueDisplay = style({
  fontSize: themeContract.font.size.sm,
  fontWeight: themeContract.font.weight.semibold,
  color: themeContract.color.primary.dark,
  fontFamily: themeContract.font.family.sans,
  minWidth: '3rem',
  textAlign: 'right',
});

// Slider Wrapper
export const sliderWrapper = style({
  position: 'relative',
  width: '100%',
  alignItems: 'center',
});

// Slider Track (background)
export const sliderTrack = style({
  position: 'absolute',
  top: '50%',
  left: 0,
  right: 0,
  height: '6px',
  backgroundColor: themeContract.color.surface.track,
  borderRadius: '3px',
  transform: 'translateY(-50%)',
  pointerEvents: 'none',
});

// Slider Fill Track (filled portion)
export const sliderFillTrack = style({
  position: 'absolute',
  top: '50%',
  left: 0,
  height: '6px',
  backgroundColor: themeContract.color.primary.main,
  borderRadius: '3px',
  transform: 'translateY(-50%)',
  pointerEvents: 'none',
  transition: 'width 0.05s ease-out',
});

// Slider Input
export const slider = style({
  width: '100%',
  height: '44px',
  backgroundColor: 'transparent',
  appearance: 'none',
  WebkitAppearance: 'none',
  cursor: 'pointer',
  position: 'relative',
  zIndex: 1,
  margin: 0,

  selectors: {
    // Webkit thumb
    '&::-webkit-slider-thumb': {
      appearance: 'none',
      WebkitAppearance: 'none',
      width: '24px',
      height: '24px',
      borderRadius: '50%',
      backgroundColor: themeContract.color.background.paper,
      border: `2px solid ${themeContract.color.primary.main}`,
      cursor: 'pointer',
      transition: `all ${themeContract.animation.duration.base} ${themeContract.animation.easing.easeInOut}`,
      boxShadow: '0 1px 4px rgba(0, 0, 0, 0.15)',
      marginTop: '-9px',
    },
    '&:hover::-webkit-slider-thumb': {
      borderColor: themeContract.color.primary.main,
      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
      transform: 'scale(1.1)',
    },
    '&:active::-webkit-slider-thumb': {
      borderColor: themeContract.color.primary.dark,
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
      transform: 'scale(1)',
    },
    '&:focus-visible::-webkit-slider-thumb': {
      outline: `2px solid ${themeContract.color.border.focus}`,
      outlineOffset: '2px',
    },
    '&:disabled::-webkit-slider-thumb': {
      backgroundColor: themeContract.color.background.paper,
      borderColor: themeContract.color.text.disabled,
      cursor: 'not-allowed',
    },

    // Firefox thumb
    '&::-moz-range-thumb': {
      width: '24px',
      height: '24px',
      borderRadius: '50%',
      backgroundColor: themeContract.color.background.paper,
      border: `2px solid ${themeContract.color.primary.main}`,
      cursor: 'pointer',
      transition: `all ${themeContract.animation.duration.base} ${themeContract.animation.easing.easeInOut}`,
      boxShadow: '0 1px 4px rgba(0, 0, 0, 0.15)',
    },
    '&:hover::-moz-range-thumb': {
      borderColor: themeContract.color.primary.main,
      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
      transform: 'scale(1.1)',
    },
    '&:active::-moz-range-thumb': {
      borderColor: themeContract.color.primary.dark,
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
      transform: 'scale(1)',
    },
    '&:focus-visible::-moz-range-thumb': {
      outline: `2px solid ${themeContract.color.border.focus}`,
      outlineOffset: '2px',
    },
    '&:disabled::-moz-range-thumb': {
      backgroundColor: themeContract.color.background.paper,
      borderColor: themeContract.color.text.disabled,
      cursor: 'not-allowed',
    },

    // Tracks
    '&::-webkit-slider-runnable-track': {
      height: '6px',
      backgroundColor: 'transparent',
    },
    '&::-moz-range-track': {
      height: '6px',
      backgroundColor: 'transparent',
    },

    // Disabled
    '&:disabled': {
      cursor: 'not-allowed',
      opacity: 0.5,
    },

    // Focus
    '&:focus-visible': {
      outline: 'none',
    },
  },
});

// Size Variants
export const sizeVariants = styleVariants({
  sm: {},
  md: {},
  lg: {},
});

// Helper Text
export const helperText = style({
  fontSize: themeContract.font.size.xs,
  color: themeContract.color.text.secondary,
  fontFamily: themeContract.font.family.sans,
  marginTop: '0.25rem',
});

// Marks Container
export const marksContainer = style({
  position: 'relative',
  width: '100%',
  height: '20px',
  marginTop: '0.25rem',
});

// Mark
export const mark = style({
  position: 'absolute',
  top: 0,
  transform: 'translateX(-50%)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
});

// Mark Label
export const markLabel = style({
  fontSize: themeContract.font.size.xs,
  color: themeContract.color.text.secondary,
  fontFamily: themeContract.font.family.sans,
  whiteSpace: 'nowrap',
  marginTop: '0.25rem',
});
