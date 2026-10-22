import { useRef, useState, type ComponentProps } from 'react';
import { Button, Modal } from '@taein-ui/core';
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
  '삭제 확인이나 폼 입력처럼 사용자가 답하기 전에는 뒤 화면을 쓰지 못하게 해야 할 때 화면 가운데에 띄웁니다. 누른 단추 자리에서 자라 나옵니다.';

const CONTROLS: Control[] = [
  { prop: 'title', kind: 'text', label: 'title' },
  { prop: 'size', kind: 'choice', options: ['sm', 'md', 'lg'] },
  { prop: 'showClose', kind: 'toggle' },
  { prop: 'footerAlign', kind: 'choice', options: ['left', 'center', 'right'] },
];

const INITIAL: Values = {
  title: '저장했습니다',
  size: 'sm',
  showClose: true,
  footerAlign: 'right',
};

const DEFAULTS: Values = {
  size: 'md',
  footerAlign: 'left',
};

const BODY = '변경사항을 안전하게 보관했습니다.';

const NOTATION = {
  open: { expr: 'open' },
  onClose: { expr: '() => setOpen(false)' },
  triggerRef: { expr: 'triggerRef' },
  footer: {
    expr: '<Button onClick={() => setOpen(false)}>확인</Button>',
    import: { name: 'Button', from: '@taein-ui/core' },
  },
};

// 커서가 단추를 눌러 모달을 연다. 모달이 단추 자리에서 자라 나오고 잠시 머문 뒤, 커서가 확인을 눌러 닫는다
// shortcut: 열림(0.5초)과 머무름을 합친 쉬는 시간 2초는 core 열림 길이(slower 500ms)에 맞춘 값이다, 열림이 길어지면 같이 늘린다
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
    description: 'Flat에서는 본문, Compound에서는 하위 컴포넌트',
  },
  {
    name: 'size',
    type: "'sm' | 'md' | 'lg' | 'xl' | 'full'",
    default: "'md'",
    description:
      '너비. 400, 600, 800, 1000px이고 full은 화면 너비에서 64px을 뺀다. 놓일 자리보다 넓으면 자리에 맞게 줄어든다',
  },
  {
    name: 'title',
    type: 'string',
    description: 'Flat. 제목. 머리글(Header)과 제목(Title)을 만들어 준다',
  },
  {
    name: 'showClose',
    type: 'boolean',
    default: 'false',
    description: 'Flat. 머리글 오른쪽의 닫기(X) 단추. title과 함께 쓴다',
  },
  {
    name: 'footer',
    type: 'ReactNode',
    description: 'Flat. 아래쪽 푸터 영역',
  },
  {
    name: 'footerAlign',
    type: "'left' | 'center' | 'right'",
    default: "'left'",
    description: 'Flat. 푸터 안 단추의 정렬',
  },
  {
    name: 'triggerRef',
    type: 'RefObject<HTMLElement | null>',
    description:
      '모달을 연 단추. 모달이 그 자리에서 자라 나온다. 안 주면 열 때 포커스를 가진 요소를 쓴다',
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
      '모달을 그릴 DOM 위치. 안 주거나 null이면 document.body. 주면 그 안에 그려지고 body 스크롤을 잠그지 않는다',
  },
  {
    name: 'aria-labelledby',
    type: 'string',
    description: '제목 요소의 id. 제목을 Modal 밖에 둘 때 쓴다',
  },
  {
    name: 'aria-describedby',
    type: 'string',
    description: '설명 요소의 id',
  },
  {
    name: 'aria-label',
    type: 'string',
    description: '눈에 보이는 제목이 없을 때의 이름',
  },
];

const BASIC = `const [open, setOpen] = useState(false);
const triggerRef = useRef<HTMLButtonElement>(null);

<Button ref={triggerRef} onClick={() => setOpen(true)}>
  삭제
</Button>
<Modal
  open={open}
  onClose={() => setOpen(false)}
  triggerRef={triggerRef}
  title="항목을 삭제할까요?"
  footer={
    <>
      <Button variant="light" onClick={() => setOpen(false)}>취소</Button>
      <Button variant="danger" onClick={remove}>삭제</Button>
    </>
  }
  footerAlign="right"
>
  삭제하면 되돌릴 수 없습니다.
</Modal>`;

const COMPOUND = `<Modal open={open} onClose={() => setOpen(false)}>
  <Modal.Header showClose>
    <Modal.Title>프로필 수정</Modal.Title>
  </Modal.Header>
  <Modal.Content>
    <TextField label="이름" />
  </Modal.Content>
  <Modal.Footer align="right">
    <Button onClick={() => setOpen(false)}>저장</Button>
  </Modal.Footer>
</Modal>`;

const CONTAINER = `<div style={{ position: 'relative', contain: 'layout' }} ref={setBox}>
  {box && (
    <Modal open={open} onClose={close} container={box} title="상자 안">
      내용
    </Modal>
  )}
</div>`;

function Usage() {
  return (
    <Topics>
      <Topic title="언제 쓰나">
        <p className={t.body}>
          사용자가 답해야 다음으로 갈 수 있는 일, 이를테면 삭제 확인이나 입력
          폼에 씁니다. 잠깐 알리기만 하면 되는 내용은 <code>Snackbar</code>에
          맡깁니다. 옆에서 보조 정보를 보여 줄 때는 <code>SideSheet</code>,
          아래에서 고르게 할 때는 <code>BottomSheet</code>를 씁니다. 단추 바로
          옆의 작은 패널이면 <code>Popover</code>입니다.
        </p>
      </Topic>
      <Topic title="열고 닫기">
        <p className={t.body} style={{ marginBottom: 12 }}>
          열림은 부모가 쥡니다. 단추를 누르면 <code>open</code>을 켜고, Esc나
          배경 클릭, 닫기 단추가 <code>onClose</code>를 부르면 거기서{' '}
          <code>open</code>을 내립니다. 배경 클릭과 Esc는{' '}
          <code>closeOnBackdropClick</code>, <code>closeOnEscape</code>로 끌 수
          있습니다. 둘 다 끄면 모달 안에 닫는 단추를 꼭 두어야 합니다.
        </p>
        <CodeBlock code={BASIC} />
      </Topic>
      <Topic title="누른 단추에서 자라기">
        <p className={t.body}>
          <code>triggerRef</code>에 단추의 ref를 주면 모달이 그 자리에서 자라
          나오고, 닫을 때 그 자리로 되접힙니다. 배율은 쓰지 않고 보이는 창만
          단추 크기에서 넓혀 가므로 글자가 찌그러지지 않습니다. 안 주면 열 때
          포커스를 가진 요소에서 자랍니다. macOS의 Safari와 Firefox는 단추를
          눌러도 포커스를 주지 않아 가운데에서 열리므로 ref를 주는 쪽이
          확실합니다. 열리는 데 0.5초 남짓 걸리고, 닫을 때는 그 65% 길이로
          되감깁니다.
        </p>
      </Topic>
      <Topic title="Flat과 Compound">
        <p className={t.body} style={{ marginBottom: 12 }}>
          위의 <code>title</code>, <code>footer</code>처럼 prop으로 짜면 머리글,
          본문, 푸터를 만들어 줍니다. 제목 옆에 다른 것을 놓는 식으로 직접
          짜려면 하위 컴포넌트를 씁니다.
        </p>
        <CodeBlock code={COMPOUND} />
        <ul className={`${t.list} ${t.body}`} style={{ marginTop: 12 }}>
          <li>
            <code>Modal.Header</code>: <code>showClose</code>를 주면 오른쪽에
            닫기 단추가 붙고 <code>onClose</code>에 자동으로 이어집니다.
          </li>
          <li>
            <code>Modal.Title</code>: 기본 <code>h2</code>이고 <code>as</code>로
            바꿉니다. <code>id</code>는 모달이 쥐고 있어 따로 주어도 덮어씁니다.
          </li>
          <li>
            <code>Modal.Content</code>: 본문 영역입니다.
          </li>
          <li>
            <code>Modal.Footer</code>: <code>align</code>(left, center,
            right)으로 단추를 정렬합니다.
          </li>
        </ul>
      </Topic>
      <Topic title="상자 안에 그리기">
        <p className={t.body} style={{ marginBottom: 12 }}>
          모달은 기본적으로 <code>document.body</code>에 그려지고 열려 있는 동안
          body 스크롤을 잠급니다. <code>container</code>에 요소를 주면 그 안에
          그려지고 스크롤을 잠그지 않습니다. 화면이 그 요소에 갇히려면 요소가{' '}
          <code>contain: layout</code>이나 <code>transform</code>으로 fixed의
          기준이 되어야 합니다. 위 무대가 이렇게 만들어져 있습니다.
        </p>
        <CodeBlock code={CONTAINER} />
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
        열면 포커스가 모달 안의 첫 번째 포커스 가능한 요소로 옮겨 가고, 없으면
        모달 자체가 받습니다. Tab과 Shift+Tab은 모달 안에서만 돕니다.
      </li>
      <li>
        Esc로 닫히고(<code>closeOnEscape</code>), 닫으면 포커스가 열기 직전에
        있던 요소로 돌아갑니다.
      </li>
      <li>
        닫히는 동안 모달은 <code>inert</code>라 포커스나 클릭을 받지 않습니다.
      </li>
      <li>
        <code>container</code>를 주지 않으면 열려 있는 동안 body 스크롤이
        잠깁니다.
      </li>
      <li>
        개발자가 직접 해야 합니다. <code>title</code>이나{' '}
        <code>Modal.Title</code>이 없으면 <code>aria-label</code> 또는{' '}
        <code>aria-labelledby</code>로 이름을 줍니다. 닫을 길(닫기 단추, Esc,
        배경 클릭) 가운데 하나는 항상 열어 둡니다.
      </li>
    </ul>
  );
}

type Size = ComponentProps<typeof Modal>['size'];
type Align = ComponentProps<typeof Modal>['footerAlign'];

/** 무대 조각. 상세 페이지와 전체 컴포넌트 카드가 같이 쓴다 */
export function ModalDemo({ values = INITIAL, mini }: DemoProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const close = () => setOpen(false);

  return (
    // 함수형 children이 넘기는 상자(container)에 그리면 모달이 무대 안에 갇힌다
    <Stage mini={mini} label="Modal 시연" script={SCRIPT} onPause={close}>
      {(container) => (
        <>
          <Button
            ref={triggerRef}
            data-stage-target="trigger"
            size="sm"
            onClick={() => setOpen(true)}
          >
            모달 열기
          </Button>
          <Modal
            open={open}
            onClose={close}
            container={container}
            triggerRef={triggerRef}
            title={String(values.title)}
            size={values.size as Size}
            showClose={values.showClose === true}
            footer={
              <Button size="sm" data-stage-target="close" onClick={close}>
                확인
              </Button>
            }
            footerAlign={values.footerAlign as Align}
          >
            {BODY}
          </Modal>
        </>
      )}
    </Stage>
  );
}

export function ModalPage() {
  const [values, setValues] = useState<Values>(INITIAL);

  return (
    <DetailLayout
      name="Modal"
      lead={LEAD}
      stage={<ModalDemo values={values} />}
      customize={
        <Customize controls={CONTROLS} values={values} onChange={setValues} />
      }
      code={codeOf({
        component: 'Modal',
        values: {
          open: true,
          onClose: true,
          triggerRef: true,
          ...values,
          footer: true,
          children: BODY,
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
