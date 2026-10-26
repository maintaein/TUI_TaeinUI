import { gsap } from 'gsap';
import { gsapDuration, gsapEasing } from '../tokens/gsapEasing';
import { gateMotion } from '../hooks/gateMotion';

// BottomSheet와 SideSheet가 나눠 쓰는 "튀며 들어오고, 내용이 페이드인하고, 둥실거리는"
// 등장의 공통부. 시트마다 다른 것은 축과 시작 부호, 둥실거림 방향뿐이다.
// 둥실거림의 CSS 쪽은 `sheetFloat.css.ts`.
// 세 번째 소비자: BoardRow가 펼칠 때 `addSheetFade`만 가져다 쓴다.

/**
 * 시트가 들어와 목표를 지나치는 거리(px). 고정 px인 이유: 시트 이동거리는 시트
 * 높이(옆 시트는 폭)와 같아서 `snap`(넘침 10%)을 그대로 걸면 240px 시트는 24px,
 * 600px 시트는 61px로 들쭉날쭉하고 큰 시트는 만화처럼 튄다. 크기와 무관하게 같은
 * 크기로 튀게 비율(`xPercent`/`yPercent`)로 환산해 건다.
 */
const BOUNCE_OVERSHOOT_PX = 16;

/** 내용이 뜨기 시작하는 지점: 시트 1단(`slow`)의 60%. 시트가 거의 들어왔을 때다. */
const FADE_AT = 0.6;

/**
 * 시트 본체의 2단 넘침 트윈을 타임라인 0초에 붙인다.
 *
 * - `axis`: 시트가 들어오는 축. 아래 시트는 `yPercent`, 옆 시트는 `xPercent`
 * - `from`: 화면 밖 시작값. 아래·오른쪽은 `100`, 왼쪽은 `-100`
 *
 * 1단은 목표를 지나쳐(`from`의 반대 방향으로 16px) 들어오고, 2단은 앉는다. 두 단의
 * 이음매는 속도가 0이다. 크기를 읽을 수 없으면(0, jsdom) 넘침 없이 곧장 앉는다.
 * 0으로 나누지 않는다. 드래그가 쓰는 `y`(px)와 섞지 않으려고 퍼센트 채널만 쓴다.
 */
export const addSheetOvershoot = (
  timeline: gsap.core.Timeline,
  sheet: HTMLElement,
  axis: 'xPercent' | 'yPercent',
  from: number
) => {
  const size = axis === 'xPercent' ? sheet.offsetWidth : sheet.offsetHeight;
  const overshoot = size > 0 ? (BOUNCE_OVERSHOOT_PX / size) * 100 : 0;
  if (overshoot > 0) {
    const past = -Math.sign(from) * overshoot;
    timeline.fromTo(
      sheet,
      { [axis]: from },
      {
        [axis]: past,
        duration: gsapDuration.slow,
        ease: gsapEasing.settle,
      },
      0
    );
    timeline.fromTo(
      sheet,
      { [axis]: past },
      {
        [axis]: 0,
        duration: gsapDuration.base,
        ease: gsapEasing.drift,
        immediateRender: false,
      },
      gsapDuration.slow
    );
  } else {
    timeline.fromTo(
      sheet,
      { [axis]: from },
      { [axis]: 0, duration: gsapDuration.slow, ease: gsapEasing.settle },
      0
    );
  }
};

/**
 * 내용 전체가 함께 페이드인하는 별도 타임라인을 돌려준다. 항목이 없으면 `null`.
 *
 * 등장 타임라인 밖에 두어 닫을 때 내용을 되감지 않고 끝 상태로 확정한다.
 *
 * 등장이 정방향으로 1단의 60%를 지날 때 처음부터 돌린다. `call`은
 * 역재생이 이 지점을 지날 때도 불리므로 방향을 확인한다. 축소 선호면 페이드를
 * `gateMotion`이 만들자마자 끝 상태로 확정하고 죽이므로 `call`은 아무것도 하지
 * 않는다(죽은 타임라인을 다시 돌리지 않는다). 재열림은 DOM을 새로 만들어 다시 빌드된다.
 */
export const addSheetFade = (
  timeline: gsap.core.Timeline,
  items: Element[],
  reduced: boolean
): gsap.core.Timeline | null => {
  if (items.length === 0) return null;

  const fade = gateMotion(reduced, () => {
    const t = gsap.timeline({ paused: true });
    t.fromTo(
      items,
      { opacity: 0 },
      {
        opacity: 1,
        duration: gsapDuration.fast,
        ease: gsapEasing.settle,
      },
      0
    );
    return t;
  });

  timeline.call(
    () => {
      if (reduced || timeline.reversed()) return;
      fade.restart();
    },
    [],
    gsapDuration.slow * FADE_AT
  );
  return fade;
};

/**
 * float 루프는 등장이 끝나면 `data-floating`이 붙고 시트가 사라질 때까지 그대로다.
 * 떼면 `translate`가 0으로 돌아가며 시트가 툭 떨어지므로 떼지 않는다. 멈춤은
 * 별도 표시 `data-float-paused`(`animation-play-state: paused`)가 맡아 그 자리에 세운다.
 */
export const setFloating = (sheet: HTMLElement | null) =>
  sheet?.toggleAttribute('data-floating', true);
export const setFloatPaused = (sheet: HTMLElement | null, on: boolean) =>
  sheet?.toggleAttribute('data-float-paused', on);
