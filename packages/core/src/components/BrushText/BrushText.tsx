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
import { gsapEasing } from '../../tokens/gsapEasing';
import { visuallyHidden } from '../../_internal/visuallyHidden.css';
import { segmentText } from '../../_internal/segmentText';
import { word } from '../../_internal/word.css';
import { isInView } from '../../_internal/isInView';
import { waitForFont } from '../../_internal/waitForFont';
import { brushSchedule } from './brushSchedule';
import { measureCell, type InkCell } from './inkCanvas';
import { paintFront, type Stroke } from './inkStrokes';
import {
  root as rootClass,
  cell,
  glyph,
  canvas as canvasClass,
} from './BrushText.css';

export interface BrushTextProps {
  /** 붓으로 쓸 문장. 바뀌면 다시 쓰지 않고 새 문장을 완성 상태로 보인다 */
  text: string;
  /** 루트 요소 @default 'p' */
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
  /** 추가 CSS 클래스. 붓 글꼴은 여기나 부모의 font-family로 준다 */
  className?: string;
}

/** 글자 칸 하나가 재생에 쓰는 것: 진짜 글자 span과 잰 잉크 */
interface CellParts {
  glyph: HTMLElement;
  ink: InkCell;
}

/** 쓰는 순서로 정렬된 획을 자모마다 묶어 획 길이(em) 목록으로 돌려준다 */
const lengthsByJamo = (strokes: Stroke[]): number[][] =>
  strokes.reduce<number[][]>((groups, stroke, i) => {
    if (i > 0 && strokes[i - 1].jamo === stroke.jamo)
      groups[groups.length - 1].push(stroke.lengthEm);
    else groups.push([stroke.lengthEm]);
    return groups;
  }, []);

/**
 * 붓으로 한 글자씩 쓰이듯 나타나는 문장. 재생 때 칸마다 완성 글자를 캔버스에 그려 잉크를 재고, 연결된 덩이를 획으로 찾아
 * 자모마다 따로(초성, 중성, 종성) 획의 길을 따라 단단한 앞머리로 그려 나간다. 획 사이에는 붓을 드는 쉼이 있다.
 * 화면에 들어올 때 한 번 재생한다. 첫 렌더(SSR 포함)는 완성 문장이고, 재생 전 숨김은 재생 직전에만 건다.
 * 낭독은 시각적으로만 숨긴 완성 문장이 맡는다. 글꼴은 들고 있지 않고 부모의 font-family를 쓴다.
 * 재생 때 칸마다 캔버스를 그려 재고 그리는 동안 픽셀을 다시 쓰므로 긴 문단에는 쓰지 않는다.
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
      let parts: CellParts[] = [];
      let armed = false;
      let timeline: gsap.core.Timeline | null = null;
      let observer: IntersectionObserver | null = null;

      // 캔버스를 걷고 진짜 글자의 인라인 값을 걷어 CSS의 쉬는 상태(완성 글자만 보임)로 돌아간다.
      const rest = () => {
        for (const p of parts) p.ink.canvas.remove();
        gsap.set(
          parts.map((p) => p.glyph),
          { clearProps: 'opacity' }
        );
      };

      const start = () => {
        const cells = [
          ...el.querySelectorAll<HTMLElement>('[data-brush-glyph]'),
        ].map((g) => ({ glyph: g, ink: measureCell(g) }));
        // 캔버스를 쓸 수 없거나 칸을 못 재면 아무것도 숨기지 않고 완성 문장으로 끝난다.
        if (cells.length === 0 || cells.some((c) => c.ink === null)) return;
        // 잉크가 없는 칸(공백 글리프 등)은 쓸 것이 없어 그대로 둔다.
        parts = (cells as CellParts[]).filter((c) => c.ink.strokes.length > 0);
        if (parts.length === 0) return;

        const arm = () => {
          armed = true;
          for (const p of parts) {
            p.ink.canvas.className = canvasClass;
            p.ink.canvas.setAttribute('data-brush-canvas', '');
            p.glyph.parentElement?.appendChild(p.ink.canvas);
            gsap.set(p.glyph, { opacity: 0 });
          }
        };

        const play = () => {
          startedRef.current = text;
          timeline = gateMotion(reduced, () => {
            const tl = gsap.timeline({ onComplete: rest });
            const { strokes } = brushSchedule(
              parts.map((p) => lengthsByJamo(p.ink.strokes))
            );
            parts.forEach((p, i) => {
              const { ink } = p;
              const flat = strokes[i].flat();
              ink.strokes.forEach((stroke, k) => {
                const { start: at, duration } = flat[k];
                // 앞머리는 가장 먼 픽셀이 완전히 보이는 거리(maxDist + feather)까지 간다
                const reach = stroke.maxDist + ink.feather;
                const brush = { p: 0 };
                let prev = 0;
                // 참고 영상에서 잉크 면적이 프레임마다 거의 일정하게 늘어나 linear다.
                tl.fromTo(
                  brush,
                  { p: 0 },
                  {
                    p: 1,
                    duration,
                    ease: gsapEasing.linear,
                    immediateRender: false,
                    onUpdate: () => {
                      const to = brush.p * reach;
                      paintFront(
                        ink.src,
                        ink.img.data,
                        stroke,
                        prev,
                        to,
                        ink.feather
                      );
                      prev = to;
                      ink.ctx.putImageData(ink.img, 0, 0);
                    },
                  },
                  at
                );
              });
              // 칸의 마지막 획이 끝나는 순간 캔버스를 숨기고 진짜 글자를 드러낸다. 다 그려진 캔버스와 같은 픽셀이다.
              const last = flat[flat.length - 1];
              const done = last.start + last.duration;
              tl.set(ink.canvas, { display: 'none' }, done).set(
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
