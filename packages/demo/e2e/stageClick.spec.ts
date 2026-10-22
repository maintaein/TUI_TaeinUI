import { test, expect } from '@playwright/test';

/**
 * 무대의 click(target): press와 같되 합성 mousedown과 mouseup도 쏜다. core Popover는 문서의 mousedown으로 바깥 누름을 읽는다.
 * Popover 상세의 시연이 "바깥 영역"을 눌러 팝오버를 닫는지 잰다: 그 대상에 mousedown이 한 번 가고, 곧이어 팝오버가 사라진다.
 */
test('시연이 바깥 영역을 눌러 팝오버를 닫는다', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.mouse.move(2, 2);
  await page.goto('/components/popover');
  await page.evaluate(() => {
    const w = window as unknown as { __d: { t: number; on: string }[] };
    w.__d = [];
    document.addEventListener(
      'mousedown',
      (e) => {
        if (e.isTrusted) return;
        w.__d.push({
          t: performance.now(),
          on:
            (e.target as Element)
              .closest('[data-stage-target]')
              ?.getAttribute('data-stage-target') ?? '',
        });
      },
      true
    );
  });
  const popover = page.locator('[role="region"] [role="dialog"]');
  await expect(popover).toBeVisible({ timeout: 20_000 });
  await expect(popover).toHaveCount(0, { timeout: 20_000 });
  const closedAt = await page.evaluate(() => performance.now());
  const downs = await page.evaluate(
    () => (window as unknown as { __d: { t: number; on: string }[] }).__d
  );
  expect(downs).toHaveLength(1);
  expect(downs[0].on).toBe('away');
  // 누른 직후(퇴장 0.2초 포함 1.5초 안)에 닫혔다. 다음 바퀴에서 트리거를 다시 눌러 닫힌 것이 아니다
  expect(closedAt - downs[0].t).toBeLessThan(1500);
});
