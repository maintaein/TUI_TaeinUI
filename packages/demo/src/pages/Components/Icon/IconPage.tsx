import { Card, List, ListItem, Icon } from '@taein-ui/core';
import { LivePreview } from '../../../components/LivePreview';
import { CodeBlock } from '../../../components/CodeBlock';
import { PropsTable } from '../../../components/PropsTable';
import type { PropDefinition } from '../../../components/PropsTable/PropsTable';
import { AccessibilitySection } from '../../../components/AccessibilitySection';
import * as styles from './IconPage.css';

const ICON_NAMES = [
  'close',
  'plus',
  'minus',
  'chevron-down',
  'chevron-up',
] as const;

export function IconPage() {
  const propsData: PropDefinition[] = [
    {
      name: 'name',
      type: "'close' | 'plus' | 'minus' | 'chevron-down' | 'chevron-up'",
      required: true,
      description: '표시할 아이콘 이름',
    },
    {
      name: 'size',
      type: "'sm' | 'md' | 'lg' | 'xl'",
      default: "'md'",
      description: '아이콘 크기 (sm:16px, md:20px, lg:24px, xl:32px)',
    },
    {
      name: 'color',
      type: 'string',
      default: "'currentColor'",
      description: '아이콘 색상. CSS 색상 값을 직접 지정합니다.',
    },
    {
      name: 'aria-label',
      type: 'string',
      description:
        '접근성 레이블. 설정하면 role="img"로 변경되어 의미 있는 이미지로 인식됩니다.',
    },
    {
      name: 'title',
      type: 'string',
      description: 'SVG title 요소. 마우스 호버 시 툴팁으로 표시됩니다.',
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
        <h1 className={styles.title}>Icon</h1>
        <p className={styles.description}>
          Icon 컴포넌트는 버튼, 메뉴, 상태 표시 등 UI 곳곳에 아이콘을 넣을 때
          사용합니다. 닫기, 더하기, 빼기, 화살표 등 자주 쓰이는 아이콘을
          내장하고 있습니다.
        </p>
      </header>

      {/* Quick Reference */}
      <section className={styles.quickReference}>
        <Card className={styles.quickRefCard}>
          <Card.Body padding="md">
            <h3 className={styles.quickRefTitle}>Import</h3>
            <CodeBlock
              language="typescript"
              code={`import { Icon } from '@taein-ui/core';`}
            />
          </Card.Body>
        </Card>
        <Card className={styles.quickRefCard}>
          <Card.Body padding="md">
            <h3 className={styles.quickRefTitle}>Basic Usage</h3>
            <CodeBlock
              language="tsx"
              code={`<Icon name="close" />
<Icon name="plus" size="lg" color="#059669" />`}
            />
          </Card.Body>
        </Card>
      </section>

      {/* Icon Gallery */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Icon Gallery</h2>
          <p className={styles.sectionDescription}>
            현재 사용 가능한 모든 아이콘 목록입니다.
          </p>
        </div>

        <div className={styles.iconGallery}>
          {ICON_NAMES.map((name) => (
            <div key={name} className={styles.iconGalleryItem}>
              <Icon name={name} size="lg" />
              <span className={styles.iconGalleryName}>{name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Examples */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Examples</h2>
          <p className={styles.sectionDescription}>
            다양한 사용 사례에 맞는 Icon 예제입니다.
          </p>
        </div>

        {/* All Icons */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>All Icons</h3>
          <LivePreview
            title="모든 아이콘"
            description="name prop으로 아이콘을 선택합니다."
            editable
            code={`<div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
  <Icon name="close" />
  <Icon name="plus" />
  <Icon name="minus" />
  <Icon name="chevron-down" />
  <Icon name="chevron-up" />
</div>`}
          />
        </div>

        {/* Sizes */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Sizes</h3>
          <LivePreview
            title="크기 옵션"
            description="sm(16px), md(20px), lg(24px), xl(32px) 네 가지 크기를 제공합니다."
            editable
            code={`<div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
  <div style={{ textAlign: 'center' }}>
    <Icon name="plus" size="sm" />
    <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#6b7280' }}>sm (16px)</p>
  </div>
  <div style={{ textAlign: 'center' }}>
    <Icon name="plus" size="md" />
    <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#6b7280' }}>md (20px)</p>
  </div>
  <div style={{ textAlign: 'center' }}>
    <Icon name="plus" size="lg" />
    <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#6b7280' }}>lg (24px)</p>
  </div>
  <div style={{ textAlign: 'center' }}>
    <Icon name="plus" size="xl" />
    <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#6b7280' }}>xl (32px)</p>
  </div>
</div>`}
          />
        </div>

        {/* Custom Colors */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Custom Colors</h3>
          <LivePreview
            title="커스텀 색상"
            description="color prop으로 CSS 색상 값을 직접 지정합니다. 기본값은 currentColor로 부모의 텍스트 색상을 상속받습니다."
            editable
            code={`<div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
  <Icon name="plus" size="lg" color="#00C73C" />
  <Icon name="close" size="lg" color="#dc2626" />
  <Icon name="chevron-down" size="lg" color="#8b5cf6" />
  <Icon name="minus" size="lg" color="#0ea5e9" />
  <Icon name="chevron-up" size="lg" color="#f59e0b" />
</div>`}
          />
        </div>

        {/* currentColor Inheritance */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>
            Color Inheritance (currentColor)
          </h3>
          <LivePreview
            title="색상 상속"
            description="color를 지정하지 않으면 부모 요소의 텍스트 색상(currentColor)을 자동으로 상속받습니다."
            editable
            code={`<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
  <div style={{ color: '#00C73C', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
    <Icon name="plus" />
    <span style={{ fontSize: '0.875rem' }}>부모 색상을 상속받아 초록색</span>
  </div>
  <div style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
    <Icon name="close" />
    <span style={{ fontSize: '0.875rem' }}>부모 색상을 상속받아 빨간색</span>
  </div>
  <div style={{ color: '#6b7280', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
    <Icon name="chevron-down" />
    <span style={{ fontSize: '0.875rem' }}>부모 색상을 상속받아 회색</span>
  </div>
</div>`}
          />
        </div>

        {/* With Text */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>텍스트와 함께 사용</h3>
          <LivePreview
            title="인라인 배치"
            description="Icon은 inline-block으로 렌더링되어 텍스트 옆에 자연스럽게 배치됩니다. vertical-align: middle로 수직 정렬됩니다."
            editable
            code={`<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
    <Icon name="plus" size="sm" color="#00C73C" />
    <span>새 항목 추가</span>
  </div>
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
    <Icon name="close" size="sm" color="#dc2626" />
    <span>삭제</span>
  </div>
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
    <span>더 보기</span>
    <Icon name="chevron-down" size="sm" />
  </div>
</div>`}
          />
        </div>

        {/* Dark Background */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>어두운 배경에서 사용</h3>
          <LivePreview
            title="Dark Background"
            description="어두운 배경에서는 밝은 색상을 지정하거나 currentColor 상속을 활용합니다."
            editable
            code={`<div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', backgroundColor: '#1f2937', padding: '1.5rem', borderRadius: '0.75rem' }}>
  <Icon name="close" size="lg" color="#ffffff" />
  <Icon name="plus" size="lg" color="#34d399" />
  <Icon name="minus" size="lg" color="#fbbf24" />
  <Icon name="chevron-down" size="lg" color="#93c5fd" />
  <Icon name="chevron-up" size="lg" color="#f9a8d4" />
</div>`}
          />
        </div>

        {/* Decorative vs Meaningful */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>장식용 vs 의미 있는 아이콘</h3>
          <LivePreview
            title="접근성 모드"
            description="aria-label을 지정하면 의미 있는 이미지(role='img')로, 생략하면 장식용(aria-hidden='true')으로 자동 전환됩니다."
            editable
            code={`<div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
  {/* 장식용: 텍스트가 의미를 전달하므로 아이콘은 aria-hidden */}
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
    <Icon name="close" size="sm" color="#dc2626" />
    <span style={{ fontSize: '0.875rem' }}>닫기</span>
  </div>

  {/* 의미 있는 아이콘: 텍스트 없이 단독 사용 → aria-label 필수 */}
  <div style={{ display: 'flex', gap: '1rem' }}>
    <Icon name="close" size="lg" aria-label="닫기" />
    <Icon name="plus" size="lg" aria-label="추가" />
    <Icon name="chevron-down" size="lg" aria-label="펼치기" />
  </div>
</div>`}
          />
        </div>

        {/* With Button */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>버튼과 함께 사용</h3>
          <LivePreview
            title="Button + Icon 조합"
            description="Button의 leftIcon/rightIcon에 Icon 컴포넌트를 전달하거나, IconButton과 함께 사용합니다."
            editable
            code={`<div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
  <Button leftIcon={<Icon name="plus" size="sm" />}>추가</Button>
  <Button variant="danger" leftIcon={<Icon name="close" size="sm" />}>삭제</Button>
  <Button variant="light" rightIcon={<Icon name="chevron-down" size="sm" />}>더 보기</Button>
  <IconButton icon={<Icon name="close" />} aria-label="닫기" />
</div>`}
          />
        </div>
      </section>

      {/* Props API */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Props API</h2>
          <p className={styles.sectionDescription}>
            Icon 컴포넌트의 모든 Props와 타입 정보입니다. HTML SVG 속성도 모두
            사용 가능합니다.
          </p>
        </div>
        <div className={styles.propsTableWrapper}>
          <PropsTable props={propsData} />
        </div>
      </section>

      {/* IconName Type */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>IconName Type</h2>
          <p className={styles.sectionDescription}>
            사용 가능한 아이콘 이름은 타입으로 정의되어 있어 자동 완성과 타입
            검사가 가능합니다.
          </p>
        </div>
        <CodeBlock
          language="typescript"
          code={`import type { IconName } from '@taein-ui/core';

type IconName =
  | 'close'
  | 'plus'
  | 'minus'
  | 'chevron-down'
  | 'chevron-up';`}
        />
      </section>

      {/* Accessibility */}
      <AccessibilitySection
        componentName="Icon"
        intro="Icon 컴포넌트는 aria-label 유무에 따라 접근성 모드를 자동으로 전환합니다."
        features={[
          {
            attribute: 'aria-hidden="true"',
            effect: '장식용 아이콘으로 처리됩니다.',
            description:
              'aria-label이 없으면 자동으로 aria-hidden="true"가 설정되어 스크린 리더가 무시합니다.',
          },
          {
            attribute: 'role="img"',
            effect: '의미 있는 이미지로 인식됩니다.',
            description:
              'aria-label을 설정하면 role="img"가 추가되어 스크린 리더가 이미지로 읽어줍니다.',
          },
          {
            attribute: '<title>',
            effect: '마우스 호버 시 툴팁을 표시합니다.',
            description:
              'title prop을 설정하면 SVG 내부에 <title> 요소가 추가됩니다.',
          },
          {
            attribute: 'data-icon',
            effect: '어떤 아이콘인지 식별할 수 있습니다.',
            description:
              'data-icon 속성에 아이콘 이름이 설정되어 테스트나 디버깅에 활용할 수 있습니다.',
          },
        ]}
        additionalGuidance={[
          {
            title: '단독 사용 시 aria-label 필수',
            description:
              '텍스트 없이 아이콘만 단독으로 사용할 때는 반드시 aria-label을 제공하세요.',
            examples: [
              {
                code: `// Good — 단독 사용 시 aria-label 제공
<Icon name="close" aria-label="닫기" />

// Good — 텍스트와 함께 사용 시 장식용으로 처리
<button>
  <Icon name="plus" /> 추가하기
</button>

// Bad — 단독 사용인데 aria-label 없음
<button>
  <Icon name="close" />
</button>`,
                explanation:
                  '텍스트 레이블이 없는 아이콘은 스크린 리더 사용자가 용도를 알 수 없습니다.',
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
            Icon을 효과적으로 사용하기 위한 권장사항입니다.
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
                <ListItem>텍스트와 함께 사용하여 의미를 보강</ListItem>
                <ListItem>단독 사용 시 aria-label로 의미 전달</ListItem>
                <ListItem>
                  currentColor 상속을 활용하여 부모 색상과 통일
                </ListItem>
                <ListItem>버튼 내부 아이콘은 sm 크기 사용</ListItem>
                <ListItem>
                  의미가 직관적인 아이콘 선택 (close → 닫기, plus → 추가)
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
                  텍스트 없이 아이콘만 사용하면서 aria-label 생략하지 않기
                </ListItem>
                <ListItem>
                  아이콘에 직접 onClick 이벤트 걸지 않기 (IconButton 사용)
                </ListItem>
                <ListItem>
                  의미가 모호한 아이콘을 설명 없이 사용하지 않기
                </ListItem>
                <ListItem>
                  아이콘 크기를 주변 텍스트보다 과하게 크게 설정하지 않기
                </ListItem>
                <ListItem>색상 대비가 부족한 배경에서 사용하지 않기</ListItem>
              </List>
            </Card.Body>
          </Card>
        </div>
      </section>
    </article>
  );
}
