import { style, styleVariants, keyframes } from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';

// 애니메이션 정의
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
  animation: `${progress} ${themeContract.animation.loop.base} cubic-bezier(0.4, 0, 0.2, 1) infinite`,
});

export const barSizeStyles = styleVariants({
  sm: { width: '100px' },
  md: { width: '200px' },
  lg: { width: '300px' },
  xl: { width: '400px' },
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
