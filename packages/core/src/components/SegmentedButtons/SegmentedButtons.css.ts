import { style, styleVariants } from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';
import { focusRing } from '../../tokens/focusRing.css';

// 표시(파란 알약)가 트랙 바깥 끝에서 떨어진 간격. 위·아래·왼쪽 끝·오른쪽 끝에
// 모두 이 값 하나를 써서 표시가 트랙의 축소판으로 보인다. 위아래는 표시의 top·height가,
// 좌우는 트랙 padding과 표시 안 라벨 줄 padding이 쓴다.
const INDICATOR_INSET_PX = 1;

// 표시의 모서리 반경: 트랙 반경에서 inset을 뺀다. 트랙과 같은 중심의 곡선이다.
// clip-path의 round(SegmentedButtons.tsx)가 같은 값을 쓴다.
export const INDICATOR_RADIUS = `calc(${themeContract.borderRadius.lg} - ${INDICATOR_INSET_PX}px)`;

// Container 스타일
export const container = style({
  display: 'inline-flex',
  alignItems: 'center',
  // 테두리 없이 회색 면 하나로 트랙을 그린다. 흰 페이지 위에서 면이 보이려면
  // paper(1.04:1)로는 모자라 gray[200]을 쓴다(표시와 3:1, 비선택 글자 gray[700]과 4.5:1).
  backgroundColor: themeContract.palette.gray[200],
  borderRadius: themeContract.borderRadius.lg,
  padding: `1px ${INDICATOR_INSET_PX}px`,
  gap: '4px',
  width: 'fit-content',
  position: 'relative',
});

// 표시의 그림자를 맡는 층. 표시를 clip-path로 자르면 box-shadow도 같이 잘려서,
// 자르지 않는 이 부모가 자른 결과의 윤곽을 drop-shadow로 그린다. 트랙 전체 폭이라
// 안쪽 표시의 두 가장자리가 트랙 왼쪽 기준 px 좌표가 된다.
export const indicatorShadow = style({
  position: 'absolute',
  top: `${INDICATOR_INSET_PX}px`,
  left: 0,
  width: '100%',
  height: `calc(100% - ${INDICATOR_INSET_PX * 2}px)`,
  pointerEvents: 'none',
  filter: 'drop-shadow(0 2px 8px rgba(0, 102, 255, 0.25))',
  // 진짜 라벨(zIndex 1) 위. 표시 안의 라벨 한 벌이 글자색을 표시 가장자리에서
  // 정확히 가른다. pointerEvents none이라 클릭은 아래 진짜 라벨로 간다.
  zIndex: 2,
});

// 트랙 전체 폭의 파란 층. 보이는 부분은 clip-path가 정한다: 두 가장자리 L·R을
// GSAP이 트윈하고 onUpdate에서 inline으로 쓴다(M5 task-19). 둥근 끝(INDICATOR_RADIUS)은
// clip-path의 round가 그려서 늘어나도 납작해지지 않는다. 여기 값은 JS가 쓰기 전
// (서버 렌더)의 숨은 모습이다.
export const activeIndicator = style({
  display: 'block',
  width: '100%',
  height: '100%',
  backgroundColor: themeContract.color.primary.main,
  clipPath: 'inset(0 100% 0 0)',
});

// 표시 안에 그리는 라벨 줄. 컨테이너 패딩 상자 전체를 덮고(표시는 위아래 inset만큼 안쪽이라
// 위로 inset만큼 올라가 높이를 inset의 두 배만큼 늘린다) 컨테이너와 같은 가로 배치를 써서, 안쪽 라벨이
// 진짜 라벨과 픽셀 단위로 같은 자리에 놓인다. 박스 크기 가정은 border-box로 못 박아
// 컨테이너가 어느 쪽이든 안쪽 내용 상자가 같다.
export const indicatorLabels = style({
  position: 'absolute',
  top: `-${INDICATOR_INSET_PX}px`,
  left: 0,
  width: '100%',
  height: `calc(100% + ${INDICATOR_INSET_PX * 2}px)`,
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  padding: `0 ${INDICATOR_INSET_PX}px`,
  gap: '4px',
});

// Size Variants
export const sizeVariants = styleVariants({
  sm: {
    height: '36px',
  },
  md: {
    height: '44px',
  },
  lg: {
    height: '52px',
  },
});

// Full Width
export const fullWidth = style({
  width: '100%',
});

// Button (label) 스타일
export const button = style({
  flex: 1,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0 16px',
  border: 'none',
  backgroundColor: 'transparent',
  color: themeContract.palette.gray[700],
  fontSize: themeContract.font.size.sm,
  fontWeight: themeContract.font.weight.medium,
  fontFamily: themeContract.font.family.sans,
  cursor: 'pointer',
  touchAction: 'manipulation',
  position: 'relative',
  zIndex: 1,
  borderRadius: themeContract.borderRadius.md,
  height: '85%',
  userSelect: 'none',
  outline: 'none',
  transition: `color ${themeContract.animation.duration.slow} ease, transform ${themeContract.animation.duration.fast} ease`,

  selectors: {
    '&:hover:not(.disabled):not(.selected)': {
      color: themeContract.color.text.primary,
    },

    '&:focus-visible': {
      ...focusRing(),
    },

    // sm은 보이는 높이가 36px이고 누르는 영역은 44px(터치 타깃)이다. 보이지 않는 ::after가
    // 옵션 세로 가운데 기준으로 44px 띠를 만든다(Chip.css.ts의 삭제 버튼 히트 영역과 같은
    // 방식). 옵션이 container 높이의 85%라 위아래 4px이 아니라 가운데 기준 44px로 잡는다.
    // 가로는 옵션 폭 그대로라 이웃 옵션과 겹치지 않는다. 그리지 않으므로 겉모습·모션은
    // 그대로다. 표시 안의 라벨 한 벌도 같은 클래스라 ::after를 갖지만 칠하지 않고
    // 표시 층이 pointer-events: none이라 아무 일도 하지 않는다.
    [`${sizeVariants.sm} &::after`]: {
      content: '""',
      position: 'absolute',
      top: 'calc(50% - 22px)',
      left: 0,
      right: 0,
      height: '44px',
    },

    // ✅ 중첩 대신 조합형 selector로 표현
    // 글자색은 선택과 무관하게 늘 위의 color다. 선택 칸의 흰 글자는 표시 안의 라벨 한
    // 벌이 그려서 표시 가장자리에서 정확히 갈린다. 굵기는 두 줄의 폭을 맞추려고 남긴다.
    '&.selected': {
      fontWeight: themeContract.font.weight.semibold,
      transform: 'scale(1)',
      transition: `transform ${themeContract.animation.duration.slow} ease, text-shadow ${themeContract.animation.duration.slow} ease`,
    },

    '&.disabled': {
      color: themeContract.color.text.disabled,
      cursor: 'not-allowed',
      opacity: 0.5,
      transform: 'none',
    },
    '&.iconOnly': {
      minWidth: '44px',
      padding: '0 12px',
    },

    // 표시 안의 라벨 한 벌: 늘 활성색. 이 규칙이 .disabled보다 뒤라 이긴다.
    [`${indicatorLabels} &`]: {
      color: themeContract.color.primary.contrast,
    },
    // 선택 칸 호버 글자 빛. 진짜 라벨은 표시에 덮이므로 안쪽 글자가 대신 낸다.
    // 이 빛을 지우기로 하면 이 두 규칙만 걷는다.
    [`${container}:has(label.selected:hover) ${indicatorLabels} &.selected`]: {
      textShadow: '0 0 8px rgba(255, 255, 255, 0.5)',
    },
    [`${container}:has(label.selected:active) ${indicatorLabels} &.selected`]: {
      textShadow: 'none',
    },
  },
});

// Button Content
export const buttonContent = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
});

// Icon Wrapper
export const iconWrapper = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1.25em',
});

// Label Text
export const labelText = style({
  whiteSpace: 'nowrap',
});

// Radio Input (숨김)
export const radioInput = style({
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
});
