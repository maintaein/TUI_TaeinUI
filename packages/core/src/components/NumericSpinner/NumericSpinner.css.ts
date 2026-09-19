import { keyframes, style, styleVariants } from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';
import { focusRing } from '../../tokens/focusRing.css';

// input container 스타일
export const inputContainer = style({
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  backgroundColor: themeContract.color.background.paper,
  border: `1px solid ${themeContract.color.border.strong}`,
  borderRadius: '8px',
  transition: `background-color ${themeContract.animation.duration.fast} ease-in-out, border-color ${themeContract.animation.duration.fast} ease-in-out`,
  width: 'fit-content',

  selectors: {
    '&:has(input:disabled)': {
      backgroundColor: themeContract.color.surface.default,
      borderColor: themeContract.color.background.paper,
      cursor: 'not-allowed',
    },
    '&:has(input:read-only)': {
      backgroundColor: themeContract.color.surface.default,
      cursor: 'default',
    },
  },
});

// size variants
export const size = styleVariants({
  sm: {
    padding: '0.25rem',
  },
  md: {
    padding: '0.375rem',
  },
  lg: {
    padding: '0.5rem',
  },
});

export const clickPulse = keyframes({
  '0%': { transform: 'scale(1)' },
  '30%': { transform: 'scale(0.92)' },
  '60%': { transform: 'scale(1.06)' },
  '100%': { transform: 'scale(1)' },
});

export const input = style({
  border: `1px solid ${themeContract.color.border.default}`,
  outline: 'none',
  backgroundColor: themeContract.color.background.paper,
  color: themeContract.color.text.primary,
  fontFamily: 'inherit',
  textAlign: 'center',
  // 값이 오를 때 '1'과 '8'의 폭 차이로 숫자가 좌우로 흔들리는 것을 막는다.
  fontVariantNumeric: themeContract.font.variantNumeric.tabular,
  appearance: 'textfield',
  fontSize: '0.875rem',
  fontWeight: 500,
  padding: '0.5rem 0',
  margin: '0 8px',
  borderRadius: '6px',
  transition: `transform ${themeContract.animation.duration.slow} cubic-bezier(0.25, 0.8, 0.5, 1), background-color ${themeContract.animation.duration.base} ease, color ${themeContract.animation.duration.base} ease`,

  selectors: {
    [`${inputContainer}:has(button:active:not(:disabled)) &`]: {
      animation: `${clickPulse} ${themeContract.animation.duration.slower} cubic-bezier(0.25, 0.8, 0.25, 1) forwards`,
      color: themeContract.color.primary.main,
      transition: 'none',
    },
    '&::placeholder': {
      color: themeContract.color.text.disabled,
    },
    '&:disabled': {
      color: themeContract.color.text.disabled,
      cursor: 'not-allowed',
      backgroundColor: themeContract.color.surface.default,
    },
    '&:read-only': {
      cursor: 'default',
    },
    '&:focus': {
      borderColor: themeContract.color.primary.main,
      boxShadow: `0 0 0 3px ${themeContract.color.overlay.focusHalo}`,
      ...focusRing(),
    },
    '&::-webkit-outer-spin-button': {
      appearance: 'none',
      margin: 0,
    },
    '&::-webkit-inner-spin-button': {
      appearance: 'none',
      margin: 0,
    },
  },
});

// input size variants
export const inputSize = styleVariants({
  sm: {
    width: '50px',
  },
  md: {
    width: '50px',
  },
  lg: {
    width: '60px',
  },
});

// button 공통 스타일
export const button = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: 'none',
  backgroundColor: 'transparent',
  color: themeContract.color.text.primary,
  cursor: 'pointer',
  touchAction: 'manipulation',
  transition: `background-color ${themeContract.animation.duration.fast} ease-in-out, color ${themeContract.animation.duration.fast} ease-in-out, transform ${themeContract.animation.duration.fast} ease-in-out`,
  flexShrink: 0,
  minWidth: '44px',
  minHeight: '44px',
  padding: '0.5rem',
  borderRadius: '4px',

  selectors: {
    '&:hover:not(:disabled)': {
      backgroundColor: themeContract.color.surface.hover,
      color: themeContract.color.primary.main,
    },
    '&:active:not(:disabled)': {
      backgroundColor: themeContract.color.surface.active,
      transform: 'scale(0.92)',
    },
    '&:disabled': {
      color: themeContract.color.text.disabled,
      cursor: 'not-allowed',
    },
    '&:focus-visible': {
      ...focusRing(),
    },
  },
});

export const buttonSize = styleVariants({
  sm: {
    width: '20px',
    height: '20px',
  },
  md: {
    width: '24px',
    height: '24px',
  },
  lg: {
    width: '28px',
    height: '28px',
  },
});

export const decrementButton = style({});
export const incrementButton = style({});

// error 상태
export const error = style({
  borderColor: `${themeContract.color.error.main} !important`,

  selectors: {
    '&:focus-within': {
      borderColor: `${themeContract.color.error.main} !important`,
      boxShadow: `0 0 0 3px ${themeContract.color.overlay.errorHalo}`,
    },
  },
});
