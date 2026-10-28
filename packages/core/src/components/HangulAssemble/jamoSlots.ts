import type { HangulJamo } from './decomposeHangul';

/** 글자 칸 가운데를 원점으로 한 자모 조각의 자리. x·y는 글자 크기(em) 단위 */
export interface JamoSlot {
  x: number;
  y: number;
  scale: number;
}

// 세로 모음은 초성 오른쪽에, 가로 모음은 초성 아래에, 섞인 모음은 오른쪽 아래로 돌아든다.
const VERTICAL = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅣ';
const HORIZONTAL = 'ㅗㅛㅜㅠㅡ';

/** 조각이 둘이면 칸을 넓게 쓰고, 셋이면 받침 자리까지 내줘야 해서 더 작다. 글자 한 칸 안에 들어가는 크기다 */
const SCALE_TWO = 0.65;
const SCALE_THREE = 0.5;

/**
 * 음절의 모양(모음 방향, 받침 유무)이 정하는 자모의 제자리. 완성 글자의 구조를 흉내 낸 값이라
 * 글꼴마다 정확히 겹치지는 않는다. 교차 페이드가 오차를 가린다.
 */
export const jamoSlots = ({ medial, final }: HangulJamo): JamoSlot[] => {
  const s = final ? SCALE_THREE : SCALE_TWO;
  const at = (x: number, y: number): JamoSlot => ({ x, y, scale: s });

  if (VERTICAL.includes(medial)) {
    return final
      ? [at(-0.2, -0.2), at(0.2, -0.2), at(0, 0.28)]
      : [at(-0.2, 0), at(0.22, 0)];
  }
  if (HORIZONTAL.includes(medial)) {
    return final
      ? [at(0, -0.3), at(0, 0), at(0, 0.3)]
      : [at(0, -0.2), at(0, 0.2)];
  }
  return final
    ? [at(-0.2, -0.28), at(0.1, -0.05), at(0, 0.3)]
    : [at(-0.2, -0.2), at(0.1, 0.15)];
};
