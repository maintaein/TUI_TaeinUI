import { useCallback, useState } from 'react';
import { Button, CodeSlots } from '@taein-ui/core';
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
  '인증번호와 PIN을 넣는 칸. 숫자가 슬롯처럼 위에서 굴러 들어오고, 틀리면 칸이 왼쪽부터 물결치고, 맞으면 두 박자로 칸들이 하나의 알약으로 합쳐집니다.';

const CONTROLS: Control[] = [
  { prop: 'label', kind: 'text' },
  { prop: 'length', kind: 'choice', options: ['4', '6'] },
];

const INITIAL: Values = { label: '인증번호', length: '6' };

const PROPS: PropDefinition[] = [
  {
    name: 'label',
    type: 'string',
    required: true,
    description: '접근 가능한 이름이자 보이는 레이블',
  },
  {
    name: 'length',
    type: 'number',
    default: '6',
    description: '칸 수',
  },
  {
    name: 'value',
    type: 'string',
    description: '값(제어). 숫자만 받습니다',
  },
  {
    name: 'defaultValue',
    type: 'string',
    description: '시작 값(비제어)',
  },
  {
    name: 'onChange',
    type: '(value: string) => void',
    description: '값이 바뀔 때 숫자만 남긴 새 값을 받습니다',
  },
  {
    name: 'onComplete',
    type: '(value: string) => void',
    description: 'length자가 다 찼을 때 그 값으로 한 번 불립니다',
  },
  {
    name: 'helperText',
    type: 'string',
    description: '도움말',
  },
  {
    name: 'error',
    type: 'boolean',
    default: 'false',
    description:
      '오류 상태. 칸이 물결치고 테두리가 오류 색이 되며 aria-invalid가 true입니다',
  },
  {
    name: 'errorMessage',
    type: 'string',
    description: '오류 메시지. 보이는 글이고 aria-describedby로 이어집니다',
  },
  {
    name: 'success',
    type: 'boolean',
    default: 'false',
    description:
      '성공 상태. 칸 테두리가 흐려진 뒤 칸이 모여 하나의 알약이 되고 그 테두리가 성공 색입니다. error가 함께 켜지면 error가 이깁니다',
  },
  {
    name: 'successMessage',
    type: 'string',
    description: '성공 메시지. 보이는 글이고 aria-describedby로 이어집니다',
  },
  {
    name: 'disabled',
    type: 'boolean',
    default: 'false',
    description: '입력을 막습니다',
  },
  {
    name: 'className',
    type: 'string',
    description: '루트에 더할 CSS 클래스',
  },
  {
    name: 'ref',
    type: 'Ref<HTMLInputElement>',
    description:
      '숨은 input의 ref. name, autoFocus 같은 그 밖의 input 속성도 그 input으로 갑니다',
  },
];

// 정답은 123456(칸이 4개면 1234)이다. 이 번호를 넣으면 성공, 다른 번호로 칸이 차면 오류다.
const answerOf = (length: number) => '123456'.slice(0, length);

// 대본: 틀린 번호를 넣어 칸이 물결치게 하고, 비운 뒤 맞는 번호를 넣어 칸이 합쳐지게 한다
// 카드 속 미니는 커서가 그려지지 않으니 오가는 시간과 읽을 시간만 줄인다(act.pace). 누름과 효과가 끝나는 시간은 그대로다
const SCRIPT = (act: Act) => {
  act.focus('code');
  act.wait(act.pace(0.4, 0.2));
  act.type('code', '111111');
  act.wait(act.pace(1.8, 1));
  act.clear('code');
  act.wait(act.pace(0.6, 0.3));
  act.type('code', '123456');
  act.wait(act.pace(2.6, 1.4));
  act.clear('code');
  act.blur('code');
  act.home(act.pace(0.6, 0.3));
  act.wait(act.pace(0.6, 0.2));
};

/** 무대 조각. 대본이 틀린 번호와 맞는 번호를 차례로 넣고, 마우스를 올리면 직접 넣어 볼 수 있다 */
export function CodeSlotsDemo({ values, mini }: DemoProps) {
  const label = String((values ?? INITIAL).label);
  // 미니는 대본이 6자리를 넣으므로 칸 수를 6으로 고정한다
  const length = mini || !values ? 6 : Number(values.length);
  const [code, setCode] = useState('');
  const [result, setResult] = useState<'wrong' | 'ok' | null>(null);

  const reset = useCallback(() => {
    setCode('');
    setResult(null);
  }, []);

  return (
    <Stage mini={mini} label="CodeSlots 미리보기" script={SCRIPT}>
      <div style={{ display: 'grid', gap: 12, justifyItems: 'start' }}>
        <CodeSlots
          data-stage-target="code"
          label={label}
          length={length}
          value={code}
          onChange={(next) => {
            setCode(next);
            setResult(null);
          }}
          onComplete={(full) =>
            setResult(full === answerOf(length) ? 'ok' : 'wrong')
          }
          error={result === 'wrong'}
          errorMessage="번호가 맞지 않습니다"
          success={result === 'ok'}
          successMessage="확인했습니다"
        />
        {!mini && (
          <Button variant="light" size="sm" onClick={reset}>
            다시
          </Button>
        )}
      </div>
    </Stage>
  );
}

const USE = `<CodeSlots
  label="인증번호"
  value={code}
  onChange={setCode}
  onComplete={verify}
  error={wrong}
  errorMessage="번호가 맞지 않습니다"
  success={ok}
  successMessage="확인했습니다"
/>`;

function Usage() {
  return (
    <Topics>
      <Topic title="언제 쓰나">
        <p className={t.body}>
          문자나 앱으로 받은 인증번호, 결제 비밀번호 같은 PIN처럼 짧은 숫자 열을
          한 칸에 한 자씩 보여 주며 받을 때 씁니다. 틀렸는지 맞았는지가 칸의
          움직임과 색으로 바로 보입니다.
        </p>
      </Topic>
      <Topic title="성공은 두 박자로 합쳐집니다">
        <p className={t.body}>
          첫 박자(200ms)에는 칸마다의 테두리와 흰 바탕이 함께 흐려지고, 칸 뒤에
          깔린 묶음 하나가 나타나 바탕과 성공 색 테두리를 넘겨받습니다. 칸별 흰
          면이 따로 노는 순간이 없습니다. 둘째 박자(500ms)에는 칸이 가운데로
          모이고 묶음의 폭이 같이 줄며 모서리가 알약만큼 둥글어집니다. 폭은
          scale이 아니라 실제 폭이라 둥근 끝이 찌그러지지 않습니다. 값을 고쳐
          성공이 풀리면 같은 길을 거꾸로 갑니다. 진행 중에 바뀌어도 지금
          모양에서 돌아갑니다.
        </p>
      </Topic>
      <Topic title="입력은 숨은 input 하나">
        <p className={t.body} style={{ marginBottom: 12 }}>
          칸마다 input을 두지 않습니다. 칸 위에 투명하게 겹친 input 하나가
          입력을 받아서 붙여넣기와 문자 자동 채움이 그대로 됩니다. 숫자만 받고,
          length를 넘는 입력은 잘리며, 커서는 늘 끝에 있어 지우기는 Backspace로
          끝에서부터 합니다. length자가 다 차면 onComplete가 한 번 불립니다.
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
        실제 입력은 숨은 <code>input</code> 하나입니다.{' '}
        <code>display: none</code>이 아니라 투명하게 칸 위에 겹쳐 있어 포커스,
        클릭, 붙여넣기를 받습니다. 접근 가능한 이름은 <code>label</code>입니다.
      </li>
      <li>
        <code>inputMode=&quot;numeric&quot;</code>와{' '}
        <code>autoComplete=&quot;one-time-code&quot;</code>가 있어 모바일
        키보드가 숫자판으로 열리고, 문자로 받은 번호를 브라우저가 칸 근처에서
        채워 줍니다.
      </li>
      <li>
        칸 그림은 aria-hidden 장식입니다. 포커스가 가는 곳은 input 하나뿐입니다.
      </li>
      <li>
        오류와 성공은 움직임과 색만으로 알리지 않습니다.{' '}
        <code>errorMessage</code>와 <code>successMessage</code> 글이 보이고{' '}
        <code>aria-describedby</code>로 input에 이어집니다. <code>error</code>
        이면 <code>aria-invalid=&quot;true&quot;</code>입니다.
      </li>
      <li>
        지금 입력할 칸(다 찼으면 마지막 칸)의 테두리에 포커스 링이 보입니다. 칸
        테두리는 바탕과 3:1 이상, 숫자는 4.5:1 이상의 대비입니다.
      </li>
      <li>
        움직임 줄이기에서는 숫자와 색이 움직임 없이 바뀌고, 맞으면 칸이 붙은
        모양으로 바로 보입니다.
      </li>
    </ul>
  );
}

export function CodeSlotsPage() {
  const [values, setValues] = useState<Values>(INITIAL);
  const length = Number(values.length);

  return (
    <DetailLayout
      name="CodeSlots"
      lead={LEAD}
      stage={<CodeSlotsDemo values={values} />}
      customize={
        <Customize controls={CONTROLS} values={values} onChange={setValues} />
      }
      code={`import { CodeSlots } from '@taein-ui/core';

<CodeSlots
  label="${String(values.label)}"${length === 6 ? '' : `\n  length={${length}}`}
  value={code}
  onChange={setCode}
  onComplete={verify}
  error={wrong}
  errorMessage="번호가 맞지 않습니다"
  success={ok}
  successMessage="확인했습니다"
/>`}
      props={PROPS}
      usage={<Usage />}
      a11y={<A11y />}
    />
  );
}
