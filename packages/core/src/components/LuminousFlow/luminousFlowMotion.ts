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
