import { style } from '@vanilla-extract/css';
import { palette, paletteChannels } from './luminousFlowPalette';

// 부모 상자를 채운다. 부모가 position 기준(relative 등)이어야 한다.
export const root = style({
  position: 'absolute',
  inset: 0,
  overflow: 'hidden',
  isolation: 'isolate',
  pointerEvents: 'none',
  background: palette.background,
});

export const sourceHaze = style({
  position: 'absolute',
  top: 0,
  width: '100%',
  height: '100%',
  // 긴 상자에서도 안개는 첫 화면 높이에만 둔다
  maxHeight: '100svh',
  background: [
    `radial-gradient(ellipse 23% 34% at 40% 69%, rgb(${paletteChannels.cyan} / 12%), transparent 72%)`,
    `radial-gradient(ellipse 34% 29% at 79% 31%, rgb(${paletteChannels.blue} / 9%), transparent 78%)`,
  ].join(', '),
});

// 대기층 SVG. 폭에 맞춰 viewBox 비율대로 펴지고(장면 전체라 상자보다 길 수 있다, 넘침은 루트가 자른다),
// canvas가 그 그림을 텍스처로 넘겨받으면 숨겨진다
export const atmosphere = style({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: 'auto',
});

// 높이와 세로 위치는 컴포넌트가 정한다(보이는 구간만 덮는다)
export const canvas = style({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
});

export const grain = style({
  position: 'absolute',
  inset: 0,
  opacity: 0.13,
  backgroundImage: [
    `radial-gradient(circle, rgb(${paletteChannels.glow} / 38%) .5px, transparent .8px)`,
    `radial-gradient(circle, rgb(${paletteChannels.cyan} / 30%) .5px, transparent .8px)`,
  ].join(', '),
  backgroundSize: '101px 107px, 137px 131px',
  backgroundPosition: '8px 13px, 30px 19px',
});
