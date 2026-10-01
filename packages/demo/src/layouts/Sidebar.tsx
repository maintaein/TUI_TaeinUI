import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';
import type { NavigationItem } from '../data/navigation';
import { navigationData } from '../data/navigation';
import * as styles from './Sidebar.css';

interface SidebarProps {
  isOpen: boolean;
  overlay: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, overlay, onClose }: SidebarProps) {
  const location = useLocation();
  const [expandedPaths, setExpandedPaths] = useState<string[]>([]);

  const toggleExpand = (path: string) => {
    setExpandedPaths((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  };

  const isActive = (path: string) => location.pathname === path;
  const isChildActive = (item: NavigationItem) =>
    item.children?.some((child) => location.pathname === child.path) ?? false;

  const renderNavItem = (item: NavigationItem) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedPaths.includes(item.path);
    const active = isActive(item.path);
    const childActive = hasChildren && isChildActive(item);

    if (hasChildren) {
      return (
        <div key={item.path} className={styles.navSection}>
          <div
            className={clsx(
              styles.navItem,
              (active || childActive) && styles.navItemActive
            )}
            onClick={() => toggleExpand(item.path)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleExpand(item.path);
              }
            }}
          >
            <span>{item.label}</span>
            <ChevronDown
              className={clsx(
                styles.chevron,
                isExpanded && styles.chevronExpanded
              )}
            />
          </div>
          {isExpanded && item.children && (
            <div className={styles.navChildren}>
              {item.children.map((child) => (
                <Link
                  key={child.path}
                  to={child.path}
                  className={clsx(
                    styles.navItem,
                    isActive(child.path) && styles.navItemActive
                  )}
                  onClick={onClose}
                >
                  {child.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.path}
        to={item.path}
        className={clsx(styles.navItem, active && styles.navItemActive)}
        onClick={onClose}
      >
        {item.label}
      </Link>
    );
  };

  const sidebarClass = clsx(
    styles.sidebar,
    overlay && styles.sidebarOverlay,
    overlay && !isOpen && styles.sidebarHidden
  );

  return (
    <aside className={sidebarClass} aria-label="사이드바 네비게이션">
      <nav className={styles.nav} aria-label="사이드바 네비게이션">
        {navigationData.map(renderNavItem)}
      </nav>
    </aside>
  );
}
