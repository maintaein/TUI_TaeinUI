import { expect, test, type Page } from '@playwright/test';

const stage = (page: Page) =>
  page.getByRole('region', { name: 'HoldButton 미리보기' });
const hold = (page: Page) =>
  stage(page).getByRole('button', { name: '전부 삭제', exact: true });
const armed = (page: Page) =>
  stage(page).getByRole('button', {
    name: '한 번 더 누르면 삭제',
    exact: true,
  });
// 실행되면 무대 안에 잠깐 보이는 결과 글
const result = (page: Page) => stage(page).getByText('삭제했습니다');
const fillOf = (page: Page) => stage(page).locator('[data-hold-fill]');
const scaleOf = (page: Page) =>
  fillOf(page).evaluate((el) => {
    const m = (el as HTMLElement).style.transform.match(/scaleX\(([-\d.]+)\)/);
    return m ? Number(m[1]) : NaN;
  });

// 앱이 그려지기 전의 입력은 버려진다. 단추가 보인 뒤에 시연을 멈춘다
const open = async (page: Page) => {
  await page.goto('/motion/hold-button');
  await expect(hold(page)).toBeVisible();
  await stage(page).getByRole('button', { name: '시연 멈춤' }).click();
};

// 단추 가운데에 마우스를 올려 둔다
const aim = async (page: Page) => {
  const box = await hold(page).boundingBox();
  if (!box) throw new Error('단추가 없다');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
};

test.describe('꾹 눌러 확정 상세 (1440px)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('이름과 줄이기 글과 Props가 있다', async ({ page }) => {
    await page.goto('/motion/hold-button');
    await expect(
      page.getByRole('heading', { level: 1, name: 'HoldButton' })
    ).toBeVisible();
    await expect(hold(page)).toBeVisible();
    await expect(page.getByText('움직임 줄이기에서는').first()).toContainText(
      '누르는 시간은 같고, 차오름이 네 단계로 끊어 보입니다.'
    );
    await expect(page.getByText('onConfirm').first()).toBeVisible();
  });

  test('마우스를 누르고 1.5초 넘게 있으면 실행 글이 보인다', async ({
    page,
  }) => {
    await open(page);
    await aim(page);
    await expect(result(page)).toBeHidden();
    await page.mouse.down();
    await page.waitForTimeout(600);
    await expect(result(page)).toBeHidden();
    // 차오르는 중이다
    expect(await scaleOf(page)).toBeGreaterThan(0.2);
    await expect(result(page)).toBeVisible({ timeout: 2500 });
    await page.mouse.up();
    // 실행 뒤 잠금과 완료 알림
    await expect(hold(page)).toHaveAttribute('aria-disabled', 'true');
    await expect(stage(page).getByRole('status')).toContainText('실행했습니다');
  });

  test('0.5초에 떼면 실행되지 않고 무장 글자가 된다', async ({ page }) => {
    await open(page);
    await aim(page);
    await page.mouse.down();
    await page.waitForTimeout(500);
    await page.mouse.up();
    await expect(armed(page)).toBeVisible();
    await expect(stage(page).getByRole('status')).toContainText(
      '한 번 더 누르면 삭제'
    );
    // 채움이 절반 자리로 되감겨 멈춘다
    await expect.poll(() => scaleOf(page)).toBeCloseTo(0.5, 2);
    await page.waitForTimeout(1500);
    await expect(result(page)).toBeHidden();
    await expect(armed(page)).toBeVisible();
  });

  test('무장에서 다시 클릭하면 실행된다', async ({ page }) => {
    await open(page);
    await hold(page).click();
    await expect(armed(page)).toBeVisible();
    await armed(page).click();
    await expect(result(page)).toBeVisible();
  });

  test('무장은 포커스가 빠지면 풀린다', async ({ page }) => {
    await open(page);
    await hold(page).click();
    await expect(armed(page)).toBeVisible();
    await page.mouse.click(5, 5);
    await expect(hold(page)).toBeVisible();
    await expect(armed(page)).toBeHidden();
  });

  test('키보드 Space를 누르고 있으면 실행된다', async ({ page }) => {
    await open(page);
    await hold(page).focus();
    await page.keyboard.down('Space');
    await expect(result(page)).toBeHidden();
    await expect(result(page)).toBeVisible({ timeout: 2500 });
    await page.keyboard.up('Space');
    await expect(hold(page)).toBeFocused();
  });

  test('키보드 Enter를 짧게 누르면 무장하고 한 번 더 누르면 실행된다', async ({
    page,
  }) => {
    await open(page);
    await hold(page).focus();
    await page.keyboard.press('Enter');
    await expect(armed(page)).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(result(page)).toBeVisible();
  });
});

test.describe('꾹 눌러 확정 상세 움직임 줄이기 (1440px)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('누르는 시간은 같고 차오름이 네 단계로 끊어 보인다', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/motion/hold-button');
    await expect(hold(page)).toBeVisible();
    await aim(page);
    await page.mouse.down();
    const seen = new Set<number>();
    const stop = Date.now() + 700;
    while (Date.now() < stop) {
      seen.add(await scaleOf(page));
      await page.waitForTimeout(40);
    }
    // 절반 시점에는 아직 실행되지 않았다
    await expect(result(page)).toBeHidden();
    for (const s of seen) expect([0, 0.25, 0.5, 0.75, 1]).toContain(s);
    await expect(result(page)).toBeVisible({ timeout: 2500 });
    await page.mouse.up();
  });
});
