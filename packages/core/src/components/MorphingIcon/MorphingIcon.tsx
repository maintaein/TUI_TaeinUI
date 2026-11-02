import { forwardRef, useLayoutEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { gsap } from 'gsap';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { gateMotion } from '../../hooks/gateMotion';
import { gsapDuration, gsapEasing } from '../../tokens/gsapEasing';
import {
  flatten,
  MORPH_PAIRS,
  pointsAttr,
  type MorphingPair,
} from './morphPairs';
import * as styles from './MorphingIcon.css';

export interface MorphingIconProps {
  /** 오가는 두 아이콘의 짝. 인스턴스 하나에서 바꾸면 새로 그린다 */
  pair: MorphingPair;
  /** false면 짝의 앞 아이콘, true면 뒤 아이콘. 바뀌면 선의 끝점이 300ms에 옮겨 간다 */
  active: boolean;
  className?: string;
}

const MorphingSvg = forwardRef<SVGSVGElement, MorphingIconProps>(
  ({ pair, active, className }, ref) => {
    const reduced = useReducedMotion();
    const states = MORPH_PAIRS[pair];
    // 첫 렌더의 상태로 속성을 고정한다. 이후에는 GSAP이 DOM에 직접 쓰고, React는 같은 값이라 다시 쓰지 않는다
    const [first] = useState(active);
    const lines = useRef<(SVGPolylineElement | null)[]>([]);
    // 지금 그려진 숫자들(GSAP이 이 객체의 숫자 키를 트윈한다). 도중 전환은 여기서 새 목표로 간다
    const live = useRef<Record<number, number> | null>(null);

    useLayoutEffect(() => {
      const current = (live.current ??= flatten(states[first ? 1 : 0]));
      const goal = flatten(states[active ? 1 : 0]);
      const draw = () => {
        let at = 0;
        states[active ? 1 : 0].forEach((l, i) => {
          const el = lines.current[i];
          const coords = l.points.map((_, k) => current[at + k]);
          at += l.points.length;
          el?.setAttribute('points', pointsAttr(coords));
          el?.setAttribute(
            'opacity',
            `${Math.round(current[at] * 1000) / 1000}`
          );
          at += 1;
        });
      };
      if (Object.keys(goal).every((k) => current[+k] === goal[+k])) return;
      const tween = gateMotion(reduced, () =>
        gsap.to(current, {
          ...goal,
          duration: gsapDuration.slow,
          ease: gsapEasing.settle,
          overwrite: true,
          onUpdate: draw,
        })
      );
      return () => {
        tween.kill();
      };
    }, [active, reduced, states, first]);

    return (
      <svg
        ref={ref}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
        className={clsx(styles.icon, className)}
      >
        {states[first ? 1 : 0].map((l, i) => (
          <polyline
            key={i}
            ref={(el) => {
              lines.current[i] = el;
            }}
            points={pointsAttr(l.points)}
            opacity={l.opacity}
          />
        ))}
      </svg>
    );
  }
);

/**
 * 두 상태를 오가는 아이콘. 선의 끝점만 옮겨 선이 늘어나고 접히며 다른 모양이 된다(300ms, `slow`, `settle`).
 * 짝은 다섯 가지로 정해져 있다(메뉴/닫기, 더하기/체크, 재생/일시정지, 검색/닫기, 펼침/접힘).
 * 크기는 글자 크기(1em), 색은 `currentColor`라 IconButton에 그대로 넣는다. 아이콘은 `aria-hidden`이고
 * 상태는 담는 단추의 `aria-pressed`나 `aria-label`이 전한다. 축소 모션이면 바로 바뀐다.
 * 도중에 `active`가 바뀌면 지금 모양에서 새 목표로 간다.
 */
export const MorphingIcon = forwardRef<SVGSVGElement, MorphingIconProps>(
  (props, ref) => <MorphingSvg key={props.pair} ref={ref} {...props} />
);

MorphingIcon.displayName = 'MorphingIcon';
