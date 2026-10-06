import {
  createVar,
  keyframes,
  style,
  styleVariants,
} from '@vanilla-extract/css';
import { themeContract } from '../tokens/theme.css';

// 등장·퇴장은 CSS가 아니라 GSAP 타임라인이 소유한다(M3 T2). 키프레임은 진행 중
// progress를 읽을 수도 되돌릴 수도 없어서 여는 도중 닫으면 시트가 점프했고,
// 드래그는 같은 transform을 놓고 키프레임과 다퉜다.
//
// 유일한 예외가 열린 동안의 float 루프다. 이건 등장·퇴장이 아니라 쉬는 자리
// 주변의 반복이고 되돌릴 상태가 없어서 @keyframes가 맞는 도구다(공통 제약 §2).
// GSAP이 쓰는 `transform`(xPercent·yPercent·y)과 부딪치지 않도록 개별 `translate`
// 속성만 쓴다. 두 속성은 따로 합성된다.

/** 둥실거림이 쉬는 자리에서 떨어지는 거리의 x·y. 방향 변형이 채운다. */
const floatX = createVar();
const floatY = createVar();

/**
 * 0%·100%가 쉬는 자리다. 축소 모드에서 루프가 1회로 접혀도 그 자리에 멈춘다.
 * 방향은 keyframes 하나에 변수로 넘긴다(`var()`는 요소에 붙을 때 풀린다).
 */
const float = keyframes({
  '0%, 100%': { translate: '0 0' },
  '50%': { translate: `${floatX} ${floatY}` },
});

const sheetFloat = style({
  selectors: {
    // 등장이 끝난 뒤에만 `data-floating`이 붙고 시트가 사라질 때까지 그대로다
    // (떼면 `translate`가 0으로 돌아가 시트가 툭 떨어진다). 드래그 중·닫는 중에는
    // 아래 `data-float-paused`가 그 자리에 세운다.
    // 주기는 `loop.base`의 두 배(3s)다. 한 바퀴가 전이가 아니라서 loop 토큰을 쓴다.
    '&[data-floating]': {
      animation: `${float} calc(${themeContract.animation.loop.base} * 2) ${themeContract.animation.easing.drift} infinite`,
    },
    // `animation` 단축 속성이 play-state를 리셋하므로 반드시 위 규칙 **뒤에** 둔다.
    '&[data-float-paused]': {
      animationPlayState: 'paused',
    },
  },
});

/**
 * 시트가 붙은 가장자리에서 3px 떨어지는 방향. 아래 시트는 위로, 오른쪽 시트는 왼쪽으로.
 * `sheetFloat`와 방향 변수는 반드시 짝으로 붙어야 한다(방향이 빠지면 `translate`가
 * 계산 시점에 무효가 되어 둥실거림이 조용히 죽는다). 그래서 둘을 합친 하나를 내보내
 * 소비자가 이것만 붙이게 한다.
 */
export const floatClass = styleVariants(
  {
    bottom: { vars: { [floatX]: '0', [floatY]: '-3px' } },
    right: { vars: { [floatX]: '-3px', [floatY]: '0' } },
    left: { vars: { [floatX]: '3px', [floatY]: '0' } },
  },
  (direction) => [sheetFloat, direction]
);
