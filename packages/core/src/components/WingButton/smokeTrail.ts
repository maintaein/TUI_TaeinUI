export interface Point {
  x: number;
  y: number;
}

export interface Bounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface Spray extends Point {
  vx: number;
  vy: number;
}

/**
 * 이번 프레임의 꼬리 분사를 구한다. 꼬리는 진행 반대쪽 끝(오른쪽 위로 날면 왼쪽 아래 모서리)이고,
 * 분사 속도는 직전 프레임 중심과의 차로 구한 진행의 반대 방향에 `speed`(CSS px/초)를 곱한 것이다.
 * 분사하지 않는 경우는 null: 첫 프레임, 움직임이 0.5px 미만, 꼬리 점이 `bounds` 밖, 복제본이 DOM에서 떨어졌을 때.
 * 떨어진 요소의 사각형은 전부 0이라 body 모드(`bounds`가 창 원점부터)에서는 (0,0)이 범위 안으로 읽혀 창 모서리에 뿜어진다.
 */
export const tailSpray = (
  body: Element,
  before: Point | null,
  bounds: Bounds,
  speed: number
): { center: Point | null; spray: Spray | null } => {
  if (!body.isConnected) return { center: before, spray: null };
  const r = body.getBoundingClientRect();
  const center = { x: (r.left + r.right) / 2, y: (r.top + r.bottom) / 2 };
  if (!before) return { center, spray: null };
  const dx = center.x - before.x;
  const dy = center.y - before.y;
  const dist = Math.hypot(dx, dy);
  if (
    dist < 0.5 ||
    r.left < bounds.left ||
    r.left > bounds.right ||
    r.bottom < bounds.top ||
    r.bottom > bounds.bottom
  )
    return { center, spray: null };
  return {
    center,
    spray: {
      x: r.left,
      y: r.bottom,
      vx: (-dx / dist) * speed,
      vy: (-dy / dist) * speed,
    },
  };
};
