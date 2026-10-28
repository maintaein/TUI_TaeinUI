import { expect, test, type Page } from '@playwright/test';

const stage = (page: Page) =>
  page.getByRole('region', { name: 'StampButton 미리보기' });
const stamp = (page: Page) =>
  stage(page).getByRole('button', { name: '제출', exact: true });
const mark = (page: Page) => stage(page).locator('[data-stamp-mark]');
// 누를 때마다 느는 결과 글. 잠긴 뒤에는 늘지 않는다
const result = (page: Page, n: number) => stage(page).getByText(`제출 ${n}번`);

// 앱이 그려지기 전의 입력은 버려진다. 단추가 보인 뒤에 시연을 멈춘다
const open = async (page: Page) => {
  await page.goto('/motion/stamp-button');
  await expect(stamp(page)).toBeVisible();
  await stage(page).getByRole('button', { name: '시연 멈춤' }).click();
};

// 계산된 transform 행렬: matrix(a, b, c, d, tx, ty)
const matrixOf = (page: Page) =>
  mark(page).evaluate((el) => {
    const m = getComputedStyle(el).transform.match(/matrix\(([^)]+)\)/);
    return m ? m[1].split(',').map(Number) : [];
  });

test.describe('도장 확정 상세 (1440px)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('이름과 줄이기 글과 Props가 있다', async ({ page }) => {
    await page.goto('/motion/stamp-button');
    await expect(
      page.getByRole('heading', { level: 1, name: 'StampButton' })
    ).toBeVisible();
    await expect(stamp(page)).toBeVisible();
    await expect(page.getByText('움직임 줄이기에서는').first()).toContainText(
      '도장과 인주 자국이 움직임 없이 바로 나타납니다.'
    );
    await expect(page.getByText('stampLabel').first()).toBeVisible();
  });

  test('누르면 도장이 보이고 다시 눌러도 결과 글이 한 번만 는다', async ({
    page,
  }) => {
    await open(page);
    await expect(mark(page)).toHaveCount(0);
    await result(page, 0).waitFor();
    await stamp(page).click();
    await expect(mark(page)).toBeVisible();
    await expect(mark(page)).toContainText('승인');
    await expect(stamp(page)).toHaveAttribute('aria-disabled', 'true');
    await expect(stage(page).getByRole('status')).toHaveText(
      '승인 도장을 찍었습니다'
    );
    // 잠긴 단추는 Playwright가 누를 수 없다고 보므로 강제로 누른다
    await stamp(page).click({ force: true });
    await page.keyboard.press('Enter');
    await page.keyboard.press('Space');
    await expect(result(page, 1)).toBeVisible();
    await expect(result(page, 2)).toHaveCount(0);
    await expect(stamp(page)).toBeFocused();
  });

  test('도장이 위에서 내려와 단추 위에 -8deg로 기운 채 남고 인주 자국이 번진다', async ({
    page,
  }) => {
    await open(page);
    // 누른 첫 프레임에서 도장은 단추 가운데보다 한참 위에 있다
    const gap = await stamp(page).evaluate(async (btn) => {
      btn.click();
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      const m = document.querySelector('[data-stamp-mark]');
      if (!m) return 0;
      const a = m.getBoundingClientRect();
      const b = btn.getBoundingClientRect();
      return b.top + b.height / 2 - (a.top + a.height / 2);
    });
    expect(gap).toBeGreaterThan(25);
    // 끝: 가운데에 앉고 1배, -8deg(cos 0.990, sin -0.139)
    await expect
      .poll(
        async () =>
          (await matrixOf(page)).slice(0, 6).map((n) => +n.toFixed(2)),
        {
          timeout: 3000,
        }
      )
      .toEqual([0.99, -0.14, 0.14, 0.99, 0, 0]);
    const ink = stage(page).locator('[data-stamp-ink] mask circle');
    await expect
      .poll(() => ink.getAttribute('r'), { timeout: 3000 })
      .toBe('60');
  });

  test('다시 찍기 단추가 처음 상태로 돌린다', async ({ page }) => {
    await open(page);
    await stamp(page).click();
    await expect(stamp(page)).toHaveAttribute('aria-disabled', 'true');
    await stage(page).getByRole('button', { name: '다시 찍기' }).click();
    await expect(mark(page)).toHaveCount(0);
    await expect(stamp(page)).toHaveAttribute('aria-disabled', 'false');
    await stamp(page).click();
    await expect(mark(page)).toBeVisible();
  });
});

test.describe('도장 확정 상세 움직임 줄이기 (1440px)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('누른 직후 도장이 끝 자리에 있고 인주 마스크가 끝 상태다', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/motion/stamp-button');
    await expect(stamp(page)).toBeVisible();
    // 누른 직후 첫 프레임에서 인라인 값을 읽는다(내려옴이 남아 있다면 translate와 scale(1.6)이 보인다).
    // 계산값은 움직임 줄이기의 전역 규칙이 남기는 0.01ms transition이 끝난 뒤에 읽는다
    const probe = await stamp(page).evaluate((btn) => {
      btn.click();
      return new Promise<{
        inline: string;
        matrix: number[];
        r: string | null;
      }>((resolve) =>
        requestAnimationFrame(async () => {
          const m = document.querySelector<HTMLElement>('[data-stamp-mark]');
          const inline = m?.style.transform ?? '';
          await Promise.all(document.getAnimations().map((a) => a.finished));
          const t = m ? getComputedStyle(m).transform : '';
          const matrix = (t.match(/matrix\(([^)]+)\)/)?.[1] ?? '')
            .split(',')
            .map(Number);
          const c = document.querySelector('[data-stamp-ink] mask circle');
          resolve({ inline, matrix, r: c?.getAttribute('r') ?? null });
        })
      );
    });
    expect(probe.inline).toBe('rotate(-8deg)');
    expect(probe.matrix.slice(0, 6).map((n) => +n.toFixed(2))).toEqual([
      0.99, -0.14, 0.14, 0.99, 0, 0,
    ]);
    expect(probe.r).toBe('60');
    await expect(stamp(page)).toHaveAttribute('aria-disabled', 'true');
  });
});
