import { useCallback, useState } from 'react';
import { Button, WingButton, themeContract } from '@taein-ui/core';
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
  '메일 보내기 같은 전송 단추. 누르면 단추가 웅크리고 아래 양 모서리에 꼬리날개가 펴지며 분사구에서 불꽃이 뿜어집니다. 약 25px 떠올라 둥실거리다가 오른쪽 위로 발사되고, 불꽃이 켜진 동안 분사구 끝에서 나온 연기가 바닥에 띠로 쌓입니다. 한 번만 날고, 다시 보내려면 새로 그립니다.';

const CONTROLS: Control[] = [
  { prop: 'sentLabel', kind: 'text', label: '보낸 뒤 글자' },
];

const INITIAL: Values = { sentLabel: '보냈어요' };

const PROPS: PropDefinition[] = [
  {
    name: 'children',
    type: 'ReactNode',
    required: true,
    description: '단추 글자. 접근 가능한 이름이다',
  },
  {
    name: 'sentLabel',
    type: 'string',
    default: "'보냈어요'",
    description: '날아간 뒤 단추 자리에 서는 표지 글자',
  },
  {
    name: 'container',
    type: 'HTMLElement | null',
    default: 'document.body',
    description:
      '날아가는 단추를 그릴 레이어의 자리. 주면 그 상자 안에서 날고 상자 밖으로 나가며 잘립니다. 그 상자가 position의 기준(relative 등)이어야 하고 스크롤되지 않는 상자여야 합니다',
  },
  {
    name: 'smoke',
    type: 'boolean',
    default: 'true',
    description:
      '불꽃이 켜진 동안 분사구 끝에서 아래로 나와 바닥에서 옆으로 퍼지고, 발사할 때는 진행 반대쪽에 꼬리를 남기는 유체 연기. false면 꼬리날개와 불꽃만 그려지고 연기는 없습니다. WebGL2가 없으면 꼬리날개와 불꽃도 연기도 없이 단추만 같은 박자로 납니다',
  },
  {
    name: 'onClick',
    type: 'MouseEventHandler<HTMLButtonElement>',
    description:
      '네이티브 click(손을 뗄 때). 비행 앞에 불리고 preventDefault()하면 날지 않습니다. 누르는 순간(pointerdown)에는 불리지 않습니다',
  },
  {
    name: 'disabled',
    type: 'boolean',
    default: 'false',
    description:
      '비활성화 상태. 웅크리지도 날지도 않고 onClick도 불리지 않습니다',
  },
  {
    name: 'className',
    type: 'string',
    description: '단추에 더할 CSS 클래스',
  },
  {
    name: 'ref',
    type: 'Ref<HTMLButtonElement>',
    description: '단추의 ref. 그 밖의 네이티브 button 속성도 단추로 갑니다',
  },
];

// 커서가 눌러 날려 보내고, 날아간 표지가 자리 잡을 때까지 보인 뒤 다시 시작한다. 단추를 새로 세우는 일을 맨 앞에 두어
// 사용자가 만져 보낸 뒤에도 순서가 맞는다. 비행(3.05초)과 표지 떠오름(0.2초)이 끝난 뒤 연기가 흩어질 때까지 보인다
// 카드 속 미니는 커서가 그려지지 않으니 오가는 시간과 읽을 시간만 줄인다(act.pace). 누름과 효과가 끝나는 시간은 그대로다
const SCRIPT = (act: Act, reset: () => void) => {
  act.call(reset);
  act.move('send', act.pace(0.6, 0.3));
  act.wait(act.pace(0.3, 0.1));
  act.press('send');
  act.wait(act.pace(5, 3.6));
  act.home(act.pace(0.6, 0.3));
  act.wait(act.pace(0.4, 0.1));
};

/** 무대 조각. 대본의 커서가 눌러 날려 보내고 새로 세우기를 반복하고, 마우스를 올리면 직접 보내 볼 수 있다 */
export function WingButtonDemo({ values = INITIAL, mini }: DemoProps) {
  // 단추를 새로 세우는 번호. 바꾸면 표지가 사라지고 처음 상태로 돌아간다
  const [round, setRound] = useState(0);
  const [sends, setSends] = useState(0);
  const reset = useCallback(() => {
    setSends(0);
    setRound((n) => n + 1);
  }, []);
  const script = useCallback((act: Act) => SCRIPT(act, reset), [reset]);

  return (
    <Stage mini={mini} label="WingButton 미리보기" script={script}>
      {(container) => (
        <div style={{ display: 'grid', gap: 12, justifyItems: 'center' }}>
          <WingButton
            key={round}
            data-stage-target="send"
            container={container}
            smoke={!mini}
            sentLabel={String(values.sentLabel)}
            onClick={() => setSends((n) => n + 1)}
          >
            보내기
          </WingButton>
          <span
            style={{
              fontSize: themeContract.font.size.sm,
              color: themeContract.color.text.secondary,
            }}
          >
            보낸 메일 {sends}통
          </span>
          {!mini && (
            <Button variant="light" size="sm" onClick={reset}>
              다시
            </Button>
          )}
        </div>
      )}
    </Stage>
  );
}

const USE = `<div style={{ position: 'relative' }} ref={setStage}>
  <WingButton container={stage} onClick={send}>
    보내기
  </WingButton>
</div>

// 다시 보내려면 key를 바꿔 새로 그립니다
<WingButton key={round} onClick={send}>보내기</WingButton>`;

function Usage() {
  return (
    <Topics>
      <Topic title="언제 쓰나">
        <p className={t.body}>
          메일 보내기, 제출, 전송처럼 한 번 하면 눈앞에서 떠나는 일의 단추에
          씁니다. 보낸 것이 단추를 떠나 날아간다는 느낌이 &quot;보냈다&quot;는
          피드백이 됩니다.
        </p>
      </Topic>
      <Topic title="꼬리날개와 불꽃은 따로 불러옵니다">
        <p className={t.body}>
          꼬리날개와 분사구, 불꽃은 3D 라이브러리(<code>three</code>)로
          그립니다. 단추를 가리키거나 포커스가 가면 그때 따로 불러오므로 첫 화면
          번들에는 실리지 않습니다. 누르는 순간 웅크림은 바로 시작하고, 아직
          불러오는 중이면 0.3초까지 기다려 오는 대로 그립니다. 그때까지 오지
          않거나 불러오기에 실패하거나 WebGL2가 없으면 꼬리날개와 불꽃 없이
          날고, 연기는 WebGL2가 있을 때만 나옵니다. 이것을 그리는 캔버스는
          비행하는 동안에만 만들어 끝나면 놓습니다.
        </p>
      </Topic>
      <Topic title="날 자리는 container로">
        <p className={t.body} style={{ marginBottom: 12 }}>
          날아가는 단추는 단추 자리에서 화면 전체 위로 떠올라 날아갑니다. 조상의{' '}
          <code>overflow: hidden</code>에 잘리지 않습니다. 특정 상자 안에서만
          날게 하려면 그 상자를 <code>container</code>로 넘깁니다. 그 상자는{' '}
          <code>position: relative</code>처럼 위치의 기준이어야 하고, 단추는 그
          상자 밖으로 나가며 사라집니다.
        </p>
        <CodeBlock code={USE} />
      </Topic>
      <Topic title="다시 보내기는 key로">
        <p className={t.body}>
          날아간 단추는 돌아오지 않습니다. 되돌리는 prop은 없고, 다시 보내게
          하려면 <code>key</code>를 바꿔 단추를 새로 그립니다.
        </p>
      </Topic>
    </Topics>
  );
}

function A11y() {
  return (
    <ul className={`${t.list} ${t.body}`}>
      <li>
        <code>onClick</code>은 네이티브 click, 곧 손을 뗄 때 실행됩니다. 눌러서
        웅크리는 것과 비행은 그 뒤의 피드백일 뿐이고, 누르는 순간(pointerdown)
        되돌릴 수 없는 일을 실행하지 않습니다. 누르다 포인터가 밖으로 빠지거나
        취소되면 웅크림이 되감기고 날지 않습니다.
      </li>
      <li>
        단추에 포커스가 있었다면 날아간 뒤 포커스는 &quot;보냈어요&quot; 표지로
        옮겨집니다. 포커스가 간 요소의 글은 읽히므로 이때는 알림 영역을 비워
        두어 두 번 읽히지 않게 합니다. 포커스가 없었다면 옮기지 않고, 처음부터
        있는 보이지 않는 <code>role=&quot;status&quot;</code> 영역에 비행이 끝난
        뒤 &quot;보냈어요&quot;를 넣습니다(새로 삽입되는 영역은 읽히지 않을 수
        있어 영역을 처음부터 둡니다).
      </li>
      <li>
        복제본은 <code>aria-hidden</code>이고 <code>inert</code>인 장식 입니다.
        꼬리날개와 불꽃을 그리는 캔버스도 <code>aria-hidden</code>이고 포인터를
        가로채지 않습니다. 원래 단추는 보이지 않을 뿐 자리를 지켜 레이아웃이
        움직이지 않습니다.
      </li>
      <li>
        되돌리기는 <code>key</code>로 합니다. 새로 그려진 단추는 처음
        상태입니다.
      </li>
      <li>
        움직임 줄이기에서는 로켓과 비행 없이 단추가 &quot;보냈어요&quot;로
        바뀝니다. 연기도 없습니다.
      </li>
      <li>
        연기도 <code>aria-hidden</code>이고 포인터를 가로채지 않는 장식
        캔버스입니다. 연기를 끄거나, 꼬리날개와 불꽃을 못 불러오거나, WebGL2가
        없어도 알림과 포커스는 같습니다.
      </li>
      <li>
        개발자가 직접 해야 합니다. 날아간 것은 &quot;눌렀다&quot;는 피드백일 뿐
        전송의 성공은 아닙니다. 실패하면 <code>onClick</code>에서{' '}
        <code>preventDefault()</code>하거나 <code>key</code>로 다시 세우고,
        결과는 화면에서 따로 알려야 합니다.
      </li>
    </ul>
  );
}

export function WingButtonPage() {
  const [values, setValues] = useState<Values>(INITIAL);

  return (
    <DetailLayout
      name="WingButton"
      lead={LEAD}
      stage={<WingButtonDemo values={values} />}
      customize={
        <Customize controls={CONTROLS} values={values} onChange={setValues} />
      }
      code={`import { WingButton } from '@taein-ui/core';

<WingButton sentLabel="${String(values.sentLabel)}" onClick={send}>
  보내기
</WingButton>`}
      props={PROPS}
      usage={<Usage />}
      a11y={<A11y />}
    />
  );
}
