import { Card, List, ListItem } from '@taein-designsystem/core';
import { LivePreview } from '../../../components/LivePreview';
import { CodeBlock } from '../../../components/CodeBlock';
import { PropsTable } from '../../../components/PropsTable';
import type { PropDefinition } from '../../../components/PropsTable/PropsTable';
import { AccessibilitySection } from '../../../components/AccessibilitySection';
import * as styles from './HeaderBarPage.css';

export function HeaderBarPage() {
  const propsData: PropDefinition[] = [
    {
      name: 'logo',
      type: 'ReactNode',
      description: '좌측에 표시할 로고 요소',
    },
    {
      name: 'title',
      type: 'ReactNode',
      description: '로고 옆에 표시할 제목 텍스트',
    },
    {
      name: 'children',
      type: 'ReactNode',
      description: '중앙 영역에 표시할 콘텐츠 (네비게이션 등)',
    },
    {
      name: 'actions',
      type: 'ReactNode',
      description: '우측에 표시할 액션 요소 (버튼, 아이콘 등)',
    },
    {
      name: 'sticky',
      type: 'boolean',
      default: 'false',
      description: '스크롤 시 상단에 고정',
    },
    {
      name: 'variant',
      type: "'default' | 'dark' | 'transparent'",
      default: "'default'",
      description: '배경 색상 변형',
    },
    {
      name: 'elevation',
      type: 'boolean',
      default: 'false',
      description: '그림자 효과 표시',
    },
    {
      name: 'border',
      type: 'boolean',
      default: 'true',
      description: '하단 테두리 표시',
    },
    {
      name: 'aria-label',
      type: 'string',
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
        <h1 className={styles.title}>HeaderBar</h1>
        <p className={styles.description}>
          HeaderBar 컴포넌트는 페이지 상단에 로고, 제목, 액션 버튼 등을 배치할
          때 사용합니다. 스크롤 시 상단에 고정할 수도 있습니다.
        </p>
      </header>

      {/* Quick Reference */}
      <section className={styles.quickReference}>
        <Card className={styles.quickRefCard}>
          <Card.Body padding="md">
            <h3 className={styles.quickRefTitle}>Import</h3>
            <CodeBlock
              language="typescript"
              code={`import { HeaderBar } from '@taein-designsystem/core';`}
            />
          </Card.Body>
        </Card>
        <Card className={styles.quickRefCard}>
          <Card.Body padding="md">
            <h3 className={styles.quickRefTitle}>Basic Usage</h3>
            <CodeBlock
              language="tsx"
              code={`<HeaderBar title="My App" actions={<Button>Login</Button>}>
  <nav>Navigation</nav>
</HeaderBar>`}
            />
          </Card.Body>
        </Card>
      </section>

      {/* Examples Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Examples</h2>
          <p className={styles.sectionDescription}>
            다양한 사용 사례에 맞는 HeaderBar 예제입니다.
          </p>
        </div>

        {/* Basic */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Basic HeaderBar</h3>
          <LivePreview
            title="기본 사용법"
            description="제목과 액션 버튼을 배치한 기본 헤더입니다."
            editable
            code={`<HeaderBar title="My Application" actions={<Button size="sm">로그인</Button>} />`}
          />
        </div>

        {/* With Logo */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>With Logo</h3>
          <LivePreview
            title="로고 포함"
            description="logo prop으로 로고 이미지나 아이콘을 배치할 수 있습니다."
            editable
            code={`<HeaderBar
  logo={<span style={{ fontSize: '1.5rem' }}>🎨</span>}
  title="TDS"
  actions={<Button size="sm" variant="dark">시작하기</Button>}
/>`}
          />
        </div>

        {/* With Navigation */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>With Navigation</h3>
          <LivePreview
            title="네비게이션 포함"
            description="children 영역에 네비게이션 링크를 배치합니다. 중앙에 정렬됩니다."
            editable
            code={`<HeaderBar
  logo={<span style={{ fontSize: '1.5rem' }}>🎨</span>}
  title="TDS"
  actions={<IconButton ghost aria-label="메뉴" size="sm">☰</IconButton>}
>
  <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem' }}>
    <a href="#" style={{ fontWeight: 600, color: 'inherit', textDecoration: 'none', padding: '0.5rem' }}>Components</a>
    <a href="#" style={{ color: '#6b7280', textDecoration: 'none', padding: '0.5rem' }}>Tokens</a>
    <a href="#" style={{ color: '#6b7280', textDecoration: 'none', padding: '0.5rem' }}>Guidelines</a>
  </div>
</HeaderBar>`}
          />
        </div>

        {/* Proximity Navigation */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>
            Proximity Navigation (HeaderBarNav)
          </h3>
          <LivePreview
            title="근접 확대 네비게이션"
            description="커서나 키보드 포커스가 가까워질수록 항목이 부풀고, 양옆 이웃은 절반만 부풉니다. 히트 영역은 고정 크기라 레이아웃이 흔들리지 않습니다."
            editable
            code={`<HeaderBar
  title="Store"
  actions={
    <HeaderBarNav
      aria-label="주요 메뉴"
      items={[
        { icon: <Icon name="info" />, label: '홈', href: '#' },
        { icon: <Icon name="plus" />, label: '새로 만들기' },
        { icon: <Icon name="check-circle" />, label: '완료함' },
        { icon: <Icon name="alert-circle" />, label: '알림' },
        { icon: <Icon name="minus" />, label: '설정' },
      ]}
    />
  }
/>`}
          />
        </div>

        {/* Variants */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Variants</h3>
          <LivePreview
            title="배경 변형"
            description="default는 흰색 배경, dark는 검은 계열 배경(텍스트/버튼 자동 반전), transparent는 유리 효과(glassmorphism)로 뒤의 콘텐츠가 비쳐 보입니다."
            editable
            code={`<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
  <HeaderBar variant="default" title="Default Variant" actions={<Button size="sm">Action</Button>} />
  <HeaderBar variant="dark" title="Dark Variant" actions={<Button size="sm" variant="light">Action</Button>} />
  <div style={{ position: 'relative', borderRadius: '0.75rem', overflow: 'hidden', height: '120px' }}>
    <div style={{ padding: '1rem', lineHeight: 1.8, fontSize: '0.875rem', color: '#374151' }}>
      디자인 시스템은 일관된 사용자 경험을 제공합니다. 컴포넌트, 토큰, 패턴을 조합하여 빠르고 안정적인 UI를 구축할 수 있습니다. HeaderBar의 transparent 모드는 이렇게 뒤의 콘텐츠가 비쳐 보이는 유리(glassmorphism) 효과를 제공합니다.
    </div>
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
      <HeaderBar variant="transparent" title="Transparent" border={false} actions={<Button size="sm">Action</Button>} />
    </div>
  </div>
</div>`}
          />
        </div>

        {/* Custom Background */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Custom Background</h3>
          <LivePreview
            title="커스텀 배경색"
            description="style prop으로 배경색을 자유롭게 지정할 수 있습니다. 단색, 그라데이션 모두 가능하며, 텍스트 색상도 함께 조정하세요."
            editable
            code={`<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
  <HeaderBar
    title="Brand Blue"
    border={false}
    style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
    actions={<Button size="sm" variant="light">Action</Button>}
  />
  <HeaderBar
    title="Gradient"
    border={false}
    style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#ffffff' }}
    actions={<Button size="sm" variant="light">Action</Button>}
  />
  <HeaderBar
    title="Warm Gradient"
    border={false}
    style={{ background: 'linear-gradient(90deg, #f97316, #ef4444)', color: '#ffffff' }}
    actions={<Button size="sm" variant="light">Action</Button>}
  />
</div>`}
          />
        </div>

        {/* Elevation & Border */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Elevation & Border</h3>
          <LivePreview
            title="그림자와 테두리"
            description="elevation prop으로 그림자를, border prop으로 하단 테두리를 제어합니다."
            editable
            code={`<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
  <HeaderBar title="Border (기본)" border />
  <HeaderBar title="No Border" border={false} />
  <HeaderBar title="Elevation" elevation border={false} />
  <HeaderBar title="Elevation + Border" elevation border />
</div>`}
          />
        </div>

        {/* Actions */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Multiple Actions</h3>
          <LivePreview
            title="다중 액션"
            description="actions 영역은 검색, 알림, 사용자 메뉴 등 기능적 버튼을 배치하는 우측 영역입니다. children(네비게이션)이 페이지 이동 링크라면, actions는 앱 전역에서 동작하는 기능 버튼입니다."
            editable
            code={`<HeaderBar
  logo={<span style={{ fontSize: '1.5rem' }}>📦</span>}
  title="Store"
  actions={
    <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
      <IconButton ghost aria-label="검색" size="sm">🔍</IconButton>
      <IconButton ghost aria-label="알림" size="sm">🔔</IconButton>
      <IconButton ghost aria-label="장바구니" size="sm">🛒</IconButton>
      <Button size="sm">로그인</Button>
    </div>
  }
>
  <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem' }}>
    <a href="#" style={{ fontWeight: 600, color: 'inherit', textDecoration: 'none', padding: '0.5rem' }}>상품</a>
    <a href="#" style={{ color: '#6b7280', textDecoration: 'none', padding: '0.5rem' }}>카테고리</a>
    <a href="#" style={{ color: '#6b7280', textDecoration: 'none', padding: '0.5rem' }}>이벤트</a>
  </div>
</HeaderBar>`}
          />
        </div>

        {/* Combination */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Combination</h3>
          <LivePreview
            title="조합 예제"
            description="로고, 제목, 네비게이션, 액션을 모두 조합한 실제 사용 예시입니다."
            editable
            code={`<div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
  {/* 일반 웹 앱 헤더 */}
  <HeaderBar
    logo={<span style={{ fontSize: '1.25rem' }}>📦</span>}
    title="Store"
    actions={
      <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
        <IconButton ghost aria-label="검색" size="sm">🔍</IconButton>
        <IconButton ghost aria-label="장바구니" size="sm">🛒</IconButton>
        <Button size="sm">로그인</Button>
      </div>
    }
  >
    <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem' }}>
      <a href="#" style={{ fontWeight: 600, color: 'inherit', textDecoration: 'none', padding: '0.5rem' }}>상품</a>
      <a href="#" style={{ color: '#6b7280', textDecoration: 'none', padding: '0.5rem' }}>카테고리</a>
      <a href="#" style={{ color: '#6b7280', textDecoration: 'none', padding: '0.5rem' }}>이벤트</a>
    </div>
  </HeaderBar>
  {/* 관리자 대시보드 헤더 */}
  <HeaderBar
    variant="dark"
    logo={<span style={{ fontSize: '1.25rem' }}>⚙️</span>}
    title="Admin"
    actions={
      <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
        <Badge variant="danger" size="sm">3</Badge>
        <IconButton ghost aria-label="알림" size="sm">🔔</IconButton>
      </div>
    }
  />
</div>`}
          />
        </div>
      </section>

      {/* Props API */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Props API</h2>
          <p className={styles.sectionDescription}>
            HeaderBar 컴포넌트의 모든 Props와 타입 정보입니다. HTML header
            속성도 모두 사용 가능합니다.
          </p>
        </div>
        <div className={styles.propsTableWrapper}>
          <PropsTable props={propsData} />
        </div>
      </section>

      {/* Accessibility */}
      <AccessibilitySection
        componentName="HeaderBar"
        intro="HeaderBar 컴포넌트는 네이티브 HTML header 요소를 기반으로 다음과 같은 접근성을 기본 제공합니다."
        features={[
          {
            attribute: '<header> 요소',
            effect: '스크린 리더에서 "배너"로 인식합니다.',
            description:
              '네이티브 header 요소를 사용하여 role="banner"를 자동으로 전달합니다.',
          },
          {
            attribute: 'role="banner"',
            effect: '페이지의 주요 헤더 영역을 명시합니다.',
            description:
              'landmark role로 스크린 리더 사용자가 헤더 영역으로 빠르게 이동할 수 있습니다.',
          },
          {
            attribute: 'aria-label',
            effect: '헤더의 목적을 설명합니다.',
            description:
              'aria-label prop으로 헤더의 역할을 명시할 수 있습니다.',
          },
          {
            attribute: '<h1> 제목',
            effect: '페이지 제목 구조를 전달합니다.',
            description:
              'title prop은 h1 요소로 렌더링되어 문서 구조를 올바르게 전달합니다.',
          },
          {
            attribute: '3단 레이아웃',
            effect: '논리적 순서로 콘텐츠가 배치됩니다.',
            description:
              '좌측(로고/제목) → 중앙(네비게이션) → 우측(액션) 순서로 DOM이 구성됩니다.',
          },
        ]}
        additionalGuidance={[
          {
            title: '페이지당 하나의 HeaderBar 사용',
            description: '페이지에 banner landmark는 하나만 있어야 합니다.',
            examples: [
              {
                code: `// Good - 페이지 최상단에 하나만 배치
<HeaderBar title="My App" aria-label="메인 헤더">
  <nav aria-label="주요 네비게이션">...</nav>
</HeaderBar>

// Bad - 여러 HeaderBar 사용
<HeaderBar title="Top" />
<HeaderBar title="Sub" />`,
                explanation:
                  '한 페이지에 role="banner"가 여러 개이면 스크린 리더 사용자가 혼란을 겪을 수 있습니다.',
              },
            ],
          },
          {
            title: '네비게이션에 nav 요소 사용',
            description:
              'children에 네비게이션을 배치할 때는 nav 요소와 aria-label을 함께 사용하세요.',
            examples: [
              {
                code: `// Good
<HeaderBar title="App">
  <nav aria-label="주요 네비게이션">
    <a href="/">홈</a>
    <a href="/about">소개</a>
  </nav>
</HeaderBar>

// Bad
<HeaderBar title="App">
  <div>
    <a href="/">홈</a>
    <a href="/about">소개</a>
  </div>
</HeaderBar>`,
                explanation:
                  'nav 요소를 사용하면 스크린 리더가 네비게이션 영역을 인식할 수 있습니다.',
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
            HeaderBar를 효과적으로 사용하기 위한 권장사항입니다.
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
                <ListItem>페이지 최상단에 하나만 배치</ListItem>
                <ListItem>로고와 제목으로 브랜드 아이덴티티 표현</ListItem>
                <ListItem>네비게이션은 children 영역에 배치</ListItem>
                <ListItem>주요 액션 버튼은 actions 영역에 배치</ListItem>
                <ListItem>긴 페이지에서 sticky 사용 고려</ListItem>
                <ListItem>aria-label로 헤더 목적 명시</ListItem>
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
                <ListItem>한 페이지에 여러 HeaderBar 사용하지 않기</ListItem>
                <ListItem>
                  actions에 너무 많은 요소 넣지 않기 (3개 이하 권장)
                </ListItem>
                <ListItem>sticky 사용 시 z-index 충돌 주의</ListItem>
                <ListItem>
                  transparent 배경에 어두운 텍스트 사용하지 않기
                </ListItem>
                <ListItem>title 없이 네비게이션만 배치하지 않기</ListItem>
              </List>
            </Card.Body>
          </Card>
        </div>
      </section>
    </article>
  );
}
