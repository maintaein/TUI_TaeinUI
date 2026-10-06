import { style, styleVariants } from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';
import { focusRing } from '../../tokens/focusRing.css';

// 등장·퇴장은 CSS가 아니라 GSAP 타임라인이 소유한다(M3 T2). 열린 동안의 float
// 루프만 CSS이고 `_internal/sheetFloat.css.ts`에 있다.

export const bottomSheetContainer = style({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: themeContract.zIndex.modal,
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
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

export const bottomSheet = style({
  position: 'relative',
  backgroundColor: themeContract.color.background.default,
  borderTopLeftRadius: themeContract.borderRadius.xl,
  borderTopRightRadius: themeContract.borderRadius.xl,
  boxShadow: themeContract.shadow['2xl'],
  width: '100%',
  maxWidth: '600px',
  maxHeight: '90vh',
  outline: 'none',
  display: 'flex',
  flexDirection: 'column',

  ':focus': {
    outline: 'none',
  },

  selectors: {
    // 시트가 뜨는 동안(등장 bounce 16px + float 3px) 바닥에 비는 틈을 같은 배경으로
    // 가린다. 32px는 둘의 합에 여유를 더한 값이다. 시트에 overflow가 없어서 잘리지 않고,
    // 클릭을 가로채지 않는다.
    '&::after': {
      content: '""',
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      height: '32px',
      backgroundColor: themeContract.color.background.default,
      pointerEvents: 'none',
    },
  },
});

export const heightStyles = styleVariants({
  auto: {
    height: 'auto',
  },
  sm: {
    height: '30vh',
  },
  md: {
    height: '50vh',
  },
  lg: {
    height: '70vh',
  },
  full: {
    height: '100vh',
    maxHeight: '100vh',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
});

export const handle = style({
  width: '48px',
  height: '4px',
  backgroundColor: themeContract.color.border.default,
  borderRadius: themeContract.borderRadius.full,
  margin: `${themeContract.spacing[3]} auto ${themeContract.spacing[2]}`,
  cursor: 'grab',

  ':active': {
    cursor: 'grabbing',
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
