import { test, expect } from '@playwright/test';

/**
 * 무대의 press(target, holdSeconds): 합성 pointerdown을 holdSeconds 동안 유지했다 pointerup한다.
 * NumericSpinner 상세의 시연이 + 를 길게 눌러 core의 길게 누르기(0.4초 뒤 반복, 간격 0.16초에서
 * 0.04초로 좁아짐)를 켜는지 잰다: 값이 양 끝 30에 닿고, 반복 간격이 시간이 갈수록 좁아진다.
 */
test('시연이 +를 길게 눌러 반복을 켜고 간격이 좁아진다', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.mouse.move(2, 2);
  await page.goto('/components/numeric-spinner');
  const input = page
    .locator('[data-stage-target="plus"]')
    .locator('..')
    .locator('input');
  await expect(input).toBeVisible();

  await page.evaluate(() => {
    const el = document
      .querySelector<HTMLInputElement>('[data-stage-target="plus"]')!
      .parentElement!.querySelector('input')!;
    const w = window as unknown as { __vals: [number, number][] };
    w.__vals = [];
    let last = el.value;
    const tick = () => {
      if (el.value !== last) {
        last = el.value;
        w.__vals.push([performance.now(), Number(el.value)]);
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  await page.waitForFunction(
    () =>
      (window as unknown as { __vals: [number, number][] }).__vals.some(
        ([, v]) => v === 30
      ),
    undefined,
    { timeout: 20_000 }
  );
  const vals = await page.evaluate(
    () => (window as unknown as { __vals: [number, number][] }).__vals
  );

  // 세 번 누른 뒤(값 3) 길게 눌러 30까지: 앞쪽 다섯 걸음과 뒤쪽 다섯 걸음의 평균 간격
  const hold = vals.filter(([, v]) => v >= 3 && v <= 30);
  const gaps = hold.slice(1).map(([t], i) => t - hold[i][0]);
  const mean = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length;
  const early = mean(gaps.slice(0, 5));
  const late = mean(gaps.slice(-5));
  expect(gaps.length).toBeGreaterThan(20);
  expect(early).toBeGreaterThan(late * 1.8);
});
