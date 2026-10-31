import { expect, test, type Page } from '@playwright/test';

const stage = (page: Page) =>
  page.getByRole('region', { name: 'SloshGauge 미리보기' });
const meter = (page: Page) => stage(page).getByRole('meter');
const valueButton = (page: Page, n: number) =>
  stage(page).getByRole('button', { name: String(n), exact: true });
const pauseButton = (page: Page) =>
  stage(page).getByRole('button', { name: '시연 멈춤' });
const resumeButton = (page: Page) =>
  stage(page).getByRole('button', { name: '시연 다시 시작' });

// 앞 물결, 수면 테두리, 그릇 그룹. 클래스가 해시라 위치로 고른다
const water = (page: Page) => stage(page).locator('[data-slosh-water]');
const clipped = (page: Page, index: number) =>
  water(page).locator('g[clip-path] > path').nth(index);
const rimD = (page: Page) => clipped(page, 2).getAttribute('d');
const bowlTransform = (page: Page) =>
  water(page).locator('g[transform]').first().getAttribute('transform');

// 수면 테두리의 꼭짓점 y(M 다음 C마다 숫자 여섯 중 끝 둘)
const rimYs = async (page: Page) => {
  const nums = ((await rimD(page)) ?? '').match(/-?[\d.]+/g)?.map(Number) ?? [];
  const ys = [nums[1]];
  for (let k = 2; k + 5 < nums.length; k += 6) ys.push(nums[k + 5]);
  return ys;
};
const meanY = async (page: Page) => {
  const ys = await rimYs(page);
  return ys.reduce((a, b) => a + b, 0) / ys.length;
};
const angle = async (page: Page) =>
  Number(/rotate\((-?[\d.]+)/.exec((await bowlTransform(page)) ?? '')?.[1]);

// 앱이 그려지기 전의 입력은 버려진다. 게이지가 보인 뒤에 마우스를 무대에 올려 자동 시연을 넘겨받는다
// (일시정지 단추는 게이지의 paused도 켜므로 여기서는 누르지 않는다)
const open = async (page: Page) => {
  await page.goto('/motion/slosh-gauge');
  await expect(meter(page)).toBeVisible();
  await meter(page).hover();
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
      '잔물결 없는 평평한 수면'
    );
    await expect(page.getByText('paused').first()).toBeVisible();
    await expect(page.getByText('valueText').first()).toBeVisible();
  });

  test('값을 바꾸면 aria 값이 즉시 바뀌고 수위가 넓이 기준으로 올라 1.5초 뒤 잔잔하다', async ({
    page,
  }) => {
    await open(page);
    await expect(meter(page)).toHaveAttribute('aria-valuenow', '60');

    await valueButton(page, 90).click();
    await expect(meter(page)).toHaveAttribute('aria-valuenow', '90');
    await expect(meter(page)).toHaveAttribute('aria-valuetext', '9GB / 10GB');
    // 막 바꾼 뒤에는 그릇이 기울어 있다
    await expect
      .poll(async () => Math.abs(await angle(page)))
      .toBeGreaterThan(0.2);

    await page.waitForTimeout(2000);
    expect(Math.abs(await angle(page))).toBeLessThan(0.05);
    // 90%의 수면은 넓이 기준이라 viewBox 160 중 약 44(높이 72%)에 있다
    expect(await meanY(page)).toBeGreaterThan(40);
    expect(await meanY(page)).toBeLessThan(49);
  });

  test('쉬는 동안에도 수면이 계속 일렁인다', async ({ page }) => {
    await open(page);
    const first = await rimD(page);
    await page.waitForTimeout(400);
    expect(await rimD(page)).not.toBe(first);
  });

  test('무대 일시정지를 누르면 그림이 멈추고, 풀면 다시 움직인다', async ({
    page,
  }) => {
    await open(page);
    await pauseButton(page).click();
    const frozen = await rimD(page);
    await page.waitForTimeout(500);
    expect(await rimD(page)).toBe(frozen);

    // 멈춘 채 값이 바뀌면 출렁임 없이 수위만 바로 바뀐다
    await valueButton(page, 20).click();
    await expect(meter(page)).toHaveAttribute('aria-valuenow', '20');
    await expect.poll(() => meanY(page)).toBeGreaterThan(120);
    const still = await rimD(page);
    await page.waitForTimeout(500);
    expect(await rimD(page)).toBe(still);

    await resumeButton(page).click();
    await expect.poll(() => rimD(page)).not.toBe(still);
  });

  test('값을 연달아 바꿔도 마지막 변경 뒤 2초 안에 잔잔해진다', async ({
    page,
  }) => {
    await open(page);
    for (const n of [20, 90, 20, 90, 20, 60]) {
      await valueButton(page, n).click();
      await page.waitForTimeout(100);
    }
    await expect(meter(page)).toHaveAttribute('aria-valuenow', '60');
    await page.waitForTimeout(2000);
    expect(Math.abs(await angle(page))).toBeLessThan(0.05);
  });

  test('조작판 슬라이더로 값을 바꾸면 게이지가 따라간다', async ({ page }) => {
    await open(page);
    const slider = page.getByRole('slider', { name: 'value' });
    await slider.focus();
    await page.keyboard.press('End');
    await expect(meter(page)).toHaveAttribute('aria-valuenow', '100');
    await expect(meter(page)).toHaveAttribute('aria-valuetext', '10GB / 10GB');
  });

  test('움직임 줄이기에서는 수위만 바뀌고 수면이 평평하다', async ({
    page,
  }) => {
    // 움직임 줄이기에서는 자동 시연이 없어 멈춤 단추도 없다
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/motion/slosh-gauge');
    await expect(meter(page)).toBeVisible();
    const flat = async () => new Set(await rimYs(page)).size;
    await expect.poll(flat).toBe(1);
    await valueButton(page, 90).click();
    await expect(meter(page)).toHaveAttribute('aria-valuenow', '90');
    await expect.poll(async () => (await meanY(page)) < 49).toBe(true);
    expect(await flat()).toBe(1);
    const still = await rimD(page);
    await page.waitForTimeout(400);
    expect(await rimD(page)).toBe(still);
  });
});
