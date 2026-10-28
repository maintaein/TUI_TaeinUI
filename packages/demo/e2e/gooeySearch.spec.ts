import { expect, test, type Page } from '@playwright/test';

const stage = (page: Page) =>
  page.getByRole('region', { name: 'GooeySearch 미리보기' });

// 무대 안 검색창. 헤더의 검색과 겹치지 않게 무대로 좁힌다
const root = (page: Page) => stage(page).getByTestId('gooey-search');

test.describe('물방울 검색창 상세 (1440px)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('이름과 줄이기 글과 Props가 있다', async ({ page }) => {
    await page.goto('/motion/gooey-search');
    await expect(
      page.getByRole('heading', { level: 1, name: 'GooeySearch' })
    ).toBeVisible();
    await expect(root(page)).toBeVisible();
    await expect(stage(page).getByText('바깥 영역')).toBeVisible();
    await expect(page.getByText('움직임 줄이기에서는')).toContainText(
      '갈라짐 없이 바로 열리고 닫힙니다.'
    );
    await expect(page.getByText('onOpenChange').first()).toBeVisible();
  });

  test('시연을 멈추고 열어 입력하면 결과가 보이고 Esc로 닫으면 단추로 포커스가 돌아온다', async ({
    page,
  }) => {
    await page.goto('/motion/gooey-search');
    await stage(page).getByRole('button', { name: '시연 멈춤' }).click();
    const trigger = stage(page).getByRole('button', { name: '검색 열기' });
    await trigger.click();
    await expect(root(page)).toHaveAttribute('data-open', 'true');
    const input = stage(page).getByRole('textbox', { name: '검색' });
    await expect(input).toBeFocused();
    await input.fill('chi');
    await expect(stage(page).getByText('Chip', { exact: true })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(root(page)).toHaveAttribute('data-open', 'false');
    await expect(
      stage(page).getByRole('button', { name: '검색 열기' })
    ).toBeFocused();
    // 닫으면 검색어를 비운다(부모가 정한다)
    await trigger.click();
    await expect(input).toHaveValue('');
  });

  test('대본이 열고 닫기를 되풀이한다', async ({ page }) => {
    await page.goto('/motion/gooey-search');
    const open = () => root(page).getAttribute('data-open');
    await expect.poll(open, { timeout: 15_000, intervals: [100] }).toBe('true');
    await expect
      .poll(open, { timeout: 15_000, intervals: [100] })
      .toBe('false');
  });
});

test.describe('물방울 검색창 상세 축소 모션', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('갈라짐 없이 바로 열리고 입력에 포커스가 가며 전이가 없다', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/motion/gooey-search');
    await stage(page).getByRole('button', { name: '검색 열기' }).click();
    await expect(
      stage(page).getByRole('textbox', { name: '검색' })
    ).toBeFocused();
    const running = await root(page).evaluate(
      (el) => el.getAnimations({ subtree: true }).length
    );
    expect(running).toBe(0);
  });
});
