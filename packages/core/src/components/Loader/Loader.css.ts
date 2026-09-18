import { style, styleVariants, keyframes } from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';

// 애니메이션 정의
const spin = keyframes({
  '0%': { transform: 'rotate(0deg)' },
  '100%': { transform: 'rotate(360deg)' },
});

const fadeInOut = keyframes({
  '0%, 100%': {
    opacity: 0.2,
    transform: 'translateY(0)',
  },
  '50%': {
    opacity: 1,
  },
});

const progress = keyframes({
  '0%': {
    transform: 'translateX(-100%)',
  },
  '100%': {
    transform: 'translateX(400%)',
  },
});

export const loaderContainer = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '1rem',
});

export const fullScreenStyles = style({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: themeContract.color.background.default,
  opacity: 0.9,
  zIndex: themeContract.zIndex.modal,
});

export const overlayStyles = style({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: themeContract.color.background.default,
  opacity: 0.8,
  zIndex: 10,
});

export const loader = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
});

export const typeStyles = styleVariants({
  spinner: {},
  dots: {},
  bar: {},
});

export const spinner = style({
  border: '3px solid',
  borderColor: themeContract.color.border.default,
  borderTopColor: 'var(--loader-color)',
  borderRadius: '50%',
  animation: `${spin} 0.8s linear infinite`,
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
  backgroundColor: 'var(--loader-color)',
  borderRadius: '50%',
  animation: `${fadeInOut} 1.4s infinite ease-in-out both`,
});

export const dotSize = styleVariants({
  sm: { width: '4px', height: '4px' },
  md: { width: '8px', height: '8px' },
  lg: { width: '10px', height: '10px' },
  xl: { width: '12px', height: '12px' },
});

export const dotDelay = styleVariants({
  first: { animationDelay: '0s' },
  second: { animationDelay: '0.2s' },
  third: { animationDelay: '0.4s' },
});

export const bar = style({
  position: 'relative',
  height: '4px',
  // 움직이는 fill이 이 컴포넌트의 유일한 신호다. fill이 어두우니 면은 연하게
  // 두고 식별성은 border.strong 경계선이 맡는다.
  backgroundColor: themeContract.color.background.paper,
  boxShadow: `inset 0 0 0 1px ${themeContract.color.border.strong}`,
  borderRadius: '2px',
  overflow: 'hidden',

  selectors: {
    // white 변형은 어두운 면 위에서 쓰는 것이라 밝은 fill이 올라탄다 —
    // 이 경우에만 트랙이 어두워야 한다. data-color는 Loader.tsx가 바깥
    // 래퍼에 이미 달아 둔 속성이라 새로 붙일 것이 없다.
    '[data-color="white"] &': {
      backgroundColor: themeContract.color.surface.track,
      boxShadow: 'none',
    },
  },
});

export const barFill = style({
  position: 'absolute',
  top: 0,
  left: 0,
  height: '100%',
  width: '25%',
  borderRadius: '2px',
  backgroundColor: 'var(--loader-color)',
  animation: `${progress} 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite`,
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

export const barSizeStyles = styleVariants({
  sm: { width: '100px' },
  md: { width: '200px' },
  lg: { width: '300px' },
  xl: { width: '400px' },
});

export const barReset = style({
  width: 'auto !important',
  height: 'auto !important',
});

export const colorStyles = styleVariants({
  primary: {
    vars: { '--loader-color': themeContract.color.primary.main },
  },
  secondary: {
    vars: { '--loader-color': themeContract.color.text.secondary },
  },
  white: {
    vars: { '--loader-color': themeContract.color.background.paper },
  },
});

export const label = style({
  margin: 0,
  fontSize: themeContract.font.size.sm,
  fontWeight: themeContract.font.weight.medium,
  color: themeContract.color.text.secondary,
  fontFamily: themeContract.font.family.sans,
  textAlign: 'center',
});
