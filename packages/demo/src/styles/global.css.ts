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

// 링크처럼 core가 그리지 않는 요소의 기본 포커스 표시. 이 저장소는 바깥 링을 쓰지 않으므로 core의 면 없는 단추와 같이
// 옅은 면과 가장자리 안쪽 2px로 그린다(크기 그대로).
// :where로 특이도를 0으로 둬 core 컴포넌트와 자기 포커스·면·여백을 가진 링크가 덮이지 않는다
globalStyle(':where(a:focus-visible)', {
  outline: 'none',
  backgroundColor: 'color-mix(in srgb, currentColor 10%, transparent)',
  boxShadow: `inset 0 0 0 2px ${color.primary.main}`,
  borderRadius: '0.25rem',
});

// 글 속 링크(문단 안 링크, 클래스 없는 링크)만: 글자 좌우가 테두리에 닿지 않게 가로 4px 여유를 주고 같은 만큼 음의 여백으로 자리는 그대로 둔다.
// 사이드바·건너뛰기처럼 자기 여백을 가진 링크는 그 여백을 지켜야 해서 이 여유를 주지 않는다
globalStyle(':where(a:not([class]):focus-visible, p a:focus-visible)', {
  paddingInline: '0.25rem',
  marginInline: '-0.25rem',
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
