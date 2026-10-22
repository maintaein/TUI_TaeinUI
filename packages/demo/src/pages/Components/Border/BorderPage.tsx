import { useState, type ComponentProps } from 'react';
import { Border } from '@taein-ui/core';
import { CodeBlock } from '../../../components/CodeBlock';
import {
  Customize,
  codeOf,
  type Control,
  type Values,
} from '../../../components/Customize';
import { DetailLayout, Topic, Topics } from '../../../components/DetailLayout';
import * as t from '../../../components/DocText';
import type { PropDefinition } from '../../../components/PropsTable';
import { Stage, type Act } from '../../../components/Stage';

const LEAD =
  '콘텐츠 둘레에 선을 두릅니다. 영역을 나누거나 강조할 때 쓰고, 켜 두면 마우스를 올린 곳의 테두리를 따라 빛이 돕니다.';

const CONTROLS: Control[] = [
  {
    prop: 'sides',
    kind: 'choice',
    options: [
      'all',
      'top',
      'right',
      'bottom',
      'left',
      'horizontal',
      'vertical',
    ],
  },
  { prop: 'variant', kind: 'choice', options: ['solid', 'dashed', 'dotted'] },
  { prop: 'width', kind: 'choice', options: ['thin', 'medium', 'thick'] },
  {
    prop: 'color',
    kind: 'choice',
    options: ['default', 'primary', 'success', 'error', 'warning'],
  },
  {
    prop: 'rounded',
    kind: 'choice',
    options: ['none', 'sm', 'md', 'lg', 'full'],
  },
  { prop: 'padding', kind: 'choice', options: ['none', 'sm', 'md', 'lg'] },
  { prop: 'glow', kind: 'toggle' },
];

const INITIAL: Values = {
  sides: 'all',
  variant: 'solid',
  width: 'medium',
  color: 'default',
  rounded: 'lg',
  padding: 'lg',
  glow: true,
};

const TEXT = '여기가 지금 살아 있습니다';

// 커서가 테두리에 올라가 머문다. 빛이 테두리를 따라 도는 것이 보일 만큼 오래 둔다(한 바퀴는 6초)
// shortcut: 호버 머무름 3초는 빛이 반 바퀴쯤 도는 값이다, 한 바퀴를 다 보이려면 6초로 늘린다
const SCRIPT = (act: Act) => {
  act.move('border');
  act.hover('border');
  act.wait(3);
  act.leave('border');
  act.wait(0.8);
  act.home();
  act.wait(0.6);
};

const PROPS: PropDefinition[] = [
  {
    name: 'children',
    type: 'ReactNode',
    required: true,
    description: '테두리로 감쌀 내용',
  },
  {
    name: 'sides',
    type: "'all' | 'top' | 'right' | 'bottom' | 'left' | 'horizontal' | 'vertical'",
    default: "'all'",
    description: '선을 그을 변',
  },
  {
    name: 'variant',
    type: "'solid' | 'dashed' | 'dotted'",
    default: "'solid'",
    description: '선 모양',
  },
  {
    name: 'width',
    type: "'thin' | 'medium' | 'thick'",
    default: "'thin'",
    description: '선 두께. 1, 2, 4px',
  },
  {
    name: 'color',
    type: "'default' | 'primary' | 'success' | 'error' | 'warning'",
    default: "'default'",
    description: '선 색. 테마의 의미 색을 쓴다',
  },
  {
    name: 'rounded',
    type: "'none' | 'sm' | 'md' | 'lg' | 'full'",
    default: "sides가 all이면 'md', 아니면 'none'",
    description:
      '모서리 둥글기. 일부 변만 그을 때는 선 끝이 휘지 않도록 none이고, 값을 주면 늘 그 값이 이긴다',
  },
  {
    name: 'padding',
    type: "'none' | 'sm' | 'md' | 'lg'",
    default: "'none'",
    description: '안쪽 여백. 0, 8, 16, 24px',
  },
  {
    name: 'glow',
    type: 'boolean',
    default: 'false',
    description:
      '마우스를 올리거나 키보드 포커스가 들어오면 테두리를 따라 도는 빛. sides가 all일 때만 나타난다',
  },
];

const QUOTE = `<Border sides="left" width="thick" color="primary" padding="md">
  왼쪽 두꺼운 선으로 인용문을 강조합니다.
</Border>`;

function Usage() {
  return (
    <Topics>
      <Topic title="호버 빛">
        <p className={t.body}>
          <code>glow</code>를 켜면 마우스를 올리거나 키보드 포커스가 안으로
          들어올 때 빛이 테두리를 따라 6초에 한 바퀴 돕니다. 기본은 꺼져
          있습니다. <code>sides</code>가 <code>all</code>일 때만 나타나고, 다른
          값에서는 <code>glow</code>를 줘도 아무 일도 없습니다. 빛은 선 색을
          따라가며 <code>default</code>는 회색이라 <code>primary</code> 색으로
          돕니다. 호버는 마우스 같은 정밀 포인터에서만 켜지고 터치에서는 켜지지
          않으며, 포커스는 입력 기기와 상관없이 켜집니다. 안에 포커스를 받을
          요소가 없으면 호버로만 켜집니다. 움직임 줄이기 설정을 켠 환경에서는
          돌지 않습니다.
        </p>
      </Topic>
      <Topic title="일부 변만 긋기">
        <p className={t.body} style={{ marginBottom: 12 }}>
          <code>sides</code>로 한 변이나 위아래, 좌우만 긋습니다. 왼쪽 두꺼운
          선은 인용문이나 중요한 안내를 강조하고, 아래쪽 선은 영역을 나눕니다.
          이때 모서리는 둥글리지 않는 것이 기본입니다.
        </p>
        <CodeBlock code={QUOTE} />
      </Topic>
      <Topic title="색과 두께">
        <p className={t.body}>
          <code>color</code>는 의미 색(<code>primary</code>,{' '}
          <code>success</code>, <code>error</code>, <code>warning</code>)이라
          오류나 경고 상자에 어울립니다. 다만 뜻을 색 하나로만 전하지 말고
          글자를 함께 둡니다. <code>thick</code>은 강조용 장식이니 남용하지
          않습니다. 글자를 선에 붙여 두지 않도록 <code>padding</code>을 함께
          줍니다.
        </p>
      </Topic>
    </Topics>
  );
}

function A11y() {
  return (
    <ul className={`${t.list} ${t.body}`}>
      <li>
        의미 없는 <code>div</code>로 그려지는 시각 장식이라 스크린 리더에서 따로
        역할이 없습니다. <code>role</code>이나 <code>aria-*</code>는 div의
        속성으로 그대로 전달됩니다.
      </li>
      <li>
        <code>glow</code>의 빛은 <code>aria-hidden</code> 장식 요소이고 클릭을
        받지 않습니다.
      </li>
      <li>
        개발자가 직접 해야 합니다. 테두리가 의미 있는 영역을 감쌀 때는{' '}
        <code>role</code>이나 <code>aria-label</code>을 줍니다.
      </li>
      <li>
        개발자가 직접 해야 합니다. 색만으로 뜻을 전하지 않고 글자를 함께 둡니다.
      </li>
    </ul>
  );
}

type Sides = ComponentProps<typeof Border>['sides'];
type Variant = ComponentProps<typeof Border>['variant'];
type Width = ComponentProps<typeof Border>['width'];
type Color = ComponentProps<typeof Border>['color'];
type Rounded = ComponentProps<typeof Border>['rounded'];
type Padding = ComponentProps<typeof Border>['padding'];

export function BorderPage() {
  const [values, setValues] = useState<Values>(INITIAL);
  const all = values.sides === 'all';

  return (
    <DetailLayout
      name="Border"
      lead={LEAD}
      stage={
        <Stage label="Border 시연" script={SCRIPT}>
          <Border
            data-stage-target="border"
            sides={values.sides as Sides}
            variant={values.variant as Variant}
            width={values.width as Width}
            color={values.color as Color}
            rounded={values.rounded as Rounded}
            padding={values.padding as Padding}
            glow={values.glow === true}
            // 무대 폭을 채운다. 코드에는 없다
            style={{ justifySelf: 'stretch' }}
          >
            {TEXT}
          </Border>
        </Stage>
      }
      customize={
        <Customize controls={CONTROLS} values={values} onChange={setValues} />
      }
      code={codeOf({
        component: 'Border',
        values: { ...values, children: TEXT },
        // rounded의 기본값은 sides에 따라 달라진다
        defaults: {
          sides: 'all',
          variant: 'solid',
          width: 'thin',
          color: 'default',
          rounded: all ? 'md' : 'none',
          padding: 'none',
        },
      })}
      props={PROPS}
      usage={<Usage />}
      a11y={<A11y />}
    />
  );
}
