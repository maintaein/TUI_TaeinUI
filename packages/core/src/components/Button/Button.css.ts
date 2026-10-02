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
    transition: `background-color ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}, box-shadow ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}, filter ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}, opacity ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}, transform ${themeContract.animation.duration.base} ${themeContract.animation.easing.spring}`,
    userSelect: 'none',
    textDecoration: 'none',
    position: 'relative',
    overflow: 'hidden',
    // 합성 레이어를 첫 페인트에 만들어 두고 이후 바꾸지 않는다. will-change를 호버나
    // 포커스에 걸면 레이어가 생기는 순간 글자가 그레이스케일 안티앨리어싱과 정수
    // 픽셀 반올림으로 움직이고, 레이어 없이 두면 누름 전이 끝에 강등되며 글자가
    // 튄다. 수명을 상호작용과 분리하려고 base에 둔다.
    // 대가: 버튼마다 레이어가 하나 상주한다(버튼 크기라 작다). 전이 중 글자가
    // 비트맵 스케일로 약간 무를 수 있으나 움직이는 중이라 정지 상태의 튐보다
    // 덜 거슬린다.
    backfaceVisibility: 'hidden',

    ':disabled': {
      cursor: 'not-allowed',
      opacity: 0.5,
    },

    selectors: {
      // 누름 상태. :active는 pointerup에 끝나서 30ms 탭이면 30ms만 보인다.
      // Button.tsx가 data-pressed를 걸고 최소 체류(90ms) 뒤에 지우므로 짧은
      // 클릭도 효과가 끝까지 나온다. 색·그림자·scale이 이 속성 하나를 같이 따른다.
      // 들어갈 때만 settle로 덮는다. 누른 순간 등록돼야 해서 ease-in(exit)은 쓰지
      // 않는다. 누르는 동작은 흔들리지 않게 짧고 단단하게(fast+settle) 간다.
      // 속성이 떨어지면 base 숏핸드의 spring(200ms)이 돌아와 해제 때 되밀린다.
      // 들어갈 때가 150ms, 나올 때가 200ms다. 단순 복귀가 아니라 되밀림과 정착이라는
      // 2상 물리라 흔들림에 시간이 필요하다(모션 명제가 일반론보다 앞선다).
      // 호버 규칙(variant별 10곳)의 설명은 아래 compoundVariants 머리말에 있다.
      // 호버 규칙은 :not([data-pressed])를 단다. vanilla-extract가 @media를 selectors
      // 뒤에 내보내 특정도가 같은 호버가 누름 색을 덮기 때문이다.
      '&[data-pressed]:not(:disabled)': {
        // 리터럴 근거: 누름 scale은 토큰 스케일이 없다. emil-design-eng 권장 대역
        // 0.95~0.98의 깊은 끝이다. 오버슛은 이동거리 x 커브 오버슛이라 spring
        // (20.44%)으로 휴지보다 약 1% 되밀리려면 이동거리 0.049, 즉 0.951이 필요하다
        // (snap 9.98%는 0.90이 필요해 너무 깊다). 0.98이면 되밀림이 0.09px라 안 보였다.
        // 라벨과 아이콘이 함께 눌리는 것은 기능이다.
        transform: 'scale(0.95)',
        transitionDuration: themeContract.animation.duration.fast,
        transitionTimingFunction: themeContract.animation.easing.settle,
      },
    },

    '@media': {
      // 축소 모드는 "모션 없음"이 아니라 "이동 없음"이다. 색·불투명도 변화는 둔다.
      // 전역 규칙은 전이 시간만 0으로 만들 뿐 속성 토글은 남기므로 명시한다.
      '(prefers-reduced-motion: reduce)': {
        // transform이 none이라 레이어가 필요 없다.
        backfaceVisibility: 'visible',
        selectors: {
          '&[data-pressed]:not(:disabled)': {
            transform: 'none',
          },
        },
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

  // 호버는 배경색만 바뀐다. 이동(float)을 더하지 않는다. 호버는 정보가 아니라
  // 중복 어포던스다(이미 <button>이고 라벨·커서·포커스 링이 있다). 조항 4의
  // 색 단독 금지는 색이 정보를 나르는 유일한 수단일 때(Snackbar severity)의
  // 규칙이라 여기에 적용하지 않는다. 이 자리에 float을 다시 넣지 마라.
  // 호버 규칙은 각 variant에서 (hover: hover) and (pointer: fine)으로 감싼다.
  // 터치는 탭하면 호버가 발생해 색이 들러붙는다.
  compoundVariants: [
    {
      variants: { buttonStyle: 'fill', variant: 'primary' },
      style: {
        backgroundColor: themeContract.color.primary.main,
        color: themeContract.color.primary.contrast,
        '@media': {
          '(hover: hover) and (pointer: fine)': {
            selectors: {
              '&:hover:not(:disabled):not([data-pressed])': {
                backgroundColor: themeContract.palette.primary[800],
              },
            },
          },
        },
        selectors: {
          '&[data-pressed]:not(:disabled)': {
            backgroundColor: themeContract.palette.primary[900],
          },
        },
      },
    },
    {
      variants: { buttonStyle: 'fill', variant: 'dark' },
      style: {
        backgroundColor: themeContract.palette.gray[700],
        color: themeContract.color.text.inverse,
        '@media': {
          '(hover: hover) and (pointer: fine)': {
            selectors: {
              '&:hover:not(:disabled):not([data-pressed])': {
                backgroundColor: themeContract.palette.gray[800],
              },
            },
          },
        },
        selectors: {
          '&[data-pressed]:not(:disabled)': {
            backgroundColor: themeContract.palette.gray[900],
          },
        },
      },
    },
    {
      variants: { buttonStyle: 'fill', variant: 'danger' },
      style: {
        backgroundColor: themeContract.color.error.main,
        color: themeContract.color.error.contrast,
        '@media': {
          '(hover: hover) and (pointer: fine)': {
            selectors: {
              '&:hover:not(:disabled):not([data-pressed])': {
                backgroundColor: themeContract.palette.error[800],
              },
            },
          },
        },
        selectors: {
          '&[data-pressed]:not(:disabled)': {
            backgroundColor: themeContract.palette.error[900],
          },
        },
      },
    },
    {
      variants: { buttonStyle: 'fill', variant: 'light' },
      style: {
        backgroundColor: themeContract.color.background.default,
        // primary.main(#1976D2)은 rest(4.60)만 간신히 AA(4.5:1)를 넘고 hover
        // primary[50](4.03)·active primary[100](3.28)에서 깬다. weak primary와 같은
        // 진단이다. 배경은 그대로 두고 글자를 primary[900]으로 한 단계 더 어둡게 한다
        // (rest 8.63 / hover 7.56 / active 6.15). 테두리는 비텍스트 UI라 3:1 기준이고
        // primary.main 그대로 4.60·4.03으로 통과하므로 건드리지 않는다.
        color: themeContract.palette.primary[900],
        border: `2px solid ${themeContract.color.primary.main}`,
        '@media': {
          '(hover: hover) and (pointer: fine)': {
            selectors: {
              '&:hover:not(:disabled):not([data-pressed])': {
                backgroundColor: themeContract.palette.primary[50],
              },
            },
          },
        },
        selectors: {
          '&[data-pressed]:not(:disabled)': {
            backgroundColor: themeContract.palette.primary[100],
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
        '@media': {
          '(hover: hover) and (pointer: fine)': {
            selectors: {
              '&:hover:not(:disabled):not([data-pressed])': {
                backgroundColor: themeContract.palette.primary[100],
              },
            },
          },
        },
        selectors: {
          '&[data-pressed]:not(:disabled)': {
            backgroundColor: themeContract.palette.primary[200],
          },
        },
      },
    },
    {
      variants: { buttonStyle: 'weak', variant: 'dark' },
      style: {
        backgroundColor: themeContract.palette.gray[200],
        color: themeContract.palette.gray[800],
        '@media': {
          '(hover: hover) and (pointer: fine)': {
            selectors: {
              '&:hover:not(:disabled):not([data-pressed])': {
                backgroundColor: themeContract.palette.gray[300],
              },
            },
          },
        },
        selectors: {
          '&[data-pressed]:not(:disabled)': {
            backgroundColor: themeContract.palette.gray[400],
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
        '@media': {
          '(hover: hover) and (pointer: fine)': {
            selectors: {
              '&:hover:not(:disabled):not([data-pressed])': {
                backgroundColor: themeContract.palette.error[100],
              },
            },
          },
        },
        selectors: {
          '&[data-pressed]:not(:disabled)': {
            // hover와 배경이 같아 색으로는 상태를 구분할 수 없다. 실제로
            // 상태를 가르는 건 base의 data-pressed scale(0.95)이고, shadow.inner(6% 알파)는
            // error[100] 위에서 거의 안 보이는 보조 신호다.
            backgroundColor: themeContract.palette.error[100],
            boxShadow: themeContract.shadow.inner,
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
        '@media': {
          '(hover: hover) and (pointer: fine)': {
            selectors: {
              '&:hover:not(:disabled):not([data-pressed])': {
                backgroundColor: themeContract.palette.primary[200],
              },
            },
          },
        },
        selectors: {
          '&[data-pressed]:not(:disabled)': {
            backgroundColor: themeContract.palette.primary[300],
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

  '@media': {
    '(hover: hover) and (pointer: fine)': {
      selectors: {
        '&:hover:not(:disabled):not([data-pressed])': {
          backgroundColor: 'var(--btn-hover-bg, var(--btn-bg))',
          filter: 'var(--btn-hover-filter, none)',
        },
      },
    },
  },
  selectors: {
    '&[data-pressed]:not(:disabled)': {
      backgroundColor: 'var(--btn-active-bg, var(--btn-bg))',
      filter: 'var(--btn-active-filter, none)',
    },
  },
});

export const customOutlineVariant = style({
  backgroundColor: themeContract.color.background.default,
  color: 'var(--btn-color)',
  border: '2px solid var(--btn-color)',

  '@media': {
    '(hover: hover) and (pointer: fine)': {
      selectors: {
        // T6b: 하드코딩 rgba 대신 기존 surface.hover/active 토큰을 var() 기본값으로
        // 쓴다(Modal·NumericSpinner와 같은 관례). --btn-hover-bg 자체는 유지된다.
        '&:hover:not(:disabled):not([data-pressed])': {
          backgroundColor: `var(--btn-hover-bg, ${themeContract.color.surface.hover})`,
        },
      },
    },
  },
  selectors: {
    '&[data-pressed]:not(:disabled)': {
      backgroundColor: `var(--btn-active-bg, ${themeContract.color.surface.active})`,
    },
  },
});

export const fullWidth = style({
  width: '100%',
});

// Loader는 바깥에 블록 div를 하나 두므로 flex 아이템으로 만들어 줄 상자(baseline)
// 정렬을 없앤다. 그대로 두면 점·스피너가 글자 baseline으로 내려앉는다.
export const loadingSlot = style({
  display: 'flex',
});
