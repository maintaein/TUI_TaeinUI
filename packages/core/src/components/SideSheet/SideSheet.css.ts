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

const slideInRight = keyframes({
  '0%': {
    transform: 'translateX(100%)',
  },
  '100%': {
    transform: 'translateX(0)',
  },
});

const slideOutRight = keyframes({
  '0%': {
    transform: 'translateX(0)',
  },
  '100%': {
    transform: 'translateX(100%)',
  },
});

const slideInLeft = keyframes({
  '0%': {
    transform: 'translateX(-100%)',
  },
  '100%': {
    transform: 'translateX(0)',
  },
});

const slideOutLeft = keyframes({
  '0%': {
    transform: 'translateX(0)',
  },
  '100%': {
    transform: 'translateX(-100%)',
  },
});

export const sideSheetContainer = style({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: themeContract.zIndex.modal,
  display: 'flex',
});

export const backdrop = style({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: themeContract.color.overlay.scrim,
  zIndex: -1,
});

export const backdropEnter = style({
  animation: `${fadeIn} 0.2s ${themeContract.animation.easing.settle}`,
});

// 등장(0.2s, 안 건드림)의 65%로 압축 — 조항 3의 60~70% 창 안. duration.base(200ms)로는
// 100%(대칭)가 돼 창을 벗어나 리터럴로 남긴다(패널 exit처럼 딱 맞는 토큰이 없음).
export const backdropExit = style({
  animation: `${fadeOut} 0.13s ${themeContract.animation.easing.exit} forwards`,
});

export const sideSheet = style({
  position: 'relative',
  backgroundColor: themeContract.color.background.default,
  boxShadow: themeContract.shadow['2xl'],
  height: '100vh',
  outline: 'none',
  display: 'flex',
  flexDirection: 'column',
  overflowY: 'auto',

  ':focus': {
    outline: 'none',
  },
});

export const positionStyles = styleVariants({
  right: {
    marginLeft: 'auto',
  },
  left: {
    marginRight: 'auto',
  },
});

export const sideSheetEnterRight = style({
  animation: `${slideInRight} 0.3s ${themeContract.animation.easing.settle}`,
});

export const sideSheetExitRight = style({
  animation: `${slideOutRight} ${themeContract.animation.duration.base} ${themeContract.animation.easing.exit} forwards`,
});

export const sideSheetEnterLeft = style({
  animation: `${slideInLeft} 0.3s ${themeContract.animation.easing.settle}`,
});

export const sideSheetExitLeft = style({
  animation: `${slideOutLeft} ${themeContract.animation.duration.base} ${themeContract.animation.easing.exit} forwards`,
});

export const widthStyles = styleVariants({
  sm: {
    width: '300px',
    maxWidth: '80vw',
  },
  md: {
    width: '400px',
    maxWidth: '85vw',
  },
  lg: {
    width: '600px',
    maxWidth: '90vw',
  },
  full: {
    width: '100vw',
    maxWidth: '100vw',
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
  touchAction: 'manipulation',
  borderRadius: themeContract.borderRadius.md,
  color: themeContract.color.text.secondary,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: `background-color ${themeContract.animation.duration.fast} ${themeContract.animation.easing.settle}`,

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
