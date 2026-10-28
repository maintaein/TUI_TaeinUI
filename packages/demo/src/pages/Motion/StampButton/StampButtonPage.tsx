import { useCallback, useState } from 'react';
import { Button, StampButton, themeContract } from '@taein-ui/core';
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
  '결재와 제출 단추. 누르면 도장이 위에서 내려와 쾅 찍히고, 도장 둘레로 옅은 파란 인주가 번집니다. 한 번만 찍히고, 다시 찍으려면 새로 그립니다.';

const CONTROLS: Control[] = [
  { prop: 'stampLabel', kind: 'text', label: '도장 글자' },
];

const INITIAL: Values = { stampLabel: '승인' };

const PROPS: PropDefinition[] = [
  {
    name: 'children',
    type: 'ReactNode',
    required: true,
    description: '단추 글자. 접근 가능한 이름이다',
  },
  {
    name: 'stampLabel',
    type: 'string',
    default: "'승인'",
    description: '도장 글자. 찍힌 뒤 role="status"가 읽는 문장에도 들어간다',
  },
  {
    name: 'onClick',
    type: 'MouseEventHandler<HTMLButtonElement>',
    description:
      '네이티브 click. 찍기 전에 불리고 preventDefault()하면 찍지 않는다. 찍힌 뒤에는 다시 불리지 않는다',
  },
  {
    name: 'disabled',
    type: 'boolean',
    default: 'false',
    description: '비활성화 상태. 찍히지 않고 onClick도 불리지 않는다',
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

// 커서가 눌러 찍고, 인주가 번지고 자리 잡을 때까지 보인 뒤 다시 시작한다. 단추를 새로 세우는 일을 맨 앞에 두어
// 사용자가 만져 찍어 둔 뒤에도 순서가 맞는다
const SCRIPT = (act: Act, reset: () => void) => {
  act.call(reset);
  act.move('stamp');
  act.wait(0.3);
  act.press('stamp');
  act.wait(1.8);
  act.home();
  act.wait(0.4);
};

/** 무대 조각. 대본의 커서가 찍고 새로 세우기를 반복하고, 마우스를 올리면 직접 찍어 볼 수 있다 */
export function StampButtonDemo({ values = INITIAL, mini }: DemoProps) {
  // 단추를 새로 세우는 번호. 바꾸면 도장이 사라지고 처음 상태로 돌아간다
  const [round, setRound] = useState(0);
  const [submits, setSubmits] = useState(0);
  const reset = useCallback(() => {
    setSubmits(0);
    setRound((n) => n + 1);
  }, []);
  const script = useCallback((act: Act) => SCRIPT(act, reset), [reset]);

  return (
    <Stage mini={mini} label="StampButton 미리보기" script={script}>
      <div style={{ display: 'grid', gap: 12, justifyItems: 'center' }}>
        <StampButton
          key={round}
          data-stage-target="stamp"
          stampLabel={String(values.stampLabel)}
          onClick={() => setSubmits((n) => n + 1)}
        >
          제출
        </StampButton>
        <span
          style={{
            fontSize: themeContract.font.size.sm,
            color: themeContract.color.text.secondary,
          }}
        >
          제출 {submits}번
        </span>
        {!mini && (
          <Button variant="light" size="sm" onClick={reset}>
            다시 찍기
          </Button>
        )}
      </div>
    </Stage>
  );
}

const USE = `<StampButton stampLabel="승인" onClick={submit}>
  제출
</StampButton>

// 다시 찍으려면 key를 바꿔 새로 그립니다
<StampButton key={round} onClick={submit}>제출</StampButton>`;

function Usage() {
  return (
    <Topics>
      <Topic title="언제 쓰나">
        <p className={t.body}>
          결재, 제출, 승인처럼 한 번 하면 끝나는 확정 단추에 씁니다. 누른 일이
          도장으로 남아 되돌릴 수 없는 일이라는 느낌을 줍니다.
        </p>
      </Topic>
      <Topic title="다시 찍기는 key로">
        <p className={t.body} style={{ marginBottom: 12 }}>
          찍힌 단추를 되돌리는 prop은 없습니다. 다시 찍게 하려면{' '}
          <code>key</code>를 바꿔 단추를 새로 그립니다. 도장과 잠금이 모두 처음
          상태로 돌아갑니다.
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
        한 번만 찍힙니다. 찍힌 뒤에는{' '}
        <code>aria-disabled=&quot;true&quot;</code>로 잠가 click, Enter, Space
        어느 쪽으로도 <code>onClick</code>이 다시 불리지 않습니다.{' '}
        <code>disabled</code> 속성이 아니라서 포커스는 단추에 남습니다.
      </li>
      <li>
        찍히면 <code>role=&quot;status&quot;</code>가 &quot;승인 도장을
        찍었습니다&quot; 꼴의 문장을 한 번 알립니다.
      </li>
      <li>
        도장과 인주 자국은 <code>aria-hidden</code> 장식입니다. 단추의 이름은
        children 그대로입니다.
      </li>
      <li>
        되돌리기는 <code>key</code>로 합니다. 새로 그려진 단추는 처음 상태이고
        알림도 비어 있습니다.
      </li>
      <li>
        움직임 줄이기에서는 도장과 인주 자국이 움직임 없이 바로 나타납니다.
      </li>
      <li>
        개발자가 직접 해야 합니다. 도장은 &quot;눌렀다&quot;는 피드백일 뿐
        제출의 성공은 아닙니다. 실패하면 <code>onClick</code>에서{' '}
        <code>preventDefault()</code>하거나 <code>key</code>로 다시 세우고,
        결과는 화면에서 따로 알려야 합니다.
      </li>
    </ul>
  );
}

export function StampButtonPage() {
  const [values, setValues] = useState<Values>(INITIAL);

  return (
    <DetailLayout
      name="StampButton"
      lead={LEAD}
      stage={<StampButtonDemo values={values} />}
      customize={
        <Customize controls={CONTROLS} values={values} onChange={setValues} />
      }
      code={`import { StampButton } from '@taein-ui/core';

<StampButton stampLabel="${String(values.stampLabel)}" onClick={submit}>
  제출
</StampButton>`}
      props={PROPS}
      usage={<Usage />}
      a11y={<A11y />}
    />
  );
}
