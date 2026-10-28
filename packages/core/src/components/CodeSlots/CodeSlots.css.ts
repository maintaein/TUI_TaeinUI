import { keyframes, style, styleVariants } from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';
import { focusRing } from '../../tokens/focusRing.css';

const { color, font, spacing, animation } = themeContract;

// 칸 크기. 폭 3rem(48px), 높이는 spacing 스케일에 없는 56px을 12 + 2로 유도한다.
const CELL_H = `calc(${spacing[12]} + ${spacing[2]})`;
// 합쳐진 알약의 바깥 둥글기. 9999px(full)은 보간이 첫 프레임에 높이의 절반으로 잘려 전이가 안 보이므로 높이의 절반을 쓴다.
const PILL_R = `calc(${CELL_H} / 2)`;

// 칸 묶음. 숨은 input이 이 상자 전체를 덮는다.
export const group = style({
  position: 'relative',
  alignSelf: 'flex-start',
});

export const cells = style({
  display: 'flex',
  gap: spacing[2],
  // gap: 합쳐질 때 간격이 0으로 줄어드는 전이다. gap은 레이아웃 속성이지만 칸이 고정 크기라 다른 요소를 밀지 않는다.
  transition: `gap ${animation.duration.slower} ${animation.easing.settle}`,
});

// 성공: 간격이 0으로 줄고 칸 테두리가 사이에서 사라지며 바깥 둥글기만 남는다(cell의 selectors가 짝이다).
export const merged = style({
  gap: 0,
});

// 실제 입력. display:none이면 포커스와 자동 채움을 못 받으므로 투명하게 칸 위에 겹친다.
// 글자 크기 16px은 iOS가 포커스 때 화면을 확대하지 않는 하한이다.
export const input = style({
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  margin: 0,
  padding: 0,
  border: 0,
  opacity: 0,
  background: 'transparent',
  fontSize: font.size.base,
  cursor: 'text',
  selectors: {
    '&:disabled': { cursor: 'not-allowed' },
  },
});

export const cell = style({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxSizing: 'border-box',
  width: spacing[12],
  height: CELL_H,
  overflow: 'hidden',
  border: `1px solid ${color.text.secondary}`,
  borderRadius: themeContract.borderRadius.base,
  backgroundColor: color.background.paper,
  // border-color는 오류·성공 색 전환, border-radius와 border-left-width, border-right-width는 합쳐질 때 바깥 둥글기만 남기고 칸 사이 테두리를 지우는 전이다.
  transition: `border-color ${animation.duration.fast} ${animation.easing.settle}, border-radius ${animation.duration.slower} ${animation.easing.settle}, border-left-width ${animation.duration.slower} ${animation.easing.settle}, border-right-width ${animation.duration.slower} ${animation.easing.settle}`,
  selectors: {
    // 지금 입력할 칸의 포커스 링(2.4.7). 묶음 안에 포커스가 있을 때만 보인다.
    [`${group}:focus-within &[data-active="true"]`]: focusRing(),
    [`${merged} &`]: { borderRadius: 0 },
    [`${merged} &:first-child`]: {
      borderTopLeftRadius: PILL_R,
      borderBottomLeftRadius: PILL_R,
    },
    [`${merged} &:last-child`]: {
      borderTopRightRadius: PILL_R,
      borderBottomRightRadius: PILL_R,
    },
    [`${merged} &:not(:first-child)`]: { borderLeftWidth: 0 },
    [`${merged} &:not(:last-child)`]: { borderRightWidth: 0 },
  },
});

// 테두리 색. success.main은 흰 바탕 대비 2.77:1이라 테두리 3:1에 못 미쳐 dark를 쓴다.
export const cellError = style({ borderColor: color.error.main });
export const cellSuccess = style({ borderColor: color.success.dark });
export const cellDisabled = style({
  backgroundColor: color.surface.default,
  borderColor: color.border.default,
});

const digitBase = {
  fontFamily: font.family.sans,
  fontSize: font.size['2xl'],
  fontWeight: font.weight.semibold,
  lineHeight: 1,
  color: color.text.primary,
  fontVariantNumeric: 'tabular-nums',
} as const;

export const digit = style(digitBase);

// 지운 숫자는 같은 칸에 복사본으로 남아 아래로 빠진다. 움직임은 GSAP이 모는 transform이라(CodeSlots.tsx) 여기에는 자리만 있다.
export const ghost = style({
  ...digitBase,
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

// 오류 물결: TextField 오류 흔들림(CSS 키프레임, slower, drift)과 같은 형태다. 거리만 7px 대신 4px로 줄였다.
// 칸마다 간격이 8px이고 이웃 칸이 시차만큼 어긋나 움직이므로 ±7px이면 서로 겹친다. 토큰 스케일에 없는 연출 고유 거리라 리터럴이다
// (10·90%가 -1px, 20·80%가 +2px, 30·50·70%가 -4px, 40·60%가 +4px).
// 칸마다 inline animation-delay로 시차를 둔다. 같은 오류가 다시 걸릴 때 처음부터 돌도록 이름이 다른 둘을 번갈아 건다(CodeSlots.tsx의 useWave).
const waveFrames = {
  '10%, 90%': { transform: 'translateX(-1px)' },
  '20%, 80%': { transform: 'translateX(2px)' },
  '30%, 50%, 70%': { transform: 'translateX(-4px)' },
  '40%, 60%': { transform: 'translateX(4px)' },
} as const;
const waveA = keyframes(waveFrames);
const waveB = keyframes(waveFrames);

export const wave = styleVariants({
  a: {
    animation: `${waveA} ${animation.duration.slower} ${animation.easing.drift}`,
  },
  b: {
    animation: `${waveB} ${animation.duration.slower} ${animation.easing.drift}`,
  },
});
