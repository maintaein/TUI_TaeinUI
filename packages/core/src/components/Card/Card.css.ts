import { style, styleVariants } from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';
import { focusRing } from '../../tokens/focusRing.css';

export const cardRoot = style({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: themeContract.color.background.paper,
  borderRadius: themeContract.borderRadius.lg,
  overflow: 'hidden',
  transition: `transform ${themeContract.animation.duration.base} ${themeContract.animation.easing.snap}, box-shadow ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}, opacity ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}`,
  border: 'none',
  textAlign: 'left',
  width: '100%',
});

// clickable과 variantStyles.interactive가 같은 hover/active 모션을 공유한다
// (단일 출처 — 값이 두 곳에 따로 있으면 결판이 시트 순서에 맡겨진다는 게
// T3의 문제였다). 포커스 링은 여기 넣지 않고 clickable에만 남긴다 —
// interactive는 onClick 없이도 쓰이는데(CardPage.tsx의 라이브 데모 3곳이
// 실제로 그렇다 — LivePreview가 code prop을 그대로 렌더한다), role·tabIndex
// 없는 요소에 링만 붙이면 받을 수 없는 포커스를 그리게 된다. 커서는 반대로
// interactive에도 준다 — :active 누름까지 붙은 순간 그건 「강조」가 아니라
// 버튼이라고 말하는 것이고, 포인터에게 그 말을 받을 신호가 없으면 반응만
// 하고 어포던스가 없는 카드가 된다(리뷰 I3). Card에 진짜 상호작용
// API(role·tabIndex·포커스 링)를 주는 건 M3 몫이다.
const hoverActiveMotion = {
  // 타이밍 함수는 얹지 않는다(리뷰 C3). 포인터를 떼도 :hover는 계속
  // 매치되므로 여기 롱핸드를 두면 cardRoot의 속성별 목록이 값 하나로
  // 무너져 transform의 snap 해제 오버슛이 포인터 사용자에게 영영 안 보인다.
  ':hover': {
    transform: 'translateY(-3px)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    transitionDuration: themeContract.animation.duration.base,
  },

  // "끝까지 안 들어가고 버틴다" — scale(0.99)로 얕게, translateY는 hover
  // 값(-3px)의 일부만 반납한다(-1px).
  ':active': {
    transform: 'scale(0.99) translateY(-1px)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    transitionDuration: themeContract.animation.duration.fast,
    transitionTimingFunction: themeContract.animation.easing.exit,
  },
};

export const variantStyles = styleVariants({
  outlined: {
    border: `1px solid ${themeContract.color.border.default}`,
    boxShadow: 'none',
  },
  elevated: {
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    border: 'none',
  },
  filled: {
    backgroundColor: themeContract.color.surface.hover,
    border: 'none',
    boxShadow: 'none',
  },
  interactive: {
    border: `2px solid ${themeContract.color.border.default}`,
    boxShadow: 'none',
    cursor: 'pointer',
    // 아래 한 줄은 커서와 한 몸이다 — touchAction.test.ts가 파일 단위로
    // 커서와 touch-action의 개수를 대조한다. 탭 대상처럼 보이는 자리에서
    // 300ms 더블탭 줌 대기를 없애라는 뜻이고, clickable이 이미 같은 짝을 쓴다.
    touchAction: 'manipulation',
    ...hoverActiveMotion,
  },
});

export const clickable = style({
  cursor: 'pointer',
  touchAction: 'manipulation',

  ...hoverActiveMotion,

  ':focus-visible': {
    ...focusRing(),
  },
});

export const disabled = style({
  opacity: 0.5,
  cursor: 'not-allowed',
  pointerEvents: 'none',

  ':hover': {
    transform: 'none',
    boxShadow: 'none',
  },
});

export const cardImageWrapper = style({
  position: 'relative',
  width: '100%',
  aspectRatio: '16 / 9',
  overflow: 'hidden',
  flexShrink: 0,
});

export const cardImage = style({
  width: '100%',
  height: '100%',
  display: 'block',
  objectFit: 'cover',
});

export const cardImageOverlay = style({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: themeContract.color.overlay.scrim,
  color: themeContract.color.text.inverse,
});

export const cardHeader = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: themeContract.spacing[4],
  borderBottom: `1px solid ${themeContract.color.border.default}`,
  gap: themeContract.spacing[2],
});

export const cardTitle = style({
  margin: 0,
  fontSize: themeContract.font.size.lg,
  fontWeight: themeContract.font.weight.semibold,
  color: themeContract.color.text.primary,
  lineHeight: themeContract.font.lineHeight.tight,
});

export const cardBody = style({
  flex: 1,
});

export const paddingStyles = styleVariants({
  none: {
    padding: 0,
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

export const cardFooter = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: themeContract.spacing[4],
  borderTop: `1px solid ${themeContract.color.border.default}`,
  gap: themeContract.spacing[2],
});
