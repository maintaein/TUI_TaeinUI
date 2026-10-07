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
      description:
        '버튼 색상 변형. weak와 strong에만 적용된다(ghost는 회색 고정)',
    },
    {
      name: 'buttonStyle',
      type: "'ghost' | 'weak' | 'strong'",
      default: "'ghost'",
      description: '버튼 스타일 (배경 없음 / 옅은 배경 / 진한 배경)',
    },
    {
      name: 'size',
      type: "'sm' | 'md' | 'lg' | 'xl'",
      default: "'md'",
      description: '버튼 크기',
    },
    {
      name: 'hoverEffect',
      type: "'none' | 'jelly'",
      default: "'jelly'",
      description:
        '마우스가 들어올 때 아이콘이 옆으로 퍼졌다가 출렁이며 돌아온다. 기본으로 켜져 있고 "none"으로 끈다. 마우스만, 세 모드 모두',
    },
    {
      name: 'loading',
      type: 'boolean',
      default: 'false',
      description: '로딩 상태 (Loader 표시)',
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
          IconButton은 lucide-react, react-icons 등 어느 아이콘 라이브러리의
          아이콘이든 children으로 넣으면 버튼으로 만들어 줍니다. 아이콘 크기는
          버튼 size가 정하므로 아이콘에 크기를 따로 주지 않습니다. 닫기, 메뉴
          열기, 설정 등 텍스트 없이 아이콘만으로 액션을 표현할 때 사용합니다.
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
            <h3 className={styles.quickRefTitle}>Ghost (기본)</h3>
            <CodeBlock
              language="tsx"
              code={`<IconButton aria-label="닫기">
  <X />
</IconButton>`}
            />
          </Card.Body>
        </Card>
        <Card className={styles.quickRefCard}>
          <Card.Body padding="md">
            <h3 className={styles.quickRefTitle}>Weak</h3>
            <CodeBlock
              language="tsx"
              code={`<IconButton buttonStyle="weak" aria-label="설정">
  <Settings />
</IconButton>`}
            />
          </Card.Body>
        </Card>
        <Card className={styles.quickRefCard}>
          <Card.Body padding="md">
            <h3 className={styles.quickRefTitle}>Strong</h3>
            <CodeBlock
              language="tsx"
              code={`<IconButton buttonStyle="strong" aria-label="추가">
  <Plus />
</IconButton>`}
            />
          </Card.Body>
        </Card>
      </section>

      {/* Ghost Section (default) */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Ghost (기본)</h2>
          <p className={styles.sectionDescription}>
            buttonStyle을 주지 않으면 배경과 테두리 없이 아이콘만 버튼이 됩니다.
            호버하면 옅은 회색 배경이 나타납니다. 색은 회색 고정이라 variant는
            적용되지 않습니다.
          </p>
        </div>

        {/* Ghost Basic */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Basic Ghost</h3>
          <LivePreview
            title="Ghost 기본 사용법"
            description="아이콘과 aria-label만 주면 배경 없는 아이콘 버튼이 됩니다. 호버 시 미세한 배경이 나타나 인터랙션 영역을 알려줍니다."
            editable
            code={`<div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
  <IconButton aria-label="닫기"><X /></IconButton>
  <IconButton aria-label="설정"><Settings /></IconButton>
  <IconButton aria-label="더보기"><Ellipsis /></IconButton>
  <IconButton aria-label="새로고침"><RotateCw /></IconButton>
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
      <IconButton aria-label="편집"><Pencil /></IconButton>
      <IconButton aria-label="닫기"><X /></IconButton>
    </div>
  </div>
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.75rem' }}>
    <span style={{ fontWeight: 600 }}>프로필 사진</span>
    <div style={{ display: 'flex', gap: '0.25rem' }}>
      <IconButton aria-label="더보기"><Ellipsis /></IconButton>
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
            description="loading과 disabled 상태는 세 모드가 같습니다."
            editable
            code={`const [loading, setLoading] = useState(false);
const handleClick = () => {
  setLoading(true);
  setTimeout(() => setLoading(false), 2000);
};

<div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
  <IconButton loading={loading} onClick={handleClick} aria-label="새로고침"><RotateCw /></IconButton>
  <IconButton loading aria-label="로딩 중"><Hourglass /></IconButton>
  <IconButton disabled aria-label="비활성화"><X /></IconButton>
</div>`}
          />
        </div>
      </section>

      {/* Weak Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Weak</h2>
          <p className={styles.sectionDescription}>
            buttonStyle=&quot;weak&quot;는 채도가 낮은 배경색으로 시각적 위계를
            낮춥니다. 툴바나 보조 액션에 적합합니다. variant로 색을 고르며,
            Button의 weak와 같은 색을 씁니다.
          </p>
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Variants (Weak)</h3>
          <LivePreview
            title="Weak 스타일 변형"
            description="weak에서 쓸 수 있는 4가지 variant입니다."
            editable
            code={`<div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
  <IconButton variant="primary" buttonStyle="weak" aria-label="추가"><Plus /></IconButton>
  <IconButton variant="dark" buttonStyle="weak" aria-label="메뉴"><Menu /></IconButton>
  <IconButton variant="danger" buttonStyle="weak" aria-label="삭제"><Trash /></IconButton>
  <IconButton variant="light" buttonStyle="weak" aria-label="즐겨찾기"><Star /></IconButton>
</div>`}
          />
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Toolbar Example</h3>
          <LivePreview
            title="툴바 조합 예제"
            description="실제 툴바에서 IconButton을 조합하여 사용하는 패턴입니다."
            editable
            code={`<div style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem', backgroundColor: '#f3f4f6', borderRadius: '0.75rem', alignItems: 'center' }}>
  <IconButton size="sm" buttonStyle="weak" variant="dark" aria-label="Bold"><Bold /></IconButton>
  <IconButton size="sm" buttonStyle="weak" variant="dark" aria-label="Italic"><Italic /></IconButton>
  <IconButton size="sm" buttonStyle="weak" variant="dark" aria-label="Underline"><Underline /></IconButton>
  <div style={{ width: '1px', height: '24px', backgroundColor: '#d1d5db', margin: '0 0.25rem' }} />
  <IconButton size="sm" buttonStyle="weak" variant="dark" aria-label="왼쪽 정렬"><AlignLeft /></IconButton>
  <IconButton size="sm" buttonStyle="weak" variant="dark" aria-label="가운데 정렬"><AlignCenter /></IconButton>
  <IconButton size="sm" buttonStyle="weak" variant="dark" aria-label="오른쪽 정렬"><AlignRight /></IconButton>
  <div style={{ width: '1px', height: '24px', backgroundColor: '#d1d5db', margin: '0 0.25rem' }} />
  <IconButton size="sm" buttonStyle="weak" variant="danger" aria-label="삭제"><Trash /></IconButton>
</div>`}
          />
        </div>
      </section>

      {/* Strong Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Strong</h2>
          <p className={styles.sectionDescription}>
            buttonStyle=&quot;strong&quot;은 진한 배경으로 가장 눈에 띄는 액션을
            만듭니다. Button의 fill과 같은 색을 쓰고(호버와 누름 포함) 이름만
            strong입니다.
          </p>
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Variants (Strong)</h3>
          <LivePreview
            title="Strong 스타일 변형"
            description="strong에서 쓸 수 있는 4가지 variant입니다."
            editable
            code={`<div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
  <IconButton variant="primary" buttonStyle="strong" aria-label="추가"><Plus /></IconButton>
  <IconButton variant="dark" buttonStyle="strong" aria-label="메뉴"><Menu /></IconButton>
  <IconButton variant="danger" buttonStyle="strong" aria-label="삭제"><Trash /></IconButton>
  <IconButton variant="light" buttonStyle="strong" aria-label="즐겨찾기"><Star /></IconButton>
</div>`}
          />
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Button vs IconButton</h3>
          <LivePreview
            title="Button과 비교"
            description="Button은 텍스트+아이콘, IconButton은 아이콘만 사용합니다. 같은 variant/size 체계를 공유합니다."
            editable
            code={`<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
    <Button variant="primary" leftIcon={<Plus />} size="md">추가</Button>
    <IconButton variant="primary" buttonStyle="strong" size="md" aria-label="추가"><Plus /></IconButton>
  </div>
  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
    <Button variant="danger" leftIcon={<Trash />} size="md">삭제</Button>
    <IconButton variant="danger" buttonStyle="strong" size="md" aria-label="삭제"><Trash /></IconButton>
  </div>
  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
    <Button variant="dark" buttonStyle="weak" size="sm">메뉴</Button>
    <IconButton variant="dark" buttonStyle="weak" size="sm" aria-label="메뉴"><Menu /></IconButton>
  </div>
</div>`}
          />
        </div>
      </section>

      {/* 젤리 */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>젤리</h2>
          <p className={styles.sectionDescription}>
            젤리는 기본으로 켜져 있습니다. prop 없이 쓴 IconButton도 마우스가
            들어오면 아이콘이 부피를 지키며 옆으로 퍼졌다가 출렁이며 돌아옵니다.
            hoverEffect=&quot;none&quot;으로 끄고, 기본값과 같은
            hoverEffect=&quot;jelly&quot;로 다시 명시할 수 있습니다. 마우스에만
            반응하고 터치, 키보드 포커스, 동작 줄이기 설정에서는 움직이지
            않습니다.
          </p>
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>기본 · none</h3>
          <LivePreview
            title="젤리 켜기와 끄기"
            description='왼쪽은 prop이 없는 기본(젤리), 오른쪽은 hoverEffect="none"입니다. 각각 호버해 보세요.'
            editable
            code={`<div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
  <IconButton buttonStyle="strong" aria-label="기본"><Plus /></IconButton>
  <IconButton buttonStyle="strong" hoverEffect="none" aria-label="젤리 끔"><Plus /></IconButton>
</div>`}
          />
        </div>
      </section>

      {/* Sizes & States (세 모드 공통) */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Sizes &amp; States</h2>
          <p className={styles.sectionDescription}>
            크기와 상태는 세 모드가 같습니다.
          </p>
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Sizes</h3>
          <LivePreview
            title="크기 옵션"
            description="sm, md, lg, xl 네 가지 크기를 제공합니다. 채움 모드(weak, strong)는 sm과 md가 모두 44px입니다."
            editable
            code={`<div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
  <IconButton buttonStyle="strong" size="sm" aria-label="Small"><Pencil /></IconButton>
  <IconButton buttonStyle="strong" size="md" aria-label="Medium"><Pencil /></IconButton>
  <IconButton buttonStyle="strong" size="lg" aria-label="Large"><Pencil /></IconButton>
  <IconButton buttonStyle="strong" size="xl" aria-label="X-Large"><Pencil /></IconButton>
</div>`}
          />
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Loading</h3>
          <LivePreview
            title="로딩 상태"
            description="loading prop으로 Loader를 표시합니다. 로딩 중에는 버튼이 자동으로 비활성화됩니다."
            editable
            code={`const [loading, setLoading] = useState(false);
const handleClick = () => {
  setLoading(true);
  setTimeout(() => setLoading(false), 2000);
};

<div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
  <IconButton buttonStyle="strong" loading={loading} onClick={handleClick} aria-label="새로고침"><RotateCw /></IconButton>
  <IconButton buttonStyle="strong" loading variant="dark" aria-label="로딩 중"><Hourglass /></IconButton>
  <IconButton buttonStyle="strong" loading variant="danger" aria-label="로딩 중"><Hourglass /></IconButton>
</div>`}
          />
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Disabled</h3>
          <LivePreview
            title="비활성화 상태"
            description="disabled prop으로 버튼을 비활성화합니다. 클릭 이벤트가 발생하지 않습니다."
            editable
            code={`<div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
  <IconButton buttonStyle="strong" disabled aria-label="추가"><Plus /></IconButton>
  <IconButton buttonStyle="strong" variant="dark" disabled aria-label="메뉴"><Menu /></IconButton>
  <IconButton buttonStyle="strong" variant="danger" disabled aria-label="삭제"><Trash /></IconButton>
  <IconButton buttonStyle="strong" variant="light" disabled aria-label="즐겨찾기"><Star /></IconButton>
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
