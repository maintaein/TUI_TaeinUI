import { Card, List, ListItem } from '@taein-ui/core';
import { LivePreview } from '../../../components/LivePreview';
import { CodeBlock } from '../../../components/CodeBlock';
import { PropsTable } from '../../../components/PropsTable';
import type { PropDefinition } from '../../../components/PropsTable/PropsTable';
import { AccessibilitySection } from '../../../components/AccessibilitySection';
import * as styles from './CardPage.css';

export function CardPage() {
  const cardProps: PropDefinition[] = [
    {
      name: 'children',
      type: 'ReactNode',
      required: true,
      description:
        '카드 본문 콘텐츠 (Flat: 본문 영역, Compound: 서브 컴포넌트)',
    },
    {
      name: 'variant',
      type: "'outlined' | 'elevated' | 'filled'",
      default: "'elevated'",
      description: '카드 스타일 변형',
    },
    {
      name: 'onClick',
      type: '() => void',
      description: '클릭 핸들러. 전달하면 button 요소로 렌더링',
    },
    {
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description: '비활성화 상태 (onClick과 함께 사용)',
    },
    {
      name: 'hoverLift',
      type: 'boolean',
      default: 'false',
      description:
        '마우스를 올리면 카드가 살짝 떠오르고 그림자가 짙어지며, 누르면 살짝 눌립니다. onClick만 있는 카드는 떠오르지 않습니다',
    },
    {
      name: 'title',
      type: 'string',
      description: 'Flat: 카드 제목 — 자동으로 header + title 구조 생성',
    },
    {
      name: 'header',
      type: 'ReactNode',
      description: 'Flat: 카드 헤더 영역 (title보다 우선)',
    },
    {
      name: 'footer',
      type: 'ReactNode',
      description: 'Flat: 카드 푸터 영역',
    },
    {
      name: 'image',
      type: 'string',
      description: 'Flat: 이미지 URL',
    },
    {
      name: 'imageAlt',
      type: 'string',
      default: "''",
      description: 'Flat: 이미지 대체 텍스트',
    },
    {
      name: 'padding',
      type: "'sm' | 'md' | 'lg'",
      default: "'md'",
      description: 'Flat: 본문 내부 여백',
    },
  ];

  const compoundBodyProps: PropDefinition[] = [
    {
      name: 'children',
      type: 'ReactNode',
      required: true,
      description: '본문 내용',
    },
    {
      name: 'padding',
      type: "'sm' | 'md' | 'lg'",
      default: "'md'",
      description: '내부 여백 크기',
    },
  ];

  const compoundHeaderProps: PropDefinition[] = [
    {
      name: 'children',
      type: 'ReactNode',
      required: true,
      description: '헤더 내용 (주로 Card.Title과 액션 버튼)',
    },
  ];

  const compoundTitleProps: PropDefinition[] = [
    {
      name: 'children',
      type: 'ReactNode',
      required: true,
      description: '제목 텍스트',
    },
    {
      name: 'as',
      type: "'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'",
      default: "'h3'",
      description: '렌더링할 HTML 헤딩 요소',
    },
  ];

  const compoundFooterProps: PropDefinition[] = [
    {
      name: 'children',
      type: 'ReactNode',
      required: true,
      description: '푸터 내용 (주로 버튼)',
    },
  ];

  const compoundImageProps: PropDefinition[] = [
    {
      name: 'src',
      type: 'string',
      required: true,
      description: '이미지 URL',
    },
    {
      name: 'alt',
      type: 'string',
      default: "''",
      description: '이미지 대체 텍스트',
    },
    {
      name: 'children',
      type: 'ReactNode',
      description: '이미지 위에 겹쳐 표시할 콘텐츠 (Card.ImageOverlay)',
    },
  ];

  return (
    <article className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>Card</h1>
        <p className={styles.description}>
          Card 컴포넌트는 상품 정보, 블로그 글, 사용자 프로필 등 관련된 콘텐츠를
          하나의 영역으로 묶어 표시할 때 사용합니다.
        </p>
      </header>

      {/* Quick Reference */}
      <section className={styles.quickReference}>
        <Card className={styles.quickRefCard}>
          <Card.Body padding="md">
            <h3 className={styles.quickRefTitle}>Import</h3>
            <CodeBlock
              language="typescript"
              code={`import { Card } from '@taein-ui/core';

// Flat: props로 간단하게
<Card title="제목">내용</Card>

// Compound: 점 표기법으로 자유 조합
<Card>
  <Card.Header><Card.Title>제목</Card.Title></Card.Header>
  <Card.Body>내용</Card.Body>
</Card>`}
            />
          </Card.Body>
        </Card>
        <Card className={styles.quickRefCard}>
          <Card.Body padding="md">
            <h3 className={styles.quickRefTitle}>Basic Usage</h3>
            <CodeBlock
              language="tsx"
              code={`{/* Flat */}
<Card
  title="월간 리포트"
  footer={<Button size="sm">확인</Button>}
>
  카드 내용
</Card>

{/* Compound */}
<Card>
  <Card.Header>
    <Card.Title>월간 리포트</Card.Title>
  </Card.Header>
  <Card.Body>카드 내용</Card.Body>
</Card>`}
            />
          </Card.Body>
        </Card>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Examples</h2>
          <p className={styles.sectionDescription}>
            title, header, footer, image 등 props만으로 빠르게 카드를 구성하는
            Flat 패턴 예제입니다.
          </p>
        </div>

        <div className={styles.example}>
          <LivePreview
            title="기본 카드"
            description="title과 footer를 props로 전달하여 기본적인 카드를 구성합니다."
            editable
            code={`<div style={{ maxWidth: '400px' }}>
  <Card
    title="공지사항"
    footer={<Button size="sm">자세히 보기</Button>}
  >
    <p style={{ margin: 0, color: '#6b7280', lineHeight: 1.6 }}>
      디자인 시스템 v2.0이 출시되었습니다. 새로운 컴포넌트와 개선된 접근성을 확인해보세요.
    </p>
  </Card>
</div>`}
          />
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Variants</h3>
          <LivePreview
            title="스타일 변형"
            description="outlined, elevated, filled 세 가지 변형을 제공합니다."
            editable
            code={`const variants = ['outlined', 'elevated', 'filled'];

<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
  {variants.map((v) => (
    <Card key={v} title={v} variant={v}>
      <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
        variant="{v}"
      </p>
    </Card>
  ))}
</div>`}
          />
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Padding</h3>
          <LivePreview
            title="본문 여백"
            description="padding prop으로 내부 여백을 조절합니다."
            editable
            code={`const paddings = ['sm', 'md', 'lg'];

<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
  {paddings.map((p) => (
    <Card key={p} title={'padding="' + p + '"'} variant="outlined" padding={p}>
      <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
        내부 여백 확인
      </p>
    </Card>
  ))}
</div>`}
          />
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>With Image</h3>
          <LivePreview
            title="이미지 카드"
            description="image prop으로 상단에 이미지를 배치합니다."
            editable
            code={`<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
  <Card
    title="이미지 카드"
    image="https://picsum.photos/seed/card1/400/200"
    imageAlt="샘플 이미지"
    footer={<Button size="sm">더 보기</Button>}
  >
    <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.5 }}>
      image와 imageAlt props로 이미지를 추가합니다.
    </p>
  </Card>
  <Card
    variant="outlined"
    image="https://picsum.photos/seed/card2/400/200"
    imageAlt="샘플 이미지"
    title="이미지만 있는 카드"
  >
    <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.5 }}>
      이미지와 텍스트만으로 구성된 간단한 카드입니다.
    </p>
  </Card>
</div>`}
          />
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Clickable Card</h3>
          <LivePreview
            title="클릭 가능한 카드"
            description="onClick을 전달하면 button 요소로 렌더링됩니다. 기본으로는 떠오르지 않고, 원하면 hoverLift를 함께 주세요."
            editable
            code={`const [clicked, setClicked] = useState('');

<>
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
    <Card title="프로젝트 A" onClick={() => setClicked('프로젝트 A')}>
      <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>클릭하여 선택</p>
    </Card>
    <Card title="프로젝트 B" onClick={() => setClicked('프로젝트 B')}>
      <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>클릭하여 선택</p>
    </Card>
    <Card title="프로젝트 C" onClick={() => setClicked('프로젝트 C')} disabled>
      <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>비활성화됨</p>
    </Card>
  </div>
  {clicked && <p style={{ marginTop: '1rem', fontSize: '0.875rem' }}>선택됨: <strong>{clicked}</strong></p>}
</>`}
          />
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Header + Footer</h3>
          <LivePreview
            title="헤더와 푸터"
            description="header와 footer props로 카드 상하단에 콘텐츠를 배치합니다."
            editable
            code={`<div style={{ maxWidth: '400px' }}>
  <Card
    variant="outlined"
    header={<span style={{ fontWeight: 600, fontSize: '1.125rem' }}>사용자 설정</span>}
    footer={
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', width: '100%' }}>
        <Button size="sm" variant="light">취소</Button>
        <Button size="sm">저장</Button>
      </div>
    }
  >
    <p style={{ margin: 0, color: '#6b7280', lineHeight: 1.6 }}>
      알림, 테마, 언어 등 사용자 환경을 설정할 수 있습니다.
    </p>
  </Card>
</div>`}
          />
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Flat vs Compound 패턴</h2>
          <p className={styles.sectionDescription}>
            Card는 하나의 import로 두 가지 API 스타일을 제공합니다. 간단하면
            prop(title, footer, image), 직접 꾸미려면 조합(Card.Body 등)을
            쓰세요.
          </p>
        </div>

        <div className={styles.patternCompareGrid}>
          <div className={styles.patternCard}>
            <p className={styles.patternCardTitle}>Flat Pattern (기본 권장)</p>
            <p className={styles.patternCardDesc}>
              Card에 title, header, footer, image를 props로 전달합니다. 빠르게
              만들 수 있지만 확장성에 한계가 있습니다.
            </p>
            <p className={styles.patternCardWhen}>사용할 때</p>
            <ul className={styles.patternCardList}>
              <li>헤더·본문·푸터가 단순한 텍스트/버튼일 때</li>
              <li>빠르게 카드를 만들고 싶을 때</li>
              <li>서브컴포넌트 조합이 필요 없을 때</li>
            </ul>
          </div>
          <div className={styles.patternCard}>
            <p className={styles.patternCardTitle}>
              Compound Pattern (커스텀용)
            </p>
            <p className={styles.patternCardDesc}>
              Card.Header, Card.Body, Card.Footer 등 점 표기법으로 자유롭게
              조합합니다. 이미지 오버레이, 커스텀 헤더 등 복잡한 레이아웃에
              적합합니다.
            </p>
            <p className={styles.patternCardWhen}>사용할 때</p>
            <ul className={styles.patternCardList}>
              <li>이미지 오버레이 등 복잡한 레이아웃이 필요할 때</li>
              <li>각 영역에 커스텀 className을 적용할 때</li>
              <li>도메인 전용 카드 컴포넌트를 만들 때</li>
            </ul>
          </div>
        </div>

        <div className={styles.patternCompareTableWrapper}>
          <table className={styles.patternCompareTable}>
            <thead className={styles.patternCompareHead}>
              <tr>
                <th className={styles.patternCompareTh}>항목</th>
                <th className={styles.patternCompareTh}>Flat Pattern</th>
                <th className={styles.patternCompareTh}>Compound Pattern</th>
              </tr>
            </thead>
            <tbody>
              <tr className={styles.patternCompareTr}>
                <td className={styles.patternCompareTdLabel}>사용 방식</td>
                <td
                  className={styles.patternCompareTd}
                >{`<Card title="...">`}</td>
                <td
                  className={styles.patternCompareTd}
                >{`<Card><Card.Header>...</Card.Header></Card>`}</td>
              </tr>
              <tr className={styles.patternCompareTr}>
                <td className={styles.patternCompareTdLabel}>유연성</td>
                <td className={styles.patternCompareTd}>
                  낮음 — props 기반 고정 구조
                </td>
                <td className={styles.patternCompareTd}>
                  높음 — 서브 컴포넌트 자유 조합
                </td>
              </tr>
              <tr className={styles.patternCompareTr}>
                <td className={styles.patternCompareTdLabel}>
                  이미지 오버레이
                </td>
                <td className={styles.patternCompareTd}>미지원</td>
                <td className={styles.patternCompareTd}>
                  Card.ImageOverlay 지원
                </td>
              </tr>
              <tr className={styles.patternCompareTr}>
                <td className={styles.patternCompareTdLabel}>주 용도</td>
                <td className={styles.patternCompareTd}>
                  일반 페이지 · 빠른 프로토타이핑
                </td>
                <td className={styles.patternCompareTd}>
                  복잡한 레이아웃 · 도메인 컴포넌트 제작
                </td>
              </tr>
              <tr className={styles.patternCompareTr}>
                <td className={styles.patternCompareTdLabel}>권장 여부</td>
                <td className={styles.patternCompareTd}>대부분의 경우 권장</td>
                <td className={styles.patternCompareTd}>
                  커스텀 레이아웃 시 선택
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className={styles.example} style={{ marginTop: '2rem' }}>
          <h3 className={styles.exampleTitle}>
            Compound 실전 예시 — 이미지 오버레이
          </h3>
          <LivePreview
            title="이미지 + 오버레이"
            description="Card.ImageOverlay로 이미지 위에 콘텐츠를 겹칠 수 있습니다. Flat에서는 지원하지 않는 기능입니다."
            editable
            code={`<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
  <Card variant="elevated">
    <Card.Image src="https://picsum.photos/seed/card1/400/200" alt="샘플 이미지">
      <Card.ImageOverlay>
        <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>NEW</span>
      </Card.ImageOverlay>
    </Card.Image>
    <Card.Body padding="md">
      <p style={{ margin: '0 0 0.5rem', fontWeight: 600, fontSize: '1.125rem' }}>이미지 오버레이</p>
      <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.5 }}>
        Compound 패턴만의 ImageOverlay 기능입니다.
      </p>
    </Card.Body>
  </Card>
  <Card variant="elevated">
    <Card.Image src="https://picsum.photos/seed/card2/400/200" alt="샘플 이미지" />
    <Card.Header>
      <Card.Title>기본 이미지 카드</Card.Title>
    </Card.Header>
    <Card.Body padding="md">
      <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.5 }}>
        Header, Title, Body를 자유롭게 조합합니다.
      </p>
    </Card.Body>
    <Card.Footer>
      <Button size="sm" variant="light">공유</Button>
      <Button size="sm">더 보기</Button>
    </Card.Footer>
  </Card>
</div>`}
          />
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>
            Compound 실전 예시: 떠오르는 호버 (hoverLift)
          </h3>
          <LivePreview
            title="떠오르는 호버"
            description="hoverLift를 주면 마우스를 올릴 때 카드가 떠오르고, 누르면 살짝 눌립니다. 터치 기기에서는 호버가 없어 떠오르지 않습니다."
            editable
            code={`<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
  <Card variant="outlined" hoverLift>
    <Card.Body padding="lg">
      <div style={{ width: '100%', height: '4px', backgroundColor: '#3b82f6', borderRadius: '2px', marginBottom: '0.75rem' }} />
      <p style={{ margin: '0 0 0.5rem', fontWeight: 700, fontSize: '1.125rem' }}>디자인</p>
      <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.5 }}>
        일관된 디자인 언어로 사용자 경험을 향상시킵니다.
      </p>
    </Card.Body>
  </Card>
  <Card variant="outlined" hoverLift>
    <Card.Body padding="lg">
      <div style={{ width: '100%', height: '4px', backgroundColor: '#10b981', borderRadius: '2px', marginBottom: '0.75rem' }} />
      <p style={{ margin: '0 0 0.5rem', fontWeight: 700, fontSize: '1.125rem' }}>개발</p>
      <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.5 }}>
        재사용 가능한 컴포넌트로 개발 속도를 높입니다.
      </p>
    </Card.Body>
  </Card>
  <Card variant="outlined" hoverLift>
    <Card.Body padding="lg">
      <div style={{ width: '100%', height: '4px', backgroundColor: '#f59e0b', borderRadius: '2px', marginBottom: '0.75rem' }} />
      <p style={{ margin: '0 0 0.5rem', fontWeight: 700, fontSize: '1.125rem' }}>접근성</p>
      <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.5 }}>
        웹 접근성 기준을 준수하여 모든 사용자를 지원합니다.
      </p>
    </Card.Body>
  </Card>
</div>`}
          />
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>
            Compound 커스텀 확장 — 도메인 전용 카드 컴포넌트
          </h3>
          <p
            className={styles.sectionDescription}
            style={{ marginBottom: '1rem' }}
          >
            Compound 패턴으로 ProductCard 같은 재사용 컴포넌트를 만들 때
            활용합니다. 소비자는 내부 구조를 몰라도 되고, props만 전달하면
            됩니다.
          </p>
          <CodeBlock
            language="tsx"
            code={`// components/ProductCard.tsx
import { Card } from '@taein-ui/core';

interface ProductCardProps {
  name: string;
  price: number;
  image: string;
  onBuy: () => void;
}

export function ProductCard({ name, price, image, onBuy }: ProductCardProps) {
  return (
    <Card variant="outlined">
      <Card.Image src={image} alt={name} />
      <Card.Header>
        <Card.Title>{name}</Card.Title>
      </Card.Header>
      <Card.Body>
        <p>{price.toLocaleString()}원</p>
      </Card.Body>
      <Card.Footer>
        <Button onClick={onBuy}>구매</Button>
      </Card.Footer>
    </Card>
  );
}

// 사용하는 쪽에서는 단순하게:
// <ProductCard name="운동화" price={89000} image="/shoe.jpg" onBuy={handleBuy} />`}
          />
        </div>
      </section>

      {/* Props API */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Props API</h2>
          <p className={styles.sectionDescription}>
            Card의 Props입니다. title, header, footer, image와 공통 props가 함께
            포함되어 있습니다.
          </p>
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Card</h3>
          <div className={styles.propsTableWrapper}>
            <PropsTable props={cardProps} />
          </div>
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Card.Header</h3>
          <div className={styles.propsTableWrapper}>
            <PropsTable props={compoundHeaderProps} />
          </div>
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Card.Title</h3>
          <div className={styles.propsTableWrapper}>
            <PropsTable props={compoundTitleProps} />
          </div>
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Card.Body</h3>
          <div className={styles.propsTableWrapper}>
            <PropsTable props={compoundBodyProps} />
          </div>
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Card.Footer</h3>
          <div className={styles.propsTableWrapper}>
            <PropsTable props={compoundFooterProps} />
          </div>
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Card.Image</h3>
          <div className={styles.propsTableWrapper}>
            <PropsTable props={compoundImageProps} />
          </div>
        </div>
      </section>

      {/* Accessibility */}
      <AccessibilitySection
        componentName="Card"
        intro="Card는 시맨틱 HTML(article, header, footer)을 사용하여 콘텐츠의 구조를 스크린 리더에게 전달합니다. onClick이 있는 경우 button 요소로 렌더링되어 키보드 접근성을 보장합니다."
        features={[
          {
            attribute: '<article>',
            effect: '독립 콘텐츠 구조',
            description:
              '클릭 불가능한 카드는 article 요소로 렌더링되어 스크린 리더가 독립적인 콘텐츠 영역으로 인식합니다.',
          },
          {
            attribute: '<button>',
            effect: '클릭 가능 카드',
            description:
              'onClick이 있는 카드는 button 요소로 렌더링되어 Tab 키 포커스와 Enter/Space 키 활성화를 지원합니다.',
          },
          {
            attribute: '<header> / <footer>',
            effect: '구조적 의미',
            description:
              'Card.Header와 Card.Footer는 시맨틱 HTML 요소를 사용하여 카드 내부 구조를 전달합니다.',
          },
          {
            attribute: 'aria-disabled',
            effect: '비활성화 상태',
            description:
              'disabled 카드에 aria-disabled="true"가 설정되어 스크린 리더가 비활성 상태를 알립니다.',
          },
          {
            attribute: 'focus-visible',
            effect: '포커스 인디케이터',
            description:
              '클릭 가능한 카드에 3px outline 포커스 표시기가 적용됩니다.',
          },
        ]}
        additionalGuidance={[
          {
            title: '이미지 대체 텍스트',
            description:
              'Card의 image prop이나 Card.Image에 의미 있는 alt 텍스트를 제공하여 스크린 리더 사용자가 이미지 내용을 이해할 수 있도록 합니다.',
            examples: [
              {
                code: `<Card
  image="/product.jpg"
  imageAlt="파란색 운동화 측면 사진"
>
  운동화 상세 정보
</Card>`,
                explanation:
                  '장식적 이미지가 아닌 경우 구체적인 alt 텍스트를 제공합니다.',
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
            Card를 효과적으로 사용하기 위한 권장사항입니다.
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
                <ListItem>
                  일반 케이스는 Flat 패턴 (title, header 등 props) 사용
                </ListItem>
                <ListItem>복잡한 레이아웃 필요 시 Compound 패턴 활용</ListItem>
                <ListItem>관련 정보를 하나의 카드로 그룹화</ListItem>
                <ListItem>
                  클릭 가능한 카드에 명확한 시각적 피드백 제공
                </ListItem>
                <ListItem>이미지에 의미 있는 alt 텍스트 제공</ListItem>
              </List>
            </Card.Body>
          </Card>
          <Card>
            <Card.Body padding="lg">
              <div className={styles.practiceHeader}>
                <span className={styles.practiceIconError}>&#10007;</span>
                <h3 className={styles.practiceTitle}>Don&apos;t</h3>
              </div>
              <List spacing="sm" className={styles.practiceList}>
                <ListItem>하나의 카드에 너무 많은 정보 담기</ListItem>
                <ListItem>카드 안에 카드 중첩 사용</ListItem>
                <ListItem>
                  클릭 가능 카드 내부에 또 다른 클릭 요소 배치
                </ListItem>
                <ListItem>Flat으로 충분한데 불필요하게 Compound 사용</ListItem>
                <ListItem>
                  장식적 이미지에 긴 alt 텍스트 사용 (빈 문자열 사용)
                </ListItem>
              </List>
            </Card.Body>
          </Card>
        </div>
      </section>
    </article>
  );
}
