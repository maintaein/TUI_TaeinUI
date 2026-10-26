import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type RefObject,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { SearchDropdown } from '../SearchDialog';
import { useSearch } from '../../hooks/useSearch';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import * as styles from './GooeySearch.css';

interface GooeySearchProps {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
}

export function GooeySearch({
  open,
  onOpen,
  onClose,
  triggerRef,
}: GooeySearchProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const filterId = useId();
  const inputId = useId();
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const { query, setQuery, groupedResults } = useSearch();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const flatResults = Array.from(groupedResults.values()).flat();
  const hasQuery = open && query.trim().length > 0;

  const close = useCallback(
    (restoreFocus = false) => {
      onClose();
      setQuery('');
      setSelectedIndex(0);
      if (restoreFocus) triggerRef.current?.focus();
    },
    [onClose, setQuery, triggerRef]
  );

  useEffect(() => {
    if (!open) return;
    if (reducedMotion) inputRef.current?.focus();
    const onPointer = (event: PointerEvent) => {
      // 쇼케이스 자동 시연의 합성 포인터는 사용자의 바깥 클릭이 아니다.
      if (!event.isTrusted) return;
      if (
        event.target instanceof Node &&
        !rootRef.current?.contains(event.target)
      )
        close();
    };
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close(true);
      }
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, reducedMotion, close]);

  const select = (path: string) => {
    navigate(path);
    close(true);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing || flatResults.length === 0) return;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex((index) =>
          index < flatResults.length - 1 ? index + 1 : 0
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex((index) =>
          index > 0 ? index - 1 : flatResults.length - 1
        );
        break;
      case 'Enter':
        event.preventDefault();
        if (flatResults[selectedIndex])
          select(flatResults[selectedIndex].entry.path);
        break;
    }
  };

  return (
    <div
      ref={rootRef}
      className={styles.root}
      data-open={open}
      data-testid="gooey-search"
    >
      <svg
        className={styles.filterDefinition}
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          {/* 원본 M137의 블러와 알파 임계값으로 가까운 도형만 이어 붙인다. */}
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
        className={styles.shapes}
        style={{ filter: `url("#${filterId}")` }}
        aria-hidden="true"
        data-testid="gooey-shapes"
      >
        <div className={styles.pill} />
        <div className={styles.mover}>
          <div className={styles.ball} data-testid="gooey-ball" />
        </div>
      </div>
      <input
        ref={inputRef}
        id={inputId}
        className={styles.input}
        type="text"
        role="combobox"
        aria-label="검색"
        aria-autocomplete="list"
        aria-expanded={hasQuery}
        aria-controls={hasQuery ? 'header-search-results' : undefined}
        aria-activedescendant={
          hasQuery && flatResults[selectedIndex]
            ? `header-search-${flatResults[selectedIndex].entry.id}`
            : undefined
        }
        inert={!open}
        placeholder="컴포넌트, 가이드 검색..."
        autoComplete="off"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setSelectedIndex(0);
        }}
        onKeyDown={onKeyDown}
        onTransitionEnd={(event) => {
          if (open && event.propertyName === 'clip-path')
            inputRef.current?.focus();
        }}
      />
      <div className={styles.mover}>
        <button
          ref={triggerRef}
          className={styles.trigger}
          type="button"
          aria-label={open ? '검색 닫기' : '검색 열기 (Ctrl K / ⌘K)'}
          aria-expanded={open}
          aria-controls={inputId}
          onClick={() => (open ? close() : onOpen())}
        >
          {open ? (
            <X size={18} aria-hidden="true" />
          ) : (
            <Search size={18} aria-hidden="true" />
          )}
        </button>
      </div>
      <div className={styles.results}>
        <SearchDropdown
          open={hasQuery}
          query={query}
          groupedResults={groupedResults}
          selectedIndex={selectedIndex}
          onSelect={select}
          onHover={setSelectedIndex}
        />
      </div>
    </div>
  );
}
