import { useCallback, useState, type ComponentProps } from 'react';
import { BoardRow } from '@taein-ui/core';
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
  'FAQ나 상세 정보처럼 긴 내용을 제목 아래에 접어 두었다가 펼칩니다. 펼치면 아래 행들이 함께 밀려 납니다.';

const CONTROLS: Control[] = [
  {
    prop: 'variant',
    kind: 'choice',
    options: ['default', 'outlined', 'filled'],
  },
  { prop: 'disabled', kind: 'toggle' },
];

const INITIAL: Values = { variant: 'outlined', disabled: false };

const DEFAULTS: Values = { variant: 'default' };

const TITLE = '배송은 얼마나 걸리나요?';
const BODY = [
  '주문 후 2~3일 이내에 배송됩니다.',
  '도서 산간 지역은 하루가 더 걸립니다.',
  '배송이 시작되면 문자로 알려 드립니다.',
];
// 펼칠 때 아래 행들이 밀리는 모습을 보이려고 두는 이웃 행
const NEIGHBORS = ['반품은 어떻게 하나요?', '결제 수단은 무엇이 있나요?'];

const PROPS: PropDefinition[] = [
  {
    name: 'title',
    type: 'ReactNode',
    required: true,
    description: '제목. 접혀 있어도 늘 보이고 누르는 자리다',
  },
  {
    name: 'children',
    type: 'ReactNode',
    required: true,
    description: '펼쳐졌을 때 보이는 내용',
  },
  {
    name: 'variant',
    type: "'default' | 'outlined' | 'filled'",
    default: "'default'",
    description: '모양. 투명, 테두리, 면 채움',
  },
  {
    name: 'defaultExpanded',
    type: 'boolean',
    default: 'false',
    description: '처음 펼침 여부. 이후는 스스로 관리한다(비제어)',
  },
  {
    name: 'expanded',
    type: 'boolean',
    description: '펼침 여부. 주면 부모가 쥔다(제어)',
  },
  {
    name: 'onChange',
    type: '(expanded: boolean) => void',
    description: '제목을 눌러 펼침이 바뀔 때 부른다. 바뀔 값을 넘긴다',
  },
  {
    name: 'disabled',
    type: 'boolean',
    default: 'false',
    description: '누를 수 없고 흐려진다',
  },
];

const CONTROLLED = `const [open, setOpen] = useState(false);

<button type="button" onClick={() => setOpen(!open)}>
  {open ? '접기' : '펼치기'}
</button>
<BoardRow title="배송 안내" expanded={open} onChange={setOpen}>
  <p>주문 후 2~3일 이내에 배송됩니다.</p>
</BoardRow>`;

const ACCORDION = `const [openIndex, setOpenIndex] = useState<number | null>(null);

{faqs.map((faq, index) => (
  <BoardRow
    key={faq.title}
    title={faq.title}
    expanded={openIndex === index}
    onChange={(next) => setOpenIndex(next ? index : null)}
  >
    <p>{faq.answer}</p>
  </BoardRow>
))}`;

function Usage() {
  return (
    <Topics>
      <Topic title="제어와 비제어">
        <p className={t.body} style={{ marginBottom: 12 }}>
          상태를 따로 챙기지 않아도 되면 <code>defaultExpanded</code>로 처음
          모습만 정하고 나머지는 맡깁니다. 바깥 버튼으로 펼치거나 다른 상태와
          묶어야 하면 <code>expanded</code>와 <code>onChange</code>를 함께
          줍니다. 위 무대가 이 방식입니다.
        </p>
        <CodeBlock code={CONTROLLED} />
      </Topic>
      <Topic title="하나만 펼치기">
        <p className={t.body} style={{ marginBottom: 12 }}>
          여러 행 중 하나만 펼쳐 두려면 제어 방식으로 열린 행의 번호를 하나만
          들고 있습니다. 다른 행을 펼치면 앞의 행은 접힙니다.
        </p>
        <CodeBlock code={ACCORDION} />
      </Topic>
      <Topic title="움직임">
        <p className={t.body}>
          펼치면 높이가 목표보다 8px 더 늘었다가 내려앉으면서 아래 행들을 같이
          밀어 냅니다. 내용은 직계 자식마다 시차를 두고 위에서 내려오고,
          화살표는 돌아가며 넘쳤다 앉습니다. 접을 때는 12px 살짝 부풀었다가
          접히며 펼칠 때보다 짧습니다. 접힌 동안 내용은 Tab 순서에서 빠집니다.
          움직임 줄이기 설정을 켠 환경에서는 애니메이션 없이 바로 바뀝니다.
        </p>
      </Topic>
    </Topics>
  );
}

function A11y() {
  return (
    <ul className={`${t.list} ${t.body}`}>
      <li>
        제목은 <code>button</code>이라 Tab으로 들어가고 Enter와 Space로
        누릅니다. 행이 여럿이면 각 제목 사이를 Tab으로 오갑니다.
      </li>
      <li>
        제목 버튼은 <code>aria-expanded</code>로 펼침 상태를, 그리고{' '}
        <code>aria-controls</code>로 내용 영역을 가리킵니다.
      </li>
      <li>
        내용 영역은 <code>role=&quot;region&quot;</code>이고{' '}
        <code>aria-labelledby</code>로 제목과 이어져 이름을 얻습니다.
      </li>
      <li>
        접힌 내용은 <code>inert</code>라 Tab 순서와 접근성 트리에서 빠집니다.
        접힘 애니메이션이 끝난 뒤에 막습니다.
      </li>
      <li>
        <code>disabled</code>이면 제목 버튼이 <code>disabled</code>가 되어 누를
        수 없습니다.
      </li>
      <li>
        개발자가 직접 해야 합니다. 제목만 보고 내용을 짐작할 수 있게 씁니다.
        &quot;더 보기&quot; 같은 모호한 제목은 피합니다.
      </li>
    </ul>
  );
}

type Variant = ComponentProps<typeof BoardRow>['variant'];

export function BoardRowPage() {
  const [values, setValues] = useState<Values>(INITIAL);
  const [open, setOpen] = useState(false);
  const disabled = values.disabled === true;

  // 누를 때마다 뒤집히는 상태라, 누르기 전에 상태를 맞춰 넘겨받았다 이어 가도 펼침과 닫힘 순서가 어긋나지 않게 한다
  const script = useCallback((act: Act) => {
    act.move('header');
    act.hover('header');
    act.wait(0.5);
    act.call(() => setOpen(false));
    act.press('header');
    act.wait(2.6);
    act.call(() => setOpen(true));
    act.press('header');
    act.wait(1.2);
    act.leave('header');
    act.home();
    act.wait(0.4);
  }, []);

  return (
    <DetailLayout
      name="BoardRow"
      lead={LEAD}
      stage={
        <Stage label="BoardRow 시연" script={script}>
          <div
            // core BoardRow는 data-*를 제목 단추에 달 수 없어 그려진 단추에 이름표를 단다
            ref={(el) =>
              el
                ?.querySelector('button[aria-expanded]')
                ?.setAttribute('data-stage-target', 'header')
            }
            style={{ display: 'grid', gap: '0.5rem', width: '100%' }}
          >
            <BoardRow
              title={TITLE}
              variant={values.variant as Variant}
              disabled={disabled}
              expanded={open && !disabled}
              onChange={setOpen}
            >
              {BODY.map((line) => (
                <p key={line} style={{ margin: 0 }}>
                  {line}
                </p>
              ))}
            </BoardRow>
            {NEIGHBORS.map((title) => (
              <BoardRow
                key={title}
                title={title}
                variant={values.variant as Variant}
              >
                <p style={{ margin: 0 }}>답변이 들어갑니다.</p>
              </BoardRow>
            ))}
          </div>
        </Stage>
      }
      customize={
        <Customize controls={CONTROLS} values={values} onChange={setValues} />
      }
      code={codeOf({
        component: 'BoardRow',
        values: {
          title: TITLE,
          variant: values.variant,
          disabled: values.disabled,
          expanded: true,
          onChange: true,
          children: BODY.map((line) => `<p>${line}</p>`).join('\n  '),
        },
        defaults: DEFAULTS,
        notation: { expanded: { expr: 'open' }, onChange: { expr: 'setOpen' } },
      })}
      props={PROPS}
      usage={<Usage />}
      a11y={<A11y />}
    />
  );
}
