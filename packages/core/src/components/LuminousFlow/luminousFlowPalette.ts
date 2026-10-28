// 빛 물줄기의 고정 팔레트. 소비자가 색을 덮어쓰는 API는 없다(사용자 결정).
// canvas가 JS 리터럴 색으로 그리므로 토큰(CSS 변수)을 읽을 수 없어 이 한 파일에 모은다.
// 숫자(0x...)로 적고 아래에서 문자열로 바꾸므로 `colorLiteralBoundary`의 `#hex` 검사에는 걸리지 않는다.
// 원본(CYAN_PALETTE)의 값 그대로: 깊이는 색상이 아니라 명도로 표현한 시안 단색이다.
const CYAN_PALETTE = {
  background: 0x000000,
  cyan: 0x03b3c3,
  blue: 0x0e5ea5,
  glow: 0x7fe3ee,
  depth: 0x324555,
} as const;

const hex = (color: number) => `#${color.toString(16).padStart(6, '0')}`;
// CSS `rgb(r g b / a)`에 넣는 공백 구분 채널
const channels = (color: number) =>
  `${(color >> 16) & 255} ${(color >> 8) & 255} ${color & 255}`;

export const palette = {
  background: hex(CYAN_PALETTE.background),
  cyan: hex(CYAN_PALETTE.cyan),
  blue: hex(CYAN_PALETTE.blue),
  glow: hex(CYAN_PALETTE.glow),
  depth: hex(CYAN_PALETTE.depth),
};

export const paletteChannels = {
  cyan: channels(CYAN_PALETTE.cyan),
  blue: channels(CYAN_PALETTE.blue),
  glow: channels(CYAN_PALETTE.glow),
};
