import { style, styleVariants, keyframes } from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';
import { loopRhythmEasing } from '../../tokens/loopRhythm.css';

// 사용자 관문(M5 task-28): "살짝만 느리게". loop.base(1500ms)의 1.2배(1800ms)다.
// S1은 Loader가 Skeleton의 방향·리듬을 따른다고 적었지만, 이 배율은 Skeleton
// 주기에만 걸고 Loader는 그대로 둔다. 배율 1.2는 상수로 빼지 않고 animation 줄에
// `calc(토큰 * 1.2)`로 쓴다(Loader의 `* 2`와 같은 관례): 가드 둘이 줄에서 loop
// 토큰 참조와 리터럴 배수를 직접 읽는다(animationBoundary의 시작 지연 집계,
// tierAKeyframesReducedMotion의 duration 자리 형태).

// 사용자 관문 2(M5 task-28): "회색 영역이 사라졌다가 다시 생성되는 느낌". 빛은
// 흰색 30% 한 점이 아니라 가운데 30%(35%~65%)가 불투명 흰색인 띠다. 이 구간을
// 지나는 동안 회색이 완전히 가려졌다가 지나간 뒤 다시 드러난다.
const GLOW_START = '35%';
const GLOW_END = '65%';

// 애니메이션 정의
// wave의 방향(좌→우)이 상태계 계열 기준이다(S1) — Loader 스윕·점 페이드가
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
  // 사용자 관문(M5 task-28): surface.hover(gray[100])보다 한 단계 진한 gray[200]
  // (흰 바탕 대비 1.09 -> 1.16).
  backgroundColor: themeContract.palette.gray[200],
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
          transparent 0%,
          ${themeContract.color.background.default} ${GLOW_START},
          ${themeContract.color.background.default} ${GLOW_END},
          transparent 100%
        )`,
        animation: `${wave} calc(${themeContract.animation.loop.base} * 1.2) ${loopRhythmEasing} 0.5s infinite`,
      },
    },
  },
  pulse: {
    // wave와 같은 공유 자산을 거친다(리뷰 F3) — 같은 파일 안에서 한쪽만
    // 토큰을 직접 부르면 같은 값이 두 이름을 갖고, 커브를 바꾸는 날 한쪽만
    // 바뀐다.
    animation: `${pulse} calc(${themeContract.animation.loop.base} * 1.2) ${loopRhythmEasing} 0.5s infinite`,
  },
});
