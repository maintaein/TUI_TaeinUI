import { test, expect, type Page } from '@playwright/test';

const TYPES = ['orbit', 'spinner', 'dots', 'bar', 'wave', 'inchworm'] as const;
const choose = async (page: Page, prop: string, value: string) => {
  const radios = page.getByRole('radiogroup', { name: prop, exact: true });
  if (await radios.count())
    await radios
      .getByRole('radio', { name: value, exact: true })
      .locator('..')
      .click();
  else
    await page
      .getByRole('group', { name: prop, exact: true })
      .getByRole('button', { name: value, exact: true })
      .click();
};

for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  test.describe(reducedMotion, () => {
    test.use({
      viewport: { width: 1440, height: 1000 },
      contextOptions: { reducedMotion },
    });

    for (const type of TYPES) {
      test(`${type}: 완료와 실패의 표식, 색, 복귀`, async ({ page }) => {
        await page.goto('/components/loader');
        expect(
          await page.evaluate(
            () => matchMedia('(prefers-reduced-motion: reduce)').matches
          )
        ).toBe(reducedMotion === 'reduce');
        const stage = page.getByRole('region', {
          name: 'Loader 시연',
          exact: true,
        });
        if (reducedMotion === 'no-preference')
          await stage
            .getByRole('button', { name: '시연 멈춤', exact: true })
            .click();
        await choose(page, 'type', type);
        const status = stage.locator(`[role="status"][data-type="${type}"]`);
        for (const result of ['done', 'error'] as const) {
          await choose(page, 'status', result);
          await expect(status).toHaveAccessibleName(
            result === 'done' ? '완료' : '실패'
          );
          const graphic = status.locator(`[data-loader-mark="${result}"]`);
          await expect(graphic).toBeVisible();
          const mark =
            type === 'orbit'
              ? graphic.locator('[data-orbit-dot]').first()
              : graphic.locator('[data-mark-path]');
          await expect
            .poll(() =>
              mark.evaluate((el) => {
                const svg = el.closest('svg');
                return Number(getComputedStyle(svg ?? el).opacity);
              })
            )
            .toBe(1);
          await expect
            .poll(() =>
              mark.evaluate(
                (el) =>
                  getComputedStyle(el)[
                    el instanceof SVGElement ? 'stroke' : 'backgroundColor'
                  ]
              )
            )
            .toBe(result === 'done' ? 'rgb(46, 125, 50)' : 'rgb(211, 47, 47)');
          const box = await mark.boundingBox();
          expect(box?.width).toBeGreaterThan(0);
          expect(box?.height).toBeGreaterThan(0);
          if (type !== 'orbit')
            await expect
              .poll(() =>
                mark.evaluate((el) => getComputedStyle(el).strokeDashoffset)
              )
              .toBe('0px');
          if (reducedMotion === 'reduce') {
            expect(
              await graphic.evaluate((el) =>
                Boolean(
                  (el as HTMLElement & { __loaderStatusTimeline?: unknown })
                    .__loaderStatusTimeline
                )
              )
            ).toBe(false);
          }
          if (reducedMotion === 'no-preference') {
            await expect
              .poll(() =>
                graphic.evaluate((el) =>
                  Boolean(
                    (el as HTMLElement & { __loaderStatusTimeline?: unknown })
                      .__loaderStatusTimeline
                  )
                )
              )
              .toBe(false);
            await stage.screenshot({
              path: test.info().outputPath(`${type}-${result}.png`),
            });
          }
          await choose(page, 'status', 'loading');
          await expect(status).toHaveAccessibleName('로딩 중');
          await expect(status.locator('[data-loader-mark]')).toHaveCount(0);
          await expect
            .poll(() =>
              status
                .locator('[data-orbit], [data-loader-graphic]')
                .getAttribute('data-paused')
            )
            .toBeNull();
        }
      });
    }
  });
}

test('자벌레의 네 프레임은 몸이 짧아졌다 길어지며 오른쪽으로 간다', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/components/loader');
  const stage = page.getByRole('region', { name: 'Loader 시연', exact: true });
  await stage.getByRole('button', { name: '시연 멈춤', exact: true }).click();
  await choose(page, 'type', 'inchworm');
  const body = stage.locator('[data-inchworm-fill]');
  const frames: { x: number; width: number; height: number }[] = [];
  for (const [i, progress] of [0.2, 0.29, 0.39, 0.49].entries()) {
    await body.evaluate((el, fraction) => {
      const animation = el.getAnimations()[0];
      animation.pause();
      animation.currentTime =
        Number(animation.effect!.getTiming().duration) * fraction;
    }, progress);
    const box = (await body.boundingBox())!;
    const track = (await stage.locator('[data-inchworm]').boundingBox())!;
    expect(box.y).toBeGreaterThanOrEqual(track.y - 1);
    expect(box.y + box.height).toBeLessThanOrEqual(track.y + track.height + 1);
    frames.push(box);
    await stage.screenshot({
      path: test.info().outputPath(`inchworm-crawl-${i + 1}.png`),
    });
  }
  expect(frames[1].width).toBeLessThan(frames[0].width);
  expect(frames[1].height).toBeGreaterThan(frames[0].height);
  expect(frames[2].x).toBeGreaterThan(frames[0].x);
});

test('공유 미니도 로딩, 완료, 로딩, 실패 대본을 돈다', async ({ page }) => {
  test.setTimeout(30_000);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/components/overview');
  const mini = page.locator('[data-stage-mini="Loader 시연"]');
  await mini.scrollIntoViewIfNeeded();
  await mini.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  const graphic = mini.locator('[data-orbit]');
  await expect(graphic).toHaveAttribute('data-status', 'done', {
    timeout: 10_000,
  });
  await expect(graphic).toHaveAttribute('data-status', 'loading', {
    timeout: 10_000,
  });
  await expect(graphic).toHaveAttribute('data-status', 'error', {
    timeout: 10_000,
  });
});
