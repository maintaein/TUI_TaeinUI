import { Card, List, ListItem } from '@taein-ui/core';
import { LivePreview } from '../../../components/LivePreview';
import { CodeBlock } from '../../../components/CodeBlock';
import { PropsTable } from '../../../components/PropsTable';
import type { PropDefinition } from '../../../components/PropsTable/PropsTable';
import { AccessibilitySection } from '../../../components/AccessibilitySection';
import * as styles from './TextFieldPage.css';

export function TextFieldPage() {
  const propsData: PropDefinition[] = [
    {
      name: 'label',
      type: 'string',
      required: true,
      description: '레이블 텍스트',
    },
    {
      name: 'type',
      type: "'text' | 'email' | 'password' | 'number' | 'tel' | 'url'",
      default: "'text'",
      description: 'Input 타입',
    },
    {
      name: 'multiline',
      type: 'boolean',
      default: 'false',
      description:
        'true이면 여러 줄 입력(textarea)을 그립니다. 이때 ref는 HTMLTextAreaElement이고 type은 받지 않습니다',
    },
    {
      name: 'rows',
      type: 'number',
      default: '4',
      description: '보이는 줄 수. multiline일 때만 받습니다',
    },
    {
      name: 'autoResize',
      type: 'boolean',
      default: 'false',
      description:
        '입력한 내용에 맞춰 높이가 늘어납니다. multiline일 때만 받습니다',
    },
    {
      name: 'size',
      type: "'sm' | 'md' | 'lg'",
      default: "'md'",
      description: 'Input 크기',
    },
    {
      name: 'error',
      type: 'boolean',
      default: 'false',
      description: '에러 상태',
    },
    {
      name: 'errorMessage',
      type: 'string',
      default: 'undefined',
      description: '에러 메시지',
    },
    {
      name: 'helperText',
      type: 'string',
      default: 'undefined',
      description: '도움말 텍스트',
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
      description: '비활성화 상태',
    },
    {
      name: 'required',
      type: 'boolean',
      default: 'false',
      description: '필수 입력 여부',
    },
    {
      name: 'placeholder',
      type: 'string',
      default: 'undefined',
      description: 'Placeholder 텍스트',
    },
  ];

  return (
    <article className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>TextField</h1>
        <p className={styles.description}>
          TextField 컴포넌트는 이름, 이메일, 비밀번호, 검색어 등 한 줄 텍스트를
          입력받을 때 사용합니다. 여러 줄 입력은 multiline을 켜세요.
        </p>
      </header>

      {/* Quick Reference */}
      <section className={styles.quickReference}>
        <Card className={styles.quickRefCard}>
          <Card.Body padding="md">
            <h3 className={styles.quickRefTitle}>Import</h3>
            <CodeBlock
              language="typescript"
              code={`import { TextField } from '@taein-ui/core';`}
            />
          </Card.Body>
        </Card>
        <Card className={styles.quickRefCard}>
          <Card.Body padding="md">
            <h3 className={styles.quickRefTitle}>Basic Usage</h3>
            <CodeBlock
              language="tsx"
              code={`<TextField
  label="이메일"
  type="email"
  placeholder="example@email.com"
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
            다양한 사용 사례와 인터랙티브 예제를 통해 TextField의 기능을
            확인하세요.
          </p>
        </div>

        {/* Basic Example */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Basic TextField</h3>
          <LivePreview
            title="기본 사용"
            description="가장 기본적인 TextField 사용 예제입니다."
            editable
            code={`const [value, setValue] = useState('');

<TextField
  label="이름"
  placeholder="홍길동"
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>`}
          />
        </div>

        {/* Controlled State Example */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Controlled (외부 상태 제어)</h3>
          <LivePreview
            title="외부 상태 제어"
            description="value와 onChange를 함께 전달하여 부모 컴포넌트에서 값을 직접 관리합니다. 입력값에 따라 실시간 유효성 검사를 수행하거나, 다른 컴포넌트와 값을 동기화하거나, 입력 포맷을 강제해야 할 때 사용하세요."
            editable
            code={`const [value, setValue] = useState('');

<TextField
  label="이메일"
  type="email"
  placeholder="example@email.com"
  value={value}
  onChange={(e) => setValue(e.target.value)}
  helperText={\`\${value.length}자 입력됨\`}
/>`}
          />
        </div>

        {/* Uncontrolled State Example */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Uncontrolled (내부 상태 제어)</h3>
          <LivePreview
            title="내부 상태 제어"
            description="defaultValue로 초기값만 설정하면 컴포넌트가 자체적으로 값을 관리합니다. 단순한 텍스트 입력이나, 입력값을 외부에서 추적할 필요가 없거나, 폼 제출 시 FormData로 한번에 수집하는 경우에 적합합니다."
            editable
            code={`<TextField
  label="닉네임"
  placeholder="닉네임을 입력하세요"
  defaultValue="홍길동"
  helperText="초기값 설정 후 자체 관리"
/>`}
          />
        </div>

        {/* Sizes */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Sizes</h3>
          <LivePreview
            title="크기 옵션"
            description="sm, md, lg 세 가지 크기를 제공합니다."
            editable
            code={`<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
  <TextField label="Small" size="sm" placeholder="작은 크기" />
  <TextField label="Medium (기본)" size="md" placeholder="중간 크기" />
  <TextField label="Large" size="lg" placeholder="큰 크기" />
</div>`}
          />
        </div>

        {/* Types */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Input Types</h3>
          <LivePreview
            title="다양한 타입"
            description="text, email, password, number, tel, url 타입을 지원합니다."
            editable
            code={`const [email, setEmail] = useState('');
const [password, setPassword] = useState('');

<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
  <TextField
    label="이메일"
    type="email"
    placeholder="example@email.com"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
  />
  <TextField
    label="비밀번호"
    type="password"
    placeholder="••••••••"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
  />
  <TextField
    label="전화번호"
    type="tel"
    placeholder="010-1234-5678"
  />
  <TextField
    label="웹사이트"
    type="url"
    placeholder="https://example.com"
  />
</div>`}
          />
        </div>

        {/* States */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>States</h3>
          <LivePreview
            title="상태 표시"
            description="에러, 비활성화, 필수 입력 등의 상태를 표현합니다."
            editable
            code={`const [value, setValue] = useState('invalid@');

<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
  <TextField
    label="이메일"
    type="email"
    value={value}
    onChange={(e) => setValue(e.target.value)}
    error
    errorMessage="올바른 이메일 주소를 입력하세요"
  />
  <TextField
    label="비활성화된 입력"
    placeholder="입력할 수 없습니다"
    disabled
  />
  <TextField
    label="필수 입력"
    placeholder="필수 항목입니다"
    required
    helperText="이 항목은 반드시 입력해야 합니다"
  />
</div>`}
          />
        </div>

        {/* Helper Text */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Helper Text</h3>
          <LivePreview
            title="도움말 텍스트"
            description="입력 필드 아래에 도움말을 표시할 수 있습니다."
            editable
            code={`<TextField
  label="사용자명"
  placeholder="영문, 숫자 조합 4-20자"
  helperText="영문 소문자와 숫자만 사용 가능합니다"
/>`}
          />
        </div>

        {/* Full Width */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Full Width</h3>
          <LivePreview
            title="전체 너비"
            description="fullWidth prop으로 부모 요소의 전체 너비를 사용합니다."
            editable
            code={`<TextField
  label="주소"
  placeholder="서울특별시 강남구..."
  fullWidth
/>`}
          />
        </div>

        {/* Multiline */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Multiline</h3>
          <LivePreview
            title="여러 줄 입력"
            description="multiline을 켜면 textarea를 그립니다. rows로 보이는 줄 수를 정하고(기본 4), 픽셀 높이가 필요하면 style의 minHeight를 쓰세요. multiline은 리터럴로 쓰고, 변수면 삼항으로 가르세요."
            editable
            code={`<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
  <TextField
    label="소개"
    placeholder="자신을 소개해 주세요"
    multiline
    fullWidth
  />
  <TextField
    label="상세 설명"
    placeholder="8줄 높이"
    multiline
    rows={8}
    fullWidth
  />
</div>`}
          />
        </div>

        {/* Auto Resize */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Auto Resize</h3>
          <LivePreview
            title="자동 높이 조정"
            description="multiline과 autoResize를 함께 쓰면 입력한 내용에 맞춰 높이가 늘어납니다. rows가 최소 높이가 됩니다."
            editable
            code={`const [value, setValue] = useState('');

<TextField
  label="메모"
  placeholder="줄을 늘려 보세요"
  multiline
  autoResize
  rows={2}
  fullWidth
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>`}
          />
        </div>
      </section>

      {/* Props API */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Props API</h2>
          <p className={styles.sectionDescription}>
            TextField 컴포넌트의 모든 Props와 타입 정보입니다.
          </p>
        </div>
        <div className={styles.propsTableWrapper}>
          <PropsTable props={propsData} />
        </div>
      </section>

      {/* Accessibility */}
      <AccessibilitySection
        componentName="TextField"
        intro="TextField 컴포넌트는 다음과 같이 기본적인 접근성을 제공합니다. 덕분에 별도의 설정 없이도 기본적으로 사용자의 접근성을 고려한 형태의 TextField 컴포넌트를 제공할 수 있습니다."
        features={[
          {
            attribute: 'label',
            effect: '스크린 리더에서 입력 필드의 용도를 읽어줍니다.',
            description:
              '레이블이 input과 자동으로 연결되어 사용자가 무엇을 입력해야 하는지 명확히 알 수 있습니다.',
          },
          {
            attribute: 'required',
            effect: '필수 입력 항목임을 스크린 리더에 알려줍니다.',
            description:
              'aria-required="true"가 설정되어 필수 입력 필드라는 정보를 제공합니다.',
          },
          {
            attribute: 'error + errorMessage',
            effect: '에러 메시지를 스크린 리더가 읽어줍니다.',
            description:
              'aria-describedby로 에러 메시지가 연결되어 사용자가 무엇이 잘못되었는지 알 수 있습니다.',
          },
          {
            attribute: 'disabled',
            effect: '비활성화 상태를 스크린 리더에서 알려줍니다.',
            description:
              'aria-disabled="true"가 설정되어 입력할 수 없는 상태임을 전달합니다.',
          },
          {
            attribute: 'helperText',
            effect: '추가 설명을 스크린 리더가 읽어줍니다.',
            description:
              'aria-describedby로 도움말이 연결되어 입력에 대한 가이드를 제공합니다.',
          },
        ]}
        additionalGuidance={[
          {
            title: '명확한 레이블 제공하기',
            description:
              'placeholder만으로는 접근성이 충분하지 않습니다. 반드시 label prop을 사용해 명확한 레이블을 제공해주세요.',
            examples: [
              {
                code: `// Good ✓
<TextField
  label="이메일 주소"
  placeholder="example@email.com"
/>

// Bad ✗
<TextField
  placeholder="이메일 주소를 입력하세요"
/>`,
                explanation:
                  'placeholder는 입력 시 사라지기 때문에 레이블 역할을 할 수 없습니다.',
              },
            ],
          },
          {
            title: '에러 메시지는 구체적으로',
            description:
              '에러가 발생했을 때는 무엇이 잘못되었는지 명확하게 알려주세요.',
            examples: [
              {
                code: `// Good ✓
<TextField
  label="이메일"
  error
  errorMessage="올바른 이메일 형식이 아닙니다. (예: user@example.com)"
/>

// Bad ✗
<TextField
  label="이메일"
  error
  errorMessage="잘못된 입력"
/>`,
                explanation:
                  '구체적인 에러 메시지가 사용자의 문제 해결을 도와줍니다.',
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
            TextField를 효과적으로 사용하기 위한 권장사항입니다.
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
                <ListItem>명확하고 간결한 레이블 사용</ListItem>
                <ListItem>적절한 input type 지정 (email, tel 등)</ListItem>
                <ListItem>유용한 placeholder 제공</ListItem>
                <ListItem>에러 발생 시 구체적인 해결 방법 안내</ListItem>
                <ListItem>helperText로 입력 형식 가이드 제공</ListItem>
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
                <ListItem>placeholder만으로 레이블 대체하지 않기</ListItem>
                <ListItem>모호한 에러 메시지 ("잘못된 입력")</ListItem>
                <ListItem>너무 많은 필수 입력 필드 사용</ListItem>
                <ListItem>자동완성 기능 무분별하게 비활성화</ListItem>
                <ListItem>입력 중 실시간 유효성 검사로 방해하지 않기</ListItem>
              </List>
            </Card.Body>
          </Card>
        </div>
      </section>
    </article>
  );
}
