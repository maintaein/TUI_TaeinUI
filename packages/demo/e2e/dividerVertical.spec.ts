import { test, expect } from '@playwright/test';
import { mountLive } from './livePreview';

/**
 * 세로 Divider가 flex 줄의 높이를 채우는지 실제 레이아웃으로 잰다(be4250e 계열).
 *
 * 예전 세로 구분선은 `height: 100%`와 `minHeight: 100px`였다. 높이가 정해지지 않은
 * flex 줄에서 `height: 100%`는 stretch를 막아 선이 접히고, minHeight는 짧은 줄을
 * 넘쳤다. 지금은 `alignSelf: stretch`가 줄 높이를 채운다. jsdom은 레이아웃을 계산하지
 * 않아 높이도 넘침도 읽지 못한다.
 *
 * 줄은 `alignItems: center`로 둔다. 기본 stretch면 어떤 구현이든 채워 보이므로, 중앙
 * 정렬에서도 Divider가 스스로 채우는지(`alignSelf`가 이기는지)를 본다. 줄 높이는
 * 높이를 못 박은 형제가 정한다. 짧은 줄과 긴 줄 둘로 minHeight 넘침도 잡는다.
 */

const rows = [
  { id: 'short', height: 30 },
  { id: 'tall', height: 160 },
];

const CODE = `<div>
${rows
  .map(
    ({ id, height }) =>
      `<div id="${id}" style={{ display: 'flex', alignItems: 'center' }}><div style={{ height: '${height}px' }}>왼쪽</div><Divider orientation="vertical" /><div>오른쪽</div></div>`
  )
  .join('\n')}
</div>`;

for (const { id, height } of rows) {
  test(`줄 높이 ${height}px 안에서 세로 구분선이 줄 높이를 채우고 넘지 않는다`, async ({
    page,
  }) => {
    await mountLive(page, '/components/divider', CODE, `#${id}`);
    const row = page.locator(`#${id}`);
    const separator = row.getByRole('separator');
    await expect(separator).toHaveCount(1);

    const rowBox = (await row.boundingBox())!;
    const box = (await separator.boundingBox())!;

    // 줄 높이는 높이를 못 박은 형제가 정한다.
    expect(rowBox.height).toBeCloseTo(height, 0);
    expect(box.height).toBeCloseTo(rowBox.height, 0);
    expect(box.y).toBeGreaterThanOrEqual(rowBox.y - 0.5);
    expect(box.y + box.height).toBeLessThanOrEqual(
      rowBox.y + rowBox.height + 0.5
    );
  });
}
