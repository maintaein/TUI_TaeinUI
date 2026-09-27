import { style, styleVariants } from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';
import { focusRing } from '../../tokens/focusRing.css';

// 등장·퇴장은 CSS가 아니라 GSAP 타임라인이 소유한다(M3 T2). 키프레임은 진행 중
// progress를 읽을 수도 되돌릴 수도 없어서 여는 도중 닫으면 요소가 점프했다.

export const modalContainer = style({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: themeContract.zIndex.modal,
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'center',
  padding: themeContract.spacing[10],
  overflowY: 'auto',
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

export const modalDialog = style({
  position: 'relative',
  backgroundColor: themeContract.color.background.default,
  borderRadius: themeContract.borderRadius.lg,
  boxShadow: themeContract.shadow.xl,
  maxWidth: '100%',
  outline: 'none',
  margin: 'auto 0',

  ':focus': {
    outline: 'none',
  },
});

export const sizeStyles = styleVariants({
  sm: {
    width: '400px',
  },
  md: {
    width: '600px',
  },
  lg: {
    width: '800px',
  },
  xl: {
    width: '1000px',
  },
  full: {
    width: 'calc(100vw - 64px)',
    maxHeight: 'calc(100vh - 64px)',
  },
});

// Compound API 서브 컴포넌트 스타일

export const modalHeader = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${themeContract.spacing[4]} ${themeContract.spacing[5]}`,
  borderBottom: `1px solid ${themeContract.color.border.default}`,
  gap: themeContract.spacing[3],
});

export const modalHeaderContent = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeContract.spacing[3],
  flex: 1,
  minWidth: 0,
});

export const modalTitle = style({
  margin: 0,
  fontSize: themeContract.font.size.lg,
  fontWeight: themeContract.font.weight.semibold,
  color: themeContract.color.text.primary,
  lineHeight: themeContract.font.lineHeight.tight,
});

export const modalCloseButton = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '44px',
  height: '44px',
  padding: 0,
  border: 'none',
  borderRadius: themeContract.borderRadius.base,
  backgroundColor: 'transparent',
  color: themeContract.color.text.secondary,
  cursor: 'pointer',
  touchAction: 'manipulation',
  flexShrink: 0,
  transition: `background-color ${themeContract.animation.duration.fast} ${themeContract.animation.easing.settle}, color ${themeContract.animation.duration.fast} ${themeContract.animation.easing.settle}`,

  ':hover': {
    backgroundColor: themeContract.color.surface.hover,
    color: themeContract.color.text.primary,
  },

  ':focus-visible': {
    ...focusRing(),
  },

  ':active': {
    backgroundColor: themeContract.color.surface.active,
  },
});

export const modalContent = style({
  padding: themeContract.spacing[5],
  flex: 1,
  overflowY: 'auto',
  color: themeContract.color.text.primary,
});

export const modalFooter = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeContract.spacing[3],
  padding: `${themeContract.spacing[4]} ${themeContract.spacing[5]}`,
  borderTop: `1px solid ${themeContract.color.border.default}`,
});

export const footerAlignStyles = styleVariants({
  left: {
    justifyContent: 'flex-start',
  },
  center: {
    justifyContent: 'center',
  },
  right: {
    justifyContent: 'flex-end',
  },
});
