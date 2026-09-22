import { style, globalStyle } from '@vanilla-extract/css';
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
    // hover/active는 이 값을 곱해 자기 이동/축소와 합성한다 — transform은
    // 단일 속성이라 예전엔 .selected의 scale(1.03)이 :hover/:active의
    // scale(1)/scale(0.97)에 통째로 덮여 선택된 칩에 마우스를 올리면
    // 1.03→1.0으로 줄었다.
    vars: {
      '--chip-scale': '1',
    },

    // 선택 표식(B2) — 항상 존재하되 scale(0)으로 숨어 있다가 .selected에서만
    // 커진다(아래 globalStyle). 색은 --chip-marker-color로 Chip.tsx가 넣는다.
    '::before': {
      content: '""',
      position: 'absolute',
      inset: 0,
      borderRadius: 'inherit',
      border: '2px solid var(--chip-marker-color, transparent)',
      transform: 'scale(0)',
      pointerEvents: 'none',
      // 물러날 때(article 3): 진입(base)의 60~70%로 짧고, 가속 커브로 뺀다.
      transition: `transform calc(${themeContract.animation.duration.base} * 0.65) ${themeContract.animation.easing.exit}`,
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

    variant: {
      filled: {},
      outlined: {},
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
        color: themeContract.color.success.main,
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
        color: themeContract.color.warning.main,
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

export const clickable = style({
  cursor: 'pointer',
  touchAction: 'manipulation',

  // 불투명도로 hover/active를 표현하면 대비가 같이 떨어진다(4.60→3.47:1).
  // 색을 건드리지 않는 채널(이동·그림자·스케일)로 바꾼다. shadow.sm(5% 알파
  // 2px 블러)만으로는 색 있는 칩 위에서 지각 한계 아래라, :active의 scale과
  // 같은 축인 1px 들어올림을 주 채널로 쓴다. scale은 --chip-scale을 곱해
  // 선택 배율과 합성한다(리뷰 F1) — 선택 안 된 칩은 1을 곱해 그대로다.
  ':hover': {
    transform: 'translateY(-1px) scale(var(--chip-scale))',
    boxShadow: themeContract.shadow.base,
    transitionDuration: themeContract.animation.duration.fast,
    transitionTimingFunction: themeContract.animation.easing.settle,
  },

  ':active': {
    boxShadow: 'none',
    transform: 'scale(calc(var(--chip-scale) * 0.97))',
    transitionDuration: themeContract.animation.duration.fast,
    transitionTimingFunction: themeContract.animation.easing.exit,
  },

  ':focus-visible': {
    ...focusRing(),
  },
});

// 선택된 본체 — "표식이 꽂히듯 박히고 칩이 그 충격에 한 번 흔들린다"를 키프레임
// 없이 표현한다. spring(감쇠 진동) 커브 자체가 scale(1)→1.03 전이 중간에
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

// 선택되면 위 chip base의 ::before 표식이 scale(1)로 꽂히듯 박힌다 — base
// 소유의 짧은 퇴장 전이와 달리 진입은 base 길이 그대로에 spring으로 튄다.
// selected가 빈 placeholder라 List.css.ts의 globalStyle(두 독립 클래스 결합)
// 관례로 chip 표식과 결합한다.
globalStyle(`${selected}::before`, {
  transform: 'scale(1)',
  transitionDuration: themeContract.animation.duration.base,
  transitionTimingFunction: themeContract.animation.easing.spring,
});

export const disabled = style({
  opacity: 0.5,
  cursor: 'not-allowed',
  pointerEvents: 'none',
});

export const label = style({
  lineHeight: 1,
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
  margin: 0,
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  touchAction: 'manipulation',
  color: 'inherit',
  opacity: 0.7,
  transition: `opacity ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}, transform ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}`,
  flexShrink: 0,

  // 미는 방향 저항(article 4: 색 단독 금지 — opacity에 이동을 더한다).
  ':hover': {
    opacity: 1,
    transform: 'translateX(1px)',
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
    // 이 요소는 <span>이라 :disabled가 절대 매칭되지 않는다.
    // useClickable이 주는 aria-disabled로 옮긴다.
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
