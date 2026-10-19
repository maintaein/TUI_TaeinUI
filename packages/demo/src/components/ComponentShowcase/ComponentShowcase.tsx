import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import gsap from 'gsap';
import { Flip } from 'gsap/Flip';
import { MousePointer2, Pause, Play } from 'lucide-react';
import {
  Button,
  IconButton,
  themeContract,
  useReducedMotion,
} from '@taein-ui/core';
import * as styles from './ComponentShowcase.css';
import {
  INITIAL_DEMO,
  SCENES,
  STATS_SCENE,
  SceneContent,
  dur,
  ease,
  type Actions,
  type ActApi,
  type Demo,
  type Shape,
  type Target,
} from './scenes';

gsap.registerPlugin(Flip);

// 장면 시작에서 연출이 시작되기까지(틀 slow, 새 내용은 절반 지점부터 base).
const ENTER = dur.slow;
// 전환 사이 멈춤(fast).
const HOLD = dur.fast;
// 흐림 양과 커서 아이콘 크기(lucide MousePointer2 화살촉은 24px 상자의 (4,4)).
const BLUR = 'blur(6px)';
const CURSOR_SIZE = 24;
const CURSOR_TIP = 4;

interface Flags {
  /** 멈춤 단추, 또는 터치로 무대를 누름 */
  user: boolean;
  /** 진짜 마우스가 무대 안에 있다 */
  hover: boolean;
  offscreen: boolean;
  hidden: boolean;
}

interface Leaving {
  scene: number;
  demo: Demo;
}

const pruneDone = (fx: Set<gsap.core.Animation>) => {
  for (const a of fx) if (a.progress() >= 1) fx.delete(a);
};

const firePointer = (el: Element | null, type: 'pointerdown' | 'pointerup') =>
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

/** 층의 크기(패딩 포함)와 모양에 맞는 틀의 값 */
const shellFor = (stage: HTMLElement, layer: HTMLElement, shape: Shape) => {
  let width = layer.offsetWidth;
  let height = layer.offsetHeight;
  // 원은 긴 쪽에 맞춘 정사각형. 반경은 아래 min/2가 그대로 full이 된다.
  if (shape === 'circle') width = height = Math.max(width, height);
  let borderRadius = Math.min(width, height) / 2;
  if (shape === 'card') {
    // 토큰(borderRadius.xl)의 실제 px. gsap은 var()를 트윈하지 못한다.
    const probe = document.createElement('div');
    probe.style.borderRadius = themeContract.borderRadius.xl;
    stage.append(probe);
    borderRadius = parseFloat(getComputedStyle(probe).borderTopLeftRadius);
    probe.remove();
  }
  return { width, height, borderRadius };
};

export function ComponentShowcase() {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [demo, setDemo] = useState<Demo>(INITIAL_DEMO);
  const [leaving, setLeaving] = useState<Leaving | null>(null);
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
  const shellRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);
  const indexRef = useRef(0);
  const demoRef = useRef(INITIAL_DEMO);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  // React 커밋 뒤에 레이아웃 효과에서 만든 트윈들. 멈춤·재개를 마스터와 같이 건다.
  const fxRef = useRef(new Set<gsap.core.Animation>());
  const flipRef = useRef<ReturnType<typeof Flip.getState> | null>(null);
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
      period: (value) => {
        update({ period: value as Demo['period'] });
        if (indexRef.current === STATS_SCENE) {
          update({ stats: 'loading' });
          setTimeout(() => update({ stats: 'ready' }), 500);
        }
      },
      volume: (volume) => update({ volume }),
      notify: (notify) => update({ notify }),
      query: (query) => update({ query }),
      remove: (label) =>
        update({ chips: demoRef.current.chips.filter((c) => c !== label) }),
      pick: (label) => update({ picked: label }),
    }),
    [update]
  );

  // 장면 i로 넘어간다. 옛 내용은 떠나는 층으로 남기고(다른 묶음),
  // 같은 묶음이면 공유 요소의 옛 자리를 잰다(Flip).
  const goTo = useCallback(
    (i: number) => {
      const from = indexRef.current;
      if (from !== i) {
        if (SCENES[from].group === SCENES[i].group) {
          flipRef.current = Flip.getState(
            stageRef.current?.querySelectorAll(
              '[data-layer="current"] [data-flip-id]'
            ) ?? []
          );
        } else {
          setLeaving({ scene: from, demo: demoRef.current });
        }
        indexRef.current = i;
        setIndex(i);
      }
      update(SCENES[i].enter);
    },
    [update]
  );

  // 틀과 내용의 전환. 장면이 바뀐 React 커밋 뒤, 그려지기 전에 만든다.
  useLayoutEffect(() => {
    const stage = stageRef.current;
    const shell = shellRef.current;
    const layer = stage?.querySelector<HTMLElement>('[data-layer="current"]');
    if (!stage || !shell || !layer) return;
    const scene = SCENES[index];
    const next = shellFor(stage, layer, scene.shape);
    const previous = shownRef.current;
    shownRef.current = index;

    if (previous === null || previous === index || reduced) {
      gsap.killTweensOf(shell, 'width,height,borderRadius');
      gsap.set(shell, next);
      flipRef.current = null;
      // 모션 축소: 떠나는 층 없이 즉시 바뀐다.
      if (previous !== index) queueMicrotask(() => setLeaving(null));
      return;
    }

    // 펼침은 넘치고(snap) 접힘은 넘치지 않는다(settle).
    const grows =
      next.width * next.height > shell.offsetWidth * shell.offsetHeight;
    track(
      gsap.to(shell, {
        ...next,
        duration: dur.slow,
        ease: grows ? ease.snap : ease.settle,
        overwrite: 'auto',
      })
    );

    const flipState = flipRef.current;
    flipRef.current = null;
    if (flipState) {
      // 같은 묶음: 공유 요소는 같은 요소가 새 자리로 미끄러지고, 새로 생긴 부분만 흐림으로 들어온다.
      track(Flip.from(flipState, { duration: dur.slow, ease: ease.settle }));
      const entering = layer.querySelectorAll(
        '[data-enter], [data-enter-children] > *'
      );
      track(
        gsap.fromTo(
          entering,
          { opacity: 0, filter: BLUR },
          {
            opacity: 1,
            filter: 'blur(0px)',
            duration: dur.base,
            ease: ease.settle,
            delay: dur.slow / 2,
            stagger: 0.06,
            clearProps: 'opacity,filter',
          }
        )
      );
      return;
    }

    // 다른 묶음: 옛 내용은 흐려지며 나가고, 새 내용은 틀 전환의 절반 지점부터 들어온다.
    const old = stage.querySelector('[data-layer="leaving"]');
    if (old) {
      track(
        gsap.to(old, {
          opacity: 0,
          filter: BLUR,
          duration: dur.fast,
          ease: ease.exit,
          onComplete: () => setLeaving(null),
        })
      );
    }
    track(
      gsap.fromTo(
        layer,
        { opacity: 0, filter: BLUR },
        {
          opacity: 1,
          filter: 'blur(0px)',
          duration: dur.base,
          ease: ease.settle,
          delay: dur.slow / 2,
          clearProps: 'opacity,filter',
        }
      )
    );
  }, [index, reduced, track]);

  // 하나의 타임라인. 장면마다 s<i>, s<i>:act, s<i>:out.
  useLayoutEffect(() => {
    const stage = stageRef.current;
    const shell = shellRef.current;
    const cursor = cursorRef.current;
    if (reduced || !stage || !shell || !cursor) return;

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
          // ponytail: 목표 중심으로 곧장 간다. 장면 안에서 목표가 움직이면(Flip 중) 시작 시점 좌표로 간다.
          tl.to(cursor, {
            x: () => at(target, fx)?.x ?? Number(gsap.getProperty(cursor, 'x')),
            y: () => at(target, fx)?.y ?? Number(gsap.getProperty(cursor, 'y')),
            duration: seconds,
            ease: ease.settle,
          });
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
        pop: () => {
          tl.call(() => {
            track(
              gsap
                .timeline()
                .to(shell, {
                  scale: 1.08,
                  duration: dur.fast,
                  ease: ease.settle,
                })
                .to(shell, { scale: 1, duration: dur.fast, ease: ease.snap })
            );
          });
        },
      };

      SCENES.forEach((scene, i) => {
        tl.addLabel(`s${i}`);
        tl.call(() => goTo(i));
        tl.to(pace, { duration: ENTER });
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
    };
  }, [reduced, goTo, update, track]);

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
    // 창 크기가 바뀌면 틀을 지금 내용 크기로 곧장 맞춘다.
    const ro = new ResizeObserver(() => {
      const shell = shellRef.current;
      const layer = stage.querySelector<HTMLElement>('[data-layer="current"]');
      if (!shell || !layer) return;
      gsap.killTweensOf(shell, 'width,height,borderRadius');
      gsap.set(shell, shellFor(stage, layer, SCENES[indexRef.current].shape));
    });
    ro.observe(stage);
    return () => {
      io.disconnect();
      ro.disconnect();
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
        <div ref={shellRef} className={styles.shell} />
        {leaving && (
          <div
            className={styles.layer}
            data-layer="leaving"
            data-shape={SCENES[leaving.scene].shape}
            inert
          >
            <SceneContent scene={leaving.scene} demo={leaving.demo} on={on} />
          </div>
        )}
        <div
          key={scene.group}
          className={styles.layer}
          data-layer="current"
          data-shape={scene.shape}
          inert={playing}
        >
          <SceneContent scene={index} demo={demo} on={on} />
        </div>
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
            onClick={() => goTo((index + 1) % SCENES.length)}
          >
            다음 장면
          </Button>
        )}
      </div>
    </section>
  );
}
