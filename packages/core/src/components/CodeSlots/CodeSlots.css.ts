import {
  createVar,
  keyframes,
  style,
  styleVariants,
} from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';

const { color, font, spacing, animation } = themeContract;

// 칸 크기. 폭 3rem(48px), 높이는 spacing 스케일에 없는 56px을 12 + 2로 유도한다.
const CELL_H = `calc(${spacing[12]} + ${spacing[2]})`;
// 합쳐진 알약의 바깥 둥글기. 9999px(full)은 보간이 첫 프레임에 높이의 절반으로 잘려 전이가 안 보이므로 높이의 절반을 쓴다.
const PILL_R = `calc(${CELL_H} / 2)`;

// 성공으로 합쳐지는 두 박자의 진행도. GSAP는 calc 값을 못 보간하므로 타임라인(CodeSlots.tsx)이 칸 줄에 이 숫자 둘만 인라인으로 몬다.
// 간격·둥글기·불투명도는 모두 이 숫자에서 CSS가 유도한다.
// fade: 1에서 0으로(①). 칸의 테두리와 흰 바탕이 투명해지고 묶음이 나타난다
// merge: 0에서 1로(②). 간격이 0으로 모이고 모서리가 알약이 된다
const fade = createVar();
const merge = createVar();
// GSAP에 넘길 이름. createVar는 `var(--이름)`을 돌려준다
export const fadeName = fade.slice(4, -1);
export const mergeName = merge.slice(4, -1);

// 테두리·바탕 색을 fade만큼만 남긴다. 칸마다 따로 쓰는 색이라 색마다 같은 식을 건다
const faded = (c: string) =>
  `color-mix(in srgb, ${c} calc(${fade} * 100%), transparent)`;

// 칸 줄과 묶음이 같이 쓰는 둥글기: 칸 모서리에서 알약 반지름까지
const RADIUS = `calc(${themeContract.borderRadius.base} + (${PILL_R} - ${themeContract.borderRadius.base}) * ${merge})`;

// 칸 묶음. 숨은 input이 이 상자 전체를 덮는다.
export const group = style({
  position: 'relative',
  alignSelf: 'flex-start',
});

export const cells = style({
  vars: { [fade]: '1', [merge]: '0' },
  position: 'relative',
  display: 'flex',
  // gap: 합쳐질 때 간격이 0으로 줄어드는 레이아웃 속성이다. 칸이 고정 크기라 다른 요소를 밀지 않는다.
  gap: `calc(${spacing[2]} * (1 - ${merge}))`,
  borderRadius: RADIUS,
});

// 성공 상태의 끝 모양을 숫자에서 바로 선다. 움직임 줄이기에서만 쓴다(움직임이 있을 때는 타임라인이 숫자를 몬다).
export const settled = style({ vars: { [fade]: '0', [merge]: '1' } });

// 성공: 둥근 모서리 밖은 잘라 내 어떤 칸도 알약 윤곽 밖으로 나오지 않는다. 오류 물결이 끝에서 잘리지 않게 성공일 때만 건다.
// 합쳐지는 동안(되돌림 끝까지 쥔다)은 칸의 색 전이도 끈다(아래 cell).
export const merged = style({ overflow: 'hidden' });

// 칸 뒤에 깔린 묶음 하나. 칸의 흰 바탕과 테두리를 넘겨받아 그린다.
// 칸 줄을 따라 실제 폭이 줄어든다(scale이 아니라 레이아웃이라 둥근 끝이 찌그러지지 않는다).
export const bundle = style({
  position: 'absolute',
  inset: 0,
  boxSizing: 'border-box',
  pointerEvents: 'none',
  border: `1px solid ${color.success.dark}`,
  borderRadius: RADIUS,
  backgroundColor: color.background.paper,
  opacity: `calc(1 - ${fade})`,
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
  border: `1px solid ${faded(color.text.secondary)}`,
  borderRadius: themeContract.borderRadius.base,
  backgroundColor: faded(color.background.paper),
  // border-color: 오류·비활성 색 전환. 합쳐짐이 fade를 매 프레임 모는 동안은 아래 selectors가 전이를 끈다(전이가 매 프레임 새로 시작해 뒤처진다)
  transition: `border-color ${animation.duration.fast} ${animation.easing.settle}`,
  '@media': { '(prefers-reduced-motion: reduce)': { transition: 'none' } },
  selectors: {
    [`${merged} &`]: { transition: 'none' },
    // 포커스: 묶음 안에 포커스가 있으면 지금 입력할 칸(2.4.7)의 테두리 색이 바뀐다(TextField 포커스와 같은 방식, 바깥 링은 쓰지 않는다).
    // 마우스 클릭도 같은 모양이라 :focus-visible이 아니라 포커스 안에서 본다. 합쳐진 동안은 칸이 투명해 fade가 이 색도 지운다(포커스 위치는 캐럿이 맡는다).
    [`${group}:focus-within &[data-active="true"]`]: {
      borderColor: faded(color.primary.main),
    },
  },
});

// 테두리 색. 칸은 fade에 따라 투명해지므로 색마다 faded로 건다. 성공 색은 칸이 아니라 묶음(bundle)의 테두리다.
// 오류 색은 포커스 색을 이긴다(같은 특정도의 포커스 규칙 뒤에 놓는다).
export const cellError = style({
  borderColor: faded(color.error.main),
  selectors: {
    [`${group}:focus-within &[data-active="true"]`]: {
      borderColor: faded(color.error.main),
    },
  },
});
export const cellDisabled = style({
  backgroundColor: faded(color.surface.default),
  borderColor: faded(color.border.default),
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
