import { Card, List, ListItem } from '@taein-ui/core';
import { LivePreview } from '../../../components/LivePreview';
import { CodeBlock } from '../../../components/CodeBlock';
import { PropsTable } from '../../../components/PropsTable';
import type { PropDefinition } from '../../../components/PropsTable/PropsTable';
import { AccessibilitySection } from '../../../components/AccessibilitySection';
import * as styles from './IconButtonPage.css';

export function IconButtonPage() {
  const propsData: PropDefinition[] = [
    {
      name: 'children',
      type: 'ReactNode',
      required: true,
      description: '아이콘 콘텐츠 (텍스트, 이모지, SVG 등)',
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
      description: '버튼 크기 (정사각형)',
    },
    {
      name: 'ghost',
      type: 'boolean',
      default: 'false',
      description: '고스트 모드: 배경/테두리 없이 아이콘만 버튼으로 사용',
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
      name: 'aria-label',
      type: 'string',
      description: '접근성 레이블 (필수 권장)',
    },
    {
      name: 'aria-labelledby',
      type: 'string',
      description: '접근성 레이블 ID 참조',
    },
  ];

  return (
    <article className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>IconButton</h1>
        <p className={styles.description}>
          IconButton 컴포넌트는 닫기, 메뉴 열기, 설정 등 텍스트 없이
          아이콘만으로 액션을 표현할 때 사용합니다.
        </p>
      </header>

      {/* Quick Reference */}
      <section className={styles.quickReference}>
        <Card className={styles.quickRefCard}>
          <Card.Body padding="md">
            <h3 className={styles.quickRefTitle}>Import</h3>
            <CodeBlock
              language="typescript"
              code={`import { IconButton } from '@taein-ui/core';`}
            />
          </Card.Body>
        </Card>
        <Card className={styles.quickRefCard}>
          <Card.Body padding="md">
            <h3 className={styles.quickRefTitle}>Contained</h3>
            <CodeBlock
              language="tsx"
              code={`<IconButton aria-label="설정">
  <Settings />
</IconButton>`}
            />
          </Card.Body>
        </Card>
        <Card className={styles.quickRefCard}>
          <Card.Body padding="md">
            <h3 className={styles.quickRefTitle}>Ghost</h3>
            <CodeBlock
              language="tsx"
              code={`<IconButton ghost aria-label="닫기">
  <X />
</IconButton>`}
            />
          </Card.Body>
        </Card>
      </section>

      {/* Contained Mode Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Contained Mode</h2>
          <p className={styles.sectionDescription}>
            배경이 있는 정사각형 컨테이너 안에 아이콘을 배치하는 기본
            모드입니다. variant, buttonStyle, size를 조합하여 다양한 스타일을
            표현합니다.
          </p>
        </div>

        {/* Basic */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Basic</h3>
          <LivePreview
            title="기본 사용법"
            description="아이콘과 aria-label을 함께 제공하는 가장 기본적인 사용법입니다."
            editable
            code={`<div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
  <IconButton aria-label="홈"><House size={22} /></IconButton>
  <IconButton aria-label="검색"><Search size={22} /></IconButton>
  <IconButton aria-label="알림"><Bell size={22} /></IconButton>
  <IconButton aria-label="설정"><Settings size={22} /></IconButton>
</div>`}
          />
        </div>

        {/* Variants - Fill */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Variants (Fill)</h3>
          <LivePreview
            title="Fill 스타일 변형"
            description="buttonStyle='fill' (기본값)일 때 4가지 variant입니다. Button과 동일한 색상 체계를 사용합니다."
            editable
            code={`<div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
  <IconButton variant="primary" aria-label="추가"><Plus size={22} /></IconButton>
  <IconButton variant="dark" aria-label="메뉴"><Menu size={22} /></IconButton>
  <IconButton variant="danger" aria-label="삭제"><Trash size={22} /></IconButton>
  <IconButton variant="light" aria-label="즐겨찾기"><Star size={22} /></IconButton>
</div>`}
          />
        </div>

        {/* Variants - Weak */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Variants (Weak)</h3>
          <LivePreview
            title="Weak 스타일 변형"
            description="buttonStyle='weak'는 채도가 낮은 배경색으로 시각적 위계를 낮춥니다. 툴바나 보조 액션에 적합합니다."
            editable
            code={`<div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
  <IconButton variant="primary" buttonStyle="weak" aria-label="추가"><Plus size={22} /></IconButton>
  <IconButton variant="dark" buttonStyle="weak" aria-label="메뉴"><Menu size={22} /></IconButton>
  <IconButton variant="danger" buttonStyle="weak" aria-label="삭제"><Trash size={22} /></IconButton>
  <IconButton variant="light" buttonStyle="weak" aria-label="즐겨찾기"><Star size={22} /></IconButton>
</div>`}
          />
        </div>

        {/* Sizes */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Sizes</h3>
          <LivePreview
            title="크기 옵션"
            description="sm(36px), md(44px), lg(52px), xl(60px) 네 가지 정사각형 크기를 제공합니다."
            editable
            code={`<div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
  <IconButton size="sm" aria-label="Small"><Pencil size={18} /></IconButton>
  <IconButton size="md" aria-label="Medium"><Pencil size={22} /></IconButton>
  <IconButton size="lg" aria-label="Large"><Pencil size={26} /></IconButton>
  <IconButton size="xl" aria-label="X-Large"><Pencil size={30} /></IconButton>
</div>`}
          />
        </div>

        {/* Loading */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Loading</h3>
          <LivePreview
            title="로딩 상태"
            description="loading prop으로 LoadingSpinner를 표시합니다. 로딩 중에는 버튼이 자동으로 비활성화됩니다."
            editable
            code={`const [loading, setLoading] = useState(false);
const handleClick = () => {
  setLoading(true);
  setTimeout(() => setLoading(false), 2000);
};

<div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
  <IconButton loading={loading} onClick={handleClick} aria-label="새로고침"><RotateCw size={22} /></IconButton>
  <IconButton loading variant="dark" aria-label="로딩 중"><Hourglass size={22} /></IconButton>
  <IconButton loading variant="danger" aria-label="로딩 중"><Hourglass size={22} /></IconButton>
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
            code={`<div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
  <IconButton disabled aria-label="추가"><Plus size={22} /></IconButton>
  <IconButton variant="dark" disabled aria-label="메뉴"><Menu size={22} /></IconButton>
  <IconButton variant="danger" disabled aria-label="삭제"><Trash size={22} /></IconButton>
  <IconButton variant="light" disabled aria-label="즐겨찾기"><Star size={22} /></IconButton>
</div>`}
          />
        </div>

        {/* Toolbar Example */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Toolbar Example</h3>
          <LivePreview
            title="툴바 조합 예제"
            description="실제 툴바에서 IconButton을 조합하여 사용하는 패턴입니다."
            editable
            code={`<div style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem', backgroundColor: '#f3f4f6', borderRadius: '0.75rem', alignItems: 'center' }}>
  <IconButton size="sm" buttonStyle="weak" variant="dark" aria-label="Bold"><Bold size={18} /></IconButton>
  <IconButton size="sm" buttonStyle="weak" variant="dark" aria-label="Italic"><Italic size={18} /></IconButton>
  <IconButton size="sm" buttonStyle="weak" variant="dark" aria-label="Underline"><Underline size={18} /></IconButton>
  <div style={{ width: '1px', height: '24px', backgroundColor: '#d1d5db', margin: '0 0.25rem' }} />
  <IconButton size="sm" buttonStyle="weak" variant="dark" aria-label="왼쪽 정렬"><AlignLeft size={18} /></IconButton>
  <IconButton size="sm" buttonStyle="weak" variant="dark" aria-label="가운데 정렬"><AlignCenter size={18} /></IconButton>
  <IconButton size="sm" buttonStyle="weak" variant="dark" aria-label="오른쪽 정렬"><AlignRight size={18} /></IconButton>
  <div style={{ width: '1px', height: '24px', backgroundColor: '#d1d5db', margin: '0 0.25rem' }} />
  <IconButton size="sm" buttonStyle="weak" variant="danger" aria-label="삭제"><Trash size={18} /></IconButton>
</div>`}
          />
        </div>

        {/* Button vs IconButton */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Button vs IconButton</h3>
          <LivePreview
            title="Button과 비교"
            description="Button은 텍스트+아이콘, IconButton은 아이콘만 사용합니다. 같은 variant/size 체계를 공유합니다."
            editable
            code={`<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
    <Button variant="primary" leftIcon={<Plus size={16} />} size="md">추가</Button>
    <IconButton variant="primary" size="md" aria-label="추가"><Plus size={22} /></IconButton>
  </div>
  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
    <Button variant="danger" leftIcon={<Trash size={16} />} size="md">삭제</Button>
    <IconButton variant="danger" size="md" aria-label="삭제"><Trash size={22} /></IconButton>
  </div>
  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
    <Button variant="dark" buttonStyle="weak" size="sm">메뉴</Button>
    <IconButton variant="dark" buttonStyle="weak" size="sm" aria-label="메뉴"><Menu size={18} /></IconButton>
  </div>
</div>`}
          />
        </div>
      </section>

      {/* Ghost Mode Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Ghost Mode</h2>
          <p className={styles.sectionDescription}>
            배경과 테두리 없이 아이콘 자체만 버튼으로 사용하는 모드입니다. ghost
            prop을 추가하면 variant, buttonStyle, size가 무시되고 투명한
            버튼으로 렌더링됩니다. 호버 시 미세한 배경이 나타납니다.
          </p>
        </div>

        {/* Ghost Basic */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Basic Ghost</h3>
          <LivePreview
            title="Ghost 기본 사용법"
            description="ghost prop만 추가하면 배경 없는 아이콘 버튼이 됩니다. 호버 시 미세한 배경이 나타나 인터랙션 영역을 알려줍니다."
            editable
            code={`<div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
  <IconButton ghost aria-label="닫기"><X size={22} /></IconButton>
  <IconButton ghost aria-label="설정"><Settings size={22} /></IconButton>
  <IconButton ghost aria-label="더보기"><Ellipsis size={22} /></IconButton>
  <IconButton ghost aria-label="새로고침"><RotateCw size={22} /></IconButton>
</div>`}
          />
        </div>

        {/* Ghost vs Contained comparison */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Ghost vs Contained</h3>
          <LivePreview
            title="두 모드 비교"
            description="같은 아이콘을 Contained와 Ghost 모드로 나란히 비교합니다. Ghost는 UI에 녹아들어 콘텐츠에 집중하게 합니다."
            editable
            code={`<div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
    <span style={{ width: '100px', fontSize: '0.875rem', color: '#6b7280' }}>Contained</span>
    <IconButton aria-label="닫기"><X size={22} /></IconButton>
    <IconButton aria-label="설정"><Settings size={22} /></IconButton>
    <IconButton aria-label="더보기"><Ellipsis size={22} /></IconButton>
  </div>
  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
    <span style={{ width: '100px', fontSize: '0.875rem', color: '#6b7280' }}>Ghost</span>
    <IconButton ghost aria-label="닫기"><X size={22} /></IconButton>
    <IconButton ghost aria-label="설정"><Settings size={22} /></IconButton>
    <IconButton ghost aria-label="더보기"><Ellipsis size={22} /></IconButton>
  </div>
</div>`}
          />
        </div>

        {/* Ghost in context */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Ghost in Context</h3>
          <LivePreview
            title="실제 사용 맥락"
            description="카드 헤더의 닫기/옵션 버튼, 리스트 아이템의 액션 버튼 등 콘텐츠 옆에 자연스럽게 배치되는 패턴입니다."
            editable
            code={`<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.75rem' }}>
    <span style={{ fontWeight: 600 }}>알림 설정</span>
    <div style={{ display: 'flex', gap: '0.25rem' }}>
      <IconButton ghost aria-label="편집"><Pencil size={22} /></IconButton>
      <IconButton ghost aria-label="닫기"><X size={22} /></IconButton>
    </div>
  </div>
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.75rem' }}>
    <span style={{ fontWeight: 600 }}>프로필 사진</span>
    <div style={{ display: 'flex', gap: '0.25rem' }}>
      <IconButton ghost aria-label="더보기"><Ellipsis size={22} /></IconButton>
    </div>
  </div>
</div>`}
          />
        </div>

        {/* Ghost Loading & Disabled */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Ghost States</h3>
          <LivePreview
            title="Ghost 상태 변화"
            description="Ghost 모드에서도 loading, disabled 상태를 동일하게 지원합니다."
            editable
            code={`const [loading, setLoading] = useState(false);
const handleClick = () => {
  setLoading(true);
  setTimeout(() => setLoading(false), 2000);
};

<div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
  <IconButton ghost loading={loading} onClick={handleClick} aria-label="새로고침"><RotateCw size={22} /></IconButton>
  <IconButton ghost loading aria-label="로딩 중"><Hourglass size={22} /></IconButton>
  <IconButton ghost disabled aria-label="비활성화"><X size={22} /></IconButton>
</div>`}
          />
        </div>
      </section>

      {/* Props API */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Props API</h2>
          <p className={styles.sectionDescription}>
            IconButton 컴포넌트의 모든 Props와 타입 정보입니다. HTML button
            속성도 모두 사용 가능합니다.
          </p>
        </div>
        <div className={styles.propsTableWrapper}>
          <PropsTable props={propsData} />
        </div>
      </section>

      {/* Accessibility */}
      <AccessibilitySection
        componentName="IconButton"
        intro="IconButton은 텍스트 없이 아이콘만 사용하므로, 접근성을 위한 레이블이 특히 중요합니다."
        features={[
          {
            attribute: '<button> 요소',
            effect: '스크린 리더에서 "버튼"으로 인식합니다.',
            description:
              '네이티브 button 요소를 사용하여 추가 role 없이도 올바른 역할을 전달합니다.',
          },
          {
            attribute: 'aria-label (필수)',
            effect: '스크린 리더가 버튼의 용도를 알립니다.',
            description:
              '아이콘만으로는 용도를 알 수 없으므로 aria-label 또는 aria-labelledby를 반드시 제공해야 합니다.',
          },
          {
            attribute: 'aria-hidden (아이콘)',
            effect: '아이콘이 스크린 리더에서 무시됩니다.',
            description:
              'children이 aria-hidden="true"로 감싸져 있어 중복 읽기를 방지합니다.',
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
        ]}
        additionalGuidance={[
          {
            title: 'aria-label은 필수',
            description:
              'IconButton은 텍스트가 없으므로 스크린 리더 사용자를 위해 반드시 aria-label을 제공해야 합니다.',
            examples: [
              {
                code: `// Good
<IconButton aria-label="닫기"><X /></IconButton>
<IconButton aria-label="새로고침"><RotateCw /></IconButton>

// Bad - aria-label 없음
<IconButton><X /></IconButton>`,
                explanation:
                  'aria-label이 없으면 스크린 리더 사용자가 버튼의 용도를 알 수 없습니다. 개발 환경에서 콘솔 경고가 표시됩니다.',
              },
            ],
          },
          {
            title: '텍스트가 필요한 경우 Button 사용',
            description:
              '버튼의 용도가 아이콘만으로 명확하지 않다면 Button 컴포넌트에 텍스트를 함께 사용하세요.',
            examples: [
              {
                code: `// 아이콘만으로 충분한 경우 → IconButton
<IconButton aria-label="닫기"><X /></IconButton>

// 텍스트가 필요한 경우 → Button
<Button leftIcon={<Trash />}>삭제하기</Button>`,
                explanation:
                  '닫기(X) 같은 범용 아이콘은 IconButton으로 충분하지만, 삭제(Trash) 같은 구체적인 행동은 텍스트가 필요합니다.',
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
            IconButton을 효과적으로 사용하기 위한 권장사항입니다.
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
                <ListItem>항상 aria-label로 버튼 용도 설명하기</ListItem>
                <ListItem>범용적으로 인식 가능한 아이콘 사용하기</ListItem>
                <ListItem>툴바에서 일관된 size와 buttonStyle 사용하기</ListItem>
                <ListItem>비동기 작업 시 loading 상태 표시하기</ListItem>
                <ListItem>
                  Button과 함께 사용 시 동일한 variant 체계 활용하기
                </ListItem>
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
                <ListItem>aria-label 없이 사용하지 않기</ListItem>
                <ListItem>의미가 불분명한 커스텀 아이콘 사용하지 않기</ListItem>
                <ListItem>
                  텍스트 설명이 필요한 행동에 IconButton 사용하지 않기
                </ListItem>
                <ListItem>같은 아이콘으로 다른 행동을 수행하지 않기</ListItem>
                <ListItem>
                  너무 작은 터치 타깃 사용하지 않기 (최소 sm 권장)
                </ListItem>
              </List>
            </Card.Body>
          </Card>
        </div>
      </section>
    </article>
  );
}
