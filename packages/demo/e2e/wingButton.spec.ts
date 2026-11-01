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

// 비행 한 번을 한 evaluate 안에서 재서 Playwright 왕복이 부하에 늘어져도 관찰이 어긋나지 않게 한다.
// 프로그램으로 누르므로 단추에 포커스가 없다(포커스가 없는 경로)
const fly = (page: Page) =>
  send(page).evaluate(async (button) => {
    const rectOf = (el: Element) => {
      const r = el.getBoundingClientRect();
      return { x: r.left, y: r.top, w: r.width, h: r.height };
    };
    const statusText = () =>
      document.querySelector('[data-sent] [role="status"]')?.textContent ?? '';
    const markOpacity = () => {
      const m = document.querySelector('[data-wing-mark]');
      return m ? Number(getComputedStyle(m).opacity) : 0;
    };
    const samples: {
      t: number;
      x: number;
      y: number;
      w: number;
      h: number;
      mark: number;
    }[] = [];
    let box: ReturnType<typeof rectOf> | null = null;
    let statusDuring = '';
    const t0 = performance.now();
    (button as HTMLButtonElement).click();
    while (performance.now() - t0 < 4500) {
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
          h: c.h,
          mark: markOpacity(),
        });
        statusDuring = statusText();
      } else if (samples.length > 0) {
        break;
      }
    }
    // 표지가 다 떠오를 때까지 기다린 뒤 알림 영역을 읽는다
    while (markOpacity() < 1 && performance.now() - t0 < 6000)
      await new Promise((r) => requestAnimationFrame(() => r(null)));
    return { samples, box, statusDuring, statusAfter: statusText() };
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
    const { samples, box, statusDuring, statusAfter } = await fly(page);
    expect(samples.length).toBeGreaterThan(10);
    expect(box).not.toBeNull();
    const first = samples[0];
    const last = samples[samples.length - 1];
    // 오른쪽 위로 간다: x는 늘고 y는 준다
    expect(last.x).toBeGreaterThan(first.x + 100);
    expect(last.y).toBeLessThan(first.y - 100);
    // 첫 날갯짓이 끝난 뒤(0.95초 이후)에는 x는 줄지 않고 y는 늘지 않으며 점점 작아진다
    const flight = samples.filter((s) => s.t > 1000);
    for (let i = 1; i < flight.length; i++) {
      expect(flight[i].x).toBeGreaterThanOrEqual(flight[i - 1].x - 0.5);
      expect(flight[i].y).toBeLessThanOrEqual(flight[i - 1].y + 0.5);
    }
    expect(last.w).toBeLessThan(first.w);
    // 복제본이 레이어(무대 안쪽 상자) 밖이다
    const b = box as { x: number; y: number; w: number; h: number };
    const outside = (s: { x: number; y: number; w: number; h: number }) =>
      s.x >= b.x + b.w || s.y + s.h <= b.y || s.x + s.w <= b.x;
    expect(outside(last)).toBe(true);
    // 표지는 날아간 뒤에 보인다: 복제본이 레이어 안에 있는 동안은 표지가 투명하다
    expect(samples.filter((s) => !outside(s)).length).toBeGreaterThan(10);
    for (const s of samples.filter((s) => !outside(s))) {
      expect(s.mark).toBeLessThanOrEqual(0.01);
    }
    // 포커스가 없던 경로: 처음부터 있는 알림 영역이 비행 중에는 비어 있고 날아간 뒤 글이 들어간다
    expect(statusDuring).toBe('');
    expect(statusAfter).toBe('보냈어요');
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

  test('마우스를 400ms 누르고 뗄 때(단추가 눌린 채)도 복제본은 원래 단추의 자리와 크기에서 출발한다', async ({
    page,
  }) => {
    await open(page);
    const slot = (await send(page).locator('xpath=../..').elementHandle())!;
    const slotBox = (await slot.boundingBox())!;
    const box = (await send(page).boundingBox())!;
    // 레이어가 서는 순간 복제본 상자(craft)의 배치를 붙잡는다(배치는 비행 내내 바뀌지 않는다)
    await page.evaluate(() => {
      const w = window as unknown as { __craft?: Record<string, number> };
      new MutationObserver(() => {
        const layer = document.querySelector('[data-wing-layer]');
        const craft = layer?.firstElementChild as HTMLElement | undefined;
        if (!layer || !craft || w.__craft) return;
        const r = layer.getBoundingClientRect();
        w.__craft = {
          x: r.left + parseFloat(craft.style.left),
          y: r.top + parseFloat(craft.style.top),
          w: parseFloat(craft.style.width),
          h: parseFloat(craft.style.height),
        };
      }).observe(document.body, { childList: true, subtree: true });
    });
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(400);
    await page.mouse.up();
    await expect(mark(page)).toHaveCSS('opacity', '1', { timeout: 8000 });
    const craft = await page.evaluate(
      () => (window as unknown as { __craft?: Record<string, number> }).__craft!
    );
    expect(Math.abs(craft.x - slotBox.x)).toBeLessThan(1);
    expect(Math.abs(craft.y - slotBox.y)).toBeLessThan(1);
    expect(Math.abs(craft.w - slotBox.width)).toBeLessThan(1);
    expect(Math.abs(craft.h - slotBox.height)).toBeLessThan(1);
  });

  test('긴 sentLabel도 표지가 단추 자리 안에서 말줄임으로 잘린다', async ({
    page,
  }) => {
    await open(page);
    await page
      .getByLabel('보낸 뒤 글자')
      .fill('아주 아주 길고 긴 보낸 뒤 글자가 단추 자리를 넘치려 합니다');
    const slotBox = (await send(page).boundingBox())!;
    await send(page).click();
    await expect(mark(page)).toHaveCSS('opacity', '1', { timeout: 8000 });
    const text = (await mark(page).locator('span').boundingBox())!;
    const markBox = (await mark(page).boundingBox())!;
    expect(markBox.width).toBeCloseTo(slotBox.width, 0);
    expect(text.x + text.width).toBeLessThanOrEqual(markBox.x + markBox.width);
    expect(text.x).toBeGreaterThanOrEqual(markBox.x);
  });

  test('마우스 클릭 뒤 포커스가 표지로 옮겨지고 표지에 role이 없다', async ({
    page,
  }) => {
    await open(page);
    await send(page).click();
    await expect(mark(page)).toBeFocused();
    await expect(mark(page)).not.toHaveAttribute('role', /./);
    // 포커스가 표지에 있으니 알림 영역은 비어 있다(두 번 낭독 방지)
    await expect(stage(page).locator('[role="status"]')).toHaveText('');
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

test.describe('날개 전송 상세 유체 연기 (1440px)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('WebGL2와 float 렌더 확장이 있다(없으면 연기 없는 길로 조용히 통과하지 않게 실패한다)', async ({
    page,
  }) => {
    await page.goto('/motion/wing-button');
    const support = await page.evaluate(() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      const floatRender = !!(
        gl?.getExtension('EXT_color_buffer_float') ||
        gl?.getExtension('EXT_color_buffer_half_float')
      );
      gl?.getExtension('WEBGL_lose_context')?.loseContext();
      return { webgl2: !!gl, floatRender };
    });
    expect(support).toEqual({ webgl2: true, floatRender: true });
  });

  test('비행 중 무대 안 연기 canvas에 알파가 생기고 복제본 뒤에 깔리며, 표지가 뜬 뒤에도 남았다 사라진다', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await open(page);
    // 관찰은 모두 한 evaluate 안에서 한다(병렬 부하에서 왕복이 수 초 걸린다).
    // 연기 canvas는 preserveDrawingBuffer 없이 만들어지므로 엔진이 그린 같은 프레임의 rAF에서 읽어야 한다
    const result = await send(page).evaluate(async (button) => {
      const region = button.closest('[role="region"]') as HTMLElement;
      const copy = document.createElement('canvas');
      const alphaOf = (canvas: HTMLCanvasElement) => {
        copy.width = canvas.width;
        copy.height = canvas.height;
        const ctx = copy.getContext('2d')!;
        ctx.drawImage(canvas, 0, 0);
        const { data } = ctx.getImageData(0, 0, copy.width, copy.height);
        let n = 0;
        for (let i = 3; i < data.length; i += 4) if (data[i] > 0) n += 1;
        return n;
      };
      const frame = () =>
        new Promise((r) => requestAnimationFrame(() => r(null)));
      const t0 = performance.now();
      (button as HTMLButtonElement).click();
      const found = {
        canvasInRegion: false,
        insideStage: false,
        behindClone: false,
        alphaWhileFlying: 0,
        alphaAfterLayerGone: 0,
        canvasAfterMark: false,
        goneAt: 0,
        onBody: false,
      };
      let layerWasUp = false;
      let n = 0;
      while (performance.now() - t0 < 12_000) {
        await frame();
        n += 1;
        // 날개 canvas(비행 층 안)는 따로 본다: 여기서는 연기 canvas만
        const canvas =
          [...region.querySelectorAll('canvas')].find(
            (c) => !c.closest('[data-wing-layer]')
          ) ?? null;
        const layer = document.querySelector('[data-wing-layer]');
        found.onBody ||= !!document.body.querySelector(':scope > canvas');
        if (layer) layerWasUp = true;
        if (canvas) {
          found.canvasInRegion = true;
          const c = canvas.getBoundingClientRect();
          const r = region.getBoundingClientRect();
          found.insideStage ||=
            c.left >= r.left - 1 &&
            c.right <= r.right + 1 &&
            c.top >= r.top - 1 &&
            c.bottom <= r.bottom + 1;
          if (layer) {
            found.behindClone ||=
              Number(getComputedStyle(canvas).zIndex) <
              Number(getComputedStyle(layer).zIndex);
          }
          if (n % 3 === 0) {
            const a = alphaOf(canvas);
            if (layer)
              found.alphaWhileFlying = Math.max(found.alphaWhileFlying, a);
            else if (layerWasUp)
              found.alphaAfterLayerGone = Math.max(
                found.alphaAfterLayerGone,
                a
              );
          }
          if (layerWasUp && !layer) found.canvasAfterMark = true;
        } else if (layerWasUp && !layer) {
          found.goneAt = performance.now() - t0;
          break;
        }
      }
      return found;
    });
    expect(result.canvasInRegion).toBe(true);
    // 창 전체(body)가 아니라 무대 안에 갇힌다
    expect(result.insideStage).toBe(true);
    expect(result.onBody).toBe(false);
    expect(result.behindClone).toBe(true);
    expect(result.alphaWhileFlying).toBeGreaterThan(0);
    // 레이어가 걷히고 표지가 뜬 뒤에도 연기는 남아 흩어지다 사라진다
    expect(result.canvasAfterMark).toBe(true);
    expect(result.alphaAfterLayerGone).toBeGreaterThan(0);
    expect(result.goneAt).toBeGreaterThan(0);
    await expect(mark(page)).toHaveCSS('opacity', '1');
    await expect(stage(page).locator('canvas')).toHaveCount(0);
  });

  test('다시 단추로 열 번 되풀이해도 연기 문맥이 쌓이지 않는다', async ({
    page,
  }) => {
    test.setTimeout(90_000);
    const warnings: string[] = [];
    page.on('console', (m) => {
      if (m.text().includes('Too many active WebGL contexts'))
        warnings.push(m.text());
    });
    await open(page);
    const leftovers = await stage(page).evaluate(async (region) => {
      const frame = () =>
        new Promise((r) => requestAnimationFrame(() => r(null)));
      const wait = async (ms: number) => {
        const t = performance.now();
        while (performance.now() - t < ms) await frame();
      };
      const buttons = (name: string) =>
        [...region.querySelectorAll('button')].find(
          (b) => b.textContent?.trim() === name
        ) as HTMLButtonElement;
      const counts: number[] = [];
      for (let i = 0; i < 10; i++) {
        buttons('보내기').click();
        // 첫 날갯짓의 연기가 나온 뒤(0.9초) 되돌린다
        await wait(900);
        buttons('다시').click();
        await wait(100);
        counts.push(region.querySelectorAll('canvas').length);
      }
      return counts;
    });
    // 되돌리면(언마운트) 연기 canvas가 바로 떨어진다
    expect(leftovers).toEqual(Array(10).fill(0));
    await page.waitForTimeout(1000);
    expect(warnings).toEqual([]);
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

// 가짜 시계로 시각을 보내 단추 위치를 표집한다. 실시간 rAF는 부하에서 프레임이 늘어져 박자를 놓친다
const freeze = async (page: Page) => {
  await page.clock.install();
  await page.goto('/motion/wing-button');
  await expect(send(page)).toBeVisible();
  await stage(page).getByRole('button', { name: '시연 멈춤' }).click();
  await page.clock.runFor(100);
  // install만으로는 시계가 실시간으로 흐른다. 여기서 멈춰 runFor로만 흐르게 한다
  await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 1000);
  await page.mouse.move(2, 2);
};
const cloneBox = (page: Page) =>
  page.evaluate(() => {
    const clone = document.querySelector('[data-wing-layer] button');
    if (!clone) return null;
    const r = clone.getBoundingClientRect();
    return { x: r.left, y: r.top, w: r.width, h: r.height };
  });
// 누른 시각을 0으로 두고 ms까지 50ms씩 보낸다(GSAP이 긴 틈을 줄여 버리지 않게)
const clockTo = (page: Page) => {
  let elapsed = 0;
  return async (ms: number) => {
    while (elapsed < ms) {
      const step = Math.min(50, ms - elapsed);
      await page.clock.runFor(step);
      elapsed += step;
    }
    return cloneBox(page);
  };
};

test.describe('날개 전송 상세 날갯짓 박자 (1440px)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('아래로 칠 때마다 6, 10, 14px 떠오르고 오른쪽 위로 이륙해 보냈어요가 남는다', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await freeze(page);
    const rest = (await send(page).boundingBox())!;
    await send(page).evaluate((b) => (b as HTMLButtonElement).click());
    const to = clockTo(page);
    // 깃이 다 펴지고 첫 날갯짓 전: 아직 뜨지 않았다
    const before = (await to(700))!;
    expect(Math.abs(before.y - rest.y)).toBeLessThan(0.75);
    // 위로 올리는 동안 높이는 머문다: 첫 내려치기(950ms) 뒤 6px, 둘째(1450ms) 뒤 10px, 셋째(1950ms) 뒤 14px
    const lifts: number[] = [];
    for (const ms of [1100, 1600, 2100]) {
      lifts.push(rest.y - (await to(ms))!.y);
    }
    expect(lifts[0]).toBeGreaterThan(5.25);
    expect(lifts[0]).toBeLessThan(6.75);
    expect(lifts[1]).toBeGreaterThan(9.25);
    expect(lifts[1]).toBeLessThan(10.75);
    expect(lifts[2]).toBeGreaterThan(13.25);
    expect(lifts[2]).toBeLessThan(14.75);
    // 이륙(2250ms부터): x는 늘고 y는 줄며 점점 작아진다
    const mid = (await to(2700))!;
    const late = (await to(3000))!;
    expect(late.x).toBeGreaterThan(mid.x);
    expect(late.y).toBeLessThan(mid.y);
    expect(late.x - rest.x).toBeGreaterThan(100);
    expect(late.y - rest.y).toBeLessThan(-100);
    expect(late.w).toBeLessThan(rest.width);
    // 3050ms에 비행이 끝나고 표지가 남는다
    await to(3500);
    await expect(page.locator('[data-wing-layer]')).toHaveCount(0);
    await expect(mark(page)).toHaveText('보냈어요');
    await expect(mark(page)).toHaveCSS('opacity', '1');
    await expect(count(page, 1)).toBeVisible();
  });

  test('비행 중 다시 눌러도 두 번째 비행은 없고 끝 모양이 같다', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await freeze(page);
    await send(page).evaluate((b) => (b as HTMLButtonElement).click());
    const to = clockTo(page);
    await to(1100);
    // 날아가는 중 보이지 않는 원래 단추에 click이 와도(Enter 암묵 제출 등) 무시한다
    await original(page).evaluate((b) => (b as HTMLButtonElement).click());
    await to(1200);
    await expect(page.locator('[data-wing-layer]')).toHaveCount(1);
    await expect(page.locator('[data-wing-layer] button')).toHaveCount(1);
    await to(3500);
    await expect(page.locator('[data-wing-layer]')).toHaveCount(0);
    await expect(mark(page)).toHaveCount(1);
    await expect(mark(page)).toHaveText('보냈어요');
    await expect(count(page, 1)).toBeVisible();
  });
});

test.describe('날개 전송 상세 three 불러오기 (1440px)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  // 3D 날개 라이브러리 덩이(three.module-해시.js). 가리킬 때 따로 불려야 한다
  const watchThree = (page: Page) => {
    const urls: string[] = [];
    page.on('request', (request) => {
      if (/three\.module/.test(request.url())) urls.push(request.url());
    });
    return urls;
  };

  test('처음 열 때는 three를 받지 않고 단추를 가리키면 덩이 요청이 나간다', async ({
    page,
  }) => {
    const urls = watchThree(page);
    await open(page);
    expect(urls).toEqual([]);
    await send(page).hover();
    await expect.poll(() => urls.length).toBeGreaterThan(0);
  });

  test('움직임 줄이기에서는 가리켜도 포커스가 가도 눌러도 three 요청이 나가지 않는다', async ({
    page,
  }) => {
    const urls = watchThree(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/motion/wing-button');
    await expect(send(page)).toBeVisible();
    await send(page).hover();
    await send(page).focus();
    await send(page).click();
    await expect(mark(page)).toHaveCSS('opacity', '1');
    await page.waitForTimeout(500);
    expect(urls).toEqual([]);
  });
});

// 3D 날개(three, Chromium 소프트웨어 WebGL). 날개 canvas는 비행 층 안의 단추 상자에 있다
const wingCanvas = (page: Page) => page.locator('[data-wing-layer] canvas');
// 가리켜 three를 받고 평가가 끝나도록 기다린다
const warm = async (page: Page) => {
  const loaded = page.waitForResponse((r) => /three\.module/.test(r.url()));
  await send(page).hover();
  await loaded;
  await page.waitForTimeout(500);
  await page.mouse.move(2, 2);
};

test.describe('날개 전송 상세 3D 날개 (1440px)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('비행 중에는 날개 canvas가 단추 복제본 뒤에 있고 끝나면 없다', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await open(page);
    await warm(page);
    const seen = await send(page).evaluate(async (button) => {
      const frame = () =>
        new Promise((r) => requestAnimationFrame(() => r(null)));
      const t0 = performance.now();
      (button as HTMLButtonElement).click();
      const found = {
        insideCraft: false,
        behindClone: false,
        ariaHidden: false,
        noPointer: false,
        sameLayerAsClone: false,
        goneWithLayer: false,
      };
      let layerUp = false;
      while (performance.now() - t0 < 6000) {
        await frame();
        const layer = document.querySelector('[data-wing-layer]');
        const canvas = document.querySelector('[data-wing-layer] canvas');
        if (layer) layerUp = true;
        if (canvas && layer) {
          const craft = layer.firstElementChild;
          found.insideCraft ||= canvas.parentElement === craft;
          found.behindClone ||= craft?.firstElementChild === canvas;
          found.ariaHidden ||= canvas.getAttribute('aria-hidden') === 'true';
          found.noPointer ||= getComputedStyle(canvas).pointerEvents === 'none';
          found.sameLayerAsClone ||= !!layer.querySelector('button');
        }
        if (layerUp && !layer) {
          found.goneWithLayer = !document.querySelector(
            '[data-wing-layer] canvas'
          );
          break;
        }
      }
      return found;
    });
    expect(seen).toEqual({
      insideCraft: true,
      behindClone: true,
      ariaHidden: true,
      noPointer: true,
      sameLayerAsClone: true,
      goneWithLayer: true,
    });
    await expect(wingCanvas(page)).toHaveCount(0);
  });

  test('비행이 끝나면 날개의 WebGL 컨텍스트가 실제로 잃어진다(렌더러를 놓는다)', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await open(page);
    await warm(page);
    const r = await send(page).evaluate(async (button) => {
      const frame = () =>
        new Promise((r) => requestAnimationFrame(() => r(null)));
      const t0 = performance.now();
      (button as HTMLButtonElement).click();
      let wing: HTMLCanvasElement | null = null;
      let lostWhileFlying = true;
      while (performance.now() - t0 < 6000) {
        await frame();
        const layer = document.querySelector('[data-wing-layer]');
        const canvas = layer?.querySelector('canvas') ?? null;
        if (canvas) {
          wing = canvas;
          // 같은 canvas에서 getContext는 이미 만든 컨텍스트를 돌려준다
          const gl = canvas.getContext('webgl2');
          lostWhileFlying = !gl || gl.isContextLost();
        }
        if (wing && !layer) break;
      }
      const gl = wing?.getContext('webgl2');
      return {
        sawWing: !!wing,
        lostWhileFlying,
        lostAfter: !!gl && gl.isContextLost(),
        detached: !!wing && !wing.isConnected,
      };
    });
    expect(r).toEqual({
      sawWing: true,
      lostWhileFlying: false,
      lostAfter: true,
      detached: true,
    });
  });

  test('가리켜 받아 둔 뒤 누르면 300ms 안에 날개 canvas가 선다', async ({
    page,
  }) => {
    await open(page);
    await warm(page);
    const at = await send(page).evaluate(async (button) => {
      const t0 = performance.now();
      (button as HTMLButtonElement).click();
      while (performance.now() - t0 < 2000) {
        await new Promise((r) => requestAnimationFrame(() => r(null)));
        if (document.querySelector('[data-wing-layer] canvas'))
          return performance.now() - t0;
      }
      return -1;
    });
    expect(at).toBeGreaterThanOrEqual(0);
    expect(at).toBeLessThan(300);
  });

  test('날개 canvas에 흰색 계열과 파랑 계열 픽셀이 실제로 그려진다', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await open(page);
    await warm(page);
    const px = await send(page).evaluate(async (button) => {
      const copy = document.createElement('canvas');
      const t0 = performance.now();
      (button as HTMLButtonElement).click();
      let best = { white: 0, blue: 0, drawn: 0 };
      while (performance.now() - t0 < 2300) {
        await new Promise((r) => requestAnimationFrame(() => r(null)));
        const canvas = document.querySelector<HTMLCanvasElement>(
          '[data-wing-layer] canvas'
        );
        // 깃이 다 펴진 뒤(0.8초부터)의 프레임을 본다
        if (!canvas || performance.now() - t0 < 800) continue;
        copy.width = canvas.width;
        copy.height = canvas.height;
        const ctx = copy.getContext('2d')!;
        ctx.drawImage(canvas, 0, 0);
        const { data } = ctx.getImageData(0, 0, copy.width, copy.height);
        let white = 0;
        let blue = 0;
        let drawn = 0;
        for (let i = 0; i < data.length; i += 4) {
          const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
          if (a < 200) continue;
          drawn += 1;
          const spread = Math.max(r, g, b) - Math.min(r, g, b);
          if (Math.min(r, g, b) > 170 && spread < 25) white += 1;
          if (b - r > 40) blue += 1;
        }
        if (drawn > best.drawn) best = { white, blue, drawn };
      }
      return best;
    });
    expect(px.drawn).toBeGreaterThan(500);
    expect(px.white).toBeGreaterThan(200);
    expect(px.blue).toBeGreaterThan(50);
  });

  test('열 번 되풀이 비행해도 WebGL 문맥 경고가 없고 날개 canvas가 남지 않는다', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const warnings: string[] = [];
    page.on('console', (m) => {
      if (m.text().includes('Too many active WebGL contexts'))
        warnings.push(m.text());
    });
    await open(page);
    await warm(page);
    const result = await stage(page).evaluate(async (region) => {
      const frame = () =>
        new Promise((r) => requestAnimationFrame(() => r(null)));
      const until = async (done: () => boolean, ms: number) => {
        const t = performance.now();
        while (!done() && performance.now() - t < ms) await frame();
        return done();
      };
      const buttons = (name: string) =>
        [...region.querySelectorAll('button')].find(
          (b) => b.textContent?.trim() === name
        ) as HTMLButtonElement;
      const wings = () => document.querySelectorAll('[data-wing-layer] canvas');
      const sawWing: boolean[] = [];
      const left: number[] = [];
      for (let i = 0; i < 10; i++) {
        buttons('보내기').click();
        sawWing.push(await until(() => wings().length > 0, 1000));
        // 비행이 끝나(3.05초) 레이어가 걷히면 날개가 놓인다
        await until(() => !document.querySelector('[data-wing-layer]'), 5000);
        left.push(wings().length);
        buttons('다시').click();
        await frame();
      }
      return { sawWing, left };
    });
    expect(result.sawWing).toEqual(Array(10).fill(true));
    expect(result.left).toEqual(Array(10).fill(0));
    await page.waitForTimeout(1000);
    expect(warnings).toEqual([]);
  });

  // three 덩이 요청을 붙잡아 누르는 순간 아직 불러오는 중인 상황을 만든다(가리키지 않고 바로 누른다)
  const holdThree = async (page: Page, delayMs: number) => {
    await page.route(/three\.module/, async (route) => {
      await new Promise((r) => setTimeout(r, delayMs));
      await route.continue();
    });
  };
  // 누른 뒤 비행이 끝날 때까지 한 evaluate 안에서 본다: 웅크림 시작 시각, 날개 canvas가 처음 선 시각
  const pressAndWatch = (page: Page) =>
    send(page).evaluate(async (button) => {
      const t0 = performance.now();
      const width0 = button.getBoundingClientRect().width;
      (button as HTMLButtonElement).click();
      let crouchAt = -1;
      let wingAt = -1;
      let layerUp = false;
      while (performance.now() - t0 < 6000) {
        await new Promise((r) => requestAnimationFrame(() => r(null)));
        const t = performance.now() - t0;
        const clone = document.querySelector('[data-wing-layer] button');
        const layer = document.querySelector('[data-wing-layer]');
        if (layer) layerUp = true;
        if (
          clone &&
          crouchAt < 0 &&
          clone.getBoundingClientRect().width < width0 * 0.99
        )
          crouchAt = t;
        if (wingAt < 0 && document.querySelector('[data-wing-layer] canvas'))
          wingAt = t;
        if (layerUp && !layer) return { crouchAt, wingAt, ended: t };
      }
      return { crouchAt, wingAt, ended: -1 };
    });

  test('아직 불러오는 중이어도 300ms 안에 오면 날개가 돋고, 웅크림은 누른 직후 시작한다', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await holdThree(page, 60);
    await open(page);
    const r = await pressAndWatch(page);
    expect(r.crouchAt).toBeGreaterThanOrEqual(0);
    expect(r.crouchAt).toBeLessThan(150);
    expect(r.wingAt).toBeGreaterThan(0);
    expect(r.wingAt).toBeLessThan(900);
    expect(r.ended).toBeGreaterThan(3000);
  });

  test('300ms 넘게 붙잡히면 날개 없이 난다. 웅크림은 같고 표지는 선다', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await holdThree(page, 1200);
    await open(page);
    const r = await pressAndWatch(page);
    expect(r.crouchAt).toBeGreaterThanOrEqual(0);
    expect(r.crouchAt).toBeLessThan(150);
    // 늦게 와도 이번 비행에는 날개가 서지 않는다
    expect(r.wingAt).toBe(-1);
    expect(r.ended).toBeGreaterThan(3000);
    await expect(mark(page)).toHaveText('보냈어요');
    await expect(mark(page)).toHaveCSS('opacity', '1');
    await expect(count(page, 1)).toBeVisible();
  });
});
