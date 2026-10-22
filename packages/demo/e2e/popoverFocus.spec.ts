import { test, expect } from '@playwright/test';
import { mountLive } from './livePreview';

/**
 * M6 Task 8b: Popover가 열리면 포커스가 팝오버 안으로 옮겨 가는지 잰다.
 *
 * jsdom은 visibility 전이를 그리지 못해 단위 시험으로는 못 잡는다. 포커스는
 * 보이지 않는 요소(visibility: hidden)로는 들어가지 못하므로, 포커스를 부르는
 * 시점에 팝오버가 이미 보여야 한다.
 */

const CODE = `<div id="p" style={{ padding: '4rem' }}>
  <Popover content={<div style={{ padding: '1rem' }}><button id="inner">안쪽</button></div>}>
    <Button id="trigger">열기</Button>
  </Popover>
</div>`;

for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  test(`Popover를 열면 보이게 된 뒤 포커스가 안쪽으로 간다 (${reducedMotion})`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion });
    await mountLive(page, CODE, '#trigger');
    await page.locator('#trigger').click();

    await expect(page.locator('#inner')).toBeFocused({ timeout: 1500 });

    await page.keyboard.press('Escape');
    await expect(page.locator('#trigger')).toBeFocused();
  });
}
