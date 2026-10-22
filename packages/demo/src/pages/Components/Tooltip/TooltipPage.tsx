import { useState, type ComponentProps } from 'react';
import { Save } from 'lucide-react';
import { Button, Tooltip } from '@taein-ui/core';
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
  '단추나 아이콘 위에 마우스를 올리거나 포커스하면 짧은 설명을 띄웁니다. 가장 적게 움직이도록 만든 알림입니다.';

const CONTROLS: Control[] = [
  { prop: 'content', kind: 'text', label: 'content' },
  {
    prop: 'position',
    kind: 'choice',
    options: ['top', 'bottom', 'left', 'right'],
  },
  { prop: 'delay', kind: 'choice', options: ['0', '200', '500'] },
  { prop: 'arrow', kind: 'choice', options: ['true', 'false'] },
  { prop: 'disabled', kind: 'toggle' },
];

const INITIAL: Values = {
  content: '변경 사항 저장',
  position: 'top',
  delay: '200',
  arrow: 'true',
  disabled: false,
};

const DEFAULTS: Values = {
  position: 'top',
  delay: '200',
  arrow: 'true',
};

// 커서가 단추에 올라가면 지연(기본 200ms) 뒤에 툴팁이 뜬다. 떠나면 곧바로 닫히지 않고
// 유예(300ms) 동안 그대로 있다가 닫힌다
const SCRIPT = (act: Act) => {
  act.move('trigger');
  act.hover('trigger');
  act.wait(1.6);
  act.leave('trigger');
  act.wait(1.1);
  act.home();
  act.wait(0.4);
};

const PROPS: PropDefinition[] = [
  {
    name: 'children',
    type: 'ReactElement',
    required: true,
    description:
      '툴팁을 띄울 요소 하나. aria-describedby가 이 요소에 붙는다. 받은 aria-*와 onClick도 이 요소로 넘어가므로 Popover 안에 넣을 수 있다',
  },
  {
    name: 'content',
    type: 'ReactNode',
    required: true,
    description: '툴팁에 보일 내용',
  },
  {
    name: 'position',
    type: "'top' | 'bottom' | 'left' | 'right'",
    default: "'top'",
    description: '트리거 기준 위치. 트리거에서 8px 떨어진다',
  },
  {
    name: 'delay',
    type: 'number',
    default: '200',
    description:
      '뜨기까지의 지연(ms). 다른 툴팁이 열려 있거나 닫힌 지 300ms 안이면 지연 없이 바로 뜬다',
  },
  {
    name: 'arrow',
    type: 'boolean',
    default: 'true',
    description: '트리거를 가리키는 화살표',
  },
  {
    name: 'disabled',
    type: 'boolean',
    default: 'false',
    description: '툴팁을 띄우지 않는다',
  },
  {
    name: 'open',
    type: 'boolean',
    description: '제어 모드. 주면 보임 여부를 부모가 쥔다',
  },
  {
    name: 'onOpenChange',
    type: '(open: boolean) => void',
    description:
      '보임 여부가 바뀌려 할 때 불린다. 제어 모드에서 open을 갱신한다',
  },
];

const BASIC = `<Tooltip content="변경 사항 저장">
  <Button leftIcon={<Save />}>저장</Button>
</Tooltip>`;

const ICON = `<Tooltip content="삭제" position="bottom">
  <IconButton aria-label="삭제"><Trash /></IconButton>
</Tooltip>`;

const CONTROLLED = `const [open, setOpen] = useState(false);

<Tooltip content="저장됨" open={open} onOpenChange={setOpen}>
  <Button>저장</Button>
</Tooltip>`;

function Usage() {
  return (
    <Topics>
      <Topic title="언제 쓰나">
        <p className={t.body} style={{ marginBottom: 12 }}>
          이름만으로 뜻이 모자란 아이콘 단추나 줄여 쓴 글자에 한두 줄의 짧은
          설명을 붙일 때 씁니다. 툴팁은 마우스를 올리거나 포커스해야만 보이므로
          없어도 쓸 수 있는 보충이어야 합니다. 꼭 읽어야 하는 내용이나 단추가
          있는 내용은 <code>Popover</code>가 맞습니다.
        </p>
        <CodeBlock code={BASIC} />
      </Topic>
      <Topic title="아이콘 단추에 붙이기">
        <p className={t.body} style={{ marginBottom: 12 }}>
          글자 없는 단추는 <code>aria-label</code>로 이름을 주고, 툴팁은 같은
          말을 눈에도 보이게 합니다.
        </p>
        <CodeBlock code={ICON} />
      </Topic>
      <Topic title="뜨는 때와 닫히는 때">
        <p className={t.body}>
          마우스가 올라가고 200ms 뒤에 뜹니다. 지나가다 걸린 마우스에 뜨지
          않도록 한 틈입니다. 이미 다른 툴팁이 열려 있거나 방금 닫혔다면 툴바를
          훑는 것으로 보고 지연 없이 바로 뜹니다. 마우스가 트리거를 떠나도
          300ms는 그대로 있고, 그 사이 툴팁 위로 옮기면 닫히지 않습니다. 키보드
          포커스로도 뜹니다.
        </p>
      </Topic>
      <Topic title="직접 열고 닫기">
        <p className={t.body} style={{ marginBottom: 12 }}>
          <code>open</code>을 주면 보임 여부를 부모가 쥡니다.{' '}
          <code>onOpenChange</code>로 바꾸려는 값을 받아 전달합니다.
        </p>
        <CodeBlock code={CONTROLLED} />
      </Topic>
      <Topic title="움직임">
        <p className={t.body}>
          오버레이 가운데 가장 적게 움직입니다. 트리거 쪽에서 6px 떨어진
          자리에서 0.8배로 시작해 8px 떨어진 자리에 1배로 앉으며 불투명해집니다.
          나갈 때는 130ms 안에 되돌아갑니다. 움직임 줄이기 설정을 켠 환경에서는
          움직임 없이 바로 나타나고 사라집니다.
        </p>
      </Topic>
    </Topics>
  );
}

function A11y() {
  return (
    <ul className={`${t.list} ${t.body}`}>
      <li>
        툴팁 요소는 <code>role=&quot;tooltip&quot;</code>이고, 열려 있는
        동안에만 트리거의 <code>aria-describedby</code>가 그 요소를 가리킵니다.
        트리거가 이미 가진 값과는 공백으로 합쳐집니다.
      </li>
      <li>
        키보드로 트리거에 포커스해도 뜨고, 포커스가 빠지면 지연이나 유예 없이
        닫힙니다. Escape를 누르면 닫히고, 포인터나 포커스가 한 번 벗어나기
        전까지는 다시 뜨지 않습니다.
      </li>
      <li>
        WCAG 1.4.13(호버 가능, 지속)을 지킵니다. 포인터를 트리거에서 툴팁으로
        옮겨도 닫히지 않아 툴팁 위에 마우스를 둔 채 읽을 수 있습니다.
      </li>
      <li>
        개발자가 직접 해야 합니다. 트리거가 아이콘뿐이면 툴팁과 별개로{' '}
        <code>aria-label</code>로 이름을 줍니다. 툴팁은 보충 설명이지 이름을
        대신하지 않습니다.
      </li>
      <li>
        개발자가 직접 해야 합니다. 호버나 포커스가 없는 환경에서는 툴팁이 뜨지
        않으므로 툴팁에만 있는 정보를 두지 않습니다.
      </li>
    </ul>
  );
}

type Position = ComponentProps<typeof Tooltip>['position'];

export function TooltipPage() {
  const [values, setValues] = useState<Values>(INITIAL);

  return (
    <DetailLayout
      name="Tooltip"
      lead={LEAD}
      stage={
        <Stage label="Tooltip 시연" script={SCRIPT}>
          <Tooltip
            data-stage-target="trigger"
            content={String(values.content)}
            position={values.position as Position}
            delay={Number(values.delay)}
            arrow={values.arrow === 'true'}
            disabled={values.disabled === true}
          >
            <Button variant="light" leftIcon={<Save />}>
              저장
            </Button>
          </Tooltip>
        </Stage>
      }
      customize={
        <Customize controls={CONTROLS} values={values} onChange={setValues} />
      }
      code={codeOf({
        component: 'Tooltip',
        values: {
          ...values,
          children: '<Button leftIcon={<Save />}>저장</Button>',
        },
        defaults: DEFAULTS,
      })
        .replace('arrow="false"', 'arrow={false}')
        .replace(/delay="(\d+)"/, 'delay={$1}')}
      props={PROPS}
      usage={<Usage />}
      a11y={<A11y />}
    />
  );
}
