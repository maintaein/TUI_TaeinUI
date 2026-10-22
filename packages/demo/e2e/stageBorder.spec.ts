import { test, expect } from '@playwright/test';

/**
 * Border 상세의 무대: 클릭 0회로 커서가 테두리에 올라가 머무는 동안 호버 빛(glow)이 켜진다.
 * 합성 이벤트로는 CSS :hover가 안 켜져 무대의 호버 거울이 쌍둥이 규칙을 켠다.
 * 빛의 지표는 장식 링(aria-hidden span)의 불투명도와 그 ::before의 회전 애니메이션이다.
 * 테두리를 벗어나면 꺼진다.
 */

const state = () => {
  const border = document.querySelector('[data-stage-target="border"]')!;
  const ring = border.querySelector('span[aria-hidden="true"]')!;
  return {
    hover: border.hasAttribute('data-stage-hover'),
    opacity: Number(getComputedStyle(ring).opacity),
    spinning: getComputedStyle(ring, '::before').animationName !== 'none',
  };
};

for (const [width, height] of [
  [1280, 800],
  [375, 812],
] as const) {
  test(`${width}px: 시연이 테두리에 머무는 동안 빛이 켜지고 떠나면 꺼진다`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await page.mouse.move(2, 2);
    await page.goto('/components/border');
    await page.locator('[data-stage-target="border"]').scrollIntoViewIfNeeded();
    await page.evaluate(() => {
      (window as unknown as { __clicks: number }).__clicks = 0;
      document.addEventListener(
        'click',
        (e) => {
          if (e.isTrusted)
            (window as unknown as { __clicks: number }).__clicks++;
        },
        true
      );
    });

    // 올라가 머무는 중: 빛이 켜지고 돈다
    await expect
      .poll(
        async () => {
          const s = await page.evaluate(state);
          return s.hover && s.opacity === 1 && s.spinning;
        },
        { timeout: 20_000 }
      )
      .toBe(true);
    // 떠나면 꺼진다
    await expect
      .poll(
        async () => {
          const s = await page.evaluate(state);
          return !s.hover && s.opacity === 0 && !s.spinning;
        },
        { timeout: 20_000 }
      )
      .toBe(true);
    expect(
      await page.evaluate(
        () => (window as unknown as { __clicks: number }).__clicks
      )
    ).toBe(0);
  });
}

test('진짜 마우스가 올라오면 거울 표시가 지워지고 진짜 :hover가 빛을 맡는다', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.mouse.move(2, 2);
  await page.goto('/components/border');
  const border = page.locator('[data-stage-target="border"]');
  await border.scrollIntoViewIfNeeded();
  const box = (await border.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, {
    steps: 4,
  });
  await expect
    .poll(async () => {
      const s = await page.evaluate(state);
      return !s.hover && s.opacity === 1 && s.spinning;
    })
    .toBe(true);
  expect(await border.evaluate((el) => el.matches(':hover'))).toBe(true);
});
