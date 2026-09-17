import { style, styleVariants } from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';
import { focusRing } from '../../tokens/focusRing.css';

// textarea container 스타일
export const textareaContainer = style({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
});

// size variants
export const size = styleVariants({
  sm: {
    fontSize: '0.875rem',
    padding: '0.5rem 0.75rem',
  },
  md: {
    fontSize: '1rem',
    padding: '0.75rem 1rem',
  },
  lg: {
    fontSize: '1.125rem',
    padding: '1rem 1.25rem',
  },
});

// textarea 기본 스타일
export const textarea = style({
  width: '100%',
  border: `1px solid ${themeContract.color.text.secondary}`,
  borderRadius: '8px',
  backgroundColor: themeContract.color.background.paper,
  color: themeContract.color.text.primary,
  fontFamily: 'inherit',
  outline: 'none',
  transition: `all ${themeContract.animation.duration.fast} ${themeContract.animation.easing.easeInOut}`,
  lineHeight: 1.5,
  resize: 'none',

  selectors: {
    '&::placeholder': {
      color: themeContract.color.text.secondary,
    },
    '&:hover:not(:disabled)': {
      borderColor: themeContract.color.primary.main,
    },
    '&:focus-visible': {
      borderColor: themeContract.color.border.focus,
      boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.16)',
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
      boxShadow: '0 0 0 3px rgba(240, 68, 82, 0.1)',
    },
  },
});
