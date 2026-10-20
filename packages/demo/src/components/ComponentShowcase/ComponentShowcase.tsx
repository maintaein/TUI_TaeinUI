import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import gsap from 'gsap';
import { MousePointer2, Pause, Play } from 'lucide-react';
import {
  Button,
  IconButton,
  mediaQuery,
  themeContract,
  useReducedMotion,
} from '@taein-ui/core';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import * as styles from './ComponentShowcase.css';
import {
  fadeShadow,
  hideParts,
  reachable,
  shatter,
  uncross,
  type Look,
  type Part,
} from './parts';
import {
  INITIAL_DEMO,
  SCENES,
  SceneContent,
  dur,
  ease,
  type Actions,
  type ActApi,
  type Demo,
  type Scene,
  type Target,
} from './scenes';

// 동작이 끝난 뒤 결과를 보여 주는 시간(slower의 0.5배). 그다음에야 전환이 시작된다.
const HOLD = dur.slower * 0.5;
// 흐림 양과 커서 아이콘 크기(lucide MousePointer2 화살촉은 24px 상자의 (4,4)).
const BLUR = 'blur(6px)';
const RISE = 6;
const CURSOR_SIZE = 24;
const CURSOR_TIP = 4;
// 흩어지거나 모이는 대리 상자 사이의 시차(20~40ms).
const STAGGER = 0.03;
// 펼침의 B는 끝 값의 104%(폭·높이, 가운데 고정)까지 갔다가 짧은 마무리 트윈으로 100%에 앉는다.
// 눈에 띄되(통통함) 장면 안의 다른 부품 자리를 침범하지 않는 선(2%씩 양쪽)으로 잡았다.
const OVERSHOOT = 1.04;

// 전환 한 번의 안무. 눈이 모양이 바뀌는 과정을 따라가도록 단계를 나누고, 시간은 duration 토큰의 배수로 정했다
// (Skeleton이 loop.base * 1.4를 쓴 선례). 이징은 토큰 그대로이고 새 커브는 없다.
//   A 옛 내용 나감: 0부터 out. 이어받지 않는 앞 부품이 흐려지며 사라진다(drift)
//   B 모양 이어받기: A 시작 + fast부터 move. 대리 상자가 앞 부품에서 뒤 부품으로 drift로 잇고,
//     펼침이면 OVERSHOOT까지 간 뒤 settle(기본)·spring 마무리 트윈으로 앉는다.
//     B의 끝(펼침이면 마무리 시작)에서 진짜 뒤 부품이 감춤에서 풀리고 대리 상자는 opacity 1 -> 0으로 교차한다
//   C 새 내용 들어옴: B의 inAt 지점부터 in. A가 끝난 뒤에야 보이기 시작해 옛 내용과 겹치지 않는다
//   D 숨 고르기: C 끝 뒤 rest 동안 아무것도 움직이지 않는다
//   손잡이 방울(pop이 있는 장면): B의 popAt 지점부터 작은 원이 맺혀 snap으로 한 번 넘쳤다 앉는다
// staged 장면은 B가 A 뒤에('all'이면 C도 B 뒤에) 이어진다.
// 첫 구현(한 바퀴 약 30s)에서 거듭 줄였다: 각 값은 그때의 토큰 배수에서 한 단계씩 내린 것이다.
const STEP = {
  out: dur.slow,
  moveAt: dur.fast,
  move: dur.slower * 1.1,
  // 펼침이 끝 값에 앉는 마무리(fast~base 사이)
  settle: dur.base,
  // staged 'all' 장면은 눈이 상자 하나만 따라가므로 더 길게 보여 준다(move와 같은 비율로 내렸다).
  stagedMove: dur.slower * 1.35,
  inAt: 0.55,
  in: dur.base * 1.75,
  rest: dur.base,
  // 슬라이더 손잡이 방울이 B의 이 지점(채움 끝이 거의 자리 잡은 뒤)부터 맺히기 시작한다.
  popAt: 0.7,
} as const;

// 손잡이 방울이 진짜 손잡이 지름의 40% 원에서 시작해 지름을 한 번 살짝 넘겼다 앉는다(snap의 back.out).
const BLOB_START = 0.4;
// 맺히는 시간(opacity)과 부푸는 시간
const BLOB_IN = dur.fast;
const BLOB_GROW = dur.slow;
// 깨짐: 칸 하나가 그 칸 가운데의 구슬로 오므라드는 시간(전환 시작부터, A의 글자 흐림과 겹친다)과 구슬 지름(칸의
// 짧은 변 대비). 날아감은 구슬 단계의 이 비율 지점에서 겹쳐 시작해 구슬이 다 되기 전에 이미 움직인다.
const BREAK = dur.slow;
const BEAD = 0.9;
const BREAK_HANDOFF = 0.7;
// 끝 넘김(교차)의 길이: B 마지막 이 비율. 펼침이면 마무리 트윈 전체가 교차 구간이다.
// drift의 가장 가파른 곳이 한 프레임(16ms)에 0.12를 넘지 않으려면 길이가 0.21s 이상이어야 한다(Loader 점이 가장 어둡다).
const HANDOFF = 0.4;

/** 한 전환의 단계 시작·끝(초). 대리 상자가 없어 흐림 교체로 내려앉는 전환은 A 직후 C가 이어진다 */
const timeline = (scene: Scene, swap = false) => {
  const moveAt = scene.shatter
    ? BREAK * BREAK_HANDOFF
    : scene.staged
      ? STEP.out
      : STEP.moveAt;
  const move = scene.staged === 'all' ? STEP.stagedMove : STEP.move;
  // 마무리 settle은 펼침에만 있다(접힘은 앉을 것이 없다)
  const moveEnd = moveAt + move + (scene.grows ? STEP.settle : 0);
  const inAt = swap
    ? STEP.out
    : scene.staged === 'all'
      ? moveEnd
      : moveAt + move * STEP.inAt;
  const popAt = moveAt + move * STEP.popAt;
  // 끝 넘김: 진짜 뒤 부품이 보이기 시작하고 대리 상자가 지워지기 시작하는 지점과 길이.
  // staged 'all'은 새 내용이 B 뒤에 들어오므로 그 들어옴과 함께 넘긴다.
  const handoff =
    scene.staged === 'all'
      ? { at: inAt, seconds: STEP.in }
      : scene.grows
        ? { at: moveAt + move, seconds: STEP.settle }
        : { at: moveAt + move * (1 - HANDOFF), seconds: move * HANDOFF };
  return { moveAt, move, moveEnd, inAt, inEnd: inAt + STEP.in, popAt, handoff };
};

/** 장면에 들어오는 전환이 끝나고 숨 고르기까지(초). 연출은 그 뒤에 시작한다 */
const enterSeconds = (scene: Scene) => {
  const t = timeline(scene);
  return (
    Math.max(
      t.moveEnd + (scene.spread ? (scene.spread - 1) * STAGGER : 0),
      t.inEnd,
      scene.pop ? t.popAt + BLOB_GROW : 0
    ) + STEP.rest
  );
};

interface Flags {
  /** 멈춤 단추, 또는 터치로 무대를 누름 */
  user: boolean;
  /** 진짜 마우스가 무대 안에 있다 */
  hover: boolean;
  offscreen: boolean;
  hidden: boolean;
}

const pruneDone = (fx: Set<gsap.core.Animation>) => {
  for (const a of fx) if (a.progress() >= 1) fx.delete(a);
};

const firePointer = (
  el: Element | null,
  type: 'pointerdown' | 'pointerup' | 'pointerover'
) =>
  el?.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      pointerId: 1,
      pointerType: 'mouse',
      isPrimary: true,
      button: 0,
      buttons: type === 'pointerdown' ? 1 : 0,
    })
  );

/** 자기 그림자가 있으면 그것, 없으면 반대쪽 그림자의 투명판. 한쪽에만 있는 그림자가 서서히 나타나고 걷힌다 */
const shadowFrom = (own: string, other: string) =>
  own !== 'none' ? own : other !== 'none' ? fadeShadow(other) : 'none';

/** 층에서 부품들을 찾는다. 하나라도 못 찾으면 null */
const lookAll = (layer: HTMLElement, parts: Part[] | undefined) => {
  const looks: Look[] = [];
  for (const part of parts ?? []) {
    const found = part(layer);
    if (!found) return null;
    looks.push(...found);
  }
  return looks.length ? looks : null;
};

export function ComponentShowcase() {
  const reduced = useReducedMotion();
  // 좁은 화면(core HeaderBar가 햄버거로 접히는 폭)에서는 pill 장면을 건너뛴다.
  const narrow = useMediaQuery(mediaQuery.down.md);
  const order = useMemo(
    () => SCENES.flatMap((scene, i) => (narrow && scene.wideOnly ? [] : [i])),
    [narrow]
  );
  const [index, setIndex] = useState(order[0]);
  // 전환 동안 남아 있는 앞 장면(같은 DOM이 그대로 있어 부품의 실제 모양을 읽는다)
  const [front, setFront] = useState<number | null>(null);
  const [demo, setDemo] = useState<Demo>(INITIAL_DEMO);
  const [flags, setFlags] = useState<Flags>({
    user: false,
    hover: false,
    offscreen: false,
    hidden: false,
  });
  const playing =
    !reduced &&
    !flags.user &&
    !flags.hover &&
    !flags.offscreen &&
    !flags.hidden;
  const takeover = flags.hover || flags.user;

  const stageRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);
  const indexRef = useRef(order[0]);
  const frontRef = useRef<number | null>(null);
  const demoRef = useRef(INITIAL_DEMO);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  // React 커밋 뒤에 레이아웃 효과에서 만든 트윈들. 멈춤·재개를 마스터와 같이 건다.
  const fxRef = useRef(new Set<gsap.core.Animation>());
  // 진행 중인 전환을 끝 상태로 확정하는 함수(대리 상자 제거, 부품 복원)
  const finishRef = useRef<(() => void) | null>(null);
  const shownRef = useRef<number | null>(null);
  const tookOverRef = useRef(false);

  const setFlag = useCallback((key: keyof Flags, value: boolean) => {
    setFlags((f) => (f[key] === value ? f : { ...f, [key]: value }));
  }, []);

  const update = useCallback((patch: Partial<Demo>) => {
    demoRef.current = { ...demoRef.current, ...patch };
    setDemo(demoRef.current);
  }, []);

  const track = useCallback(<T extends gsap.core.Animation>(anim: T): T => {
    const fx = fxRef.current;
    pruneDone(fx);
    fx.add(anim);
    return anim;
  }, []);

  const on = useMemo<Actions>(
    () => ({
      page: (page) => update({ page }),
      popover: (popover) => update({ popover }),
      period: (value) => update({ period: value as Demo['period'] }),
      volume: (volume) => update({ volume }),
      notify: (notify) => update({ notify }),
      agree: (agree) => update({ agree }),
    }),
    [update]
  );

  // 장면 i로 넘어간다. 앞 장면은 그대로 남겨 두고(animate) 전환 효과가 부품을 읽는다.
  const goTo = useCallback(
    (i: number, animate = true) => {
      const from = indexRef.current;
      finishRef.current?.();
      if (from !== i) {
        frontRef.current = animate ? from : null;
        setFront(frontRef.current);
        indexRef.current = i;
        setIndex(i);
      }
      update(SCENES[i].enter);
    },
    [update]
  );

  // 앞 부품의 모양에서 뒤 부품의 모양으로 대리 상자가 잇는다. 장면이 바뀐 React 커밋 뒤, 그려지기 전에 시작한다.
  useLayoutEffect(() => {
    const stage = stageRef.current;
    const layer = stage?.querySelector<HTMLElement>('[data-layer="current"]');
    if (!stage || !layer) return;
    const previous = shownRef.current;
    shownRef.current = index;
    if (previous === null || previous === index) return;

    const frontEl = stage.querySelector<HTMLElement>('[data-layer="leaving"]');
    const fromIndex = frontRef.current;
    if (reduced || !frontEl || fromIndex === null) {
      queueMicrotask(() => setFront(null));
      return;
    }
    // 새 층은 부품의 모양을 읽을 때까지 보이지 않게 둔다(레이아웃은 잡힌다).
    gsap.set(layer, { autoAlpha: 0 });

    let cancelled = false;
    // Slider처럼 자기 폭을 재서 한 번 더 그리는 컴포넌트가 있어, 그 두 번째 그림이 끝난 뒤에 읽는다.
    queueMicrotask(() => {
      if (cancelled) return;
      const scene = SCENES[index];
      const from = lookAll(frontEl, SCENES[fromIndex].give);
      const to = lookAll(layer, scene.take);
      if ((!from || !to) && process.env.NODE_ENV === 'development') {
        console.warn(
          `ComponentShowcase: ${SCENES[fromIndex].name} -> ${scene.name} 부품을 못 찾아 흐림 교체로 내려앉는다. parts.ts의 선택자를 확인하라.`
        );
      }
      const looks = from && to ? { from, to } : null;

      const origin = stage.getBoundingClientRect();
      const originX = origin.left + stage.clientLeft;
      const originY = origin.top + stage.clientTop;
      // 뒤 부품은 하나씩 감춘다. 대리 상자마다 자기 차례에 자기 부품만 풀어 보이게 하기 위해서다.
      const showTo = new Map(
        looks?.to.map((l) => [l, hideParts([l])] as const)
      );
      const restore = looks ? [hideParts(looks.from), ...showTo.values()] : [];
      // 손잡이는 대리 상자(방울)가 맺히는 동안 진짜를 감춘다. 대리 상자가 없는 전환에서는 레이어와 함께 그냥 나타난다.
      const head = looks ? scene.pop?.(layer)?.[0] : undefined;
      const showHead = head ? hideParts([head]) : undefined;
      if (showHead) restore.push(showHead);

      // 깨짐: 몸통 하나를 조각으로 나눠, 무대 중심 기준 각도 순서로 조각과 점을 짝짓고 경로가 엇갈리면 도착을 바꾼다.
      const cx = originX + stage.clientWidth / 2;
      const cy = originY + stage.clientHeight / 2;
      const angle = (l: Look) =>
        Math.atan2(l.top + l.height / 2 - cy, l.left + l.width / 2 - cx);
      const byAngle = (ls: Look[]) =>
        [...ls].sort((p, q) => angle(p) - angle(q));
      const cut = scene.shatter;
      const shards =
        cut &&
        looks?.from.length === 1 &&
        looks.to.length === cut.cols * cut.rows
          ? byAngle(shatter(looks.from[0], cut.cols, cut.rows))
          : null;
      const flow =
        looks &&
        (shards
          ? { from: shards, to: uncross(shards, byAngle(looks.to)) }
          : looks);
      const pairs = flow
        ? Array.from(
            { length: Math.max(flow.from.length, flow.to.length) },
            (_, i) => {
              const a = flow.from[Math.min(i, flow.from.length - 1)];
              const b = flow.to[Math.min(i, flow.to.length - 1)];
              const el = document.createElement('div');
              el.className = styles.surrogate;
              el.setAttribute('aria-hidden', 'true');
              stage.append(el);
              // 테두리가 한쪽에만 있으면 없는 쪽도 그 색을 이어받아 색이 중간에 튀지 않는다.
              // autoRound를 끈다: 조각 폭이 정수로 반올림되면 이음매가 1px 겹치거나 벌어진다.
              gsap.set(el, {
                autoRound: false,
                left: a.left - originX,
                top: a.top - originY,
                width: a.width,
                height: a.height,
                borderRadius: a.corners ?? a.radius,
                backgroundColor: reachable(b.color, a.color),
                borderWidth: a.borderWidth,
                borderColor: a.borderWidth ? a.borderColor : b.borderColor,
                boxShadow: shadowFrom(a.shadow, b.shadow),
              });
              return {
                el,
                a,
                b,
                to: {
                  left: b.left - originX,
                  top: b.top - originY,
                  width: b.width,
                  height: b.height,
                  borderRadius: `${b.radius}px`,
                  backgroundColor: reachable(a.color, b.color),
                  borderWidth: b.borderWidth,
                  borderColor: b.borderWidth ? b.borderColor : a.borderColor,
                  boxShadow: shadowFrom(b.shadow, a.shadow),
                },
              };
            }
          )
        : [];

      // 손잡이 방울: 진짜 손잡이 가운데에서 지름의 40% 원으로 맺힌다(scale 0이 아니라 눈에 보이는 작은 원).
      let blob: HTMLDivElement | null = null;
      if (head) {
        blob = document.createElement('div');
        blob.className = styles.surrogate;
        blob.setAttribute('aria-hidden', 'true');
        stage.append(blob);
        const w = head.width * BLOB_START;
        const h = head.height * BLOB_START;
        gsap.set(blob, {
          left: head.left - originX + (head.width - w) / 2,
          top: head.top - originY + (head.height - h) / 2,
          width: w,
          height: h,
          borderRadius: '50%',
          backgroundColor: head.color,
          borderWidth: head.borderWidth,
          borderColor: head.borderColor,
          boxShadow: head.shadow,
          zIndex: 1,
          opacity: 0,
        });
      }
      const master = gsap.timeline({ onComplete: () => finish() });
      const finish = () => {
        if (finishRef.current !== finish) return;
        finishRef.current = null;
        master.kill();
        restore.forEach((fn) => fn());
        pairs.forEach(({ el }) => el.remove());
        blob?.remove();
        gsap.set(layer, {
          clearProps: 'opacity,visibility,filter,transform',
        });
        setFront(null);
      };
      finishRef.current = finish;
      track(master);

      const t = timeline(scene, !looks);
      // A. 앞 컴포넌트의 나머지 부품은 흐려지며 나간다.
      master.to(
        frontEl,
        { opacity: 0, filter: BLUR, duration: STEP.out, ease: ease.drift },
        0
      );
      if (looks) {
        // B. 펼침(더 넓어짐, 흩어짐)은 끝 값을 살짝 넘겼다 앉고, 접힘(모임)은 넘치지 않는다.
        const grows = !!scene.grows;
        const els = pairs.map(({ el }) => el);
        const stagger = scene.spread ? STAGGER : 0;
        // 넘침은 폭·높이를 키우되 가운데를 고정한다(left·top을 절반씩 당긴다).
        const pad = grows ? (OVERSHOOT - 1) / 2 : 0;
        if (shards) {
          // 깨짐: 8칸이 전환 시작부터 동시에 칸 가운데의 구슬로 오므라든다(반경은 지름의 절반).
          // 날아감이 구슬 단계 안에서 겹쳐 시작해도 반경은 이 트윈이 끝까지 끌고 간다.
          const bead = (i: number) =>
            BEAD * Math.min(pairs[i].a.width, pairs[i].a.height);
          master.to(
            els,
            {
              left: (i: number) =>
                pairs[i].a.left - originX + (pairs[i].a.width - bead(i)) / 2,
              top: (i: number) =>
                pairs[i].a.top - originY + (pairs[i].a.height - bead(i)) / 2,
              width: bead,
              height: bead,
              // 시작이 모서리별 4값이라 같은 4값으로 보낸다.
              borderRadius: (i: number) =>
                Array(4)
                  .fill(`${bead(i) / 2}px`)
                  .join(' '),
              duration: BREAK,
              ease: ease.drift,
              autoRound: false,
            },
            0
          );
        }
        master.to(
          els,
          {
            left: (i: number) => pairs[i].to.left - pairs[i].to.width * pad,
            top: (i: number) => pairs[i].to.top - pairs[i].to.height * pad,
            width: (i: number) => pairs[i].to.width * (1 + 2 * pad),
            height: (i: number) => pairs[i].to.height * (1 + 2 * pad),
            ...(shards
              ? {}
              : { borderRadius: (i: number) => pairs[i].to.borderRadius }),
            borderWidth: (i: number) => pairs[i].to.borderWidth,
            duration: t.move,
            ease: ease.drift,
            autoRound: false,
            stagger,
          },
          t.moveAt
        );
        if (grows) {
          master.to(
            els,
            {
              left: (i: number) => pairs[i].to.left,
              top: (i: number) => pairs[i].to.top,
              width: (i: number) => pairs[i].to.width,
              height: (i: number) => pairs[i].to.height,
              duration: STEP.settle,
              autoRound: false,
              ease: ease[scene.moveEase ?? 'settle'],
              stagger,
            },
            t.moveAt + t.move
          );
        }
        // 끝 넘김: 같은 자리의 진짜 부품이 자기 상태(점 밝기, 그림자, 테두리)로 보이기 시작하고 대리 상자는 걷힌다.
        // 시차가 있는 전환은 대리 상자마다 자기 도착에 맞춰 넘긴다.
        pairs.forEach(({ el, b }, i) => {
          const at = t.handoff.at + i * stagger;
          master.call(() => showTo.get(b)?.(), [], at);
          master.to(
            el,
            { opacity: 0, duration: t.handoff.seconds, ease: ease.drift },
            at
          );
        });
        // 색과 그림자는 일정하게 바뀐다. 투명으로 가는 몸통이 중간에 일찍 사라져 무대가 비지 않게, 되튀는 이징이 색 값을 벗어나지 않게.
        master.to(
          els,
          {
            backgroundColor: (i: number) => pairs[i].to.backgroundColor,
            borderColor: (i: number) => pairs[i].to.borderColor,
            boxShadow: (i: number) => pairs[i].to.boxShadow,
            duration: t.move,
            ease: ease.linear,
            stagger,
          },
          t.moveAt
        );
      }
      // C. 뒤 컴포넌트의 나머지 부품이 흐림에서 올라오며 들어온다.
      master.fromTo(
        layer,
        { autoAlpha: 0, filter: BLUR, y: RISE },
        {
          autoAlpha: 1,
          filter: 'blur(0px)',
          y: 0,
          duration: STEP.in,
          ease: ease.drift,
        },
        t.inAt
      );
      if (blob && head) {
        // 손잡이 방울. 폭과 높이를 같이 지름까지 부풀리고(snap이 한 번 넘쳤다 앉는다), left·top도 같은 이징으로 보내 가운데를 고정한다.
        // autoRound를 끈다: 작은 원에서 폭이 정수로 끊겨 1px 계단으로 보인다.
        master.to(
          blob,
          { opacity: 1, duration: BLOB_IN, ease: ease.linear },
          t.popAt
        );
        master.to(
          blob,
          {
            left: head.left - originX,
            top: head.top - originY,
            width: head.width,
            height: head.height,
            duration: BLOB_GROW,
            ease: ease.snap,
            autoRound: false,
          },
          t.popAt
        );
        // 부풀기의 마지막 구간에서 진짜 손잡이로 교차해 넘긴다(전환 끝을 늦추지 않는다).
        const handoffAt = t.popAt + BLOB_GROW * (1 - HANDOFF);
        master.call(() => showHead?.(), [], handoffAt);
        master.to(
          blob,
          { opacity: 0, duration: BLOB_GROW * HANDOFF, ease: ease.drift },
          handoffAt
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, [index, reduced, track]);

  // 하나의 타임라인. 장면마다 s<i>, s<i>:act, s<i>:out.
  useLayoutEffect(() => {
    const stage = stageRef.current;
    const cursor = cursorRef.current;
    if (reduced || !stage || !cursor) return;

    const ctx = gsap.context(() => {
      gsap.set(cursor, {
        x: stage.clientWidth * 0.78,
        y: stage.clientHeight * 0.82,
        transformOrigin: `${CURSOR_TIP}px ${CURSOR_TIP}px`,
      });
      // repeatRefresh: 한 바퀴마다 함수형 값(커서 목표)을 그 순간의 위치로 다시 잰다.
      const tl = gsap.timeline({ repeat: -1, repeatRefresh: true });
      const pace = {};

      const find =
        (selector: string, text?: string): Target =>
        () =>
          Array.from(
            stage.querySelectorAll<HTMLElement>(
              `[data-layer="current"] ${selector}`
            )
          ).find(
            (el) => text === undefined || el.textContent?.includes(text)
          ) ?? null;
      const at: ActApi['at'] = (target, fx = 0.5) => {
        const el = target();
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const s = stage.getBoundingClientRect();
        return {
          x: r.left - s.left + r.width * fx - CURSOR_TIP,
          y: r.top - s.top + r.height / 2 - CURSOR_TIP,
        };
      };
      let held: HTMLElement | null = null;
      const api: ActApi = {
        tl,
        cursor,
        find,
        at,
        move: (target, seconds, fx = 0.5) => {
          tl.to(cursor, {
            x: () => at(target, fx)?.x ?? Number(gsap.getProperty(cursor, 'x')),
            y: () => at(target, fx)?.y ?? Number(gsap.getProperty(cursor, 'y')),
            duration: seconds,
            ease: ease.settle,
          });
        },
        hover: (target) => {
          tl.call(() => firePointer(target(), 'pointerover'));
        },
        down: (target) => {
          tl.call(() => {
            held = target();
            firePointer(held, 'pointerdown');
          });
          tl.to(cursor, { scale: 0.8, duration: dur.fast, ease: ease.settle });
        },
        up: (_target, clickToo = true) => {
          tl.call(() => {
            firePointer(held, 'pointerup');
            if (clickToo) held?.click();
          });
          tl.to(cursor, { scale: 1, duration: dur.fast, ease: ease.settle });
        },
        press: (target) => {
          api.down(target);
          api.up(target);
        },
        wait: (seconds) => {
          tl.to(pace, { duration: seconds });
        },
        set: (patch) => {
          tl.call(() => update(patch));
        },
        now: update,
      };

      order.forEach((i) => {
        const scene = SCENES[i];
        tl.addLabel(`s${i}`);
        tl.call(() => goTo(i));
        tl.to(pace, { duration: enterSeconds(scene) });
        tl.addLabel(`s${i}:act`);
        scene.act(api);
        tl.addLabel(`s${i}:out`);
        tl.to(pace, { duration: HOLD });
      });
      tlRef.current = tl;
    }, stage);

    const fx = fxRef.current;
    return () => {
      ctx.revert();
      tlRef.current = null;
      fx.forEach((a) => a.kill());
      fx.clear();
      finishRef.current?.();
    };
  }, [reduced, goTo, update, order]);

  // 폭이 좁아져 지금 장면이 건너뛰는 장면이면 첫 장면으로 곧장 옮긴다.
  useEffect(() => {
    if (!order.includes(indexRef.current)) goTo(order[0], false);
  }, [order, goTo]);

  // 멈춤·재개. 마우스가 나갔다면 그 장면의 :out부터 이어 간다(처음으로 돌아가지 않는다).
  // 건너뛴 act가 만들었어야 할 상태(ensure)는 먼저 맞추고, React가 그린 다음 프레임에 재생한다.
  useEffect(() => {
    const tl = tlRef.current;
    if (!tl) return;
    const fx = fxRef.current;
    if (!playing) {
      tl.pause();
      // 만지려고 멈춘 것이면 진행 중인 전환은 건드리지 않는다(자기 속도로 끝나게 둔다).
      // 화면 밖·탭 숨김이면 그 자리에서 멈췄다 이어 간다.
      if (!takeover) fx.forEach((a) => a.pause());
      return;
    }
    pruneDone(fx);
    fx.forEach((a) => a.resume());
    if (tookOverRef.current) {
      tookOverRef.current = false;
      const label = `s${indexRef.current}:out`;
      const ensure = SCENES[indexRef.current].ensure;
      if (!ensure) {
        tl.play(label);
        return;
      }
      update(ensure);
      let pending = true;
      const frame = requestAnimationFrame(() => {
        pending = false;
        tl.play(label);
      });
      return () => {
        if (!pending) return;
        cancelAnimationFrame(frame);
        // 그 전에 다시 멈췄으면 다음 재개도 :out부터 이어 간다
        tookOverRef.current = true;
      };
    }
    tl.resume();
  }, [playing, takeover, update]);

  // 보이는지(화면 밖, 탭 숨김)와 마우스·터치로 넘겨받기.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const io = new IntersectionObserver(([entry]) =>
      setFlag('offscreen', !entry.isIntersecting)
    );
    io.observe(stage);
    const onVisibility = () => setFlag('hidden', document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    const onEnter = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      tookOverRef.current = true;
      setFlag('hover', true);
    };
    const onLeave = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') setFlag('hover', false);
    };
    // 터치에는 마우스가 "나가는" 일이 없다. 무대를 누르면 멈추고, 재개는 멈춤 단추다.
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') return;
      if ((e.target as Element).closest('[data-showcase-control]')) return;
      tookOverRef.current = true;
      setFlag('user', true);
    };
    stage.addEventListener('pointerenter', onEnter);
    stage.addEventListener('pointerleave', onLeave);
    stage.addEventListener('pointerdown', onDown);
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      stage.removeEventListener('pointerenter', onEnter);
      stage.removeEventListener('pointerleave', onLeave);
      stage.removeEventListener('pointerdown', onDown);
    };
  }, [setFlag]);

  const scene = SCENES[index];

  return (
    <section className={styles.root} aria-label="컴포넌트 쇼케이스">
      <div ref={stageRef} className={styles.stage} data-playing={playing}>
        {[front, index].map(
          (n) =>
            n !== null && (
              <div
                key={n}
                className={styles.layer}
                data-layer={n === index ? 'current' : 'leaving'}
                data-id={SCENES[n].id}
                data-wide={SCENES[n].wide ? '' : undefined}
                inert={n === index ? playing : true}
              >
                <SceneContent scene={n} demo={demo} on={on} />
              </div>
            )
        )}
        <span ref={cursorRef} className={styles.cursor} aria-hidden="true">
          <MousePointer2
            size={CURSOR_SIZE}
            fill="currentColor"
            stroke={themeContract.color.background.default}
          />
        </span>
        {!reduced && (
          <div className={styles.control} data-showcase-control>
            <IconButton
              size="sm"
              aria-label={flags.user ? '자동 재생 다시 시작' : '자동 재생 멈춤'}
              onClick={() => setFlag('user', !flags.user)}
            >
              {flags.user ? <Play /> : <Pause />}
            </IconButton>
          </div>
        )}
      </div>
      <div className={styles.footer}>
        <p
          className={styles.caption}
          aria-live={reduced ? 'polite' : undefined}
        >
          {scene.name}
        </p>
        {reduced && (
          <Button
            size="sm"
            variant="light"
            onClick={() =>
              goTo(order[(order.indexOf(index) + 1) % order.length], false)
            }
          >
            다음 장면
          </Button>
        )}
      </div>
    </section>
  );
}
