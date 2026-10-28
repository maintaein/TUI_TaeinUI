/** 가로로 퍼지는 최대 배율. IconButton 호버 젤리(1.15)와 같은 성격이고, 글자는 아이콘보다 작아 더 크게 잡았다 */
export const JELLY_STRETCH = 1.3;

/** 퍼짐이 닿는 거리(글자 폭 단위). 선형으로 줄어 한 칸이면 절반, 두 칸이면 0이다 */
const REACH = 2;

/**
 * 커서에서 글자 칸 가운데까지의 거리(글자 폭 단위)로 퍼짐 배율을 구한다.
 * 세로는 1 / 가로라 부피가 지켜진다(IconButton 젤리와 같다).
 */
export const jellyScale = (
  distance: number
): { scaleX: number; scaleY: number } => {
  const scaleX =
    1 + (JELLY_STRETCH - 1) * Math.max(0, 1 - Math.abs(distance) / REACH);
  return { scaleX, scaleY: 1 / scaleX };
};
