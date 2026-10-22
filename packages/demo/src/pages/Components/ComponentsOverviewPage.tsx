import { useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { Button, Chip } from '@taein-ui/core';
import * as t from '../../components/DocText';
import { FrameCard } from '../../components/FrameCard';
import * as wall from '../../components/FrameCard/FrameCard.css';
import { MiniFrozen } from '../../components/Stage';
import { cardCell, numberedGroups } from '../../data/components';
import * as styles from './ComponentsOverviewPage.css';

const wideOf = {
  wide: wall.wideCard,
  wide3: wall.wide3Card,
  wide2: wall.wide2Card,
};

// 칸 표(data)를 FrameCard의 칸 클래스로 옮긴다
const cellOf = (name: string) => {
  const kind = cardCell[name];
  if (kind === 'tall') return { className: wall.tall, inner: wall.tallInner };
  return { className: kind && wideOf[kind] };
};

const total = numberedGroups.reduce((n, g) => n + g.items.length, 0);

export function ComponentsOverviewPage() {
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<string | null>(null);
  // 카드 미니 스물다섯이 저절로 움직이므로, 한꺼번에 멈출 길을 둔다(WCAG 2.2.2)
  const [frozen, setFrozen] = useState(false);

  const needle = query.trim().toLowerCase();
  const shown = numberedGroups
    .filter((g) => !group || g.label === group)
    .map((g) => ({
      ...g,
      items: g.items.filter((c) => c.name.toLowerCase().includes(needle)),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <MiniFrozen.Provider value={frozen}>
      <div className={styles.page}>
        <div className={styles.head}>
          <h1 className={`${t.display} ${styles.total}`}>컴포넌트 {total}개</h1>
          <Button
            size="sm"
            variant="light"
            aria-pressed={frozen}
            leftIcon={frozen ? <Play /> : <Pause />}
            onClick={() => setFrozen(!frozen)}
          >
            {/* aria-pressed 토글은 이름을 고정하고 눌림 상태로 말한다(APG). 아이콘만 바뀐다 */}
            움직임 멈춤
          </Button>
        </div>

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
                <FrameCard key={item.name} item={item} {...cellOf(item.name)} />
              ))}
            </div>
          </section>
        ))}

        {shown.length === 0 && (
          <p className={styles.empty} role="status">
            찾는 이름의 컴포넌트가 없습니다.
          </p>
        )}
      </div>
    </MiniFrozen.Provider>
  );
}
