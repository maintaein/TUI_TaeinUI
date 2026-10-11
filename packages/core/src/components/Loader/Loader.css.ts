import { style, styleVariants, keyframes } from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';
import { loopRhythmEasing } from '../../tokens/loopRhythm.css';
import {
  FUSE_SPARK_PX,
  ORBIT_DOT_PX,
  ORBIT_RADIUS_PX,
  WAVE_HEIGHT_PX,
  WAVE_WIDTH_PX,
  inchwormFrames,
  inchwormInset,
  inchwormStops,
} from './loaderMotion';

// 머리의 은은한 광휘. 타입마다 "움직이는 파란 부분(머리)"에 같은 빛을 건다: 값이
// 하나라 색만 머리 색으로 바뀐다. 정지된 빛이라 애니메이션하지 않고 축소 선호에서도
// 그대로 둔다. box-shadow 인자와 drop-shadow 인자가 같은 문법이라 둘 다 이 값을 쓴다.
const loaderGlow = (color: string): string =>
  `0 0 6px color-mix(in srgb, ${color} 45%, transparent)`;

// 애니메이션 정의
const progress = keyframes({
  '0%': {
    transform: 'translateX(-100%)',
  },
  '100%': {
    transform: 'translateX(400%)',
  },
});

// 회전 애니메이션 (spinner용).
// 한 방향 회전이되 속도가 일정하지 않다 — 끌려가는 느낌. 루프에 ease-out을
// 걸면 매 바퀴 멈춘 것처럼 보이므로, 대신 중간 프레임(50% 200deg)을 넣어
// timing은 linear로 두고 키프레임 자체로 비등속을 만든다.
// T5(loopRhythm) 공유 자산을 쓰지 않는 회전은 이것이다. 주기가
// loop.fast이고 커브가 linear + 비등속 키프레임인 것은 이 명제 한 줄의
// 요구이지 계열 리듬(S1)의 예외가 아니다. 회전은 좌→우의 원형 형태라
// "한 방향"은 그대로 지켜진다. 같은 파일의 점 궤도(orbit)와 버블 점의 예비동작은
// 구간 커브가 Skeleton wave와 같아 공유 자산을 거친다(리뷰 F3, M5 task-20).
// 자벌레(inchworm)도 공유 자산 밖이다: 구간 커브가 settle이고 주기가
// loop.base의 2배다(걸음 5번이 한 바퀴라서).
const spin = keyframes({
  '0%': { transform: 'rotate(0deg)' },
  '50%': { transform: 'rotate(200deg)' },
  '100%': { transform: 'rotate(360deg)' },
});

// 점 궤도(orbit): 제자리에 있는 점 8개의 밝기만 차례로 지나간다. 점은 움직이지
// 않는다(transform은 배치용). 켜진 창이 한 바퀴의 62%라 여러 점이 동시에 켜져
// 꼬리가 생긴다. 구간 커브는 이 키프레임을 쓰는 쪽에서 drift로 건다.
const orbitLit = keyframes({
  '0%, 100%': { opacity: 0.15 },
  '18%, 42%': { opacity: 1 },
  '62%': { opacity: 0.15 },
});

// 버블 점(dots)의 움직임은 둘로 나뉜다. 한 animation은 구간마다 커브를 못
// 바꾸고, 키프레임 안에 커브를 넣는 것은 transform·opacity 밖이라 가드가
// 막는다. 그래서 바깥 상자는 솟음(넘치는 커브 snap, transform만)을, 안쪽
// 몸통은 예비동작(drift)을 맡는다. 한 바퀴의 앞 38%만 움직이고 나머지는 쉰다.
// 투명도는 늘 1이다. 예비동작은 솟기 전에 바닥에서 일어난다(교훈 14).
// 솟음: 10%까지 바닥에 머물다(그동안 몸이 눌린다) 점 지름만큼 올라가 20%에
// 꼭대기, 32%에 내려앉는다. snap이 구간마다 살짝 넘치므로 내려앉을 때 바닥을
// 조금 지난다.
const bubbleRise = keyframes({
  '0%, 10%, 32%, 100%': { transform: 'translateY(0)' },
  '20%': { transform: 'translateY(calc(var(--bubble-rise) * -1))' },
});

// 몸: 0 → 10% 바닥에서 가로로 퍼지고 세로로 눌린다. 10 → 20% 늘어나며 떠나
// 꼭대기에서 둥글어진다. 32%에 닿을 때 작게 눌렸다가 38%에 펴져 쉰다.
const bubbleSquash = keyframes({
  '0%, 20%, 38%, 100%': { transform: 'scale(1)' },
  '10%': { transform: 'scaleX(1.15) scaleY(0.8)' },
  '14%': { transform: 'scaleX(0.92) scaleY(1.1)' },
  '32%': { transform: 'scaleX(1.08) scaleY(0.92)' },
});

// 물결 막대(wave): 보이지 않는 머리가 좌 → 우로 지나가며 막대가 솟았다
// 가라앉는다. 막대마다 늦춤이 달라 한 막대의 키프레임은 같다. 8%에 꼭대기
// (머리 앞은 좁다), 40%에 쉬는 높이(뒤는 넓다). scaleY만 움직인다.
const waveSwell = keyframes({
  '0%, 40%, 100%': { transform: 'scaleY(0.3)' },
  '8%': { transform: 'scaleY(1)' },
});

// 자벌레(inchworm): 걸음 5번의 정지점을 loaderMotion의 순수 함수가 반복문으로
// 만든다. 채움 층을 clip-path로 오려 몸 모양을 그린다(둥근 끝이 납작해지지
// 않는다). clip-path는 transform·opacity 밖이지만 레이아웃을 건드리지 않는
// 페인트 속성이다.
const inchworm = keyframes({
  ...inchwormFrames(themeContract.animation.easing.settle),
});

// 도화선(fuse)의 불똥: 타들어 가는 불이라 고르지 않게 깜빡인다. 정지점이 고르지
// 않고(0 / 23 / 41 / 67 / 100) 크기 0.85 ~ 1.1, 투명도 0.7 ~ 1 사이를 오간다.
// 구간 커브는 쓰는 쪽에서 drift로 건다(M5 task-20 3부).
const fuseFlicker = keyframes({
  '0%, 100%': { transform: 'scale(1)', opacity: 1 },
  '23%': { transform: 'scale(0.85)', opacity: 0.7 },
  '41%': { transform: 'scale(1.1)', opacity: 1 },
  '67%': { transform: 'scale(0.9)', opacity: 0.8 },
});

// 축소 선호일 때 dots가 돌아가는 투명도 깜빡임. transform은 없다.
const fadeInOut = keyframes({
  '0%, 100%': { opacity: 0.2 },
  '50%': { opacity: 1 },
});

export const loaderContainer = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '1rem',
});

export const fullScreenStyles = style({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  // 컨테이너 전체 투명도가 아니라 배경색에만 투명도를 준다. 컨테이너에 걸면 안의
  // 로더와 라벨까지 흐려져 라벨 대비가 4.5:1 밑으로 내려간다.
  backgroundColor: `color-mix(in srgb, ${themeContract.color.background.default} 90%, transparent)`,
  zIndex: themeContract.zIndex.modal,
});

export const overlayStyles = style({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: `color-mix(in srgb, ${themeContract.color.background.default} 80%, transparent)`,
  zIndex: 10,
});

export const bar = style({
  position: 'relative',
  height: '6px',
  // 테두리 없이 회색 면 하나로 트랙을 그린다. 흰 페이지 위에서 면이 보이려면
  // paper(1.04:1)로는 모자라 gray[200]을 쓴다(SegmentedButtons 트랙과 같다).
  // 채움(primary.main)과는 3:1을 넘는다.
  backgroundColor: themeContract.palette.gray[200],
  borderRadius: '3px',

  selectors: {
    // white 변형은 어두운 면 위에서 쓰는 것이라 밝은 fill이 올라탄다 —
    // 이 경우에만 트랙이 어두워야 한다. data-color는 Loader.tsx가 바깥
    // 래퍼에 이미 달아 둔 속성이라 새로 붙일 것이 없다.
    '[data-color="white"] &': {
      backgroundColor: themeContract.color.surface.track,
    },
  },
});

export const barFill = style({
  position: 'absolute',
  top: 0,
  left: 0,
  height: '100%',
  width: '25%',
  borderRadius: '3px',
  backgroundColor: 'var(--loader-color)',
  // 빛은 채움이 아니라 자르기 층(barClip)의 필터 하나가 건다.
  // 불확정 스윕이다(진행률을 받는 자리가 아니다) — S1: Skeleton wave와
  // 방향(좌→우) · 커브(T5 공유 자산) · 주기(loop.base)를 공유한다.
  animation: `${progress} ${themeContract.animation.loop.base} ${loopRhythmEasing} infinite`,
});

export const barSizeStyles = styleVariants({
  sm: { width: '100px' },
  md: { width: '200px' },
  lg: { width: '300px' },
  xl: { width: '400px' },
});

// 막대(bar·inchworm)의 채움 자르기 층. 트랙과 같은 크기·위치의 투명한 층이고,
// 채움이 트랙 끝을 넘나들 때 둥근 끝(3px)으로 자른다(clip-path가 아니라 overflow +
// border-radius). 빛(drop-shadow)은 이 층이 자기 내용을 둥글게 자른 결과에 걸리므로
// 빛이 둥근 채움을 따라 번지고 트랙 끝에서 직선으로 끊기지 않는다. 트랙 면은 이 밖이라
// 빛이 면까지 번지지 않는다. 색 변수는 이 층이 받고 채움이 상속한다.
export const barClip = style({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  overflow: 'hidden',
  borderRadius: '3px',
  pointerEvents: 'none',
  filter: `drop-shadow(${loaderGlow('var(--loader-color)')})`,
});

// 자벌레의 채움 층. 트랙 전체 폭을 채우고 clip-path로 몸 모양만 남긴다.
// 한 바퀴는 loop.base의 두 배(걸음 하나가 600ms)다. 구간 커브는 키프레임
// 정지점마다 걸려 있어 여기에는 커브를 쓰지 않는다. 축소 선호에서는 기어가지
// 않고 가운데에 머물며 투명도 맥박으로 돌아간다.
export const inchwormFill = style({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundColor: 'var(--loader-color)',
  clipPath: inchwormInset(inchwormStops()[0]),
  animation: `${inchworm} calc(${themeContract.animation.loop.base} * 2) infinite backwards`,

  '@media': {
    '(prefers-reduced-motion: reduce)': {
      clipPath: 'inset(0 37.5% 0 37.5% round 3px)',
      animation: `${fadeInOut} ${themeContract.animation.loop.base} infinite ${loopRhythmEasing} backwards`,
    },
  },
});

export const colorStyles = styleVariants({
  primary: {
    vars: { '--loader-color': themeContract.color.primary.main },
  },
  secondary: {
    vars: { '--loader-color': themeContract.color.text.secondary },
  },
  white: {
    vars: { '--loader-color': themeContract.color.background.paper },
  },
});

export const inlineContainer = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
});

export const spinner = style({
  position: 'relative',
  border: '3px solid',
  borderColor: themeContract.color.border.default,
  borderTopColor: 'var(--spinner-color)',
  borderRadius: '50%',
  animation: `${spin} ${themeContract.animation.loop.fast} ${themeContract.animation.easing.linear} infinite`,
  boxSizing: 'border-box',

  selectors: {
    // 빛은 색칠된 위쪽 호에만 걸어야 한다. 고리 전체에 그림자를 걸면 회색 부분까지
    // 번지므로, 같은 크기의 겹친 층에 위쪽 테두리만 칠하고(나머지 투명) 그 층에
    // drop-shadow를 건다. 층은 고리와 같이 돈다.
    '&::before': {
      content: "''",
      position: 'absolute',
      inset: '-3px',
      boxSizing: 'border-box',
      border: '3px solid',
      borderColor: 'transparent',
      borderTopColor: 'var(--spinner-color)',
      borderRadius: '50%',
      filter: `drop-shadow(${loaderGlow('var(--spinner-color)')})`,
    },
  },
});

// 점 궤도. 로더 크기는 spinnerSizeStyles가 주고, 점은 그 안에서 절대 배치한다.
export const orbit = style({
  position: 'relative',
});

export const orbitDot = style({
  position: 'absolute',
  top: '50%',
  left: '50%',
  width: 'var(--orbit-d)',
  height: 'var(--orbit-d)',
  margin: 'calc(var(--orbit-d) / -2) 0 0 calc(var(--orbit-d) / -2)',
  borderRadius: '50%',
  backgroundColor: 'var(--spinner-color)',
  boxShadow: loaderGlow('var(--spinner-color)'),
  // 12시에서 시작해 시계 방향으로 i번째 점이 i × 45deg. 중심에서 반지름만큼 민다.
  transform:
    'rotate(calc(var(--orbit-i) * 45deg)) translateY(calc(var(--orbit-r) * -1))',
  opacity: 0.15,
  animation: `${orbitLit} ${themeContract.animation.loop.fast} ${loopRhythmEasing} infinite`,
  // 점마다 한 바퀴의 1/8씩 늦게 켜진다. 리터럴 시간 없이 loop 토큰의 배수다.
  animationDelay: `calc(${themeContract.animation.loop.fast} * var(--orbit-i) / 8)`,
  // 완료 표식(status)이 되면 점이 색을 바꾼다. 색은 CSS 전이가 맡고 위치와
  // 투명도는 GSAP이 맡는다(Loader.tsx). 점의 빛(box-shadow)도 같은 색을 따라가야
  // 해서 background-color와 같이 전이한다. 빛이 혼자 툭 바뀌지 않게 하려는 것이고
  // 빛 자체를 움직이는 것은 아니다. 표식으로 모이는 동안과 앉은 뒤에는 밝기
  // 키프레임을 멈춘다(data-paused). loading으로 돌아와 도착하면 재개된다.
  transition: `background-color ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}, box-shadow ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}`,

  selectors: {
    '[data-status="done"] &': {
      backgroundColor: themeContract.color.success.dark,
      boxShadow: loaderGlow(themeContract.color.success.dark),
    },
    '[data-status="error"] &': {
      backgroundColor: themeContract.color.error.dark,
      boxShadow: loaderGlow(themeContract.color.error.dark),
    },
    '[data-paused] &': { animation: 'none' },
  },

  '@media': {
    // 회전 인상을 없앤다: 늦춤을 없애 모든 점이 같이 뛰고 한 바퀴는 loop.base로
    // 늘린다. 전역 reduced-motion 규칙이 반복을 1회로 접으므로 실제로는 멈춘
    // 채 끝나는데, 그때 보일 모습이 0.15면 고리가 거의 사라진다. 그래서 멈춘
    // 상태의 점은 눈에 보이는 투명도로 둔다.
    '(prefers-reduced-motion: reduce)': {
      opacity: 0.6,
      animationDelay: 'initial',
      animationDuration: themeContract.animation.loop.base,
    },
  },
});

// 점 지름은 대략 로더 크기의 1/6. 반지름은 점 중심이 놓이는 원의 반지름
// (크기 - 점 지름) / 2.
// 표식 좌표도 같은 반지름을 읽는다(loaderMotion의 ORBIT_RADIUS_PX).
export const orbitDotSizeStyles = styleVariants(ORBIT_DOT_PX, (d, size) => ({
  vars: {
    '--orbit-d': `${d}px`,
    '--orbit-r': `${ORBIT_RADIUS_PX[size]}px`,
  },
}));

// 물결 막대. 막대 칸은 폭 8px(막대 2px + 좌우 여백 3px)라 중심 간격이 8px로
// 고정이고 개수는 폭 / 8이다(교훈 18, Slider wake와 같다).
export const wave = style({
  display: 'flex',
  alignItems: 'center',
});

export const waveSizeStyles = styleVariants(WAVE_WIDTH_PX, (width, size) => ({
  width: `${width}px`,
  height: `${WAVE_HEIGHT_PX[size]}px`,
}));

// 요소 높이는 최대 높이이고 쉬는 높이는 scaleY(0.3)로 만든다(Slider wakeBar와 같다).
export const waveBar = style({
  flexShrink: 0,
  width: '2px',
  height: '100%',
  margin: '0 3px',
  borderRadius: '1px',
  backgroundColor: 'var(--spinner-color)',
  boxShadow: loaderGlow('var(--spinner-color)'),
  transform: 'scaleY(0.3)',
  transformOrigin: 'center',
  animation: `${waveSwell} ${themeContract.animation.loop.base} ${loopRhythmEasing} infinite backwards`,
  // 막대마다 한 바퀴의 i / N만큼 늦게 시작해 머리가 좌 → 우로 지나가는 것처럼 보인다.
  animationDelay: `calc(${themeContract.animation.loop.base} * var(--wave-i) / var(--wave-n))`,

  '@media': {
    // 막대는 쉬는 높이로 두고, 늦춤 없이(shorthand가 지연을 되돌린다) 함께
    // 투명도로 맥박한다.
    '(prefers-reduced-motion: reduce)': {
      animation: `${fadeInOut} ${themeContract.animation.loop.base} infinite ${loopRhythmEasing} backwards`,
    },
  },
});

export const dotsContainer = style({
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
});

// 버블 점의 바깥 상자. 크기·솟음을 맡는다(위 bubbleRise). 주기는 Skeleton
// wave와 같은 loop.base다. 축소 선호에서는 transform 없이 투명도 깜빡임으로
// 돌아가며, 그 깜빡임은 위 회전의 제외 사유(회전이라서)가 적용되지 않으므로
// 계열 공유 자산(loopRhythmEasing)을 그대로 거친다(리뷰 F3).
export const dot = style({
  animation: `${bubbleRise} ${themeContract.animation.loop.base} ${themeContract.animation.easing.snap} infinite backwards`,

  '@media': {
    '(prefers-reduced-motion: reduce)': {
      animation: `${fadeInOut} ${themeContract.animation.loop.base} infinite ${loopRhythmEasing} backwards`,
    },
  },
});

// 버블 점의 안쪽 몸통. 눌림(예비동작)을 맡는다. 눌릴 때 바닥이 붙어 있도록
// 기준점이 아래 가운데다.
export const dotBody = style({
  // span은 기본이 inline이라 block으로 두지 않으면 width·height 100%가 먹지 않아
  // 0 x 0이 되고 점이 보이지 않는다(바깥 상자는 flex 항목이라 블록화되지만 안쪽은 아니다).
  display: 'block',
  width: '100%',
  height: '100%',
  backgroundColor: 'var(--spinner-color)',
  boxShadow: loaderGlow('var(--spinner-color)'),
  borderRadius: '50%',
  transformOrigin: '50% 100%',
  animation: `${bubbleSquash} ${themeContract.animation.loop.base} ${loopRhythmEasing} infinite backwards`,

  '@media': {
    '(prefers-reduced-motion: reduce)': {
      animation: 'none',
    },
  },
});

export const spinnerSizeStyles = styleVariants({
  sm: {
    width: '16px',
    height: '16px',
  },
  md: {
    width: '24px',
    height: '24px',
  },
  lg: {
    width: '32px',
    height: '32px',
  },
  xl: {
    width: '48px',
    height: '48px',
  },
});

// --bubble-rise: 솟는 높이 = 점 지름
export const dotSizeStyles = styleVariants({
  sm: { width: '4px', height: '4px', vars: { '--bubble-rise': '4px' } },
  md: { width: '8px', height: '8px', vars: { '--bubble-rise': '8px' } },
  lg: { width: '10px', height: '10px', vars: { '--bubble-rise': '10px' } },
  xl: { width: '12px', height: '12px', vars: { '--bubble-rise': '12px' } },
});

export const dotDelayStyles = styleVariants({
  first: { animationDelay: '0s' },
  second: { animationDelay: '0.2s' },
  third: { animationDelay: '0.4s' },
});

export const label = style({
  // 글자가 바뀔 때 켜지지 않은 층이 이 칸 위에 겹친다(labelLayer).
  position: 'relative',
  margin: 0,
  fontSize: themeContract.font.size.sm,
  fontWeight: themeContract.font.weight.medium,
  color: themeContract.color.text.secondary,
  fontFamily: themeContract.font.family.sans,
  textAlign: 'center',
});

// 라벨 교체: 켜진 층만 칸 안에 있고 켜지지 않은 층은 절대 위치로 칸 전체에 겹쳐
// 칸 폭에 들어가지 않는다. 글자는 줄바꿈을 막지 않아 칸 폭에 맞춰 줄이 나뉘고
// 칸 밖으로 넘지 않는다(글자 정렬은 칸의 가운데). 흐림 교체(투명도·blur)는
// Loader.tsx의 GSAP 타임라인 하나가 맡는다.
export const labelLayer = style({
  display: 'block',

  selectors: {
    '&:not([data-active])': {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
    },
  },
});

// 시각적으로만 숨기는 글자. display: none·visibility: hidden은 접근성 트리에서도
// 지워져 쓸 수 없다. Snackbar.css.ts의 visuallyHidden과 같은 규칙이다.
export const visuallyHidden = style({
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

// 도화선(fuse): 트랙은 bar와 같다. 채움 층은 트랙 전체 폭이고 clip-path로
// 오른쪽을 잘라 --fuse-value(0~100)만큼 좌 → 우로 채운다. 불똥은 트랙 밖으로
// 번지므로 overflow가 잘리는 트랙 안이 아니라 곁에 둔다.
export const fuse = style({
  position: 'relative',
});

export const fuseFill = style({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundColor: 'var(--loader-color)',
  clipPath: 'inset(0 calc(100% - var(--fuse-value) * 1%) 0 0 round 3px)',
  // clip-path 전이는 레이아웃을 건드리지 않는 페인트 속성이다(자벌레와 같다).
  // 둥근 끝(round 3px)을 지키며 오른쪽 가장자리만 옮기려면 이 속성이 필요하다.
  transition: `clip-path ${themeContract.animation.duration.slow} ${themeContract.animation.easing.settle}`,

  '@media': {
    '(prefers-reduced-motion: reduce)': {
      transition: 'none',
    },
  },
});

// 불똥 래퍼: 트랙 폭과 같은 폭이고, 오른쪽 끝이 채움 끝에 오도록 옮긴다
// (value% - 100%, transform이라 GPU). 100이면 base로 사라진다.
export const fuseSpark = style({
  position: 'absolute',
  top: '50%',
  left: 0,
  width: '100%',
  height: 0,
  pointerEvents: 'none',
  transform: 'translateX(calc(var(--fuse-value) * 1% - 100%))',
  transition: `transform ${themeContract.animation.duration.slow} ${themeContract.animation.easing.settle}, opacity ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}`,

  selectors: {
    '[data-complete] &': { opacity: 0 },
  },

  '@media': {
    '(prefers-reduced-motion: reduce)': {
      transition: 'none',
    },
  },
});

// 불똥 본체. 지름의 절반만큼 당겨 중심이 래퍼 오른쪽 끝에 놓인다.
export const fuseSparkDot = style({
  position: 'absolute',
  top: 'calc(var(--spark-d) / -2)',
  right: 'calc(var(--spark-d) / -2)',
  width: 'var(--spark-d)',
  height: 'var(--spark-d)',
  borderRadius: '50%',
  backgroundColor: 'var(--loader-color)',
  boxShadow: loaderGlow('var(--loader-color)'),
  animation: `${fuseFlicker} ${themeContract.animation.loop.fast} ${loopRhythmEasing} infinite`,

  '@media': {
    '(prefers-reduced-motion: reduce)': {
      animation: 'none',
    },
  },
});

export const fuseSparkSizeStyles = styleVariants(FUSE_SPARK_PX, (d) => ({
  vars: { '--spark-d': `${d}px` },
}));
