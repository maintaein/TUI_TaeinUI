import { forwardRef, useCallback, useRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { FormField } from '../FormField';
import { MirrorOverlay } from '../../_internal/MirrorOverlay';
import * as styles from './TextField.css';

/**
 * 미러가 붙어도 되는 type의 허용 목록이다 (Ruling 80) — 금지 목록이 아니다.
 * password는 평문을 그대로 그려 보안 결함이 되고(C-1), number는 브라우저가
 * 중간 입력값(`-`, `1e`, `1.`)을 value=''로 지워 버려 타이핑한 글자가 투명
 * 오버레이 아래서 통째로 사라진다(C-1b). 나중에 type이 추가돼도 여기 없으면
 * 기본은 "미러 없음"이다.
 */
const MIRRORABLE_TYPES = new Set(['text', 'email', 'tel', 'url']);

/** 한 줄 텍스트 입력 컴포넌트. 레이블, 에러, 도움말 텍스트 내장 */
export interface TextFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'size'
> {
  /** 레이블 텍스트 */
  label: string;
  /** Input type */
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  /** Input size */
  size?: 'sm' | 'md' | 'lg';
  /** 에러 상태 */
  error?: boolean;
  /** 에러 메시지 */
  errorMessage?: string;
  /** 도움말 텍스트 */
  helperText?: string;
  /** 전체 너비 사용 */
  fullWidth?: boolean;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  (
    {
      label,
      type = 'text',
      size = 'md',
      error = false,
      errorMessage,
      helperText,
      fullWidth = false,
      required = false,
      disabled = false,
      className,
      ...rest
    },
    ref
  ) => {
    const internalRef = useRef<HTMLInputElement>(null);

    // ref 병합 (forwardRef와 내부 ref 모두 지원) — TextArea.tsx:52-62와 같은 패턴
    const setRefs = useCallback(
      (element: HTMLInputElement | null) => {
        internalRef.current = element;
        if (typeof ref === 'function') {
          ref(element);
        } else if (ref) {
          ref.current = element;
        }
      },
      [ref]
    );

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
          <div
            className={clsx(
              styles.inputContainer,
              styles.size[size],
              isError && styles.error
            )}
          >
            <input
              ref={setRefs}
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
                className
              )}
              {...rest}
            />
            {!disabled && !rest.readOnly && MIRRORABLE_TYPES.has(type) && (
              <MirrorOverlay
                inputRef={internalRef}
                unit="char"
                geometryClassName={clsx(styles.mirror, styles.mirrorSize[size])}
              />
            )}
          </div>
        )}
      </FormField>
    );
  }
);

TextField.displayName = 'TextField';
