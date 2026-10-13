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
    // 토큰에 같은 값이 없어 둔다(shadows.css.ts에 0 2px 8px가 없다).
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    border: 'none',
  },
  filled: {
    backgroundColor: themeContract.color.surface.hover,
    border: 'none',
    boxShadow: 'none',
  },
});

export const clickable = style({
  cursor: 'pointer',
  touchAction: 'manipulation',

  ':focus-visible': {
    ...focusRing(),
  },
});

// 선택 기능(hoverLift). 클릭 가능한 카드도 기본으로는 떠오르지 않는다.
// 그림자 두 값(0 4px 12px / 0 2px 8px)도 토큰에 같은 값이 없어 둔다.
export const hoverLift = style({
  '@media': {
    // 터치는 탭하면 호버가 발생해 떠오른 채 들러붙는다. 마우스에서만 켠다.
    '(hover: hover) and (pointer: fine)': {
      selectors: {
        // 타이밍 함수는 얹지 않는다(리뷰 C3). 포인터를 떼도 :hover는 계속
        // 매치되므로 여기 롱핸드를 두면 cardRoot의 속성별 목록이 값 하나로
        // 무너져 transform의 snap 해제 오버슛이 영영 안 보인다.
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          transitionDuration: themeContract.animation.duration.base,
        },
      },
    },
  },

  // "끝까지 안 들어가고 버틴다": scale(0.99)로 얕게, translateY는 hover
  // 값(-3px)의 일부만 반납한다(-1px).
  ':active': {
    transform: 'scale(0.99) translateY(-1px)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    transitionDuration: themeContract.animation.duration.fast,
    transitionTimingFunction: themeContract.animation.easing.exit,
  },
});

export const disabled = style({
  opacity: 0.5,
  cursor: 'not-allowed',
  pointerEvents: 'none',
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
