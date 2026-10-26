import { useCallback, useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { IconButton } from '@taein-ui/core';
import { X } from 'lucide-react';
import clsx from 'clsx';
import { PillHeader, GITHUB_URL } from './PillHeader';
import { RulerNav } from './RulerNav';
import { ScrollToTop } from '../components/ScrollToTop';
import { componentsData } from '../data/components';
import { useMediaQuery, breakpoints } from '../hooks/useMediaQuery';
import * as styles from './RootLayout.css';

// 붙박이 사이드바가 붙는 문서 쪽: 시작하기와 컴포넌트 상세(개요 제외)
const docsPaths = new Set([
  '/getting-started',
  ...componentsData.map((c) => c.path),
]);

// 넓은 화면의 문서 쪽에서는 붙박이 판을 접고 펴고, 그 밖(소개·개요·404, 좁은 화면)에서는 덮는 서랍을 연다.
export function RootLayout() {
  const { pathname } = useLocation();
  const compact = useMediaQuery(breakpoints.compact);
  const dockMode = !compact && docsPaths.has(pathname);
  const [docked, setDocked] = useState(true);
  const [drawer, setDrawer] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLButtonElement>(null);
  const drawerOpen = !dockMode && drawer;
  const open = dockMode ? docked : drawerOpen;

  // 이동하면 서랍이 닫힌다(렌더 중 상태 맞춤)
  const [drawerPath, setDrawerPath] = useState(pathname);
  if (drawerPath !== pathname) {
    setDrawerPath(pathname);
    setDrawer(false);
  }

  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const openSearch = useCallback(() => {
    setDrawer(false);
    setSearchOpen(true);
  }, []);

  // ⌘K / Ctrl+K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openSearch();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [openSearch]);

  // 서랍: 열리면 지금 페이지 링크로 포커스를 옮기고, Esc로 닫으면 햄버거로 돌려준다
  useEffect(() => {
    if (!drawerOpen) return;
    const el = document.getElementById('site-nav');
    (
      el?.querySelector<HTMLElement>('[aria-current="page"]') ??
      el?.querySelector<HTMLElement>('a, button')
    )?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setDrawer(false);
      document
        .querySelector<HTMLElement>('[aria-controls="site-nav"]')
        ?.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  return (
    <div className={clsx(styles.page, dockMode && docked && styles.pageDocked)}>
      <ScrollToTop />
      <a href="#main-content" className={styles.skipToContent}>
        본문으로 건너뛰기
      </a>
      <PillHeader
        open={open}
        drawer={drawerOpen}
        onMenu={() => (dockMode ? setDocked((d) => !d) : setDrawer((d) => !d))}
        onSearch={openSearch}
        searchOpen={searchOpen}
        onSearchClose={closeSearch}
        searchRef={searchRef}
      />

      <aside
        id="site-nav"
        className={clsx(
          styles.side,
          !dockMode && styles.drawer,
          !open && styles.offscreen
        )}
        inert={!open}
      >
        {!dockMode && (
          <div className={styles.drawerHead}>
            <span>탐색</span>
            <IconButton aria-label="탐색 닫기" onClick={() => setDrawer(false)}>
              <X />
            </IconButton>
          </div>
        )}
        <RulerNav />
        {!dockMode && (
          <div className={styles.drawerFoot}>
            <a
              className={styles.link}
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </div>
        )}
      </aside>
      {!dockMode && (
        <div
          className={clsx(styles.backdrop, drawerOpen && styles.backdropOn)}
          onClick={() => setDrawer(false)}
          aria-hidden="true"
        />
      )}

      <main id="main-content" inert={drawerOpen} className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
