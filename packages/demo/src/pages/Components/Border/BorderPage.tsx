import { Card, List, ListItem } from '@taein-ui/core';
import { LivePreview } from '../../../components/LivePreview';
import { CodeBlock } from '../../../components/CodeBlock';
import { PropsTable } from '../../../components/PropsTable';
import type { PropDefinition } from '../../../components/PropsTable/PropsTable';
import { AccessibilitySection } from '../../../components/AccessibilitySection';
import * as styles from './BorderPage.css';

export function BorderPage() {
  const propsData: PropDefinition[] = [
    {
      name: 'children',
      type: 'ReactNode',
      required: true,
      description: 'Border 내부에 렌더링할 콘텐츠',
    },
    {
      name: 'sides',
      type: "'all' | 'top' | 'right' | 'bottom' | 'left' | 'horizontal' | 'vertical'",
      default: "'all'",
      description: '테두리를 표시할 방향',
    },
    {
      name: 'variant',
      type: "'solid' | 'dashed' | 'dotted'",
      default: "'solid'",
      description: '테두리 선 스타일',
    },
    {
      name: 'width',
      type: "'thin' | 'medium' | 'thick'",
      default: "'thin'",
      description: '테두리 두께 (1px / 2px / 4px)',
    },
    {
      name: 'color',
      type: "'default' | 'primary' | 'success' | 'error' | 'warning'",
      default: "'default'",
      description: '테두리 색상',
    },
    {
      name: 'rounded',
      type: "'none' | 'sm' | 'md' | 'lg' | 'full'",
      default: "sides='all'이면 'md', 그 외 'none'",
      description:
        '모서리 둥글기. 미지정이면 부분 sides는 선 끝이 휘지 않도록 none이다. 명시하면 항상 우선한다',
    },
    {
      name: 'padding',
      type: "'none' | 'sm' | 'md' | 'lg'",
      default: "'none'",
      description: '내부 여백',
    },
    {
      name: 'glow',
      type: 'boolean',
      default: 'false',
      description:
        "호버·포커스 시 테두리를 따라 도는 빛. sides='all'일 때만 나타난다",
    },
  ];

  return (
    <article className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>Border</h1>
        <p className={styles.description}>
          Border 컴포넌트는 콘텐츠 영역을 시각적으로 구분하거나 강조할 때
          사용합니다. 인용문 강조, 섹션 구분선, 경고 박스 등에 활용할 수
          있습니다.
        </p>
      </header>

      {/* Quick Reference */}
      <section className={styles.quickReference}>
        <Card className={styles.quickRefCard}>
          <Card.Body padding="md">
            <h3 className={styles.quickRefTitle}>Import</h3>
            <CodeBlock
              language="typescript"
              code={`import { Border } from '@taein-ui/core';`}
            />
          </Card.Body>
        </Card>
        <Card className={styles.quickRefCard}>
          <Card.Body padding="md">
            <h3 className={styles.quickRefTitle}>Basic Usage</h3>
            <CodeBlock
              language="tsx"
              code={`<Border padding="md" rounded="md">
  콘텐츠
</Border>`}
            />
          </Card.Body>
        </Card>
      </section>

      {/* Examples Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Examples</h2>
          <p className={styles.sectionDescription}>
            다양한 사용 사례에 맞는 Border 예제입니다.
          </p>
        </div>

        {/* Basic */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Basic Border</h3>
          <LivePreview
            title="기본 사용법"
            description="가장 기본적인 Border 사용 예제입니다. 기본값은 전체 방향, solid, thin입니다."
            editable
            code={`<Border padding="md">
  기본 Border입니다.
</Border>`}
          />
        </div>

        {/* Sides */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Sides</h3>
          <LivePreview
            title="방향 옵션"
            description="sides prop으로 테두리를 표시할 방향을 지정합니다. all, top, right, bottom, left, horizontal, vertical을 지원합니다."
            editable
            code={`<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1.5rem' }}>
  <Border sides="all" padding="sm">
    <div style={{ textAlign: 'center', fontSize: '0.875rem' }}>all</div>
  </Border>
  <Border sides="top" padding="sm">
    <div style={{ textAlign: 'center', fontSize: '0.875rem' }}>top</div>
  </Border>
  <Border sides="right" padding="sm">
    <div style={{ textAlign: 'center', fontSize: '0.875rem' }}>right</div>
  </Border>
  <Border sides="bottom" padding="sm">
    <div style={{ textAlign: 'center', fontSize: '0.875rem' }}>bottom</div>
  </Border>
  <Border sides="left" padding="sm">
    <div style={{ textAlign: 'center', fontSize: '0.875rem' }}>left</div>
  </Border>
  <Border sides="horizontal" padding="sm">
    <div style={{ textAlign: 'center', fontSize: '0.875rem' }}>horizontal</div>
  </Border>
  <Border sides="vertical" padding="sm">
    <div style={{ textAlign: 'center', fontSize: '0.875rem' }}>vertical</div>
  </Border>
</div>`}
          />
        </div>

        {/* Variants */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Variants</h3>
          <LivePreview
            title="선 스타일"
            description="variant prop으로 테두리 선의 스타일을 지정합니다."
            editable
            code={`<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
  <Border variant="solid" padding="sm">
    <div style={{ fontSize: '0.875rem' }}>solid (실선)</div>
  </Border>
  <Border variant="dashed" padding="sm">
    <div style={{ fontSize: '0.875rem' }}>dashed (점선)</div>
  </Border>
  <Border variant="dotted" padding="sm">
    <div style={{ fontSize: '0.875rem' }}>dotted (도트)</div>
  </Border>
</div>`}
          />
        </div>

        {/* Width */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Width</h3>
          <LivePreview
            title="두께 옵션"
            description="width prop으로 테두리 두께를 조절합니다. thin(1px), medium(2px), thick(4px)을 제공합니다."
            editable
            code={`<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
  <Border width="thin" padding="sm">
    <div style={{ fontSize: '0.875rem' }}>thin (1px)</div>
  </Border>
  <Border width="medium" padding="sm">
    <div style={{ fontSize: '0.875rem' }}>medium (2px)</div>
  </Border>
  <Border width="thick" padding="sm">
    <div style={{ fontSize: '0.875rem' }}>thick (4px)</div>
  </Border>
</div>`}
          />
        </div>

        {/* Colors */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Colors</h3>
          <LivePreview
            title="색상 옵션"
            description="color prop으로 테두리 색상을 지정합니다. 테마 시스템의 시맨틱 컬러를 사용합니다."
            editable
            code={`<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
  <Border color="default" padding="sm">
    <div style={{ fontSize: '0.875rem' }}>default</div>
  </Border>
  <Border color="primary" padding="sm">
    <div style={{ fontSize: '0.875rem' }}>primary</div>
  </Border>
  <Border color="success" padding="sm">
    <div style={{ fontSize: '0.875rem' }}>success</div>
  </Border>
  <Border color="error" padding="sm">
    <div style={{ fontSize: '0.875rem' }}>error</div>
  </Border>
  <Border color="warning" padding="sm">
    <div style={{ fontSize: '0.875rem' }}>warning</div>
  </Border>
</div>`}
          />
        </div>

        {/* Rounded */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Rounded</h3>
          <LivePreview
            title="모서리 둥글기"
            description="rounded prop으로 모서리 둥글기를 조절합니다."
            editable
            code={`<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem' }}>
  <Border rounded="none" padding="sm">
    <div style={{ textAlign: 'center', fontSize: '0.875rem' }}>none</div>
  </Border>
  <Border rounded="sm" padding="sm">
    <div style={{ textAlign: 'center', fontSize: '0.875rem' }}>sm</div>
  </Border>
  <Border rounded="md" padding="sm">
    <div style={{ textAlign: 'center', fontSize: '0.875rem' }}>md</div>
  </Border>
  <Border rounded="lg" padding="sm">
    <div style={{ textAlign: 'center', fontSize: '0.875rem' }}>lg</div>
  </Border>
  <Border rounded="full" padding="sm">
    <div style={{ textAlign: 'center', fontSize: '0.875rem' }}>full</div>
  </Border>
</div>`}
          />
        </div>

        {/* Padding */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Padding</h3>
          <LivePreview
            title="내부 여백"
            description="padding prop으로 테두리 내부 여백을 설정합니다."
            editable
            code={`<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
  <Border padding="none">
    <div style={{ fontSize: '0.875rem', backgroundColor: '#f3f4f6' }}>none (0)</div>
  </Border>
  <Border padding="sm">
    <div style={{ fontSize: '0.875rem', backgroundColor: '#f3f4f6' }}>sm</div>
  </Border>
  <Border padding="md">
    <div style={{ fontSize: '0.875rem', backgroundColor: '#f3f4f6' }}>md</div>
  </Border>
  <Border padding="lg">
    <div style={{ fontSize: '0.875rem', backgroundColor: '#f3f4f6' }}>lg</div>
  </Border>
</div>`}
          />
        </div>

        {/* Glow */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Glow</h3>
          <LivePreview
            title="호버 빛 (선택 기능)"
            description="glow를 켜면 호버나 키보드 포커스(Tab) 시 빛이 테두리를 따라 6초에 한 바퀴 돕니다. 기본은 꺼져 있습니다. sides가 'all'일 때만 나타나고, 그 외 sides에서는 glow를 줘도 조용히 무시됩니다. 호버는 마우스 같은 정밀 포인터에서만 동작하고, 포커스는 입력 기기와 무관하게 동작합니다. color가 primary·success·error이면 빛이 그 색을 따라가고, default는 빛이 primary 색입니다."
            editable
            code={`<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1.5rem' }}>
  <Border glow color="default" padding="md">
    <button type="button">default (Tab으로 포커스)</button>
  </Border>
  <Border glow color="primary" padding="md">
    <button type="button">primary</button>
  </Border>
  <Border glow color="success" padding="md">
    <button type="button">success</button>
  </Border>
  <Border glow color="error" padding="md">
    <button type="button">error</button>
  </Border>
  <Border glow sides="top" color="primary" padding="md">
    <div style={{ fontSize: '0.875rem' }}>sides="top": 빛 없음</div>
  </Border>
</div>`}
          />
        </div>

        {/* Combination */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Combination</h3>
          <LivePreview
            title="조합 예제"
            description="여러 props를 조합한 실제 사용 예시입니다."
            editable
            code={`<div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
  {/* 카드 스타일 */}
  <Border rounded="lg" padding="lg" color="default" width="thin">
    <div style={{ fontSize: '0.875rem' }}>
      <strong>카드 스타일</strong>
      <p style={{ marginTop: '0.5rem', color: '#6b7280' }}>rounded + padding + 기본 border로 카드처럼 사용할 수 있습니다.</p>
    </div>
  </Border>

  {/* 강조 영역 */}
  <Border sides="left" width="thick" color="primary" padding="md" rounded="none">
    <div style={{ fontSize: '0.875rem' }}>
      <strong>인용/강조 영역</strong>
      <p style={{ marginTop: '0.5rem', color: '#6b7280' }}>왼쪽 두꺼운 테두리로 인용문이나 중요 정보를 강조할 수 있습니다.</p>
    </div>
  </Border>

  {/* 경고 박스 */}
  <Border color="error" variant="dashed" rounded="md" padding="md" width="medium">
    <div style={{ fontSize: '0.875rem', color: '#dc2626' }}>
      주의: 이 작업은 되돌릴 수 없습니다.
    </div>
  </Border>

  {/* 구분선 역할 */}
  <div>
    <div style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>섹션 A 콘텐츠</div>
    <Border sides="bottom" color="default" />
    <div style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>섹션 B 콘텐츠</div>
  </div>

  {/* 성공 알림 */}
  <Border color="success" rounded="md" padding="md" width="medium">
    <div style={{ fontSize: '0.875rem', color: '#059669' }}>
      저장이 완료되었습니다.
    </div>
  </Border>
</div>`}
          />
        </div>
      </section>

      {/* Props API */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Props API</h2>
          <p className={styles.sectionDescription}>
            Border 컴포넌트의 모든 Props와 타입 정보입니다. HTML div 속성도 모두
            사용 가능합니다.
          </p>
        </div>
        <div className={styles.propsTableWrapper}>
          <PropsTable props={propsData} />
        </div>
      </section>

      {/* Accessibility */}
      <AccessibilitySection
        componentName="Border"
        intro="Border 컴포넌트는 순수한 시각적 스타일링 컴포넌트로, 다음과 같은 접근성 특성을 가집니다."
        features={[
          {
            attribute: '<div> 요소',
            effect: '의미 없는 컨테이너로 렌더링됩니다.',
            description:
              '시각적 스타일만 제공하며, 스크린 리더에서 별도 역할을 갖지 않습니다.',
          },
          {
            attribute: 'HTML 속성 전달',
            effect: 'role, aria-* 등을 자유롭게 설정할 수 있습니다.',
            description:
              'HTMLAttributes를 확장하므로 필요에 따라 시맨틱 정보를 추가할 수 있습니다.',
          },
          {
            attribute: '색상 대비',
            effect: '테마 시스템의 시맨틱 컬러를 사용합니다.',
            description:
              'default, primary, success, error, warning 색상은 충분한 대비를 제공합니다.',
          },
        ]}
        additionalGuidance={[
          {
            title: '시맨틱 역할이 필요한 경우',
            description:
              'Border가 의미 있는 영역을 감싸는 경우 적절한 role이나 시맨틱 요소를 함께 사용하세요.',
            examples: [
              {
                code: `// 경고 영역
<Border color="error" padding="md" role="alert">
  오류가 발생했습니다.
</Border>

// 그룹 영역
<Border padding="md" role="group" aria-label="사용자 정보">
  <p>이름: 홍길동</p>
  <p>이메일: hong@example.com</p>
</Border>`,
                explanation:
                  '순수 장식 용도가 아닌 경우 role이나 aria-label을 추가하세요.',
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
            Border를 효과적으로 사용하기 위한 권장사항입니다.
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
                  영역 구분에 sides="bottom" 또는 sides="top" 활용
                </ListItem>
                <ListItem>
                  강조 영역에 sides="left" + color="primary" 조합 사용
                </ListItem>
                <ListItem>에러/경고 메시지에 적절한 color 사용</ListItem>
                <ListItem>카드 스타일에 rounded + padding 조합 활용</ListItem>
                <ListItem>의미 있는 영역에 role, aria-label 추가</ListItem>
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
                <ListItem>
                  테두리를 과도하게 중첩하여 시각적 복잡도 높이지 않기
                </ListItem>
                <ListItem>
                  의미 전달 목적으로 색상에만 의존하지 않기 (텍스트 병행)
                </ListItem>
                <ListItem>thick 두께를 장식 외 목적으로 남용하지 않기</ListItem>
                <ListItem>
                  padding 없이 텍스트를 테두리에 밀착시키지 않기
                </ListItem>
              </List>
            </Card.Body>
          </Card>
        </div>
      </section>
    </article>
  );
}
