import { expect, test, type Page } from '@playwright/test';

const stage = (page: Page) =>
  page.getByRole('region', { name: 'WingButton 미리보기' });
const send = (page: Page) =>
  stage(page).getByRole('button', { name: '보내기', exact: true });
// 날아간 뒤에도 보이지 않은 채 자리를 지키는 원래 단추(이름으로는 못 찾는다)
const original = (page: Page) => stage(page).locator('[data-sent] button');
const mark = (page: Page) => stage(page).locator('[data-wing-mark]');
const count = (page: Page, n: number) =>
  stage(page).getByText(`보낸 메일 ${n}통`);

// 앱이 그려지기 전의 입력은 버려진다. 단추가 보인 뒤에 시연을 멈춘다
const open = async (page: Page) => {
  await page.goto('/motion/wing-button');
  await expect(send(page)).toBeVisible();
  await stage(page).getByRole('button', { name: '시연 멈춤' }).click();
  // 시연을 멈추며 마우스가 일시정지 단추 위에 있으니 치운다
  await page.mouse.move(2, 2);
};

// 비행 한 번을 한 evaluate 안에서 재서 Playwright 왕복이 부하에 늘어져도 관찰이 어긋나지 않게 한다
const fly = (page: Page) =>
  send(page).evaluate(async (button) => {
    const rectOf = (el: Element) => {
      const r = el.getBoundingClientRect();
      return { x: r.left, y: r.top, w: r.width, h: r.height };
    };
    const samples: { t: number; x: number; y: number; w: number }[] = [];
    let box: ReturnType<typeof rectOf> | null = null;
    const t0 = performance.now();
    (button as HTMLButtonElement).click();
    while (performance.now() - t0 < 3000) {
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      const layer = document.querySelector('[data-wing-layer]');
      const clone = layer?.querySelector('button');
      if (layer && clone) {
        box = rectOf(layer);
        const c = rectOf(clone);
        samples.push({
          t: performance.now() - t0,
          x: c.x,
          y: c.y,
          w: c.w,
        });
      } else if (samples.length > 0) {
        break;
      }
    }
    return { samples, box };
  });

test.describe('날개 전송 상세 (1440px)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('이름과 줄이기 글과 Props가 있다', async ({ page }) => {
    await page.goto('/motion/wing-button');
    await expect(
      page.getByRole('heading', { level: 1, name: 'WingButton' })
    ).toBeVisible();
    await expect(send(page)).toBeVisible();
    await expect(page.getByText('움직임 줄이기에서는').first()).toContainText(
      '날개와 비행 없이 단추가 "보냈어요"로 바뀝니다.'
    );
    await expect(page.getByText('sentLabel').first()).toBeVisible();
    await expect(page.getByText('container').first()).toBeVisible();
  });

  test('누르면 복제본이 무대 오른쪽 위로 날아 무대 밖으로 나가고 표지가 선다', async ({
    page,
  }) => {
    await open(page);
    await count(page, 0).waitFor();
    const { samples, box } = await fly(page);
    expect(samples.length).toBeGreaterThan(10);
    expect(box).not.toBeNull();
    const first = samples[0];
    const last = samples[samples.length - 1];
    // 오른쪽 위로 간다: x는 늘고 y는 준다
    expect(last.x).toBeGreaterThan(first.x + 100);
    expect(last.y).toBeLessThan(first.y - 100);
    // 이륙 구간(0.6초 이후)에서 x는 줄지 않고 y는 늘지 않으며 점점 작아진다
    const flight = samples.filter((s) => s.t > 700);
    for (let i = 1; i < flight.length; i++) {
      expect(flight[i].x).toBeGreaterThanOrEqual(flight[i - 1].x - 0.5);
      expect(flight[i].y).toBeLessThanOrEqual(flight[i - 1].y + 0.5);
    }
    expect(last.w).toBeLessThan(first.w);
    // 마지막 표본은 레이어(무대 안쪽 상자) 밖이다
    const b = box as { x: number; y: number; w: number; h: number };
    const outside =
      last.x >= b.x + b.w || last.y + 44 * 0.6 <= b.y || last.x + last.w <= b.x;
    expect(outside).toBe(true);
    // 비행이 끝나면 레이어가 걷히고 표지가 남는다
    await expect(page.locator('[data-wing-layer]')).toHaveCount(0);
    await expect(mark(page)).toHaveText('보냈어요');
    await expect(mark(page)).toHaveCSS('opacity', '1');
    await expect(count(page, 1)).toBeVisible();
  });

  test('날아간 단추 자리의 크기와 이웃 글의 자리가 움직이지 않는다', async ({
    page,
  }) => {
    await open(page);
    const slot = (await send(page).locator('xpath=../..').elementHandle())!;
    const caption = count(page, 0);
    const slotBefore = await slot.boundingBox();
    const captionBefore = await caption.boundingBox();
    await page.evaluate(() => {
      const w = window as unknown as { __shift: number };
      w.__shift = 0;
      new PerformanceObserver((list) => {
        for (const e of list.getEntries() as unknown as {
          value: number;
        }[])
          w.__shift += e.value;
      }).observe({ type: 'layout-shift', buffered: false });
    });
    await send(page).click();
    await expect(mark(page)).toHaveCSS('opacity', '1', { timeout: 8000 });
    expect(await slot.boundingBox()).toEqual(slotBefore);
    // 글자 폭은 숫자가 바뀌며 달라지므로 세로 자리만 본다
    const captionAfter = await count(page, 1).boundingBox();
    expect(captionAfter?.y).toBe(captionBefore?.y);
    expect(captionAfter?.height).toBe(captionBefore?.height);
    // 표지가 단추 자리와 같은 상자를 덮는다
    expect(await mark(page).boundingBox()).toEqual(slotBefore);
    expect(
      await page.evaluate(
        () => (window as unknown as { __shift: number }).__shift
      )
    ).toBe(0);
  });

  test('마우스 클릭 뒤 포커스가 표지로 옮겨지고 표지에 role이 없다', async ({
    page,
  }) => {
    await open(page);
    await send(page).click();
    await expect(mark(page)).toBeFocused();
    await expect(mark(page)).not.toHaveAttribute('role', /./);
    await expect(mark(page)).toHaveAttribute('tabindex', '-1');
  });

  test('키보드 Enter로도 같다', async ({ page }) => {
    await open(page);
    await send(page).focus();
    await expect(send(page)).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-wing-layer]')).toHaveCount(1);
    await expect(mark(page)).toBeFocused();
    await expect(page.locator('[data-wing-layer]')).toHaveCount(0, {
      timeout: 8000,
    });
    await expect(mark(page)).toHaveText('보냈어요');
    await expect(mark(page)).toHaveCSS('opacity', '1');
    await expect(count(page, 1)).toBeVisible();
    // 보이지 않는 단추에는 Enter가 가지 않는다
    await page.keyboard.press('Enter');
    await expect(count(page, 1)).toBeVisible();
    await expect(count(page, 2)).toHaveCount(0);
  });

  test('누르기만 하면 웅크리고 밖으로 빠지면 되감기며 날지 않는다', async ({
    page,
  }) => {
    await open(page);
    const wrap = send(page).locator('xpath=..');
    const matrix = () => wrap.evaluate((el) => getComputedStyle(el).transform);
    const box = (await send(page).boundingBox()) as {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    // 왼쪽 아래로 2px, 0.97배
    await expect
      .poll(async () => (await matrix()).replace(/\s/g, ''))
      .toMatch(/^matrix\(0\.97,0,0,0\.97,-2,2\)$/);
    await expect(count(page, 0)).toBeVisible();
    // 포인터가 밖으로 나가면 되감긴다
    await page.mouse.move(box.x + box.width / 2, box.y - 60);
    await expect
      .poll(async () => (await matrix()).replace(/\s/g, ''))
      .toMatch(/^(none|matrix\(1,0,0,1,0,0\))$/);
    await page.mouse.up();
    await expect(page.locator('[data-wing-layer]')).toHaveCount(0);
    await expect(mark(page)).toHaveCount(0);
    await expect(count(page, 0)).toBeVisible();
  });

  test('다시 단추가 처음 상태로 돌린다', async ({ page }) => {
    await open(page);
    await send(page).click();
    await expect(mark(page)).toHaveCSS('opacity', '1', { timeout: 8000 });
    await stage(page)
      .getByRole('button', { name: '다시', exact: true })
      .click();
    await expect(mark(page)).toHaveCount(0);
    await expect(send(page)).toBeVisible();
    await expect(count(page, 0)).toBeVisible();
    await send(page).click();
    await expect(count(page, 1)).toBeVisible();
    await expect(original(page)).toHaveCount(1);
  });
});

test.describe('날개 전송 상세 움직임 줄이기 (1440px)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('날개와 비행 없이 단추가 표지로 바뀐다', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/motion/wing-button');
    await expect(send(page)).toBeVisible();
    const sawLayer = await send(page).evaluate(async (button) => {
      (button as HTMLButtonElement).click();
      let seen = false;
      for (let i = 0; i < 20; i++) {
        await new Promise((r) => requestAnimationFrame(() => r(null)));
        if (document.querySelector('[data-wing-layer], [data-wing]'))
          seen = true;
      }
      return seen;
    });
    expect(sawLayer).toBe(false);
    await expect(mark(page)).toHaveText('보냈어요');
    await expect(mark(page)).toHaveCSS('opacity', '1');
    await expect(original(page)).toHaveCSS('visibility', 'hidden');
  });
});
