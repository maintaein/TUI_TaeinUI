import { expect, test, type Page } from '@playwright/test';

const stage = (page: Page) =>
  page.getByRole('region', { name: 'BurstToggle 미리보기' });
const like = (page: Page) =>
  stage(page).getByRole('button', { name: '좋아요', exact: true });
const dots = (page: Page) => stage(page).locator('[data-burst-dot]');

// 앱이 그려지기 전의 입력은 버려진다. 단추가 보인 뒤에 시연을 멈춘다
const open = async (page: Page) => {
  await page.goto('/motion/burst-toggle');
  await expect(like(page)).toBeVisible();
  await stage(page).getByRole('button', { name: '시연 멈춤' }).click();
};

test.describe('좋아요 터짐 상세 (1440px)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('이름과 줄이기 글과 Props가 있다', async ({ page }) => {
    await page.goto('/motion/burst-toggle');
    await expect(
      page.getByRole('heading', { level: 1, name: 'BurstToggle' })
    ).toBeVisible();
    await expect(like(page)).toBeVisible();
    await expect(page.getByText('움직임 줄이기에서는').first()).toContainText(
      '아이콘만 바뀌고 점은 터지지 않습니다.'
    );
    await expect(page.getByText('selectedIcon').first()).toBeVisible();
  });

  test('눌러 켜면 aria-pressed가 참이고 점이 보였다가 사라진다', async ({
    page,
  }) => {
    await open(page);
    await expect(like(page)).toHaveAttribute('aria-pressed', 'false');
    await expect(dots(page)).toHaveCount(0);
    await like(page).click();
    await expect(like(page)).toHaveAttribute('aria-pressed', 'true');
    await expect(dots(page)).toHaveCount(8);
    await expect(dots(page).first()).toBeVisible();
    // 끝나면 점 노드가 DOM에서 사라진다
    await expect(dots(page)).toHaveCount(0, { timeout: 3000 });
    await expect(like(page)).toHaveAttribute('aria-pressed', 'true');
  });

  test('점은 단추 밖으로 나가도 잘리지 않는다', async ({ page }) => {
    await open(page);
    await expect(like(page)).toHaveCSS('overflow', 'visible');
    await like(page).click();
    const box = await like(page).boundingBox();
    if (!box) throw new Error('단추가 없다');
    // 점이 퍼지는 동안 아직 또렷한(불투명도 0.3 넘는) 점의 가운데가 단추 반지름보다 멀리 나간 때가 있다
    const radius = Math.min(box.width, box.height) / 2;
    await expect
      .poll(
        () =>
          dots(page).evaluateAll((els, b) => {
            const cx = b.x + b.width / 2;
            const cy = b.y + b.height / 2;
            return Math.max(
              0,
              ...els
                .filter((el) => Number(getComputedStyle(el).opacity) > 0.3)
                .map((el) => {
                  const r = el.getBoundingClientRect();
                  return Math.hypot(
                    r.x + r.width / 2 - cx,
                    r.y + r.height / 2 - cy
                  );
                })
            );
          }, box),
        { intervals: [16] }
      )
      .toBeGreaterThan(radius);
  });

  test('끄면 점 없이 조용히 꺼진다', async ({ page }) => {
    await open(page);
    await like(page).click();
    await expect(dots(page)).toHaveCount(0, { timeout: 3000 });
    await like(page).click();
    await expect(like(page)).toHaveAttribute('aria-pressed', 'false');
    await expect(dots(page)).toHaveCount(0);
  });

  test('켜는 중 다시 눌러 끄면 남은 점이 바로 사라진다', async ({ page }) => {
    await open(page);
    await like(page).click();
    await expect(dots(page)).toHaveCount(8);
    await like(page).click();
    await expect(like(page)).toHaveAttribute('aria-pressed', 'false');
    await expect(dots(page)).toHaveCount(0);
  });

  test('조작판에서 아이콘을 바꾸면 단추 이름이 바뀐다', async ({ page }) => {
    await open(page);
    await page
      .getByRole('radiogroup', { name: 'icon', exact: true })
      .getByRole('radio', { name: 'Star', exact: true })
      .locator('..')
      .click();
    await expect(
      stage(page).getByRole('button', { name: '즐겨찾기', exact: true })
    ).toBeVisible();
  });
});

test.describe('좋아요 터짐 축소 모션', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('아이콘만 바뀌고 점은 한 번도 보이지 않는다', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/motion/burst-toggle');
    await expect(like(page)).toBeVisible();
    await like(page).click();
    await expect(like(page)).toHaveAttribute('aria-pressed', 'true');
    for (let i = 0; i < 20; i++) {
      await expect(dots(page)).toHaveCount(0);
      await page.waitForTimeout(25);
    }
    // 아이콘 칸에 납작한 배율이 남지 않는다
    const flat = await like(page).evaluate((el) => {
      const slot = el.querySelector('[data-burst-slot]');
      return slot
        ? !new DOMMatrix(getComputedStyle(slot).transform).isIdentity
        : false;
    });
    expect(flat).toBe(false);
  });
});

test.describe('좋아요 터짐 검색 (1280px)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  for (const term of ['좋아요', '하트', '터짐', 'burst']) {
    test(`"${term}"로 찾아 이동한다`, async ({ page }) => {
      await page.goto('/');
      // 앱이 그려지기 전의 키는 단축키 effect가 붙기 전이라 사라진다. 검색 단추가 보이면 붙은 뒤다.
      await expect(page.getByRole('button', { name: /^검색/ })).toBeVisible();
      await page.keyboard.press('Control+k');
      const input = page.getByRole('combobox', { name: '검색' });
      await input.fill(term);
      const option = page.getByRole('option', { name: /좋아요 터짐/ });
      await expect(option).toBeVisible();
      await expect(page.getByRole('listbox')).toContainText('모션');
      await option.click();
      await expect(page).toHaveURL(/\/motion\/burst-toggle$/);
    });
  }
});
