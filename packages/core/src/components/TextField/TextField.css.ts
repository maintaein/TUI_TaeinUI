import { style, styleVariants } from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';

/** 테두리 두께(px). input의 border와 lineHeight 역산이 같은 값을 쓴다. */
const BORDER_WIDTH = 1;

const HEIGHT = { sm: 44, md: 44, lg: 52 } as const;

/**
 * input의 텍스트 기하. lineHeight는 콘텐츠 박스 높이(HEIGHT − 테두리 2개)와 같다:
 * 단일행 세로 중앙 정렬을 line-height로 맞춘다.
 */
const textMetrics = {
  sm: {
    fontSize: '0.875rem',
    lineHeight: `${HEIGHT.sm - BORDER_WIDTH * 2}px`,
  },
  md: {
    fontSize: '1rem',
    lineHeight: `${HEIGHT.md - BORDER_WIDTH * 2}px`,
  },
  lg: {
    fontSize: '1.125rem',
    lineHeight: `${HEIGHT.lg - BORDER_WIDTH * 2}px`,
  },
} as const;

/** 좌우 패딩. */
const TEXT_PADDING = '0 1rem';

// size variants
export const size = styleVariants({
  sm: { height: `${HEIGHT.sm}px`, ...textMetrics.sm },
  md: { height: `${HEIGHT.md}px`, ...textMetrics.md },
  lg: { height: `${HEIGHT.lg}px`, ...textMetrics.lg },
});

// input 기본 스타일
export const input = style({
  width: '100%',
  padding: TEXT_PADDING,
  border: `${BORDER_WIDTH}px solid ${themeContract.color.text.secondary}`,
  borderRadius: '8px',
  backgroundColor: themeContract.color.background.paper,
  color: themeContract.color.text.primary,
  fontFamily: 'inherit',
  outline: 'none',
  transition: `background-color ${themeContract.animation.duration.fast} ${themeContract.animation.easing.settle}, border-color ${themeContract.animation.duration.fast} ${themeContract.animation.easing.settle}, color ${themeContract.animation.duration.fast} ${themeContract.animation.easing.settle}`,

  selectors: {
    '&::placeholder': {
      color: themeContract.color.text.secondary,
    },
    '&:hover:not(:disabled)': {
      borderColor: themeContract.color.primary.main,
    },
    // 사용자 요구(M5 task-15): 클릭 때 테두리를 따라 굵은 색선이 붙는 것을 걷고,
    // 클릭·키보드 모두 호버와 같은 테두리 색으로 둔다. 포커스 표시는 테두리 색
    // 변화와 캐럿이 맡는다(WCAG 2.4.7). :focus-visible이 아니라 :focus인 이유는
    // 마우스 클릭도 같은 모양이어야 해서다.
    '&:focus': {
      borderColor: themeContract.color.primary.main,
    },
    '&:disabled': {
      backgroundColor: themeContract.color.surface.default,
      color: themeContract.color.text.disabled,
      borderColor: themeContract.color.border.default,
      cursor: 'not-allowed',
    },
    '&:disabled::placeholder': {
      color: themeContract.color.text.disabled,
    },
    '&:read-only:not(:disabled)': {
      backgroundColor: themeContract.color.surface.default,
      borderColor: themeContract.color.border.strong,
      cursor: 'default',
    },
  },
});

// error 상태
export const error = style({
  borderColor: `${themeContract.color.error.main} !important`,
});
