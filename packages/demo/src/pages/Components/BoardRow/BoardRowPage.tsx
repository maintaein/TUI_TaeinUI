import { Card, List, ListItem } from '@taein-ui/core';
import { LivePreview } from '../../../components/LivePreview';
import { CodeBlock } from '../../../components/CodeBlock';
import { PropsTable } from '../../../components/PropsTable';
import type { PropDefinition } from '../../../components/PropsTable/PropsTable';
import { AccessibilitySection } from '../../../components/AccessibilitySection';
import * as styles from './BoardRowPage.css';

export function BoardRowPage() {
  const propsData: PropDefinition[] = [
    {
      name: 'title',
      type: 'ReactNode',
      required: true,
      description: '헤더 영역에 표시할 제목',
    },
    {
      name: 'children',
      type: 'ReactNode',
      required: true,
      description: '펼쳐질 때 표시할 콘텐츠',
    },
    {
      name: 'variant',
      type: "'default' | 'outlined' | 'filled'",
      default: "'default'",
      description: '시각적 스타일 변형',
    },
    {
      name: 'defaultExpanded',
      type: 'boolean',
      default: 'false',
      description: '초기 펼침 상태 (uncontrolled)',
    },
    {
      name: 'expanded',
      type: 'boolean',
      default: 'undefined',
      description: '펼침 상태 (controlled)',
    },
    {
      name: 'onChange',
      type: '(expanded: boolean) => void',
      default: 'undefined',
      description: '펼침 상태 변경 콜백',
    },
    {
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description: '비활성화 상태',
    },
    {
      name: 'className',
      type: 'string',
      default: 'undefined',
      description: '추가 CSS 클래스',
    },
  ];

  return (
    <article className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>BoardRow</h1>
        <p className={styles.description}>
          BoardRow 컴포넌트는 FAQ, 상세 설명, 주문 내역 등 긴 콘텐츠를 접었다
          펼칠 때 사용합니다. 클릭하면 콘텐츠가 슬라이드 애니메이션과 함께
          나타납니다.
        </p>
      </header>

      {/* Quick Reference */}
      <section className={styles.quickReference}>
        <Card className={styles.quickRefCard}>
          <Card.Body padding="md">
            <h3 className={styles.quickRefTitle}>Import</h3>
            <CodeBlock
              language="typescript"
              code={`import { BoardRow } from '@taein-ui/core';`}
            />
          </Card.Body>
        </Card>
        <Card className={styles.quickRefCard}>
          <Card.Body padding="md">
            <h3 className={styles.quickRefTitle}>Basic Usage</h3>
            <CodeBlock
              language="tsx"
              code={`<BoardRow title="섹션 제목">
  <p>펼쳐질 콘텐츠</p>
</BoardRow>`}
            />
          </Card.Body>
        </Card>
      </section>

      {/* Examples Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Examples</h2>
          <p className={styles.sectionDescription}>
            다양한 사용 사례에 맞는 BoardRow 예제입니다.
          </p>
        </div>

        {/* Basic Example */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Basic BoardRow</h3>
          <LivePreview
            title="기본 사용법"
            description="가장 기본적인 BoardRow 사용 예제입니다. 클릭하면 콘텐츠가 펼쳐집니다."
            editable
            code={`<BoardRow title="자주 묻는 질문">
  <p>여기에 답변 내용이 표시됩니다. 클릭하여 펼치거나 접을 수 있습니다.</p>
</BoardRow>`}
          />
        </div>

        {/* Controlled Example */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Controlled (외부 상태 제어)</h3>
          <LivePreview
            title="외부 상태 제어"
            description="expanded와 onChange를 함께 전달하여 부모 컴포넌트에서 펼침 상태를 직접 관리합니다. 여러 BoardRow 중 하나만 펼치거나, 외부 버튼으로 토글하거나, 상태에 따른 추가 로직이 필요할 때 사용하세요."
            editable
            code={`const [isOpen, setIsOpen] = useState(false);

<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
  <button
    type="button"
    onClick={() => setIsOpen(!isOpen)}
    style={{
      padding: '0.5rem 1rem',
      borderRadius: '0.5rem',
      border: '1px solid #e5e7eb',
      backgroundColor: isOpen ? '#f59e0b' : '#ffffff',
      color: isOpen ? '#ffffff' : '#1a2332',
      cursor: 'pointer',
      alignSelf: 'flex-start',
    }}
  >
    {isOpen ? '접기' : '펼치기'}
  </button>
  <BoardRow
    title="외부에서 제어되는 섹션"
    variant="outlined"
    expanded={isOpen}
    onChange={(expanded) => setIsOpen(expanded)}
  >
    <p>expanded와 onChange를 통해 부모가 상태를 직접 관리합니다.</p>
    <p>외부 버튼과 헤더 클릭 모두로 토글할 수 있습니다.</p>
  </BoardRow>
</div>`}
          />
        </div>

        {/* Uncontrolled Example */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Uncontrolled (내부 상태 제어)</h3>
          <LivePreview
            title="내부 상태 제어"
            description="defaultExpanded로 초기 상태만 설정하면 컴포넌트가 자체적으로 펼침 상태를 관리합니다. 단순 FAQ나 토글 영역처럼 외부에서 상태를 추적할 필요가 없을 때 적합합니다."
            editable
            code={`<div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
  <BoardRow title="기본 접힌 상태" variant="outlined">
    <p>defaultExpanded를 생략하면 기본적으로 접힌 상태입니다.</p>
  </BoardRow>
  <BoardRow title="기본 펼쳐진 상태" variant="outlined" defaultExpanded>
    <p>defaultExpanded={'{true}'}로 설정하면 처음부터 펼쳐져 있습니다.</p>
  </BoardRow>
</div>`}
          />
        </div>

        {/* Variants Example */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Variants</h3>
          <LivePreview
            title="스타일 변형"
            description="default, outlined, filled 세 가지 시각적 스타일을 제공합니다."
            editable
            code={`<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
  <BoardRow title="Default 스타일" defaultExpanded>
    <p>기본 스타일입니다. 배경이 투명합니다.</p>
  </BoardRow>
  <BoardRow title="Outlined 스타일" variant="outlined" defaultExpanded>
    <p>테두리가 있는 스타일입니다.</p>
  </BoardRow>
  <BoardRow title="Filled 스타일" variant="filled" defaultExpanded>
    <p>배경색이 채워진 스타일입니다.</p>
  </BoardRow>
</div>`}
          />
        </div>

        {/* Accordion Pattern (Controlled) */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>
            Accordion Pattern (하나만 펼치기)
          </h3>
          <LivePreview
            title="아코디언 패턴"
            description="controlled 모드를 활용하여 여러 BoardRow 중 하나만 펼쳐지도록 구현할 수 있습니다. onChange 콜백으로 현재 열린 항목을 추적합니다."
            editable
            code={`const [openIndex, setOpenIndex] = useState(null);
const items = [
  { title: '배송은 얼마나 걸리나요?', content: '주문 후 2~3일 이내에 배송됩니다.' },
  { title: '반품은 어떻게 하나요?', content: '수령 후 7일 이내에 반품 신청이 가능합니다.' },
  { title: '결제 수단은 무엇이 있나요?', content: '신용카드, 계좌이체, 간편결제를 지원합니다.' },
];

<div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
  {items.map((item, index) => (
    <BoardRow
      key={index}
      title={item.title}
      variant="outlined"
      expanded={openIndex === index}
      onChange={(expanded) => setOpenIndex(expanded ? index : null)}
    >
      <p>{item.content}</p>
    </BoardRow>
  ))}
</div>`}
          />
        </div>

        {/* Disabled Example */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Disabled</h3>
          <LivePreview
            title="비활성화 상태"
            description="disabled prop으로 토글 기능을 비활성화할 수 있습니다."
            editable
            code={`<div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
  <BoardRow title="비활성화됨 (접힌 상태)" variant="outlined" disabled>
    <p>이 콘텐츠는 볼 수 없습니다.</p>
  </BoardRow>
  <BoardRow title="비활성화됨 (펼쳐진 상태)" variant="outlined" defaultExpanded disabled>
    <p>펼쳐진 상태로 비활성화되어 접을 수 없습니다.</p>
  </BoardRow>
</div>`}
          />
        </div>

        {/* Rich Content Example */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Rich Content</h3>
          <LivePreview
            title="다양한 콘텐츠"
            description="title과 children에 ReactNode를 전달하여 다양한 콘텐츠를 표시할 수 있습니다."
            editable
            code={`<BoardRow
  title={
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <span style={{ fontSize: '1.25rem' }}>📋</span>
      <span>주문 상세 정보</span>
      <span style={{
        padding: '0.125rem 0.5rem',
        fontSize: '0.75rem',
        backgroundColor: '#dbeafe',
        color: '#1d4ed8',
        borderRadius: '9999px',
      }}>3건</span>
    </div>
  }
  variant="outlined"
  defaultExpanded
>
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #e5e7eb' }}>
      <span>상품 A</span>
      <span style={{ fontWeight: 600 }}>25,000원</span>
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #e5e7eb' }}>
      <span>상품 B</span>
      <span style={{ fontWeight: 600 }}>15,000원</span>
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
      <span style={{ fontWeight: 700 }}>합계</span>
      <span style={{ fontWeight: 700, color: '#f59e0b' }}>40,000원</span>
    </div>
  </div>
</BoardRow>`}
          />
        </div>
      </section>

      {/* Props API */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Props API</h2>
          <p className={styles.sectionDescription}>
            BoardRow 컴포넌트의 모든 Props와 타입 정보입니다.
          </p>
        </div>
        <div className={styles.propsTableWrapper}>
          <PropsTable props={propsData} />
        </div>
      </section>

      {/* Accessibility */}
      <AccessibilitySection
        componentName="BoardRow"
        intro="별도 설정 없이도 접근성을 갖춘 아코디언을 제공합니다."
        features={[
          {
            attribute: 'aria-expanded',
            effect: '펼침/접힘 상태를 스크린 리더에 알립니다.',
            description:
              '헤더 버튼에 aria-expanded가 자동으로 설정되어 현재 상태를 전달합니다.',
          },
          {
            attribute: 'aria-controls',
            effect: '버튼이 제어하는 콘텐츠 영역을 알립니다.',
            description:
              '헤더 버튼과 콘텐츠 영역이 aria-controls로 연결되어 관계를 명확히 합니다.',
          },
          {
            attribute: 'role="region"',
            effect: '콘텐츠 영역을 랜드마크로 인식시킵니다.',
            description:
              '펼쳐지는 콘텐츠에 role="region"이 설정되어 스크린 리더 사용자가 영역을 파악할 수 있습니다.',
          },
          {
            attribute: 'aria-labelledby',
            effect: '콘텐츠 영역의 제목을 스크린 리더에 알립니다.',
            description:
              '콘텐츠가 헤더와 aria-labelledby로 연결되어 영역의 용도를 설명합니다.',
          },
          {
            attribute: 'disabled',
            effect: '비활성화 상태를 스크린 리더에 알립니다.',
            description:
              '헤더 버튼에 disabled가 설정되어 상호작용 불가 상태임을 전달합니다.',
          },
        ]}
        additionalGuidance={[
          {
            title: '명확한 제목 제공하기',
            description: '펼쳐질 콘텐츠가 무엇인지 명확한 제목을 제공해주세요.',
            examples: [
              {
                code: `// Good ✓
<BoardRow title="배송 안내">
  <p>주문 후 2~3일 이내에 배송됩니다.</p>
</BoardRow>

// Bad ✗
<BoardRow title="더 보기">
  <p>배송 관련 내용...</p>
</BoardRow>`,
                explanation:
                  '제목만으로 콘텐츠의 내용을 예측할 수 있어야 합니다.',
              },
            ],
          },
          {
            title: '아코디언 패턴에서 키보드 접근성',
            description:
              '여러 BoardRow를 묶어 사용할 때 Tab 키로 각 헤더 사이를 이동할 수 있습니다.',
            examples: [
              {
                code: `// Good ✓ - 각 헤더가 button이므로 Tab 순서 자동 관리
<BoardRow title="질문 1" variant="outlined">
  <p>답변 1</p>
</BoardRow>
<BoardRow title="질문 2" variant="outlined">
  <p>답변 2</p>
</BoardRow>`,
                explanation:
                  '각 헤더가 button 요소이므로 키보드 내비게이션이 기본 지원됩니다.',
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
            BoardRow를 효과적으로 사용하기 위한 권장사항입니다.
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
                <ListItem>콘텐츠의 내용을 명확히 나타내는 제목 사용</ListItem>
                <ListItem>FAQ 등 반복적인 항목에 활용</ListItem>
                <ListItem>하나만 펼치기 패턴에는 controlled 모드 사용</ListItem>
                <ListItem>단순 토글에는 uncontrolled 모드 사용</ListItem>
                <ListItem>관련된 BoardRow끼리 그룹핑</ListItem>
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
                <ListItem>중요한 정보를 접힌 상태로만 제공하지 않기</ListItem>
                <ListItem>너무 많은 BoardRow를 중첩하지 않기</ListItem>
                <ListItem>짧은 콘텐츠에 불필요하게 사용하지 않기</ListItem>
                <ListItem>"더 보기" 같은 모호한 제목 사용하지 않기</ListItem>
                <ListItem>disabled 상태를 과도하게 사용하지 않기</ListItem>
              </List>
            </Card.Body>
          </Card>
        </div>
      </section>
    </article>
  );
}
