import {
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import clsx from 'clsx';
import { gsap } from 'gsap';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { gsapDuration, gsapEasing } from '../../tokens/gsapEasing';
import { cellStarts, flippedCount, gridFor, maskClips } from './flipSchedule';
import * as styles from './ManuscriptFlip.css';

export interface ManuscriptFlipProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children'
> {
  /** 앞면. 한 벌만 렌더한다 */
  front: ReactNode;
  /** 뒷면. 한 벌만 렌더한다 */
  back: ReactNode;
  /** true면 뒷면이 보인다(제어). 바뀌면 칸이 글 쓰는 순서로 하나씩 뒤집힌다. 도중에 바뀌면 지금 상태에서 거꾸로 간다 */
  flipped: boolean;
}

// 타일이 돌 때의 원근(px). 칸 한 변(40~56px)보다 훨씬 멀어 가장자리가 과장되지 않는다
const PERSPECTIVE = 400;
// 타일이 나타나고 사라지는 데 쓰는 칸 시간의 몫. 도는 동안 대부분은 온전히 보인다
const TILE_FADE = 0.25;

const flipTimeline = (
  front: HTMLElement,
  back: HTMLElement,
  tiles: HTMLElement[],
  cols: number,
  rows: number,
  done: () => void
) => {
  const starts = cellStarts(tiles.length);
  // 마스크는 칸이 반쯤 돌았을 때만 바뀌는 이산 변화라 칸 수가 같으면 다시 쓰지 않는다
  let applied = -1;
  const tl: gsap.core.Timeline = gsap.timeline({
    paused: true,
    onUpdate: () => {
      const k = flippedCount(starts, tl.time());
      if (k === applied) return;
      applied = k;
      const clips = maskClips(k, cols, rows);
      front.style.clipPath = clips.front;
      back.style.clipPath = clips.back;
    },
    onComplete: done,
    onReverseComplete: done,
  });
  tiles.forEach((tile, i) => {
    const at = starts[i];
    tl.fromTo(
      tile,
      { rotationY: 0, transformPerspective: PERSPECTIVE },
      { rotationY: 180, duration: gsapDuration.base, ease: gsapEasing.settle },
      at
    )
      .fromTo(
        tile,
        { opacity: 0 },
        {
          opacity: 1,
          duration: gsapDuration.base * TILE_FADE,
          ease: gsapEasing.linear,
          immediateRender: false,
        },
        at
      )
      .to(
        tile,
        {
          opacity: 0,
          duration: gsapDuration.base * TILE_FADE,
          ease: gsapEasing.linear,
          immediateRender: false,
        },
        at + gsapDuration.base * (1 - TILE_FADE)
      );
  });
  return tl;
};

// 움직임 줄이기: 칸도 타일도 없이 두 면이 교차해 흐려진다
const crossfade = (front: HTMLElement, back: HTMLElement, done: () => void) =>
  gsap
    .timeline({ paused: true, onComplete: done, onReverseComplete: done })
    .fromTo(
      front,
      { opacity: 1 },
      { opacity: 0, duration: gsapDuration.base, ease: gsapEasing.settle },
      0
    )
    .fromTo(
      back,
      { opacity: 0 },
      { opacity: 1, duration: gsapDuration.base, ease: gsapEasing.settle },
      0
    );

/**
 * 원고지 넘김. 앞면과 뒷면을 한 벌씩만 같은 자리에 겹쳐 두고, `flipped`가 바뀌면 상자를 나눈 칸들이 글 쓰는 순서(왼쪽에서
 * 오른쪽, 윗줄에서 아랫줄)로 하나씩 뒤집히며 뒷면이 드러난다. 되넘길 때는 반대 순서다.
 * 칸 하나는 200ms(`base`, `settle`)이고 전체는 칸 수와 상관없이 700ms다. 칸 위를 덮은 얇은 종이 타일이 세로축으로 돌고,
 * 타일이 반쯤 돌았을 때 그 칸만 면의 clip-path가 바뀐다. 면을 복제하지 않으므로 id·포커스 문제가 없다.
 * 칸 크기는 상자 크기에서 정하고(한 변 약 48px, 칸 수 상한 48) 크기가 바뀌면 다시 나눈다.
 * 보이지 않는 면과 넘기는 도중의 두 면은 `inert`다. 움직임 줄이기에서는 칸 없이 두 면이 교차해 흐려진다.
 * 클릭·호버로 넘길지는 소비자가 정한다. 상자에는 안쪽 여백을 주지 않는다(칸 격자가 어긋난다).
 * 넘기는 단추는 상자 밖에 두는 것이 좋다. 면 안에 두면 넘기는 동안 포커스가 사라져 끝날 때 상자로 옮겨진다.
 * ponytail: 넘기는 도중 칸 수가 바뀌는 크기 변화는 그 순간 끝 모양으로 점프한다, 눈에 띄면 진행도를 옮겨 이어 간다
 */
export const ManuscriptFlip = forwardRef<HTMLDivElement, ManuscriptFlipProps>(
  ({ front, back, flipped, className, onFocus, onBlur, ...rest }, ref) => {
    const reduced = useReducedMotion();
    const rootRef = useRef<HTMLDivElement>(null);
    const frontRef = useRef<HTMLDivElement>(null);
    const backRef = useRef<HTMLDivElement>(null);
    const tilesRef = useRef<HTMLDivElement>(null);
    useImperativeHandle(ref, () => rootRef.current as HTMLDivElement);

    // 칸 격자. 서버와 첫 렌더에는 없어서 타일 없이 끝 모양만 그린다
    const [layout, setLayout] = useState<{ cols: number; rows: number } | null>(
      null
    );
    useLayoutEffect(() => {
      const root = rootRef.current;
      if (!root || typeof ResizeObserver === 'undefined') return;
      const observer = new ResizeObserver((entries) => {
        const { width, height } = entries[0].contentRect;
        const next = gridFor(width, height);
        setLayout((prev) =>
          prev?.cols === next.cols && prev.rows === next.rows ? prev : next
        );
      });
      observer.observe(root);
      return () => observer.disconnect();
    }, []);
    // 움직임 줄이기에서는 격자를 쓰지 않으니 창 크기 변화가 진행 중인 교차 흐림을 끊지 않게 격자 값을 0으로 묶는다
    const cols = reduced ? 0 : (layout?.cols ?? 0);
    const rows = reduced ? 0 : (layout?.rows ?? 0);

    // 면 안에 있던 포커스는 그 면이 inert가 될 때 사라진다. 넘김이 끝나면 포커스가 body에 떨어진 경우에만 상자로 옮겨 다음 Tab이 새 면으로 가게 한다.
    // inert 때문에 나는 blur는 면이 이미 inert라 구별되고(그때는 "안에 있었다"를 지키고), 사용자가 직접 다른 곳으로 옮긴 blur만 지운다.
    const focusInside = useRef(false);
    // 소비자 onFocus·onBlur도 부른다(rest로 덮으면 포커스 되돌리기가 조용히 꺼진다)
    const trackFocus = (inside: boolean) => (e: FocusEvent<HTMLDivElement>) => {
      (inside ? onFocus : onBlur)?.(e);
      if (!inside && (e.target as Element).closest('[inert]')) return;
      focusInside.current = inside;
    };

    // 넘기는 도중(busy)에는 두 면이 모두 inert이고 보인다. 포커스가 있던 면은 넘김이 시작되는 순간 inert가 되어 포커스를 잃고,
    // 넘김이 끝나면 보이는 면만 살아난다. 상태는 렌더 중에 맞춘다(effect 안 setState는 lint가 막는다).
    // 타임라인을 못 만드는 환경(칸 격자가 아직 없음)에서는 끝나는 순간을 알릴 수 없으니 busy를 켜지 않는다.
    const [seen, setSeen] = useState(flipped);
    const [busy, setBusy] = useState(false);
    if (seen !== flipped) {
      setSeen(flipped);
      if (reduced || layout) setBusy(true);
    }

    // 타임라인 하나를 play/reverse한다. 진행 중에 flipped가 바뀌어도 지금 상태에서 거꾸로 가고 끝 모양은 늘 마지막 의도와 같다.
    const timeline = useRef<gsap.core.Timeline | null>(null);
    // 새로 만든 타임라인은 처음 한 번 전이 없이 지금 의도의 끝에 세운다
    const fresh = useRef(false);
    useLayoutEffect(() => {
      const frontEl = frontRef.current;
      const backEl = backRef.current;
      const layer = tilesRef.current;
      if (!frontEl || !backEl || (!reduced && !layer)) return;
      const done = () => {
        setBusy(false);
        const root = rootRef.current;
        const active = document.activeElement;
        if (
          root &&
          focusInside.current &&
          (!active || active === document.body)
        ) {
          root.focus({ preventScroll: true });
          focusInside.current = false;
        }
      };
      // 게이트(게이트 검사 예외 목록)를 거치지 않는다. 움직임 줄이기에서 남겨야 할 표현이 교차 흐림 자체라 끝 상태 확정을 하면 안 된다.
      // 축소 선호는 이 분기가 존중한다: 축소면 교차 흐림만 만들고 칸 타일 타임라인은 만들지 않는다.
      const tl =
        reduced || !layer
          ? crossfade(frontEl, backEl, done)
          : flipTimeline(
              frontEl,
              backEl,
              Array.from(layer.children) as HTMLElement[],
              cols,
              rows,
              done
            );
      timeline.current = tl;
      fresh.current = true;
      return () => {
        tl.kill();
        timeline.current = null;
        // 인라인으로 준 마스크와 불투명도를 걷어 CSS 값이 다시 이기게 한다
        frontEl.style.clipPath = '';
        backEl.style.clipPath = '';
        gsap.set([frontEl, backEl], { clearProps: 'opacity' });
      };
    }, [reduced, cols, rows]);
    useLayoutEffect(() => {
      const tl = timeline.current;
      if (!tl) return;
      if (fresh.current) {
        fresh.current = false;
        tl.progress(flipped ? 1 : 0, true);
        // 다시 만들어진 것이 넘김 도중이었다면 끝 모양으로 확정했으니 busy를 놓는다
        tl.eventCallback('onComplete')?.();
      } else if (flipped) {
        tl.play();
      } else if (tl.time() === 0) {
        // 시간 0에서는 거꾸로 갈 구간이 없어 onReverseComplete가 안 불린다. 앞 렌더의 play가 살아 있으니 0에 세워 멈추고 busy를 놓는다.
        tl.pause(0);
        tl.eventCallback('onReverseComplete')?.();
      } else {
        tl.reverse();
      }
      // 지금 시각의 마스크를 바로 쓴다(다음 틱까지 끝 모양이 한 프레임 비치지 않게)
      tl.eventCallback('onUpdate')?.();
    }, [flipped, reduced, cols, rows]);

    const frontInert = busy || flipped;
    const backInert = busy || !flipped;

    return (
      <div
        ref={rootRef}
        // 상자는 조작 요소가 아니다. 포커스를 되돌려 받을 때만 쓰고 테두리는 그리지 않는다(css.ts)
        tabIndex={-1}
        className={clsx(styles.root, className)}
        onFocus={trackFocus(true)}
        onBlur={trackFocus(false)}
        {...rest}
      >
        <div
          ref={frontRef}
          className={clsx(styles.face, !busy && flipped && styles.hidden)}
          inert={frontInert}
        >
          {front}
        </div>
        <div
          ref={backRef}
          className={clsx(styles.face, !busy && !flipped && styles.hidden)}
          inert={backInert}
        >
          {back}
        </div>
        {!reduced && layout && (
          <div ref={tilesRef} className={styles.tiles} aria-hidden="true">
            {Array.from({ length: cols * rows }, (_, i) => (
              <div
                key={i}
                className={styles.tile}
                style={{
                  left: `${((i % cols) / cols) * 100}%`,
                  top: `${(Math.floor(i / cols) / rows) * 100}%`,
                  width: `${100 / cols}%`,
                  height: `${100 / rows}%`,
                }}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
);

ManuscriptFlip.displayName = 'ManuscriptFlip';
