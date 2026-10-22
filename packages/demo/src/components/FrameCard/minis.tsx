import { useState, type ReactNode } from 'react';
import { Send } from 'lucide-react';
import {
  Button,
  Chip,
  Loader,
  SegmentedButtons,
  Slider,
  Switch,
} from '@taein-ui/core';

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

/** 소개의 "먼저 만져 볼 것" 카드(touch)에 놓이는, 손으로 만지는 정적 미니. 나머지 카드는 상세 무대를 그대로 돌린다 */
export const TOUCH_MINI: Record<string, () => ReactNode> = {
  Switch: () => <Switch label="알림" defaultChecked />,
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
  Button: () => (
    <Button size="md" leftIcon={<Send />}>
      보내기
    </Button>
  ),
  Loader: () => <Loader size="lg" />,
  Chip: ChipMini,
};
