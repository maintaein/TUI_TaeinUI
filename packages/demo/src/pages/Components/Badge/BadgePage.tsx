import { Card, List, ListItem } from '@taein-ui/core';
import { LivePreview } from '../../../components/LivePreview';
import { CodeBlock } from '../../../components/CodeBlock';
import { PropsTable } from '../../../components/PropsTable';
import type { PropDefinition } from '../../../components/PropsTable/PropsTable';
import { AccessibilitySection } from '../../../components/AccessibilitySection';
import * as styles from './BadgePage.css';

export function BadgePage() {
  const propsData: PropDefinition[] = [
    {
      name: 'children',
      type: 'ReactNode',
      description:
        '배지에 표시할 내용 (숫자 또는 텍스트). dot 모드에서는 무시됨',
    },
    {
      name: 'variant',
      type: "'primary' | 'secondary' | 'success' | 'error' | 'warning'",
      default: "'primary'",
      description: '배지 색상 변형',
    },
    {
      name: 'size',
      type: "'sm' | 'md' | 'lg'",
      default: "'md'",
      description: '배지 크기',
    },
    {
      name: 'max',
      type: 'number',
      default: '99',
      description: '숫자 최대값 (초과 시 max+ 표시)',
    },
    {
      name: 'dot',
      type: 'boolean',
      default: 'false',
      description: '점 모드 (내용 없이 작은 원으로 표시)',
    },
    {
      name: 'showZero',
      type: 'boolean',
      default: 'true',
      description: '값이 0일 때 표시 여부',
    },
    {
      name: 'aria-label',
      type: 'string',
      description: '접근성 레이블 (자동 생성되지만 커스텀 가능)',
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
        <h1 className={styles.title}>Badge</h1>
        <p className={styles.description}>
          Badge 컴포넌트는 읽지 않은 알림 수, 새로운 메시지, 상태 라벨 등을
          표시할 때 사용합니다. 아이콘이나 메뉴 항목 옆에 붙여 사용자의 주의를
          끌 수 있습니다.
        </p>
      </header>

      {/* Quick Reference */}
      <section className={styles.quickReference}>
        <Card className={styles.quickRefCard}>
          <Card.Body padding="md">
            <h3 className={styles.quickRefTitle}>Import</h3>
            <CodeBlock
              language="typescript"
              code={`import { Badge } from '@taein-ui/core';`}
            />
          </Card.Body>
        </Card>
        <Card className={styles.quickRefCard}>
          <Card.Body padding="md">
            <h3 className={styles.quickRefTitle}>Number</h3>
            <CodeBlock
              language="tsx"
              code={`<Badge variant="error">{5}</Badge>`}
            />
          </Card.Body>
        </Card>
        <Card className={styles.quickRefCard}>
          <Card.Body padding="md">
            <h3 className={styles.quickRefTitle}>Dot</h3>
            <CodeBlock language="tsx" code={`<Badge dot variant="error" />`} />
          </Card.Body>
        </Card>
      </section>

      {/* Examples */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Examples</h2>
          <p className={styles.sectionDescription}>
            다양한 사용 사례에 맞는 Badge 예제입니다.
          </p>
        </div>

        {/* Basic */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Basic</h3>
          <LivePreview
            title="기본 사용법"
            description="숫자나 텍스트를 children으로 전달하여 배지를 표시합니다."
            editable
            code={`<div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
  <Badge>{3}</Badge>
  <Badge>{42}</Badge>
  <Badge>NEW</Badge>
  <Badge>HOT</Badge>
</div>`}
          />
        </div>

        {/* Variants */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Variants</h3>
          <LivePreview
            title="색상 변형"
            description="primary, secondary, success, error, warning 5가지 색상 변형을 제공합니다."
            editable
            code={`<div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
  <Badge variant="primary">{5}</Badge>
  <Badge variant="secondary">{12}</Badge>
  <Badge variant="success">{8}</Badge>
  <Badge variant="error">{3}</Badge>
  <Badge variant="warning">{7}</Badge>
</div>`}
          />
        </div>

        {/* Sizes */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Sizes</h3>
          <LivePreview
            title="크기 옵션"
            description="sm(16px), md(20px), lg(24px) 세 가지 크기를 제공합니다."
            editable
            code={`<div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
  <Badge size="sm">{5}</Badge>
  <Badge size="md">{5}</Badge>
  <Badge size="lg">{5}</Badge>
</div>`}
          />
        </div>

        {/* Text Badges */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Text Badges</h3>
          <LivePreview
            title="텍스트 배지"
            description="숫자 대신 텍스트를 넣어 라벨이나 태그로 활용할 수 있습니다."
            editable
            code={`<div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
  <Badge variant="primary">NEW</Badge>
  <Badge variant="error">HOT</Badge>
  <Badge variant="success">SALE</Badge>
  <Badge variant="warning">BETA</Badge>
  <Badge variant="secondary">v2.0</Badge>
</div>`}
          />
        </div>

        {/* Max */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Max Value</h3>
          <LivePreview
            title="최대값 제한"
            description="max prop으로 표시할 최대 숫자를 지정합니다. 초과 시 '99+' 형태로 표시됩니다."
            editable
            code={`<div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
  <Badge variant="error">{50}</Badge>
  <Badge variant="error">{99}</Badge>
  <Badge variant="error">{100}</Badge>
  <Badge variant="error" max={999}>{1000}</Badge>
  <Badge variant="error" max={9}>{10}</Badge>
</div>`}
          />
        </div>

        {/* Dot Mode */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Dot Mode</h3>
          <LivePreview
            title="점 모드"
            description="dot prop으로 내용 없이 작은 점으로만 표시합니다. 새 알림이 있음을 간결하게 나타낼 때 유용합니다."
            editable
            code={`<div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
  <Badge dot variant="primary" />
  <Badge dot variant="secondary" />
  <Badge dot variant="success" />
  <Badge dot variant="error" />
  <Badge dot variant="warning" />
</div>`}
          />
        </div>

        {/* showZero */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Show Zero</h3>
          <LivePreview
            title="0 표시 여부"
            description="showZero prop으로 값이 0일 때 표시 여부를 제어합니다. 기본값은 true입니다."
            editable
            code={`<div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
    <Badge variant="error">{0}</Badge>
    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>showZero=true</span>
  </div>
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
    <Badge variant="error" showZero={false}>{0}</Badge>
    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>showZero=false (숨김)</span>
  </div>
</div>`}
          />
        </div>

        {/* Variants with Sizes */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Variant + Size Combinations</h3>
          <LivePreview
            title="변형과 크기 조합"
            description="variant와 size를 조합한 전체 매트릭스입니다."
            editable
            code={`<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
    <span style={{ width: '80px', fontSize: '0.75rem', color: '#6b7280' }}>Small</span>
    <Badge variant="primary" size="sm">{3}</Badge>
    <Badge variant="secondary" size="sm">{3}</Badge>
    <Badge variant="success" size="sm">{3}</Badge>
    <Badge variant="error" size="sm">{3}</Badge>
    <Badge variant="warning" size="sm">{3}</Badge>
  </div>
  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
    <span style={{ width: '80px', fontSize: '0.75rem', color: '#6b7280' }}>Medium</span>
    <Badge variant="primary" size="md">{3}</Badge>
    <Badge variant="secondary" size="md">{3}</Badge>
    <Badge variant="success" size="md">{3}</Badge>
    <Badge variant="error" size="md">{3}</Badge>
    <Badge variant="warning" size="md">{3}</Badge>
  </div>
  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
    <span style={{ width: '80px', fontSize: '0.75rem', color: '#6b7280' }}>Large</span>
    <Badge variant="primary" size="lg">{3}</Badge>
    <Badge variant="secondary" size="lg">{3}</Badge>
    <Badge variant="success" size="lg">{3}</Badge>
    <Badge variant="error" size="lg">{3}</Badge>
    <Badge variant="warning" size="lg">{3}</Badge>
  </div>
</div>`}
          />
        </div>

        {/* In Context */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>In Context</h3>
          <LivePreview
            title="실제 사용 맥락"
            description="아이콘 옆, 메뉴 항목, 탭 등에서 Badge를 활용하는 패턴입니다."
            editable
            code={`<div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
  {/* 알림 아이콘 + 배지 */}
  <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <Bell size={24} />
      <span style={{ position: 'absolute', top: '-4px', right: '-8px' }}>
        <Badge variant="error" size="sm">{3}</Badge>
      </span>
    </div>
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <MessageCircle size={24} />
      <span style={{ position: 'absolute', top: '-4px', right: '-8px' }}>
        <Badge variant="primary" size="sm">{12}</Badge>
      </span>
    </div>
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <Mail size={24} />
      <span style={{ position: 'absolute', top: '-2px', right: '-2px' }}>
        <Badge dot variant="error" />
      </span>
    </div>
  </div>
  {/* 메뉴 리스트 */}
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '300px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem' }}>
      <span style={{ fontWeight: 500 }}>받은 편지함</span>
      <Badge variant="primary">{24}</Badge>
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem' }}>
      <span style={{ fontWeight: 500 }}>스팸</span>
      <Badge variant="error">{108}</Badge>
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem' }}>
      <span style={{ fontWeight: 500 }}>임시 보관함</span>
      <Badge variant="secondary">{2}</Badge>
    </div>
  </div>
</div>`}
          />
        </div>

        {/* Interactive */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Interactive Counter</h3>
          <LivePreview
            title="인터랙티브 카운터"
            description="상태와 함께 사용하여 동적으로 배지 값을 변경하는 예제입니다."
            editable
            code={`const [count, setCount] = useState(0);

<div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
  <Button size="sm" variant="light" onClick={() => setCount((c) => Math.max(0, c - 1))}>-</Button>
  <Badge variant={count > 0 ? 'error' : 'secondary'} showZero={true}>{count}</Badge>
  <Button size="sm" variant="light" onClick={() => setCount((c) => c + 1)}>+</Button>
  <Button size="sm" variant="dark" buttonStyle="weak" onClick={() => setCount(0)}>초기화</Button>
</div>`}
          />
        </div>
      </section>

      {/* Props API */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Props API</h2>
          <p className={styles.sectionDescription}>
            Badge 컴포넌트의 모든 Props와 타입 정보입니다. HTML span 속성도 모두
            사용 가능합니다.
          </p>
        </div>
        <div className={styles.propsTableWrapper}>
          <PropsTable props={propsData} />
        </div>
      </section>

      {/* Accessibility */}
      <AccessibilitySection
        componentName="Badge"
        intro="Badge 컴포넌트는 다음과 같은 접근성 기능을 기본 제공합니다."
        features={[
          {
            attribute: 'role="status"',
            effect: '배지가 상태 정보임을 전달합니다.',
            description:
              'role="status"로 설정되어 스크린 리더가 배지의 역할을 올바르게 인식합니다.',
          },
          {
            attribute: 'aria-label 자동 생성',
            effect: '배지 내용을 스크린 리더가 읽습니다.',
            description:
              '숫자 배지는 "5개의 알림", dot 배지는 "알림", 텍스트 배지는 텍스트 자체를 aria-label로 자동 생성합니다.',
          },
          {
            attribute: 'aria-label 커스텀',
            effect: '원하는 레이블을 직접 지정할 수 있습니다.',
            description:
              'aria-label prop으로 자동 생성된 레이블 대신 커스텀 레이블을 사용할 수 있습니다.',
          },
        ]}
        additionalGuidance={[
          {
            title: '맥락에 맞는 aria-label',
            description: '배지가 어디에 연결되어 있는지 명확히 설명하세요.',
            examples: [
              {
                code: `// Good
<Badge variant="error" aria-label="읽지 않은 메시지 3개">{3}</Badge>

// Bad - 맥락 부족
<Badge variant="error">{3}</Badge>`,
                explanation:
                  '자동 생성되는 "3개의 알림" 대신, 구체적인 맥락을 포함하면 더 좋습니다.',
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
            Badge를 효과적으로 사용하기 위한 권장사항입니다.
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
                <ListItem>알림 카운트에 error variant 사용</ListItem>
                <ListItem>
                  max를 적절히 설정하여 레이아웃 유지 (기본 99)
                </ListItem>
                <ListItem>새 알림 유무만 표시할 때 dot 모드 사용</ListItem>
                <ListItem>
                  의미에 맞는 variant 선택 (success=완료, warning=주의)
                </ListItem>
                <ListItem>맥락에 맞는 aria-label 커스텀</ListItem>
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
                <ListItem>배지에 너무 긴 텍스트 넣지 않기 (간결하게)</ListItem>
                <ListItem>장식 목적으로만 배지 사용하지 않기</ListItem>
                <ListItem>한 화면에 너무 많은 배지 남용하지 않기</ListItem>
                <ListItem>
                  의미 없는 0 표시하지 않기 (showZero={false} 활용)
                </ListItem>
                <ListItem>
                  색상만으로 정보를 전달하지 않기 (텍스트 병행)
                </ListItem>
              </List>
            </Card.Body>
          </Card>
        </div>
      </section>
    </article>
  );
}
