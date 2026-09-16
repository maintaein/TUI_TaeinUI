import { createGlobalTheme, globalStyle } from '@vanilla-extract/css';
import { themeTokens } from './contract';

// 단일 라이트 테마를 :root에 전역 CSS 변수로 선언한다.
// 값 정의는 contract.ts 하나에만 둔다(문서 생성기가 같은 출처를 읽는다).
export const themeContract = createGlobalTheme(':root', themeTokens);

// duration 변수를 덮어쓰는 것만으로는 모자란다. 리터럴로 초를 박은 애니메이션
// (Skeleton의 무한 wave/pulse, Card·BoardRow·Chip·Avatar의 transition 등)은 변수를
// 참조하지 않아 그대로 돈다. 전역 규칙 하나로 범위를 덮는다.
globalStyle('*, *::before, *::after', {
  '@media': {
    '(prefers-reduced-motion: reduce)': {
      animationDuration: '0.01ms !important',
      animationIterationCount: '1 !important',
      transitionDuration: '0.01ms !important',
      // 앵커 이동·scrollIntoView의 부드러운 스크롤도 전정 장애 유발 요인이다.
      // 소비자가 html에 scroll-behavior:smooth를 걸면 그쪽 특정도(0,0,1)가 이
      // 규칙(0,0,0)을 이기므로 !important가 있어야 실제로 덮인다. csstype의
      // ScrollBehavior는 리터럴 유니온이라 !important 문자열을 못 받아 캐스팅한다.
      scrollBehavior: 'auto !important' as unknown as 'auto',
    },
  },
});

// 위 규칙과 중복이 아니다. 소비자가 자기 스타일에서 duration 토큰을 참조하는
// 경우를 위해 변수 자체도 같이 내려둔다.
globalStyle(':root', {
  '@media': {
    '(prefers-reduced-motion: reduce)': {
      vars: {
        [themeContract.animation.duration.fast]: '0.01ms',
        [themeContract.animation.duration.base]: '0.01ms',
        [themeContract.animation.duration.slow]: '0.01ms',
        [themeContract.animation.duration.slower]: '0.01ms',
      },
    },
  },
});
