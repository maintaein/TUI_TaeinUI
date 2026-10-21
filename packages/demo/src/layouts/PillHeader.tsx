import { type RefObject } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { IconButton } from '@taein-ui/core';
import { Menu, Search, X } from 'lucide-react';
import * as styles from './RootLayout.css';

export const GITHUB_URL = 'https://github.com/maintaein/TUI_TaeinUI';

interface PillHeaderProps {
  /** 판(붙박이)이나 서랍이 열려 있는가 */
  open: boolean;
  /** 덮는 서랍이 열려 있으면 햄버거 대신 X를 그린다 */
  drawer: boolean;
  onMenu: () => void;
  onSearch: () => void;
  searchRef: RefObject<HTMLButtonElement | null>;
}

export function PillHeader({
  open,
  drawer,
  onMenu,
  onSearch,
  searchRef,
}: PillHeaderProps) {
  const { pathname } = useLocation();
  return (
    <header className={styles.pill}>
      <IconButton
        aria-label={open ? '탐색 닫기' : '탐색 열기'}
        aria-expanded={open}
        aria-controls="site-nav"
        onClick={onMenu}
      >
        {drawer ? <X /> : <Menu />}
      </IconButton>
      <Link to="/" className={styles.brand}>
        <img className={styles.brandLogo} src="/images/TUIlogo.webp" alt="" />
        TUI
      </Link>
      <nav className={styles.pillLinks} aria-label="사이트">
        <Link
          to="/getting-started"
          className={styles.link}
          aria-current={pathname === '/getting-started' ? 'page' : undefined}
        >
          시작하기
        </Link>
        <Link
          to="/components/overview"
          className={styles.link}
          aria-current={pathname.startsWith('/components') ? 'page' : undefined}
        >
          컴포넌트
        </Link>
        <a
          className={styles.link}
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
      </nav>
      <button
        ref={searchRef}
        className={styles.keyBtn}
        type="button"
        aria-label="검색 (Ctrl K)"
        onClick={onSearch}
      >
        <Search size={16} aria-hidden="true" />
        <span className={styles.keyHint}>⌘K</span>
      </button>
    </header>
  );
}
