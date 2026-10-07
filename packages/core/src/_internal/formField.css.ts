import { style } from '@vanilla-extract/css';
import { themeContract } from '../tokens/theme.css';

export const wrapper = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeContract.spacing[1],
  width: 'fit-content',
});

export const fullWidth = style({
  width: '100%',
});

export const label = style({
  fontSize: themeContract.font.size.sm,
  fontWeight: themeContract.font.weight.medium,
  color: themeContract.color.text.primary,
  lineHeight: 1.5,
});

export const required = style({
  color: themeContract.color.error.main,
  marginLeft: themeContract.spacing[1],
});

export const helperText = style({
  fontSize: themeContract.font.size.xs,
  color: themeContract.color.text.secondary,
  lineHeight: 1.5,
});

export const errorMessage = style({
  fontSize: themeContract.font.size.xs,
  color: themeContract.color.error.main,
  lineHeight: 1.5,
});
