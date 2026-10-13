import { Card, List, ListItem } from '@taein-ui/core';
import { LivePreview } from '../../../components/LivePreview';
import { CodeBlock } from '../../../components/CodeBlock';
import { PropsTable } from '../../../components/PropsTable';
import type { PropDefinition } from '../../../components/PropsTable/PropsTable';
import { AccessibilitySection } from '../../../components/AccessibilitySection';
import * as styles from './ChipPage.css';

export function ChipPage() {
  const propsData: PropDefinition[] = [
    {
      name: 'label',
      type: 'string',
      required: true,
      description: '칩에 표시할 텍스트',
    },
    {
      name: 'size',
      type: "'sm' | 'md' | 'lg'",
      default: "'md'",
      description: '칩 크기',
    },
    {
      name: 'variant',
      type: "'filled' | 'outlined'",
      default: "'filled'",
      description: '칩 스타일 (채움 / 테두리)',
    },
    {
      name: 'color',
      type: "'default' | 'primary' | 'success' | 'error' | 'warning'",
      default: "'default'",
      description: '칩 색상',
    },
    {
      name: 'icon',
      type: 'ReactNode',
      default: 'undefined',
      description: '라벨 앞에 표시할 아이콘',
    },
    {
      name: 'avatar',
      type: 'ReactNode',
      default: 'undefined',
      description: '라벨 앞에 표시할 아바타',
    },
    {
      name: 'onDelete',
      type: '() => void',
      default: 'undefined',
      description:
        '삭제 핸들러 (설정 시 삭제 아이콘 표시). 퇴장 애니메이션이 끝난 뒤 불린다. 퇴장 중 칩이 언마운트되면 불리지 않는다. 칩을 목록에서 지우지 않으면 보이지 않는 채로 남는다',
    },
    {
      name: 'clickable',
      type: 'boolean',
      default: 'false',
      description: '클릭 가능 여부 (true + onClick 시 button으로 렌더링)',
    },
    {
      name: 'selected',
      type: 'boolean',
      default: 'false',
      description: '선택 상태 (색상별 inset border 표시)',
    },
    {
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description: '비활성화 상태',
    },
    {
      name: 'onClick',
      type: '() => void',
      default: 'undefined',
      description: '클릭 핸들러 (clickable과 함께 사용)',
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
        <h1 className={styles.title}>Chip</h1>
        <p className={styles.description}>
          Chip 컴포넌트는 태그, 필터, 카테고리 표시 등 짧은 정보를 라벨 형태로
          나타낼 때 사용합니다. 선택, 삭제, 클릭 등의 인터랙션도 지원합니다.
        </p>
      </header>

      {/* Quick Reference */}
      <section className={styles.quickReference}>
        <Card className={styles.quickRefCard}>
          <Card.Body padding="md">
            <h3 className={styles.quickRefTitle}>Import</h3>
            <CodeBlock
              language="typescript"
              code={`import { Chip } from '@taein-ui/core';`}
            />
          </Card.Body>
        </Card>
        <Card className={styles.quickRefCard}>
          <Card.Body padding="md">
            <h3 className={styles.quickRefTitle}>Basic Usage</h3>
            <CodeBlock
              language="tsx"
              code={`<Chip label="태그" />
<Chip label="Outlined" variant="outlined" />`}
            />
          </Card.Body>
        </Card>
      </section>

      {/* Examples Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Examples</h2>
          <p className={styles.sectionDescription}>
            다양한 사용 사례에 맞는 Chip 예제입니다.
          </p>
        </div>

        {/* Basic */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Basic Chip</h3>
          <LivePreview
            title="기본 사용법"
            description="Filled(기본)와 Outlined 두 가지 variant를 제공합니다."
            editable
            code={`<div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
  <Chip label="Filled" />
  <Chip label="Outlined" variant="outlined" />
</div>`}
          />
        </div>

        {/* Colors — Filled */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Colors (Filled)</h3>
          <LivePreview
            title="Filled 색상"
            description="default, primary, success, error, warning 5가지 색상을 제공합니다."
            editable
            code={`<div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
  <Chip label="Default" color="default" />
  <Chip label="Primary" color="primary" />
  <Chip label="Success" color="success" />
  <Chip label="Error" color="error" />
  <Chip label="Warning" color="warning" />
</div>`}
          />
        </div>

        {/* Colors — Outlined */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Colors (Outlined)</h3>
          <LivePreview
            title="Outlined 색상"
            description="Outlined variant에서도 동일한 5가지 색상을 사용할 수 있습니다."
            editable
            code={`<div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
  <Chip label="Default" variant="outlined" color="default" />
  <Chip label="Primary" variant="outlined" color="primary" />
  <Chip label="Success" variant="outlined" color="success" />
  <Chip label="Error" variant="outlined" color="error" />
  <Chip label="Warning" variant="outlined" color="warning" />
</div>`}
          />
        </div>

        {/* Sizes */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Sizes</h3>
          <LivePreview
            title="크기"
            description="sm, md, lg 3가지 크기를 제공합니다."
            editable
            code={`<div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
  <Chip label="Small" size="sm" />
  <Chip label="Medium" size="md" />
  <Chip label="Large" size="lg" />
</div>`}
          />
        </div>

        {/* With Icon */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>With Icon</h3>
          <LivePreview
            title="아이콘 포함"
            description="icon prop으로 라벨 앞에 아이콘을 표시합니다."
            editable
            code={`<div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
  <Chip label="추가" icon={<Plus size={16} />} color="primary" />
  <Chip label="추가" icon={<Plus size={16} />} variant="outlined" color="primary" />
  <Chip label="닫기" icon={<X size={16} />} color="error" />
</div>`}
          />
        </div>

        {/* With Avatar */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>With Avatar</h3>
          <LivePreview
            title="아바타 포함"
            description="avatar prop으로 사용자 프로필 등을 라벨 앞에 표시합니다."
            editable
            code={`<div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
  <Chip label="홍길동" avatar={<Avatar alt="홍길동" size="xs" />} />
  <Chip label="김철수" avatar={<Avatar src="https://i.pravatar.cc/150?img=3" alt="김철수" size="xs" />} />
  <Chip label="이영희" avatar={<Avatar alt="이영희" size="xs" />} variant="outlined" />
</div>`}
          />
        </div>

        {/* Deletable */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Deletable</h3>
          <LivePreview
            title="삭제 가능"
            description="onDelete를 전달하면 삭제 아이콘이 표시됩니다."
            editable
            code={`const [chips, setChips] = useState(['React', 'TypeScript', 'Vite']);
const handleDelete = (chipToDelete) => {
  setChips(chips.filter((c) => c !== chipToDelete));
};

<div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
  {chips.map((c) => (
    <Chip key={c} label={c} color="primary" onDelete={() => handleDelete(c)} />
  ))}
  {chips.length === 0 && <p style={{ margin: 0, fontSize: '0.875rem', color: themeContract.color.text.secondary }}>모두 삭제됨</p>}
</div>`}
          />
        </div>

        {/* Clickable */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Clickable</h3>
          <LivePreview
            title="클릭 가능"
            description="clickable과 onClick을 함께 사용하면 button으로 렌더링되어 클릭 인터랙션을 제공합니다."
            editable
            code={`const [count, setCount] = useState(0);

<div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
  <Chip label={'클릭: ' + count + '회'} clickable onClick={() => setCount(count + 1)} color="primary" />
  <Chip label="Outlined" clickable onClick={() => alert('클릭!')} variant="outlined" />
</div>`}
          />
        </div>

        {/* Selected */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Selected</h3>
          <LivePreview
            title="선택 상태"
            description="selected prop으로 선택 상태를 표시합니다. 필터, 토글 그룹 등에 활용합니다."
            editable
            code={`const [selected, setSelected] = useState(['React']);
const tags = ['React', 'Vue', 'Angular', 'Svelte'];
const toggle = (tag) => {
  setSelected(selected.includes(tag) ? selected.filter((t) => t !== tag) : [...selected, tag]);
};

<div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
  {tags.map((tag) => (
    <Chip
      key={tag}
      label={tag}
      color="primary"
      variant="outlined"
      selected={selected.includes(tag)}
      clickable
      onClick={() => toggle(tag)}
    />
  ))}
</div>`}
          />
        </div>

        {/* Disabled */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Disabled</h3>
          <LivePreview
            title="비활성화"
            description="disabled prop으로 칩을 비활성화합니다."
            editable
            code={`<div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
  <Chip label="Disabled" disabled />
  <Chip label="Disabled" variant="outlined" disabled />
  <Chip label="Disabled" color="primary" disabled />
  <Chip label="Disabled" color="primary" variant="outlined" disabled />
</div>`}
          />
        </div>

        {/* Combination */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Combination</h3>
          <LivePreview
            title="조합 예제"
            description="다양한 prop을 조합한 실제 사용 예시입니다."
            editable
            code={`const [users, setUsers] = useState(['홍길동', '김철수']);

<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
  {/* 태그 목록 */}
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
    <Chip label="디자인 시스템" color="primary" size="sm" />
    <Chip label="React" color="success" size="sm" />
    <Chip label="TypeScript" variant="outlined" color="primary" size="sm" />
  </div>

  {/* 사용자 칩 */}
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
    {users.includes('홍길동') && (
      <Chip label="홍길동" avatar={<Avatar alt="홍길동" size="xs" />} onDelete={() => setUsers((prev) => prev.filter((u) => u !== '홍길동'))} />
    )}
    {users.includes('김철수') && (
      <Chip label="김철수" avatar={<Avatar src="https://i.pravatar.cc/150?img=5" alt="김철수" size="xs" />} onDelete={() => setUsers((prev) => prev.filter((u) => u !== '김철수'))} />
    )}
  </div>

  {/* 상태 칩 */}
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
    <Chip label="완료" color="success" size="sm" />
    <Chip label="진행 중" color="warning" size="sm" />
    <Chip label="오류" color="error" size="sm" />
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
            Chip 컴포넌트의 모든 Props와 타입 정보입니다.
          </p>
        </div>
        <div className={styles.propsTableWrapper}>
          <PropsTable props={propsData} />
        </div>
      </section>

      {/* Accessibility */}
      <AccessibilitySection
        componentName="Chip"
        intro="Chip 컴포넌트는 다음과 같은 접근성을 기본 제공합니다."
        features={[
          {
            attribute: '<button> / <div>',
            effect: 'clickable 여부에 따라 적절한 요소로 렌더링됩니다.',
            description:
              'clickable + onClick이면 button으로, 아니면 div로 렌더링되어 역할이 올바르게 전달됩니다.',
          },
          {
            attribute: 'aria-label',
            effect: '칩의 라벨을 스크린 리더에 전달합니다.',
            description:
              'clickable 칩에 aria-label이 label 값으로 자동 설정됩니다.',
          },
          {
            attribute: 'aria-disabled',
            effect: '비활성화 상태를 알립니다.',
            description: 'disabled일 때 aria-disabled="true"가 설정됩니다.',
          },
          {
            attribute: '삭제 버튼 aria-label',
            effect: '삭제 버튼에 "{label} 삭제" 레이블이 제공됩니다.',
            description:
              'onDelete가 있을 때 삭제 버튼에 접근 가능한 이름이 자동 설정됩니다.',
          },
          {
            attribute: 'focus-visible',
            effect: '키보드 포커스 시 아웃라인이 표시됩니다.',
            description:
              'clickable 칩과 삭제 버튼에 포커스 인디케이터가 제공됩니다.',
          },
        ]}
        additionalGuidance={[
          {
            title: 'Badge와의 구분',
            description:
              'Badge는 숫자나 상태를 다른 요소 위에 표시하는 용도이고, Chip은 독립적인 태그/필터/선택 요소입니다.',
            examples: [
              {
                code: `// Chip: 태그, 필터, 선택 항목
<Chip label="React" color="primary" />
<Chip label="완료" color="success" />

// Badge: 다른 요소에 부착되는 카운터/상태
<Badge count={5}>알림</Badge>`,
                explanation:
                  'Chip은 독립적으로 사용하고, Badge는 다른 요소에 부착하여 사용합니다.',
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
            Chip을 효과적으로 사용하기 위한 권장사항입니다.
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
                  태그, 카테고리, 필터 등 간결한 정보 표시에 사용
                </ListItem>
                <ListItem>삭제 가능한 칩으로 선택 해제 기능 제공</ListItem>
                <ListItem>
                  색상으로 상태 구분 (success=완료, error=오류 등)
                </ListItem>
                <ListItem>selected + clickable로 토글 필터 구현</ListItem>
                <ListItem>아바타 칩으로 사용자/멤버 표시</ListItem>
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
                  긴 텍스트를 label에 사용하지 않기 (2-3단어 이내)
                </ListItem>
                <ListItem>
                  버튼 대용으로 사용하지 않기 (액션은 Button 사용)
                </ListItem>
                <ListItem>clickable 없이 onClick만 전달하지 않기</ListItem>
                <ListItem>한 영역에 너무 많은 색상을 혼용하지 않기</ListItem>
                <ListItem>disabled 칩에 onDelete를 사용하지 않기</ListItem>
              </List>
            </Card.Body>
          </Card>
        </div>
      </section>
    </article>
  );
}
