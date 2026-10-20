import { themeContract } from '@taein-ui/core';
import { style } from '@vanilla-extract/css';

const { color, spacing, borderRadius, font } = themeContract;

export const root = style({
  maxWidth: '44rem',
  margin: '0 auto',
});

// 무대 높이는 가장 큰 장면(HeaderBar 바, 열린 Popover)에 맞춰 고정한다. 장면이 바뀌어도 페이지가 출렁이지 않는다.
export const stage = style({
  position: 'relative',
  // 대리 상자가 음수 z-index로 내용 뒤에 깔려도 무대 배경 아래로 빠지지 않게 한다.
  isolation: 'isolate',
  height: '20rem',
  overflow: 'hidden',
  background: color.background.paper,
  border: `1px solid ${color.border.default}`,
  borderRadius: borderRadius.lg,
});

// 내용 층. 크기는 내용이 정한다. 틀 없이 진짜 컴포넌트가 무대 가운데에 선다.
export const layer = style({
  position: 'absolute',
  inset: 0,
  margin: 'auto',
  boxSizing: 'border-box',
  width: 'max-content',
  height: 'max-content',
  maxWidth: `calc(100% - ${spacing[4]})`,
  selectors: {
    // 바 형태는 무대 폭을 채운다.
    '&[data-wide]': { width: '100%', maxWidth: '100%' },
    // Popover 말풍선은 트리거 아래로 늘어진다. 트리거가 위로 올라 둘이 함께 가운데에 선다.
    '&[data-id="loader"]': { paddingBottom: spacing[16] },
  },
});

// 앞 컴포넌트 부품에서 뒤 컴포넌트 부품으로 모양을 잇는 자식 없는 상자. 위치·크기·반경·색은 gsap이 정한다.
export const surrogate = style({
  position: 'absolute',
  boxSizing: 'border-box',
  borderStyle: 'solid',
  pointerEvents: 'none',
});

// core Popover는 내용에 안쪽 여백을 주지 않는다.
export const bubbleBody = style({
  display: 'block',
  padding: `${spacing[2]} ${spacing[3]}`,
  fontSize: font.size.sm,
});

// Popover 트리거인 완료 Loader. 버튼의 겉모습은 없애고 크기는 Loader 그대로이며, 포커스 외곽선은 기본을 쓴다.
export const loaderTrigger = style({
  display: 'block',
  padding: 0,
  border: 0,
  background: 'none',
  color: 'inherit',
  lineHeight: 0,
  cursor: 'pointer',
  borderRadius: borderRadius.full,
});

export const field = style({
  width: '16rem',
  maxWidth: '100%',
});

export const cursor = style({
  position: 'absolute',
  top: 0,
  left: 0,
  zIndex: 2,
  pointerEvents: 'none',
  color: color.text.primary,
  transition: 'opacity 150ms',
  selectors: {
    '[data-playing="false"] &': { opacity: 0 },
  },
});

export const control = style({
  position: 'absolute',
  top: spacing[1],
  right: spacing[1],
  zIndex: 3,
});

export const footer = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: spacing[3],
  minHeight: spacing[10],
  marginTop: spacing[3],
});

export const caption = style({
  margin: 0,
  fontSize: font.size.sm,
  fontWeight: font.weight.medium,
  color: color.text.secondary,
});
