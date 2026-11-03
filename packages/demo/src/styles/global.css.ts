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

// 안쪽 2px 테두리가 글자에 닿지 않게 포커스와 무관하게 늘 여유를 주고 같은 만큼 음의 여백으로 글자 자리와 둘레 배치는 그대로 둔다.
// 포커스 때만 주면 그 순간 레이아웃이 움직인다. 링크마다 이웃에 닿지 않는 방향만 쓴다:
// 둘레에 여백이 있는 flex 항목(brand, nav, moreLink)은 사방, 아랫줄과 틈이 없는 FrameCard 제목은 가로만.
// 글 흐름 속 링크(본문 글 링크)는 가로를 쓰지 않는다. 가로 여유는 글자 흐름을 벌리고, 음의 여백으로 상쇄하면 뒤따르는 글자가 테두리에 들어온다.
// 세로는 인라인 padding이 줄 높이와 글자 자리를 바꾸지 않으니 늘 준다(밑줄이 테두리 안에 들어오고 위아래 숨이 생긴다)
globalStyle(':where(main p a)', { paddingBlock: '0.25rem' });

export const linkRoom = {
  padding: '0.25rem',
  margin: '-0.25rem',
} as const;

export const linkRoomInline = {
  paddingInline: '0.25rem',
  marginInline: '-0.25rem',
} as const;

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
