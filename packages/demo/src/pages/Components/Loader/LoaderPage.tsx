import { Card, List, ListItem } from '@taein-ui/core';
import { LivePreview } from '../../../components/LivePreview';
import { CodeBlock } from '../../../components/CodeBlock';
import { PropsTable } from '../../../components/PropsTable';
import type { PropDefinition } from '../../../components/PropsTable/PropsTable';
import { AccessibilitySection } from '../../../components/AccessibilitySection';
import * as styles from './LoaderPage.css';

export function LoaderPage() {
  const propsData: PropDefinition[] = [
    {
      name: 'type',
      type: "'orbit' | 'spinner' | 'dots' | 'bar' | 'wave' | 'inchworm' | 'fuse'",
      default: "'orbit'",
      description:
        '로더 타입 (점 궤도, 스피너, 점이 솟는 버블, 프로그레스 바, 물결 막대, 자벌레, 진행률 도화선)',
    },
    {
      name: 'status',
      type: "'loading' | 'done' | 'error'",
      default: "'loading'",
      description:
        'orbit 전용 완료 표식. done이면 점 여덟 개가 체크로, error면 X로 모입니다. 다른 type에 주면 타입 오류입니다.',
    },
    {
      name: 'value',
      type: 'number',
      description:
        'fuse 전용 진행률 (0~100, 범위 밖은 자릅니다). type="fuse"일 때 필수이고, 다른 type에 주면 타입 오류입니다.',
    },
    {
      name: 'size',
      type: "'sm' | 'md' | 'lg' | 'xl'",
      default: "'md'",
      description: '로더 크기',
    },
    {
      name: 'color',
      type: "'primary' | 'secondary' | 'white' | string",
      default: "'primary'",
      description:
        '로더 색상. preset 또는 임의의 CSS 색상값 (예: "#8b5cf6", "currentColor")',
    },
    {
      name: 'label',
      type: 'string',
      description:
        '로더 하단에 표시할 텍스트 라벨. 글자가 바뀌면 옛 글자는 흐려지며 사라지고 새 글자가 흐림에서 또렷하게 나타납니다.',
    },
    {
      name: 'fullScreen',
      type: 'boolean',
      default: 'false',
      description: '전체 화면 로더 (fixed 포지션, 반투명 배경)',
    },
    {
      name: 'overlay',
      type: 'boolean',
      default: 'false',
      description: '오버레이 로더 (absolute 포지션, 부모 요소 위에 겹침)',
    },
    {
      name: 'aria-label',
      type: 'string',
      description:
        '접근성 레이블 (기본값: label, 없으면 orbit은 status에 따라 "로딩 중" / "완료" / "실패", fuse는 "진행률", 나머지는 "로딩 중")',
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
        <h1 className={styles.title}>Loader</h1>
        <p className={styles.description}>
          Loader 컴포넌트는 페이지 전체 또는 특정 영역이 로딩 중일 때
          사용합니다. 오버레이, 라벨 등을 함께 표시할 수 있습니다.
        </p>
      </header>

      {/* 저수준·고수준 사용 */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>저수준으로도, 고수준으로도</h2>
          <p className={styles.sectionDescription}>
            하나의 Loader가 type과 color로 두 가지 쓰임을 모두 덮습니다. 목적에
            맞게 props를 고르세요.
          </p>
        </div>

        <div className={styles.practicesGrid}>
          <Card>
            <Card.Body padding="lg">
              <div className={styles.practiceHeader}>
                <h3 className={styles.practiceTitle}>
                  저수준 (인라인 인디케이터)
                </h3>
              </div>
              <List spacing="sm" className={styles.practiceList}>
                <ListItem>
                  type="orbit", "spinner", "dots"만 단독으로 렌더링
                </ListItem>
                <ListItem>
                  color에 CSS 색상 문자열을 직접 지정 (예: "#8b5cf6",
                  "currentColor")
                </ListItem>
                <ListItem>
                  텍스트, 버튼 옆에 자연스럽게 배치되는 작은 크기
                </ListItem>
                <ListItem>
                  label, overlay, fullScreen을 생략하면 껍데기 없음
                </ListItem>
                <ListItem>커스텀 로딩 UI를 직접 조합할 때 사용</ListItem>
              </List>
            </Card.Body>
          </Card>

          <Card>
            <Card.Body padding="lg">
              <div className={styles.practiceHeader}>
                <h3 className={styles.practiceTitle}>
                  고수준 (앱 수준 로딩 UI)
                </h3>
              </div>
              <List spacing="sm" className={styles.practiceList}>
                <ListItem>
                  디자인 토큰 기반 색상 프리셋 (primary / secondary / white)
                </ListItem>
                <ListItem>
                  label, overlay, fullScreen 등 앱 수준 기능 내장
                </ListItem>
                <ListItem>bar 타입 (프로그레스 바) 지원</ListItem>
                <ListItem>빠르게 로딩 UI를 완성하고 싶을 때 사용</ListItem>
              </List>
            </Card.Body>
          </Card>
        </div>

        <div className={styles.example} style={{ marginTop: '1.5rem' }}>
          <h3 className={styles.exampleTitle}>언제 어떤 props를 쓸까?</h3>
          <CodeBlock
            language="tsx"
            code={`// 1. 간단한 로딩 UI → label, overlay, fullScreen
<Loader label="불러오는 중..." />
<Loader overlay />
<Loader fullScreen />

// 2. 커스텀 로딩 UI를 직접 만들 때 → type, size, color만 지정
<div className={myCustomOverlay}>
  <Loader size="xl" color="#8b5cf6" />
  <p>커스텀 레이아웃의 로딩 화면</p>
</div>

// 3. 브랜드 색상이 아닌 임의의 색상 → color에 CSS 색상 문자열
<Loader color="#ea580c" />`}
          />
        </div>
      </section>

      {/* Quick Reference */}
      <section className={styles.quickReference}>
        <Card className={styles.quickRefCard}>
          <Card.Body padding="md">
            <h3 className={styles.quickRefTitle}>Import</h3>
            <CodeBlock
              language="typescript"
              code={`import { Loader } from '@taein-ui/core';`}
            />
          </Card.Body>
        </Card>
        <Card className={styles.quickRefCard}>
          <Card.Body padding="md">
            <h3 className={styles.quickRefTitle}>Orbit</h3>
            <CodeBlock language="tsx" code={`<Loader size="md" />`} />
          </Card.Body>
        </Card>
        <Card className={styles.quickRefCard}>
          <Card.Body padding="md">
            <h3 className={styles.quickRefTitle}>With Label</h3>
            <CodeBlock
              language="tsx"
              code={`<Loader label="불러오는 중..." />`}
            />
          </Card.Body>
        </Card>
      </section>

      {/* Types */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Types</h2>
          <p className={styles.sectionDescription}>
            일곱 가지 로더 타입을 제공합니다. type을 주지 않으면 점
            궤도(orbit)입니다.
          </p>
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Orbit</h3>
          <LivePreview
            title="점 궤도 (기본)"
            description="제자리에 있는 점 여덟 개의 밝기가 시계 방향으로 차례로 지나가서 점선 고리가 도는 것처럼 보입니다. type을 주지 않으면 이 모습입니다."
            editable
            code={`<div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
  <Loader size="sm" />
  <Loader size="md" />
  <Loader size="lg" />
  <Loader size="xl" />
</div>`}
          />
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Spinner</h3>
          <LivePreview
            title="스피너"
            description='회전하는 원형 스피너입니다. 예전 기본 모습이며 type="spinner"로 고릅니다.'
            editable
            code={`<div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
  <Loader type="spinner" size="sm" />
  <Loader type="spinner" size="md" />
  <Loader type="spinner" size="lg" />
  <Loader type="spinner" size="xl" />
</div>`}
          />
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Dots</h3>
          <LivePreview
            title="점 애니메이션"
            description="세 개의 점이 차례로 살짝 움츠렸다가 말랑하게 솟았다 내려앉는 버블입니다. 채팅이나 타이핑 인디케이터에 적합합니다."
            editable
            code={`<div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
  <Loader type="dots" size="sm" />
  <Loader type="dots" size="md" />
  <Loader type="dots" size="lg" />
  <Loader type="dots" size="xl" />
</div>`}
          />
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Bar</h3>
          <LivePreview
            title="프로그레스 바"
            description="좌우로 움직이는 프로그레스 바입니다. 페이지 상단이나 섹션 로딩에 적합합니다."
            editable
            code={`<div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
  <Loader type="bar" size="sm" />
  <Loader type="bar" size="md" />
  <Loader type="bar" size="lg" />
  <Loader type="bar" size="xl" />
</div>`}
          />
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Wave</h3>
          <LivePreview
            title="물결 막대"
            description="가는 막대 한 줄 위를 보이지 않는 머리가 왼쪽에서 오른쪽으로 지나가고, 머리가 닿는 막대가 솟았다 가라앉습니다. 앞은 빨리 솟고 뒤는 천천히 가라앉습니다. 막대 간격은 8px로 고정이고 개수는 폭에 따라 정해집니다."
            editable
            code={`<div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
  <Loader type="wave" size="sm" />
  <Loader type="wave" size="md" />
  <Loader type="wave" size="lg" />
  <Loader type="wave" size="xl" />
</div>`}
          />
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Inchworm</h3>
          <LivePreview
            title="자벌레"
            description="bar와 같은 트랙 안에서 알약이 앞끝을 먼저 뻗고 뒤끝을 끌어와 3px 지나쳤다 앉는 걸음을 되풀이하며 왼쪽에서 오른쪽으로 기어갑니다. 한 걸음씩 나아간다는 뜻입니다."
            editable
            code={`<div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
  <Loader type="inchworm" size="sm" />
  <Loader type="inchworm" size="md" />
  <Loader type="inchworm" size="lg" />
  <Loader type="inchworm" size="xl" />
</div>`}
          />
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Status</h3>
          <LivePreview
            title="완료 표식"
            description="orbit에 status를 주면 돌던 점 여덟 개가 그 자리에서 체크(done) 또는 X(error)로 미끄러져 모입니다. 같은 점들이 모양을 바꾸는 것이라 loading으로 돌아가면 같은 길로 원 위에 돌아갑니다. 이동 중에 상태가 바뀌어도 지금 위치에서 이어집니다. label도 같이 바꾸면 흐림으로 갈아끼워집니다."
            editable
            code={`const [status, setStatus] = useState('loading');
const labels = { loading: '저장 중...', done: '저장했습니다', error: '저장하지 못했습니다' };

<div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'flex-start' }}>
  <div style={{ display: 'flex', gap: '0.5rem' }}>
    <Button size="sm" variant="light" onClick={() => setStatus('loading')}>loading</Button>
    <Button size="sm" variant="light" onClick={() => setStatus('done')}>done</Button>
    <Button size="sm" variant="light" onClick={() => setStatus('error')}>error</Button>
  </div>
  <Loader size="xl" status={status} label={labels[status]} />
</div>`}
          />
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Fuse</h3>
          <LivePreview
            title="도화선"
            description="진행률(value, 0~100)을 받는 막대입니다. 결정된 진행이 얼마나 왔는지 한 방향(왼쪽에서 오른쪽)으로 채우고, 채운 끝에 붙은 불똥이 고르지 않게 깜빡이며 타들어 갑니다. 100이 되면 불똥이 사라집니다."
            editable
            code={`const [value, setValue] = useState(30);

<div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'flex-start' }}>
  <div style={{ display: 'flex', gap: '0.5rem' }}>
    <Button size="sm" variant="light" onClick={() => setValue(Math.max(0, value - 20))}>-20</Button>
    <Button size="sm" variant="light" onClick={() => setValue(Math.min(100, value + 20))}>+20</Button>
    <Button size="sm" variant="light" onClick={() => setValue(0)}>0</Button>
  </div>
  <Loader type="fuse" size="lg" value={value} label={value + '%'} />
</div>`}
          />
        </div>
      </section>

      {/* Colors */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Colors</h2>
          <p className={styles.sectionDescription}>
            로더 색상을 지정합니다. white는 어두운 배경에서 사용합니다.
          </p>
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Color Variants</h3>
          <LivePreview
            title="색상 변형"
            description="primary(브랜드 색상), secondary(회색), white(흰색) 세 가지 색상을 제공합니다."
            editable
            code={`<div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
    <Loader color="primary" size="lg" />
    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>primary</span>
  </div>
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
    <Loader color="secondary" size="lg" />
    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>secondary</span>
  </div>
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', backgroundColor: '#1f2937', padding: '1rem', borderRadius: '0.5rem' }}>
    <Loader color="white" size="lg" />
    <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>white</span>
  </div>
</div>`}
          />
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Colors with Types</h3>
          <LivePreview
            title="타입별 색상"
            description="모든 타입에 색상을 적용할 수 있습니다."
            editable
            code={`<div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
  <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
    <span style={{ width: '80px', fontSize: '0.75rem', color: '#6b7280' }}>Spinner</span>
    <Loader type="spinner" color="primary" />
    <Loader type="spinner" color="secondary" />
  </div>
  <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
    <span style={{ width: '80px', fontSize: '0.75rem', color: '#6b7280' }}>Dots</span>
    <Loader type="dots" color="primary" />
    <Loader type="dots" color="secondary" />
  </div>
  <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
    <span style={{ width: '80px', fontSize: '0.75rem', color: '#6b7280' }}>Bar</span>
    <Loader type="bar" color="primary" size="sm" />
  </div>
  <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
    <span style={{ width: '80px', fontSize: '0.75rem', color: '#6b7280' }}>Bar</span>
    <Loader type="bar" color="secondary" size="sm" />
  </div>
</div>`}
          />
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Custom Color</h3>
          <LivePreview
            title="커스텀 색상"
            description="color에 CSS 색상 문자열을 넘기면 orbit, spinner, dots 모두 그 색으로 그려집니다. 어두운 배경에서는 밝은 색을 지정하세요."
            editable
            code={`<div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
  <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
    <Loader color="#8b5cf6" />
    <Loader color="#059669" />
    <Loader color="#ea580c" />
    <Loader color="#dc2626" />
    <Loader color="#0ea5e9" />
  </div>
  <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
    <Loader type="dots" color="#8b5cf6" />
    <Loader type="dots" color="#059669" />
    <Loader type="dots" color="#ea580c" />
    <Loader type="dots" color="#dc2626" />
    <Loader type="dots" color="#0ea5e9" />
  </div>
  <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', backgroundColor: '#1f2937', padding: '2rem', borderRadius: '0.75rem' }}>
    <Loader color="#ffffff" />
    <Loader color="#f59e0b" />
    <Loader type="dots" color="#ffffff" />
    <Loader type="dots" color="#f59e0b" />
  </div>
</div>`}
          />
        </div>
      </section>

      {/* Label */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Label</h2>
          <p className={styles.sectionDescription}>
            로더 하단에 텍스트 라벨을 표시합니다.
          </p>
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>With Label</h3>
          <LivePreview
            title="라벨 텍스트"
            description="label prop으로 로더 하단에 현재 상태를 안내하는 텍스트를 표시합니다."
            editable
            code={`<div style={{ display: 'flex', gap: '3rem', alignItems: 'flex-start' }}>
  <Loader type="spinner" label="불러오는 중..." />
  <Loader type="dots" label="연결 대기 중..." />
  <Loader type="spinner" label="저장 중..." color="secondary" />
</div>`}
          />
        </div>
      </section>

      {/* Overlay */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Overlay</h2>
          <p className={styles.sectionDescription}>
            부모 요소 위에 반투명 배경과 함께 로더를 겹쳐 표시합니다.
          </p>
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Overlay Mode</h3>
          <LivePreview
            title="오버레이 로더"
            description="overlay prop으로 부모 요소를 덮는 로딩 상태를 표현합니다. 부모에 position: relative가 필요합니다."
            editable
            code={`const [loading, setLoading] = useState(true);

<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
  <Button size="sm" variant="light" onClick={() => setLoading(!loading)}>
    {loading ? '로딩 해제' : '로딩 시작'}
  </Button>
  <div style={{ position: 'relative', padding: '2rem', backgroundColor: '#f9fafb', borderRadius: '0.75rem', minHeight: '150px' }}>
    <p style={{ fontWeight: 500, marginBottom: '0.5rem' }}>카드 콘텐츠</p>
    <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>이 영역 위에 오버레이 로더가 표시됩니다.</p>
    {loading && <Loader overlay label="데이터 로딩 중..." />}
  </div>
</div>`}
          />
        </div>
      </section>

      {/* Combination */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Combinations</h2>
          <p className={styles.sectionDescription}>
            실제 사용 맥락에 맞는 조합 예제입니다.
          </p>
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Loading States</h3>
          <LivePreview
            title="로딩 상태 시뮬레이션"
            description="버튼 클릭으로 로딩 상태를 토글하여 실제 사용 패턴을 시뮬레이션합니다."
            editable
            code={`const [state, setState] = useState('idle');
const handleLoad = () => {
  setState('loading');
  setTimeout(() => setState('done'), 2000);
};

<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
  <Button size="sm" onClick={handleLoad} disabled={state === 'loading'}>
    {state === 'loading' ? '로딩 중...' : '데이터 불러오기'}
  </Button>
  {state === 'loading' && <Loader type="dots" label="데이터를 가져오는 중..." />}
  {state === 'done' && (
    <div style={{ padding: '1rem', backgroundColor: '#f0fdf4', borderRadius: '0.5rem', borderLeft: '3px solid #00C73C' }}>
      <span style={{ color: '#059669', fontWeight: 500 }}>데이터를 성공적으로 불러왔습니다!</span>
    </div>
  )}
</div>`}
          />
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Inline Loader</h3>
          <LivePreview
            title="인라인 로더"
            description="텍스트와 함께 인라인으로 배치하는 패턴입니다."
            editable
            code={`<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
    <Loader type="spinner" size="sm" />
    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>메시지를 전송하는 중...</span>
  </div>
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
    <Loader type="dots" size="sm" />
    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>상대방이 입력 중</span>
  </div>
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
    <Loader type="spinner" size="sm" color="secondary" />
    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>업로드 준비 중...</span>
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
            Loader 컴포넌트의 모든 Props와 타입 정보입니다. HTML div 속성도 모두
            사용 가능합니다.
          </p>
        </div>
        <div className={styles.propsTableWrapper}>
          <PropsTable props={propsData} />
        </div>
      </section>

      {/* Accessibility */}
      <AccessibilitySection
        componentName="Loader"
        intro="Loader 컴포넌트는 다음과 같은 접근성 기능을 기본 제공합니다."
        features={[
          {
            attribute: 'role="status"',
            effect: '로더가 상태 정보임을 전달합니다.',
            description:
              'role="status"로 설정되어 스크린 리더가 로딩 상태임을 인식합니다.',
          },
          {
            attribute: 'aria-busy="true"',
            effect: '작업이 진행 중임을 알립니다.',
            description:
              'bar 타입에서 aria-busy="true"가 설정되어 콘텐츠가 아직 로딩 중임을 전달합니다. orbit은 status가 loading일 때만 true이고 done이나 error가 되면 false입니다.',
          },
          {
            attribute: 'role="progressbar"',
            effect: 'fuse 타입의 진행률을 전달합니다.',
            description:
              'aria-valuemin 0, aria-valuemax 100, aria-valuenow(자른 value)가 함께 설정됩니다.',
          },
          {
            attribute: 'aria-live="polite"',
            effect: '상태 변화를 자동으로 읽습니다.',
            description:
              'bar 타입에서 aria-live="polite"로 설정되어 로딩 완료 시 스크린 리더가 알립니다.',
          },
          {
            attribute: 'aria-label',
            effect: '로더의 용도를 설명합니다.',
            description:
              'label prop 또는 aria-label로 "로딩 중" 등 기본 레이블이 제공됩니다.',
          },
        ]}
        additionalGuidance={[
          {
            title: '맥락에 맞는 라벨',
            description: '어떤 콘텐츠를 로딩하는지 구체적으로 안내하세요.',
            examples: [
              {
                code: `// Good
<Loader label="프로필 정보를 불러오는 중..." />

// Bad - 맥락 부족
<Loader />`,
                explanation:
                  'label이나 aria-label로 구체적인 맥락을 전달하면 스크린 리더 사용자의 이해도가 높아집니다.',
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
            Loader를 효과적으로 사용하기 위한 권장사항입니다.
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
                <ListItem>200ms 이상 걸리는 작업에만 로더 표시</ListItem>
                <ListItem>무엇을 로딩하는지 label로 안내</ListItem>
                <ListItem>
                  부분 로딩에는 overlay, 전체 로딩에는 fullScreen 사용
                </ListItem>
                <ListItem>인라인 로더는 sm 크기 사용</ListItem>
                <ListItem>어두운 배경에서는 white 색상 사용</ListItem>
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
                <ListItem>즉시 완료되는 작업에 로더 표시하지 않기</ListItem>
                <ListItem>
                  한 화면에 여러 개의 fullScreen 로더 사용하지 않기
                </ListItem>
                <ListItem>
                  로딩 중 사용자 인터랙션을 막지 않는 곳에 overlay 남용하지 않기
                </ListItem>
                <ListItem>라벨 없이 장시간 로딩 상태를 유지하지 않기</ListItem>
                <ListItem>로딩 완료 후 로더를 방치하지 않기</ListItem>
              </List>
            </Card.Body>
          </Card>
        </div>
      </section>
    </article>
  );
}
