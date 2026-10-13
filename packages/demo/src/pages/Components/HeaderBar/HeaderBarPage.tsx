import { Card, List, ListItem } from '@taein-ui/core';
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
      name: 'items',
      type: 'HeaderBarItem[]',
      description:
        "가운데 항목. { label, href?, onClick?, icon?, active? }. href가 있으면 <a>, 없으면 <button>이고 active는 aria-current='page'입니다. navStyle='icon'이면 모든 항목에 icon이 필요합니다",
    },
    {
      name: 'navStyle',
      type: "'text' | 'icon'",
      default: "'text'",
      description:
        '항목이 보이는 모습. text는 호버 때 밑줄이 왼쪽에서 그어지는 글자 링크, icon은 커서가 가까울수록 부푸는 아이콘 알약',
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
      description: '스크롤 시 화면 위에 붙어 따라옴 (위 여백 유지)',
    },
    {
      name: 'variant',
      type: "'default' | 'dark' | 'transparent'",
      default: "'default'",
      description: '바 배경 변형. transparent는 면과 그림자가 없음',
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
          HeaderBar 컴포넌트는 페이지 상단에 떠 있는 둥근 바로 로고, 제목, 항목,
          액션 버튼을 배치할 때 사용합니다. 스크롤 시 화면 위에 붙일 수 있고,
          768px 미만에서는 항목이 햄버거 메뉴로 접힙니다.
        </p>
      </header>

      {/* Quick Reference */}
      <section className={styles.quickReference}>
        <Card className={styles.quickRefCard}>
          <Card.Body padding="md">
            <h3 className={styles.quickRefTitle}>Import</h3>
            <CodeBlock
              language="typescript"
              code={`import { HeaderBar } from '@taein-ui/core';`}
            />
          </Card.Body>
        </Card>
        <Card className={styles.quickRefCard}>
          <Card.Body padding="md">
            <h3 className={styles.quickRefTitle}>Basic Usage</h3>
            <CodeBlock
              language="tsx"
              code={`<HeaderBar
  title="My App"
  items={[
    { label: '홈', href: '#', active: true },
    { label: '소개', href: '#' },
  ]}
  actions={<Button>Login</Button>}
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
            다양한 사용 사례에 맞는 HeaderBar 예제입니다.
          </p>
        </div>

        {/* Basic */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Basic HeaderBar</h3>
          <LivePreview
            title="기본 사용법"
            description="로고, 제목, 텍스트 항목 넷, 오른쪽 버튼을 배치한 떠 있는 둥근 바입니다. 항목은 items로 넘기고, 지금 보고 있는 페이지는 active로 표시합니다. 창을 768px보다 좁히면 항목이 햄버거 메뉴로 접힙니다."
            editable
            code={`<HeaderBar
  logo={<Palette size={24} />}
  title="TUI"
  items={[
    { label: '컴포넌트', href: '#', active: true },
    { label: '토큰', href: '#' },
    { label: '가이드', href: '#' },
    { label: '문의', href: '#' },
  ]}
  actions={<Button size="sm">시작하기</Button>}
/>`}
          />
        </div>

        {/* navStyle */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>navStyle: text</h3>
          <LivePreview
            title="텍스트 항목"
            description="기본 형태입니다. 호버나 키보드 포커스 때 글자 아래 밑줄이 왼쪽에서 그어지고, active 항목은 밑줄이 늘 그어져 있습니다."
            editable
            code={`<HeaderBar
  title="Store"
  navStyle="text"
  items={[
    { label: '상품', href: '#', active: true },
    { label: '카테고리', href: '#' },
    { label: '이벤트', href: '#' },
  ]}
/>`}
          />
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>navStyle: icon</h3>
          <LivePreview
            title="아이콘 항목"
            description="커서나 키보드 포커스가 가까워질수록 항목이 부풀고, 양옆 이웃은 절반만 부풉니다. 히트 영역은 고정 크기라 레이아웃이 흔들리지 않습니다. 모든 항목에 icon이 필요하고, label은 접근 이름입니다."
            editable
            code={`<HeaderBar
  title="Store"
  navStyle="icon"
  items={[
    { icon: <House size={20} />, label: '홈', href: '#', active: true },
    { icon: <Plus size={20} />, label: '새로 만들기' },
    { icon: <CircleCheck size={20} />, label: '완료함' },
    { icon: <Bell size={20} />, label: '알림' },
    { icon: <Settings size={20} />, label: '설정' },
  ]}
/>`}
          />
        </div>

        {/* Variants */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Variants</h3>
          <LivePreview
            title="배경 변형"
            description="default는 밝은 면, dark는 검은 계열 면(텍스트 자동 반전), transparent는 면과 그림자가 없어 뒤의 콘텐츠가 그대로 보입니다."
            editable
            code={`<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
  <HeaderBar variant="default" title="Default" items={[{ label: '홈', href: '#', active: true }, { label: '소개', href: '#' }]} />
  <HeaderBar variant="dark" title="Dark" items={[{ label: '홈', href: '#', active: true }, { label: '소개', href: '#' }]} />
  <div style={{ borderRadius: '0.75rem', overflow: 'hidden', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#ffffff', paddingBottom: '1rem' }}>
    <HeaderBar variant="transparent" title="Transparent" items={[{ label: '홈', href: '#', active: true }, { label: '소개', href: '#' }]} />
  </div>
</div>`}
          />
        </div>

        {/* Actions */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Multiple Actions</h3>
          <LivePreview
            title="다중 액션"
            description="actions 영역은 검색, 알림, 사용자 메뉴 등 기능적 버튼을 배치하는 우측 영역입니다. items가 페이지 이동 링크라면, actions는 앱 전역에서 동작하는 기능 버튼입니다."
            editable
            code={`<HeaderBar
  logo={<Package size={24} />}
  title="Store"
  items={[
    { label: '상품', href: '#', active: true },
    { label: '카테고리', href: '#' },
    { label: '이벤트', href: '#' },
  ]}
  actions={
    <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
      <IconButton aria-label="검색" size="sm"><Search /></IconButton>
      <IconButton aria-label="알림" size="sm"><Bell /></IconButton>
      <IconButton aria-label="장바구니" size="sm"><ShoppingCart /></IconButton>
      <Button size="sm">로그인</Button>
    </div>
  }
/>`}
          />
        </div>

        {/* Combination */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Combination</h3>
          <LivePreview
            title="조합 예제"
            description="로고, 제목, 항목, 액션을 모두 조합한 실제 사용 예시입니다."
            editable
            code={`<div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
  {/* 일반 웹 앱 헤더 */}
  <HeaderBar
    logo={<Package size={20} />}
    title="Store"
    items={[
      { label: '상품', href: '#', active: true },
      { label: '카테고리', href: '#' },
      { label: '이벤트', href: '#' },
    ]}
    actions={
      <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
        <IconButton aria-label="검색" size="sm"><Search /></IconButton>
        <IconButton aria-label="장바구니" size="sm"><ShoppingCart /></IconButton>
        <Button size="sm">로그인</Button>
      </div>
    }
  />
  {/* 관리자 대시보드 헤더 */}
  <HeaderBar
    variant="dark"
    logo={<Settings size={20} />}
    title="Admin"
    actions={
      <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
        <Badge variant="danger" size="sm">3</Badge>
        <IconButton aria-label="알림" size="sm"><Bell /></IconButton>
      </div>
    }
  />
</div>`}
          />
        </div>

        {/* Narrow */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>좁은 화면</h3>
          <p className={styles.sectionDescription}>
            화면 너비가 768px 미만이면 items가 숨고 햄버거 버튼이 나타납니다.
            누르면 바 아래에 세로 목록 판이 내용을 밀지 않고 겹쳐 열립니다. Esc,
            판 밖 누름, 항목 누름으로 닫힙니다. 브라우저 창을 줄여서 확인하세요.
          </p>
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
              '좌측(로고/제목) → 중앙(항목 nav) → 우측(액션, 햄버거) 순서로 DOM이 구성됩니다.',
          },
          {
            attribute: 'aria-current="page"',
            effect: '지금 보고 있는 페이지를 알립니다.',
            description: 'active 항목에 붙습니다. 밑줄만으로 알리지 않습니다.',
          },
          {
            attribute: '햄버거의 aria-expanded · aria-controls',
            effect: '메뉴가 열렸는지와 어떤 목록을 여는지를 알립니다.',
            description:
              '접근 이름은 열림 상태에 따라 "메뉴 열기"와 "메뉴 닫기"로 바뀌고, Esc로 닫으면 포커스가 햄버거로 돌아옵니다.',
          },
        ]}
        additionalGuidance={[
          {
            title: '페이지당 하나의 HeaderBar 사용',
            description: '페이지에 banner landmark는 하나만 있어야 합니다.',
            examples: [
              {
                code: `// Good - 페이지 최상단에 하나만 배치
<HeaderBar title="My App" aria-label="메인 헤더" items={[...]} />

// Bad - 여러 HeaderBar 사용
<HeaderBar title="Top" />
<HeaderBar title="Sub" />`,
                explanation:
                  '한 페이지에 role="banner"가 여러 개이면 스크린 리더 사용자가 혼란을 겪을 수 있습니다.',
              },
            ],
          },
          {
            title: '항목은 items로 넘기기',
            description:
              'items를 쓰면 nav 요소와 이름("주요 메뉴"), 현재 페이지 표시, 좁은 화면 메뉴가 함께 따라옵니다.',
            examples: [
              {
                code: `// Good
<HeaderBar
  title="App"
  items={[
    { label: '홈', href: '/', active: true },
    { label: '소개', href: '/about' },
  ]}
/>

// Bad - 가운데 슬롯(children)은 없습니다
<HeaderBar title="App">
  <a href="/">홈</a>
</HeaderBar>`,
                explanation:
                  'children은 지워졌습니다. 링크 목록은 items로, 버튼 같은 요소는 actions로 넘기세요.',
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
                <ListItem>네비게이션 링크는 items로 전달</ListItem>
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
                <ListItem>
                  좁은 화면에서 접히므로 items를 6개 넘게 넣지 않기
                </ListItem>
              </List>
            </Card.Body>
          </Card>
        </div>
      </section>
    </article>
  );
}
