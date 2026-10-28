import { useState } from 'react';
import { JellyText } from '@taein-ui/core';
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
import * as styles from './JellyTextPage.css';

const LEAD =
  '젤리 글자. 커서가 지나가는 글자가 가로로 늘었다가 세로로 눌리며 출렁이고, 스프링처럼 제자리로 돌아옵니다.';

const CONTROLS: Control[] = [
  { prop: 'text', kind: 'text' },
  { prop: 'as', kind: 'choice', options: ['h1', 'h2', 'p'] },
];

const INITIAL: Values = {
  text: '말랑말랑 젤리 글자',
  as: 'h2',
};

const DEFAULTS: Values = { as: 'p' };

const PROPS: PropDefinition[] = [
  {
    name: 'text',
    type: 'string',
    required: true,
    description:
      '보여 줄 문장. 바뀌면 새 문장이 평범한 글자로 서고 다시 반응한다',
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

// 커서가 문장 위를 한 번 쓸고 지나간 뒤 쉬는 자리로 돌아간다
const SCRIPT = (act: Act) => {
  act.sweep('sentence');
  act.wait(0.9);
  act.home();
  act.wait(0.6);
};

function Usage() {
  return (
    <Topics>
      <Topic title="언제 쓰나">
        <p className={t.body}>
          히어로 문구나 브랜드 슬로건처럼 마우스를 올려 볼 만한 짧은 문장에
          씁니다. 본문 단락이나 길게 읽는 글에는 쓰지 않습니다. 글자 크기와
          굵기는 <code>className</code>으로 줍니다.
        </p>
      </Topic>
      <Topic title="어떻게 움직이나">
        <p className={t.body}>
          커서와 가까운 글자가 가장 크게 늘고, 한 칸 떨어지면 절반쯤, 두 칸
          떨어지면 늘지 않습니다. 커서가 있는 줄의 글자만 반응합니다. 늘어나는
          동안 세로로는 그만큼 눌려 글자의 부피는 그대로입니다. 아직 출렁이는
          글자 위로 커서가 다시 오면 지금 모양에서 곧바로 다시 늘어납니다.
        </p>
      </Topic>
    </Topics>
  );
}

function A11y() {
  return (
    <ul className={`${t.list} ${t.body}`}>
      <li>
        완성 문장을 화면에서 가린 span에 넣어 보조 기술이 읽습니다. 움직이는
        시각 글자는 <code>aria-hidden</code>이라 글자가 따로 읽히지 않습니다.
      </li>
      <li>
        줄바꿈은 낱말 단위입니다. 낱말 하나가 한 덩어리로 묶여 낱말 중간에서
        줄이 갈리지 않습니다.
      </li>
      <li>움직임 줄이기에서는 평범한 글자로 보이고 출렁이지 않습니다.</li>
      <li>터치 화면에서는 평범한 글자로 보입니다.</li>
      <li>
        개발자가 직접 해야 합니다. 문장이 제목이면 <code>as</code>로 문서의 제목
        단계에 맞는 <code>h1</code>부터 <code>h6</code> 중 하나를 고릅니다.
      </li>
    </ul>
  );
}

/** 무대 조각. 대본의 커서가 문장 위를 지나가고, 마우스를 올리면 직접 만져 볼 수 있다 */
export function JellyTextDemo({ values = INITIAL, mini }: DemoProps) {
  const as = values.as as 'h1' | 'h2' | 'p';

  return (
    <Stage mini={mini} label="JellyText 미리보기" script={SCRIPT}>
      <div data-stage-target="sentence" className={styles.track}>
        <JellyText
          as={as}
          className={styles.sentence}
          text={String(values.text)}
        />
      </div>
    </Stage>
  );
}

export function JellyTextPage() {
  const [values, setValues] = useState<Values>(INITIAL);

  return (
    <DetailLayout
      name="JellyText"
      lead={LEAD}
      stage={<JellyTextDemo values={values} />}
      customize={
        <Customize controls={CONTROLS} values={values} onChange={setValues} />
      }
      code={codeOf({
        component: 'JellyText',
        values: { text: values.text, as: values.as },
        defaults: DEFAULTS,
      })}
      props={PROPS}
      usage={<Usage />}
      a11y={<A11y />}
    />
  );
}
