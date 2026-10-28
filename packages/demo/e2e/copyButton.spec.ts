import { expect, test, type Page } from '@playwright/test';

const SETUP = 'pnpm add @taein-ui/core';

const stage = (page: Page) =>
  page.getByRole('region', { name: 'CopyButton 미리보기' });
const copyButton = (page: Page) =>
  stage(page).getByRole('button', { name: '복사', exact: true });
// 결과를 읽는 보이지 않는 live 영역
const live = (page: Page) => stage(page).getByRole('status');
// 지금 보이는 글자(core가 data-shown으로 표시한다)
const shownText = (page: Page) =>
  stage(page).locator('[data-text][data-shown]');

// 지금 보이는(data-shown) 글자와 아이콘 칸이 단위 행렬이 아니면 제자리로 오는 중이다
const moving = (page: Page) =>
  copyButton(page).evaluate((el) =>
    [...el.querySelectorAll('[data-shown]')].some(
      (n) => !new DOMMatrix(getComputedStyle(n).transform).isIdentity
    )
  );

// 보이지 않는 쉬는 글자와 아이콘까지 단추 안 모든 요소가 단위 행렬이다(축소 모션)
const anyMoving = (page: Page) =>
  copyButton(page).evaluate((el) =>
    [...el.querySelectorAll('*')].some(
      (n) => !new DOMMatrix(getComputedStyle(n).transform).isIdentity
    )
  );

test.describe('복사됨 상세 (1440px)', () => {
  test.use({
    viewport: { width: 1440, height: 900 },
    permissions: ['clipboard-read', 'clipboard-write'],
  });

  test('이름과 줄이기 글과 Props가 있다', async ({ page }) => {
    await page.goto('/motion/copy-button');
    await expect(
      page.getByRole('heading', { level: 1, name: 'CopyButton' })
    ).toBeVisible();
    await expect(copyButton(page)).toBeVisible();
    await expect(page.getByText('움직임 줄이기에서는')).toContainText(
      '아이콘과 글자가 움직임 없이 바뀝니다.'
    );
    await expect(page.getByText('copiedLabel').first()).toBeVisible();
  });

  test('누르면 클립보드에 값이 들어가고 복사됨이 보였다가 되돌아온다', async ({
    page,
  }) => {
    await page.goto('/motion/copy-button');
    await stage(page).getByRole('button', { name: '시연 멈춤' }).click();
    await copyButton(page).click();
    await expect(live(page)).toHaveText('복사됨');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      SETUP
    );
    await expect(shownText(page)).toHaveText('복사됨');
    // 접근 가능한 이름은 그대로다
    await expect(copyButton(page)).toBeVisible();
    // 되돌아온 뒤: 영역이 비고 보이는 글자가 복사다
    await expect(live(page)).toHaveText('', { timeout: 3000 });
    await expect(shownText(page)).toHaveText('복사');
  });

  test('조작판에서 값을 바꾸면 그 값이 복사된다', async ({ page }) => {
    await page.goto('/motion/copy-button');
    await stage(page).getByRole('button', { name: '시연 멈춤' }).click();
    await page.getByRole('textbox', { name: 'value' }).fill('https://x.dev');
    await copyButton(page).click();
    await expect(live(page)).toHaveText('복사됨');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      'https://x.dev'
    );
  });

  test('움직임이 있으면 누른 직후 글자와 아이콘이 이동·회전하는 중이다', async ({
    page,
  }) => {
    await page.goto('/motion/copy-button');
    await stage(page).getByRole('button', { name: '시연 멈춤' }).click();
    await copyButton(page).click();
    await expect.poll(() => moving(page), { intervals: [16] }).toBe(true);
    await expect.poll(() => moving(page), { intervals: [100] }).toBe(false);
  });

  test('시연(대본)의 합성 클릭은 방문자의 클립보드를 덮어쓰지 않고 복사됨을 보인다', async ({
    page,
  }) => {
    await page.goto('/motion/copy-button');
    await copyButton(page).waitFor();
    await page.evaluate(() => navigator.clipboard.writeText('내 클립보드'));
    await expect(live(page)).toHaveText('복사됨', { timeout: 15_000 });
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      '내 클립보드'
    );
  });
});

test.describe('시연이 navigator.clipboard를 되돌린다 (1440px)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('원래 own 속성이 있던 환경에서는 시연 뒤에도 그 속성이 그대로다', async ({
    page,
  }) => {
    const mark = { name: 'polyfill' };
    await page.addInitScript((m) => {
      Object.defineProperty(navigator, 'clipboard', {
        value: m,
        configurable: true,
        writable: true,
      });
    }, mark);
    await page.goto('/motion/copy-button');
    // 대본의 합성 클릭이 지나가며 시연 클립보드가 쓰였다(복사됨)
    await expect(live(page)).toHaveText('복사됨', { timeout: 15_000 });
    const kept = await page.evaluate(
      () =>
        (
          Object.getOwnPropertyDescriptor(navigator, 'clipboard')?.value as
            | { name?: string }
            | undefined
        )?.name
    );
    expect(kept).toBe('polyfill');
  });
});

test.describe('복사 실패 (1440px)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test.beforeEach(async ({ page }) => {
    // 보안 연결이 아닌 곳처럼 클립보드가 없는 상태
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        configurable: true,
      });
    });
  });

  test('클립보드가 없으면 복사 실패가 되고 아이콘이 흔들렸다가 되돌아온다', async ({
    page,
  }) => {
    await page.goto('/motion/copy-button');
    await stage(page).getByRole('button', { name: '시연 멈춤' }).click();
    await copyButton(page).click();
    await expect(live(page)).toHaveText('복사 실패');
    await expect(shownText(page)).toHaveText('복사 실패');
    const shaking = () =>
      copyButton(page).evaluate((el) =>
        el
          .getAnimations({ subtree: true })
          .some((a) => a instanceof CSSAnimation)
      );
    expect(await shaking()).toBe(true);
    await expect(live(page)).toHaveText('', { timeout: 3000 });
    await expect(shownText(page)).toHaveText('복사');
  });
});

test.describe('복사됨 축소 모션', () => {
  test.use({
    viewport: { width: 1440, height: 900 },
    permissions: ['clipboard-read', 'clipboard-write'],
  });

  test('이동·회전 없이 글자와 아이콘만 바뀐다', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/motion/copy-button');
    await copyButton(page).click();
    await expect(shownText(page)).toHaveText('복사됨');
    // 바뀌는 내내 한 번도 움직이지 않는다. 빠지는 글자와 아이콘도 제자리에서 페이드만 한다
    for (let i = 0; i < 10; i++) {
      expect(await anyMoving(page)).toBe(false);
      await page.waitForTimeout(20);
    }
  });

  test('실패해도 흔들리지 않는다', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        configurable: true,
      });
    });
    await page.goto('/motion/copy-button');
    await copyButton(page).click();
    await expect(shownText(page)).toHaveText('복사 실패');
    const shaking = await copyButton(page).evaluate((el) =>
      el.getAnimations({ subtree: true }).some((a) => a instanceof CSSAnimation)
    );
    expect(shaking).toBe(false);
  });
});

test.describe('복사됨 검색 (1280px)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  for (const term of ['복사', '클립보드', 'copy', 'CopyButton']) {
    test(`"${term}"로 찾아 이동한다`, async ({ page }) => {
      await page.goto('/');
      // 앱이 그려지기 전의 키는 단축키 effect가 붙기 전이라 사라진다. 검색 단추가 보이면 붙은 뒤다.
      await expect(page.getByRole('button', { name: /^검색/ })).toBeVisible();
      await page.keyboard.press('Control+k');
      const input = page.getByRole('combobox', { name: '검색' });
      await input.fill(term);
      const option = page.getByRole('option', { name: /복사됨/ });
      await expect(option).toBeVisible();
      await expect(page.getByRole('listbox')).toContainText('모션');
      await option.click();
      await expect(page).toHaveURL(/\/motion\/copy-button$/);
    });
  }
});
