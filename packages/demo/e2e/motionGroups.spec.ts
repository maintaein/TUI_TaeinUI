import { expect, test } from '@playwright/test';
import {
  groupMotion,
  motionCategoryLabels,
  motionData,
} from '../src/data/components';

// 다섯 분류가 모두 차서 화면으로는 "빈 분류 숨김"을 볼 수 없다. 항목을 뺀 목록으로 규칙만 직접 본다(페이지를 열지 않는다)
test('항목이 없는 분류는 묶음에서 빠진다', () => {
  const groups = groupMotion(
    motionData.filter((m) => m.category !== 'background')
  );
  expect(groups.map((g) => g.label)).not.toContain(
    motionCategoryLabels.background
  );
  expect(groups).toHaveLength(4);
});
