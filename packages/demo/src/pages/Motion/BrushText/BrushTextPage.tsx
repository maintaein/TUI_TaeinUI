import { useContext, useState } from 'react';
import { BrushText, Button } from '@taein-ui/core';
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
import { MiniFrozen, Stage, type DemoProps } from '../../../components/Stage';
import * as styles from './BrushTextPage.css';

const LEAD =
  '붓글씨 글자. 문장이 붓으로 한 글자씩 쓰이듯 나타납니다. 단단한 붓 앞머리가 자모마다 획 방향으로 일정한 속도로 쓸고 지나가며 글자를 드러내고, 획 사이에는 붓을 드는 쉼이 있습니다. 화면에 들어올 때 한 번 쓰고 끝나면 평범한 문장으로 남습니다.';

const CONTROLS: Control[] = [
  { prop: 'text', kind: 'text' },
  { prop: 'as', kind: 'choice', options: ['h1', 'h2', 'p'] },
];

const INITIAL: Values = {
  text: '한 획 한 획',
  as: 'h2',
};

const DEFAULTS: Values = { as: 'p' };

const PROPS: PropDefinition[] = [
  {
    name: 'text',
    type: 'string',
    required: true,
    description:
      '붓으로 쓸 문장. 바뀌어도 다시 쓰지 않고 새 문장을 완성된 채로 보인다',
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
    description:
      '루트 요소에 더할 CSS 클래스. 글자 크기와 굵기, 붓 글꼴은 여기서 준다',
  },
  {
    name: 'ref',
    type: 'Ref<HTMLElement>',
    description: '루트 요소의 ref',
  },
];

const FONT = `/* 붓 글꼴은 컴포넌트가 들고 있지 않습니다. 부모에 font-family를 주면 그대로 씁니다 */
@font-face {
  font-family: 'Nanum Brush Script';
  src: url('/fonts/NanumBrushScript-Regular.woff2') format('woff2');
  font-display: swap;
}

.hero {
  font-family: 'Nanum Brush Script', sans-serif;
  font-size: 2.75rem;
}`;

const REPLAY = `const [run, setRun] = useState(0);

<BrushText key={run} className="hero" text="한 획 한 획" />
<Button onClick={() => setRun((n) => n + 1)}>다시 쓰기</Button>`;

function Usage() {
  return (
    <Topics>
      <Topic title="언제 쓰나">
        <p className={t.body}>
          첫 화면 소개 문장이나 섹션 제목처럼 한 번 눈길을 끌 짧은 문장 한두
          줄에 씁니다. 마스크가 쓸고 지나가는 동안 화면이 계속 다시 그려지므로
          긴 문단에는 쓰지 않습니다. 획 하나는 150ms이고 전체 길이가 3초를
          넘으면 획과 쉼이 같은 비율로 빨라지며, 화면 밖에서는 쓰기를 시작하지
          않아 비용을 묶습니다.
        </p>
      </Topic>
      <Topic title="붓 글꼴">
        <p className={t.body} style={{ marginBottom: 12 }}>
          컴포넌트는 글꼴을 들고 있지 않고 부모의 <code>font-family</code>를
          그대로 씁니다. 이 페이지는 나눔붓글씨(Nanum Brush Script, SIL OFL)를
          직접 호스팅해 씁니다. 붓 글꼴이 아니어도 움직임은 같습니다. 글꼴이
          오기 전에는 쓰기를 시작하지 않고 최대 3초 기다립니다.
        </p>
        <CodeBlock code={FONT} />
      </Topic>
      <Topic title="다시 쓰기">
        <p className={t.body} style={{ marginBottom: 12 }}>
          화면에 들어올 때 한 번만 씁니다. <code>text</code>가 바뀌어도 다시
          쓰지 않고 새 문장을 바로 보여 줍니다. 처음부터 다시 보이려면{' '}
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
        완성 문장을 화면에서 가린 span에 넣어 보조 기술이 읽습니다. 붓으로
        쓰이는 시각 글자는 <code>aria-hidden</code>이라 조각이 따로 읽히지
        않습니다.
      </li>
      <li>다 쓰고 나면 진짜 글자만 남아 선택, 복사, 확대가 평소처럼 됩니다.</li>
      <li>
        줄바꿈은 낱말 단위입니다. 낱말 하나가 한 덩어리로 묶여 낱말 중간에서
        줄이 갈리지 않습니다.
      </li>
      <li>움직임 줄이기에서는 완성 문장을 바로 보여 줍니다.</li>
      <li>
        개발자가 직접 해야 합니다. 문장이 제목이면 <code>as</code>로 문서의 제목
        단계에 맞는 <code>h1</code>부터 <code>h6</code> 중 하나를 고릅니다. 붓
        글꼴을 쓸 때는 획이 가늘어 읽기 어렵지 않은지 글자 크기와 대비를
        확인합니다.
      </li>
    </ul>
  );
}

/** 무대 조각. 다시 쓰기 단추가 key를 바꿔 새로 마운트한다 */
export function BrushTextDemo({ values = INITIAL, mini }: DemoProps) {
  const [run, setRun] = useState(0);
  const as = values.as as 'h1' | 'h2' | 'p';
  // 카드 미니는 "움직임 멈춤"이 켜지면 완성 문장으로 서고, 꺼지면 key가 바뀌어 새로 쓴다
  const frozen = useContext(MiniFrozen) && !!mini;

  return (
    <Stage mini={mini} label="BrushText 미리보기">
      <div className={styles.stack}>
        <BrushText
          key={`${run}-${frozen}`}
          as={as}
          className={
            frozen ? `${styles.sentence} ${styles.still}` : styles.sentence
          }
          text={String(values.text)}
        />
        {!mini && (
          <Button
            size="sm"
            variant="light"
            onClick={() => setRun((n) => n + 1)}
          >
            다시 쓰기
          </Button>
        )}
      </div>
    </Stage>
  );
}

export function BrushTextPage() {
  const [values, setValues] = useState<Values>(INITIAL);

  return (
    <DetailLayout
      name="BrushText"
      lead={LEAD}
      stage={<BrushTextDemo values={values} />}
      customize={
        <Customize controls={CONTROLS} values={values} onChange={setValues} />
      }
      code={codeOf({
        component: 'BrushText',
        values: { text: values.text, as: values.as },
        defaults: DEFAULTS,
      })}
      props={PROPS}
      usage={<Usage />}
      a11y={<A11y />}
    />
  );
}
