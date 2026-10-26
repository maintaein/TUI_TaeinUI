import { test, expect } from '@playwright/test';

test.describe('페이지 네비게이션', () => {
  test('메인 페이지가 로드된다', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/TUI/i);
  });

  test('시작하기 페이지로 이동한다', async ({ page }) => {
    await page.goto('/getting-started');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      '설치부터 첫 화면까지'
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

test.describe('물방울 검색', () => {
  test('Ctrl+K로 열고 아래 화살표와 Enter로 결과를 고른다', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await expect(page.getByRole('button', { name: /^검색/ })).toBeVisible();
    await page.keyboard.press('Control+k');
    const input = page.getByRole('combobox', { name: '검색' });
    await expect(input).toBeFocused();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await input.fill('button');
    const options = page.getByRole('option');
    await expect(options.first()).toBeVisible();
    await expect(input).toHaveAttribute('aria-expanded', 'true');
    const first = await input.getAttribute('aria-activedescendant');
    await input.press('ArrowDown');
    await expect(options.nth(1)).toHaveAttribute('aria-selected', 'true');
    expect(await input.getAttribute('aria-activedescendant')).not.toBe(first);
    await input.press('ArrowUp');
    await expect(options.first()).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(/\/components\/button$/);
    await expect(input).toBeHidden();
  });

  test('검색 단추로 열고 Esc로 닫으면 단추로 포커스가 돌아온다', async ({
    page,
  }) => {
    await page.goto('/');
    const trigger = page.getByRole('button', { name: /^검색/ });
    await trigger.click();
    const input = page.getByRole('combobox', { name: '검색' });
    await expect(input).toBeFocused();
    await expect(trigger).toHaveAttribute('aria-label', '검색 닫기');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    await page.keyboard.press('Escape');
    await expect(input).toBeHidden();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toBeFocused();
  });

  test('자동 시연 중 ⌘K 검색을 유지하고 바깥 클릭과 단추로 닫으며 검색어를 초기화한다', async ({
    page,
  }) => {
    await page.goto('/');
    const input = page.getByRole('combobox', { name: '검색' });
    const trigger = page.getByRole('button', { name: /^검색/ });
    await expect(trigger).toBeVisible();
    await page.keyboard.press('Meta+k');
    await expect(input).toBeFocused();
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          const onPointer = (event: PointerEvent) => {
            if (event.isTrusted) return;
            document.removeEventListener('pointerdown', onPointer);
            resolve();
          };
          document.addEventListener('pointerdown', onPointer);
        })
    );
    await expect(input).toBeFocused();
    await input.fill('존재하지않는검색어');
    await expect(page.getByRole('listbox').getByRole('status')).toContainText(
      '검색 결과가 없습니다'
    );
    await page.locator('main').click({ position: { x: 5, y: 300 } });
    await expect(input).toBeHidden();
    await page
      .getByTestId('gooey-search')
      .evaluate((element) =>
        Promise.all(
          element
            .getAnimations({ subtree: true })
            .map((animation) => animation.finished)
        )
      );
    await trigger.click();
    await expect(input).toBeFocused();
    await expect(input).toHaveValue('');
    await input.fill('NumericSpinner');
    await page.getByRole('option').first().click();
    await expect(page).toHaveURL(/\/components\/numeric-spinner$/);
    await expect(input).toBeHidden();
    await page
      .getByTestId('gooey-search')
      .evaluate((element) =>
        Promise.all(
          element
            .getAnimations({ subtree: true })
            .map((animation) => animation.finished)
        )
      );
    await trigger.click();
    await expect(input).toBeFocused();
    await trigger.click();
    await expect(input).toBeHidden();
  });

  for (const width of [1440, 390]) {
    test(`${width}px에서 물방울이 250ms까지 천천히 출발하고 닫힐 때 제자리를 넘지 않는다`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      const search = page.getByTestId('gooey-search');
      const trigger = page.getByRole('button', { name: /^검색/ });
      const ball = page.getByTestId('gooey-ball');
      const before = await ball.boundingBox();
      const screenshotDir = testInfo.outputDir;
      await page.screenshot({
        path: `${screenshotDir}/search-${width}-closed.png`,
      });
      await trigger.click();
      await search.evaluate((element) => {
        element.getAnimations({ subtree: true }).forEach((animation) => {
          animation.pause();
          animation.currentTime = 0;
        });
      });
      const start = await ball.boundingBox();
      await search.evaluate((element) =>
        element.getAnimations({ subtree: true }).forEach((animation) => {
          animation.currentTime = 250;
        })
      );
      const header = await page
        .locator('header[data-search-open]')
        .boundingBox();
      const middle = await ball.boundingBox();
      expect((await trigger.boundingBox())!.x).toBeCloseTo(middle!.x, 1);
      expect(middle!.x + middle!.width).toBeLessThanOrEqual(
        header!.x + header!.width
      );
      await page.screenshot({
        path: `${screenshotDir}/search-${width}-splitting.png`,
      });
      await search.evaluate((element) =>
        element
          .getAnimations({ subtree: true })
          .forEach((animation) => animation.play())
      );
      const input = page.getByRole('combobox', { name: '검색' });
      await expect(input).toBeFocused();
      await search.evaluate((element) =>
        Promise.all(
          element
            .getAnimations({ subtree: true })
            .map((animation) => animation.finished)
        )
      );
      const after = await ball.boundingBox();
      expect.soft(middle!.x - start!.x).toBeGreaterThan(0);
      expect.soft(middle!.x - start!.x).toBeLessThan((after!.x - start!.x) / 2);
      expect(after!.x).toBeGreaterThan(before!.x + 20);
      const bounds = await search.boundingBox();
      expect(bounds!.x).toBeGreaterThanOrEqual(header!.x);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(
        header!.x + header!.width
      );
      await expect(page.getByTestId('gooey-shapes')).toHaveCSS(
        'filter',
        /url\(/
      );
      await input.fill('button');
      await expect(page.getByRole('option').first()).toBeVisible();
      const panel = await page.getByRole('listbox').boundingBox();
      expect(panel!.x).toBeGreaterThanOrEqual(0);
      expect(panel!.x + panel!.width).toBeLessThanOrEqual(width);
      await page.screenshot({
        path: `${screenshotDir}/search-${width}-results.png`,
      });
      await trigger.click();
      await expect(input).toBeHidden();
      for (const elapsed of [0, 100, 250, 500, 750, 1000]) {
        await search.evaluate(
          (element, time) =>
            element.getAnimations({ subtree: true }).forEach((animation) => {
              animation.pause();
              animation.currentTime = time;
            }),
          elapsed
        );
        const closing = await ball.boundingBox();
        expect((await trigger.boundingBox())!.x).toBeCloseTo(closing!.x, 1);
        expect
          .soft(closing!.x, `닫힘 ${elapsed}ms`)
          .toBeGreaterThanOrEqual(before!.x - 0.5);
      }
    });
  }

  test('축소 모션에서는 즉시 열리고 입력에 포커스가 간다', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.getByRole('button', { name: /^검색/ }).click();
    const input = page.getByRole('combobox', { name: '검색' });
    await expect(input).toBeFocused();
    expect(
      await page
        .getByTestId('gooey-search')
        .evaluate((element) => element.getAnimations({ subtree: true }).length)
    ).toBe(0);
    await input.press('Escape');
    await expect(input).toBeHidden();
    await expect(page.getByRole('button', { name: /^검색/ })).toBeFocused();
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

  test('데스크톱에서는 헤더 링크와 검색 단추가 보인다', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await expect(
      page.getByRole('navigation', { name: '사이트' })
    ).toBeVisible();
    await expect(page.getByRole('button', { name: /^검색/ })).toBeVisible();
  });
});
