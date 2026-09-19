import { style, styleVariants, keyframes } from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';

const fadeIn = keyframes({
  '0%': { opacity: 0 },
  '100%': { opacity: 1 },
});

// 컨테이너 스타일 (Tooltip 패턴)
export const popoverContainer = style({
  position: 'relative',
  display: 'inline-block',
});

// 팝오버 본체
export const popover = style({
  position: 'absolute',
  zIndex: themeContract.zIndex.popover,
  backgroundColor: themeContract.color.background.paper,
  borderRadius: themeContract.borderRadius.md,
  boxShadow: themeContract.shadow.lg,
  border: `1px solid ${themeContract.color.border.default}`,
  animation: `${fadeIn} 0.15s ${themeContract.animation.easing.settle}`,
  width: 'max-content',
  minWidth: '120px',
  overflow: 'visible',
});

// Position 스타일 (Tooltip 패턴 + 8px 오프셋)
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

// 화살표: 정사각형을 45도 회전 + 방향별 rotate
// 배경색 + border를 팝오버와 동일하게 적용
export const arrow = style({
  position: 'absolute',
  width: '10px',
  height: '10px',
  backgroundColor: themeContract.color.background.paper,
  border: `1px solid ${themeContract.color.border.default}`,
});

// 방향별 위치 + 회전 (top 기준 45도 회전 → 나머지는 추가 회전)
export const arrowPositionStyles = styleVariants({
  top: {
    bottom: '-6px',
    left: '50%',
    transform: 'translateX(-50%) rotate(45deg)',
    borderTop: 'none',
    borderLeft: 'none',
  },
  bottom: {
    top: '-6px',
    left: '50%',
    transform: 'translateX(-50%) rotate(45deg)',
    borderBottom: 'none',
    borderRight: 'none',
  },
  left: {
    right: '-6px',
    top: '50%',
    transform: 'translateY(-50%) rotate(45deg)',
    borderBottom: 'none',
    borderLeft: 'none',
  },
  right: {
    left: '-6px',
    top: '50%',
    transform: 'translateY(-50%) rotate(45deg)',
    borderTop: 'none',
    borderRight: 'none',
  },
});
