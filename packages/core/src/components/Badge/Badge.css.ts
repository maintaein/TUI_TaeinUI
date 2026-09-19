import { style, styleVariants } from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';

export const badge = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: themeContract.font.family.sans,
  fontWeight: themeContract.font.weight.semibold,
  // 짧은 대문자 라벨(SIZED, RISK_REJECTED 등)은 기본 자간에서 글자가 뭉친다.
  letterSpacing: themeContract.font.letterSpacing.wide,
  borderRadius: '12px',
  whiteSpace: 'nowrap',
  transition: `all ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}`,
  lineHeight: 1,
  minWidth: '20px',
});

export const variantStyles = styleVariants({
  primary: {
    backgroundColor: `var(--badge-color, ${themeContract.color.primary.main})`,
    color: themeContract.color.primary.contrast,
  },
  secondary: {
    backgroundColor: `var(--badge-color, ${themeContract.palette.gray[600]})`,
    color: themeContract.color.primary.contrast,
  },
  success: {
    backgroundColor: `var(--badge-color, ${themeContract.color.success.main})`,
    color: themeContract.color.success.contrast,
  },
  error: {
    backgroundColor: `var(--badge-color, ${themeContract.color.error.main})`,
    color: themeContract.color.error.contrast,
  },
  warning: {
    backgroundColor: `var(--badge-color, ${themeContract.color.warning.main})`,
    color: themeContract.color.warning.contrast,
  },
  info: {
    backgroundColor: `var(--badge-color, ${themeContract.color.info.main})`,
    color: themeContract.color.info.contrast,
  },
});

export const sizeStyles = styleVariants({
  sm: {
    fontSize: themeContract.font.size['2xs'],
    padding: '2px 6px',
    minWidth: '16px',
    height: '16px',
  },
  md: {
    fontSize: themeContract.font.size.xs,
    padding: '3px 8px',
    minWidth: '20px',
    height: '20px',
  },
  lg: {
    fontSize: themeContract.font.size.sm,
    padding: '4px 10px',
    minWidth: '24px',
    height: '24px',
  },
});

export const dotStyles = style({
  padding: 0,
  minWidth: '8px',
  width: '8px',
  height: '8px',
  borderRadius: '50%',
});
