import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  type ElementType,
} from 'react';
import clsx from 'clsx';
import { gsap } from 'gsap';
import { gateMotion, settleMotion } from '../../hooks/gateMotion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { gsapDuration, gsapEasing } from '../../tokens/gsapEasing';
import { visuallyHidden } from '../../_internal/visuallyHidden.css';
import { segmentText } from '../../_internal/segmentText';
import { word } from '../../_internal/word.css';
import { decomposeHangul } from './decomposeHangul';
import { jamoSlots, type JamoSlot } from './jamoSlots';
import { staggerStep } from './staggerStep';
import { root as rootClass, cell, glyph, jamo } from './HangulAssemble.css';

export interface HangulAssembleProps {
  /** 조립해 보일 문장. 바뀌면 다시 재생하지 않고 새 문장을 완성 상태로 보인다 */
  text: string;
  /** 루트 요소 @default 'p' */
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
  /** 추가 CSS 클래스 */
  className?: string;
}

/** 이웃 글자가 같은 방향으로 흩어지지 않게 번호마다 돌리는 황금각(라디안) */
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

/**
 * 흩어진 자리(글자 크기 em 단위). 글자 번호와 조각 번호로만 정한다.
 * Math.random을 쓰면 시험과 스크린샷이 흔들린다. 반지름은 1.5, 2.25, 3em을 돈다.
 */
const scatterOffset = (cellIndex: number, pieceIndex: number) => {
  const angle = (cellIndex * 3 + pieceIndex) * GOLDEN_ANGLE;
  const radius = 1.5 + ((cellIndex + pieceIndex * 2) % 3) * 0.75;
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
};

const isInView = (el: HTMLElement): boolean => {
  const rect = el.getBoundingClientRect();
  return rect.top < window.innerHeight && rect.bottom >= 0;
};

/** 글자 칸 하나가 재생에 쓰는 두 층과 조각의 제자리 */
interface CellParts {
  glyph: HTMLElement;
  pieces: HTMLElement[];
  slots: JamoSlot[];
}

/**
 * 흩어진 자모가 글자 칸 안의 제자리로 모여 완성 글자가 되는 문장.
 * 화면에 들어올 때 한 번 재생한다. 첫 렌더(SSR 포함)는 완성 문장이고,
 * 재생 전 숨김은 재생 직전에만 건다. 낭독은 시각적으로만 숨긴 완성 문장이 맡는다.
 */
export const HangulAssemble = forwardRef<HTMLElement, HangulAssembleProps>(
  ({ text, as = 'p', className }, ref) => {
    const Tag: ElementType = as;
    const reduced = useReducedMotion();
    const rootRef = useRef<HTMLElement | null>(null);
    // Tag가 요소 이름의 합집합이라 객체 ref는 형이 안 맞는다. 콜백 ref는 어느 요소든 받는다.
    const setRoot = useCallback((node: HTMLElement | null) => {
      rootRef.current = node;
    }, []);
    // 재생을 시작한 문장. 문장이 바뀌면 다시 재생하지 않는다.
    // ponytail: 축소 선호를 껐다 켜면 같은 문장이 다시 재생된다, 문제가 되면 완료 표지를 더한다.
    const startedRef = useRef<string | null>(null);

    useImperativeHandle(ref, () => rootRef.current as HTMLElement);

    useLayoutEffect(() => {
      const el = rootRef.current;
      if (
        !el ||
        reduced ||
        typeof IntersectionObserver === 'undefined' ||
        (startedRef.current !== null && startedRef.current !== text)
      ) {
        return;
      }

      const parts: CellParts[] = [
        ...el.querySelectorAll<HTMLElement>('[data-hangul-cell]'),
      ].map((c) => {
        const glyphEl = c.querySelector<HTMLElement>(
          '[data-hangul-glyph]'
        ) as HTMLElement;
        const jamo = decomposeHangul(glyphEl.textContent ?? '');
        return {
          glyph: glyphEl,
          pieces: [...c.querySelectorAll<HTMLElement>('[data-hangul-jamo]')],
          slots: jamo ? jamoSlots(jamo) : [],
        };
      });
      if (parts.length === 0) return;

      const targets = parts.flatMap((p) => [p.glyph, ...p.pieces]);
      let armed = false;
      let timeline: gsap.core.Timeline | null = null;
      let observer: IntersectionObserver | null = null;

      // 인라인으로 건 값을 걷어 CSS의 쉬는 상태(완성 글자만 보임)로 돌아간다.
      const rest = () => {
        gsap.set(targets, { clearProps: 'transform,opacity' });
      };

      const arm = () => {
        armed = true;
        const em = Number.parseFloat(getComputedStyle(el).fontSize) || 16;
        parts.forEach((p, i) => {
          gsap.set(p.glyph, { opacity: 0 });
          p.pieces.forEach((piece, k) => {
            const { x, y } = scatterOffset(i, k);
            gsap.set(piece, {
              x: x * em,
              y: y * em,
              scale: p.slots[k].scale,
              opacity: 0,
            });
          });
        });
      };

      const play = () => {
        startedRef.current = text;
        const em = Number.parseFloat(getComputedStyle(el).fontSize) || 16;
        timeline = gateMotion(reduced, () => {
          const tl = gsap.timeline({ onComplete: rest });
          const step = staggerStep(parts.length);
          parts.forEach((p, i) => {
            const at = i * step;
            if (p.pieces.length === 0) {
              tl.to(
                p.glyph,
                {
                  opacity: 1,
                  duration: gsapDuration.base,
                  ease: gsapEasing.settle,
                },
                at
              );
              return;
            }
            const landed = at + gsapDuration.slower;
            tl.to(
              p.pieces,
              {
                // 글자 한가운데 한 점이 아니라 음절 구조 속 제자리로 모인다.
                x: (k: number) => p.slots[k].x * em,
                y: (k: number) => p.slots[k].y * em,
                opacity: 1,
                duration: gsapDuration.slower,
                ease: gsapEasing.settle,
              },
              at
            )
              // 교차 페이드는 두 층의 합이 일정하도록 선형으로 맞바꾼다.
              .to(
                p.glyph,
                {
                  opacity: 1,
                  duration: gsapDuration.base,
                  ease: gsapEasing.linear,
                },
                landed
              )
              .to(
                p.pieces,
                {
                  opacity: 0,
                  duration: gsapDuration.base,
                  ease: gsapEasing.linear,
                },
                landed
              );
          });
          return tl;
        });
      };

      if (isInView(el)) {
        arm();
        play();
      } else {
        observer = new IntersectionObserver((entries, io) => {
          const entry = entries[entries.length - 1];
          // 처음부터 화면 안이라고 알려 오면 이미 완성 문장이 그려졌으니 건드리지 않는다.
          if (!entry.isIntersecting && !armed) {
            arm();
          } else if (entry.isIntersecting && armed) {
            io.disconnect();
            play();
          }
        });
        observer.observe(el);
      }

      return () => {
        observer?.disconnect();
        if (timeline) settleMotion(timeline);
        if (armed) rest();
      };
    }, [reduced, text]);

    return (
      <Tag ref={setRoot} className={clsx(rootClass, className)}>
        <span className={visuallyHidden}>{text}</span>
        <span aria-hidden="true" data-hangul-visual="">
          {segmentText(text).map((segment, i) =>
            typeof segment === 'string' ? (
              segment
            ) : (
              <span key={i} className={word} data-hangul-word="">
                {segment.map((char, j) => {
                  // 결합 부호가 붙은 칸은 한글 음절 하나가 아니라 통째로 한 그림이다.
                  const parts =
                    [...char].length === 1 ? decomposeHangul(char) : null;
                  const pieces = parts
                    ? [parts.initial, parts.medial, parts.final].filter(
                        (piece): piece is string => piece !== undefined
                      )
                    : [];
                  return (
                    <span key={j} className={cell} data-hangul-cell="">
                      <span className={glyph} data-hangul-glyph="">
                        {char}
                      </span>
                      {pieces.map((piece, k) => (
                        <span key={k} className={jamo} data-hangul-jamo="">
                          {piece}
                        </span>
                      ))}
                    </span>
                  );
                })}
              </span>
            )
          )}
        </span>
      </Tag>
    );
  }
);

HangulAssemble.displayName = 'HangulAssemble';
