import { style, keyframes } from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';

export const iconBase = style({
  display: 'inline-block',
  verticalAlign: 'middle',
  flexShrink: 0,
  userSelect: 'none',
});

// 이전 모양의 선이 다음 모양으로 흘러간다(장식계, 명제 §3) — 등장 획만
// 구현한다(브리프 판정: 모양 보간·퇴장 획은 M3, 상태가 필요해 Tier A 경계가
// 깨진다). 모양 교체마다 Icon.tsx의 key={name}이 path를 다시 마운트시키므로
// 매번 새로 그려진다 — 마운트 1회성이고 되돌아갈 상태가 없어 조항 1 밖이다
// (공통 제약 §2). @keyframes가 맞는 도구다.
// 축소 모드(공통 제약 §6): base가 strokeDashoffset: 0(다 그려진 상태)이고
// 0%만 1이다 — duration이 0.01ms로 줄어도 즉시 완성된 모양이 보인다.
const draw = keyframes({
  '0%': { strokeDashoffset: 1 },
});

// pathLength="1" 정규화가 핵심이다 — 아이콘마다 실제 경로 길이가 달라
// dasharray를 리터럴로 9개 박아야 하는데 CSS는 경로 길이를 읽을 수 없다.
// 정규화하면 dasharray/dashoffset을 0~1 사이 값 하나로 통일해 쓸 수 있다.
export const iconPath = style({
  strokeDasharray: 1,
  strokeDashoffset: 0,
  animation: `${draw} ${themeContract.animation.duration.slow} ${themeContract.animation.easing.settle} forwards`,
});
