import { style, styleVariants, keyframes } from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';
import { loopRhythmEasing } from '../../tokens/loopRhythm.css';

// 애니메이션 정의
// wave의 방향(좌→우)이 상태계 계열 기준이다(S1) — Loader 스윕·LoadingSpinner가
// 이 방향·리듬을 따른다. 커브는 T5 공유 자산(loopRhythm)에서, 주기는
// loop.base 토큰을 직접 받는다(이유는 loopRhythm.css.ts 주석 참고).
const wave = keyframes({
  '0%': {
    transform: 'translateX(-100%)',
  },
  '50%': {
    transform: 'translateX(100%)',
  },
  '100%': {
    transform: 'translateX(100%)',
  },
});

const pulse = keyframes({
  '0%': {
    opacity: 1,
  },
  '50%': {
    opacity: 0.4,
  },
  '100%': {
    opacity: 1,
  },
});

// 기본 스타일
export const skeleton = style({
  display: 'inline-block',
  backgroundColor: themeContract.color.surface.hover,
  position: 'relative',
  overflow: 'hidden',
});

// Variant 스타일
export const variantStyles = styleVariants({
  text: {
    height: '1em',
    width: '100%',
    borderRadius: themeContract.borderRadius.sm,
    transform: 'scale(1, 0.60)',
    transformOrigin: '0 60%',
  },
  rect: {
    width: '100%',
    height: '100%',
    borderRadius: themeContract.borderRadius.sm,
  },
  circle: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
  },
  rounded: {
    width: '100%',
    height: '100%',
    borderRadius: themeContract.borderRadius.md,
  },
});

// Animation 스타일
export const animationStyles = styleVariants({
  wave: {
    selectors: {
      '&::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        transform: 'translateX(-100%)',
        backgroundImage: `linear-gradient(90deg,
          transparent,
          ${themeContract.color.overlay.shimmer},
          transparent
        )`,
        animation: `${wave} ${themeContract.animation.loop.base} ${loopRhythmEasing} 0.5s infinite`,
      },
    },
  },
  pulse: {
    // wave와 같은 공유 자산을 거친다(리뷰 F3) — 같은 파일 안에서 한쪽만
    // 토큰을 직접 부르면 같은 값이 두 이름을 갖고, 커브를 바꾸는 날 한쪽만
    // 바뀐다.
    animation: `${pulse} ${themeContract.animation.loop.base} ${loopRhythmEasing} 0.5s infinite`,
  },
});
