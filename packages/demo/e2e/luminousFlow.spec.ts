import { expect, test, type Page } from '@playwright/test';

const DETAIL = '[role="region"][aria-label="LuminousFlow 미리보기"] canvas';
const MINI = '[data-stage-mini="LuminousFlow 미리보기"] canvas';

const stage = (page: Page) =>
  page.getByRole('region', { name: 'LuminousFlow 미리보기' });

// 앱이 그려지기 전의 입력은 버려진다. canvas가 붙은 뒤에 단추를 누른다
const openDetail = async (page: Page) => {
  await page.goto('/motion/luminous-flow');
  await expect(page.locator(DETAIL)).toBeVisible();
};

// 정지 장면이 그려지도록 프레임 셋을 기다린 뒤 gap 간격으로 두 장을 찍는다. Playwright 왕복이 부하에 늘어져도 간격이 어긋나지 않도록
// 한 evaluate 안에서 한다. blank는 아무것도 안 그려진 canvas와 같은지다(빈 두 장이 같은 것을 "멈춤"으로 읽지 않게)
const twoFrames = (page: Page, selector: string, gap = 500) =>
  page.evaluate(
    async ({ selector, gap }) => {
      const canvas = document.querySelector<HTMLCanvasElement>(selector);
      if (!canvas) throw new Error('canvas 없음');
      const frame = () => new Promise((r) => requestAnimationFrame(r));
      for (let i = 0; i < 3; i++) await frame();
      const a = canvas.toDataURL();
      await new Promise((r) => setTimeout(r, gap));
      const b = canvas.toDataURL();
      const blank = document.createElement('canvas');
      blank.width = canvas.width;
      blank.height = canvas.height;
      return { same: a === b, blank: a === blank.toDataURL() };
    },
    { selector, gap }
  );

test.describe('빛 물줄기 상세 (1440px)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('배경이 무대 상자를 채우고 그 위에 흰 글자가 얹힌다', async ({
    page,
  }) => {
    await openDetail(page);
    const box = (await stage(page).boundingBox())!;
    const canvas = (await page.locator(DETAIL).boundingBox())!;
    expect(canvas.x).toBeGreaterThanOrEqual(box.x - 1);
    expect(canvas.y).toBeGreaterThanOrEqual(box.y - 1);
    expect(canvas.x + canvas.width).toBeLessThanOrEqual(box.x + box.width + 1);
    expect(canvas.y + canvas.height).toBeLessThanOrEqual(
      box.y + box.height + 1
    );
    // 안쪽 22rem 상자가 아니라 무대 전체를 채운다
    expect(canvas.width).toBeGreaterThan(box.width * 0.95);
    expect(canvas.height).toBeGreaterThan(box.height * 0.95);
    const line = stage(page).getByText('빛 물줄기', { exact: true });
    await expect(line).toBeVisible();
    expect(await line.evaluate((el) => getComputedStyle(el).color)).toBe(
      'rgb(255, 255, 255)'
    );
  });

  test('일시정지 단추가 흐름을 세우고 다시 누르면 흐른다', async ({ page }) => {
    await openDetail(page);
    const pause = stage(page).getByRole('button', { name: '시연 멈춤' });
    await pause.click();
    await page.mouse.move(2, 2);
    const still = await twoFrames(page, DETAIL);
    expect(still.blank).toBe(false);
    expect(still.same).toBe(true);

    await stage(page).getByRole('button', { name: '시연 다시 시작' }).click();
    await page.mouse.move(2, 2);
    const flowing = await twoFrames(page, DETAIL);
    expect(flowing.same).toBe(false);
  });

  test('움직임 줄이기에서는 500ms 간격으로 찍어도 정지 장면이다', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openDetail(page);
    // 빛번짐 층 텍스처가 비동기로 들어와 한 번 다시 그린다. 그 뒤에 찍는다
    await page.waitForTimeout(1000);
    const result = await twoFrames(page, DETAIL);
    expect(result.blank).toBe(false);
    expect(result.same).toBe(true);
    // 움직임 줄이기에서는 멈출 움직임이 없으므로 일시정지 단추도 없다
    await expect(
      stage(page).getByRole('button', { name: '시연 멈춤' })
    ).toHaveCount(0);
  });
});

test.describe('빛 물줄기 모션 전체 보기 미니 (1440px)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  const centre = (page: Page) =>
    page.locator(MINI).evaluate((el) => el.scrollIntoView({ block: 'center' }));

  test('미니 배경이 카드 칸 안에 있다', async ({ page }) => {
    await page.goto('/motion');
    const card = page.locator('main section > div > div').nth(12);
    await expect(card.locator('canvas')).toBeVisible();
    await centre(page);
    const box = (await card.boundingBox())!;
    const canvas = (await page.locator(MINI).boundingBox())!;
    expect(canvas.width).toBeGreaterThan(0);
    expect(canvas.height).toBeGreaterThan(0);
    expect(canvas.x).toBeGreaterThanOrEqual(box.x - 1);
    expect(canvas.y).toBeGreaterThanOrEqual(box.y - 1);
    expect(canvas.x + canvas.width).toBeLessThanOrEqual(box.x + box.width + 1);
    expect(canvas.y + canvas.height).toBeLessThanOrEqual(
      box.y + box.height + 1
    );
  });

  test('움직임 멈춤을 켜면 미니 흐름이 서고 끄면 다시 흐른다', async ({
    page,
  }) => {
    await page.goto('/motion');
    await expect(page.locator(MINI)).toBeAttached();
    const pause = page.getByRole('button', { name: '움직임 멈춤' });
    await pause.click();
    await expect(pause).toHaveAttribute('aria-pressed', 'true');
    await centre(page);
    const still = await twoFrames(page, MINI);
    expect(still.blank).toBe(false);
    expect(still.same).toBe(true);

    // 스크롤하면 미니가 화면 밖이 되므로 제자리에서 끈다
    await pause.evaluate((el: HTMLButtonElement) => el.click());
    await expect(pause).toHaveAttribute('aria-pressed', 'false');
    const flowing = await twoFrames(page, MINI);
    expect(flowing.same).toBe(false);
  });
});
