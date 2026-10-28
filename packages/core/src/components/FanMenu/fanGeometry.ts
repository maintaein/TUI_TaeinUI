// 부채꼴 메뉴의 호 기하. DOM을 모르는 순수 함수라 단위 시험이 된다.

/** 허브 가운데에서 항목 가운데까지의 반지름(px) */
export const FAN_RADIUS = 104;
/** 가리킨 항목이 바깥으로 밀리는 거리(px) */
export const FAN_PUSH = 14;
// 방향 추적이 먹는 거리. 허브 위(36px 안쪽)와 호에서 한참 먼 곳(230px 밖)은 가리킴이 아니다
const REACH_MIN = 36;
const REACH_MAX = 230;

/** i번째 항목의 각도(도). 왼쪽 180도에서 오른쪽 0도로 균등하게 나뉜다. 항목이 하나면 위쪽 90도 */
export const fanAngle = (index: number, count: number): number =>
  count < 2 ? 90 : 180 - index * (180 / (count - 1));

/** i번째 항목이 허브 가운데에서 반지름 radius에 놓일 때의 화면 좌표 변위(y는 아래가 양수) */
export const fanOffset = (
  index: number,
  count: number,
  radius: number
): { x: number; y: number } => {
  const rad = (fanAngle(index, count) * Math.PI) / 180;
  return { x: Math.cos(rad) * radius, y: -Math.sin(rad) * radius };
};

/**
 * 허브 가운데에서 포인터까지의 변위(dx는 오른쪽, dy는 위쪽이 양수)에서 가장 가까운 항목의 번호.
 * 허브 가까이(36px 안쪽)나 멀리(230px 밖)면 -1이다. 호 아래쪽 각도는 가까운 쪽 끝(0도나 180도)으로 붙는다.
 */
export const nearestFanItem = (
  dx: number,
  dy: number,
  count: number
): number => {
  const distance = Math.hypot(dx, dy);
  if (count < 1 || distance < REACH_MIN || distance > REACH_MAX) return -1;
  let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  if (angle < 0) angle = angle > -90 ? 0 : 180;
  let best = 0;
  for (let i = 1; i < count; i++) {
    if (
      Math.abs(angle - fanAngle(i, count)) <
      Math.abs(angle - fanAngle(best, count))
    )
      best = i;
  }
  return best;
};
