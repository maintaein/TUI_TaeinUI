import { style, styleVariants } from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';
import { focusRing } from '../../tokens/focusRing.css';

// Container 스타일
export const container = style({
  display: 'inline-flex',
  alignItems: 'center',
  backgroundColor: themeContract.color.background.paper,
  boxShadow: `inset 0 0 0 1px ${themeContract.color.border.strong}`,
  borderRadius: themeContract.borderRadius.lg,
  padding: '1px',
  gap: '4px',
  width: 'fit-content',
  position: 'relative',
});

// 표시의 그림자를 맡는 층. 표시를 clip-path로 자르면 box-shadow도 같이 잘려서,
// 자르지 않는 이 부모가 자른 결과의 윤곽을 drop-shadow로 그린다. 트랙 전체 폭이라
// 안쪽 표시의 두 가장자리가 트랙 왼쪽 기준 px 좌표가 된다.
export const indicatorShadow = style({
  position: 'absolute',
  top: '3px',
  left: 0,
  width: '100%',
  height: 'calc(100% - 6px)',
  pointerEvents: 'none',
  filter: 'drop-shadow(0 2px 8px rgba(0, 102, 255, 0.25))',
  zIndex: 0,
});

// 트랙 전체 폭의 파란 층. 보이는 부분은 clip-path가 정한다: 두 가장자리 L·R을
// GSAP이 트윈하고 onUpdate에서 inline으로 쓴다(M5 task-19). 둥근 끝(borderRadius.md)은
// clip-path의 round가 그려서 늘어나도 납작해지지 않는다. 여기 값은 JS가 쓰기 전
// (서버 렌더)의 숨은 모습이다.
export const activeIndicator = style({
  display: 'block',
  width: '100%',
  height: '100%',
  backgroundColor: themeContract.color.primary.main,
  clipPath: 'inset(0 100% 0 0)',
});

// Size Variants
export const sizeVariants = styleVariants({
  sm: {
    height: '44px',
  },
  md: {
    height: '44px',
  },
  lg: {
    height: '52px',
  },
});

// Full Width
export const fullWidth = style({
  width: '100%',
});

// Button (label) 스타일
export const button = style({
  flex: 1,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0 16px',
  border: 'none',
  backgroundColor: 'transparent',
  color: themeContract.color.text.secondary,
  fontSize: themeContract.font.size.sm,
  fontWeight: themeContract.font.weight.medium,
  fontFamily: themeContract.font.family.sans,
  cursor: 'pointer',
  touchAction: 'manipulation',
  position: 'relative',
  zIndex: 1,
  borderRadius: themeContract.borderRadius.md,
  height: '85%',
  userSelect: 'none',
  outline: 'none',
  transition: `color ${themeContract.animation.duration.slow} ease, transform ${themeContract.animation.duration.fast} ease`,

  selectors: {
    '&:hover:not(.disabled):not(.selected)': {
      color: themeContract.color.text.primary,
    },

    '&:focus-visible': {
      ...focusRing(),
    },

    // ✅ 중첩 대신 조합형 selector로 표현
    '&.selected': {
      color: themeContract.color.primary.contrast,
      fontWeight: themeContract.font.weight.semibold,
      transform: 'scale(1)',
      transition: `transform ${themeContract.animation.duration.slow} ease, text-shadow ${themeContract.animation.duration.slow} ease`,
    },
    '&.selected:hover': {
      textShadow: '0 0 8px rgba(255, 255, 255, 0.5)',
    },
    '&.selected:active': {
      textShadow: 'none',
    },

    '&.disabled': {
      color: themeContract.color.text.disabled,
      cursor: 'not-allowed',
      opacity: 0.5,
      transform: 'none',
    },
    '&.iconOnly': {
      minWidth: '44px',
      padding: '0 12px',
    },
  },
});

// Button Content
export const buttonContent = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
});

// Icon Wrapper
export const iconWrapper = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1.25em',
});

// Label Text
export const labelText = style({
  whiteSpace: 'nowrap',
});

// Radio Input (숨김)
export const radioInput = style({
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
});
