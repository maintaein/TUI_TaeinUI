import { useState, type KeyboardEvent, type RefObject } from 'react';
import { useNavigate } from 'react-router-dom';
import { GooeySearch } from '@taein-ui/core';
import { SearchDropdown } from '../SearchDialog';
import { useSearch } from '../../hooks/useSearch';
import * as styles from './HeaderSearch.css';

interface HeaderSearchProps {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
}

// core GooeySearch에 사이트 검색(색인, 결과 목록, 길찾기, combobox 연결)을 붙인다.
export function HeaderSearch({
  open,
  onOpenChange,
  triggerRef,
}: HeaderSearchProps) {
  const { query, setQuery, groupedResults } = useSearch();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const flatResults = Array.from(groupedResults.values()).flat();
  const hasQuery = open && query.trim().length > 0;

  const change = (next: boolean, event?: Event) => {
    // 쇼케이스 자동 시연의 합성 포인터는 사용자의 바깥 클릭이 아니다.
    if (event?.type === 'pointerdown' && !event.isTrusted) return;
    onOpenChange(next);
    if (!next) {
      setQuery('');
      setSelectedIndex(0);
    }
  };

  const select = (path: string) => {
    navigate(path);
    change(false);
    triggerRef.current?.focus();
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
    <GooeySearch
      className={styles.root}
      open={open}
      onOpenChange={change}
      triggerRef={triggerRef}
      openLabel="검색 열기 (Ctrl K / ⌘K)"
      placeholder="컴포넌트, 가이드 검색..."
      inputProps={{
        role: 'combobox',
        'aria-autocomplete': 'list',
        'aria-expanded': hasQuery,
        'aria-controls': hasQuery ? 'header-search-results' : undefined,
        'aria-activedescendant':
          hasQuery && flatResults[selectedIndex]
            ? `header-search-${flatResults[selectedIndex].entry.id}`
            : undefined,
        value: query,
        onChange: (event) => {
          setQuery(event.target.value);
          setSelectedIndex(0);
        },
        onKeyDown,
      }}
    >
      <SearchDropdown
        open={hasQuery}
        query={query}
        groupedResults={groupedResults}
        selectedIndex={selectedIndex}
        onSelect={select}
        onHover={setSelectedIndex}
      />
    </GooeySearch>
  );
}
