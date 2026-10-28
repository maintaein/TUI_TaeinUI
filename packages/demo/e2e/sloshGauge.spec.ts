import { expect, test, type Page } from '@playwright/test';

const stage = (page: Page) =>
  page.getByRole('region', { name: 'SloshGauge 미리보기' });
const meter = (page: Page) => stage(page).getByRole('meter');
const valueButton = (page: Page, n: number) =>
  stage(page).getByRole('button', { name: String(n), exact: true });

// 앱이 그려지기 전의 입력은 버려진다. 게이지가 보인 뒤에 시연을 멈춘다
const open = async (page: Page) => {
  await page.goto('/motion/slosh-gauge');
  await expect(meter(page)).toBeVisible();
  await stage(page).getByRole('button', { name: '시연 멈춤' }).click();
};

// 수면 곡선의 꼭짓점 y(M, L 명령. 마지막 둘은 바닥 모서리라 뺀다)
const surfaceYs = (page: Page) =>
  stage(page)
    .locator('[data-slosh-water] path')
    .evaluate((el) => {
      const d = el.getAttribute('d') ?? '';
      const ys = [...d.matchAll(/[ML]([\d.-]+) ([\d.-]+)/g)].map((m) =>
        Number(m[2])
      );
      return ys.slice(0, -2);
    });
const spread = async (page: Page) => {
  const ys = await surfaceYs(page);
  return Math.max(...ys) - Math.min(...ys);
};

test.describe('출렁이는 게이지 상세 (1440px)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('이름과 줄이기 글과 Props가 있다', async ({ page }) => {
    await page.goto('/motion/slosh-gauge');
    await expect(
      page.getByRole('heading', { level: 1, name: 'SloshGauge' })
    ).toBeVisible();
    await expect(meter(page)).toBeVisible();
    await expect(page.getByText('움직임 줄이기에서는').first()).toContainText(
      '물이 출렁이지 않고 높이만 바뀝니다.'
    );
    await expect(page.getByText('valueText').first()).toBeVisible();
  });

  test('단추로 값을 바꾸면 aria-valuenow가 즉시 바뀌고 1.5초 뒤 수면이 평평하다', async ({
    page,
  }) => {
    await open(page);
    await expect(meter(page)).toHaveAttribute('aria-valuenow', '60');
    await expect.poll(() => spread(page)).toBe(0);

    await valueButton(page, 90).click();
    await expect(meter(page)).toHaveAttribute('aria-valuenow', '90');
    await expect(meter(page)).toHaveAttribute('aria-valuetext', '9GB / 10GB');
    // 막 바꾼 뒤에는 물결이 또렷하다(viewBox 160 중 8% 안팎까지)
    await expect.poll(() => spread(page)).toBeGreaterThan(4);

    await page.waitForTimeout(1700);
    expect(await spread(page)).toBe(0);
    // 수위는 새 값(90%)에 닿아 있다: 수면 y는 160 x (1 - 0.9) = 16
    expect((await surfaceYs(page))[0]).toBeCloseTo(16, 0);
  });

  test('값을 연달아 바꿔도 마지막 변경 뒤 1.5초 안에 잔잔해진다', async ({
    page,
  }) => {
    await open(page);
    for (const n of [20, 90, 20, 90, 20, 60]) {
      await valueButton(page, n).click();
      await page.waitForTimeout(100);
    }
    await expect(meter(page)).toHaveAttribute('aria-valuenow', '60');
    await page.waitForTimeout(1700);
    expect(await spread(page)).toBe(0);
  });

  test('조작판 슬라이더로 값을 바꾸면 게이지가 따라간다', async ({ page }) => {
    await open(page);
    const slider = page.getByRole('slider', { name: 'value' });
    await slider.focus();
    await page.keyboard.press('End');
    await expect(meter(page)).toHaveAttribute('aria-valuenow', '100');
    await expect(meter(page)).toHaveAttribute('aria-valuetext', '10GB / 10GB');
  });

  test('움직임 줄이기에서는 수위만 바뀌고 물결이 없다', async ({ page }) => {
    // 움직임 줄이기에서는 자동 시연이 없어 멈춤 단추도 없다
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/motion/slosh-gauge');
    await expect(meter(page)).toBeVisible();
    await valueButton(page, 90).click();
    await expect(meter(page)).toHaveAttribute('aria-valuenow', '90');
    expect(await spread(page)).toBe(0);
    expect((await surfaceYs(page))[0]).toBeCloseTo(16, 0);
  });
});
