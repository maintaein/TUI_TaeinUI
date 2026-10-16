import {
  forwardRef,
  useCallback,
  useRef,
  useLayoutEffect,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type KeyboardEvent,
} from 'react';
import type { InputHTMLAttributes } from 'react';
import { flushSync } from 'react-dom';
import { clsx } from 'clsx';
import { gsap } from 'gsap';
import * as styles from './NumericSpinner.css';
import { Glyph } from '../../_internal/glyph';
import { FormField } from '../../_internal/formField';
import { gateMotion } from '../../hooks/gateMotion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { gsapEasing, gsapDuration } from '../../tokens/gsapEasing';

// 사용자 관문 3(M5 task-29): "numericspinner의 +, - , 숫자 클릭효과가 좀 더 bubble이나
// bouncy했으면 좋겠어. 지금은 좀 부자연스러워보이네." 눌림은 깊게 들어가고, 뗄 때
// 1을 넘게 부풀었다 부드럽게 내려앉는 두 상이다. 넘침은 "이동거리 x 정점"이 보여야
// 한다. 버튼 40px 기준 부풂 1.06이면 한쪽 1.2px(폭 2.4px)가 넘치고, 숫자 글자 14px
// 안팎은 같은 6%면 한쪽 0.4px라 안 보여서 1.12로 올려 한쪽 약 0.8px를 만든다. 이전
// 뗌은 넘침 0이었다. 숫자 칸은 버튼과 같은 깊이면 8%가 거의 안 보여 더 깊게 누른다.

/** 눌림 1단계(누르는 순간) 깊이: 버튼. */
const PRESS_SCALE_BUTTON = 0.9;
/** 눌림 1단계 깊이: 숫자 칸. */
const PRESS_SCALE_INPUT = 0.82;
/** 눌림 2단계(길게 누르는 동안) 깊이: 버튼. */
const PRESS_SCALE_DEEP_BUTTON = 0.86;
/** 눌림 2단계 깊이: 숫자 칸. */
const PRESS_SCALE_DEEP_INPUT = 0.76;
/** 뗄 때 1을 넘어 부푸는 정점: 버튼. */
const RELEASE_SWELL_BUTTON = 1.06;
/** 뗄 때 부푸는 정점: 숫자 칸. */
const RELEASE_SWELL_INPUT = 1.12;

/** 이 시간 안에 떼면 반복 없이 한 걸음만 간다. */
const REPEAT_DELAY_MS = 400;
/** 반복이 막 시작할 때의 간격(ms). */
const REPEAT_INTERVAL_START_MS = 160;
/** 반복 간격이 수렴하는 하한(ms). */
const REPEAT_INTERVAL_MIN_MS = 40;
/**
 * 간격이 160→40ms로 좁혀지는 데 걸리는 시간(ms). 채널 A(눌림 깊이) 2단계의
 * duration으로도 그대로 쓴다.
 *
 * 토큰이 아니라 리터럴인 이유(Risk 7 사전 승인 예외 — 이 저장소의
 * animationBoundary 스캐너는 .css.ts 선언과 JSX 인라인 style만 보고 GSAP
 * 호출 인자는 안 봐서 테스트로는 안 걸리지만, 리뷰 컨벤션상 근거를 남긴다):
 * 이 값은 "손가락이 눌려 있던 시간"이라는 입력 타이밍 자체에서 나온 값이지,
 * duration 토큰 스케일이 나타내는 "이 모션이 얼마나 걸려야 자연스러운가"와는
 * 다른 축이다. 토큰에 억지로 맞추면 가속이 반복 속도를 그대로 반영한다는
 * 연결이 끊긴다.
 */
const REPEAT_RAMP_MS = 1200;

/** 숫자가 자리를 잡기 전 미리 밀려나 있는 거리(px). */
const NUDGE_PX = 4;
/**
 * 넛지 duration의 바닥(ms) — 간격이 아무리 좁아져도 이 아래로는 안 줄인다.
 * 이 값도 REPEAT_RAMP_MS와 같은 이유로 토큰이 아니라 리터럴이다: 넛지
 * duration은 "지금 반복 간격"에서 그대로 유도되는 값이라(아래 runTick의
 * nudgeDuration 계산 참고), duration 토큰 스케일과는 다른 축이다.
 */
const NUDGE_MIN_MS = 60;

/**
 * 채널 A(눌림 깊이)를 거는 대상. 누른 버튼과 숫자 칸을 한 트윈에 담아 시간·커브가
 * 같고 뗄 때도 함께 돌아오게 한다(사용자 관문, M5 task-29). 숫자 칸의 넛지(채널 B)는
 * y만 쓰고 GSAP이 scale과 y를 한 transform에 따로 가진다. 버튼이 항상 첫 대상이다.
 */
const pressTargets = (
  button: HTMLButtonElement,
  input: HTMLInputElement | null
): HTMLElement[] => (input ? [button, input] : [button]);

/** 대상마다 다른 scale을 주는 GSAP 함수형 값. 0번 대상이 버튼, 그다음이 숫자 칸이다. */
const scaleFor =
  (buttonValue: number, inputValue: number) => (index: number) =>
    index === 0 ? buttonValue : inputValue;

/** 버튼 하나(증가 또는 감소)의 길게 누르기 상태. */
interface HoldState {
  isHolding: boolean;
  /** true면 뒤이어 오는 네이티브 click(또는 keyup의 수동 tap)을 무시한다 —
   * 반복이 이미 그 몫을 다 했기 때문이다. */
  suppressClick: boolean;
  hasTicked: boolean;
  /** 자기 정지(위험 5-가) 판단용 — 직전 tick 시점의 값. */
  lastValue: number;
  /**
   * 이 버튼이 혼자 눌렸을 때 시작해 숫자 칸의 눌림 트윈(채널 A)을 쥐고 있다. 다른
   * 버튼이 눌려 있는 채로 이 버튼이 떼어지면 숫자 칸은 놓지 않고 이어 간다.
   */
  drivesInput: boolean;
  /** 반복이 실제로 시작된 시각(ms). REPEAT_DELAY_MS가 지난 시점이지 pointerdown 시각이 아니다. */
  repeatStartTime: number;
  delayTimer: ReturnType<typeof setTimeout> | null;
  tickTimer: ReturnType<typeof setTimeout> | null;
}

const createHoldState = (): HoldState => ({
  isHolding: false,
  suppressClick: false,
  hasTicked: false,
  lastValue: 0,
  drivesInput: false,
  repeatStartTime: 0,
  delayTimer: null,
  tickTimer: null,
});

interface HoldContext {
  hold: HoldState;
  buttonRef: { current: HTMLButtonElement | null };
  direction: 'increment' | 'decrement';
}

/**
 * 채널 A(눌림 깊이) 타임라인/트윈을 테스트가 읽을 수 있는 통로. 공개
 * prop/state로 내보내지 않고 버튼 DOM 노드에 얹는다 — Snackbar.tsx의
 * CountdownTweenHost와 같은 패턴.
 */
interface PressTweenHost extends HTMLButtonElement {
  __pressTween?: gsap.core.Tween | gsap.core.Timeline;
}

/**
 * 채널 B(숫자 넛지) 트윈과, 두 버튼이 함께 눌린 채 숫자 칸의 눌림을 쥔 버튼이 먼저
 * 떼어졌을 때 숫자 칸의 눌림을 이어 가는 트윈을 테스트가 읽을 수 있는 통로.
 */
interface InputNudgeHost extends HTMLInputElement {
  __nudgeTween?: gsap.core.Tween;
  __inputPressTween?: gsap.core.Tween;
}

/** 수의 소수 자릿수. 0.1 + 0.2 같은 부동소수 오차를 자르는 데 쓴다. */
const decimalsOf = (n: number): number => {
  const [mantissa, exponent] = String(n).split('e');
  return Math.max(
    0,
    (mantissa.split('.')[1]?.length ?? 0) - Number(exponent ?? 0)
  );
};

/** 증감 버튼이 있는 숫자 입력 컴포넌트. 제어/비제어 모드 지원 */
export interface NumericSpinnerProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'size' | 'type' | 'readOnly' | 'defaultValue' | 'onChange'
> {
  /** 레이블 텍스트 */
  label: string;

  // 제어 모드
  /** 제어 모드: 현재 값 */
  value?: number;
  /** 제어 모드: 값 변경 핸들러 */
  onChange?: (value: number) => void;

  // 비제어 모드
  /** 비제어 모드: 초기값 */
  defaultValue?: number;

  // 공통 props
  /** Input size */
  size?: 'sm' | 'md' | 'lg';
  /** 최소값 */
  min?: number;
  /** 최대값 */
  max?: number;
  /** 증감 단위 */
  step?: number;
  /** 에러 상태 */
  error?: boolean;
  /** 에러 메시지 */
  errorMessage?: string;
  /** 도움말 텍스트 */
  helperText?: string;
  /** 전체 너비 사용 */
  fullWidth?: boolean;
}

export const NumericSpinner = forwardRef<HTMLInputElement, NumericSpinnerProps>(
  (
    {
      label,
      value: controlledValue,
      defaultValue,
      onChange,
      size = 'md',
      min,
      max,
      step = 1,
      error = false,
      errorMessage,
      helperText,
      fullWidth = false,
      required = false,
      disabled = false,
      className,
      onBlur,
      onKeyDown,
      ...rest
    },
    ref
  ) => {
    // 비제어 모드용 내부 상태
    const [uncontrolledValue, setUncontrolledValue] = useState<number>(
      defaultValue ?? 0
    );

    // 제어/비제어 판단
    const isControlled = controlledValue !== undefined;
    const currentValue = isControlled
      ? Number(controlledValue)
      : uncontrolledValue;

    const reduced = useReducedMotion();

    // input ref — 외부로 forward하는 동시에 채널 B(넛지) 트윈의 대상으로도 쓴다.
    const inputRef = useRef<HTMLInputElement | null>(null);
    const setInputRef = useCallback(
      (el: HTMLInputElement | null) => {
        inputRef.current = el;
        if (typeof ref === 'function') {
          ref(el);
        } else if (ref) {
          ref.current = el;
        }
      },
      [ref]
    );

    // 개발 환경에서 검증
    if (process.env.NODE_ENV === 'development') {
      if (!label) {
        console.error(
          'NumericSpinner: label prop은 필수입니다. 접근성을 위해 label을 제공하세요.'
        );
      }
      if (controlledValue !== undefined && defaultValue !== undefined) {
        console.warn(
          'NumericSpinner: value와 defaultValue를 동시에 사용할 수 없습니다. ' +
            '제어 컴포넌트는 value를, 비제어 컴포넌트는 defaultValue를 사용하세요.'
        );
      }
    }

    // 입력 중인 글자. null이면 입력 중이 아니라 currentValue를 그대로 보여 준다.
    // 입력 중에는 빈칸이나 범위 밖 숫자를 잠시 둘 수 있고, 확정은 blur와 Enter다.
    const [draft, setDraft] = useState<string | null>(null);

    const draftNumber =
      draft === null || draft.trim() === '' ? NaN : Number(draft);

    // 입력 중에 disabled가 켜지면 친 글자를 버린다. 브라우저는 포커스된 칸이
    // 비활성이 될 때 blur를 안 쏘므로, 안 비우면 다시 켜졌을 때 낡은 글자가 남는다.
    const [prevDisabled, setPrevDisabled] = useState(disabled);
    if (disabled !== prevDisabled) {
      setPrevDisabled(disabled);
      if (disabled) setDraft(null);
    }

    // 입력 중인 글자가 숫자면 그것, 아니면 확정 값. 증감의 기준이자 버튼 비활성의 기준이다.
    const effectiveValue = Number.isFinite(draftNumber)
      ? draftNumber
      : currentValue;

    // 값이 바뀌는 길은 모두 여기 하나다: 증감 버튼·화살표 키·직접 입력 확정.
    const commit = useCallback(
      (next: number) => {
        let clamped = next;
        if (min !== undefined) clamped = Math.max(clamped, min);
        if (max !== undefined) clamped = Math.min(clamped, max);
        if (clamped === currentValue) return;

        if (!isControlled) {
          setUncontrolledValue(clamped);
        }
        onChange?.(clamped);
      },
      [min, max, currentValue, isControlled, onChange]
    );

    // 입력 중인 글자를 숫자로 확정한다. 비었거나 숫자가 아니면 직전 값으로 돌아간다.
    const commitDraft = useCallback(() => {
      if (draft === null) return;
      setDraft(null);
      if (Number.isFinite(draftNumber)) commit(draftNumber);
    }, [draft, draftNumber, commit]);

    // 한 단계 증감. 입력 중이면 친 글자를 기준으로 삼는다.
    const stepBy = useCallback(
      (direction: 1 | -1) => {
        if (disabled) return;
        const base = effectiveValue;
        setDraft(null);
        // step 격자 밖 값(0.25 + 0.1 등)을 깎지 않도록 step과 지금 값 중 긴 자릿수로 맞춘다.
        const digits = Math.max(decimalsOf(step), decimalsOf(base));
        commit(Number((base + direction * step).toFixed(digits)));
      },
      [disabled, effectiveValue, step, commit]
    );

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
      setDraft(e.target.value);
    };

    const handleInputBlur = (e: FocusEvent<HTMLInputElement>) => {
      commitDraft();
      onBlur?.(e);
    };

    const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      onKeyDown?.(e);
      if (e.defaultPrevented) return;
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        stepBy(e.key === 'ArrowUp' ? 1 : -1);
      } else if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
        commitDraft();
      }
    };

    // 증가 버튼 비활성화 여부
    const isIncrementDisabled =
      disabled || (max !== undefined && effectiveValue >= max);

    // 감소 버튼 비활성화 여부
    const isDecrementDisabled =
      disabled || (min !== undefined && effectiveValue <= min);

    // 길게 누르기 타이머(setTimeout 산술, Ruling 34)의 콜백은 수백 ms 뒤에도
    // 계속 살아있어 매 렌더마다 새로 만들어지는 클로저를 그대로 캡처하면 낡은
    // 값을 본다 — Snackbar의 onCloseRef·Slider의 currentValueRef와 같은
    // "항상 최신" ref 패턴을 그대로 쓴다.
    const reducedRef = useRef(reduced);
    const disabledRef = useRef(disabled);
    const isIncrementDisabledRef = useRef(isIncrementDisabled);
    const isDecrementDisabledRef = useRef(isDecrementDisabled);
    const currentValueRef = useRef(currentValue);
    const stepByRef = useRef(stepBy);

    useLayoutEffect(() => {
      reducedRef.current = reduced;
      disabledRef.current = disabled;
      isIncrementDisabledRef.current = isIncrementDisabled;
      isDecrementDisabledRef.current = isDecrementDisabled;
      currentValueRef.current = currentValue;
      stepByRef.current = stepBy;
    });

    const decrementButtonRef = useRef<HTMLButtonElement | null>(null);
    const incrementButtonRef = useRef<HTMLButtonElement | null>(null);

    // 렌더 중 ref의 `.current`를 읽거나 쓰면 안 되므로(react-hooks/refs) 한 번만
    // 만드는 안정된 객체를 useState의 지연 초기화자로 얻는다 — setter는 쓰지 않는다.
    const [decrementCtx] = useState<HoldContext>(() => ({
      hold: createHoldState(),
      buttonRef: decrementButtonRef,
      direction: 'decrement',
    }));
    const [incrementCtx] = useState<HoldContext>(() => ({
      hold: createHoldState(),
      buttonRef: incrementButtonRef,
      direction: 'increment',
    }));

    // 채널 A(눌림 깊이) — 뗄 때 "현재 위치에서" 1로 돌아온다. 타이머만 멈추고
    // 새 릴리즈 트윈은 시작하지 않는다(예전 clickPulse의 결함: 중간에 멈출 수
    // 없는 1회성이었다).
    // 숫자 칸의 눌림은 두 버튼이 합쳐서 정한다: 어느 한쪽이라도 눌려 있으면 눌림을
    // 유지하고, 마지막 버튼을 뗄 때만 부풀었다 내려앉는다. 그래서 다른 버튼이 눌려
    // 있으면 이 버튼의 뗌은 버튼만 대상으로 삼는다.
    const stopHold = useCallback(
      (ctx: HoldContext) => {
        const { hold, buttonRef } = ctx;
        if (hold.delayTimer) {
          clearTimeout(hold.delayTimer);
          hold.delayTimer = null;
        }
        if (hold.tickTimer) {
          clearTimeout(hold.tickTimer);
          hold.tickTimer = null;
        }
        if (!hold.isHolding) return;
        hold.isHolding = false;
        const otherHolding = (
          ctx === incrementCtx ? decrementCtx : incrementCtx
        ).hold.isHolding;
        const drivesInput = hold.drivesInput;
        hold.drivesInput = false;
        const input = inputRef.current as InputNudgeHost | null;

        const button = buttonRef.current;
        if (button) {
          // 누름 타임라인을 먼저 죽인다. 1단계 도중에 떼면 overwrite: 'auto'는 돌고 있던
          // 1단계만 죽이고, 아직 시작 안 한 2단계는 살아남아 나중에 릴리즈를 덮고
          // 깊은 값으로 간다(빨리 누르면 크기가 남던 결함). 뗌은 지금 자리에서 부풀어
          // 1로 내려앉는 타임라인 하나다.
          (button as PressTweenHost).__pressTween?.kill();
          if (otherHolding) {
            // 이 버튼의 누름 타임라인이 쥐고 있던 숫자 칸의 눌림은 죽으면서 멈춘다.
            // 눌림 깊이로 마저 이어 가는 트윈 하나가 이어받는다.
            if (drivesInput && input) {
              input.__inputPressTween = gateMotion(reducedRef.current, () =>
                gsap.to(input, {
                  scale: PRESS_SCALE_DEEP_INPUT,
                  duration: REPEAT_RAMP_MS / 1000,
                  ease: gsapEasing.drift,
                  overwrite: 'auto',
                })
              );
            }
          } else {
            input?.__inputPressTween?.kill();
          }
          const tween = gateMotion(reducedRef.current, () => {
            const targets = pressTargets(
              button,
              otherHolding ? null : inputRef.current
            );
            const tl = gsap.timeline({ defaults: { overwrite: 'auto' } });
            tl.to(targets, {
              scale: scaleFor(RELEASE_SWELL_BUTTON, RELEASE_SWELL_INPUT),
              duration: gsapDuration.fast,
              ease: gsapEasing.settle,
            });
            tl.to(targets, {
              scale: 1,
              duration: gsapDuration.slow,
              ease: gsapEasing.drift,
            });
            return tl;
          });
          (button as PressTweenHost).__pressTween = tween;
        }
      },
      [incrementCtx, decrementCtx]
    );

    // pointercancel/pointerleave/blur — 뒤이은 click이 없으니 suppressClick도
    // 같이 지운다(다음 정상 탭이 잘못 씹히지 않게).
    const cancelHold = useCallback(
      (ctx: HoldContext) => {
        stopHold(ctx);
        ctx.hold.suppressClick = false;
      },
      [stopHold]
    );

    // runTick은 자기 자신을 다음 tick의 setTimeout으로 예약한다(재귀). useCallback
    // 본문 안에서 `runTick` 식별자를 직접 참조하면 "선언되기 전에 접근"이 되어
    // react-hooks 린트가 막는다 — ref 한 단계를 거쳐 참조를 늦춘다.
    const runTickRef = useRef<((ctx: HoldContext) => void) | null>(null);

    const runTick = useCallback(
      (ctx: HoldContext) => {
        const { hold, direction } = ctx;
        const isDisabled =
          direction === 'increment'
            ? isIncrementDisabledRef.current
            : isDecrementDisabledRef.current;

        // 위험 5-나: disabled 버튼은 pointer 이벤트를 더 이상 안 쏜다 —
        // pointerup이 영영 안 올 수 있으니 매 tick 스스로 확인한다.
        if (disabledRef.current || isDisabled) {
          stopHold(ctx);
          return;
        }

        // 위험 5-가: 직전 호출이 값을 못 바꿨다면(제어 모드에서 부모가 값을
        // 갱신하지 않는 경우 등) 더 불러도 의미가 없다 — 스스로 멈춘다.
        if (hold.hasTicked && currentValueRef.current === hold.lastValue) {
          stopHold(ctx);
          return;
        }

        hold.lastValue = currentValueRef.current;
        hold.hasTicked = true;

        // 다음 tick이 currentValueRef를 볼 때 이번 호출의 결과가 이미
        // 반영돼 있어야 한다 — setTimeout 체인이 한 매크로태스크(또는 가짜
        // 타이머의 한 번의 advance) 안에서 연달아 도는 경우 React의 자동
        // batching 탓에 커밋이 다음 tick 전까지 미뤄질 수 있고, 그러면
        // "값이 안 바뀌었다"고 잘못 판단해 위험 5-가 가드가 오발동한다.
        flushSync(() => {
          stepByRef.current(direction === 'increment' ? 1 : -1);
        });

        const heldMs = Date.now() - hold.repeatStartTime;
        const interval =
          REPEAT_INTERVAL_START_MS -
          (REPEAT_INTERVAL_START_MS - REPEAT_INTERVAL_MIN_MS) *
            Math.min(1, heldMs / REPEAT_RAMP_MS);

        // 채널 B(숫자 넛지) — increment는 -NUDGE_PX→0, decrement는 +NUDGE_PX→0.
        const input = inputRef.current;
        if (input) {
          const fromY = direction === 'increment' ? -NUDGE_PX : NUDGE_PX;
          // duration은 "지금 반복 간격"에 비례한다(바닥 NUDGE_MIN_MS). 간격이
          // 좁아질수록 넛지끼리 겹쳐서 숫자가 제자리에서 떠는 것처럼 보이는데,
          // 이건 버그가 아니라 의도된 연출이다 — 가속이 몸으로 읽히는 지점.
          const nudgeDuration = Math.max(interval * 0.8, NUDGE_MIN_MS) / 1000;
          const tween = gateMotion(reducedRef.current, () =>
            gsap.fromTo(
              input,
              { y: fromY },
              {
                y: 0,
                duration: nudgeDuration,
                ease: gsapEasing.settle,
                overwrite: 'auto',
              }
            )
          );
          (input as InputNudgeHost).__nudgeTween = tween;
        }

        hold.tickTimer = setTimeout(() => runTickRef.current?.(ctx), interval);
      },
      [stopHold]
    );
    // 렌더 중 ref 쓰기 금지(react-hooks/refs) — effect에서 동기화한다. runTick은
    // stopHold(안정)에만 의존해 사실상 마운트 시 한 번만 바뀌므로 다음 tick이
    // 예약되기 전(항상 effect 이후)에는 최신값이 준비돼 있다.
    useLayoutEffect(() => {
      runTickRef.current = runTick;
    }, [runTick]);

    const startHold = useCallback(
      (ctx: HoldContext) => {
        const { hold, buttonRef, direction } = ctx;
        const isDisabled =
          direction === 'increment'
            ? isIncrementDisabledRef.current
            : isDecrementDisabledRef.current;
        if (disabledRef.current || isDisabled) return;
        // 이미 누르고 있다 — OS 키 반복 등으로 중복 시작하지 않는다.
        if (hold.isHolding) return;

        hold.isHolding = true;
        hold.suppressClick = false;
        hold.hasTicked = false;
        // 다른 버튼이 이미 눌려 있으면 숫자 칸의 눌림은 그쪽(또는 이어받은 트윈)이 쥐고
        // 있다. 이 버튼은 자기 버튼만 누른다.
        const otherHolding = (
          ctx === incrementCtx ? decrementCtx : incrementCtx
        ).hold.isHolding;
        hold.drivesInput = !otherHolding;
        // 반대 버튼의 뗌 타임라인이 아직 돌면 그 2단계가 나중에 시작하며 이번 눌림을
        // 덮어 숫자를 1로 돌려놓는다. 타임라인에 차례로 넣은 트윈은 overwrite: 'auto'가
        // 못 죽이므로 숫자 칸의 scale만 직접 걷어낸다(그쪽 버튼의 뗌은 그대로 간다).
        if (!otherHolding && inputRef.current) {
          gsap.killTweensOf(inputRef.current, 'scale');
        }

        const button = buttonRef.current;
        if (button) {
          // 남아 있는 릴리즈 트윈과 누름 타임라인을 정리하고 시작한다(stopHold와 같은 이유).
          (button as PressTweenHost).__pressTween?.kill();
          const tween = gateMotion(reducedRef.current, () => {
            const targets = pressTargets(
              button,
              otherHolding ? null : inputRef.current
            );
            const tl = gsap.timeline({ defaults: { overwrite: 'auto' } });
            tl.to(targets, {
              scale: scaleFor(PRESS_SCALE_BUTTON, PRESS_SCALE_INPUT),
              duration: gsapDuration.fast,
              ease: gsapEasing.settle,
            });
            tl.to(targets, {
              scale: scaleFor(PRESS_SCALE_DEEP_BUTTON, PRESS_SCALE_DEEP_INPUT),
              duration: REPEAT_RAMP_MS / 1000,
              ease: gsapEasing.drift,
            });
            return tl;
          });
          (button as PressTweenHost).__pressTween = tween;
        }

        hold.delayTimer = setTimeout(() => {
          hold.repeatStartTime = Date.now();
          hold.suppressClick = true;
          runTick(ctx);
        }, REPEAT_DELAY_MS);
      },
      [runTick, incrementCtx, decrementCtx]
    );

    // 뒤이은 click(포인터) 또는 keyup의 수동 tap(키보드)을 해소한다 — 반복이
    // 이미 시작됐다면(suppressClick) 무시하고, 아니라면 한 걸음만 간다.
    const resolveTap = useCallback((ctx: HoldContext) => {
      if (ctx.hold.suppressClick) {
        ctx.hold.suppressClick = false;
        return;
      }
      stepByRef.current(ctx.direction === 'increment' ? 1 : -1);
    }, []);

    const makeKeyDownHandler = useCallback(
      (ctx: HoldContext) => (event: KeyboardEvent<HTMLButtonElement>) => {
        if (event.key !== ' ' && event.key !== 'Enter') return;
        event.preventDefault();
        // OS 키 반복이 매 tick마다 새 keydown을 쏘는 걸 무시한다 — 우리 자체
        // 반복 루프만 소스로 삼는다.
        if (event.repeat) return;
        startHold(ctx);
      },
      [startHold]
    );

    const makeKeyUpHandler = useCallback(
      (ctx: HoldContext) => (event: KeyboardEvent<HTMLButtonElement>) => {
        if (event.key !== ' ' && event.key !== 'Enter') return;
        event.preventDefault();
        stopHold(ctx);
        // 키보드는 keydown에서 preventDefault했으므로 네이티브 click이 안
        // 온다 — 여기서 직접 tap을 해소한다.
        resolveTap(ctx);
      },
      [stopHold, resolveTap]
    );

    // 언마운트 시 타이머를 모두 지우고 트윈을 죽인다(위험 5-다). 새 릴리즈
    // 트윈을 시작할 필요는 없다 — 어차피 사라질 노드다. 진행 중인 트윈은
    // HoldState가 아니라 DOM 노드에 얹혀 있으므로(__pressTween·__nudgeTween,
    // 테스트 통로와 같은 자리) 거기서 직접 죽인다.
    useLayoutEffect(() => {
      return () => {
        for (const ctx of [decrementCtx, incrementCtx]) {
          const { hold, buttonRef } = ctx;
          if (hold.delayTimer) clearTimeout(hold.delayTimer);
          if (hold.tickTimer) clearTimeout(hold.tickTimer);
          (buttonRef.current as PressTweenHost | null)?.__pressTween?.kill();
        }
        (inputRef.current as InputNudgeHost | null)?.__nudgeTween?.kill();
        (inputRef.current as InputNudgeHost | null)?.__inputPressTween?.kill();
      };
    }, [decrementCtx, incrementCtx]);

    return (
      <FormField
        label={label}
        helperText={helperText}
        error={error}
        errorMessage={errorMessage}
        required={required}
        fullWidth={fullWidth}
      >
        {({ inputId, helperId, hasHelper, isError }) => (
          <div className={clsx(styles.inputContainer, styles.size[size])}>
            {/* Decrement Button */}
            <button
              ref={decrementButtonRef}
              type="button"
              aria-label="값 감소"
              disabled={isDecrementDisabled}
              onClick={() => resolveTap(decrementCtx)}
              onPointerDown={() => startHold(decrementCtx)}
              onPointerUp={() => stopHold(decrementCtx)}
              onPointerCancel={() => cancelHold(decrementCtx)}
              onPointerLeave={() => cancelHold(decrementCtx)}
              onBlur={() => cancelHold(decrementCtx)}
              onKeyDown={makeKeyDownHandler(decrementCtx)}
              onKeyUp={makeKeyUpHandler(decrementCtx)}
              className={clsx(
                styles.button,
                styles.decrementButton,
                styles.buttonSize[size]
              )}
            >
              <Glyph name="minus" size="sm" />
            </button>

            {/* Number Input. 상자는 테두리·면을 갖고 움직이지 않는다. 눌리는 건 <input>뿐이다. */}
            <span className={clsx(styles.inputBox, isError && styles.error)}>
              <input
                ref={setInputRef}
                id={inputId}
                type="number"
                min={min}
                max={max}
                step={step}
                value={draft ?? String(currentValue)}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                onKeyDown={handleInputKeyDown}
                required={required}
                disabled={disabled}
                aria-invalid={isError}
                aria-disabled={disabled}
                aria-describedby={hasHelper ? helperId : undefined}
                className={clsx(
                  styles.input,
                  styles.inputSize[size],
                  className
                )}
                {...rest}
              />
            </span>

            {/* Increment Button */}
            <button
              ref={incrementButtonRef}
              type="button"
              aria-label="값 증가"
              disabled={isIncrementDisabled}
              onClick={() => resolveTap(incrementCtx)}
              onPointerDown={() => startHold(incrementCtx)}
              onPointerUp={() => stopHold(incrementCtx)}
              onPointerCancel={() => cancelHold(incrementCtx)}
              onPointerLeave={() => cancelHold(incrementCtx)}
              onBlur={() => cancelHold(incrementCtx)}
              onKeyDown={makeKeyDownHandler(incrementCtx)}
              onKeyUp={makeKeyUpHandler(incrementCtx)}
              className={clsx(
                styles.button,
                styles.incrementButton,
                styles.buttonSize[size]
              )}
            >
              <Glyph name="plus" size="sm" />
            </button>
          </div>
        )}
      </FormField>
    );
  }
);

NumericSpinner.displayName = 'NumericSpinner';
