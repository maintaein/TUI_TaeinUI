import { useEffect, useRef, useState, type ComponentProps } from 'react';
import { Tag } from 'lucide-react';
import { Chip } from '@taein-ui/core';
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
  '태그, 필터, 카테고리를 작은 라벨로 보입니다. 누르면 선택되고 삭제 버튼으로 지울 수도 있습니다.';

const CONTROLS: Control[] = [
  {
    prop: 'color',
    kind: 'choice',
    options: ['default', 'primary', 'success', 'error', 'warning'],
  },
  { prop: 'variant', kind: 'choice', options: ['filled', 'outlined'] },
  { prop: 'size', kind: 'choice', options: ['sm', 'md', 'lg'] },
  { prop: 'icon', kind: 'toggle' },
  { prop: 'disabled', kind: 'toggle' },
];

const INITIAL: Values = {
  color: 'primary',
  variant: 'outlined',
  size: 'lg',
  icon: false,
  disabled: false,
};

const DEFAULTS: Values = {
  color: 'default',
  variant: 'filled',
  size: 'md',
};

// 코드는 첫 칩의 것이다. 선택·누름·삭제는 무대가 쥔 상태라 조작판에는 없고 코드에는 늘 나온다
const NOTATION = {
  icon: {
    expr: '<Tag size={14} />',
    import: { name: 'Tag', from: 'lucide-react' },
  },
  selected: { expr: 'isSelected' },
  onClick: { expr: 'toggle' },
  onDelete: { expr: 'remove' },
};

const ALL = ['React', 'TypeScript', 'Vite'];
// 지운 칩이 되돌아오기까지(지우는 모션이 끝난 뒤 이만큼 보이지 않는다)
const RESTORE_MS = 1400;

// 커서가 칩으로 가서 올라타고(호버 색) 눌러 선택하면 고리가 스며든다. 다른 칩도 같게 한 뒤
// 삭제 버튼으로 하나를 지우면 칩이 빨려 들어가고 옆 칩이 자리를 메운다. 잠시 뒤 칩들이 처음대로 돌아온다
const SCRIPT = (act: Act) => {
  act.move('chip:React');
  act.hover('chip:React');
  act.wait(0.7);
  act.press('chip:React');
  act.wait(0.7);
  act.leave('chip:React');
  act.move('chip:TypeScript');
  act.hover('chip:TypeScript');
  act.wait(0.5);
  act.press('chip:TypeScript');
  act.wait(0.6);
  act.leave('chip:TypeScript');
  act.move('del:Vite');
  act.hover('del:Vite');
  act.wait(0.4);
  act.press('del:Vite');
  act.leave('del:Vite');
  act.wait(2);
  act.home();
  act.wait(0.6);
};

const PROPS: PropDefinition[] = [
  {
    name: 'label',
    type: 'string',
    required: true,
    description: '칩에 보일 글자',
  },
  {
    name: 'color',
    type: "'default' | 'primary' | 'success' | 'error' | 'warning'",
    default: "'default'",
    description: '색. 선택 고리의 색도 이것을 따른다',
  },
  {
    name: 'variant',
    type: "'filled' | 'outlined'",
    default: "'filled'",
    description: 'filled는 면을 채우고 outlined는 테두리만 둔다',
  },
  {
    name: 'size',
    type: "'sm' | 'md' | 'lg'",
    default: "'md'",
    description: '크기. 높이는 sm과 md가 24px, lg가 32px',
  },
  {
    name: 'icon',
    type: 'ReactNode',
    description: '글자 왼쪽 아이콘',
  },
  {
    name: 'avatar',
    type: 'ReactNode',
    description: '글자 왼쪽 아바타. icon과 함께 주면 아바타가 먼저 놓인다',
  },
  {
    name: 'onClick',
    type: '() => void',
    description: '주면 눌리는 칩(button)이 되어 호버, 포커스, 누름에 반응한다',
  },
  {
    name: 'selected',
    type: 'boolean',
    description:
      '선택 상태. onClick과 함께 주면 켜고 끄는 토글 칩이 된다. onClick 없이 주면 모양만 선택된다',
  },
  {
    name: 'onDelete',
    type: '() => void',
    description:
      '주면 삭제 버튼이 생긴다. 지우는 모션이 끝난 뒤에 불리므로 여기서 목록에서 지운다',
  },
  {
    name: 'disabled',
    type: 'boolean',
    default: 'false',
    description: '누르기와 삭제를 막는다',
  },
];

const FILTER = `const [picked, setPicked] = useState(['React']);

const toggle = (tag: string) =>
  setPicked((p) =>
    p.includes(tag) ? p.filter((x) => x !== tag) : [...p, tag]
  );

{tags.map((tag) => (
  <Chip
    key={tag}
    label={tag}
    onClick={() => toggle(tag)}
    selected={picked.includes(tag)}
  />
))}`;

const DELETE = `const [tags, setTags] = useState(['React', 'TypeScript', 'Vite']);

{tags.map((tag) => (
  <Chip
    key={tag}
    label={tag}
    onDelete={() => setTags((l) => l.filter((x) => x !== tag))}
  />
))}`;

const LEADING = `<Chip label="Taein" avatar={<Avatar alt="Taein Kim" size="xs" />} />
<Chip label="태그" icon={<Tag size={14} />} />`;

function Usage() {
  return (
    <Topics>
      <Topic title="언제 쓰나">
        <p className={t.body}>
          태그, 필터, 선택한 항목처럼 짧은 정보를 독립된 라벨로 보일 때 씁니다.
          라벨은 한두 단어로 짧게 적습니다. 다른 요소에 붙어 개수나 상태를
          알리는 것은 <code>Badge</code>의 몫이고 동작을 실행하는 자리는{' '}
          <code>Button</code>입니다.
        </p>
      </Topic>
      <Topic title="눌러서 선택하기">
        <p className={t.body} style={{ marginBottom: 12 }}>
          <code>onClick</code>을 주면 눌리는 칩이 되고 거기에{' '}
          <code>selected</code>를 더하면 켜고 끄는 토글 칩이 됩니다. 선택은
          부모가 쥐므로 목록의 어느 칩이 선택됐는지 상태로 들고 누를 때
          뒤집습니다. 선택되면 칩 둘레에 색 고리가 스며들고 칩이 1.03배로
          커집니다. 색만 바뀌는 것이 아니라 모양이 바뀌어 색을 구별하지 못해도
          알 수 있습니다.
        </p>
        <CodeBlock code={FILTER} />
      </Topic>
      <Topic title="지우기">
        <p className={t.body} style={{ marginBottom: 12 }}>
          <code>onDelete</code>를 주면 삭제 버튼이 생깁니다. 버튼을 누르면 칩이
          빨려 들어가듯 줄어들고 옆 칩이 자리를 메운 뒤에 <code>onDelete</code>
          가 불립니다. 목록에서 지우는 일은 이 함수에서 합니다. 지우지 않으면
          칩은 보이지 않은 채 남습니다. 무대는 지운 칩을 잠시 뒤 되돌려
          놓습니다.
        </p>
        <CodeBlock code={DELETE} />
      </Topic>
      <Topic title="아이콘과 아바타">
        <p className={t.body} style={{ marginBottom: 12 }}>
          <code>icon</code>과 <code>avatar</code>는 글자 왼쪽에 놓입니다. 둘을
          함께 주면 아바타가 먼저입니다. 사람을 나타내는 칩에는 작은{' '}
          <code>Avatar</code>를 씁니다.
        </p>
        <CodeBlock code={LEADING} />
      </Topic>
      <Topic title="움직임">
        <p className={t.body}>
          눌리는 칩은 마우스를 올리면 색이 한 단계 진해지고 누르는 동안 0.95배로
          눌렸다가 되밀립니다. 선택된 칩은 1.03배 위에서 눌립니다. 삭제 버튼은
          올리면 또렷해지며 오른쪽으로 1px 밉니다. 움직임 줄이기 설정을 켠
          환경에서는 크기 변화 없이 색만 바뀌고 지울 때도 바로 사라집니다.
        </p>
      </Topic>
    </Topics>
  );
}

function A11y() {
  return (
    <ul className={`${t.list} ${t.body}`}>
      <li>
        <code>onClick</code>이 있으면 주 동작이 <code>button</code>이 되어
        Tab으로 들어가고 Enter와 Space로 누릅니다. 이름은 <code>label</code>
        입니다. 없으면 <code>div</code>로 그려집니다.
      </li>
      <li>
        <code>onClick</code>과 <code>selected</code>가 함께 있으면 켜짐 상태가{' '}
        <code>aria-pressed</code>로 전달됩니다. <code>selected</code>를 안 주면
        토글이 아니라 속성이 없습니다.
      </li>
      <li>
        삭제 버튼은 늘 진짜 <code>button</code>이고 이름은 &quot;React
        삭제&quot;처럼 &quot;label 삭제&quot;입니다. 누르기와 삭제가 함께 있으면
        칩 안에 button 둘이 나란히 놓여 button 안에 button이 들어가지 않습니다.
      </li>
      <li>
        <code>disabled</code>이면 <code>aria-disabled</code>가 <code>true</code>
        가 되고 누르기와 삭제가 막힙니다.
      </li>
      <li>
        지우는 동안 칩은 <code>inert</code>가 되어 키보드와 스크린 리더가 받지
        않습니다.
      </li>
      <li>
        키보드로 포커스하면 눌리는 칩 전체와 삭제 버튼에 포커스 링이 생깁니다.
      </li>
      <li>
        개발자가 직접 해야 합니다. 삭제 뒤 포커스가 사라지지 않게 다음 칩이나
        목록으로 옮기는 것은 사용하는 쪽의 몫입니다.
      </li>
    </ul>
  );
}

type Color = ComponentProps<typeof Chip>['color'];
type Variant = ComponentProps<typeof Chip>['variant'];
type Size = ComponentProps<typeof Chip>['size'];

export function ChipPage() {
  const [values, setValues] = useState<Values>(INITIAL);
  const [items, setItems] = useState(ALL);
  const [picked, setPicked] = useState<string[]>([]);
  const box = useRef<HTMLDivElement>(null);

  // core Chip은 data-* 를 받지 않는다. 그려진 button에 이름표를 달아 대본이 찾게 한다
  useEffect(() => {
    box.current?.querySelectorAll('button[aria-label]').forEach((b) => {
      const name = b.getAttribute('aria-label') ?? '';
      b.setAttribute(
        'data-stage-target',
        name.endsWith(' 삭제') ? `del:${name.slice(0, -3)}` : `chip:${name}`
      );
    });
  });

  // 지운 칩이 있으면 잠시 뒤 처음대로 돌려놓아 다음 바퀴가 다시 시작하게 한다
  useEffect(() => {
    if (items.length === ALL.length) return;
    const id = window.setTimeout(() => {
      setItems(ALL);
      setPicked([]);
    }, RESTORE_MS);
    return () => window.clearTimeout(id);
  }, [items]);

  const toggle = (tag: string) =>
    setPicked((p) =>
      p.includes(tag) ? p.filter((x) => x !== tag) : [...p, tag]
    );

  return (
    <DetailLayout
      name="Chip"
      lead={LEAD}
      stage={
        <Stage label="Chip 시연" script={SCRIPT}>
          <div
            ref={box}
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {items.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                color={values.color as Color}
                variant={values.variant as Variant}
                size={values.size as Size}
                icon={values.icon === true ? <Tag size={14} /> : undefined}
                disabled={values.disabled === true}
                selected={picked.includes(tag)}
                onClick={() => toggle(tag)}
                onDelete={() => setItems((l) => l.filter((x) => x !== tag))}
              />
            ))}
          </div>
        </Stage>
      }
      customize={
        <Customize controls={CONTROLS} values={values} onChange={setValues} />
      }
      code={codeOf({
        component: 'Chip',
        values: {
          label: 'React',
          ...values,
          selected: true,
          onClick: true,
          onDelete: true,
        },
        defaults: DEFAULTS,
        notation: NOTATION,
      })}
      props={PROPS}
      usage={<Usage />}
      a11y={<A11y />}
    />
  );
}
