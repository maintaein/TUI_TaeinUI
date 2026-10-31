import { style } from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';

const { color, font, spacing } = themeContract;

// 기본 폭 7.5rem(120px). 폭은 부모(className)가 정하고 그릇은 폭에서 높이를 얻는다(viewBox 비율).
export const root = style({
  display: 'inline-flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: spacing[2],
  width: `calc(${spacing[20]} * 1.5)`,
});

// 그릇이 1도 남짓 기울 때 꼭짓점이 viewBox 밖으로 나가도 잘리지 않게 한다
export const bowl = style({
  display: 'block',
  width: '100%',
  height: 'auto',
  overflow: 'visible',
});

// 선 굵기는 그릇 크기를 따르지 않고 화면 픽셀로 고정한다
const line = { vectorEffect: 'non-scaling-stroke' } as const;

// 그릇 윤곽. primary.main은 흰 바탕에서 4.6:1이라 비텍스트 대비 3:1을 넘는다
export const outline = style({
  ...line,
  fill: 'none',
  stroke: color.primary.main,
  strokeWidth: '2px',
  strokeLinejoin: 'round',
});

// 깊이에 따라 짙어지는 세로 그라디언트. 맨 위(가장 밝은 단계)도 흰 바탕에서 3:1을 넘도록
// light와 main을 반씩 섞었다(light 단독은 2.65:1이고 이 섞음은 3.47:1)
export const stopTop = style({
  stopColor: `color-mix(in srgb, ${color.primary.light} 50%, ${color.primary.main})`,
});
export const stopMid = style({ stopColor: color.primary.main });
export const stopBottom = style({ stopColor: color.primary.dark });

// 뒤 물결: 위상이 다른 반투명 층. 앞 물결 뒤에 깔려 수면 위로 솟은 쪽만 보인다
export const backWave = style({
  fill: color.primary.light,
  fillOpacity: 0.55,
});

// 수면의 밝은 테두리. 흰빛이 도는 가는 선이라 물 위쪽 가장자리가 반짝여 보인다
export const rim = style({
  ...line,
  fill: 'none',
  stroke: `color-mix(in srgb, ${color.primary.light} 40%, ${color.primary.contrast})`,
  strokeWidth: '2.5px',
  strokeLinejoin: 'round',
});

// 그릇 안쪽 왼벽을 따라 흐르는 세로 광택 띠
export const gloss = style({
  ...line,
  fill: 'none',
  stroke: color.primary.contrast,
  strokeOpacity: 0.4,
  strokeWidth: '3px',
  strokeLinecap: 'round',
});

// 거품 고리의 가는 하이라이트
export const bubble = style({
  ...line,
  fill: 'none',
  stroke: color.primary.contrast,
  strokeOpacity: 0.7,
  strokeWidth: '1.5px',
});

// 이름표. Slider 같은 폼 계열의 label 글자 스타일이다.
export const label = style({
  fontFamily: font.family.sans,
  fontSize: font.size.sm,
  fontWeight: font.weight.medium,
  color: color.text.primary,
  textAlign: 'center',
  wordBreak: 'keep-all',
});

export const value = style({
  fontFamily: font.family.sans,
  fontSize: font.size.sm,
  fontWeight: font.weight.semibold,
  color: color.primary.dark,
  textAlign: 'center',
  wordBreak: 'keep-all',
  // 숫자 글자 폭이 값마다 달라 줄이 흔들리지 않게 한다
  fontVariantNumeric: 'tabular-nums',
});
