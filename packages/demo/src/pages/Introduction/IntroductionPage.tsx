import { useNavigate } from 'react-router-dom';
import { Button } from '@taein-ui/core';
import { ComponentShowcase } from '../../components/ComponentShowcase';
import * as styles from './IntroductionPage.css';

export function IntroductionPage() {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <h1 className={styles.logo}>
        <img
          src="/images/TUIlogo.webp"
          alt="TUI"
          width={1362}
          height={1155}
          className={styles.logoImage}
          fetchPriority="high"
          decoding="async"
        />
        <span className={styles.logoText}>Taein UI</span>
      </h1>

      <div className={styles.showcaseSlot}>
        <ComponentShowcase />
      </div>

      <section className={styles.intro}>
        <p className={styles.heroDescription}>
          재미있는 모션과 인터랙티브한 효과를 추구한 React UI 컴포넌트
          라이브러리.
          <br /> 느낌있고 멋진 웹사이트를 만들어 보고 싶으신가요? TaeinUI가
          무료로 해결해 드립니다.
        </p>
        <div className={styles.heroActions}>
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/getting-started')}
          >
            시작하기
          </Button>
          <Button
            variant="light"
            size="lg"
            onClick={() => navigate('/components/overview')}
          >
            컴포넌트 보기
          </Button>
        </div>
      </section>
    </div>
  );
}
