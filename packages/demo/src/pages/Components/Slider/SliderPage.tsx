import { Card, List, ListItem } from '@taein-ui/core';
import { LivePreview } from '../../../components/LivePreview';
import { CodeBlock } from '../../../components/CodeBlock';
import { PropsTable } from '../../../components/PropsTable';
import type { PropDefinition } from '../../../components/PropsTable/PropsTable';
import { AccessibilitySection } from '../../../components/AccessibilitySection';
import * as styles from './SliderPage.css';

export function SliderPage() {
  const propsData: PropDefinition[] = [
    {
      name: 'label',
      type: 'string',
      required: true,
      description: '슬라이더 레이블 텍스트',
    },
    {
      name: 'variant',
      type: "'default' | 'bar' | 'wake'",
      default: "'default'",
      description:
        '모양. default와 bar는 끌면 머리 둘레의 선이 속도에 비례해 부풀어 물결치고(뒤쪽으로 길게) 멈추면 매끈해진다. bar는 머리 없이 채움 막대가 값이고, wake는 그 물결을 눈금 막대로 보여 준다',
    },
    {
      name: 'min',
      type: 'number',
      default: '0',
      description: '최소값',
    },
    {
      name: 'max',
      type: 'number',
      default: '100',
      description: '최대값',
    },
    {
      name: 'step',
      type: 'number',
      default: '1',
      description: '증감 단위',
    },
    {
      name: 'value',
      type: 'number',
      default: 'undefined',
      description: '현재 값 (controlled)',
    },
    {
      name: 'defaultValue',
      type: 'number',
      default: '0',
      description: '초기 값 (uncontrolled)',
    },
    {
      name: 'onChange',
      type: 'ChangeEventHandler<HTMLInputElement>',
      default: 'undefined',
      description: '값 변경 핸들러',
    },
    {
      name: 'showValue',
      type: 'boolean',
      default: 'false',
      description: '현재 값 표시 여부',
    },
    {
      name: 'showThumbValue',
      type: 'boolean',
      default: 'false',
      description:
        '잡고 끄는 동안 머리 위에 값을 띄움. 라벨·showValue 값과 같은 줄 높이라 머리가 양끝에 가면 겹칠 수 있음',
    },
    {
      name: 'helperText',
      type: 'string',
      default: 'undefined',
      description: '도움말 텍스트',
    },
    {
      name: 'required',
      type: 'boolean',
      default: 'false',
      description: '필수 입력 표시',
    },
    {
      name: 'marks',
      type: 'SliderMark[]',
      default: 'undefined',
      description: '마크 표시 ({ value: number, label: string }[])',
    },
    {
      name: 'trackColor',
      type: 'string',
      default: 'undefined',
      description: '트랙 채움 색상 (CSS color 값)',
    },
  ];

  return (
    <article className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>Slider</h1>
        <p className={styles.description}>
          Slider 컴포넌트는 볼륨, 밝기, 가격 범위 등 연속적인 값을 드래그로
          조절할 때 사용합니다.
        </p>
      </header>

      {/* Quick Reference */}
      <section className={styles.quickReference}>
        <Card className={styles.quickRefCard}>
          <Card.Body padding="md">
            <h3 className={styles.quickRefTitle}>Import</h3>
            <CodeBlock
              language="typescript"
              code={`import { Slider } from '@taein-ui/core';`}
            />
          </Card.Body>
        </Card>
        <Card className={styles.quickRefCard}>
          <Card.Body padding="md">
            <h3 className={styles.quickRefTitle}>Basic Usage</h3>
            <CodeBlock
              language="tsx"
              code={`<Slider
  label="볼륨"
  value={volume}
  onChange={(e) => setVolume(Number(e.target.value))}
  showValue
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
            다양한 사용 사례에 맞는 Slider 예제입니다.
          </p>
        </div>

        {/* Basic */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Basic Slider</h3>
          <LivePreview
            title="기본 사용법"
            description="가장 기본적인 Slider 사용 예제입니다. 0~100 범위에서 값을 선택합니다."
            editable
            code={`const [value, setValue] = useState(50);

<Slider
  label="볼륨"
  value={value}
  onChange={(e) => setValue(Number(e.target.value))}
  showValue
/>`}
          />
        </div>

        {/* Controlled */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Controlled (외부 상태 제어)</h3>
          <LivePreview
            title="외부 상태 제어"
            description="value와 onChange를 함께 전달하여 부모 컴포넌트에서 슬라이더 값을 직접 관리합니다. 값에 따라 실시간으로 UI를 업데이트하거나, 여러 슬라이더 값을 동기화하거나, 입력값을 검증하고 보정해야 할 때 사용하세요."
            editable
            code={`const [brightness, setBrightness] = useState(70);

<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
  <Slider
    label="밝기"
    value={brightness}
    onChange={(e) => setBrightness(Number(e.target.value))}
    showValue
  />
  <div style={{
    padding: '1.5rem',
    borderRadius: '0.5rem',
    backgroundColor: \`hsl(210, 20%, \${brightness}%)\`,
    color: brightness > 50 ? '#1a2332' : '#f9fafb',
    fontSize: '0.875rem',
    textAlign: 'center',
    transition: 'all 0.2s ease',
  }}>
    밝기: {brightness}%
  </div>
</div>`}
          />
        </div>

        {/* Uncontrolled */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Uncontrolled (내부 상태 제어)</h3>
          <LivePreview
            title="내부 상태 제어"
            description="defaultValue로 초기값만 설정하면 컴포넌트가 자체적으로 값을 관리합니다. 슬라이더 값을 외부에서 추적할 필요가 없거나, 폼 제출 시 한 번에 수집하거나, 단순한 설정 조절에 적합합니다."
            editable
            code={`<Slider
  label="음량"
  defaultValue={30}
  showValue
/>`}
          />
        </div>

        {/* Variants */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Variants</h3>
          <LivePreview
            title="변형"
            description="끌면 머리 둘레의 선이 속도에 비례해 부풀어 물결치고(뒤쪽으로 길게), 멈추면 매끈해집니다. 마우스를 올리면 라인이 탄성 있게 두꺼워지고 머리가 부풉니다. bar는 머리 없이 막대가 값을 보여 주고, wake는 그 물결을 눈금 막대로 보여 줍니다(움직임 줄이기 설정에서는 물결이 없습니다)."
            editable
            code={`const [a, setA] = useState(40);
const [b, setB] = useState(60);
const [c, setC] = useState(50);

<div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', minWidth: '320px' }}>
  <Slider label="default" value={a} onChange={(e) => setA(Number(e.target.value))} showValue />
  <Slider label="bar" variant="bar" value={b} onChange={(e) => setB(Number(e.target.value))} showValue />
  <Slider label="wake" variant="wake" value={c} onChange={(e) => setC(Number(e.target.value))} showValue />
</div>`}
          />
        </div>

        {/* Min / Max / Step */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Min / Max / Step</h3>
          <LivePreview
            title="범위 및 간격 설정"
            description="min, max, step을 설정하여 슬라이더의 범위와 간격을 조절할 수 있습니다."
            editable
            code={`const [temp, setTemp] = useState(22);
const [opacity, setOpacity] = useState(0.8);
const [price, setPrice] = useState(300);

<div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
  <Slider
    label="온도 (°C)"
    min={-20}
    max={50}
    step={1}
    value={temp}
    onChange={(e) => setTemp(Number(e.target.value))}
    showValue
  />
  <Slider
    label="투명도"
    min={0}
    max={1}
    step={0.1}
    value={opacity}
    onChange={(e) => setOpacity(Number(e.target.value))}
    showValue
  />
  <Slider
    label="가격 (만원)"
    min={0}
    max={1000}
    step={50}
    value={price}
    onChange={(e) => setPrice(Number(e.target.value))}
    showValue
  />
</div>`}
          />
        </div>

        {/* Marks */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Marks</h3>
          <LivePreview
            title="마크 표시"
            description="marks prop으로 슬라이더 트랙 아래에 마크와 라벨을 표시할 수 있습니다."
            editable
            code={`const [speed, setSpeed] = useState(2);

<Slider
  label="재생 속도"
  min={0.5}
  max={3}
  step={0.5}
  value={speed}
  onChange={(e) => setSpeed(Number(e.target.value))}
  showValue
  marks={[
    { value: 0.5, label: '0.5x' },
    { value: 1, label: '1x' },
    { value: 1.5, label: '1.5x' },
    { value: 2, label: '2x' },
    { value: 2.5, label: '2.5x' },
    { value: 3, label: '3x' },
  ]}
/>`}
          />
        </div>

        {/* Track Color */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Track Color</h3>
          <LivePreview
            title="트랙 채움 색상"
            description="trackColor prop으로 슬라이더의 채움 트랙 색상을 커스터마이징할 수 있습니다."
            editable
            code={`const [v1, setV1] = useState(60);
const [v2, setV2] = useState(40);
const [v3, setV3] = useState(75);

<div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
  <Slider
    label="기본 (Primary)"
    value={v1}
    onChange={(e) => setV1(Number(e.target.value))}
    showValue
  />
  <Slider
    label="성공 (Green)"
    value={v2}
    onChange={(e) => setV2(Number(e.target.value))}
    showValue
    trackColor="#10b981"
  />
  <Slider
    label="경고 (Amber)"
    value={v3}
    onChange={(e) => setV3(Number(e.target.value))}
    showValue
    trackColor="#f59e0b"
  />
</div>`}
          />
        </div>

        {/* Show Value */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Show Value</h3>
          <LivePreview
            title="현재 값 표시"
            description="showValue prop으로 레이블 옆에 현재 값을 표시할 수 있습니다."
            editable
            code={`const [a, setA] = useState(50);
const [b, setB] = useState(50);

<div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
  <Slider label="값 표시 꺼짐" value={a} onChange={(e) => setA(Number(e.target.value))} />
  <Slider label="값 표시 켜짐" value={b} onChange={(e) => setB(Number(e.target.value))} showValue />
</div>`}
          />
        </div>

        {/* Show Thumb Value */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>진행도 수치</h3>
          <LivePreview
            title="머리 위 진행도 수치"
            description="showThumbValue prop을 켜면 잡고 끄는 동안 머리 위에 값이 뜬다. 기본은 꺼짐. 라벨과 겹치는 것을 줄이려면 showValue는 끈다."
            editable
            code={`const [value, setValue] = useState(50);

<Slider
  label="진행도"
  value={value}
  onChange={(e) => setValue(Number(e.target.value))}
  showThumbValue
/>`}
          />
        </div>

        {/* Helper Text */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Helper Text</h3>
          <LivePreview
            title="도움말 텍스트"
            description="helperText prop으로 슬라이더 아래에 설명을 추가할 수 있습니다."
            editable
            code={`const [quality, setQuality] = useState(75);

<Slider
  label="업로드 품질"
  value={quality}
  onChange={(e) => setQuality(Number(e.target.value))}
  showValue
  helperText="높을수록 파일 크기가 커집니다. 권장값: 70~85"
/>`}
          />
        </div>

        {/* Required */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Required</h3>
          <LivePreview
            title="필수 입력"
            description="required prop으로 필수 입력 표시(*)를 추가합니다."
            editable
            code={`const [score, setScore] = useState(5);

<Slider
  label="만족도 점수"
  min={1}
  max={10}
  step={1}
  value={score}
  onChange={(e) => setScore(Number(e.target.value))}
  showValue
  required
  helperText="1~10 사이의 점수를 선택해주세요"
/>`}
          />
        </div>
      </section>

      {/* Props API */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Props API</h2>
          <p className={styles.sectionDescription}>
            Slider 컴포넌트의 모든 Props와 타입 정보입니다.
          </p>
        </div>
        <div className={styles.propsTableWrapper}>
          <PropsTable props={propsData} />
        </div>
      </section>

      {/* Accessibility */}
      <AccessibilitySection
        componentName="Slider"
        intro="Slider 컴포넌트는 HTML5 range input을 기반으로 다음과 같은 접근성을 기본 제공합니다."
        features={[
          {
            attribute: 'role="slider"',
            effect: '스크린 리더에서 "슬라이더"로 인식합니다.',
            description:
              'HTML input[type="range"]가 사용되어 자동으로 role="slider"가 적용됩니다.',
          },
          {
            attribute: 'aria-label',
            effect: '슬라이더의 목적을 스크린 리더가 읽어줍니다.',
            description:
              'label prop이 aria-label로 설정되어 슬라이더가 무엇을 조절하는지 명확히 전달합니다.',
          },
          {
            attribute: 'aria-valuemin / aria-valuemax',
            effect: '슬라이더의 최소/최대 범위를 알려줍니다.',
            description:
              'min, max 값이 각각 aria-valuemin, aria-valuemax로 설정됩니다.',
          },
          {
            attribute: 'aria-valuenow',
            effect: '현재 값을 실시간으로 알려줍니다.',
            description:
              '슬라이더 값이 변경될 때마다 aria-valuenow가 업데이트되어 현재 값을 전달합니다.',
          },
          {
            attribute: 'keyboard navigation',
            effect: '키보드로 값을 조절할 수 있습니다.',
            description:
              'ArrowLeft/Right로 step 단위 감소/증가, Home/End로 최소/최대값으로 이동할 수 있습니다.',
          },
          {
            attribute: 'aria-describedby',
            effect: '도움말 텍스트를 스크린 리더가 읽어줍니다.',
            description:
              'helperText가 있을 경우 aria-describedby로 연결되어 추가 정보를 제공합니다.',
          },
        ]}
        additionalGuidance={[
          {
            title: '명확한 label 제공',
            description:
              'label은 필수 prop으로, 슬라이더가 무엇을 조절하는지 명확히 나타내야 합니다.',
            examples: [
              {
                code: `// Good
<Slider label="볼륨" />
<Slider label="밝기 (0~100%)" />

// Bad
<Slider label="값" />
<Slider label="슬라이더" />`,
                explanation:
                  '구체적인 레이블로 사용자가 무엇을 조절하는지 즉시 이해할 수 있어야 합니다.',
              },
            ],
          },
          {
            title: 'step 설정 시 helperText 활용',
            description:
              '비표준 step을 사용할 때는 helperText로 증감 단위를 안내해주세요.',
            examples: [
              {
                code: `<Slider
  label="가격"
  min={0}
  max={1000}
  step={50}
  helperText="50만원 단위로 조절됩니다"
  showValue
/>`,
                explanation:
                  'step이 1이 아닐 경우, 사용자에게 증감 단위를 알려주면 혼란을 줄일 수 있습니다.',
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
            Slider를 효과적으로 사용하기 위한 권장사항입니다.
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
                  연속적인 값 범위에 사용 (볼륨, 밝기, 크기 등)
                </ListItem>
                <ListItem>showValue로 현재 값을 시각적으로 제공</ListItem>
                <ListItem>적절한 step 값으로 의미 있는 간격 설정</ListItem>
                <ListItem>marks로 주요 기준점 표시</ListItem>
                <ListItem>helperText로 범위나 단위 안내</ListItem>
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
                  정확한 숫자 입력이 필요할 때 사용하지 않기 (NumericSpinner
                  권장)
                </ListItem>
                <ListItem>
                  2~3개의 이산적 옵션에 사용하지 않기 (SegmentedButtons 권장)
                </ListItem>
                <ListItem>
                  범위가 너무 넓고 step이 1인 경우 주의 (1~10000 등)
                </ListItem>
                <ListItem>레이블 없이 사용하지 않기 (접근성 필수)</ListItem>
                <ListItem>
                  불분명한 레이블 사용하지 않기 ("값", "레벨" 등)
                </ListItem>
              </List>
            </Card.Body>
          </Card>
        </div>
      </section>
    </article>
  );
}
