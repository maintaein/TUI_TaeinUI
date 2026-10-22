import { test, expect, type Page } from '@playwright/test';

/**
 * HeaderBar 상세의 무대: 클릭 0회로 항목 호버(알약이 차오름)와 활성 이동, 드롭다운 열림, cards 펼침이 일어나고
 * 375px에서는 항목이 햄버거로 접혀 햄버거가 열리고 닫힌다. 진짜 마우스가 넘겨받으면 대본이 채워 둔 알약이 남지 않는다.
 * 알약의 채움 지표는 장식 원(aria-hidden span)의 계산된 scale이다(채워지면 1.2, 비면 0).
 */

const open = async (page: Page, width: number, height: number) => {
  await page.setViewportSize({ width, height });
  await page.mouse.move(2, 2);
  await page.goto('/components/header-bar');
  const stage = page.getByRole('region', { name: 'HeaderBar 시연' });
  await stage.scrollIntoViewIfNeeded();
  // 진짜 클릭이 하나라도 있으면 시연이 한 일이 아니다
  await page.evaluate(() => {
    (window as unknown as { __clicks: number }).__clicks = 0;
    document.addEventListener(
      'click',
      (e) => {
        if (e.isTrusted) (window as unknown as { __clicks: number }).__clicks++;
      },
      true
    );
  });
  return stage;
};

// 조작판을 누르는 것은 진짜 클릭이라 세는 값을 비우고 시작한다
const pick = async (page: Page, style: string) => {
  await page
    .locator('[role="group"] button, [role="radiogroup"] label')
    .filter({ hasText: new RegExp(`^${style}$`) })
    .first()
    .click();
  await page.evaluate(() => {
    (window as unknown as { __clicks: number }).__clicks = 0;
  });
};

const circles = (page: Page) =>
  page.evaluate(() =>
    Array.from(
      document.querySelectorAll(
        '[role="region"][aria-label="HeaderBar 시연"] nav[aria-label="주요 메뉴"] > *'
      )
    ).map((el) => ({
      active: el.getAttribute('aria-current') === 'page',
      scale: new DOMMatrix(
        getComputedStyle(el.querySelector('span[aria-hidden="true"]')!)
          .transform
      ).a,
    }))
  );

test('알약 시연이 항목에 올라가 차오르게 하고 누르면 활성이 옮겨 간다(클릭 0회)', async ({
  page,
}) => {
  const stage = await open(page, 1280, 800);
  const items = stage.locator('nav [data-stage-target^="item:"]');
  await expect(items).toHaveCount(3);
  await expect(items.first()).toHaveAttribute('aria-current', 'page');

  // 활성이 아닌 알약이 호버로 1.2까지 찬다
  await expect
    .poll(
      async () =>
        (await circles(page)).some((c) => !c.active && c.scale > 1.19),
      { timeout: 20_000 }
    )
    .toBe(true);
  // 눌려서 활성이 카테고리로 옮겨 간다
  await expect(items.nth(1)).toHaveAttribute('aria-current', 'page', {
    timeout: 20_000,
  });
  await expect(items.first()).not.toHaveAttribute('aria-current', 'page');
  expect(
    await page.evaluate(
      () => (window as unknown as { __clicks: number }).__clicks
    )
  ).toBe(0);
});

test('진짜 마우스가 넘겨받으면 대본이 채운 알약이 남지 않는다', async ({
  page,
}) => {
  const stage = await open(page, 1280, 800);
  await expect
    .poll(
      async () =>
        (await circles(page)).some((c) => !c.active && c.scale > 1.19),
      { timeout: 20_000 }
    )
    .toBe(true);
  // 항목과 먼 곳으로 진짜 마우스가 들어온다
  const box = (await stage.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height - 40, {
    steps: 4,
  });
  await expect
    .poll(async () =>
      (await circles(page)).every((c) => c.active || c.scale === 0)
    )
    .toBe(true);
});

test('dropdown 시연이 하위 링크 판을 열고 닫는다', async ({ page }) => {
  const stage = await open(page, 1280, 800);
  await pick(page, 'dropdown');
  const trigger = stage.locator('nav button[aria-expanded]').first();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true', {
    timeout: 20_000,
  });
  await expect(trigger).toHaveAttribute('aria-expanded', 'false', {
    timeout: 20_000,
  });
});

test('cards 시연이 햄버거를 눌러 카드를 펼치고 접는다', async ({ page }) => {
  const stage = await open(page, 1280, 800);
  await pick(page, 'cards');
  const burger = stage.locator('[data-stage-target="menu"]');
  await expect(burger).toHaveAttribute('aria-expanded', 'true', {
    timeout: 20_000,
  });
  await expect(burger).toHaveAttribute('aria-expanded', 'false', {
    timeout: 20_000,
  });
  expect(
    await page.evaluate(
      () => (window as unknown as { __clicks: number }).__clicks
    )
  ).toBe(0);
});

test('375px에서는 항목이 접히고 시연이 햄버거를 열고 닫는다', async ({
  page,
}) => {
  const stage = await open(page, 375, 812);
  const burger = stage.locator('[data-stage-target="menu"]');
  await expect(burger).toBeVisible();
  await expect(stage.locator('nav[aria-label="주요 메뉴"]')).toBeHidden();
  await expect(burger).toHaveAttribute('aria-expanded', 'true', {
    timeout: 20_000,
  });
  await expect(burger).toHaveAttribute('aria-expanded', 'false', {
    timeout: 20_000,
  });
});
