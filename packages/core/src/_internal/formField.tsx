import { useId, type ReactNode } from 'react';
import clsx from 'clsx';
import {
  wrapper,
  fullWidth as fullWidthStyle,
  label as labelStyle,
  required as requiredStyle,
  helperText as helperTextStyle,
  errorMessage as errorMessageStyle,
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
  required = false,
  fullWidth = false,
  className,
  children,
}: FormFieldProps) => {
  const inputId = useId();
  const helperId = useId();

  // helperText 또는 errorMessage 표시 여부
  const showHelper = !error && !!helperText;
  const showError = error && !!errorMessage;
  const hasHelper = showHelper || showError;
  const isError = error;

  return (
    <div className={clsx(wrapper, fullWidth && fullWidthStyle, className)}>
      <label htmlFor={inputId} className={labelStyle}>
        {label}
        {required && <span className={requiredStyle}>*</span>}
      </label>

      {children({ inputId, helperId, hasHelper, isError })}

      {showHelper && (
        <span id={helperId} className={helperTextStyle}>
          {helperText}
        </span>
      )}

      {showError && (
        <span id={helperId} className={errorMessageStyle}>
          {errorMessage}
        </span>
      )}
    </div>
  );
};

FormField.displayName = 'FormField';
