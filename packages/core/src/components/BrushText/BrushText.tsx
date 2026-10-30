import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type ElementType,
} from 'react';
import clsx from 'clsx';
import { gsap } from 'gsap';
import { gateMotion, settleMotion } from '../../hooks/gateMotion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { gsapEasing } from '../../tokens/gsapEasing';
import { visuallyHidden } from '../../_internal/visuallyHidden.css';
import { segmentText } from '../../_internal/segmentText';
import { word } from '../../_internal/word.css';
import { jamoRegions, polygonCss } from '../../_internal/jamoRegions';
import { isInView } from '../../_internal/isInView';
import { waitForFont } from '../../_internal/waitForFont';
import { brushSchedule } from './brushSchedule';
import {
  SWEEP_GRADIENT,
  strokeDirection,
  sweepSpan,
  type Sweep,
} from './strokeSweep';
import { root as rootClass, cell, glyph, stroke } from './BrushText.css';

export interface BrushTextProps {
  /** 붓으로 쓸 문장. 바뀌면 다시 쓰지 않고 새 문장을 완성 상태로 보인다 */
  text: string;
  /** 루트 요소 @default 'p' */
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
  /** 추가 CSS 클래스. 붓 글꼴은 여기나 부모의 font-family로 준다 */
  className?: string;
}

/** 획 하나(자모 하나, 또는 한글이 아닌 글자 하나)를 드러내는 조각 */
interface StrokePiece {
  jamo?: string;
  style: CSSProperties;
}

const strokePieces = (char: string): StrokePiece[] => {
  const regions = jamoRegions(char);
  if (!regions) {
    // 한글 음절이 아닌 글자는 칸 전체를 왼→오로 한 번 쓴다. 영역을 자르지 않고 마스크 상자도 칸 높이 전체다.
    return [
      {
        style: {
          '--brush-dir': SWEEP_GRADIENT.right,
          '--brush-from': 0,
          '--brush-to': 1,
          '--brush-h': '100%',
        } as CSSProperties,
      },
    ];
  }
  return regions.map(({ jamo, region }) => {
    const sweep: Sweep = strokeDirection(jamo);
    const [from, to] = sweepSpan(region, sweep);
    return {
      jamo,
      style: {
        clipPath: polygonCss(region),
        '--brush-dir': SWEEP_GRADIENT[sweep],
        '--brush-from': from,
        '--brush-to': to,
      } as CSSProperties,
    };
  });
};

/** 글자 칸 하나가 재생에 쓰는 두 층 */
interface CellParts {
  glyph: HTMLElement;
  pieces: HTMLElement[];
}

/**
 * 붓으로 한 글자씩 쓰이듯 나타나는 문장. 완성 글자를 자모 영역별로 오린 조각 위로 단단한 앞머리의 마스크가
 * 획 방향으로 일정한 속도로 쓸고 지나가며 드러나고, 획 사이에 붓을 드는 쉼이 있다. 화면에 들어올 때 한 번 재생한다.
 * 첫 렌더(SSR 포함)는 완성 문장이고, 재생 전 숨김은 재생 직전에만 건다. 낭독은 시각적으로만 숨긴 완성 문장이 맡는다.
 * 글꼴은 들고 있지 않고 부모의 font-family를 쓴다. 마스크 쓸기는 페인트가 드는 속성이라 긴 문단에는 쓰지 않는다.
 */
export const BrushText = forwardRef<HTMLElement, BrushTextProps>(
  ({ text, as = 'p', className }, ref) => {
    const Tag: ElementType = as;
    const reduced = useReducedMotion();
    const rootRef = useRef<HTMLElement | null>(null);
    // Tag가 요소 이름의 합집합이라 객체 ref는 형이 안 맞는다. 콜백 ref는 어느 요소든 받는다.
    const setRoot = useCallback((node: HTMLElement | null) => {
      rootRef.current = node;
    }, []);
    // 쓰기를 시작한 문장. 문장이 바뀌면 다시 쓰지 않는다.
    // ponytail: 축소 선호를 껐다 켜면 같은 문장이 다시 쓰인다, 문제가 되면 완료 표지를 더한다.
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
        gsap.set(targets, {
          clearProps: 'opacity,display,--brush-p',
        });
      };

      const start = () => {
        const parts: CellParts[] = [
          ...el.querySelectorAll<HTMLElement>('[data-brush-cell]'),
        ].map((c) => ({
          glyph: c.querySelector<HTMLElement>(
            '[data-brush-glyph]'
          ) as HTMLElement,
          pieces: [...c.querySelectorAll<HTMLElement>('[data-brush-stroke]')],
        }));
        if (parts.length === 0) return;
        targets = parts.flatMap((p) => [p.glyph, ...p.pieces]);

        const arm = () => {
          armed = true;
          for (const p of parts) {
            gsap.set(p.glyph, { opacity: 0 });
            gsap.set(p.pieces, {
              display: 'block',
              '--brush-p': 0,
            });
          }
        };

        const play = () => {
          startedRef.current = text;
          timeline = gateMotion(reduced, () => {
            const tl = gsap.timeline({ onComplete: rest });
            const { strokes } = brushSchedule(
              parts.map((p) => p.pieces.length)
            );
            parts.forEach((p, i) => {
              p.pieces.forEach((piece, k) => {
                const { start: at, duration } = strokes[i][k];
                // 참고 영상에서 잉크 면적이 프레임마다 거의 일정하게 늘어나 linear다.
                tl.fromTo(
                  piece,
                  { '--brush-p': 0 },
                  { '--brush-p': 1, duration, ease: gsapEasing.linear },
                  at
                );
              });
              // 칸의 마지막 획이 끝나는 순간 조각 층을 걷고 완성 글자를 드러낸다. 마스크가 다 열려 같은 픽셀이다.
              const last = strokes[i][strokes[i].length - 1];
              const done = last.start + last.duration;
              tl.set(p.pieces, { display: 'none' }, done).set(
                p.glyph,
                { opacity: 1 },
                done
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
        <span aria-hidden="true" data-brush-visual="">
          {segmentText(text).map((segment, i) =>
            typeof segment === 'string' ? (
              segment
            ) : (
              <span key={i} className={word} data-brush-word="">
                {segment.map((char, j) => (
                  <span key={j} className={cell} data-brush-cell="">
                    <span className={glyph} data-brush-glyph="">
                      {char}
                    </span>
                    {/* ponytail: 조각은 쓰고 난 뒤에도 display:none으로 남아 칸마다 글자가 2~4번 복제된다, 긴 문장에서 비용이 되면 다 쓴 뒤 DOM에서 뺀다. */}
                    {strokePieces(char).map(({ jamo, style }, k) => (
                      <span
                        key={k}
                        className={stroke}
                        data-brush-stroke=""
                        data-brush-jamo={jamo}
                        style={style}
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

BrushText.displayName = 'BrushText';
