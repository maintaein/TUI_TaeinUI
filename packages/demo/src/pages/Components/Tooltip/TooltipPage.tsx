import { Card, List, ListItem } from '@taein-ui/core';
import { LivePreview } from '../../../components/LivePreview';
import { CodeBlock } from '../../../components/CodeBlock';
import { PropsTable } from '../../../components/PropsTable';
import type { PropDefinition } from '../../../components/PropsTable/PropsTable';
import { AccessibilitySection } from '../../../components/AccessibilitySection';
import * as styles from './TooltipPage.css';

export function TooltipPage() {
  const propsData: PropDefinition[] = [
    {
      name: 'children',
      type: 'ReactElement',
      required: true,
      description:
        '툴팁을 트리거할 단일 요소. aria-describedby가 이 요소에 직접 붙습니다. 받은 aria-*와 onClick도 이 요소로 넘어가므로 Popover 안에 넣을 수 있습니다.',
    },
    {
      name: 'content',
      type: 'ReactNode',
      required: true,
      description: '툴팁에 표시할 내용',
    },
    {
      name: 'position',
      type: "'top' | 'bottom' | 'left' | 'right'",
      default: "'top'",
      description: '툴팁 표시 위치',
    },
    {
      name: 'delay',
      type: 'number',
      default: '200',
      description: '툴팁 표시까지 지연 시간(ms)',
    },
    {
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description: '툴팁 비활성화',
    },
    {
      name: 'arrow',
      type: 'boolean',
      default: 'true',
      description: '화살표 표시 여부',
    },
    {
      name: 'open',
      type: 'boolean',
      description: '제어 모드: 툴팁 표시 여부',
    },
    {
      name: 'onOpenChange',
      type: '(open: boolean) => void',
      description: '제어 모드: 표시 상태 변경 핸들러',
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
        <h1 className={styles.title}>Tooltip</h1>
        <p className={styles.description}>
          Tooltip 컴포넌트는 아이콘이나 버튼 위에 마우스를 올렸을 때 부가 설명을
          보여줄 때 사용합니다.
        </p>
      </header>

      {/* Quick Reference */}
      <div className={styles.quickReference}>
        <Card className={styles.quickRefCard}>
          <Card.Body>
            <div className={styles.quickRefTitle}>Import</div>
            <CodeBlock
              code="import { Tooltip } from '@taein-ui/core';"
              language="tsx"
            />
          </Card.Body>
        </Card>
        <Card className={styles.quickRefCard}>
          <Card.Body>
            <div className={styles.quickRefTitle}>Basic Usage</div>
            <CodeBlock
              code={`<Tooltip content="추가 정보">
  <Button>hover me</Button>
</Tooltip>`}
              language="tsx"
            />
          </Card.Body>
        </Card>
        <Card className={styles.quickRefCard}>
          <Card.Body>
            <div className={styles.quickRefTitle}>Key Features</div>
            <CodeBlock
              code={`position: 'top' | 'bottom' | 'left' | 'right'
delay: hover 후 지연 시간 (기본 200ms)
arrow: 화살표 표시/숨김
제어/비제어 모드 모두 지원`}
              language="text"
            />
          </Card.Body>
        </Card>
      </div>

      {/* Basic */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Basic</h2>
          <p className={styles.sectionDescription}>
            기본 사용법입니다. children 요소에 hover 또는 focus하면 툴팁이
            나타납니다.
          </p>
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Default</h3>
          <LivePreview
            title="기본 툴팁"
            description="content prop에 텍스트를 전달하면 됩니다. 기본 위치는 top입니다."
            editable
            code={`<Tooltip content="추가 정보를 제공합니다">
  <Button size="sm">hover me</Button>
</Tooltip>`}
          />
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Text Content</h3>
          <LivePreview
            title="텍스트 트리거"
            description="버튼 외에도 텍스트나 아이콘 등 모든 요소를 트리거로 사용할 수 있습니다."
            editable
            code={`<div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
  <Tooltip content="이름을 수정할 수 있습니다">
    <span style={{ textDecoration: 'underline dotted', cursor: 'help' }}>사용자 이름</span>
  </Tooltip>
  <Tooltip content="삭제는 취소할 수 없습니다">
    <Button size="sm" variant="danger">삭제</Button>
  </Tooltip>
  <Tooltip content="설정 페이지로 이동합니다">
    <Button size="sm" variant="light"><Settings size={16} /></Button>
  </Tooltip>
</div>`}
          />
        </div>
      </section>

      {/* Position */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Position</h2>
          <p className={styles.sectionDescription}>
            4가지 위치에 툴팁을 표시할 수 있습니다.
          </p>
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Top / Bottom / Left / Right</h3>
          <LivePreview
            title="위치 옵션"
            description="position prop으로 툴팁 위치를 지정합니다."
            editable
            code={`<div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', padding: '2rem' }}>
  <Tooltip content="위쪽 툴팁" position="top">
    <Button size="sm">Top</Button>
  </Tooltip>
  <Tooltip content="아래쪽 툴팁" position="bottom">
    <Button size="sm">Bottom</Button>
  </Tooltip>
  <Tooltip content="왼쪽 툴팁" position="left">
    <Button size="sm">Left</Button>
  </Tooltip>
  <Tooltip content="오른쪽 툴팁" position="right">
    <Button size="sm">Right</Button>
  </Tooltip>
</div>`}
          />
        </div>
      </section>

      {/* Arrow */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Arrow</h2>
          <p className={styles.sectionDescription}>
            화살표 표시 여부를 제어할 수 있습니다.
          </p>
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>With / Without Arrow</h3>
          <LivePreview
            title="화살표 옵션"
            description="arrow prop으로 화살표를 표시하거나 숨길 수 있습니다. 기본값은 true입니다."
            editable
            code={`<div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', padding: '1.5rem' }}>
  <Tooltip content="화살표 있음" arrow={true}>
    <Button size="sm">arrow=true</Button>
  </Tooltip>
  <Tooltip content="화살표 없음" arrow={false}>
    <Button size="sm">arrow=false</Button>
  </Tooltip>
</div>`}
          />
        </div>
      </section>

      {/* Delay */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Delay</h2>
          <p className={styles.sectionDescription}>
            hover 후 툴팁이 나타나기까지의 지연 시간을 조절할 수 있습니다.
          </p>
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Delay Options</h3>
          <LivePreview
            title="지연 시간 비교"
            description="delay prop에 밀리초 단위 값을 전달합니다. 기본값은 200ms입니다."
            editable
            code={`<div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', padding: '1.5rem' }}>
  <Tooltip content="즉시 나타납니다" delay={0}>
    <Button size="sm">delay=0</Button>
  </Tooltip>
  <Tooltip content="200ms 후 나타납니다" delay={200}>
    <Button size="sm">delay=200 (기본)</Button>
  </Tooltip>
  <Tooltip content="500ms 후 나타납니다" delay={500}>
    <Button size="sm">delay=500</Button>
  </Tooltip>
  <Tooltip content="1초 후 나타납니다" delay={1000}>
    <Button size="sm">delay=1000</Button>
  </Tooltip>
</div>`}
          />
        </div>
      </section>

      {/* Disabled */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Disabled</h2>
          <p className={styles.sectionDescription}>
            disabled prop으로 툴팁을 비활성화할 수 있습니다.
          </p>
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Disabled Tooltip</h3>
          <LivePreview
            title="비활성화"
            description="disabled={true}이면 hover/focus 시 툴팁이 나타나지 않습니다."
            editable
            code={`<div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', padding: '1.5rem' }}>
  <Tooltip content="이 툴팁은 활성화됩니다" disabled={false}>
    <Button size="sm">활성화</Button>
  </Tooltip>
  <Tooltip content="이 툴팁은 나타나지 않습니다" disabled={true}>
    <Button size="sm">비활성화</Button>
  </Tooltip>
</div>`}
          />
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Conditional Disable</h3>
          <LivePreview
            title="조건부 비활성화"
            description="상태에 따라 동적으로 툴팁을 활성화/비활성화합니다."
            editable
            code={`const [isDisabled, setIsDisabled] = useState(false);

<div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
  <Tooltip content="저장하려면 모든 필드를 입력하세요" disabled={!isDisabled}>
    <Button size="sm" disabled={isDisabled}>저장</Button>
  </Tooltip>
  <Button size="sm" variant="light" onClick={() => setIsDisabled((v) => !v)}>
    {isDisabled ? '버튼 활성화' : '버튼 비활성화'}
  </Button>
</div>`}
          />
        </div>
      </section>

      {/* Controlled Mode */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Controlled Mode</h2>
          <p className={styles.sectionDescription}>
            open / onOpenChange prop으로 툴팁 표시 상태를 외부에서 제어할 수
            있습니다.
          </p>
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Controlled</h3>
          <LivePreview
            title="제어 모드"
            description="open prop을 직접 전달하면 hover/focus 이벤트와 무관하게 표시 상태를 제어합니다."
            editable
            code={`const [open, setOpen] = useState(false);

<div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
  <Tooltip content="제어 모드 툴팁입니다" open={open} onOpenChange={setOpen}>
    <Button size="sm">hover도 동작합니다</Button>
  </Tooltip>
  <Button size="sm" variant="light" onClick={() => setOpen((v) => !v)}>
    {open ? '툴팁 숨기기' : '툴팁 보이기'}
  </Button>
</div>`}
          />
        </div>
      </section>

      {/* Rich Content */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Rich Content</h2>
          <p className={styles.sectionDescription}>
            content prop은 ReactNode를 받으므로 복잡한 내용도 표시할 수
            있습니다.
          </p>
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>JSX Content</h3>
          <LivePreview
            title="JSX 콘텐츠"
            description="content에 JSX를 전달하여 아이콘, 강조 텍스트 등을 포함할 수 있습니다."
            editable
            code={`<div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', padding: '1.5rem' }}>
  <Tooltip content={<span><TriangleAlert size={16} style={{ verticalAlign: 'text-bottom' }} /> <strong>주의:</strong> 되돌릴 수 없습니다</span>} position="bottom">
    <Button size="sm" variant="danger">삭제</Button>
  </Tooltip>
  <Tooltip content={<span><CircleCheck size={16} style={{ verticalAlign: 'text-bottom' }} /> 변경사항이 <strong>자동 저장</strong>됩니다</span>} position="right">
    <Button size="sm">편집</Button>
  </Tooltip>
</div>`}
          />
        </div>
      </section>

      {/* Composition Patterns */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Composition Patterns</h2>
          <p className={styles.sectionDescription}>
            실제 UI에서 자주 사용하는 패턴입니다.
          </p>
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Icon Buttons Toolbar</h3>
          <LivePreview
            title="아이콘 버튼 툴바"
            description="아이콘 버튼에 툴팁을 붙여 기능을 설명합니다."
            editable
            code={`<div style={{ display: 'inline-flex', gap: '0.25rem', padding: '0.5rem', background: '#f3f4f6', borderRadius: '0.5rem' }}>
  <Tooltip content="굵게" position="bottom" delay={0}>
    <Button size="sm" variant="light"><strong>B</strong></Button>
  </Tooltip>
  <Tooltip content="기울임" position="bottom" delay={0}>
    <Button size="sm" variant="light"><em>I</em></Button>
  </Tooltip>
  <Tooltip content="밑줄" position="bottom" delay={0}>
    <Button size="sm" variant="light"><u>U</u></Button>
  </Tooltip>
  <Tooltip content="링크 삽입" position="bottom" delay={0}>
    <Button size="sm" variant="light"><Link size={16} /></Button>
  </Tooltip>
</div>`}
          />
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Tooltip + Popover</h3>
          <LivePreview
            title="아이콘 버튼에 툴팁과 메뉴를 같이 달기"
            description="호버하면 이름을 알려 주는 툴팁이 뜨고, 누르면 메뉴가 열립니다. Popover 안에 Tooltip을 넣으면 aria-expanded와 aria-describedby가 같은 버튼에 붙습니다."
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
  <Tooltip content="더보기" position="top">
    <IconButton ghost aria-label="더보기"><Ellipsis size={22} /></IconButton>
  </Tooltip>
</Popover>`}
          />
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Form Field Help</h3>
          <LivePreview
            title="폼 필드 도움말"
            description="입력 필드 옆 물음표 아이콘에 툴팁으로 안내 메시지를 제공합니다."
            editable
            code={`<div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '320px' }}>
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
    <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>비밀번호</label>
    <Tooltip content="영문, 숫자, 특수문자 포함 8자 이상" position="right" delay={0}>
      <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#9ca3af', color: '#fff', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'help' }}>?</span>
    </Tooltip>
  </div>
  <TextField type="password" placeholder="비밀번호 입력" />
</div>`}
          />
        </div>
      </section>

      {/* Props API */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Props API</h2>
          <p className={styles.sectionDescription}>
            Tooltip 컴포넌트의 전체 props 목록입니다.
          </p>
        </div>
        <div className={styles.propsTableWrapper}>
          <PropsTable props={propsData} />
        </div>
      </section>

      {/* Accessibility */}
      <section className={styles.section}>
        <AccessibilitySection
          componentName="Tooltip"
          intro="Tooltip은 role='tooltip'과 aria-describedby를 통해 보조 기술에 추가 정보를 제공합니다. 키보드 포커스 시에도 툴팁이 나타납니다."
          features={[
            {
              attribute: 'role="tooltip"',
              effect: '툴팁 역할 전달',
              description: '스크린 리더가 해당 요소를 툴팁으로 인식합니다.',
            },
            {
              attribute: 'aria-describedby',
              effect: '연관 요소 연결',
              description:
                '트리거 요소 자체가 툴팁 내용을 설명으로 참조합니다. 툴팁이 열릴 때만 설정되고, 요소가 이미 가진 값과는 공백으로 합쳐집니다.',
            },
            {
              attribute: 'onFocus / onBlur',
              effect: '키보드 접근성',
              description: '마우스 없이 Tab 키로 포커스해도 툴팁이 나타납니다.',
            },
            {
              attribute: 'delay',
              effect: '실수 방지',
              description:
                '지연 시간으로 빠른 마우스 이동 시 불필요한 툴팁 표시를 방지합니다.',
            },
            {
              attribute: 'onMouseEnter / onMouseLeave',
              effect: '호버 가능 (WCAG 1.4.13)',
              description:
                '포인터를 트리거에서 툴팁으로 옮겨도 닫히지 않습니다. 툴팁 위에 포인터를 둔 채 내용을 읽을 수 있습니다.',
            },
          ]}
        />
      </section>

      {/* Best Practices */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Best Practices</h2>
          <p className={styles.sectionDescription}>
            Tooltip을 효과적으로 사용하기 위한 권장사항입니다.
          </p>
        </div>
        <div className={styles.practicesGrid}>
          <Card>
            <Card.Body>
              <div className={styles.practiceHeader}>
                <span className={styles.practiceIcon}>O</span>
                <span className={styles.practiceTitle}>권장</span>
              </div>
              <List>
                <ListItem>짧고 명확한 설명 텍스트 사용</ListItem>
                <ListItem>아이콘 버튼에 기능 설명 제공</ListItem>
                <ListItem>긴 레이블의 잘린 텍스트 전체 내용 표시</ListItem>
                <ListItem>키보드 접근 가능한 요소에만 사용</ListItem>
                <ListItem>
                  화면 가장자리 요소는 반대 방향 position 사용
                </ListItem>
              </List>
            </Card.Body>
          </Card>
          <Card>
            <Card.Body>
              <div className={styles.practiceHeader}>
                <span className={styles.practiceIconError}>X</span>
                <span className={styles.practiceTitle}>지양</span>
              </div>
              <List>
                <ListItem>
                  필수 정보를 툴팁으로만 전달 (항상 보여야 할 내용)
                </ListItem>
                <ListItem>긴 문단이나 여러 단락의 내용</ListItem>
                <ListItem>모바일 터치 전용 UI (hover 불가)</ListItem>
                <ListItem>클릭 가능한 링크나 버튼을 content에 포함</ListItem>
                <ListItem>자주 확인해야 하는 중요 정보</ListItem>
              </List>
            </Card.Body>
          </Card>
        </div>
      </section>
    </article>
  );
}
