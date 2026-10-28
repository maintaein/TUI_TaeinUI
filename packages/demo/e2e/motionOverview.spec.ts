import { expect, test, type Page } from '@playwright/test';

// 시각 글자 중 가장 투명한 값. 정지 상태는 늘 1이다
const minGlyphOpacity = (page: Page) =>
  page
    .locator('[data-stage-mini] [data-hangul-glyph]')
    .evaluateAll((els) =>
      Math.min(...els.map((el) => Number(getComputedStyle(el).opacity)))
    );

const maxJamoOpacity = (page: Page) =>
  page
    .locator('[data-stage-mini] [data-hangul-jamo]')
    .evaluateAll((els) =>
      Math.max(...els.map((el) => Number(getComputedStyle(el).opacity)))
    );

const nav = (page: Page) => page.getByRole('navigation', { name: '사이트' });

test.describe('헤더 내비 모션 (1440px)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('모션 링크로 /motion에 가고 현재 표시가 붙는다', async ({ page }) => {
    await page.goto('/');
    await nav(page).getByRole('link', { name: '모션' }).click();
    await expect(page).toHaveURL(/\/motion$/);
    await expect(nav(page).getByRole('link', { name: '모션' })).toHaveAttribute(
      'aria-current',
      'page'
    );
    await expect(
      nav(page).getByRole('link', { name: '컴포넌트' })
    ).not.toHaveAttribute('aria-current', 'page');
  });

  test('모션 상세에서도 모션이 현재다', async ({ page }) => {
    await page.goto('/motion/hangul-assemble');
    await expect(nav(page).getByRole('link', { name: '모션' })).toHaveAttribute(
      'aria-current',
      'page'
    );
  });

  test('컴포넌트 쪽에서는 컴포넌트가 현재다', async ({ page }) => {
    await page.goto('/components/button');
    await expect(
      nav(page).getByRole('link', { name: '컴포넌트' })
    ).toHaveAttribute('aria-current', 'page');
    await expect(
      nav(page).getByRole('link', { name: '모션' })
    ).not.toHaveAttribute('aria-current', 'page');
  });

  test('사이드바 시작 묶음의 전체 모션이 /motion으로 간다', async ({
    page,
  }) => {
    await page.goto('/components/button');
    const link = page
      .getByRole('navigation', { name: '문서' })
      .getByRole('link', { name: '전체 모션' });
    await link.click();
    await expect(page).toHaveURL(/\/motion$/);
    await expect(link).toHaveAttribute('aria-current', 'page');
  });
});

test.describe('모션 전체 보기', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('개수와 분류 절과 한글 조립 카드가 있고 누르면 상세로 간다', async ({
    page,
  }) => {
    await page.goto('/motion');
    await expect(
      page.getByRole('heading', { level: 1, name: '모션 1개' })
    ).toBeVisible();
    const sections = page.locator('main section');
    await expect(sections).toHaveCount(1);
    await expect(
      sections.getByRole('heading', { level: 2, name: /텍스트 애니메이션/ })
    ).toBeVisible();
    for (const name of ['애니메이션', '마이크로 인터랙션', '배경'])
      await expect(page.getByText(name, { exact: true })).toHaveCount(0);

    const card = page.locator('main section > div > div').first();
    await expect(
      card.getByText('HangulAssemble', { exact: true })
    ).toBeVisible();
    await expect(card.getByText('첫 화면 소개 문장, 섹션 제목')).toBeVisible();
    await card.getByRole('link', { name: '한글 조립' }).click();
    await expect(page).toHaveURL(/\/motion\/hangul-assemble$/);
  });

  test('움직임 멈춤을 켜면 완성 글자가 서고 끄면 다시 재생한다', async ({
    page,
  }) => {
    await page.goto('/motion');
    const pause = page.getByRole('button', { name: '움직임 멈춤' });
    await pause.click();
    await expect(pause).toHaveAttribute('aria-pressed', 'true');
    // 재생 시작 직후라면 마지막 글자 칸이 아직 투명하다. 멈춤이면 처음부터 끝까지 1이다
    expect(await minGlyphOpacity(page)).toBe(1);
    await page.waitForTimeout(300);
    expect(await minGlyphOpacity(page)).toBe(1);
    // 흩어진 자모 조각은 멈춤 구간 내내 투명하다(완성 글자와 겹쳐 보이지 않는다)
    expect(await maxJamoOpacity(page)).toBe(0);

    await pause.click();
    await expect(pause).toHaveAttribute('aria-pressed', 'false');
    await expect.poll(() => minGlyphOpacity(page)).toBeLessThan(1);
    await expect.poll(() => minGlyphOpacity(page)).toBe(1);
  });
});

test.describe('모션 전체 보기 (390px)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  // 낱말 묶음 span의 글자 칸 top이 모두 같으면 낱말이 두 줄로 갈리지 않았다
  const brokenWords = (page: Page, scope: string) =>
    page.locator(`${scope} [data-hangul-word]`).evaluateAll(
      (words) =>
        words.filter((w) => {
          const tops = [...w.querySelectorAll('[data-hangul-cell]')].map((c) =>
            Math.round(c.getBoundingClientRect().top)
          );
          return new Set(tops).size > 1;
        }).length
    );

  test('카드 안 한글 조립이 390px에서도 재생되고 낱말이 갈리지 않는다', async ({
    page,
  }) => {
    await page.goto('/motion');
    // 마지막 글자 칸은 시작이 늦어 한동안 투명하다
    await expect.poll(() => minGlyphOpacity(page)).toBeLessThan(1);
    expect(await brokenWords(page, '[data-stage-mini]')).toBe(0);
  });

  test('상세 무대에서도 낱말이 갈리지 않는다', async ({ page }) => {
    await page.goto('/motion/hangul-assemble');
    await expect(page.locator('[data-hangul-word]').first()).toBeVisible();
    expect(await brokenWords(page, 'main')).toBe(0);
  });
});
