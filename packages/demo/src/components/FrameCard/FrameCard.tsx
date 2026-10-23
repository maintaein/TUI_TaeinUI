import { Link } from 'react-router-dom';
import { cardHeight, type ComponentInfo } from '../../data/components';
import { DEMOS } from './demos';
import { TOUCH_MINI } from './minis';
import * as styles from './FrameCard.css';

/** 열린 모습이 들어갈 만큼 키가 큰 카드 */
const OVERLAYS = new Set(['Modal', 'BottomSheet', 'SideSheet', 'Popover']);

const cx = (...c: (string | false | undefined)[]) =>
  c.filter(Boolean).join(' ');

export interface FrameCardProps {
  item: Pick<ComponentInfo, 'name' | 'path'> & { no: string };
  /** 칸 모양(tall, wideCard 같은 벽 클래스) */
  className?: string;
  /** 액자 안 흰 상자의 추가 클래스 */
  inner?: string;
  /** 손으로 만지는 정적 미니를 놓는다(소개). 아니면 그 상세 무대를 저절로 돌리고 만질 수는 없다(전체 컴포넌트) */
  touch?: boolean;
}

/** 진짜 core 컴포넌트 미니가 든 액자와 상세로 가는 이름 링크 */
export function FrameCard({ item, className, inner, touch }: FrameCardProps) {
  const Demo = DEMOS[item.name];
  const Touch = TOUCH_MINI[item.name];
  return (
    <div className={cx(styles.frame, className)}>
      {touch ? (
        <div className={cx(styles.frameInner, inner)}>
          <Touch />
        </div>
      ) : (
        <div
          className={cx(
            styles.frameInner,
            styles.cardInner,
            OVERLAYS.has(item.name) && styles.cardInnerTall,
            inner
          )}
          style={{ minHeight: cardHeight[item.name] }}
        >
          <Demo mini />
        </div>
      )}
      <div className={styles.frameFoot}>
        <Link className={styles.frameTitle} to={item.path}>
          {item.name}
        </Link>
        <span className={styles.no}>{item.no}</span>
      </div>
    </div>
  );
}
