import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@taein-ui/core';
import { ComponentShowcase } from '../../components/ComponentShowcase';
import * as t from '../../components/DocText';
import { FrameCard } from '../../components/FrameCard';
import * as wall from '../../components/FrameCard/FrameCard.css';
import { numberedGroups } from '../../data/components';
import { InstallChip } from './InstallChip';
import * as styles from './IntroductionPage.css';

const cx = (...c: (string | false | undefined)[]) =>
  c.filter(Boolean).join(' ');

const items = numberedGroups.flatMap((g) => g.items);
const pick = (name: string) => items.find((c) => c.name === name)!;

export function IntroductionPage() {
  const navigate = useNavigate();

  return (
    <>
      <section className={styles.hero}>
        {/* 이름은 아래 h1이 말한다. 로고는 장식이다 */}
        <img
          src="/images/TUIlogo.webp"
          alt=""
          width={1362}
          height={1155}
          className={styles.logo}
          fetchPriority="high"
          decoding="async"
        />
        <h1 className={cx(t.display, styles.title)}>TAEIN UI</h1>
        <p className={cx(t.lead, t.muted, styles.desc)}>
          재미있는 모션과 인터랙티브한 효과를 추구한 React UI 컴포넌트
          라이브러리. 느낌있고 멋진 웹사이트를 만들어 보고 싶으신가요? TaeinUI가
          무료로 해결해 드립니다.
        </p>
        <div className={styles.actions}>
          <InstallChip command="pnpm add @taein-ui/core" />
          <Button size="lg" onClick={() => navigate('/getting-started')}>
            시작하기
          </Button>
          <Button
            size="lg"
            buttonStyle="weak"
            onClick={() => navigate('/components/overview')}
          >
            컴포넌트 보기
          </Button>
        </div>
      </section>

      <div className={styles.wide}>
        <div className={wall.frame}>
          <div className={cx(wall.frameInner, styles.showcase)}>
            <div className={styles.fill}>
              <ComponentShowcase />
            </div>
          </div>
        </div>

        <div className={wall.sectionHead}>
          <h2 className={wall.sectionTitle}>
            먼저 만져 볼 것
            <span className={wall.count} aria-hidden="true">
              [6]
            </span>
          </h2>
          <span className={t.label}>움직임이 가장 잘 보이는 여섯</span>
        </div>
        <div className={wall.bento}>
          <FrameCard
            touch
            item={pick('Switch')}
            className={wall.tall}
            inner={wall.tallInner}
          />
          <FrameCard
            touch
            item={pick('SegmentedButtons')}
            className={wall.wideCard}
          />
          <FrameCard touch item={pick('Slider')} />
          <FrameCard touch item={pick('Chip')} />
          <FrameCard touch item={pick('Loader')} />
          <FrameCard touch item={pick('Button')} className={wall.wideCard} />
        </div>
        <div className={styles.more}>
          <Link className={styles.moreLink} to="/components/overview">
            컴포넌트 전부 보기 →
          </Link>
        </div>
      </div>
    </>
  );
}
