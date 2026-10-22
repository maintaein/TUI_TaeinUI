import { test, expect, type Page } from '@playwright/test';

/**
 * 오버레이(포털로 그려지는 Modal, BottomSheet, SideSheet)를 무대가 자동 시연으로 여는 동안 지킬 것.
 * core 오버레이는 열리면 포커스를 다이얼로그로 옮기고 Tab을 가둔다. 시연이 그렇게 하면 페이지를 Tab으로 읽던
 * 사용자의 포커스를 빼앗는다. 그래서 무대는 시연 중 오버레이 상자를 inert로 두고 (container) 무대 안에 가둔다.
 * 사각형은 무대 안, body 스크롤은 잠기지 않고, 일시정지 단추는 늘 눌린다.
 */
const PAGES = [
  { name: 'Modal', url: '/components/modal' },
  { name: 'BottomSheet', url: '/components/bottom-sheet' },
];

const DIALOG = '[role="dialog"]:not([inert])';
const STAGE = '[role="region"]';

// 페이지 첫머리에 포커스를 받을 단추를 하나 둔다(상세 페이지에는 무대 앞에 포커스 대상이 없다)
const addProbe = (page: Page) =>
  page.evaluate(() => {
    const b = document.createElement('button');
    b.id = 'probe';
    b.textContent = 'probe';
    document.querySelector('main')!.prepend(b);
    b.focus();
  });

// 매 프레임 포커스된 요소, 다이얼로그 사각형, body overflow를 쌓는다
const sample = (page: Page) =>
  page.evaluate(() => {
    const w = window as unknown as { __s: unknown[]; __f: string[] };
    w.__s = [];
    // 포커스가 옮겨 간 곳을 전부 적는다(한두 프레임만 머물렀다 돌아오는 것도 놓치지 않는다)
    w.__f = [];
    document.addEventListener('focusin', (e) =>
      w.__f.push((e.target as Element).id || (e.target as Element).tagName)
    );
    const tick = () => {
      const any = document.querySelector('[role="dialog"]');
      const d = document.querySelector('[role="dialog"]:not([inert])');
      const r = d?.getBoundingClientRect();
      w.__s.push({
        t: performance.now(),
        any: !!any,
        id: document.activeElement?.id ?? document.activeElement?.tagName,
        dlg: r ? { l: r.left, t: r.top, r: r.right, b: r.bottom } : null,
        overflow: document.body.style.overflow,
      });
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

interface Frame {
  t: number;
  any: boolean;
  id: string;
  dlg: { l: number; t: number; r: number; b: number } | null;
  overflow: string;
}
const frames = (page: Page) =>
  page.evaluate(() => (window as unknown as { __s: Frame[] }).__s);

for (const { name, url } of PAGES) {
  test.describe(name, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.mouse.move(2, 2);
      await page.goto(url);
      await expect(page.locator(STAGE).first()).toBeVisible();
      await addProbe(page);
    });

    test('자동 시연이 다이얼로그를 여는 동안 포커스는 그대로, 사각형은 무대 안, body는 안 잠긴다', async ({
      page,
    }) => {
      await sample(page);
      // 열렸다가 다시 닫힐 때까지 한 바퀴를 본다(포커스를 빼앗기면 넘겨받기로 보고 곧 닫히므로 inert 여부와 무관하게 다이얼로그가 보이는 프레임을 센다)
      await page.waitForFunction(
        () => (window as unknown as { __s: Frame[] }).__s.some((f) => f.any),
        undefined,
        { timeout: 20_000 }
      );
      await page.waitForSelector('[role="dialog"]', {
        state: 'detached',
        timeout: 20_000,
      });
      const fs = await frames(page);
      const open = fs.filter((f) => f.dlg);
      // (a) 포커스
      expect(
        await page.evaluate(() => (window as unknown as { __f: string[] }).__f)
      ).toEqual([]);
      expect(new Set(fs.map((f) => f.id))).toEqual(new Set(['probe']));
      expect(open.length).toBeGreaterThan(20);
      // (c) body 스크롤
      expect(fs.every((f) => f.overflow === '')).toBe(true);
      // (b) 다이얼로그가 무대 사각형 안
      const stage = (await page.locator(STAGE).first().boundingBox())!;
      const pause = (await page
        .getByRole('button', { name: '시연 멈춤' })
        .boundingBox())!;
      // 쉬는 구간: 열리고 0.8초 뒤부터 2초까지(등장이 끝났고 BottomSheet 시연이 끌기 시작하기 전)
      const rest = open.filter(
        (f) => f.t >= open[0].t + 800 && f.t <= open[0].t + 2000
      );
      expect(rest.length).toBeGreaterThan(10);
      for (const f of rest) {
        // 일시정지 단추와 겹치지 않는다
        const apart =
          f.dlg!.r <= pause.x ||
          f.dlg!.l >= pause.x + pause.width ||
          f.dlg!.b <= pause.y ||
          f.dlg!.t >= pause.y + pause.height;
        expect(apart).toBe(true);
        expect(f.dlg!.l).toBeGreaterThanOrEqual(stage.x - 1);
        expect(f.dlg!.t).toBeGreaterThanOrEqual(stage.y - 1);
        expect(f.dlg!.r).toBeLessThanOrEqual(stage.x + stage.width + 1);
        expect(f.dlg!.b).toBeLessThanOrEqual(stage.y + stage.height + 1);
      }
    });

    test('다이얼로그가 열려 있을 때도 페이지에서 Tab으로 무대를 지나 다음으로 간다', async ({
      page,
    }) => {
      await page.waitForSelector(DIALOG, { timeout: 20_000 });
      const seen: string[] = [];
      let outside = false;
      for (let i = 0; i < 12 && !outside; i++) {
        await page.keyboard.press('Tab');
        const where = await page.evaluate((stage) => {
          const a = document.activeElement;
          const s = document.querySelector(stage);
          return {
            inStage: !!a && !!s?.contains(a),
            inDialog: !!a?.closest('[role="dialog"]'),
            id: a?.id || a?.tagName || '',
          };
        }, STAGE);
        seen.push(where.id);
        expect(where.inDialog).toBe(false);
        outside = !where.inStage && where.id !== 'probe' && where.id !== 'BODY';
      }
      expect(outside, `Tab 경로: ${seen.join(' > ')}`).toBe(true);
    });

    test('일시정지 단추는 다이얼로그가 열려 있어도 눌리고, 누르면 오버레이가 닫힌다', async ({
      page,
    }) => {
      await page.waitForSelector(DIALOG, { timeout: 20_000 });
      // 가려져 있으면 Playwright가 누르기 전에 기다리다 시간 초과로 빨개진다
      await page
        .getByRole('button', { name: '시연 멈춤' })
        .click({ timeout: 3000 });
      await expect(
        page.getByRole('button', { name: '시연 다시 시작' })
      ).toBeVisible();
      await page.waitForSelector(DIALOG, { state: 'detached' });
    });

    test('진짜 마우스가 넘겨받은 뒤 직접 연 다이얼로그는 포커스를 가두고 Esc로 닫혀 트리거로 돌아온다', async ({
      page,
    }) => {
      const stage = page.locator(STAGE).first();
      const trigger = stage.locator('[data-stage-target="trigger"]');
      // 마우스가 화면 안에 있어야 넘겨받는다(무대가 화면 아래로 걸쳐 있으면 밖으로 나간 좌표는 이벤트가 없다)
      await stage.scrollIntoViewIfNeeded();
      const box = (await stage.boundingBox())!;
      await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.8);
      // 넘겨받으면 연출 커서가 사라진다. 그 뒤에 열어야 상자가 inert가 아니라 포커스가 실제로 들어간다
      await expect(
        stage.locator(':scope > svg[aria-hidden="true"]')
      ).toBeHidden();
      const scrollBefore = await page.evaluate(() => window.scrollY);
      await trigger.click();
      const dialog = page.locator(DIALOG);
      await expect(dialog).toBeVisible();
      await expect
        .poll(() =>
          page.evaluate(
            () => !!document.activeElement?.closest('[role="dialog"]')
          )
        )
        .toBe(true);
      // 포커스가 들어와도 페이지는 스크롤되지 않는다(시트가 무대 밖에서 들어오는 중이어도)
      expect(await page.evaluate(() => window.scrollY)).toBe(scrollBefore);
      // 가둔다: Tab을 여러 번 눌러도 다이얼로그 안
      for (let i = 0; i < 6; i++) {
        await page.keyboard.press('Tab');
        expect(
          await page.evaluate(
            () => !!document.activeElement?.closest('[role="dialog"]')
          )
        ).toBe(true);
      }
      expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
      // 사용자가 연 오버레이(상자가 inert가 아니다)도 일시정지 단추를 덮지 않는다
      await page
        .getByRole('button', { name: '시연 멈춤' })
        .click({ trial: true, timeout: 3000 });
      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
      await expect(trigger).toBeFocused();
    });
  });
}
