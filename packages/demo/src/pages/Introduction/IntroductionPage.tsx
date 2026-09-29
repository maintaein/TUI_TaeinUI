import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  TextField,
  Card,
  Text,
  Badge,
  Switch,
  Chip,
} from '@taein-ui/core';
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
            <Text variant="h1" as="span" className={styles.heroTitleMain}>
              TUI
            </Text>
            <span className={styles.heroTitleSub}>TaeinUI</span>
          </h1>
          <p className={styles.heroDescription}>
            컴포넌트마다 다른 움직임을 갖는 React UI 컴포넌트 라이브러리입니다.
            <br />전 컴포넌트에 같은 전환 하나를 입히지 않는 대신,
            시인성·가독성· 가시성은 어디서도 낮추지 않습니다.
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
        <Text variant="h2" className={styles.sectionTitle}>
          TUI의 목표
        </Text>
        <div className={styles.goalList}>
          {/* 컴포넌트별 모션 */}
          <div className={styles.goalRow}>
            <div
              className={styles.goalIcon}
              style={{ backgroundColor: '#eff6ff' }}
              aria-hidden="true"
            >
              <Sparkles size={24} color="#2563eb" strokeWidth={2.5} />
            </div>
            <div className={styles.goalContent}>
              <h3 className={styles.goalTitle}>컴포넌트마다 다른 움직임</h3>
              <p className={styles.goalDescription}>
                전 컴포넌트에 같은 전환 하나를 입히지 않습니다.
                열림·전환·되먹임을 컴포넌트마다 따로 설계해, 어떤 컴포넌트를
                집어도 그 컴포넌트만의 움직임이 남게 합니다.
              </p>
              <ul className={styles.goalDetails}>
                <li className={styles.goalDetailItem}>
                  <strong>GSAP이 모션의 메인 런타임</strong> — 현재 12개
                  컴포넌트가 GSAP으로 움직입니다
                </li>
                <li className={styles.goalDetailItem}>
                  CSS로는 못 하는 일이 있는 자리에만 씁니다 — 트리거 좌표 읽기,
                  제스처 1:1 추적, 여러 목표를 동시에 중단
                </li>
                <li className={styles.goalDetailItem}>
                  나머지 컴포넌트는 CSS 트랜지션으로 둡니다. 쓸 수 있으니 쓰는
                  것이 아니라 GSAP만 할 수 있는 것을 GSAP이 합니다
                </li>
              </ul>
            </div>
          </div>

          {/* 시인성 */}
          <div className={styles.goalRow}>
            <div
              className={styles.goalIcon}
              style={{ backgroundColor: '#f0fdf4' }}
              aria-hidden="true"
            >
              <Eye size={24} color="#16a34a" strokeWidth={2.5} />
            </div>
            <div className={styles.goalContent}>
              <h3 className={styles.goalTitle}>
                시인성은 협상 대상이 아닙니다
              </h3>
              <p className={styles.goalDescription}>
                통일성을 내려놓는 범위는 모션까지입니다. 모션이 시인성·가독성·
                가시성 중 하나라도 깎으면 틀린 쪽은 모션입니다.
              </p>
              <ul className={styles.goalDetails}>
                <li className={styles.goalDetailItem}>
                  WCAG 2.2 AA — 본문 대비 4.5:1, 비텍스트 대비 3:1을 테스트로
                  잠가 두었습니다
                </li>
                <li className={styles.goalDetailItem}>
                  <strong>prefers-reduced-motion</strong> — CSS 전역 규칙이
                  트랜지션을 끄고, 규칙이 닿지 않는 GSAP 트윈은 끝 상태로 확정한
                  뒤 멈춥니다
                </li>
                <li className={styles.goalDetailItem}>
                  시맨틱 HTML, ARIA, 키보드 네비게이션, 오버레이 포커스 트랩
                </li>
              </ul>
            </div>
          </div>

          {/* AI 친화 */}
          <div className={styles.goalRow}>
            <div
              className={styles.goalIcon}
              style={{ backgroundColor: '#faf5ff' }}
              aria-hidden="true"
            >
              <Bot size={24} color="#7c3aed" strokeWidth={2} />
            </div>
            <div className={styles.goalContent}>
              <h3 className={styles.goalTitle}>AI 친화</h3>
              <p className={styles.goalDescription}>
                작은 API 범위와 구조화된 문서로 생성형 AI가 컴포넌트 사용법을 더
                안정적으로 참조할 수 있게 합니다.
              </p>
              <ul className={styles.goalDetails}>
                <li className={styles.goalDetailItem}>
                  <strong>llms.txt</strong> — AI 도구(Cursor, Context7 등)가
                  읽을 수 있는 구조화된 API 문서를 제공합니다
                </li>
                <li className={styles.goalDetailItem}>
                  <strong>JSDoc 주석</strong> — Props 인터페이스에 설명을
                  제공하여 타입 정보와 사용 의도를 함께 전달합니다
                </li>
                <li className={styles.goalDetailItem}>
                  <strong>일관된 API</strong> — 주요 컴포넌트가 공통 네이밍과
                  조합 패턴을 공유하므로 AI가 API 구조를 더 쉽게 예측할 수
                  있습니다
                </li>
                <li className={styles.goalDetailItem}>
                  <strong>TypeScript 기반</strong> — Props 타입을 명확히 제공해
                  잘못된 조합을 줄이고 자동완성 경험을 개선합니다
                </li>
              </ul>
            </div>
          </div>

          {/* 경량 번들 */}
          <div className={styles.goalRow}>
            <div
              className={styles.goalIcon}
              style={{ backgroundColor: '#fefce8' }}
              aria-hidden="true"
            >
              <Package size={24} color="#ca8a04" strokeWidth={2} />
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
        <Text variant="h2" className={styles.sectionTitle}>
          빠른 미리보기
        </Text>
        <p className={styles.sectionDescription}>
          직접 눌러 보세요. 아래 Switch는 GSAP으로, Button과 Chip은 CSS
          트랜지션으로 움직입니다 — 같은 화면 안에서도 서로 다른 손맛을
          갖습니다.
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
        <Text variant="h2" className={styles.sectionTitle}>
          다음 단계
        </Text>
        <div className={styles.nextStepsGrid}>
          <Card
            variant="interactive"
            accentColor="#2563eb"
            onClick={() => navigate('/getting-started')}
            className={styles.nextStepCard}
          >
            <Card.Body padding="lg">
              <div className={styles.nextStepIcon} aria-hidden="true">
                <ArrowRight size={32} color="#2563eb" strokeWidth={2.5} />
              </div>
              <h3 className={styles.nextStepTitle}>시작하기</h3>
              <p className={styles.nextStepDescription}>
                TUI를 프로젝트에 설치하고 사용하는 방법을 알아보세요.
              </p>
              <div className={styles.nextStepArrow}>&rarr;</div>
            </Card.Body>
          </Card>
          <Card
            variant="interactive"
            accentColor="#2563eb"
            onClick={() => navigate('/components/overview')}
            className={styles.nextStepCard}
          >
            <Card.Body padding="lg">
              <div className={styles.nextStepIcon} aria-hidden="true">
                <LayoutGrid size={32} color="#2563eb" strokeWidth={2} />
              </div>
              <h3 className={styles.nextStepTitle}>컴포넌트</h3>
              <p className={styles.nextStepDescription}>
                컴포넌트 패밀리 30개(top-level export 49개)와 사용 예시를
                확인하세요.
              </p>
              <div className={styles.nextStepArrow}>&rarr;</div>
            </Card.Body>
          </Card>
          <Card
            variant="interactive"
            accentColor="#2563eb"
            onClick={() => navigate('/components/bottom-sheet')}
            className={styles.nextStepCard}
          >
            <Card.Body padding="lg">
              <div className={styles.nextStepIcon} aria-hidden="true">
                <Sparkles size={32} color="#2563eb" strokeWidth={2} />
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
