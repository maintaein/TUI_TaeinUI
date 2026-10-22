import { useState } from 'react';
import { Chip } from '@taein-ui/core';
import * as t from '../../components/DocText';
import { FrameCard } from '../../components/FrameCard';
import * as wall from '../../components/FrameCard/FrameCard.css';
import { numberedGroups } from '../../data/components';
import * as styles from './ComponentsOverviewPage.css';

const total = numberedGroups.reduce((n, g) => n + g.items.length, 0);

export function ComponentsOverviewPage() {
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<string | null>(null);

  const needle = query.trim().toLowerCase();
  const shown = numberedGroups
    .filter((g) => !group || g.label === group)
    .map((g) => ({
      ...g,
      items: g.items.filter((c) => c.name.toLowerCase().includes(needle)),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <h1 className={`${t.display} ${styles.total}`}>
          <span className={styles.tag}>전체 컴포넌트</span>
          <span>
            {total}
            <span className={wall.count}>개</span>
          </span>
        </h1>
      </div>

      {shown.map((g) => (
        <section key={g.label} aria-labelledby={`group-${g.label}`}>
          <div className={wall.sectionHead}>
            <h2 id={`group-${g.label}`} className={wall.sectionTitle}>
              {g.label}
              <span className={wall.count} aria-hidden="true">
                [{g.items.length}]
              </span>
            </h2>
          </div>
          <div className={wall.bento}>
            {g.items.map((item) => (
              <FrameCard key={item.name} item={item} />
            ))}
          </div>
        </section>
      ))}

      {shown.length === 0 && (
        <p className={styles.empty} role="status">
          찾는 이름의 컴포넌트가 없습니다.
        </p>
      )}

      <div className={styles.dock} role="search">
        <input
          type="search"
          className={styles.search}
          placeholder="이름으로 찾기"
          aria-label="이름으로 찾기"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {numberedGroups.map((g) => (
          <Chip
            key={g.label}
            size="sm"
            label={g.label}
            selected={group === g.label}
            onClick={() => setGroup(group === g.label ? null : g.label)}
          />
        ))}
      </div>
    </div>
  );
}
