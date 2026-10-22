import { themeContract } from '@taein-ui/core';
import {
  globalStyle,
  globalFontFace,
  globalKeyframes,
} from '@vanilla-extract/css';

const { color, palette } = themeContract;

const pretendard = 'Pretendard Variable';

globalFontFace(pretendard, {
  src: 'url("/fonts/PretendardVariable.woff2") format("woff2-variations")',
  fontWeight: '45 920',
  fontStyle: 'normal',
  fontDisplay: 'swap',
});

globalStyle('*, *::before, *::after', {
  boxSizing: 'border-box',
  margin: 0,
  padding: 0,
});

globalStyle('html, body', {
  width: '100%',
  height: '100%',
  fontFamily: `"${pretendard}", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`,
  WebkitFontSmoothing: 'antialiased',
  MozOsxFontSmoothing: 'grayscale',
  // 브라우저가 그리는 면도 TUI 파랑을 따른다
  caretColor: color.primary.main,
  accentColor: color.primary.main,
});

globalStyle('::selection', {
  backgroundColor: palette.primary[100],
  color: color.text.primary,
});

// core의 focusRing(2px, offset 2px, border.focus)과 같다. 링크처럼 core가 그리지 않는 요소의 기본 링을 대신한다.
// :where로 특이도를 0으로 둬 core 컴포넌트가 자기 링을 그리는 것을 덮지 않는다
globalStyle(':where(a):focus-visible', {
  outline: `2px solid ${color.border.focus}`,
  outlineOffset: '2px',
});

globalStyle('#root', {
  width: '100%',
  height: '100%',
});

globalStyle('a', {
  textDecoration: 'none',
  color: 'inherit',
});

globalKeyframes('spin', {
  from: { transform: 'rotate(0deg)' },
  to: { transform: 'rotate(360deg)' },
});
