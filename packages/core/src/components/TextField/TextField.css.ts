import { style, styleVariants } from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';
import { focusRing } from '../../tokens/focusRing.css';

// input container 스타일
export const inputContainer = style({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
});

/**
 * 미러와 input이 둘 다 쓰는 텍스트 기하. 한 곳에만 적는다 — 두 군데 적으면
 * 다음 사람이 한쪽만 고치고, 그러면 사용자가 자기 글자를 1px 어긋난 자리에서 읽는다.
 *
 * lineHeight는 콘텐츠 박스 높이와 같다: sm·md는 44 − (테두리 1 × 2) = 42,
 * lg는 52 − 2 = 50. input의 단일행 세로 중앙 정렬을 미러가 line-height로 재현한다.
 */
const textMetrics = {
  sm: { fontSize: '0.875rem', lineHeight: '42px' },
  md: { fontSize: '1rem', lineHeight: '42px' },
  lg: { fontSize: '1.125rem', lineHeight: '50px' },
} as const;

/** 미러와 input이 둘 다 쓰는 좌우 패딩. */
const TEXT_PADDING = '0 1rem';

// size variants
export const size = styleVariants({
  sm: { height: '44px', ...textMetrics.sm },
  md: { height: '44px', ...textMetrics.md },
  lg: { height: '52px', ...textMetrics.lg },
});

/** 미러 전용 텍스트 기하 — input과 같은 textMetrics 객체를 스프레드한다 (Ruling 48). */
export const mirrorSize = styleVariants(textMetrics);

/** 미러의 좌우 패딩. 색·폰트는 mirrorOverlay.css.ts가 가지고 있다. */
export const mirror = style({
  padding: TEXT_PADDING,
});

// input 기본 스타일
export const input = style({
  width: '100%',
  padding: TEXT_PADDING,
  border: `1px solid ${themeContract.color.text.secondary}`,
  borderRadius: '8px',
  backgroundColor: themeContract.color.background.paper,
  color: themeContract.color.text.primary,
  fontFamily: 'inherit',
  outline: 'none',
  transition: `background-color ${themeContract.animation.duration.fast} ${themeContract.animation.easing.settle}, border-color ${themeContract.animation.duration.fast} ${themeContract.animation.easing.settle}, box-shadow ${themeContract.animation.duration.fast} ${themeContract.animation.easing.settle}, color ${themeContract.animation.duration.fast} ${themeContract.animation.easing.settle}`,

  selectors: {
    '&::placeholder': {
      color: themeContract.color.text.secondary,
    },
    '&:hover:not(:disabled)': {
      borderColor: themeContract.color.primary.main,
    },
    '&:focus-visible': {
      borderColor: themeContract.color.border.focus,
      boxShadow: `0 0 0 3px ${themeContract.color.overlay.focusHalo}`,
      ...focusRing(),
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

  selectors: {
    '&:focus': {
      borderColor: `${themeContract.color.error.main} !important`,
      boxShadow: `0 0 0 3px ${themeContract.color.overlay.errorHalo}`,
    },
  },
});
