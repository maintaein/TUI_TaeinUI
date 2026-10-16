import { style, styleVariants } from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';
import { focusRing } from '../../tokens/focusRing.css';

// 아코디언 아이템 컨테이너
export const boardRow = style({
  width: '100%',
  borderRadius: themeContract.borderRadius.md,
  overflow: 'hidden',
  boxSizing: 'border-box',
});

export const variantStyles = styleVariants({
  default: {
    backgroundColor: 'transparent',
  },
  outlined: {
    border: `1px solid ${themeContract.color.border.default}`,
  },
  filled: {
    backgroundColor: themeContract.color.background.paper,
  },
});

// 헤더 버튼
export const header = style({
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: themeContract.spacing[3],
  padding: themeContract.spacing[4],
  border: 'none',
  backgroundColor: 'transparent',
  fontSize: themeContract.font.size.base,
  fontWeight: themeContract.font.weight.medium,
  color: themeContract.color.text.primary,
  textAlign: 'left',
  cursor: 'pointer',
  touchAction: 'manipulation',
  // transform을 목록에 더한다(리뷰 F3). :active가 배경색 단독 채널이라
  // article 4 위반이었다. 다른 컴포넌트(Button·Card·Chip·IconButton)와 같은
  // 배치 관례로 snap을 얹어 release 오버슛도 같이 받는다.
  transition: `background-color ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}, transform ${themeContract.animation.duration.base} ${themeContract.animation.easing.snap}`,

  // :not(:disabled)로 막는다(리뷰 F1). 배치 공통 제약 「disabled에는 전이를
  // 주지 않는다」다. 아래 :disabled 블록이 backgroundColor는 되돌리지만,
  // 가드가 없으면 :hover의 전이 자체는 비활성 헤더에도 그대로 걸린다.
  // Button·IconButton은 같은 가드를, Card는 pointerEvents: none을 쓴다.
  selectors: {
    // 타이밍 함수는 얹지 않는다(리뷰 C3). 포인터를 떼도 :hover는 계속
    // 매치되므로 여기 롱핸드를 두면 위 목록이 값 하나로 무너져 transform의
    // snap 해제 오버슛이 포인터 사용자에게 영영 안 보인다.
    '&:hover:not(:disabled)': {
      backgroundColor: themeContract.color.background.paper,
      transitionDuration: themeContract.animation.duration.fast,
    },

    // 배경색과 함께 스케일도 같이 바뀐다(article 4: 색 단독 채널 금지).
    // 1px 이동은 행 전체 폭에서 부담이 커 Button/Card 수준 이동 대신 미세한
    // scale(0.995)만 쓴다.
    '&:active:not(:disabled)': {
      backgroundColor: themeContract.color.surface.active,
      transform: 'scale(0.995)',
      transitionDuration: themeContract.animation.duration.fast,
      transitionTimingFunction: themeContract.animation.easing.exit,
    },
  },

  ':focus-visible': {
    ...focusRing(),
    outlineOffset: '-2px',
  },

  ':disabled': {
    cursor: 'not-allowed',
    opacity: 0.6,
    backgroundColor: 'transparent',
  },
});

export const title = style({
  flex: 1,
});

export const iconContainer = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '24px',
  height: '24px',
  flexShrink: 0,
  // 펼침·접힘의 넘침과 같은 결로 snap을 건다. 198°까지 갔다 180°에 앉고
  // 접을 때는 -18°까지 갔다 0°에 앉는다. 오버슈트 이징은 transform에만 건다.
  transition: `transform ${themeContract.animation.duration.base} ${themeContract.animation.easing.snap}`,
});

export const iconExpanded = style({
  transform: 'rotate(180deg)',
});

// 높이는 GSAP이 인라인 `height`로 움직인다(BoardRow.tsx). 예전의
// `grid-template-rows: 0fr → 1fr` 전이는 1fr을 넘는 값이 내용 높이에서 잘려
// 넘침(bouncy)이 원리적으로 불가능했다(실측: 내용 120px에서 1.1fr·2fr 모두
// 120px). 높이는 레이아웃 속성이지만 grid 전이도 같은 등급이었고, 높이를 미리
// 알 수 없는 아코디언은 이 예외만 허용된다.
// 넘친 12px가 잘리지 않고 아래 행을 밀려면 넘침이 래퍼 안에서 일어나야 하므로
// 래퍼가 `overflow: hidden`으로 내용을 자른다.
export const contentWrapper = style({
  overflow: 'hidden',
});

// 내용 상자. 래퍼가 높이를 줄여도 이 상자는 자연 높이를 유지하고, GSAP이 그
// `scrollHeight`를 재서 펼칠 목표 높이로 쓴다. 접힌 동안에는 `inert`가 붙는다.
export const content = style({
  overflow: 'hidden',
});

// 내부 콘텐츠 패딩
export const contentInner = style({
  padding: `0 ${themeContract.spacing[4]} ${themeContract.spacing[4]}`,
  color: themeContract.color.text.secondary,
  fontSize: themeContract.font.size.sm,
  lineHeight: themeContract.font.lineHeight.relaxed,
});
