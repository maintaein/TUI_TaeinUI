import { style, globalStyle } from '@vanilla-extract/css';
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
  background: [
    `radial-gradient(ellipse 23% 34% at 40% 69%, rgb(${paletteChannels.cyan} / 12%), transparent 72%)`,
    `radial-gradient(ellipse 34% 29% at 79% 31%, rgb(${paletteChannels.blue} / 9%), transparent 78%)`,
  ].join(', '),
});

// 긴 물길 상자에서는 안개를 첫 화면 높이에만 둔다
export const scrollScene = style({});
globalStyle(`${scrollScene} ${sourceHaze}`, { height: '100svh' });

// 대기층 SVG. canvas가 그 그림을 텍스처로 넘겨받으면 숨겨진다
export const atmosphere = style({
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
});

export const canvas = style({
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
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
