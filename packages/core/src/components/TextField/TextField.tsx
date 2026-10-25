import { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import type {
  ChangeEvent,
  InputHTMLAttributes,
  ReactElement,
  Ref,
  RefAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { clsx } from 'clsx';
import { FormField } from '../../_internal/formField';
import * as styles from './TextField.css';

/** 단일 줄과 여러 줄이 함께 받는 prop */
interface TextFieldBaseProps {
  /** 레이블 텍스트 */
  label: string;
  /** 크기 */
  size?: 'sm' | 'md' | 'lg';
  /** 에러 상태 */
  error?: boolean;
  /** 에러 메시지 */
  errorMessage?: string;
  /** 성공 상태. 테두리와 메시지가 초록이 된다. `error`가 함께 켜지면 에러가 이긴다 */
  success?: boolean;
  /** 성공 메시지. `success`일 때 도움말 자리에 보인다 */
  successMessage?: string;
  /** 도움말 텍스트 */
  helperText?: string;
  /** 전체 너비 사용 */
  fullWidth?: boolean;
}

/** 한 줄 텍스트 입력 (`input`). `rows`와 `autoResize`는 받지 않는다 */
interface SingleLineTextFieldProps
  extends
    TextFieldBaseProps,
    Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** 여러 줄 입력(`textarea`)으로 바꾼다. 기본값 `false` */
  multiline?: false;
  /** Input type */
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  rows?: never;
  autoResize?: never;
}

/** 여러 줄 텍스트 입력 (`textarea`). textarea 속성에 `type`이 없으므로 `type`을 줄 수 없다 */
interface MultilineTextFieldProps
  extends
    TextFieldBaseProps,
    Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  /** 여러 줄 입력(`textarea`)으로 바꾼다 */
  multiline: true;
  /** 보이는 줄 수 @default 4 */
  rows?: number;
  /** 내용에 맞춰 높이가 늘어난다 @default false */
  autoResize?: boolean;
}

/**
 * 텍스트 입력 컴포넌트. 레이블, 에러, 도움말 텍스트 내장. `multiline`이면 여러 줄.
 *
 * `multiline`은 `true`나 `false` 리터럴로 쓴다. 변수면 삼항으로 가르고, 감싸는
 * 컴포넌트의 props 타입은 `ComponentProps<typeof TextField>`로 받는다.
 * `multiline`을 바꾸면 다른 요소라 다시 마운트되어 포커스와 비제어 값이 사라진다.
 */
export type TextFieldProps = SingleLineTextFieldProps | MultilineTextFieldProps;

/**
 * 오류가 걸릴 때마다 흔들림 클래스를 돌려준다. 흔들리는 순간은 `error`가 꺼졌다 켜질 때와
 * `error`가 켜진 채 `errorMessage`가 바뀔 때뿐이다(처음부터 켜져 있으면 흔들리지 않는다).
 * 같은 클래스로는 CSS 애니메이션이 다시 돌지 않아서, 흔들릴 때마다 A와 B를 번갈아 건다.
 * 상태는 렌더 중에 맞춘다(effect 안 setState는 연쇄 렌더라 lint가 막는다).
 */
const useErrorShake = (error: boolean, errorMessage: string | undefined) => {
  const [prev, setPrev] = useState({ error, errorMessage });
  const [count, setCount] = useState(0);
  if (prev.error !== error || prev.errorMessage !== errorMessage) {
    setPrev({ error, errorMessage });
    if (error && (!prev.error || prev.errorMessage !== errorMessage)) {
      setCount(count + 1);
    }
  }
  if (!error || count === 0) return undefined;
  return count % 2 === 1 ? styles.shake.a : styles.shake.b;
};

const SingleLineField = forwardRef<HTMLInputElement, SingleLineTextFieldProps>(
  (
    {
      label,
      type = 'text',
      size = 'md',
      error = false,
      errorMessage,
      success = false,
      successMessage,
      helperText,
      fullWidth = false,
      required = false,
      disabled = false,
      className,
      multiline: _multiline,
      rows: _rows,
      autoResize: _autoResize,
      ...rest
    },
    ref
  ) => {
    const shake = useErrorShake(error, errorMessage);
    return (
      <FormField
        label={label}
        helperText={helperText}
        error={error}
        errorMessage={errorMessage}
        success={success}
        successMessage={successMessage}
        required={required}
        fullWidth={fullWidth}
      >
        {({ inputId, helperId, hasHelper, isError, isSuccess }) => (
          <input
            ref={ref}
            id={inputId}
            type={type}
            required={required}
            disabled={disabled}
            aria-invalid={isError}
            aria-disabled={disabled}
            aria-describedby={hasHelper ? helperId : undefined}
            className={clsx(
              styles.input,
              styles.size[size],
              isError && styles.error,
              isSuccess && styles.success,
              shake,
              className
            )}
            {...rest}
          />
        )}
      </FormField>
    );
  }
);

SingleLineField.displayName = 'TextField';

const MultilineField = forwardRef<HTMLTextAreaElement, MultilineTextFieldProps>(
  (
    {
      label,
      size = 'md',
      error = false,
      errorMessage,
      success = false,
      successMessage,
      helperText,
      fullWidth = false,
      required = false,
      disabled = false,
      className,
      multiline: _multiline,
      rows = 4,
      autoResize = false,
      style,
      onChange,
      ...rest
    },
    ref
  ) => {
    const internalRef = useRef<HTMLTextAreaElement>(null);
    const shake = useErrorShake(error, errorMessage);

    // ref 병합 (forwardRef와 내부 ref 모두 지원)
    const setRefs = useCallback(
      (element: HTMLTextAreaElement | null) => {
        internalRef.current = element;
        if (typeof ref === 'function') {
          ref(element);
        } else if (ref) {
          ref.current = element;
        }
      },
      [ref]
    );

    // 자동 높이 조정 함수
    const adjustHeight = useCallback(() => {
      const textarea = internalRef.current;
      if (!textarea || !autoResize) return;

      textarea.style.height = 'auto';
      // scrollHeight는 테두리를 빼고 재므로, border-box인 height에는 위아래 테두리를 더한다
      const border = textarea.offsetHeight - textarea.clientHeight;
      textarea.style.height = `${textarea.scrollHeight + border}px`;
    }, [autoResize]);

    // autoResize 활성화 시 초기 높이 조정
    useEffect(() => {
      if (autoResize) {
        adjustHeight();
      }
    }, [autoResize, adjustHeight]);

    // onChange 핸들러 래핑 (자동 높이 조정 포함)
    const handleChange = useCallback(
      (e: ChangeEvent<HTMLTextAreaElement>) => {
        if (autoResize) {
          adjustHeight();
        }
        onChange?.(e);
      },
      [autoResize, adjustHeight, onChange]
    );

    return (
      <FormField
        label={label}
        helperText={helperText}
        error={error}
        errorMessage={errorMessage}
        success={success}
        successMessage={successMessage}
        required={required}
        fullWidth={fullWidth}
      >
        {({ inputId, helperId, hasHelper, isError, isSuccess }) => (
          <textarea
            ref={setRefs}
            id={inputId}
            rows={rows}
            required={required}
            disabled={disabled}
            aria-invalid={isError}
            aria-disabled={disabled}
            aria-describedby={hasHelper ? helperId : undefined}
            className={clsx(
              styles.input,
              styles.multiline,
              styles.multilineSize[size],
              isError && styles.error,
              isSuccess && styles.success,
              shake,
              className
            )}
            style={{ overflow: autoResize ? 'hidden' : 'auto', ...style }}
            onChange={handleChange}
            {...rest}
          />
        )}
      </FormField>
    );
  }
);

MultilineField.displayName = 'TextField';

/**
 * `forwardRef` 하나로는 "단일 줄이면 ref가 `HTMLInputElement`, `multiline`이면
 * `HTMLTextAreaElement`"를 타입으로 말할 수 없다. 그래서 호출 시그니처 둘을 가진
 * 인터페이스로 캐스팅한다. 기존 단일 줄 소비처(`useRef<HTMLInputElement>`, 콜백 ref)는
 * 둘째 시그니처에 그대로 걸려 고칠 것이 없다. 단일 줄을 마지막에 두는 이유:
 * `ComponentProps<typeof TextField>`는 마지막 시그니처를 읽으므로, Storybook 같은
 * 도구가 기본 경우(단일 줄)의 props를 본다.
 */
interface TextFieldComponent {
  (
    props: MultilineTextFieldProps & RefAttributes<HTMLTextAreaElement>
  ): ReactElement | null;
  (
    props: SingleLineTextFieldProps & RefAttributes<HTMLInputElement>
  ): ReactElement | null;
  displayName?: string;
}

export const TextField = forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  TextFieldProps
>((props, ref) =>
  props.multiline ? (
    <MultilineField {...props} ref={ref as Ref<HTMLTextAreaElement>} />
  ) : (
    <SingleLineField {...props} ref={ref as Ref<HTMLInputElement>} />
  )
) as TextFieldComponent;

TextField.displayName = 'TextField';
