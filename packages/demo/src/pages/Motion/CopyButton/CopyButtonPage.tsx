import { useState, type MouseEvent } from 'react';
import { CopyButton } from '@taein-ui/core';
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
  '복사 단추. 누르면 클립보드 아이콘이 접히며 체크 선이 그려지고, 글자 "복사"는 위로 빠지며 "복사됨"이 아래에서 올라옵니다. 잠시 뒤 거꾸로 돌아옵니다.';

const CONTROLS: Control[] = [
  { prop: 'value', kind: 'text' },
  { prop: 'label', kind: 'text' },
  { prop: 'copiedLabel', kind: 'text' },
];

const INITIAL: Values = {
  value: 'pnpm add @taein-ui/core',
  label: '복사',
  copiedLabel: '복사됨',
};

const DEFAULTS: Values = { label: '복사', copiedLabel: '복사됨' };

const PROPS: PropDefinition[] = [
  {
    name: 'value',
    type: 'string',
    required: true,
    description: '복사할 글',
  },
  {
    name: 'label',
    type: 'string',
    default: "'복사'",
    description:
      '평소 글자. 단추의 접근 가능한 이름이며 복사 뒤에도 바뀌지 않는다',
  },
  {
    name: 'copiedLabel',
    type: 'string',
    default: "'복사됨'",
    description: '복사가 성공했을 때 글자',
  },
  {
    name: 'failedLabel',
    type: 'string',
    default: "'복사 실패'",
    description: '클립보드가 없거나 쓰기가 거절됐을 때 글자',
  },
  {
    name: 'onCopy',
    type: '(ok: boolean) => void',
    description:
      '복사 결과. 성공이면 true. 비활성이거나 onClick이 preventDefault했으면 부르지 않는다. 네이티브 onCopy(클립보드 이벤트)는 받지 않는다',
  },
  {
    name: 'disabled',
    type: 'boolean',
    default: 'false',
    description: '비활성화 상태. 복사하지 않는다',
  },
  {
    name: 'onClick',
    type: 'MouseEventHandler<HTMLButtonElement>',
    description:
      '복사보다 먼저 불린다. 여기서 preventDefault하면 복사하지 않는다',
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

// 커서가 단추를 눌러 복사됨을 보이고 평소로 돌아올 때까지 기다린 뒤 쉬는 자리로 돌아간다
// ponytail: 쉬는 시간 2.2초는 되돌아오는 시간(1.5초)과 읽을 시간을 합친 값이다, loop.base가 바뀌면 같이 고친다
const SCRIPT = (act: Act) => {
  act.move('copy');
  act.wait(0.3);
  act.press('copy');
  act.wait(2.2);
  act.home();
  act.wait(0.4);
};

const LISTEN = `<CopyButton
  value={url}
  onCopy={(ok) => {
    if (!ok) showToast('복사하지 못했습니다');
  }}
/>`;

const GUARD = `<CopyButton
  value={code}
  onClick={(event) => {
    // 여기서 막으면 복사하지 않는다
    if (!agreed) event.preventDefault();
  }}
/>`;

function Usage() {
  return (
    <Topics>
      <Topic title="언제 쓰나">
        <p className={t.body}>
          코드 블록의 설치 명령, 공유 링크처럼 글 한 덩어리를 클립보드에 옮기는
          단추에 씁니다. 복사됨 표시를 따로 만들 필요가 없습니다.
        </p>
      </Topic>
      <Topic title="결과 받기">
        <p className={t.body} style={{ marginBottom: 12 }}>
          성공 여부는 <code>onCopy</code>로 받습니다. 클립보드는 보안 연결이
          아니거나 권한이 막히면 없거나 쓰기를 거절하고, 이때는 아이콘이 짧게
          흔들리고 글자가 &quot;복사 실패&quot;가 됩니다.
        </p>
        <CodeBlock code={LISTEN} />
      </Topic>
      <Topic title="복사 전에 막기">
        <p className={t.body} style={{ marginBottom: 12 }}>
          <code>onClick</code>이 먼저 불리고, 거기서{' '}
          <code>event.preventDefault()</code>를 하면 복사하지 않습니다.
        </p>
        <CodeBlock code={GUARD} />
      </Topic>
    </Topics>
  );
}

function A11y() {
  return (
    <ul className={`${t.list} ${t.body}`}>
      <li>
        단추의 이름은 늘 <code>label</code>입니다. 복사된 뒤에도 이름이 바뀌지
        않고, 나머지 두 글자는 낭독에서 빠집니다.
      </li>
      <li>
        결과는 눈에 보이지 않는 <code>aria-live=&quot;polite&quot;</code> 영역이
        &quot;복사됨&quot; 또는 &quot;복사 실패&quot;를 한 번 읽습니다. 평소
        모습으로 돌아오면 영역이 비워집니다.
      </li>
      <li>
        복사됨이 보이는 동안 다시 누르면 다시 복사하고, 돌아오는 시간을 처음부터
        셉니다.
      </li>
      <li>움직임 줄이기에서는 아이콘과 글자가 움직임 없이 바뀝니다.</li>
      <li>
        개발자가 직접 해야 합니다. 클립보드는 보안 연결(HTTPS)에서만 쓸 수
        있으므로, 실패했을 때 안내를 <code>onCopy(false)</code>에서 줍니다.
      </li>
    </ul>
  );
}

// 자동 시연(대본)이 쏘는 합성 click은 방문자의 클립보드에 쓰면 안 된다. 클릭을 처리하는 순간에만
// 쓰기가 성공하는 클립보드를 끼웠다 거둔다. core는 onClick 직후 같은 호출 안에서 navigator.clipboard를
// 읽으므로 마이크로태스크에서 거두면 다른 코드가 끼어들 틈이 없다.
// ponytail: core가 onClick과 clipboard 읽기 사이에 await를 두면 시연이 실패 연출로 바뀐다, e2e(copyButton.spec)가 잡는다
const rehearse = (event: MouseEvent<HTMLButtonElement>) => {
  if (event.nativeEvent.isTrusted) return;
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: () => Promise.resolve() },
    configurable: true,
  });
  queueMicrotask(() => Reflect.deleteProperty(navigator, 'clipboard'));
};

/** 무대 조각. 대본의 커서가 단추를 누르고, 마우스를 올리면 직접 눌러 볼 수 있다 */
export function CopyButtonDemo({ values = INITIAL, mini }: DemoProps) {
  return (
    <Stage mini={mini} label="CopyButton 미리보기" script={SCRIPT}>
      <CopyButton
        data-stage-target="copy"
        value={String(values.value)}
        label={String(values.label)}
        copiedLabel={String(values.copiedLabel)}
        onClick={rehearse}
      />
    </Stage>
  );
}

export function CopyButtonPage() {
  const [values, setValues] = useState<Values>(INITIAL);

  return (
    <DetailLayout
      name="CopyButton"
      lead={LEAD}
      stage={<CopyButtonDemo values={values} />}
      customize={
        <Customize controls={CONTROLS} values={values} onChange={setValues} />
      }
      code={codeOf({
        component: 'CopyButton',
        values,
        defaults: DEFAULTS,
      })}
      props={PROPS}
      usage={<Usage />}
      a11y={<A11y />}
    />
  );
}
