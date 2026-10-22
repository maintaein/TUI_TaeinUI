import { test, expect } from '@playwright/test';
import { mountLive } from './livePreview';

/**
 * 글자가 있는 Divider에서도 variant가 양쪽 선에 실제로 그려지는지 계산된 스타일로 잰다.
 * 글자가 있으면 루트 border가 0이고 선은 자식 두 토막이 그린다.
 */
const CODE = `<div>
<div id="h"><Divider variant="dashed">또는</Divider></div>
<div id="v" style={{ display: 'flex', height: 100 }}><Divider variant="dotted" orientation="vertical">또는</Divider></div>
</div>`;

test('글자가 있는 Divider의 양쪽 선이 variant를 따른다', async ({ page }) => {
  await mountLive(page, CODE, '#h');
  const styleOf = (id: string, side: 'Top' | 'Left') =>
    page
      .locator(`#${id} [role="separator"] > div`)
      .evaluateAll(
        (els, s) =>
          els.map((el) =>
            getComputedStyle(el).getPropertyValue(`border-${s}-style`)
          ),
        side.toLowerCase()
      );

  // 자식은 [선, 글자, 선]이고 글자 칸은 border가 없어 none이다.
  const h = await styleOf('h', 'Top');
  expect(h.filter((s) => s === 'dashed')).toHaveLength(2);
  const v = await styleOf('v', 'Left');
  expect(v.filter((s) => s === 'dotted')).toHaveLength(2);
});
