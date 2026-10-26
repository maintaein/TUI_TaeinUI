import { useEffect, useRef, type ReactNode } from 'react';
import type { SearchResult } from '../../hooks/useSearch';
import * as styles from './SearchDialog.css';

interface SearchDropdownProps {
  open: boolean;
  query: string;
  groupedResults: Map<string, SearchResult[]>;
  selectedIndex: number;
  onSelect: (path: string) => void;
  onHover: (index: number) => void;
}

function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;

  const parts: ReactNode[] = [];
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase().trim();
  let lastIndex = 0;

  let index = lowerText.indexOf(lowerQuery, lastIndex);
  while (index !== -1) {
    if (index > lastIndex) {
      parts.push(text.slice(lastIndex, index));
    }
    parts.push(
      <mark key={index} className={styles.highlight}>
        {text.slice(index, index + lowerQuery.length)}
      </mark>
    );
    lastIndex = index + lowerQuery.length;
    index = lowerText.indexOf(lowerQuery, lastIndex);
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <>{parts}</>;
}

export function SearchDropdown({
  open,
  query,
  groupedResults,
  selectedIndex,
  onSelect,
  onHover,
}: SearchDropdownProps) {
  const listRef = useRef<HTMLDivElement>(null);

  // 선택된 항목이 보이도록 스크롤
  useEffect(() => {
    if (!listRef.current) return;
    const selected = listRef.current.querySelector(
      `[data-index="${selectedIndex}"]`
    );
    if (selected) {
      selected.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!open) return null;

  let globalIndex = 0;
  const hasResults = groupedResults.size > 0;

  return (
    <div className={styles.dropdown}>
      <div
        ref={listRef}
        id="header-search-results"
        className={styles.resultsList}
        role="listbox"
      >
        {!hasResults && query.trim().length > 0 && (
          <div className={styles.emptyState} role="status" aria-live="polite">
            <span className={styles.emptyStateQuery}>"{query}"</span>에 대한
            검색 결과가 없습니다
          </div>
        )}
        {Array.from(groupedResults.entries()).map(([category, items]) => (
          <div key={category} className={styles.categoryGroup}>
            <div className={styles.categoryLabel}>{category}</div>
            {items.map((result) => {
              const currentIndex = globalIndex++;
              const isSelected = currentIndex === selectedIndex;

              return (
                <button
                  key={result.entry.id}
                  id={`header-search-${result.entry.id}`}
                  data-index={currentIndex}
                  type="button"
                  tabIndex={-1}
                  className={`${styles.resultItem} ${isSelected ? styles.resultItemSelected : ''}`}
                  onClick={() => onSelect(result.entry.path)}
                  onMouseEnter={() => onHover(currentIndex)}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div className={styles.resultHeader}>
                    <span className={styles.resultTitle}>
                      <HighlightText
                        text={result.entry.pageTitle}
                        query={query}
                      />
                    </span>
                  </div>
                  <div className={styles.resultDescription}>
                    <HighlightText
                      text={result.entry.description}
                      query={query}
                    />
                  </div>
                  {result.matchedSections.length > 0 && (
                    <div className={styles.sectionsList}>
                      {result.matchedSections.slice(0, 3).map((section, i) => (
                        <div key={i} className={styles.sectionItem}>
                          <span className={styles.sectionTitle}>
                            <HighlightText text={section.title} query={query} />
                          </span>
                          {': '}
                          <HighlightText text={section.content} query={query} />
                        </div>
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
