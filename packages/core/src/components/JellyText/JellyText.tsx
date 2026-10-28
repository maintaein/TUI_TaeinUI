import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  type ElementType,
  type PointerEvent,
} from 'react';
import clsx from 'clsx';
import { gsap } from 'gsap';
import { gateMotion } from '../../hooks/gateMotion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { gsapDuration, gsapEasing } from '../../tokens/gsapEasing';
import { segmentText } from '../../_internal/segmentText';
import { useFinePointer } from '../../_internal/useFinePointer';
import { visuallyHidden } from '../../_internal/visuallyHidden.css';
import { word } from '../../_internal/word.css';
import { jellyScale } from './jellyScale';
import { root as rootClass, cell } from './JellyText.css';

export interface JellyTextProps {
  /** 보여 줄 문장 */
  text: string;
  /** 루트 요소 @default 'p' */
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
  /** 추가 CSS 클래스 */
  className?: string;
}

// 테스트가 현재 타임라인을 읽는 손잡이(IconButton의 __iconButtonJelly와 같은 모양).
type JellyCell = HTMLElement & { __jellyTimeline?: gsap.core.Timeline };

/** 글자 칸 하나의 문서 기준 자리. pointerenter 때 한 번 재고 pointermove에서는 읽기만 한다 */
interface Slot {
  el: JellyCell;
  centerX: number;
  width: number;
  top: number;
  bottom: number;
}

/** 글자 칸 하나를 퍼뜨렸다가 출렁이며 돌려보낸다. 진행 중이면 옛 트윈을 죽여 지금 값에서 새로 출발한다 */
const playJelly = (
  target: JellyCell,
  scaleX: number,
  scaleY: number,
  reduced: boolean
): void => {
  target.__jellyTimeline?.kill();
  target.__jellyTimeline = gateMotion(reduced, () => {
    const tl = gsap.timeline();
    tl.to(target, {
      scaleX,
      scaleY,
      transformOrigin: '50% 100%',
      duration: gsapDuration.fast,
      ease: gsapEasing.settle,
    });
    // IconButton 젤리와 같은 되돌아옴: elastic.out이 1을 지나쳤다가 감쇠 진동하며 앉는다.
    tl.to(target, {
      scaleX: 1,
      scaleY: 1,
      duration: gsapDuration.slower,
      ease: gsapEasing.spring,
    });
    return tl;
  });
};

/**
 * 커서가 지나가는 글자가 가로로 퍼졌다가 출렁이며 돌아오는 문장. 마우스(호버 정밀 포인터)에서만
 * 움직이고 터치와 축소 모션에서는 평범한 글자다. 낭독은 시각적으로만 숨긴 완성 문장이 맡는다.
 */
export const JellyText = forwardRef<HTMLElement, JellyTextProps>(
  ({ text, as = 'p', className }, ref) => {
    const Tag: ElementType = as;
    const reduced = useReducedMotion();
    const fine = useFinePointer();
    const active = fine && !reduced;
    const rootRef = useRef<HTMLElement | null>(null);
    // Tag가 요소 이름의 합집합이라 객체 ref는 형이 안 맞는다. 콜백 ref는 어느 요소든 받는다.
    const setRoot = useCallback((node: HTMLElement | null) => {
      rootRef.current = node;
    }, []);
    const slotsRef = useRef<Slot[] | null>(null);

    useImperativeHandle(ref, () => rootRef.current as HTMLElement);

    // 꺼지거나 문장이 바뀌면 걸려 있던 트윈과 자리 기록을 걷는다. 크기가 바뀌어도 기록을 버린다.
    useEffect(() => {
      const el = rootRef.current;
      if (!el || !active) return;
      slotsRef.current = null;
      // ponytail: 루트 크기만 본다. 웹폰트가 늦게 도착해 글자 칸만 움직이면 다음 pointerenter까지 옛 자리를 쓴다.
      const observer =
        typeof ResizeObserver === 'undefined'
          ? null
          : new ResizeObserver(() => {
              slotsRef.current = null;
            });
      observer?.observe(el);
      return () => {
        observer?.disconnect();
        slotsRef.current = null;
        const cells = [...el.querySelectorAll<JellyCell>('[data-jelly-cell]')];
        for (const c of cells) {
          c.__jellyTimeline?.kill();
          c.__jellyTimeline = undefined;
        }
        gsap.set(cells, { clearProps: 'transform,transformOrigin' });
      };
    }, [active, text]);

    // offset 계열은 transform에 흔들리지 않는 배치 값이라 출렁이는 중에 재도 같다.
    const measure = (el: HTMLElement): Slot[] => {
      const origin = el.getBoundingClientRect();
      const left = origin.left + window.scrollX;
      const top = origin.top + window.scrollY;
      const slots = [
        ...el.querySelectorAll<JellyCell>('[data-jelly-cell]'),
      ].map((c) => ({
        el: c,
        centerX: left + c.offsetLeft + c.offsetWidth / 2,
        width: c.offsetWidth || 1,
        top: top + c.offsetTop,
        bottom: top + c.offsetTop + c.offsetHeight,
      }));
      slotsRef.current = slots;
      return slots;
    };

    const handleEnter = (event: PointerEvent<HTMLElement>) => {
      measure(event.currentTarget);
    };

    const handleMove = (event: PointerEvent<HTMLElement>) => {
      const slots = slotsRef.current ?? measure(event.currentTarget);
      const x = event.clientX + window.scrollX;
      const y = event.clientY + window.scrollY;
      for (const slot of slots) {
        // 커서가 있는 줄의 글자만 반응한다
        if (y < slot.top || y > slot.bottom) continue;
        const { scaleX, scaleY } = jellyScale((x - slot.centerX) / slot.width);
        if (scaleX === 1) continue;
        playJelly(slot.el, scaleX, scaleY, reduced);
      }
    };

    return (
      <Tag
        ref={setRoot}
        className={clsx(rootClass, className)}
        onPointerEnter={active ? handleEnter : undefined}
        onPointerMove={active ? handleMove : undefined}
      >
        <span className={visuallyHidden}>{text}</span>
        <span aria-hidden="true" data-jelly-visual="">
          {segmentText(text).map((segment, i) =>
            typeof segment === 'string' ? (
              segment
            ) : (
              <span key={i} className={word} data-jelly-word="">
                {segment.map((char, j) => (
                  <span key={j} className={cell} data-jelly-cell="">
                    {char}
                  </span>
                ))}
              </span>
            )
          )}
        </span>
      </Tag>
    );
  }
);

JellyText.displayName = 'JellyText';
