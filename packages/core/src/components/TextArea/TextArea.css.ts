import { style, styleVariants } from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';
import { focusRing } from '../../tokens/focusRing.css';

// textarea container 스타일
export const textareaContainer = style({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
});

/**
 * 미러와 textarea가 둘 다 쓰는 텍스트 기하. 한 곳에만 적는다 — 두 군데 적으면
 * 다음 사람이 한쪽만 고치고, 그러면 사용자가 자기 글자를 1px 어긋난 자리에서 읽는다.
 */
const textMetrics = {
  sm: { fontSize: '0.875rem', padding: '0.5rem 0.75rem' },
  md: { fontSize: '1rem', padding: '0.75rem 1rem' },
  lg: { fontSize: '1.125rem', padding: '1rem 1.25rem' },
} as const;

// size variants
export const size = styleVariants(textMetrics);

/** 미러 전용 텍스트 기하 — textarea와 같은 textMetrics 객체를 스프레드한다 (Ruling 48). */
export const mirrorSize = styleVariants(textMetrics);

/**
 * lineHeight: 1.5는 아래 textarea 기본 스타일(:38 부근)에도 있다 — 미러는 textarea
 * 클래스를 안 받으므로 같은 값을 여기 명시해야 한다(브리프가 명시적으로 요구한 중복).
 */
export const mirror = style({
  lineHeight: 1.5,
});

// textarea 기본 스타일
export const textarea = style({
  width: '100%',
  border: `1px solid ${themeContract.color.text.secondary}`,
  borderRadius: '8px',
  backgroundColor: themeContract.color.background.paper,
  color: themeContract.color.text.primary,
  fontFamily: 'inherit',
  outline: 'none',
  transition: `background-color ${themeContract.animation.duration.fast} ${themeContract.animation.easing.settle}, border-color ${themeContract.animation.duration.fast} ${themeContract.animation.easing.settle}, box-shadow ${themeContract.animation.duration.fast} ${themeContract.animation.easing.settle}, color ${themeContract.animation.duration.fast} ${themeContract.animation.easing.settle}`,
  lineHeight: 1.5,
  resize: 'none',

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
