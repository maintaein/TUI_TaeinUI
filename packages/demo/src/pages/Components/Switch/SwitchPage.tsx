import { useState, type ComponentProps } from 'react';
import { Switch } from '@taein-ui/core';
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

const LEAD = '알림 받기, 자동 저장처럼 눌러서 바로 켜고 끄는 설정에 둡니다.';

const CONTROLS: Control[] = [
  { prop: 'label', kind: 'text' },
  { prop: 'size', kind: 'choice', options: ['sm', 'md', 'lg'] },
  { prop: 'helperText', kind: 'text' },
  { prop: 'errorMessage', kind: 'text' },
  { prop: 'error', kind: 'toggle' },
  { prop: 'required', kind: 'toggle' },
  { prop: 'disabled', kind: 'toggle' },
];

const INITIAL: Values = {
  label: '알림 받기',
  size: 'lg',
  helperText: '',
  errorMessage: '',
  error: false,
  required: false,
  disabled: false,
};

const DEFAULTS: Values = {
  size: 'md',
  helperText: '',
  errorMessage: '',
};

// 커서가 트랙으로 가서 올라타고(손잡이가 살짝 커지고), 눌러 켜고, 한 번 더 눌러 끈다
const SCRIPT = (act: Act) => {
  act.move('track');
  act.hover('track');
  act.wait(0.5);
  act.press('track');
  act.wait(1.3);
  act.press('track');
  act.wait(1);
  act.leave('track');
  act.home();
  act.wait(0.8);
};

const PROPS: PropDefinition[] = [
  {
    name: 'label',
    type: 'string',
    required: true,
    description: '트랙 옆 레이블. 레이블까지 눌리는 영역이다',
  },
  {
    name: 'size',
    type: "'sm' | 'md' | 'lg'",
    default: "'md'",
    description: '트랙과 손잡이 크기',
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
    description:
      '에러 상태. 트랙에 에러 색이 들어가고 aria-invalid가 true가 된다',
  },
  {
    name: 'errorMessage',
    type: 'string',
    description: 'error일 때 아래에 보이는 메시지',
  },
  {
    name: 'checked',
    type: 'boolean',
    description: '켜짐 상태. onChange와 함께 넘겨 부모가 쥔다(제어)',
  },
  {
    name: 'defaultChecked',
    type: 'boolean',
    description: '처음 켜짐 상태. 이후는 컴포넌트가 쥔다(비제어)',
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
    description: '누를 수 없게 한다',
  },
];

const CONTROLLED = `const [notify, setNotify] = useState(false);

<Switch
  label="알림 받기"
  checked={notify}
  onChange={(e) => {
    setNotify(e.target.checked);
    saveSetting('notify', e.target.checked);
  }}
/>`;

const UNCONTROLLED = `<Switch label="자동 저장" name="autosave" defaultChecked />`;

function Usage() {
  return (
    <Topics>
      <Topic title="언제 쓰나">
        <p className={t.body}>
          누르는 즉시 효과가 나는 켜짐과 꺼짐 설정에 씁니다. 알림 받기, 자동
          저장, 다크 모드 같은 자리입니다. 폼을 제출해야 반영되는 선택이나
          항목을 여러 개 고르는 자리에는 Checkbox를 씁니다.
        </p>
      </Topic>
      <Topic title="레이블은 설정의 이름으로">
        <p className={t.body}>
          켜져 있는지는 손잡이 위치로 보이므로 레이블에는 상태를 적지 않고
          설정의 이름을 적습니다. &quot;알림 받기&quot;는 되어도 &quot;알림
          켜짐&quot;은 상태가 바뀌어도 그대로여서 어긋납니다.
        </p>
      </Topic>
      <Topic title="값을 다루는 두 가지 방법">
        <p className={t.body} style={{ marginBottom: 12 }}>
          바뀐 값을 서버에 바로 저장하거나 다른 화면에 반영해야 하면{' '}
          <code>checked</code>와 <code>onChange</code>를 함께 넘겨 부모가 값을
          쥡니다(제어).
        </p>
        <CodeBlock code={CONTROLLED} />
        <p className={t.body} style={{ margin: '16px 0 12px' }}>
          값을 따로 추적하지 않아도 되면 <code>defaultChecked</code>로 처음
          상태만 주고 컴포넌트에 맡깁니다(비제어).
        </p>
        <CodeBlock code={UNCONTROLLED} />
      </Topic>
      <Topic title="움직임">
        <p className={t.body}>
          켜면 손잡이가 트랙을 가로지르며 가속하는 만큼 가로로 늘어나고, 함께
          트랙이 왼쪽부터 파랗게 채워집니다. 도착하면 손잡이는 켜진 크기로
          커집니다. 끄면 같은 길을 거슬러 돌아옵니다. 움직임 줄이기 설정을 켠
          환경에서는 애니메이션 없이 바로 바뀝니다.
        </p>
      </Topic>
    </Topics>
  );
}

function A11y() {
  return (
    <ul className={`${t.list} ${t.body}`}>
      <li>
        입력에 <code>role=&quot;switch&quot;</code>가 붙어 스크린 리더가
        &quot;스위치&quot;로 읽고, 켜짐 여부는 <code>aria-checked</code>가
        전달합니다. 바뀔 때마다 <code>aria-checked</code>도 갱신됩니다.
      </li>
      <li>
        <code>label</code>이 <code>label</code> 요소로 입력과 연결됩니다. 레이블
        글자를 눌러도 바뀌고, 눌리는 영역은 최소 44px입니다.
      </li>
      <li>
        네이티브 체크박스 입력 위에 만들어져 Tab으로 들어가고 Space로 바꿉니다.
        키보드로 포커스가 오면 트랙에 포커스 링이 생깁니다.
      </li>
      <li>
        <code>required</code>이면 입력에 <code>required</code> 속성이 붙고
        레이블 뒤에 <code>*</code>가 붙습니다.
      </li>
      <li>
        <code>error</code>이면 <code>aria-invalid</code>가 <code>true</code>가
        되고, 도움말이나 에러 메시지가 보일 때는 <code>aria-describedby</code>로
        이어집니다.
      </li>
      <li>
        <code>disabled</code>이면 <code>aria-disabled</code>가 <code>true</code>
        가 되고 누를 수 없습니다.
      </li>
      <li>
        레이블은 꼭 줍니다. 개발 중에 <code>label</code>이 비어 있으면 콘솔에
        오류가 나옵니다.
      </li>
    </ul>
  );
}

type Size = ComponentProps<typeof Switch>['size'];

export function SwitchPage() {
  const [values, setValues] = useState<Values>(INITIAL);

  return (
    <DetailLayout
      name="Switch"
      lead={LEAD}
      stage={
        <Stage label="Switch 시연" script={SCRIPT}>
          <Switch
            // 입력은 보이지 않는 겹침이라 보이는 트랙(부모)을 대상으로 삼는다
            ref={(el) =>
              el?.parentElement?.setAttribute('data-stage-target', 'track')
            }
            label={String(values.label)}
            size={values.size as Size}
            helperText={String(values.helperText) || undefined}
            errorMessage={String(values.errorMessage) || undefined}
            error={values.error === true}
            required={values.required === true}
            disabled={values.disabled === true}
          />
        </Stage>
      }
      customize={
        <Customize controls={CONTROLS} values={values} onChange={setValues} />
      }
      code={codeOf({ component: 'Switch', values, defaults: DEFAULTS })}
      props={PROPS}
      usage={<Usage />}
      a11y={<A11y />}
    />
  );
}
