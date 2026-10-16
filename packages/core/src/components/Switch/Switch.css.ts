import { style, styleVariants } from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';
import { focusRing } from '../../tokens/focusRing.css';

// 트랙 테두리 두께(px). 투명 테두리 밑까지 트랙 배경이 칠해지므로, 켜졌을 때
// 파란 채움을 자르는 칸(sweepClip)이 같은 값만큼 바깥으로 깔려야 회색 고리가
// 안 남는다.
const TRACK_BORDER_WIDTH = 2;

// Wrapper
export const wrapper = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  width: 'fit-content',
});

// Switch Label
export const switchLabel = style({
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  minWidth: '44px',
  minHeight: '44px',
  cursor: 'pointer',
  touchAction: 'manipulation',
  userSelect: 'none',
});

// Label Text
export const labelText = style({
  fontSize: '0.875rem',
  fontWeight: 500,
  color: themeContract.color.text.primary,
  order: -1,
});

// Required Indicator
export const required = style({
  color: themeContract.color.error.main,
  marginLeft: '0.125rem',
});

// Switch Container (Track)
export const switchContainer = style({
  position: 'relative',
  display: 'inline-block',
  flexShrink: 0,
});

// Hidden Native Input
export const switchInput = style({
  position: 'absolute',
  width: 0,
  height: 0,
  opacity: 0,
  cursor: 'pointer',
  touchAction: 'manipulation',

  selectors: {
    '&:disabled': {
      cursor: 'not-allowed',
    },
  },
});

/** 트랙 높이(px). 켜진 머리 크기(switchMotion의 ON_SCALE)가 이 값을 읽는다. */
export const trackHeight = { sm: 20, md: 24, lg: 28 } as const;

/** 머리 지름(px). 켜진 머리 크기(switchMotion의 ON_SCALE)가 이 값을 읽는다. */
export const thumbDiameter = { sm: 16, md: 20, lg: 24 } as const;

// Size Variants for Container (Track)
const baseSizeContainer = {
  sm: { width: '36px', height: `${trackHeight.sm}px`, borderRadius: '10px' },
  md: { width: '44px', height: `${trackHeight.md}px`, borderRadius: '12px' },
  lg: { width: '52px', height: `${trackHeight.lg}px`, borderRadius: '14px' },
};

export const size = styleVariants(baseSizeContainer, (baseStyle) => [
  baseStyle,
  {
    // 라이브러리에는 전역 box-sizing 규칙이 없다. 높이에 테두리가 들어간다고 가정하면
    // 소비자 리셋에 따라 바깥 높이가 달라져 ON_SCALE의 "트랙 + 2"가 틀어진다.
    boxSizing: 'border-box',
    backgroundColor: themeContract.color.text.secondary,
    border: `${TRACK_BORDER_WIDTH}px solid transparent`,
    transition: `background-color ${themeContract.animation.duration.fast} ${themeContract.animation.easing.settle}, border-color ${themeContract.animation.duration.fast} ${themeContract.animation.easing.settle}, box-shadow ${themeContract.animation.duration.fast} ${themeContract.animation.easing.settle}`,
    position: 'relative',
    display: 'inline-block',
    flexShrink: 0,
    cursor: 'pointer',
    touchAction: 'manipulation',

    selectors: {
      // &:has(input:checked) 제거: 트랙 색 전환은 이제 스윕 span(GSAP scaleX)이 담당한다(Ruling 42).
      [`&:has(input:focus-visible)`]: {
        ...focusRing(),
      },

      // disabled 트랙의 기준은 1.4.11의 3:1이 아니다(disabled는 면제 대상이다).
      // 기준은 "컨트롤이 아예 안 보이면 고친다" 하나다. unchecked+disabled는
      // 흰 배경 위 흰 면(1.00:1)이라 존재 자체가 사라져서 surface.track
      // (3.59:1)으로 올렸고, checked+disabled의 primary.light는 2.64:1로 3:1에는
      // 못 미쳐도 지각되므로 그대로 둔다. 여기를 더 진하게 올리면 enabled와
      // 구별이 사라져 어포던스가 오히려 나빠진다.
      [`&:has(input:disabled)`]: {
        backgroundColor: themeContract.color.surface.track,
        cursor: 'not-allowed',
      },

      [`&:has(input:checked:disabled)`]: {
        backgroundColor: themeContract.color.primary.light,
      },
    },
  },
]);

/** 썸이 off→on으로 움직이는 거리(px). thumbSize의 offset과 같은 값이어야 한다. */
export const thumbOffset = { sm: 14, md: 18, lg: 22 } as const;

// Thumb Size Variants
// 위치(x)·Y 중앙 정렬(yPercent)·늘임과 켜진 크기 scale은 GSAP이 이 칸의 transform에
// 쓴다. 눈에 보이는 면과 호버 부풂은 안쪽 thumbFace가 맡는다. offset 필드는 이제
// 어떤 선택자에서도 쓰이지 않지만, thumbOffset과 값이 갈라지지 않도록 참조만
// 남긴다.
export const thumbSize = styleVariants(
  {
    sm: {
      width: `${thumbDiameter.sm}px`,
      height: `${thumbDiameter.sm}px`,
      offset: `${thumbOffset.sm}px`,
    },
    md: {
      width: `${thumbDiameter.md}px`,
      height: `${thumbDiameter.md}px`,
      offset: `${thumbOffset.md}px`,
    },
    lg: {
      width: `${thumbDiameter.lg}px`,
      height: `${thumbDiameter.lg}px`,
      offset: `${thumbOffset.lg}px`,
    },
  },
  (config) => ({
    position: 'absolute',
    top: '50%',
    left: '2px',
    width: config.width,
    height: config.height,
  })
);

// 호버 부풂 배율. 참고한 SquishSwitch는 32px 머리에 1.035(0.56px)인데, 20px
// 머리에서는 0.35px라 보이지 않아 px로 다시 정했다(0.06 x 20 = 1.2px).
const THUMB_HOVER_SCALE = 1.06;

// 머리의 눈에 보이는 면. GSAP이 머리 칸의 transform을 통째로 쓰므로 호버 부풂은
// 여기에 따로 걸어야 둘이 싸우지 않고, 바깥 transform과 곱해져 합성된다(호버
// 중에 켜도 부풂이 튀지 않는다). 머리 칸에 CSS scale을 걸면 이동 거리까지
// 같이 커져 머리가 밀린다.
export const thumbFace = style({
  display: 'block',
  width: '100%',
  height: '100%',
  borderRadius: '50%',
  backgroundColor: themeContract.color.background.paper,
  transition: `transform ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}, box-shadow ${themeContract.animation.duration.fast} ${themeContract.animation.easing.settle}, opacity ${themeContract.animation.duration.fast} ${themeContract.animation.easing.settle}`,
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',

  selectors: {
    [`input:disabled + * > &`]: {
      backgroundColor: themeContract.color.background.paper,
      boxShadow: 'none',
      opacity: 0.8,
    },
  },

  '@media': {
    // 마우스만. 터치는 호버가 없고, 비활성이면 부풀지 않으며, 축소 모드 전용
    // 규칙은 두지 않는다(트랜지션 길이는 전역 축소 규칙이 줄인다).
    '(hover: hover) and (pointer: fine)': {
      selectors: {
        [`${switchContainer}:has(input:not(:disabled)):hover &`]: {
          transform: `scale(${THUMB_HOVER_SCALE})`,
        },
      },
    },
  },
});

// 자르는 칸: 파란 채움을 트랙 알약 모양 안에 가둔다. 테두리 두께만큼 바깥(inset
// 음수)으로 깔아 트랙 둘레까지 덮고, 반경은 트랙의 바깥 반경을 물려받는다.
// 트랙 자신에는 overflow hidden을 걸지 않는다. 머리가 켜질 때 트랙 밖으로
// 나가야 하므로 자르는 일은 이 칸이 맡는다.
export const sweepClip = style({
  position: 'absolute',
  inset: `${-TRACK_BORDER_WIDTH}px`,
  borderRadius: 'inherit',
  overflow: 'hidden',
  pointerEvents: 'none',
});

// 에러일 때의 칸은 테두리 안쪽에만 깔아서 켜진 에러 스위치에도 에러 색
// 테두리가 고리로 남게 한다(sweepClip 뒤에 선언해 같은 특이도에서 이긴다).
export const sweepInside = style({
  inset: 0,
});

// Sweep (트랙 색 전환용 채움). GSAP이 scaleX로 왼쪽부터 채운다(Ruling 42).
// 자르는 칸 안의 직사각형이다. 반경이 없어도 칸이 알약 모양으로 자르므로
// 차오르는 도중에도 파란색이 회색 알약 밖으로 나가지 않는다.
export const sweep = style({
  position: 'absolute',
  inset: 0,
  backgroundColor: themeContract.color.primary.main,
  transformOrigin: 'left center',

  selectors: {
    // 비활성 켜짐은 트랙 전체가 연한 파랑이다(활성 켜짐과 색으로 구별된다).
    [`${switchContainer}:has(input:disabled) &`]: {
      backgroundColor: themeContract.color.primary.light,
    },
  },
});

// Error State
export const error = style({
  borderColor: `${themeContract.color.error.main} !important`,

  selectors: {
    'input:focus ~ &': {
      borderColor: `${themeContract.color.error.main} !important`,
      boxShadow: `0 0 0 3px ${themeContract.color.overlay.errorHalo} !important`,
    },
  },
});

// Helper Text
export const helperText = style({
  fontSize: '0.75rem',
  color: themeContract.color.text.secondary,
  marginLeft: '0.25rem',
});

// Error Message
export const errorMessage = style({
  fontSize: '0.75rem',
  color: themeContract.color.error.main,
  marginLeft: '0.25rem',
});
