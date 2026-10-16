/**
 * M3 T2: 오버레이 전이 훅. 세 오버레이(Modal·BottomSheet·SideSheet)가 각자
 * 갖고 있던 `shouldRender` 수명 + 퇴장 타이머를 한 곳으로 모으고, 등장·퇴장을
 * **같은 GSAP 타임라인의 양방향**으로 만든 자리다.
 *
 * jsdom + fake timer 환경에서 GSAP 티커는 한 번도 돌지 않는다(rAF 틱이 없다).
 * 그래서 진행 중 상태는 `advanceTimersByTime`이 아니라 타임라인을 직접
 * `progress()`로 seek해 만든다. 실제 GSAP 인스턴스를 조작하는 것이므로
 * 목킹이 아니다. 동시에 이게 "타이머가 권위다"라는 설계의 이유이기도 하다:
 * 애니메이션 완료 콜백은 오지 않을 수 있다.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { gsapDuration, gsapEasing } from '../tokens/gsapEasing';
import { useOverlayTransition } from './useOverlayTransition';

/** 등장 길이. 시트 300ms + 백드롭 200ms 동시 시작 = 타임라인 길이 300ms. */
const ENTER_MS = 300;
/** 퇴장은 등장의 65%. 전부 재생된 타임라인의 퇴장 길이. */
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

/** jsdom은 matchMedia를 구현하지 않는다. 축소 선호 경로를 열려면 깔아야 한다. */
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

/**
 * installReducedMotion과 달리 change 이벤트로 값을 바꿀 수 있다 (Ruling 24).
 * useReducedMotion.test.ts의 FakeMediaQueryList와 같은 패턴.
 */
class ToggleableMediaQueryList extends EventTarget {
  matches: boolean;
  readonly media = '(prefers-reduced-motion: reduce)';

  constructor(matches: boolean) {
    super();
    this.matches = matches;
  }

  setMatches(next: boolean): void {
    this.matches = next;
    this.dispatchEvent(new Event('change'));
  }
}

const installToggleableReducedMotion = (
  initial: boolean
): ToggleableMediaQueryList => {
  const list = new ToggleableMediaQueryList(initial);
  vi.stubGlobal(
    'matchMedia',
    (): MediaQueryList => list as unknown as MediaQueryList
  );
  return list;
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

describe('useOverlayTransition: shouldRender 수명', () => {
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

  it('open이 꺼져도 즉시 내려가지 않는다. 퇴장이 재생될 자리를 남긴다', () => {
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

describe('useOverlayTransition: 퇴장은 등장의 65%', () => {
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

  it('남은 시간을 타임라인에서 읽는다. 절반만 열린 상태면 절반만 붙들고 있는다', () => {
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

describe('useOverlayTransition: 중단 (명제 조항 1)', () => {
  it('여는 도중 닫으면 현재 progress에서 역방향으로 이어진다. 0이나 1로 점프하지 않는다', () => {
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

  it('타임라인을 한 번만 만든다. 상태가 바뀔 때마다 새로 만들면 현재 위치를 잃는다', () => {
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

  it('연타해도 최종 상태가 정확하다. 닫힘으로 끝나면 반드시 사라진다', () => {
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

  it('연타해도 최종 상태가 정확하다. 열림으로 끝나면 살아 있고 정방향이다', () => {
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
    // 중간에 스쳐 간 close가 퇴장을 확정했다면 여기가 잡는다. shouldRender는
    // 렌더 단계의 `open && !shouldRender` 되살림이 증상을 지워 버려서 못 잡는다.
    expect(onExited).not.toHaveBeenCalled();
  });
});

describe('useOverlayTransition: 컴포넌트 모양 중단/재개 (Ruling 30)', () => {
  /**
   * `Modal.tsx`가 실제로 렌더되는 걸 이 파일에서 직접 구동하지는 못한다.
   * `gsap`을 값으로 import하는 순간 게이트 검사가 그 파일을 위반자로 잡는다
   * (`Modal.test.tsx`가 같은 이유로 이미 gsap import를 피하고 있고, 이 파일이
   * 그 우회를 안 쓰는 것도 `timelineRef.current`가 이미 실제 GSAP 인스턴스를
   * import 없이 손에 쥐여 주기 때문이다. 직접 확인: 임시로 `Modal.test.tsx`에
   * `import { gsap } from 'gsap'`를 넣고 게이트 검사를 돌리면 그 파일이
   * violators에 잡힌다). 그래서 `Modal.buildTimeline`과 같은 모양(
   * 트리거·다이얼로그 좌표 차이를 x/y로 넣는 것까지)을 여기서 그대로
   * 재현해 중단/재개를 구동한다.
   */
  it('트리거 좌표를 포함한 Modal 모양 타임라인도 여는 도중 닫으면 같은 인스턴스가 현재 progress에서 역방향으로 이어진다', () => {
    const trigger = document.createElement('button');
    const dialog = document.createElement('div');
    document.body.append(trigger, dialog);

    const triggerBox = { left: 100, top: 200, width: 80, height: 32 };
    const dialogBox = { left: 300, top: 150, width: 400, height: 240 };
    trigger.getBoundingClientRect = () =>
      new DOMRect(
        triggerBox.left,
        triggerBox.top,
        triggerBox.width,
        triggerBox.height
      );
    dialog.getBoundingClientRect = () =>
      new DOMRect(
        dialogBox.left,
        dialogBox.top,
        dialogBox.width,
        dialogBox.height
      );

    // `Modal.tsx`의 `enterStart()` 공식을 여기 그대로 복제했다(두 중심의 차이).
    // 한쪽을 바꾸면 다른 쪽도 같이 바꿔야 한다. 이 복제는 `enterStart()`가
    // Modal이 실제로 호출하는 걸 검증하지 않고, 같은 모양의 숫자만 재현한다
    // (F1: Task 9 수정 라운드 1 review). 진짜 배선 잠금은
    // `Modal.test.tsx`의 `triggerRef: 버튼 자리에서 자란다` 스위트가 맡는다.
    const from = trigger.getBoundingClientRect();
    const to = dialog.getBoundingClientRect();
    const enterX = from.left + from.width / 2 - (to.left + to.width / 2);
    const enterY = from.top + from.height / 2 - (to.top + to.height / 2);

    const modalShapedBuild = (timeline: gsap.core.Timeline): void => {
      timeline.fromTo(
        backdropEl,
        { opacity: 0 },
        { opacity: 1, duration: gsapDuration.base, ease: gsapEasing.settle },
        0
      );
      timeline.fromTo(
        dialog,
        { opacity: 0, x: enterX, y: enterY, scale: 0.8 },
        {
          opacity: 1,
          x: 0,
          y: 0,
          scale: 1,
          duration: gsapDuration.slow,
          ease: gsapEasing.settle,
        },
        0
      );
    };

    const { result, rerender } = setup(true, { build: modalShapedBuild });
    const timeline = result.current.timelineRef.current;

    act(() => {
      timeline?.progress(0.4);
    });

    rerender({ open: false });

    // 같은 인스턴스가 이어받는다. 새로 만들지 않는다.
    expect(result.current.timelineRef.current).toBe(timeline);
    expect(timeline?.progress()).toBeCloseTo(0.4, 5);
    expect(timeline?.reversed()).toBe(true);

    dialog.remove();
    trigger.remove();
  });
});

describe('useOverlayTransition: 완료 콜백에 의존하지 않는다', () => {
  it('onReverseComplete가 먼저 와도 타이머와 합쳐 onExited가 한 번만 불린다', () => {
    const onExited = vi.fn();
    const { result, rerender } = setup(true, { onExited });
    const timeline = result.current.timelineRef.current;
    act(() => {
      timeline?.progress(1);
    });

    rerender({ open: false });
    // 역재생이 끝나는 자리로 직접 보낸다. GSAP이 onReverseComplete를 쏜다.
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

describe('useOverlayTransition: 축소 모드', () => {
  it('등장이 정지 화면으로 즉시 확정된다 (중간 상태에 멈추지 않는다)', () => {
    installReducedMotion();
    const { result } = setup(true);

    expect(result.current.shouldRender).toBe(true);
    expect(result.current.timelineRef.current?.progress()).toBe(1);
    expect(backdropEl.style.opacity).toBe('1');
    expect(sheet.style.transform).toBe('translate(0, 0)');
  });

  it('퇴장이 기다리지 않고 즉시 확정된다. 기다릴 퇴장이 없다', () => {
    installReducedMotion();
    const onExited = vi.fn();
    const { result, rerender } = setup(true, { onExited });

    rerender({ open: false });

    expect(result.current.shouldRender).toBe(false);
    expect(onExited).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('useOverlayTransition: 축소 선호 전환 (Ruling 24)', () => {
  it('열린 상태에서 축소 선호를 켰다 끄면 타임라인이 재빌드된다. [shouldRender, reduced] 의존성이 실제로 재호출을 일으킨다', () => {
    const list = installToggleableReducedMotion(false);
    const build = vi.fn(buildTimeline);
    const { result } = setup(true, { build });

    const original = result.current.timelineRef.current;
    expect(build).toHaveBeenCalledTimes(1);
    expect(original).not.toBeNull();

    act(() => {
      list.setMatches(true);
    });

    // 이펙트 클린업이 이전 타임라인을 kill했다. parent === null이 kill 신호다
    // (isActive()는 parent가 null이어도 true를 반환해 신뢰할 수 없다).
    expect(original?.parent).toBeNull();
    const reducedTimeline = result.current.timelineRef.current;
    expect(reducedTimeline).not.toBe(original);
    expect(build).toHaveBeenCalledTimes(2);
    // gateMotion이 축소 선호면 만들자마자 끝 상태로 확정하고 죽인다.
    expect(reducedTimeline?.progress()).toBe(1);
    expect(reducedTimeline?.parent).toBeNull();

    act(() => {
      list.setMatches(false);
    });

    // 다시 꺼졌으니 또 한 번 재빌드된다. 이번엔 게이트를 거치지 않아 살아 있다.
    expect(build).toHaveBeenCalledTimes(3);
    const restoredTimeline = result.current.timelineRef.current;
    expect(restoredTimeline).not.toBe(reducedTimeline);
    expect(restoredTimeline).not.toBe(original);
    expect(restoredTimeline?.parent).not.toBeNull();
  });
});

describe('useOverlayTransition: 정리', () => {
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
    // kill()된 타임라인은 부모를 잃는다. 더 이상 티커가 돌려 주지 않는다.
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
