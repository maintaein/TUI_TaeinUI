import { test, expect } from '@playwright/test';
import { mountLive } from './livePreview';

/**
 * 삭제 버튼이 있는 outlined Chip이 다른 칩보다 2px 높던 결함(f08877a)을 잰다.
 *
 * 칩의 줄 높이는 글자 줄, 세로 패딩, 테두리, 삭제 버튼의 레이아웃 높이가 합쳐서
 * 정한다. 테두리가 있는 outlined만 2 + 8 + 16 = 26px가 되어 24px인 다른 칩보다
 * 높았다. jsdom은 레이아웃이 없어 CSS 값 단언으로는 이 합이 맞는지 알 수 없다.
 * 고친 곳은 Chip.css.ts의 deleteButton `margin: '-4px 0'`이다.
 *
 * 크기마다 variant(outlined/filled) x 상호작용(기본/삭제/클릭/클릭+삭제)을 모두
 * 놓고 높이를 본다. 절대값은 단언하지 않는다(토큰이 바뀌어도 이 결함의 회귀가
 * 아니다). 같은 variant 안의 넷은 크기를 막론하고 같아야 한다. sm·md는 minHeight
 * 24px가 받쳐 outlined와 filled까지 여덟이 모두 같다. lg는 minHeight가 없어
 * outlined(테두리 1px x 2)가 filled보다 2px 큰 것이 지금 거동이다(34 대 32).
 * 이 차이는 f08877a의 결함이 아니므로 고정하지도 않고 가리지도 않는다.
 */

const del = '() => {}';
const row = (size: 'sm' | 'md' | 'lg') =>
  (['outlined', 'filled'] as const)
    .flatMap((variant) => [
      `<Chip size="${size}" variant="${variant}" label="a" />`,
      `<Chip size="${size}" variant="${variant}" label="b" onDelete={${del}} />`,
      `<Chip size="${size}" variant="${variant}" label="c" onClick={${del}} />`,
      `<Chip size="${size}" variant="${variant}" label="d" onClick={${del}} onDelete={${del}} />`,
    ])
    .join('');

const CODE = `<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
${(['sm', 'md', 'lg'] as const)
  .map(
    (size) =>
      `<div id="chips-${size}" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>${row(size)}</div>`
  )
  .join('\n')}
</div>`;

for (const size of ['sm', 'md', 'lg'] as const) {
  test(`${size} 칩의 높이가 같다`, async ({ page }) => {
    await mountLive(page, '/components/chip', CODE, `#chips-${size}`);
    const heights = await page
      .locator(`#chips-${size}`)
      .evaluate((row) =>
        [...row.children].map((chip) => chip.getBoundingClientRect().height)
      );

    // 선택자가 아무것도 못 잡으면 같음 단언이 비어 통과한다.
    expect(heights).toHaveLength(8);
    const [outlined, filled] = [heights.slice(0, 4), heights.slice(4)];
    for (const group of [outlined, filled]) {
      for (const h of group) expect(h).toBeCloseTo(group[0], 1);
    }
    if (size !== 'lg') {
      for (const h of heights) expect(h).toBeCloseTo(heights[0], 1);
    }
  });
}
