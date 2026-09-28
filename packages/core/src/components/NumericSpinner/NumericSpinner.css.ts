import { style, styleVariants } from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';
import { focusRing } from '../../tokens/focusRing.css';

// input container 스타일
export const inputContainer = style({
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  backgroundColor: themeContract.color.background.paper,
  border: `1px solid ${themeContract.color.border.strong}`,
  borderRadius: '8px',
  transition: `background-color ${themeContract.animation.duration.fast} ease-in-out, border-color ${themeContract.animation.duration.fast} ease-in-out, box-shadow ${themeContract.animation.duration.fast} ease-in-out`,
  width: 'fit-content',

  selectors: {
    '&:has(input:disabled)': {
      backgroundColor: themeContract.color.surface.default,
      borderColor: themeContract.color.background.paper,
      cursor: 'not-allowed',
    },
    '&:has(input:read-only)': {
      backgroundColor: themeContract.color.surface.default,
      cursor: 'default',
    },
  },
});

// size variants
export const size = styleVariants({
  sm: {
    padding: '0.25rem',
  },
  md: {
    padding: '0.375rem',
  },
  lg: {
    padding: '0.5rem',
  },
});

export const input = style({
  border: `1px solid ${themeContract.color.border.default}`,
  outline: 'none',
  backgroundColor: themeContract.color.background.paper,
  color: themeContract.color.text.primary,
  fontFamily: 'inherit',
  textAlign: 'center',
  // 값이 오를 때 '1'과 '8'의 폭 차이로 숫자가 좌우로 흔들리는 것을 막는다.
  fontVariantNumeric: themeContract.font.variantNumeric.tabular,
  appearance: 'textfield',
  fontSize: '0.875rem',
  fontWeight: 500,
  padding: '0.5rem 0',
  margin: '0 8px',
  borderRadius: '6px',
  // y(자리수 nudge)는 이제 GSAP이 소유한다(M3 T3d) — transform을 여기서 전이하면
  // GSAP이 매 프레임 쓰는 인라인 transform과 CSS 전이가 같은 속성을 놓고 싸운다.
  transition: `background-color ${themeContract.animation.duration.base} ease, color ${themeContract.animation.duration.base} ease, box-shadow ${themeContract.animation.duration.fast} ${themeContract.animation.easing.settle}`,

  selectors: {
    // 눌림 중 색만 CSS가 맡는다(단독 채널 금지, Article 4) — 굴곡(채널 B의
    // nudge)이 같이 있어 색은 보조 채널로 유효하다. 예전 clickPulse
    // 키프레임은 500ms에 한 번 끝나 가속이 계속되는데도 모션이 사라졌다 —
    // 지금은 채널 A·B가 눌려 있는 동안 계속 산다(M3 T3d).
    [`${inputContainer}:has(button:active:not(:disabled)) &`]: {
      color: themeContract.color.primary.main,
    },
    '&::placeholder': {
      color: themeContract.color.text.disabled,
    },
    '&:disabled': {
      color: themeContract.color.text.disabled,
      cursor: 'not-allowed',
      backgroundColor: themeContract.color.surface.default,
    },
    '&:read-only': {
      cursor: 'default',
    },
    '&:focus': {
      borderColor: themeContract.color.primary.main,
      boxShadow: `0 0 0 3px ${themeContract.color.overlay.focusHalo}`,
      ...focusRing(),
    },
    '&::-webkit-outer-spin-button': {
      appearance: 'none',
      margin: 0,
    },
    '&::-webkit-inner-spin-button': {
      appearance: 'none',
      margin: 0,
    },
  },
});

// input size variants
export const inputSize = styleVariants({
  sm: {
    width: '50px',
  },
  md: {
    width: '50px',
  },
  lg: {
    width: '60px',
  },
});

// button 공통 스타일
export const button = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: 'none',
  backgroundColor: 'transparent',
  color: themeContract.color.text.primary,
  cursor: 'pointer',
  touchAction: 'manipulation',
  // scale(눌림 깊이)은 이제 GSAP이 소유한다(M3 T3d, 채널 A) — 길게 누르는
  // 동안 0.92→0.86로 깊어지는 걸 CSS 전이는 표현할 수 없고, 같이 두면 서로 싸운다.
  transition: `background-color ${themeContract.animation.duration.fast} ease-in-out, color ${themeContract.animation.duration.fast} ease-in-out`,
  flexShrink: 0,
  minWidth: '44px',
  minHeight: '44px',
  padding: '0.5rem',
  borderRadius: '4px',

  selectors: {
    '&:hover:not(:disabled)': {
      backgroundColor: themeContract.color.surface.hover,
      color: themeContract.color.primary.main,
    },
    '&:active:not(:disabled)': {
      backgroundColor: themeContract.color.surface.active,
    },
    '&:disabled': {
      color: themeContract.color.text.disabled,
      cursor: 'not-allowed',
    },
    '&:focus-visible': {
      ...focusRing(),
    },
  },
});

export const buttonSize = styleVariants({
  sm: {
    width: '20px',
    height: '20px',
  },
  md: {
    width: '24px',
    height: '24px',
  },
  lg: {
    width: '28px',
    height: '28px',
  },
});

export const decrementButton = style({});
export const incrementButton = style({});

// error 상태
export const error = style({
  borderColor: `${themeContract.color.error.main} !important`,

  selectors: {
    '&:focus-within': {
      borderColor: `${themeContract.color.error.main} !important`,
      boxShadow: `0 0 0 3px ${themeContract.color.overlay.errorHalo}`,
    },
  },
});
