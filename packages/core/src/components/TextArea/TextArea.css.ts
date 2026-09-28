import { style, styleVariants } from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';
import { focusRing } from '../../tokens/focusRing.css';
import { BORDER_WIDTH } from '../../_internal/mirrorOverlay.css';

// textarea container 스타일
export const textareaContainer = style({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
});

/** textarea가 쓰는 세로·가로 패딩(rem) — 축마다 값이 달라 숫자로 따로 쥔다 (Ruling 82). */
const PADDING = {
  sm: { v: 0.5, h: 0.75 },
  md: { v: 0.75, h: 1 },
  lg: { v: 1, h: 1.25 },
} as const;

/** textarea·container 양쪽에 같은 값이 붙는다(이중 패딩 구조, 손대지 않는다) — Ruling 82 설명 참고. */
const paddingOf = (size: keyof typeof PADDING, multiplier: 1 | 2): string =>
  `${PADDING[size].v * multiplier}rem ${PADDING[size].h * multiplier}rem`;

/** 공유 line-height. textarea 기본 스타일과 미러 양쪽에 쓴다 (M-2 — 리터럴 중복 제거). */
const LINE_HEIGHT = 1.5;

/**
 * 미러와 textarea가 둘 다 쓰는 텍스트 기하. 한 곳에만 적는다 — 두 군데 적으면
 * 다음 사람이 한쪽만 고치고, 그러면 사용자가 자기 글자를 1px 어긋난 자리에서 읽는다.
 */
const textMetrics = {
  sm: { fontSize: '0.875rem', padding: paddingOf('sm', 1) },
  md: { fontSize: '1rem', padding: paddingOf('md', 1) },
  lg: { fontSize: '1.125rem', padding: paddingOf('lg', 1) },
} as const;

// size variants
export const size = styleVariants(textMetrics);

/**
 * 미러 전용 텍스트 기하 (Ruling 82, C-3). container가 textarea와 같은 패딩을 또
 * 두르는 이중 패딩 구조라(그대로 둔다, 범위 밖) 미러의 절대 배치 기준(container의
 * padding box)은 container의 패딩을 못 보고 지나친다. 미러 자신의 패딩을 2배로
 * 주면, 그 결과 글자 시작점(자기 테두리 1px + 자기 패딩 2X)이 실제 textarea의
 * 글자 시작점(container 패딩 X + textarea 테두리 1px + textarea 자기 패딩 X = 2X+1)과
 * 같아진다 — inset이나 container·textarea의 기존 패딩은 그대로 둔다.
 */
const mirrorTextMetrics = {
  sm: { ...textMetrics.sm, padding: paddingOf('sm', 2) },
  md: { ...textMetrics.md, padding: paddingOf('md', 2) },
  lg: { ...textMetrics.lg, padding: paddingOf('lg', 2) },
} as const;

export const mirrorSize = styleVariants(mirrorTextMetrics);

/**
 * lineHeight: 미러는 textarea 클래스를 안 받으므로 같은 값을 여기 명시해야 한다
 * (브리프가 명시적으로 요구한 중복).
 */
export const mirror = style({
  lineHeight: LINE_HEIGHT,
});

// textarea 기본 스타일
export const textarea = style({
  width: '100%',
  border: `${BORDER_WIDTH}px solid ${themeContract.color.text.secondary}`,
  borderRadius: '8px',
  backgroundColor: themeContract.color.background.paper,
  color: themeContract.color.text.primary,
  fontFamily: 'inherit',
  outline: 'none',
  transition: `background-color ${themeContract.animation.duration.fast} ${themeContract.animation.easing.settle}, border-color ${themeContract.animation.duration.fast} ${themeContract.animation.easing.settle}, box-shadow ${themeContract.animation.duration.fast} ${themeContract.animation.easing.settle}, color ${themeContract.animation.duration.fast} ${themeContract.animation.easing.settle}`,
  lineHeight: LINE_HEIGHT,
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
