import { useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { Button } from '@taein-ui/core';
import * as t from '../../components/DocText';
import { FrameCard } from '../../components/FrameCard';
import * as wall from '../../components/FrameCard/FrameCard.css';
import { MiniFrozen } from '../../components/Stage';
import { numberedMotionGroups } from '../../data/components';
import * as styles from '../Components/ComponentsOverviewPage.css';

const total = numberedMotionGroups.reduce((n, g) => n + g.items.length, 0);

// 한글 조립은 커서 효과가 아니라 화면에 들어올 때 재생되는 효과라, 터치와 좁은 화면에서도 같이 재생된다.
export function MotionOverviewPage() {
  // 카드 미니가 저절로 움직이므로 한꺼번에 멈출 길을 둔다(WCAG 2.2.2)
  const [frozen, setFrozen] = useState(false);

  return (
    <MiniFrozen.Provider value={frozen}>
      <div className={styles.page}>
        <div className={styles.head}>
          <h1 className={`${t.display} ${styles.total}`}>모션 {total}개</h1>
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

        {/* 분류가 둘이 되면 UI 쪽 칩 줄과 시험을 함께 더한다 */}
        {numberedMotionGroups.map((g) => (
          <section
            key={g.label}
            className={styles.cardGroup}
            aria-labelledby={`motion-${g.label.replace(/\s/g, '-')}`}
          >
            <div className={wall.sectionHead}>
              <h2
                id={`motion-${g.label.replace(/\s/g, '-')}`}
                className={wall.sectionTitle}
              >
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
      </div>
    </MiniFrozen.Provider>
  );
}
