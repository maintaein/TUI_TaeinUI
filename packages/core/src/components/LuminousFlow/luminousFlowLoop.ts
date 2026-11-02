import { shouldAnimate } from './luminousFlowMotion';

export interface FlowState {
  reduced: boolean;
  hidden: boolean;
  visible: boolean;
  paused: boolean;
}

interface FlowLoopOptions {
  readState: () => FlowState;
  /** 한 프레임을 그린다. running이 false면 시간을 흘리지 않는 정지 장면 한 장이다 */
  onFrame: (now: number, running: boolean) => void;
  /** sync 때 시계·속도를 새로 잡는다. running은 sync 시점에 이어 그릴 상태인지다 */
  onSync: (running: boolean) => void;
  raf?: (callback: (now: number) => void) => number;
  caf?: (handle: number) => void;
}

// 그리기 루프의 예약 규칙을 한 곳에 모은다. 이어 그리는지는 shouldAnimate 하나로만 정한다
// (축소 모드·탭 숨김·화면 밖·paused). 이어 그리지 않을 때도 보이면 정지 장면 한 장은 그린다.
export const createFlowLoop = ({
  readState,
  onFrame,
  onSync,
  raf = (callback) => requestAnimationFrame(callback),
  caf = (handle) => cancelAnimationFrame(handle),
}: FlowLoopOptions) => {
  let frame = 0;
  const animating = () => shouldAnimate(readState());
  const tick = (now: number) => {
    frame = 0;
    const running = animating();
    onFrame(now, running);
    if (running) frame = raf(tick);
  };
  const sync = () => {
    caf(frame);
    frame = 0;
    onSync(animating());
    const { hidden, visible } = readState();
    if (!hidden && visible) frame = raf(tick);
  };
  return {
    animating,
    sync,
    // 이어 그리지 않는 동안(정지 장면)에는 크기·텍스처·스크롤이 바뀔 때 한 번 다시 그려야 한다
    redrawIfIdle: () => {
      if (!animating()) sync();
    },
    stop: () => {
      caf(frame);
      frame = 0;
    },
  };
};

interface FlowListenerTargets {
  win: EventTarget;
  doc: EventTarget;
  media: EventTarget;
  /** 없으면 scroll을 구독하지 않는다 */
  onScroll?: () => void;
  /** 없으면 wheel을 구독하지 않는다 */
  onWheel?: (event: WheelEvent) => void;
  onSync: () => void;
}

// 창·문서·미디어 질의 구독을 한 곳에서 걸고 한 번에 걷는다(해제 함수를 돌려준다)
export const bindFlowListeners = ({
  win,
  doc,
  media,
  onScroll,
  onWheel,
  onSync,
}: FlowListenerTargets) => {
  const wheel = onWheel as EventListener | undefined;
  // 캡처: 창 안 모든 스크롤 상자의 scroll도 받는다(scroll은 거품이 일지 않는다)
  if (onScroll)
    win.addEventListener('scroll', onScroll, { passive: true, capture: true });
  if (wheel) win.addEventListener('wheel', wheel, { passive: true });
  media.addEventListener('change', onSync);
  doc.addEventListener('visibilitychange', onSync);
  return () => {
    if (onScroll)
      win.removeEventListener('scroll', onScroll, { capture: true });
    if (wheel) win.removeEventListener('wheel', wheel);
    media.removeEventListener('change', onSync);
    doc.removeEventListener('visibilitychange', onSync);
  };
};
