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
import { hideParts, reachable, type Look, type Part } from './parts';
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

// 전환 사이 멈춤(fast).
const HOLD = dur.fast;
// 흐림 양과 커서 아이콘 크기(lucide MousePointer2 화살촉은 24px 상자의 (4,4)).
const BLUR = 'blur(6px)';
const CURSOR_SIZE = 24;
const CURSOR_TIP = 4;
// 흩어지거나 모이는 대리 상자 사이의 시차(20~40ms).
const STAGGER = 0.03;
// 슬라이더 손잡이가 채움 끝에서 튀어나오기 시작하는 때(대리 상자가 거의 닿았을 때).
const POP_DELAY = dur.slow * 0.8;

/** 장면에 들어오는 전환이 끝나기까지(초). 연출은 그 뒤에 시작한다 */
const enterSeconds = (scene: Scene) =>
  Math.max(
    dur.slow,
    // 뒤 컴포넌트의 나머지 부품이 절반 지점에서 base 동안 들어온다.
    dur.slow / 2 + dur.base,
    scene.pop ? POP_DELAY + dur.slow : 0
  ) + (scene.spread ? (scene.spread - 1) * STAGGER : 0);

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
      const restore = looks ? [hideParts(looks.from), hideParts(looks.to)] : [];

      const pairs = looks
        ? Array.from(
            { length: Math.max(looks.from.length, looks.to.length) },
            (_, i) => {
              const a = looks.from[Math.min(i, looks.from.length - 1)];
              const b = looks.to[Math.min(i, looks.to.length - 1)];
              const el = document.createElement('div');
              el.className = styles.surrogate;
              el.setAttribute('aria-hidden', 'true');
              stage.append(el);
              // 테두리가 한쪽에만 있으면 없는 쪽도 그 색을 이어받아 색이 중간에 튀지 않는다.
              gsap.set(el, {
                left: a.left - originX,
                top: a.top - originY,
                width: a.width,
                height: a.height,
                borderRadius: a.radius,
                backgroundColor: reachable(b.color, a.color),
                borderWidth: a.borderWidth,
                borderColor: a.borderWidth ? a.borderColor : b.borderColor,
              });
              return {
                el,
                to: {
                  left: b.left - originX,
                  top: b.top - originY,
                  width: b.width,
                  height: b.height,
                  borderRadius: b.radius,
                  backgroundColor: reachable(a.color, b.color),
                  borderWidth: b.borderWidth,
                  borderColor: b.borderWidth ? b.borderColor : a.borderColor,
                },
              };
            }
          )
        : [];

      const popEl = scene.pop?.(layer);
      const master = gsap.timeline({ onComplete: () => finish() });
      const finish = () => {
        if (finishRef.current !== finish) return;
        finishRef.current = null;
        master.kill();
        restore.forEach((fn) => fn());
        pairs.forEach(({ el }) => el.remove());
        gsap.set(popEl ? [layer, popEl] : layer, {
          clearProps: 'opacity,visibility,filter,transform',
        });
        setFront(null);
      };
      finishRef.current = finish;
      track(master);

      // 앞 컴포넌트의 나머지 부품은 흐려지며 나간다.
      master.to(
        frontEl,
        { opacity: 0, filter: BLUR, duration: dur.fast, ease: ease.exit },
        0
      );
      if (looks) {
        // 펼침(더 넓어짐, 흩어짐)은 넘치고 접힘(모임)은 넘치지 않는다.
        const area = (ls: Look[]) =>
          ls.reduce((sum, l) => sum + l.width * l.height, 0);
        const grows =
          looks.from.length !== looks.to.length
            ? looks.to.length > looks.from.length
            : area(looks.to) > area(looks.from);
        master.to(
          pairs.map(({ el }) => el),
          {
            left: (i: number) => pairs[i].to.left,
            top: (i: number) => pairs[i].to.top,
            width: (i: number) => pairs[i].to.width,
            height: (i: number) => pairs[i].to.height,
            borderRadius: (i: number) => pairs[i].to.borderRadius,
            backgroundColor: (i: number) => pairs[i].to.backgroundColor,
            borderWidth: (i: number) => pairs[i].to.borderWidth,
            borderColor: (i: number) => pairs[i].to.borderColor,
            duration: dur.slow,
            ease: grows ? ease.snap : ease.settle,
            stagger: scene.spread ? STAGGER : 0,
          },
          0
        );
      }
      // 뒤 컴포넌트의 나머지 부품은 대리 상자가 절반쯤 왔을 때 들어온다.
      master.fromTo(
        layer,
        { autoAlpha: 0, filter: BLUR },
        {
          autoAlpha: 1,
          filter: 'blur(0px)',
          duration: dur.base,
          ease: ease.settle,
        },
        dur.slow / 2
      );
      if (popEl) {
        master.fromTo(
          popEl,
          { scale: 0 },
          { scale: 1, duration: dur.slow, ease: ease.snap },
          POP_DELAY
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
  useEffect(() => {
    const tl = tlRef.current;
    if (!tl) return;
    const fx = fxRef.current;
    if (!playing) {
      tl.pause();
      // 만지려고 멈춘 것이면 진행 중인 전환은 건드리지 않는다(원래 속도로 길어야 slow 안에 끝난다).
      // 화면 밖·탭 숨김이면 그 자리에서 멈췄다 이어 간다.
      if (!takeover) fx.forEach((a) => a.pause());
      return;
    }
    pruneDone(fx);
    fx.forEach((a) => a.resume());
    if (tookOverRef.current) {
      tookOverRef.current = false;
      tl.play(`s${indexRef.current}:out`);
    } else {
      tl.resume();
    }
  }, [playing, takeover]);

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
