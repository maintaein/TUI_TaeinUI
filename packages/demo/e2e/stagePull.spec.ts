import { test, expect } from '@playwright/test';

/**
 * 무대의 pull(target, dy): core 시트는 pointer가 아니라 mouse 이벤트로 끌린다. BottomSheet 상세의 시연이
 * 손잡이를 잡고 내려 100px를 넘겨 놓아, 닫기 단추를 누르지 않고도 시트가 닫히는지 잰다.
 * 문서의 mousemove가 한 걸음씩 늘며 이어지고(clientY 단조 증가), 시트가 끌린 만큼 내려가며, 끝에 mouseup이 한 번 간다.
 */
test('시연이 손잡이를 끌어 내려 시트를 닫는다', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.mouse.move(2, 2);
  await page.goto('/components/bottom-sheet');
  const sheet = page.locator('[data-stage-target="sheet"]');
  await page.evaluate(() => {
    const w = window as unknown as {
      __p: { type: string; y: number; sheetTop: number }[];
    };
    w.__p = [];
    for (const type of ['mousedown', 'mousemove', 'mouseup'] as const)
      document.addEventListener(
        type,
        (e) => {
          // 문서 쪽 이벤트만(합성이라 isTrusted가 false)
          if (e.isTrusted) return;
          const s = document.querySelector('[data-stage-target="sheet"]');
          w.__p.push({
            type,
            y: (e as MouseEvent).clientY,
            sheetTop: s ? s.getBoundingClientRect().top : -1,
          });
        },
        true
      );
  });

  await expect(sheet).toBeVisible({ timeout: 20_000 });
  await expect(sheet).toHaveCount(0, { timeout: 20_000 });
  const ev = await page.evaluate(
    () =>
      (
        window as unknown as {
          __p: { type: string; y: number; sheetTop: number }[];
        }
      ).__p
  );
  const downs = ev.filter((e) => e.type === 'mousedown');
  const moves = ev.filter((e) => e.type === 'mousemove');
  const ups = ev.filter((e) => e.type === 'mouseup');
  expect(downs).toHaveLength(1);
  expect(ups).toHaveLength(1);
  expect(moves.length).toBeGreaterThan(20);
  // 잡은 자리에서 아래로만 140px 끈다
  expect(moves.every((m, i) => i === 0 || m.y >= moves[i - 1].y)).toBe(true);
  expect(moves.at(-1)!.y - downs[0].y).toBeGreaterThan(130);
  // 시트도 따라 내려간다(손잡이를 잡은 채)
  expect(moves.at(-1)!.sheetTop - moves[0].sheetTop).toBeGreaterThan(100);
});
