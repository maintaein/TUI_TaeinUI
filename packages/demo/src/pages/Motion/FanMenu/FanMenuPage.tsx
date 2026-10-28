import { useState } from 'react';
import { FanMenu, Slider } from '@taein-ui/core';
import {
  Bookmark,
  Heart,
  Image as ImageIcon,
  MapPin,
  MessageCircle,
  Music,
  Settings,
  Share2,
} from 'lucide-react';
import { CodeBlock } from '../../../components/CodeBlock';
import { DetailLayout, Topic, Topics } from '../../../components/DetailLayout';
import * as t from '../../../components/DocText';
import type { PropDefinition } from '../../../components/PropsTable';
import { Stage, type Act, type DemoProps } from '../../../components/Stage';

const LEAD =
  '가운데 단추를 누르면 아이콘이 부채꼴로 차례차례 튀어나오고, 가리킨 쪽 아이콘이 커지며 이름표가 뜹니다. 빠른 작업이나 공유 메뉴처럼 몇 가지 동작을 한 점에서 펼칠 때 씁니다.';

const PROPS: PropDefinition[] = [
  {
    name: 'label',
    type: 'string',
    required: true,
    description:
      '허브 단추의 접근 가능한 이름. 열림과 무관하게 고정이고 열림은 aria-expanded가 전합니다',
  },
  {
    name: 'items',
    type: '{ icon: ReactNode; label: string; onSelect: () => void }[]',
    required: true,
    description:
      '부채꼴에 놓일 항목 2~8개. 범위 밖이면 개발 경고를 한 번 내고 앞 8개만 그립니다. label이 항목의 접근 가능한 이름이자 이름표입니다',
  },
  {
    name: 'disabled',
    type: 'boolean',
    default: 'false',
    description: '허브를 막습니다',
  },
  {
    name: 'className',
    type: 'string',
    description: '루트에 더할 CSS 클래스',
  },
  {
    name: 'ref',
    type: 'Ref<HTMLButtonElement>',
    description:
      '허브 단추의 ref. 그 밖의 네이티브 button 속성도 허브로 갑니다',
  },
];

// 처음 여섯이 기본이고 조작판이 여덟까지 늘린다
const ITEMS = [
  { icon: ImageIcon, tag: 'Image', label: '사진' },
  { icon: MessageCircle, tag: 'MessageCircle', label: '메시지' },
  { icon: Music, tag: 'Music', label: '음악' },
  { icon: MapPin, tag: 'MapPin', label: '위치' },
  { icon: Heart, tag: 'Heart', label: '좋아요' },
  { icon: Settings, tag: 'Settings', label: '설정' },
  { icon: Share2, tag: 'Share2', label: '공유' },
  { icon: Bookmark, tag: 'Bookmark', label: '저장' },
];
const DEFAULT_COUNT = 6;

// 대본: 허브를 눌러 열고, 호 위쪽을 왼쪽에서 오른쪽으로 훑어 가리킴이 옮겨 가게 한 뒤, 다시 눌러 접는다.
// 훑는 줄은 허브 가운데에서 40px 위, 좌우 끝은 호의 양 끝 가까이(약 17도)라 아이콘이 차례로 커진다
const SCRIPT = (act: Act) => {
  act.move('hub');
  act.wait(0.3);
  act.press('hub');
  act.wait(1.4);
  act.sweep('arc', 2.4);
  act.wait(0.5);
  act.press('hub');
  act.wait(1.2);
  act.home();
  act.wait(0.4);
};

interface FanMenuDemoProps extends DemoProps {
  /** 항목 개수(2~8)를 바깥(조작판의 슬라이더)이 쥘 때. 없으면 여섯 */
  count?: number;
}

/** 무대 조각. 대본의 커서가 허브를 눌러 열고 호를 훑고 접으며, 마우스를 올리면 직접 눌러 볼 수 있다 */
export function FanMenuDemo({ mini, count = DEFAULT_COUNT }: FanMenuDemoProps) {
  const [picked, setPicked] = useState('');

  return (
    <Stage mini={mini} label="FanMenu 미리보기" script={SCRIPT}>
      {/* 호는 허브 위로 펼쳐지므로 위쪽에 호가 들어갈 자리를 둔다(허브 가운데에서 약 130px) */}
      <div
        style={{
          display: 'grid',
          justifyItems: 'center',
          gap: 24,
          paddingTop: mini ? 128 : 150,
        }}
      >
        <div style={{ position: 'relative', display: 'grid' }}>
          <FanMenu
            data-stage-target="hub"
            label="빠른 작업"
            items={ITEMS.slice(0, count).map(({ icon: Icon, label }) => ({
              icon: <Icon />,
              label,
              onSelect: () => setPicked(label),
            }))}
          />
          {/* 대본이 훑는 줄. 허브 가운데 위 40px을 가로지른다. 클릭은 통과한다 */}
          <div
            data-stage-target="arc"
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: '50%',
              bottom: 28,
              width: 280,
              height: 80,
              transform: 'translateX(-50%)',
              pointerEvents: 'none',
            }}
          >
            <span />
          </div>
        </div>
        {!mini && (
          <p className={t.body} aria-live="polite" style={{ minHeight: '1lh' }}>
            {picked && `고른 항목: ${picked}`}
          </p>
        )}
      </div>
    </Stage>
  );
}

const USE = `<FanMenu
  label="빠른 작업"
  items={[
    { icon: <Image />, label: '사진', onSelect: pickPhoto },
    { icon: <MessageCircle />, label: '메시지', onSelect: openChat },
    { icon: <Music />, label: '음악', onSelect: openMusic },
  ]}
/>`;

function Usage() {
  return (
    <Topics>
      <Topic title="언제 쓰나">
        <p className={t.body}>
          사진, 메시지, 음악처럼 두세 가지에서 여덟 가지까지의 동작을 한 점에서
          꺼내 쓸 때 씁니다. 아이콘만으로 뜻이 통하는 동작이어야 하고, 이름은
          가리키거나 포커스가 갔을 때 이름표로 보입니다. 동작이 아홉 개를 넘거나
          글자가 길면 목록 메뉴가 맞습니다.
        </p>
      </Topic>
      <Topic title="자리는 소비자가 잡습니다">
        <p className={t.body} style={{ marginBottom: 12 }}>
          부채꼴은 늘 허브 위로 펼쳐지는 위쪽 반원 하나입니다. 호는 허브
          가운데에서 위로 약 130px, 좌우로 약 130px 차지하고, 화면 가장자리에
          닿았을 때 방향을 바꾸는 처리는 하지 않습니다. 허브를 화면 아래쪽
          가운데에 두거나 위와 좌우에 그만큼 여백을 주세요.
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
        메뉴 단추 패턴입니다. 허브는 <code>aria-haspopup=&quot;menu&quot;</code>
        , <code>aria-expanded</code>, <code>aria-controls</code>를 가지고,
        항목은 <code>role=&quot;menu&quot;</code> 안의{' '}
        <code>role=&quot;menuitem&quot;</code>입니다. 허브의 이름은 열림과
        무관하게 <code>label</code> 그대로입니다.
      </li>
      <li>
        닫힌 동안(닫히는 애니메이션 포함) 항목 묶음이 <code>inert</code>라 Tab
        순서와 접근성 트리에 남지 않습니다.
      </li>
      <li>
        Enter, Space, 위 화살표로 열면 첫 항목에 포커스가 가고, 마우스로 열면
        포커스는 허브에 남습니다. 화살표 네 방향은 모두 호를 따라
        이동하고(끝에서 감김) Home과 End는 양 끝으로 갑니다.
      </li>
      <li>
        Esc는 접고 포커스를 허브로 돌립니다. Tab으로 포커스가 메뉴 밖으로 나가면
        접고, 바깥을 눌러도 접습니다. 허브에 포커스가 있는 동안 항목은 Tab
        순서에 없고 위 화살표로 들어갑니다. 항목을 골라 접힐 때도 포커스는
        허브로 돌아옵니다.
      </li>
      <li>
        포커스가 간 아이콘도 가리킨 아이콘처럼 커지고 이름표가 뜹니다. 이름표는
        장식 겹(aria-hidden)이고 항목의 접근 가능한 이름은 <code>label</code>
        입니다. 이름표는 Esc로 닫히고, 포인터가 이름표 위로 올라와도 남고,
        저절로 사라지지 않습니다(WCAG 1.4.13).
      </li>
      <li>
        방향 추적은 정밀 포인터(마우스)에서만 합니다. 터치에서는 방향 추적 없이
        누른 아이콘이 그대로 선택됩니다.
      </li>
      <li>
        항목은 44px 원형 단추이고 서로 겹치지 않습니다. 단추 테두리는 바탕과 3:1
        이상, 아이콘은 4.5:1 이상의 대비입니다.
      </li>
      <li>
        움직임 줄이기에서는 아이콘이 차례 없이 제자리에 바로 나타나고
        사라집니다.
      </li>
    </ul>
  );
}

export function FanMenuPage() {
  const [count, setCount] = useState(DEFAULT_COUNT);
  const shown = ITEMS.slice(0, count);

  return (
    <DetailLayout
      name="FanMenu"
      lead={LEAD}
      stage={<FanMenuDemo count={count} />}
      customize={
        <Slider
          label="항목 개수"
          min={2}
          max={8}
          step={1}
          showValue
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
        />
      }
      code={`import { FanMenu } from '@taein-ui/core';

<FanMenu
  label="빠른 작업"
  items={[
${shown
  .map(
    ({ tag, label }) =>
      `    { icon: <${tag} />, label: '${label}', onSelect: () => {} },`
  )
  .join('\n')}
  ]}
/>`}
      props={PROPS}
      usage={<Usage />}
      a11y={<A11y />}
    />
  );
}
