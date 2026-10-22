import { test, expect, type Page } from '@playwright/test';

/**
 * 전체 컴포넌트 카드의 미니는 그 컴포넌트 상세 페이지의 무대 대본을 클릭 없이 돌리고, 만질 수는 없다.
 * 페이지 머리의 "움직임 멈춤" 단추가 스물다섯을 한꺼번에 세운다(WCAG 2.2.2).
 */
const stage = (page: Page, name: string) =>
  page.locator(`[data-stage-mini="${name} 시연"]`);

const bring = async (page: Page, name: string) => {
  const el = stage(page, name);
  await el.scrollIntoViewIfNeeded();
  // 화면에 절반 이상 보여야 돈다. 가운데로 가져온다
  await el.evaluate((e) => e.scrollIntoView({ block: 'center' }));
  return el;
};

// 한 칸의 값을 8초 동안 모아 서로 다른 값의 수를 센다
const distinct = (page: Page, name: string, read: string) =>
  page.evaluate(
    ([n, src]) =>
      new Promise<number>((resolve) => {
        const root = document.querySelector(`[data-stage-mini="${n} 시연"]`)!;
        const fn = new Function('root', src) as (r: Element) => string;
        const seen = new Set<string>();
        const id = setInterval(() => seen.add(fn(root)), 50);
        setTimeout(() => {
          clearInterval(id);
          resolve(seen.size);
        }, 8000);
      }),
    [name, read]
  );

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.mouse.move(2, 2);
  await page.goto('/components/overview');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    '컴포넌트 25개'
  );
});

test('클릭 없이 Switch가 켜졌다 꺼지고 Button이 로딩이 됐다 돌아온다', async ({
  page,
}) => {
  test.setTimeout(60_000);
  await bring(page, 'Switch');
  const sw = await distinct(
    page,
    'Switch',
    "return String(root.querySelector('input').checked)"
  );
  expect(sw).toBeGreaterThan(1);
  await bring(page, 'Button');
  const btn = await distinct(
    page,
    'Button',
    "return String(root.querySelector('button').getAttribute('aria-busy'))"
  );
  expect(btn).toBeGreaterThan(1);
});

test('미니 안 요소는 포커스도 클릭도 받지 못하고 카드 이름 링크는 눌린다', async ({
  page,
}) => {
  const el = await bring(page, 'Button');
  const button = el.locator('button').first();
  await button.focus({ timeout: 1000 }).catch(() => undefined);
  expect(await page.evaluate(() => document.activeElement?.tagName)).toBe(
    'BODY'
  );
  // inert라 그 자리를 누르면 버튼이 아니라 뒤의 것이 맞는다
  const hit = await button.evaluate((b) => {
    const r = b.getBoundingClientRect();
    const at = document.elementFromPoint(r.left + r.width / 2, r.top + 4);
    return b.contains(at);
  });
  expect(hit).toBe(false);
  expect(await button.evaluate((b) => !!b.closest('[inert]'))).toBe(true);
  await page.getByRole('link', { name: 'Button', exact: true }).click();
  await expect(page).toHaveURL(/\/components\/button$/);
});

test('"움직임 멈춤"이 전부 멈추고 다시 시작하면 움직인다', async ({ page }) => {
  test.setTimeout(60_000);
  await bring(page, 'Switch');
  const pause = page.getByRole('button', { name: '움직임 멈춤' });
  await expect(pause).toHaveAttribute('aria-pressed', 'false');
  await pause.click();
  await expect(pause).toHaveAttribute('aria-pressed', 'true');
  // 멈춘 뒤 연출 커서 위치가 변하지 않는다(보이는 카드 전부)
  await page.waitForTimeout(800);
  const cursors = () =>
    page.evaluate(() =>
      [...document.querySelectorAll('[data-stage-mini]')]
        .map((r) =>
          String(
            (r.querySelector(':scope > svg') as SVGElement | null)?.style
              .transform
          )
        )
        .join('|')
    );
  const a = await cursors();
  await page.waitForTimeout(1500);
  expect(await cursors()).toBe(a);
  await pause.click();
  await expect(pause).toHaveAttribute('aria-pressed', 'false');
  await page.waitForTimeout(2500);
  expect(await cursors()).not.toBe(a);
});

for (const name of ['Modal', 'BottomSheet', 'SideSheet', 'Popover']) {
  test(`${name} 미니가 열리고 닫히는 동안 페이지 포커스와 스크롤은 그대로다`, async ({
    page,
  }) => {
    test.setTimeout(60_000);
    // 포커스를 받을 단추를 먼저 두고(포커스가 페이지를 위로 스크롤한다) 카드를 가운데로 가져온다
    await page.evaluate(() => {
      const b = document.createElement('button');
      b.id = 'probe';
      document.querySelector('main')!.prepend(b);
      b.focus();
    });
    const el = await bring(page, name);
    const y = await page.evaluate(() => window.scrollY);
    const seen = await page.evaluate(
      (n) =>
        new Promise<{ opened: boolean; moved: string[]; overflow: string[] }>(
          (resolve) => {
            const root = document.querySelector(
              `[data-stage-mini="${n} 시연"]`
            )!;
            const moved: string[] = [];
            const overflow: string[] = [];
            let opened = false;
            const id = setInterval(() => {
              const a = document.activeElement;
              if (a?.id !== 'probe') moved.push(a?.tagName ?? 'none');
              overflow.push(document.body.style.overflow);
              if (
                root.querySelector(
                  '[role="dialog"], [role="tooltip"], [data-stage-target="trigger"] ~ *'
                )
              )
                opened = true;
            }, 40);
            setTimeout(() => {
              clearInterval(id);
              resolve({ opened, moved, overflow });
            }, 9000);
          }
        ),
      name
    );
    expect(seen.opened).toBe(true);
    expect(seen.moved).toEqual([]);
    expect(seen.overflow.every((o) => o === '')).toBe(true);
    expect(await page.evaluate(() => window.scrollY)).toBe(y);
    await expect(el).toBeVisible();
  });
}
