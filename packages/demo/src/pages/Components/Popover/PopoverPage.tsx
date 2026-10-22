import { useState, type ComponentProps } from 'react';
import { Button, Popover } from '@taein-ui/core';
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
import { Stage, type Act, type DemoProps } from '../../../components/Stage';

const LEAD =
  '단추 바로 옆에 프로필 메뉴나 날짜 선택기 같은 작은 패널을 띄웁니다. 단추 쪽 모서리에서 펼쳐지고, 바깥을 누르면 닫힙니다.';

const CONTROLS: Control[] = [
  {
    prop: 'position',
    kind: 'choice',
    options: ['top', 'bottom', 'left', 'right'],
  },
  { prop: 'arrow', kind: 'toggle' },
];

const INITIAL: Values = {
  position: 'bottom',
  arrow: true,
};

const DEFAULTS: Values = {
  position: 'bottom',
};

const NOTATION = {
  open: { expr: 'open' },
  onOpenChange: { expr: 'setOpen' },
  content: {
    expr: '\n    <div>\n      <p>김태인</p>\n      <Button onClick={logout}>로그아웃</Button>\n    </div>\n  ',
    import: { name: 'Button', from: '@taein-ui/core' },
  },
};

// 커서가 단추를 눌러 팝오버를 연다. 단추 쪽 모서리에서 펼쳐지고 잠시 머문 뒤, 커서가 바깥 영역을 눌러 닫는다
// shortcut: 쉬는 시간 2초는 열림(0.3초)과 읽을 시간을 합친 값이다, 열림이 길어지면 같이 늘린다
const SCRIPT = (act: Act) => {
  act.move('trigger');
  act.hover('trigger');
  act.wait(0.3);
  act.press('trigger');
  act.leave('trigger');
  act.wait(2);
  act.move('away');
  act.click('away');
  act.wait(1.2);
  act.home();
  act.wait(0.4);
};

const PROPS: PropDefinition[] = [
  {
    name: 'children',
    type: 'ReactElement',
    required: true,
    description:
      '트리거. 받은 onClick과 aria 속성을 자기 루트의 눌리는 요소에 다는 단일 요소(Button, IconButton, Avatar). 누르면 이동하는 링크는 안 된다',
  },
  {
    name: 'content',
    type: 'ReactNode',
    required: true,
    description: '팝오버 안에 그릴 내용',
  },
  {
    name: 'open',
    type: 'boolean',
    description:
      '열림 여부. 주면 부모가 쥐고(제어), 안 주면 스스로 연다(비제어)',
  },
  {
    name: 'onOpenChange',
    type: '(open: boolean) => void',
    description:
      '열림이 바뀔 때 불린다. 트리거를 누를 때, 바깥을 누를 때, Esc를 누를 때',
  },
  {
    name: 'position',
    type: "'top' | 'bottom' | 'left' | 'right'",
    default: "'bottom'",
    description: '트리거에서 어느 쪽에 뜰지',
  },
  {
    name: 'arrow',
    type: 'boolean',
    default: 'false',
    description: '트리거를 가리키는 화살표',
  },
  {
    name: 'maxWidth',
    type: 'string',
    description: '최대 너비(CSS 단위). 안 주면 내용 너비를 따른다(최소 120px)',
  },
  {
    name: 'closeOnOutsideClick',
    type: 'boolean',
    default: 'true',
    description: '바깥을 눌러 닫을지 여부',
  },
  {
    name: 'closeOnEscape',
    type: 'boolean',
    default: 'true',
    description: 'Esc 키로 닫을지 여부. 닫으면 포커스가 트리거로 돌아간다',
  },
  {
    name: 'disabled',
    type: 'boolean',
    default: 'false',
    description: '트리거를 눌러도 열리지 않게 한다',
  },
];

const UNCONTROLLED = `<Popover content={<p>김태인</p>}>
  <Button>계정</Button>
</Popover>`;

const CONTROLLED = `const [open, setOpen] = useState(false);

<Popover
  open={open}
  onOpenChange={setOpen}
  content={<Button onClick={() => setOpen(false)}>로그아웃</Button>}
>
  <Button>계정</Button>
</Popover>`;

function Usage() {
  return (
    <Topics>
      <Topic title="언제 쓰나">
        <p className={t.body}>
          단추를 누르면 그 옆에 프로필 메뉴, 날짜 선택기, 짧은 설명과 동작 같은
          작은 패널을 보여 주고 싶을 때 씁니다. 뒤 화면을 막고 답을 받아야 하면{' '}
          <code>Modal</code>을 씁니다. 마우스를 올렸을 때 잠깐 보이는 설명은{' '}
          <code>Tooltip</code>이 할 일입니다.
        </p>
      </Topic>
      <Topic title="스스로 열기와 부모가 쥐기">
        <p className={t.body} style={{ marginBottom: 12 }}>
          <code>open</code>을 주지 않으면 트리거를 눌러 스스로 열고 닫습니다.
        </p>
        <CodeBlock code={UNCONTROLLED} />
        <p className={t.body} style={{ margin: '12px 0' }}>
          안의 단추로 닫거나 다른 상태와 묶으려면 <code>open</code>과{' '}
          <code>onOpenChange</code>를 줍니다. 열림이 바뀔 때마다 이 함수가
          불립니다.
        </p>
        <CodeBlock code={CONTROLLED} />
      </Topic>
      <Topic title="닫기">
        <p className={t.body}>
          트리거를 다시 누르거나, 팝오버 바깥에서 마우스를 누르거나(
          <code>mousedown</code>), Esc를 누르면 닫힙니다. 바깥을 눌러 닫을 때는
          포커스를 옮기지 않고, Esc로 닫을 때만 포커스가 트리거로 돌아갑니다.{' '}
          <code>closeOnOutsideClick</code>과 <code>closeOnEscape</code>로 각각
          끌 수 있습니다.
        </p>
      </Topic>
      <Topic title="포털 없이 트리거 옆에 그려집니다">
        <p className={t.body}>
          팝오버는 <code>document.body</code>로 옮겨 그리지 않고 트리거 바로
          옆에 <code>position: absolute</code>로 그립니다. 그래서 위 무대처럼
          부모가 <code>overflow: hidden</code>이면 부모 밖으로 나간 부분이
          잘립니다. 가장자리에 놓는 트리거는 <code>position</code>으로 안쪽을
          향하게 하거나 부모의 overflow를 확인합니다.
        </p>
      </Topic>
      <Topic title="움직임">
        <p className={t.body}>
          화살표가 붙는 트리거 쪽 모서리를 기준으로 0.6배에서 1배로 펼쳐지며
          0.3초가 걸립니다. 불투명도는 그보다 짧게 0.15초에 끝납니다. 닫힐 때는
          0.195초 동안 접힙니다.
        </p>
      </Topic>
    </Topics>
  );
}

function A11y() {
  return (
    <ul className={`${t.list} ${t.body}`}>
      <li>
        트리거에 <code>aria-haspopup=&quot;dialog&quot;</code>와{' '}
        <code>aria-expanded</code>가 붙고, 열려 있는 동안{' '}
        <code>aria-controls</code>가 팝오버를 가리킵니다.
      </li>
      <li>
        팝오버는 <code>role=&quot;dialog&quot;</code>입니다. 보이게 되면
        포커스가 팝오버 안의 첫 번째 포커스 가능한 요소로 옮겨 가므로, 열자마자
        키보드로 쓸 수 있습니다.
      </li>
      <li>
        포커스를 가두지 않습니다. Tab으로 팝오버 밖으로 나갈 수 있고, 닫을 때
        포커스를 트리거로 되돌리는 것은 Esc일 때뿐입니다.
      </li>
      <li>
        <code>disabled</code>이면 트리거에 <code>aria-disabled</code>가
        붙습니다.
      </li>
      <li>
        개발자가 직접 해야 합니다. 팝오버 다이얼로그에 이름을 붙이는 prop이
        없으므로 안에 제목 글을 두어 무엇인지 읽히게 합니다. 트리거는 누를 수
        있는 요소 하나여야 하고, 키보드로도 닫을 수 있도록 Esc를 끄지 않습니다.
      </li>
    </ul>
  );
}

type Position = ComponentProps<typeof Popover>['position'];

/** 무대 조각. 상세 페이지와 전체 컴포넌트 카드가 같이 쓴다 */
export function PopoverDemo({ values = INITIAL, mini }: DemoProps) {
  const [open, setOpen] = useState(false);
  // 카드 속 미니가 서 있을 때(멈춤, 축소 모션, 화면 밖) 트리거 단추만이 아니라 열린 대표 장면을 보인다
  const [still, setStill] = useState(false);

  return (
    // 팝오버는 포털이 아니라 인라인이고 열릴 때 포커스를 가져가므로, 자동 시연 중에는 무대 안을 inert로 둔다
    <Stage
      mini={mini}
      label="Popover 시연"
      script={SCRIPT}
      onPause={() => setOpen(false)}
      onStill={setStill}
      lockWhilePlaying
    >
      <Popover
        open={open || still}
        onOpenChange={setOpen}
        position={values.position as Position}
        arrow={values.arrow === true}
        content={
          <div style={{ display: 'grid', gap: 8, padding: 12 }}>
            <p style={{ margin: 0 }}>김태인</p>
            <Button size="sm" variant="light" onClick={() => setOpen(false)}>
              로그아웃
            </Button>
          </div>
        }
      >
        <Button data-stage-target="trigger" size="sm">
          계정
        </Button>
      </Popover>
      {/* 바깥 누름을 보이는 자리. 무대 왼쪽 아래 구석이다 */}
      <span
        data-stage-target="away"
        style={{
          position: 'fixed',
          left: 16,
          bottom: 16,
          fontSize: '0.875rem',
          color: t.MUTED,
        }}
      >
        바깥 영역
      </span>
    </Stage>
  );
}

export function PopoverPage() {
  const [values, setValues] = useState<Values>(INITIAL);

  return (
    <DetailLayout
      name="Popover"
      lead={LEAD}
      stage={<PopoverDemo values={values} />}
      customize={
        <Customize controls={CONTROLS} values={values} onChange={setValues} />
      }
      code={codeOf({
        component: 'Popover',
        values: {
          open: true,
          onOpenChange: true,
          content: true,
          ...values,
          children: '<Button>계정</Button>',
        },
        defaults: DEFAULTS,
        notation: NOTATION,
      })}
      props={PROPS}
      usage={<Usage />}
      a11y={<A11y />}
    />
  );
}
