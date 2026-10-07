import { style, styleVariants } from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';

/** 테두리 두께(px). */
const BORDER_WIDTH = 1;

/** textarea가 쓰는 세로·가로 패딩(rem) — 축마다 값이 달라 숫자로 따로 쥔다 (Ruling 82). */
const PADDING = {
  sm: { v: 0.5, h: 0.75 },
  md: { v: 0.75, h: 1 },
  lg: { v: 1, h: 1.25 },
} as const;

const paddingOf = (size: keyof typeof PADDING): string =>
  `${PADDING[size].v}rem ${PADDING[size].h}rem`;

const textMetrics = {
  sm: { fontSize: '0.875rem', padding: paddingOf('sm') },
  md: { fontSize: '1rem', padding: paddingOf('md') },
  lg: { fontSize: '1.125rem', padding: paddingOf('lg') },
} as const;

// size variants
export const size = styleVariants(textMetrics);

// textarea 기본 스타일
export const textarea = style({
  width: '100%',
  border: `${BORDER_WIDTH}px solid ${themeContract.color.text.secondary}`,
  borderRadius: '8px',
  backgroundColor: themeContract.color.background.paper,
  color: themeContract.color.text.primary,
  fontFamily: 'inherit',
  outline: 'none',
  transition: `background-color ${themeContract.animation.duration.fast} ${themeContract.animation.easing.settle}, border-color ${themeContract.animation.duration.fast} ${themeContract.animation.easing.settle}, color ${themeContract.animation.duration.fast} ${themeContract.animation.easing.settle}`,
  lineHeight: 1.5,
  resize: 'none',

  selectors: {
    '&::placeholder': {
      color: themeContract.color.text.secondary,
    },
    '&:hover:not(:disabled)': {
      borderColor: themeContract.color.primary.main,
    },
    // 사용자 요구(M5 task-15): 클릭·키보드 모두 호버와 같은 테두리 색. 후광과
    // 바깥 링은 없다. 포커스 표시는 테두리 색과 캐럿이 맡는다(WCAG 2.4.7).
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
