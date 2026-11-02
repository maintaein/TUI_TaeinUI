import { describe, expect, it } from 'vitest';
import {
  bindFlowListeners,
  createFlowLoop,
  type FlowState,
} from './luminousFlowLoop';

/** 손으로 돌리는 rAF 대기열. 예약된 콜백만 쌓고 flush가 한 번 비운다 */
const manualFrames = () => {
  let next = 1;
  const queue = new Map<number, (now: number) => void>();
  return {
    raf: (callback: (now: number) => void) => {
      queue.set(next, callback);
      return next++;
    },
    caf: (handle: number) => {
      queue.delete(handle);
    },
    pending: () => queue.size,
    flush: (now = 0) => {
      const callbacks = [...queue.values()];
      queue.clear();
      callbacks.forEach((callback) => callback(now));
    },
  };
};

const setup = (initial: Partial<FlowState> = {}) => {
  const state: FlowState = {
    reduced: false,
    hidden: false,
    visible: true,
    paused: false,
    ...initial,
  };
  const frames = manualFrames();
  const log: Array<{ running: boolean }> = [];
  const syncs: boolean[] = [];
  const loop = createFlowLoop({
    readState: () => state,
    onFrame: (_now, running) => log.push({ running }),
    onSync: (running) => syncs.push(running),
    raf: frames.raf,
    caf: frames.caf,
  });
  return { state, frames, log, syncs, loop };
};

describe('createFlowLoop: rAF 예약 규칙', () => {
  it('흐를 때는 프레임마다 다음 프레임을 예약한다', () => {
    const { frames, log, loop } = setup();
    loop.sync();
    expect(frames.pending()).toBe(1);
    frames.flush();
    frames.flush();
    expect(log).toEqual([{ running: true }, { running: true }]);
    expect(frames.pending()).toBe(1);
  });

  // 무엇을 되돌리면 빨개지는가: shouldAnimate에서 paused를 빼거나 tick이 running과 무관하게 예약하면 빨개진다
  it('paused면 정지 장면 한 장만 그리고 다음 프레임을 예약하지 않는다', () => {
    const { frames, log, loop } = setup({ paused: true });
    loop.sync();
    expect(frames.pending()).toBe(1);
    frames.flush();
    expect(log).toEqual([{ running: false }]);
    expect(frames.pending()).toBe(0);
  });

  it('흐르다 paused가 되면 다음 프레임에서 루프가 끊기고 풀고 sync하면 다시 이어진다', () => {
    const { state, frames, log, loop } = setup();
    loop.sync();
    frames.flush();
    state.paused = true;
    frames.flush();
    expect(log.at(-1)).toEqual({ running: false });
    expect(frames.pending()).toBe(0);
    state.paused = false;
    loop.sync();
    frames.flush();
    expect(log.at(-1)).toEqual({ running: true });
    expect(frames.pending()).toBe(1);
  });

  it('축소 모드면 정지 장면 한 장만 그린다', () => {
    const { frames, log, loop } = setup({ reduced: true });
    loop.sync();
    frames.flush();
    expect(log).toEqual([{ running: false }]);
    expect(frames.pending()).toBe(0);
  });

  it('탭이 숨겨졌거나 화면 밖이면 아무것도 예약하지 않는다', () => {
    const hidden = setup({ hidden: true });
    hidden.loop.sync();
    expect(hidden.frames.pending()).toBe(0);
    const offscreen = setup({ visible: false });
    offscreen.loop.sync();
    expect(offscreen.frames.pending()).toBe(0);
  });

  it('sync는 이미 예약된 프레임을 취소하고 하나만 남긴다', () => {
    const { frames, loop } = setup();
    loop.sync();
    loop.sync();
    loop.sync();
    expect(frames.pending()).toBe(1);
  });

  it('sync는 onSync에 이어 그릴 상태인지 알려 준다(paused면 false)', () => {
    const { state, syncs, loop } = setup();
    loop.sync();
    state.paused = true;
    loop.sync();
    expect(syncs).toEqual([true, false]);
  });

  it('redrawIfIdle은 이어 그리지 않을 때만 한 장을 예약한다', () => {
    const running = setup();
    running.loop.redrawIfIdle();
    expect(running.frames.pending()).toBe(0);
    const idle = setup({ paused: true });
    idle.loop.redrawIfIdle();
    expect(idle.frames.pending()).toBe(1);
  });

  it('stop은 예약된 프레임을 걷는다', () => {
    const { frames, loop } = setup();
    loop.sync();
    loop.stop();
    expect(frames.pending()).toBe(0);
  });
});

describe('bindFlowListeners: 구독 등록과 해제', () => {
  const targets = () => {
    const calls = { scroll: 0, wheel: 0, sync: 0 };
    const win = new EventTarget();
    const doc = new EventTarget();
    const media = new EventTarget();
    const unbind = bindFlowListeners({
      win,
      doc,
      media,
      onScroll: () => calls.scroll++,
      onWheel: () => calls.wheel++,
      onSync: () => calls.sync++,
    });
    const fireAll = () => {
      win.dispatchEvent(new Event('scroll'));
      win.dispatchEvent(new Event('wheel'));
      doc.dispatchEvent(new Event('visibilitychange'));
      media.dispatchEvent(new Event('change'));
    };
    return { calls, fireAll, unbind };
  };

  it('등록한 핸들러가 각 이벤트에 불린다', () => {
    const { calls, fireAll } = targets();
    fireAll();
    expect(calls).toEqual({ scroll: 1, wheel: 1, sync: 2 });
  });

  // 무엇을 되돌리면 빨개지는가: 해제 함수에서 removeEventListener 줄 하나를 지우면 그 이벤트의 호출 수가 남는다
  it('해제 함수 뒤에는 어느 핸들러도 불리지 않는다', () => {
    const { calls, fireAll, unbind } = targets();
    unbind();
    fireAll();
    expect(calls).toEqual({ scroll: 0, wheel: 0, sync: 0 });
  });
});

describe('bindFlowListeners: 스크롤 상자 안의 scroll', () => {
  // 무엇을 되돌리면 빨개지는가: scroll 구독의 capture를 빼면 스크롤 상자의 scroll(거품이 일지 않는다)이 창에 닿지 않는다
  it('창 안 스크롤 상자의 scroll도 받고, 해제하면 받지 않는다', () => {
    let scrolls = 0;
    const box = document.createElement('div');
    document.body.append(box);
    const unbind = bindFlowListeners({
      win: window,
      doc: document,
      media: new EventTarget(),
      onScroll: () => scrolls++,
      onWheel: () => {},
      onSync: () => {},
    });
    box.dispatchEvent(new Event('scroll'));
    expect(scrolls).toBe(1);
    unbind();
    box.dispatchEvent(new Event('scroll'));
    expect(scrolls).toBe(1);
    box.remove();
  });
});
