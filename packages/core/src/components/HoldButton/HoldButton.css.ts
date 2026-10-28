import { style } from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';

const { animation, color, palette } = themeContract;

// Button danger(strong)는 호버(error[800])와 눌림(error[900]) 배경이 채움(error[900])과 같거나 거의
// 같아, 누르는 순간 채움이 배경에 묻힌다. 어느 상태에서도 배경을 error.main으로 고정한다.
// 속성 선택자를 겹쳐 Button의 호버·눌림 규칙(특정도 0,4,0)을 CSS 순서와 무관하게 이긴다.
// 호버 색 피드백은 잃지만, 누르는 동안의 피드백은 채움이 맡는다. 눌림 scale은 그대로 남는다.
export const root = style({
  selectors: {
    '&[data-hold][data-hold][data-hold][data-hold]': {
      backgroundColor: color.error.main,
    },
  },
});

// 채움 막대. 단추 안쪽 전체를 덮고 왼쪽에서부터 scaleX로 차오른다(너비 애니메이션 금지).
// 글자 뒤에 깔리고(글자가 z-index 1), 흰 글자 대비는 채움 위 6.6:1, 배경 위 5.0:1이다.
export const fill = style({
  position: 'absolute',
  inset: 0,
  backgroundColor: palette.error[900],
  transformOrigin: 'left',
  transform: 'scaleX(0)',
  pointerEvents: 'none',
});

// 글자 둘이 한 칸에 겹쳐 쌓이고 보이는 하나만 불투명하다. 칸 너비는 더 긴 글자가 정하므로
// 평소 글자와 무장 글자가 바뀌어도 단추 너비가 변하지 않는다.
export const slot = style({
  position: 'relative',
  zIndex: 1,
  display: 'grid',
  justifyItems: 'center',
  lineHeight: 1.5,
  // 실행 뒤 체크가 이 칸 자리에서 나타난다
  selectors: {
    '&[data-done]': { opacity: 0 },
  },
  transition: `opacity ${animation.duration.fast} ${animation.easing.settle}`,
});

export const text = style({
  gridArea: '1 / 1',
  opacity: 0,
  transition: `opacity ${animation.duration.fast} ${animation.easing.settle}`,
  selectors: {
    '&[data-shown]': { opacity: 1 },
  },
});

// 실행 뒤 체크. 단추 한가운데에 놓이고 spring으로 튕기며 나타난다(GSAP이 scale·opacity를 몰고 간다).
export const check = style({
  position: 'absolute',
  inset: 0,
  zIndex: 1,
  display: 'grid',
  placeItems: 'center',
  pointerEvents: 'none',
});
