import { useCallback, useEffect, useState } from 'react';
import { HoldButton, themeContract } from '@taein-ui/core';
import { CodeBlock } from '../../../components/CodeBlock';
import {
  Customize,
  type Control,
  type Values,
} from '../../../components/Customize';
import { DetailLayout, Topic, Topics } from '../../../components/DetailLayout';
import * as t from '../../../components/DocText';
import type { PropDefinition } from '../../../components/PropsTable';
import { Stage, type Act, type DemoProps } from '../../../components/Stage';

const LEAD =
  '꾹 눌러 확정하는 단추. 누르고 있는 동안 안쪽이 왼쪽부터 차오르고 다 차면 튕기며 실행됩니다. 중간에 떼면 물 빠지듯 되감깁니다. 한 번 눌러 두고 다시 눌러도 실행됩니다.';

const CONTROLS: Control[] = [
  { prop: 'children', kind: 'text', label: '단추 글자' },
  { prop: 'confirmLabel', kind: 'text' },
];

const INITIAL: Values = {
  children: '전부 삭제',
  confirmLabel: '한 번 더 누르면 삭제',
};

const PROPS: PropDefinition[] = [
  {
    name: 'children',
    type: 'ReactNode',
    required: true,
    description: '단추 글자. 평소 접근 가능한 이름이다',
  },
  {
    name: 'onConfirm',
    type: '() => void',
    required: true,
    description:
      '실행 콜백. 홀드를 다 채웠을 때와 두 번 눌러 확정의 두 번째 click이 모두 이것을 부른다',
  },
  {
    name: 'confirmLabel',
    type: 'string',
    default: "'한 번 더 누르면 실행'",
    description:
      '무장 상태 글자. 첫 click 뒤 단추 글자가 이것으로 바뀌고 role="status"가 알린다',
  },
  {
    name: 'disabled',
    type: 'boolean',
    default: 'false',
    description: '비활성화 상태. 어떤 경로로도 실행되지 않는다',
  },
  {
    name: 'onClick',
    type: 'MouseEventHandler<HTMLButtonElement>',
    description:
      '네이티브 click. 실행을 뜻하지 않는다. 손을 떼면 언제나 click이 생기므로 실행은 onConfirm에 둔다',
  },
  {
    name: 'className',
    type: 'string',
    description: '단추에 더할 CSS 클래스',
  },
  {
    name: 'ref',
    type: 'Ref<HTMLButtonElement>',
    description: '단추의 ref. 그 밖의 네이티브 button 속성도 단추로 간다',
  },
];

// 커서가 길게 눌러 채우고 떼는 것을 반복한다. 누른 채 있는 시간은 홀드(1.5초)보다 길게 잡아 실행까지 간다.
// 시작에 단추를 새로 세워 사용자가 만져 무장해 둔 뒤에도 순서가 맞는다
// ponytail: 누름 1.9초와 쉼 2.4초는 홀드 1.5초와 되돌아오는 시간 2초에서 온 값이다, core 상수가 바뀌면 같이 고친다
const SCRIPT = (act: Act, reset: () => void) => {
  act.call(reset);
  act.move('hold');
  act.wait(0.3);
  act.press('hold', 1.9);
  act.wait(2.4);
  act.home();
  act.wait(0.4);
};

// 실행 결과를 보이는 시간. 단추가 처음으로 돌아오는 시간(2초)보다 조금 길다
const RESULT_MS = 2400;

/** 무대 조각. 대본의 커서가 길게 눌러 채우고, 마우스를 올리면 직접 눌러 볼 수 있다 */
export function HoldButtonDemo({ values = INITIAL, mini }: DemoProps) {
  const [done, setDone] = useState(false);
  // 단추를 새로 세우는 번호. 바꾸면 무장과 채움이 처음 상태로 돌아간다
  const [round, setRound] = useState(0);
  const reset = useCallback(() => {
    setDone(false);
    setRound((n) => n + 1);
  }, []);
  const script = useCallback((act: Act) => SCRIPT(act, reset), [reset]);

  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(() => setDone(false), RESULT_MS);
    return () => clearTimeout(timer);
  }, [done]);

  return (
    <Stage mini={mini} label="HoldButton 미리보기" script={script}>
      <div style={{ display: 'grid', gap: 12, justifyItems: 'center' }}>
        <HoldButton
          key={round}
          data-stage-target="hold"
          confirmLabel={String(values.confirmLabel)}
          onConfirm={() => setDone(true)}
        >
          {String(values.children)}
        </HoldButton>
        <span
          style={{
            fontSize: themeContract.font.size.sm,
            color: themeContract.color.text.secondary,
            visibility: done ? 'visible' : 'hidden',
          }}
        >
          삭제했습니다
        </span>
      </div>
    </Stage>
  );
}

const USE = `<HoldButton
  onConfirm={deleteAll}
  confirmLabel="한 번 더 누르면 삭제"
>
  전부 삭제
</HoldButton>`;

function Usage() {
  return (
    <Topics>
      <Topic title="언제 쓰나">
        <p className={t.body}>
          삭제, 결제, 초기화처럼 되돌릴 수 없는 일을 실수로 하지 않게 할 때
          씁니다. 확인 창을 따로 띄우지 않고 단추 하나가 확인까지 맡습니다.
        </p>
      </Topic>
      <Topic title="실행은 onConfirm에">
        <p className={t.body} style={{ marginBottom: 12 }}>
          <code>onConfirm</code>은 홀드를 다 채웠을 때와 두 번 눌러 확정의 두
          번째 click에서 한 번씩 불립니다. 네이티브 <code>onClick</code>은
          실행을 뜻하지 않습니다. 손을 떼면 언제나 click이 생기기 때문입니다.
        </p>
        <CodeBlock code={USE} />
      </Topic>
    </Topics>
  );
}

function A11y() {
  return (
    <ul className={`${t.list} ${t.body}`}>
      <li>
        두 번 눌러 확정: 키를 일정 시간 눌러야만 되는 조작은 WCAG 2.1.1에
        걸리고, 화면 낭독기와 음성 제어는 click 하나만 보냅니다. 그래서 짧게
        누르거나 click 한 번만 해도 단추가 무장하고, 이어서 다시 click하면
        실행됩니다.
      </li>
      <li>
        무장하면 글자가 <code>confirmLabel</code>로 바뀌고 채움이 절반에서
        멈추며, <code>role=&quot;status&quot;</code>가 무장을 알립니다. 실행한
        뒤에도 완료를 알립니다.
      </li>
      <li>
        무장에는 타이머가 없습니다. 시간 제한을 만들지 않으므로 생각할 시간이
        얼마든 괜찮습니다. 포커스가 단추에서 빠지면 무장이 풀립니다.
      </li>
      <li>
        홀드 시간은 1.5초로 고정이고 prop으로 열지 않습니다. 줄일 수 있게 하면
        오조작을 막는다는 단추의 존재 이유가 사라집니다.
      </li>
      <li>
        실행한 뒤 2초 동안은 <code>aria-disabled</code>로 다시 실행되지 않게
        막되, 포커스는 단추에 남아 있습니다.
      </li>
      <li>
        Space와 Enter로도 누르고 있을 수 있습니다. 키를 계속 눌러 생기는 반복
        입력은 무시합니다.
      </li>
      <li>
        움직임 줄이기에서는 누르는 시간은 같고, 차오름이 네 단계로 끊어
        보입니다. 떨림과 튕김은 없습니다.
      </li>
      <li>
        개발자가 직접 해야 합니다. 실행의 결과(삭제됨, 결제됨)는 화면에서 따로
        알려 주세요. 단추는 &quot;실행했습니다&quot;까지만 말합니다.
      </li>
    </ul>
  );
}

export function HoldButtonPage() {
  const [values, setValues] = useState<Values>(INITIAL);

  return (
    <DetailLayout
      name="HoldButton"
      lead={LEAD}
      stage={<HoldButtonDemo values={values} />}
      customize={
        <Customize controls={CONTROLS} values={values} onChange={setValues} />
      }
      code={`import { HoldButton } from '@taein-ui/core';

<HoldButton
  onConfirm={deleteAll}
  confirmLabel="${String(values.confirmLabel)}"
>
  ${String(values.children)}
</HoldButton>`}
      props={PROPS}
      usage={<Usage />}
      a11y={<A11y />}
    />
  );
}
