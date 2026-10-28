import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  type InputHTMLAttributes,
  type ReactNode,
  type Ref,
} from 'react';
import clsx from 'clsx';
import { Glyph } from '../../_internal/glyph';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import {
  root as rootClass,
  filterDefinition,
  shapes,
  mover,
  pill,
  ball,
  input as inputClass,
  trigger as triggerClass,
  results,
} from './GooeySearch.css';

export interface GooeySearchProps {
  /** 열림 여부 (제어) */
  open: boolean;
  /** 열림이 바뀔 때. 닫힘은 바깥 pointerdown, Esc keydown, 트리거 click이 일으키고 그 이벤트를 둘째 인자로 준다 */
  onOpenChange: (next: boolean, event?: Event) => void;
  /** 트리거 button으로 가는 ref */
  triggerRef?: Ref<HTMLButtonElement>;
  /** 닫혀 있을 때 트리거의 이름 @default '검색 열기' */
  openLabel?: string;
  /** 열려 있을 때 트리거의 이름 @default '검색 닫기' */
  closeLabel?: string;
  /** 입력창의 이름 @default '검색' */
  inputLabel?: string;
  /** 입력창의 안내 글 */
  placeholder?: string;
  /** 입력창에 펼칠 속성(value, onChange, onKeyDown, role, aria-*). core는 입력값을 들고 있지 않다. 이름과 안내 글은 위 prop으로 준다 */
  inputProps?: Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'id' | 'type' | 'className' | 'aria-label' | 'placeholder'
  >;
  /** 결과 목록. 입력창 아래에 놓인다 */
  children?: ReactNode;
  /** 추가 CSS 클래스. 폭과 배치는 이쪽에서 정한다 */
  className?: string;
}

/**
 * 둥근 검색 단추가 물방울처럼 오른쪽으로 갈라지며 그 사이로 입력창이 늘어나는 검색창. 닫으면 두 덩어리가
 * 합쳐진다. 열고 닫는 상태와 입력값, 결과 목록은 소비자가 쥔다. Esc와 바깥 pointerdown으로 닫고 Esc는
 * 트리거로 포커스를 돌려준다. 움직임 줄이기에서는 갈라짐 없이 바로 열리고 닫힌다.
 */
export const GooeySearch = forwardRef<HTMLDivElement, GooeySearchProps>(
  (
    {
      open,
      onOpenChange,
      triggerRef,
      openLabel = '검색 열기',
      closeLabel = '검색 닫기',
      inputLabel = '검색',
      placeholder,
      inputProps,
      children,
      className,
    },
    ref
  ) => {
    const rootRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const filterId = useId();
    const inputId = useId();
    const reduced = useReducedMotion();
    // 소비자가 매 렌더 새 함수를 넘겨도 문서 리스너가 다시 붙지 않게 최신 값을 ref로 읽는다
    const onOpenChangeRef = useRef(onOpenChange);
    useEffect(() => {
      onOpenChangeRef.current = onOpenChange;
    });

    useImperativeHandle(ref, () => rootRef.current as HTMLDivElement);
    useImperativeHandle(
      triggerRef,
      () => buttonRef.current as HTMLButtonElement
    );

    // 움직임이 없으면 transitionend가 오지 않으니 열리자마자 포커스를 준다
    useEffect(() => {
      if (open && reduced) inputRef.current?.focus();
    }, [open, reduced]);

    useEffect(() => {
      if (!open) return;
      const onPointer = (event: PointerEvent) => {
        if (
          event.target instanceof Node &&
          !rootRef.current?.contains(event.target)
        )
          onOpenChangeRef.current(false, event);
      };
      const onKey = (event: KeyboardEvent) => {
        // 안쪽(결과 목록의 combobox 등)이 이미 Esc를 처리했으면 열린 채 둔다
        if (event.key !== 'Escape' || event.defaultPrevented) return;
        event.preventDefault();
        onOpenChangeRef.current(false, event);
        buttonRef.current?.focus();
      };
      document.addEventListener('pointerdown', onPointer);
      document.addEventListener('keydown', onKey);
      return () => {
        document.removeEventListener('pointerdown', onPointer);
        document.removeEventListener('keydown', onKey);
      };
    }, [open]);

    return (
      <div
        ref={rootRef}
        className={clsx(rootClass, className)}
        data-open={open}
        data-testid="gooey-search"
      >
        <svg className={filterDefinition} aria-hidden="true" focusable="false">
          <defs>
            {/* 블러와 알파 임계값으로 가까운 도형만 이어 붙인다. */}
            <filter
              id={filterId}
              x="-50%"
              y="-100%"
              width="200%"
              height="300%"
              colorInterpolationFilters="sRGB"
            >
              <feGaussianBlur
                in="SourceGraphic"
                stdDeviation="10"
                result="blur"
              />
              <feColorMatrix
                in="blur"
                type="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 26 -11"
                result="goo"
              />
              <feComposite in="SourceGraphic" in2="goo" operator="atop" />
            </filter>
          </defs>
        </svg>
        <div
          className={shapes}
          style={{ filter: `url("#${filterId}")` }}
          aria-hidden="true"
          data-testid="gooey-shapes"
        >
          <div className={pill} />
          <div className={mover}>
            <div className={ball} data-testid="gooey-ball" />
          </div>
        </div>
        <input
          autoComplete="off"
          {...inputProps}
          ref={inputRef}
          id={inputId}
          className={inputClass}
          type="text"
          aria-label={inputLabel}
          placeholder={placeholder}
          inert={!open}
          onTransitionEnd={(event) => {
            inputProps?.onTransitionEnd?.(event);
            if (open && event.propertyName === 'clip-path')
              inputRef.current?.focus();
          }}
        />
        <div className={mover}>
          <button
            ref={buttonRef}
            className={triggerClass}
            type="button"
            aria-label={open ? closeLabel : openLabel}
            aria-expanded={open}
            aria-controls={inputId}
            onClick={(event) => onOpenChange(!open, event.nativeEvent)}
          >
            <Glyph name={open ? 'close' : 'search'} />
          </button>
        </div>
        {children ? <div className={results}>{children}</div> : null}
      </div>
    );
  }
);

GooeySearch.displayName = 'GooeySearch';
