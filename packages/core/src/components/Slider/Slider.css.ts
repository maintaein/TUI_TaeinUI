import { style, styleVariants } from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';
import { focusRing } from '../../tokens/focusRing.css';

// Container
export const container = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  width: '100%',
});

// Label Container
export const labelContainer = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '0.25rem',
});

// Label
export const label = style({
  fontSize: themeContract.font.size.sm,
  fontWeight: themeContract.font.weight.medium,
  color: themeContract.color.text.primary,
  fontFamily: themeContract.font.family.sans,
});

// Required
export const required = style({
  color: themeContract.color.error.main,
  marginLeft: '0.25rem',
});

// Value Display
export const valueDisplay = style({
  fontSize: themeContract.font.size.sm,
  fontWeight: themeContract.font.weight.semibold,
  color: themeContract.color.primary.dark,
  fontFamily: themeContract.font.family.sans,
  minWidth: '3rem',
  textAlign: 'right',
});

// Slider Wrapper
export const sliderWrapper = style({
  position: 'relative',
  width: '100%',
  alignItems: 'center',
});

// Slider Track (background)
export const sliderTrack = style({
  position: 'absolute',
  top: '50%',
  left: 0,
  right: 0,
  height: '6px',
  // 트랙의 임무는 그 위에 올라타는 것과 대비되는 것이다. fill(primary.main)과
  // 썸 테두리가 어두우니 면은 연하게 두고, 식별성은 border.strong 경계선이
  // 맡는다(SegmentedButtons·NumericSpinner 컨테이너와 같은 전략).
  backgroundColor: themeContract.color.background.paper,
  boxShadow: `inset 0 0 0 1px ${themeContract.color.border.strong}`,
  borderRadius: '3px',
  transform: 'translateY(-50%)',
  pointerEvents: 'none',
});

// Slider Fill Track (filled portion)
export const sliderFillTrack = style({
  position: 'absolute',
  top: '50%',
  left: 0,
  width: '100%',
  height: '6px',
  backgroundColor: themeContract.color.primary.main,
  borderRadius: '3px',
  // translateY(-50%)는 세로 중앙 정렬, scaleX(var(...))는 JS가 매 프레임 쓰는
  // 채움 비율이다 — 한쪽이 다른 쪽을 덮어쓰지 않도록 하나의 transform으로 합성한다.
  transform: 'translateY(-50%) scaleX(var(--slider-fill-scale, 0))',
  transformOrigin: 'left center',
  pointerEvents: 'none',
  // width가 아닌 transform을 전이하므로 컴포지터에서 처리되어 레이아웃 재계산이
  // 없다. 0.05s는 드래그 중 fill이 thumb를 프레임 단위로 따라붙게 하려는 의도된
  // 값이라 duration 토큰으로 올리지 않는다(T8 하드코딩 duration 검사의 의도된 예외).
  transition: 'transform 0.05s ease-out',
});

// Slider Input
export const slider = style({
  width: '100%',
  height: '44px',
  backgroundColor: 'transparent',
  appearance: 'none',
  WebkitAppearance: 'none',
  cursor: 'pointer',
  position: 'relative',
  zIndex: 1,
  margin: 0,

  selectors: {
    // Webkit thumb
    '&::-webkit-slider-thumb': {
      appearance: 'none',
      WebkitAppearance: 'none',
      width: '24px',
      height: '24px',
      borderRadius: '50%',
      backgroundColor: themeContract.color.background.paper,
      border: `2px solid ${themeContract.color.primary.main}`,
      cursor: 'pointer',
      transition: `border-color ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}, box-shadow ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}, transform ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}`,
      boxShadow: '0 1px 4px rgba(0, 0, 0, 0.15)',
      marginTop: '-9px',
    },
    '&:hover::-webkit-slider-thumb': {
      borderColor: themeContract.color.primary.main,
      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
      transform: 'scale(1.1)',
    },
    '&:active::-webkit-slider-thumb': {
      borderColor: themeContract.color.primary.dark,
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
      // hover(1.1)보다 커야 한다 — 드래그 중엔 :hover와 :active가 동시에
      // 매칭되고 소스 순서상 :active가 이기므로, 여기서 hover보다 작은 값을
      // 쓰면 "잡고 있는 동안 썸이 rest 크기로 보인다".
      transform: 'scale(1.15)',
    },
    '&:focus-visible::-webkit-slider-thumb': {
      ...focusRing(),
    },
    '&:disabled::-webkit-slider-thumb': {
      backgroundColor: themeContract.color.background.paper,
      borderColor: themeContract.color.text.disabled,
      cursor: 'not-allowed',
    },

    // Firefox thumb
    '&::-moz-range-thumb': {
      width: '24px',
      height: '24px',
      borderRadius: '50%',
      backgroundColor: themeContract.color.background.paper,
      border: `2px solid ${themeContract.color.primary.main}`,
      cursor: 'pointer',
      transition: `border-color ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}, box-shadow ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}, transform ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}`,
      boxShadow: '0 1px 4px rgba(0, 0, 0, 0.15)',
    },
    '&:hover::-moz-range-thumb': {
      borderColor: themeContract.color.primary.main,
      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
      transform: 'scale(1.1)',
    },
    '&:active::-moz-range-thumb': {
      borderColor: themeContract.color.primary.dark,
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
      // webkit과 같은 이유로 hover(1.1)보다 크게 둔다.
      transform: 'scale(1.15)',
    },
    '&:focus-visible::-moz-range-thumb': {
      ...focusRing(),
    },
    '&:disabled::-moz-range-thumb': {
      backgroundColor: themeContract.color.background.paper,
      borderColor: themeContract.color.text.disabled,
      cursor: 'not-allowed',
    },

    // Tracks
    '&::-webkit-slider-runnable-track': {
      height: '6px',
      backgroundColor: 'transparent',
    },
    '&::-moz-range-track': {
      height: '6px',
      backgroundColor: 'transparent',
    },

    // Disabled
    '&:disabled': {
      cursor: 'not-allowed',
      opacity: 0.5,
    },

    // Focus
    '&:focus-visible': {
      outline: 'none',
    },
  },
});

// Size Variants
export const sizeVariants = styleVariants({
  sm: {},
  md: {},
  lg: {},
});

// Helper Text
export const helperText = style({
  fontSize: themeContract.font.size.xs,
  color: themeContract.color.text.secondary,
  fontFamily: themeContract.font.family.sans,
  marginTop: '0.25rem',
});

// Marks Container
export const marksContainer = style({
  position: 'relative',
  width: '100%',
  height: '20px',
  marginTop: '0.25rem',
});

// Mark
export const mark = style({
  position: 'absolute',
  top: 0,
  transform: 'translateX(-50%)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
});

// Mark Label
export const markLabel = style({
  fontSize: themeContract.font.size.xs,
  color: themeContract.color.text.secondary,
  fontFamily: themeContract.font.family.sans,
  whiteSpace: 'nowrap',
  marginTop: '0.25rem',
});
