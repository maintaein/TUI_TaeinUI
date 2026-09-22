import { style, styleVariants } from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';
import { focusRing } from '../../tokens/focusRing.css';

export const cardRoot = style({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: themeContract.color.background.paper,
  borderRadius: themeContract.borderRadius.lg,
  overflow: 'hidden',
  transition: `transform ${themeContract.animation.duration.base} ${themeContract.animation.easing.snap}, box-shadow ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}, opacity ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}`,
  border: 'none',
  textAlign: 'left',
  width: '100%',
});

export const variantStyles = styleVariants({
  outlined: {
    border: `1px solid ${themeContract.color.border.default}`,
    boxShadow: 'none',
  },
  elevated: {
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    border: 'none',
  },
  filled: {
    backgroundColor: themeContract.color.surface.hover,
    border: 'none',
    boxShadow: 'none',
  },
  // hover/전이는 아래 clickable이 단일 출처로 갖는다(T3 병합 판단 — 값이
  // 같아도 두 곳에 정의돼 있으면 결판은 시트 순서에 맡겨진다는 게 문제였다).
  // interactive는 onClick 없이도 쓰일 수 있어 이 경우 hover가 사라지지만,
  // "interactive"라는 이름 자체가 클릭 결합을 전제한다고 보고 감수한다.
  interactive: {
    border: `2px solid ${themeContract.color.border.default}`,
    boxShadow: 'none',
  },
});

export const clickable = style({
  cursor: 'pointer',
  touchAction: 'manipulation',

  ':hover': {
    transform: 'translateY(-3px)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    transitionDuration: themeContract.animation.duration.base,
    transitionTimingFunction: themeContract.animation.easing.settle,
  },

  // "끝까지 안 들어가고 버틴다" — scale(0.99)로 얕게, translateY는 hover
  // 값(-3px)의 일부만 반납한다(-1px).
  ':active': {
    transform: 'scale(0.99) translateY(-1px)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    transitionDuration: themeContract.animation.duration.fast,
    transitionTimingFunction: themeContract.animation.easing.exit,
  },

  ':focus-visible': {
    ...focusRing(),
  },
});

export const disabled = style({
  opacity: 0.5,
  cursor: 'not-allowed',
  pointerEvents: 'none',

  ':hover': {
    transform: 'none',
    boxShadow: 'none',
  },
});

export const cardImageWrapper = style({
  position: 'relative',
  width: '100%',
  aspectRatio: '16 / 9',
  overflow: 'hidden',
  flexShrink: 0,
});

export const cardImage = style({
  width: '100%',
  height: '100%',
  display: 'block',
  objectFit: 'cover',
});

export const cardImageOverlay = style({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: themeContract.color.overlay.scrim,
  color: themeContract.color.text.inverse,
});

export const cardHeader = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: themeContract.spacing[4],
  borderBottom: `1px solid ${themeContract.color.border.default}`,
  gap: themeContract.spacing[2],
});

export const cardTitle = style({
  margin: 0,
  fontSize: themeContract.font.size.lg,
  fontWeight: themeContract.font.weight.semibold,
  color: themeContract.color.text.primary,
  lineHeight: themeContract.font.lineHeight.tight,
});

export const cardBody = style({
  flex: 1,
});

export const paddingStyles = styleVariants({
  none: {
    padding: 0,
  },
  sm: {
    padding: themeContract.spacing[2],
  },
  md: {
    padding: themeContract.spacing[4],
  },
  lg: {
    padding: themeContract.spacing[6],
  },
});

export const cardFooter = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: themeContract.spacing[4],
  borderTop: `1px solid ${themeContract.color.border.default}`,
  gap: themeContract.spacing[2],
});
