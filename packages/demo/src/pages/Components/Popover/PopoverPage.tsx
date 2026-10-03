import { Card, List, ListItem } from '@taein-ui/core';
import { LivePreview } from '../../../components/LivePreview';
import { CodeBlock } from '../../../components/CodeBlock';
import { PropsTable } from '../../../components/PropsTable';
import type { PropDefinition } from '../../../components/PropsTable/PropsTable';
import { AccessibilitySection } from '../../../components/AccessibilitySection';
import * as styles from './PopoverPage.css';

export function PopoverPage() {
  const propsData: PropDefinition[] = [
    {
      name: 'children',
      type: 'ReactElement',
      required: true,
      description:
        '트리거 요소. 상호작용 가능한 단일 요소여야 합니다 (Button, IconButton, Avatar 등). onClick과 aria-haspopup·aria-expanded·aria-controls가 이 요소에 직접 붙습니다.',
    },
    {
      name: 'content',
      type: 'ReactNode',
      required: true,
      description: '팝오버 내부에 표시할 콘텐츠',
    },
    {
      name: 'open',
      type: 'boolean',
      default: 'undefined',
      description: '제어 모드: 팝오버 표시 여부를 외부에서 제어',
    },
    {
      name: 'onOpenChange',
      type: '(open: boolean) => void',
      default: 'undefined',
      description: '팝오버 표시 상태가 변경될 때 호출되는 콜백',
    },
    {
      name: 'position',
      type: "'top' | 'bottom' | 'left' | 'right'",
      default: "'bottom'",
      description: '팝오버 표시 위치',
    },
    {
      name: 'closeOnOutsideClick',
      type: 'boolean',
      default: 'true',
      description: '팝오버 외부 클릭 시 자동 닫기',
    },
    {
      name: 'closeOnEscape',
      type: 'boolean',
      default: 'true',
      description: 'ESC 키 입력 시 자동 닫기',
    },
    {
      name: 'arrow',
      type: 'boolean',
      default: 'false',
      description: '팝오버에 화살표 표시',
    },
    {
      name: 'maxWidth',
      type: 'string',
      default: 'undefined',
      description: '팝오버 최대 너비',
    },
    {
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description: '비활성화 상태 (클릭 무시)',
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
        <h1 className={styles.title}>Popover</h1>
        <p className={styles.description}>
          Popover 컴포넌트는 프로필 메뉴, 날짜 선택기, 필터 패널 등 특정 요소를
          클릭했을 때 근처에 패널을 띄울 때 사용합니다.
        </p>
      </header>

      {/* Quick Reference */}
      <section className={styles.quickReference}>
        <Card className={styles.quickRefCard}>
          <Card.Body padding="md">
            <h3 className={styles.quickRefTitle}>Import</h3>
            <CodeBlock
              language="typescript"
              code={`import { Popover } from '@taein-ui/core';`}
            />
          </Card.Body>
        </Card>
        <Card className={styles.quickRefCard}>
          <Card.Body padding="md">
            <h3 className={styles.quickRefTitle}>Basic Usage</h3>
            <CodeBlock
              language="tsx"
              code={`<Popover content={<div>팝오버 내용</div>}>
  <Button>열기</Button>
</Popover>`}
            />
          </Card.Body>
        </Card>
      </section>

      {/* Examples Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Examples</h2>
          <p className={styles.sectionDescription}>
            다양한 사용 사례에 맞는 Popover 예제입니다.
          </p>
        </div>

        {/* Basic (Uncontrolled) */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Basic Popover</h3>
          <LivePreview
            title="기본 사용법 (비제어)"
            description="가장 기본적인 비제어 모드 Popover입니다. 트리거를 클릭하면 열리고, 바깥 클릭이나 ESC로 닫힙니다."
            editable
            code={`<Popover maxWidth="240px" content={<div style={{ padding: '1rem' }}><Text variant="body2">안녕하세요! 팝오버 콘텐츠입니다.</Text></div>}>
  <Button>팝오버 열기</Button>
</Popover>`}
          />
        </div>

        {/* Controlled */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Controlled</h3>
          <LivePreview
            title="제어 모드"
            description="open과 onOpenChange를 사용하여 외부에서 팝오버 상태를 제어할 수 있습니다."
            editable
            code={`const [open, setOpen] = useState(false);

<div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
  <Popover
    open={open}
    onOpenChange={setOpen}
    maxWidth="200px"
    content={<div style={{ padding: '1rem' }}><Text variant="body2">제어 모드 팝오버</Text></div>}
  >
    <Button>트리거</Button>
  </Popover>
  <Button variant="light" onClick={() => setOpen(false)}>외부에서 닫기</Button>
</div>`}
          />
        </div>

        {/* Position */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Position</h3>
          <LivePreview
            title="위치 옵션"
            description="top, bottom, left, right 4가지 위치를 지원합니다."
            editable
            code={`<div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center', padding: '4rem 2rem' }}>
  <Popover position="top" content={<div style={{ padding: '0.75rem' }}><Text variant="body2">Top</Text></div>}>
    <Button variant="light">Top</Button>
  </Popover>
  <Popover position="bottom" content={<div style={{ padding: '0.75rem' }}><Text variant="body2">Bottom</Text></div>}>
    <Button variant="light">Bottom</Button>
  </Popover>
  <Popover position="left" content={<div style={{ padding: '0.75rem' }}><Text variant="body2">Left</Text></div>}>
    <Button variant="light">Left</Button>
  </Popover>
  <Popover position="right" content={<div style={{ padding: '0.75rem' }}><Text variant="body2">Right</Text></div>}>
    <Button variant="light">Right</Button>
  </Popover>
</div>`}
          />
        </div>

        {/* Arrow */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>With Arrow</h3>
          <LivePreview
            title="화살표"
            description="arrow prop으로 팝오버에 화살표를 표시합니다. 트리거와의 시각적 연결성을 높여줍니다."
            editable
            code={`<div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center', padding: '4rem 2rem' }}>
  <Popover arrow position="top" content={<div style={{ padding: '0.75rem' }}><Text variant="body2">Top Arrow</Text></div>}>
    <Button variant="light">Top</Button>
  </Popover>
  <Popover arrow position="bottom" content={<div style={{ padding: '0.75rem' }}><Text variant="body2">Bottom Arrow</Text></div>}>
    <Button variant="light">Bottom</Button>
  </Popover>
  <Popover arrow position="left" content={<div style={{ padding: '0.75rem' }}><Text variant="body2">Left Arrow</Text></div>}>
    <Button variant="light">Left</Button>
  </Popover>
  <Popover arrow position="right" content={<div style={{ padding: '0.75rem' }}><Text variant="body2">Right Arrow</Text></div>}>
    <Button variant="light">Right</Button>
  </Popover>
</div>`}
          />
        </div>

        {/* Rich Content */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Rich Content</h3>
          <LivePreview
            title="풍부한 콘텐츠"
            description="Popover의 content에 TUI 컴포넌트를 조합하여 메뉴, 카드, 폼 등 다양한 콘텐츠를 담을 수 있습니다."
            editable
            code={`const [open, setOpen] = useState(false);
const menu = (
  <div style={{ minWidth: '200px' }}>
    <div style={{ padding: '0.75rem 1rem' }}>
      <Text variant="body1" weight="semibold">설정 메뉴</Text>
    </div>
    <Divider spacing="sm" />
    <List spacing="sm" style={{ padding: '0.25rem 0.5rem' }}>
      <ListItem style={{ padding: '0.5rem', borderRadius: '6px', cursor: 'pointer' }}>일반</ListItem>
      <ListItem style={{ padding: '0.5rem', borderRadius: '6px', cursor: 'pointer' }}>알림</ListItem>
      <ListItem style={{ padding: '0.5rem', borderRadius: '6px', cursor: 'pointer' }}>보안</ListItem>
    </List>
    <Divider spacing="sm" />
    <List spacing="sm" style={{ padding: '0.25rem 0.5rem 0.5rem' }}>
      <ListItem style={{ padding: '0.5rem', borderRadius: '6px', cursor: 'pointer' }}>
        <Text variant="body2" color="error">로그아웃</Text>
      </ListItem>
    </List>
  </div>
);

<Popover open={open} onOpenChange={setOpen} content={menu}>
  <Button variant="dark" onClick={() => setOpen(!open)}>설정</Button>
</Popover>`}
          />
        </div>

        {/* IconButton Trigger */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>IconButton Trigger</h3>
          <LivePreview
            title="IconButton 트리거"
            description="트리거는 Button에 한정되지 않습니다. 클릭 가능한 요소라면 IconButton처럼 아이콘만 있는 버튼도 감쌀 수 있습니다."
            editable
            code={`<Popover
  position="bottom"
  content={
    <List spacing="sm" style={{ padding: '0.25rem 0.5rem', minWidth: '140px' }}>
      <ListItem style={{ padding: '0.5rem', borderRadius: '6px', cursor: 'pointer' }}>편집</ListItem>
      <ListItem style={{ padding: '0.5rem', borderRadius: '6px', cursor: 'pointer' }}>복제</ListItem>
      <ListItem style={{ padding: '0.5rem', borderRadius: '6px', cursor: 'pointer' }}>
        <Text variant="body2" color="error">삭제</Text>
      </ListItem>
    </List>
  }
>
  <IconButton ghost aria-label="더보기"><Ellipsis size={22} /></IconButton>
</Popover>`}
          />
        </div>

        {/* Avatar Trigger */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Avatar Trigger</h3>
          <LivePreview
            title="Avatar 트리거"
            description="onClick을 따로 넘기지 않아도 Avatar가 버튼이 되어 클릭과 키보드(Enter·Space)로 열립니다."
            editable
            code={`<Popover
  position="bottom"
  content={
    <div style={{ minWidth: '220px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem', padding: '0.75rem 1rem' }}>
        <Text variant="body1" weight="semibold">홍길동</Text>
        <Text variant="body3" color="secondary">hong@example.com</Text>
      </div>
      <Divider spacing="sm" />
      <List spacing="sm" style={{ padding: '0.25rem 0.5rem 0.5rem' }}>
        <ListItem style={{ padding: '0.5rem', borderRadius: '6px', cursor: 'pointer' }}>설정</ListItem>
        <ListItem style={{ padding: '0.5rem', borderRadius: '6px', cursor: 'pointer' }}>
          <Text variant="body2" color="error">로그아웃</Text>
        </ListItem>
      </List>
    </div>
  }
>
  <Avatar src="https://i.pravatar.cc/150?img=40" alt="프로필 메뉴" size="lg" />
</Popover>`}
          />
        </div>

        {/* Close Options */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Close Options</h3>
          <LivePreview
            title="닫기 옵션"
            description="closeOnOutsideClick, closeOnEscape로 닫기 동작을 세밀하게 제어할 수 있습니다."
            editable
            code={`<div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
  <Popover
    closeOnOutsideClick={false}
    maxWidth="260px"
    content={<div style={{ padding: '1rem' }}><Text variant="body2">바깥 클릭으로 닫히지 않습니다.</Text></div>}
  >
    <Button variant="light">Outside Click 무시</Button>
  </Popover>
  <Popover
    closeOnEscape={false}
    maxWidth="240px"
    content={<div style={{ padding: '1rem' }}><Text variant="body2">ESC로 닫히지 않습니다.</Text></div>}
  >
    <Button variant="light">ESC 무시</Button>
  </Popover>
</div>`}
          />
        </div>
      </section>

      {/* Props API */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Props API</h2>
          <p className={styles.sectionDescription}>
            Popover 컴포넌트의 모든 Props와 타입 정보입니다. HTML div 속성도
            사용 가능합니다.
          </p>
        </div>
        <div className={styles.propsTableWrapper}>
          <PropsTable props={propsData} />
        </div>
      </section>

      {/* Accessibility */}
      <AccessibilitySection
        componentName="Popover"
        intro="Popover 컴포넌트는 다음과 같은 접근성을 기본 제공합니다."
        features={[
          {
            attribute: 'role="dialog"',
            effect: '팝오버를 대화 상자로 인식합니다.',
            description:
              '팝오버 콘텐츠에 role="dialog"가 설정되어 스크린 리더에서 대화 상자로 인식합니다.',
          },
          {
            attribute: 'aria-haspopup="dialog"',
            effect: '트리거에 팝업이 있음을 알립니다.',
            description:
              '트리거 요소에 aria-haspopup="dialog"가 설정되어 팝업의 존재를 미리 알립니다.',
          },
          {
            attribute: 'aria-expanded',
            effect: '팝오버의 열림/닫힘 상태를 전달합니다.',
            description:
              '트리거의 aria-expanded가 팝오버 상태에 따라 true/false로 변경됩니다.',
          },
          {
            attribute: 'aria-controls',
            effect: '트리거와 팝오버를 연결합니다.',
            description:
              '팝오버가 열릴 때 aria-controls로 트리거와 팝오버 콘텐츠를 연결합니다.',
          },
          {
            attribute: 'Escape 키',
            effect: 'ESC 키로 팝오버를 닫습니다.',
            description:
              'ESC를 누르면 팝오버가 닫히고 포커스가 트리거로 복귀합니다.',
          },
          {
            attribute: '포커스 관리',
            effect: '열릴 때 첫 focusable 요소로 포커스가 이동합니다.',
            description:
              '팝오버가 열리면 내부의 첫 포커스 가능한 요소로 포커스가 이동하고, 닫히면 트리거로 복귀합니다.',
          },
        ]}
        additionalGuidance={[
          {
            title: 'Tooltip과의 구분',
            description:
              'Tooltip은 hover 시 짧은 텍스트를 보여주는 용도이고, Popover는 클릭 시 인터랙티브한 콘텐츠를 표시하는 용도입니다.',
            examples: [
              {
                code: `// Popover: 클릭 인터랙션, 인터랙티브 콘텐츠
<Popover content={<MenuList />}>
  <Button>메뉴</Button>
</Popover>

// Tooltip: 호버 인터랙션, 텍스트 정보
<Tooltip content="삭제합니다">
  <IconButton aria-label="삭제"><Trash /></IconButton>
</Tooltip>`,
                explanation:
                  'Popover는 버튼, 링크, 폼 등 인터랙티브 요소를 포함할 수 있습니다.',
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
            Popover를 효과적으로 사용하기 위한 권장사항입니다.
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
                  드롭다운 메뉴, 프로필 카드 등 인터랙티브 콘텐츠에 사용
                </ListItem>
                <ListItem>제어 모드로 외부 상태와 연동</ListItem>
                <ListItem>팝오버 내부에 명확한 액션 버튼 배치</ListItem>
                <ListItem>트리거 요소에 클릭 가능한 시각적 힌트 제공</ListItem>
                <ListItem>
                  콘텐츠 양이 적을 때 사용 (많으면 Modal 사용)
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
                <ListItem>
                  단순 텍스트 정보에 Popover 사용하지 않기 (Tooltip 사용)
                </ListItem>
                <ListItem>팝오버 안에 또 다른 팝오버를 중첩하지 않기</ListItem>
                <ListItem>
                  긴 폼이나 복잡한 콘텐츠에 사용하지 않기 (Modal 사용)
                </ListItem>
                <ListItem>
                  closeOnOutsideClick과 closeOnEscape를 동시에 false로 설정하지
                  않기
                </ListItem>
                <ListItem>
                  팝오버 트리거를 비인터랙티브 요소로 사용하지 않기
                </ListItem>
              </List>
            </Card.Body>
          </Card>
        </div>
      </section>
    </article>
  );
}
