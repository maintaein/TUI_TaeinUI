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
  // fill이 이제 이 트랙의 자식이다(Ruling 22). fill 자신의 border-radius를 없애는
  // 대신 트랙이 자르므로, scaleX가 0에 가까워져도 반지름이 트랙 높이의 절반을
  // 넘어 찌그러지는 일이 없다 — 이 3px 반경과 6px 높이가 스케일 없이 그대로 캡이 된다.
  overflow: 'hidden',
});

// Slider Fill Track (filled portion)
export const sliderFillTrack = style({
  width: '100%',
  height: '100%',
  backgroundColor: themeContract.color.primary.main,
  // scaleX(var(...))는 JS가 매 프레임 쓰는 채움 비율이다. 위치·세로 정렬·둥근
  // 캡은 이제 부모 트랙(overflow: hidden, 6px, 3px 반경) 소관이라 fill은
  // scaleX 하나만 든다(Ruling 22 — 이전엔 translateY(-50%)와 합성해야 했다).
  transform: 'scaleX(var(--slider-fill-scale, 0))',
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

// Scrub Ticks Container (M3 T4) — 잡은 동안만 마운트되는 눈금 묶음. GSAP
// 타임라인이 opacity·scaleY로 전체를 함께 올리고 내린다. marks(:209-233)와는
// 이름도 DOM도 별개다 — marks는 사용자 지정 전 구간 표식이고, 이건 썸 근방에
// 자동 계산되는 임시 표식이다.
export const scrubTicksContainer = style({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  pointerEvents: 'none',
  transformOrigin: 'center bottom',
});

// Scrub Tick — scrubTicksContainer 안에서 파생 간격으로 돋는 한 칸.
export const scrubTick = style({
  position: 'absolute',
  top: '50%',
  width: '2px',
  height: '10px',
  backgroundColor: themeContract.color.text.secondary,
  transform: 'translate(-50%, -50%)',
});

// Scrub Tick Landed — 놓은 자리에 남는 한 칸. scrubTick과 다른 클래스로 분리해
// **존재(별개 요소)와 길이**로 구분한다(명제 조항 4 — 색만으로 구분하지 않는다).
export const scrubTickLanded = style({
  position: 'absolute',
  top: '50%',
  width: '2px',
  height: '14px',
  backgroundColor: themeContract.color.primary.main,
  transform: 'translate(-50%, -50%)',
  pointerEvents: 'none',
});

// Value Follower (M3 T4 · M0.5 I2) — 잡은 동안 썸을 따라가는 값 표시.
// showValue(라벨 행의 고정 출력, :36-43)와 별개이고 그것을 대체하지 않는다.
// left는 quickTo가 매 프레임 쓰는 --slider-value-follower-percent 커스텀
// 속성에서 나온다 — Ruling 23: getBoundingClientRect() 대신 값에서 나온 %다.
/** quickTo가 매 프레임 쓰는 값 표시 위치 채널. 이름을 복제하지 말고 이것을 import하라. */
export const VALUE_FOLLOWER_PERCENT_VAR = '--slider-value-follower-percent';

export const valueFollower = style({
  position: 'absolute',
  top: '-1.5rem',
  left: `calc(var(${VALUE_FOLLOWER_PERCENT_VAR}, 0) * 1%)`,
  transform: 'translateX(-50%)',
  fontSize: themeContract.font.size.xs,
  fontWeight: themeContract.font.weight.semibold,
  color: themeContract.color.primary.dark,
  fontFamily: themeContract.font.family.sans,
  whiteSpace: 'nowrap',
  pointerEvents: 'none',
});
