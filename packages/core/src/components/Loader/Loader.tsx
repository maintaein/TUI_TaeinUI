import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, HTMLAttributes } from 'react';
import clsx from 'clsx';
import { gsap } from 'gsap';
import { gateMotion, settleMotion } from '../../hooks/gateMotion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { gsapDuration, gsapEasing } from '../../tokens/gsapEasing';
import {
  loaderContainer,
  fullScreenStyles,
  overlayStyles,
  label as labelClass,
  bar,
  barFill,
  inchwormFill,
  inchwormTrack,
  statusGraphic,
  resultMark,
  closingRing,
  wormSkin,
  barClip,
  barSizeStyles,
  colorStyles,
  inlineContainer,
  spinner,
  dotsContainer,
  dot,
  dotBody,
  orbit,
  orbitDot,
  orbitDotSizeStyles,
  wave,
  waveBar,
  waveSizeStyles,
  labelLayer,
  visuallyHidden,
  spinnerSizeStyles,
  dotSizeStyles,
  dotDelayStyles,
} from './Loader.css';
import {
  ORBIT_DOTS,
  ORBIT_RADIUS_PX,
  markPoints,
  pairByAngle,
  ringPoints,
  waveBarCount,
  type Point,
} from './loaderMotion';

/** 모든 type이 받는 prop */
export interface LoaderProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'color'
> {
  /** 로딩 애니메이션 타입 @default 'orbit' */
  type?: 'orbit' | 'spinner' | 'dots' | 'bar' | 'wave' | 'inchworm';
  /** 로딩에서 완료 또는 실패 표식으로 이어진다 @default 'loading' */
  status?: 'loading' | 'done' | 'error';
  /** 로더 크기 @default 'md' */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** 로더 색상. preset 또는 임의의 CSS 색상값(예: '#f00', 'currentColor') @default 'primary' */
  color?: 'primary' | 'secondary' | 'white' | (string & {});
  /** 로더 아래 표시할 텍스트. 글자가 바뀌면 흐림과 투명도로 갈아끼운다 */
  label?: string;
  /** 전체 화면 중앙 배치 @default false */
  fullScreen?: boolean;
  /** 반투명 배경 오버레이 표시 @default false */
  overlay?: boolean;
  /** 스크린 리더용 레이블 */
  'aria-label'?: string;
  /** 추가 CSS 클래스 */
  className?: string;
}

type ColorPreset = keyof typeof colorStyles;

const isPreset = (value: string): value is ColorPreset =>
  value === 'primary' || value === 'secondary' || value === 'white';

// 접근성 계약(role, aria-live)은 안쪽 status 요소가 쥔다. 소비자가
// ...props로 바깥 래퍼에 같은 속성을 얹어 status를 이중으로 만들지 못하게,
// props 펼침 뒤에 undefined로 덮는다(React는 undefined 속성을 렌더하지 않는다).
// aria-busy도 덮는다: Loader는 status 요소에 aria-busy를 달지 않는다(busy인 살아
// 있는 영역은 갱신 낭독이 미뤄질 수 있다). "이 영역이 로딩 중"은 소비자가 감싸는
// 영역에 직접 준다. 바깥 래퍼에 새어 들어가 그 약속을 깨지 못하게 막아 둔다.
const a11yLocked = {
  role: undefined,
  'aria-live': undefined,
  'aria-busy': undefined,
} as const;

type LoaderStatus = 'loading' | 'done' | 'error';
type LoaderSize = keyof typeof ORBIT_RADIUS_PX;

const STATUS_NAME: Record<LoaderStatus, string> = {
  loading: '로딩 중',
  done: '완료',
  error: '실패',
};

/** 밝기 키프레임이 돌 때 꺼진 점의 투명도(Loader.css.ts의 orbitLit과 같다) */
const ORBIT_REST_OPACITY = 0.15;

interface OrbitHost extends HTMLDivElement {
  /** 지금 도는 상태 전환 타임라인(테스트가 읽는 손잡이). 끝나면 비운다 */
  __loaderStatusTimeline?: gsap.core.Timeline;
}

/** 상태가 정하는 점 8개의 자리. loading은 원 위, 나머지는 각도순으로 짝지은 표식 자리 */
const orbitTargets = (status: LoaderStatus, size: LoaderSize): Point[] => {
  const radius = ORBIT_RADIUS_PX[size];
  const ring = ringPoints(radius);
  return status === 'loading'
    ? ring
    : pairByAngle(ring, markPoints(status, radius));
};

const placeDots = (dots: HTMLElement[], targets: Point[]): void => {
  // rotation 0: CSS가 배치용으로 준 회전을 GSAP이 읽어 이어받지 않게 한다.
  gsap.set(dots, {
    x: (i: number) => targets[i].x,
    y: (i: number) => targets[i].y,
    rotation: 0,
  });
};

interface LabelSlots {
  texts: [string, string];
  active: 0 | 1;
}

const EMPTY_SLOTS: LabelSlots = { texts: ['', ''], active: 0 };

interface LabelHost extends HTMLParagraphElement {
  /** 지금 도는 라벨 교체 타임라인(테스트가 읽는 손잡이). 끝나면 비운다 */
  __loaderLabelTimeline?: gsap.core.Timeline;
}

interface OrbitGraphicProps {
  status: LoaderStatus;
  size: LoaderSize;
  reduced: boolean;
}

/**
 * 점 궤도 그래픽과 그 상태 전환 타임라인. 수명이 궤도와 같도록 Loader 본문이 아니라
 * 여기에 둔다(type이 바뀌면 이 컴포넌트가 사라지며 타임라인도 같이 죽는다).
 * 파일 밖으로 내보내지 않는다.
 */
const OrbitGraphic = ({ status, size, reduced }: OrbitGraphicProps) => {
  const hostRef = useRef<OrbitHost>(null);
  const shownRef = useRef<{ status: LoaderStatus; size: LoaderSize } | null>(
    null
  );

  // 상태가 바뀌면 점 8개가 지금 위치에서 새 자리로 미끄러진다(같은 물체가 모양을
  // 바꾼다). 위치는 GSAP(x, y)이, 색은 CSS 전이가 맡는다. 마운트와 크기 변경은
  // 효과 없이 끝 상태를 바로 쓴다.
  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const dots = [...host.querySelectorAll<HTMLElement>('[data-orbit-dot]')];
    const targets = orbitTargets(status, size);
    const prev = shownRef.current;
    shownRef.current = { status, size };

    // 도착한 뒤 loading이면 밝기 키프레임을 되살린다.
    const arrive = (timeline?: gsap.core.Timeline): void => {
      if (!timeline || host.__loaderStatusTimeline === timeline) {
        host.__loaderStatusTimeline = undefined;
      }
      if (status === 'loading') {
        gsap.set(dots, { clearProps: 'opacity' });
        host.removeAttribute('data-paused');
      }
    };

    if (!prev || prev.size !== size) {
      host.__loaderStatusTimeline?.kill();
      placeDots(dots, targets);
      if (status !== 'loading') {
        gsap.set(dots, { opacity: 1 });
        host.setAttribute('data-paused', '');
      }
      arrive();
      return;
    }

    if (prev.status === status) {
      if (reduced && host.__loaderStatusTimeline) {
        settleMotion(host.__loaderStatusTimeline);
      }
      return;
    }

    host.__loaderStatusTimeline?.kill();
    // 멈추기 전 밝기를 붙잡아 둔다. 키프레임을 끄면 점이 한 번 깜빡이기 때문이다.
    if (prev.status === 'loading') {
      dots.forEach((dot) => {
        const lit = Number.parseFloat(getComputedStyle(dot).opacity);
        if (Number.isFinite(lit)) gsap.set(dot, { opacity: lit });
      });
    }
    host.setAttribute('data-paused', '');

    const timeline = gateMotion(reduced, () => {
      const tl = gsap.timeline();
      dots.forEach((dot, i) => {
        tl.to(
          dot,
          {
            x: targets[i].x,
            y: targets[i].y,
            opacity: status === 'loading' ? ORBIT_REST_OPACITY : 1,
            duration: gsapDuration.slow,
            ease: gsapEasing.settle,
          },
          (gsapDuration.fast / ORBIT_DOTS) * i
        );
      });
      return tl;
    });

    if (reduced) {
      arrive();
      return;
    }
    host.__loaderStatusTimeline = timeline;
    timeline.eventCallback('onComplete', () => {
      timeline.kill();
      arrive(timeline);
    });
  }, [status, size, reduced]);

  useEffect(() => {
    const host = hostRef.current;
    return () => {
      host?.__loaderStatusTimeline?.kill();
    };
  }, []);

  return (
    <div
      ref={hostRef}
      className={clsx(orbit, spinnerSizeStyles[size])}
      aria-hidden="true"
      data-orbit
      data-status={status}
      data-loader-mark={status === 'loading' ? undefined : status}
    >
      {Array.from({ length: 8 }, (_, i) => (
        <span
          key={i}
          className={clsx(orbitDot, orbitDotSizeStyles[size])}
          style={{ '--orbit-i': i } as CSSProperties}
          data-orbit-dot
        />
      ))}
    </div>
  );
};

type PlainType = Exclude<NonNullable<LoaderProps['type']>, 'orbit'>;
const GRAPHIC_PX = { sm: 16, md: 24, lg: 32, xl: 48 } as const;
const DOT_PX = { sm: 4, md: 8, lg: 10, xl: 12 } as const;
const CHECK_PATH = 'M10 24 L20 34 L38 14';
const ERROR_PATH = 'M14 14 L34 34 M34 14 L14 34';

/** 로딩 물체를 붙잡아 결과로 옮긴다. type의 수명과 타임라인의 수명을 맞춘다. */
const StatusGraphic = ({
  type,
  status,
  size,
  reduced,
}: OrbitGraphicProps & { type: PlainType }) => {
  const hostRef = useRef<OrbitHost>(null);
  const shownRef = useRef<{ status: LoaderStatus; size: LoaderSize } | null>(
    null
  );

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const prev = shownRef.current;
    shownRef.current = { status, size };
    if (prev?.status === status && prev.size === size) {
      if (reduced && host.__loaderStatusTimeline)
        settleMotion(host.__loaderStatusTimeline);
      return;
    }
    if (
      (!prev || (prev.status === 'loading' && !host.__loaderStatusTimeline)) &&
      status === 'loading'
    )
      return;

    host.__loaderStatusTimeline?.kill();
    const parts = [...host.querySelectorAll<HTMLElement>('[data-motion-part]')];
    const mark = host.querySelector<SVGSVGElement>('[data-result-mark]')!;
    const path = mark.querySelector('path')!;
    const ring = host.querySelector('[data-closing-ring]');
    const worm = host.querySelector('[data-worm-body]');
    // CSS 루프를 끄기 전에 보이던 변형을 보존해야 결과로 이어지는 첫 프레임이 튀지 않는다.
    if (!host.hasAttribute('data-paused')) {
      const transforms = parts.map((part) => getComputedStyle(part).transform);
      parts.forEach((part, i) => {
        part.style.animation = 'none';
        if (transforms[i] && transforms[i] !== 'none')
          gsap.set(part, { transform: transforms[i] });
      });
    }
    host.setAttribute('data-paused', '');
    const arrive = () => {
      host.__loaderStatusTimeline = undefined;
      if (status === 'loading') {
        gsap.set(parts, {
          clearProps: 'transform,opacity,animation,transformOrigin',
        });
        host.removeAttribute('data-paused');
      }
    };
    const timing = { duration: gsapDuration.slow, ease: gsapEasing.settle };
    const immediate = reduced || !prev || prev.size !== size;
    const timeline = gateMotion(immediate, () => {
      const tl = gsap.timeline();
      tl.to(host, { x: 0, ...timing }, 0);
      if (status === 'loading') {
        tl.to(mark, { opacity: 0, duration: gsapDuration.fast }, 0);
        tl.to(
          parts,
          {
            x: 0,
            xPercent: 0,
            y: 0,
            scaleX: 1,
            scaleY: 1,
            rotation: 0,
            opacity: 1,
            ...timing,
          },
          0
        );
        if (ring) tl.set(ring, { opacity: 0 });
        if (worm)
          tl.to(
            worm,
            {
              attr: { d: 'M16 16 L50 16 L84 16', 'stroke-width': 32 },
              ...timing,
            },
            0
          );
        return tl;
      }

      const unit = GRAPHIC_PX[size] / 48;
      const drawAt =
        type === 'inchworm' && status === 'error'
          ? gsapDuration.base + gsapDuration.slower
          : type === 'spinner' || type === 'wave'
            ? gsapDuration.slow
            : gsapDuration.base;
      if (prev?.status !== status) tl.set(path, { strokeDashoffset: 1 }, 0);
      tl.to(
        mark,
        {
          opacity: 1,
          scale: 1,
          duration: gsapDuration.base,
          ease: gsapEasing.settle,
        },
        drawAt
      );
      tl.to(path, { strokeDashoffset: 0, ...timing }, drawAt);

      if (type === 'spinner') {
        const rotor = parts[0];
        const rotation = Number(gsap.getProperty(rotor, 'rotation')) || 0;
        tl.to(rotor, { rotation: rotation + 120, opacity: 0, ...timing }, 0);
        tl.fromTo(
          ring,
          { opacity: 0, strokeDasharray: '0.25 1' },
          { opacity: 1, strokeDasharray: '1 1', ...timing },
          0
        );
      } else if (type === 'dots') {
        const dots = parts.filter((part) => part.hasAttribute('data-dot'));
        const check = [
          [10, 24],
          [20, 34],
          [38, 14],
        ];
        dots.forEach((part, i) => {
          const [x, y] = status === 'done' ? check[i] : [24, 24];
          const start = (i - 1) * (DOT_PX[size] + 8);
          tl.to(
            part,
            {
              x: (x - 24) * unit - start,
              y: (y - 24) * unit,
              scale: 1,
              ...timing,
            },
            0
          );
        });
        tl.to(
          parts.filter((part) => !part.hasAttribute('data-dot')),
          { scaleX: 1, scaleY: 1, ...timing },
          0
        );
        if (status === 'error')
          tl.to(dots, { opacity: 0, duration: gsapDuration.base }, drawAt);
      } else if (type === 'bar') {
        const fill = parts[0];
        tl.set(fill, { transformOrigin: '0% 50%' }, 0);
        tl.to(fill, { x: 0, scaleX: 4, ...timing }, 0);
        if (status === 'done')
          tl.fromTo(
            mark,
            { scale: 0.6 },
            { scale: 1, duration: gsapDuration.base, ease: gsapEasing.snap },
            drawAt
          );
      } else if (type === 'wave') {
        const bars = parts;
        tl.to(
          bars,
          {
            scaleY: 8 / { sm: 12, md: 16, lg: 24, xl: 32 }[size],
            rotation: 90,
            ...timing,
          },
          0
        );
        bars.forEach((part, i) => {
          const half = bars.length / 2;
          const first = i < half;
          const t = ((i % half) + 0.5) / half;
          const from =
            status === 'done'
              ? first
                ? [10, 24]
                : [20, 34]
              : first
                ? [14, 14]
                : [34, 14];
          const to =
            status === 'done'
              ? first
                ? [20, 34]
                : [38, 14]
              : first
                ? [34, 34]
                : [14, 34];
          const x = (from[0] + (to[0] - from[0]) * t - 24) * unit;
          const y = (from[1] + (to[1] - from[1]) * t - 24) * unit;
          const segment =
            (Math.hypot(to[0] - from[0], to[1] - from[1]) * unit) / half;
          tl.to(
            part,
            {
              x: x - (i - (bars.length - 1) / 2) * 8,
              y,
              rotation:
                (Math.atan2(to[1] - from[1], to[0] - from[0]) * 180) / Math.PI -
                90,
              scaleY: segment / { sm: 12, md: 16, lg: 24, xl: 32 }[size],
              ...timing,
            },
            gsapDuration.slow
          );
        });
        tl.to(
          bars,
          { opacity: 0, duration: gsapDuration.fast },
          gsapDuration.slow * 2
        );
      } else {
        const body = parts[0];
        const bodyWidth = { sm: 100, md: 200, lg: 300, xl: 400 }[size] / 4;
        tl.to(
          body,
          {
            xPercent: 150,
            x: 0,
            y: 0,
            rotation: 0,
            transformOrigin: '50% 50%',
            scaleX: status === 'done' ? (28 * unit) / (bodyWidth * 0.7) : 1,
            scaleY: status === 'done' ? (20 * unit) / 12 : 1,
            ...timing,
          },
          0
        );
        if (status === 'done')
          tl.to(
            worm,
            {
              attr: { d: 'M15 16 L40 28 L85 4', 'stroke-width': 6 },
              ...timing,
            },
            0
          );
        else if (!immediate) {
          [-8, 8, -5, 5, 0].forEach((rotation, i) =>
            tl.to(
              body,
              {
                rotation,
                duration: gsapDuration.slower / 5,
                ease: gsapEasing.drift,
              },
              gsapDuration.base + (i * gsapDuration.slower) / 5
            )
          );
        }
        tl.to(body, { opacity: 0, duration: gsapDuration.base }, drawAt);
      }

      if (
        status === 'error' &&
        (type === 'bar' || type === 'inchworm') &&
        !immediate
      ) {
        // TextField와 같은 좌우 진폭을 쓰며 마지막은 원점으로 돌아온다.
        const offsets = [-2, 4, -7, 7, -7, 7, -7, 4, -2, 0];
        offsets.forEach((x, i) =>
          tl.to(
            host,
            {
              x,
              duration: gsapDuration.slower / offsets.length,
              ease: gsapEasing.drift,
            },
            gsapDuration.base + (i * gsapDuration.slower) / offsets.length
          )
        );
      }
      return tl;
    });
    if (immediate) arrive();
    else {
      host.__loaderStatusTimeline = timeline;
      timeline.eventCallback('onComplete', () => {
        timeline.kill();
        arrive();
      });
    }
  }, [type, status, size, reduced]);

  useEffect(() => {
    const host = hostRef.current;
    return () => {
      host?.__loaderStatusTimeline?.kill();
    };
  }, []);

  return (
    <div
      ref={hostRef}
      className={statusGraphic}
      data-loader-graphic={type}
      data-status={status}
      data-loader-mark={status === 'loading' ? undefined : status}
      aria-hidden={type === 'spinner' ? undefined : true}
    >
      {type === 'spinner' ? (
        <div className={spinnerSizeStyles[size]}>
          <div
            className={clsx(spinner, spinnerSizeStyles[size])}
            data-spinner
            data-motion-part
          />
          <svg
            className={closingRing}
            viewBox="0 0 100 100"
            role="presentation"
          >
            <circle
              data-closing-ring
              cx="50"
              cy="50"
              r="44"
              pathLength="1"
              opacity="0"
            />
          </svg>
        </div>
      ) : type === 'dots' ? (
        <div className={dotsContainer}>
          {(['first', 'second', 'third'] as const).map((delay) => (
            <span
              key={delay}
              className={clsx(dot, dotSizeStyles[size], dotDelayStyles[delay])}
              data-dot
              data-delay={delay}
              data-motion-part
            >
              <span
                className={clsx(dotBody, dotDelayStyles[delay])}
                data-motion-part
              />
            </span>
          ))}
        </div>
      ) : type === 'bar' ? (
        <div className={clsx(bar, barSizeStyles[size])}>
          <div className={barClip} data-bar-clip>
            <div className={barFill} data-motion-part />
          </div>
        </div>
      ) : type === 'wave' ? (
        <div
          className={clsx(wave, waveSizeStyles[size])}
          style={{ '--wave-n': waveBarCount(size) } as CSSProperties}
          data-wave
          aria-hidden="true"
        >
          {Array.from({ length: waveBarCount(size) }, (_, i) => (
            <span
              key={i}
              className={waveBar}
              style={{ '--wave-i': i } as CSSProperties}
              data-wave-bar
              data-motion-part
            />
          ))}
        </div>
      ) : (
        <div className={clsx(inchwormTrack, barSizeStyles[size])} data-inchworm>
          <div className={inchwormFill} data-inchworm-fill data-motion-part>
            <svg
              className={wormSkin}
              viewBox="0 0 100 32"
              preserveAspectRatio="none"
              role="presentation"
            >
              <path data-worm-body d="M16 16 L50 16 L84 16" strokeWidth="32" />
            </svg>
          </div>
        </div>
      )}
      <svg
        className={clsx(resultMark, spinnerSizeStyles[size])}
        viewBox="0 0 48 48"
        data-result-mark
        role="presentation"
      >
        <path
          data-mark-path
          d={status === 'error' ? ERROR_PATH : CHECK_PATH}
          pathLength="1"
          strokeDasharray="1"
          strokeDashoffset="1"
        />
      </svg>
    </div>
  );
};

export const Loader = ({
  type = 'orbit',
  status = 'loading',
  size = 'md',
  color = 'primary',
  label,
  fullScreen = false,
  overlay = false,
  'aria-label': ariaLabel,
  className,
  ...props
}: LoaderProps) => {
  const reduced = useReducedMotion();
  const labelRef = useRef<LabelHost>(null);
  const labelTlRef = useRef<gsap.core.Timeline | null>(null);

  // 라벨이 바뀌면 옛 글자를 흐려 보내고 새 글자를 같은 칸에 흐림에서 불러온다.
  // 켜지지 않은 층은 절대 위치라 칸 폭에 들어가지 않는다. 칸 폭은 새 글자 기준으로
  // 그 커밋에 바로 정해지고 트윈하지 않는다. 라벨이 없어지면 두 층을 비우고, 다시
  // 생기면 처음 렌더처럼 효과 없이 나온다.
  const [slots, setSlots] = useState<LabelSlots>({
    texts: [label ?? '', ''],
    active: 0,
  });
  const prevSlotsRef = useRef(slots);
  if (!label) {
    if (slots.texts[0] || slots.texts[1]) setSlots(EMPTY_SLOTS);
  } else if (slots.texts[slots.active] !== label) {
    if (!slots.texts[slots.active]) {
      setSlots({ texts: [label, ''], active: 0 });
    } else {
      const next = slots.active === 0 ? 1 : 0;
      const texts: [string, string] = [...slots.texts];
      texts[next] = label;
      setSlots({ texts, active: next });
    }
  }
  const clearLayer = (index: number): void =>
    setSlots((s) =>
      !s.texts[index]
        ? s
        : {
            ...s,
            texts: s.texts.map((t, i) => (i === index ? '' : t)) as [
              string,
              string,
            ],
          }
    );

  // 글자가 바뀐 그 커밋에서 두 글자 층의 흐림 교체를 타임라인 하나로 건다. DOM
  // 레이아웃은 읽지 않는다(칸 폭·줄바꿈 판정 없음). 라벨이 없거나 글자가 그대로면
  // 아무것도 하지 않는다. 끝나면(onComplete) 옛 층을 비운다. 도중에 또 바뀌면 이
  // 타임라인은 죽고, 옛 층은 새 글자의 층으로 재사용되거나(더 옛 글자) 다음
  // 타임라인이 맡는다.
  useLayoutEffect(() => {
    const prev = prevSlotsRef.current;
    prevSlotsRef.current = slots;
    const p = labelRef.current;
    if (!p) {
      labelTlRef.current?.kill();
      labelTlRef.current = null;
      return;
    }
    if (
      prev.active === slots.active ||
      !prev.texts[prev.active] ||
      !slots.texts[slots.active]
    ) {
      // 도는 중에 축소 선호가 켜지면 끝 상태로 확정한다(궤도 상태 전환과 같다)
      if (reduced && labelTlRef.current) settleMotion(labelTlRef.current);
      return;
    }

    const layerEls = p.querySelectorAll<HTMLElement>('[data-label-layer]');
    const oldEl = layerEls[prev.active];
    const newEl = layerEls[slots.active];
    labelTlRef.current?.kill();

    const finish = (tl: gsap.core.Timeline): void => {
      if (labelTlRef.current !== tl) return;
      labelTlRef.current = null;
      p.__loaderLabelTimeline = undefined;
      clearLayer(prev.active);
    };
    // 축소 선호면 gateMotion이 끝 상태로 확정하며 onComplete도 불러 옛 층을 비운다
    gateMotion(reduced, () => {
      const tl = gsap.timeline({ onComplete: () => finish(tl) });
      labelTlRef.current = tl;
      p.__loaderLabelTimeline = tl;
      const timing = { duration: gsapDuration.base, ease: gsapEasing.settle };
      tl.to(oldEl, { opacity: 0, filter: 'blur(2px)', ...timing }, 0).fromTo(
        newEl,
        { opacity: 0, filter: 'blur(2px)' },
        { opacity: 1, filter: 'blur(0px)', ...timing },
        0
      );
      return tl;
    });
  }, [slots, reduced]);

  useEffect(
    () => () => {
      labelTlRef.current?.kill();
    },
    []
  );

  const renderLoader = () => {
    const accessibleLabel = ariaLabel || label || STATUS_NAME[status];
    const presetClass = isPreset(color) ? colorStyles[color] : undefined;
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label={accessibleLabel}
        data-type={type}
        data-size={size}
        data-color={color}
        className={clsx(inlineContainer, presetClass)}
        style={
          presetClass
            ? undefined
            : ({
                '--spinner-color': color,
                '--loader-color': color,
              } as CSSProperties)
        }
      >
        {type === 'orbit' ? (
          <OrbitGraphic status={status} size={size} reduced={reduced} />
        ) : (
          <StatusGraphic
            key={type}
            type={type}
            status={status}
            size={size}
            reduced={reduced}
          />
        )}
        <span className={visuallyHidden} data-loader-message>
          {accessibleLabel}
        </span>
      </div>
    );
  };

  const loaderElement = renderLoader();

  if (!label && !fullScreen && !overlay) {
    return (
      <div {...props} {...a11yLocked} className={className}>
        {loaderElement}
      </div>
    );
  }

  return (
    <div
      {...props}
      {...a11yLocked}
      className={clsx(
        loaderContainer,
        fullScreen && fullScreenStyles,
        overlay && overlayStyles,
        className
      )}
    >
      {loaderElement}
      {label && (
        <p
          ref={labelRef}
          className={labelClass}
          // 접근 이름(aria-label ?? label)이 라벨과 같으면 살아 있는 영역의 숨은 메시지가
          // 그 글자를 이미 읽는다. 다르면 보이는 글자가 따로 읽혀야 하므로 숨기지 않는다.
          aria-hidden={!ariaLabel || ariaLabel === label ? true : undefined}
        >
          {slots.texts.map((t, i) => (
            <span
              key={i}
              className={labelLayer}
              data-label-layer
              data-active={i === slots.active ? '' : undefined}
              aria-hidden={i === slots.active ? undefined : true}
            >
              {t}
            </span>
          ))}
        </p>
      )}
    </div>
  );
};

Loader.displayName = 'Loader';
