import { globalStyle, keyframes, style } from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';
import { focusRing } from '../../tokens/focusRing.css';

const {
  palette,
  color,
  font,
  spacing,
  animation,
  shadow,
  borderRadius,
  zIndex,
} = themeContract;

// 허브 56px = 48 + 8, 항목 44px = 48 - 4. 토큰 스케일에 없는 값이라 유도한다.
const HUB = `calc(${spacing[12]} + ${spacing[2]})`;
const ITEM = `calc(${spacing[12]} - ${spacing[1]})`;
const REDUCE = '(prefers-reduced-motion: reduce)';
const NO_MOTION = { transition: 'none' } as const;

// 허브를 품는 상자. 항목과 호는 이 상자 가운데에서 위로 펼쳐진다. 가장자리 처리는 하지 않는다(소비자가 자리를 잡는다).
export const root = style({
  position: 'relative',
  display: 'inline-flex',
  width: HUB,
  height: HUB,
});

export const hub = style({
  position: 'relative',
  zIndex: 1,
  display: 'grid',
  placeItems: 'center',
  width: '100%',
  height: '100%',
  padding: 0,
  border: 0,
  borderRadius: borderRadius.full,
  backgroundColor: color.primary.main,
  color: color.primary.contrast,
  boxShadow: shadow.md,
  cursor: 'pointer',
  touchAction: 'manipulation',
  transition: `box-shadow ${animation.duration.base} ${animation.easing.settle}`,
  '@media': { [REDUCE]: NO_MOTION },
  selectors: {
    // 가장자리 안쪽 두 겹(짙은 primary 2px, 그 안쪽 흰 2px). 평소 그림자(shadow.md)는 그대로 합쳐 둔다.
    '&:focus-visible': {
      outline: 'none',
      boxShadow: `inset 0 0 0 2px ${palette.primary[900]}, inset 0 0 0 4px ${color.primary.contrast}, ${shadow.md}`,
    },
    '&:disabled': { opacity: 0.5, cursor: 'not-allowed' },
  },
});

// + 는 열리면 ×가 되도록 135도 돈다(snap, transform에만)
export const plus = style({
  transition: `transform ${animation.duration.slow} ${animation.easing.snap}`,
  '@media': { [REDUCE]: NO_MOTION },
  selectors: {
    [`${root}[data-open] &`]: { transform: 'rotate(135deg)' },
  },
});

// 호 그림. 허브 가운데를 원점으로 한 260x260 상자(viewBox -130 -130 260 260)이고 클릭은 통과한다.
export const arc = style({
  position: 'absolute',
  left: '50%',
  top: '50%',
  width: 260,
  height: 260,
  transform: 'translate(-50%, -50%)',
  overflow: 'visible',
  pointerEvents: 'none',
  fill: 'none',
});

// 점선 안내선: 열려 있는 동안 옅게 깔린다
export const guide = style({
  stroke: color.border.strong,
  strokeWidth: 1.5,
  strokeDasharray: '4 6',
  opacity: 0,
  transition: `opacity ${animation.duration.fast} ${animation.easing.settle}`,
  '@media': { [REDUCE]: NO_MOTION },
  selectors: {
    [`${root}[data-open] &`]: { opacity: 1 },
  },
});

// 빛나는 선: pathLength를 100으로 정규화해 dasharray 100, dashoffset 100에서 0으로 그려진다(line drawing).
// 길이는 slower의 1.6배(800ms). 원본 .8s에 가장 가까운 토큰 배수이고, 호가 항목보다 늦게까지 이어져 빛이 훑고 가는 것으로 읽힌다.
export const glow = style({
  stroke: color.primary.main,
  strokeWidth: 2.5,
  strokeLinecap: 'round',
  strokeDasharray: 100,
  strokeDashoffset: 100,
  opacity: 0,
  // stroke-dashoffset: 이 선이 그려지는 움직임 자체라 transform·opacity로 대신할 수 없다. 페인트만 하고 레이아웃은 건드리지 않는다.
  transition: `stroke-dashoffset calc(${animation.duration.slower} * 1.6) ${animation.easing.settle}, opacity ${animation.duration.slow} ${animation.easing.settle}`,
  '@media': { [REDUCE]: NO_MOTION },
  selectors: {
    [`${root}[data-open] &`]: { strokeDashoffset: 0, opacity: 0.7 },
  },
});

// 항목 묶음. 허브 상자를 덮고 클릭은 항목만 받는다.
export const menu = style({
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
});

// 항목 버튼. 닫힘은 허브 자리에서 작고 투명하며, 열림은 호 위(--fan-x, --fan-y)에서 원래 크기다.
// 가리킨 항목은 바깥(--fan-hx, --fan-hy)으로 밀리며 1.38배가 된다.
// 열고 닫는 동안(root[data-settling])만 --fan-delay로 차례를 둔다. 가리킴은 늘 바로 따라온다.
// 오버슈트 이징(snap)은 transform에만, 불투명도는 settle로 따로 둔다.
export const item = style({
  position: 'absolute',
  left: '50%',
  top: '50%',
  display: 'grid',
  placeItems: 'center',
  boxSizing: 'border-box',
  width: ITEM,
  height: ITEM,
  padding: 0,
  border: `1px solid ${color.border.strong}`,
  borderRadius: borderRadius.full,
  backgroundColor: color.background.default,
  color: color.text.primary,
  boxShadow: shadow.md,
  cursor: 'pointer',
  touchAction: 'manipulation',
  pointerEvents: 'auto',
  opacity: 0,
  transform: 'translate(-50%, -50%) scale(0.6)',
  transition: `transform ${animation.duration.slower} ${animation.easing.snap}, opacity ${animation.duration.fast} ${animation.easing.settle}, background-color ${animation.duration.fast} ${animation.easing.settle}, color ${animation.duration.fast} ${animation.easing.settle}, border-color ${animation.duration.fast} ${animation.easing.settle}`,
  '@media': { [REDUCE]: NO_MOTION },
  selectors: {
    [`${root}[data-open] &`]: {
      opacity: 1,
      transform:
        'translate(-50%, -50%) translate(var(--fan-x), var(--fan-y)) scale(1)',
    },
    [`${root}[data-open] &[data-hot]`]: {
      transform:
        'translate(-50%, -50%) translate(var(--fan-hx), var(--fan-hy)) scale(1.38)',
      backgroundColor: color.primary.main,
      borderColor: color.primary.main,
      color: color.primary.contrast,
    },
    [`${root}[data-settling] &`]: { transitionDelay: 'var(--fan-delay)' },
    '&:focus-visible': focusRing(),
  },
});

// 아이콘 칸. 소비자가 준 아이콘(보통 24px)을 20px로 맞춘다.
export const icon = style({
  display: 'grid',
  placeItems: 'center',
  width: spacing[5],
  height: spacing[5],
});
globalStyle(`${icon} > svg`, { width: '100%', height: '100%' });

// 고를 때의 번쩍임: 흰 막이 380ms 가까이(slower의 0.75배, 375ms) 켜졌다 꺼진다. 원본 .45s의 밝기 번쩍임을 opacity로 옮겼다.
const flashFrames = keyframes({
  '0%': { opacity: 0 },
  '40%': { opacity: 0.75 },
  '100%': { opacity: 0 },
});
export const flash = style({
  position: 'absolute',
  inset: 0,
  borderRadius: borderRadius.full,
  backgroundColor: color.text.inverse,
  opacity: 0,
  pointerEvents: 'none',
  selectors: {
    '&[data-on]': {
      animation: `${flashFrames} calc(${animation.duration.slower} * 0.75) ${animation.easing.settle}`,
    },
  },
  '@media': {
    [REDUCE]: { selectors: { '&[data-on]': { animation: 'none' } } },
  },
});

// 이름표. 허브 위쪽 호 안쪽에 뜨고, 포인터가 올라와도 남는다(1.4.13). 장식 겹이라 접근 가능한 이름은 항목에 있다.
export const tag = style({
  position: 'absolute',
  left: '50%',
  bottom: `calc(100% + ${spacing[8]})`,
  zIndex: zIndex.base,
  padding: `${spacing[1]} ${spacing[3]}`,
  borderRadius: borderRadius.full,
  backgroundColor: color.text.primary,
  color: color.text.inverse,
  fontFamily: font.family.sans,
  fontSize: font.size.sm,
  fontWeight: font.weight.bold,
  lineHeight: 1,
  whiteSpace: 'nowrap',
  opacity: 0,
  pointerEvents: 'none',
  transform: `translate(-50%, ${spacing[2]})`,
  transition: `opacity ${animation.duration.fast} ${animation.easing.settle}, transform ${animation.duration.base} ${animation.easing.snap}`,
  '@media': { [REDUCE]: NO_MOTION },
  selectors: {
    '&[data-on]': {
      opacity: 1,
      pointerEvents: 'auto',
      transform: 'translate(-50%, 0)',
    },
  },
});
