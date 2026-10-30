import { expect, test, type Page } from '@playwright/test';

const FONT = 'Nanum Brush Script';

const stage = (page: Page) =>
  page.getByRole('region', { name: 'BrushText 미리보기' });

/** 아직 화면에 남은 획 조각(계산된 display가 none이 아닌 것) 수 */
const shownStrokes = (page: Page) =>
  stage(page)
    .locator('[data-brush-stroke]')
    .evaluateAll(
      (els) =>
        els.filter((el) => getComputedStyle(el).display !== 'none').length
    );

/** 완성 글자(진짜 글자 span) 중 가장 투명한 값 */
const minGlyphOpacity = (page: Page) =>
  stage(page)
    .locator('[data-brush-glyph]')
    .evaluateAll((els) =>
      Math.min(...els.map((el) => Number(getComputedStyle(el).opacity)))
    );

test.describe('붓글씨 글자 상세', () => {
  test('다시 쓰기 뒤 쓰는 중에는 조각 층이 보이고, 다 쓰면 조각 층이 걷혀 진짜 글자만 보인다', async ({
    page,
  }) => {
    await page.goto('/motion/brush-text');
    await page.getByRole('button', { name: '다시 쓰기' }).click();

    // 쓰는 중: 조각이 보이고 완성 글자는 아직 숨어 있는 칸이 있다
    await expect.poll(() => shownStrokes(page)).toBeGreaterThan(0);
    await expect.poll(() => minGlyphOpacity(page)).toBe(0);

    // 3초 상한 안에 끝나고 조각이 모두 걷힌다
    await expect.poll(() => shownStrokes(page), { timeout: 5000 }).toBe(0);
    expect(await minGlyphOpacity(page)).toBe(1);
    await expect(
      stage(page).getByRole('heading', { level: 2, name: '한 획 한 획' })
    ).toBeVisible();
    // 인라인 값이 남지 않는다
    expect(
      await stage(page)
        .locator('[data-brush-stroke], [data-brush-glyph]')
        .evaluateAll((els) =>
          els.filter(
            (el) =>
              (el as HTMLElement).style.display !== '' ||
              (el as HTMLElement).style.opacity !== '' ||
              (el as HTMLElement).style.getPropertyValue('--brush-p') !== ''
          )
        )
        .then((left) => left.length)
    ).toBe(0);
  });

  test('나눔붓글씨가 실제로 적용된다', async ({ page }) => {
    await page.goto('/motion/brush-text');
    const sentence = stage(page).getByRole('heading', { level: 2 });
    await expect(sentence).toHaveCSS('font-family', /Nanum Brush Script/);
    // 글꼴 파일이 실제로 내려와 로드됐다(대체 글꼴이 그려진 것이 아니다)
    await expect
      .poll(() =>
        page.evaluate(
          (family) =>
            [...document.fonts].some(
              (f) =>
                f.family.replace(/["']/g, '') === family &&
                f.status === 'loaded'
            ),
          FONT
        )
      )
      .toBe(true);
    expect(
      await page.evaluate(
        (family) => document.fonts.check(`40px "${family}"`, '붓'),
        FONT
      )
    ).toBe(true);
  });

  test('붓 글꼴은 그 글꼴을 쓰는 화면에서만 내려받는다', async ({ page }) => {
    const fontRequests: string[] = [];
    page.on('request', (r) => {
      if (r.url().includes('NanumBrushScript')) fontRequests.push(r.url());
    });
    await page.goto('/components/button');
    await page.waitForLoadState('networkidle');
    expect(fontRequests).toEqual([]);
  });

  test('축소 모션에서는 처음부터 완성 문장이다', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/motion/brush-text');
    await expect(
      stage(page).locator('[data-brush-glyph]').first()
    ).toBeVisible();
    expect(await minGlyphOpacity(page)).toBe(1);
    expect(await shownStrokes(page)).toBe(0);
    await page.waitForTimeout(300);
    expect(await minGlyphOpacity(page)).toBe(1);
    expect(await shownStrokes(page)).toBe(0);
  });
});
