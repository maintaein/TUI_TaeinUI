import { useEffect, useRef, useState, type ReactNode } from 'react';
import gsap from 'gsap';
import { MousePointer2, Pause, Play } from 'lucide-react';
import { IconButton, themeContract, useReducedMotion } from '@taein-ui/core';
import { dur, ease } from '../ComponentShowcase/scenes';
import * as styles from './Stage.css';

/** 대본이 타임라인에 얹는 동작. 대상은 `data-stage-target="이름"`이 붙은 요소다 */
export interface Act {
  /** 연출 커서를 대상으로 옮긴다 */
  move: (target: string, seconds?: number) => void;
  /** 합성 pointerover(마우스가 올라옴). 대상과 무대 안 조상에 data-stage-hover를 붙여 CSS :hover 쌍둥이 규칙을 켠다 */
  hover: (target: string) => void;
  /** 합성 pointerout. data-stage-hover를 뗀다 */
  leave: (target: string) => void;
  /** 합성 pointerdown, 잠깐 뒤 pointerup과 click. 커서는 눌렸다 돌아온다. holdSeconds를 주면 그만큼 누른 채 있는다(길게 누르기) */
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
}

export interface StageProps {
  /** 스크린 리더가 읽는 무대 이름 */
  label: string;
  /** 없으면 자동 시연 없이 무대만 된다. 렌더마다 바뀌지 않는 값(모듈 상수)이어야 한다 */
  script?: (act: Act) => void;
  /** 함수면 무대 요소를 넘긴다(오버레이의 core `container`용) */
  children: ReactNode | ((container: HTMLElement) => ReactNode);
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

const mirrored = new WeakSet<CSSStyleSheet>();

// 합성 이벤트는 CSS :hover를 켜지 못한다. 그래서 :hover 규칙마다 :hover를 [data-stage-hover]로 바꾼
// 쌍둥이를 바로 뒤에 넣어 둔다(같은 미디어 조건 안, 같은 특이도). 그 속성은 무대 안 요소에만 붙는다.
// 안쪽 규칙부터 거꾸로 돌아야 넣어도 앞 규칙의 번호가 밀리지 않는다.
// shortcut: 시트당 한 번만 훑고 CSS 중첩 규칙의 안쪽은 보지 않는다, 런타임에 규칙이 더해지는 시트나 중첩 CSS를 쓰게 되면 고친다
const mirrorRules = (box: CSSStyleSheet | CSSGroupingRule) => {
  const list = box.cssRules;
  for (let i = list.length - 1; i >= 0; i--) {
    const rule = list[i];
    if (rule instanceof CSSStyleRule) {
      if (!rule.selectorText.includes(':hover')) continue;
      const twin = `${rule.selectorText.replace(/:hover/g, `[${HOVER_ATTR}]`)} { ${rule.style.cssText} }`;
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

const clearHover = (root: Element) =>
  root
    .querySelectorAll(`[${HOVER_ATTR}]`)
    .forEach((n) => n.removeAttribute(HOVER_ATTR));

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
export function Stage({ label, script, children, className }: StageProps) {
  const reduced = useReducedMotion();
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  const cursor = useRef<SVGSVGElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  // 대본이 준 포커스는 넘겨받기로 보지 않는다
  const scripted = useRef(false);
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
    const find = (name: string) =>
      root.querySelector<HTMLElement>(`[data-stage-target="${name}"]`);
    // 화살촉이 대상의 오른쪽 아래쪽에 앉는다
    const at = (name: string) => {
      const t = find(name)?.getBoundingClientRect();
      const r = root.getBoundingClientRect();
      return t
        ? {
            x: t.left - r.left + t.width * 0.62,
            y: t.top - r.top + t.height * 0.6,
          }
        : { x: 0, y: 0 };
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
          // 합성 이벤트는 :hover를 못 켜므로 쌍둥이 규칙의 속성을 대상과 무대 안 조상에 붙인다
          for (let n = el; n && n !== root; n = n.parentElement)
            n.setAttribute(HOVER_ATTR, '');
        });
      },
      leave: (target) => {
        tl.call(() => {
          const el = find(target);
          firePointer(el, 'pointerout');
          for (let n = el; n && n !== root; n = n.parentElement)
            n.removeAttribute(HOVER_ATTR);
        });
      },
      press: (target, holdSeconds = HOLD) => {
        // 누름과 뗌을 한 호출에서 끝낸다. 중간에 멈춰도 눌린 채 남지 않는다
        tl.call(() => {
          const el = find(target);
          firePointer(el, 'pointerdown');
          const id = window.setTimeout(
            () => {
              timers.delete(id);
              firePointer(el, 'pointerup');
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
      clearHover(root);
    };
  }, [root, script, reduced]);

  // 멈춤과 재개. 커서는 멈추면 사라지고 이어 가면 돌아온다
  useEffect(() => {
    const tl = timeline.current;
    const cur = cursor.current;
    if (!tl || !cur) return;
    if (playing) tl.play();
    else {
      tl.pause();
      // 진짜 입력이 넘겨받으면 진짜 :hover가 맡는다
      if (root) clearHover(root);
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
        {typeof children === 'function' ? root && children(root) : children}
      </div>
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
