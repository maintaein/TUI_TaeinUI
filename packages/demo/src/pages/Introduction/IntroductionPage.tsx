import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, TextField, Card, Badge, Switch, Chip } from '@taein-ui/core';
import {
  Sparkles,
  Eye,
  Bot,
  Package,
  ArrowRight,
  LayoutGrid,
} from 'lucide-react';
import { LivePreview } from '../../components/LivePreview';
import * as styles from './IntroductionPage.css';

export function IntroductionPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');

  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            <span className={styles.heroTitleMain}>TUI</span>
            <span className={styles.heroTitleSub}>TaeinUI</span>
          </h1>
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
        </div>
      </section>

      {/* Hero Image
      <div className={styles.heroImageWrapper}>
        <img
          src="/images/TDS.png"
          alt="TUI TaeinUI"
          className={styles.heroImage}
        />
      </div> */}

      {/* TUI goal */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>TUI의 목표</h2>
        <div className={styles.goalList}>
          {/* 컴포넌트별 모션 */}
          <div className={styles.goalRow}>
            <div className={styles.goalIcon} aria-hidden="true">
              <Sparkles size={24} />
            </div>
            <div className={styles.goalContent}>
              <h3 className={styles.goalTitle}>모션과 인터랙션</h3>
              <p className={styles.goalDescription}>
                모션과 인터랙션을 컴포넌트 단위로 설계했습니다.
              </p>
              <ul className={styles.goalDetails}>
                <li className={styles.goalDetailItem}>
                  컴포넌트마다 기본적인 기능과 접근성은 지키면서도 특징을 살릴
                  수 있게하여, 어떤 컴포넌트를 활용해도 인상적인 경험을 제공할
                  수 있습니다.
                </li>
                <li className={styles.goalDetailItem}>
                  <strong>GSAP기반 모션 구현</strong>
                  컴포넌트가 GSAP으로 움직입니다
                </li>
                <li className={styles.goalDetailItem}>
                  ㄴ 트리거 좌표 읽기, 제스처 1:1 추적, 여러 목표를 동시에 중단
                  등
                </li>
                <li className={styles.goalDetailItem}>
                  오버 엔지니어링을 방지하기 위해 CSS 트랜지션으로 구현 가능한
                  모션은 CSS 트랜지션으로 구현했습니다.
                </li>
              </ul>
            </div>
          </div>

          {/* 디자인 토큰 */}
          <div className={styles.goalRow}>
            <div className={styles.goalIcon} aria-hidden="true">
              <Eye size={24} />
            </div>
            <div className={styles.goalContent}>
              <h3 className={styles.goalTitle}>디자인 토큰</h3>
              <p className={styles.goalDescription}>
                컴포넌트의 색상, 폰트, 간격, 그림자 등은 디자인 토큰으로
                관리됩니다.
              </p>
              <ul className={styles.goalDetails}>
                <li className={styles.goalDetailItem}>
                  이를 통해 테마 변경이나 스타일 조정이 용이하며, 다양한 디자인
                  요구사항에 유연하게 대응할 수 있습니다.
                </li>
                <li className={styles.goalDetailItem}>
                  모션은 컴포넌트마다 다르게 가져가지만 대비와 가독성은 직접
                  조정할 수 있게 했습니다.
                </li>
              </ul>
            </div>
          </div>

          {/* AI 친화 */}
          <div className={styles.goalRow}>
            <div className={styles.goalIcon} aria-hidden="true">
              <Bot size={24} />
            </div>
            <div className={styles.goalContent}>
              <h3 className={styles.goalTitle}>AI 친화</h3>
              <p className={styles.goalDescription}>
                AI 도구가 컴포넌트 API를 쉽게 이해하고 활용할 수 있도록
                설계했습니다.
              </p>
              <ul className={styles.goalDetails}>
                <li className={styles.goalDetailItem}>
                  <strong>llms.txt</strong> : AI 도구(Claude, Codex, Context7
                  등)가 읽을 수 있는 구조화된 API 문서를 제공합니다
                </li>
                <li className={styles.goalDetailItem}>
                  <strong>JSDoc 주석</strong> : Props 인터페이스에 설명을
                  제공하여 타입 정보와 사용 의도를 함께 전달합니다
                </li>
                <li className={styles.goalDetailItem}>
                  <strong>TypeScript 기반</strong> : Props 타입을 명확히 제공해
                  AI가 임의로 구현하는 행위를 줄이고 타입 오류를 개선합니다
                </li>
              </ul>
            </div>
          </div>

          {/* 경량 번들 */}
          <div className={styles.goalRow}>
            <div className={styles.goalIcon} aria-hidden="true">
              <Package size={24} />
            </div>
            <div className={styles.goalContent}>
              <h3 className={styles.goalTitle}>정적 CSS와 분리된 모듈</h3>
              <p className={styles.goalDescription}>
                런타임 스타일 엔진보다 단순한 배포 구조를 지향하며, 스타일은
                빌드 시점에 CSS 파일로 제공합니다.
              </p>
              <ul className={styles.goalDetails}>
                <li className={styles.goalDetailItem}>
                  peer dependency는 React와 ReactDOM이고, 런타임 의존성은
                  vanilla-extract(css·recipes), clsx, gsap 넷입니다
                </li>
                <li className={styles.goalDetailItem}>
                  Vanilla Extract로 컴포넌트 스타일을 정적 CSS로 생성합니다
                </li>
                <li className={styles.goalDetailItem}>
                  JS 모듈은 컴포넌트 단위로 분리되어 소비자 번들러의
                  tree-shaking에 유리합니다
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Preview */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>빠른 미리보기</h2>
        <p className={styles.sectionDescription}>
          직접 눌러 보세요. 같은 화면 안에서도 컴포넌트마다 움직임이 다릅니다 —
          GSAP이어야 하는 자리는 GSAP이, 그렇지 않은 자리는 CSS 트랜지션이
          맡습니다.
        </p>
        <div className={styles.preview}>
          <LivePreview
            code={`import { Button, TextField, Card, Badge, Switch, Chip } from '@taein-ui/core';

function Example() {
  const [email, setEmail] = useState('');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <Button variant="primary">Primary</Button>
        <Button variant="dark">Dark</Button>
        <Button variant="light">Light</Button>
        <Badge variant="primary">New</Badge>
        <Chip label="React" />
      </div>

      <TextField
        label="이메일"
        placeholder="example@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Switch label="알림 받기" />
      </div>
    </div>
  );
}`}
            language="tsx"
            title="컴포넌트 조합 예시"
            description="Button, TextField, Badge, Switch 등을 조합한 간단한 UI"
            padding="lg"
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                }}
              >
                <Button variant="primary">Primary</Button>
                <Button variant="dark">Dark</Button>
                <Button variant="light">Light</Button>
                <Badge variant="primary">New</Badge>
                <Chip label="React" />
              </div>

              <TextField
                label="이메일"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <div
                style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}
              >
                <Switch label="알림 받기" />
              </div>
            </div>
          </LivePreview>
        </div>
      </section>

      {/* Next Steps */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>다음 단계</h2>
        <div className={styles.nextStepsGrid}>
          <Card
            variant="outlined"
            hoverLift
            onClick={() => navigate('/getting-started')}
            className={styles.nextStepCard}
          >
            <Card.Body padding="lg">
              <div className={styles.nextStepIcon} aria-hidden="true">
                <ArrowRight size={32} />
              </div>
              <h3 className={styles.nextStepTitle}>시작하기</h3>
              <p className={styles.nextStepDescription}>
                TUI를 프로젝트에 설치하고 사용하는 방법을 알아보세요.
              </p>
              <div className={styles.nextStepArrow}>&rarr;</div>
            </Card.Body>
          </Card>
          <Card
            variant="outlined"
            hoverLift
            onClick={() => navigate('/components/overview')}
            className={styles.nextStepCard}
          >
            <Card.Body padding="lg">
              <div className={styles.nextStepIcon} aria-hidden="true">
                <LayoutGrid size={32} />
              </div>
              <h3 className={styles.nextStepTitle}>컴포넌트</h3>
              <p className={styles.nextStepDescription}>
                컴포넌트 패밀리 25개(top-level export 33개)와 사용 예시를
                확인하세요.
              </p>
              <div className={styles.nextStepArrow}>&rarr;</div>
            </Card.Body>
          </Card>
          <Card
            variant="outlined"
            hoverLift
            onClick={() => navigate('/components/bottom-sheet')}
            className={styles.nextStepCard}
          >
            <Card.Body padding="lg">
              <div className={styles.nextStepIcon} aria-hidden="true">
                <Sparkles size={32} />
              </div>
              <h3 className={styles.nextStepTitle}>모션 만져보기</h3>
              <p className={styles.nextStepDescription}>
                BottomSheet를 드래그해 보세요. GSAP이 손가락을 1:1로 따라오는
                컴포넌트입니다.
              </p>
              <div className={styles.nextStepArrow}>&rarr;</div>
            </Card.Body>
          </Card>
        </div>
      </section>
    </div>
  );
}
