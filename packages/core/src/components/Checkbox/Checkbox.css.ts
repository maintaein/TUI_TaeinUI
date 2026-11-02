import { style, styleVariants } from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';

// 상자 테두리 두께(px). 채움 층의 음수 inset이 같은 값을 쓴다.
const BORDER_WIDTH = 2;

export const wrapper = style({
  display: 'inline-flex',
  flexDirection: 'column',
  gap: '0.25rem',
});

export const checkboxLabel = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
  minWidth: '44px',
  minHeight: '44px',
  cursor: 'pointer',
  touchAction: 'manipulation',
  userSelect: 'none',

  selectors: {
    '&:has(input:disabled)': {
      cursor: 'not-allowed',
      opacity: 0.5,
    },
  },
});

export const checkboxContainer = style({
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
});

export const size = styleVariants({
  sm: {
    width: '16px',
    height: '16px',
  },
  md: {
    width: '20px',
    height: '20px',
  },
  lg: {
    width: '24px',
    height: '24px',
  },
});

export const checkbox = style({
  position: 'absolute',
  width: 0,
  height: 0,
  opacity: 0,
  // 포커스는 옆 상자(checkmark)의 테두리가 알린다. 숨은 입력에는 브라우저 기본 링도 없다.
  outline: 'none',
  cursor: 'pointer',
  touchAction: 'manipulation',

  selectors: {
    '&:disabled': {
      cursor: 'not-allowed',
    },
  },
});

export const checkmark = style({
  width: '100%',
  height: '100%',
  border: `${BORDER_WIDTH}px solid ${themeContract.color.text.secondary}`,
  // 반경 토큰 sm(0.25rem)과 px로는 같다. 상자 크기가 px 고정이라 반경도 px로 둔다.
  borderRadius: '4px',
  backgroundColor: themeContract.color.background.paper,
  transition: `background-color ${themeContract.animation.duration.fast} ${themeContract.animation.easing.settle}, border-color ${themeContract.animation.duration.fast} ${themeContract.animation.easing.settle}, box-shadow ${themeContract.animation.duration.fast} ${themeContract.animation.easing.settle}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  // 채움 층의 넘침(스프링이 1을 넘는 순간)을 둥근 모서리 안에서 자른다.
  overflow: 'hidden',

  selectors: {
    '&:hover': {
      borderColor: themeContract.color.text.primary,
    },

    // 키보드 포커스는 상자 자신의 테두리 색이 primary로 바뀌는 것으로 알린다(바깥 링 없음).
    'input:focus-visible + &': {
      borderColor: themeContract.color.primary.main,
    },

    // 이미 테두리가 primary인 체크·불확정은 색만으로는 전후가 같다. 테두리를 한 단계
    // 짙게 하고 안쪽에 1px를 더 둘러(::after) 3px 짙은 틀로 굵어 보이게 한다.
    'input:checked:focus-visible + &': {
      borderColor: themeContract.palette.primary[900],
    },
    'input:indeterminate:focus-visible + &': {
      borderColor: themeContract.palette.primary[900],
    },
    'input:checked:focus-visible + &::after': {
      boxShadow: `inset 0 0 0 1px ${themeContract.palette.primary[900]}`,
    },
    'input:indeterminate:focus-visible + &::after': {
      boxShadow: `inset 0 0 0 1px ${themeContract.palette.primary[900]}`,
    },
    // 위 안쪽 띠를 그리는 층. 평소에는 아무것도 칠하지 않는다.
    '&::after': {
      content: '""',
      position: 'absolute',
      inset: 0,
      borderRadius: 'inherit',
      pointerEvents: 'none',
    },

    // 상자 자신의 배경은 체크로 바뀌지 않는다. 차오르는 건 채움 층(markFill)이다.
    'input:checked + &': {
      borderColor: themeContract.color.primary.main,
    },

    'input:indeterminate + &': {
      borderColor: themeContract.color.primary.main,
    },

    'input:disabled + &': {
      backgroundColor: themeContract.color.surface.default,
      borderColor: themeContract.color.border.default,
      cursor: 'not-allowed',
    },

    'input:disabled:checked + &': {
      borderColor: themeContract.color.text.disabled,
    },
  },
});

/**
 * 상자 안에서 가운데부터 차오르는 채움 층. `scale`은 GSAP이 쓴다(진행값 `t`에서
 * `scale(max(t, 0))`). 색은 input의 체크 여부와 무관하게 정한다: 해제 중에는
 * input이 이미 unchecked라, 체크 여부를 따르면 줄어드는 채움이 색을 잃는다.
 * 안 차 있을 때는 scale(0)이라 보이지 않는다.
 */
export const markFill = style({
  position: 'absolute',
  // 채움을 border box 크기(테두리 두께만큼 바깥)로 깔고 `overflow: hidden`이 padding
  // box로 자르게 한다. `inset: 0`에 `border-radius: inherit`(바깥 반경)면 padding box의
  // 안쪽 반경(바깥 반경 - 테두리 두께)보다 채움 모서리가 더 둥글어 네 모서리에 상자
  // 배경이 쐐기로 비친다. 이렇게 하면 채움 모서리가 클립 바깥으로 밀려나 빈틈이 없다.
  // 크기와 무관하게 테두리 두께는 같아 sm·md·lg 모두 맞다.
  inset: `${-BORDER_WIDTH}px`,
  borderRadius: 'inherit',
  transformOrigin: 'center',
  backgroundColor: themeContract.color.primary.main,
  pointerEvents: 'none',

  selectors: {
    [`input:disabled + ${checkmark} > &`]: {
      backgroundColor: themeContract.color.text.disabled,
    },
  },
});

export const markSvg = style({
  // 채움 층(absolute) 위에 그려지도록 쌓임 순서를 올린다.
  position: 'relative',
  width: '100%',
  height: '100%',
  display: 'block',
  overflow: 'visible',
});

export const markPath = style({
  fill: 'none',
  stroke: themeContract.color.primary.contrast,
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  // GSAP이 d·strokeDasharray·strokeDashoffset을 소유한다. 트랜지션 없음.
});

export const error = style({
  borderColor: `${themeContract.color.error.main} !important`,

  selectors: {
    // 오류+포커스: 테두리는 오류 색 그대로이고 안쪽 2px를 더해 굵어 보이게 한다(바깥 후광 없음).
    'input:focus-visible + &::after': {
      boxShadow: `inset 0 0 0 2px ${themeContract.color.error.main} !important`,
    },
  },
});

export const labelText = style({
  fontSize: '0.875rem',
  fontWeight: 500,
  color: themeContract.color.text.primary,
  lineHeight: 1.5,
});

export const required = style({
  color: themeContract.color.error.main,
  marginLeft: '0.25rem',
});

export const helperText = style({
  fontSize: '0.75rem',
  color: themeContract.color.text.secondary,
  marginLeft: 'calc(16px + 0.5rem)',
});

export const errorMessage = style({
  fontSize: '0.75rem',
  color: themeContract.color.error.main,
  marginLeft: 'calc(16px + 0.5rem)',
});
