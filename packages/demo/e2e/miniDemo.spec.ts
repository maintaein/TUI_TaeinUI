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

test('벽 미니는 연출 커서를 그리지 않고 상세 무대는 그린다', async ({
  page,
}) => {
  const cursors = await page.evaluate(() =>
    [...document.querySelectorAll('[data-stage-mini] [data-stage-cursor]')].map(
      (c) => getComputedStyle(c).display
    )
  );
  // 대본이 있는 스물셋(Divider와 List는 대본 없는 정지)
  expect(cursors).toHaveLength(23);
  expect(cursors.every((d) => d === 'none')).toBe(true);
  await page.goto('/components/modal');
  await expect(page.locator('[data-stage-cursor]').first()).toBeVisible();
});

// 열린 대표 장면: 정지한 오버레이 카드는 트리거 단추만이 아니라 열린 것이 카드 상자 안에 선다
const OPEN_SCENE: Record<string, string> = {
  Modal: '[role="dialog"]',
  BottomSheet: '[role="dialog"]',
  SideSheet: '[role="dialog"]',
  Popover: '[role="dialog"]',
  Snackbar: '[data-stage-target="snack"]',
  Tooltip: '[role="tooltip"]',
};

const expectOpenScene = async (page: Page, name: string) => {
  const el = await bring(page, name);
  const open = el.locator(OPEN_SCENE[name]);
  await expect(open).toBeVisible();
  // 시트가 들어오는 전이가 끝나 카드 상자 안에 자리 잡을 때까지 본다
  await expect
    .poll(async () => {
      const a = (await open.boundingBox())!;
      const b = (await el.boundingBox())!;
      return (
        a.x >= b.x - 1 &&
        a.y >= b.y - 1 &&
        a.x + a.width <= b.x + b.width + 1 &&
        a.y + a.height <= b.y + b.height + 1
      );
    })
    .toBe(true);
  // 포커스는 누른 "움직임 멈춤" 단추에 그대로 있고 미니로 들어가지 않는다
  expect(
    await page.evaluate(
      () => !!document.activeElement?.closest('[data-stage-mini]')
    )
  ).toBe(false);
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
  expect(await open.evaluate((o) => !!o.closest('[inert]'))).toBe(true);
};

for (const name of Object.keys(OPEN_SCENE)) {
  test(`"움직임 멈춤" 뒤 ${name} 카드는 열린 장면이 카드 상자 안에 선다`, async ({
    page,
  }) => {
    await page.getByRole('button', { name: '움직임 멈춤' }).click();
    await expectOpenScene(page, name);
  });
}

test('축소 모션이면 Modal 카드가 처음부터 열린 장면이다', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  await expectOpenScene(page, 'Modal');
});

test('위쪽 단추를 누른 채 내려가 오버레이 미니가 열리고 닫혀도 맨 위로 튀지 않는다', async ({
  page,
}) => {
  test.setTimeout(60_000);
  // 눌러서 포커스를 둔 위쪽 요소(스크롤로 사라지는 것). 멈췄다 다시 시작해 시연은 돈다
  const pause = page.getByRole('button', { name: '움직임 멈춤' });
  await pause.click();
  await pause.click();
  await bring(page, 'Modal');
  // 미니 안은 inert라 포커스가 들어가지 못한다. 시연이 한 번 닫혔다 다시 열린 뒤에 다른 곳을 눌러 포커스를 옮긴다
  const dialog = stage(page, 'Modal').locator('[role="dialog"]');
  await expect(dialog).toHaveCount(0, { timeout: 15_000 });
  await expect(dialog).toHaveCount(1, { timeout: 15_000 });
  await page.mouse.click(5, 450);
  expect(await page.evaluate(() => document.activeElement?.tagName)).toBe(
    'BODY'
  );
  const y0 = await page.evaluate(() => scrollY);
  expect(y0).toBeGreaterThan(1000);
  // 다시 닫히고 열리는 동안 스크롤이 크게 바뀌지 않는다
  const drift = await page.evaluate(
    (start) =>
      new Promise<number>((resolve) => {
        let max = 0;
        const id = setInterval(
          () => (max = Math.max(max, Math.abs(scrollY - start))),
          16
        );
        setTimeout(() => {
          clearInterval(id);
          resolve(max);
        }, 9000);
      }),
    y0
  );
  expect(drift).toBeLessThan(100);
});

test('카드 이름 줄 높이가 스물다섯 모두 같고 시연 중에도 카드 높이가 변하지 않는다', async ({
  page,
}) => {
  test.setTimeout(60_000);
  const foots = await page.evaluate(() =>
    [...document.querySelectorAll('[data-stage-mini]')].map(
      (st) => st.parentElement!.parentElement!.lastElementChild!.clientHeight
    )
  );
  expect(foots).toHaveLength(25);
  expect(new Set(foots).size).toBe(1);

  // 펼침이 있는 BoardRow와 키 큰 Border가 시연 중 칸을 키우지 않는다(둘이 한 화면에 든다)
  await bring(page, 'BoardRow');
  const heights = await page.evaluate(
    () =>
      new Promise<Record<string, number[]>>((resolve) => {
        const names = ['BoardRow', 'Border'];
        const seen: Record<string, Set<number>> = {
          BoardRow: new Set(),
          Border: new Set(),
        };
        const id = setInterval(() => {
          for (const n of names) {
            const f = document.querySelector(`[data-stage-mini="${n} 시연"]`)!
              .parentElement!.parentElement!;
            seen[n].add(f.getBoundingClientRect().height);
          }
        }, 50);
        setTimeout(() => {
          clearInterval(id);
          resolve({
            BoardRow: [...seen.BoardRow],
            Border: [...seen.Border],
          });
        }, 12000);
      })
  );
  expect(heights.BoardRow).toHaveLength(1);
  expect(heights.Border).toHaveLength(1);
});
