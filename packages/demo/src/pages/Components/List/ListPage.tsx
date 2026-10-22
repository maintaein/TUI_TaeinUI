import { useState, type ComponentProps } from 'react';
import { List, ListItem } from '@taein-ui/core';
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
import { Stage, type DemoProps } from '../../../components/Stage';

const LEAD =
  '설정 항목, 주문 내역, 사양처럼 이름과 값이 짝인 정보를 세로로 나열합니다. 항목 사이에 간격이나 구분선을 둡니다.';

const CONTROLS: Control[] = [
  { prop: 'spacing', kind: 'choice', options: ['none', 'sm', 'md', 'lg'] },
  { prop: 'divider', kind: 'toggle' },
  { prop: 'layout', kind: 'choice', options: ['horizontal', 'vertical'] },
  { prop: 'labelWidth', kind: 'choice', options: ['auto', '96px'] },
];

const INITIAL: Values = {
  spacing: 'md',
  divider: true,
  layout: 'horizontal',
  labelWidth: 'auto',
};

const DEFAULTS: Values = { spacing: 'md' };

const ROWS = [
  ['이름', '홍길동'],
  ['이메일', 'hong@example.com'],
  ['역할', '프론트엔드 개발자'],
];

const PROPS: PropDefinition[] = [
  {
    name: 'children',
    type: 'ReactNode',
    required: true,
    description: 'ListItem들',
  },
  {
    name: 'spacing',
    type: "'none' | 'sm' | 'md' | 'lg'",
    default: "'md'",
    description:
      '항목 사이 간격. 0, 8, 16, 24px. 구분선이 있으면 선 위 여백도 같은 값이다',
  },
  {
    name: 'divider',
    type: 'boolean',
    default: 'false',
    description:
      '항목 사이에 구분선을 긋는다. 마지막 항목 아래에는 긋지 않는다',
  },
];

const ITEM_PROPS: PropDefinition[] = [
  {
    name: 'label',
    type: 'ReactNode',
    description: '이름. 가로면 왼쪽, 세로면 위쪽에 놓인다',
  },
  {
    name: 'value',
    type: 'ReactNode',
    description: '값. 가로면 오른쪽, 세로면 아래쪽에 놓이고 남은 폭을 채운다',
  },
  {
    name: 'children',
    type: 'ReactNode',
    description:
      '자유 배치용 내용. 있으면 label, value, layout, labelWidth를 쓰지 않는다',
  },
  {
    name: 'layout',
    type: "'horizontal' | 'vertical'",
    default: "'horizontal'",
    description: '이름과 값을 나란히 놓거나 위아래로 놓는다',
  },
  {
    name: 'labelWidth',
    type: 'string',
    description: '이름 칸의 고정 폭(CSS 단위). 값이 한 줄로 맞춰진다',
  },
];

const BASIC = `<List divider>
  <ListItem label="주문번호" value="ORD-2024-001" labelWidth="96px" />
  <ListItem label="결제금액" value="₩99,000" labelWidth="96px" />
</List>`;

const FREE = `<List divider>
  <ListItem>첫 번째 항목입니다.</ListItem>
  <ListItem>
    <span>새 소식</span>
    <Badge variant="primary">NEW</Badge>
  </ListItem>
</List>`;

function Usage() {
  return (
    <Topics>
      <Topic title="이름과 값">
        <p className={t.body} style={{ marginBottom: 12 }}>
          <code>ListItem</code>에 <code>label</code>과 <code>value</code>를 주면
          이름과 값이 짝으로 놓입니다. 이름 칸 폭이 항목마다 다르면 값의 시작이
          들쭉날쭉하니, <code>labelWidth</code>로 같은 폭을 주어 값을 맞춥니다.
        </p>
        <CodeBlock code={BASIC} />
      </Topic>
      <Topic title="ListItem">
        <PropsList props={ITEM_PROPS} />
      </Topic>
      <Topic title="자유 배치">
        <p className={t.body} style={{ marginBottom: 12 }}>
          <code>ListItem</code> 안에 자식을 넣으면 이름과 값 구조를 쓰지 않고
          자유롭게 그립니다. 같은 목록 안에 두 방식을 섞지 않는 편이 정렬이
          깔끔합니다.
        </p>
        <CodeBlock code={FREE} />
      </Topic>
      <Topic title="간격과 구분선">
        <p className={t.body}>
          항목은 <code>spacing</code>만큼 떨어지고 <code>divider</code>를 켜면
          그 사이에 선이 그어집니다. 선 위쪽 여백은 <code>spacing</code>과 같은
          값이라, <code>spacing=&quot;none&quot;</code>이면 선이 글자에 바짝
          붙습니다. 항목이 많으면 한 목록에 몰아 두지 말고 섹션을 나눕니다.
        </p>
      </Topic>
    </Topics>
  );
}

function A11y() {
  return (
    <ul className={`${t.list} ${t.body}`}>
      <li>
        <code>ul</code>과 <code>li</code> 요소로 그려져 스크린 리더가 목록과
        항목으로 읽습니다. 점을 지워도 목록으로 읽히도록 <code>ul</code>에{' '}
        <code>role=&quot;list&quot;</code>를 명시하고, 주면 그 값이 이깁니다.
        속성은 목록은 <code>ul</code>에, 항목은 <code>li</code>에 그대로
        전달됩니다.
      </li>
      <li>이름과 값은 문서에 쓰인 순서대로, 이름 다음에 값이 읽힙니다.</li>
      <li>
        개발자가 직접 해야 합니다. 목록의 맥락을 밝히려면 제목 요소의 id를{' '}
        <code>List</code>의 <code>aria-labelledby</code>로 연결합니다.
      </li>
      <li>
        개발자가 직접 해야 합니다. 페이지 이동 목적의 링크 모음은 이 컴포넌트가
        아니라 <code>nav</code>로 만듭니다.
      </li>
    </ul>
  );
}

type Spacing = ComponentProps<typeof List>['spacing'];
type Layout = ComponentProps<typeof ListItem>['layout'];

// 이 컴포넌트에는 호버나 누름이 없어 시연할 움직임이 없다. 대본 없이 조작판 값만 바꿔 보인다
/** 무대 조각. 상세 페이지와 전체 컴포넌트 카드가 같이 쓴다 */
export function ListDemo({ values = INITIAL, mini }: DemoProps) {
  const layout = String(values.layout);
  const labelWidth = values.labelWidth === 'auto' ? undefined : '96px';

  return (
    <Stage mini={mini} label="List 미리보기">
      <List
        spacing={values.spacing as Spacing}
        divider={values.divider === true}
      >
        {ROWS.map(([label, value]) => (
          <ListItem
            key={label}
            label={label}
            value={value}
            layout={layout as Layout}
            labelWidth={labelWidth}
          />
        ))}
      </List>
    </Stage>
  );
}

export function ListPage() {
  const [values, setValues] = useState<Values>(INITIAL);
  const layout = String(values.layout);
  const labelWidth = values.labelWidth === 'auto' ? undefined : '96px';

  const attrs = [
    layout === 'vertical' && 'layout="vertical"',
    labelWidth && `labelWidth="${labelWidth}"`,
  ].filter(Boolean);
  const itemLine = ([label, value]: string[]) =>
    `<ListItem label="${label}" value="${value}"${attrs.map((a) => ` ${a}`).join('')} />`;

  return (
    <DetailLayout
      name="List"
      lead={LEAD}
      stage={<ListDemo values={values} />}
      customize={
        <Customize controls={CONTROLS} values={values} onChange={setValues} />
      }
      code={codeOf({
        component: 'List',
        values: {
          spacing: values.spacing,
          divider: values.divider,
          children: ROWS.map(itemLine).join('\n  '),
        },
        defaults: DEFAULTS,
        imports: [{ name: 'ListItem', from: '@taein-ui/core' }],
      })}
      props={PROPS}
      usage={<Usage />}
      a11y={<A11y />}
    />
  );
}
