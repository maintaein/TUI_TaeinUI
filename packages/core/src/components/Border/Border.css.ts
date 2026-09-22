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
  // 없었다 — 실측 정정, 승인됨).
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
  // 중성 회색이고 회색 테두리에 회색 빛은 보이지 않는다 — 가장 많이 쓰이는
  // 변형에서 효과가 통째로 사라진다. 빛이 하는 말은 「여기가 지금 살아
  // 있다」이고 그건 강조색이어야 성립한다. 「default도 따라가게 해야 하는 것
  // 아닌가」는 반드시 다시 올라온다 — 이 주석이 답이다.
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

// 빛이 경계선을 따라 한 바퀴 돈다(장식계, 명제 §3). 자율 루프라 되돌아갈
// 상태가 없고 조항 1 밖이다(공통 제약 §2) — @keyframes가 맞는 도구다.
// Vanilla Extract에 @property API가 없어 커스텀 프로퍼티 회전은 못 쓴다 —
// 대신 conic-gradient를 깐 요소를 transform: rotate()로 돌린다.
const rotate = keyframes({
  '0%': { transform: 'rotate(0deg)' },
  '100%': { transform: 'rotate(360deg)' },
});

// 링 자체는 돌지 않는다 — 안쪽 그라디언트만 돈다. 요소를 돌리면 마스크도
// 같이 돌아 사각 링이 박스 밖으로 튀어나간다(리뷰 C2). pseudo-element는 자기
// 자식 pseudo-element를 가질 수 없어서, 회전하는 그라디언트를 가둘 그릇으로
// 실제 DOM 노드 하나가 필요하다 — Border.tsx가 sides='all'일 때만 장식용
// span을 넣는다(닫힌 테두리라야 "한 바퀴"가 성립한다).
export const glowRing = style({
  position: 'absolute',
  inset: 0,
  // borderW(테두리 두께 var)를 padding으로 써서 content-box와 border-box
  // 차이만큼만 mask로 남긴다 — width 변형(thin/medium/thick)을 그대로
  // 따라간다.
  padding: borderW,
  borderRadius: 'inherit',
  pointerEvents: 'none',
  overflow: 'hidden',
  opacity: 0,
  // mask는 반드시 숏핸드다. <geometry-box>(content-box)는 숏핸드에만 올 수
  // 있어서, 롱핸드 mask-image에 넣으면 문법 위반으로 선언이 통째로 버려진다
  // (계산값 mask-image: none — 리뷰 C1, 크로미엄 실측). 그러면 링이 아니라
  // 꽉 찬 사각형이 되어 빛이 감싼 콘텐츠를 덮는다.
  mask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
  WebkitMask:
    'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
  maskComposite: 'exclude',
  // 표준 exclude에 대응하는 레거시 WebKit 값은 xor다. 값이 그대로가 아니라
  // 이름이 다르다 — exclude로 "통일"하면 WebKit 쪽이 무시돼 사각형이 된다.
  WebkitMaskComposite: 'xor',
  transition: `opacity ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}`,
});

// 회전하는 그라디언트는 링의 자식이다. 링의 overflow: hidden이 밖으로 못
// 나가게 가두므로, 이 자식이 아무리 커도 빛이 콘텐츠를 덮을 수 없다.
globalStyle(`${glowRing}::before`, {
  content: '""',
  position: 'absolute',
  // ponytail: inset -100%(3W×3H)면 카드형 비율에서 테두리를 다 덮는다. 15:1
  // 같은 극단 비율에서는 먼 끝의 빛이 잘린다 — 새어 나가는 게 아니라 안 보일
  // 뿐이라 가독성 비용은 0이다. 정확한 대각선 크기는 측정이 필요해 M3(GSAP)로
  // 넘긴다.
  inset: '-100%',
  backgroundImage: `conic-gradient(from 0deg, transparent 0deg, transparent 270deg, ${glowColor} 330deg, transparent 360deg)`,
  animation: `${rotate} ${themeContract.animation.loop.base} ${themeContract.animation.easing.linear} infinite`,
});

// 트리거는 루트의 :hover·:focus-within이다(Border에는 상태 prop이 없다 —
// 감싼 콘텐츠에 초점 가능한 요소가 없으면 :hover만 남는다, 장식이라 손실
// 없음).
globalStyle(`${border}:hover ${glowRing}, ${border}:focus-within ${glowRing}`, {
  opacity: 1,
});

// will-change는 트리거 상태에서만 붙는다. 링이 이제 항상 존재하므로(예전엔
// ::before가 :hover 선택자 안에서만 정의돼 비활성 시 통째로 사라졌다) 상주
// will-change를 되살리지 않도록 이 규칙에만 둔다 — HeaderBar의 상주
// will-change 반례를 피한다.
globalStyle(
  `${border}:hover ${glowRing}::before, ${border}:focus-within ${glowRing}::before`,
  {
    willChange: 'transform',
  }
);
