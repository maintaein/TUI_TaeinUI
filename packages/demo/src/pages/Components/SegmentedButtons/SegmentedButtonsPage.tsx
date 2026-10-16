import { Card, List, ListItem } from '@taein-ui/core';
import { LivePreview } from '../../../components/LivePreview';
import { CodeBlock } from '../../../components/CodeBlock';
import { PropsTable } from '../../../components/PropsTable';
import type { PropDefinition } from '../../../components/PropsTable/PropsTable';
import { AccessibilitySection } from '../../../components/AccessibilitySection';
import * as styles from './SegmentedButtonsPage.css';

export function SegmentedButtonsPage() {
  const propsData: PropDefinition[] = [
    {
      name: 'options',
      type: 'SegmentedButtonOption[]',
      required: true,
      description: '옵션 목록 ({ value, label, icon?, iconOnly?, disabled? })',
    },
    {
      name: 'value',
      type: 'string',
      default: 'undefined',
      description: '선택된 값 (controlled)',
    },
    {
      name: 'defaultValue',
      type: 'string',
      default: 'undefined',
      description: '초기 선택 값 (uncontrolled)',
    },
    {
      name: 'onChange',
      type: '(value: string) => void',
      default: 'undefined',
      description: '값 변경 핸들러',
    },
    {
      name: 'size',
      type: "'sm' | 'md' | 'lg'",
      default: "'md'",
      description: '크기. sm은 보이는 높이 36px, 누르는 영역은 44px입니다',
    },
    {
      name: 'fullWidth',
      type: 'boolean',
      default: 'false',
      description: '전체 너비 사용',
    },
    {
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description: '전체 비활성화',
    },
    {
      name: 'aria-label',
      type: 'string',
      default: 'undefined',
      description: '접근성: 그룹 레이블',
    },
  ];

  return (
    <article className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>SegmentedButtons</h1>
        <p className={styles.description}>
          SegmentedButtons 컴포넌트는 보기 모드, 정렬 방식, 탭 전환 등 여러 옵션
          중 하나를 선택할 때 사용합니다.
        </p>
      </header>

      {/* Quick Reference */}
      <section className={styles.quickReference}>
        <Card className={styles.quickRefCard}>
          <Card.Body padding="md">
            <h3 className={styles.quickRefTitle}>Import</h3>
            <CodeBlock
              language="typescript"
              code={`import { SegmentedButtons } from '@taein-ui/core';`}
            />
          </Card.Body>
        </Card>
        <Card className={styles.quickRefCard}>
          <Card.Body padding="md">
            <h3 className={styles.quickRefTitle}>Basic Usage</h3>
            <CodeBlock
              language="tsx"
              code={`<SegmentedButtons
  options={[
    { value: 'day', label: '일간' },
    { value: 'week', label: '주간' },
    { value: 'month', label: '월간' },
  ]}
  value={selected}
  onChange={setSelected}
  aria-label="기간 선택"
/>`}
            />
          </Card.Body>
        </Card>
      </section>

      {/* Examples Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Examples</h2>
          <p className={styles.sectionDescription}>
            다양한 사용 사례에 맞는 SegmentedButtons 예제입니다.
          </p>
        </div>

        {/* Basic Example */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Basic SegmentedButtons</h3>
          <LivePreview
            title="기본 사용법"
            description="가장 기본적인 SegmentedButtons 사용 예제입니다."
            editable
            code={`const [selected, setSelected] = useState('day');

<SegmentedButtons
  options={[
    { value: 'day', label: '일간' },
    { value: 'week', label: '주간' },
    { value: 'month', label: '월간' },
  ]}
  value={selected}
  onChange={setSelected}
  aria-label="기간 선택"
/>`}
          />
        </div>

        {/* Controlled State Example */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Controlled (외부 상태 제어)</h3>
          <LivePreview
            title="외부 상태 제어"
            description="value와 onChange를 함께 전달하여 부모 컴포넌트에서 선택 상태를 직접 관리합니다. 선택 값에 따라 다른 UI를 조건부 렌더링하거나, 서버에 즉시 반영하거나, 여러 컴포넌트 간 상태를 동기화해야 할 때 사용하세요."
            editable
            code={`const [view, setView] = useState('list');

<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
  <SegmentedButtons
    options={[
      { value: 'list', label: '리스트' },
      { value: 'grid', label: '그리드' },
      { value: 'table', label: '테이블' },
    ]}
    value={view}
    onChange={setView}
    aria-label="보기 방식"
  />
  <div style={{
    padding: '1rem',
    borderRadius: '0.5rem',
    backgroundColor: '#f3f4f6',
    fontSize: '0.875rem',
    color: '#374151',
  }}>
    현재 선택: <strong>{view}</strong>
  </div>
</div>`}
          />
        </div>

        {/* Uncontrolled State Example */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Uncontrolled (내부 상태 제어)</h3>
          <LivePreview
            title="내부 상태 제어"
            description="defaultValue로 초기값만 설정하면 컴포넌트가 자체적으로 선택 상태를 관리합니다. 선택 상태를 외부에서 추적할 필요가 없거나, 폼 제출 시 한 번에 수집하거나, 단순한 UI 필터링에 적합합니다."
            editable
            code={`<SegmentedButtons
  options={[
    { value: 'all', label: '전체' },
    { value: 'active', label: '활성' },
    { value: 'inactive', label: '비활성' },
  ]}
  defaultValue="all"
  aria-label="상태 필터"
/>`}
          />
        </div>

        {/* Sizes Example */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Sizes</h3>
          <LivePreview
            title="크기 옵션"
            description="sm, md, lg 세 가지 크기를 제공합니다."
            editable
            code={`<div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
  <SegmentedButtons
    options={[
      { value: 'a', label: 'Small' },
      { value: 'b', label: 'Option' },
      { value: 'c', label: 'Size' },
    ]}
    defaultValue="a"
    size="sm"
    aria-label="Small 크기"
  />
  <SegmentedButtons
    options={[
      { value: 'a', label: 'Medium' },
      { value: 'b', label: 'Option' },
      { value: 'c', label: 'Size' },
    ]}
    defaultValue="a"
    size="md"
    aria-label="Medium 크기"
  />
  <SegmentedButtons
    options={[
      { value: 'a', label: 'Large' },
      { value: 'b', label: 'Option' },
      { value: 'c', label: 'Size' },
    ]}
    defaultValue="a"
    size="lg"
    aria-label="Large 크기"
  />
</div>`}
          />
        </div>

        {/* Full Width Example */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Full Width</h3>
          <LivePreview
            title="전체 너비"
            description="fullWidth prop으로 부모 요소의 전체 너비를 채웁니다."
            editable
            code={`<SegmentedButtons
  options={[
    { value: 'left', label: '왼쪽' },
    { value: 'center', label: '가운데' },
    { value: 'right', label: '오른쪽' },
  ]}
  defaultValue="center"
  fullWidth
  aria-label="정렬 선택"
/>`}
          />
        </div>

        {/* With Icons Example */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>With Icons</h3>
          <LivePreview
            title="아이콘 포함"
            description="options에 icon을 추가하면 레이블과 함께 아이콘을 표시할 수 있습니다."
            editable
            code={`const [selected, setSelected] = useState('list');

<SegmentedButtons
  options={[
    { value: 'list', label: '리스트', icon: <LayoutList size={18} /> },
    { value: 'grid', label: '그리드', icon: <LayoutGrid size={18} /> },
    { value: 'card', label: '카드', icon: <LayoutDashboard size={18} /> },
  ]}
  value={selected}
  onChange={setSelected}
  aria-label="보기 형식"
/>`}
          />
        </div>

        {/* Icon Only Example */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Icon Only</h3>
          <LivePreview
            title="아이콘만 표시"
            description="iconOnly 옵션으로 아이콘만 표시합니다. 공간이 제한된 도구 모음 등에서 유용합니다."
            editable
            code={`const [align, setAlign] = useState('left');

<SegmentedButtons
  options={[
    { value: 'left', label: '왼쪽 정렬', icon: <AlignLeft size={18} />, iconOnly: true },
    { value: 'center', label: '가운데 정렬', icon: <AlignCenter size={18} />, iconOnly: true },
    { value: 'right', label: '오른쪽 정렬', icon: <AlignRight size={18} />, iconOnly: true },
  ]}
  value={align}
  onChange={setAlign}
  aria-label="텍스트 정렬"
/>`}
          />
        </div>

        {/* Disabled Example */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Disabled</h3>
          <LivePreview
            title="비활성화 상태"
            description="disabled prop으로 전체 비활성화하거나, 개별 옵션의 disabled로 특정 옵션만 비활성화할 수 있습니다."
            editable
            code={`<div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
  <SegmentedButtons
    options={[
      { value: 'a', label: '옵션 A' },
      { value: 'b', label: '옵션 B' },
      { value: 'c', label: '옵션 C' },
    ]}
    defaultValue="a"
    disabled
    aria-label="전체 비활성화"
  />
  <SegmentedButtons
    options={[
      { value: 'basic', label: 'Basic' },
      { value: 'pro', label: 'Pro' },
      { value: 'enterprise', label: 'Enterprise', disabled: true },
    ]}
    defaultValue="basic"
    aria-label="개별 옵션 비활성화"
  />
</div>`}
          />
        </div>

        {/* Many Options Example */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Many Options</h3>
          <LivePreview
            title="다수의 옵션"
            description="여러 개의 옵션을 나열할 수 있습니다. 옵션이 많을 경우 fullWidth와 함께 사용하면 균등하게 배치됩니다."
            editable
            code={`const [day, setDay] = useState('mon');

<SegmentedButtons
  options={[
    { value: 'mon', label: '월' },
    { value: 'tue', label: '화' },
    { value: 'wed', label: '수' },
    { value: 'thu', label: '목' },
    { value: 'fri', label: '금' },
    { value: 'sat', label: '토' },
    { value: 'sun', label: '일' },
  ]}
  value={day}
  onChange={setDay}
  fullWidth
  aria-label="요일 선택"
/>`}
          />
        </div>
      </section>

      {/* Props API */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Props API</h2>
          <p className={styles.sectionDescription}>
            SegmentedButtons 컴포넌트의 모든 Props와 타입 정보입니다.
          </p>
        </div>
        <div className={styles.propsTableWrapper}>
          <PropsTable props={propsData} />
        </div>
      </section>

      {/* Accessibility */}
      <AccessibilitySection
        componentName="SegmentedButtons"
        intro="SegmentedButtons 컴포넌트는 다음과 같이 기본적인 접근성을 제공합니다. 덕분에 별도의 설정 없이도 기본적으로 사용자의 접근성을 고려한 형태의 SegmentedButtons 컴포넌트를 제공할 수 있습니다."
        features={[
          {
            attribute: 'role="radiogroup"',
            effect: '스크린 리더에서 "라디오 그룹"으로 인식합니다.',
            description:
              'role="radiogroup"이 컨테이너에 설정되어 옵션 그룹이라는 맥락을 제공합니다.',
          },
          {
            attribute: 'role="radio"',
            effect: '각 옵션을 스크린 리더가 "라디오 버튼"으로 읽어줍니다.',
            description:
              '내부 input[type="radio"]가 사용되어 단일 선택 패턴임을 명확히 전달합니다.',
          },
          {
            attribute: 'aria-label',
            effect: '그룹의 용도를 스크린 리더가 읽어줍니다.',
            description:
              'aria-label로 그룹 레이블을 제공하여 무엇을 선택하는 그룹인지 알 수 있습니다.',
          },
          {
            attribute: 'aria-checked',
            effect: '현재 선택 상태를 스크린 리더가 알려줍니다.',
            description:
              'aria-checked="true|false"로 각 옵션의 선택 여부를 명확히 전달합니다.',
          },
          {
            attribute: 'keyboard navigation',
            effect: '화살표 키로 옵션 간 이동이 가능합니다.',
            description:
              'ArrowLeft/Right로 이전/다음 옵션 이동, Space/Enter로 선택, Tab으로 그룹 진입/이탈이 가능합니다.',
          },
          {
            attribute: 'disabled',
            effect: '비활성화 상태를 스크린 리더에서 알려줍니다.',
            description:
              'aria-disabled="true"가 설정되어 선택할 수 없는 상태임을 전달하고, 키보드 내비게이션에서도 건너뜁니다.',
          },
        ]}
        additionalGuidance={[
          {
            title: 'aria-label 필수 제공',
            description:
              '그룹의 목적을 명확히 전달하기 위해 aria-label을 반드시 제공해주세요.',
            examples: [
              {
                code: `// Good ✓
<SegmentedButtons
  options={options}
  aria-label="보기 방식 선택"
/>

// Bad ✗
<SegmentedButtons
  options={options}
/>`,
                explanation:
                  'aria-label 없이는 스크린 리더 사용자가 무엇을 선택하는 그룹인지 알 수 없습니다.',
              },
            ],
          },
          {
            title: 'iconOnly 사용 시 label 유지',
            description:
              'iconOnly를 사용하더라도 label은 반드시 제공해주세요. 스크린 리더가 아이콘 대신 label을 읽어줍니다.',
            examples: [
              {
                code: `// Good ✓
{ value: 'left', label: '왼쪽 정렬', icon: <AlignLeft />, iconOnly: true }

// Bad ✗
{ value: 'left', label: '', icon: <AlignLeft />, iconOnly: true }`,
                explanation:
                  '시각적으로 보이지 않더라도 label은 접근성을 위해 필수입니다.',
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
            SegmentedButtons를 효과적으로 사용하기 위한 권장사항입니다.
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
                <ListItem>2~7개 사이의 옵션에 사용</ListItem>
                <ListItem>짧고 명확한 레이블 사용</ListItem>
                <ListItem>상호 배타적인 옵션에 사용 (단일 선택)</ListItem>
                <ListItem>보기 방식, 필터, 모드 전환 등에 활용</ListItem>
                <ListItem>aria-label로 그룹의 목적을 명시</ListItem>
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
                  8개 이상의 옵션에 사용하지 않기 (Select 권장)
                </ListItem>
                <ListItem>
                  다중 선택이 필요한 경우 사용하지 않기 (Checkbox 권장)
                </ListItem>
                <ListItem>긴 레이블 사용하지 않기 (2-3단어 이내 권장)</ListItem>
                <ListItem>
                  네비게이션 탭 대신 사용하지 않기 (Tabs 권장)
                </ListItem>
                <ListItem>iconOnly 사용 시 label을 비워두지 않기</ListItem>
              </List>
            </Card.Body>
          </Card>
        </div>
      </section>
    </article>
  );
}
