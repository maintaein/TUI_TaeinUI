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
  transition: 'background-color 0.2s ease',

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
  transition: 'transform 0.2s ease',
});

export const iconExpanded = style({
  transform: 'rotate(180deg)',
});

export const contentWrapper = style({
  display: 'grid',
  gridTemplateRows: '0fr',
  transition: 'grid-template-rows 0.3s ease-in-out',
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
