import { style } from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';

const { animation, color } = themeContract;

// 채움 막대. 단추 안쪽 전체를 덮고 왼쪽에서부터 scaleX로 차오른다(너비 애니메이션 금지).
// 바탕은 Button light(흰 바탕, 글자 primary[900] 8.63:1)이고 채움은 primary.main이다. 호버(primary[50])와
// 눌림(primary[100]) 배경 위에서도 채움이 또렷해 Button의 호버·눌림 규칙을 그대로 쓴다.
// 채움 위 글자는 흰색이다(primary.main 위 흰 글자 4.60:1, 4.5:1 이상). 채움이 지나간 자리만 흰 글자가
// 되도록 같은 글자를 한 겹 더 얹고 채움과 같은 진행값으로 자른다(아래 ink).
export const fill = style({
  position: 'absolute',
  inset: 0,
  backgroundColor: color.primary.main,
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

// 흰 글자 겹. 단추 전체를 덮는 상자라 채움과 같은 좌표계이고, 가운데 놓인 글자 칸은 아래 겹의 칸과 같은 자리다.
// --hold-v(채움의 현재 scaleX, 축소 모드에서는 단계값)만큼만 왼쪽에서부터 보이게 오른쪽을 자른다.
// 장식이라 aria-hidden이다.
export const ink = style({
  position: 'absolute',
  inset: 0,
  zIndex: 2,
  display: 'grid',
  placeItems: 'center',
  color: color.primary.contrast,
  pointerEvents: 'none',
  clipPath: 'inset(0 calc((1 - var(--hold-v, 0)) * 100%) 0 0)',
});

// 실행 뒤 체크. 단추 한가운데에 놓이고 spring으로 튕기며 나타난다(GSAP이 scale·opacity를 몰고 간다).
// 채움이 가득 찬 뒤라 흰색이다.
export const check = style({
  position: 'absolute',
  inset: 0,
  zIndex: 3,
  display: 'grid',
  placeItems: 'center',
  color: color.primary.contrast,
  pointerEvents: 'none',
});
