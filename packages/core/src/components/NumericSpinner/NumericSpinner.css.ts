import { style, styleVariants } from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';
import { focusRing } from '../../tokens/focusRing.css';

// input container 스타일
export const inputContainer = style({
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  backgroundColor: themeContract.color.background.paper,
  // 바깥 테두리는 없다(사용자 관문, M5 task-29): 입력칸 자신의 테두리가 이미 한 겹
  // 있어 상자 안에 상자로 읽혔다. 면과 반경은 남겨 한 덩어리로 읽히게 한다.
  borderRadius: '8px',
  transition: `background-color ${themeContract.animation.duration.fast} ease-in-out`,
  width: 'fit-content',

  selectors: {
    '&:has(input:disabled)': {
      backgroundColor: themeContract.color.surface.default,
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

// 숫자 칸 상자(사용자 관문 2, M5 task-29): 숫자 칸의 겉모습(테두리·반경·면·포커스·오류)은
// 이 상자가 갖고 상자는 움직이지 않는다. <input>의 글자만 따로 변형할 수 없어서
// 눌림(채널 A)과 넛지(채널 B)는 안쪽 <input>에만 걸고, 상자는 그 움직임이 밖으로
// 새지 않게 overflow를 자른다. 상자는 inline-flex라 입력의 폭이 상자의 폭을 정한다
// (소비자의 style={{ width }}가 <input>에 붙어도 상자가 따라 넓어진다).
export const inputBox = style({
  display: 'inline-flex',
  overflow: 'hidden',
  border: `1px solid ${themeContract.color.border.default}`,
  backgroundColor: themeContract.color.background.paper,
  borderRadius: '6px',
  margin: '0 8px',
  transition: `background-color ${themeContract.animation.duration.base} ease`,

  selectors: {
    '&:has(input:disabled)': {
      backgroundColor: themeContract.color.surface.default,
    },
    // 사용자 요구(M5 task-29): 클릭 때 테두리 색에 3px 후광과 2px 바깥 링이 겹쳐
    // 세 겹으로 칠해지던 것을 걷고, TextField와 같이 테두리 색 한 겹으로 둔다.
    // 포커스 표시는 테두리 색 변화와 캐럿이 맡는다(WCAG 2.4.7). 증감 버튼은 캐럿이
    // 없어 :focus-visible 링을 그대로 둔다.
    '&:focus-within': {
      borderColor: themeContract.color.primary.main,
    },
  },
});

export const input = style({
  display: 'block',
  border: 'none',
  outline: 'none',
  backgroundColor: 'transparent',
  color: themeContract.color.text.primary,
  fontFamily: 'inherit',
  textAlign: 'center',
  // 값이 오를 때 '1'과 '8'의 폭 차이로 숫자가 좌우로 흔들리는 것을 막는다.
  fontVariantNumeric: themeContract.font.variantNumeric.tabular,
  appearance: 'textfield',
  fontSize: '0.875rem',
  fontWeight: 500,
  padding: '0.5rem 0',
  margin: 0,
  // scale(눌림)과 y(자리수 nudge)는 GSAP이 소유한다(M3 T3d). transform을 여기서
  // 전이하면 GSAP이 매 프레임 쓰는 인라인 transform과 CSS 전이가 같은 속성을 놓고
  // 싸운다.
  transition: `color ${themeContract.animation.duration.base} ease`,

  selectors: {
    // 눌림 중 색만 CSS가 맡는다(단독 채널 금지, Article 4). 굴곡(채널 B의
    // nudge)이 같이 있어 색은 보조 채널로 유효하다. 예전 clickPulse
    // 키프레임은 500ms에 한 번 끝나 가속이 계속되는데도 모션이 사라졌다.
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
    },
    '&:read-only': {
      cursor: 'default',
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
  // scale(눌림 깊이)은 이제 GSAP이 소유한다(M3 T3d, 채널 A). 길게 누르는
  // 동안 더 깊어지고 뗄 때 부푸는 걸 CSS 전이는 표현할 수 없고, 같이 두면 서로 싸운다.
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

// error 상태. 숫자 칸 상자에만 건다: 오류는 상자 테두리 하나만 빨갛다. !important는
// 같은 상자의 :focus-within 테두리 색(primary)보다 이겨 포커스 때도 빨강을 지킨다.
export const error = style({
  borderColor: `${themeContract.color.error.main} !important`,
});
