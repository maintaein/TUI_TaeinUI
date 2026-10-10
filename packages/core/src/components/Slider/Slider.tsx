import {
  forwardRef,
  useId,
  useState,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type InputHTMLAttributes,
  type ChangeEvent,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import clsx from 'clsx';
import { gsap } from 'gsap';
import { gateMotion } from '../../hooks/gateMotion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { gsapEasing, gsapDuration } from '../../tokens/gsapEasing';
import {
  container,
  labelContainer,
  label as labelClass,
  required as requiredClass,
  valueDisplay,
  sliderWrapper,
  sliderTrack,
  sliderLine,
  sliderLineTrack,
  sliderLineFill,
  wakeBars,
  wakeBar,
  slider as sliderClass,
  sizeVariants,
  variantStyles,
  helperText as helperTextClass,
  marksContainer,
  mark,
  markLabel,
  valueFollower,
  VALUE_FOLLOWER_PERCENT_VAR,
  sliderHead,
  HEAD_PERCENT_VAR,
} from './Slider.css';
import {
  lineShapes,
  wakeBarCount,
  waveAmp,
  waveLift,
  waveScale,
  LINE_BAR_HOVER,
  LINE_BAR_REST,
  LINE_BOX_HEIGHT,
  LINE_DEFAULT_WIDTH,
  LINE_HOVER,
  LINE_REST,
  WAKE_BAR_GAP_PX,
  WAKE_DEFAULT_BARS,
  WAKE_FLAT,
  WAKE_MAX_FRAME_S,
  nextDisplayLock,
  stepWidthPx,
  stepWakeSprings,
  wakeSpringsRested,
  type WakeSprings,
} from './sliderMath';

/** 슬라이더 트랙 위에 표시되는 마크 */
export interface SliderMark {
  /** 마크 위치 (min~max 범위 내 값) */
  value: number;
  /** 마크 레이블 텍스트 */
  label: string;
}

/**
 * 테스트 전용. 물결을 그리는 요소(wake는 막대 묶음, default·bar는 트랙)에 달린
 * 손잡이: 프레임 콜백(`__wakeTick`), 머리 위치 객체(`__wakeHead`, 트랙 %).
 */
interface WakeBarsHost extends HTMLDivElement {
  __wakeTick?: (time: number, deltaMs: number) => void;
  __wakeHead?: { pct: number };
  /** default·bar의 호버 두께 트윈. */
  __hoverTween?: gsap.core.Tween;
}

/** 잡았다는 신호를 만드는 키. */
const GRAB_KEYS = new Set([
  'ArrowRight',
  'ArrowLeft',
  'ArrowUp',
  'ArrowDown',
  'Home',
  'End',
]);

/**
 * 키보드로 "놓았다"를 알 방법이 없다(pointerup 대응 없음) — 마지막 키 입력 후
 * 이 시간 동안 입력이 없으면 놓은 것으로 본다. `duration.slower`(500ms) 근방을
 * 쓰라는 브리프 지시를 그대로 gsapDuration에서 가져온다(초→ms 환산 한 곳).
 */
const KEYBOARD_RELEASE_MS = gsapDuration.slower * 1000;

/** value → 트랙 폭 대비 %. Ruling 23: getBoundingClientRect() 대신 값에서 계산한다. */
function valueToPercent(value: number, min: number, max: number): number {
  return max !== min ? ((value - min) / (max - min)) * 100 : 0;
}

/** 범위 내 값을 선택하는 슬라이더 컴포넌트 */
export interface SliderProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'size' | 'type'
> {
  /** 레이블 텍스트 */
  label: string;
  /** 슬라이더 크기 */
  size?: 'sm' | 'md' | 'lg';
  /**
   * 모양.
   * - `default`: 라인과 머리. 끌면 머리 둘레의 라인이 속도에 비례해 부풀어
   *   물결치고(뒤쪽으로 길게) 멈추면 매끈해진다. 마우스를 올리면 라인이
   *   두꺼워지고 머리가 부푼다
   * - `bar`: 머리 없이 채움 막대가 값이다(머리는 투명해도 잡고 끌 수 있다).
   *   키보드 포커스는 트랙 둘레의 링으로 보인다. 라인은 default와 같이 물결친다
   * - `wake`: 라인이 눈금 막대로 나뉘고, 값이 바뀌면 머리 뒤로 막대들이 속도에
   *   비례해 물결처럼 솟았다 가라앉는다. 움직임 줄이기 설정에서는 물결이 없다
   * @default 'default'
   */
  variant?: 'default' | 'bar' | 'wake';
  /** 최소값 */
  min?: number;
  /** 최대값 */
  max?: number;
  /** 증감 단위 */
  step?: number;
  /** 현재 값 표시 여부 */
  showValue?: boolean;
  /** 도움말 텍스트 */
  helperText?: string;
  /** 필수 입력 */
  required?: boolean;
  /** 마크 표시 */
  marks?: SliderMark[];
  /** 트랙 채움 색상 */
  trackColor?: string;
  /** 추가 클래스명 */
  className?: string;
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  (
    {
      label,
      size = 'md',
      variant = 'default',
      min = 0,
      max = 100,
      step = 1,
      showValue = false,
      helperText,
      required = false,
      marks,
      trackColor,
      disabled = false,
      value,
      defaultValue = 0,
      onChange,
      className,
      ...props
    },
    ref
  ) => {
    const helperId = useId();
    const isControlled = value !== undefined;

    // 비제어 모드에서 fill 트랙을 위한 내부 상태
    const [internalValue, setInternalValue] = useState(Number(defaultValue));

    const currentValue = isControlled ? Number(value) : internalValue;
    const fillPercent =
      max !== min ? ((currentValue - min) / (max - min)) * 100 : 0;

    const handleChange = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => {
        if (!isControlled) {
          setInternalValue(Number(e.target.value));
        }
        onChange?.(e);
      },
      [isControlled, onChange]
    );

    // 잡은 동안 값이 썸을 따라간다.
    const reduced = useReducedMotion();
    const [isGrabbed, setIsGrabbed] = useState(false);

    // setTimeout 콜백이 항상 최신 값을 읽도록. 키보드 유휴 타이머는 render 여러
    // 번 뒤에 발화할 수 있어 클로저가 그 시점의 값을 못 잡는다.
    const currentValueRef = useRef(currentValue);
    useLayoutEffect(() => {
      currentValueRef.current = currentValue;
    });

    const keyboardReleaseTimerRef = useRef<ReturnType<
      typeof setTimeout
    > | null>(null);
    const followerRef = useRef<HTMLSpanElement>(null);
    const headRef = useRef<HTMLSpanElement>(null);
    // 포인터로 끄는 중인가. 키보드로 잡은 것(isGrabbed)과 구분한다: 키보드 변화는 늘 스프링이다.
    const draggingRef = useRef(false);
    // 보이는 위치가 목표를 그대로 따라붙는 중인가(nextDisplayLock). 누를 때마다 풀린다.
    const lockedRef = useRef(false);
    // 보이는 위치(트랙 %). 그린 머리, 채움, 값 따라붙기가 모두 이것을 따른다. 값(목표)을
    // 스프링으로 좇고, 마운트에서는 값 자리다. 렌더는 처음 값만 쓰고(`initialPct`) 이후는
    // 프레임과 `paintDisplay`가 DOM에 쓴다.
    const [initialPct] = useState(fillPercent);
    const displayRef = useRef(initialPct);

    const handleRelease = useCallback(() => {
      if (disabled) return;
      if (keyboardReleaseTimerRef.current !== null) {
        clearTimeout(keyboardReleaseTimerRef.current);
        keyboardReleaseTimerRef.current = null;
      }
      setIsGrabbed(false);
    }, [disabled]);

    const handleGrab = () => {
      if (disabled) return;
      setIsGrabbed(true);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      if (!GRAB_KEYS.has(e.key)) return;
      handleGrab();
      if (keyboardReleaseTimerRef.current !== null) {
        clearTimeout(keyboardReleaseTimerRef.current);
      }
      keyboardReleaseTimerRef.current = setTimeout(
        handleRelease,
        KEYBOARD_RELEASE_MS
      );
    };

    const handlePointerDown = () => {
      if (!disabled) draggingRef.current = true;
      lockedRef.current = false;
      handleGrab();
    };

    const handlePointerEnd = () => {
      draggingRef.current = false;
      handleRelease();
    };

    const handleBlur = () => {
      draggingRef.current = false;
      if (isGrabbed) handleRelease();
    };

    // keyboardReleaseTimerRef 마운트 범위 정리. 재잡음·해제 경로만 정리하면
    // 유휴창(≤500ms) 안에 언마운트될 때 정리할 곳이 없어 언마운트 뒤에
    // setState가 돈다. 마운트 스코프 cleanup 하나로 닫는다.
    useEffect(() => {
      return () => {
        if (keyboardReleaseTimerRef.current !== null) {
          clearTimeout(keyboardReleaseTimerRef.current);
          keyboardReleaseTimerRef.current = null;
        }
      };
    }, []);

    // 물결. 머리 위치는 값을 settle 성질로 따라가고, 매 프레임 그 변화량으로 속도를
    // 재 물결을 만든다. wake는 눈금 막대 높이로, default·bar는 라인 두께로 그린다.
    // 폭은 ResizeObserver로 읽고, 읽기 전(SSR·첫 렌더)에는 기본값으로 그린 뒤
    // 측정하고 맞춘다. wake의 막대 개수는 이 폭이 정한다(간격 8px마다 하나).
    const isWake = variant === 'wake';
    const isBar = variant === 'bar';
    const wakeBarsRef = useRef<WakeBarsHost>(null);
    const lineRef = useRef<WakeBarsHost>(null);
    const headSetterRef = useRef<((percent: number) => void) | null>(null);
    const [trackWidth, setTrackWidth] = useState(0);

    useLayoutEffect(() => {
      const host = isWake ? wakeBarsRef.current : lineRef.current;
      if (!host) return;
      setTrackWidth(host.clientWidth);
      if (typeof ResizeObserver === 'undefined') return;
      const observer = new ResizeObserver(([entry]) =>
        setTrackWidth(entry.contentRect.width)
      );
      observer.observe(host);
      return () => observer.disconnect();
    }, [isWake]);

    const barCount = isWake
      ? trackWidth > 0
        ? wakeBarCount(trackWidth)
        : WAKE_DEFAULT_BARS
      : 0;
    // 실제 막대 간격(px). 폭을 모르면 기본 간격.
    const barGap =
      trackWidth > 0 ? trackWidth / (barCount - 1) : WAKE_BAR_GAP_PX;

    // 라인(default·bar). 그리는 값은 모두 ref 하나에 두고, 프레임·호버 트윈·렌더가
    // 같은 paintLine으로 경로를 다시 쓴다.
    const restThick = isBar ? LINE_BAR_REST : LINE_REST;
    const hoverThick = isBar ? LINE_BAR_HOVER : LINE_HOVER;
    const lineW = trackWidth > 0 ? trackWidth : LINE_DEFAULT_WIDTH;
    const widthRef = useRef(lineW);
    const lineId = `line-${useId().replace(/:/g, '')}`;
    const lineState = useRef({ base: restThick, headPct: 0, dir: 1, amp: 0 });
    const lineShapeRefs = useRef<{
      track: SVGPathElement | null;
      fill: SVGPathElement | null;
      clip: SVGRectElement | null;
    }>({ track: null, fill: null, clip: null });
    const hoverTweenRef = useRef<gsap.core.Tween | null>(null);
    const hoveredRef = useRef(false);

    const lineShapesNow = () =>
      lineShapes({
        width: lineW,
        fillPct: displayRef.current,
        roundEnd: isBar,
        ...lineState.current,
      });
    const paintLine = () => {
      const track = lineRef.current;
      const shapes = lineShapeRefs.current;
      if (!track || !shapes.track || !shapes.fill || !shapes.clip) return;
      const next = lineShapesNow();
      shapes.track.setAttribute('d', next.track);
      shapes.fill.setAttribute('d', next.fill);
      shapes.clip.setAttribute('width', String(next.clip));
      track.style.height = `${lineState.current.base}px`;
    };
    const paintLineRef = useRef(paintLine);

    // 보이는 위치를 라인 밖의 것에 쓴다: 그린 머리, 값 따라붙기, wake의 켜진 막대.
    // 라인은 paintLine이 같은 위치로 따로 그린다.
    const paintDisplay = () => {
      const pct = displayRef.current;
      headRef.current?.style.setProperty(HEAD_PERCENT_VAR, String(pct));
      followerRef.current?.style.setProperty(
        VALUE_FOLLOWER_PERCENT_VAR,
        String(pct)
      );
      const bars = wakeBarsRef.current?.children;
      if (!bars) return;
      for (let i = 0; i < bars.length; i++) {
        const bar = bars[i] as HTMLElement;
        const on = (i / (bars.length - 1)) * 100 <= pct + 1e-9;
        if (bar.dataset.on !== String(on))
          bar.setAttribute('data-on', String(on));
        bar.style.setProperty(
          'background-color',
          on && trackColor ? trackColor : ''
        );
      }
    };
    const paintDisplayRef = useRef(paintDisplay);

    // 렌더마다 바탕 두께를 맞추고 다시 그린다(폭·값·변형이 바뀐 경우). 호버 트윈이
    // 도는 중이면 두께는 트윈이 정한다. 축소 모드는 스프링이 없어 값 자리로 바로 간다.
    useLayoutEffect(() => {
      paintLineRef.current = paintLine;
      paintDisplayRef.current = paintDisplay;
      widthRef.current = lineW;
      if (reduced) displayRef.current = fillPercent;
      paintDisplay();
      if (isWake) return;
      if (!hoveredRef.current || reduced) {
        hoverTweenRef.current?.kill();
        lineState.current.base = restThick;
      } else if ((hoverTweenRef.current?.progress() ?? 1) >= 1) {
        lineState.current.base = hoverThick;
      }
      paintLineRef.current();
    });

    useEffect(
      () => () => {
        hoverTweenRef.current?.kill();
      },
      []
    );

    // 호버: 바탕 두께가 들어갈 때 slow spring, 나올 때 base settle. 마우스만,
    // 비활성·축소 선호에서는 없다. 머리 1.15배는 CSS가 맡는다.
    const tweenBase = (to: number, entering: boolean) => {
      hoverTweenRef.current?.kill();
      hoverTweenRef.current = gateMotion(reduced, () =>
        gsap.to(lineState.current, {
          base: to,
          duration: entering ? gsapDuration.slow : gsapDuration.base,
          ease: entering ? gsapEasing.spring : gsapEasing.settle,
          onUpdate: () => paintLineRef.current(),
        })
      );
      if (lineRef.current) lineRef.current.__hoverTween = hoverTweenRef.current;
    };
    const handlePointerEnter = (e: ReactPointerEvent<HTMLDivElement>) => {
      if (isWake || disabled || reduced || e.pointerType !== 'mouse') return;
      hoveredRef.current = true;
      tweenBase(hoverThick, true);
    };
    const handlePointerLeave = () => {
      if (!hoveredRef.current) return;
      hoveredRef.current = false;
      tweenBase(restThick, false);
    };

    useEffect(() => {
      const host = isWake ? wakeBarsRef.current : lineRef.current;
      if (reduced || !host) return;

      const line = lineState.current;
      const bars = isWake ? (Array.from(host.children) as HTMLElement[]) : [];
      const head = { pct: valueToPercent(currentValueRef.current, min, max) };
      // 머리는 값(target)을 임계 감쇠 스프링으로 따라가고, 그 속도를 과감쇠 스프링으로
      // 걸러 세기를 잰다(WakeSlider.tsx:91-95). 끄는 세기에 비례해 서서히 차오르고 빠진다.
      let target = head.pct;
      let springs: WakeSprings = { x: head.pct, v: 0, s: 0, ds: 0 };
      // 보이는 위치도 같은 스프링으로 값을 좇는다. 물결 머리와 따로 둔다: 끄는 중에는
      // 한 단계가 좁으면 목표를 그대로 쓰는데(nextDisplayLock), 물결 머리는 그 지연에서 속도를
      // 얻으므로 같이 쓰면 끄는 중 물결이 사라진다.
      let shownTarget = target;
      let shown: WakeSprings = { x: displayRef.current, v: 0, s: 0, ds: 0 };
      const stepOf = () => stepWidthPx(step, min, max, widthRef.current);
      const setHead = (percent: number) => {
        target = percent;
        const pxPerPct = widthRef.current / 100;
        lockedRef.current = nextDisplayLock({
          locked: lockedRef.current,
          dragging: draggingRef.current,
          stepPx: stepOf(),
          gapPx: Math.abs(shownTarget - shown.x) * pxPerPct,
          jumpPx: Math.abs(percent - shownTarget) * pxPerPct,
        });
        shownTarget = percent;
        if (!lockedRef.current) return;
        shown = { x: percent, v: 0, s: 0, ds: 0 };
        displayRef.current = percent;
        paintDisplayRef.current();
        paintLineRef.current();
      };
      let lastAmp = 0;

      const onTick = (_time: number, deltaMs: number) => {
        // 위치는 트랙 %이고 속도는 px/s로 읽는다: 트랙 길이와 무관하게 같은 손 속도는
        // 같은 세기다.
        const pxPerPct = widthRef.current / 100;
        const dt = Math.min(deltaMs / 1000, WAKE_MAX_FRAME_S);
        const shownMoving = !wakeSpringsRested(shown, shownTarget, pxPerPct);
        const waveMoving = !wakeSpringsRested(springs, target, pxPerPct);
        if (!shownMoving && !waveMoving) return;

        let linePending = false;
        if (shownMoving) {
          lockedRef.current = nextDisplayLock({
            locked: lockedRef.current,
            dragging: draggingRef.current,
            stepPx: stepOf(),
            gapPx: Math.abs(shownTarget - shown.x) * pxPerPct,
            jumpPx: 0,
          });
          shown = lockedRef.current
            ? { x: shownTarget, v: 0, s: 0, ds: 0 }
            : stepWakeSprings(shown, shownTarget, dt);
          if (wakeSpringsRested(shown, shownTarget, pxPerPct)) {
            shown = { x: shownTarget, v: 0, s: 0, ds: 0 };
          }
          displayRef.current = shown.x;
          paintDisplayRef.current();
          linePending = !isWake;
        }

        if (waveMoving) {
          springs = stepWakeSprings(springs, target, dt);
          if (wakeSpringsRested(springs, target, pxPerPct)) {
            springs = { x: target, v: 0, s: 0, ds: 0 };
          }
          head.pct = springs.x;
          const speed = springs.s * pxPerPct;
          const amp = waveAmp(speed);
          const flat = amp < WAKE_FLAT && lastAmp < WAKE_FLAT;
          lastAmp = amp;
          if (!flat) {
            const dir = Math.sign(speed) || 1;
            if (!isWake) {
              Object.assign(line, { headPct: head.pct, dir, amp });
              linePending = true;
            } else {
              const h = (head.pct / 100) * (bars.length - 1);
              bars.forEach((bar, i) => {
                bar.style.transform = `scaleY(${waveScale(waveLift(i - h, dir, amp, barGap))})`;
              });
            }
          }
        }
        if (linePending) paintLineRef.current();
      };

      gsap.ticker.add(onTick);
      headSetterRef.current = setHead;
      host.__wakeTick = onTick;
      host.__wakeHead = head;

      return () => {
        gsap.ticker.remove(onTick);
        headSetterRef.current = null;
        delete host.__wakeTick;
        delete host.__wakeHead;
        // 인라인 높이를 걷어 CSS의 쉬는 높이로 돌아간다.
        for (const bar of bars) bar.style.transform = '';
        if (!isWake) {
          line.amp = 0;
          paintLineRef.current();
        }
      };
    }, [isWake, reduced, min, max, step, barCount, barGap]);

    useEffect(() => {
      headSetterRef.current?.(valueToPercent(currentValue, min, max));
    }, [currentValue, min, max, isWake, reduced]);

    // 첫 렌더(SSR 포함)는 쉬는 모양이다. 물결·호버 두께는 마운트 뒤 paintLine이 쓴다.
    const shapesInit = lineShapes({
      width: lineW,
      fillPct: initialPct,
      roundEnd: isBar,
      base: restThick,
      headPct: 0,
      dir: 1,
      amp: 0,
    });

    return (
      <div className={clsx(container, className)}>
        <div className={labelContainer}>
          <label className={labelClass}>
            {label}
            {required && <span className={requiredClass}>*</span>}
          </label>
          {showValue && <span className={valueDisplay}>{currentValue}</span>}
        </div>

        <div
          className={clsx(
            sliderWrapper,
            sizeVariants[size],
            variantStyles[variant]
          )}
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
        >
          {isWake ? (
            <div className={wakeBars} aria-hidden ref={wakeBarsRef}>
              {Array.from({ length: barCount }, (_, i) => {
                // 막대의 트랙 위 위치(%)가 값(%) 이하면 켜진다.
                const barPercent = (i / (barCount - 1)) * 100;
                const on = barPercent <= initialPct + 1e-9;
                return (
                  <span
                    key={i}
                    className={wakeBar}
                    data-on={on}
                    style={{
                      left: `${barPercent}%`,
                      ...(on && trackColor
                        ? { backgroundColor: trackColor }
                        : {}),
                    }}
                  />
                );
              })}
            </div>
          ) : (
            <div className={sliderTrack} ref={lineRef}>
              <svg
                className={sliderLine}
                viewBox={`0 0 ${lineW} ${LINE_BOX_HEIGHT}`}
                preserveAspectRatio="none"
                aria-hidden
              >
                <defs>
                  <clipPath id={lineId}>
                    <rect
                      ref={(el) => {
                        lineShapeRefs.current.clip = el;
                      }}
                      x={0}
                      y={0}
                      width={shapesInit.clip}
                      height={LINE_BOX_HEIGHT}
                    />
                  </clipPath>
                </defs>
                <path
                  className={sliderLineTrack}
                  ref={(el) => {
                    lineShapeRefs.current.track = el;
                  }}
                  d={shapesInit.track}
                />
                <path
                  className={sliderLineFill}
                  ref={(el) => {
                    lineShapeRefs.current.fill = el;
                  }}
                  d={shapesInit.fill}
                  clipPath={`url(#${lineId})`}
                  style={trackColor ? { fill: trackColor } : undefined}
                />
              </svg>
            </div>
          )}
          {!isBar && (
            <span
              className={sliderHead}
              aria-hidden
              ref={headRef}
              style={{ [HEAD_PERCENT_VAR]: initialPct } as CSSProperties}
            />
          )}
          {isGrabbed && (
            <span className={valueFollower} aria-hidden ref={followerRef}>
              {currentValue}
            </span>
          )}
          <input
            ref={ref}
            type="range"
            className={sliderClass}
            min={min}
            max={max}
            step={step}
            {...(isControlled ? { value } : { defaultValue })}
            disabled={disabled}
            required={required}
            onChange={handleChange}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            aria-label={label}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={currentValue}
            aria-disabled={disabled}
            aria-describedby={helperText ? helperId : undefined}
            {...props}
          />
        </div>

        {marks && marks.length > 0 && (
          <div className={marksContainer}>
            {marks.map((markItem) => (
              <div
                key={markItem.value}
                className={mark}
                style={{
                  left: `${((markItem.value - min) / (max - min)) * 100}%`,
                }}
              >
                <span className={markLabel}>{markItem.label}</span>
              </div>
            ))}
          </div>
        )}

        {helperText && (
          <p id={helperId} className={helperTextClass}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Slider.displayName = 'Slider';
