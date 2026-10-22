import { test, expect, type Page } from '@playwright/test';

/**
 * 시연할 움직임이 없는 컴포넌트(Divider, List)의 무대에는 대본이 없다: 일시정지 단추도 연출 커서도 없고,
 * 조작판 값만 무대와 코드를 같이 바꾼다.
 */

const pick = (page: Page, name: string) =>
  page
    .locator('[role="group"] button, [role="radiogroup"] label')
    .filter({ hasText: new RegExp(`^${name}$`) })
    .first()
    .click();

test('Divider 무대는 대본이 없고 조작판 값이 무대와 코드를 같이 바꾼다', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/components/divider');
  const stage = page.getByRole('region', { name: 'Divider 미리보기' });
  await expect(stage.getByRole('separator')).toBeVisible();
  await expect(stage.locator('[data-stage-control]')).toHaveCount(0);
  await expect(stage.locator('svg.lucide-mouse-pointer-2')).toHaveCount(0);

  await pick(page, 'vertical');
  const sep = stage.getByRole('separator');
  await expect(sep).toHaveAttribute('aria-orientation', 'vertical');
  // 세로 선은 flex 줄의 높이를 채운다
  expect((await sep.boundingBox())!.height).toBeGreaterThan(100);
  await page.getByText('children', { exact: true }).first().click();
  await expect(sep).toHaveAttribute('aria-label', '또는');
  const code = page.locator('pre').first();
  await expect(code).toContainText('orientation="vertical"');
  await expect(code).toContainText('또는');
});

test('List 무대는 대본이 없고 조작판 값이 무대와 코드를 같이 바꾼다', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/components/list');
  const stage = page.getByRole('region', { name: 'List 미리보기' });
  const list = stage.getByRole('list');
  await expect(list).toBeVisible();
  await expect(stage.locator('[data-stage-control]')).toHaveCount(0);
  await expect(stage.locator('svg.lucide-mouse-pointer-2')).toHaveCount(0);

  await pick(page, 'sm');
  await pick(page, 'vertical');
  await expect(list).toHaveCSS('row-gap', '8px');
  await expect(list.getByRole('listitem').first()).toHaveCSS(
    'flex-direction',
    'column'
  );
  const code = page.locator('pre').first();
  await expect(code).toContainText('spacing="sm"');
  await expect(code).toContainText('layout="vertical"');
});
