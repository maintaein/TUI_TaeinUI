import { useId, type ReactNode } from 'react';
import clsx from 'clsx';
import {
  wrapper,
  fullWidth as fullWidthStyle,
  label as labelStyle,
  required as requiredStyle,
  helperText as helperTextStyle,
  errorMessage as errorMessageStyle,
  successMessage as successMessageStyle,
} from './formField.css';

/** Render prop으로 전달되는 폼 필드 상태 */
export interface FormFieldRenderProps {
  /** 연결할 input의 id */
  inputId: string;
  /** 연결할 도움말 텍스트의 id (aria-describedby용) */
  helperId: string;
  /** 도움말 또는 에러 메시지 존재 여부 */
  hasHelper: boolean;
  /** 에러 상태 여부 */
  isError: boolean;
  /** 성공 상태 여부. 에러가 이긴다 */
  isSuccess: boolean;
}

/** 레이블, 도움말, 에러 메시지를 포함하는 폼 필드 래퍼. Render prop 패턴으로 자식 input에 접근성 속성 전달 */
export interface FormFieldProps {
  /** 필드 레이블 텍스트 */
  label: string;
  /** 도움말 텍스트 */
  helperText?: string;
  /** 에러 상태 @default false */
  error?: boolean;
  /** 에러 메시지 (error가 true일 때 helperText 대신 표시) */
  errorMessage?: string;
  /** 성공 상태. `error`가 함께 켜지면 에러가 이긴다 @default false */
  success?: boolean;
  /** 성공 메시지 (success가 true일 때 helperText 대신 표시) */
  successMessage?: string;
  /** 필수 입력 표시 @default false */
  required?: boolean;
  /** 부모 너비에 맞춰 확장 @default false */
  fullWidth?: boolean;
  /** 추가 CSS 클래스 */
  className?: string;
  /** Render prop: 폼 필드 상태를 받아 input 요소를 반환 */
  children: (props: FormFieldRenderProps) => ReactNode;
}

export const FormField = ({
  label,
  helperText,
  error = false,
  errorMessage,
  success = false,
  successMessage,
  required = false,
  fullWidth = false,
  className,
  children,
}: FormFieldProps) => {
  const inputId = useId();
  const helperId = useId();

  // helperText, errorMessage, successMessage 중 하나만 표시한다. 우선순위는 에러, 성공, 도움말
  const isError = error;
  const isSuccess = !error && success;
  const showError = error && !!errorMessage;
  const showSuccess = isSuccess && !!successMessage;
  const showHelper = !error && !showSuccess && !!helperText;
  const hasHelper = showHelper || showError || showSuccess;

  return (
    <div className={clsx(wrapper, fullWidth && fullWidthStyle, className)}>
      <label htmlFor={inputId} className={labelStyle}>
        {label}
        {required && <span className={requiredStyle}>*</span>}
      </label>

      {children({ inputId, helperId, hasHelper, isError, isSuccess })}

      {showHelper && (
        <span id={helperId} className={helperTextStyle}>
          {helperText}
        </span>
      )}

      {/* key가 문구라서 문구가 바뀌면 새로 그려져 내려앉는 모션이 다시 돈다 */}
      {showError && (
        <span key={errorMessage} id={helperId} className={errorMessageStyle}>
          {errorMessage}
        </span>
      )}

      {showSuccess && (
        <span id={helperId} className={successMessageStyle}>
          {successMessage}
        </span>
      )}
    </div>
  );
};

FormField.displayName = 'FormField';
