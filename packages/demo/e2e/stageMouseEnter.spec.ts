import { test, expect } from '@playwright/test';

/**
 * 무대의 hover/leave는 pointerover/out에 더해 mouseover/out도 쏜다. React의 onMouseEnter와 onMouseLeave는
 * mouseover/out에서 만들어지므로 이것이 없으면 Snackbar의 호버 멈춤이 시연에서 켜지지 않는다.
 * Snackbar 상세의 시연이 스낵바에 올라가 있는 동안 막대가 서 있는지, 진짜 마우스가 넘겨받으면
 * 올라가 있던 것에 mouseout이 가서 막대가 다시 줄어드는지 잰다.
 */
test('시연이 스낵바에 올라가면 막대가 서고, 진짜 마우스가 넘겨받으면 다시 줄어든다', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.mouse.move(2, 2);
  await page.goto('/components/snackbar');
  const snack = page.locator('[data-stage-target="snack"]');
  const bar = () =>
    snack.evaluate((el) =>
      parseFloat((el.lastElementChild as HTMLElement).style.transform.slice(7))
    );

  // 올라간 동안(data-stage-hover) 막대가 선다
  await expect(snack).toHaveAttribute('data-stage-hover', '', {
    timeout: 20_000,
  });
  const held = await bar();
  await page.waitForTimeout(600);
  expect(await bar()).toBe(held);

  // 진짜 마우스가 무대의 스낵바 밖에 들어오면 넘겨받는다. 막대는 다시 줄어든다
  const box = (await page.locator('[role="region"]').first().boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.3);
  await expect(snack).not.toHaveAttribute('data-stage-hover');
  await expect.poll(bar).toBeLessThan(held - 0.05);
});
