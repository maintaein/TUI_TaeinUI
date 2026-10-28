import { useState } from 'react';
import { Button, HangulAssemble } from '@taein-ui/core';
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
import { Stage, type DemoProps } from '../../../components/Stage';
import * as styles from './HangulAssemblePage.css';

const LEAD =
  '한글 조립. 흩어진 자모가 글자 칸으로 날아와 모이며 한글 글자가 됩니다. 화면에 들어올 때 한 번 재생하고 끝나면 평범한 문장으로 남습니다.';

const CONTROLS: Control[] = [
  { prop: 'text', kind: 'text' },
  { prop: 'as', kind: 'choice', options: ['h1', 'h2', 'p'] },
];

const INITIAL: Values = {
  text: '흩어진 자모가 모여 글자가 됩니다',
  as: 'h2',
};

const DEFAULTS: Values = { as: 'p' };

const PROPS: PropDefinition[] = [
  {
    name: 'text',
    type: 'string',
    required: true,
    description:
      '조립해 보일 문장. 바뀌어도 다시 재생하지 않고 새 문장을 완성된 채로 보인다',
  },
  {
    name: 'as',
    type: "'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div'",
    default: "'p'",
    description: '루트 요소. 문장이 문서에서 맡는 뜻에 맞게 고른다',
  },
  {
    name: 'className',
    type: 'string',
    description: '루트 요소에 더할 CSS 클래스. 글자 크기와 굵기는 여기서 준다',
  },
  {
    name: 'ref',
    type: 'Ref<HTMLElement>',
    description: '루트 요소의 ref',
  },
];

const REPLAY = `const [run, setRun] = useState(0);

<HangulAssemble key={run} text="흩어진 자모가 모여 글자가 됩니다" />
<Button onClick={() => setRun((n) => n + 1)}>다시 재생</Button>`;

function Usage() {
  return (
    <Topics>
      <Topic title="언제 쓰나">
        <p className={t.body}>
          첫 화면 소개 문장이나 섹션 제목처럼 한 번 눈길을 끌 짧은 문장에
          씁니다. 본문 단락이나 계속 바뀌는 글에는 쓰지 않습니다. 글자 크기와
          굵기는 <code>className</code>으로 줍니다.
        </p>
      </Topic>
      <Topic title="다시 재생">
        <p className={t.body} style={{ marginBottom: 12 }}>
          화면에 들어올 때 한 번만 재생합니다. <code>text</code>가 바뀌어도 다시
          재생하지 않고 새 문장을 바로 보여 줍니다. 처음부터 다시 보이려면{' '}
          <code>key</code>를 바꿔 새로 마운트합니다.
        </p>
        <CodeBlock code={REPLAY} />
      </Topic>
    </Topics>
  );
}

function A11y() {
  return (
    <ul className={`${t.list} ${t.body}`}>
      <li>
        완성 문장을 화면에서 가린 span에 넣어 보조 기술이 읽습니다. 흩어지고
        모이는 시각 글자는 <code>aria-hidden</code>이라 자모가 따로 읽히지
        않습니다.
      </li>
      <li>
        줄바꿈은 낱말 단위입니다. 낱말 하나가 한 덩어리로 묶여 낱말 중간에서
        줄이 갈리지 않습니다.
      </li>
      <li>움직임 줄이기에서는 완성 문장을 바로 보여 줍니다.</li>
      <li>
        개발자가 직접 해야 합니다. 문장이 제목이면 <code>as</code>로 문서의 제목
        단계에 맞는 <code>h1</code>부터 <code>h6</code> 중 하나를 고릅니다.
      </li>
    </ul>
  );
}

/** 무대 조각. 다시 재생 단추가 key를 바꿔 새로 마운트한다 */
export function HangulAssembleDemo({ values = INITIAL, mini }: DemoProps) {
  const [run, setRun] = useState(0);
  const as = values.as as 'h1' | 'h2' | 'p';

  return (
    <Stage mini={mini} label="HangulAssemble 미리보기">
      <div className={styles.stack}>
        <HangulAssemble
          key={run}
          as={as}
          className={styles.sentence}
          text={String(values.text)}
        />
        {!mini && (
          <Button
            size="sm"
            variant="light"
            onClick={() => setRun((n) => n + 1)}
          >
            다시 재생
          </Button>
        )}
      </div>
    </Stage>
  );
}

export function HangulAssemblePage() {
  const [values, setValues] = useState<Values>(INITIAL);

  return (
    <DetailLayout
      name="HangulAssemble"
      lead={LEAD}
      stage={<HangulAssembleDemo values={values} />}
      customize={
        <Customize controls={CONTROLS} values={values} onChange={setValues} />
      }
      code={codeOf({
        component: 'HangulAssemble',
        values: { text: values.text, as: values.as },
        defaults: DEFAULTS,
      })}
      props={PROPS}
      usage={<Usage />}
      a11y={<A11y />}
    />
  );
}
