import { expect, test, type Page } from '@playwright/test';

const SENTENCE = '말랑말랑 젤리 글자';

const stage = (page: Page) =>
  page.getByRole('region', { name: 'JellyText 미리보기' });

// 글자 칸 중 하나라도 단위 행렬이 아니면 퍼지거나 출렁이는 중이다
const moving = (page: Page, scope = 'main') =>
  page
    .locator(`${scope} [data-jelly-cell]`)
    .evaluateAll((els) =>
      els.some(
        (el) => !new DOMMatrix(getComputedStyle(el).transform).isIdentity
      )
    );

// 문장 위를 실제 마우스로 왼쪽에서 오른쪽으로 지나가며 한 걸음마다 움직임을 본다
const sweepWithMouse = async (page: Page) => {
  const box = await stage(page)
    .getByRole('heading', { level: 2 })
    .boundingBox();
  if (!box) throw new Error('문장을 찾지 못했다');
  const y = box.y + box.height / 2;
  let seen = false;
  await page.mouse.move(box.x + 2, y);
  for (let x = box.x + 2; x < box.x + box.width; x += 6) {
    await page.mouse.move(x, y);
    seen ||= await moving(page);
  }
  return seen;
};

test.describe('젤리 글자 상세 (1440px)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('접근성 트리에 완성 문장이 제목으로 찾히고 줄이기 글이 있다', async ({
    page,
  }) => {
    await page.goto('/motion/jelly-text');
    await expect(
      stage(page).getByRole('heading', { level: 2, name: SENTENCE })
    ).toBeVisible();
    await expect(stage(page).locator('[data-jelly-visual]')).toHaveAttribute(
      'aria-hidden',
      'true'
    );
    await expect(page.getByText('움직임 줄이기에서는')).toContainText(
      '평범한 글자로 보이고 출렁이지 않습니다.'
    );
    await expect(page.getByText('터치 화면에서는')).toContainText(
      '평범한 글자로 보입니다.'
    );
  });

  test('실제 마우스로 글자 위를 지나가면 글자 칸이 단위 행렬이 아닌 순간이 있다', async ({
    page,
  }) => {
    await page.goto('/motion/jelly-text');
    // 대본의 커서와 구분하려고 시연을 먼저 멈추고, 지나가기 전에는 평범한 글자임을 본다
    await stage(page).getByRole('button', { name: '시연 멈춤' }).click();
    await page.waitForTimeout(300);
    expect(await moving(page)).toBe(false);
    expect(await sweepWithMouse(page)).toBe(true);
    // 커서를 치우면 스프링이 앉아 다시 평범한 글자가 된다
    await page.mouse.move(2, 2);
    await expect.poll(() => moving(page)).toBe(false);
  });

  test('대본의 커서가 문장 위를 지나가면 글자가 출렁인다', async ({ page }) => {
    await page.mouse.move(2, 2);
    await page.goto('/motion/jelly-text');
    await expect
      .poll(() => moving(page), { timeout: 15_000, intervals: [50] })
      .toBe(true);
  });

  test('축소 모션에서는 실제 마우스로 지나가도 단위 행렬이 아닌 순간이 없다', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/motion/jelly-text');
    await expect(
      stage(page).getByRole('heading', { level: 2, name: SENTENCE })
    ).toBeVisible();
    expect(await sweepWithMouse(page)).toBe(false);
  });

  test('as를 바꾸면 제목 단계가 바뀌고 문장을 바꾸면 접근성 이름이 따라온다', async ({
    page,
  }) => {
    await page.goto('/motion/jelly-text');
    await page
      .getByRole('radiogroup', { name: 'as', exact: true })
      .getByRole('radio', { name: 'h1', exact: true })
      .locator('..')
      .click();
    await expect(stage(page).getByRole('heading', { level: 1 })).toHaveCount(1);
    await page.getByRole('textbox', { name: 'text' }).fill('안녕하세요');
    await expect(
      stage(page).getByRole('heading', { level: 1, name: '안녕하세요' })
    ).toBeVisible();
  });
});

test.describe('젤리 글자 상세 (390px)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('긴 문장에서도 낱말이 두 줄로 갈리지 않는다', async ({ page }) => {
    await page.goto('/motion/jelly-text');
    await page
      .getByRole('textbox', { name: 'text' })
      .fill('커서가 지나가는 글자가 말랑하게 늘었다 출렁이며 돌아옵니다');
    const words = page.locator('main [data-jelly-word]');
    await expect(words.first()).toBeVisible();
    const broken = await words.evaluateAll(
      (els) =>
        els.filter((w) => {
          const tops = [...w.querySelectorAll('[data-jelly-cell]')].map((c) =>
            Math.round(c.getBoundingClientRect().top)
          );
          return new Set(tops).size > 1;
        }).length
    );
    expect(broken).toBe(0);
  });
});
