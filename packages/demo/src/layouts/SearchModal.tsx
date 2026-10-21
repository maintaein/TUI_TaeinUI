import {
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type RefObject,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, TextField } from '@taein-ui/core';
import { SearchDropdown } from '../components/SearchDialog';
import { useSearch } from '../hooks/useSearch';
import * as styles from './RootLayout.css';

interface SearchModalProps {
  open: boolean;
  /** 렌더마다 바뀌면 Modal이 포커스를 다시 가두므로 useCallback으로 안정시켜 넘긴다 */
  onClose: () => void;
  triggerRef: RefObject<HTMLElement | null>;
}

// Modal은 닫혀 있으면 자식을 마운트하지 않는다. 검색어·선택 상태는 열릴 때마다 새로 시작한다
function SearchPanel({ onClose }: { onClose: () => void }) {
  const { query, setQuery, groupedResults } = useSearch();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();

  // flat 결과 리스트 (키보드 탐색용)
  const flatResults = Array.from(groupedResults.values()).flat();
  const hasQuery = query.trim().length > 0;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setSelectedIndex(0);
  };

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
  };

  // Esc는 Modal이 닫는다
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (flatResults.length === 0) return;

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
    }
  };

  return (
    <div className={styles.searchBody}>
      <TextField
        label="검색"
        fullWidth
        type="text"
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="컴포넌트, 가이드 검색..."
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={hasQuery}
        aria-controls="header-search-results"
      />
      <SearchDropdown
        open={hasQuery}
        query={query}
        groupedResults={groupedResults}
        selectedIndex={selectedIndex}
        onSelect={handleSelect}
        onHover={setSelectedIndex}
      />
    </div>
  );
}

export function SearchModal({ open, onClose, triggerRef }: SearchModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      triggerRef={triggerRef}
      aria-label="검색"
    >
      <SearchPanel onClose={onClose} />
    </Modal>
  );
}
