import { forwardRef, useEffect, useRef, useCallback } from 'react';
import type { TextareaHTMLAttributes, ChangeEvent } from 'react';
import { clsx } from 'clsx';
import { FormField } from '../../_internal/formField';
import { MirrorOverlay } from '../../_internal/MirrorOverlay';
import * as styles from './TextArea.css';

/** 여러 줄 텍스트 입력 컴포넌트. 자동 높이 조정 지원 */
export interface TextAreaProps extends Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'size'
> {
  /** 레이블 텍스트 */
  label: string;
  /** TextArea size */
  size?: 'sm' | 'md' | 'lg';
  /** 높이 자동 조정 */
  autoResize?: boolean;
  /** 최소 높이 (px 또는 문자열) */
  height?: string | number;
  /** 에러 상태 */
  error?: boolean;
  /** 에러 메시지 */
  errorMessage?: string;
  /** 도움말 텍스트 */
  helperText?: string;
  /** 전체 너비 사용 */
  fullWidth?: boolean;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      label,
      size = 'md',
      autoResize = false,
      height = 120,
      error = false,
      errorMessage,
      helperText,
      fullWidth = false,
      required = false,
      disabled = false,
      className,
      onChange,
      ...rest
    },
    ref
  ) => {
    const internalRef = useRef<HTMLTextAreaElement>(null);

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
      textarea.style.height = `${textarea.scrollHeight}px`;
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

    // height를 px 단위로 변환
    const minHeight = typeof height === 'number' ? `${height}px` : height;

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
              styles.textareaContainer,
              styles.size[size],
              isError && styles.error
            )}
          >
            <textarea
              ref={setRefs}
              id={inputId}
              required={required}
              disabled={disabled}
              aria-invalid={isError}
              aria-disabled={disabled}
              aria-describedby={hasHelper ? helperId : undefined}
              className={clsx(
                styles.textarea,
                styles.size[size],
                isError && styles.error,
                className
              )}
              style={{
                minHeight,
                overflow: autoResize ? 'hidden' : 'auto',
              }}
              onChange={handleChange}
              {...rest}
            />
            {!disabled && !rest.readOnly && (
              <MirrorOverlay
                inputRef={internalRef}
                unit="word"
                geometryClassName={clsx(styles.mirror, styles.mirrorSize[size])}
              />
            )}
          </div>
        )}
      </FormField>
    );
  }
);

TextArea.displayName = 'TextArea';
