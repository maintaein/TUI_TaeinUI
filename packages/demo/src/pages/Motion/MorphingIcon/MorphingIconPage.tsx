import { useCallback, useState } from 'react';
import { IconButton, MorphingIcon, type MorphingPair } from '@taein-ui/core';
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
import * as styles from './MorphingIconPage.css';

const LEAD =
  '두 상태를 오가는 아이콘입니다. 선이 늘어나고 접히며 다른 모양이 됩니다.';

// 아이콘 크기는 단추가 정한다(글자 크기를 따른다). 그래서 조작판은 단추의 모양과 크기만 만진다
const CONTROLS: Control[] = [
  {
    prop: 'buttonStyle',
    kind: 'choice',
    options: ['ghost', 'weak', 'strong'],
  },
  { prop: 'size', kind: 'choice', options: ['sm', 'md', 'lg', 'xl'] },
];

const INITIAL: Values = { buttonStyle: 'strong', size: 'lg' };

// 짝마다 단추의 이름이 상태를 따라 바뀐다. aria-pressed가 눌림을, 이름이 지금 할 수 있는 일을 알린다
const ITEMS: {
  pair: MorphingPair;
  caption: string;
  off: string;
  on: string;
}[] = [
  {
    pair: 'menu-close',
    caption: '메뉴 / 닫기',
    off: '메뉴 열기',
    on: '메뉴 닫기',
  },
  {
    pair: 'plus-check',
    caption: '더하기 / 체크',
    off: '목록에 담기',
    on: '목록에서 빼기',
  },
  {
    pair: 'play-pause',
    caption: '재생 / 일시정지',
    off: '재생',
    on: '일시정지',
  },
  {
    pair: 'search-close',
    caption: '검색 / 닫기',
    off: '검색 열기',
    on: '검색 닫기',
  },
  {
    pair: 'expand-collapse',
    caption: '펼침 / 접힘',
    off: '펼치기',
    on: '접기',
  },
];

const PROPS: PropDefinition[] = [
  {
    name: 'pair',
    type: "'menu-close' | 'plus-check' | 'play-pause' | 'search-close' | 'expand-collapse'",
    required: true,
    description:
      '오가는 두 아이콘의 짝. 다섯 가지뿐이고 아무 아이콘 둘을 섞지는 못합니다. 쓰는 중에 바꾸면 새 짝의 모양으로 다시 그립니다',
  },
  {
    name: 'active',
    type: 'boolean',
    required: true,
    description:
      'false면 짝의 앞 아이콘(메뉴, 더하기, 재생, 검색, 펼침), true면 뒤 아이콘(닫기, 체크, 일시정지, 닫기, 접힘)입니다. 바뀌면 선의 끝점이 300ms에 옮겨 가고, 가는 도중에 바뀌면 지금 모양에서 새 목표로 갑니다',
  },
  {
    name: 'className',
    type: 'string',
    description: 'SVG에 더할 CSS 클래스',
  },
  {
    name: 'ref',
    type: 'Ref<SVGSVGElement>',
    description:
      'SVG의 ref. 크기(1em)와 색(currentColor)은 담는 쪽의 글자 크기와 글자색을 따르므로 size와 variant는 없습니다',
  },
];

// 커서가 메뉴 단추를 눌러 닫기로 바꾸고 다시 눌러 되돌린다. 대본이 먼저 메뉴로 세워 사용자가 만졌다 놓은 뒤에도 순서가 맞는다
// 카드 속 미니는 커서가 그려지지 않으니 오가는 시간과 읽을 시간만 줄인다(act.pace). 300ms 움직임은 그대로다
const SCRIPT = (act: Act, reset: () => void) => {
  act.call(reset);
  act.move('menu-close', act.pace(0.6, 0.3));
  act.wait(act.pace(0.3, 0.1));
  act.press('menu-close');
  act.wait(act.pace(1.2, 0.9));
  act.press('menu-close');
  act.wait(act.pace(1, 0.7));
  act.press('menu-close');
  act.wait(act.pace(1.2, 0.9));
  act.press('menu-close');
  act.wait(act.pace(0.8, 0.5));
  act.home(act.pace(0.6, 0.3));
  act.wait(act.pace(0.4, 0.1));
};

const START: Record<MorphingPair, boolean> = {
  'menu-close': false,
  'plus-check': false,
  'play-pause': false,
  'search-close': false,
  'expand-collapse': false,
};

/** 무대 조각. 단추 다섯 개가 짝 하나씩을 맡고, 누르면 아이콘이 다른 모양으로 바뀝니다 */
export function MorphingIconDemo({ values = INITIAL, mini }: DemoProps) {
  const [on, setOn] = useState(START);
  const script = useCallback((act: Act) => SCRIPT(act, () => setOn(START)), []);
  const buttonStyle =
    values.buttonStyle === 'ghost' || values.buttonStyle === 'weak'
      ? values.buttonStyle
      : 'strong';
  const size =
    values.size === 'sm' || values.size === 'md' || values.size === 'xl'
      ? values.size
      : 'lg';

  return (
    <Stage mini={mini} label="MorphingIcon 미리보기" script={script}>
      <div className={styles.row}>
        {ITEMS.map(({ pair, caption, off, on: onLabel }) => (
          <div key={pair} className={styles.item}>
            <IconButton
              data-stage-target={pair}
              buttonStyle={buttonStyle}
              size={size}
              aria-label={on[pair] ? onLabel : off}
              aria-pressed={on[pair]}
              onClick={() =>
                setOn((prev) => ({ ...prev, [pair]: !prev[pair] }))
              }
            >
              <MorphingIcon pair={pair} active={on[pair]} />
            </IconButton>
            {!mini && <p className={styles.caption}>{caption}</p>}
          </div>
        ))}
      </div>
    </Stage>
  );
}

const USE = `const [open, setOpen] = useState(false);

<IconButton
  aria-label={open ? '메뉴 닫기' : '메뉴 열기'}
  aria-pressed={open}
  onClick={() => setOpen((v) => !v)}
>
  <MorphingIcon pair="menu-close" active={open} />
</IconButton>`;

function Usage() {
  return (
    <Topics>
      <Topic title="언제 쓰나">
        <ul className={`${t.list} ${t.body}`}>
          <li>메뉴 단추: 눌러 열면 햄버거가 닫기(X)로 바뀝니다.</li>
          <li>목록에 담기: 더하기가 체크로 바뀌어 담겼음을 알립니다.</li>
          <li>재생과 일시정지: 같은 자리의 단추 하나가 두 일을 맡습니다.</li>
          <li>검색창 열기와 닫기, 접힌 목록의 펼침과 접힘에도 씁니다.</li>
        </ul>
      </Topic>
      <Topic title="짝과 움직임">
        <p className={t.body}>
          짝은 메뉴와 닫기, 더하기와 체크, 재생과 일시정지, 검색과 닫기, 펼침과
          접힘 다섯 가지입니다. 짝마다 두 상태의 선 개수와 끝점 수를 맞춰 직접
          그렸고, 아이콘 둘을 아무렇게나 섞는 것은 지원하지 않습니다. 움직이는
          것은 선의 끝점뿐입니다. 300ms 동안 끝점이 옮겨 가며 선이 늘어나고
          접히고, 사라지는 선은 한 점으로 줄면서 흐려집니다. 가는 도중에{' '}
          <code>active</code>가 바뀌면 지금 모양에서 새 목표로 갑니다.
        </p>
      </Topic>
      <Topic title="단추 안에서">
        <p className={t.body} style={{ marginBottom: 12 }}>
          크기는 <code>1em</code>이고 색은 <code>currentColor</code>입니다.
          IconButton에 그대로 넣으면 단추의 <code>size</code>가 아이콘 크기를
          정하고 단추의 글자색이 선 색이 됩니다. 눌림 상태는 쓰는 쪽이 쥐고,
          단추의 <code>aria-pressed</code>와 <code>aria-label</code>로 알립니다.
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
        아이콘은 <code>aria-hidden</code>이고{' '}
        <code>focusable=&quot;false&quot;</code>
        라서 포커스를 받지 않습니다. 포커스 표시는 담는 단추의 몫입니다.
      </li>
      <li>
        상태는 아이콘이 알리지 않습니다. 담는 단추에 <code>aria-pressed</code>를
        주고, 이름(<code>aria-label</code>)도 상태에 맞춰 바꾸세요. 위 무대의
        단추가 그 예입니다.
      </li>
      <li>
        선 굵기는 2이고 색은 단추의 글자색이라, 단추가 아이콘 대비 기준(3:1)을
        지키면 아이콘도 지킵니다.
      </li>
      <li>움직임 줄이기에서는 움직임 없이 바로 바뀝니다.</li>
    </ul>
  );
}

export function MorphingIconPage() {
  const [values, setValues] = useState<Values>(INITIAL);
  const attrs = [
    values.buttonStyle !== 'ghost' && `buttonStyle="${values.buttonStyle}"`,
    values.size !== 'md' && `size="${values.size}"`,
  ].filter(Boolean);
  const code = `import { IconButton, MorphingIcon } from '@taein-ui/core';

<IconButton
  aria-label={open ? '메뉴 닫기' : '메뉴 열기'}
  aria-pressed={open}
${attrs.map((a) => `  ${a}\n`).join('')}  onClick={() => setOpen((v) => !v)}
>
  <MorphingIcon pair="menu-close" active={open} />
</IconButton>`;

  return (
    <DetailLayout
      name="MorphingIcon"
      lead={LEAD}
      stage={<MorphingIconDemo values={values} />}
      customize={
        <Customize controls={CONTROLS} values={values} onChange={setValues} />
      }
      code={code}
      props={PROPS}
      usage={<Usage />}
      a11y={<A11y />}
    />
  );
}
