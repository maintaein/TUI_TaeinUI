import { style, styleVariants } from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';

export const avatar = style({
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
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
  // 배경은 루트가 아니라 여기서 그린다. 루트(overflow 없음)와 이 클립이 같은 반경으로
  // 겹쳐 그려지면 안티에일리어싱 가장자리에 루트 배경이 비쳐 번진다.
  backgroundColor: themeContract.color.background.paper,
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
  // ponytail: 루트에는 그림자가 없다(포커스 링은 ::before). 경계 시험(animationBoundary)이 상태에서 boxShadow를
  // 바꾸는 블록의 목록에 box-shadow를 요구하고 가상 요소를 가리지 못해 넣는다. 시험이 가려 주면 뺀다
  transition: `filter ${themeContract.animation.duration.base} ease, transform ${themeContract.animation.duration.fast} ease, box-shadow ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}`,

  ':hover': {
    filter: 'brightness(0.9)',
  },

  ':active': {
    transform: 'scale(0.95)',
  },

  selectors: {
    // 테두리가 원래 없는 면이라 가장자리 안쪽에 primary 2px가 생긴다. 이미지·fallback 래퍼가 자식으로 덮으니
    // 루트의 inset 그림자가 아니라 ::before에 그린다(위치가 잡힌 자식이라 래퍼 위, 뒤에 오는 상태 배지 아래).
    // 대비는 primary 대 흰 바탕 4.60, 대 fallback 면(paper) 4.41. 이미지 위는 이미지에 달렸다.
    // ponytail: 사진 위 대비는 사진마다 다르다, 사진이 primary와 3:1이 안 되는 사례가 나오면 흰 안쪽 겹을 더한다
    // AvatarGroup에서 뒤 형제가 겹친 쪽의 테두리를 가리지 않게 포커스된 아바타를 위로 올린다
    '&:focus-visible': {
      outline: 'none',
      zIndex: 1,
    },
    '&:focus-visible::before': {
      content: '""',
      position: 'absolute',
      inset: 0,
      borderRadius: 'inherit',
      pointerEvents: 'none',
      boxShadow: `inset 0 0 0 2px ${themeContract.color.border.focus}`,
    },
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
