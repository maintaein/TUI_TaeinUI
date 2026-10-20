import { test, expect, type Page } from '@playwright/test';

/**
 * M5.5 완료 기준: 랜딩 쇼케이스가 클릭 없이 돌고, 축소 선호에서 멈추고,
 * 첫 화면 프레임이 끊기지 않는다. 프레임 기준은 frameBudget.spec.ts와 같다
 * (rAF 간격 중앙값 20ms 이하, 50ms 넘는 프레임 2개 이하).
 */

const MEDIAN_BUDGET_MS = 20;
const OVER_BUDGET_THRESHOLD_MS = 50;
const MAX_OVER_BUDGET_FRAMES = 2;
// 무대를 가운데 두고 8초(HeaderBar -> Button -> Loader 깨짐까지)를 잰다
const MEASURE_MS = 8_000;
// 8초 동안 60Hz면 약 480개. 절반 아래면 측정이 제대로 돌지 않은 것이다
const MIN_SAMPLES = 200;

const openLanding = async (page: Page) => {
  await page.goto('/');
  const showcase = page.getByRole('region', { name: '컴포넌트 쇼케이스' });
  await showcase.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  // 마우스는 무대 밖(왼쪽 위 모서리)에 둔다
  await page.mouse.move(2, 2);
  return { showcase, caption: showcase.locator('p') };
};

test.describe('랜딩 쇼케이스 (M5.5)', () => {
  test('클릭 없이 캡션이 최소 3번 바뀐다', async ({ page }) => {
    const { caption } = await openLanding(page);

    const seen: string[] = [];
    await expect
      .poll(
        async () => {
          const now = await caption.textContent();
          if (now && seen.at(-1) !== now) seen.push(now);
          return seen.length;
        },
        { timeout: 20_000, intervals: [100] }
      )
      .toBeGreaterThanOrEqual(4); // 첫 캡션 + 바뀐 3번
    expect(seen.slice(0, 4)).toEqual([
      'HeaderBar',
      'Button',
      'Loader · Popover',
      'SegmentedButtons',
    ]);
  });

  test('마우스를 무대에 올리면 캡션이 멈추고 내리면 다시 바뀐다', async ({
    page,
  }) => {
    const { showcase, caption } = await openLanding(page);

    // 막 바뀐 직후에 올려야 "멈춤"이 우연히 같은 값인 것과 구분된다
    await expect(caption).toHaveText('Button', { timeout: 10_000 });
    const box = await showcase.locator('> div').first().boundingBox();
    if (!box) throw new Error('무대 위치를 못 읽었다');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);

    await page.waitForTimeout(3_000);
    await expect(caption).toHaveText('Button');

    await page.mouse.move(2, 2);
    await expect(caption).not.toHaveText('Button', { timeout: 10_000 });
  });

  test('자동 재생 중 프레임 간격이 기준 안이다', async ({ page }) => {
    const { caption } = await openLanding(page);
    const before = await caption.textContent();

    const intervals = await page.evaluate(
      (durationMs) =>
        new Promise<number[]>((resolve) => {
          const measured: number[] = [];
          const start = performance.now();
          let last = start;
          const tick = (now: number): void => {
            measured.push(now - last);
            last = now;
            if (now - start < durationMs) requestAnimationFrame(tick);
            else resolve(measured);
          };
          requestAnimationFrame(tick);
        }),
      MEASURE_MS
    );

    const sorted = [...intervals].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median =
      sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];
    const overBudgetCount = intervals.filter(
      (interval) => interval > OVER_BUDGET_THRESHOLD_MS
    ).length;
    console.log(
      `[landingShowcase] samples=${intervals.length} median=${median.toFixed(2)}ms overBudget=${overBudgetCount}`
    );

    expect(intervals.length).toBeGreaterThanOrEqual(MIN_SAMPLES);
    // 측정 구간에 전환이 실제로 있었다(멈춘 화면을 재서 통과하지 않는다)
    expect(await caption.textContent()).not.toBe(before);
    expect(median).toBeLessThanOrEqual(MEDIAN_BUDGET_MS);
    expect(overBudgetCount).toBeLessThanOrEqual(MAX_OVER_BUDGET_FRAMES);
  });

  test.describe('reduced-motion', () => {
    test.use({ contextOptions: { reducedMotion: 'reduce' } });

    test('캡션이 5초 동안 바뀌지 않고 다음 장면 단추로 바뀐다', async ({
      page,
    }) => {
      const { showcase, caption } = await openLanding(page);
      const first = await caption.textContent();
      expect(first).toBeTruthy();

      await page.waitForTimeout(5_000);
      await expect(caption).toHaveText(first as string);

      await showcase.getByRole('button', { name: '다음 장면' }).click();
      await expect(caption).not.toHaveText(first as string);
    });
  });
});
