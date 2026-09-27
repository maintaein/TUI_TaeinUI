import { style, styleVariants } from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';
import { focusRing } from '../../tokens/focusRing.css';

// 등장·퇴장은 CSS가 아니라 GSAP 타임라인이 소유한다(M3 T2). 키프레임은 진행 중
// progress를 읽을 수도 되돌릴 수도 없어서 여는 도중 닫으면 시트가 점프했다.

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
