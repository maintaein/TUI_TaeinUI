import { test, expect, type Page } from '@playwright/test';

/**
 * BoardRow 상세의 무대: 클릭 0회로 커서가 제목을 눌러 행이 펼쳐지고 다시 눌러 접힌다.
 * 펼침은 목표 높이를 지나쳤다 내려앉고(core의 8px 넘침) 아래 이웃 행을 같이 민다.
 * 누를 때마다 뒤집히는 상태라, 진짜 입력이 상태를 바꿔 놓고 시연이 이어져도 펼침과 닫힘 순서가 어긋나지 않는다(act.call로 맞춘다).
 */

type Rec = { t: number; exp: string; h: number; next: number };
type Win = Window & { __rec: Rec[]; __clicks: number };

const record = async (page: Page) => {
  await page.evaluate(() => {
    const w = window as unknown as Win;
    w.__rec = [];
    w.__clicks = 0;
    document.addEventListener(
      'click',
      (e) => {
        if (e.isTrusted) w.__clicks++;
      },
      true
    );
    const btn = document.querySelector(
      '[data-stage-target="header"]'
    ) as HTMLElement;
    const wrap = document.getElementById(
      btn.getAttribute('aria-controls')!
    )!.parentElement!;
    const root = btn.closest('[role="region"]')!;
    const next = root.querySelectorAll('button[aria-expanded]')[1];
    const tick = () => {
      w.__rec.push({
        t: performance.now(),
        exp: btn.getAttribute('aria-expanded')!,
        h: wrap.getBoundingClientRect().height,
        next:
          next.getBoundingClientRect().top - root.getBoundingClientRect().top,
      });
      requestAnimationFrame(tick);
    };
    tick();
  });
};

for (const [width, height] of [
  [1280, 800],
  [375, 812],
] as const) {
  test(`${width}px: 시연이 제목을 눌러 펼쳤다 접고 펼침은 넘쳤다 앉으며 아래 행을 민다(클릭 0회)`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await page.mouse.move(2, 2);
    await page.goto('/components/board-row');
    const header = page.locator('[data-stage-target="header"]');
    await header.scrollIntoViewIfNeeded();
    await record(page);

    await expect(header).toHaveAttribute('aria-expanded', 'true', {
      timeout: 20_000,
    });
    await expect(header).toHaveAttribute('aria-expanded', 'false', {
      timeout: 20_000,
    });
    // 접힘 애니메이션이 끝나기를 기다린다
    await page.waitForTimeout(800);
    const { rec, clicks } = await page.evaluate(() => ({
      rec: (window as unknown as Win).__rec,
      clicks: (window as unknown as Win).__clicks,
    }));
    expect(clicks).toBe(0);
    const open = rec.filter((r) => r.exp === 'true');
    const settled = open[open.length - 1];
    // 목표 높이를 지나쳤다가 내려앉는다
    expect(Math.max(...open.map((r) => r.h))).toBeGreaterThan(settled.h + 3);
    // 아래 행이 같이 밀리고 접히면 돌아온다
    const closedTop = rec[0].next;
    expect(settled.next).toBeGreaterThan(closedTop + 40);
    expect(Math.abs(rec[rec.length - 1].next - closedTop)).toBeLessThan(2);
  });
}

test('진짜 입력이 상태를 뒤집어 놓고 시연이 이어져도 순서가 어긋나지 않는다', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.mouse.move(2, 2);
  await page.goto('/components/board-row');
  const stage = page.getByRole('region', { name: 'BoardRow 시연' });
  const header = page.locator('[data-stage-target="header"]');
  await stage.scrollIntoViewIfNeeded();
  await record(page);
  // 시연이 펼친 뒤 머무는 중에 진짜 마우스가 넘겨받아 직접 접는다
  await expect(header).toHaveAttribute('aria-expanded', 'true', {
    timeout: 20_000,
  });
  const box = (await stage.boundingBox())!;
  await page.mouse.move(box.x + 40, box.y + box.height - 40, { steps: 3 });
  const hb = (await header.boundingBox())!;
  await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2, {
    steps: 4,
  });
  await page.mouse.down();
  await page.mouse.up();
  await expect(header).toHaveAttribute('aria-expanded', 'false');
  // 시연이 이어진다
  await page.mouse.move(2, 2, { steps: 4 });
  const left = await page.evaluate(() => performance.now());
  await page.waitForTimeout(9000);
  const rec = await page.evaluate(() => (window as unknown as Win).__rec);
  const after = rec.filter((r) => r.t > left);
  // 이어진 뒤 처음 펼침은 맞춰 둔 상태가 닫는 누름에 곧바로 접히는 짧은 깜빡임이어야 한다.
  // 순서가 어긋났다면 닫는 누름이 펼쳐서 다음 바퀴의 펼침 누름까지 4초 넘게 열려 있다
  const start = after.findIndex((r) => r.exp === 'true');
  expect(start).toBeGreaterThan(-1);
  const end = after.findIndex((r, i) => i > start && r.exp === 'false');
  expect(end).toBeGreaterThan(start);
  expect(after[end].t - after[start].t).toBeLessThan(1500);
});
