import { decomposeHangul } from './decomposeHangul';

/** 글자 칸에 대한 비율(0~1) 꼭짓점 목록. x는 왼쪽에서, y는 위에서 잰다 */
export type Polygon = ReadonlyArray<readonly [x: number, y: number]>;

export interface JamoRegion {
  kind: 'initial' | 'medial' | 'final';
  /** 호환용 자모(ㅎ, ㅏ, ㄴ). 겹받침·겹모음은 한 덩어리다 */
  jamo: string;
  region: Polygon;
}

const rect = (l: number, t: number, r: number, b: number): Polygon => [
  [l, t],
  [r, t],
  [r, b],
  [l, b],
];

/**
 * 영역의 기준 칸은 글자 크기(1em)의 정사각형이고 가로는 글자 칸의 폭이다.
 * 줄 높이가 달라져도 영역이 같도록 세로는 줄 높이가 아니라 1em 기준이다(polygonCss가 옮긴다).
 *
 * 경계는 자모 사이 빈 곳에 맞췄다. Pretendard(웹폰트)와 Malgun Gothic(시스템 고딕)을
 * 96px와 200px로 가 각 고 곡 과 곽 한 닭 오 보 소 와 위 왕 원 등에서 눈으로 봤다.
 * 초성 모양에 따라 자모 높이가 달라(고의 ㅗ 꼭지는 높고 오의 ㅇ 밑은 낮다) 모든 글자에서
 * 딱 맞는 경계는 없고, 어긋난 획은 날아오는 동안만 보이는 한계다(72px 이상에서 도드라진다).
 */
// 세로 모음: 초성|모음 경계 x
const SPLIT_X = 0.6;
// 가로 모음: 초성|모음 경계 y (받침 없음, 있음)
const HORIZONTAL_Y = [0.54, 0.44] as const;
// 섞인 모음: 초성 아래 ㅗ·ㅜ·ㅡ가 시작하는 y (받침 없음, 있음)
const MIXED_Y = [0.55, 0.48] as const;
// 받침이 있으면 이 y 아래가 받침
const FINAL_Y = 0.65;

/** 모음이 초성 아래와 오른쪽을 감싼 ㄱ자일 때의 꼭짓점. 아래쪽 끝은 받침 있음이면 받침 위다 */
const lShape = (below: number, bottom: number): Polygon => [
  [SPLIT_X, 0],
  [1, 0],
  [1, bottom],
  [0, bottom],
  [0, below],
  [SPLIT_X, below],
];

const SHAPES = {
  vertical: {
    open: [rect(0, 0, SPLIT_X, 1), rect(SPLIT_X, 0, 1, 1)],
    closed: [
      rect(0, 0, SPLIT_X, FINAL_Y),
      rect(SPLIT_X, 0, 1, FINAL_Y),
      rect(0, FINAL_Y, 1, 1),
    ],
  },
  horizontal: {
    open: [rect(0, 0, 1, HORIZONTAL_Y[0]), rect(0, HORIZONTAL_Y[0], 1, 1)],
    closed: [
      rect(0, 0, 1, HORIZONTAL_Y[1]),
      rect(0, HORIZONTAL_Y[1], 1, FINAL_Y),
      rect(0, FINAL_Y, 1, 1),
    ],
  },
  mixed: {
    open: [rect(0, 0, SPLIT_X, MIXED_Y[0]), lShape(MIXED_Y[0], 1)],
    closed: [
      rect(0, 0, SPLIT_X, MIXED_Y[1]),
      lShape(MIXED_Y[1], FINAL_Y),
      rect(0, FINAL_Y, 1, 1),
    ],
  },
} as const satisfies Record<string, Record<string, readonly Polygon[]>>;

const VERTICAL = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅣ';
const HORIZONTAL = 'ㅗㅛㅜㅠㅡ';

/**
 * 한글 음절 한 글자를 자모별 영역으로 나눈다. 음절이 아니거나
 * 결합 부호가 붙은 칸(글자 하나가 아닌 것)이면 null이다.
 */
export const jamoRegions = (char: string): JamoRegion[] | null => {
  const parts = [...char].length === 1 ? decomposeHangul(char) : null;
  if (!parts) return null;
  const shape = VERTICAL.includes(parts.medial)
    ? 'vertical'
    : HORIZONTAL.includes(parts.medial)
      ? 'horizontal'
      : 'mixed';
  const regions = SHAPES[shape][parts.final ? 'closed' : 'open'];
  const jamo = [parts.initial, parts.medial, parts.final];
  const kinds = ['initial', 'medial', 'final'] as const;
  return regions.map((region, i) => ({
    kind: kinds[i],
    jamo: jamo[i] as string,
    region,
  }));
};

/** y 비율을 칸 가운데에서 1em 단위로 잰 값으로 바꾼다. 줄 높이가 달라도 영역이 같은 획을 자른다 */
const yCss = (y: number): string => {
  const offset = Math.round((y - 0.5) * 1e4) / 1e4;
  if (offset === 0) return '50%';
  return `calc(50% ${offset < 0 ? '-' : '+'} ${Math.abs(offset)}em)`;
};

/**
 * `clip-path`에 바로 쓰는 `polygon(...)` 값. 글자 칸(줄 높이 전체)에 걸어 쓴다.
 * x는 칸 폭의 비율이고 y는 칸 가운데를 기준으로 1em을 1로 본다(영역의 기준 칸이 1em 정사각형이라서).
 */
export const polygonCss = (region: Polygon): string =>
  `polygon(${region.map(([x, y]) => `${x * 100}% ${yCss(y)}`).join(', ')})`;
