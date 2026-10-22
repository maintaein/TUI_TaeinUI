import { useRef, useState, type ReactNode } from 'react';
import { Bell, Heart, Save, Send } from 'lucide-react';
import {
  Avatar,
  Badge,
  BoardRow,
  Border,
  BottomSheet,
  Button,
  Card,
  Checkbox,
  Chip,
  Divider,
  HeaderBar,
  IconButton,
  List,
  ListItem,
  Loader,
  Modal,
  NumericSpinner,
  Popover,
  SegmentedButtons,
  SideSheet,
  Skeleton,
  Slider,
  Snackbar,
  Switch,
  TextField,
  Tooltip,
} from '@taein-ui/core';

/** 카드 상자. 오버레이는 core `container`로 이 안에 그려지고, 아직 상자가 없으면 null이다 */
type Mini = (props: { box: HTMLElement | null }) => ReactNode;

// 열린 채로 멈춘 오버레이의 닫기 요청. 닫지 않는다(카드는 보기 전용이다)
const keepOpen = () => undefined;

function ChipMini() {
  const [on, setOn] = useState(true);
  return (
    <Chip
      label="디자인"
      color="primary"
      selected={on}
      onClick={() => setOn((v) => !v)}
    />
  );
}

function ModalMini({ box }: { box: HTMLElement | null }) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  return (
    <>
      <Button ref={triggerRef} size="sm">
        모달 열기
      </Button>
      {box && (
        <Modal
          open
          onClose={keepOpen}
          container={box}
          triggerRef={triggerRef}
          title="저장했습니다"
          size="sm"
          footer={
            <Button size="sm" onClick={keepOpen}>
              확인
            </Button>
          }
        >
          변경사항을 안전하게 보관했습니다.
        </Modal>
      )}
    </>
  );
}

export const MINI: Record<string, Mini> = {
  // 폼 & 입력
  TextField: () => <TextField label="이름" placeholder="김태인" size="sm" />,
  Checkbox: () => <Checkbox label="약관에 동의합니다" defaultChecked />,
  Switch: () => <Switch label="알림" defaultChecked />,
  NumericSpinner: () => (
    <NumericSpinner label="수량" defaultValue={2} size="sm" />
  ),
  SegmentedButtons: () => (
    <SegmentedButtons
      aria-label="기간"
      size="sm"
      defaultValue="week"
      options={[
        { value: 'day', label: '일간' },
        { value: 'week', label: '주간' },
        { value: 'month', label: '월간' },
      ]}
    />
  ),
  Slider: () => (
    <div style={{ width: 200 }}>
      <Slider label="볼륨" defaultValue={40} showValue />
    </div>
  ),
  // 버튼
  Button: () => (
    <Button size="md" leftIcon={<Send />}>
      보내기
    </Button>
  ),
  IconButton: () => (
    <IconButton aria-label="좋아요">
      <Heart />
    </IconButton>
  ),
  // 피드백 & 상태
  Badge: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <Bell aria-hidden="true" />
      <Badge size="lg">12</Badge>
    </div>
  ),
  Loader: () => <Loader size="lg" />,
  Skeleton: () => (
    <div style={{ display: 'grid', gap: 8, width: 180 }}>
      <Skeleton variant="text" width="80%" />
      <Skeleton variant="text" />
      <Skeleton variant="rounded" height={56} />
    </div>
  ),
  // 알림줄은 position: fixed다. 카드 상자(contain: layout)가 기준이 되어 카드 안에 뜬다
  Snackbar: () => (
    <Snackbar
      open
      message="저장했습니다"
      severity="success"
      autoHideDuration={null}
    />
  ),
  Tooltip: () => (
    <Tooltip open content="변경사항 저장" arrow>
      <Button variant="light" size="sm" leftIcon={<Save />}>
        저장
      </Button>
    </Tooltip>
  ),
  // 오버레이
  Modal: ModalMini,
  BottomSheet: ({ box }) =>
    box && (
      <BottomSheet
        open
        onClose={keepOpen}
        container={box}
        title="공유"
        height="sm"
      >
        링크를 복사해 보내 보세요.
      </BottomSheet>
    ),
  SideSheet: ({ box }) =>
    box && (
      <SideSheet
        open
        onClose={keepOpen}
        container={box}
        title="필터"
        width="sm"
        // 시트 높이는 화면 높이(100vh)다. 상자 안에서는 상자 높이가 같은 구실을 한다
        style={{ height: '100%' }}
      >
        조건을 고르세요.
      </SideSheet>
    ),
  Popover: () => (
    <Popover
      open
      onOpenChange={keepOpen}
      closeOnOutsideClick={false}
      closeOnEscape={false}
      content={<p style={{ margin: 0, padding: 12 }}>김태인</p>}
    >
      <Button size="sm">계정</Button>
    </Popover>
  ),
  // 레이아웃
  HeaderBar: () => (
    <div style={{ width: '100%' }}>
      <HeaderBar
        title="Store"
        titleAs="span"
        items={[
          { label: '홈', active: true },
          { label: '소개' },
          { label: '문의' },
        ]}
      />
    </div>
  ),
  Divider: () => (
    <div style={{ width: '100%' }}>
      <p style={{ margin: 0 }}>첫 번째 섹션입니다.</p>
      <Divider>또는</Divider>
      <p style={{ margin: 0 }}>두 번째 섹션입니다.</p>
    </div>
  ),
  Border: () => (
    <Border variant="dashed" rounded="md" padding="md" color="primary">
      테두리로 감쌉니다
    </Border>
  ),
  List: () => (
    <List divider style={{ width: '100%' }}>
      <ListItem label="이름" value="홍길동" />
      <ListItem label="역할" value="프론트엔드" />
    </List>
  ),
  BoardRow: () => (
    <div style={{ display: 'grid', gap: 8, width: '100%' }}>
      <BoardRow title="배송은 얼마나 걸리나요?" expanded onChange={keepOpen}>
        주문 후 2~3일 이내에 배송됩니다.
      </BoardRow>
      <BoardRow title="반품은 어떻게 하나요?">답변이 들어갑니다.</BoardRow>
    </div>
  ),
  // 데이터 표시
  Avatar: () => (
    <Avatar alt="태인" size="lg" status="online">
      태인
    </Avatar>
  ),
  Chip: ChipMini,
  Card: () => (
    <Card variant="outlined" style={{ width: '100%' }}>
      <Card.Header>
        <Card.Title as="h4">월간 리포트</Card.Title>
      </Card.Header>
      <Card.Body>이번 달 방문자가 12% 늘었습니다.</Card.Body>
    </Card>
  ),
};

/** 열린 모습이 들어갈 만큼 키가 큰 카드 */
export const OVERLAYS = new Set([
  'Modal',
  'BottomSheet',
  'SideSheet',
  'Popover',
]);
