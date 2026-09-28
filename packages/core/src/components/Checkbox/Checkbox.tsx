import { forwardRef, useId, useEffect, useRef, useState } from 'react';
import type { ChangeEvent, InputHTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { gsap } from 'gsap';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
import * as styles from './Checkbox.css';
import { gateMotion, settleMotion } from '../../hooks/gateMotion';
import { gsapDuration, gsapEasing } from '../../tokens/gsapEasing';
import { useReducedMotion } from '../../hooks/useReducedMotion';

gsap.registerPlugin(MorphSVGPlugin);

/** 체크 path. viewBox 0 0 24 24 기준. */
const CHECK_PATH = 'M5 13 L9 17 L19 7';
/** 대시 path. 같은 viewBox. */
const DASH_PATH = 'M5 12 L19 12';

/**
 * CHECK_PATH의 총 길이. 꺾인 선분 둘의 합이다:
 *   √((9-5)² + (17-13)²) = √32  = 5.6569
 *   √((19-9)² + (7-17)²) = √200 = 14.1421
 *                          합계 = 19.799
 * path를 수정하면 이 값을 다시 계산해라. jsdom에 getTotalLength가 없어
 * 런타임 측정으로는 검증할 수 없다(Ruling 38).
 */
const CHECK_LENGTH = 19.8;
/** DASH_PATH의 총 길이. 19 - 5 = 14. */
const DASH_LENGTH = 14;

/** 퇴장은 등장의 65% — 조항 3의 60~70% 창. useOverlayTransition.ts:19와 같은 값이다. */
const EXIT_RATIO = 0.65;

type MarkState = 'unchecked' | 'checked' | 'indeterminate';

const pathFor = (state: MarkState): string =>
  state === 'indeterminate' ? DASH_PATH : CHECK_PATH;
const lengthFor = (state: MarkState): number =>
  state === 'indeterminate' ? DASH_LENGTH : CHECK_LENGTH;

const resolveMarkState = (
  indeterminate: boolean,
  checked: boolean
): MarkState =>
  indeterminate ? 'indeterminate' : checked ? 'checked' : 'unchecked';

/**
 * 표식 트윈을 테스트가 읽을 수 있는 통로. `Snackbar.tsx`의 `CountdownTweenHost`와
 * 같은 패턴 — 공개 prop/state가 아니라 path DOM 노드에 얹는다. 테스트는 실제
 * GSAP 인스턴스를 그대로 받아 `progress()`/`reverse()`로 seek한다(무모킹).
 */
interface MarkTweenHost extends SVGPathElement {
  __markTween?: gsap.core.Tween;
}

/**
 * 트윈에 자가 종료를 붙인다(Ruling 41 — 유휴 상태에서 살아 있는 gsap 객체는
 * 0개). `reduced`면 `gateMotion`이 생성 시점에 이미 동기로 progress(1)+kill을
 * 끝냈으므로 핸들만 비운다. 아니면 자연 완료(onComplete) 때 kill하고 비운다.
 * `tween` 자기 자신을 생성 옵션 안에서 참조하면 TDZ에 걸린다(축소 선호일 때
 * `gateMotion`이 동기로 progress(1)을 걸어 onComplete가 대입 완료 전에 돈다) —
 * 그래서 `eventCallback`을 생성 이후에 따로 붙인다.
 */
const attachSelfKill = (
  tween: gsap.core.Tween,
  path: MarkTweenHost,
  reduced: boolean
): void => {
  if (reduced) {
    path.__markTween = undefined;
    return;
  }
  path.__markTween = tween;
  tween.eventCallback('onComplete', () => {
    tween.kill();
    path.__markTween = undefined;
  });
};

/**
 * 표식 상태 전이를 DOM에 반영한다. 마운트 직후 첫 호출(`ref.current === null`)은
 * JSX가 이미 그려 둔 시작 모양을 그대로 인정하고 상태만 기록한다 — 애니메이션도
 * DOM 쓰기도 하지 않는다(초기 페인트 번쩍임 없음, 위험 #4). 그 외에는 브리프
 * "상태와 전이" 표를 그대로 따른다. 사용자 토글(onChange)과 prop 변화(effect)가
 * 모두 이 함수를 거쳐 로직이 갈라지지 않는다.
 */
const syncMarkState = (
  path: MarkTweenHost,
  markStateRef: React.MutableRefObject<MarkState | null>,
  nextState: MarkState,
  reduced: boolean
): void => {
  const prev = markStateRef.current;

  if (prev === null) {
    markStateRef.current = nextState;
    return;
  }

  if (prev === nextState) {
    // 실제 상태 변화가 아니라 축소 선호만 바뀐 경우 — 진행 중인 트윈을 확정한다.
    if (reduced && path.__markTween) {
      settleMotion(path.__markTween);
      path.__markTween = undefined;
    }
    return;
  }

  path.__markTween?.kill();

  if (prev === 'unchecked') {
    // 등장: unchecked → checked | indeterminate
    const length = lengthFor(nextState);
    gsap.set(path, {
      attr: { d: pathFor(nextState) },
      strokeDasharray: length,
      strokeDashoffset: length,
    });
    const tween = gateMotion(reduced, () =>
      gsap.to(path, {
        strokeDashoffset: 0,
        duration: gsapDuration.slow,
        ease: gsapEasing.settle,
        overwrite: 'auto',
      })
    );
    attachSelfKill(tween, path, reduced);
  } else if (nextState === 'unchecked') {
    // 퇴장: checked | indeterminate → unchecked
    // d·strokeDasharray도 prev의 정준 모양으로 같이 트윈한다(Ruling 77) —
    // 모프 도중 끊기고 곧장 퇴장으로 넘어오면 d/dasharray가 중간값에 얼어
    // dashoffset과 안 맞아 조각이 남을 수 있어서다.
    const length = lengthFor(prev);
    const tween = gateMotion(reduced, () =>
      gsap.to(path, {
        morphSVG: pathFor(prev),
        strokeDasharray: length,
        strokeDashoffset: length,
        duration: gsapDuration.slow * EXIT_RATIO,
        ease: gsapEasing.exit,
        overwrite: 'auto',
      })
    );
    attachSelfKill(tween, path, reduced);
  } else {
    // 모양 변형: checked ↔ indeterminate. dashoffset은 0에 머문다.
    const tween = gateMotion(reduced, () =>
      gsap.to(path, {
        morphSVG: pathFor(nextState),
        strokeDasharray: lengthFor(nextState),
        duration: gsapDuration.base,
        ease: gsapEasing.settle,
        overwrite: 'auto',
      })
    );
    attachSelfKill(tween, path, reduced);
  }

  markStateRef.current = nextState;
};

/** 체크박스 입력 컴포넌트. 체크/미체크/부분선택(indeterminate) 상태 지원 */
export interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'size'
> {
  /** 체크박스 레이블 텍스트 */
  label: string;
  /** 체크박스 크기 @default 'md' */
  size?: 'sm' | 'md' | 'lg';
  /** 에러 상태 표시 @default false */
  error?: boolean;
  /** 에러 메시지 (error가 true일 때 표시) */
  errorMessage?: string;
  /** 도움말 텍스트 */
  helperText?: string;
  /** 부분 선택 상태 (전체 선택/해제 UI에서 사용) @default false */
  indeterminate?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      size = 'md',
      error = false,
      errorMessage,
      helperText,
      indeterminate = false,
      required = false,
      disabled = false,
      className,
      ...rest
    },
    ref
  ) => {
    const checkboxId = useId();
    const helperId = useId();
    const internalRef = useRef<HTMLInputElement>(null);
    const pathRef = useRef<MarkTweenHost | null>(null);
    const markStateRef = useRef<MarkState | null>(null);
    const reduced = useReducedMotion();

    // 개발 환경에서 label 검증
    if (process.env.NODE_ENV === 'development') {
      if (!label) {
        console.error(
          'Checkbox: label prop은 필수입니다. 접근성을 위해 label을 제공하세요.'
        );
      }
    }

    // indeterminate 상태 설정
    useEffect(() => {
      const checkboxElement =
        (ref as React.RefObject<HTMLInputElement>)?.current ||
        internalRef.current;
      if (checkboxElement) {
        checkboxElement.indeterminate = indeterminate;
      }
    }, [indeterminate, ref]);

    // 표식(체크/대시) 상태 반영 — 위 effect보다 반드시 뒤에 선언한다. DOM의
    // indeterminate는 React가 모르는 프로퍼티라 위 effect가 써 넣은 뒤에
    // 읽어야 최신값이다(위험 #5). 진실 원천은 DOM input이다.
    useEffect(() => {
      const checkboxElement =
        (ref as React.RefObject<HTMLInputElement>)?.current ||
        internalRef.current;
      const path = pathRef.current;
      if (!checkboxElement || !path) return;

      const nextState = resolveMarkState(
        checkboxElement.indeterminate,
        checkboxElement.checked
      );
      syncMarkState(path, markStateRef, nextState, reduced);
    }, [indeterminate, rest.checked, reduced, ref]);

    // 언마운트 시 살아 있는 트윈을 정리한다(Ruling 41). 정리 함수 안에서
    // `pathRef.current`를 다시 읽지 않는다 — React가 언마운트 커밋에서 ref를
    // 먼저 null로 비우고, 이 정리 함수는 그 뒤에 돈다(Snackbar.tsx의 `barEl`
    // 캡처와 같은 이유). 마운트 시점에 노드를 지역 변수로 캡처해 클로저로 쥔다.
    useEffect(() => {
      const path = pathRef.current;
      return () => {
        path?.__markTween?.kill();
      };
    }, []);

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      const path = pathRef.current;
      if (path) {
        const target = event.currentTarget;
        const nextState = resolveMarkState(
          target.indeterminate,
          target.checked
        );
        syncMarkState(path, markStateRef, nextState, reduced);
      }
      rest.onChange?.(event);
    };

    const showHelper = !error && helperText;
    const showError = error && errorMessage;

    // 첫 페인트 기준선 — 마운트 effect는 이 값을 그대로 인정하고 상태만
    // 기록하므로(위험 #4), 시작 모양은 여기 JSX가 직접 그린다. 최초 1회만
    // 계산하고 이후 렌더에서는 그대로 얼린다 — 매 렌더 다시 계산해 `d`에
    // 넘기면 React가 리렌더마다 GSAP이 써 둔 값을 지워 버린다(morphSVG가
    // 시작점으로 삼을 실제 DOM 값을 리렌더가 목표값으로 먼저 덮어써서,
    // 중간·종료 프레임이 모두 어긋나는 버그로 직접 확인했다).
    const [initialMark] = useState(() => {
      const initialChecked = Boolean(rest.checked ?? rest.defaultChecked);
      const initialMarkState = resolveMarkState(indeterminate, initialChecked);
      const initialShapeState =
        initialMarkState === 'unchecked' ? 'checked' : initialMarkState;
      const length = lengthFor(initialShapeState);
      return {
        d: pathFor(initialShapeState),
        dasharray: length,
        dashoffset: initialMarkState === 'unchecked' ? length : 0,
      };
    });

    return (
      <div className={styles.wrapper}>
        <label htmlFor={checkboxId} className={styles.checkboxLabel}>
          <div
            className={clsx(
              styles.checkboxContainer,
              styles.size[size],
              error && styles.error
            )}
          >
            <input
              ref={(element) => {
                internalRef.current = element;
                if (typeof ref === 'function') {
                  ref(element);
                } else if (ref) {
                  ref.current = element;
                }
              }}
              id={checkboxId}
              type="checkbox"
              required={required}
              disabled={disabled}
              aria-invalid={error}
              aria-disabled={disabled}
              aria-describedby={showHelper || showError ? helperId : undefined}
              className={clsx(
                styles.checkbox,
                styles.size[size],
                error && styles.error,
                className
              )}
              {...rest}
              onChange={handleChange}
            />
            <span
              className={clsx(
                styles.checkmark,
                styles.size[size],
                error && styles.error
              )}
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className={styles.markSvg}
              >
                <path
                  ref={pathRef}
                  className={styles.markPath}
                  d={initialMark.d}
                  style={{
                    strokeDasharray: initialMark.dasharray,
                    strokeDashoffset: initialMark.dashoffset,
                  }}
                />
              </svg>
            </span>
          </div>

          <span className={styles.labelText}>
            {label}
            {required && <span className={styles.required}>*</span>}
          </span>
        </label>

        {showHelper && (
          <span id={helperId} className={styles.helperText}>
            {helperText}
          </span>
        )}
        {showError && (
          <span id={helperId} className={styles.errorMessage}>
            {errorMessage}
          </span>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
