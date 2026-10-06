import { useState, useId, type HTMLAttributes, type ReactNode } from 'react';
import clsx from 'clsx';
import { Glyph } from '../../_internal/glyph';
import {
  boardRow,
  variantStyles,
  header,
  title as titleStyle,
  iconContainer,
  iconExpanded,
  contentWrapper,
  wrapperExpanded,
  content,
  contentInner,
} from './BoardRow.css';

/** 접을 수 있는 아코디언 행 컴포넌트. 제어/비제어 모드 지원 */
export interface BoardRowProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'title' | 'onChange'
> {
  /** 행 제목 (항상 표시됨) */
  title: ReactNode;
  /** 접히는 영역의 콘텐츠 */
  children: ReactNode;
  /** 시각적 스타일 @default 'default' */
  variant?: 'default' | 'outlined' | 'filled';
  /** 비제어 모드: 초기 펼침 상태 @default false */
  defaultExpanded?: boolean;
  /** 제어 모드: 펼침 상태 */
  expanded?: boolean;
  /** 제어 모드: 펼침 상태 변경 핸들러 */
  onChange?: (expanded: boolean) => void;
  /** 비활성화 상태 */
  disabled?: boolean;
  /** 추가 CSS 클래스 */
  className?: string;
}

export const BoardRow = ({
  title,
  children,
  variant = 'default',
  defaultExpanded = false,
  expanded: controlledExpanded,
  onChange,
  disabled = false,
  className,
  ...props
}: BoardRowProps) => {
  const headerId = useId();
  const contentId = useId();

  // 제어모드와 비제어모드
  const isControlled = controlledExpanded !== undefined;
  const [uncontrolledExpanded, setUncontrolledExpanded] =
    useState(defaultExpanded);
  const isExpanded = isControlled ? controlledExpanded : uncontrolledExpanded;

  const handleToggle = () => {
    if (disabled) return;

    if (isControlled) {
      onChange?.(!controlledExpanded);
    } else {
      setUncontrolledExpanded((prev) => !prev);
    }
  };

  return (
    <div
      className={clsx(boardRow, variantStyles[variant], className)}
      {...props}
    >
      <button
        id={headerId}
        type="button"
        className={header}
        onClick={handleToggle}
        disabled={disabled}
        aria-expanded={isExpanded}
        aria-controls={contentId}
      >
        <div className={titleStyle}>{title}</div>
        <div className={clsx(iconContainer, isExpanded && iconExpanded)}>
          <Glyph name="chevron-down" size="md" />
        </div>
      </button>

      <div className={clsx(contentWrapper, isExpanded && wrapperExpanded)}>
        <div
          id={contentId}
          role="region"
          aria-labelledby={headerId}
          className={content}
        >
          <div className={contentInner}>{children}</div>
        </div>
      </div>
    </div>
  );
};

BoardRow.displayName = 'BoardRow';
