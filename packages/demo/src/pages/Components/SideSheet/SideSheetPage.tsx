import { useState, type ComponentProps } from 'react';
import { Button, SideSheet } from '@taein-ui/core';
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

const LEAD =
  '보던 화면을 유지한 채 상세 정보나 설정 패널 같은 보조 내용을 옆에서 밀어 넣어 보여 줍니다. 왼쪽이나 오른쪽 가장자리에 붙습니다.';

const CONTROLS: Control[] = [
  { prop: 'title', kind: 'text', label: 'title' },
  { prop: 'position', kind: 'choice', options: ['right', 'left'] },
  { prop: 'width', kind: 'choice', options: ['sm', 'md', 'lg'] },
  { prop: 'showClose', kind: 'toggle' },
];

const INITIAL: Values = {
  title: '주문 상세',
  position: 'right',
  width: 'sm',
  showClose: false,
};

const DEFAULTS: Values = {
  position: 'right',
  width: 'md',
};

const BODY = '배송 준비 중입니다. 도착 예정일은 내일입니다.';
const CODE_BODY = `<p>${BODY}</p>\n  <Button onClick={() => setOpen(false)}>닫기</Button>`;

const NOTATION = {
  open: { expr: 'open' },
  onClose: { expr: '() => setOpen(false)' },
};

// 커서가 단추를 눌러 시트를 연다. 시트가 옆에서 밀려 들어와 앉고 잠시 머문 뒤, 커서가 안쪽 닫기를 눌러 닫는다
const SCRIPT = (act: Act) => {
  act.move('trigger');
  act.hover('trigger');
  act.wait(0.3);
  act.press('trigger');
  act.leave('trigger');
  act.wait(2);
  act.move('close');
  act.hover('close');
  act.wait(0.3);
  act.press('close');
  act.leave('close');
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
      '닫으라는 요청이 올 때 불린다(Esc, 배경 클릭, 닫기 단추). 여기서 open을 내린다',
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
    name: 'position',
    type: "'left' | 'right'",
    default: "'right'",
    description: '붙는 가장자리',
  },
  {
    name: 'width',
    type: "'sm' | 'md' | 'lg' | 'full'",
    default: "'md'",
    description:
      '너비. 300, 400, 600px이고 full은 화면 전체. sm, md, lg는 화면 너비의 80%, 85%, 90%를 넘지 않는다',
  },
  {
    name: 'showClose',
    type: 'boolean',
    default: 'false',
    description: '머리글 오른쪽의 닫기(X) 단추. title과 함께 쓸 때만 나온다',
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
    description: '제목 요소의 id. 제목을 SideSheet 밖에 둘 때 쓴다',
  },
];

const BASIC = `const [open, setOpen] = useState(false);

<Button onClick={() => setOpen(true)}>상세 보기</Button>
<SideSheet
  open={open}
  onClose={() => setOpen(false)}
  title="주문 상세"
  position="right"
  showClose
>
  <p>배송 준비 중입니다.</p>
</SideSheet>`;

const COMPOUND = `<SideSheet open={open} onClose={() => setOpen(false)}>
  <SideSheet.Header showClose>
    <SideSheet.Title>설정</SideSheet.Title>
  </SideSheet.Header>
  <SideSheet.Content>
    <Switch label="알림 받기" />
  </SideSheet.Content>
</SideSheet>`;

function Usage() {
  return (
    <Topics>
      <Topic title="언제 쓰나">
        <p className={t.body}>
          목록을 보다가 한 항목의 상세를 열거나, 설정 패널을 띄워도 원래 화면을
          계속 보이게 두고 싶을 때 씁니다. 답을 받아야 하는 확인은{' '}
          <code>Modal</code> 몫이고 모바일에서 아래에서 올리는 선택은{' '}
          <code>BottomSheet</code> 몫입니다.
        </p>
      </Topic>
      <Topic title="열고 닫기">
        <p className={t.body} style={{ marginBottom: 12 }}>
          열림은 부모가 쥡니다. 단추를 누르면 <code>open</code>을 켜고, Esc,
          배경 클릭, 닫기 단추가 <code>onClose</code>를 부르면 거기서{' '}
          <code>open</code>을 내립니다. 닫는 길이 전부 막히지 않게, 배경 클릭과
          Esc를 끄면 시트 안에 닫는 단추를 둡니다.
        </p>
        <CodeBlock code={BASIC} />
      </Topic>
      <Topic title="왼쪽과 오른쪽, 너비">
        <p className={t.body}>
          <code>position</code>은 붙는 가장자리를 정하고 그쪽에서 들어옵니다.
          너비는 <code>sm</code>, <code>md</code>, <code>lg</code>가 각각 300,
          400, 600px이며 좁은 화면에서는 화면 너비의 80%, 85%, 90%까지만
          넓어집니다. <code>full</code>은 화면 전체를 덮습니다. 높이는 늘 화면
          높이입니다.
        </p>
      </Topic>
      <Topic title="움직임">
        <p className={t.body}>
          가장자리에서 목표를 16px쯤 지나쳤다가 앉으며 0.5초가 걸리는데, 지나친
          동안 비는 틈은 시트와 같은 색 그림자로 가려 가장자리가 붙어 있는
          것처럼 보입니다. 안쪽 내용은 시트가 거의 들어왔을 때 45ms 간격으로
          하나씩 위로 떠오릅니다(처음 여덟 개까지). 한 요소로 감싸면 하나로
          떠오르므로 항목을 직접 children으로 넘깁니다. 열려 있는 동안에는 3초
          주기로 3px 둥실거립니다.
        </p>
      </Topic>
      <Topic title="Compound와 상자 안에 그리기">
        <p className={t.body} style={{ marginBottom: 12 }}>
          머리글을 직접 짜려면 <code>SideSheet.Header</code>(
          <code>showClose</code>), <code>SideSheet.Title</code>,{' '}
          <code>SideSheet.Content</code>를 씁니다. 시트는 기본적으로{' '}
          <code>document.body</code>에 그려지고 열려 있는 동안 body 스크롤을
          잠급니다. <code>container</code>에 요소를 주면 그 안에 그려지고 잠그지
          않습니다. 화면이 그 요소에 갇히려면 요소가{' '}
          <code>contain: layout</code>이나 <code>transform</code>으로 fixed의
          기준이 되어야 합니다. 위 무대가 그 예입니다.
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
        Esc로 닫히고(<code>closeOnEscape</code>), 닫으면 포커스가 열기 직전에
        있던 요소로 돌아갑니다.
      </li>
      <li>
        닫히는 동안 시트는 <code>inert</code>라 포커스나 클릭을 받지 않습니다.
      </li>
      <li>
        <code>container</code>를 주지 않으면 열려 있는 동안 body 스크롤이
        잠깁니다.
      </li>
      <li>
        개발자가 직접 해야 합니다. <code>title</code>이나{' '}
        <code>SideSheet.Title</code>이 없으면 <code>aria-labelledby</code>로
        이름을 줍니다. 닫을 길(닫기 단추, Esc, 배경 클릭) 가운데 하나는 항상
        열어 둡니다.
      </li>
    </ul>
  );
}

type Width = ComponentProps<typeof SideSheet>['width'];
type Position = ComponentProps<typeof SideSheet>['position'];

/** 무대 조각. 상세 페이지와 전체 컴포넌트 카드가 같이 쓴다 */
export function SideSheetDemo({ values = INITIAL, mini }: DemoProps) {
  const [open, setOpen] = useState(false);
  // 카드 속 미니가 서 있을 때(멈춤, 축소 모션, 화면 밖) 트리거 단추만이 아니라 열린 대표 장면을 보인다
  const [still, setStill] = useState(false);
  const close = () => setOpen(false);

  return (
    // 함수형 children이 넘기는 상자(container)에 그리면 시트가 무대 안 가장자리에 갇힌다
    <Stage
      mini={mini}
      label="SideSheet 시연"
      script={SCRIPT}
      onPause={close}
      onStill={setStill}
    >
      {(container) => (
        <>
          <Button
            data-stage-target="trigger"
            size="sm"
            onClick={() => setOpen(true)}
          >
            시트 열기
          </Button>
          <SideSheet
            open={open || still}
            onClose={close}
            container={container}
            title={String(values.title)}
            position={values.position as Position}
            width={values.width as Width}
            showClose={values.showClose === true}
            // 시트 높이는 화면 높이(100vh)다. 상자 안에서는 상자 높이가 같은 구실을 한다
            style={{ height: '100%' }}
          >
            <p style={{ margin: '0 0 0.75rem' }}>{BODY}</p>
            <Button
              size="sm"
              variant="light"
              data-stage-target="close"
              onClick={close}
            >
              닫기
            </Button>
          </SideSheet>
        </>
      )}
    </Stage>
  );
}

export function SideSheetPage() {
  const [values, setValues] = useState<Values>(INITIAL);

  return (
    <DetailLayout
      name="SideSheet"
      lead={LEAD}
      stage={<SideSheetDemo values={values} />}
      customize={
        <Customize controls={CONTROLS} values={values} onChange={setValues} />
      }
      code={codeOf({
        component: 'SideSheet',
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
