import { style } from '@vanilla-extract/css';
import { recipe } from '@vanilla-extract/recipes';
import { themeContract } from '../../tokens/theme.css';
import { focusRing } from '../../tokens/focusRing.css';

export const button = recipe({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: themeContract.spacing[2],
    fontFamily: themeContract.font.family.sans,
    fontWeight: themeContract.font.weight.semibold,
    border: 'none',
    cursor: 'pointer',
    touchAction: 'manipulation',
    transition: `background-color ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}, box-shadow ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}, filter ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}, opacity ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}, transform ${themeContract.animation.duration.base} ${themeContract.animation.easing.snap}`,
    userSelect: 'none',
    textDecoration: 'none',
    position: 'relative',
    overflow: 'hidden',

    ':disabled': {
      cursor: 'not-allowed',
      opacity: 0.5,
    },

    selectors: {
      // 새 hover — 기존엔 배경색만 바뀌어 색 단독 채널이었다(조항 4 위반).
      // 이동을 더해 색과 위치가 함께 바뀌게 한다.
      '&:hover:not(:disabled)': {
        transform: 'translateY(-1px)',
        transitionDuration: themeContract.animation.duration.fast,
        transitionTimingFunction: themeContract.animation.easing.settle,
      },

      // 배치 전체 ":active 해제 오버슛" 형태(T3a 공통) — 누를 때 exit로 가속해
      // 들어가고, 떼면 위 base의 snap으로 브라우저가 오버슛해 돌아온다. 변형
      // 10곳의 :active 블록은 값이 이미 맞아 건드리지 않는다 — 이 한 줄이 전부 덮는다.
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
        height: '44px',
        minWidth: '70px',
        padding: `0 ${themeContract.spacing[4]}`,
        fontSize: themeContract.font.size.sm,
        borderRadius: themeContract.borderRadius.sm,
      },
      md: {
        height: '44px',
        minWidth: '100px',
        padding: `0 ${themeContract.spacing[5]}`,
        fontSize: themeContract.font.size.base,
        borderRadius: themeContract.borderRadius.base,
      },
      lg: {
        height: '52px',
        minWidth: '120px',
        padding: `0 ${themeContract.spacing[6]}`,
        fontSize: themeContract.font.size.lg,
        borderRadius: themeContract.borderRadius.base,
      },
      xl: {
        height: '60px',
        minWidth: '140px',
        padding: `0 ${themeContract.spacing[8]}`,
        fontSize: themeContract.font.size.xl,
        borderRadius: themeContract.borderRadius.md,
      },
    },

    // buttonStyle과 variant는 여기서는 빈 키만 선언한다.
    // 실제 색상 값은 두 축이 만나는 지점(compoundVariants)에서만 정해진다.
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
        backgroundColor: themeContract.color.primary.main,
        color: themeContract.color.primary.contrast,
        selectors: {
          '&:hover:not(:disabled)': {
            backgroundColor: themeContract.palette.primary[800],
          },
          '&:active:not(:disabled)': {
            backgroundColor: themeContract.palette.primary[900],
            transform: 'scale(0.98)',
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
            transform: 'scale(0.98)',
          },
        },
      },
    },
    {
      variants: { buttonStyle: 'fill', variant: 'danger' },
      style: {
        backgroundColor: themeContract.color.error.main,
        color: themeContract.color.error.contrast,
        selectors: {
          '&:hover:not(:disabled)': {
            backgroundColor: themeContract.palette.error[800],
          },
          '&:active:not(:disabled)': { opacity: 0.9, transform: 'scale(0.98)' },
        },
      },
    },
    {
      variants: { buttonStyle: 'fill', variant: 'light' },
      style: {
        backgroundColor: themeContract.color.background.default,
        color: themeContract.color.primary.main,
        border: `2px solid ${themeContract.color.primary.main}`,
        selectors: {
          '&:hover:not(:disabled)': {
            backgroundColor: themeContract.palette.primary[50],
          },
          '&:active:not(:disabled)': {
            backgroundColor: themeContract.palette.primary[100],
            transform: 'scale(0.98)',
          },
        },
      },
    },
    {
      variants: { buttonStyle: 'weak', variant: 'primary' },
      style: {
        backgroundColor: themeContract.palette.primary[50],
        // primary[800]은 hover(4.09)·active(3.28)에서 AA(4.5:1)를 깬다.
        // 배경은 그대로 두고 글자를 한 단계 더 어둡게 한다.
        color: themeContract.palette.primary[900],
        selectors: {
          '&:hover:not(:disabled)': {
            backgroundColor: themeContract.palette.primary[100],
          },
          '&:active:not(:disabled)': {
            backgroundColor: themeContract.palette.primary[200],
            transform: 'scale(0.98)',
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
            transform: 'scale(0.98)',
          },
        },
      },
    },
    {
      variants: { buttonStyle: 'weak', variant: 'danger' },
      style: {
        backgroundColor: themeContract.palette.error[50],
        // error[800]은 hover·active(3.99)에서 AA(4.5:1)를 깬다. error에는
        // error[100]보다 어두운 배경 단계가 없어(200 없음) 글자를 어둡게 한다.
        color: themeContract.palette.error[900],
        selectors: {
          '&:hover:not(:disabled)': {
            backgroundColor: themeContract.palette.error[100],
          },
          '&:active:not(:disabled)': {
            // hover와 배경이 같아 색으로는 상태를 구분할 수 없다. 실제로
            // 상태를 가르는 건 아래의 scale(0.98)이고, shadow.inner(6% 알파)는
            // error[100] 위에서 거의 안 보이는 보조 신호다.
            backgroundColor: themeContract.palette.error[100],
            boxShadow: themeContract.shadow.inner,
            transform: 'scale(0.98)',
          },
        },
      },
    },
    {
      variants: { buttonStyle: 'weak', variant: 'light' },
      style: {
        backgroundColor: themeContract.palette.primary[100],
        // primary[900]은 active(3.90)에서 AA(4.5:1)를 깬다. text.primary로
        // 바꾸면 rest/hover/active 전부 여유 있게 통과한다.
        color: themeContract.color.text.primary,
        selectors: {
          '&:hover:not(:disabled)': {
            backgroundColor: themeContract.palette.primary[200],
          },
          '&:active:not(:disabled)': {
            backgroundColor: themeContract.palette.primary[300],
            transform: 'scale(0.98)',
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

// customColor prop 전용 — variant 조합 시스템 밖의 예외 경로이므로 recipe에 넣지 않는다.
export const customVariant = style({
  backgroundColor: 'var(--btn-bg)',
  color: 'var(--btn-color)',

  selectors: {
    '&:hover:not(:disabled)': {
      backgroundColor: 'var(--btn-hover-bg, var(--btn-bg))',
      filter: 'var(--btn-hover-filter, none)',
    },
    '&:active:not(:disabled)': {
      backgroundColor: 'var(--btn-active-bg, var(--btn-bg))',
      filter: 'var(--btn-active-filter, none)',
      transform: 'scale(0.98)',
    },
  },
});

export const customOutlineVariant = style({
  backgroundColor: themeContract.color.background.default,
  color: 'var(--btn-color)',
  border: '2px solid var(--btn-color)',

  selectors: {
    // T6b: 하드코딩 rgba 대신 기존 surface.hover/active 토큰을 var() 기본값으로
    // 쓴다(Modal·NumericSpinner와 같은 관례). --btn-hover-bg 자체는 유지된다.
    '&:hover:not(:disabled)': {
      backgroundColor: `var(--btn-hover-bg, ${themeContract.color.surface.hover})`,
    },
    '&:active:not(:disabled)': {
      backgroundColor: `var(--btn-active-bg, ${themeContract.color.surface.active})`,
      transform: 'scale(0.98)',
    },
  },
});

export const fullWidth = style({
  width: '100%',
});
