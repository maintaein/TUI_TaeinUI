import { Card, List, ListItem } from '@taein-ui/core';
import { LivePreview } from '../../../components/LivePreview';
import { CodeBlock } from '../../../components/CodeBlock';
import { PropsTable } from '../../../components/PropsTable';
import type { PropDefinition } from '../../../components/PropsTable/PropsTable';
import { AccessibilitySection } from '../../../components/AccessibilitySection';
import * as styles from './ButtonPage.css';

export function ButtonPage() {
  const propsData: PropDefinition[] = [
    {
      name: 'children',
      type: 'ReactNode',
      required: true,
      description: '버튼 텍스트 또는 콘텐츠',
    },
    {
      name: 'variant',
      type: "'primary' | 'dark' | 'danger' | 'light'",
      default: "'primary'",
      description: '버튼 색상 변형',
    },
    {
      name: 'buttonStyle',
      type: "'fill' | 'weak'",
      default: "'fill'",
      description: '버튼 스타일 (채움 / 약한)',
    },
    {
      name: 'size',
      type: "'sm' | 'md' | 'lg' | 'xl'",
      default: "'md'",
      description: '버튼 크기',
    },
    {
      name: 'fullWidth',
      type: 'boolean',
      default: 'false',
      description: '전체 너비 사용',
    },
    {
      name: 'loading',
      type: 'boolean',
      default: 'false',
      description: '로딩 상태 (LoadingSpinner 표시)',
    },
    {
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description: '비활성화 상태',
    },
    {
      name: 'leftIcon',
      type: 'ReactNode',
      default: 'undefined',
      description: '왼쪽 아이콘',
    },
    {
      name: 'rightIcon',
      type: 'ReactNode',
      default: 'undefined',
      description: '오른쪽 아이콘',
    },
    {
      name: 'customColor',
      type: '{ bg: string; text: string; hoverBg?: string; activeBg?: string }',
      default: 'undefined',
      description:
        '커스텀 색상 설정. 지정 시 variant를 무시하고 CSS 변수 기반으로 배경색, 텍스트색, hover/active 색상을 적용합니다.',
    },
  ];

  return (
    <article className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>Button</h1>
        <p className={styles.description}>
          Button 컴포넌트는 사용자가 어떤 액션을 트리거하거나 이벤트를 실행할 때
          사용합니다. 폼 제출, 모달 열기, 작업 취소, 삭제와 같은 다양한 액션을
          처리하는 데 활용할 수 있습니다.
        </p>
      </header>

      {/* Quick Reference */}
      <section className={styles.quickReference}>
        <Card className={styles.quickRefCard}>
          <Card.Body padding="md">
            <h3 className={styles.quickRefTitle}>Import</h3>
            <CodeBlock
              language="typescript"
              code={`import { Button } from '@taein-ui/core';`}
            />
          </Card.Body>
        </Card>
        <Card className={styles.quickRefCard}>
          <Card.Body padding="md">
            <h3 className={styles.quickRefTitle}>Basic Usage</h3>
            <CodeBlock
              language="tsx"
              code={`<Button variant="primary" onClick={handleClick}>
  확인
</Button>`}
            />
          </Card.Body>
        </Card>
      </section>

      {/* Examples Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Examples</h2>
          <p className={styles.sectionDescription}>
            다양한 사용 사례에 맞는 Button 예제입니다.
          </p>
        </div>

        {/* Basic */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Basic Button</h3>
          <LivePreview
            title="기본 사용법"
            description="가장 기본적인 Button 사용 예제입니다."
            editable
            code={`<Button onClick={() => alert('클릭!')}>
  버튼
</Button>`}
          />
        </div>

        {/* Variants - Fill */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Variants (Fill)</h3>
          <LivePreview
            title="Fill 스타일 변형"
            description="buttonStyle='fill' (기본값)일 때 4가지 variant를 제공합니다. primary는 주요 행동, dark는 보조 행동, danger는 삭제/경고, light는 취소/보조에 사용합니다."
            editable
            code={`<div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
  <Button variant="primary">Primary</Button>
  <Button variant="dark">Dark</Button>
  <Button variant="danger">Danger</Button>
  <Button variant="light">Light</Button>
</div>`}
          />
        </div>

        {/* Variants - Weak */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Variants (Weak)</h3>
          <LivePreview
            title="Weak 스타일 변형"
            description="buttonStyle='weak'는 채도가 낮은 배경색을 사용하여 시각적 위계를 낮춥니다. 보조 행동이나 덜 중요한 액션에 적합합니다."
            editable
            code={`<div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
  <Button variant="primary" buttonStyle="weak">Primary</Button>
  <Button variant="dark" buttonStyle="weak">Dark</Button>
  <Button variant="danger" buttonStyle="weak">Danger</Button>
  <Button variant="light" buttonStyle="weak">Light</Button>
</div>`}
          />
        </div>

        {/* Sizes */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Sizes</h3>
          <LivePreview
            title="크기 옵션"
            description="sm, md, lg, xl 네 가지 크기를 제공합니다."
            editable
            code={`<div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
  <Button size="sm">Small</Button>
  <Button size="md">Medium</Button>
  <Button size="lg">Large</Button>
  <Button size="xl">X-Large</Button>
</div>`}
          />
        </div>

        {/* Icons */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>With Icons</h3>
          <LivePreview
            title="아이콘 포함"
            description="leftIcon, rightIcon prop으로 버튼 좌우에 아이콘을 배치할 수 있습니다."
            editable
            code={`<div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
  <Button leftIcon={<Plus size={16} />} variant="primary">추가</Button>
  <Button rightIcon={<ArrowRight size={16} />} variant="dark">다음</Button>
  <Button rightIcon={<Download size={16} />} variant="light">다운로드</Button>
  <Button leftIcon={<Trash size={16} />} variant="danger">삭제</Button>
</div>`}
          />
        </div>

        {/* Loading */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Loading</h3>
          <LivePreview
            title="로딩 상태"
            description="loading prop으로 로딩 스피너를 표시합니다. 로딩 중에는 버튼이 자동으로 비활성화됩니다."
            editable
            code={`const [loading, setLoading] = useState(false);
const handleClick = () => {
  setLoading(true);
  setTimeout(() => setLoading(false), 2000);
};

<div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
  <Button loading={loading} onClick={handleClick}>
    {loading ? '처리 중...' : '저장하기'}
  </Button>
  <Button loading variant="dark">로딩 중</Button>
  <Button loading variant="danger">삭제 중</Button>
</div>`}
          />
        </div>

        {/* Disabled */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Disabled</h3>
          <LivePreview
            title="비활성화 상태"
            description="disabled prop으로 버튼을 비활성화합니다. 클릭 이벤트가 발생하지 않습니다."
            editable
            code={`<div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
  <Button disabled>Primary</Button>
  <Button variant="dark" disabled>Dark</Button>
  <Button variant="danger" disabled>Danger</Button>
  <Button variant="light" disabled>Light</Button>
</div>`}
          />
        </div>

        {/* Full Width */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Full Width</h3>
          <LivePreview
            title="전체 너비"
            description="fullWidth prop으로 부모 요소의 전체 너비를 채웁니다. 모바일 레이아웃이나 모달 하단 버튼에 유용합니다."
            editable
            code={`<div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
  <Button fullWidth>전체 너비 버튼</Button>
  <Button fullWidth variant="light">전체 너비 Light</Button>
</div>`}
          />
        </div>

        {/* Custom Color */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Custom Color</h3>
          <LivePreview
            title="커스텀 색상"
            description="customColor prop으로 색상을 자유롭게 지정할 수 있습니다. 기본은 fill 스타일이며, variant='light'와 조합하면 border+텍스트 색상이 커스텀됩니다."
            editable
            code={`<div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
  {/* Fill 커스텀 */}
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
    <Button customColor={{ bg: '#8b5cf6', text: '#fff' }}>보라색</Button>
    <Button customColor={{ bg: '#059669', text: '#fff', hoverBg: '#047857', activeBg: '#065f46' }}>초록색</Button>
    <Button customColor={{ bg: '#ea580c', text: '#fff' }}>오렌지</Button>
    <Button customColor={{ bg: '#0ea5e9', text: '#fff' }}>하늘색</Button>
  </div>

  {/* Light(Outline) 커스텀: variant="light" + customColor */}
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
    <Button variant="light" customColor={{ bg: '#8b5cf6', text: '' }}>보라색</Button>
    <Button variant="light" customColor={{ bg: '#059669', text: '' }}>초록색</Button>
    <Button variant="light" customColor={{ bg: '#ea580c', text: '' }}>오렌지</Button>
    <Button variant="light" customColor={{ bg: '#e11d48', text: '', hoverBg: '#fce7f3', activeBg: '#fbcfe8' }}>핑크</Button>
  </div>
</div>`}
          />
        </div>

        {/* Combination */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Combination</h3>
          <LivePreview
            title="조합 예제"
            description="variant, buttonStyle, size, icon을 조합한 실제 사용 예시입니다."
            editable
            code={`<div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
  {/* 폼 하단 버튼 그룹 */}
  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
    <Button variant="light" size="md">취소</Button>
    <Button variant="primary" size="md" leftIcon={<Check size={16} />}>저장</Button>
  </div>

  {/* 위험 행동 확인 */}
  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
    <Button variant="danger" buttonStyle="weak" size="sm">비활성화</Button>
    <Button variant="danger" size="sm" leftIcon={<Trash size={16} />}>계정 삭제</Button>
  </div>

  {/* 다양한 크기 조합 */}
  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
    <Button size="sm" buttonStyle="weak">필터</Button>
    <Button size="md" variant="dark" leftIcon={<RotateCw size={16} />}>새로고침</Button>
    <Button size="lg" rightIcon={<ArrowRight size={18} />}>시작하기</Button>
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
            Button 컴포넌트의 모든 Props와 타입 정보입니다. HTML button 속성도
            모두 사용 가능합니다.
          </p>
        </div>
        <div className={styles.propsTableWrapper}>
          <PropsTable props={propsData} />
        </div>
      </section>

      {/* Accessibility */}
      <AccessibilitySection
        componentName="Button"
        intro="Button 컴포넌트는 네이티브 HTML button 요소를 기반으로 다음과 같은 접근성을 기본 제공합니다."
        features={[
          {
            attribute: '<button> 요소',
            effect: '스크린 리더에서 "버튼"으로 인식됩니다.',
            description:
              '네이티브 button 요소를 사용하여 추가 role 없이도 올바른 역할을 전달합니다.',
          },
          {
            attribute: 'type="button"',
            effect: '폼 제출을 방지합니다.',
            description:
              '기본 type이 "button"으로 설정되어 의도치 않은 폼 제출을 방지합니다.',
          },
          {
            attribute: 'aria-disabled',
            effect: '비활성화 상태를 알립니다.',
            description:
              'disabled 또는 loading일 때 aria-disabled="true"가 설정됩니다.',
          },
          {
            attribute: 'aria-busy',
            effect: '로딩 상태를 알립니다.',
            description:
              'loading일 때 aria-busy="true"가 설정되어 작업 진행 중임을 전달합니다.',
          },
          {
            attribute: 'focus-visible',
            effect: '키보드 포커스 시 아웃라인이 표시됩니다.',
            description:
              '2px solid outline과 2px offset으로 명확한 포커스 인디케이터를 제공합니다.',
          },
          {
            attribute: 'aria-hidden (아이콘)',
            effect: '아이콘이 스크린 리더에서 무시됩니다.',
            description:
              'leftIcon, rightIcon은 aria-hidden="true"로 설정되어 중복 읽기를 방지합니다.',
          },
        ]}
        additionalGuidance={[
          {
            title: '명확한 버튼 텍스트',
            description:
              '버튼 텍스트는 클릭 시 어떤 일이 일어나는지 명확히 설명해야 합니다.',
            examples: [
              {
                code: `// Good
<Button>저장하기</Button>
<Button variant="danger">계정 삭제</Button>

// Bad
<Button>확인</Button>
<Button>클릭</Button>`,
                explanation:
                  '"확인"이나 "클릭" 대신 구체적인 행동을 나타내는 텍스트를 사용하세요.',
              },
            ],
          },
          {
            title: '아이콘만 사용 시 aria-label 필수',
            description:
              '텍스트 없이 아이콘만 사용하는 경우, IconButton 컴포넌트를 사용하거나 aria-label을 제공하세요.',
            examples: [
              {
                code: `// Good - IconButton 사용
<IconButton aria-label="닫기"><X /></IconButton>

// Bad - 텍스트 없는 Button
<Button leftIcon={<X />}>{""}</Button>`,
                explanation:
                  '스크린 리더 사용자가 버튼의 용도를 알 수 없게 됩니다.',
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
            Button을 효과적으로 사용하기 위한 권장사항입니다.
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
                <ListItem>주요 행동에 fill + primary 사용</ListItem>
                <ListItem>보조 행동에 weak 또는 light variant 사용</ListItem>
                <ListItem>위험한 행동에 danger variant 사용</ListItem>
                <ListItem>비동기 작업 시 loading 상태 표시</ListItem>
                <ListItem>한 화면에 주요 버튼은 하나만 배치</ListItem>
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
                  같은 영역에 fill primary 버튼 여러 개 배치하지 않기
                </ListItem>
                <ListItem>
                  텍스트 없이 아이콘만 사용하지 않기 (IconButton 사용)
                </ListItem>
                <ListItem>비활성화 사유 없이 disabled 남용하지 않기</ListItem>
                <ListItem>
                  링크 역할에 Button 사용하지 않기 (a 태그 사용)
                </ListItem>
                <ListItem>
                  버튼 텍스트를 "클릭", "여기" 등 모호하게 작성하지 않기
                </ListItem>
              </List>
            </Card.Body>
          </Card>
        </div>
      </section>
    </article>
  );
}
