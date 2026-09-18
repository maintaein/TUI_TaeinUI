import { style, styleVariants, keyframes } from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';
import { focusRing } from '../../tokens/focusRing.css';

// 애니메이션 정의
const slideInFromTop = keyframes({
  '0%': {
    transform: 'translateY(-100%)',
    opacity: 0,
  },
  '100%': {
    transform: 'translateY(0)',
    opacity: 1,
  },
});

const slideInFromBottom = keyframes({
  '0%': {
    transform: 'translateY(100%)',
    opacity: 0,
  },
  '100%': {
    transform: 'translateY(0)',
    opacity: 1,
  },
});

// center 위치용 애니메이션 (translateX(-50%) 포함)
const slideInFromTopCenter = keyframes({
  '0%': {
    transform: 'translateX(-50%) translateY(-100%)',
    opacity: 0,
  },
  '100%': {
    transform: 'translateX(-50%) translateY(0)',
    opacity: 1,
  },
});

const slideInFromBottomCenter = keyframes({
  '0%': {
    transform: 'translateX(-50%) translateY(100%)',
    opacity: 0,
  },
  '100%': {
    transform: 'translateX(-50%) translateY(0)',
    opacity: 1,
  },
});

// 기본 스타일
export const snackbar = style({
  position: 'fixed',
  zIndex: themeContract.zIndex.toast,
  display: 'flex',
  alignItems: 'center',
  padding: themeContract.spacing[3],
  borderRadius: themeContract.borderRadius.base,
  boxShadow: themeContract.shadow.lg,
  minWidth: '288px',
  maxWidth: '568px',
  fontFamily: themeContract.font.family.sans,
  fontSize: themeContract.font.size.sm,
  fontWeight: themeContract.font.weight.medium,
  lineHeight: themeContract.font.lineHeight.normal,
  color: themeContract.color.primary.contrast,
});

// Severity 스타일
export const severityStyles = styleVariants({
  success: {
    backgroundColor: themeContract.color.success.main,
    color: themeContract.color.success.contrast,
  },
  error: {
    backgroundColor: themeContract.color.error.main,
    color: themeContract.color.error.contrast,
  },
  warning: {
    backgroundColor: themeContract.color.warning.main,
    color: themeContract.color.warning.contrast,
  },
  // 값은 primary와 같지만 어휘를 계약에 맞춘다. primary를 빌려 쓰면 브랜드 색을
  // 바꿀 때 정보 알림 색까지 따라 바뀐다.
  info: {
    backgroundColor: themeContract.color.info.main,
    color: themeContract.color.info.contrast,
  },
});

// Position 스타일 (각 위치에 맞는 애니메이션 적용)
export const positionStyles = styleVariants({
  'top-left': {
    top: themeContract.spacing[6],
    left: themeContract.spacing[6],
    animation: `${slideInFromTop} ${themeContract.animation.duration.slow} ${themeContract.animation.easing.easeOut}`,
  },
  'top-center': {
    top: themeContract.spacing[6],
    left: '50%',
    transform: 'translateX(-50%)',
    animation: `${slideInFromTopCenter} ${themeContract.animation.duration.slow} ${themeContract.animation.easing.easeOut}`,
  },
  'top-right': {
    top: themeContract.spacing[6],
    right: themeContract.spacing[6],
    animation: `${slideInFromTop} ${themeContract.animation.duration.slow} ${themeContract.animation.easing.easeOut}`,
  },
  'bottom-left': {
    bottom: themeContract.spacing[6],
    left: themeContract.spacing[6],
    animation: `${slideInFromBottom} ${themeContract.animation.duration.slow} ${themeContract.animation.easing.easeOut}`,
  },
  'bottom-center': {
    bottom: themeContract.spacing[6],
    left: '50%',
    transform: 'translateX(-50%)',
    animation: `${slideInFromBottomCenter} ${themeContract.animation.duration.slow} ${themeContract.animation.easing.easeOut}`,
  },
  'bottom-right': {
    bottom: themeContract.spacing[6],
    right: themeContract.spacing[6],
    animation: `${slideInFromBottom} ${themeContract.animation.duration.slow} ${themeContract.animation.easing.easeOut}`,
  },
});

// Content 스타일
export const content = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
  gap: themeContract.spacing[3],
});

// Message 스타일
export const message = style({
  flex: 1,
});

// Actions 스타일
export const actions = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeContract.spacing[2],
  marginLeft: 'auto',
});

// Close button 스타일
export const closeButton = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '44px',
  height: '44px',
  padding: 0,
  border: 'none',
  background: 'transparent',
  color: 'inherit',
  fontSize: themeContract.font.size.base,
  lineHeight: 1,
  cursor: 'pointer',
  touchAction: 'manipulation',
  opacity: 0.8,
  transition: `opacity ${themeContract.animation.duration.base} ${themeContract.animation.easing.easeInOut}`,

  ':hover': {
    opacity: 1,
  },

  ':focus-visible': {
    ...focusRing('currentColor'),
    borderRadius: themeContract.borderRadius.sm,
    opacity: 1,
  },
});

// 시각적으로만 숨기는 라이브 리전. SegmentedButtons.css.ts의 radioInput과 같은
// 모양이다 — display: none·visibility: hidden은 접근성 트리에서도 지워져 쓸 수 없다.
export const visuallyHidden = style({
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
