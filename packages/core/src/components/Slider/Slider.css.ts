import { style, styleVariants } from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';
import { focusRing } from '../../tokens/focusRing.css';
import {
  LINE_BAR_REST,
  LINE_BOX_HEIGHT,
  LINE_REST,
  WAKE_BAR_MAX_HEIGHT,
  WAKE_REST_SCALE,
} from './sliderMath';

/** 마우스(호버·정밀 포인터)에서만. 터치에는 호버가 없다. */
const HOVER_GATE = '(hover: hover) and (pointer: fine)';

/** 호버로 크기가 바뀌는 규칙은 움직임 축소 모드에서 빠진다(색·그림자는 남는다). */
const HOVER_GROW_GATE = `${HOVER_GATE} and (prefers-reduced-motion: no-preference)`;

/** 호버하면 머리가 부푸는 배율. 잡는 동안(:active)도 같다. */
const THUMB_HOVER_SCALE = 1.15;

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

// 변형 클래스. 모양은 자식(트랙·채움·머리) 규칙이 `.변형 &`로 가려 입는다.
// 빈 스타일이라 wrapper 자신에는 아무것도 칠하지 않는다.
export const variantStyles = styleVariants({
  default: {},
  bar: {},
  wake: {},
});

// Slider Track. 라인은 안에 든 SVG가 그린다. 이 요소는 라인 두께와 같은 높이로
// 가운데에 서서 bar의 포커스 링을 두를 자리가 된다. 높이는 호버·물결 때 JS가
// 인라인으로 쓰고(GSAP), 여기 값은 쉬는 두께(첫 렌더·SSR)다.
export const sliderTrack = style({
  position: 'absolute',
  top: '50%',
  left: 0,
  right: 0,
  height: `${LINE_REST}px`,
  // 알약. 포커스 링이 라인 끝을 따라 둥글다.
  borderRadius: '999px',
  transform: 'translateY(-50%)',
  pointerEvents: 'none',
  selectors: {
    [`${variantStyles.bar} &`]: { height: `${LINE_BAR_REST}px` },
    // 머리가 없으니 키보드 포커스는 트랙 둘레의 링이 알린다.
    [`${variantStyles.bar}:has(input:focus-visible) &`]: { ...focusRing() },
  },
});

// 라인 SVG. 최대 두께가 들어가고도 남는 높이로 트랙 가운데에 얹는다. 두께는 경로가
// 정하므로 박스 밖으로 부풀어도 잘리지 않는다.
export const sliderLine = style({
  position: 'absolute',
  left: 0,
  top: '50%',
  width: '100%',
  height: `${LINE_BOX_HEIGHT}px`,
  transform: 'translateY(-50%)',
  overflow: 'visible',
  display: 'block',
});

// 안 채운 부분. 트랙의 임무는 그 위에 올라타는 것과 대비되는 것이다. fill
// (primary.main)과 썸 테두리가 어두우니 면은 연하게 두고, 식별성은 border.strong
// 1px 경계선이 맡는다(SegmentedButtons·NumericSpinner 컨테이너와 같은 전략).
export const sliderLineTrack = style({
  fill: themeContract.color.background.paper,
  stroke: themeContract.color.border.strong,
  strokeWidth: 1,
});

// 채운 부분. 같은 모양을 값 위치에서 자르고 안 채운 부분 위에 얹는다(테두리까지 덮는다).
export const sliderLineFill = style({
  fill: themeContract.color.primary.main,
});

// Wake 막대 묶음. 막대 위치(left %)가 머리 중심과 맞도록 양끝을 머리 반폭(24px의
// 절반)만큼 들인다. 네이티브 range의 머리 중심은 폭이 아니라 (폭 - 머리 폭) 위를 움직인다.
export const wakeBars = style({
  position: 'absolute',
  top: 0,
  bottom: 0,
  left: '12px',
  right: '12px',
  pointerEvents: 'none',
});

// Wake 막대 한 칸. 요소 높이는 최대 높이이고 쉬는 높이는 scaleY로 만든다.
// JS가 매 프레임 인라인 transform을 쓰므로 transform은 CSS로 전이하지 않는다.
// 2px 직사각형이라 scaleY로 일그러질 둥근 끝이 없다(border-radius 없음).
export const wakeBar = style({
  position: 'absolute',
  top: `calc(50% - ${WAKE_BAR_MAX_HEIGHT / 2}px)`,
  width: '2px',
  height: `${WAKE_BAR_MAX_HEIGHT}px`,
  marginLeft: '-1px',
  backgroundColor: themeContract.color.border.strong,
  transform: `scaleY(${WAKE_REST_SCALE})`,
  transformOrigin: 'center',
  transition: `background-color ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}`,
  selectors: {
    '&[data-on="true"]': {
      backgroundColor: themeContract.color.primary.main,
    },
  },
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
    // 기본 머리는 모든 변형에서 투명하다. 크기와 히트 영역은 그대로라 잡고 끌 수 있고,
    // 보이는 머리는 sliderHead가 그린다(값이 한 번에 바뀌어도 스프링으로 따라간다).
    '&::-webkit-slider-thumb': {
      appearance: 'none',
      WebkitAppearance: 'none',
      width: '24px',
      height: '24px',
      borderRadius: '50%',
      cursor: 'pointer',
      marginTop: '-9px',
      opacity: 0,
    },
    '&:disabled::-webkit-slider-thumb': { cursor: 'not-allowed' },
    '&::-moz-range-thumb': {
      width: '24px',
      height: '24px',
      borderRadius: '50%',
      border: 'none',
      cursor: 'pointer',
      opacity: 0,
    },
    '&:disabled::-moz-range-thumb': { cursor: 'not-allowed' },

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

/** 그린 머리의 위치(트랙 %)를 실어 나르는 채널. 보이는 위치가 스프링으로 따라가며 JS가 쓴다. */
export const HEAD_PERCENT_VAR = '--slider-head-percent';

// 그린 머리(bar에는 없다). 네이티브 입력의 머리와 같은 24px 원이고, 입력의 머리는
// 투명하게 잡기만 맡는다. 머리 중심은 (폭 - 머리 폭) 위를 움직인다.
// 잡기·호버·포커스는 입력의 상태를 wrapper의 :has()로 읽는다.
export const sliderHead = style({
  position: 'absolute',
  top: '50%',
  left: `calc((100% - 24px) * var(${HEAD_PERCENT_VAR}, 0) / 100)`,
  boxSizing: 'border-box',
  width: '24px',
  height: '24px',
  marginTop: '-12px',
  borderRadius: '50%',
  backgroundColor: themeContract.color.background.paper,
  border: `2px solid ${themeContract.color.primary.main}`,
  boxShadow: '0 1px 4px rgba(0, 0, 0, 0.15)',
  transition: `border-color ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}, box-shadow ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}, transform ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}`,
  pointerEvents: 'none',
  selectors: {
    [`${sliderWrapper}:has(input:active) &`]: {
      borderColor: themeContract.color.primary.dark,
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
      // 호버와 같은 배율이어야 한다. 드래그 중엔 :hover와 :active가 동시에
      // 매칭되므로, 여기서 더 작은 값을 쓰면 "잡고 있는 동안 머리가 줄어든다".
      transform: `scale(${THUMB_HOVER_SCALE})`,
    },
    [`${sliderWrapper}:has(input:focus-visible) &`]: { ...focusRing() },
    [`${sliderWrapper}:has(input:disabled) &`]: {
      borderColor: themeContract.color.text.disabled,
      opacity: 0.5,
    },
  },

  '@media': {
    // 호버: 머리 그림자. 크기는 아래 GROW 게이트가 맡는다. 잡는 동안(:active)은 이 규칙이
    // :active 규칙을 덮지 않도록 :not(:active)로 뺀다.
    [HOVER_GATE]: {
      selectors: {
        [`${sliderWrapper}:has(input:not(:disabled):not(:active)):hover &`]: {
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
        },
      },
    },
    // 호버: 머리가 부푼다. 들어갈 때 slow spring, 나올 때는 기본 전이(base settle).
    [HOVER_GROW_GATE]: {
      selectors: {
        [`${sliderWrapper}:has(input:not(:disabled):not(:active)):hover &`]: {
          transform: `scale(${THUMB_HOVER_SCALE})`,
          // 크기만 slow spring, 색·그림자는 기본과 같다.
          transition: `border-color ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}, box-shadow ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}, transform ${themeContract.animation.duration.slow} ${themeContract.animation.easing.spring}`,
        },
      },
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

// Value Follower (M0.5 I2). 잡은 동안 썸을 따라가는 값 표시.
// showValue(라벨 행의 고정 출력, :36-43)와 별개이고 그것을 대체하지 않는다.
// left는 ticker 스프링이 매 프레임 쓰는 --slider-value-follower-percent 커스텀
// 속성에서 나온다 — Ruling 23: getBoundingClientRect() 대신 값에서 나온 %다.
/** ticker 스프링이 매 프레임 쓰는 값 표시 위치 채널. 이름을 복제하지 말고 이것을 import하라. */
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
