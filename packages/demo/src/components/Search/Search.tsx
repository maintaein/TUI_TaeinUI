import {
  useState,
  useRef,
  useEffect,
  type ChangeEvent,
  type KeyboardEvent,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon } from 'lucide-react';
import * as styles from './Search.css';

export interface SearchItem {
  id: string;
  label: string;
  path: string;
  category?: string;
}

export interface SearchProps {
  items: SearchItem[];
  placeholder?: string;
  maxResults?: number;
  className?: string;
}

export function Search({
  items,
  placeholder = '컴포넌트 검색...',
  maxResults = 5,
  className,
}: SearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const filteredItems = query.trim()
    ? items
        .filter((item) =>
          item.label.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, maxResults)
    : [];

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setIsOpen(true);
    setSelectedIndex(0);
  };

  const handleSelect = (path: string) => {
    navigate(path);
    setQuery('');
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || filteredItems.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredItems.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          handleSelect(filteredItems[selectedIndex].path);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`${styles.searchContainer} ${className || ''}`}>
      <div className={styles.inputWrapper}>
        <SearchIcon className={styles.searchIcon} size={20} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={styles.input}
          role="combobox"
          aria-label="컴포넌트 검색"
          aria-autocomplete="list"
          aria-expanded={isOpen && filteredItems.length > 0}
          aria-controls="search-results"
        />
      </div>

      {isOpen && filteredItems.length > 0 && (
        <ul id="search-results" className={styles.resultsList} role="listbox">
          {filteredItems.map((item, index) => (
            <li
              key={item.id}
              role="option"
              aria-selected={index === selectedIndex}
            >
              <button
                className={`${styles.resultItem} ${
                  index === selectedIndex ? styles.resultItemSelected : ''
                }`}
                onClick={() => handleSelect(item.path)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <span className={styles.resultLabel}>{item.label}</span>
                {item.category && (
                  <span className={styles.resultCategory}>{item.category}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
