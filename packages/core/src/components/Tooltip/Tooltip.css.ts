import { style, styleVariants, keyframes } from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';

// 애니메이션 정의
const fadeIn = keyframes({
  '0%': {
    opacity: 0,
  },
  '100%': {
    opacity: 1,
  },
});

// 컨테이너 스타일
export const tooltipContainer = style({
  position: 'relative',
  display: 'inline-block',
});

// 기본 툴팁 스타일
export const tooltip = style({
  position: 'absolute',
  zIndex: themeContract.zIndex.tooltip,
  padding: `${themeContract.spacing[1]} ${themeContract.spacing[2]}`,
  backgroundColor: themeContract.color.text.primary,
  color: themeContract.color.background.paper,
  fontSize: themeContract.font.size.xs,
  fontWeight: themeContract.font.weight.medium,
  lineHeight: themeContract.font.lineHeight.normal,
  borderRadius: themeContract.borderRadius.sm,
  whiteSpace: 'nowrap',
  animation: `${fadeIn} ${themeContract.animation.duration.fast} ${themeContract.animation.easing.settle}`,
});

// Position 스타일
export const positionStyles = styleVariants({
  top: {
    bottom: '100%',
    left: '50%',
    transform: 'translateX(-50%) translateY(-8px)',
  },
  bottom: {
    top: '100%',
    left: '50%',
    transform: 'translateX(-50%) translateY(8px)',
  },
  left: {
    right: '100%',
    top: '50%',
    transform: 'translateY(-50%) translateX(-8px)',
  },
  right: {
    left: '100%',
    top: '50%',
    transform: 'translateY(-50%) translateX(8px)',
  },
});

// 화살표 기본 스타일
export const arrow = style({
  position: 'absolute',
  width: 0,
  height: 0,
  borderStyle: 'solid',
});

// 화살표 위치별 스타일
export const arrowPositionStyles = styleVariants({
  top: {
    bottom: '-4px',
    left: '50%',
    transform: 'translateX(-50%)',
    borderWidth: '4px 4px 0 4px',
    borderColor: `${themeContract.color.text.primary} transparent transparent transparent`,
  },
  bottom: {
    top: '-4px',
    left: '50%',
    transform: 'translateX(-50%)',
    borderWidth: '0 4px 4px 4px',
    borderColor: `transparent transparent ${themeContract.color.text.primary} transparent`,
  },
  left: {
    right: '-4px',
    top: '50%',
    transform: 'translateY(-50%)',
    borderWidth: '4px 0 4px 4px',
    borderColor: `transparent transparent transparent ${themeContract.color.text.primary}`,
  },
  right: {
    left: '-4px',
    top: '50%',
    transform: 'translateY(-50%)',
    borderWidth: '4px 4px 4px 0',
    borderColor: `transparent ${themeContract.color.text.primary} transparent transparent`,
  },
});
