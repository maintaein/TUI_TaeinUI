import {
  createVar,
  style,
  styleVariants,
  keyframes,
  globalStyle,
} from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';

const borderW = createVar();
const borderS = createVar();

export const border = style({
  display: 'block',
  // ::before 빛 루프가 컨테이닝 블록을 가지려면 필요하다(루트에 position이
  // 없었다 — 실측 정정, 승인됨).
  position: 'relative',
  borderWidth: 0,
  borderStyle: 'none',
  vars: {
    [borderW]: '1px',
    [borderS]: 'solid',
  },
});

export const sidesStyles = styleVariants({
  all: {
    borderWidth: borderW,
    borderStyle: borderS,
  },
  top: {
    borderTopWidth: borderW,
    borderTopStyle: borderS,
  },
  right: {
    borderRightWidth: borderW,
    borderRightStyle: borderS,
  },
  bottom: {
    borderBottomWidth: borderW,
    borderBottomStyle: borderS,
  },
  left: {
    borderLeftWidth: borderW,
    borderLeftStyle: borderS,
  },
  horizontal: {
    borderTopWidth: borderW,
    borderTopStyle: borderS,
    borderBottomWidth: borderW,
    borderBottomStyle: borderS,
  },
  vertical: {
    borderLeftWidth: borderW,
    borderLeftStyle: borderS,
    borderRightWidth: borderW,
    borderRightStyle: borderS,
  },
});

export const widthStyles = styleVariants({
  thin: { vars: { [borderW]: '1px' } },
  medium: { vars: { [borderW]: '2px' } },
  thick: { vars: { [borderW]: '4px' } },
});

export const variantStyles = styleVariants({
  solid: { vars: { [borderS]: 'solid' } },
  dashed: { vars: { [borderS]: 'dashed' } },
  dotted: { vars: { [borderS]: 'dotted' } },
});

export const colorStyles = styleVariants({
  default: {
    borderColor: themeContract.color.border.default,
  },
  primary: {
    borderColor: themeContract.color.primary.main,
  },
  success: {
    borderColor: themeContract.color.success.main,
  },
  error: {
    borderColor: themeContract.color.error.main,
  },
  warning: {
    borderColor: themeContract.color.warning.main,
  },
});

export const roundedStyles = styleVariants({
  none: {
    borderRadius: '0',
  },
  sm: {
    borderRadius: themeContract.borderRadius.sm,
  },
  md: {
    borderRadius: themeContract.borderRadius.base,
  },
  lg: {
    borderRadius: themeContract.borderRadius.lg,
  },
  full: {
    borderRadius: themeContract.borderRadius.xl,
  },
});

export const paddingStyles = styleVariants({
  none: {
    padding: '0',
  },
  sm: {
    padding: themeContract.spacing[2],
  },
  md: {
    padding: themeContract.spacing[4],
  },
  lg: {
    padding: themeContract.spacing[6],
  },
});

// 빛이 경계선을 따라 한 바퀴 돈다(장식계, 명제 §3). 자율 루프라 되돌아갈
// 상태가 없고 조항 1 밖이다(공통 제약 §2) — @keyframes가 맞는 도구다.
// Vanilla Extract에 @property API가 없어 커스텀 프로퍼티 회전은 못 쓴다 —
// 대신 conic-gradient를 깐 ::before 전체를 transform: rotate()로 돌리고
// mask로 테두리 폭만 남긴다(브리프 판정).
const rotate = keyframes({
  '0%': { transform: 'rotate(0deg)' },
  '100%': { transform: 'rotate(360deg)' },
});

// 닫힌 테두리(perimeter)가 있어야 "한 바퀴"가 성립한다 — sides='all'일
// 때만 Border.tsx가 이 class를 얹는다(판정: 나머지 6개 sides는 장식 없음,
// 가독성 비용 0으로 나중에 확장 가능).
export const borderGlow = style({});

// ::before를 content부터 :hover·:focus-within 선택자 안에서만 정의한다 —
// 규칙이 안 걸리면 pseudo-element 자체가 생성되지 않으므로 will-change도
// 같이 사라진다. 별도의 "비활성 시 제거" 로직 없이 선택자 매칭에 통째로
// 맡긴다(HeaderBar의 상주 will-change 반례를 피한다). Border에는 상태
// prop이 없다 — 트리거는 :hover·:focus-within이다(감싼 콘텐츠에 초점
// 가능한 요소가 없으면 :hover만 남는다, 장식이라 손실 없음).
globalStyle(`${borderGlow}:hover::before, ${borderGlow}:focus-within::before`, {
  content: '""',
  position: 'absolute',
  inset: 0,
  // borderW(테두리 두께 var)를 padding으로 써서 content-box와 border-box
  // 차이만큼만 mask로 남긴다 — width 변형(thin/medium/thick)을 그대로
  // 따라간다.
  padding: borderW,
  borderRadius: 'inherit',
  pointerEvents: 'none',
  backgroundImage: `conic-gradient(from 0deg, transparent 0deg, transparent 270deg, ${themeContract.color.primary.main} 330deg, transparent 360deg)`,
  maskImage: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
  maskComposite: 'exclude',
  animation: `${rotate} ${themeContract.animation.loop.base} ${themeContract.animation.easing.linear} infinite`,
  willChange: 'transform',
});
