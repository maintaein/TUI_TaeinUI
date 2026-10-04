import { useCallback, useEffect, useState, type RefObject } from 'react';

/**
 * bubble(Popover, Tooltip)의 마운트 수명과 열림 클래스를 쥔다.
 *
 * - `shouldRender`: DOM을 둘지. `open`이 꺼져도 `exitMs` 동안 더 둔다(퇴장 전이).
 * - `visible`: 열림 클래스를 줄지. 마운트 첫 프레임은 닫힘 스타일이어야 하고
 *   그 다음에 열림으로 넘어가야 등장 전이가 돈다.
 *
 * `exitMs`는 CSS의 퇴장 전이 길이와 같아야 한다(`bubble.ts`의 exit).
 *
 * `instant`는 **등장** 전이를 건너뛴다. 처음부터 열림 클래스로 커밋하므로 닫힘
 * 스타일에서 열림으로 가는 "변화"가 없다. 아래 effect가 고치는 버그(전이가
 * 안 걸리는 것)를 이 경우에만 의도적으로 쓰는 것이다. 연달아 보는 툴팁이 쓴다.
 * 노드가 이미 있을 때(퇴장 중 재진입)는 현재 위치에서 이어지므로 상관없다.
 *
 * 반환하는 `unmountNow`는 **퇴장** 전이를 건너뛴다. 퇴장 타이머 없이 DOM을
 * 지운다. 아직 `open`이면 렌더 중 보정이 되살리므로 호출하는 쪽이 `open`을 먼저
 * 꺼야 한다(제어 모드는 부모가 꺼 줘야 한다).
 */
export const useBubblePresence = (
  open: boolean,
  exitMs: number,
  nodeRef: RefObject<HTMLElement | null>,
  instant = false
) => {
  const [shouldRender, setShouldRender] = useState(open);
  const [visible, setVisible] = useState(false);

  if (open && !shouldRender) {
    setShouldRender(true);
    if (instant) setVisible(true);
  }

  useEffect(() => {
    if (open || !shouldRender) return;

    const timer = setTimeout(() => {
      setShouldRender(false);
    }, exitMs);

    return () => clearTimeout(timer);
  }, [open, shouldRender, exitMs]);

  useEffect(() => {
    // 닫힘 클래스로 커밋된 노드를 여는 클래스로 바꾸면 CSS 전이가 돈다. 단
    // 브라우저가 닫힘 스타일을 **한 번이라도 계산한 뒤에** 바뀔 때만이다.
    // useEffect는 페인트 이후를 보장하지 않아서, 계산 전에 클래스가 바뀌면
    // 전이가 시작되지 않고 bubble이 처음부터 최종 크기로 나타난다. 호버 타이머
    // 같은 비클릭 경로에서 12회 중 10회 이상 그랬다(e2e/bubbleEntrance.spec.ts).
    // 프로퍼티를 실제로 읽어야 스타일 계산이 강제된다. 이 줄을 "쓸모없는 읽기"로
    // 지우면 그 회귀가 돌아온다. jsdom은 전이를 그리지 못해 단위 테스트로는
    // 못 잡는다.
    const node = nodeRef.current;
    if (open && node) void getComputedStyle(node).opacity;
    // 한 틱 늦게 열림 클래스로 넘기는 것이 목적이라 의도적으로 effect에서
    // setState한다(Snackbar.tsx의 liveMessage와 같은 이유).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(open);
  }, [open, nodeRef]);

  const unmountNow = useCallback(() => setShouldRender(false), []);

  return { shouldRender, visible, unmountNow };
};
