import { NavLink } from 'react-router-dom';
import { numberedGroups, numberedMotionGroups } from '../data/components';
import * as styles from './RootLayout.css';

export function RulerNav() {
  return (
    <nav aria-label="문서">
      <div className={styles.ruler}>
        <div className={styles.rulerGroup}>
          <span className={styles.rulerHead}>시작</span>
          <NavLink to="/" end className={styles.rulerItem}>
            소개
          </NavLink>
          <NavLink to="/getting-started" end className={styles.rulerItem}>
            시작하기
          </NavLink>
          <NavLink to="/components/overview" end className={styles.rulerItem}>
            전체 컴포넌트
          </NavLink>
        </div>
        {numberedGroups.map((g) => (
          <div key={g.label} className={styles.rulerGroup}>
            <span className={styles.rulerHead}>{g.label}</span>
            {g.items.map((c) => (
              <NavLink
                key={c.path}
                to={c.path}
                end
                className={styles.rulerItem}
              >
                <span className={styles.rulerNo}>{c.no}</span>
                {c.name}
              </NavLink>
            ))}
          </div>
        ))}
        {numberedMotionGroups.map((g, i) => (
          <div key={g.label} className={styles.rulerGroup}>
            {i === 0 && <span className={styles.rulerPart}>모션</span>}
            <span className={styles.rulerHead}>{g.label}</span>
            {g.items.map((m) => (
              <NavLink
                key={m.path}
                to={m.path}
                end
                className={styles.rulerItem}
              >
                <span className={styles.rulerNo}>{m.no}</span>
                {m.title}
              </NavLink>
            ))}
          </div>
        ))}
      </div>
    </nav>
  );
}
