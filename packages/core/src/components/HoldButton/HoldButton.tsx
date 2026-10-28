import {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { gsap } from 'gsap';
import { Button } from '../Button';
import { Glyph } from '../../_internal/glyph';
import { visuallyHidden } from '../../_internal/visuallyHidden.css';
import { gsapDuration, gsapEasing } from '../../tokens/gsapEasing';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { gateMotion } from '../../hooks/gateMotion';
import { fill, slot, text, ink, check } from './HoldButton.css';

export interface HoldButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children' | 'type'
> {
  /** 단추 글자이자 평소 접근 가능한 이름 */
  children: ReactNode;
  // type은 받지 않는다: submit이면 무장 click부터 폼이 제출된다. 제출은 onConfirm에서 form.requestSubmit()으로
  /**
   * 실행 콜백. 홀드를 다 채웠을 때와 "두 번 눌러 확정"의 두 번째 click이 모두 이것을 부른다.
   * 네이티브 `onClick`은 실행을 뜻하지 않는다(손을 떼면 언제나 click이 생긴다)
   */
  onConfirm: () => void;
  /** 무장 상태 글자. 첫 click 뒤 단추 글자가 이것으로 바뀌고 보조기기에 알려진다 @default '한 번 더 누르면 실행' */
  confirmLabel?: string;
  /** 비활성화 상태 @default false */
  disabled?: boolean;
}

// 테스트가 현재 트윈을 읽는 손잡이(BurstToggle의 __burstDots와 같은 모양).
type FillHost = HTMLElement & {
  __holdTween?: gsap.core.Tween;
  __holdShake?: gsap.core.Timeline;
};
type CheckHost = HTMLElement & { __holdPop?: gsap.core.Tween };

// 홀드 시간. 공개하지 않고 고정한다. slower(500ms) x 3 = 1.5초는 오조작을 거르기에 길고(빠른 더블탭이
// 닿지 못한다) 기다리다 포기하기에는 짧은 값이다.
const HOLD_SECONDS = gsapDuration.slower * 3;
// 실행 뒤 처음 상태로 돌아오기까지. 체크와 완료 알림이 읽히도록 slower x 4 = 2초
const DONE_MS = gsapDuration.slower * 4 * 1000;
// 무장 때 채움이 멈추는 자리. 축소 모드의 4단계 경계(0.5)와 겹친다
const ARMED_AT = 0.5;
// 축소 모드에서 차오름을 끊어 보이는 단계 수
const REDUCED_STEPS = 4;
// 떨림은 홀드의 마지막 30%에서 돈다. 좌우로 번갈아 진폭이 1에서 2px까지 커지고 마지막에 0으로 돌아온다.
const SHAKE_FROM = 0.7;
const SHAKE_X = [1, -1.2, 1.4, -1.6, 1.8, -2, 0];
const DONE_TEXT = '실행했습니다';

type Phase = 'idle' | 'armed' | 'done';

// 채움(scaleX)과 흰 글자 겹의 자르기(--hold-v)는 같은 값을 쓴다. 축소 모드에서는 네 단계로 끊는다.
const paint = (
  fillEl: HTMLElement,
  inkEl: HTMLElement | null,
  p: number,
  reduced: boolean
) => {
  const value = reduced ? Math.ceil(p * REDUCED_STEPS) / REDUCED_STEPS : p;
  fillEl.style.transform = `scaleX(${value})`;
  inkEl?.style.setProperty('--hold-v', String(value));
};

/**
 * 삭제·결제처럼 되돌릴 수 없는 일을 실수로 하지 않게 하는 단추. 꾹 누르면 안쪽이 왼쪽부터 차오르고
 * (끝 30%는 미세하게 떨린다) 다 차면 튕기며 체크가 나타나고 `onConfirm`이 불린다. 중간에 떼면 물 빠지듯
 * 되감긴다. 시간에 묶이지 않는 길도 있다: 짧게 누르거나 보조기기 click 한 번은 "무장"이 되어 글자가
 * `confirmLabel`로 바뀌고 채움이 절반에 멈추며, 이어서 다시 click하면 실행한다(무장에는 타이머가 없고
 * 포커스가 빠지면 풀린다). 움직임 줄이기에서도 누르는 시간은 같고, 차오름만 네 단계로 끊어 보이며
 * 떨림과 튕김이 없다. 네이티브 `onClick`은 실행을 뜻하지 않는다(손을 떼면 언제나 click이 생긴다).
 */
export const HoldButton = forwardRef<HTMLButtonElement, HoldButtonProps>(
  (
    {
      children,
      onConfirm,
      confirmLabel = '한 번 더 누르면 실행',
      disabled = false,
      className,
      onClick,
      onPointerDown,
      onPointerUp,
      onPointerLeave,
      onPointerCancel,
      onKeyDown,
      onKeyUp,
      onBlur,
      ...props
    },
    ref
  ) => {
    const reduced = useReducedMotion();
    const [phase, setPhase] = useState<Phase>('idle');
    const fillRef = useRef<FillHost>(null);
    const labelRef = useRef<HTMLSpanElement>(null);
    const inkRef = useRef<HTMLSpanElement>(null);
    const inkLabelRef = useRef<HTMLSpanElement>(null);
    const checkRef = useRef<CheckHost>(null);
    // 채움 값의 단일 출처. 시계 트윈도 되감기 트윈도 이 객체의 p를 몬다
    const proxy = useRef({ p: 0 });
    const tweenRef = useRef<gsap.core.Tween | null>(null);
    // 손이 누르고 있는 중. 상태가 아니라 ref인 이유: 그 사이 렌더가 없고, 바로 뒤에 오는 click이 읽는다
    const holdingRef = useRef(false);
    // 채움이 향하는 값(0 처음, 0.5 무장, 1 가득). 비워야 하는지 알려고 둔다
    const targetRef = useRef(0);
    // 홀드를 끝까지 채운 누름의 표지. 그 누름을 떼며 생기는 click을 시간과 무관하게 무시한다(처음 상태로 돌아온 뒤에 떼도
    // 무장으로 새지 않게). 다음 누름이 시작될 때 내린다.
    // 밖에서 떼어져 click이 안 오는 길은 pointercancel과 blur가 표지를 내린다. pointerleave는 안 된다(터치에서 click보다 먼저 와 누수가 되살아난다).
    // ponytail: 포인터가 단추 밖에서 떼어지고 포커스가 남으면 표지가 남아, 다음 보조기기 click 하나가 무시된다, 문제가 되면 pointerup을 문서에서 듣는다
    const completedRef = useRef(false);
    // 트윈 콜백이 오래된 클로저를 쥐고 있어도 최신 값을 읽도록 효과에서 맞춘다
    const reducedRef = useRef(reduced);
    const onConfirmRef = useRef(onConfirm);
    useEffect(() => {
      reducedRef.current = reduced;
      onConfirmRef.current = onConfirm;
    }, [reduced, onConfirm]);

    // 채움을 지금 값에서 target으로 보낸다(되감기와 무장). 도중 시계가 있으면 죽인다.
    const moveFill = useCallback((target: number) => {
      const el = fillRef.current;
      if (!el) return;
      tweenRef.current?.kill();
      targetRef.current = target;
      const isReduced = reducedRef.current;
      const tween = gateMotion(isReduced, () =>
        gsap.to(proxy.current, {
          p: target,
          duration: gsapDuration.base,
          ease: gsapEasing.settle,
          onUpdate: () => paint(el, inkRef.current, proxy.current.p, isReduced),
        })
      );
      tweenRef.current = tween;
      el.__holdTween = tween;
    }, []);

    const stopShake = useCallback(() => {
      fillRef.current?.__holdShake?.kill();
      // 흰 글자 겹도 같이 떨리므로 둘 다 제자리로
      gsap.set(
        [labelRef.current, inkLabelRef.current].filter(
          (node): node is HTMLSpanElement => node !== null
        ),
        { x: 0 }
      );
    }, []);

    // 실행. 홀드 완료와 두 번째 click이 같이 거친다
    const finish = () => {
      holdingRef.current = false;
      stopShake();
      setPhase('done');
      onConfirmRef.current();
    };

    const startHold = () => {
      const el = fillRef.current;
      const label = labelRef.current;
      const inkLabel = inkLabelRef.current;
      if (
        disabled ||
        phase !== 'idle' ||
        holdingRef.current ||
        !el ||
        !label ||
        !inkLabel
      ) {
        return;
      }
      holdingRef.current = true;
      targetRef.current = 1;
      tweenRef.current?.kill();
      proxy.current.p = 0;
      paint(el, inkRef.current, 0, reduced);
      // 이 트윈이 곧 홀드 시계다. gateMotion에 태우면 축소 모드에서 progress(1)로 즉시 실행되므로
      // 시계는 게이트를 거치지 않는다(gsapGateEnforcement 예외). 축소 모드는 그림만 단계로 끊는다.
      const clock = gsap.to(proxy.current, {
        p: 1,
        duration: HOLD_SECONDS,
        ease: gsapEasing.linear,
        onUpdate: () =>
          paint(el, inkRef.current, proxy.current.p, reducedRef.current),
        onComplete: () => {
          completedRef.current = true;
          finish();
        },
      });
      tweenRef.current = clock;
      el.__holdTween = clock;
      // 떨림은 시계와 분리된 장식이라 게이트를 거친다. 축소 모드에서는 끝 상태(x 0)로 확정돼 안 보인다.
      el.__holdShake = gateMotion(reduced, () => {
        const shake = gsap.timeline({ delay: HOLD_SECONDS * SHAKE_FROM });
        const step = (HOLD_SECONDS * (1 - SHAKE_FROM)) / SHAKE_X.length;
        SHAKE_X.forEach((x) =>
          shake.to([label, inkLabel], {
            x,
            duration: step,
            ease: gsapEasing.linear,
          })
        );
        return shake;
      });
    };

    // 손을 뗐을 때. 홀드 중이었으면 되감고 true를 돌려준다
    const endHold = () => {
      if (!holdingRef.current) return false;
      holdingRef.current = false;
      stopShake();
      moveFill(0);
      return true;
    };

    const arm = () => {
      setPhase('armed');
      moveFill(ARMED_AT);
    };

    const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      // 홀드가 이어지는 동안의 click은 Enter가 keydown에서 낸 것이다. keyup이 무장을 맡는다.
      if (
        event.defaultPrevented ||
        disabled ||
        holdingRef.current ||
        completedRef.current ||
        phase === 'done'
      ) {
        return;
      }
      if (phase === 'armed') {
        moveFill(1);
        finish();
        return;
      }
      arm();
    };

    const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
      onPointerDown?.(event);
      if (event.button > 0) return;
      completedRef.current = false;
      startHold();
    };

    const handleRelease =
      (user: ((event: PointerEvent<HTMLButtonElement>) => void) | undefined) =>
      (event: PointerEvent<HTMLButtonElement>) => {
        user?.(event);
        endHold();
      };

    const handlePointerCancel = (event: PointerEvent<HTMLButtonElement>) => {
      completedRef.current = false;
      handleRelease(onPointerCancel)(event);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
      onKeyDown?.(event);
      if (event.repeat || (event.key !== ' ' && event.key !== 'Enter')) return;
      completedRef.current = false;
      startHold();
    };

    const handleKeyUp = (event: KeyboardEvent<HTMLButtonElement>) => {
      onKeyUp?.(event);
      // Space의 click은 keyup 뒤에 오지만 Enter의 click은 이미 keydown에서 지나갔다. Enter는 여기서 무장한다.
      if (endHold() && event.key === 'Enter') arm();
    };

    const handleBlur = (event: FocusEvent<HTMLButtonElement>) => {
      onBlur?.(event);
      completedRef.current = false;
      endHold();
      if (phase === 'armed') {
        setPhase('idle');
        moveFill(0);
      }
    };

    // 홀드 도중 또는 무장 중에 disabled가 켜지면 거둔다. 네이티브 disabled 단추는 pointerup과 blur도 못 받아서
    // 그대로 두면 시계가 끝까지 돌아 잠긴 단추가 실행된다. 상태(무장)는 렌더 중에, 시계와 채움은 효과에서 맞춘다.
    const [wasDisabled, setWasDisabled] = useState(disabled);
    if (wasDisabled !== disabled) {
      setWasDisabled(disabled);
      if (disabled && phase === 'armed') setPhase('idle');
    }
    useEffect(() => {
      if (!disabled || phase === 'done') return;
      const wasHolding = holdingRef.current;
      holdingRef.current = false;
      stopShake();
      if (wasHolding || targetRef.current > 0) moveFill(0);
    }, [disabled, phase, moveFill, stopShake]);

    // 실행 뒤 잠시 있다가 처음 상태로 돌아온다. 무장에는 이런 타이머가 없다(시간 제한을 만들지 않는다).
    useEffect(() => {
      if (phase !== 'done') return;
      const timer = setTimeout(() => {
        setPhase('idle');
        moveFill(0);
      }, DONE_MS);
      return () => clearTimeout(timer);
    }, [phase, moveFill]);

    // 체크가 새로 설 때 spring으로 튕기며 나타난다. 축소 모드에서는 게이트가 끝 상태로 바로 확정한다.
    useLayoutEffect(() => {
      const el = checkRef.current;
      if (phase !== 'done' || !el) return;
      const pop = gateMotion(reduced, () =>
        gsap.fromTo(
          el,
          { scale: 0.5, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            duration: gsapDuration.slower,
            ease: gsapEasing.spring,
          }
        )
      );
      el.__holdPop = pop;
      return () => {
        pop.kill();
      };
    }, [phase, reduced]);

    useEffect(() => {
      const el = fillRef.current;
      return () => {
        tweenRef.current?.kill();
        el?.__holdShake?.kill();
      };
    }, []);

    const statusText =
      phase === 'armed' ? confirmLabel : phase === 'done' ? DONE_TEXT : '';

    return (
      <>
        <Button
          {...props}
          type="button"
          ref={ref}
          variant="light"
          className={className}
          disabled={disabled}
          aria-disabled={disabled || phase === 'done'}
          data-state={phase}
          onClick={handleClick}
          onPointerDown={handlePointerDown}
          onPointerUp={handleRelease(onPointerUp)}
          onPointerLeave={handleRelease(onPointerLeave)}
          onPointerCancel={handlePointerCancel}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          onBlur={handleBlur}
        >
          <span
            ref={fillRef}
            data-hold-fill=""
            aria-hidden="true"
            className={fill}
          />
          <span
            ref={labelRef}
            data-hold-label=""
            data-done={phase === 'done' ? '' : undefined}
            className={slot}
          >
            <span
              className={text}
              data-shown={phase !== 'armed' ? '' : undefined}
              aria-hidden={phase === 'armed'}
            >
              {children}
            </span>
            <span
              className={text}
              data-shown={phase === 'armed' ? '' : undefined}
              aria-hidden={phase !== 'armed'}
            >
              {confirmLabel}
            </span>
          </span>
          <span
            ref={inkRef}
            data-hold-ink=""
            aria-hidden="true"
            className={ink}
          >
            <span
              ref={inkLabelRef}
              data-done={phase === 'done' ? '' : undefined}
              className={slot}
            >
              <span
                className={text}
                data-shown={phase !== 'armed' ? '' : undefined}
              >
                {children}
              </span>
              <span
                className={text}
                data-shown={phase === 'armed' ? '' : undefined}
              >
                {confirmLabel}
              </span>
            </span>
          </span>
          {phase === 'done' && (
            <span
              ref={checkRef}
              data-hold-check=""
              aria-hidden="true"
              className={check}
            >
              <Glyph name="check" />
            </span>
          )}
        </Button>
        <span className={visuallyHidden} role="status" aria-live="polite">
          {statusText}
        </span>
      </>
    );
  }
);

HoldButton.displayName = 'HoldButton';
