import { style, styleVariants } from '@vanilla-extract/css';
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
    transition: `all ${themeContract.animation.duration.base} ${themeContract.animation.easing.easeInOut}`,
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
  transition: `all ${themeContract.animation.duration.base} ${themeContract.animation.easing.easeInOut}`,
  userSelect: 'none',
  borderRadius: themeContract.borderRadius.base,
  color: themeContract.palette.gray[600],
  flexShrink: 0,
  minWidth: '44px',
  minHeight: '44px',

  selectors: {
    '&:hover:not(:disabled)': {
      color: themeContract.palette.gray[900],
      backgroundColor: themeContract.palette.gray[100],
    },
    '&:active:not(:disabled)': {
      color: themeContract.palette.gray[900],
      backgroundColor: themeContract.palette.gray[200],
      transform: 'scale(0.92)',
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
