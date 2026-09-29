import { Card, List, ListItem } from '@taein-ui/core';
import { LivePreview } from '../../../components/LivePreview';
import { CodeBlock } from '../../../components/CodeBlock';
import { PropsTable } from '../../../components/PropsTable';
import type { PropDefinition } from '../../../components/PropsTable/PropsTable';
import { AccessibilitySection } from '../../../components/AccessibilitySection';
import * as styles from './SkeletonPage.css';

export function SkeletonPage() {
  const propsData: PropDefinition[] = [
    {
      name: 'variant',
      type: "'text' | 'rect' | 'circle' | 'rounded'",
      default: "'text'",
      description: '스켈레톤 형태 (텍스트, 사각형, 원형, 둥근 사각형)',
    },
    {
      name: 'animation',
      type: "'wave' | 'pulse' | false",
      default: "'wave'",
      description:
        '애니메이션 타입 (wave: 빛 흐름, pulse: 깜빡임, false: 없음)',
    },
    {
      name: 'width',
      type: 'number | string',
      description: '너비 (숫자는 px, 문자열은 그대로 적용)',
    },
    {
      name: 'height',
      type: 'number | string',
      description: '높이 (숫자는 px, 문자열은 그대로 적용)',
    },
    {
      name: 'aria-label',
      type: 'string',
      default: "'콘텐츠 로딩 중'",
      description: '접근성 레이블',
    },
    {
      name: 'className',
      type: 'string',
      description: '추가 CSS 클래스',
    },
  ];

  return (
    <article className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>Skeleton</h1>
        <p className={styles.description}>
          Skeleton 컴포넌트는 콘텐츠가 로딩되기 전에 레이아웃 윤곽을 미리 보여줄
          때 사용합니다. 사용자에게 화면이 곧 채워질 것임을 알려줍니다.
        </p>
      </header>

      {/* Quick Reference */}
      <section className={styles.quickReference}>
        <Card className={styles.quickRefCard}>
          <Card.Body padding="md">
            <h3 className={styles.quickRefTitle}>Import</h3>
            <CodeBlock
              language="typescript"
              code={`import { Skeleton } from '@taein-ui/core';`}
            />
          </Card.Body>
        </Card>
        <Card className={styles.quickRefCard}>
          <Card.Body padding="md">
            <h3 className={styles.quickRefTitle}>Text</h3>
            <CodeBlock
              language="tsx"
              code={`<Skeleton variant="text" width="80%" />`}
            />
          </Card.Body>
        </Card>
        <Card className={styles.quickRefCard}>
          <Card.Body padding="md">
            <h3 className={styles.quickRefTitle}>Circle</h3>
            <CodeBlock
              language="tsx"
              code={`<Skeleton variant="circle" width={48} />`}
            />
          </Card.Body>
        </Card>
      </section>

      {/* Variants */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Variants</h2>
          <p className={styles.sectionDescription}>
            네 가지 형태의 스켈레톤을 제공합니다.
          </p>
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Text</h3>
          <LivePreview
            title="텍스트 스켈레톤"
            description="텍스트 라인을 나타내는 기본 형태입니다. 높이는 1em, 너비는 100%가 기본값이며 scale로 텍스트 라인 비율을 시뮬레이션합니다."
            editable
            centered={false}
            code={`<div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '400px' }}>
  <Skeleton variant="text" />
  <Skeleton variant="text" width="90%" />
  <Skeleton variant="text" width="75%" />
  <Skeleton variant="text" width="60%" />
</div>`}
          />
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Rect</h3>
          <LivePreview
            title="사각형 스켈레톤"
            description="이미지, 카드 등 직사각형 영역의 자리표시자입니다."
            editable
            code={`<div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
  <Skeleton variant="rect" width={120} height={80} />
  <Skeleton variant="rect" width={160} height={100} />
  <Skeleton variant="rect" width={200} height={120} />
</div>`}
          />
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Circle</h3>
          <LivePreview
            title="원형 스켈레톤"
            description="아바타, 프로필 이미지 등 원형 영역의 자리표시자입니다. width만 지정하면 height도 동일하게 적용됩니다."
            editable
            code={`<div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
  <Skeleton variant="circle" width={32} />
  <Skeleton variant="circle" width={40} />
  <Skeleton variant="circle" width={48} />
  <Skeleton variant="circle" width={64} />
</div>`}
          />
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Rounded</h3>
          <LivePreview
            title="둥근 사각형 스켈레톤"
            description="카드, 썸네일 등 모서리가 둥근 영역의 자리표시자입니다."
            editable
            code={`<div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
  <Skeleton variant="rounded" width={120} height={80} />
  <Skeleton variant="rounded" width={160} height={100} />
  <Skeleton variant="rounded" width={200} height={120} />
</div>`}
          />
        </div>
      </section>

      {/* Animation */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Animation</h2>
          <p className={styles.sectionDescription}>
            두 가지 애니메이션 타입과 애니메이션 비활성화를 지원합니다.
          </p>
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Wave (Default)</h3>
          <LivePreview
            title="Wave 애니메이션"
            description="빛이 흐르는 듯한 기본 애니메이션입니다. 대부분의 경우에 적합합니다."
            editable
            centered={false}
            code={`<div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '300px' }}>
  <Skeleton variant="text" animation="wave" />
  <Skeleton variant="text" animation="wave" width="85%" />
  <Skeleton variant="rect" animation="wave" width={300} height={100} />
</div>`}
          />
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Pulse</h3>
          <LivePreview
            title="Pulse 애니메이션"
            description="투명도가 깜빡이는 애니메이션입니다. 더 은은한 효과를 원할 때 사용합니다."
            editable
            centered={false}
            code={`<div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '300px' }}>
  <Skeleton variant="text" animation="pulse" />
  <Skeleton variant="text" animation="pulse" width="85%" />
  <Skeleton variant="rect" animation="pulse" width={300} height={100} />
</div>`}
          />
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>No Animation</h3>
          <LivePreview
            title="애니메이션 비활성화"
            description="animation={false}로 정적 스켈레톤을 표시합니다. 접근성 모션 감소(prefers-reduced-motion) 대응에 유용합니다."
            editable
            centered={false}
            code={`<div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '300px' }}>
  <Skeleton variant="text" animation={false} />
  <Skeleton variant="text" animation={false} width="85%" />
  <Skeleton variant="rect" animation={false} width={300} height={100} />
</div>`}
          />
        </div>
      </section>

      {/* Custom Dimensions */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Custom Dimensions</h2>
          <p className={styles.sectionDescription}>
            width와 height로 크기를 자유롭게 지정합니다. 숫자는 px, 문자열은
            그대로 적용됩니다.
          </p>
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Size Control</h3>
          <LivePreview
            title="커스텀 크기"
            description="px 단위(숫자) 또는 CSS 단위(문자열)로 크기를 지정할 수 있습니다."
            editable
            centered={false}
            code={`<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
    <span style={{ width: '80px', fontSize: '0.75rem', color: '#6b7280' }}>px 단위</span>
    <Skeleton variant="rect" width={100} height={40} />
    <Skeleton variant="rect" width={200} height={40} />
  </div>
  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
    <span style={{ width: '80px', fontSize: '0.75rem', color: '#6b7280' }}>% 단위</span>
    <div style={{ width: '300px' }}>
      <Skeleton variant="rect" width="50%" height={40} />
    </div>
  </div>
  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
    <span style={{ width: '80px', fontSize: '0.75rem', color: '#6b7280' }}>rem 단위</span>
    <Skeleton variant="rounded" width="10rem" height="3rem" />
  </div>
</div>`}
          />
        </div>
      </section>

      {/* Composition */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Composition Patterns</h2>
          <p className={styles.sectionDescription}>
            실제 UI 레이아웃에 맞게 스켈레톤을 조합하는 패턴입니다.
          </p>
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Card Skeleton</h3>
          <LivePreview
            title="카드 스켈레톤"
            description="카드 UI의 로딩 상태를 표현합니다. 이미지, 제목, 설명을 각각 스켈레톤으로 구성합니다."
            editable
            centered={false}
            code={`<div style={{ maxWidth: '320px', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.75rem' }}>
  <Skeleton variant="rounded" width="100%" height={180} />
  <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
    <Skeleton variant="text" width="70%" />
    <Skeleton variant="text" width="100%" />
    <Skeleton variant="text" width="90%" />
  </div>
</div>`}
          />
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>List Item Skeleton</h3>
          <LivePreview
            title="리스트 아이템 스켈레톤"
            description="아바타 + 텍스트 구성의 리스트 아이템 로딩 상태입니다."
            editable
            centered={false}
            code={`<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px' }}>
  {[1, 2, 3].map((i) => (
    <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
      <Skeleton variant="circle" width={44} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="40%" />
      </div>
    </div>
  ))}
</div>`}
          />
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Profile Skeleton</h3>
          <LivePreview
            title="프로필 스켈레톤"
            description="프로필 카드의 로딩 상태입니다. 아바타, 이름, 설명, 버튼을 조합합니다."
            editable
            centered={false}
            code={`<div style={{ maxWidth: '300px', padding: '1.5rem', border: '1px solid #e5e7eb', borderRadius: '0.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
  <Skeleton variant="circle" width={80} />
  <Skeleton variant="text" width="60%" />
  <Skeleton variant="text" width="80%" />
  <Skeleton variant="rounded" width="100%" height={36} />
</div>`}
          />
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Loading to Content</h3>
          <LivePreview
            title="로딩 → 콘텐츠 전환"
            description="버튼 클릭으로 스켈레톤에서 실제 콘텐츠로 전환되는 패턴입니다."
            editable
            centered={false}
            code={`const [loaded, setLoaded] = useState(false);
const handleLoad = () => {
  setLoaded(false);
  setTimeout(() => setLoaded(true), 1500);
};

<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
  <Button size="sm" variant="light" onClick={handleLoad}>
    {loaded ? '다시 로드' : '콘텐츠 불러오기'}
  </Button>
  <div style={{ maxWidth: '400px', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.75rem' }}>
    {loaded ? (
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>👤</div>
        <div>
          <p style={{ fontWeight: 600, margin: 0 }}>홍길동</p>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Frontend Developer</p>
        </div>
      </div>
    ) : (
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <Skeleton variant="circle" width={44} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <Skeleton variant="text" width="40%" />
          <Skeleton variant="text" width="60%" />
        </div>
      </div>
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
            Skeleton 컴포넌트의 모든 Props와 타입 정보입니다. HTML span 속성도
            모두 사용 가능합니다.
          </p>
        </div>
        <div className={styles.propsTableWrapper}>
          <PropsTable props={propsData} />
        </div>
      </section>

      {/* Accessibility */}
      <AccessibilitySection
        componentName="Skeleton"
        intro="Skeleton 컴포넌트는 다음과 같은 접근성 기능을 기본 제공합니다."
        features={[
          {
            attribute: 'role="status"',
            effect: '로딩 상태임을 전달합니다.',
            description:
              'role="status"로 설정되어 스크린 리더가 콘텐츠가 로딩 중임을 인식합니다.',
          },
          {
            attribute: 'aria-busy="true"',
            effect: '콘텐츠가 아직 준비 중임을 알려줍니다.',
            description:
              'aria-busy="true"로 설정되어 현재 콘텐츠가 로딩 중이라는 것을 전달합니다.',
          },
          {
            attribute: 'aria-live="polite"',
            effect: '상태 변화를 자동으로 읽어줍니다.',
            description:
              '로딩 완료 시 스크린 리더가 변경 사항을 사용자에게 알려줍니다.',
          },
          {
            attribute: 'aria-label',
            effect: '"콘텐츠 로딩 중"이라고 읽어줍니다.',
            description:
              '기본 "콘텐츠 로딩 중" 또는 커스텀 aria-label로 로딩 내용을 설명합니다.',
          },
        ]}
        additionalGuidance={[
          {
            title: 'prefers-reduced-motion 대응',
            description:
              '모션에 민감한 사용자를 위해 animation={false}를 제공하세요.',
            examples: [
              {
                code: `// 모션 감소 설정에 대응
<Skeleton animation={false} variant="text" />

// 또는 CSS @media로 시스템 설정 감지
// @media (prefers-reduced-motion: reduce)`,
                explanation:
                  '시스템의 모션 감소 설정을 존중하면 접근성이 향상됩니다.',
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
            Skeleton을 효과적으로 사용하기 위한 권장사항입니다.
          </p>
        </div>

        <div className={styles.practicesGrid}>
          <Card>
            <Card.Body padding="lg">
              <div className={styles.practiceHeader}>
                <span className={styles.practiceIcon}>&#10003;</span>
                <h3 className={styles.practiceTitle}>Do</h3>
              </div>
              <List spacing="sm" className={styles.practiceList}>
                <ListItem>실제 콘텐츠와 유사한 형태로 스켈레톤 구성</ListItem>
                <ListItem>
                  아바타에는 circle, 이미지에는 rect/rounded 사용
                </ListItem>
                <ListItem>
                  텍스트 스켈레톤의 너비를 다양하게 설정하여 자연스러움 유지
                </ListItem>
                <ListItem>로딩 완료 후 즉시 실제 콘텐츠로 교체</ListItem>
                <ListItem>
                  모션 감소 설정 사용자를 위해 animation={false} 고려
                </ListItem>
              </List>
            </Card.Body>
          </Card>

          <Card>
            <Card.Body padding="lg">
              <div className={styles.practiceHeader}>
                <span className={styles.practiceIconError}>&#10007;</span>
                <h3 className={styles.practiceTitle}>Don't</h3>
              </div>
              <List spacing="sm" className={styles.practiceList}>
                <ListItem>
                  실제 레이아웃과 다른 형태로 스켈레톤 배치하지 않기
                </ListItem>
                <ListItem>
                  모든 텍스트 라인을 같은 너비로 만들지 않기 (부자연스러움)
                </ListItem>
                <ListItem>
                  스켈레톤을 장시간 표시하지 않기 (사용자 혼란)
                </ListItem>
                <ListItem>
                  즉시 로드되는 콘텐츠에 스켈레톤 사용하지 않기
                </ListItem>
                <ListItem>Loader와 Skeleton을 동시에 사용하지 않기</ListItem>
              </List>
            </Card.Body>
          </Card>
        </div>
      </section>
    </article>
  );
}
