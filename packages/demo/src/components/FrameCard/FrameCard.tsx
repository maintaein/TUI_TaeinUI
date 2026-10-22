import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { ComponentInfo } from '../../data/components';
import { MINI, OVERLAYS } from './minis';
import * as styles from './FrameCard.css';

const cx = (...c: (string | false | undefined)[]) =>
  c.filter(Boolean).join(' ');

export interface FrameCardProps {
  item: Pick<ComponentInfo, 'name' | 'path'> & { no: string };
  /** 칸 모양(tall, wideCard 같은 벽 클래스) */
  className?: string;
  /** 액자 안 흰 상자의 추가 클래스 */
  inner?: string;
  /** 미니를 만져 볼 수 있게 한다. 아니면 보기 전용(inert)이라 포커스·클릭이 들어가지 않는다 */
  touch?: boolean;
}

/** 진짜 core 컴포넌트 미니가 든 액자와 상세로 가는 이름 링크 */
export function FrameCard({ item, className, inner, touch }: FrameCardProps) {
  // 오버레이가 그려질 상자. 상자가 붙은 다음 렌더부터 오버레이가 켜진다
  const [box, setBox] = useState<HTMLDivElement | null>(null);
  const Mini = MINI[item.name];
  return (
    <div className={cx(styles.frame, className)}>
      <div
        ref={setBox}
        className={cx(
          styles.frameInner,
          styles.cardInner,
          OVERLAYS.has(item.name) && styles.cardInnerTall,
          inner
        )}
        inert={!touch}
      >
        <Mini box={box} />
      </div>
      <div className={styles.frameFoot}>
        <Link className={styles.frameTitle} to={item.path}>
          {item.name}
        </Link>
        <span className={styles.no}>{item.no}</span>
      </div>
    </div>
  );
}
