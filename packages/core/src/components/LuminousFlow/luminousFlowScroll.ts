const SCROLLING = new Set(['auto', 'scroll', 'overlay']);

// 가장 가까운 스크롤 조상: overflow-y가 스크롤을 허용하고 실제로 넘치는 것. 없으면 null(창).
// html/body는 창 스크롤이므로 여기서 멈춘다.
// ponytail: 마운트 뒤 부모 구조가 바뀌어 조상이 달라지는 경우는 크기가 바뀔 때 다시 찾는 것으로만 따라간다, 구조 바꿈을 직접 관찰하게 되면 MutationObserver로 바꾼다
export const findScroller = (el: HTMLElement): HTMLElement | null => {
  for (
    let node = el.parentElement;
    node && node !== document.body && node !== document.documentElement;
    node = node.parentElement
  ) {
    if (
      SCROLLING.has(getComputedStyle(node).overflowY) &&
      node.scrollHeight > node.clientHeight
    )
      return node;
  }
  return null;
};

export interface View {
  /** 스크롤 출처의 보이는 창 위·아래(화면 좌표). 창 안으로 잘라 둔다 */
  top: number;
  bottom: number;
  /** 보이는 창의 높이. 화면에 걸쳐 잘리지 않는 값이라 스크롤 중에 변하지 않는다 */
  height: number;
}

export const readView = (scroller: HTMLElement | null): View => {
  if (!scroller) return { top: 0, bottom: innerHeight, height: innerHeight };
  const rect = scroller.getBoundingClientRect();
  return {
    top: Math.max(0, rect.top),
    bottom: Math.min(innerHeight, rect.bottom),
    height: Math.min(scroller.clientHeight, innerHeight),
  };
};

/**
 * 캔버스가 덮을 상자 안 구간(상자 위에서 잰 px). 보이는 창에 걸친 부분의 위아래로 창 높이의 반만큼 여유를 둔다.
 * 높이는 스크롤과 상관없이 같아야 캔버스를 다시 만들지 않으므로 보이는 창 높이의 두 배(또는 상자 전체)다.
 */
export const canvasWindow = (
  boxTop: number,
  boxHeight: number,
  view: View
): { top: number; height: number } => {
  const height = Math.max(1, Math.min(boxHeight, view.height * 2));
  const visibleTop = Math.min(boxHeight, Math.max(0, view.top - boxTop));
  const top = Math.round(
    Math.min(Math.max(0, visibleTop - view.height / 2), boxHeight - height)
  );
  return { top, height };
};
