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
// 빛 색. colorStyles 각 변형이 덮어쓴다(borderW/borderS와 같은 패턴).
const glowColor = createVar();

export const border = style({
  display: 'block',
  // ::before 빛 루프가 컨테이닝 블록을 가지려면 필요하다(루트에 position이
  // 없었다, 실측 정정, 승인됨).
  position: 'relative',
  borderWidth: 0,
  borderStyle: 'none',
  vars: {
    [borderW]: '1px',
    [borderS]: 'solid',
    [glowColor]: themeContract.color.primary.main,
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
  // 판정: default만 빛이 테두리 색을 따라가지 않는다. color.border.default는
  // 중성 회색이고 회색 테두리에 회색 빛은 보이지 않는다. 가장 많이 쓰이는
  // 변형에서 효과가 통째로 사라진다. 빛이 하는 말은 「여기가 지금 살아
  // 있다」이고 그건 강조색이어야 성립한다. 「default도 따라가게 해야 하는 것
  // 아닌가」는 반드시 다시 올라온다. 이 주석이 답이다.
  default: {
    borderColor: themeContract.color.border.default,
    vars: { [glowColor]: themeContract.color.primary.main },
  },
  primary: {
    borderColor: themeContract.color.primary.main,
    vars: { [glowColor]: themeContract.color.primary.main },
  },
  success: {
    borderColor: themeContract.color.success.main,
    vars: { [glowColor]: themeContract.color.success.main },
  },
  error: {
    borderColor: themeContract.color.error.main,
    vars: { [glowColor]: themeContract.color.error.main },
  },
  warning: {
    borderColor: themeContract.color.warning.main,
    vars: { [glowColor]: themeContract.color.warning.main },
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

// 자율 루프는 되돌아갈 상태가 없어 조항 1 밖이며, 두 반바퀴의 가감속을 각각 drift로 잇는다.
const travel = keyframes({
  '0%': {
    offsetDistance: '0%',
  },
  '50%': {
    offsetDistance: '50%',
  },
  '100%': { offsetDistance: '100%' },
});

// 링까지 움직이면 마스크가 콘텐츠를 가로지르므로, 빛을 가둘 고정 그릇이 필요하다.
export const glowRing = style({
  position: 'absolute',
  // inset 0의 기준은 padding box라 링이 테두리선 안쪽에 놓인다. 테두리 두께만큼
  // 바깥으로 빼서 링의 바깥 가장자리를 border box에 맞춘다. 반경은 border box
  // 기준이라 inherit이 그대로 맞는다.
  inset: `calc(-1 * ${borderW})`,
  // borderW(테두리 두께 var)를 padding으로 써서 content-box와 border-box
  // 차이만큼만 mask로 남긴다. width 변형(thin/medium/thick)을 그대로
  // 따라간다.
  padding: borderW,
  borderRadius: 'inherit',
  pointerEvents: 'none',
  overflow: 'hidden',
  // mask는 반드시 숏핸드다. <geometry-box>(content-box)는 숏핸드에만 올 수
  // 있어서, 롱핸드 mask-image에 넣으면 문법 위반으로 선언이 통째로 버려진다
  // (계산값 mask-image: none, 리뷰 C1, 크로미엄 실측). 그러면 링이 아니라
  // 꽉 찬 사각형이 되어 빛이 감싼 콘텐츠를 덮는다.
  mask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
  WebkitMask:
    'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
  maskComposite: 'exclude',
  // 표준 exclude에 대응하는 레거시 WebKit 값은 xor다. 값이 그대로가 아니라
  // 이름이 다르다. exclude로 "통일"하면 WebKit 쪽이 무시돼 사각형이 된다.
  WebkitMaskComposite: 'xor',
});

// opacity를 키프레임에 넣으면 축소 모션에서 빛이 숨은 채 끝날 수 있어 기본 자세를 그대로 보인다.
globalStyle(`${glowRing}::before`, {
  content: '""',
  position: 'absolute',
  // 48px면 긴 변에서도 꼬리를 읽을 수 있고 짧은 변 전체를 각도 부채꼴처럼 덮지 않는다.
  width: themeContract.spacing[12],
  // 경로가 띠 바깥 가장자리라 높이의 안쪽 절반이 테두리 두께를 덮어야 한다.
  height: `calc(${borderW} * 2)`,
  // 크로미엄에서 부모의 상속 반경을 따르므로 rounded 변형마다 경로를 복제할 필요가 없다.
  offsetPath: 'border-box',
  offsetDistance: '0%',
  offsetRotate: 'auto',
  backgroundImage: `linear-gradient(to right, transparent, ${glowColor})`,
  // 1500ms로는 느린 구간을 읽기 어려워 두 배로 늘리고 토큰 값은 유지한다.
  // 키프레임 안의 토큰 var 선언은 크로미엄이 버리므로 숏핸드에 두면 두 반바퀴 구간에 각각 drift가 적용된다.
  animation: `${travel} calc(${themeContract.animation.loop.base} * 2) ${themeContract.animation.easing.drift} infinite`,
  willChange: 'offset-distance',
});
