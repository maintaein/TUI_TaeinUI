import { gsap } from 'gsap';
import { gsapDuration, gsapEasing } from '../tokens/gsapEasing';

// BottomSheet와 SideSheet가 나눠 쓰는 "튀며 들어오고, 내용이 떠오르고, 둥실거리는"
// 등장의 공통부. 시트마다 다른 것은 축과 시작 부호, 둥실거림 방향뿐이다.
// 둥실거림의 CSS 쪽은 `sheetFloat.css.ts`.

/**
 * 시트가 들어와 목표를 지나치는 거리(px). 고정 px인 이유: 시트 이동거리는 시트
 * 높이(옆 시트는 폭)와 같아서 `snap`(넘침 10%)을 그대로 걸면 240px 시트는 24px,
 * 600px 시트는 61px로 들쭉날쭉하고 큰 시트는 만화처럼 튄다. 크기와 무관하게 같은
 * 크기로 튀게 비율(`xPercent`/`yPercent`)로 환산해 건다.
 */
const BOUNCE_OVERSHOOT_PX = 16;

/** 내용이 떠오르는 거리(px). `Modal`·`BubbleMenu`와 같은 24. */
const STAGGER_RISE_Y = 24;
/** 내용 항목 사이의 시차(초). folderfloat `stagger = 45`ms. */
const STAGGER_STEP = 0.045;
/** 시차를 받는 항목 수. 9번째부터는 8번째와 같이 뜬다(긴 목록이 늦게 끝나지 않게). */
const STAGGER_MAX = 8;
/** 내용이 뜨기 시작하는 지점: 시트 1단(`slow`)의 60%. 시트가 거의 들어왔을 때다. */
const STAGGER_AT = 0.6;

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
 * 내용 항목들이 시차를 두고 떠오르는 **별도** 타임라인을 만들어 돌려준다. 항목이
 * 없으면 `null`.
 *
 * 등장 타임라인 **밖**에 두는 이유: 안에 두면 등장 길이가 시차 꼬리만큼 늘고(항목
 * 6개에 705ms), 훅이 퇴장을 역재생할 때 그 꼬리부터 풀어서 시트가 100ms 넘게
 * 가만히 있는다. 밖에 두면 되감기지 않는다.
 *
 * 등장이 정방향으로 시차 지점(1단의 60%)을 지날 때 처음부터 돌린다. `call`은
 * 역재생이 이 지점을 지날 때도 불리므로 방향을 확인한다. 축소 선호면 게이트가
 * 등장을 끝 상태로 확정하며 이것도 불리는데, 시차도 끝으로 확정한다.
 *
 * `y`와 `opacity`를 한 트윈에 묶지 않는다: snap은 넘치는 커브라 불투명도에 걸면
 * 1을 넘었다 돌아온다. GSAP의 `stagger`는 항목 수에 따라 간격을 나누므로 쓰지
 * 않고 항목별 시작 시각을 직접 준다(처음 8개만 시차를 받는다).
 * 시트가 옆에서 와도 항목은 위로 뜬다: 시트(옆)와 내용(위)이 다른 움직임으로
 * 읽혀야 한 덩어리로 뭉개지지 않는다.
 */
export const addSheetStagger = (
  timeline: gsap.core.Timeline,
  items: Element[],
  reduced: boolean
): gsap.core.Timeline | null => {
  if (items.length === 0) return null;

  const stagger = gsap.timeline({ paused: true });
  items.forEach((item, i) => {
    const start = Math.min(i, STAGGER_MAX - 1) * STAGGER_STEP;
    stagger.fromTo(
      item,
      { y: STAGGER_RISE_Y },
      { y: 0, duration: gsapDuration.slow, ease: gsapEasing.snap },
      start
    );
    stagger.fromTo(
      item,
      { opacity: 0 },
      {
        opacity: 1,
        duration: gsapDuration.fast,
        ease: gsapEasing.settle,
      },
      start
    );
  });

  timeline.call(
    () => {
      if (timeline.reversed()) return;
      if (reduced) stagger.progress(1);
      else stagger.restart();
    },
    [],
    gsapDuration.slow * STAGGER_AT
  );
  return stagger;
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
