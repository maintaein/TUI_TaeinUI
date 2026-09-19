import { style, styleVariants, keyframes } from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';

// 회전 애니메이션 (spinner용)
const spin = keyframes({
  '0%': { transform: 'rotate(0deg)' },
  '100%': { transform: 'rotate(360deg)' },
});

// 페이드 인아웃 애니메이션 (dots용)
const fadeInOut = keyframes({
  '0%, 100%': {
    opacity: 0.2,
    transform: 'translateY(0)',
  },
  '50%': {
    opacity: 1,
  },
});

export const container = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
});

export const spinner = style({
  border: '3px solid',
  borderColor: themeContract.color.border.default,
  borderTopColor: 'var(--spinner-color)',
  borderRadius: '50%',
  animation: `${spin} ${themeContract.animation.loop.fast} linear infinite`,
  boxSizing: 'border-box',
});

export const dotsContainer = style({
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
});

export const dot = style({
  width: '100%',
  height: '100%',
  backgroundColor: 'var(--spinner-color)',
  borderRadius: '50%',
  animation: `${fadeInOut} ${themeContract.animation.loop.base} infinite ease-in-out backwards`,
});

export const sizeStyles = styleVariants({
  sm: {
    width: '16px',
    height: '16px',
  },
  md: {
    width: '24px',
    height: '24px',
  },
  lg: {
    width: '32px',
    height: '32px',
  },
  xl: {
    width: '48px',
    height: '48px',
  },
});

export const dotSizeStyles = styleVariants({
  sm: { width: '4px', height: '4px' },
  md: { width: '8px', height: '8px' },
  lg: { width: '10px', height: '10px' },
  xl: { width: '12px', height: '12px' },
});

export const dotDelayStyles = styleVariants({
  first: { animationDelay: '0s' },
  second: { animationDelay: '0.2s' },
  third: { animationDelay: '0.4s' },
});
