import { style, styleVariants, keyframes } from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';
import { loopRhythmEasing } from '../../tokens/loopRhythm.css';

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
// T5(loopRhythm) 공유 자산을 쓰지 않는 건 이 회전 하나다 — 주기가
// loop.fast이고 커브가 linear + 비등속 키프레임인 것은 이 명제 한 줄의
// 요구이지 계열 리듬(S1)의 예외가 아니다. 회전은 좌→우의 원형 형태라
// "한 방향"은 그대로 지켜진다. 같은 파일의 점 궤도(orbit)와 버블 점의 예비동작은
// 구간 커브가 Skeleton wave와 같아 공유 자산을 거친다(리뷰 F3, M5 task-20).
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
// 몸통은 예비동작(drift)을 맡는다. 한 바퀴의 앞 1/3(약 500ms)만 움직이고
// 나머지는 쉰다. 투명도는 늘 1이다.
// 솟음: 12%(예비동작이 끝나는 자리)에서 점 지름만큼 올라가 22%에 꼭대기,
// 33%에 내려앉는다. snap이 구간마다 살짝 넘치므로 내려앉을 때 바닥을 조금 지난다.
const bubbleRise = keyframes({
  '0%, 12%, 33%, 100%': { transform: 'translateY(0)' },
  '22%': { transform: 'translateY(calc(var(--bubble-rise) * -1))' },
});

// 예비동작: 가로로 퍼지고 세로로 눌렸다가(12%) 22%까지 펴진다.
const bubbleSquash = keyframes({
  '0%, 22%, 100%': { transform: 'scale(1)' },
  '12%': { transform: 'scaleX(1.15) scaleY(0.8)' },
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
  height: '4px',
  // 움직이는 fill이 이 컴포넌트의 유일한 신호다. fill이 어두우니 면은 연하게
  // 두고 식별성은 border.strong 경계선이 맡는다.
  backgroundColor: themeContract.color.background.paper,
  boxShadow: `inset 0 0 0 1px ${themeContract.color.border.strong}`,
  borderRadius: '2px',
  overflow: 'hidden',

  selectors: {
    // white 변형은 어두운 면 위에서 쓰는 것이라 밝은 fill이 올라탄다 —
    // 이 경우에만 트랙이 어두워야 한다. data-color는 Loader.tsx가 바깥
    // 래퍼에 이미 달아 둔 속성이라 새로 붙일 것이 없다.
    '[data-color="white"] &': {
      backgroundColor: themeContract.color.surface.track,
      boxShadow: 'none',
    },
  },
});

export const barFill = style({
  position: 'absolute',
  top: 0,
  left: 0,
  height: '100%',
  width: '25%',
  borderRadius: '2px',
  backgroundColor: 'var(--loader-color)',
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
  border: '3px solid',
  borderColor: themeContract.color.border.default,
  borderTopColor: 'var(--spinner-color)',
  borderRadius: '50%',
  animation: `${spin} ${themeContract.animation.loop.fast} ${themeContract.animation.easing.linear} infinite`,
  boxSizing: 'border-box',
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
  // 12시에서 시작해 시계 방향으로 i번째 점이 i × 45deg. 중심에서 반지름만큼 민다.
  transform:
    'rotate(calc(var(--orbit-i) * 45deg)) translateY(calc(var(--orbit-r) * -1))',
  opacity: 0.15,
  animation: `${orbitLit} ${themeContract.animation.loop.fast} ${loopRhythmEasing} infinite`,
  // 점마다 한 바퀴의 1/8씩 늦게 켜진다. 리터럴 시간 없이 loop 토큰의 배수다.
  animationDelay: `calc(${themeContract.animation.loop.fast} * var(--orbit-i) / 8)`,

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
export const orbitDotSizeStyles = styleVariants({
  sm: { vars: { '--orbit-d': '3px', '--orbit-r': '6.5px' } },
  md: { vars: { '--orbit-d': '4px', '--orbit-r': '10px' } },
  lg: { vars: { '--orbit-d': '5px', '--orbit-r': '13.5px' } },
  xl: { vars: { '--orbit-d': '8px', '--orbit-r': '20px' } },
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
  width: '100%',
  height: '100%',
  backgroundColor: 'var(--spinner-color)',
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
  margin: 0,
  fontSize: themeContract.font.size.sm,
  fontWeight: themeContract.font.weight.medium,
  color: themeContract.color.text.secondary,
  fontFamily: themeContract.font.family.sans,
  textAlign: 'center',
});
