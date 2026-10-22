import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import gsap from 'gsap';
import { MousePointer2, Pause, Play } from 'lucide-react';
import { IconButton, themeContract, useReducedMotion } from '@taein-ui/core';
import { dur, ease } from '../ComponentShowcase/scenes';
import * as styles from './Stage.css';

/** 대본이 타임라인에 얹는 동작. 대상은 `data-stage-target="이름"`이 붙은 요소다 */
export interface Act {
  /** 연출 커서를 대상으로 옮긴다 */
  move: (target: string, seconds?: number) => void;
  /** 합성 pointerover와 mouseover(마우스가 올라옴, React의 onMouseEnter도 켠다). 대상과 무대 안 조상에 data-stage-hover를 붙여 CSS :hover 쌍둥이 규칙을 켠다 */
  hover: (target: string) => void;
  /** 합성 pointerout과 mouseout(onMouseLeave도 켠다). data-stage-hover를 뗀다 */
  leave: (target: string) => void;
  /** 합성 pointerdown, 잠깐 뒤 pointerup과 click. 누르는 동안 대상과 무대 안 조상에 data-stage-active를 붙여 CSS :active 쌍둥이 규칙을 켠다. 커서는 눌렸다 돌아온다. holdSeconds를 주면 그만큼 누른 채 있는다(길게 누르기) */
  press: (target: string, holdSeconds?: number) => void;
  wait: (seconds: number) => void;
  /** 커서를 무대 안 쉬는 자리로 되돌린다 */
  home: (seconds?: number) => void;
  /** 대상에 포커스를 준다(다른 곳에 포커스가 있으면 뺏지 않는다) */
  focus: (target: string) => void;
  /** 대상의 포커스를 뺀다 */
  blur: (target: string) => void;
  /** 입력칸에 글자를 한 자씩 넣는다. 값을 코드로 바꾸고 input 이벤트를 보낸다 */
  type: (target: string, text: string) => void;
  /** 입력칸을 비운다 */
  clear: (target: string) => void;
  /**
   * 대상(시트)의 윗부분(손잡이 자리)으로 가서 잡고 아래로 dy만큼 끌었다 놓는다. core 시트는 pointer가 아니라 mouse 이벤트로 끌린다:
   * 합성 mousedown, 문서에 mousemove, 문서에 mouseup. 커서가 손잡이를 따라간다
   */
  pull: (target: string, dy: number, seconds?: number) => void;
  /** 범위 입력(슬라이더)의 손잡이를 잡고 to까지 끌었다 놓는다. 합성 pointerdown, 값을 코드로 옮기며 input 이벤트, 합성 pointerup. 커서가 손잡이를 따라간다 */
  drag: (target: string, to: number, seconds?: number) => void;
}

export interface StageProps {
  /** 스크린 리더가 읽는 무대 이름 */
  label: string;
  /** 없으면 자동 시연 없이 무대만 된다. 렌더마다 바뀌지 않는 값(모듈 상수)이어야 한다 */
  script?: (act: Act) => void;
  /**
   * 함수면 오버레이용 상자를 넘긴다(core `container`). 오버레이는 무대 안, 일시정지 단추 아래 줄에 갇혀 뜨고,
   * 자동 시연 중에는 그 상자가 `inert`라 열려도 페이지의 포커스를 가져가지 못한다
   */
  children: ReactNode | ((container: HTMLElement) => ReactNode);
  /** 무대가 시연을 멈출 때(진짜 입력이 넘겨받음, 일시정지, 화면 밖, 탭 숨김) 부른다. 대본이 열어 둔 오버레이를 닫는 데 쓴다 */
  onPause?: () => void;
  className?: string;
}

interface Flags {
  /** 일시정지 단추 */
  user: boolean;
  /** 진짜 마우스가 무대 안(조작 단추 위는 빼고)에 있다 */
  hover: boolean;
  /** 키보드 포커스가 무대 안 요소에 있다 */
  focus: boolean;
  offscreen: boolean;
  hidden: boolean;
}

// 누른 채 있는 시간: 커서가 눌리는 시간(fast)에 잠깐의 멈춤(HOLD)을 더한다
const HOLD = 0.12;
// 글자 하나가 들어가는 시간(초)
const KEY = 0.09;
const CURSOR_SCALE = 0.8;
const CONTROL = '[data-stage-control]';
const HOVER_ATTR = 'data-stage-hover';
const ACTIVE_ATTR = 'data-stage-active';

const mirrored = new WeakSet<CSSStyleSheet>();

// 합성 이벤트는 CSS :hover와 :active를 켜지 못한다. 그래서 그 규칙마다 :hover를 [data-stage-hover]로,
// :active를 [data-stage-active]로 바꾼 쌍둥이를 바로 뒤에 넣어 둔다(같은 미디어 조건 안, 같은 특이도).
// 그 속성은 무대 안 요소에만 붙는다.
// 안쪽 규칙부터 거꾸로 돌아야 넣어도 앞 규칙의 번호가 밀리지 않는다.
// shortcut: 시트당 한 번만 훑고 CSS 중첩 규칙의 안쪽은 보지 않는다, 런타임에 규칙이 더해지는 시트나 중첩 CSS를 쓰게 되면 고친다
const mirrorRules = (box: CSSStyleSheet | CSSGroupingRule) => {
  const list = box.cssRules;
  for (let i = list.length - 1; i >= 0; i--) {
    const rule = list[i];
    if (rule instanceof CSSStyleRule) {
      if (!/:hover|:active/.test(rule.selectorText)) continue;
      const selector = rule.selectorText
        .replace(/:hover/g, `[${HOVER_ATTR}]`)
        .replace(/:active/g, `[${ACTIVE_ATTR}]`);
      const twin = `${selector} { ${rule.style.cssText} }`;
      try {
        box.insertRule(twin, i + 1);
      } catch {
        continue;
      }
    } else if (rule instanceof CSSGroupingRule) {
      mirrorRules(rule);
    }
  }
};

const mirrorHover = () => {
  for (const sheet of document.styleSheets) {
    if (mirrored.has(sheet)) continue;
    mirrored.add(sheet);
    try {
      mirrorRules(sheet);
    } catch {
      // 다른 출처 시트는 규칙을 읽을 수 없다
    }
  }
};

// React의 입력 추적을 거치도록 프로토타입의 value 설정자로 쓴다
const setValue = (
  el: HTMLInputElement | HTMLTextAreaElement,
  value: string
) => {
  const proto =
    el instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value')?.set?.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
};

// 대상과 무대 안 조상에 거울 속성을 붙이거나 뗀다
const mark = (el: Element | null, root: Element, attr: string, on: boolean) => {
  for (let n = el; n && n !== root; n = n.parentElement)
    if (on) n.setAttribute(attr, '');
    else n.removeAttribute(attr);
};

// 올라가 있던 대상에는 mouseout도 보낸다. onMouseEnter로 멈춘 것(Snackbar 막대, Tooltip)이 멈춘 채 남지 않게 한다
const clearMirror = (root: Element) => {
  root
    .querySelectorAll(`[${HOVER_ATTR}][data-stage-target]`)
    .forEach((n) => fireMouse(n, 'mouseout'));
  root.querySelectorAll(`[${HOVER_ATTR}], [${ACTIVE_ATTR}]`).forEach((n) => {
    n.removeAttribute(HOVER_ATTR);
    n.removeAttribute(ACTIVE_ATTR);
  });
};

// React의 onMouseEnter와 onMouseLeave는 pointer가 아니라 mouseover와 mouseout에서 만들어진다.
// relatedTarget이 없으면 창 밖에서 들어오고 나가는 것으로 읽혀 대상과 그 조상 모두에 enter와 leave가 간다
const fireMouse = (el: Element | null, type: 'mouseover' | 'mouseout') =>
  el?.dispatchEvent(
    new MouseEvent(type, { bubbles: true, cancelable: true, view: window })
  );

const firePointer = (
  el: Element | null,
  type: 'pointerdown' | 'pointerup' | 'pointerover' | 'pointerout'
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

/**
 * 진짜 컴포넌트를 children으로 받는 무대. script가 있으면 연출 커서가 눌러 보이는 자동 시연을 반복한다.
 * 진짜 입력(마우스, 키보드 포커스)이 들어오면 멈춰 넘겨주고 떠나면 이어 간다.
 * 화면 밖, 탭 숨김, 움직임 줄이기 설정에서는 돌지 않는다.
 */
export function Stage({
  label,
  script,
  children,
  onPause,
  className,
}: StageProps) {
  const reduced = useReducedMotion();
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  const [layer, setLayer] = useState<HTMLDivElement | null>(null);
  const onPauseRef = useRef(onPause);
  onPauseRef.current = onPause;
  const cursor = useRef<SVGSVGElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  // 대본이 준 포커스는 넘겨받기로 보지 않는다
  const scripted = useRef(false);
  // 대본이 잡고 있는 것(drag)을 놓는 함수들. 멈추거나 정리될 때 잡은 채 남지 않게 부른다
  const holds = useRef(new Set<() => void>());
  const [flags, setFlags] = useState<Flags>({
    user: false,
    hover: false,
    focus: false,
    offscreen: false,
    hidden: false,
  });
  const setFlag = (key: keyof Flags, value: boolean) =>
    setFlags((f) => (f[key] === value ? f : { ...f, [key]: value }));
  const playing = !reduced && !Object.values(flags).some(Boolean);
  const demo = script && !reduced;

  useEffect(mirrorHover, []);

  // 대본을 타임라인으로 만든다
  useEffect(() => {
    const cur = cursor.current;
    if (!root || !cur || !script || reduced) return;
    const timers = new Set<number>();
    const grips = holds.current;
    const find = (name: string) =>
      root.querySelector<HTMLElement>(`[data-stage-target="${name}"]`);
    // 화살촉이 대상의 오른쪽 아래쪽에 앉는다. 범위 입력은 지금 값의 손잡이(지름 24px) 위에 앉는다
    const at = (name: string) => {
      const el = find(name);
      const t = el?.getBoundingClientRect();
      const r = root.getBoundingClientRect();
      if (!el || !t) return { x: 0, y: 0 };
      if (el instanceof HTMLInputElement && el.type === 'range') {
        const min = Number(el.min || 0);
        const span = Number(el.max || 100) - min;
        const f = span ? (Number(el.value) - min) / span : 0;
        return {
          x: t.left - r.left + 12 + (t.width - 24) * f,
          y: t.top - r.top + t.height / 2,
        };
      }
      return {
        x: t.left - r.left + t.width * 0.62,
        y: t.top - r.top + t.height * 0.6,
      };
    };
    const rest = () => ({
      x: root.clientWidth * 0.74,
      y: root.clientHeight * 0.8,
    });
    gsap.set(cur, { ...rest(), autoAlpha: 1 });

    // 대상 위치는 반복마다 다시 잰다(창 크기, 조작판으로 바뀐 버튼 크기)
    const tl = gsap.timeline({ repeat: -1, repeatRefresh: true, delay: 0.6 });
    const act: Act = {
      move: (target, seconds = dur.slow * 2) => {
        tl.to(cur, {
          x: () => at(target).x,
          y: () => at(target).y,
          duration: seconds,
          ease: ease.settle,
        });
      },
      hover: (target) => {
        tl.call(() => {
          const el = find(target);
          firePointer(el, 'pointerover');
          fireMouse(el, 'mouseover');
          // 합성 이벤트는 :hover를 못 켜므로 쌍둥이 규칙의 속성을 대상과 무대 안 조상에 붙인다
          mark(el, root, HOVER_ATTR, true);
        });
      },
      leave: (target) => {
        tl.call(() => {
          const el = find(target);
          firePointer(el, 'pointerout');
          fireMouse(el, 'mouseout');
          mark(el, root, HOVER_ATTR, false);
        });
      },
      press: (target, holdSeconds = HOLD) => {
        // 누름과 뗌을 한 호출에서 끝낸다. 중간에 멈춰도 눌린 채 남지 않는다
        tl.call(() => {
          const el = find(target);
          firePointer(el, 'pointerdown');
          mark(el, root, ACTIVE_ATTR, true);
          const id = window.setTimeout(
            () => {
              timers.delete(id);
              firePointer(el, 'pointerup');
              mark(el, root, ACTIVE_ATTR, false);
              el?.click();
            },
            (dur.fast + holdSeconds) * 1000
          );
          timers.add(id);
        })
          .to(cur, {
            scale: CURSOR_SCALE,
            duration: dur.fast,
            ease: ease.settle,
          })
          .to(
            cur,
            { scale: 1, duration: dur.fast, ease: ease.settle },
            `+=${holdSeconds}`
          );
      },
      wait: (seconds) => {
        tl.to(cur, { duration: seconds });
      },
      focus: (target) => {
        tl.call(() => {
          const el = find(target);
          const active = document.activeElement;
          if (active && active !== document.body && !root.contains(active))
            return;
          scripted.current = true;
          el?.focus({ preventScroll: true });
          scripted.current = false;
        });
      },
      blur: (target) => {
        tl.call(() => {
          const el = find(target);
          if (el && el === document.activeElement) el.blur();
        });
      },
      type: (target, text) => {
        const proxy = { n: 0 };
        tl.fromTo(
          proxy,
          { n: 0 },
          {
            n: text.length,
            duration: text.length * KEY,
            ease: ease.linear,
            onUpdate: () => {
              const el = find(target);
              const next = text.slice(0, Math.round(proxy.n));
              if (
                (el instanceof HTMLInputElement ||
                  el instanceof HTMLTextAreaElement) &&
                el.value !== next
              )
                setValue(el, next);
            },
          }
        );
      },
      clear: (target) => {
        tl.call(() => {
          const el = find(target);
          if (
            el instanceof HTMLInputElement ||
            el instanceof HTMLTextAreaElement
          )
            setValue(el, '');
        });
      },
      drag: (target, to, seconds = dur.slower * 3) => {
        const proxy = { v: 0 };
        let held = false;
        const drop = () => {
          if (!held) return;
          held = false;
          grips.delete(drop);
          const el = find(target);
          firePointer(el, 'pointerup');
          mark(el, root, ACTIVE_ATTR, false);
        };
        tl.call(() => {
          proxy.v = Number((find(target) as HTMLInputElement | null)?.value);
        }).to(proxy, {
          v: to,
          duration: seconds,
          ease: ease.drift,
          onUpdate: () => {
            const el = find(target);
            if (!(el instanceof HTMLInputElement) || el.disabled) return;
            if (!held) {
              held = true;
              grips.add(drop);
              firePointer(el, 'pointerdown');
              mark(el, root, ACTIVE_ATTR, true);
            }
            const next = String(Math.round(proxy.v));
            if (el.value !== next) setValue(el, next);
            gsap.set(cur, at(target));
          },
          onComplete: drop,
        });
      },
      pull: (target, dy, seconds = dur.slower * 2) => {
        const proxy = { v: 0 };
        // 손잡이 자리: 윗변 가운데에서 16px 아래. 대상 위치는 반복마다 다시 잰다
        const grip = () => {
          const t = find(target)?.getBoundingClientRect();
          const r = root.getBoundingClientRect();
          return t
            ? { x: t.left - r.left + t.width / 2, y: t.top - r.top + 16 }
            : { x: 0, y: 0 };
        };
        let held = false;
        let startY = 0;
        // 잡은 자리(무대 기준). 시트가 내려가도 커서는 여기서 dy만큼만 간다
        let anchor = { x: 0, y: 0 };
        const send = (type: 'mousemove' | 'mouseup') =>
          document.dispatchEvent(
            new MouseEvent(type, {
              bubbles: true,
              clientY: startY + proxy.v,
              button: 0,
            })
          );
        const drop = () => {
          if (!held) return;
          held = false;
          grips.delete(drop);
          send('mouseup');
          mark(find(target), root, ACTIVE_ATTR, false);
        };
        tl.to(cur, {
          x: () => grip().x,
          y: () => grip().y,
          duration: dur.slow * 2,
          ease: ease.settle,
        })
          .call(() => {
            proxy.v = 0;
          })
          .to(proxy, {
            v: dy,
            duration: seconds,
            ease: ease.drift,
            onUpdate: () => {
              const el = find(target);
              if (!el) return;
              if (!held) {
                held = true;
                grips.add(drop);
                anchor = grip();
                const r = root.getBoundingClientRect();
                startY = r.top + anchor.y;
                el.dispatchEvent(
                  new MouseEvent('mousedown', {
                    bubbles: true,
                    cancelable: true,
                    clientX: r.left + anchor.x,
                    clientY: startY,
                    button: 0,
                  })
                );
                mark(el, root, ACTIVE_ATTR, true);
              }
              send('mousemove');
              gsap.set(cur, { x: anchor.x, y: anchor.y + proxy.v });
            },
            onComplete: drop,
          });
      },
      home: (seconds = dur.slow * 2) => {
        tl.to(cur, {
          x: () => rest().x,
          y: () => rest().y,
          duration: seconds,
          ease: ease.settle,
        });
      },
    };
    script(act);
    timeline.current = tl;
    return () => {
      tl.kill();
      timeline.current = null;
      timers.forEach((id) => window.clearTimeout(id));
      grips.forEach((drop) => drop());
      clearMirror(root);
    };
  }, [root, script, reduced]);

  // core 오버레이는 열리면서 포커스를 받는다. 시트가 아직 무대 밖(아래, 옆)에서 들어오는 중이면 브라우저가 거기가 보이도록
  // 페이지를 스크롤한다(body에 fixed로 그릴 때는 없던 일이다). 스크롤은 포커스 이벤트보다 먼저 일어나므로 지금까지 본 위치를 적어 두고,
  // 포커스가 들어온 그 프레임의 스크롤은 그 위치로 되돌린다
  useEffect(() => {
    if (!layer) return;
    let known = { left: window.scrollX, top: window.scrollY };
    let focused = false;
    const onFocusIn = () => {
      focused = true;
      requestAnimationFrame(() => (focused = false));
    };
    const onScroll = () => {
      if (focused) window.scrollTo({ ...known, behavior: 'instant' });
      else known = { left: window.scrollX, top: window.scrollY };
    };
    layer.addEventListener('focusin', onFocusIn);
    window.addEventListener('scroll', onScroll);
    return () => {
      layer.removeEventListener('focusin', onFocusIn);
      window.removeEventListener('scroll', onScroll);
    };
  }, [layer]);

  // 멈춤과 재개. 커서는 멈추면 사라지고 이어 가면 돌아온다.
  // layout 단계에서 해야 넘겨받는 그 커밋 안에서 onPause가 오버레이를 닫는다(effect면 상자가 inert에서 풀린 뒤 닫히기 전의 틈에 Tab이 닫히는 중인 오버레이로 들어간다)
  useLayoutEffect(() => {
    const tl = timeline.current;
    const cur = cursor.current;
    if (!tl || !cur) return;
    if (playing) tl.play();
    else {
      tl.pause();
      // 진짜 입력이 넘겨받으면 진짜 :hover와 :active가 맡고, 잡고 있던 것은 놓는다
      if (root) clearMirror(root);
      holds.current.forEach((drop) => drop());
      onPauseRef.current?.();
    }
    gsap.to(cur, {
      autoAlpha: playing ? 1 : 0,
      duration: dur.fast,
      ease: ease.settle,
    });
  }, [playing, root, script, reduced]);

  // 화면 밖, 탭 숨김, 진짜 마우스. 합성 pointerover(isTrusted false)는 연출이라 무시한다
  useEffect(() => {
    if (!root) return;
    const io = new IntersectionObserver(([entry]) =>
      setFlags((f) =>
        f.offscreen === !entry.isIntersecting
          ? f
          : { ...f, offscreen: !entry.isIntersecting }
      )
    );
    io.observe(root);
    const onVisibility = () =>
      setFlags((f) =>
        f.hidden === document.hidden ? f : { ...f, hidden: document.hidden }
      );
    onVisibility();
    document.addEventListener('visibilitychange', onVisibility);
    const onOver = (e: PointerEvent) => {
      if (!e.isTrusted) return;
      const onControl = (e.target as Element).closest(CONTROL) !== null;
      setFlags((f) =>
        f.hover === !onControl ? f : { ...f, hover: !onControl }
      );
    };
    const onLeave = (e: PointerEvent) => {
      if (e.isTrusted) setFlags((f) => (f.hover ? { ...f, hover: false } : f));
    };
    root.addEventListener('pointerover', onOver);
    root.addEventListener('pointerleave', onLeave);
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      root.removeEventListener('pointerover', onOver);
      root.removeEventListener('pointerleave', onLeave);
    };
  }, [root]);

  return (
    <div
      ref={setRoot}
      role="region"
      aria-label={label}
      className={[styles.stage, className].filter(Boolean).join(' ')}
      onFocus={(e) => {
        const t = e.target as Element;
        // 마우스로 누른 포커스는 hover가 맡는다. 키보드로 들어온 포커스만 넘겨받기로 본다
        if (
          !scripted.current &&
          t.matches(':focus-visible') &&
          !t.closest(CONTROL)
        )
          setFlag('focus', true);
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node))
          setFlag('focus', false);
      }}
    >
      {demo && (
        <div className={styles.tools} data-stage-control>
          <IconButton
            size="sm"
            aria-label={flags.user ? '시연 다시 시작' : '시연 멈춤'}
            onClick={() => setFlag('user', !flags.user)}
          >
            {flags.user ? <Play /> : <Pause />}
          </IconButton>
        </div>
      )}
      <div className={styles.inner}>
        {typeof children === 'function' ? layer && children(layer) : children}
      </div>
      {typeof children === 'function' && (
        <div
          ref={setLayer}
          className={styles.layer}
          inert={!!demo && playing}
        />
      )}
      {demo && (
        <MousePointer2
          ref={cursor}
          className={styles.cursor}
          aria-hidden="true"
          fill="currentColor"
          strokeWidth={1.25}
          stroke={themeContract.color.background.default}
        />
      )}
    </div>
  );
}
