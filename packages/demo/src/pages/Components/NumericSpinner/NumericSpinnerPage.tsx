import { useState, type ComponentProps } from 'react';
import { NumericSpinner } from '@taein-ui/core';
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
  '수량, 인원수, 페이지 번호처럼 작은 범위의 숫자를 버튼으로 올리고 내리는 자리에 둡니다.';

const CONTROLS: Control[] = [
  { prop: 'label', kind: 'text' },
  { prop: 'size', kind: 'choice', options: ['sm', 'md', 'lg'] },
  { prop: 'helperText', kind: 'text' },
  { prop: 'errorMessage', kind: 'text' },
  { prop: 'error', kind: 'toggle' },
  { prop: 'required', kind: 'toggle' },
  { prop: 'disabled', kind: 'toggle' },
  { prop: 'fullWidth', kind: 'toggle' },
];

const INITIAL: Values = {
  label: '수량',
  size: 'lg',
  helperText: '',
  errorMessage: '',
  error: false,
  required: false,
  disabled: false,
  fullWidth: false,
};

const DEFAULTS: Values = {
  size: 'md',
  helperText: '',
  errorMessage: '',
};

// 시연의 범위. 반복마다 0에서 시작해 0으로 돌아오도록 양 끝에 닿게 한다(길게 누르기의 반복 횟수는 시간에 따라 달라 그 밖에는 값이 밀린다)
const MIN = 0;
const MAX = 30;
const RANGE = {
  min: { expr: String(MIN) },
  max: { expr: String(MAX) },
};

// 커서가 +로 가서 올라타고 몇 번 눌러 값을 올린 뒤, 길게 눌러 반복이 빨라지는 모습을 보이고, -를 길게 눌러 0으로 되돌린다
// 길게 누르기: core가 0.4초 뒤부터 0.16초에서 0.04초로 좁아지는 간격(약 1.2초)으로 반복한다. 양 끝에 닿으면 스스로 멈추므로 끝까지 가기에 넉넉한 시간을 준다
const SCRIPT = (act: Act) => {
  act.move('plus');
  act.hover('plus');
  act.wait(0.4);
  act.press('plus');
  act.wait(0.2);
  act.press('plus');
  act.wait(0.2);
  act.press('plus');
  act.wait(0.6);
  act.press('plus', 2.8);
  act.wait(0.6);
  act.leave('plus');
  act.move('minus');
  act.hover('minus');
  act.wait(0.3);
  act.press('minus', 3);
  act.wait(0.6);
  act.leave('minus');
  act.home();
  act.wait(0.6);
};

const PROPS: PropDefinition[] = [
  {
    name: 'label',
    type: 'string',
    required: true,
    description: '숫자 칸의 이름. 입력칸과 연결된다',
  },
  {
    name: 'size',
    type: "'sm' | 'md' | 'lg'",
    default: "'md'",
    description: '버튼과 숫자 칸 크기',
  },
  {
    name: 'min',
    type: 'number',
    description: '최소값. 닿으면 - 버튼이 꺼진다',
  },
  {
    name: 'max',
    type: 'number',
    description: '최대값. 닿으면 + 버튼이 꺼진다',
  },
  {
    name: 'step',
    type: 'number',
    default: '1',
    description:
      '한 번에 바뀌는 크기. 소수여도 step과 지금 값 중 더 긴 소수 자릿수로 맞춰 오차가 보이지 않는다',
  },
  {
    name: 'value',
    type: 'number',
    description: '현재 값. onChange와 함께 넘겨 부모가 쥔다(제어)',
  },
  {
    name: 'onChange',
    type: '(value: number) => void',
    description: '값이 바뀔 때 부른다. 이벤트가 아니라 바뀐 숫자를 바로 받는다',
  },
  {
    name: 'defaultValue',
    type: 'number',
    description: '처음 값. 이후는 컴포넌트가 쥔다(비제어)',
  },
  {
    name: 'helperText',
    type: 'string',
    description: '아래 도움말. error일 때는 숨고 errorMessage가 대신 보인다',
  },
  {
    name: 'error',
    type: 'boolean',
    default: 'false',
    description: '에러 상태. 숫자 칸 테두리가 에러 색이 된다',
  },
  {
    name: 'errorMessage',
    type: 'string',
    description: 'error일 때 아래에 보이는 메시지',
  },
  {
    name: 'fullWidth',
    type: 'boolean',
    default: 'false',
    description: '부모 폭을 채운다',
  },
  {
    name: 'required',
    type: 'boolean',
    default: 'false',
    description: '필수 항목. 레이블 뒤에 *가 붙는다',
  },
  {
    name: 'disabled',
    type: 'boolean',
    default: 'false',
    description: '누르거나 칠 수 없게 한다',
  },
];

const CONTROLLED = `const [count, setCount] = useState(1);

<NumericSpinner
  label="수량"
  value={count}
  onChange={setCount}
  min={1}
  max={10}
  helperText={\`\${count}개를 담습니다\`}
/>`;

const UNCONTROLLED = `<NumericSpinner label="인원" name="people" defaultValue={2} min={1} />`;

const STEP = `<NumericSpinner label="금액(원)" step={1000} min={0} defaultValue={5000} />

<NumericSpinner label="할인율(%)" step={0.5} min={0} max={100} defaultValue={2.5} />`;

function Usage() {
  return (
    <Topics>
      <Topic title="언제 쓰나">
        <p className={t.body}>
          수량, 인원수, 페이지 번호처럼 범위가 작고 한 칸씩 늘리고 줄이는 숫자에
          씁니다. 범위가 크거나 자유롭게 입력받아야 하는 숫자에는{' '}
          <code>TextField</code>의 <code>type=&quot;number&quot;</code>가
          낫습니다.
        </p>
      </Topic>
      <Topic title="범위와 단위">
        <p className={t.body} style={{ marginBottom: 12 }}>
          <code>min</code>과 <code>max</code>로 범위를 정하고 <code>step</code>
          으로 한 번에 바뀌는 크기를 정합니다. 값이 범위 끝에 닿으면 그 방향의
          버튼이 꺼집니다. 범위는 <code>helperText</code>로도 알려 줍니다.
        </p>
        <CodeBlock code={STEP} />
      </Topic>
      <Topic title="값을 다루는 두 가지 방법">
        <p className={t.body} style={{ marginBottom: 12 }}>
          값에 따라 가격을 계산하거나 다른 곳에 보여 줘야 하면{' '}
          <code>value</code>와 <code>onChange</code>를 함께 넘겨 부모가 값을
          쥡니다(제어). <code>onChange</code>는 이벤트가 아니라 바뀐 숫자를
          받습니다.
        </p>
        <CodeBlock code={CONTROLLED} />
        <p className={t.body} style={{ margin: '16px 0 12px' }}>
          값을 따로 추적하지 않아도 되면 <code>defaultValue</code>로 처음 값만
          주고 컴포넌트에 맡깁니다(비제어). <code>name</code>을 주면 폼 제출 때
          값이 함께 갑니다.
        </p>
        <CodeBlock code={UNCONTROLLED} />
      </Topic>
      <Topic title="길게 누르기와 직접 입력">
        <p className={t.body}>
          버튼을 0.4초 넘게 누르고 있으면 값이 반복해서 바뀝니다. 간격이
          0.16초에서 시작해 약 1.2초에 걸쳐 0.04초까지 좁아지므로 오래 누를수록
          빨리 바뀝니다. 숫자를 직접 칠 수도 있습니다. 치는 동안에는 칸을
          비우거나 범위 밖 숫자를 잠시 둘 수 있고 칸을 벗어나거나 Enter를 누르면{' '}
          <code>min</code>·<code>max</code> 안으로 맞춰 확정합니다. 비었거나
          숫자가 아니면 직전 값으로 돌아갑니다. 칸에서 위·아래 화살표 키를
          누르면 <code>step</code>만큼 오르내립니다.
        </p>
      </Topic>
      <Topic title="움직임">
        <p className={t.body}>
          버튼을 누르면 누른 버튼과 숫자가 함께 깊이 눌리고 떼면 살짝 부풀었다
          내려앉습니다. 숫자는 바뀔 때마다 바뀐 방향으로 조금 밀렸다 제자리를
          잡고 길게 누르면 간격이 좁아지는 만큼 더 빠르게 떨립니다. 숫자 칸의
          테두리는 움직이지 않습니다. 움직임 줄이기 설정을 켠 환경에서는
          애니메이션 없이 값만 바뀝니다.
        </p>
      </Topic>
    </Topics>
  );
}

function A11y() {
  return (
    <ul className={`${t.list} ${t.body}`}>
      <li>
        <code>label</code>이 <code>label</code> 요소로 숫자 칸과 연결됩니다.
        스크린 리더가 칸의 용도를 읽고 레이블을 눌러도 포커스가 갑니다.
      </li>
      <li>
        숫자 칸은 <code>type=&quot;number&quot;</code> 입력이라 스핀 버튼으로
        읽히고 <code>min</code>·<code>max</code>가 그대로 전달되어 범위도
        읽습니다. 읽기 전용이 아니라 직접 칠 수 있습니다.
      </li>
      <li>
        증감 버튼에는 <code>aria-label</code>로 &quot;값 증가&quot;, &quot;값
        감소&quot;가 붙어 있고 누르는 영역은 최소 44px입니다. 범위 끝에 닿으면
        그 버튼은 <code>disabled</code>가 됩니다.
      </li>
      <li>
        키보드에서는 버튼에 Tab으로 들어가 Space나 Enter로 누릅니다. 누르고
        있으면 마우스와 같이 반복합니다. 숫자 칸에서는 위·아래 화살표 키가{' '}
        <code>step</code>만큼 값을 바꿉니다.
      </li>
      <li>
        <code>required</code>이면 입력에 <code>required</code> 속성이 붙고
        레이블 뒤에 <code>*</code>가 붙습니다.
      </li>
      <li>
        <code>error</code>이면 <code>aria-invalid</code>가 <code>true</code>가
        되고 도움말이나 에러 메시지가 보일 때는 <code>aria-describedby</code>로
        이어집니다.
      </li>
      <li>
        <code>disabled</code>이면 <code>aria-disabled</code>가 <code>true</code>
        가 되고 누르거나 칠 수 없습니다.
      </li>
      <li>
        레이블은 꼭 줍니다. 단위를 함께 적으면 숫자의 뜻이 분명해집니다. 개발
        중에 <code>label</code>이 비어 있으면 콘솔에 오류가 나옵니다.
      </li>
    </ul>
  );
}

type Size = ComponentProps<typeof NumericSpinner>['size'];

export function NumericSpinnerPage() {
  const [values, setValues] = useState<Values>(INITIAL);

  return (
    <DetailLayout
      name="NumericSpinner"
      lead={LEAD}
      stage={
        <Stage label="NumericSpinner 시연" script={SCRIPT}>
          <NumericSpinner
            // 증감 버튼은 숫자 칸 상자의 앞뒤 형제라 입력에서 찾아 대상 이름을 붙인다
            ref={(el) => {
              const box = el?.parentElement;
              box?.previousElementSibling?.setAttribute(
                'data-stage-target',
                'minus'
              );
              box?.nextElementSibling?.setAttribute(
                'data-stage-target',
                'plus'
              );
            }}
            label={String(values.label)}
            size={values.size as Size}
            min={MIN}
            max={MAX}
            helperText={String(values.helperText) || undefined}
            errorMessage={String(values.errorMessage) || undefined}
            error={values.error === true}
            required={values.required === true}
            disabled={values.disabled === true}
            fullWidth={values.fullWidth === true}
          />
        </Stage>
      }
      customize={
        <Customize controls={CONTROLS} values={values} onChange={setValues} />
      }
      code={codeOf({
        component: 'NumericSpinner',
        values: { ...values, min: true, max: true },
        defaults: DEFAULTS,
        notation: RANGE,
      })}
      props={PROPS}
      usage={<Usage />}
      a11y={<A11y />}
    />
  );
}
