import { Card, List, ListItem } from '@taein-ui/core';
import { LivePreview } from '../../../components/LivePreview';
import { CodeBlock } from '../../../components/CodeBlock';
import { PropsTable } from '../../../components/PropsTable';
import type { PropDefinition } from '../../../components/PropsTable/PropsTable';
import { AccessibilitySection } from '../../../components/AccessibilitySection';
import * as styles from './NumericSpinnerPage.css';

export function NumericSpinnerPage() {
  const propsData: PropDefinition[] = [
    {
      name: 'label',
      type: 'string',
      required: true,
      description: '레이블 텍스트',
    },
    {
      name: 'size',
      type: "'sm' | 'md' | 'lg'",
      default: "'md'",
      description: 'NumericSpinner 크기',
    },
    {
      name: 'min',
      type: 'number',
      default: 'undefined',
      description: '최소값',
    },
    {
      name: 'max',
      type: 'number',
      default: 'undefined',
      description: '최대값',
    },
    {
      name: 'step',
      type: 'number',
      default: '1',
      description:
        '증감 단위. 소수(0.1)여도 step과 지금 값 중 더 긴 소수 자릿수로 맞춰 0.1 + 0.2 같은 오차가 화면에 나오지 않습니다(0.25에서 + 하면 0.35).',
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
      name: 'value',
      type: 'number',
      default: 'undefined',
      description: '현재 값 (controlled)',
    },
    {
      name: 'onChange',
      type: '(value: number) => void',
      default: 'undefined',
      description:
        '값 변경 핸들러. 이벤트 객체가 아닌 변경된 숫자 값을 직접 전달합니다.',
    },
    {
      name: 'defaultValue',
      type: 'number',
      default: 'undefined',
      description: '초기값 (uncontrolled)',
    },
  ];

  return (
    <article className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>NumericSpinner</h1>
        <p className={styles.description}>
          NumericSpinner 컴포넌트는 수량, 인원수, 페이지 번호 등 숫자를 버튼으로
          증감할 때 사용합니다.
        </p>
      </header>

      {/* Quick Reference */}
      <section className={styles.quickReference}>
        <Card className={styles.quickRefCard}>
          <Card.Body padding="md">
            <h3 className={styles.quickRefTitle}>Import</h3>
            <CodeBlock
              language="typescript"
              code={`import { NumericSpinner } from '@taein-ui/core';`}
            />
          </Card.Body>
        </Card>
        <Card className={styles.quickRefCard}>
          <Card.Body padding="md">
            <h3 className={styles.quickRefTitle}>Basic Usage</h3>
            <CodeBlock
              language="tsx"
              code={`<NumericSpinner
  label="수량"
  value={value}
  onChange={setValue}
  min={0}
  max={10}
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
            다양한 사용 사례에 맞는 NumericSpinner 예제입니다.
          </p>
        </div>

        {/* Basic Example */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Basic NumericSpinner</h3>
          <LivePreview
            title="기본 사용법"
            description="가장 기본적인 NumericSpinner 사용 예제입니다. 버튼뿐 아니라 숫자를 직접 칠 수도 있습니다. 치는 동안에는 칸을 비우거나 범위 밖 숫자를 잠시 둘 수 있고, 칸을 벗어나거나 Enter를 누르면 min·max 안으로 맞춰 확정합니다(비었거나 숫자가 아니면 직전 값으로 돌아갑니다). 칸에서 위/아래 화살표 키를 누르면 step만큼 오르내립니다."
            editable
            code={`const [value, setValue] = useState(1);

<NumericSpinner
  label="수량"
  value={value}
  onChange={setValue}
/>`}
          />
        </div>

        {/* Controlled State Example */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Controlled (외부 상태 제어)</h3>
          <LivePreview
            title="외부 상태 제어"
            description="value와 onChange를 함께 전달하여 부모 컴포넌트에서 값을 직접 관리합니다. 현재 값에 따라 가격을 계산하거나, 다른 컴포넌트와 값을 동기화하거나, 값 변경 시 유효성 검사를 수행해야 할 때 사용하세요."
            editable
            code={`const [value, setValue] = useState(1);

<NumericSpinner
  label="수량"
  value={value}
  onChange={setValue}
  min={0}
  max={10}
  helperText={\`현재 값: \${value}\`}
/>`}
          />
        </div>

        {/* Uncontrolled State Example */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Uncontrolled (내부 상태 제어)</h3>
          <LivePreview
            title="내부 상태 제어"
            description="defaultValue로 초기값만 설정하면 컴포넌트가 자체적으로 값을 관리합니다. 단순한 수량 입력이나, 값 변경을 외부에서 추적할 필요가 없거나, 폼 제출 시 FormData로 한번에 수집하는 경우에 적합합니다."
            editable
            code={`<NumericSpinner
  label="수량"
  defaultValue={5}
  min={0}
  max={10}
  helperText="초기값 5, 이후 자체 관리"
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
            code={`const [smValue, setSmValue] = useState(1);
const [mdValue, setMdValue] = useState(1);
const [lgValue, setLgValue] = useState(1);

<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
  <NumericSpinner
    label="Small"
    size="sm"
    value={smValue}
    onChange={setSmValue}
  />
  <NumericSpinner
    label="Medium (기본)"
    size="md"
    value={mdValue}
    onChange={setMdValue}
  />
  <NumericSpinner
    label="Large"
    size="lg"
    value={lgValue}
    onChange={setLgValue}
  />
</div>`}
          />
        </div>

        {/* Min/Max Example */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Min/Max Values</h3>
          <LivePreview
            title="최소/최대값 설정"
            description="min과 max prop으로 값의 범위를 제한할 수 있습니다."
            editable
            code={`const [value, setValue] = useState(1);

<NumericSpinner
  label="수량 선택"
  value={value}
  onChange={setValue}
  min={1}
  max={10}
  helperText="1개에서 10개까지 선택 가능합니다"
/>`}
          />
        </div>

        {/* Step Example */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Custom Step</h3>
          <LivePreview
            title="증감 단위 설정"
            description="step prop으로 버튼 클릭 시 변경되는 값의 단위를 설정할 수 있습니다."
            editable
            code={`const [value, setValue] = useState(10);

<NumericSpinner
  label="가격 (원)"
  value={value}
  onChange={setValue}
  min={0}
  max={100}
  step={10}
  helperText="10원 단위로 조정됩니다"
/>`}
          />
        </div>

        {/* Required Example */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Required</h3>
          <LivePreview
            title="필수 입력 표시"
            description="required prop으로 필수 항목임을 나타냅니다."
            editable
            code={`const [value, setValue] = useState(1);

<NumericSpinner
  label="참석 인원"
  required
  helperText="최소 1명 이상 입력해야 합니다"
  value={value}
  onChange={setValue}
  min={1}
  max={100}
/>`}
          />
        </div>

        {/* Disabled Example */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Disabled</h3>
          <LivePreview
            title="비활성화 상태"
            description="disabled prop으로 상호작용을 막을 수 있습니다. 최대/최소값에 도달하면 해당 버튼이 자동으로 비활성화됩니다."
            editable
            code={`const [value1, setValue1] = useState(5);
const [value2, setValue2] = useState(10);
const [value3, setValue3] = useState(0);

<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
  <NumericSpinner
    label="비활성화된 입력"
    disabled
    value={value1}
    onChange={setValue1}
  />
  <NumericSpinner
    label="최대값 도달"
    value={value2}
    onChange={setValue2}
    max={10}
  />
  <NumericSpinner
    label="최소값 도달"
    value={value3}
    onChange={setValue3}
    min={0}
  />
</div>`}
          />
        </div>

        {/* Error State Example */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Error State</h3>
          <LivePreview
            title="에러 상태"
            description="error와 errorMessage로 유효성 검사 오류를 표시합니다."
            editable
            code={`const [value, setValue] = useState(0);

<NumericSpinner
  label="최소 주문 수량"
  required
  error
  errorMessage="최소 1개 이상 주문해야 합니다"
  value={value}
  onChange={setValue}
  min={1}
  max={100}
/>`}
          />
        </div>

        {/* Full Width Example */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Full Width</h3>
          <LivePreview
            title="전체 너비"
            description="fullWidth prop으로 부모 요소의 전체 너비를 사용합니다."
            editable
            code={`const [value, setValue] = useState(5);

<NumericSpinner
  label="수량"
  value={value}
  onChange={setValue}
  min={1}
  max={100}
  fullWidth
/>`}
          />
        </div>

        {/* Custom Width Example */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Custom Input Width</h3>
          <LivePreview
            title="커스텀 입력 너비"
            description="style={{ width }}로 input 필드의 너비를 직접 지정할 수 있습니다."
            editable
            code={`const [value, setValue] = useState(100);

<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
  <NumericSpinner
    label="좁은 너비 (60px)"
    value={value}
    onChange={setValue}
    style={{ width: '60px' }}
  />
  <NumericSpinner
    label="넓은 너비 (150px)"
    value={value}
    onChange={setValue}
    style={{ width: '150px' }}
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
            NumericSpinner 컴포넌트의 모든 Props와 타입 정보입니다.
          </p>
        </div>
        <div className={styles.propsTableWrapper}>
          <PropsTable props={propsData} />
        </div>
      </section>

      {/* Accessibility */}
      <AccessibilitySection
        componentName="NumericSpinner"
        intro="NumericSpinner 컴포넌트는 다음과 같이 기본적인 접근성을 제공합니다. 덕분에 별도의 설정 없이도 기본적으로 사용자의 접근성을 고려한 형태의 NumericSpinner 컴포넌트를 제공할 수 있습니다."
        features={[
          {
            attribute: 'label',
            effect: '스크린 리더에서 입력 필드의 용도를 읽어줍니다.',
            description:
              '레이블이 input과 자동으로 연결되어 사용자가 무엇을 입력해야 하는지 명확히 알 수 있습니다.',
          },
          {
            attribute: 'aria-label (버튼)',
            effect: '증가/감소 버튼의 역할을 스크린 리더에 알립니다.',
            description:
              '"값 증가", "값 감소" 레이블이 각 버튼에 설정되어 버튼의 기능을 명확히 전달합니다.',
          },
          {
            attribute: '직접 입력',
            effect: '읽기 전용이 아닌 스핀 버튼으로 읽힙니다.',
            description:
              '입력칸은 읽기 전용이 아니라서 숫자를 직접 칠 수 있고, 위/아래 화살표 키로 step만큼 오르내릴 수 있습니다. 확정은 칸을 벗어날 때와 Enter입니다.',
          },
          {
            attribute: 'min + max',
            effect: '입력 가능한 범위를 스크린 리더에서 알립니다.',
            description:
              'min, max 속성으로 값의 범위가 명확히 전달되어 사용자가 유효한 값을 입력할 수 있습니다.',
          },
          {
            attribute: 'required',
            effect: '필수 입력 항목임을 스크린 리더에 알립니다.',
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
            effect: '비활성화 상태를 스크린 리더에서 알립니다.',
            description:
              'aria-disabled="true"가 설정되어 입력할 수 없는 상태임을 전달합니다.',
          },
        ]}
        additionalGuidance={[
          {
            title: '명확한 레이블 제공하기',
            description:
              '숫자가 무엇을 의미하는지 명확한 레이블을 제공해주세요.',
            examples: [
              {
                code: `// Good ✓
<NumericSpinner
  label="수량 (개)"
  value={5}
  min={1}
  max={100}
/>

// Bad ✗
<NumericSpinner
  label="값"
  value={5}
/>`,
                explanation:
                  '단위와 의미가 명확한 레이블이 사용자 경험을 개선합니다.',
              },
            ],
          },
          {
            title: '적절한 범위 설정하기',
            description:
              'min, max를 사용해 유효한 값의 범위를 명확히 제한해주세요.',
            examples: [
              {
                code: `// Good ✓
<NumericSpinner
  label="나이"
  value={25}
  min={0}
  max={150}
  helperText="0세부터 150세까지 입력 가능합니다"
/>

// Bad ✗
<NumericSpinner
  label="나이"
  value={25}
/>`,
                explanation:
                  '범위 제한이 있으면 잘못된 입력을 미리 방지할 수 있습니다.',
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
            NumericSpinner를 효과적으로 사용하기 위한 권장사항입니다.
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
                <ListItem>명확한 레이블과 단위 표시 (예: "수량 (개)")</ListItem>
                <ListItem>적절한 min, max, step 설정</ListItem>
                <ListItem>helperText로 입력 범위 가이드 제공</ListItem>
                <ListItem>작은 범위의 숫자 입력에 사용 (0-100 등)</ListItem>
                <ListItem>증감 버튼이 명확히 보이도록 디자인</ListItem>
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
                  큰 범위의 숫자 입력에 사용하지 않기 (TextField 권장)
                </ListItem>
                <ListItem>소수점이 필요한 경우 신중하게 사용</ListItem>
                <ListItem>step 값을 너무 크게 설정하지 않기</ListItem>
                <ListItem>레이블 없이 아이콘만 사용하지 않기</ListItem>
                <ListItem>음수 입력이 필요한 경우 min을 적절히 설정</ListItem>
              </List>
            </Card.Body>
          </Card>
        </div>
      </section>
    </article>
  );
}
