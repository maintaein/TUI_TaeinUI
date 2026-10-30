import { style } from '@vanilla-extract/css';

// 시각적으로만 숨긴 낭독용 글자가 이 루트를 기준으로 놓이게 한다.
export const root = style({
  position: 'relative',
});

// 글자 칸. 완성 글자가 칸의 크기를 정하고 획 조각은 그 위에 겹친다.
export const cell = style({
  position: 'relative',
  display: 'inline-block',
});

// 인쇄에서는 재생 중이던 인라인 값을 !important로 이겨 언제나 완성 문장만 보이게 한다.
export const glyph = style({
  display: 'inline-block',
  '@media': {
    print: { opacity: '1 !important' },
  },
});

// 마스크 진행 --brush-p(0 → 1)와 먹 번짐 --brush-bleed(옅은 정도)는 JS(GSAP)가 인라인으로 건다.
// 조각마다 --brush-dir·from·to(쓸기 방향과 영역이 놓인 구간, 0~1)가 인라인으로 온다.
// 이 값들이 없는 쉬는 상태에서는 var()가 무효라 mask-image·text-shadow가 계산 시점에 none으로 떨어진다.
//
// 붓 끝: 진행 p일 때 앞쪽 stop(보임)과 뒤쪽 stop(안 보임) 사이 FEATHER(구간 좌표의 0.3)가 부드러운 가장자리다.
// p=0이면 구간 전체가 안 보이고 p=1이면 구간 끝에서 FEATHER만큼 더 가 구간 전체가 보인다.
// 마스크 상자는 1em 정사각형이라(자모 영역의 기준과 같다) 영역 좌표가 그대로 마스크 좌표다.
// 한글이 아닌 글자만 --brush-h: 100%로 칸 전체를 쓴다. black은 보이는 색이 아니라 알파만 쓰는 마스크 값이다.
const FEATHER = 0.3;
const edge = `var(--brush-from) + var(--brush-p) * (var(--brush-to) - var(--brush-from) + ${FEATHER})`;

// 먹 번짐: 같은 색(currentColor)의 옅은 가장자리. 색 비율을 --brush-bleed로 줄여 걷는다. filter: blur를 트윈하지 않는다.
export const stroke = style({
  position: 'absolute',
  inset: 0,
  whiteSpace: 'nowrap',
  display: 'none',
  pointerEvents: 'none',
  userSelect: 'none',
  maskImage: `linear-gradient(var(--brush-dir), black calc((${edge} - ${FEATHER}) * 100%), transparent calc((${edge}) * 100%))`,
  maskSize: '100% var(--brush-h, 1em)',
  maskPosition: '0 50%',
  maskRepeat: 'no-repeat',
  textShadow:
    '0 0 0.06em color-mix(in srgb, currentColor calc(var(--brush-bleed) * 100%), transparent)',
  '@media': {
    print: { display: 'none !important' },
  },
});
