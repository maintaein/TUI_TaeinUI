import { useCallback, useState } from 'react';
import { X } from 'lucide-react';
import { Card, IconButton, Morph, themeContract } from '@taein-ui/core';
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
import * as styles from './MorphPage.css';

const LEAD =
  '사라지는 요소의 모양을 새 요소가 이어받아 그 자리에서 자라납니다. 카드를 누르면 카드가 있던 자리와 모양에서 상세 패널이 커지고, 닫으면 다시 카드로 돌아갑니다.';

const CONTROLS: Control[] = [
  { prop: 'morphId', kind: 'text', label: 'morphId 앞머리' },
];

const INITIAL: Values = { morphId: 'card' };

const PROPS: PropDefinition[] = [
  {
    name: 'morphId',
    type: 'string',
    required: true,
    description:
      '짝을 찾는 이름. 같은 morphId로 사라진 요소의 모양을 새로 나타난 요소가 이어받는다. HTML id와 다르다',
  },
  {
    name: 'children',
    type: 'ReactElement',
    required: true,
    description:
      '요소 하나. 종류나 key가 바뀌면 다른 요소로 보고 이전 모양을 이어받는다',
  },
  {
    name: 'as',
    type: "'div' | 'li' | 'section' | 'article'",
    default: "'div'",
    description: '움직이는 래퍼 요소',
  },
  {
    name: 'className',
    type: 'string',
    description:
      '래퍼에 더할 CSS 클래스. 상세가 앉을 자리(absolute 등)는 여기서 줍니다',
  },
  {
    name: 'ref',
    type: 'Ref<HTMLElement>',
    description: '래퍼의 ref',
  },
];

const CARDS = [1, 2, 3];

// 이어받는 색이 또렷이 보이도록 카드는 옅은 파랑, 상세는 흰 종이색이다(무대가 흰색이라 같은 색이면 모양만 남는다)
const CARD_TINT = { backgroundColor: themeContract.palette.primary[100] };

// 커서가 두 번째 카드를 눌러 열고, 패널이 자리 잡을 때까지 보인 뒤 닫기를 눌러 돌려보낸다. 닫는 일을 맨 앞에 두어
// 사용자가 만져 연 뒤에도 순서가 맞는다. 이어받기(약 0.7초)와 내용 떠오름(0.3초)이 끝난 뒤 읽을 틈을 둔다
const SCRIPT = (act: Act, close: () => void) => {
  act.call(close);
  act.move('card-2');
  act.wait(0.4);
  act.press('card-2');
  act.wait(2.2);
  act.move('close');
  act.wait(0.3);
  act.press('close');
  act.wait(1.8);
  act.home();
  act.wait(0.4);
};

/** 무대 조각. 대본의 커서가 카드를 열고 닫기를 반복하고, 직접 눌러 열고 닫을 수도 있다 */
export function MorphDemo({ values = INITIAL, mini }: DemoProps) {
  const [open, setOpen] = useState<number | null>(null);
  const close = useCallback(() => setOpen(null), []);
  const script = useCallback((act: Act) => SCRIPT(act, close), [close]);
  const prefix = String(values.morphId);

  return (
    <Stage mini={mini} label="Morph 미리보기" script={script}>
      <div className={styles.board}>
        <div className={styles.row}>
          {CARDS.map((n) => (
            <div key={n} className={styles.cell} style={{ gridColumn: n }}>
              {open !== n && (
                <Morph morphId={`${prefix}-${n}`}>
                  <Card
                    variant="filled"
                    style={CARD_TINT}
                    data-stage-target={`card-${n}`}
                    onClick={() => setOpen(n)}
                  >
                    <span className={styles.cardFace}>카드 {n}</span>
                  </Card>
                </Morph>
              )}
            </div>
          ))}
        </div>
        {open !== null && (
          <Morph morphId={`${prefix}-${open}`} className={styles.panelSlot}>
            <Card variant="elevated" className={styles.panel}>
              <div className={styles.panelHead}>
                <span>카드 {open} 상세</span>
                <IconButton
                  size="sm"
                  aria-label="닫기"
                  data-stage-target="close"
                  onClick={close}
                >
                  <X />
                </IconButton>
              </div>
              <p className={styles.panelBody}>
                카드가 있던 자리와 모양에서 이 패널이 자라났습니다.
              </p>
            </Card>
          </Morph>
        )}
      </div>
    </Stage>
  );
}

const USE = `{!selected && (
  <Morph morphId="card-3">
    <Card onClick={() => setSelected(true)}>카드</Card>
  </Morph>
)}
{selected && (
  <Morph morphId="card-3" className={panelSlot}>
    <DetailPanel onClose={() => setSelected(false)} />
  </Morph>
)}

// 한 곳에서 바꿔도 됩니다. children의 종류나 key가 바뀌면 이어받습니다
<Morph morphId="card-3">{selected ? <DetailPanel /> : <Card />}</Morph>`;

function Usage() {
  return (
    <Topics>
      <Topic title="언제 쓰나">
        <p className={t.body}>
          목록의 카드에서 상세로, 썸네일에서 크게 보기로 넘어갈 때 씁니다. 같은
          요소가 커졌다는 연결이 보이면 어디서 온 화면인지 잃지 않습니다.
        </p>
      </Topic>
      <Topic title="짝은 morphId로 찾습니다">
        <p className={t.body} style={{ marginBottom: 12 }}>
          사라지는 <code>Morph</code>가 자기 자리, 크기, 둥글기, 배경색을{' '}
          <code>morphId</code>로 남기고, 같은 <code>morphId</code>로 새로
          나타나는 <code>Morph</code>가 그것을 집어 갑니다. 새 래퍼는 이전
          사각형에서 출발해 제 모습으로 바뀌고, 그동안 안쪽 내용은 투명하다가
          끝난 뒤 떠오릅니다.
        </p>
        <CodeBlock code={USE} />
      </Topic>
      <Topic title="래퍼가 움직입니다">
        <p className={t.body}>
          움직이는 것은 <code>Morph</code>가 그리는 래퍼입니다. 래퍼의 사각형을
          읽고 옮기므로 안쪽 요소가 래퍼를 가득 채울 때 가장 잘 맞습니다. 상세가
          앉을 자리는 <code>className</code>으로 정합니다.
        </p>
      </Topic>
    </Topics>
  );
}

function A11y() {
  return (
    <ul className={`${t.list} ${t.body}`}>
      <li>
        포커스 이동: 이전 요소 안에 포커스가 있었다면 형태가 바뀌는 동안은 새
        래퍼가 포커스를 맡고(그동안 내용은 <code>inert</code>라 투명한 단추가
        포커스를 받지 않습니다) 끝나면 첫 포커스 가능 자손으로 넘깁니다. 없으면
        래퍼 자신(<code>tabindex=&quot;-1&quot;</code>, 탭 순서에는 들지 않음)이
        계속 받습니다. 카드를 키보드로 열면 패널의 닫기 단추로, 닫으면 카드로
        포커스가 가서 body로 떨어지지 않습니다.
      </li>
      <li>
        끝 정리: 끝나면 래퍼의 인라인 transform, 둥글기, 배경, opacity를
        걷습니다. 소비자가 자식에 건 인라인 opacity와 transition은 끝난 뒤
        그대로 돌아옵니다. 진행 중에 반대로 전환하면 그 순간 보이는 모습에서
        이어받아 점프가 없고, 진행 중에 언마운트하면 남는 스타일이 없습니다.
      </li>
      <li>
        짝 범위: 모듈 전역 등록부라 같은 페이지의 모든 <code>Morph</code>가
        공유합니다. 같은 <code>morphId</code>로 사라지는 것이 둘이면 정리
        순서(트리 순서)에서 나중 것의 모양이 남고, 나타나는 것이 둘이면 트리
        앞쪽이 이어받습니다. 100ms 안에 짝이 나타나지 않은 기록은 버립니다.
      </li>
      <li>
        이전 요소의 복제본은 그리지 않아 <code>aria-hidden</code>이나{' '}
        <code>inert</code>로 감출 장식이 없습니다. 새 요소만 변형하고 스크린
        리더는 새 요소를 그대로 읽습니다.
      </li>
      <li>움직임 줄이기에서는 모양이 이어지지 않고 바로 바뀝니다.</li>
      <li>
        개발자가 직접 해야 합니다. 상세가 대화상자처럼 화면을 가린다면 역할 (
        <code>role=&quot;dialog&quot;</code>), 이름, Esc로 닫기는 상세 쪽에서
        따로 챙깁니다. <code>Morph</code>는 모양과 포커스 이어받기만 맡습니다.
      </li>
    </ul>
  );
}

export function MorphPage() {
  const [values, setValues] = useState<Values>(INITIAL);
  const id = String(values.morphId);

  return (
    <DetailLayout
      name="Morph"
      lead={LEAD}
      stage={<MorphDemo values={values} />}
      customize={
        <Customize controls={CONTROLS} values={values} onChange={setValues} />
      }
      code={`import { Morph } from '@taein-ui/core';

{!open && (
  <Morph morphId="${id}-1">
    <Card onClick={() => setOpen(true)}>카드</Card>
  </Morph>
)}
{open && (
  <Morph morphId="${id}-1">
    <DetailPanel />
  </Morph>
)}`}
      props={PROPS}
      usage={<Usage />}
      a11y={<A11y />}
    />
  );
}
