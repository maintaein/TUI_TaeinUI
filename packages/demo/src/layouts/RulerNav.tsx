import { NavLink } from 'react-router-dom';
import { categoryLabels, componentsData } from '../data/components';
import * as styles from './RootLayout.css';

// 번호는 계열 순서대로 이어서 01부터 매긴다
let no = 0;
const groups = Object.entries(categoryLabels).map(([key, label]) => ({
  label,
  items: componentsData
    .filter((c) => c.category === key)
    .map((c) => ({ ...c, no: String(++no).padStart(2, '0') })),
}));

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
        {groups.map((g) => (
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
      </div>
    </nav>
  );
}
