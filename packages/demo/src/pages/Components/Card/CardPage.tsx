import { useState, type ComponentProps } from 'react';
import { Card } from '@taein-ui/core';
import { CodeBlock } from '../../../components/CodeBlock';
import {
  Customize,
  codeOf,
  type Control,
  type Values,
} from '../../../components/Customize';
import { DetailLayout, Topic, Topics } from '../../../components/DetailLayout';
import * as t from '../../../components/DocText';
import { PropsList } from '../../../components/PropsList';
import type { PropDefinition } from '../../../components/PropsTable';
import { Stage, type Act, type DemoProps } from '../../../components/Stage';

const LEAD =
  '상품, 글, 프로필처럼 관련된 정보를 하나의 영역으로 묶습니다. 이미지, 제목, 본문, 푸터를 쌓아 씁니다.';

const CONTROLS: Control[] = [
  {
    prop: 'variant',
    kind: 'choice',
    options: ['outlined', 'elevated', 'filled'],
  },
  { prop: 'padding', kind: 'choice', options: ['sm', 'md', 'lg'] },
  { prop: 'hoverLift', kind: 'toggle' },
  { prop: 'image', kind: 'toggle' },
  { prop: 'footer', kind: 'toggle' },
  { prop: 'disabled', kind: 'toggle' },
];

const INITIAL: Values = {
  variant: 'elevated',
  padding: 'md',
  hoverLift: true,
  image: true,
  footer: true,
  disabled: false,
};

const DEFAULTS: Values = { variant: 'elevated' };

const IMAGE = '/images/TUI.webp';
const IMAGE_ALT = 'TUI';
// 기본 16:9는 375px 폭 무대에서 카드가 일시정지 단추에 닿아 2:1로 낮춘다

// 커서가 카드로 가서 올라타면 3px 떠오르고 그림자가 짙어진다. 길게 누르면 눌리되 끝까지 들어가지 않고
// 버티다가(0.98배, 떠오른 만큼은 반납) 떼면 되밀려 올라온다. 카드는 클릭할 수 있어 눌러도 아무 일도 안 일어난다
const SCRIPT = (act: Act) => {
  act.move('card');
  act.hover('card');
  act.wait(0.9);
  act.press('card', 0.7);
  act.wait(0.9);
  act.leave('card');
  act.wait(0.5);
  act.home();
  act.wait(0.6);
};

const PROPS: PropDefinition[] = [
  {
    name: 'children',
    type: 'ReactNode',
    required: true,
    description:
      '카드 내용. 하위 컴포넌트를 조합하거나, Flat이면 본문 영역에 들어간다',
  },
  {
    name: 'variant',
    type: "'outlined' | 'elevated' | 'filled'",
    default: "'elevated'",
    description: '모양. 테두리, 그림자, 회색 면',
  },
  {
    name: 'hoverLift',
    type: 'boolean',
    default: 'false',
    description:
      '마우스를 올리면 떠오르고 누르면 눌린다. 켜야만 움직이고 클릭할 수 있는 카드도 마찬가지다',
  },
  {
    name: 'onClick',
    type: '() => void',
    description: '주면 카드 전체가 button이 된다',
  },
  {
    name: 'disabled',
    type: 'boolean',
    default: 'false',
    description: '흐려지고 누를 수 없다. hoverLift도 움직이지 않는다',
  },
  {
    name: 'title',
    type: 'string',
    description: 'Flat: 제목. 헤더와 제목을 만든다',
  },
  {
    name: 'header',
    type: 'ReactNode',
    description: 'Flat: 헤더 영역. title보다 우선한다',
  },
  {
    name: 'footer',
    type: 'ReactNode',
    description: 'Flat: 푸터 영역',
  },
  {
    name: 'image',
    type: 'string',
    description: 'Flat: 위에 놓을 이미지 주소',
  },
  {
    name: 'imageAlt',
    type: 'string',
    default: "''",
    description: 'Flat: 이미지의 대체 텍스트',
  },
  {
    name: 'padding',
    type: "'sm' | 'md' | 'lg'",
    default: "'md'",
    description: 'Flat: 본문 안쪽 여백. 8, 16, 24px',
  },
];

const PARTS_PROPS: PropDefinition[] = [
  {
    name: 'Card.Image',
    type: '{ src: string; alt?: string; children?: ReactNode }',
    description:
      '이미지 영역. 16:9 비율이고 alt를 안 주면 장식으로 본다. 안에 Card.ImageOverlay를 둔다',
  },
  {
    name: 'Card.ImageOverlay',
    type: '{ children: ReactNode }',
    description: '이미지 위에 반투명 막과 함께 겹쳐 보일 내용. 가운데 놓인다',
  },
  {
    name: 'Card.Header',
    type: '{ children: ReactNode }',
    description: '헤더 영역. 아래에 구분선이 있다',
  },
  {
    name: 'Card.Title',
    type: "{ children: ReactNode; as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' }",
    default: "as: 'h3'",
    description: '제목. 페이지의 제목 단계에 맞춰 as를 고른다',
  },
  {
    name: 'Card.Body',
    type: "{ children: ReactNode; padding?: 'sm' | 'md' | 'lg' }",
    default: "padding: 'md'",
    description: '본문 영역',
  },
  {
    name: 'Card.Footer',
    type: '{ children: ReactNode }',
    description: '푸터 영역. 내용은 오른쪽에 모이고 위에 구분선이 있다',
  },
];

const FLAT = `<Card
  title="월간 리포트"
  image="/images/report.webp"
  imageAlt="방문자 추이 그래프"
  footer={<Button size="sm">자세히</Button>}
>
  이번 달 방문자가 지난달보다 12% 늘었습니다.
</Card>`;

const COMPOUND = `<Card>
  <Card.Image src="/images/trip.webp" alt="바닷가 풍경">
    <Card.ImageOverlay>제주</Card.ImageOverlay>
  </Card.Image>
  <Card.Header>
    <Card.Title>제주 3박 4일</Card.Title>
    <Badge>인기</Badge>
  </Card.Header>
  <Card.Body>해안 도로를 따라 걷는 일정입니다.</Card.Body>
</Card>`;

const CLICKABLE = `<Card onClick={openDetail} hoverLift>
  <Card.Body>카드 전체를 누릅니다</Card.Body>
</Card>`;

function Usage() {
  return (
    <Topics>
      <Topic title="언제 쓰나">
        <p className={t.body}>
          상품 정보, 글 미리보기, 프로필처럼 서로 관련된 내용을 한 덩어리로 묶어
          보일 때 씁니다. 한 카드에는 한 주제만 담고 카드 안에 카드를 겹치지
          않습니다.
        </p>
      </Topic>
      <Topic title="두 가지 구성">
        <p className={t.body} style={{ marginBottom: 12 }}>
          대부분은 Flat입니다. <code>title</code>, <code>image</code>,{' '}
          <code>footer</code> props로 이미지, 헤더, 본문, 푸터가 위에서 아래로
          쌓입니다. 본문은 <code>children</code>이고 <code>header</code>를 주면{' '}
          <code>title</code> 대신 그 내용을 씁니다.
        </p>
        <CodeBlock code={FLAT} />
        <p className={t.body} style={{ margin: '16px 0 12px' }}>
          구조를 직접 짜야 하면 하위 컴포넌트를 조합해 만듭니다. 이미지 위에
          글을 겹치는 <code>Card.ImageOverlay</code>는 이쪽에서만 쓸 수
          있습니다. 위 무대와 직접 바꿔 보기의 코드가 이 방식입니다.
        </p>
        <CodeBlock code={COMPOUND} />
      </Topic>
      <Topic title="하위 컴포넌트">
        <PropsList props={PARTS_PROPS} />
      </Topic>
      <Topic title="눌리는 카드와 떠오름">
        <p className={t.body} style={{ marginBottom: 12 }}>
          <code>onClick</code>을 주면 카드 전체가 button이 됩니다. 이때 카드
          안에 링크나 버튼 같은 다른 누를 것을 두지 않습니다. 눌리는 카드도
          기본으로는 떠오르지 않으므로, 누를 수 있다는 것을 보이려면{' '}
          <code>hoverLift</code>를 함께 켭니다.
        </p>
        <CodeBlock code={CLICKABLE} />
      </Topic>
      <Topic title="움직임">
        <p className={t.body}>
          <code>hoverLift</code>를 켜면 마우스를 올릴 때 카드가 3px 떠오르고
          그림자가 짙어집니다. 누르면 눌리되 끝까지 들어가지 않고 버팁니다.
          떠오른 3px을 돌려주고 0.98배로만 줄며 그림자도 쉴 때 값으로
          돌아갑니다. 손을 떼면 떠오른 자리로 되밀려 올라옵니다. 마우스에서만
          일어나고 터치에서는 떠오르지 않습니다. 움직임 줄이기 설정을 켠
          환경에서는 이동 없이 그림자만 바뀝니다.
        </p>
      </Topic>
    </Topics>
  );
}

function A11y() {
  return (
    <ul className={`${t.list} ${t.body}`}>
      <li>
        누를 수 없는 카드는 <code>article</code>로 그려져 독립된 내용 영역으로
        읽힙니다. <code>onClick</code>이 있으면 <code>button</code>이 되어
        Tab으로 들어가고 Enter와 Space로 누릅니다.
      </li>
      <li>
        <code>Card.Header</code>와 <code>Card.Footer</code>는{' '}
        <code>header</code>와 <code>footer</code> 요소라 카드 안의 구조가
        전달됩니다. <code>Card.Title</code>는 기본 <code>h3</code>입니다.
      </li>
      <li>
        개발자가 직접 해야 합니다. 페이지의 제목 단계에 맞게{' '}
        <code>Card.Title</code>의 <code>as</code>를 고릅니다.
      </li>
      <li>
        개발자가 직접 해야 합니다. 이미지는 <code>alt</code>를 안 주면 장식으로
        취급되어 읽히지 않습니다. 내용이 있는 이미지에는 무엇이 담겼는지 적고,
        장식이면 비워 둡니다.
      </li>
      <li>
        <code>disabled</code>인 눌리는 카드는 <code>aria-disabled</code>가{' '}
        <code>true</code>가 되고 누를 수 없습니다.
      </li>
      <li>눌리는 카드는 키보드로 포커스하면 2px 포커스 링이 생깁니다.</li>
    </ul>
  );
}

type Variant = ComponentProps<typeof Card>['variant'];
type Padding = ComponentProps<typeof Card>['padding'];

/** 무대 조각. 상세 페이지와 전체 컴포넌트 카드가 같이 쓴다 */
export function CardDemo({ values = INITIAL, mini }: DemoProps) {
  const withImage = values.image === true;
  const withFooter = values.footer === true;
  const padding = String(values.padding);

  return (
    <Stage mini={mini} label="Card 시연" script={SCRIPT}>
      <Card
        data-stage-target="card"
        variant={values.variant as Variant}
        hoverLift={values.hoverLift === true}
        disabled={values.disabled === true}
        onClick={() => undefined}
      >
        {withImage && (
          <Card.Image
            src={IMAGE}
            alt={IMAGE_ALT}
            style={{ aspectRatio: '2' }}
          />
        )}
        <Card.Header>
          <Card.Title>월간 리포트</Card.Title>
        </Card.Header>
        <Card.Body padding={padding as Padding}>
          이번 달 방문자가 지난달보다 12% 늘었습니다.
        </Card.Body>
        {withFooter && <Card.Footer>2026년 10월</Card.Footer>}
      </Card>
    </Stage>
  );
}

export function CardPage() {
  const [values, setValues] = useState<Values>(INITIAL);
  const withImage = values.image === true;
  const withFooter = values.footer === true;
  const padding = String(values.padding);

  // 코드는 무대와 같은 Compound 구조다. 조작판 값이 켜진 것만 줄로 나온다
  const lines = [
    withImage && '<Card.Image',
    withImage && `  src="${IMAGE}"`,
    withImage && `  alt="${IMAGE_ALT}"`,
    withImage && `  style={{ aspectRatio: '2' }}`,
    withImage && '/>',
    '<Card.Header>',
    '  <Card.Title>월간 리포트</Card.Title>',
    '</Card.Header>',
    `<Card.Body${padding === 'md' ? '' : ` padding="${padding}"`}>`,
    '  이번 달 방문자가 지난달보다 12% 늘었습니다.',
    '</Card.Body>',
    withFooter && '<Card.Footer>2026년 10월</Card.Footer>',
  ].filter(Boolean);

  return (
    <DetailLayout
      name="Card"
      lead={LEAD}
      stage={<CardDemo values={values} />}
      customize={
        <Customize controls={CONTROLS} values={values} onChange={setValues} />
      }
      code={codeOf({
        component: 'Card',
        values: {
          variant: values.variant,
          hoverLift: values.hoverLift,
          onClick: true,
          disabled: values.disabled,
          children: lines.join('\n  '),
        },
        defaults: DEFAULTS,
        notation: { onClick: { expr: 'openDetail' } },
      })}
      props={PROPS}
      usage={<Usage />}
      a11y={<A11y />}
    />
  );
}
