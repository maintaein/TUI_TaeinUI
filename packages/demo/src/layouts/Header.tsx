import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type ChangeEvent,
  type KeyboardEvent,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { IconButton } from '@taein-ui/core';
import { SearchDropdown } from '../components/SearchDialog';
import { useSearch } from '../hooks/useSearch';
import * as styles from './Header.css';

interface HeaderProps {
  onMenuClick: () => void;
  showMenuButton?: boolean;
}

export function Header({ onMenuClick, showMenuButton = false }: HeaderProps) {
  const { query, setQuery, groupedResults, hasResults, reset } = useSearch();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // flat 결과 리스트 (키보드 탐색용)
  const flatResults = Array.from(groupedResults.values()).flat();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setSelectedIndex(0);
    setIsOpen(e.target.value.trim().length > 0);
  };

  const handleSelect = useCallback(
    (path: string) => {
      navigate(path);
      reset();
      setIsOpen(false);
      setSelectedIndex(0);
      inputRef.current?.blur();
    },
    [navigate, reset]
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || flatResults.length === 0) {
      if (e.key === 'Escape') {
        reset();
        setIsOpen(false);
        inputRef.current?.blur();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < flatResults.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : flatResults.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (flatResults[selectedIndex]) {
          handleSelect(flatResults[selectedIndex].entry.path);
        }
        break;
      case 'Escape':
        e.preventDefault();
        reset();
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className={styles.header}>
      <div className={styles.leftSection}>
        {showMenuButton && (
          <IconButton
            onClick={onMenuClick}
            aria-label="메뉴 열기"
            size="md"
            ghost
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </IconButton>
        )}
        <picture>
          <source srcSet="/images/TUIlogo.webp" type="image/webp" />
          <img
            src="/images/TUIlogo.png"
            alt="TUI 로고"
            width={40}
            height={26}
            className={styles.logoImage}
            fetchPriority="high"
            decoding="async"
          />
        </picture>
        <div className={styles.logo}>TUI</div>
      </div>

      <div className={styles.rightSection}>
        <div ref={wrapperRef} className={styles.searchWrapper}>
          <div className={styles.searchInputWrapper}>
            <svg
              className={styles.searchIcon}
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (query.trim()) setIsOpen(true);
              }}
              placeholder="검색..."
              className={styles.searchInput}
              role="combobox"
              aria-label="검색"
              aria-autocomplete="list"
              aria-expanded={isOpen && hasResults}
              aria-controls="header-search-results"
            />
          </div>
          <SearchDropdown
            open={isOpen && hasResults}
            query={query}
            groupedResults={groupedResults}
            selectedIndex={selectedIndex}
            onSelect={handleSelect}
            onHover={setSelectedIndex}
          />
        </div>

        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.githubLink}
          aria-label="GitHub 저장소"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
        </a>
      </div>
    </header>
  );
}
