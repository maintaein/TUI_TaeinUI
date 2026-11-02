// 스크롤 속도에 따른 흐름 속도. 배율은 원래 흐름 기준이고 시간은 초 단위다.
export const SCROLL_FLOW = {
  idleSpeed: 0.5,
  maxSpeed: 3.3,
  fullSpeedScroll: 1800, // maxSpeed에 닿는 스크롤 속도(px/s)
  responseTime: 0.18, // 작을수록 스크롤에 빨리 반응한다
  decayTime: 0.3, // 작을수록 스크롤이 멈춘 뒤 빨리 잦아든다
};

// 흐름을 계속 이어 그릴지(rAF를 예약할지) 정하는 유일한 조건이다.
// 축소 모드·탭 숨김·화면 밖·paused 중 하나라도 걸리면 이어 그리지 않는다.
export const shouldAnimate = ({
  reduced,
  hidden,
  visible,
  paused,
}: {
  reduced: boolean;
  hidden: boolean;
  visible: boolean;
  paused: boolean;
}) => !reduced && !hidden && visible && !paused;

// 단조 증가 배열에서 값이 target 이상인 첫 인덱스(없으면 -1). findIndex와 같은 결과를 O(log n)에 낸다.
export const firstIndexAtLeast = (
  sorted: ArrayLike<number>,
  target: number
) => {
  let low = 0;
  let high = sorted.length;
  while (low < high) {
    const middle = (low + high) >> 1;
    if (sorted[middle] >= target) high = middle;
    else low = middle + 1;
  }
  return low === sorted.length ? -1 : low;
};

/**
 * 보이는 구간(top~bottom, 빛번짐 반경 margin 포함)에 닿을 수 있는 구간(점 i와 i+1 사이)의 번호 범위.
 * preMaxY는 점마다 앞쪽 y 최댓값, sufMinY는 뒤쪽 y 최솟값(모든 포즈에 걸쳐, 둘 다 점 번호에 단조)이다. 닿는 구간이 없으면 first가 last보다 크다.
 * 보수적이라 범위 안에 안 보이는 구간이 섞일 수는 있지만 보이는 구간이 빠지지는 않는다.
 */
export const visibleSegments = (
  preMaxY: ArrayLike<number>,
  sufMinY: ArrayLike<number>,
  top: number,
  bottom: number,
  margin = 50
) => {
  const count = preMaxY.length;
  const firstPoint = firstIndexAtLeast(preMaxY, top - margin);
  const afterPoint = firstIndexAtLeast(sufMinY, bottom + margin + 1);
  return {
    first: firstPoint === -1 ? count : Math.max(firstPoint - 1, 0),
    last: Math.min(afterPoint === -1 ? count - 2 : afterPoint - 1, count - 2),
  };
};
