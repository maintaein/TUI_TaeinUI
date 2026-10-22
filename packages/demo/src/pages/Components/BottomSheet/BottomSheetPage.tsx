import { useState, type ComponentProps } from 'react';
import { Button, BottomSheet } from '@taein-ui/core';
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
  '옵션 고르기나 필터처럼 짧은 작업을 화면 아래에서 올려 보여 줍니다. 손잡이를 아래로 끌어 닫을 수 있습니다.';

const CONTROLS: Control[] = [
  { prop: 'title', kind: 'text', label: 'title' },
  { prop: 'height', kind: 'choice', options: ['auto', 'sm'] },
  { prop: 'showClose', kind: 'toggle' },
];

const INITIAL: Values = {
  title: '정렬 기준',
  height: 'sm',
  showClose: false,
};

const DEFAULTS: Values = {
  height: 'auto',
};

const BODY = '최신순, 인기순, 가격순으로 정렬할 수 있습니다.';
const CODE_BODY = `<p>${BODY}</p>
  <Button onClick={() => setOpen(false)}>확인</Button>`;

const NOTATION = {
  open: { expr: 'open' },
  onClose: { expr: '() => setOpen(false)' },
};

// 커서가 단추를 눌러 시트를 올린다. 시트가 아래에서 올라와 앉고 잠시 머문 뒤, 커서가 손잡이를 잡고 아래로 끌어 내려 닫는다
// shortcut: 끄는 거리 140px은 core가 닫는 기준(100px)을 넘기는 값이다, 기준이 바뀌면 같이 바꾼다
const SCRIPT = (act: Act) => {
  act.move('trigger');
  act.hover('trigger');
  act.wait(0.3);
  act.press('trigger');
  act.leave('trigger');
  act.wait(2);
  act.pull('sheet', 140);
  act.wait(1.2);
  act.home();
  act.wait(0.4);
};

const PROPS: PropDefinition[] = [
  {
    name: 'open',
    type: 'boolean',
    required: true,
    description: '보일지 여부',
  },
  {
    name: 'onClose',
    type: '() => void',
    required: true,
    description:
      '닫으라는 요청이 올 때 불린다(Esc, 배경 클릭, 아래로 끌기, 닫기 단추). 여기서 open을 내린다',
  },
  {
    name: 'children',
    type: 'ReactNode',
    required: true,
    description: '시트 안 내용',
  },
  {
    name: 'title',
    type: 'ReactNode',
    description: '제목. 주면 머리글을 만들어 준다',
  },
  {
    name: 'height',
    type: "'auto' | 'sm' | 'md' | 'lg' | 'full'",
    default: "'auto'",
    description:
      '높이. auto는 내용에 맞추고(최대 화면 높이의 90%), sm, md, lg, full은 화면 높이의 30%, 50%, 70%, 100%다',
  },
  {
    name: 'showHandle',
    type: 'boolean',
    default: 'true',
    description: '위쪽 손잡이를 그릴지 여부. 끌기 가능 여부와는 별개다',
  },
  {
    name: 'showClose',
    type: 'boolean',
    default: 'false',
    description: '머리글 오른쪽의 닫기(X) 단추. title과 함께 쓸 때만 나온다',
  },
  {
    name: 'enableDrag',
    type: 'boolean',
    default: 'true',
    description:
      '아래로 끌어 닫기. 마우스와 터치 모두 되고, 100px를 넘겨 놓으면 닫히고 덜 끌면 제자리로 돌아온다',
  },
  {
    name: 'closeOnBackdropClick',
    type: 'boolean',
    default: 'true',
    description: '배경(스크림)을 눌러 닫을지 여부',
  },
  {
    name: 'closeOnEscape',
    type: 'boolean',
    default: 'true',
    description: 'Esc 키로 닫을지 여부',
  },
  {
    name: 'container',
    type: 'HTMLElement | null',
    description:
      '시트를 그릴 DOM 위치. 안 주거나 null이면 document.body. 주면 그 안에 그려지고 body 스크롤을 잠그지 않는다',
  },
  {
    name: 'aria-labelledby',
    type: 'string',
    description: '제목 요소의 id. 제목을 BottomSheet 밖에 둘 때 쓴다',
  },
];

const BASIC = `const [open, setOpen] = useState(false);

<Button onClick={() => setOpen(true)}>정렬</Button>
<BottomSheet
  open={open}
  onClose={() => setOpen(false)}
  title="정렬 기준"
  showClose
>
  <Button variant="light" onClick={() => choose('latest')}>최신순</Button>
  <Button variant="light" onClick={() => choose('popular')}>인기순</Button>
</BottomSheet>`;

const COMPOUND = `<BottomSheet open={open} onClose={() => setOpen(false)}>
  <BottomSheet.Header showClose>
    <BottomSheet.Title>필터</BottomSheet.Title>
  </BottomSheet.Header>
  <BottomSheet.Content>
    <Checkbox label="무료 배송" />
  </BottomSheet.Content>
</BottomSheet>`;

function Usage() {
  return (
    <Topics>
      <Topic title="언제 쓰나">
        <p className={t.body}>
          손이 닿는 화면 아래에서 정렬 기준 고르기나 필터 같은 짧은 선택을 받을
          때 씁니다. 답을 받아야 하는 확인이나 긴 입력은 <code>Modal</code>,
          옆에서 보조 정보를 보여 줄 때는 <code>SideSheet</code>가 맞습니다.
        </p>
      </Topic>
      <Topic title="열고 닫기">
        <p className={t.body} style={{ marginBottom: 12 }}>
          열림은 부모가 쥡니다. 단추를 누르면 <code>open</code>을 켜고, Esc,
          배경 클릭, 아래로 끌기, 닫기 단추가 <code>onClose</code>를 부르면
          거기서 <code>open</code>을 내립니다.
        </p>
        <CodeBlock code={BASIC} />
      </Topic>
      <Topic title="끌어서 닫기">
        <p className={t.body}>
          시트에서 단추, 링크, 입력칸이 아닌 곳(손잡이, 제목, 글)을 마우스나
          손가락으로 잡고 아래로 끕니다. 100px를 넘겨 놓으면 닫히고, 시트는 손을
          놓은 자리에서 그대로 이어 내려갑니다. 덜 끌고 놓으면 제자리로
          돌아옵니다. 끄는 동안에는 둥실거림이 멈춥니다. 끌기를 막으려면{' '}
          <code>enableDrag={'{false}'}</code>를 주고, 손잡이만 숨기려면{' '}
          <code>showHandle={'{false}'}</code>를 줍니다. 둘은 서로 영향이
          없습니다.
        </p>
      </Topic>
      <Topic title="움직임과 높이">
        <p className={t.body}>
          올라올 때는 목표를 16px쯤 지나쳤다가 앉으며 0.5초가 걸립니다. 안쪽
          내용은 시트가 거의 올라왔을 때 45ms 간격으로 하나씩 떠오릅니다(처음
          여덟 개까지). 한 요소로 감싸면 하나로 떠오르므로 항목을 직접
          children으로 넘깁니다. 열려 있는 동안에는 3초 주기로 3px 둥실거립니다.
          높이는 화면 높이를 기준으로 하기 때문에 위 무대에서는 <code>sm</code>
          까지만 고르게 했습니다.
        </p>
      </Topic>
      <Topic title="Compound와 상자 안에 그리기">
        <p className={t.body} style={{ marginBottom: 12 }}>
          머리글을 직접 짜려면 <code>BottomSheet.Header</code>(
          <code>showClose</code>), <code>BottomSheet.Title</code>,{' '}
          <code>BottomSheet.Content</code>를 씁니다. 시트는 기본적으로{' '}
          <code>document.body</code>에 그려지고 열려 있는 동안 body 스크롤을
          잠급니다. <code>container</code>에 요소를 주면 그 안에 그려지고 잠그지
          않습니다. 화면이 그 요소에 갇히려면 요소가{' '}
          <code>contain: layout</code>이나 <code>transform</code>으로 fixed의
          기준이 되어야 합니다. 위 무대도 같은 방식입니다.
        </p>
        <CodeBlock code={COMPOUND} />
      </Topic>
    </Topics>
  );
}

function A11y() {
  return (
    <ul className={`${t.list} ${t.body}`}>
      <li>
        <code>role=&quot;dialog&quot;</code>와{' '}
        <code>aria-modal=&quot;true&quot;</code>가 붙습니다. 배경은{' '}
        <code>aria-hidden</code>입니다.
      </li>
      <li>
        열면 포커스가 시트 안의 첫 번째 포커스 가능한 요소로 옮겨 가고, 없으면
        시트 자체가 받습니다. Tab과 Shift+Tab은 시트 안에서만 돕니다.
      </li>
      <li>
        Esc로 닫히고(<code>closeOnEscape</code>), 닫는 애니메이션이 끝나면
        포커스가 열기 직전에 있던 요소로 돌아갑니다.
      </li>
      <li>
        닫히는 동안 시트는 <code>inert</code>라 포커스나 클릭을 받지 않습니다.
      </li>
      <li>
        끌어 닫기는 마우스와 터치용입니다. 키보드로 닫는 길은 Esc와 닫기 단추 (
        <code>showClose</code>)입니다.
      </li>
      <li>
        개발자가 직접 해야 합니다. <code>title</code>이나{' '}
        <code>BottomSheet.Title</code>이 없으면 <code>aria-labelledby</code>로
        이름을 줍니다. 끌기에만 기대지 말고 닫는 단추나 Esc를 열어 둡니다.
      </li>
    </ul>
  );
}

type Height = ComponentProps<typeof BottomSheet>['height'];

export function BottomSheetPage() {
  const [values, setValues] = useState<Values>(INITIAL);
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <DetailLayout
      name="BottomSheet"
      lead={LEAD}
      stage={
        // 함수형 children이 넘기는 상자(container)에 그리면 시트가 무대 안 아래에 갇힌다
        <Stage label="BottomSheet 시연" script={SCRIPT} onPause={close}>
          {(container) => (
            <>
              <Button
                data-stage-target="trigger"
                size="sm"
                onClick={() => setOpen(true)}
              >
                시트 열기
              </Button>
              <BottomSheet
                data-stage-target="sheet"
                open={open}
                onClose={close}
                container={container}
                title={String(values.title)}
                height={values.height as Height}
                showClose={values.showClose === true}
              >
                <p style={{ margin: '0 0 0.75rem' }}>{BODY}</p>
                <Button size="sm" onClick={close}>
                  확인
                </Button>
              </BottomSheet>
            </>
          )}
        </Stage>
      }
      customize={
        <Customize controls={CONTROLS} values={values} onChange={setValues} />
      }
      code={codeOf({
        component: 'BottomSheet',
        values: {
          open: true,
          onClose: true,
          ...values,
          children: CODE_BODY,
        },
        defaults: DEFAULTS,
        notation: NOTATION,
        imports: [{ name: 'Button', from: '@taein-ui/core' }],
      })}
      props={PROPS}
      usage={<Usage />}
      a11y={<A11y />}
    />
  );
}
