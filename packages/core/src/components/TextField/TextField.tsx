import { forwardRef, useCallback, useRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { FormField } from '../FormField';
import { MirrorOverlay } from '../../_internal/MirrorOverlay';
import * as styles from './TextField.css';

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
            {!disabled && !rest.readOnly && (
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
