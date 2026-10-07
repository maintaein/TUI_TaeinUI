import {
  style,
  styleVariants,
  globalStyle,
  type StyleRule,
} from '@vanilla-extract/css';
import { recipe } from '@vanilla-extract/recipes';
import { themeContract } from '../../tokens/theme.css';
import { focusRing } from '../../tokens/focusRing.css';

// 호버·누름의 색 한 쌍(Button·Chip의 규칙과 같다). 호버는 (hover: hover) and
// (pointer: fine) 안에서만 걸린다(터치는 탭하면 호버가 발생해 색이 들러붙는다).
// 호버는 배경색(과 글자색)만 바꾼다. 이동을 더하지 않는다(근거는 Button.css.ts의
// compoundVariants 머리말). :not([data-pressed])는 vanilla-extract가 @media를
// selectors 뒤에 내보내 특정도가 같은 호버가 누름 색을 덮는 것을 막는다.
const tint = (hover: StyleRule, pressed: StyleRule): StyleRule => ({
  '@media': {
    '(hover: hover) and (pointer: fine)': {
      selectors: {
        '&:hover:not(:disabled):not([data-pressed])': hover,
      },
    },
  },
  selectors: {
    '&[data-pressed]:not(:disabled)': pressed,
  },
});

// 모든 모드(ghost·weak·strong)에 같이 붙는 누름 규칙. 모드마다 따로 쓰면 한쪽이
// 어긋난다. 색은 각 모드가 tint로 갖고, 여기는 축소와 레이어만 맡는다.
// Button.css.ts의 같은 규칙을 그대로 옮겼다.
export const pressable = style({
  // 합성 레이어를 첫 페인트부터 영구로 둔다. 레이어 유무에 따라 글자가 1px 튀는
  // 문제의 근거는 Button.css.ts의 will-change 주석에 있다. 아이콘도 같은 레이어
  // 안에서 래스터되므로 같은 이유로 둔다.
  willChange: 'transform',

  selectors: {
    // 누름 상태. :active는 pointerup에 끝나서 짧은 탭은 안 보인다. IconButton.tsx가
    // useClickRebound로 data-pressed를 걸고 최소 체류(90ms) 뒤에 지운다. 들어갈
    // 때는 fast+settle로 단단하게, 뗄 때는 base 숏핸드의 transform spring이
    // 돌아와 되밀린다. 0.95의 근거는 Button.css.ts의 같은 자리 주석이다.
    '&[data-pressed]:not(:disabled)': {
      transform: 'scale(0.95)',
      transitionDuration: themeContract.animation.duration.fast,
      transitionTimingFunction: themeContract.animation.easing.settle,
    },
  },

  '@media': {
    // 축소 모드는 이동 없음이다. 색 변화는 둔다. transform이 none이라 레이어도
    // 필요 없다(Button.css.ts와 같다).
    '(prefers-reduced-motion: reduce)': {
      willChange: 'auto',
      selectors: {
        '&[data-pressed]:not(:disabled)': {
          transform: 'none',
        },
      },
    },
  },
});

export const iconButton = recipe({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: themeContract.font.family.sans,
    border: 'none',
    cursor: 'pointer',
    touchAction: 'manipulation',
    transition: `background-color ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}, opacity ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}, transform ${themeContract.animation.duration.base} ${themeContract.animation.easing.spring}`,
    userSelect: 'none',
    position: 'relative',
    overflow: 'hidden',
    flexShrink: 0,

    ':disabled': {
      cursor: 'not-allowed',
      opacity: 0.5,
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
      strong: {},
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
      variants: { buttonStyle: 'strong', variant: 'primary' },
      style: {
        // primary[600]은 흰 배경 대비 3.68:1로 Button의 동일 조합(4.60)보다
        // 낮다. 세 상태를 한 단계씩 올려 4.60/5.74/8.63으로 맞춘다.
        backgroundColor: themeContract.color.primary.main,
        color: themeContract.color.primary.contrast,
        ...tint(
          { backgroundColor: themeContract.palette.primary[800] },
          { backgroundColor: themeContract.palette.primary[900] }
        ),
      },
    },
    {
      variants: { buttonStyle: 'strong', variant: 'dark' },
      style: {
        backgroundColor: themeContract.palette.gray[700],
        color: themeContract.color.text.inverse,
        ...tint(
          { backgroundColor: themeContract.palette.gray[800] },
          { backgroundColor: themeContract.palette.gray[900] }
        ),
      },
    },
    {
      variants: { buttonStyle: 'strong', variant: 'danger' },
      style: {
        // Button.css.ts의 같은 조합과 같다(휴지 main, 호버 800, 누름 900). 누름은
        // 호버보다 어두워진다. 대비는 그쪽 주석.
        backgroundColor: themeContract.color.error.main,
        color: themeContract.color.error.contrast,
        ...tint(
          { backgroundColor: themeContract.palette.error[800] },
          { backgroundColor: themeContract.palette.error[900] }
        ),
      },
    },
    {
      variants: { buttonStyle: 'strong', variant: 'light' },
      style: {
        // Button.css.ts의 fill light와 같다(글자 primary[900], 테두리 primary.main).
        // 대비는 그쪽 주석.
        backgroundColor: themeContract.color.background.default,
        color: themeContract.palette.primary[900],
        border: `2px solid ${themeContract.color.primary.main}`,
        ...tint(
          { backgroundColor: themeContract.palette.primary[50] },
          { backgroundColor: themeContract.palette.primary[100] }
        ),
      },
    },
    {
      variants: { buttonStyle: 'weak', variant: 'primary' },
      style: {
        // Button.css.ts의 weak primary와 같다(글자 primary[900]). 대비는 그쪽 주석.
        backgroundColor: themeContract.palette.primary[50],
        color: themeContract.palette.primary[900],
        ...tint(
          { backgroundColor: themeContract.palette.primary[100] },
          { backgroundColor: themeContract.palette.primary[200] }
        ),
      },
    },
    {
      variants: { buttonStyle: 'weak', variant: 'dark' },
      style: {
        backgroundColor: themeContract.palette.gray[200],
        color: themeContract.palette.gray[800],
        ...tint(
          { backgroundColor: themeContract.palette.gray[300] },
          { backgroundColor: themeContract.palette.gray[400] }
        ),
      },
    },
    {
      variants: { buttonStyle: 'weak', variant: 'danger' },
      style: {
        // Button.css.ts의 weak danger와 같다(글자 error[900], 누름 brightness(0.96)).
        // 호버와 누름 배경이 같아 보정이 누름을 가른다. 대비는 그쪽 주석.
        backgroundColor: themeContract.palette.error[50],
        color: themeContract.palette.error[900],
        ...tint(
          { backgroundColor: themeContract.palette.error[100] },
          {
            backgroundColor: themeContract.palette.error[100],
            filter: 'brightness(0.96)',
          }
        ),
      },
    },
    {
      variants: { buttonStyle: 'weak', variant: 'light' },
      style: {
        // Button.css.ts의 weak light와 같다(글자 text.primary). 대비는 그쪽 주석.
        backgroundColor: themeContract.palette.primary[100],
        color: themeContract.color.text.primary,
        ...tint(
          { backgroundColor: themeContract.palette.primary[200] },
          { backgroundColor: themeContract.palette.primary[300] }
        ),
      },
    },
  ],

  defaultVariants: {
    size: 'md',
    buttonStyle: 'strong',
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
  transition: `background-color ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}, color ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}, opacity ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}, transform ${themeContract.animation.duration.base} ${themeContract.animation.easing.spring}`,
  userSelect: 'none',
  borderRadius: themeContract.borderRadius.base,
  color: themeContract.palette.gray[600],
  flexShrink: 0,
  minWidth: '44px',
  minHeight: '44px',

  ...tint(
    {
      color: themeContract.palette.gray[900],
      backgroundColor: themeContract.palette.gray[100],
    },
    {
      color: themeContract.palette.gray[900],
      backgroundColor: themeContract.palette.gray[200],
    }
  ),

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

// 아이콘 칸. 아이콘 크기는 라이브러리가 아니라 버튼이 정한다: 칸 안의 svg를 1em으로
// 맞추면 iconSizeVariants의 fontSize(18/22/26/30px)를 따른다. 어느 아이콘
// 라이브러리(lucide-react, react-icons 등)의 svg든 같다.
// 선택자는 :where로 감싸 특정도를 0으로 낮춘다. 사용자가 className이나 style로 준
// 크기가 이긴다.
// 알려진 한계: lucide의 size prop은 SVG 속성(width="22")이라 CSS 규칙에 진다(라이브러리
// 기본 크기 24px를 이기려는 규칙이 같은 이유로 size도 이긴다). 크기를 바꾸려면
// className이나 style로 준다. 의도된 동작이다.
// 가운데 정렬 flex라 인라인 svg의 baseline 때문에 세로로 1~2px 처지지 않는다.
export const iconSlot = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
});

globalStyle(`:where(${iconSlot} svg)`, {
  width: '1em',
  height: '1em',
});

// Loader는 바깥에 블록 div를 하나 두므로 flex 아이템으로 만들어 줄 상자(baseline)
// 정렬을 없앤다. 그대로 두면 점·스피너가 글자 baseline으로 내려앉는다.
export const loadingSlot = style({
  display: 'flex',
});

// 젤리(hoverEffect="jelly")가 켜진 버튼의 아이콘 칸. 애니메이션 중에만 합성 레이어가
// 생기면 끝나는 순간 레이어가 사라지며 아이콘이 1px 튈 수 있다. 그래서 효과가 켜졌을
// 때만 처음부터 레이어를 둔다(근거는 Button.css.ts의 will-change 주석과 같다). 축소
// 모드에서는 움직임이 없으니 레이어도 필요 없다.
export const jellySlot = style({
  willChange: 'transform',
  '@media': {
    '(prefers-reduced-motion: reduce)': {
      willChange: 'auto',
    },
  },
});
