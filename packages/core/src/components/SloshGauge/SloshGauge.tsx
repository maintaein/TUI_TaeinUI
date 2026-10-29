import {
  forwardRef,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import { gsap } from 'gsap';
import { gsapDuration, gsapEasing } from '../../tokens/gsapEasing';
import { loop } from '../../tokens/animation.css';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { gateMotion } from '../../hooks/gateMotion';
import {
  FLOW_TURNS,
  SWAY_TURNS,
  VIEW_H,
  VIEW_W,
  addKick,
  sloshKick,
  surfacePath,
} from './sloshMath';
import {
  root,
  tank,
  water,
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
  /** 접근 가능한 이름이자 통 아래에 보이는 이름표 */
  label: string;
  /** 보이는 값 글이자 aria-valuetext. 없으면 백분율("60%") */
  valueText?: string;
}

// 출렁임의 상태이자 트윈이 모는 대상. 테스트가 읽는 손잡이로 물 svg에도 얹는다(BurstToggle의 타임라인 손잡이와 같은 모양).
// level 0~1, amp 통 높이 비율, phi 기울기 위상, flow 물결 위상
interface Slosh {
  level: number;
  amp: number;
  phi: number;
  flow: number;
  tl: gsap.core.Timeline | null;
}
type WaterHost = SVGSVGElement & { __slosh?: Slosh };

// 마지막 변경 뒤 잔잔해지기까지의 시간. 자동 반복이 없는 대신 변경 하나가 loop.base 안에 끝난다.
const SETTLE_S = Number.parseFloat(loop.base) / 1000;
const TURN = Math.PI * 2;

/**
 * 저장 공간·할당량·진행률 같은 값을 통 안의 물높이로 보이는 표시 요소(`role="meter"`). 값이 바뀌면 수면이 새
 * 높이로 가면서 크게 출렁였다가 잔잔해진다. 출렁임은 값이 바뀔 때만 생기는 반응이라 자동으로 되풀이되지 않고
 * (WCAG 2.2.2) 멈춤 prop도 없다. 진폭은 바뀐 양에 비례하되 통 높이의 8%로 잘리며, 값이 계속 바뀌어도 쌓여 커지지 않고
 * 마지막 변경에서 loop.base 안에 평평해진다. 움직임 줄이기에서는 출렁임 없이 수위만 바로 바뀐다.
 */
export const SloshGauge = forwardRef<HTMLDivElement, SloshGaugeProps>(
  (
    { value, min = 0, max = 100, label, valueText, className, ...props },
    ref
  ) => {
    const reduced = useReducedMotion();
    const labelId = useId();
    const waterRef = useRef<WaterHost>(null);
    const pathRef = useRef<SVGPathElement>(null);

    const clamped = Math.min(max, Math.max(min, value));
    const frac = max > min ? (clamped - min) / (max - min) : 0;

    const sloshRef = useRef<Slosh>({
      level: frac,
      amp: 0,
      phi: 0,
      flow: 0,
      tl: null,
    });
    const prevRef = useRef(frac);
    // 첫 그림은 렌더가 한 번 정한다. 이 뒤로 path의 d는 GSAP이 쓰고 React는 건드리지 않는다.
    const [initialD] = useState(() => surfacePath(frac, 0, 0, 0));

    // 수위가 바뀔 때마다 새 출렁임을 시작한다. 진행 중이던 것은 죽이고 상태(level, amp, phi, flow)에서 이어 간다.
    // ponytail: 출렁이는 도중에 움직임 줄이기가 켜지면 그 출렁임은 끝까지 돈다(다음 변경부터 반영), 문제가 되면 settleMotion으로 확정한다
    useLayoutEffect(() => {
      const host = waterRef.current;
      const path = pathRef.current;
      if (!host || !path) return;
      const s = sloshRef.current;
      host.__slosh = s;
      const draw = () =>
        path.setAttribute('d', surfacePath(s.level, s.amp, s.phi, s.flow));
      const prev = prevRef.current;
      prevRef.current = frac;
      if (prev === frac) return;

      s.tl?.kill();
      Object.assign(s, addKick(s, sloshKick(frac - prev)));
      s.tl = gateMotion(reduced, () =>
        gsap
          .timeline({ onUpdate: draw })
          .to(
            s,
            {
              level: frac,
              duration: gsapDuration.slower,
              ease: gsapEasing.settle,
            },
            0
          )
          .to(s, { amp: 0, duration: SETTLE_S, ease: gsapEasing.drift }, 0)
          .to(
            s,
            {
              phi: s.phi + TURN * SWAY_TURNS,
              duration: SETTLE_S,
              ease: gsapEasing.linear,
            },
            0
          )
          .to(
            s,
            {
              flow: s.flow + TURN * FLOW_TURNS,
              duration: SETTLE_S,
              ease: gsapEasing.linear,
            },
            0
          )
      );
      draw();
    }, [frac, reduced]);

    useEffect(() => {
      const s = sloshRef.current;
      return () => {
        s.tl?.kill();
      };
    }, []);

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
        <div className={tank} aria-hidden="true">
          <svg
            ref={waterRef}
            data-slosh-water=""
            className={water}
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            preserveAspectRatio="none"
          >
            <path ref={pathRef} d={initialD} />
          </svg>
        </div>
        <span id={labelId} className={labelClass}>
          {label}
        </span>
        <span className={valueClass}>{text}</span>
      </div>
    );
  }
);

SloshGauge.displayName = 'SloshGauge';
