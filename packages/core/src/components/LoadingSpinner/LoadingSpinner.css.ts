import { style, styleVariants, keyframes } from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';

// 회전 애니메이션 (spinner용).
// 한 방향 회전이되 속도가 일정하지 않다 — 끌려가는 느낌. 루프에 ease-out을
// 걸면 매 바퀴 멈춘 것처럼 보이므로, 대신 중간 프레임(50% 200deg)을 넣어
// timing은 linear로 두고 키프레임 자체로 비등속을 만든다.
// T5(loopRhythm) 공유 자산을 쓰지 않는다 — 주기가 loop.fast이고 커브가
// linear + 비등속 키프레임인 것은 이 명제 한 줄의 요구이지 계열 리듬(S1)의
// 예외가 아니다. 회전은 좌→우의 원형 형태라 "한 방향"은 그대로 지켜진다.
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

export const container = style({
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

export const dot = style({
  width: '100%',
  height: '100%',
  backgroundColor: 'var(--spinner-color)',
  borderRadius: '50%',
  animation: `${fadeInOut} ${themeContract.animation.loop.base} infinite ${themeContract.animation.easing.drift} backwards`,
});

export const sizeStyles = styleVariants({
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
