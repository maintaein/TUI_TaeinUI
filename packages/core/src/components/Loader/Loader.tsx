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
  fuse,
  fuseFill,
  fuseSpark,
  fuseSparkDot,
  fuseSparkSizeStyles,
  spinnerSizeStyles,
  dotSizeStyles,
  dotDelayStyles,
} from './Loader.css';
import {
  ORBIT_DOTS,
  ORBIT_RADIUS_PX,
  clampPercent,
  markPoints,
  pairByAngle,
  ringPoints,
  waveBarCount,
  type Point,
} from './loaderMotion';
// 원본 팔레트를 직접 참조하는 이유: type="bar" 렌더 경로는 themeContract 기반
// colorStyles를 쓰지만(아래), spinner/dots 경로는 color를 --spinner-color에
// raw 값으로 넘긴다. color prop이 테마 role뿐 아니라 임의의 CSS 색상 문자열도
// 받기 때문에, preset은 raw 값으로 풀고 그 밖의 값은 그대로 통과시킨다.
import { primary, gray } from '../../tokens/colors.css';

/** 모든 type이 받는 prop */
interface LoaderBaseProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'color'
> {
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

/** 점 궤도. `status`로 완료 표식을 받는다 */
interface OrbitLoaderProps extends LoaderBaseProps {
  /** 로딩 애니메이션 타입 @default 'orbit' */
  type?: 'orbit';
  /** 완료 표식. `done`이면 점들이 체크로, `error`면 X로 모인다 @default 'loading' */
  status?: 'loading' | 'done' | 'error';
  value?: never;
}

/** 진행률을 받는 도화선. `value`가 필수다 */
interface FuseLoaderProps extends LoaderBaseProps {
  /** 로딩 애니메이션 타입 */
  type: 'fuse';
  /** 진행률(0~100, 범위 밖은 자른다) */
  value: number;
  status?: never;
}

/** 그 밖의 type. `status`와 `value`는 받지 않는다 */
interface PlainLoaderProps extends LoaderBaseProps {
  /** 로딩 애니메이션 타입 */
  type: 'spinner' | 'dots' | 'bar' | 'wave' | 'inchworm';
  status?: never;
  value?: never;
}

/**
 * 로딩 상태를 표시하는 컴포넌트. 점 궤도, 스피너, 점, 바, 물결, 자벌레, 도화선 타입 지원.
 *
 * `status`는 `type`이 `'orbit'`(또는 생략)일 때만, `value`는 `type="fuse"`일 때만
 * (그때는 필수) 받는다.
 */
export type LoaderProps = OrbitLoaderProps | FuseLoaderProps | PlainLoaderProps;

type ColorPreset = keyof typeof colorStyles;

const isPreset = (value: string): value is ColorPreset =>
  value === 'primary' || value === 'secondary' || value === 'white';

// 접근성 계약(role, aria-live, aria-busy)은 안쪽 status 요소가 쥔다. 소비자가
// ...props로 바깥 래퍼에 같은 속성을 얹어 status를 이중으로 만들지 못하게,
// props 펼침 뒤에 undefined로 덮는다(React는 undefined 속성을 렌더하지 않는다).
const a11yLocked = {
  role: undefined,
  'aria-live': undefined,
  'aria-busy': undefined,
} as const;

type OrbitStatus = 'loading' | 'done' | 'error';
type LoaderSize = keyof typeof ORBIT_RADIUS_PX;

const STATUS_NAME: Record<OrbitStatus, string> = {
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
const orbitTargets = (status: OrbitStatus, size: LoaderSize): Point[] => {
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
  status: OrbitStatus;
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
  const shownRef = useRef<{ status: OrbitStatus; size: LoaderSize } | null>(
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

export const Loader = ({
  type = 'orbit',
  status = 'loading',
  value,
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
  // 지금 켜진 글자가 줄바꿈되는지(들어올 때 잰 값)와, 그 값을 잰 칸
  const wrapsRef = useRef(false);
  const measuredHostRef = useRef<HTMLElement | null>(null);

  // 라벨이 바뀌면 옛 글자를 흐려 보내고 새 글자를 같은 칸에 흐림에서 불러온다.
  // 켜지지 않은 층은 절대 위치라 칸 폭에 들어가지 않고, 칸 폭은 아래 effect의
  // 타임라인이 옛 폭에서 새 폭으로 옮긴다. 라벨이 없어지면 두 층을 비우고, 다시
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

  // 글자가 바뀐 그 커밋에서만 칸 안의 폭과 높이를 재고, 칸 폭 트윈과 두 글자 층의 흐림
  // 교체를 타임라인 하나로 건다(Chip 삭제의 marginInlineEnd 트윈과 같은 1회성
  // 레이아웃 트윈). 가운데 놓인 그래픽은 칸이 부드럽게 변하니 같이 옮겨 간다.
  // 라벨이 없거나 글자가 그대로면 아무것도 재지 않는다. 끝나면(onComplete) 옛 층을
  // 비운다. 도중에 또 바뀌면 이 타임라인은 죽고, 옛 층은 새 글자의 층으로
  // 재사용되거나(더 옛 글자) 다음 타임라인이 맡는다.
  //
  // 줄바꿈 여부는 폭이 아니라 높이로 잰다. 컨테이너가 내용에 맞춰 줄어드는 자리
  // (flex-start 줄 등)에서는 nowrap이 칸도 같이 넓혀 폭 비교가 늘 "들어간다"로 나온다.
  // 줄바꿈을 허용한 높이가 nowrap 높이보다 크면 줄바꿈되는 글자다.
  // 한 번 재고 nowrap은 남겨 둔다(트윈 동안 쓰고, 줄바꿈이면 호출자가 푼다).
  const measureLabel = (p: HTMLElement): { wraps: boolean; to: number } => {
    p.style.whiteSpace = '';
    const hWrap = p.offsetHeight;
    p.style.whiteSpace = 'nowrap';
    const hOne = p.offsetHeight;
    return { wraps: hWrap > hOne + 0.5, to: p.offsetWidth };
  };
  useLayoutEffect(() => {
    const prev = prevSlotsRef.current;
    prevSlotsRef.current = slots;
    const p = labelRef.current;
    if (!p) {
      measuredHostRef.current = null;
      labelTlRef.current?.kill();
      labelTlRef.current = null;
      return;
    }
    // 처음 나온 칸(첫 렌더, 라벨이 다시 생김)은 효과 없이 나오고, 다음 교체의 옛
    // 글자 값으로 줄바꿈 여부 하나만 재어 둔다.
    if (measuredHostRef.current !== p) {
      measuredHostRef.current = p;
      wrapsRef.current = measureLabel(p).wraps;
      p.style.whiteSpace = '';
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
    const running = labelTlRef.current;
    // 도는 중이면 눈에 보이는 폭(고정된 폭)에서, 아니면 옛 글자 폭에서 시작한다.
    // 꺼진 층은 nowrap이라 oldWidth는 옛 글자의 한 줄 폭이다.
    const from = running ? p.offsetWidth : oldEl.offsetWidth;
    running?.kill();
    p.style.width = '';
    const { wraps, to } = measureLabel(p);
    // 옛 층은 지금 absolute라 지금 재면 배치가 다르다. 옛 글자가 들어올 때 잰 값을 쓴다.
    // 옛 글자나 새 글자가 줄바꿈되던 라벨이면 한 줄로 펴는 폭 트윈이 칸을 밀고
    // 높이를 뛰게 한다. 흐림 교체만 한다.
    const tweenWidth = !(wrapsRef.current || wraps);
    wrapsRef.current = wraps;
    if (!tweenWidth) p.style.whiteSpace = '';

    const finish = (tl: gsap.core.Timeline): void => {
      if (labelTlRef.current !== tl) return;
      labelTlRef.current = null;
      p.__loaderLabelTimeline = undefined;
      p.style.width = '';
      p.style.whiteSpace = '';
      clearLayer(prev.active);
    };
    // 축소 선호면 gateMotion이 끝 상태로 확정하며 onComplete도 불러 옛 층을 비운다
    gateMotion(reduced, () => {
      const tl = gsap.timeline({ onComplete: () => finish(tl) });
      labelTlRef.current = tl;
      p.__loaderLabelTimeline = tl;
      const timing = { duration: gsapDuration.base, ease: gsapEasing.settle };
      if (tweenWidth) {
        tl.fromTo(p, { width: from }, { width: to, ...timing }, 0);
      }
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

  // color preset을 실제 색상 값으로 변환. preset이 아니면 CSS 색상값이므로 그대로 쓴다
  const getColorValue = (value: string) => {
    switch (value) {
      case 'primary':
        return primary[600];
      case 'secondary':
        return gray[600];
      case 'white':
        return '#FFFFFF';
      default:
        return value;
    }
  };

  const renderLoader = () => {
    const defaultName =
      type === 'fuse'
        ? '진행률'
        : type === 'orbit'
          ? STATUS_NAME[status]
          : STATUS_NAME.loading;
    const accessibleLabel = ariaLabel || label || defaultName;
    const presetClass = isPreset(color) ? colorStyles[color] : undefined;

    // 도화선: 진행률을 받는 막대. 채움은 clip-path로, 불똥은 곁의 래퍼로 옮긴다.
    if (type === 'fuse') {
      const percent = clampPercent(value ?? 0);
      return (
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-label={accessibleLabel}
          data-type="fuse"
          data-size={size}
          data-color={color}
          data-complete={percent >= 100 ? '' : undefined}
          className={presetClass}
          style={
            {
              '--fuse-value': percent,
              ...(presetClass ? {} : { '--loader-color': color }),
            } as CSSProperties
          }
        >
          <div className={clsx(fuse, barSizeStyles[size])}>
            <div className={bar}>
              <div className={fuseFill} data-fuse-fill />
            </div>
            <div className={fuseSpark} aria-hidden="true" data-fuse-spark>
              <span className={clsx(fuseSparkDot, fuseSparkSizeStyles[size])} />
            </div>
          </div>
        </div>
      );
    }

    // 자벌레는 bar와 같은 트랙을 쓰고 채움 층만 다르다.
    if (type === 'bar' || type === 'inchworm') {
      return (
        <div
          role="status"
          aria-live="polite"
          aria-busy="true"
          aria-label={accessibleLabel}
          data-type={type}
          data-size={size}
          data-color={color}
        >
          <div className={clsx(bar, barSizeStyles[size])}>
            <div
              className={clsx(
                type === 'bar' ? barFill : inchwormFill,
                presetClass
              )}
              data-inchworm-fill={type === 'inchworm' ? '' : undefined}
              // colorStyles는 preset 3개만 가진 styleVariants라 임의 색상 문자열이면
              // 클래스가 없다. 그때는 --loader-color를 인라인으로 직접 넘긴다.
              style={
                presetClass
                  ? undefined
                  : ({ '--loader-color': color } as CSSProperties)
              }
            />
          </div>
          <span className={visuallyHidden} data-loader-message>
            {accessibleLabel}
          </span>
        </div>
      );
    }

    return (
      <div
        role="status"
        aria-live="polite"
        aria-busy={
          type === 'orbit'
            ? status === 'loading'
            : type === 'wave'
              ? true
              : undefined
        }
        aria-label={accessibleLabel}
        data-type={type}
        data-size={size}
        className={inlineContainer}
        style={{ '--spinner-color': getColorValue(color) } as CSSProperties}
      >
        {type === 'dots' ? (
          <div className={dotsContainer}>
            {(['first', 'second', 'third'] as const).map((delay) => (
              <span
                key={delay}
                className={clsx(
                  dot,
                  dotSizeStyles[size],
                  dotDelayStyles[delay]
                )}
                data-dot
                data-delay={delay}
              >
                <span className={clsx(dotBody, dotDelayStyles[delay])} />
              </span>
            ))}
          </div>
        ) : type === 'wave' ? (
          <div
            className={clsx(wave, waveSizeStyles[size])}
            style={{ '--wave-n': waveBarCount(size) } as CSSProperties}
            aria-hidden="true"
            data-wave
          >
            {Array.from({ length: waveBarCount(size) }, (_, i) => (
              <span
                key={i}
                className={waveBar}
                style={{ '--wave-i': i } as CSSProperties}
                data-wave-bar
              />
            ))}
          </div>
        ) : type === 'orbit' ? (
          <OrbitGraphic status={status} size={size} reduced={reduced} />
        ) : (
          <div
            className={clsx(spinner, spinnerSizeStyles[size])}
            data-spinner
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
        <p ref={labelRef} className={labelClass}>
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
