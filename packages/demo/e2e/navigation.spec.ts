import { test, expect } from '@playwright/test';

test.describe('페이지 네비게이션', () => {
  test('메인 페이지가 로드된다', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/TUI/i);
  });

  test('시작하기 페이지로 이동한다', async ({ page }) => {
    await page.goto('/getting-started');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      '시작하기'
    );
  });

  test('컴포넌트 개요 페이지로 이동한다', async ({ page }) => {
    await page.goto('/components/overview');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('사이드바가 지금 페이지를 aria-current로 알린다', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/components/button');
    const sidebar = page.getByRole('navigation', { name: '문서' });
    await expect(sidebar).toBeVisible();
    await expect(sidebar.locator('[aria-current="page"]')).toHaveText(/Button/);
    await expect(sidebar.getByRole('link')).toHaveCount(28);
  });

  test('404 페이지가 표시된다', async ({ page }) => {
    await page.goto('/nonexistent-page');
    await expect(page.getByText('404')).toBeVisible();
  });
});

test.describe('붙박이 사이드바 (1280px, 문서 경로)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('햄버거가 판을 접고 편다', async ({ page }) => {
    await page.goto('/components/button');
    const aside = page.locator('#site-nav');
    const menu = page.getByRole('button', { name: '탐색 닫기' });
    await expect(menu).toHaveAttribute('aria-expanded', 'true');
    await expect(menu).toHaveAttribute('aria-controls', 'site-nav');
    await expect(aside).toBeInViewport();

    await menu.click();
    const reopen = page.getByRole('button', { name: '탐색 열기' });
    await expect(reopen).toHaveAttribute('aria-expanded', 'false');
    await expect(aside).not.toBeInViewport();
    // 접힌 판에는 Tab이 못 들어간다
    await expect(aside).toHaveJSProperty('inert', true);

    await reopen.click();
    await expect(
      page.getByRole('button', { name: '탐색 닫기' })
    ).toHaveAttribute('aria-expanded', 'true');
    await expect(aside).toBeInViewport();
  });
});

test.describe('서랍 (375px)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('서랍이 닫혀 있다', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#site-nav')).not.toBeInViewport();
    await expect(
      page.getByRole('button', { name: '탐색 열기' })
    ).toHaveAttribute('aria-expanded', 'false');
  });

  test('햄버거로 열면 지금 페이지 링크로 포커스가 가고 본문은 inert다', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '탐색 열기' }).click();
    const aside = page.locator('#site-nav');
    await expect(aside).toBeInViewport();
    await expect(
      aside.getByRole('link', { name: '소개', exact: true })
    ).toBeFocused();
    await expect(page.locator('main')).toHaveJSProperty('inert', true);
  });

  test('Esc로 닫으면 햄버거로 포커스가 돌아온다', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '탐색 열기' }).click();
    await expect(page.locator('#site-nav')).toBeInViewport();

    await page.keyboard.press('Escape');
    await expect(page.locator('#site-nav')).not.toBeInViewport();
    await expect(page.getByRole('button', { name: '탐색 열기' })).toBeFocused();
  });

  test('서랍 안 닫기 단추로 닫는다', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '탐색 열기' }).click();
    const aside = page.locator('#site-nav');
    await aside.getByRole('button', { name: '탐색 닫기' }).click();
    await expect(aside).not.toBeInViewport();
  });

  test('스크림을 누르면 닫힌다', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '탐색 열기' }).click();
    const aside = page.locator('#site-nav');
    await expect(aside).toBeInViewport();
    // 서랍(300px) 오른쪽 스크림
    await page.mouse.click(360, 600);
    await expect(aside).not.toBeInViewport();
  });

  test('서랍의 링크로 이동하면 닫힌다', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '탐색 열기' }).click();
    const aside = page.locator('#site-nav');
    await aside.getByRole('link', { name: '시작하기' }).click();
    await expect(page).toHaveURL(/\/getting-started$/);
    await expect(aside).not.toBeInViewport();
  });
});

test.describe('⌘K 검색', () => {
  test('Ctrl+K로 열고 결과를 Enter로 골라 이동한다', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.keyboard.press('Control+k');
    const dialog = page.getByRole('dialog', { name: '검색' });
    await expect(dialog).toBeVisible();

    const input = dialog.getByRole('combobox');
    await expect(input).toBeFocused();
    await input.fill('NumericSpinner');
    await expect(dialog.getByRole('option').first()).toBeVisible();
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(/\/components\/numeric-spinner$/);
    await expect(dialog).toBeHidden();
  });

  test('검색 단추로 열고 Esc로 닫으면 단추로 포커스가 돌아온다', async ({
    page,
  }) => {
    await page.goto('/');
    const trigger = page.getByRole('button', { name: /^검색/ });
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: '검색' });
    await expect(dialog).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });
});

test.describe('반응형 레이아웃', () => {
  test('모바일에서는 헤더 링크가 숨고 검색은 아이콘만 남는다', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: '사이트' })).toBeHidden();
    await expect(page.getByRole('button', { name: /^검색/ })).toBeVisible();
    await expect(page.getByText('⌘K')).toBeHidden();
  });

  test('데스크톱에서는 헤더 링크와 ⌘K 힌트가 보인다', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await expect(
      page.getByRole('navigation', { name: '사이트' })
    ).toBeVisible();
    await expect(page.getByText('⌘K')).toBeVisible();
  });
});
