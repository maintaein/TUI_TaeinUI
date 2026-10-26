import { test, expect } from '@playwright/test';

for (const width of [1440, 390]) {
  test.describe(`컴포넌트 묶음 ${width}px`, () => {
    test.use({ viewport: { width, height: 900 } });

    test.beforeEach(async ({ page }) => {
      await page.goto('/components/overview');
    });

    test('검색 없이 묶음 필터가 있고 스크롤하면 화면 밖으로 나간다', async ({
      page,
    }) => {
      await expect(
        page.getByRole('searchbox', { name: '이름으로 찾기' })
      ).toHaveCount(0);
      const filters = page.getByRole('group', { name: '묶음으로 보기' });
      await expect(filters).toBeInViewport();
      await page.evaluate(() => window.scrollTo(0, 1200));
      await expect(filters).not.toBeInViewport();
    });

    test('선택한 칩이 primary로 채워지고 키보드로 다시 누르면 전체로 돌아온다', async ({
      page,
    }, testInfo) => {
      const filters = page.getByRole('group', { name: '묶음으로 보기' });
      const chip = filters.getByRole('button', {
        name: '폼 & 입력',
        exact: true,
      });
      await expect(page.locator('main section')).toHaveCount(6);
      await chip.click();
      await page.mouse.move(0, 0);
      await expect(chip).toHaveAttribute('aria-pressed', 'true');
      await expect(chip).toHaveCSS('background-color', 'rgb(25, 118, 210)');
      await expect(chip).toHaveCSS('color', 'rgb(255, 255, 255)');
      const contrast = await chip.evaluate((el) => {
        const luminance = (color: string) =>
          color
            .match(/\d+/g)!
            .slice(0, 3)
            .map(Number)
            .map((value) => value / 255)
            .map((value) =>
              value <= 0.04045
                ? value / 12.92
                : ((value + 0.055) / 1.055) ** 2.4
            )
            .reduce(
              (sum, value, index) =>
                sum + value * [0.2126, 0.7152, 0.0722][index],
              0
            );
        const style = getComputedStyle(el);
        const values = [
          luminance(style.color),
          luminance(style.backgroundColor),
        ];
        return (Math.max(...values) + 0.05) / (Math.min(...values) + 0.05);
      });
      expect(contrast).toBeGreaterThanOrEqual(4.5);
      await expect(page.locator('main section')).toHaveCount(1);
      await expect(page.locator('main section')).toHaveAccessibleName(
        /폼 & 입력/
      );
      await page.screenshot({
        path: testInfo.outputPath(`overview-selected-${width}.png`),
      });
      await chip.focus();
      await page.keyboard.press('Space');
      await expect(chip).toHaveAttribute('aria-pressed', 'false');
      await expect(page.locator('main section')).toHaveCount(6);
    });

    for (const reducedMotion of ['no-preference', 'reduce'] as const) {
      test(`묶음 변경의 페이드 ${reducedMotion}`, async ({ page }) => {
        await page.emulateMedia({ reducedMotion });
        const chip = page
          .getByRole('group', { name: '묶음으로 보기' })
          .getByRole('button', { name: '폼 & 입력', exact: true });
        for (const selected of [true, false]) {
          const fades = await chip.evaluate(async (el) => {
            (el as HTMLButtonElement).click();
            await new Promise(requestAnimationFrame);
            return Array.from(document.querySelectorAll('main section')).map(
              (section) =>
                section
                  .getAnimations()
                  .flatMap((animation) =>
                    (animation.effect as KeyframeEffect)
                      .getKeyframes()
                      .map((frame) => frame.opacity)
                  )
            );
          });
          expect(fades).toHaveLength(selected ? 1 : 6);
          for (const frames of fades) {
            expect(frames).toEqual(
              reducedMotion === 'reduce' ? [] : ['0', '1']
            );
          }
        }
      });
    }
  });
}
