import type { HangulJamo } from './decomposeHangul';

/** 글자 칸 가운데를 원점으로 한 자모 조각의 자리. x·y는 글자 크기(em) 단위 */
export interface JamoSlot {
  x: number;
  y: number;
  scale: number;
}

type Point = readonly [x: number, y: number];

/**
 * 음절 모양별 자리 표. 완성 글자의 구조(초성, 모음, 받침이 차지하는 칸)를 흉내 낸 값이고,
 * 글자 크기 96px의 Storybook 프레임에서 겹침이 적도록 눈으로 맞췄다. 글꼴 하나의 측정값이 아니라
 * 글꼴마다 조금씩 어긋나며, 교차 페이드가 그 차이를 가린다.
 * 각 줄은 [초성, 모음] 또는 받침이 있으면 [초성, 모음, 받침].
 * 세로 모음(ㅏ ㅣ 등)은 초성 오른쪽, 가로 모음(ㅗ ㅜ ㅡ 등)은 초성 아래, 섞인 모음(ㅘ ㅢ 등)은 오른쪽 아래다.
 */
const SLOTS = {
  vertical: {
    open: [
      [-0.2, 0],
      [0.22, 0],
    ],
    closed: [
      [-0.2, -0.2],
      [0.2, -0.2],
      [0, 0.28],
    ],
  },
  horizontal: {
    open: [
      [0, -0.2],
      [0, 0.2],
    ],
    closed: [
      [0, -0.3],
      [0, 0],
      [0, 0.3],
    ],
  },
  mixed: {
    open: [
      [-0.2, -0.2],
      [0.1, 0.15],
    ],
    closed: [
      [-0.2, -0.28],
      [0.1, -0.05],
      [0, 0.3],
    ],
  },
} as const satisfies Record<string, Record<string, readonly Point[]>>;

const VERTICAL = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅣ';
const HORIZONTAL = 'ㅗㅛㅜㅠㅡ';

/** 조각이 둘이면 칸을 넓게 쓰고, 셋이면 받침 자리까지 내줘야 해서 더 작다. 글자 한 칸 안에 들어가는 크기다 */
const SCALE_TWO = 0.65;
const SCALE_THREE = 0.5;

/** 음절의 모양(모음 방향, 받침 유무)이 정하는 자모의 제자리 */
export const jamoSlots = ({ medial, final }: HangulJamo): JamoSlot[] => {
  const shape = VERTICAL.includes(medial)
    ? 'vertical'
    : HORIZONTAL.includes(medial)
      ? 'horizontal'
      : 'mixed';
  const scale = final ? SCALE_THREE : SCALE_TWO;
  return SLOTS[shape][final ? 'closed' : 'open'].map(([x, y]) => ({
    x,
    y,
    scale,
  }));
};
