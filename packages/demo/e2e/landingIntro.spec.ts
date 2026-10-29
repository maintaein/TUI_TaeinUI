import { expect, test, type Page } from '@playwright/test';

const SENTENCE =
  '재미있는 모션과 인터랙티브한 효과를 추구한 React UI 컴포넌트 라이브러리. 느낌있고 멋진 웹사이트를 만들어 보고 싶으신가요? TaeinUI가 무료로 해결해 드립니다.';

const glyphs = (page: Page) => page.locator('main [data-hangul-glyph]');

// 시각 글자(aria-hidden 묶음) 중 가장 투명한 값. 이름은 재생과 무관하게 늘 완성 문장이라 불투명도를 잰다
const minGlyphOpacity = (page: Page) =>
  glyphs(page).evaluateAll((els) =>
    Math.min(...els.map((el) => Number(getComputedStyle(el).opacity)))
  );

// 앱이 그려지기 전의 측정은 대상이 없어 의미가 없다. 글자 칸이 붙은 뒤에 잰다.
const rendered = async (page: Page) => {
  await expect(glyphs(page).first()).toBeAttached();
};

// 페이지 로드 전부터 layout-shift를 모은다
const trackShifts = (page: Page) =>
  page.addInitScript(() => {
    const w = window as unknown as { __cls: number };
    w.__cls = 0;
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        const s = e as PerformanceEntry & {
          value: number;
          hadRecentInput: boolean;
        };
        if (!s.hadRecentInput) w.__cls += s.value;
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });

test.describe('랜딩 소개 문장 (1440px)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('소개 문장 전체가 접근성 트리에서 한 덩어리로 찾히고 시각 글자는 가려져 있다', async ({
    page,
  }) => {
    await page.goto('/');
    await rendered(page);
    await expect(page.getByText(SENTENCE, { exact: true })).toHaveCount(1);
    await expect(page.locator('main [data-hangul-visual]')).toHaveAttribute(
      'aria-hidden',
      'true'
    );
  });

  test('움직임이 있으면 마운트 직후 완성 글자가 흩어진 채로 시작한다', async ({
    page,
  }) => {
    await page.goto('/');
    await rendered(page);
    await expect.poll(() => minGlyphOpacity(page)).toBeLessThan(1);
    // 끝에는 모든 글자가 완성되어 있다
    await expect.poll(() => minGlyphOpacity(page), { timeout: 15_000 }).toBe(1);
  });

  test('긴 문장도 재생이 로드 뒤 2.5초 안에 끝난다', async ({ page }) => {
    await page.goto('/');
    await rendered(page);
    // 모든 완성 글자가 보이고 오린 조각은 걷혀 있어야 끝이다
    await expect
      .poll(
        () =>
          page.locator('main [data-hangul-visual]').evaluate((root) => {
            const op = (sel: string) =>
              [...root.querySelectorAll(sel)].map((el) =>
                Number(getComputedStyle(el).opacity)
              );
            const piecesGone = [
              ...root.querySelectorAll('[data-hangul-jamo]'),
            ].every((el) => getComputedStyle(el).display === 'none');
            return Math.min(...op('[data-hangul-glyph]')) === 1 && piecesGone;
          }),
        { timeout: 2_500, intervals: [100] }
      )
      .toBe(true);
  });

  test('축소 모션에서는 마운트 직후부터 모든 완성 글자가 보인다', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await rendered(page);
    expect(await minGlyphOpacity(page)).toBe(1);
    await page.waitForTimeout(500);
    expect(await minGlyphOpacity(page)).toBe(1);
  });

  test('로드부터 재생이 끝날 때까지 레이아웃 이동이 없다', async ({ page }) => {
    await trackShifts(page);
    await page.goto('/');
    await rendered(page);
    await expect.poll(() => minGlyphOpacity(page), { timeout: 15_000 }).toBe(1);
    await page.waitForTimeout(500);
    const cls = await page.evaluate(
      () => (window as unknown as { __cls: number }).__cls
    );
    test.info().annotations.push({ type: 'cls', description: String(cls) });
    // 기준선(옛 문단)도 폰트 교체 등으로 1e-5 안팎이 잡힌다. 글자 칸이 밀리면 이보다 훨씬 크다
    expect(cls).toBeLessThan(0.0001);
  });
});

test.describe('랜딩 소개 문장 (390px)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('낱말이 두 줄로 갈리지 않는다', async ({ page }) => {
    await page.goto('/');
    await rendered(page);
    const words = page.locator('main [data-hangul-word]');
    const total = await words.count();
    expect(total).toBeGreaterThan(10);
    const broken = await words.evaluateAll(
      (els) =>
        els.filter((w) => {
          const tops = [...w.querySelectorAll('[data-hangul-cell]')].map((c) =>
            Math.round(c.getBoundingClientRect().top)
          );
          return new Set(tops).size > 1;
        }).length
    );
    expect(broken).toBe(0);
  });
});
