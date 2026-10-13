import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';
import { gsap } from 'gsap';
import { gateMotion, settleMotion } from '../../hooks/gateMotion';
import { gsapDuration, gsapEasing } from '../../tokens/gsapEasing';
import { PANEL_OFFSET_Y } from './HeaderBar.css';

/**
 * 테스트가 열림·닫힘 트윈을 집는 통로. 공개 prop/state로 안 나가고 판 DOM 노드에
 * 얹는다(타입 전용 확장이라 값으로 export되지 않는다. HeaderBarNav의
 * NavScaleSetterHost와 같은 모양).
 */
export interface PanelTweenHost extends HTMLElement {
  __panelTween?: gsap.core.Tween;
}

/**
 * 판을 열고 닫는 트윈. 좁은 화면 세로 목록 판과 드롭다운 판이 같은 리듬을 쓴다.
 * 열림: opacity 0 -> 1, y 8 -> 0, base settle. 닫힘: 반대로 fast settle.
 * autoAlpha가 opacity와 visibility를 함께 쓴다(닫힌 목록이 탭 순서에서 빠진다).
 * overwrite: 'auto'라 도중에 뒤집으면 지금 자리에서 이어진다.
 */
export const usePanelTween = (
  panelRef: RefObject<PanelTweenHost | null>,
  open: boolean,
  reduced: boolean
): void => {
  // 마지막으로 트윈을 건 열림 상태. 처음 마운트(닫힘)와 축소 선호만 바뀐 렌더에서
  // 같은 방향 트윈을 또 걸지 않게 한다.
  const shownRef = useRef(false);
  // 이 훅이 만든 마지막 트윈. 판이 처음엔 없다가 나중에 생길 수 있어 정리 때 마운트 시점의
  // ref를 믿을 수 없으니 훅이 직접 들고 있다.
  const lastTweenRef = useRef<gsap.core.Tween | null>(null);

  useLayoutEffect(() => {
    const panelEl = panelRef.current;
    if (!panelEl) return;
    if (shownRef.current === open) {
      // 열림 상태는 그대로인데 축소 선호가 켜졌다. 돌던 트윈을 끝 상태로 확정한다.
      if (reduced && panelEl.__panelTween) settleMotion(panelEl.__panelTween);
      return;
    }
    shownRef.current = open;
    panelEl.__panelTween = lastTweenRef.current = gateMotion(reduced, () =>
      gsap.to(
        panelEl,
        open
          ? {
              autoAlpha: 1,
              y: 0,
              duration: gsapDuration.base,
              ease: gsapEasing.settle,
              overwrite: 'auto',
            }
          : {
              autoAlpha: 0,
              y: PANEL_OFFSET_Y,
              duration: gsapDuration.fast,
              ease: gsapEasing.settle,
              overwrite: 'auto',
            }
      )
    );
  }, [panelRef, open, reduced]);

  useEffect(
    () => () => {
      lastTweenRef.current?.kill();
    },
    []
  );
};
