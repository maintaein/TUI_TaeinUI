import { themeContract } from '@taein-ui/core';
import { globalFontFace, globalStyle, style } from '@vanilla-extract/css';

const { color, spacing } = themeContract;

const brush = 'Nanum Brush Script';

// 나눔붓글씨(OFL)를 자체 호스팅한다. 이 파일은 붓글씨 글자 상세와 미니를 쓰는 화면 묶음에만 들어오고,
// @font-face는 그 글꼴을 실제로 쓰는 글자가 그려질 때만 내려받으므로 미리 불러오기(preload)는 하지 않는다.
// 서브셋하지 않는다: 데모에서 다른 글을 넣어도 붓글씨로 나와야 한다.
globalFontFace(brush, {
  src: 'url("/fonts/NanumBrushScript-Regular.woff2") format("woff2")',
  fontWeight: 'normal',
  fontStyle: 'normal',
  fontDisplay: 'swap',
});

// as가 h1이든 p든 무대 속 글자는 같은 크기로 보인다(as는 의미만 바꾼다). 붓 글꼴은 획이 가늘어 본문보다 크게 쓴다
export const sentence = style({
  margin: 0,
  fontFamily: `'${brush}', 'Pretendard Variable', sans-serif`,
  fontSize: '2.75rem',
  fontWeight: 400,
  lineHeight: 1.5,
  color: color.text.primary,
  textAlign: 'center',
  wordBreak: 'keep-all',
  textWrap: 'balance',
});

export const stack = style({
  display: 'grid',
  justifyItems: 'center',
  gap: spacing[5],
});

// 움직임 멈춤: 쓰기 값이 인라인으로 걸려도 완성 글자만 보인다(core의 인쇄 규칙과 같은 방식). core에는 멈춤 prop이 없다
export const still = style({});
globalStyle(`${still} [data-brush-glyph]`, {
  opacity: '1 !important',
});
globalStyle(`${still} [data-brush-canvas]`, { display: 'none !important' });
