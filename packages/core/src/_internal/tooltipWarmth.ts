// 툴바를 훑듯 툴팁을 연달아 볼 때를 위한 인스턴스 사이 공유 상태. Tooltip
// 인스턴스끼리만 보는 값이라 모듈 범위 변수 둘이면 된다. Context나 Provider를
// 두면 소비자가 감쌀 것이 생긴다.

/**
 * 툴팁이 닫힌 뒤 "따뜻한" 상태가 이어지는 시간(ms). 포인터가 옆 트리거로
 * 옮겨 가는 시간이다.
 *
 * `HIDE_GRACE_MS`(300)와 값이 같아도 뜻이 다르다. 그쪽은 같은 트리거에서
 * 자기 툴팁으로 옮겨 가는 동안 닫지 않고 기다리는 시간이고, 이쪽은 닫힌 뒤에
 * 다음 툴팁이 지연과 등장을 건너뛰는 시간이다. 한쪽을 바꿔도 다른 쪽이 따라가면
 * 안 되어서 상수를 나눈다.
 */
export const WARM_MS = 300;

interface OpenTooltip {
  /** 지연도 퇴장 전이도 없이 닫고 DOM을 지운다. 제어 모드는 요청만 한다 */
  close: () => void;
}

// DOM이 남아 있는 툴팁(열려 있거나 퇴장 중). 한 번에 하나만 보이므로 칸 하나다.
let current: OpenTooltip | null = null;
let lastClosedAt = -Infinity;

/** 다른 툴팁이 보이거나 방금 닫혔으면 true */
export const isTooltipWarm = () =>
  current !== null || Date.now() - lastClosedAt < WARM_MS;

/** 자기 말고 보이는 툴팁이 있으면 즉시 닫는다 */
export const closeOtherTooltip = (self: OpenTooltip) => {
  if (current !== null && current !== self) current.close();
};

/** DOM이 남아 있는 동안 자기를 등록한다. 반환값이 등록 해제다 */
export const registerTooltip = (self: OpenTooltip) => {
  current = self;
  return () => {
    if (current === self) current = null;
  };
};

export const markTooltipClosed = () => {
  lastClosedAt = Date.now();
};

/** 테스트 사이에 공유 상태가 새지 않게 한다 */
export const resetTooltipWarmth = () => {
  current = null;
  lastClosedAt = -Infinity;
};
