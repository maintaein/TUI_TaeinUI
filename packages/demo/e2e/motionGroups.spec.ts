import { expect, test } from '@playwright/test';
import {
  groupMotion,
  motionCategoryLabels,
  motionData,
} from '../src/data/components';

// 원고지 넘김이 "애니메이션" 분류를 채워 텍스트 애니메이션, 애니메이션, 컴포넌트, 마이크로 인터랙션 4개가 남는다. 배경을 뺀 목록으로 규칙을 직접 본다(페이지를 열지 않는다)
test('항목이 없는 분류는 묶음에서 빠진다', () => {
  const groups = groupMotion(
    motionData.filter((m) => m.category !== 'background')
  );
  expect(groups.map((g) => g.label)).not.toContain(
    motionCategoryLabels.background
  );
  expect(groups).toHaveLength(4);
});
