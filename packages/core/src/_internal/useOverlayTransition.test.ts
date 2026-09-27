/**
 * M3 T2 — 오버레이 전이 훅. 세 오버레이(Modal·BottomSheet·SideSheet)가 각자
 * 갖고 있던 `shouldRender` 수명 + 퇴장 타이머를 한 곳으로 모으고, 등장·퇴장을
 * **같은 GSAP 타임라인의 양방향**으로 만든 자리다.
 *
 * jsdom + fake timer 환경에서 GSAP 티커는 한 번도 돌지 않는다(rAF 틱이 없다).
 * 그래서 진행 중 상태는 `advanceTimersByTime`이 아니라 타임라인을 직접
 * `progress()`로 seek해 만든다 — 실제 GSAP 인스턴스를 조작하는 것이므로
 * 목킹이 아니다. 동시에 이게 "타이머가 권위다"라는 설계의 이유이기도 하다:
 * 애니메이션 완료 콜백은 오지 않을 수 있다.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { gsapDuration, gsapEasing } from '../tokens/gsapEasing';
import { useOverlayTransition } from './useOverlayTransition';

/** 등장 길이. 시트 300ms + 백드롭 200ms 동시 시작 = 타임라인 길이 300ms. */
const ENTER_MS = 300;
/** 퇴장은 등장의 65% — 전부 재생된 타임라인의 퇴장 길이. */
const FULL_EXIT_MS = ENTER_MS * 0.65;

let sheet: HTMLDivElement;
let backdropEl: HTMLDivElement;

/** 세 오버레이가 훅에 넘기는 것과 같은 모양의 실제 타임라인. */
const buildTimeline = (timeline: gsap.core.Timeline): void => {
  timeline.fromTo(
    backdropEl,
    { opacity: 0 },
    { opacity: 1, duration: gsapDuration.base, ease: gsapEasing.settle },
    0
  );
  timeline.fromTo(
    sheet,
    { yPercent: 100 },
    { yPercent: 0, duration: gsapDuration.slow, ease: gsapEasing.settle },
    0
  );
};

/** jsdom은 matchMedia를 구현하지 않는다 — 축소 선호 경로를 열려면 깔아야 한다. */
const installReducedMotion = (): void => {
  vi.stubGlobal(
    'matchMedia',
    (media: string): MediaQueryList =>
      ({
        matches: true,
        media,
        addEventListener: () => {},
        removeEventListener: () => {},
      }) as unknown as MediaQueryList
  );
};

const setup = (
  open: boolean,
  options: {
    onExited?: () => void;
    build?: (timeline: gsap.core.Timeline) => void;
  } = {}
) =>
  renderHook(
    ({ open: isOpen }: { open: boolean }) =>
      useOverlayTransition({
        open: isOpen,
        buildTimeline: options.build ?? buildTimeline,
        onExited: options.onExited,
      }),
    { initialProps: { open } }
  );

beforeEach(() => {
  vi.useFakeTimers();
  backdropEl = document.createElement('div');
  sheet = document.createElement('div');
  document.body.append(backdropEl, sheet);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  backdropEl.remove();
  sheet.remove();
});

describe('useOverlayTransition — shouldRender 수명', () => {
  it('open이 true면 처음부터 shouldRender가 true다', () => {
    const { result } = setup(true);
    expect(result.current.shouldRender).toBe(true);
  });

  it('open이 false로 시작하면 아무것도 렌더하지 않고 타임라인도 만들지 않는다', () => {
    const build = vi.fn(buildTimeline);
    const { result } = setup(false, { build });

    expect(result.current.shouldRender).toBe(false);
    expect(result.current.timelineRef.current).toBeNull();
    expect(build).not.toHaveBeenCalled();
  });

  it('open이 꺼져도 즉시 내려가지 않는다 — 퇴장이 재생될 자리를 남긴다', () => {
    const { result, rerender } = setup(true);
    act(() => {
      result.current.timelineRef.current?.progress(1);
    });

    rerender({ open: false });

    expect(result.current.shouldRender).toBe(true);
  });

  it('퇴장 타이머가 끝나면 shouldRender가 내려가고 onExited가 불린다', () => {
    const onExited = vi.fn();
    const { result, rerender } = setup(true, { onExited });
    act(() => {
      result.current.timelineRef.current?.progress(1);
    });

    rerender({ open: false });
    act(() => {
      vi.advanceTimersByTime(FULL_EXIT_MS);
    });

    expect(result.current.shouldRender).toBe(false);
    expect(onExited).toHaveBeenCalledTimes(1);
  });
});

describe('useOverlayTransition — 퇴장은 등장의 65%', () => {
  it('전부 열린 상태에서 닫으면 퇴장 길이가 등장의 65%다 (조항 3의 60~70%)', () => {
    const { result, rerender } = setup(true);
    act(() => {
      result.current.timelineRef.current?.progress(1);
    });

    rerender({ open: false });

    // 194ms에는 아직 살아 있다.
    act(() => {
      vi.advanceTimersByTime(FULL_EXIT_MS - 1);
    });
    expect(result.current.shouldRender).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.shouldRender).toBe(false);
  });

  it('남은 시간을 타임라인에서 읽는다 — 절반만 열린 상태면 절반만 붙들고 있는다', () => {
    const { result, rerender } = setup(true);
    act(() => {
      result.current.timelineRef.current?.progress(0.5);
    });

    rerender({ open: false });

    // 전부 열렸을 때의 195ms가 아니라 그 절반(97.5ms)이 지나면 사라져야 한다.
    act(() => {
      vi.advanceTimersByTime(FULL_EXIT_MS / 2);
    });

    expect(result.current.shouldRender).toBe(false);
  });
});

describe('useOverlayTransition — 중단 (명제 조항 1)', () => {
  it('여는 도중 닫으면 현재 progress에서 역방향으로 이어진다 — 0이나 1로 점프하지 않는다', () => {
    const { result, rerender } = setup(true);
    const timeline = result.current.timelineRef.current;
    expect(timeline).not.toBeNull();

    act(() => {
      timeline?.progress(0.42);
    });

    rerender({ open: false });

    // 점프했다면 0(퇴장 시작값)이나 1(등장 종료값)에서 출발한다.
    expect(timeline?.progress()).toBeCloseTo(0.42, 5);
    expect(timeline?.reversed()).toBe(true);
  });

  it('닫는 도중 다시 열면 현재 progress에서 정방향으로 이어진다', () => {
    const { result, rerender } = setup(true);
    const timeline = result.current.timelineRef.current;

    act(() => {
      timeline?.progress(0.7);
    });
    rerender({ open: false });
    act(() => {
      timeline?.progress(0.55);
    });

    rerender({ open: true });

    expect(timeline?.progress()).toBeCloseTo(0.55, 5);
    expect(timeline?.reversed()).toBe(false);
    expect(timeline?.timeScale()).toBe(1);
  });

  it('타임라인을 한 번만 만든다 — 상태가 바뀔 때마다 새로 만들면 현재 위치를 잃는다', () => {
    const build = vi.fn(buildTimeline);
    const { result, rerender } = setup(true, { build });
    const first = result.current.timelineRef.current;

    rerender({ open: false });
    rerender({ open: true });
    rerender({ open: false });
    rerender({ open: true });

    expect(build).toHaveBeenCalledTimes(1);
    expect(result.current.timelineRef.current).toBe(first);
  });

  it('연타해도 최종 상태가 정확하다 — 닫힘으로 끝나면 반드시 사라진다', () => {
    const { result, rerender } = setup(true);
    act(() => {
      result.current.timelineRef.current?.progress(1);
    });

    for (const open of [false, true, false, true, false]) {
      rerender({ open });
    }
    act(() => {
      vi.advanceTimersByTime(FULL_EXIT_MS);
    });

    expect(result.current.shouldRender).toBe(false);
  });

  it('연타해도 최종 상태가 정확하다 — 열림으로 끝나면 살아 있고 정방향이다', () => {
    const onExited = vi.fn();
    const { result, rerender } = setup(true, { onExited });
    const timeline = result.current.timelineRef.current;
    act(() => {
      timeline?.progress(1);
    });

    for (const open of [false, true, false, true]) {
      rerender({ open });
    }
    act(() => {
      vi.advanceTimersByTime(FULL_EXIT_MS * 2);
    });

    expect(result.current.shouldRender).toBe(true);
    expect(timeline?.reversed()).toBe(false);
    // 중간에 스쳐 간 close가 퇴장을 확정했다면 여기가 잡는다 — shouldRender는
    // 렌더 단계의 `open && !shouldRender` 되살림이 증상을 지워 버려서 못 잡는다.
    expect(onExited).not.toHaveBeenCalled();
  });
});

describe('useOverlayTransition — 완료 콜백에 의존하지 않는다', () => {
  it('onReverseComplete가 먼저 와도 타이머와 합쳐 onExited가 한 번만 불린다', () => {
    const onExited = vi.fn();
    const { result, rerender } = setup(true, { onExited });
    const timeline = result.current.timelineRef.current;
    act(() => {
      timeline?.progress(1);
    });

    rerender({ open: false });
    // 역재생이 끝나는 자리로 직접 보낸다 — GSAP이 onReverseComplete를 쏜다.
    act(() => {
      timeline?.progress(0);
    });
    act(() => {
      vi.advanceTimersByTime(FULL_EXIT_MS * 2);
    });

    expect(onExited).toHaveBeenCalledTimes(1);
    expect(result.current.shouldRender).toBe(false);
  });
});

describe('useOverlayTransition — 축소 모드', () => {
  it('등장이 정지 화면으로 즉시 확정된다 (중간 상태에 멈추지 않는다)', () => {
    installReducedMotion();
    const { result } = setup(true);

    expect(result.current.shouldRender).toBe(true);
    expect(result.current.timelineRef.current?.progress()).toBe(1);
    expect(backdropEl.style.opacity).toBe('1');
    expect(sheet.style.transform).toBe('translate(0, 0)');
  });

  it('퇴장이 기다리지 않고 즉시 확정된다 — 기다릴 퇴장이 없다', () => {
    installReducedMotion();
    const onExited = vi.fn();
    const { result, rerender } = setup(true, { onExited });

    rerender({ open: false });

    expect(result.current.shouldRender).toBe(false);
    expect(onExited).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('useOverlayTransition — 정리', () => {
  it('언마운트하면 타임라인이 전역 타임라인에서 빠지고 타이머가 남지 않는다', () => {
    const { result, rerender, unmount } = setup(true);
    const timeline = result.current.timelineRef.current;
    act(() => {
      timeline?.progress(1);
    });

    rerender({ open: false });
    expect(vi.getTimerCount()).toBe(1);
    // 살아 있는 동안은 전역 타임라인(=티커)에 매달려 있다.
    expect(timeline?.parent).not.toBeNull();

    unmount();

    expect(vi.getTimerCount()).toBe(0);
    // kill()된 타임라인은 부모를 잃는다 — 더 이상 티커가 돌려 주지 않는다.
    expect(timeline?.parent).toBeNull();
  });

  it('퇴장이 끝나 DOM이 내려가면 타임라인 참조도 비워진다', () => {
    const { result, rerender } = setup(true);
    act(() => {
      result.current.timelineRef.current?.progress(1);
    });

    rerender({ open: false });
    act(() => {
      vi.advanceTimersByTime(FULL_EXIT_MS);
    });

    expect(result.current.timelineRef.current).toBeNull();
  });
});
