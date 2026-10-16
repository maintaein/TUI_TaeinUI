import { style, globalStyle, type StyleRule } from '@vanilla-extract/css';
import { recipe } from '@vanilla-extract/recipes';
import { themeContract } from '../../tokens/theme.css';
import { focusRing } from '../../tokens/focusRing.css';

export const chip = recipe({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    position: 'relative',
    gap: themeContract.spacing[1],
    padding: `${themeContract.spacing[1]} ${themeContract.spacing[3]}`,
    border: 'none',
    borderRadius: themeContract.borderRadius.full,
    fontWeight: themeContract.font.weight.medium,
    fontSize: themeContract.font.size.sm,
    lineHeight: 1,
    userSelect: 'none',
    transition: `transform ${themeContract.animation.duration.base} ${themeContract.animation.easing.snap}, box-shadow ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}, opacity ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}`,
    cursor: 'default',
    whiteSpace: 'nowrap',

    // 선택 배율 합성용 변수(리뷰 F1) — 기본 1, .selected가 1.03으로 올린다.
    // 누름([data-pressed])은 이 값을 곱해 자기 축소와 합성한다. transform은
    // 단일 속성이라 예전엔 .selected의 scale(1.03)이 :hover/:active의
    // scale(1)/scale(0.97)에 통째로 덮여 선택된 칩에 마우스를 올리면
    // 1.03→1.0으로 줄었다.
    vars: {
      '--chip-scale': '1',
    },

    // 선택 표식(B2). 항상 존재하되 opacity 0으로 숨어 있다가 .selected에서만
    // 서서히 나타난다(아래 globalStyle). 크기는 바뀌지 않는다. 색은
    // --chip-marker-color로 Chip.tsx가 넣는다. 고리는 모양이라 색만으로 선택을
    // 알리지 않는다(WCAG 1.4.1).
    '::before': {
      content: '""',
      position: 'absolute',
      inset: 0,
      borderRadius: 'inherit',
      border: '2px solid var(--chip-marker-color, transparent)',
      opacity: 0,
      pointerEvents: 'none',
      // 물러날 때(article 3): 진입(slow)의 65%(195ms)로 짧고, 가속 커브로 뺀다.
      transition: `opacity calc(${themeContract.animation.duration.slow} * 0.65) ${themeContract.animation.easing.exit}`,
    },
  },

  variants: {
    size: {
      sm: {
        padding: `${themeContract.spacing[1]} ${themeContract.spacing[2]}`,
        fontSize: themeContract.font.size.xs,
        gap: themeContract.spacing[1],
        // padding 4px*2 + font 12px + lineHeight 1 = 20px로 md와 같은 이유로
        // 24px 터치 타깃(WCAG 2.5.8) 이하로 떨어진다.
        minHeight: '24px',
      },
      md: {
        padding: `${themeContract.spacing[1]} ${themeContract.spacing[3]}`,
        fontSize: themeContract.font.size.sm,
        gap: themeContract.spacing[1],
        // 명시적 높이가 없으면 padding 4px*2 + font 14px = 22px로 계산돼
        // 24px 터치 타깃(WCAG 2.5.8) 이하로 떨어진다.
        minHeight: '24px',
      },
      lg: {
        padding: `${themeContract.spacing[2]} ${themeContract.spacing[4]}`,
        fontSize: themeContract.font.size.base,
        gap: themeContract.spacing[2],
      },
    },

    // 루트의 테두리 두께(compound의 border와 같은 값). 누르기 + 삭제의 주 동작 ::after가
    // 이만큼 바깥으로 나가 테두리 상자까지 덮는다(action 참고).
    variant: {
      filled: { vars: { '--chip-border-width': '0px' } },
      outlined: { vars: { '--chip-border-width': '1px' } },
    },

    color: {
      default: {},
      primary: {},
      success: {},
      error: {},
      warning: {},
    },
  },

  compoundVariants: [
    {
      variants: { variant: 'filled', color: 'default' },
      style: {
        backgroundColor: themeContract.color.surface.hover,
        color: themeContract.color.text.primary,
      },
    },
    {
      variants: { variant: 'filled', color: 'primary' },
      style: {
        backgroundColor: themeContract.color.primary.main,
        color: themeContract.color.primary.contrast,
      },
    },
    {
      variants: { variant: 'filled', color: 'success' },
      style: {
        backgroundColor: themeContract.color.success.main,
        color: themeContract.color.success.contrast,
      },
    },
    {
      variants: { variant: 'filled', color: 'error' },
      style: {
        backgroundColor: themeContract.color.error.main,
        color: themeContract.color.error.contrast,
      },
    },
    {
      variants: { variant: 'filled', color: 'warning' },
      style: {
        backgroundColor: themeContract.color.warning.main,
        color: themeContract.color.warning.contrast,
      },
    },
    {
      variants: { variant: 'outlined', color: 'default' },
      style: {
        backgroundColor: 'transparent',
        color: themeContract.color.text.primary,
        border: `1px solid ${themeContract.color.border.default}`,
      },
    },
    {
      variants: { variant: 'outlined', color: 'primary' },
      style: {
        backgroundColor: 'transparent',
        color: themeContract.color.primary.main,
        border: `1px solid ${themeContract.color.primary.main}`,
      },
    },
    {
      variants: { variant: 'outlined', color: 'success' },
      style: {
        backgroundColor: 'transparent',
        color: themeContract.color.success.dark,
        border: `1px solid ${themeContract.color.success.main}`,
      },
    },
    {
      variants: { variant: 'outlined', color: 'error' },
      style: {
        backgroundColor: 'transparent',
        color: themeContract.color.error.main,
        border: `1px solid ${themeContract.color.error.main}`,
      },
    },
    {
      variants: { variant: 'outlined', color: 'warning' },
      style: {
        backgroundColor: 'transparent',
        color: themeContract.color.warning.dark,
        border: `1px solid ${themeContract.color.warning.main}`,
      },
    },
  ],

  defaultVariants: {
    size: 'md',
    variant: 'filled',
    color: 'default',
  },
});

// 선택된 본체. spring(감쇠 진동) 커브가 scale(1)에서 1.03으로 가는 전이 중간에
// 1.03을 넘겼다 살짝 되돌아오는 흔들림을 만든다(article 1: 상태 전이는 커브로).
// --chip-scale을 1.03으로 올려 위 :hover/:active가 곱해 합성한다(리뷰 F1).
// transitionDuration/TimingFunction만 얹으면(구 코드) transition-property는
// chip 베이스의 transform·box-shadow·opacity 세 개를 그대로 물려받아 spring이
// box-shadow·opacity에도 샌다 — transition을 통째로 다시 적어 막는다(리뷰 F6).
export const selected = style({
  vars: {
    '--chip-scale': '1.03',
  },
  transform: 'scale(var(--chip-scale))',
  transition: `transform ${themeContract.animation.duration.base} ${themeContract.animation.easing.spring}, box-shadow ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}, opacity ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}`,
});

// 선택되면 위 chip base의 ::before 고리가 투명도로 스며든다. 크기는 바뀌지 않고
// spring도 쓰지 않는다. settle은 1-(1-t)^4라 투명도가 진행 43.8%에 90%에 닿는다.
// base(200ms)면 88ms 만에 거의 다 보여 "켜지는" 것으로 읽혀서 slow(300ms, 131ms)로
// 늘렸다. 사라질 때는 base 규칙의 slow*0.65(195ms), exit다. 단축 속성을 통째로 써서
// base의 transition을 물려받지 않게 한다(리뷰 F6과 같은 이유). selected가 빈
// placeholder라 List.css.ts의 globalStyle(두 독립 클래스 결합) 관례로 chip 고리와 결합한다.
globalStyle(`${selected}::before`, {
  opacity: 1,
  transition: `opacity ${themeContract.animation.duration.slow} ${themeContract.animation.easing.settle}`,
});

// 호버·누름의 색 한 쌍. 호버는 (hover: hover) and (pointer: fine) 안에서만 걸린다
// (터치는 탭하면 호버가 발생해 색이 들러붙는다). :not([data-pressed])는 vanilla-extract가
// @media를 selectors 뒤에 내보내 특정도가 같은 호버가 누름 색을 덮는 것을 막는다.
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

// 클릭 가능한 칩(Button의 누름·호버와 같은 규칙). selected 뒤에 선언해야 같은 특정도의
// transition 선언이 selected의 것을 이긴다(여기에 색 전이가 들어 있다).
// 호버는 모션 없이 색만 바꾼다(Button 승인 #6). 떠오름·그림자는 걷었다.
// 색 고르기는 Button의 각 변형처럼 팔레트 한 단계를 오르내리되, 글자가 어두운
// success·warning(filled)은 filter brightness로, 연한 배경에서 AA가 깨지는 outlined의
// primary·error 글자는 hover·pressed에서 더 진한 색으로 바꾼다(success·warning은
// 평소부터 .dark). 글자색 전이가 필요해 color가 목록에 있다.
export const clickable = recipe({
  base: {
    cursor: 'pointer',
    touchAction: 'manipulation',
    // 합성 레이어를 첫 페인트부터 영구로 둔다. 레이어 수명이 바뀌는 순간 글자가
    // 1px 튄다(Button.css.ts의 will-change 주석과 같은 근거, e2e/buttonPressText.spec.ts).
    willChange: 'transform',
    // 누름에서 뗄 때 spring이 transform에만 걸리게 통째로 적는다(리뷰 F6). 색은 settle.
    transition: `transform ${themeContract.animation.duration.base} ${themeContract.animation.easing.spring}, background-color ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}, color ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}, filter ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}, opacity ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}`,

    selectors: {
      // useClickRebound가 data-pressed를 걸고 최소 체류(90ms) 뒤에 지운다.
      // 누를 때는 fast + settle로 단단하게, 뗄 때는 위 transition의 spring(200ms)이
      // 돌아와 되밀린다. 0.95는 Button과 같다(근거는 Button.css.ts의 같은 규칙).
      // --chip-scale을 곱해 선택 배율(1.03) 위에서 눌린다.
      '&[data-pressed]:not(:disabled)': {
        transform: 'scale(calc(var(--chip-scale) * 0.95))',
        transitionDuration: themeContract.animation.duration.fast,
        transitionTimingFunction: themeContract.animation.easing.settle,
      },
    },

    '@media': {
      // 축소 모드는 이동 없음이다. 눌러도 선택 배율 그대로 두고 색은 남긴다.
      '(prefers-reduced-motion: reduce)': {
        willChange: 'auto',
        selectors: {
          '&[data-pressed]:not(:disabled)': {
            transform: 'scale(var(--chip-scale))',
          },
        },
      },
    },

    ':focus-visible': {
      ...focusRing(),
    },
  },

  variants: {
    variant: { filled: {}, outlined: {} },
    color: { default: {}, primary: {}, success: {}, error: {}, warning: {} },
  },

  compoundVariants: [
    {
      variants: { variant: 'filled', color: 'default' },
      style: tint(
        { backgroundColor: themeContract.palette.gray[200] },
        { backgroundColor: themeContract.palette.gray[300] }
      ),
    },
    {
      variants: { variant: 'filled', color: 'primary' },
      style: tint(
        { backgroundColor: themeContract.palette.primary[800] },
        { backgroundColor: themeContract.palette.primary[900] }
      ),
    },
    {
      // success·warning은 글자가 어두워서(gray[900]) 배경만
      // 어둡게 하면 대비가 깎인다. brightness는 둘을 같이 어둡게 한다(Button weak danger와
      // 같은 방식). success 5.79 -> 5.24 -> 4.78, warning 7.47 -> 6.78 -> 6.08.
      variants: { variant: 'filled', color: 'success' },
      style: tint(
        { filter: 'brightness(0.94)' },
        { filter: 'brightness(0.88)' }
      ),
    },
    {
      variants: { variant: 'filled', color: 'error' },
      style: tint(
        { backgroundColor: themeContract.palette.error[800] },
        { backgroundColor: themeContract.palette.error[900] }
      ),
    },
    {
      variants: { variant: 'filled', color: 'warning' },
      style: tint(
        { filter: 'brightness(0.94)' },
        { filter: 'brightness(0.88)' }
      ),
    },
    {
      variants: { variant: 'outlined', color: 'default' },
      style: tint(
        { backgroundColor: themeContract.palette.gray[100] },
        { backgroundColor: themeContract.palette.gray[200] }
      ),
    },
    {
      // 글자 primary.main은 primary[50] 위에서 4.03, primary[100] 위에서 3.28로 AA를
      // 깬다. 글자를 primary[900]으로 한 단계 더 어둡게 한다(7.56 / 6.15).
      variants: { variant: 'outlined', color: 'primary' },
      style: tint(
        {
          backgroundColor: themeContract.palette.primary[50],
          color: themeContract.palette.primary[900],
        },
        {
          backgroundColor: themeContract.palette.primary[100],
          color: themeContract.palette.primary[900],
        }
      ),
    },
    {
      // 글자 error.main은 error[50]에서 4.36, error[100]에서 3.54다. error[900]으로
      // 5.75 / 4.67.
      variants: { variant: 'outlined', color: 'error' },
      style: tint(
        {
          backgroundColor: themeContract.palette.error[50],
          color: themeContract.palette.error[900],
        },
        {
          backgroundColor: themeContract.palette.error[100],
          color: themeContract.palette.error[900],
        }
      ),
    },
    {
      // 선재: 글자 success.main은 흰 배경에서 이미 2.78이라 평소 글자를 success.dark(800)로
      // 바꿨다(흰 배경 5.13, success[50] 위 4.56). 호버·누름에서도 글자가 같아
      // 초록이 검정으로 바뀌지 않는다. 테두리는 .main 그대로.
      // 누름도 [50]이다. [100] 위에서는 success.dark가 3.81이라 AA를 깬다(누름 표시는 배율이 한다).
      variants: { variant: 'outlined', color: 'success' },
      style: tint(
        { backgroundColor: themeContract.palette.success[50] },
        { backgroundColor: themeContract.palette.success[50] }
      ),
    },
    {
      // warning도 같은 처방이다. warning.main 글자는 흰 배경에서 2.16이었고
      // warning.dark(800)는 흰 배경 5.49, warning[50] 위 5.00이다([100] 위 4.32라 누름도 [50]).
      variants: { variant: 'outlined', color: 'warning' },
      style: tint(
        { backgroundColor: themeContract.palette.warning[50] },
        { backgroundColor: themeContract.palette.warning[50] }
      ),
    },
  ],
});

export const disabled = style({
  opacity: 0.5,
  cursor: 'not-allowed',
  pointerEvents: 'none',
});

// 퇴장 중에는 포인터를 받지 않는다(키보드는 inert가 막는다).
export const exiting = style({
  pointerEvents: 'none',
});

export const label = style({
  lineHeight: 1,
});

// 누르기 + 삭제의 주 동작 버튼. 칩 겉모습은 루트 div가 갖고, 이 버튼은 아바타·아이콘·
// 라벨을 감싸는 투명한 껍데기다(간격·글꼴·색을 루트에서 이어받는다). 삭제 버튼과 나란히
// 놓이므로 버튼 안에 버튼이 없다. position을 주지 않아 ::after가 루트 기준으로 칩 전체를
// 덮고, 그 덕에 패딩 영역을 눌러도 주 동작이다(삭제 버튼은 DOM 뒤라 그 위에 얹힌다).
// inset 0은 루트의 안쪽 여백 상자라 outlined의 테두리 띠를 빼먹으므로, 루트가 알려 주는
// 테두리 두께(--chip-border-width)만큼 바깥으로 낸다. 테두리 없는 filled는 0이라 그대로다.
// 포커스 링도 이 ::after에 그려 칩 전체를 두른다(테두리 상자 기준이라 루트 button과 같은 자리).
export const action = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 'inherit',
  padding: 0,
  margin: 0,
  border: 'none',
  background: 'none',
  font: 'inherit',
  color: 'inherit',
  whiteSpace: 'inherit',
  userSelect: 'inherit',
  cursor: 'pointer',
  touchAction: 'manipulation',
  outline: 'none',

  selectors: {
    '&::after': {
      content: '""',
      position: 'absolute',
      inset: 'calc(var(--chip-border-width, 0px) * -1)',
      borderRadius: themeContract.borderRadius.full,
    },
    '&:focus-visible::after': focusRing(),
  },
});

export const iconContainer = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
});

export const deleteButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  padding: 0,
  // 16px 글리프의 세로 레이아웃 크기를 가장 낮은 글자 줄(sm의 12px) 이하로 줄여 칩의
  // 줄 높이를 늘리지 않는다. 보이는 크기와 히트 영역(::after 24px)은 그대로다. 이전에는
  // 테두리가 있는 outlined 칩만 2 + 8 + 16 = 26px로 다른 칩(24px)보다 높았다.
  margin: '-4px 0',
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  touchAction: 'manipulation',
  color: 'inherit',
  opacity: 0.7,
  transition: `opacity ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}, transform ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}`,
  flexShrink: 0,

  // 미는 방향 저항(article 4: 색 단독 금지, opacity에 이동을 더한다). 칩 호버(tint)와
  // 같은 게이트 안에서만 건다(터치는 탭하면 호버가 발생해 이동이 들러붙는다).
  // @media는 selectors 뒤에 나와 같은 특정도의 aria-disabled 규칙을 덮으므로
  // 비활성은 :not으로 뺀다.
  '@media': {
    '(hover: hover) and (pointer: fine)': {
      selectors: {
        '&:hover:not([aria-disabled="true"])': {
          opacity: 1,
          transform: 'translateX(1px)',
        },
      },
    },
  },

  ':focus-visible': {
    ...focusRing('currentColor'),
    borderRadius: '50%',
    opacity: 1,
  },

  selectors: {
    // 시각 크기(16px)는 그대로 두고 히트 영역만 24px(WCAG 2.5.8)로 넓힌다.
    // min-width/height로 상자 자체를 키우면 칩 세로 패딩과 충돌해 넘친다.
    '&::after': {
      content: '""',
      position: 'absolute',
      top: '50%',
      left: '50%',
      width: '24px',
      height: '24px',
      transform: 'translate(-50%, -50%)',
    },
    // 비활성은 disabled와 함께 주는 aria-disabled로 읽는다(호버 규칙의 :not과 같은 손잡이).
    '&[aria-disabled="true"]': {
      cursor: 'not-allowed',
      opacity: 0.4,
    },
  },
});

export const deleteIcon = style({
  width: '18px',
  height: '18px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
});
