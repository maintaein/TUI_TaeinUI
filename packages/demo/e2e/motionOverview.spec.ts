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
      page.getByRole('heading', { level: 1, name: '모션 3개' })
    ).toBeVisible();
    const sections = page.locator('main section');
    await expect(sections).toHaveCount(2);
    for (const name of [/텍스트 애니메이션/, /컴포넌트/])
      await expect(
        sections.getByRole('heading', { level: 2, name })
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

  test('젤리 글자 카드가 효과 이름과 쓰는 곳을 보이고 누르면 상세로 간다', async ({
    page,
  }) => {
    await page.goto('/motion');
    await expect(page.locator('main section')).toHaveCount(2);
    const card = page.locator('main section > div > div').nth(1);
    await expect(card.getByText('JellyText', { exact: true })).toBeVisible();
    await expect(card.getByText('히어로 문구, 브랜드 슬로건')).toBeVisible();
    await card.getByRole('link', { name: '젤리 글자' }).click();
    await expect(page).toHaveURL(/\/motion\/jelly-text$/);
  });

  test('물방울 검색창 카드가 효과 이름과 쓰는 곳을 보이고 누르면 상세로 간다', async ({
    page,
  }) => {
    await page.goto('/motion');
    const card = page.locator('main section > div > div').nth(2);
    await expect(card.getByText('GooeySearch', { exact: true })).toBeVisible();
    await expect(card.getByText('헤더 검색, 도구 막대')).toBeVisible();
    // 바깥 영역 표지는 상세 무대용이다. 카드 미니에는 글자를 그리지 않는다
    await expect(card.getByText('바깥 영역')).toHaveCount(0);
    await card.getByRole('link', { name: '물방울 검색창' }).click();
    await expect(page).toHaveURL(/\/motion\/gooey-search$/);
  });

  test('분류 칩을 누르면 그 분류 절만 보이고 다시 누르면 전체로 돌아온다', async ({
    page,
  }) => {
    await page.goto('/motion');
    const filters = page.getByRole('group', { name: '분류로 보기' });
    const chip = filters.getByRole('button', { name: '컴포넌트', exact: true });
    const sections = page.locator('main section');
    await expect(sections).toHaveCount(2);
    await chip.click();
    await expect(chip).toHaveAttribute('aria-pressed', 'true');
    await expect(sections).toHaveCount(1);
    await expect(sections).toHaveAccessibleName(/컴포넌트/);
    await expect(
      sections.getByText('GooeySearch', { exact: true })
    ).toBeVisible();
    await chip.click();
    await expect(chip).toHaveAttribute('aria-pressed', 'false');
    await expect(sections).toHaveCount(2);
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

// 젤리 글자 미니: 글자 칸 중 하나라도 단위 행렬이 아니면 출렁이는 중이다
const jellyMoving = (page: Page) =>
  page
    .locator('[data-stage-mini] [data-jelly-cell]')
    .evaluateAll((els) =>
      els.some(
        (el) => !new DOMMatrix(getComputedStyle(el).transform).isIdentity
      )
    );

test.describe('모션 전체 보기 젤리 글자 미니 (1440px)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('움직임 멈춤이면 대본의 커서가 서서 글자가 출렁이지 않고 끄면 다시 출렁인다', async ({
    page,
  }) => {
    await page.goto('/motion');
    const pause = page.getByRole('button', { name: '움직임 멈춤' });
    // 대본은 0.6초 뒤 시작해 약 1.2초부터 글자를 훑는다. 그 구간을 멈춘 채로 통과시킨다
    await pause.click();
    await expect(pause).toHaveAttribute('aria-pressed', 'true');
    for (let i = 0; i < 30; i++) {
      expect(await jellyMoving(page)).toBe(false);
      await page.waitForTimeout(100);
    }
    await pause.click();
    await expect(pause).toHaveAttribute('aria-pressed', 'false');
    await expect
      .poll(() => jellyMoving(page), { timeout: 15_000, intervals: [50] })
      .toBe(true);
  });
});

// 물방울 검색창 미니: 열림 표시. 멈추면 열린 대표 장면으로 선다
const gooeyOpen = (page: Page) =>
  page
    .locator('[data-stage-mini] [data-testid="gooey-search"]')
    .getAttribute('data-open');

test.describe('모션 전체 보기 물방울 검색창 미니 (1440px)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('대본이 열고 닫기를 되풀이하고 움직임 멈춤이면 열린 채 선다', async ({
    page,
  }) => {
    await page.goto('/motion');
    // 미니는 절반 이상 보일 때만 돈다. 가장자리에 걸치지 않게 가운데로 가져온다
    const centre = () =>
      page
        .locator('[data-stage-mini] [data-testid="gooey-search"]')
        .evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await centre();
    await expect
      .poll(() => gooeyOpen(page), { timeout: 15_000, intervals: [100] })
      .toBe('true');
    await expect
      .poll(() => gooeyOpen(page), { timeout: 15_000, intervals: [100] })
      .toBe('false');

    const pause = page.getByRole('button', { name: '움직임 멈춤' });
    await pause.click();
    await expect(pause).toHaveAttribute('aria-pressed', 'true');
    // 화면 밖이어서 서 있는 것과 구분하려고 미니를 화면 안에 두고 잰다
    await centre();
    for (let i = 0; i < 60; i++) {
      expect(await gooeyOpen(page)).toBe('true');
      await page.waitForTimeout(100);
    }
    await pause.click();
    // 단추를 누르러 위로 올라갔으니 다시 가운데로 가져와야 미니가 돈다
    await centre();
    await expect
      .poll(() => gooeyOpen(page), { timeout: 15_000, intervals: [100] })
      .toBe('false');
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

  test('카드 안 젤리 글자도 낱말이 갈리지 않는다', async ({ page }) => {
    await page.goto('/motion');
    await expect(page.locator('[data-jelly-word]').first()).toBeVisible();
    const broken = await page
      .locator('[data-stage-mini] [data-jelly-word]')
      .evaluateAll(
        (words) =>
          words.filter((w) => {
            const tops = [...w.querySelectorAll('[data-jelly-cell]')].map((c) =>
              Math.round(c.getBoundingClientRect().top)
            );
            return new Set(tops).size > 1;
          }).length
      );
    expect(broken).toBe(0);
  });

  test('상세 무대에서도 낱말이 갈리지 않는다', async ({ page }) => {
    await page.goto('/motion/hangul-assemble');
    await expect(page.locator('[data-hangul-word]').first()).toBeVisible();
    expect(await brokenWords(page, 'main')).toBe(0);
  });
});
