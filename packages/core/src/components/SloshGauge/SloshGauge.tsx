import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  useState,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import {
  bindFlowListeners,
  createFlowLoop,
} from '../LuminousFlow/luminousFlowLoop';
import {
  DROP_PATH,
  MAX_BUBBLES,
  createSim,
  levelForFill,
  scenePaths,
  settleSim,
  stepSlosh,
} from './sloshMath';
import {
  root,
  bowl as bowlClass,
  outline,
  stopTop,
  stopMid,
  stopBottom,
  backWave,
  rim as rimClass,
  gloss,
  bubble as bubbleClass,
  label as labelClass,
  value as valueClass,
} from './SloshGauge.css';

export interface SloshGaugeProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'role'
> {
  /** 현재 값. 범위 밖이면 잘라 그린다 */
  value: number;
  /** 범위의 아래 끝 @default 0 */
  min?: number;
  /** 범위의 위 끝 @default 100 */
  max?: number;
  /** 접근 가능한 이름이자 그릇 아래에 보이는 이름표 */
  label: string;
  /** 보이는 값 글이자 aria-valuetext. 없으면 백분율("60%") */
  valueText?: string;
  /**
   * true면 물을 지금 모습에서 멈춘다(이어 그리는 루프 없음). 값이 바뀌면 출렁임 없이 수위만 바로 바뀐다.
   * false로 돌아오면 지금 모습에서 이어 간다. 쉬는 동안의 잔물결이 5초를 넘게 이어지므로 WCAG 2.2.2의 멈춤 수단이다.
   * @default false
   */
  paused?: boolean;
}

const REDUCE_QUERY = '(prefers-reduced-motion: reduce)';

/**
 * 저장 공간·할당량·진행률 같은 값을 물방울 그릇 안의 물높이로 보이는 표시 요소(`role="meter"`).
 * 수위는 넓이 기준이고(50%면 그릇 넓이의 절반이 찬다) 값이 바뀌면 용수철처럼 목표를 넘었다 돌아오며 수면이 기울어
 * 출렁인다. 쉬는 동안에도 아주 낮은 잔물결이 늘 남으므로 `paused`로 멈출 수 있다(WCAG 2.2.2).
 * 흔들림은 수위 속도와 기울기에서 곧바로 읽으므로 값이 계속 바뀌어도 쌓여 커지지 않는다.
 * 움직임 줄이기에서는 잔물결 없는 평평한 수면이고 값이 바뀌면 수위만 바로 바뀐다.
 * 탭이 숨겨졌거나 화면 밖이면 그리기를 멈춘다.
 */
export const SloshGauge = forwardRef<HTMLDivElement, SloshGaugeProps>(
  (
    {
      value,
      min = 0,
      max = 100,
      label,
      valueText,
      paused = false,
      className,
      ...props
    },
    ref
  ) => {
    const labelId = useId();
    const gradientId = `${useId().replace(/:/g, '')}-water`;
    const clipId = `${gradientId}-clip`;

    const clamped = Math.min(max, Math.max(min, value));
    const frac = max > min ? (clamped - min) / (max - min) : 0;
    const target = levelForFill(frac);

    const [sim] = useState(() => createSim(target));
    // 첫 그림은 렌더가 정한다. 이 뒤로 path의 d는 루프가 쓰고 React는 건드리지 않는다
    const [initial] = useState(() => scenePaths(sim));

    const bowlRef = useRef<SVGGElement>(null);
    const backRef = useRef<SVGPathElement>(null);
    const frontRef = useRef<SVGPathElement>(null);
    const rimRef = useRef<SVGPathElement>(null);
    const bubblesRef = useRef<SVGGElement>(null);
    // 값과 paused가 바뀌어도 효과를 다시 돌리면 장면이 처음으로 튀므로 ref로 읽고 sync만 부른다
    const targetRef = useRef(target);
    const pausedRef = useRef(paused);
    const syncRef = useRef<() => void>(() => {});
    const settleRef = useRef<() => void>(() => {});

    useEffect(() => {
      targetRef.current = target;
      settleRef.current();
    }, [target]);

    useEffect(() => {
      pausedRef.current = paused;
      syncRef.current();
    }, [paused]);

    useEffect(() => {
      const group = bowlRef.current;
      const back = backRef.current;
      const front = frontRef.current;
      const rimPath = rimRef.current;
      const bubbleGroup = bubblesRef.current;
      if (!group || !back || !front || !rimPath || !bubbleGroup) return;
      const circles = [...bubbleGroup.children] as SVGCircleElement[];
      const media =
        typeof globalThis.matchMedia === 'function'
          ? globalThis.matchMedia(REDUCE_QUERY)
          : null;
      const reduced = () => media?.matches ?? false;
      let visible = true;
      let last = performance.now();

      const paint = () => {
        const scene = scenePaths(sim, reduced());
        back.setAttribute('d', scene.back);
        front.setAttribute('d', scene.front);
        rimPath.setAttribute('d', scene.rim);
        group.setAttribute('transform', scene.bowl);
        circles.forEach((circle, i) => {
          const b = scene.bubbles[i];
          circle.setAttribute('r', b ? String(b.r) : '0');
          if (b) {
            circle.setAttribute('cx', b.x.toFixed(2));
            circle.setAttribute('cy', b.y.toFixed(2));
          }
        });
      };
      const loop = createFlowLoop({
        readState: () => ({
          reduced: reduced(),
          hidden: document.hidden,
          visible,
          paused: pausedRef.current,
        }),
        onFrame: (now, running) => {
          const dt = Math.max(0, now - last) / 1000;
          last = now;
          if (running) stepSlosh(sim, targetRef.current, dt);
          else if (reduced()) settleSim(sim, targetRef.current);
          paint();
        },
        // 멈췄다 다시 이어 가는 첫 프레임이 멈춘 시간만큼 건너뛰지 않게 시계를 새로 잡는다
        onSync: () => {
          last = performance.now();
        },
      });
      syncRef.current = loop.sync;
      // 이어 그리지 않는 동안(멈춤·축소 모션·탭 숨김·화면 밖) 값이 바뀌면 출렁임 없이 수위만 바로 두고 한 장 다시 그린다
      settleRef.current = () => {
        if (loop.animating()) return;
        settleSim(sim, targetRef.current);
        loop.sync();
      };
      const observer =
        typeof IntersectionObserver === 'function'
          ? new IntersectionObserver((entries) => {
              visible = entries[entries.length - 1].isIntersecting;
              loop.sync();
            })
          : null;
      observer?.observe(group.ownerSVGElement ?? group);
      loop.sync();
      const unbind = bindFlowListeners({
        win: window,
        doc: document,
        media: media ?? new EventTarget(),
        // 이 그림은 스크롤·휠을 보지 않는다
        onScroll: () => {},
        onWheel: () => {},
        onSync: loop.sync,
      });
      return () => {
        syncRef.current = () => {};
        settleRef.current = () => {};
        loop.stop();
        observer?.disconnect();
        unbind();
      };
    }, [sim]);

    const text = valueText ?? `${Math.round(frac * 100)}%`;

    return (
      <div
        {...props}
        ref={ref}
        className={clsx(root, className)}
        role="meter"
        aria-valuenow={clamped}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuetext={text}
        aria-labelledby={labelId}
      >
        <svg
          className={bowlClass}
          viewBox="-4 -4 108 168"
          aria-hidden="true"
          focusable="false"
          data-slosh-water=""
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" className={stopTop} />
              <stop offset="0.5" className={stopMid} />
              <stop offset="1" className={stopBottom} />
            </linearGradient>
            <clipPath id={clipId}>
              <path d={DROP_PATH} />
            </clipPath>
          </defs>
          <g ref={bowlRef} transform={initial.bowl}>
            <g clipPath={`url(#${clipId})`}>
              <path ref={backRef} className={backWave} d={initial.back} />
              <path
                ref={frontRef}
                fill={`url(#${gradientId})`}
                d={initial.front}
              />
              <path ref={rimRef} className={rimClass} d={initial.rim} />
              <g ref={bubblesRef}>
                {Array.from({ length: MAX_BUBBLES }, (_, i) => (
                  <circle key={i} className={bubbleClass} r="0" />
                ))}
              </g>
              <path className={gloss} d="M12 96Q9 116 15 136" />
            </g>
            <path className={outline} d={DROP_PATH} />
          </g>
        </svg>
        <span id={labelId} className={labelClass}>
          {label}
        </span>
        <span className={valueClass}>{text}</span>
      </div>
    );
  }
);

SloshGauge.displayName = 'SloshGauge';
