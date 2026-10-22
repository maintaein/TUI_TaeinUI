import { useState, type ComponentProps } from 'react';
import { Button, Snackbar } from '@taein-ui/core';
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
  '저장 완료, 오류 발생처럼 짧은 결과를 화면 모서리에 잠깐 알립니다. 남은 시간이 막대로 줄어들고 마우스를 올리면 막대가 멈춥니다.';

const CONTROLS: Control[] = [
  { prop: 'message', kind: 'text', label: 'message' },
  {
    prop: 'severity',
    kind: 'choice',
    options: ['info', 'success', 'warning', 'error'],
  },
  {
    prop: 'position',
    kind: 'choice',
    options: [
      'top-left',
      'top-center',
      'top-right',
      'bottom-left',
      'bottom-center',
      'bottom-right',
    ],
  },
  {
    prop: 'autoHideDuration',
    kind: 'choice',
    options: ['3000', '4000', '6000'],
  },
];

const INITIAL: Values = {
  message: '저장했습니다',
  severity: 'success',
  position: 'bottom-right',
  autoHideDuration: '4000',
};

const DEFAULTS: Values = {
  severity: 'info',
  position: 'bottom-right',
  autoHideDuration: '6000',
};

const NOTATION = {
  open: { expr: 'open' },
  onClose: { expr: '() => setOpen(false)' },
};

// 커서가 단추를 눌러 스낵바를 띄운다. 스낵바가 자기 구석에서 올라오고 막대가 줄어들다가,
// 커서가 올라가면 막대가 멈춘다(머무름). 떠나면 남은 만큼 다시 줄어들어 사라진다
// shortcut: 쉬는 시간(3.8초)은 autoHideDuration 6000(조작판의 가장 긴 값)까지 사라지기를 기다리는 값이다, 선택지를 늘리면 같이 늘린다
const SCRIPT = (act: Act) => {
  act.move('trigger');
  act.hover('trigger');
  act.wait(0.3);
  act.press('trigger');
  act.leave('trigger');
  act.wait(1.2);
  act.move('snack');
  act.hover('snack');
  act.wait(1.6);
  act.leave('snack');
  act.wait(3.8);
  act.home();
  act.wait(0.4);
};

const PROPS: PropDefinition[] = [
  {
    name: 'open',
    type: 'boolean',
    required: true,
    description: '보일지 여부',
  },
  {
    name: 'message',
    type: 'ReactNode',
    required: true,
    description: '알림 글',
  },
  {
    name: 'severity',
    type: "'success' | 'error' | 'warning' | 'info'",
    default: "'info'",
    description: '종류. 색과 아이콘이 정해진다',
  },
  {
    name: 'position',
    type: "'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'",
    default: "'bottom-right'",
    description:
      '놓일 모서리. 화면에 고정(position: fixed)되고 가장자리에서 24px 떨어진다',
  },
  {
    name: 'autoHideDuration',
    type: 'number | null',
    default: '6000',
    description:
      '자동으로 닫히기까지의 시간(ms). null이면 자동으로 닫히지 않는다. onClose가 없으면 닫을 수 없어 막대도 그리지 않는다',
  },
  {
    name: 'onClose',
    type: '() => void',
    description:
      '닫기 단추, 자동 닫힘, 같은 자리에 네 번째가 열려 밀려날 때(가장 오래된 것) 불린다. 여기서 open을 내린다',
  },
  {
    name: 'action',
    type: 'ReactNode',
    description: '닫기 단추 왼쪽에 놓일 동작(예: 실행 취소 단추)',
  },
  {
    name: 'stack',
    type: 'boolean',
    default: 'true',
    description:
      'false면 같은 자리에서 혼자 보인다. 열릴 때 같은 자리의 다른 스낵바를 닫고, 열려 있는 동안 새것이 열리면 자기가 닫힌다',
  },
];

const BASIC = `const [open, setOpen] = useState(false);

<Button onClick={() => setOpen(true)}>저장</Button>
<Snackbar
  open={open}
  message="저장했습니다"
  severity="success"
  onClose={() => setOpen(false)}
/>`;

const ACTION = `<Snackbar
  open={open}
  message="메일을 삭제했습니다"
  action={<Button size="sm" onClick={undo}>실행 취소</Button>}
  onClose={() => setOpen(false)}
/>`;

const SINGLE = `<Snackbar open={open} message={message} stack={false} onClose={close} />`;

function Usage() {
  return (
    <Topics>
      <Topic title="언제 쓰나">
        <p className={t.body}>
          저장 완료, 전송 실패처럼 방금 한 일의 결과를 짧게 알릴 때 씁니다.
          사용자가 반드시 읽고 답해야 하는 내용은 사라지는 알림에 맡기면 안
          되므로 <code>Modal</code>이 맞습니다.
        </p>
      </Topic>
      <Topic title="열고 닫기">
        <p className={t.body} style={{ marginBottom: 12 }}>
          열림은 부모가 쥡니다. <code>open</code>을 켜면 알림이 자기 모서리에서
          올라오고 닫기 단추나 자동 닫힘이 <code>onClose</code>를 부르면 거기서{' '}
          <code>open</code>을 내립니다. <code>onClose</code>가 없으면 자동으로
          닫히지도, 막대가 줄지도 않습니다.
        </p>
        <CodeBlock code={BASIC} />
      </Topic>
      <Topic title="남은 시간과 멈춤">
        <p className={t.body}>
          아래쪽 막대가 남은 시간을 말합니다. 마우스를 올리거나 안쪽에 키보드
          포커스가 있으면 막대와 시계가 함께 멈추고 떠나면 멈춘 자리에서
          이어집니다. 처음부터 다시 세지 않습니다. 기본은 6초입니다.
        </p>
      </Topic>
      <Topic title="실행 취소 같은 동작">
        <p className={t.body} style={{ marginBottom: 12 }}>
          <code>action</code>에 단추를 넘기면 닫기 단추 왼쪽에 놓입니다.
        </p>
        <CodeBlock code={ACTION} />
      </Topic>
      <Topic title="여러 개가 뜰 때">
        <p className={t.body} style={{ marginBottom: 12 }}>
          같은 자리에 동시에 열린 스낵바는 겹치지 않고 줄을 섭니다. 새것이
          가장자리에 서고 먼저 있던 것은 안쪽으로 밀립니다. 한 자리에 최대
          셋이고, 넷째가 열리면 가장 오래된 것의 <code>onClose</code>가
          불립니다. 하나씩만 보이게 하려면 <code>stack={'{false}'}</code>를
          줍니다. 새것이 이전 것을 바꿔 끼웁니다.
        </p>
        <CodeBlock code={SINGLE} />
      </Topic>
      <Topic title="움직임">
        <p className={t.body}>
          올라올 때는 모서리 쪽에서 300ms 동안 들어오며 나타납니다. 닫힐 때는 그
          방향으로 되돌아 나갑니다. 줄 안쪽의 스낵바는 가는 길에 다른 스낵바가
          있어 미끄러지지 않고 제자리에서 흐려집니다. 움직임 줄이기 설정을 켠
          환경에서는 막대가 부드럽게 줄지 않고 여덟 단계로 끊겨 줄어듭니다.
          시간은 그대로 흐릅니다.
        </p>
      </Topic>
    </Topics>
  );
}

function A11y() {
  return (
    <ul className={`${t.list} ${t.body}`}>
      <li>
        눈에 보이는 스낵바와 별개로 화면에 보이지 않는{' '}
        <code>role=&quot;status&quot;</code> 영역이 하나 있어 메시지를 스크린
        리더에 읽어 줍니다. 아이콘은 소리로 전해지지 않으므로 &quot;성공:
        저장했습니다&quot;처럼 종류가 앞에 붙습니다.
      </li>
      <li>
        닫기 단추의 이름은 &quot;닫기&quot;이고 키보드 포커스를 받으면 포커스
        링이 나옵니다.
      </li>
      <li>
        마우스를 올리거나 안쪽에 포커스가 있으면 자동 닫힘이 멈추어 읽을 시간을
        보장합니다. 마우스와 포커스가 둘 다 빠져야 다시 시작합니다.
      </li>
      <li>
        닫히는 중에는 <code>inert</code>라 단추가 포커스나 클릭을 받지 않습니다.
      </li>
      <li>
        개발자가 직접 해야 합니다. 사용자가 읽어야만 하는 정보는 스낵바로만
        전하지 않습니다. 자동으로 사라지기 때문입니다.
      </li>
    </ul>
  );
}

type Severity = ComponentProps<typeof Snackbar>['severity'];
type Position = ComponentProps<typeof Snackbar>['position'];

export function SnackbarPage() {
  const [values, setValues] = useState<Values>(INITIAL);
  const [open, setOpen] = useState(false);

  return (
    <DetailLayout
      name="Snackbar"
      lead={LEAD}
      stage={
        // 스낵바는 화면에 고정(fixed)이라 무대(contain: layout) 안에서 무대 모서리에 놓인다
        <Stage label="Snackbar 시연" script={SCRIPT}>
          <Button
            data-stage-target="trigger"
            size="sm"
            variant="light"
            onClick={() => setOpen(true)}
          >
            저장
          </Button>
          <Snackbar
            // 열려 있는 채로 position만 바뀌면 core는 등장 때 정한 가운데 맞춤(xPercent)을 다시 잡지 않는다. 위치마다 새로 그려 처음부터 맞게 한다
            key={String(values.position)}
            data-stage-target="snack"
            open={open}
            message={String(values.message)}
            severity={values.severity as Severity}
            position={values.position as Position}
            autoHideDuration={Number(values.autoHideDuration)}
            onClose={() => setOpen(false)}
          />
        </Stage>
      }
      customize={
        <Customize
          controls={CONTROLS}
          values={values}
          // 바꾼 값이 보이도록 닫혀 있으면 다시 띄운다
          onChange={(v) => {
            setValues(v);
            setOpen(true);
          }}
        />
      }
      code={codeOf({
        component: 'Snackbar',
        values: { open: true, ...values, onClose: true },
        defaults: DEFAULTS,
        notation: NOTATION,
      }).replace(/autoHideDuration="(\d+)"/, 'autoHideDuration={$1}')}
      props={PROPS}
      usage={<Usage />}
      a11y={<A11y />}
    />
  );
}
