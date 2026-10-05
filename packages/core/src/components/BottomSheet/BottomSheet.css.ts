import { keyframes, style, styleVariants } from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';
import { focusRing } from '../../tokens/focusRing.css';

// 등장·퇴장은 CSS가 아니라 GSAP 타임라인이 소유한다(M3 T2). 키프레임은 진행 중
// progress를 읽을 수도 되돌릴 수도 없어서 여는 도중 닫으면 시트가 점프했고,
// 드래그는 같은 transform을 놓고 키프레임과 다퉜다.
//
// 유일한 예외가 열린 동안의 float 루프다. 이건 등장·퇴장이 아니라 쉬는 자리
// 주변의 반복이고 되돌릴 상태가 없어서 @keyframes가 맞는 도구다(공통 제약 §2).
// GSAP이 쓰는 `transform`(yPercent·y)과 부딪치지 않도록 개별 `translate` 속성만
// 쓴다. 두 속성은 따로 합성된다.

/** 0%·100%가 쉬는 자리다. 축소 모드에서 루프가 1회로 접혀도 그 자리에 멈춘다. */
const float = keyframes({
  '0%, 100%': { translate: '0 0' },
  '50%': { translate: '0 -3px' },
});

export const bottomSheetContainer = style({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: themeContract.zIndex.modal,
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
});

export const backdrop = style({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: themeContract.color.overlay.scrim,
  zIndex: -1,
});

export const bottomSheet = style({
  position: 'relative',
  backgroundColor: themeContract.color.background.default,
  borderTopLeftRadius: themeContract.borderRadius.xl,
  borderTopRightRadius: themeContract.borderRadius.xl,
  boxShadow: themeContract.shadow['2xl'],
  width: '100%',
  maxWidth: '600px',
  maxHeight: '90vh',
  outline: 'none',
  display: 'flex',
  flexDirection: 'column',

  ':focus': {
    outline: 'none',
  },

  selectors: {
    // 등장이 끝난 뒤에만 `data-floating`이 붙고 시트가 사라질 때까지 그대로다
    // (떼면 `translate`가 0으로 돌아가 시트가 툭 떨어진다). 드래그 중·닫는 중에는
    // 아래 `data-float-paused`가 그 자리에 세운다.
    // 주기는 `loop.base`의 두 배(3s)다. 한 바퀴가 전이가 아니라서 loop 토큰을 쓴다.
    '&[data-floating]': {
      animation: `${float} calc(${themeContract.animation.loop.base} * 2) ${themeContract.animation.easing.drift} infinite`,
    },
    // `animation` 단축 속성이 play-state를 리셋하므로 반드시 위 규칙 **뒤에** 둔다.
    '&[data-float-paused]': {
      animationPlayState: 'paused',
    },
    // 시트가 뜨는 동안(등장 bounce 16px + float 3px) 바닥에 비는 틈을 같은 배경으로
    // 가린다. 32px는 둘의 합에 여유를 더한 값이다. 시트에 overflow가 없어서 잘리지 않고,
    // 클릭을 가로채지 않는다.
    '&::after': {
      content: '""',
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      height: '32px',
      backgroundColor: themeContract.color.background.default,
      pointerEvents: 'none',
    },
  },
});

export const heightStyles = styleVariants({
  auto: {
    height: 'auto',
  },
  sm: {
    height: '30vh',
  },
  md: {
    height: '50vh',
  },
  lg: {
    height: '70vh',
  },
  full: {
    height: '100vh',
    maxHeight: '100vh',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
});

export const handle = style({
  width: '48px',
  height: '4px',
  backgroundColor: themeContract.color.border.default,
  borderRadius: themeContract.borderRadius.full,
  margin: `${themeContract.spacing[3]} auto ${themeContract.spacing[2]}`,
  cursor: 'grab',

  ':active': {
    cursor: 'grabbing',
  },
});

export const header = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${themeContract.spacing[4]} ${themeContract.spacing[6]}`,
  borderBottom: `1px solid ${themeContract.color.border.default}`,
  flexShrink: 0,
});

export const title = style({
  margin: 0,
  fontSize: themeContract.font.size.lg,
  fontWeight: themeContract.font.weight.semibold,
  color: themeContract.color.text.primary,
  lineHeight: themeContract.font.lineHeight.tight,
});

export const closeButton = style({
  padding: themeContract.spacing[2],
  backgroundColor: 'transparent',
  border: 'none',
  cursor: 'pointer',
  touchAction: 'manipulation',
  borderRadius: themeContract.borderRadius.md,
  color: themeContract.color.text.secondary,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: `background-color ${themeContract.animation.duration.fast} ${themeContract.animation.easing.settle}`,

  ':hover': {
    backgroundColor: themeContract.color.background.paper,
  },

  ':focus-visible': {
    ...focusRing(),
  },
});

export const content = style({
  padding: themeContract.spacing[6],
  overflowY: 'auto',
  flex: 1,
});
