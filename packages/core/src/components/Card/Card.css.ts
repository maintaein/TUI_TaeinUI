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

export const variantStyles = styleVariants({
  outlined: {
    border: `1px solid ${themeContract.color.border.default}`,
    boxShadow: 'none',
  },
  elevated: {
    // 토큰에 같은 값이 없어 둔다(shadows.css.ts에 0 2px 8px가 없다).
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    border: 'none',
  },
  filled: {
    backgroundColor: themeContract.color.surface.hover,
    border: 'none',
    boxShadow: 'none',
  },
});

export const clickable = style({
  cursor: 'pointer',
  touchAction: 'manipulation',

  ':focus-visible': {
    ...focusRing(),
  },
});

// 선택 기능(hoverLift). 클릭 가능한 카드도 기본으로는 떠오르지 않는다.
// 그림자 두 값(0 4px 12px / 0 2px 8px)도 토큰에 같은 값이 없어 둔다.
export const hoverLift = style({
  // 눌림이 translateY(-3px)에서 0 scale(0.98)로 움직이므로 첫 페인트부터 합성
  // 레이어를 둔다. hoverLift인 카드에만 건다(카드는 크다).
  willChange: 'transform',

  '@media': {
    // 터치는 탭하면 호버가 발생해 떠오른 채 들러붙는다. 마우스에서만 켠다.
    '(hover: hover) and (pointer: fine)': {
      selectors: {
        // 타이밍 함수는 얹지 않는다(리뷰 C3). 포인터를 떼도 :hover는 계속
        // 매치되므로 여기 롱핸드를 두면 cardRoot의 속성별 목록이 값 하나로
        // 무너져 transform의 snap 해제 오버슛이 영영 안 보인다.
        // :not([data-pressed])를 단다. vanilla-extract가 @media를 selectors 뒤에
        // 내보내 특정도가 같은 호버가 누름 transform을 덮기 때문이다(Button과 같다).
        '&:hover:not([data-pressed])': {
          transform: 'translateY(-3px)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          transitionDuration: themeContract.animation.duration.base,
        },
      },
    },

    // 축소 모드는 "이동 없음"이다. 호버 떠오름도 이동이라 끈다(안 끄면 떠오른
    // 채 누를 때 3px이 순간 이동한다). 그림자 변화는 둔다. 호버 규칙과 특정도가
    // 같고 이 미디어가 뒤에 나와 이긴다.
    '(prefers-reduced-motion: reduce)': {
      willChange: 'auto',
      selectors: {
        '&:hover:not([data-pressed])': {
          transform: 'none',
        },
        '&[data-pressed]': {
          transform: 'none',
        },
      },
    },
  },

  selectors: {
    // 누름 상태. :active는 pointerup에 끝나 80ms 클릭이면 150ms 전이가 거의
    // 진행되지 않는다. Card.tsx가 data-pressed를 걸고 최소 체류(90ms) 뒤에 지운다.
    // 떠오른 3px을 다 반납하고 2% 줄어든다. 들어갈 때만 fast+settle로 단단하게
    // 덮고, 속성이 떨어지면 cardRoot 전이의 base가 돌아와 해제 때 되밀린다.
    // 리터럴 근거: 누름 scale은 토큰 스케일이 없다. 카드는 크다. 300px 카드에서
    // 6px 줄고, 버튼의 0.95를 쓰면 15px이라 과하다. emil-design-eng 권장
    // 0.95~0.98의 얕은 끝이다.
    '&[data-pressed]': {
      transform: 'translateY(0) scale(0.98)',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      transitionDuration: themeContract.animation.duration.fast,
      transitionTimingFunction: themeContract.animation.easing.settle,
    },
  },
});

export const disabled = style({
  opacity: 0.5,
  cursor: 'not-allowed',
  pointerEvents: 'none',
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
