import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from 'react';
import { gsap } from 'gsap';
import { gateMotion } from '../hooks/gateMotion';
import { useReducedMotion } from '../hooks/useReducedMotion';

/**
 * 퇴장은 등장의 65% — 모션 명제 조항 3의 60~70% 창 안이다.
 *
 * 세 오버레이가 각자 들고 있던 `EXIT_DURATION_MS = 200`이 여기 하나로 모였다.
 * 고정 ms가 아니라 비율인 이유: 퇴장은 **등장 타임라인의 역재생**이라 남은
 * 길이가 중단 시점에 따라 달라진다. 여는 도중 닫으면 되돌릴 거리도 그만큼 짧다.
 */
const EXIT_RATIO = 0.65;

export interface UseOverlayTransitionOptions {
  /** 오버레이 열림 여부 */
  open: boolean;
  /**
   * 훅이 만들어 넘기는 **일시정지 타임라인을 채운다.** progress 0이 닫힘, 1이
   * 열림이다. 타임라인을 직접 만들지 않는다 — `paused: true`를 빠뜨릴 길도,
   * 훅이 모르는 타임라인이 떠돌 길도 구조적으로 없다.
   *
   * 백드롭과 시트는 **같은** 타임라인에 넣어라. 따로 두면 중단 시 둘의 progress가
   * 갈라진다.
   *
   * 호출 시점: DOM이 붙은 직후(`shouldRender`가 켜진 다음 layout 단계) 한 번,
   * 그리고 **축소 선호(`prefers-reduced-motion`)가 뒤집히면 다시** 한 번. 개폐를
   * 반복해도 다시 불리지 않는다 — 상태마다 새로 만들면 현재 위치를 잃어 중단
   * 지점에서 점프한다. 다시 불릴 때는 시작값을 **그 시점의 DOM에서 다시 읽는다**:
   * 열려 있는 동안 트리거가 움직였다면 새 좌표가 잡힌다. 그래서 열릴 때마다
   * 달라지는 값(요소 좌표 등)은 바깥에서 계산해 두지 말고 이 콜백 **안에서**
   * 읽어야 한다.
   */
  buildTimeline: (timeline: gsap.core.Timeline) => void;
  /** 퇴장이 끝나 `shouldRender`가 내려가는 순간 한 번 불린다 (포커스 복원 등) */
  onExited?: () => void;
}

export interface UseOverlayTransitionReturn {
  /** DOM을 유지해야 하는지. 퇴장이 재생되는 동안에도 true다 */
  shouldRender: boolean;
  /**
   * **테스트 전용.** 중단 재개(`progress`·`reversed`·`timeScale`) 메커니즘을 잠그는
   * 테스트가 타임라인을 집기 위한 손잡이다. `shouldRender`가 false면 null이다.
   *
   * **컴포넌트는 쓰지 마라.** 여기서 `play()`/`reverse()`를 직접 부르면 훅의 퇴장
   * 타이머와 어긋나 DOM이 먼저 사라지거나 영영 남는다. 재생은 `open`으로만
   * 조종한다. 드래그처럼 손가락이 개입하는 경로도 타임라인을 건드리지 말고
   * 별도 transform 채널을 써라(`BottomSheet`가 `yPercent` 대 `y`로 그렇게 한다).
   */
  timelineRef: RefObject<gsap.core.Timeline | null>;
}

/**
 * 오버레이의 등장·퇴장을 **같은 GSAP 타임라인의 양방향**으로 돌리고
 * `shouldRender` 수명을 소유하는 내부 훅 (M3 T2).
 *
 * `@keyframes`는 진행 중 progress를 읽을 수도 바꿀 수도 없어서, 여는 도중 닫으면
 * 요소가 키프레임이 그리던 위치에서 퇴장 시작값으로 순간이동한다. 타임라인은
 * `reverse()`가 **현재 progress에서 이어지므로** 그 점프가 구조적으로 사라진다.
 *
 * 언마운트 시점은 **타이머가 권위다.** 빠른 연속 전이에서 `onReverseComplete`가
 * 안 올 수 있고, 그때 DOM이 영영 안 사라지면 안 된다. `onReverseComplete`는 먼저
 * 오면 이기는 보조 경로로 같이 걸어 두고, 둘 다 와도 한 번만 확정된다.
 */
export const useOverlayTransition = ({
  open,
  buildTimeline,
  onExited,
}: UseOverlayTransitionOptions): UseOverlayTransitionReturn => {
  const reduced = useReducedMotion();
  const [shouldRender, setShouldRender] = useState(open);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 콜백은 ref로 들고 있는다 — 매 렌더 새 함수가 와도 타임라인을 다시 만들지
  // 않는다(호출자가 useCallback으로 감싸야 할 이유를 없앤다). 갱신은 아래
  // 타임라인 생성 effect보다 **먼저 선언된** layout effect에서 한다: 같은
  // 커밋의 layout effect는 선언 순서로 돌아가므로, 이 순서가 생성 시점의
  // 최신성을 보장한다.
  const buildTimelineRef = useRef(buildTimeline);
  const onExitedRef = useRef(onExited);

  useLayoutEffect(() => {
    buildTimelineRef.current = buildTimeline;
    onExitedRef.current = onExited;
  });

  if (open && !shouldRender) {
    setShouldRender(true);
  }

  // 타임라인은 요소가 붙은 뒤에 만든다. `fromTo`의 시작값이 생성 시점에 바로
  // 적용되므로(immediateRender) layout 단계에서 만들어야 첫 페인트가 닫힌
  // 상태로 나온다 — 열린 상태가 한 프레임 번쩍이지 않는다.
  useLayoutEffect(() => {
    if (!shouldRender) return;

    // 축소 선호면 gateMotion이 타임라인을 끝 상태로 확정하고 죽인다 — 열린
    // 정지 화면이 된다. 진행 중 트윈이 없으니 중간 상태에 멈출 수가 없다.
    //
    // `paused: true`는 훅의 전제다. 빠뜨리면 타임라인이 생성 즉시 재생되면서
    // `shouldRender`가 아직 못 따라온 프레임에 등장이 흘러가 버린다. 그래서
    // 생성을 호출자에게 맡기지 않고 여기서 만들어 채우게만 한다.
    const timeline = gateMotion(reduced, () => {
      const created = gsap.timeline({ paused: true });
      buildTimelineRef.current(created);
      return created;
    });
    timelineRef.current = timeline;

    return () => {
      timeline.kill();
      timelineRef.current = null;
    };
  }, [shouldRender, reduced]);

  useEffect(() => {
    if (!shouldRender) return;

    const timeline = timelineRef.current;

    const clearExitTimer = () => {
      if (exitTimerRef.current !== null) {
        clearTimeout(exitTimerRef.current);
        exitTimerRef.current = null;
      }
    };

    if (open) {
      clearExitTimer();
      timeline?.eventCallback('onReverseComplete', null);
      // 역재생 중이었다면 현재 progress에서 정방향으로 이어진다.
      if (!reduced) timeline?.timeScale(1).play();
      return;
    }

    let settled = false;
    const settleExit = () => {
      if (settled) return;
      settled = true;
      clearExitTimer();
      setShouldRender(false);
      onExitedRef.current?.();
    };

    // 축소 선호면 기다릴 퇴장이 없다 — 타임라인을 접고 즉시 내린다.
    if (reduced || !timeline) {
      timeline?.kill();
      settleExit();
      return;
    }

    // 남은 퇴장 시간은 타임라인에서 읽는다. 고정 200ms를 쓰면 여는 도중 닫았을
    // 때 이미 사라진 DOM을 필요 이상으로 붙들고 있는다.
    const remainingMs = timeline.time() * EXIT_RATIO * 1000;

    timeline.eventCallback('onReverseComplete', settleExit);
    // 역재생은 `settle`(power3.out)을 시간축에서 뒤집어 자연히 가속 커브가 된다 —
    // 조항 3의 "같은 타임라인을 반대로 돌리고 커브만 바꾼다"가 이걸로 만족된다.
    timeline.timeScale(1 / EXIT_RATIO).reverse();
    exitTimerRef.current = setTimeout(settleExit, remainingMs);

    return clearExitTimer;
  }, [open, shouldRender, reduced]);

  return { shouldRender, timelineRef };
};
