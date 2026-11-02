import { useCallback, useState } from 'react';
import { Badge, Button, ManuscriptFlip } from '@taein-ui/core';
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
import * as styles from './ManuscriptFlipPage.css';

const LEAD =
  '원고지 넘김. 앞면이 칸 단위로 글 쓰는 순서대로 뒤집히며 뒷면으로 바뀝니다. 되넘길 때는 반대 순서입니다.';

const CONTROLS: Control[] = [{ prop: 'flipped', kind: 'toggle' }];

const INITIAL: Values = { flipped: false };

const DEFAULTS: Values = {};

const PROPS: PropDefinition[] = [
  {
    name: 'front',
    type: 'ReactNode',
    required: true,
    description: '앞면. 한 벌만 렌더합니다',
  },
  {
    name: 'back',
    type: 'ReactNode',
    required: true,
    description: '뒷면. 한 벌만 렌더합니다',
  },
  {
    name: 'flipped',
    type: 'boolean',
    required: true,
    description:
      'true면 뒷면이 보입니다(제어). 바뀌면 칸이 글 쓰는 순서로 하나씩 뒤집히고, 넘기는 도중에 바뀌면 지금 상태에서 거꾸로 갑니다',
  },
  {
    name: 'className',
    type: 'string',
    description:
      '상자에 더할 CSS 클래스. 폭은 부모를 채우고 높이는 더 큰 면이 정합니다',
  },
  {
    name: 'ref',
    type: 'Ref<HTMLDivElement>',
    description:
      '상자의 ref. 그 밖의 네이티브 div 속성도 상자로 갑니다. 안쪽 여백은 주지 않습니다',
  },
];

// 가리켰다 떼며 넘어가고 돌아오는 걸 보인다. 대본이 먼저 앞면으로 세워 사용자가 만졌다 놓은 뒤에도 순서가 맞는다
// 카드 속 미니는 커서가 그려지지 않으니 오가는 시간과 읽을 시간만 줄인다(act.pace). 넘김 700ms는 그대로다
const SCRIPT = (act: Act, setFlipped: (flipped: boolean) => void) => {
  act.call(() => setFlipped(false));
  act.move('card', act.pace(0.6, 0.3));
  act.wait(act.pace(0.3, 0.1));
  act.hover('card');
  act.wait(act.pace(1.6, 1.2));
  act.leave('card');
  act.wait(act.pace(1.2, 0.9));
  act.home(act.pace(0.6, 0.3));
  act.wait(act.pace(0.4, 0.1));
};

/**
 * 무대 조각. 상품 카드 하나다. 앞은 사진 자리(큰 글자), 뒤는 설명이다.
 * 가리키면 넘어가고 떼면 돌아오며, 단추로도 넘길 수 있다(가리키기만으로는 키보드와 터치가 못 넘긴다).
 */
export function ManuscriptFlipDemo({ values = INITIAL, mini }: DemoProps) {
  const [flipped, setFlipped] = useState(Boolean(values.flipped));
  // 조작판의 값이 바뀌면 그 값을 따른다. 상태는 렌더 중에 맞춘다(effect 안 setState는 lint가 막는다)
  const [seen, setSeen] = useState(values.flipped);
  if (seen !== values.flipped) {
    setSeen(values.flipped);
    setFlipped(Boolean(values.flipped));
  }
  const script = useCallback((act: Act) => SCRIPT(act, setFlipped), []);

  return (
    <Stage mini={mini} label="ManuscriptFlip 미리보기" script={script}>
      <div className={styles.stack}>
        <div
          className={styles.card}
          data-stage-target="card"
          onMouseEnter={() => setFlipped(true)}
          onMouseLeave={() => setFlipped(false)}
        >
          <ManuscriptFlip
            flipped={flipped}
            front={
              <div className={styles.photo}>
                <Badge variant="secondary">신상</Badge>
                <p className={styles.photoWord}>러닝화</p>
              </div>
            }
            back={
              <div className={styles.description}>
                <p className={styles.title}>가볍고 오래 신는 러닝화</p>
                <p className={styles.text}>
                  밑창이 두껍고 발볼이 넉넉해 오래 걸어도 편합니다.
                </p>
                <Button size="sm" variant="light">
                  장바구니 담기
                </Button>
              </div>
            }
          />
        </div>
        {!mini && (
          <Button
            size="sm"
            variant="light"
            aria-pressed={flipped}
            onClick={() => setFlipped((v) => !v)}
          >
            설명 보기
          </Button>
        )}
      </div>
    </Stage>
  );
}

const USE = `const [flipped, setFlipped] = useState(false);

<div
  onMouseEnter={() => setFlipped(true)}
  onMouseLeave={() => setFlipped(false)}
>
  <ManuscriptFlip
    flipped={flipped}
    front={<img src="/shoe.jpg" alt="러닝화" />}
    back={<p>밑창이 두껍고 발볼이 넉넉합니다.</p>}
  />
</div>

{/* 키보드와 터치를 위한 같은 효과의 단추 */}
<Button aria-pressed={flipped} onClick={() => setFlipped((v) => !v)}>
  설명 보기
</Button>`;

function Usage() {
  return (
    <Topics>
      <Topic title="언제 쓰나">
        <ul className={`${t.list} ${t.body}`}>
          <li>상품 카드: 사진을 보다가 가리키면 설명과 가격으로 넘어갑니다.</li>
          <li>전후 비교: 앞면에 이전, 뒷면에 이후를 두고 넘겨 가며 봅니다.</li>
          <li>퀴즈 카드: 앞면에 문제, 뒷면에 답을 두고 한 장씩 넘깁니다.</li>
        </ul>
      </Topic>
      <Topic title="넘기는 법과 박자">
        <p className={t.body} style={{ marginBottom: 12 }}>
          컴포넌트는 이벤트를 다루지 않고 <code>flipped</code>만 따릅니다.
          가리킬 때 넘길지, 누를 때 넘길지는 쓰는 쪽이 정합니다. 상자를 나눈 칸
          하나가 200ms에 뒤집히고, 칸 수와 상관없이 전체는 700ms입니다. 칸 한
          변은 약 48px이고 칸은 최대 48개라, 큰 상자에서는 칸이 커집니다. 넘기는
          도중에 <code>flipped</code>가 바뀌면 지금 상태에서 거꾸로 돌아옵니다.
        </p>
        <CodeBlock code={USE} />
      </Topic>
      <Topic title="면 만들기">
        <p className={t.body}>
          앞면과 뒷면은 자유로운 내용이고 한 벌씩만 그려집니다. 면의 바탕은
          불투명하게 주세요. 칸 경계에서 아래 면이 비치지 않습니다. 상자에는
          안쪽 여백을 주지 말고, 여백은 면 안에 둡니다.
        </p>
      </Topic>
    </Topics>
  );
}

function A11y() {
  return (
    <ul className={`${t.list} ${t.body}`}>
      <li>
        보이지 않는 면은 <code>inert</code>이고 화면에서도 가려집니다. 앞면이
        보일 때 뒷면의 단추는 탭으로 닿지 않고, 읽히지도 않습니다.
      </li>
      <li>
        넘기는 도중에는 두 면이 모두 <code>inert</code>입니다. 포커스가 있던
        면은 넘김이 시작되면 포커스를 잃고, 끝나면 보이는 면만 살아납니다.
      </li>
      <li>
        면을 복제하지 않아 같은 <code>id</code>나 같은 단추가 둘로 나뉘지
        않습니다. 칸 위를 도는 종이 조각은 <code>aria-hidden</code> 장식이고
        포인터를 받지 않습니다.
      </li>
      <li>
        상자 자체는 포커스를 받지 않습니다. 면 안 요소의 포커스 표시는 그 내용의
        몫입니다.
      </li>
      <li>움직임 줄이기에서는 칸 없이 두 면이 교차해 흐려집니다.</li>
      <li>
        개발자가 직접 해야 합니다. 가리키기만으로 넘기면 키보드와 터치 사용자가
        뒷면에 닿지 못합니다. 같은 일을 하는 단추를 함께 두고{' '}
        <code>aria-pressed</code>로 상태를 알려 주세요.
      </li>
    </ul>
  );
}

export function ManuscriptFlipPage() {
  const [values, setValues] = useState<Values>(INITIAL);

  return (
    <DetailLayout
      name="ManuscriptFlip"
      lead={LEAD}
      stage={<ManuscriptFlipDemo values={values} />}
      customize={
        <Customize controls={CONTROLS} values={values} onChange={setValues} />
      }
      code={codeOf({
        component: 'ManuscriptFlip',
        values: { flipped: values.flipped },
        defaults: DEFAULTS,
      })}
      props={PROPS}
      usage={<Usage />}
      a11y={<A11y />}
    />
  );
}
