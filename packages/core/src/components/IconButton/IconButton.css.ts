import { style, styleVariants, globalStyle } from '@vanilla-extract/css';
import { recipe } from '@vanilla-extract/recipes';
import { themeContract } from '../../tokens/theme.css';
import { focusRing } from '../../tokens/focusRing.css';

export const iconButton = recipe({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: themeContract.font.family.sans,
    border: 'none',
    cursor: 'pointer',
    touchAction: 'manipulation',
    transition: `background-color ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}, opacity ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}, transform ${themeContract.animation.duration.base} ${themeContract.animation.easing.snap}`,
    userSelect: 'none',
    position: 'relative',
    overflow: 'hidden',
    flexShrink: 0,

    ':disabled': {
      cursor: 'not-allowed',
      opacity: 0.5,
    },

    selectors: {
      // 새 hover(리뷰 F4) — 변형 8곳이 배경색(+색)만 바꿔 색 단독 채널이었다
      // (article 4 위반). 이동을 더해 색과 위치가 함께 바뀌게 한다. 변형별
      // 8개 compoundVariants는 열지 않고 이 한 줄로 전부 덮는다.
      // 타이밍 함수는 얹지 않는다(리뷰 C3) — 자세한 이유는 Button.css.ts의
      // 같은 자리 주석. 요약: 포인터를 떼도 :hover는 계속 매치되고, 여기
      // 롱핸드가 있으면 속성별 목록이 값 하나로 무너져 해제 오버슛이 죽는다.
      '&:hover:not(:disabled)': {
        transform: 'translateY(-1px)',
        transitionDuration: themeContract.animation.duration.fast,
      },
      // 배치 전체 ":active 해제 오버슛" 형태(T3a 공통) — 누를 때 exit로 가속해
      // 들어가고, 떼면 위 base의 snap으로 브라우저가 오버슛해 돌아온다(:hover가
      // 타이밍 함수를 쏘지 않으므로 실제로 그렇게 된다 — 리뷰 C3). 변형
      // 8곳의 :active 블록은 값이 이미 맞아 건드리지 않는다 — 이 한 줄이 전부 덮는다.
      '&:active:not(:disabled)': {
        transitionTimingFunction: themeContract.animation.easing.exit,
      },
    },

    ':focus-visible': {
      ...focusRing(),
    },
  },

  variants: {
    size: {
      sm: {
        width: '44px',
        height: '44px',
        borderRadius: themeContract.borderRadius.base,
      },
      md: {
        width: '44px',
        height: '44px',
        borderRadius: themeContract.borderRadius.md,
      },
      lg: {
        width: '52px',
        height: '52px',
        borderRadius: themeContract.borderRadius.md,
      },
      xl: {
        width: '60px',
        height: '60px',
        borderRadius: themeContract.borderRadius.lg,
      },
    },

    buttonStyle: {
      fill: {},
      weak: {},
    },

    variant: {
      primary: {},
      dark: {},
      danger: {},
      light: {},
    },
  },

  compoundVariants: [
    {
      variants: { buttonStyle: 'fill', variant: 'primary' },
      style: {
        // primary[600]은 흰 배경 대비 3.68:1로 Button의 동일 조합(4.60)보다
        // 낮다. 세 상태를 한 단계씩 올려 4.60/5.74/8.63으로 맞춘다.
        backgroundColor: themeContract.color.primary.main,
        color: themeContract.color.primary.contrast,
        selectors: {
          '&:hover:not(:disabled)': {
            backgroundColor: themeContract.palette.primary[800],
          },
          '&:active:not(:disabled)': {
            backgroundColor: themeContract.palette.primary[900],
            transform: 'scale(0.95)',
          },
        },
      },
    },
    {
      variants: { buttonStyle: 'fill', variant: 'dark' },
      style: {
        backgroundColor: themeContract.palette.gray[700],
        color: themeContract.color.text.inverse,
        selectors: {
          '&:hover:not(:disabled)': {
            backgroundColor: themeContract.palette.gray[800],
          },
          '&:active:not(:disabled)': {
            backgroundColor: themeContract.palette.gray[900],
            transform: 'scale(0.95)',
          },
        },
      },
    },
    {
      variants: { buttonStyle: 'fill', variant: 'danger' },
      style: {
        backgroundColor: themeContract.palette.error[500],
        color: themeContract.color.error.contrast,
        selectors: {
          '&:hover:not(:disabled)': {
            backgroundColor: themeContract.palette.error[700],
          },
          '&:active:not(:disabled)': { opacity: 0.9, transform: 'scale(0.95)' },
        },
      },
    },
    {
      variants: { buttonStyle: 'fill', variant: 'light' },
      style: {
        backgroundColor: themeContract.color.background.default,
        color: themeContract.palette.primary[600],
        border: `2px solid ${themeContract.palette.primary[600]}`,
        selectors: {
          '&:hover:not(:disabled)': {
            backgroundColor: themeContract.palette.primary[50],
          },
          '&:active:not(:disabled)': {
            backgroundColor: themeContract.palette.primary[100],
            transform: 'scale(0.95)',
          },
        },
      },
    },
    {
      variants: { buttonStyle: 'weak', variant: 'primary' },
      style: {
        backgroundColor: themeContract.palette.primary[50],
        color: themeContract.palette.primary[700],
        selectors: {
          '&:hover:not(:disabled)': {
            backgroundColor: themeContract.palette.primary[100],
          },
          '&:active:not(:disabled)': {
            backgroundColor: themeContract.palette.primary[200],
            transform: 'scale(0.95)',
          },
        },
      },
    },
    {
      variants: { buttonStyle: 'weak', variant: 'dark' },
      style: {
        backgroundColor: themeContract.palette.gray[200],
        color: themeContract.palette.gray[800],
        selectors: {
          '&:hover:not(:disabled)': {
            backgroundColor: themeContract.palette.gray[300],
          },
          '&:active:not(:disabled)': {
            backgroundColor: themeContract.palette.gray[400],
            transform: 'scale(0.95)',
          },
        },
      },
    },
    {
      variants: { buttonStyle: 'weak', variant: 'danger' },
      style: {
        backgroundColor: themeContract.palette.error[50],
        color: themeContract.palette.error[700],
        selectors: {
          '&:hover:not(:disabled)': {
            backgroundColor: themeContract.palette.error[100],
          },
          '&:active:not(:disabled)': {
            backgroundColor: themeContract.palette.error[100],
            transform: 'scale(0.95)',
          },
        },
      },
    },
    {
      variants: { buttonStyle: 'weak', variant: 'light' },
      style: {
        backgroundColor: themeContract.palette.primary[100],
        color: themeContract.palette.primary[700],
        selectors: {
          '&:hover:not(:disabled)': {
            backgroundColor: themeContract.palette.primary[200],
          },
          '&:active:not(:disabled)': {
            backgroundColor: themeContract.palette.primary[300],
            transform: 'scale(0.95)',
          },
        },
      },
    },
  ],

  defaultVariants: {
    size: 'md',
    buttonStyle: 'fill',
    variant: 'primary',
  },
});

export const iconSizeVariants = styleVariants({
  sm: { fontSize: '1.125rem', lineHeight: 1 },
  md: { fontSize: '1.375rem', lineHeight: 1 },
  lg: { fontSize: '1.625rem', lineHeight: 1 },
  xl: { fontSize: '1.875rem', lineHeight: 1 },
});

export const ghostBase = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: themeContract.font.family.sans,
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  touchAction: 'manipulation',
  transition: `background-color ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}, color ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}, opacity ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}, transform ${themeContract.animation.duration.base} ${themeContract.animation.easing.snap}`,
  userSelect: 'none',
  borderRadius: themeContract.borderRadius.base,
  color: themeContract.palette.gray[600],
  flexShrink: 0,
  minWidth: '44px',
  minHeight: '44px',

  selectors: {
    // 색 단독 채널이었다(article 4 위반) — 이동을 더한다(리뷰 F4).
    '&:hover:not(:disabled)': {
      color: themeContract.palette.gray[900],
      backgroundColor: themeContract.palette.gray[100],
      transform: 'translateY(-1px)',
      // 타이밍 함수는 얹지 않는다(리뷰 C3, 위 iconButton base와 같은 이유).
      transitionDuration: themeContract.animation.duration.fast,
    },
    // 배치 전체 ":active 해제 오버슛" 형태(T3a 공통, 위 iconButton base와 동일).
    '&:active:not(:disabled)': {
      color: themeContract.palette.gray[900],
      backgroundColor: themeContract.palette.gray[200],
      transform: 'scale(0.92)',
      transitionTimingFunction: themeContract.animation.easing.exit,
    },
  },

  ':disabled': {
    cursor: 'not-allowed',
    opacity: 0.4,
  },

  ':focus-visible': {
    ...focusRing(),
  },
});

export const ghostSizeVariants = styleVariants({
  sm: { padding: '0.25rem' },
  md: { padding: '0.375rem' },
  lg: { padding: '0.5rem' },
  xl: { padding: '0.625rem' },
});

// 아이콘 스팬 전용 모션 — 몸통(iconButton/ghostBase)의 :active 전이보다 40ms
// 늦게 눌림에 들어가, 몸통이 먼저 반응하고 아이콘이 뒤따르는 느낌을 만든다.
// contract.ts에는 이 지연 전용 stagger 토큰이 없다(소비자가 여기 하나뿐이라
// 토큰화 근거가 부족하다는 T2 판단) — 리터럴 40ms를 쓰고
// animationBoundary.test.ts의 LITERAL_DELAY_EXCEPTIONS에 등록한다.
export const iconMotion = style({
  transform: 'scale(1)',
  transition: `transform ${themeContract.animation.duration.base} ${themeContract.animation.easing.snap} 40ms`,
});

// 몸통이 눌리는 동안(:active) 아이콘 스팬도 함께 축소시키되, 위 iconMotion의
// 40ms 지연은 건드리지 않는다(transitionDelay를 여기서 다시 선언하지 않음 —
// 캐스케이드는 속성 단위로 적용되어 지연값은 iconMotion 기본 규칙이 그대로
// 담당한다). List.css.ts의 globalStyle(두 독립 클래스 결합) 관례를 따른다.
// 아이콘 자신의 scale은 몸통(base 0.95, danger 0.9~0.95대, ghost 0.92)의
// scale과 곱해져 합성된다(리뷰 F5) — 예전 0.94는 0.95*0.94≈0.893,
// ghost는 0.92*0.94≈0.865로 이 배치에서 가장 깊게 눌리는 조합이 됐다.
// "본체 변형은 작게, 지연이 질량을 말한다"를 뒤집는다. 0.99로 낮춰 합성
// 결과가 대부분 0.94대에 오도록 한다.
globalStyle(
  `${iconButton.classNames.base}:active:not(:disabled) ${iconMotion}, ${ghostBase}:active:not(:disabled) ${iconMotion}`,
  {
    transform: 'scale(0.99)',
    transitionDuration: themeContract.animation.duration.fast,
    transitionTimingFunction: themeContract.animation.easing.exit,
  }
);

// Loader는 바깥에 블록 div를 하나 두므로 flex 아이템으로 만들어 줄 상자(baseline)
// 정렬을 없앤다. 그대로 두면 점·스피너가 글자 baseline으로 내려앉는다.
export const loadingSlot = style({
  display: 'flex',
});
