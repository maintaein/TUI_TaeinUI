import { test, expect } from '@playwright/test';

/**
 * Border 상세의 무대: 클릭 0회로 로더가 돈다. "답변을 만들고 있습니다"인 동안 glow가 켜져
 * 꼬리 달린 빛이 테두리를 돌고, 완료 글로 바뀌면 glow가 꺼진다. 다시 시작하면 돈다.
 * 호버나 포커스와 무관하게 켜져 있는 동안 돈다.
 * 빛의 지표는 장식 링(aria-hidden span)의 불투명도와 그 ::before의 회전 애니메이션이다.
 */

const state = () => {
  const border = document.querySelector('[data-stage-target="border"]')!;
  const ring = border.querySelector('span[aria-hidden="true"]');
  return {
    hover: border.hasAttribute('data-stage-hover'),
    lit: ring !== null,
    opacity: ring ? Number(getComputedStyle(ring).opacity) : 0,
    spinning: ring
      ? getComputedStyle(ring, '::before').animationName !== 'none'
      : false,
    text: border.textContent,
  };
};

for (const [width, height] of [
  [1280, 800],
  [375, 812],
] as const) {
  test(`${width}px: 시연 중 호버 없이 빛이 돌고 완료되면 꺼졌다가 다시 돈다`, async ({
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

    // 진행 중: 호버 없이 빛이 켜지고 돈다
    await expect
      .poll(
        async () => {
          const s = await page.evaluate(state);
          return !s.hover && s.opacity === 1 && s.spinning;
        },
        { timeout: 20_000 }
      )
      .toBe(true);
    // 완료되면 글이 바뀌고 빛이 꺼진다
    await expect
      .poll(
        async () => {
          const s = await page.evaluate(state);
          return !s.lit && s.text === '답변이 완성됐습니다';
        },
        { timeout: 20_000 }
      )
      .toBe(true);
    // 다시 시작하면 돈다
    await expect
      .poll(
        async () => {
          const s = await page.evaluate(state);
          return s.lit && s.spinning && s.text === '답변을 만들고 있습니다';
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

test('진짜 마우스가 올라오면 시연이 멈추고 빛이 켜진 채 남는다', async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.mouse.move(2, 2);
  await page.goto('/components/border');
  const border = page.locator('[data-stage-target="border"]');
  await border.scrollIntoViewIfNeeded();
  // 완료 단계(빛 꺼짐)에서 마우스가 들어온다
  await expect
    .poll(async () => !(await page.evaluate(state)).lit, { timeout: 20_000 })
    .toBe(true);
  const box = (await border.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, {
    steps: 4,
  });
  await expect
    .poll(async () => {
      const s = await page.evaluate(state);
      return s.lit && s.opacity === 1 && s.spinning;
    })
    .toBe(true);
  // 시연이 멈췄으므로 한 주기(약 5초)가 지나도 꺼지지 않는다
  await page.waitForTimeout(5500);
  expect((await page.evaluate(state)).lit).toBe(true);
});

test('축소 모션: 빛이 돌지 않고 한 자리에 보인다', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/components/border');
  await page.locator('[data-stage-target="border"]').scrollIntoViewIfNeeded();
  const m = await page.evaluate(() => {
    const ring = document.querySelector(
      '[data-stage-target="border"] span[aria-hidden="true"]'
    )!;
    const cs = getComputedStyle(ring, '::before');
    return {
      opacity: Number(getComputedStyle(ring).opacity),
      iterations: cs.animationIterationCount,
      duration: cs.animationDuration,
    };
  });
  expect(m.opacity).toBe(1);
  // 반복 1회, 0.01ms: 처음 자세로 끝나 한 자리에 멈춰 있다
  expect(m.iterations).toBe('1');
  expect(parseFloat(m.duration)).toBeLessThan(0.001);
});
