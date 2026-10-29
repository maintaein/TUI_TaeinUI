import { test, expect, type Page } from '@playwright/test';

const SENTENCE = '흩어진 조각이 맞물려 글자가 됩니다';
test.describe('모션 계열 사이드바 (1280px)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('모션 머리와 텍스트 애니메이션 묶음 아래 한글 조립 링크가 있다', async ({
    page,
  }) => {
    await page.goto('/components/button');
    const nav = page.getByRole('navigation', { name: '문서' });
    await expect(nav.getByText('모션', { exact: true })).toBeVisible();
    await expect(
      nav.getByText('텍스트 애니메이션', { exact: true })
    ).toBeVisible();
    const link = nav.getByRole('link', { name: /한글 조립/ });
    await expect(link).toHaveAttribute('href', '/motion/hangul-assemble');
    await link.click();
    await expect(page).toHaveURL(/\/motion\/hangul-assemble$/);
    await expect(nav.locator('[aria-current="page"]')).toHaveText(/한글 조립/);
  });

  test('컴포넌트 분류에 물방울 검색창 링크가 있다', async ({ page }) => {
    await page.goto('/components/button');
    const nav = page.getByRole('navigation', { name: '문서' });
    await expect(nav.getByText('컴포넌트', { exact: true })).toBeVisible();
    const link = nav.getByRole('link', { name: /물방울 검색창/ });
    await expect(link).toHaveAttribute('href', '/motion/gooey-search');
    await link.click();
    await expect(page).toHaveURL(/\/motion\/gooey-search$/);
    await expect(nav.locator('[aria-current="page"]')).toHaveText(
      /물방울 검색창/
    );
  });

  test('마이크로 인터랙션 분류에 복사됨 링크가 있다', async ({ page }) => {
    await page.goto('/components/button');
    const nav = page.getByRole('navigation', { name: '문서' });
    await expect(
      nav.getByText('마이크로 인터랙션', { exact: true })
    ).toBeVisible();
    const link = nav.getByRole('link', { name: /복사됨/ });
    await expect(link).toHaveAttribute('href', '/motion/copy-button');
    await link.click();
    await expect(page).toHaveURL(/\/motion\/copy-button$/);
    await expect(nav.locator('[aria-current="page"]')).toHaveText(/복사됨/);
  });

  test('마이크로 인터랙션 분류에 좋아요 터짐 링크가 있다', async ({ page }) => {
    await page.goto('/components/button');
    const nav = page.getByRole('navigation', { name: '문서' });
    const link = nav.getByRole('link', { name: /좋아요 터짐/ });
    await expect(link).toHaveAttribute('href', '/motion/burst-toggle');
    await link.click();
    await expect(page).toHaveURL(/\/motion\/burst-toggle$/);
    await expect(nav.locator('[aria-current="page"]')).toHaveText(
      /좋아요 터짐/
    );
  });

  test('마이크로 인터랙션 분류에 꾹 눌러 확정 링크가 있다', async ({
    page,
  }) => {
    await page.goto('/components/button');
    const nav = page.getByRole('navigation', { name: '문서' });
    const link = nav.getByRole('link', { name: /꾹 눌러 확정/ });
    await expect(link).toHaveAttribute('href', '/motion/hold-button');
    await link.click();
    await expect(page).toHaveURL(/\/motion\/hold-button$/);
    await expect(nav.locator('[aria-current="page"]')).toHaveText(
      /꾹 눌러 확정/
    );
  });

  test('마이크로 인터랙션 분류에 출렁이는 게이지 링크가 있다', async ({
    page,
  }) => {
    await page.goto('/components/button');
    const nav = page.getByRole('navigation', { name: '문서' });
    const link = nav.getByRole('link', { name: /출렁이는 게이지/ });
    await expect(link).toHaveAttribute('href', '/motion/slosh-gauge');
    await link.click();
    await expect(page).toHaveURL(/\/motion\/slosh-gauge$/);
    await expect(nav.locator('[aria-current="page"]')).toHaveText(
      /출렁이는 게이지/
    );
  });

  test('마이크로 인터랙션 분류에 인증번호 슬롯 링크가 있다', async ({
    page,
  }) => {
    await page.goto('/components/button');
    const nav = page.getByRole('navigation', { name: '문서' });
    const link = nav.getByRole('link', { name: /인증번호 슬롯/ });
    await expect(link).toHaveAttribute('href', '/motion/code-slots');
    await link.click();
    await expect(page).toHaveURL(/\/motion\/code-slots$/);
    await expect(nav.locator('[aria-current="page"]')).toHaveText(
      /인증번호 슬롯/
    );
  });

  test('마이크로 인터랙션 분류에 부채꼴 메뉴 링크가 있다', async ({ page }) => {
    await page.goto('/components/button');
    const nav = page.getByRole('navigation', { name: '문서' });
    const link = nav.getByRole('link', { name: /부채꼴 메뉴/ });
    await expect(link).toHaveAttribute('href', '/motion/fan-menu');
    await link.click();
    await expect(page).toHaveURL(/\/motion\/fan-menu$/);
    await expect(nav.locator('[aria-current="page"]')).toHaveText(
      /부채꼴 메뉴/
    );
  });

  test('마이크로 인터랙션 분류에 날개 전송 링크가 있다', async ({ page }) => {
    await page.goto('/components/button');
    const nav = page.getByRole('navigation', { name: '문서' });
    const link = nav.getByRole('link', { name: /날개 전송/ });
    await expect(link).toHaveAttribute('href', '/motion/wing-button');
    await link.click();
    await expect(page).toHaveURL(/\/motion\/wing-button$/);
    await expect(nav.locator('[aria-current="page"]')).toHaveText(/날개 전송/);
  });

  test('배경 분류에 빛 물줄기 링크가 있다', async ({ page }) => {
    await page.goto('/components/button');
    const nav = page.getByRole('navigation', { name: '문서' });
    await expect(nav.getByText('배경', { exact: true })).toBeVisible();
    const link = nav.getByRole('link', { name: /빛 물줄기/ });
    await expect(link).toHaveAttribute('href', '/motion/luminous-flow');
    await link.click();
    await expect(page).toHaveURL(/\/motion\/luminous-flow$/);
    await expect(nav.locator('[aria-current="page"]')).toHaveText(/빛 물줄기/);
  });

  test('모션 상세에도 붙박이 사이드바가 붙는다', async ({ page }) => {
    await page.goto('/motion/hangul-assemble');
    await expect(page.locator('#site-nav')).toBeInViewport();
    await expect(
      page.getByRole('button', { name: '탐색 닫기' })
    ).toHaveAttribute('aria-expanded', 'true');
  });
});

test.describe('모션 계열 서랍 (390px)', () => {
  test.use({ viewport: { width: 390, height: 800 } });

  test('서랍에도 같은 모션 목록이 나온다', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '탐색 열기' }).click();
    const aside = page.locator('#site-nav');
    await expect(aside.getByText('모션', { exact: true })).toBeVisible();
    await aside.getByRole('link', { name: /한글 조립/ }).click();
    await expect(page).toHaveURL(/\/motion\/hangul-assemble$/);
  });
});

test.describe('모션 검색', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  for (const term of ['한글 조립', '자모', 'HangulAssemble']) {
    test(`"${term}"로 찾아 이동한다`, async ({ page }) => {
      await page.goto('/');
      // 앱이 그려지기 전의 키는 단축키 effect가 붙기 전이라 사라진다. 검색 단추가 보이면 붙은 뒤다.
      await expect(page.getByRole('button', { name: /^검색/ })).toBeVisible();
      await page.keyboard.press('Control+k');
      const input = page.getByRole('combobox', { name: '검색' });
      await input.fill(term);
      const option = page.getByRole('option', { name: /한글 조립/ });
      await expect(option).toBeVisible();
      await expect(page.getByRole('listbox')).toContainText('모션');
      await option.click();
      await expect(page).toHaveURL(/\/motion\/hangul-assemble$/);
    });
  }
});

test.describe('한글 조립 상세', () => {
  test('접근성 트리에 완성 문장이 제목으로 찾히고 시각 글자는 가려져 있다', async ({
    page,
  }) => {
    await page.goto('/motion/hangul-assemble');
    const stage = page.getByRole('region', {
      name: 'HangulAssemble 미리보기',
    });
    await expect(
      stage.getByRole('heading', { level: 2, name: SENTENCE })
    ).toBeVisible();
    await expect(stage.locator('[aria-hidden="true"]').first()).toBeVisible();
    await expect(page.getByText('움직임 줄이기에서는')).toContainText(
      '완성 문장을 바로 보여 줍니다.'
    );
  });

  test('as를 바꾸면 제목 단계가 바뀌고 문장을 바꾸면 접근성 이름이 따라온다', async ({
    page,
  }) => {
    await page.goto('/motion/hangul-assemble');
    const stage = page.getByRole('region', {
      name: 'HangulAssemble 미리보기',
    });
    await page
      .getByRole('radiogroup', { name: 'as', exact: true })
      .getByRole('radio', { name: 'h1', exact: true })
      .locator('..')
      .click();
    await expect(stage.getByRole('heading', { level: 1 })).toHaveCount(1);
    await page.getByRole('textbox', { name: 'text' }).fill('안녕하세요');
    await expect(
      stage.getByRole('heading', { level: 1, name: '안녕하세요' })
    ).toBeVisible();
  });

  test('다시 재생 단추가 새로 마운트해 자모를 다시 흩는다', async ({
    page,
  }) => {
    await page.goto('/motion/hangul-assemble');
    const stage = page.getByRole('region', {
      name: 'HangulAssemble 미리보기',
    });
    const root = stage.getByRole('heading', { level: 2 });
    await root.evaluate((el) => el.setAttribute('data-mounted', 'old'));
    await stage.getByRole('button', { name: '다시 재생' }).click();
    await expect(root).not.toHaveAttribute('data-mounted', 'old');
    await expect(
      stage.getByRole('heading', { level: 2, name: SENTENCE })
    ).toBeVisible();
  });

  // 시각 글자(aria-hidden 묶음)의 가장 투명한 완성 글자 값. 이름(접근성 트리)은 재생과 무관하게 늘 완성 문장이라 불투명도를 잰다
  const minGlyphOpacity = (page: Page) =>
    page
      .getByRole('region', { name: 'HangulAssemble 미리보기' })
      .locator('[data-hangul-glyph]')
      .evaluateAll((els) =>
        Math.min(...els.map((el) => Number(getComputedStyle(el).opacity)))
      );

  test('움직임이 있으면 다시 재생 직후 완성 글자가 아직 흩어진 채로 시작한다', async ({
    page,
  }) => {
    await page.goto('/motion/hangul-assemble');
    await page.getByRole('button', { name: '다시 재생' }).click();
    // 마지막 글자 칸은 시작이 늦어 1초 가까이 투명하다
    await expect.poll(() => minGlyphOpacity(page)).toBeLessThan(1);
  });

  test('축소 모션에서는 다시 재생해도 완성 글자가 바로 보인다', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/motion/hangul-assemble');
    await page.getByRole('button', { name: '다시 재생' }).click();
    expect(await minGlyphOpacity(page)).toBe(1);
    await page.waitForTimeout(300);
    expect(await minGlyphOpacity(page)).toBe(1);
  });
});
