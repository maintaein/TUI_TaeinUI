import { useEffect, useRef, useState } from 'react';
import { GooeySearch } from '@taein-ui/core';
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
import * as styles from './GooeySearchPage.css';

const LEAD =
  '물방울 검색창. 둥근 검색 단추를 누르면 물방울이 떨어져 나가듯 단추가 오른쪽으로 갈라지고, 그 사이로 입력창이 늘어납니다. 닫으면 두 덩어리가 끈적하게 합쳐집니다.';

const CONTROLS: Control[] = [{ prop: 'placeholder', kind: 'text' }];

const INITIAL: Values = { placeholder: '컴포넌트 검색...' };

const NOTATION = {
  open: { expr: 'open' },
  onOpenChange: { expr: 'setOpen' },
  inputProps: {
    expr: '{ value: query, onChange: (e) => setQuery(e.target.value) }',
  },
};

const NAMES = [
  'Button',
  'Checkbox',
  'Chip',
  'Modal',
  'Popover',
  'Switch',
  'TextField',
];

const PROPS: PropDefinition[] = [
  {
    name: 'open',
    type: 'boolean',
    required: true,
    description: '열려 있는지. 부모가 쥐고 core는 상태를 들고 있지 않는다',
  },
  {
    name: 'onOpenChange',
    type: '(next: boolean, event?: Event) => void',
    required: true,
    description:
      '열림이 바뀔 때. 트리거 click, Esc keydown, 바깥 pointerdown이 일으킨 DOM 이벤트를 둘째 인자로 넘긴다',
  },
  {
    name: 'triggerRef',
    type: 'Ref<HTMLButtonElement>',
    description: '트리거 단추의 ref. 단축키로 열 때 쓴다',
  },
  {
    name: 'openLabel',
    type: 'string',
    default: "'검색 열기'",
    description: '닫혀 있을 때 트리거의 이름. 단축키 안내를 넣어도 된다',
  },
  {
    name: 'closeLabel',
    type: 'string',
    default: "'검색 닫기'",
    description: '열려 있을 때 트리거의 이름',
  },
  {
    name: 'inputLabel',
    type: 'string',
    default: "'검색'",
    description: '입력창의 이름',
  },
  {
    name: 'placeholder',
    type: 'string',
    description: '입력창의 안내 글',
  },
  {
    name: 'inputProps',
    type: 'InputHTMLAttributes<HTMLInputElement>',
    description:
      '입력창에 펼칠 속성(value, onChange, onKeyDown, role, aria-*). 입력값은 부모가 쥔다. id, type, className, 이름, 안내 글은 받지 않는다',
  },
  {
    name: 'children',
    type: 'ReactNode',
    description: '결과 목록. 입력창 아래에 놓인다',
  },
  {
    name: 'className',
    type: 'string',
    description: '루트 요소에 더할 CSS 클래스. 폭과 배치는 여기서 정한다',
  },
  {
    name: 'ref',
    type: 'Ref<HTMLDivElement>',
    description: '루트 요소의 ref',
  },
];

// 커서가 검색 단추를 눌러 열고, 입력창이 펼쳐지는 것을 보인 뒤 바깥 영역을 눌러 닫는다
// ponytail: 쉬는 시간 1.8초는 갈라짐(0.75초)과 읽을 시간을 합친 값이다, 모션이 길어지면 같이 늘린다
// 카드 속 미니는 커서가 그려지지 않으니 오가는 시간과 읽을 시간만 줄인다(act.pace). 누름과 효과가 끝나는 시간은 그대로다
const SCRIPT = (act: Act) => {
  act.move('trigger', act.pace(0.6, 0.3));
  act.wait(act.pace(0.3, 0.1));
  act.press('trigger');
  act.wait(act.pace(1.8, 1.4));
  act.move('away', act.pace(0.6, 0.3));
  act.press('away');
  act.wait(act.pace(1.2, 0.8));
  act.home(act.pace(0.6, 0.3));
  act.wait(act.pace(0.4, 0.1));
};

const CONTROLLED = `const [open, setOpen] = useState(false);
const [query, setQuery] = useState('');

<GooeySearch
  open={open}
  onOpenChange={(next) => {
    setOpen(next);
    if (!next) setQuery('');
  }}
  inputProps={{ value: query, onChange: (e) => setQuery(e.target.value) }}
>
  {query && <ResultList query={query} />}
</GooeySearch>`;

const IGNORE = `onOpenChange={(next, event) => {
  // 자동 시연이 쏜 합성 pointerdown은 사용자의 바깥 클릭이 아니다
  if (event?.type === 'pointerdown' && !event.isTrusted) return;
  setOpen(next);
}}`;

function Usage() {
  return (
    <Topics>
      <Topic title="언제 쓰나">
        <p className={t.body}>
          헤더나 도구 막대처럼 좁은 줄에서 평소에는 둥근 단추 하나만 두고,
          누르면 검색창이 펼쳐지게 할 때 씁니다. 늘 열려 있어야 하는 검색창에는{' '}
          <code>TextField</code>를 씁니다.
        </p>
      </Topic>
      <Topic title="부모가 쥐기">
        <p className={t.body} style={{ marginBottom: 12 }}>
          열림 상태, 입력값, 결과 목록은 모두 부모 몫입니다. 닫을 때 입력값을
          비울지도 부모가 정합니다. 결과는 <code>children</code>으로 넘기면
          입력창 아래에 놓입니다.
        </p>
        <CodeBlock code={CONTROLLED} />
      </Topic>
      <Topic title="닫힘을 일으킨 이벤트">
        <p className={t.body} style={{ marginBottom: 12 }}>
          <code>onOpenChange</code>의 둘째 인자로 닫힘을 일으킨 DOM 이벤트가
          옵니다. 어떤 닫힘은 무시하고 싶을 때 이 이벤트를 봅니다.
        </p>
        <CodeBlock code={IGNORE} />
      </Topic>
    </Topics>
  );
}

function A11y() {
  return (
    <ul className={`${t.list} ${t.body}`}>
      <li>
        트리거는 <code>aria-expanded</code>와 입력창을 가리키는{' '}
        <code>aria-controls</code>가 붙은 단추입니다. 이름은{' '}
        <code>openLabel</code>과 <code>closeLabel</code>로 바꿉니다.
      </li>
      <li>
        닫혀 있는 동안 입력창은 <code>inert</code>라 키보드로도 보조 기술로도
        닿지 않습니다. 열린 뒤 펼쳐지기가 끝나면 입력창에 포커스가 옵니다.
      </li>
      <li>
        Esc를 누르면 닫히고 포커스가 트리거로 돌아옵니다. 바깥을 누르면
        닫힙니다.
      </li>
      <li>움직임 줄이기에서는 갈라짐 없이 바로 열리고 닫힙니다.</li>
      <li>
        개발자가 직접 해야 합니다. 결과 목록과 입력창을 잇는 combobox 연결(
        <code>role=&quot;combobox&quot;</code>, <code>aria-expanded</code>,{' '}
        <code>aria-controls</code>, <code>aria-activedescendant</code>)과
        방향키, Enter 처리는 <code>inputProps</code>와 <code>children</code>으로
        직접 넘깁니다.
      </li>
    </ul>
  );
}

/** 무대 조각. 헤더의 검색과는 별개의 독립된 검색창이다 */
export function GooeySearchDemo({ values = INITIAL, mini }: DemoProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  // 카드 속 미니가 서 있을 때(멈춤, 축소 모션, 화면 밖) 단추만이 아니라 열린 대표 장면을 보인다
  const [still, setStill] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const found = query
    ? NAMES.filter((name) => name.toLowerCase().includes(query.toLowerCase()))
    : [];

  // 대본이 누를 대상. core의 트리거 단추는 속성을 받지 않아 여기서 붙인다
  useEffect(() => {
    triggerRef.current?.setAttribute('data-stage-target', 'trigger');
  }, []);

  return (
    <Stage
      mini={mini}
      label="GooeySearch 미리보기"
      script={SCRIPT}
      onPause={() => setOpen(false)}
      onStill={setStill}
      lockWhilePlaying
    >
      <div className={mini ? styles.box : `${styles.box} ${styles.tall}`}>
        <GooeySearch
          open={open || still}
          onOpenChange={(next) => {
            setOpen(next);
            if (!next) setQuery('');
          }}
          triggerRef={triggerRef}
          placeholder={mini ? undefined : String(values.placeholder)}
          inputProps={{
            value: query,
            onChange: (event) => setQuery(event.target.value),
          }}
        >
          {found.length > 0 && (
            <ul className={styles.results}>
              {found.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          )}
        </GooeySearch>
      </div>
      {/* 바깥 누름을 보이는 자리. 무대 왼쪽 아래 구석이다. 카드 미니에서는 글자 없이 대상만 둔다 */}
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
        {mini ? null : '바깥 영역'}
      </span>
    </Stage>
  );
}

export function GooeySearchPage() {
  const [values, setValues] = useState<Values>(INITIAL);

  return (
    <DetailLayout
      name="GooeySearch"
      lead={LEAD}
      stage={<GooeySearchDemo values={values} />}
      customize={
        <Customize controls={CONTROLS} values={values} onChange={setValues} />
      }
      code={codeOf({
        component: 'GooeySearch',
        values: {
          open: true,
          onOpenChange: true,
          inputProps: true,
          ...values,
        },
        defaults: {},
        notation: NOTATION,
      })}
      props={PROPS}
      usage={<Usage />}
      a11y={<A11y />}
    />
  );
}
