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
// "한 방향"은 그대로 지켜진다. 같은 파일의 점 페이드(dot)는 주기·커브가
// Skeleton wave와 같아 공유 자산을 거친다(리뷰 F3).
const spin = keyframes({
  '0%': { transform: 'rotate(0deg)' },
  '50%': { transform: 'rotate(200deg)' },
  '100%': { transform: 'rotate(360deg)' },
});

// 페이드 인아웃 애니메이션 (dots용)
const fadeInOut = keyframes({
  '0%, 100%': {
    opacity: 0.2,
    transform: 'translateY(0)',
  },
  '50%': {
    opacity: 1,
  },
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
  backgroundColor: themeContract.color.background.default,
  opacity: 0.9,
  zIndex: themeContract.zIndex.modal,
});

export const overlayStyles = style({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: themeContract.color.background.default,
  opacity: 0.8,
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

export const dotsContainer = style({
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
});

// 점 페이드는 주기·커브가 Skeleton wave와 같다 — 위 회전의 제외 사유(회전
// 이라서)가 여기엔 적용되지 않으므로 계열 공유 자산을 그대로 거친다(리뷰 F3).
export const dot = style({
  width: '100%',
  height: '100%',
  backgroundColor: 'var(--spinner-color)',
  borderRadius: '50%',
  animation: `${fadeInOut} ${themeContract.animation.loop.base} infinite ${loopRhythmEasing} backwards`,
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

export const dotSizeStyles = styleVariants({
  sm: { width: '4px', height: '4px' },
  md: { width: '8px', height: '8px' },
  lg: { width: '10px', height: '10px' },
  xl: { width: '12px', height: '12px' },
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
