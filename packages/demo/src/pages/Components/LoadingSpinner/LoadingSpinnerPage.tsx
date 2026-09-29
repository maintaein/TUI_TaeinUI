import { Card, List, ListItem } from '@taein-ui/core';
import { LivePreview } from '../../../components/LivePreview';
import { CodeBlock } from '../../../components/CodeBlock';
import { PropsTable } from '../../../components/PropsTable';
import type { PropDefinition } from '../../../components/PropsTable/PropsTable';
import { AccessibilitySection } from '../../../components/AccessibilitySection';
import * as styles from './LoadingSpinnerPage.css';

export function LoadingSpinnerPage() {
  const propsData: PropDefinition[] = [
    {
      name: 'type',
      type: "'spinner' | 'dots'",
      default: "'spinner'",
      description:
        '로딩 표시 타입. spinner는 회전 원형, dots는 점 3개 애니메이션',
    },
    {
      name: 'size',
      type: "'sm' | 'md' | 'lg' | 'xl'",
      default: "'md'",
      description: '크기 (sm:16px, md:24px, lg:32px, xl:48px)',
    },
    {
      name: 'color',
      type: 'string',
      default: 'primary[600]',
      description: '스피너 색상. CSS 색상 값을 직접 지정합니다.',
    },
    {
      name: 'aria-label',
      type: 'string',
      default: "'로딩 중'",
      description: '스크린 리더에 전달할 레이블',
    },
  ];

  return (
    <article className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>LoadingSpinner</h1>
        <p className={styles.description}>
          LoadingSpinner 컴포넌트는 버튼, 카드 등 작은 영역 안에 로딩
          인디케이터를 넣을 때 사용합니다.
        </p>
      </header>

      {/* Quick Reference */}
      <section className={styles.quickReference}>
        <Card className={styles.quickRefCard}>
          <Card.Body padding="md">
            <h3 className={styles.quickRefTitle}>Import</h3>
            <CodeBlock
              language="typescript"
              code={`import { LoadingSpinner } from '@taein-ui/core';`}
            />
          </Card.Body>
        </Card>
        <Card className={styles.quickRefCard}>
          <Card.Body padding="md">
            <h3 className={styles.quickRefTitle}>Basic Usage</h3>
            <CodeBlock
              language="tsx"
              code={`<LoadingSpinner />
<LoadingSpinner type="dots" />`}
            />
          </Card.Body>
        </Card>
      </section>

      {/* Examples */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Examples</h2>
          <p className={styles.sectionDescription}>
            다양한 사용 사례에 맞는 LoadingSpinner 예제입니다.
          </p>
        </div>

        {/* Type */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Type</h3>
          <LivePreview
            title="스피너 타입"
            description="spinner는 회전하는 원형 인디케이터, dots는 점 3개가 순차적으로 깜빡이는 애니메이션입니다."
            editable
            code={`<div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
  <div style={{ textAlign: 'center' }}>
    <LoadingSpinner type="spinner" />
    <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>spinner</p>
  </div>
  <div style={{ textAlign: 'center' }}>
    <LoadingSpinner type="dots" />
    <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>dots</p>
  </div>
</div>`}
          />
        </div>

        {/* Sizes */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Sizes</h3>
          <LivePreview
            title="크기 옵션"
            description="sm(16px), md(24px), lg(32px), xl(48px) 네 가지 크기를 제공합니다."
            editable
            code={`<div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
  <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
    <div style={{ textAlign: 'center' }}>
      <LoadingSpinner size="sm" />
      <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#6b7280' }}>sm</p>
    </div>
    <div style={{ textAlign: 'center' }}>
      <LoadingSpinner size="md" />
      <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#6b7280' }}>md</p>
    </div>
    <div style={{ textAlign: 'center' }}>
      <LoadingSpinner size="lg" />
      <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#6b7280' }}>lg</p>
    </div>
    <div style={{ textAlign: 'center' }}>
      <LoadingSpinner size="xl" />
      <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#6b7280' }}>xl</p>
    </div>
  </div>
  <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
    <div style={{ textAlign: 'center' }}>
      <LoadingSpinner type="dots" size="sm" />
      <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#6b7280' }}>sm</p>
    </div>
    <div style={{ textAlign: 'center' }}>
      <LoadingSpinner type="dots" size="md" />
      <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#6b7280' }}>md</p>
    </div>
    <div style={{ textAlign: 'center' }}>
      <LoadingSpinner type="dots" size="lg" />
      <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#6b7280' }}>lg</p>
    </div>
    <div style={{ textAlign: 'center' }}>
      <LoadingSpinner type="dots" size="xl" />
      <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#6b7280' }}>xl</p>
    </div>
  </div>
</div>`}
          />
        </div>

        {/* Custom Color */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Custom Color</h3>
          <LivePreview
            title="커스텀 색상"
            description="color prop으로 스피너 색상을 자유롭게 지정할 수 있습니다."
            editable
            code={`<div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
  <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
    <LoadingSpinner color="#8b5cf6" />
    <LoadingSpinner color="#059669" />
    <LoadingSpinner color="#ea580c" />
    <LoadingSpinner color="#dc2626" />
    <LoadingSpinner color="#0ea5e9" />
  </div>
  <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
    <LoadingSpinner type="dots" color="#8b5cf6" />
    <LoadingSpinner type="dots" color="#059669" />
    <LoadingSpinner type="dots" color="#ea580c" />
    <LoadingSpinner type="dots" color="#dc2626" />
    <LoadingSpinner type="dots" color="#0ea5e9" />
  </div>
</div>`}
          />
        </div>

        {/* Dark Background */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>어두운 배경에서 사용</h3>
          <LivePreview
            title="Dark Background"
            description="어두운 배경에서는 밝은 색상을 지정하여 가시성을 확보합니다."
            editable
            code={`<div style={{ display: 'flex', gap: '2rem', alignItems: 'center', backgroundColor: '#1f2937', padding: '2rem', borderRadius: '0.75rem' }}>
  <LoadingSpinner color="#ffffff" />
  <LoadingSpinner color="#f59e0b" />
  <LoadingSpinner type="dots" color="#ffffff" />
  <LoadingSpinner type="dots" color="#f59e0b" />
</div>`}
          />
        </div>

        {/* 인라인 사용 */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>인라인 사용</h3>
          <LivePreview
            title="텍스트/버튼과 함께"
            description="LoadingSpinner는 inline-flex로 렌더링되어 텍스트나 버튼 옆에 자연스럽게 배치됩니다."
            editable
            code={`<div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
    <LoadingSpinner size="sm" />
    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>데이터를 불러오는 중...</span>
  </div>
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
    <LoadingSpinner type="dots" size="sm" />
    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>처리 중입니다</span>
  </div>
</div>`}
          />
        </div>

        {/* 전체 화면 로딩 */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>전체 화면 로딩 패턴</h3>
          <LivePreview
            title="Fullscreen Loading"
            description="화면 전체를 덮는 로딩 오버레이 패턴입니다. 실제로는 position: fixed를 사용합니다."
            editable
            code={`<div style={{ position: 'relative', height: '200px', backgroundColor: '#f9fafb', borderRadius: '0.75rem', overflow: 'hidden' }}>
  <div style={{ padding: '1rem' }}>
    <p style={{ color: '#9ca3af' }}>이 영역은 로딩 중입니다...</p>
  </div>
  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.8)', gap: '1rem' }}>
    <LoadingSpinner size="xl" />
    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>로딩 중...</span>
  </div>
</div>`}
          />
        </div>

        {/* 조건부 렌더링 */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>조건부 렌더링</h3>
          <LivePreview
            title="로딩 토글"
            description="버튼 클릭으로 로딩 상태를 토글하는 실전 패턴입니다."
            editable
            code={`const [loading, setLoading] = useState(false);
const handleLoad = () => {
  setLoading(true);
  setTimeout(() => setLoading(false), 2000);
};

<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
  <Button size="sm" onClick={handleLoad} disabled={loading}>
    {loading ? '로딩 중...' : '데이터 불러오기'}
  </Button>
  <div style={{ minHeight: '48px', display: 'flex', alignItems: 'center' }}>
    {loading ? (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <LoadingSpinner size="sm" />
        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>불러오는 중...</span>
      </div>
    ) : (
      <span style={{ fontSize: '0.875rem', color: '#10b981' }}>준비 완료</span>
    )}
  </div>
</div>`}
          />
        </div>
      </section>

      {/* Props API */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Props API</h2>
          <p className={styles.sectionDescription}>
            LoadingSpinner 컴포넌트의 모든 Props와 타입 정보입니다. HTML div
            속성도 모두 사용 가능합니다.
          </p>
        </div>
        <div className={styles.propsTableWrapper}>
          <PropsTable props={propsData} />
        </div>
      </section>

      {/* Accessibility */}
      <AccessibilitySection
        componentName="LoadingSpinner"
        intro="LoadingSpinner는 role='status'와 aria-live='polite'를 기본 제공하여 스크린 리더 사용자에게 로딩 상태를 자동으로 알립니다."
        features={[
          {
            attribute: 'role="status"',
            effect: '상태 정보를 전달합니다.',
            description:
              '스크린 리더가 해당 영역을 상태 표시 영역으로 인식합니다.',
          },
          {
            attribute: 'aria-live="polite"',
            effect: '변경 시 스크린 리더에 알립니다.',
            description:
              '로딩 스피너가 나타나거나 사라질 때 스크린 리더가 polite 우선순위로 변경 사항을 읽어줍니다.',
          },
          {
            attribute: 'aria-label',
            effect: '로딩 상태를 설명합니다.',
            description:
              '기본값 "로딩 중"이 설정되어 있으며, 맥락에 맞게 커스텀할 수 있습니다.',
          },
        ]}
        additionalGuidance={[
          {
            title: '맥락에 맞는 aria-label 제공',
            description:
              '어떤 데이터를 로딩 중인지 구체적으로 설명하면 스크린 리더 사용자에게 더 유용합니다.',
            examples: [
              {
                code: `// Good — 구체적인 설명
<LoadingSpinner aria-label="주문 목록을 불러오는 중" />
<LoadingSpinner aria-label="이미지 업로드 중" />

// Bad — 기본값만 사용
<LoadingSpinner />  // "로딩 중"만 전달`,
                explanation:
                  '사용자가 무엇을 기다리고 있는지 알 수 있도록 구체적인 레이블을 제공하세요.',
              },
            ],
          },
        ]}
      />

      {/* Best Practices */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Best Practices</h2>
          <p className={styles.sectionDescription}>
            LoadingSpinner를 효과적으로 사용하기 위한 권장사항입니다.
          </p>
        </div>

        <div className={styles.practicesGrid}>
          <Card>
            <Card.Body padding="lg">
              <div className={styles.practiceHeader}>
                <span className={styles.practiceIcon}>✓</span>
                <h3 className={styles.practiceTitle}>Do</h3>
              </div>
              <List spacing="sm" className={styles.practiceList}>
                <ListItem>
                  맥락에 맞는 aria-label 제공 (예: "주문 목록 로딩 중")
                </ListItem>
                <ListItem>
                  인라인 사용 시 sm 크기, 전체 화면 로딩 시 lg/xl 크기 사용
                </ListItem>
                <ListItem>로딩 텍스트와 함께 배치하여 의미 전달</ListItem>
                <ListItem>버튼 내부 로딩은 Button의 loading prop 사용</ListItem>
                <ListItem>어두운 배경에서는 밝은 color 지정</ListItem>
              </List>
            </Card.Body>
          </Card>

          <Card>
            <Card.Body padding="lg">
              <div className={styles.practiceHeader}>
                <span className={styles.practiceIconError}>✗</span>
                <h3 className={styles.practiceTitle}>Don't</h3>
              </div>
              <List spacing="sm" className={styles.practiceList}>
                <ListItem>한 화면에 여러 개의 스피너를 동시에 표시</ListItem>
                <ListItem>
                  짧은 작업(100ms 이하)에 스피너 표시 (깜빡임 유발)
                </ListItem>
                <ListItem>로딩 완료 후 스피너를 화면에 남겨두기</ListItem>
                <ListItem>
                  스피너만 표시하고 무엇을 로딩 중인지 안내하지 않기
                </ListItem>
                <ListItem>
                  진행률을 알 수 있는 작업에 스피너 사용 (Loader 사용 권장)
                </ListItem>
              </List>
            </Card.Body>
          </Card>
        </div>

        <Card style={{ marginTop: '1.5rem' }}>
          <Card.Body padding="lg">
            <div className={styles.practiceHeader}>
              <h3 className={styles.practiceTitle}>Loader와의 관계</h3>
            </div>
            <p
              style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                lineHeight: 1.6,
                marginBottom: '0.75rem',
              }}
            >
              LoadingSpinner는 순수한 애니메이션 프리미티브입니다. Loader
              컴포넌트는 내부적으로 LoadingSpinner를 사용하면서 라벨, 오버레이,
              전체 화면, 프로그레스 바 등 앱 수준의 기능을 추가한 고수준
              래퍼입니다.
            </p>
            <List spacing="sm" className={styles.practiceList}>
              <ListItem>
                커스텀 레이아웃이나 임의의 CSS 색상이 필요하면 LoadingSpinner
              </ListItem>
              <ListItem>
                label, overlay, fullScreen 같은 기능이 필요하면 Loader
              </ListItem>
            </List>
          </Card.Body>
        </Card>
      </section>
    </article>
  );
}
