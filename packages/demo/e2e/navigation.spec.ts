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

  test('사이드바 네비게이션이 동작한다', async ({ page }) => {
    await page.goto('/');
    const sidebar = page.locator('nav');
    await expect(sidebar).toBeVisible();
  });

  test('404 페이지가 표시된다', async ({ page }) => {
    await page.goto('/nonexistent-page');
    await expect(page.getByText('404')).toBeVisible();
  });
});

test.describe('반응형 레이아웃', () => {
  test('모바일 뷰에서 사이드바가 화면 밖으로 이동한다', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    // 모바일에서는 aside가 translateX(-100%)로 viewport 밖에 위치
    const aside = page.locator('aside');
    await expect(aside).not.toBeInViewport();
  });

  test('데스크톱 뷰에서 사이드바가 표시된다', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await expect(page.locator('nav')).toBeVisible();
  });
});
