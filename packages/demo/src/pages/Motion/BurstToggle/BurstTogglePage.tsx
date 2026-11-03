import { useCallback, useState, type ComponentType } from 'react';
import { Bookmark, Heart, Star, type LucideProps } from 'lucide-react';
import { BurstToggle } from '@taein-ui/core';
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
  '좋아요 단추. 켜면 아이콘이 납작했다가 튕기며 채워지고, 파란 점이 아이콘 가운데에서 터져 흩어집니다. 끄면 조용히 꺼진 아이콘으로 돌아갑니다.';

const ICONS: Record<
  string,
  { Icon: ComponentType<LucideProps>; name: string }
> = {
  Heart: { Icon: Heart, name: '좋아요' },
  Star: { Icon: Star, name: '즐겨찾기' },
  Bookmark: { Icon: Bookmark, name: '저장' },
};

const CONTROLS: Control[] = [
  { prop: 'icon', kind: 'choice', options: Object.keys(ICONS) },
];

const INITIAL: Values = { icon: 'Heart' };

const PROPS: PropDefinition[] = [
  {
    name: 'selected',
    type: 'boolean',
    required: true,
    description: '켜짐. aria-pressed로 알린다. 상태는 소비자가 쥔다',
  },
  {
    name: 'selectedIcon',
    type: 'ReactNode',
    required: true,
    description:
      '켜진 아이콘. 채워짐은 외곽선 아이콘에 fill을 주는 것이 아니라 두 아이콘을 바꿔 만든다',
  },
  {
    name: 'children',
    type: 'ReactNode',
    required: true,
    description: '꺼진 아이콘',
  },
  {
    name: 'aria-label',
    type: 'string',
    required: true,
    description: '단추의 접근 가능한 이름. 켜짐과 꺼짐에서 같다',
  },
  {
    name: 'onClick',
    type: 'MouseEventHandler<HTMLButtonElement>',
    description: '네이티브 click. 여기서 소비자의 상태를 뒤집는다',
  },
  {
    name: 'disabled',
    type: 'boolean',
    default: 'false',
    description: '비활성화 상태. onClick이 불리지 않는다',
  },
  {
    name: 'className',
    type: 'string',
    description: '단추에 더할 CSS 클래스',
  },
  {
    name: 'ref',
    type: 'Ref<HTMLButtonElement>',
    description: '단추의 ref. 그 밖의 네이티브 button 속성도 단추로 간다',
  },
];

// 커서가 눌러 켜고 터지는 걸 보인 뒤 다시 눌러 끈다. 대본이 먼저 꺼 두어 사용자가 만졌다 놓은 뒤에도 순서가 맞는다
// 카드 속 미니는 커서가 그려지지 않으니 오가는 시간과 읽을 시간만 줄인다(act.pace). 누름과 효과가 끝나는 시간은 그대로다
const SCRIPT = (act: Act, setSelected: (selected: boolean) => void) => {
  act.call(() => setSelected(false));
  act.move('like', act.pace(0.6, 0.3));
  act.wait(act.pace(0.3, 0.1));
  act.press('like');
  act.wait(act.pace(1.4, 1));
  act.press('like');
  act.wait(act.pace(0.8, 0.5));
  act.home(act.pace(0.6, 0.3));
  act.wait(act.pace(0.4, 0.1));
};

/** 무대 조각. 대본의 커서가 켜고 끄고, 마우스를 올리면 직접 눌러 볼 수 있다 */
export function BurstToggleDemo({ values = INITIAL, mini }: DemoProps) {
  const [selected, setSelected] = useState(false);
  const script = useCallback((act: Act) => SCRIPT(act, setSelected), []);
  const { Icon, name } = ICONS[String(values.icon)] ?? ICONS.Heart;

  return (
    <Stage mini={mini} label="BurstToggle 미리보기" script={script}>
      <BurstToggle
        data-stage-target="like"
        aria-label={name}
        selected={selected}
        onClick={() => setSelected(!selected)}
        selectedIcon={<Icon fill="currentColor" />}
      >
        <Icon />
      </BurstToggle>
    </Stage>
  );
}

const USE = `const [liked, setLiked] = useState(false);

<BurstToggle
  aria-label="좋아요"
  selected={liked}
  onClick={() => setLiked(!liked)}
  selectedIcon={<Heart fill="currentColor" />}
>
  <Heart />
</BurstToggle>`;

function Usage() {
  return (
    <Topics>
      <Topic title="언제 쓰나">
        <p className={t.body}>
          좋아요, 저장, 즐겨찾기처럼 한 번 누르면 켜지고 다시 누르면 꺼지는
          아이콘 단추에 씁니다. 켜는 순간의 손맛만 더하고, 켜짐 상태와 서버
          반영은 소비자가 맡습니다.
        </p>
      </Topic>
      <Topic title="상태 들기">
        <p className={t.body} style={{ marginBottom: 12 }}>
          <code>selected</code>를 소비자가 쥐고 <code>onClick</code>에서
          뒤집습니다. 터짐은 이 단추를 눌러 켜질 때만 일어나므로, 처음부터 켜진
          채로 그려지거나 다른 곳에서 값이 바뀌어도 터지지 않습니다.
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
        <code>aria-pressed</code>가 <code>selected</code>를 따릅니다. 단추의
        이름은 <code>aria-label</code>로 고정되어 켜고 꺼도 바뀌지 않습니다.
      </li>
      <li>
        키보드로 포커스하면 호버와 같은 옅은 면이 깔리고 단추 가장자리 안쪽에
        primary 띠 2px가 생깁니다. 바깥 링은 없습니다.
      </li>
      <li>
        터지는 점은 <code>aria-hidden</code> 장식이고, 끝나면 화면 구조에서
        사라집니다.
      </li>
      <li>켜는 중에 다시 눌러 끄면 남은 점이 그 자리에서 거두어집니다.</li>
      <li>움직임 줄이기에서는 아이콘만 바뀌고 점은 터지지 않습니다.</li>
      <li>
        개발자가 직접 해야 합니다. 아이콘만 있는 단추이므로{' '}
        <code>aria-label</code>을 반드시 주고, 켜짐의 의미를 색에만 맡기지
        않도록 켜진 아이콘의 모양(채움)을 다르게 합니다.
      </li>
    </ul>
  );
}

export function BurstTogglePage() {
  const [values, setValues] = useState<Values>(INITIAL);
  const icon = String(values.icon);

  return (
    <DetailLayout
      name="BurstToggle"
      lead={LEAD}
      stage={<BurstToggleDemo values={values} />}
      customize={
        <Customize controls={CONTROLS} values={values} onChange={setValues} />
      }
      code={`import { BurstToggle } from '@taein-ui/core';
import { ${icon} } from 'lucide-react';

<BurstToggle
  aria-label="${ICONS[icon]?.name ?? ''}"
  selected={selected}
  onClick={() => setSelected(!selected)}
  selectedIcon={<${icon} fill="currentColor" />}
>
  <${icon} />
</BurstToggle>`}
      props={PROPS}
      usage={<Usage />}
      a11y={<A11y />}
    />
  );
}
