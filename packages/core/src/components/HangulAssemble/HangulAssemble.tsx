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
import { jamoRegions, polygonCss } from '../../_internal/jamoRegions';
import { isInView } from '../../_internal/isInView';
import { waitForFont } from '../../_internal/waitForFont';
import { PIECE_STAGGER, staggerStep } from './staggerStep';
import { root as rootClass, cell, glyph, piece } from './HangulAssemble.css';

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

/** 흩어진 자리의 제자리에서 떨어진 거리(px). 글자 크기와 무관하게 60~120px */
const SCATTER_PX = [60, 90, 120] as const;

/** 흩어진 자리의 기울기(도). 살짝 기울어 날아온다 */
const TILT_DEG = [-9, 6, -4, 8, -6, 5] as const;

/**
 * 흩어진 자리. 글자 번호와 조각 번호로만 정한다.
 * Math.random을 쓰면 시험과 스크린샷이 흔들린다.
 */
const scatterOffset = (cellIndex: number, pieceIndex: number) => {
  const n = cellIndex * 3 + pieceIndex;
  const angle = n * GOLDEN_ANGLE;
  const radius = SCATTER_PX[(cellIndex + pieceIndex * 2) % 3];
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
    rotation: TILT_DEG[n % TILT_DEG.length],
  };
};

/** 글자 칸 하나가 재생에 쓰는 두 층 */
interface CellParts {
  glyph: HTMLElement;
  pieces: HTMLElement[];
}

/**
 * 완성 글자를 자모 영역별로 오린 조각이 흩어진 자리에서 날아와 맞물려 글자가 되는 문장.
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

      let cancelled = false;
      let targets: HTMLElement[] = [];
      let armed = false;
      let timeline: gsap.core.Timeline | null = null;
      let observer: IntersectionObserver | null = null;

      // 인라인으로 건 값을 걷어 CSS의 쉬는 상태(완성 글자만 보임)로 돌아간다.
      const rest = () => {
        gsap.set(targets, { clearProps: 'transform,opacity,display' });
      };

      const start = () => {
        const parts: CellParts[] = [
          ...el.querySelectorAll<HTMLElement>('[data-hangul-cell]'),
        ].map((c) => ({
          glyph: c.querySelector<HTMLElement>(
            '[data-hangul-glyph]'
          ) as HTMLElement,
          pieces: [...c.querySelectorAll<HTMLElement>('[data-hangul-jamo]')],
        }));
        if (parts.length === 0) return;
        targets = parts.flatMap((p) => [p.glyph, ...p.pieces]);

        const arm = () => {
          armed = true;
          parts.forEach((p, i) => {
            gsap.set(p.glyph, { opacity: 0 });
            p.pieces.forEach((piece, k) => {
              gsap.set(piece, {
                ...scatterOffset(i, k),
                display: 'block',
                opacity: 0,
              });
            });
          });
        };

        const play = () => {
          startedRef.current = text;
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
              tl.to(
                p.pieces,
                {
                  x: 0,
                  y: 0,
                  rotation: 0,
                  opacity: 1,
                  duration: gsapDuration.slower,
                  ease: gsapEasing.settle,
                  stagger: PIECE_STAGGER,
                },
                at
              );
              // 마지막 조각이 닿는 순간 조각 층을 걷고 완성 글자를 드러낸다.
              // 둘이 같은 픽셀이라 교차 흐림이 필요 없다.
              const landed =
                at +
                gsapDuration.slower +
                (p.pieces.length - 1) * PIECE_STAGGER;
              tl.set(p.pieces, { display: 'none' }, landed).set(
                p.glyph,
                { opacity: 1 },
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
      };

      // 폰트를 기다리는 동안 첫 렌더(완성 문장)가 그대로 보인다.
      const fontWait = waitForFont(el, text);
      if (fontWait) {
        fontWait.ready.then(() => {
          if (!cancelled) start();
        });
      } else {
        start();
      }

      return () => {
        cancelled = true;
        fontWait?.stop();
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
                {segment.map((char, j) => (
                  <span key={j} className={cell} data-hangul-cell="">
                    <span className={glyph} data-hangul-glyph="">
                      {char}
                    </span>
                    {/* 결합 부호가 붙은 칸은 한글 음절 하나가 아니라 통째로 한 그림이라 조각이 없다.
                        ponytail: 조각은 재생 뒤에도 display:none으로 남아 칸마다 글자가 2~4번 복제된다, 긴 문장에서 비용이 되면 재생 뒤 DOM에서 뺀다. */}
                    {jamoRegions(char)?.map(({ jamo, region }, k) => (
                      <span
                        key={k}
                        className={piece}
                        data-hangul-jamo={jamo}
                        style={{ clipPath: polygonCss(region) }}
                      >
                        {char}
                      </span>
                    ))}
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

HangulAssemble.displayName = 'HangulAssemble';
