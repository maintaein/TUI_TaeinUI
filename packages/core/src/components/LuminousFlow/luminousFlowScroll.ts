const SCROLLING = new Set(['auto', 'scroll', 'overlay']);

// 가장 가까운 스크롤 조상: overflow-y가 스크롤을 허용하고 실제로 넘치는 것. 없으면 null(창).
// html/body에서 멈춘다.
// ponytail: body나 html 자체가 스크롤 상자인 앱(`html, body { height: 100%; overflow: auto }`)은 조상으로 안 치고 창으로 본다. 그런 앱은 window.scrollY가 늘 0이라
// 흐름 빨라짐이 안 걸린다(그림은 getBoundingClientRect가 창 기준이라 정상). 필요해지면 document.scrollingElement의 scrollTop을 위치 합에 더한다
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

// 캔버스 픽셀 예산. 상자 전체를 덮으면 18e5, 보이는 구간만 덮는 긴 상자는 4e5(창을 띄운 실측: 긴 상자에서 18e5는 프레임 중앙값을 33ms에서 50~67ms로 늘렸다).
// 덮는 비율이 1에서 0.5로 줄어드는 동안 둘 사이를 이어서, 상자가 창 높이 두 배를 1px 넘는다고 해상도가 뚝 떨어지지 않게 한다
export const pixelBudget = (canvasHeight: number, boxHeight: number) => {
  const share = Math.min(1, Math.max(0, (canvasHeight / boxHeight - 0.5) * 2));
  return 4e5 + (18e5 - 4e5) * share;
};
