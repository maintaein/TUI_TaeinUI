import { style } from '@vanilla-extract/css';
import { recipe } from '@vanilla-extract/recipes';
import { themeContract } from '../../tokens/theme.css';
import { focusRing } from '../../tokens/focusRing.css';

export const chip = recipe({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: themeContract.spacing[1],
    padding: `${themeContract.spacing[1]} ${themeContract.spacing[3]}`,
    border: 'none',
    borderRadius: themeContract.borderRadius.full,
    fontWeight: themeContract.font.weight.medium,
    fontSize: themeContract.font.size.sm,
    lineHeight: 1,
    userSelect: 'none',
    transition: 'all 0.2s ease',
    cursor: 'default',
    whiteSpace: 'nowrap',
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
  // 같은 축인 1px 들어올림을 주 채널로 쓴다.
  ':hover': {
    transform: 'translateY(-1px)',
    boxShadow: themeContract.shadow.base,
  },

  ':active': {
    boxShadow: 'none',
    transform: 'scale(0.97)',
  },

  ':focus-visible': {
    ...focusRing(),
  },
});

export const selected = style({});

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
  transition: 'opacity 0.2s ease',
  flexShrink: 0,

  ':hover': {
    opacity: 1,
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
