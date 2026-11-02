import { style } from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';

const { color, spacing, borderRadius, animation, shadow, font } = themeContract;
const REDUCED = '(prefers-reduced-motion: reduce)';
const SIZE = spacing[10];
const END = `calc(100% - ${SIZE})`;
const INPUT_WIDTH = `calc(100% - ${SIZE} - ${spacing[4]})`;
// 알약은 slower(500ms)의 1.2배(600ms), 공은 1.5배(750ms)다. 분리 비율을 지키며 알약을 25% 줄인 값이다.
const PILL_DURATION = `calc(${animation.duration.slower} * 1.2)`;
const PILL_MOVE = `${PILL_DURATION} ${animation.easing.drift}`;
const BALL_MOVE = `calc(${animation.duration.slower} * 1.5) ${animation.easing.drift}`;

// 폭과 배치는 소비자 몫이다(className). 기본은 부모 폭을 다 쓰는 한 줄이다.
export const root = style({
  position: 'relative',
  minWidth: SIZE,
  height: SIZE,
});

export const filterDefinition = style({
  position: 'absolute',
  width: 0,
  height: 0,
});

export const shapes = style({
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
});

export const mover = style({
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  transform: 'translateX(0)',
  transition: `transform ${BALL_MOVE}`,
  selectors: {
    [`${root}[data-open="true"] &`]: { transform: `translateX(${END})` },
  },
  '@media': { [REDUCED]: { transition: 'none' } },
});

export const pill = style({
  position: 'absolute',
  top: 0,
  left: 0,
  width: SIZE,
  height: SIZE,
  background: color.background.default,
  borderRadius: borderRadius.full,
  boxShadow: shadow.sm,
  // width: 알약이 늘어나며 입력창의 clip-path가 이 가장자리를 따라간다. 합성 속성으로는 알약 자체를 늘릴 수 없다.
  transition: `width ${PILL_MOVE}`,
  selectors: { [`${root}[data-open="true"] &`]: { width: INPUT_WIDTH } },
  '@media': { [REDUCED]: { transition: 'none' } },
});

export const ball = style({
  position: 'absolute',
  left: 0,
  top: 0,
  width: SIZE,
  height: SIZE,
  borderRadius: borderRadius.full,
  background: color.primary.main,
});

export const input = style({
  position: 'absolute',
  inset: '0 auto 0 0',
  width: INPUT_WIDTH,
  minWidth: 0,
  padding: `0 ${spacing[4]}`,
  border: 0,
  borderRadius: borderRadius.full,
  background: 'transparent',
  color: color.text.primary,
  font: 'inherit',
  fontSize: font.size.base,
  outline: 'none',
  visibility: 'hidden',
  opacity: 0,
  clipPath: `inset(0 calc(100% - ${SIZE}) 0 0)`,
  // clip-path: 알약이 늘어나는 만큼 입력창을 드러낸다(알약 width와 같은 길이와 이징).
  // visibility: 알약 길이만큼 이어 닫히는 동안 입력창의 오른쪽 끝이 알약을 따라가게 하고, 끝에서 숨긴다.
  // 보임 쪽으로 가는 전이는 시작 직후부터 보인다. 열림과 닫힘이 같은 전이를 쓴다.
  // box-shadow: 포커스 테두리(:focus)가 툭 튀지 않고 다른 입력류처럼 fast settle로 번진다(전이 목록 잠금).
  transition: `clip-path ${PILL_MOVE}, opacity ${PILL_MOVE}, visibility ${PILL_DURATION} ${animation.easing.linear}, box-shadow ${animation.duration.fast} ${animation.easing.settle}`,
  selectors: {
    [`${root}[data-open="true"] &`]: {
      visibility: 'visible',
      opacity: 1,
      clipPath: 'inset(0 0 0 0)',
    },
    // 테두리 없는 알약이라 포커스 때 가장자리 안쪽에 primary 2px 테두리가 생긴다(바깥 링 없음).
    // TextField처럼 :focus다: 열릴 때 스크립트가 주는 포커스와 마우스 클릭도 같은 모양이다.
    '&:focus': { boxShadow: `inset 0 0 0 2px ${color.primary.main}` },
    '&::placeholder': { color: color.text.secondary },
  },
  '@media': { [REDUCED]: { transition: 'none' } },
});

export const trigger = style({
  position: 'absolute',
  left: 0,
  top: 0,
  display: 'grid',
  placeItems: 'center',
  width: SIZE,
  height: SIZE,
  padding: 0,
  border: 0,
  borderRadius: borderRadius.full,
  background: 'transparent',
  color: color.primary.contrast,
  cursor: 'pointer',
  touchAction: 'manipulation',
  pointerEvents: 'auto',
  outline: 'none',
  selectors: {
    // 파란 공 자체가 컨트롤이라 공 안쪽에 흰 2px 테두리가 생긴다(primary 면 위 4.6:1, 바깥 링 없음).
    // 가장자리의 흰 선은 흰 바탕에 묻혀 공이 작아 보일 뿐이라, 3px 안쪽에 파란 띠를 먼저 깐다.
    '&:focus-visible': {
      boxShadow: `inset 0 0 0 3px ${color.primary.main}, inset 0 0 0 5px ${color.primary.contrast}`,
    },
  },
});

export const results = style({
  position: 'absolute',
  top: `calc(100% + ${spacing[2]})`,
  left: 0,
  right: 0,
  boxShadow: shadow.md,
  borderRadius: borderRadius.md,
});
