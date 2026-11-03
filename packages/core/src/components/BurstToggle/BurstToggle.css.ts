import { style } from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';

// IconButton md 고스트와 같은 칸(44px)과 색을 쓴다. 켜지면 아이콘이 primary가 된다
// (점 고리와 같은 색, 흰 배경 대비 3:1 이상이라 아이콘 기준을 넘긴다).
// overflow는 기본값 visible이라 점이 단추 밖으로 나가도 잘리지 않는다.
export const root = style({
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  minWidth: '44px',
  minHeight: '44px',
  padding: '0.375rem',
  fontFamily: themeContract.font.family.sans,
  background: 'none',
  border: 'none',
  borderRadius: themeContract.borderRadius.base,
  color: themeContract.palette.gray[600],
  cursor: 'pointer',
  touchAction: 'manipulation',
  userSelect: 'none',
  transition: `background-color ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}, color ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}, box-shadow ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}`,

  selectors: {
    '&[aria-pressed="true"]': {
      color: themeContract.color.primary.main,
    },
  },

  '@media': {
    '(hover: hover) and (pointer: fine)': {
      selectors: {
        '&:hover:not(:disabled)': {
          backgroundColor: themeContract.palette.gray[100],
        },
      },
    },
  },

  ':disabled': {
    cursor: 'not-allowed',
    opacity: 0.4,
  },

  // 면이 없는 아이콘 단추라 호버와 같은 옅은 면에 가장자리 안쪽 primary 2px(③ 모양, 채운 단추가 아니다).
  // primary.main은 그 면(gray[100])과 4.2:1, 바깥 흰 바탕과 4.6:1이다.
  ':focus-visible': {
    outline: 'none',
    backgroundColor: themeContract.palette.gray[100],
    boxShadow: `inset 0 0 0 2px ${themeContract.color.primary.main}`,
  },
});

// 납작·튕김이 도는 아이콘 칸. 애니메이션 중에만 합성 레이어가 생기면 끝나는 순간
// 아이콘이 1px 튈 수 있어 처음부터 둔다(IconButton의 jellySlot과 같은 이유).
export const slot = style({
  willChange: 'transform',
  '@media': {
    '(prefers-reduced-motion: reduce)': {
      willChange: 'auto',
    },
  },
});

// 점 고리. 아이콘 가운데에 크기 0으로 놓여 레이아웃을 밀지 않고, 점은 이 점을 기준으로 퍼진다.
export const ring = style({
  position: 'absolute',
  top: '50%',
  left: '50%',
  width: 0,
  height: 0,
  pointerEvents: 'none',
});

// 점 하나의 지름 4px. 가운데 기준으로 놓으려 반지름만큼 당겨 둔다.
export const dot = style({
  position: 'absolute',
  top: '-2px',
  left: '-2px',
  width: '4px',
  height: '4px',
  borderRadius: themeContract.borderRadius.full,
  backgroundColor: themeContract.color.primary.main,
});
