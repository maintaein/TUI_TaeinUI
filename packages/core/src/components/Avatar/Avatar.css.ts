import { style, styleVariants } from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';
import { focusRing } from '../../tokens/focusRing.css';

export const avatar = style({
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: themeContract.color.background.paper,
  color: themeContract.color.text.primary,
  fontWeight: themeContract.font.weight.medium,
  userSelect: 'none',
  flexShrink: 0,
});

// Avatar 크기 스타일
export const sizeStyles = styleVariants({
  xs: {
    width: '24px',
    height: '24px',
    fontSize: themeContract.font.size.xs,
  },
  sm: {
    width: '32px',
    height: '32px',
    fontSize: themeContract.font.size.sm,
  },
  md: {
    width: '40px',
    height: '40px',
    fontSize: themeContract.font.size.base,
  },
  lg: {
    width: '48px',
    height: '48px',
    fontSize: themeContract.font.size.lg,
  },
  xl: {
    width: '64px',
    height: '64px',
    fontSize: themeContract.font.size.xl,
  },
});

export const variantStyles = styleVariants({
  circular: {
    borderRadius: '50%',
  },
  rounded: {
    borderRadius: themeContract.borderRadius.md,
  },
  square: {
    borderRadius: '0',
  },
});

// 이미지·fallback을 모양대로 깎는 안쪽 래퍼. 클립을 루트에 두면 원형에서
// 오른쪽 아래 상태 배지(루트 모서리 기준)가 같이 깎인다. 배지는 이 밖에 둔다.
export const avatarClip = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  height: '100%',
  borderRadius: 'inherit',
  overflow: 'hidden',
});

export const image = style({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
});

export const fallbackText = style({
  lineHeight: 1,
});

// 상태 뱃지 스타일
export const statusBadge = style({
  position: 'absolute',
  bottom: '0',
  right: '0',
  width: '25%',
  height: '25%',
  borderRadius: '50%',
  border: `2px solid ${themeContract.color.background.paper}`,
});

export const statusOnline = style({
  backgroundColor: themeContract.color.success.main,
});

export const statusOffline = style({
  backgroundColor: themeContract.color.text.disabled,
});

export const statusBusy = style({
  backgroundColor: themeContract.color.error.main,
});

export const statusAway = style({
  backgroundColor: themeContract.color.warning.main,
});

// 클릭 가능 Avatar
export const clickable = style({
  cursor: 'pointer',
  touchAction: 'manipulation',
  border: 'none',
  padding: 0,
  background: 'none',
  textDecoration: 'none',
  color: 'inherit',
  font: 'inherit',
  transition: `filter ${themeContract.animation.duration.base} ease, transform ${themeContract.animation.duration.fast} ease`,

  ':hover': {
    filter: 'brightness(0.9)',
  },

  ':active': {
    transform: 'scale(0.95)',
  },

  ':focus-visible': {
    ...focusRing(),
  },
});

// bouncy(선택 효과). 위치·크기는 GSAP이 인라인 transform으로 쓰므로 CSS가
// 같은 transform을 또 보간하거나(clickable의 transition) :active로 줄이면
// (scale(0.95)) 움직임이 끌리고 확대와 싸운다. 둘만 빼고 filter 전이는 남긴다.
// transitionProperty만 좁히면 clickable의 filter 길이·곡선이 그대로 남는다.
// clickable 뒤에 두어 같은 특이도에서 이긴다.
export const bouncyStyle = style({
  transitionProperty: 'filter',

  ':hover': {
    zIndex: 1,
  },

  ':active': {
    transform: 'none',
  },

  ':focus-visible': {
    zIndex: 1,
  },
});

export const avatarGroup = style({
  display: 'flex',
  alignItems: 'center',
});

export const spacingStyles = styleVariants({
  sm: {
    marginLeft: '-8px',
  },
  md: {
    marginLeft: '-12px',
  },
  lg: {
    marginLeft: '-16px',
  },
});

export const groupAvatar = style({
  border: `2px solid ${themeContract.color.background.paper}`,
  selectors: {
    '&:first-child': {
      marginLeft: '0',
    },
  },
});

// 나머지 개수 표시 Avatar
export const excessAvatar = style({
  backgroundColor: themeContract.color.surface.hover,
  color: themeContract.color.text.secondary,
  fontSize: themeContract.font.size.sm,
  fontWeight: themeContract.font.weight.semibold,
});
