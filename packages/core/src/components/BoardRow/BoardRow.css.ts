import { style, styleVariants } from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';
import { focusRing } from '../../tokens/focusRing.css';

// 아코디언 아이템 컨테이너
export const boardRow = style({
  width: '100%',
  borderRadius: themeContract.borderRadius.md,
  overflow: 'hidden',
  boxSizing: 'border-box',
});

export const variantStyles = styleVariants({
  default: {
    backgroundColor: 'transparent',
  },
  outlined: {
    border: `1px solid ${themeContract.color.border.default}`,
  },
  filled: {
    backgroundColor: themeContract.color.background.paper,
  },
});

// 헤더 버튼
export const header = style({
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: themeContract.spacing[3],
  padding: themeContract.spacing[4],
  border: 'none',
  backgroundColor: 'transparent',
  fontSize: themeContract.font.size.base,
  fontWeight: themeContract.font.weight.medium,
  color: themeContract.color.text.primary,
  textAlign: 'left',
  cursor: 'pointer',
  touchAction: 'manipulation',
  transition: `background-color ${themeContract.animation.duration.base} ease`,

  ':hover': {
    backgroundColor: themeContract.color.background.paper,
  },

  ':focus-visible': {
    ...focusRing(),
    outlineOffset: '-2px',
  },

  ':disabled': {
    cursor: 'not-allowed',
    opacity: 0.6,
    backgroundColor: 'transparent',
  },
});

export const title = style({
  flex: 1,
});

export const iconContainer = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '24px',
  height: '24px',
  flexShrink: 0,
  transition: `transform ${themeContract.animation.duration.base} ease`,
});

export const iconExpanded = style({
  transform: 'rotate(180deg)',
});

export const contentWrapper = style({
  display: 'grid',
  gridTemplateRows: '0fr',
  // grid-template-rows는 transform·opacity가 아니라 레이아웃 속성이라 매 프레임
  // 리플로우가 난다. 그래도 여기서만 쓰는 이유는 아코디언이 펼칠 콘텐츠의 높이를
  // 미리 알 수 없어서다 — max-height 근사는 점프하거나 늦게 끝나고, 높이를
  // 모르고도 자연 높이까지 여는 방법은 grid-template-rows의 0fr→1fr뿐이다.
  transition: `grid-template-rows ${themeContract.animation.duration.slow} ease-in-out`,
});

export const wrapperExpanded = style({
  gridTemplateRows: '1fr',
});

export const content = style({
  overflow: 'hidden',
  minHeight: 0,
});

// 내부 콘텐츠 패딩
export const contentInner = style({
  padding: `0 ${themeContract.spacing[4]} ${themeContract.spacing[4]}`,
  color: themeContract.color.text.secondary,
  fontSize: themeContract.font.size.sm,
  lineHeight: themeContract.font.lineHeight.relaxed,
});
