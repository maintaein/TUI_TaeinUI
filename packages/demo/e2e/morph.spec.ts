import { expect, test, type Page } from '@playwright/test';

const stage = (page: Page) =>
  page.getByRole('region', { name: 'Morph 미리보기' });
const card = (page: Page, n: number) =>
  stage(page).getByRole('button', { name: `카드 ${n}`, exact: true });
const close = (page: Page) =>
  stage(page).getByRole('button', { name: '닫기', exact: true });

// 앱이 그려지기 전의 입력은 버려진다. 카드가 보인 뒤에 시연을 멈춘다
const open = async (page: Page) => {
  await page.goto('/motion/morph');
  await expect(card(page, 2)).toBeVisible();
  await stage(page).getByRole('button', { name: '시연 멈춤' }).click();
  // 시연을 멈추며 마우스가 일시정지 단추 위에 있으니 치운다
  await page.mouse.move(2, 2);
};

// 카드를 눌러 연 첫 프레임부터 끝까지를 한 evaluate 안에서 잰다. Playwright 왕복이 부하에 늘어져도 관찰이 어긋나지 않는다.
// 래퍼는 data-morph-id로 찾는다: 카드와 패널이 같은 id를 나눠 쓰므로 어느 때든 하나뿐이다.
const grow = (page: Page) =>
  page.evaluate(async () => {
    const wrapper = () =>
      document.querySelector<HTMLElement>('[data-morph-id="card-2"]');
    const rectOf = (el: Element) => {
      const r = el.getBoundingClientRect();
      return { x: r.left, y: r.top, w: r.width, h: r.height };
    };
    // React는 클릭이 만든 갱신을 마이크로태스크에서 반영한다. 그 뒤, 첫 프레임이 그려지기 전에 잰다
    const flush = () => new Promise((r) => queueMicrotask(() => r(null)));
    const cardEl = wrapper() as HTMLElement;
    const from = rectOf(cardEl);
    (cardEl.querySelector('button') as HTMLButtonElement).click();
    await flush();
    const board = (wrapper() as HTMLElement).parentElement as HTMLElement;
    const boardRect = rectOf(board);
    const samples: { t: number; x: number; y: number; w: number; h: number }[] =
      [];
    const t0 = performance.now();
    const sample = () => {
      const w = wrapper();
      if (w) samples.push({ t: performance.now() - t0, ...rectOf(w) });
    };
    // 클릭이 끝난 같은 작업 안: 첫 프레임이 그려지기 전의 모양
    sample();
    while (performance.now() - t0 < 2500) {
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      sample();
    }
    const w = wrapper() as HTMLElement;
    return {
      from,
      boardRect,
      samples,
      inline: w.style.length,
      contentOpacity: getComputedStyle(w.firstElementChild as Element).opacity,
      cards: [1, 2, 3].map(
        (n) => document.querySelectorAll(`[data-morph-id="card-${n}"]`).length
      ),
    };
  });

test.describe('부품 이어받기 상세 (1440px)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('이름과 줄이기 글과 Props가 있다', async ({ page }) => {
    await page.goto('/motion/morph');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Morph' })
    ).toBeVisible();
    await expect(
      page.getByText('모양이 이어지지 않고 바로 바뀝니다')
    ).toBeVisible();
    await expect(
      page.getByText('morphId', { exact: true }).first()
    ).toBeVisible();
  });

  test('카드를 누르면 패널이 카드 자리와 크기에서 시작해 무대를 채우도록 커진다', async ({
    page,
  }) => {
    await open(page);
    const r = await grow(page);
    const first = r.samples[0];
    // 첫 프레임: 패널이 카드가 있던 자리와 크기에서 시작한다
    expect(
      Math.abs(first.x + first.w / 2 - (r.from.x + r.from.w / 2))
    ).toBeLessThan(6);
    expect(
      Math.abs(first.y + first.h / 2 - (r.from.y + r.from.h / 2))
    ).toBeLessThan(6);
    expect(Math.abs(first.w - r.from.w)).toBeLessThan(r.from.w * 0.15);
    expect(Math.abs(first.h - r.from.h)).toBeLessThan(r.from.h * 0.15);
    // 커지는 도중 폭이 한 방향으로 늘고 중심이 카드 쪽에서 무대 가운데로 간다
    const widths = r.samples.map((s) => s.w);
    for (let i = 1; i < widths.length; i++) {
      expect(widths[i]).toBeGreaterThanOrEqual(widths[i - 1] - 0.5);
    }
    const mid = r.samples.find((s) => s.t > 250) ?? first;
    expect(mid.w).toBeGreaterThan(first.w + 20);
    expect(mid.w).toBeLessThan(r.boardRect.w - 5);
    // 끝: 무대를 덮는 자리에 서고 인라인 스타일이 없으며 내용이 보인다
    const last = r.samples[r.samples.length - 1];
    expect(Math.abs(last.w - r.boardRect.w)).toBeLessThan(1);
    expect(Math.abs(last.h - r.boardRect.h)).toBeLessThan(1);
    expect(r.inline).toBe(0);
    expect(r.contentOpacity).toBe('1');
    // 열린 카드만 빠지고 나머지 카드는 그대로다
    expect(r.cards).toEqual([1, 1, 1]);
    await expect(close(page)).toBeVisible();
  });

  test('닫기를 누르면 패널이 카드 자리와 크기로 줄어들어 돌아간다', async ({
    page,
  }) => {
    await open(page);
    await card(page, 2).click();
    await expect(close(page)).toBeVisible();
    // 열림이 끝나 쉬는 모양이 된 뒤에 잰다
    await expect
      .poll(() =>
        page
          .locator('[data-morph-id="card-2"]')
          .evaluate((el) => (el as HTMLElement).style.length)
      )
      .toBe(0);
    const r = await page.evaluate(async () => {
      const wrapper = () =>
        document.querySelector<HTMLElement>('[data-morph-id="card-2"]');
      const rectOf = (el: Element) => {
        const r = el.getBoundingClientRect();
        return { x: r.left, y: r.top, w: r.width, h: r.height };
      };
      const flush = () => new Promise((r) => queueMicrotask(() => r(null)));
      const panel = rectOf(wrapper() as HTMLElement);
      (
        (wrapper() as HTMLElement).querySelector(
          'button[aria-label="닫기"]'
        ) as HTMLButtonElement
      ).click();
      await flush();
      const first = rectOf(wrapper() as HTMLElement);
      const t0 = performance.now();
      while (performance.now() - t0 < 2000)
        await new Promise((r) => requestAnimationFrame(() => r(null)));
      const w = wrapper() as HTMLElement;
      return {
        panel,
        first,
        last: rectOf(w),
        inline: w.style.length,
        hasClose: !!w.querySelector('button[aria-label="닫기"]'),
      };
    });
    // 첫 프레임은 패널 모양 그대로(점프 없음), 끝은 작은 카드
    expect(Math.abs(r.first.w - r.panel.w)).toBeLessThan(2);
    expect(Math.abs(r.first.h - r.panel.h)).toBeLessThan(2);
    expect(r.last.w).toBeLessThan(r.panel.w * 0.5);
    expect(r.inline).toBe(0);
    expect(r.hasClose).toBe(false);
    await expect(card(page, 2)).toBeVisible();
  });

  test('키보드로 열면 포커스가 패널로, 닫으면 카드로 간다', async ({
    page,
  }) => {
    await open(page);
    await card(page, 1).focus();
    await page.keyboard.press('Enter');
    await expect(close(page)).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(card(page, 1)).toBeFocused();
    // 포커스가 body로 떨어지지 않았다
    expect(await page.evaluate(() => document.activeElement?.tagName)).toBe(
      'BUTTON'
    );
  });

  test('열리는 도중 다시 누르면 지금 보이는 모양에서 돌아선다(점프 없음)', async ({
    page,
  }) => {
    await open(page);
    const r = await page.evaluate(async () => {
      const flush = () => new Promise((r) => queueMicrotask(() => r(null)));
      const wrapper = () =>
        document.querySelector<HTMLElement>('[data-morph-id="card-3"]');
      const rectOf = (el: Element) => {
        const r = el.getBoundingClientRect();
        return { x: r.left, y: r.top, w: r.width, h: r.height };
      };
      (
        (wrapper() as HTMLElement).querySelector('button') as HTMLButtonElement
      ).click();
      await flush();
      const t0 = performance.now();
      while (performance.now() - t0 < 250)
        await new Promise((res) => requestAnimationFrame(() => res(null)));
      const mid = rectOf(wrapper() as HTMLElement);
      (
        (wrapper() as HTMLElement).querySelector(
          'button[aria-label="닫기"]'
        ) as HTMLButtonElement
      ).click();
      await flush();
      const after = rectOf(wrapper() as HTMLElement);
      await new Promise((res) => setTimeout(res, 2000));
      const w = wrapper() as HTMLElement;
      return {
        mid,
        after,
        settled: rectOf(w),
        inline: w.style.length,
        ghosts: document.querySelectorAll('[data-morph-ghost]').length,
      };
    });
    expect(r.mid.w).toBeGreaterThan(100);
    for (const k of ['x', 'y', 'w', 'h'] as const) {
      expect(Math.abs(r.after[k] - r.mid[k])).toBeLessThan(1.5);
    }
    // 되돌아와 작은 카드로 섰다
    expect(r.settled.w).toBeLessThan(r.mid.w);
    expect(r.inline).toBe(0);
    expect(r.ghosts).toBe(0);
  });

  test('움직임 줄이기에서는 모양이 이어지지 않고 바로 바뀐다', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/motion/morph');
    await expect(card(page, 2)).toBeVisible();
    const r = await page.evaluate(async () => {
      const wrapper = () =>
        document.querySelector<HTMLElement>('[data-morph-id="card-2"]');
      const rectOf = (el: Element) => {
        const r = el.getBoundingClientRect();
        return { x: r.left, y: r.top, w: r.width, h: r.height };
      };
      (
        (wrapper() as HTMLElement).querySelector('button') as HTMLButtonElement
      ).click();
      await new Promise((r) => queueMicrotask(() => r(null)));
      const w = wrapper() as HTMLElement;
      return {
        rect: rectOf(w),
        board: rectOf(w.parentElement as HTMLElement),
        inline: w.style.length,
        contentOpacity: getComputedStyle(w.firstElementChild as Element)
          .opacity,
      };
    });
    expect(Math.abs(r.rect.w - r.board.w)).toBeLessThan(1);
    expect(Math.abs(r.rect.h - r.board.h)).toBeLessThan(1);
    expect(r.inline).toBe(0);
    expect(r.contentOpacity).toBe('1');
    // 포커스 규칙은 같다
    await card(page, 1).focus();
    await close(page).click();
    await card(page, 1).focus();
    await page.keyboard.press('Enter');
    await expect(close(page)).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(card(page, 1)).toBeFocused();
  });
});

// 이어받기 미니: 대본이 카드를 열고 닫는다
const morphMini = (page: Page) =>
  page.locator('[data-stage-mini="Morph 미리보기"]');

test.describe('모션 전체 보기 부품 이어받기 미니 (1440px)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('대본이 카드를 열고 닫고 움직임 멈춤이면 서 있다', async ({ page }) => {
    await page.goto('/motion');
    const centre = () =>
      morphMini(page).evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await centre();
    const panel = morphMini(page).locator('button[aria-label="닫기"]');
    // 열렸다가 닫혀 카드로 돌아온다
    await expect(panel).toHaveCount(1, { timeout: 15_000 });
    await expect(panel).toHaveCount(0, { timeout: 15_000 });

    const pause = page.getByRole('button', { name: '움직임 멈춤' });
    await pause.click();
    await expect(pause).toHaveAttribute('aria-pressed', 'true');
    await centre();
    // 멈추기 직전에 시작한 전환은 끝까지 가므로 끝난 뒤의 자세가 그대로 서 있다
    await page.waitForTimeout(2500);
    const snapshot = () =>
      morphMini(page).evaluate((el) => ({
        panel: el.querySelectorAll('button[aria-label="닫기"]').length,
        styled: [...el.querySelectorAll<HTMLElement>('[data-morph-id]')].filter(
          (w) => w.style.length > 0
        ).length,
      }));
    const frozen = await snapshot();
    expect(frozen.styled).toBe(0);
    for (let i = 0; i < 30; i++) {
      expect(await snapshot()).toEqual(frozen);
      await page.waitForTimeout(100);
    }
    await pause.click();
    await centre();
    await expect
      .poll(async () => JSON.stringify(await snapshot()), { timeout: 15_000 })
      .not.toBe(JSON.stringify(frozen));
  });
});
