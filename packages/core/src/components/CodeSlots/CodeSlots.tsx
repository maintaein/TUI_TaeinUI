import {
  forwardRef,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type InputHTMLAttributes,
  type SyntheticEvent,
} from 'react';
import clsx from 'clsx';
import { gsap } from 'gsap';
import { FormField } from '../../_internal/formField';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { gateMotion } from '../../hooks/gateMotion';
import { gsapDuration, gsapEasing } from '../../tokens/gsapEasing';
import { themeContract } from '../../tokens/theme.css';
import * as styles from './CodeSlots.css';

export interface CodeSlotsProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  | 'value'
  | 'defaultValue'
  | 'onChange'
  | 'onSelect'
  | 'type'
  | 'size'
  | 'id'
  | 'style'
  | 'maxLength'
  | 'inputMode'
  | 'pattern'
  | 'autoComplete'
  | 'children'
> {
  /** 접근 가능한 이름이자 보이는 레이블 */
  label: string;
  /** 칸 수 @default 6 */
  length?: number;
  /** 값(제어). 숫자만 받는다 */
  value?: string;
  /** 시작 값(비제어) */
  defaultValue?: string;
  /** 값이 바뀔 때 숫자만 남긴 새 값을 받는다 */
  onChange?: (value: string) => void;
  /** length자가 다 찼을 때 그 값으로 불린다 */
  onComplete?: (value: string) => void;
  /** 도움말 텍스트 */
  helperText?: string;
  /** 오류 상태. 칸이 왼쪽부터 물결치고 테두리가 error 색이 된다 */
  error?: boolean;
  /** 오류 메시지 */
  errorMessage?: string;
  /** 성공 상태. 칸들이 하나의 알약으로 합쳐지고 테두리가 success 색이 된다. `error`가 함께 켜지면 error가 이긴다 */
  success?: boolean;
  /** 성공 메시지 */
  successMessage?: string;
}

interface Leaving {
  key: string;
  index: number;
  char: string;
}

// 칸 사이 물결 시차: duration 토큰 fast(150ms)의 0.3배(45ms). 토큰 스케일에 없는 사이 값이라 calc로 유도한다.
const waveDelay = (i: number) =>
  `calc(${themeContract.animation.duration.fast} * 0.3 * ${i})`;

/**
 * 오류가 걸릴 때마다 물결 클래스를 돌려준다(TextField의 useErrorShake와 같은 규칙). 처음부터 켜져 있으면 물결치지 않고,
 * 같은 클래스로는 CSS 애니메이션이 다시 돌지 않아 A와 B를 번갈아 건다. 상태는 렌더 중에 맞춘다(effect 안 setState는 lint가 막는다).
 */
const useWave = (error: boolean, errorMessage: string | undefined) => {
  const [prev, setPrev] = useState({ error, errorMessage });
  const [count, setCount] = useState(0);
  if (prev.error !== error || prev.errorMessage !== errorMessage) {
    setPrev({ error, errorMessage });
    if (error && (!prev.error || prev.errorMessage !== errorMessage)) {
      setCount(count + 1);
    }
  }
  if (!error || count === 0) return undefined;
  return count % 2 === 1 ? styles.wave.a : styles.wave.b;
};

/**
 * 칸에 들어온 숫자. 마운트될 때 위에서 굴러 내려와 자리에 앉으며 살짝 넘친다(`base`, `snap`).
 * CSS 키프레임이 아니라 GSAP인 이유: 데모 무대의 멈춤이 CSS 애니메이션을 처음 자세로 얼려 숫자가 칸 밖에 걸린다.
 * ponytail: 처음 그릴 때 이미 차 있는 값도 굴러 들어온다, 거슬리면 첫 렌더만 건너뛴다
 */
const RollDigit = ({ char, reduced }: { char: string; reduced: boolean }) => {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const tween = gateMotion(reduced, () =>
      gsap.fromTo(
        el,
        { yPercent: -100 },
        { yPercent: 0, duration: gsapDuration.base, ease: gsapEasing.snap }
      )
    );
    return () => {
      tween.kill();
    };
  }, [reduced]);
  return (
    <span ref={ref} className={styles.digit}>
      {char}
    </span>
  );
};

/** 지운 숫자의 복사본. 아래로 빠지고(`base`, `exit`) 끝나면 스스로를 치운다 */
const FallingDigit = ({
  id,
  char,
  reduced,
  onDone,
}: {
  id: string;
  char: string;
  reduced: boolean;
  onDone: (id: string) => void;
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  // 부모가 렌더마다 새 onDone을 줘도 트윈이 다시 시작하지 않게 최신 것만 쥔다
  const done = useRef(onDone);
  useLayoutEffect(() => {
    done.current = onDone;
  });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const tween = gateMotion(reduced, () =>
      gsap.to(el, {
        yPercent: 100,
        duration: gsapDuration.base,
        ease: gsapEasing.exit,
        onComplete: () => done.current(id),
      })
    );
    return () => {
      tween.kill();
    };
  }, [id, reduced]);
  return (
    <span ref={ref} className={styles.ghost}>
      {char}
    </span>
  );
};

// 커서가 끝이 아니거나 구간이 잡혀 있으면 끝으로 보낸다. 칸 하나하나 편집은 하지 않고 지우기는 끝에서부터다.
// ponytail: 전체 선택 뒤 덮어쓰기와 가운데 편집은 못 한다, 필요해지면 칸별 선택을 따로 만든다
const caretToEnd = (e: SyntheticEvent<HTMLInputElement>) => {
  const el = e.currentTarget;
  const end = el.value.length;
  if (el.selectionStart !== end || el.selectionEnd !== end) {
    el.setSelectionRange(end, end);
  }
};

/**
 * 인증번호·PIN 입력. 실제 입력은 칸 위에 투명하게 겹친 `<input>` 하나라 붙여넣기와 문자 자동 채움(one-time-code)이 된다.
 * 숫자가 들어오면 그 칸에서 슬롯처럼 굴러 들어오고(GSAP) 지우면 아래로 빠진다. `error`면 칸이 왼쪽부터 물결치고,
 * `success`면 칸들이 하나의 알약으로 합쳐진다. 움직임 줄이기에서는 숫자·색·간격만 바로 바뀐다.
 * 레이블·메시지·`aria-describedby`는 폼 계열 `FormField`가 맡는다.
 */
export const CodeSlots = forwardRef<HTMLInputElement, CodeSlotsProps>(
  (
    {
      label,
      length = 6,
      value: valueProp,
      defaultValue = '',
      onChange,
      onComplete,
      onPaste,
      helperText,
      error = false,
      errorMessage,
      success = false,
      successMessage,
      required = false,
      disabled = false,
      className,
      ...rest
    },
    ref
  ) => {
    const reduced = useReducedMotion();
    const clean = (raw: string) => raw.replace(/\D/g, '').slice(0, length);
    const [inner, setInner] = useState(() => clean(defaultValue));
    const current = clean(valueProp ?? inner);
    const wave = useWave(error, errorMessage);

    // 지워진 칸의 숫자는 복사본으로 남아 아래로 빠진다. 렌더 중에 이전 값과 비교해 만든다.
    const [track, setTrack] = useState({
      prev: current,
      seq: 0,
      leaving: [] as Leaving[],
    });
    if (track.prev !== current) {
      const gone = reduced
        ? []
        : [...track.prev.slice(current.length)].map((char, k) => ({
            key: `${track.seq}-${k}`,
            index: current.length + k,
            char,
          }));
      setTrack({
        prev: current,
        seq: track.seq + 1,
        leaving: [...track.leaving, ...gone],
      });
    }

    const drop = (key: string) =>
      setTrack((t) => ({
        ...t,
        leaving: t.leaving.filter((g) => g.key !== key),
      }));

    const commit = (next: string) => {
      // 숫자 아닌 글자만 들어왔거나 같은 값으로 잘리면 바뀐 것이 없다
      if (next === current) return;
      if (valueProp === undefined) setInner(next);
      onChange?.(next);
      if (next.length === length) onComplete?.(next);
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) =>
      commit(clean(e.target.value));

    // maxLength가 숫자 거르기보다 먼저 잘라 "123 456"이 5자가 되므로, 붙여넣기는 걸러서 직접 넣는다.
    // length자 이상이면 새 번호 한 벌이라 값 전체를 바꾸고(이어 붙이면 틀린 번호가 자동 제출된다),
    // 짧은 조각이면 현재 값 뒤에 붙인다(커서가 늘 끝이다)
    const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
      onPaste?.(e);
      if (e.defaultPrevented) return;
      e.preventDefault();
      const digits = e.clipboardData.getData('text').replace(/\D/g, '');
      commit(clean(digits.length >= length ? digits : current + digits));
    };

    const active = Math.min(current.length, length - 1);

    return (
      <FormField
        label={label}
        helperText={helperText}
        error={error}
        errorMessage={errorMessage}
        success={success}
        successMessage={successMessage}
        required={required}
        className={className}
      >
        {({ inputId, helperId, hasHelper, isError, isSuccess }) => (
          <div className={styles.group}>
            <input
              ref={ref}
              id={inputId}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d*"
              maxLength={length}
              required={required}
              disabled={disabled}
              aria-invalid={isError}
              aria-describedby={hasHelper ? helperId : undefined}
              className={styles.input}
              value={current}
              onChange={handleChange}
              onPaste={handlePaste}
              onSelect={caretToEnd}
              {...rest}
            />
            <div
              className={clsx(styles.cells, isSuccess && styles.merged)}
              aria-hidden="true"
            >
              {Array.from({ length }, (_, i) => (
                <span
                  key={i}
                  data-active={i === active}
                  className={clsx(
                    styles.cell,
                    isError && styles.cellError,
                    isSuccess && styles.cellSuccess,
                    disabled && styles.cellDisabled,
                    !reduced && wave
                  )}
                  style={
                    !reduced && wave
                      ? { animationDelay: waveDelay(i) }
                      : undefined
                  }
                >
                  {current[i] && (
                    <RollDigit
                      key={current[i]}
                      char={current[i]}
                      reduced={reduced}
                    />
                  )}
                  {track.leaving
                    .filter((g) => g.index === i)
                    .map((g) => (
                      <FallingDigit
                        key={g.key}
                        id={g.key}
                        char={g.char}
                        reduced={reduced}
                        onDone={drop}
                      />
                    ))}
                </span>
              ))}
            </div>
          </div>
        )}
      </FormField>
    );
  }
);

CodeSlots.displayName = 'CodeSlots';
