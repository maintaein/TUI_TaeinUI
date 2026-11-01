import { expect, test, type Page } from '@playwright/test';

const stage = (page: Page) =>
  page.getByRole('region', { name: 'RocketButton 미리보기' });
const send = (page: Page) =>
  stage(page).getByRole('button', { name: '보내기', exact: true });
// 날아간 뒤에도 보이지 않은 채 자리를 지키는 원래 단추(이름으로는 못 찾는다)
const original = (page: Page) => stage(page).locator('[data-sent] button');
const mark = (page: Page) => stage(page).locator('[data-rocket-mark]');
const count = (page: Page, n: number) =>
  stage(page).getByText(`보낸 메일 ${n}통`);

// 앱이 그려지기 전의 입력은 버려진다. 단추가 보인 뒤에 시연을 멈춘다
const open = async (page: Page) => {
  await page.goto('/motion/rocket-button');
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
      const m = document.querySelector('[data-rocket-mark]');
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
    while (performance.now() - t0 < 7000) {
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      const layer = document.querySelector('[data-rocket-layer]');
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
    while (markOpacity() < 1 && performance.now() - t0 < 9000)
      await new Promise((r) => requestAnimationFrame(() => r(null)));
    return { samples, box, statusDuring, statusAfter: statusText() };
  });

test.describe('로켓 전송 상세 (1440px)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('이름과 줄이기 글과 Props가 있다', async ({ page }) => {
    await page.goto('/motion/rocket-button');
    await expect(
      page.getByRole('heading', { level: 1, name: 'RocketButton' })
    ).toBeVisible();
    await expect(send(page)).toBeVisible();
    await expect(page.getByText('움직임 줄이기에서는').first()).toContainText(
      '비행 없이 단추가 "보냈어요"로 바뀝니다.'
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
    // 발사(3초)가 시작된 뒤에는 x는 줄지 않고 y는 늘지 않으며 점점 작아진다(떠오름의 넘침과 둥실은 위아래로 오간다)
    const flight = samples.filter((s) => s.t > 3200);
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
    await expect(page.locator('[data-rocket-layer]')).toHaveCount(0);
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
    await expect(mark(page)).toHaveCSS('opacity', '1', { timeout: 12_000 });
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
        const layer = document.querySelector('[data-rocket-layer]');
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
    await expect(mark(page)).toHaveCSS('opacity', '1', { timeout: 12_000 });
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
    await expect(mark(page)).toHaveCSS('opacity', '1', { timeout: 12_000 });
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
    await expect(page.locator('[data-rocket-layer]')).toHaveCount(1);
    await expect(mark(page)).toBeFocused();
    await expect(page.locator('[data-rocket-layer]')).toHaveCount(0, {
      timeout: 12_000,
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
    await expect(page.locator('[data-rocket-layer]')).toHaveCount(0);
    await expect(mark(page)).toHaveCount(0);
    await expect(count(page, 0)).toBeVisible();
  });

  test('다시 단추가 처음 상태로 돌린다', async ({ page }) => {
    await open(page);
    await send(page).click();
    await expect(mark(page)).toHaveCSS('opacity', '1', { timeout: 12_000 });
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

test.describe('로켓 전송 상세 유체 연기 (1440px)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('WebGL2와 float 렌더 확장이 있다(없으면 연기 없는 길로 조용히 통과하지 않게 실패한다)', async ({
    page,
  }) => {
    await page.goto('/motion/rocket-button');
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
        // 연기 canvas만 본다(불꽃은 DOM이라 비행 층 안에 canvas가 없다)
        const canvas =
          [...region.querySelectorAll('canvas')].find(
            (c) => !c.closest('[data-rocket-layer]')
          ) ?? null;
        const layer = document.querySelector('[data-rocket-layer]');
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
        // 점화로 연기가 나온 뒤(0.9초) 되돌린다
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

test.describe('로켓 전송 상세 움직임 줄이기 (1440px)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('비행 없이 단추가 표지로 바뀐다', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/motion/rocket-button');
    await expect(send(page)).toBeVisible();
    const sawLayer = await send(page).evaluate(async (button) => {
      (button as HTMLButtonElement).click();
      let seen = false;
      for (let i = 0; i < 20; i++) {
        await new Promise((r) => requestAnimationFrame(() => r(null)));
        if (document.querySelector('[data-rocket-layer], [data-rocket]'))
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
  await page.goto('/motion/rocket-button');
  await expect(send(page)).toBeVisible();
  await stage(page).getByRole('button', { name: '시연 멈춤' }).click();
  await page.clock.runFor(100);
  // install만으로는 시계가 실시간으로 흐른다. 여기서 멈춰 runFor로만 흐르게 한다
  await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 1000);
  await page.mouse.move(2, 2);
};
const cloneBox = (page: Page) =>
  page.evaluate(() => {
    const clone = document.querySelector('[data-rocket-layer] button');
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

// 복제본 상자(craft)의 회전각(도, 시계 방향 +)
const craftAngle = (page: Page) =>
  page.evaluate(() => {
    const craft = document.querySelector(
      '[data-rocket-layer]'
    )?.firstElementChild;
    if (!craft) return null;
    const m = new DOMMatrixReadOnly(getComputedStyle(craft).transform);
    return (Math.atan2(m.b, m.a) * 180) / Math.PI;
  });

// 불꽃 요소의 화면 높이(px). 길이는 scaleY로만 바뀌니 기울지 않는 구간(발사 전)에서는 높이가 곧 길이다
const flameHeights = (page: Page) =>
  page.evaluate(() =>
    [
      ...document.querySelectorAll<HTMLElement>(
        '[data-rocket-layer] [data-rocket-flame]'
      ),
    ].map((flame) => flame.getBoundingClientRect().height)
  );

test.describe('로켓 전송 상세 로켓 박자 (1440px)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('점화 동안은 제자리에서 떨고 약 24px 떠올라 넘쳤다 앉으며 1~2px 둥실거린다', async ({
    page,
  }) => {
    await freeze(page);
    const rest = (await send(page).boundingBox())!;
    await send(page).evaluate((b) => (b as HTMLButtonElement).click());
    const to = clockTo(page);
    // 점화(0~600ms): 뜨지 않고 1px 안으로만 떤다
    for (let ms = 50; ms <= 550; ms += 100) {
      const box = (await to(ms))!;
      expect(Math.abs(box.y - rest.y)).toBeLessThan(1.2);
      expect(Math.abs(box.x - rest.x)).toBeLessThan(1.2);
    }
    // 떠오름(600~1100ms): 목표 24px를 3px쯤 넘쳤다가(약 900ms) 24px 자리에 앉는다
    const rise: number[] = [];
    for (let ms = 600; ms <= 1100; ms += 50) {
      rise.push(rest.y - (await to(ms))!.y);
    }
    expect(Math.max(...rise)).toBeGreaterThan(26);
    expect(Math.max(...rise)).toBeLessThan(28.5);
    expect(rise.at(-1)!).toBeGreaterThan(23);
    expect(rise.at(-1)!).toBeLessThan(25);
    // 둥실(1100~3000ms): 24px 둘레에서 1~2px 오가고 옆으로 가지 않으며 기울지 않는다
    const hover: number[] = [];
    for (let ms = 1300; ms <= 2900; ms += 100) {
      const box = (await to(ms))!;
      hover.push(rest.y - box.y);
      expect(Math.abs(box.x - rest.x)).toBeLessThan(0.75);
    }
    expect(Math.max(...hover) - Math.min(...hover)).toBeGreaterThan(1.5);
    expect(Math.max(...hover)).toBeLessThan(26);
    expect(Math.min(...hover)).toBeGreaterThan(22);
    expect(Math.abs((await craftAngle(page))!)).toBeLessThan(0.5);
  });

  test('발사는 곧게 위로 가속하며 서서히 오른쪽으로 휘고 기울기가 속도 방향을 따라 20도를 넘지 않으며 보냈어요가 남는다', async ({
    page,
  }) => {
    await freeze(page);
    const rest = (await send(page).boundingBox())!;
    await send(page).evaluate((b) => (b as HTMLButtonElement).click());
    const to = clockTo(page);
    await to(3000);
    const samples: { x: number; y: number; angle: number }[] = [];
    for (let ms = 3100; ms <= 4900; ms += 100) {
      const box = (await to(ms))!;
      samples.push({
        x: box.x + box.w / 2,
        y: box.y + box.h / 2,
        angle: (await craftAngle(page))!,
      });
    }
    // 위로 간다: y는 줄고 속도(100ms당 거리)는 계속 늘어난다
    const steps = samples.slice(1).map((s, i) => ({
      dx: s.x - samples[i].x,
      dy: samples[i].y - s.y,
    }));
    // 가짜 시계의 프레임이 16ms 단위로 끊겨 100ms 한 걸음끼리는 오차가 속도 증가분보다 클 수 있다. 600ms씩 세 구간의 이동 거리로 본다
    const travel = (from: number, to: number) =>
      steps
        .slice(from, to)
        .reduce((sum, step) => sum + Math.hypot(step.dx, step.dy), 0);
    expect(travel(6, 12)).toBeGreaterThan(travel(0, 6));
    expect(travel(12, 18)).toBeGreaterThan(travel(6, 12));
    // 처음엔 곧게(x가 거의 안 변함) 가다 늦게 휜다: x는 줄지 않고 마지막 구간의 옆 이동이 처음 구간의 열 배를 넘는다
    for (const s of steps) expect(s.dx).toBeGreaterThanOrEqual(-0.5);
    expect(steps.at(-1)!.dx).toBeGreaterThan(Math.max(steps[0].dx, 0.3) * 10);
    expect(samples.at(-1)!.x - rest.x).toBeGreaterThan(20);
    expect(rest.y - samples.at(-1)!.y).toBeGreaterThan(200);
    // 기울기: 처음엔 곧고 휘면서 커지며 20도를 넘지 않는다. 속도가 곧을 때는 작고 많이 휘었을 때는 속도 방향과 가깝다
    expect(Math.abs(samples[1].angle)).toBeLessThan(3);
    for (const s of samples) {
      expect(s.angle).toBeGreaterThanOrEqual(-0.5);
      expect(s.angle).toBeLessThanOrEqual(20.5);
    }
    const mid = samples[Math.floor(samples.length / 2)].angle;
    expect(mid).toBeGreaterThan(samples[1].angle + 1);
    expect(samples.at(-1)!.angle).toBeGreaterThan(mid);
    // 속도 방향(atan2): 마지막 구간의 방향과 20도로 묶인 기울기가 같은 쪽을 향한다
    const last = steps.at(-1)!;
    const heading = (Math.atan2(last.dx, last.dy) * 180) / Math.PI;
    expect(heading).toBeGreaterThan(10);
    expect(
      Math.abs(samples.at(-1)!.angle - Math.min(20, heading))
    ).toBeLessThan(5);
    // 5000ms에 비행이 끝나고 표지가 남는다
    await to(5500);
    await expect(page.locator('[data-rocket-layer]')).toHaveCount(0);
    await expect(mark(page)).toHaveText('보냈어요');
    await expect(mark(page)).toHaveCSS('opacity', '1');
    await expect(count(page, 1)).toBeVisible();
  });

  test('분사구 둘과 불꽃 둘이 보이고 불꽃은 점화에서 자라 떠오르면 길어지고 발사 속도와 함께 더 길어진다', async ({
    page,
  }) => {
    await freeze(page);
    await send(page).evaluate((b) => (b as HTMLButtonElement).click());
    const to = clockTo(page);
    await to(50);
    const parts = await page.evaluate(() => {
      const layer = document.querySelector('[data-rocket-layer]')!;
      const clone = layer.querySelector('button')!.getBoundingClientRect();
      const nozzles = [
        ...layer.querySelectorAll<HTMLElement>('[data-rocket-nozzle]'),
      ];
      const flames = [
        ...layer.querySelectorAll<HTMLElement>('[data-rocket-flame]'),
      ];
      const style = (el: HTMLElement) => getComputedStyle(el);
      return {
        nozzles: nozzles.length,
        flames: flames.length,
        // 분사구는 단추 밑면 아래로 조금 나와 있고 폭의 1/3, 2/3 자리다
        nozzleBelow: nozzles.map(
          (n) => n.getBoundingClientRect().bottom - clone.bottom
        ),
        nozzleAt: nozzles.map(
          (n) =>
            ((n.getBoundingClientRect().left +
              n.getBoundingClientRect().right) /
              2 -
              clone.left) /
            clone.width
        ),
        // 불꽃은 분사구 끝에서 시작해 아래로 뻗고 흰 심지가 안에 있다
        flameTopGap: flames.map(
          (f, i) =>
            f.getBoundingClientRect().top -
            nozzles[i].getBoundingClientRect().bottom
        ),
        gradient: flames.map((f) => style(f).backgroundImage),
        core: flames.map((f) => !!f.firstElementChild),
        layout: flames.map((f) => style(f).transformOrigin),
        visible: flames.map(
          (f) => style(f).visibility === 'visible' && style(f).opacity === '1'
        ),
      };
    });
    expect(parts.nozzles).toBe(2);
    expect(parts.flames).toBe(2);
    parts.nozzleBelow.forEach((d) => {
      expect(d).toBeGreaterThan(3);
      expect(d).toBeLessThan(14);
    });
    expect(parts.nozzleAt[0]).toBeCloseTo(1 / 3, 1);
    expect(parts.nozzleAt[1]).toBeCloseTo(2 / 3, 1);
    parts.flameTopGap.forEach((g) => expect(Math.abs(g)).toBeLessThan(1.5));
    parts.gradient.forEach((g) => expect(g).toContain('linear-gradient'));
    expect(parts.core).toEqual([true, true]);
    parts.layout.forEach((origin) => expect(origin.split(' ')[1]).toBe('0px'));
    expect(parts.visible).toEqual([true, true]);

    // 길이: 점화에서 자라 발사대에 닿고, 떠 있으면 더 길고, 발사 속도와 함께 더 길어진다(기울기가 작은 구간만 높이로 잰다)
    const ignite = (await to(200), (await flameHeights(page))[0]);
    const seated = (await to(580), (await flameHeights(page))[0]);
    const floating = (await to(2000), (await flameHeights(page))[0]);
    const launching = (await to(3600), (await flameHeights(page))[0]);
    const fast = (await to(4500), (await flameHeights(page))[0]);
    expect(ignite).toBeGreaterThan(5);
    expect(seated).toBeGreaterThan(ignite);
    expect(floating).toBeGreaterThan(seated + 10);
    expect(launching).toBeGreaterThan(floating - 6);
    expect(fast).toBeGreaterThan(floating + 25);
  });

  test('둥실 동안 불꽃 길이가 떨린다', async ({ page }) => {
    await freeze(page);
    await send(page).evaluate((b) => (b as HTMLButtonElement).click());
    const to = clockTo(page);
    await to(1500);
    const heights: number[] = [];
    for (let ms = 1550; ms <= 2100; ms += 50) {
      await to(ms);
      heights.push((await flameHeights(page))[0]);
    }
    expect(Math.max(...heights) - Math.min(...heights)).toBeGreaterThan(2);
  });

  test('비행 중 다시 눌러도 두 번째 비행은 없고 끝 모양이 같다', async ({
    page,
  }) => {
    await freeze(page);
    await send(page).evaluate((b) => (b as HTMLButtonElement).click());
    const to = clockTo(page);
    await to(1100);
    // 날아가는 중 보이지 않는 원래 단추에 click이 와도(Enter 암묵 제출 등) 무시한다
    await original(page).evaluate((b) => (b as HTMLButtonElement).click());
    await to(1200);
    await expect(page.locator('[data-rocket-layer]')).toHaveCount(1);
    await expect(page.locator('[data-rocket-layer] button')).toHaveCount(1);
    await to(5500);
    await expect(page.locator('[data-rocket-layer]')).toHaveCount(0);
    await expect(mark(page)).toHaveCount(1);
    await expect(mark(page)).toHaveText('보냈어요');
    await expect(count(page, 1)).toBeVisible();
  });
});

test.describe('로켓 전송 상세 three 없음 (1440px)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('가리키고 포커스하고 눌러 끝까지 날아도 three 요청이 나가지 않고 로켓 canvas도 없다', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    const requests: string[] = [];
    page.on('request', (request) => requests.push(request.url()));
    await open(page);
    await send(page).hover();
    await send(page).focus();
    await send(page).click();
    // 비행 중에 비행 층 안에는 canvas가 없다(불꽃은 DOM이다)
    await expect(page.locator('[data-rocket-layer]')).toHaveCount(1);
    expect(await page.locator('[data-rocket-layer] canvas').count()).toBe(0);
    await expect(page.locator('[data-rocket-layer]')).toHaveCount(0, {
      timeout: 12_000,
    });
    expect(requests.filter((url) => /three/i.test(url))).toEqual([]);
  });
});
