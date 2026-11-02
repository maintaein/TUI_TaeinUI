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
    // 오른쪽 위로 간다: x는 늘고(위가 먼저라 휨은 비행 거리의 약 1/4) y는 준다
    expect(last.x).toBeGreaterThan(first.x + 40);
    expect(last.y).toBeLessThan(first.y - 100);
    // 발사(2.6초)가 시작된 뒤에는 x는 줄지 않고 y는 늘지 않으며 점점 작아진다(떠오름의 넘침과 둥실은 위아래로 오간다)
    const flight = samples.filter((s) => s.t > 2800);
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
    // 소프트웨어 GL에서는 화면 그리기가 프레임당 100ms쯤이라 엔진 수명(시뮬레이션 시간 3초, 프레임당 최대 33ms)이 벽시계로 길어진다
    test.setTimeout(90_000);
    // 셰이더(연기 음영, 배기 기둥, 분출 광휘)가 컴파일되지 않으면 엔진이 조용히 null이 되므로 콘솔 오류를 따로 본다
    const shaderErrors: string[] = [];
    page.on('console', (m) => {
      if (m.type() === 'error' && /shader|glsl|compile|link/i.test(m.text()))
        shaderErrors.push(m.text());
    });
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
      while (performance.now() - t0 < 25_000) {
        await frame();
        n += 1;
        // 연기 canvas만 본다(분출은 DOM이라 비행 층 안에 canvas가 없다)
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
    expect(shaderErrors).toEqual([]);
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
        // 분출이 시작돼 연기가 나온 뒤(1.4초) 되돌린다
        await wait(1400);
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

// 심지 요소의 길이(px). 엔진이 빛을 그리면 DOM 심지는 숨어(display none) 화면 높이가 0이고 계산된 transform도 none이라, 높이와 GSAP이 쓴 인라인 scaleY로 센다.
// 길이는 scaleY로만 바뀌니 기울지 않는 구간(발사 전)에서는 이것이 곧 길이다
const wickHeights = (page: Page) =>
  page.evaluate(() =>
    [
      ...document.querySelectorAll<HTMLElement>(
        '[data-rocket-layer] [data-rocket-wick]'
      ),
    ].map(
      (wick) =>
        parseFloat(wick.style.height) * new DOMMatrix(wick.style.transform).d
    )
  );

// 화면의 한 상자(CSS px)를 찍어 픽셀을 읽는다. 가짜 시계가 서 있어 Playwright의 요소 스크린샷이 안정 대기에 걸리므로 clip을 쓴다.
// 반환은 [r, g, b, a]를 한 줄로 편 배열과 폭
const pixelsOf = async (
  page: Page,
  box: { x: number; y: number; width: number; height: number }
) => {
  const png = await page.screenshot({
    clip: box,
    animations: 'allow',
    timeout: 60_000,
  });
  return page.evaluate(
    async ([b64]) => {
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const image = await createImageBitmap(
        new Blob([bytes], { type: 'image/png' })
      );
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(image, 0, 0);
      return {
        data: Array.from(
          ctx.getImageData(0, 0, canvas.width, canvas.height).data
        ),
        width: canvas.width,
      };
    },
    [png.toString('base64')]
  );
};

// 입 하나의 화면 상자(발사 전이라 기울기가 없다)
const mouthBox = (page: Page, side: 0 | 1) =>
  page.evaluate((i) => {
    const mouths = document.querySelectorAll(
      '[data-rocket-layer] [data-rocket-mouth]'
    );
    const r = mouths[i].getBoundingClientRect();
    return { x: r.left, y: r.top, width: r.width, height: r.height };
  }, side);

test.describe('로켓 전송 상세 로켓 박자 (1440px)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  // 분사구 하나가 단추 몸체 밑면 아래로 삐져나온 높이(px). 몸체 뒤에 깔려 있어 몸체에 가려진 만큼은 세지 않는다
  const nozzleView = (page: Page) =>
    page.evaluate(() => {
      const layer = document.querySelector('[data-rocket-layer]')!;
      const clone = layer.querySelector('button')!.getBoundingClientRect();
      const nozzle = layer.querySelector<HTMLElement>('[data-rocket-nozzle]')!;
      const box = nozzle.getBoundingClientRect();
      const body = layer.querySelector('button')!.parentElement!;
      return {
        below: Math.max(0, box.bottom - clone.bottom),
        height: box.height,
        // 몸체(복제본)보다 문서 순서가 앞 = 쌓임 순서가 아래
        behindBody: !!(
          nozzle.compareDocumentPosition(body) &
          Node.DOCUMENT_POSITION_FOLLOWING
        ),
        zIndex: getComputedStyle(nozzle).zIndex,
        thrust: getComputedStyle(layer.firstElementChild!).getPropertyValue(
          '--rocket-thrust'
        ),
      };
    });

  test('분사구가 몸체 뒤에서 아래 테두리로 서서히 빠져나오고 그동안 분출도 연기도 없고 단추는 제자리다', async ({
    page,
  }) => {
    await freeze(page);
    const rest = (await send(page).boundingBox())!;
    await send(page).evaluate((b) => (b as HTMLButtonElement).click());
    const to = clockTo(page);
    const views = [];
    for (const ms of [50, 150, 250, 350, 450, 550, 600]) {
      const box = (await to(ms))!;
      expect(Math.abs(box.y - rest.y)).toBeLessThan(0.75);
      expect(Math.abs(box.x - rest.x)).toBeLessThan(0.75);
      // 분출은 아직 없다(심지 scaleY 0, 세기 0)
      expect(await wickHeights(page)).toEqual([0, 0]);
      views.push(await nozzleView(page));
    }
    for (const view of views) {
      // 몸체 뒤(쌓임 순서가 아래, z-index를 올리지 않음)이고 아래로 삐져나온 만큼만 보인다
      expect(view.behindBody).toBe(true);
      expect(view.zIndex).toBe('auto');
      expect(Number(view.thrust)).toBe(0);
      expect(view.below).toBeLessThanOrEqual(view.height + 0.5);
    }
    // 처음엔 아래로 거의 안 삐져나오고(몸체에 가려짐) 단조로 늘어 600ms에 덩이 높이 8px에서 가려진 3px를 뺀 5px 안팎이다
    expect(views[0].below).toBeLessThan(1);
    for (let i = 1; i < views.length; i++)
      expect(views[i].below).toBeGreaterThanOrEqual(views[i - 1].below);
    expect(views.at(-1)!.below).toBeGreaterThan(4);
    expect(views.at(-1)!.below).toBeLessThan(6.5);
    // 이 구간에는 연기 canvas도 아직 비어 있다는 것은 아래 땅 연기 시험이 본다
  });

  test('분출이 서서히 올라 짧은 심지가 자라고(단추 높이의 0.2~0.5배) 빠르게 깜빡이며 그동안에도 단추는 발사대에 머문다', async ({
    page,
  }) => {
    await freeze(page);
    const rest = (await send(page).boundingBox())!;
    await send(page).evaluate((b) => (b as HTMLButtonElement).click());
    const to = clockTo(page);
    const lengths: number[] = [];
    for (const ms of [700, 1200, 1800, 2400]) {
      const box = (await to(ms))!;
      expect(Math.abs(box.y - rest.y)).toBeLessThan(0.75);
      expect(Math.abs(box.x - rest.x)).toBeLessThan(0.75);
      expect(Math.abs((await craftAngle(page))!)).toBeLessThan(0.5);
      lengths.push((await wickHeights(page))[0]);
    }
    // 서서히: 처음엔 거의 0이고 계속 자라되 짧은 심지다(단추 높이의 0.55배 안쪽, 깜빡임 +-10%를 넘지 않는다)
    expect(lengths[0]).toBeGreaterThan(0);
    expect(lengths[0]).toBeLessThan(rest.height * 0.3);
    for (let i = 1; i < lengths.length; i++)
      expect(lengths[i]).toBeGreaterThan(lengths[i - 1] - 1);
    expect(lengths.at(-1)!).toBeLessThanOrEqual(rest.height * 0.55 + 0.5);
    expect(lengths.at(-1)!).toBeGreaterThan(rest.height * 0.35);
    // 켜진 동안 길이가 빠르게 떨린다(약 50ms, 82ms 주기)
    const flicker: number[] = [];
    for (let ms = 2450; ms <= 2600; ms += 17) {
      await to(ms);
      flicker.push((await wickHeights(page))[0]);
    }
    expect(Math.max(...flicker) - Math.min(...flicker)).toBeGreaterThan(0.8);
  });

  test('발사는 곧게 위로 무겁게 가속하며 서서히 오른쪽으로 휘고 기울기가 속도 방향을 따라 20도를 넘지 않으며 보냈어요가 남는다', async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await freeze(page);
    const rest = (await send(page).boundingBox())!;
    await send(page).evaluate((b) => (b as HTMLButtonElement).click());
    const to = clockTo(page);
    await to(2600);
    const samples: { x: number; y: number; angle: number }[] = [];
    for (let ms = 2700; ms <= 5000; ms += 100) {
      const box = (await to(ms))!;
      samples.push({
        x: box.x + box.w / 2,
        y: box.y + box.h / 2,
        angle: (await craftAngle(page))!,
      });
    }
    const steps = samples.slice(1).map((s, i) => ({
      dx: s.x - samples[i].x,
      dy: samples[i].y - s.y,
    }));
    // 가짜 시계의 프레임이 16ms 단위로 끊겨 100ms 한 걸음끼리는 오차가 속도 증가분보다 클 수 있다. 일곱 걸음씩 세 구간의 이동 거리로 본다
    const travel = (from: number, to: number) =>
      steps
        .slice(from, to)
        .reduce((sum, step) => sum + Math.hypot(step.dx, step.dy), 0);
    expect(travel(7, 14)).toBeGreaterThan(travel(0, 7));
    expect(travel(14, 22)).toBeGreaterThan(travel(7, 14));
    // 처음엔 곧게 가다 늦게 휜다: x는 줄지 않고 마지막 걸음의 옆 이동이 처음 걸음의 열 배를 넘는다
    for (const s of steps) expect(s.dx).toBeGreaterThanOrEqual(-0.5);
    expect(steps.at(-1)!.dx).toBeGreaterThan(Math.max(steps[0].dx, 0.3) * 10);
    expect(samples.at(-1)!.x - rest.x).toBeGreaterThan(20);
    expect(rest.y - samples.at(-1)!.y).toBeGreaterThan(150);
    // 기울기: 처음엔 곧고 휘면서 커지며 20도를 넘지 않는다
    expect(Math.abs(samples[1].angle)).toBeLessThan(3);
    for (const s of samples) {
      expect(s.angle).toBeGreaterThanOrEqual(-0.5);
      expect(s.angle).toBeLessThanOrEqual(20.5);
    }
    const mid = samples[Math.floor(samples.length / 2)].angle;
    expect(mid).toBeGreaterThan(samples[1].angle + 1);
    expect(samples.at(-1)!.angle).toBeGreaterThan(mid);
    // 속도 방향(atan2): 마지막 걸음의 방향과 20도로 묶인 기울기가 같은 쪽을 향한다
    const last = steps.at(-1)!;
    const heading = (Math.atan2(last.dx, last.dy) * 180) / Math.PI;
    expect(heading).toBeGreaterThan(10);
    expect(
      Math.abs(samples.at(-1)!.angle - Math.min(20, heading))
    ).toBeLessThan(5);
    // 5100ms에 비행이 끝나고 표지가 남는다
    await to(5600);
    await expect(page.locator('[data-rocket-layer]')).toHaveCount(0);
    await expect(mark(page)).toHaveText('보냈어요');
    await expect(mark(page)).toHaveCSS('opacity', '1');
    await expect(count(page, 1)).toBeVisible();
  });

  test('분사구 둘이 단추 폭 중심에서 좌우 30% 자리에 있고 입 색, 번짐, 몸체 밑면 빛이 분출 세기 하나를 따른다', async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await freeze(page);
    const width = (await send(page).boundingBox())!.width;
    await send(page).evaluate((b) => (b as HTMLButtonElement).click());
    const to = clockTo(page);
    const read = () =>
      page.evaluate((cloneWidth) => {
        const layer = document.querySelector('[data-rocket-layer]')!;
        const clone = layer.querySelector('button')!.getBoundingClientRect();
        const centre = (el: Element) => {
          const r = el.getBoundingClientRect();
          return (r.left + r.right) / 2;
        };
        const nozzles = [...layer.querySelectorAll('[data-rocket-nozzle]')];
        const mouths = [
          ...layer.querySelectorAll<HTMLElement>('[data-rocket-mouth]'),
        ];
        const glow = layer.querySelector<HTMLElement>(
          '[data-rocket-underglow]'
        )!;
        const style = getComputedStyle(mouths[0]);
        const n = nozzles[0].getBoundingClientRect();
        const m = mouths[0].getBoundingClientRect();
        return {
          nozzles: nozzles.length,
          mouths: mouths.length,
          nozzleAt: nozzles.map((el) => (centre(el) - clone.left) / cloneWidth),
          nozzleSize: [n.width, n.height],
          mouthSize: [m.width, m.height],
          mouthColor: style.backgroundColor,
          mouthShadow: style.boxShadow,
          glow: getComputedStyle(glow).backgroundImage,
          glowAria: !!glow.closest('[aria-hidden="true"]'),
          layerInert: layer.hasAttribute('inert'),
        };
      }, width);
    await to(300);
    const quiet = await read();
    await to(2590);
    const lit = await read();
    expect(lit.nozzles).toBe(2);
    expect(lit.mouths).toBe(2);
    // 중심에서 좌우 30%: 단추 폭의 20%, 80%
    expect(lit.nozzleAt[0]).toBeCloseTo(0.2, 1);
    expect(lit.nozzleAt[1]).toBeCloseTo(0.8, 1);
    // 약 14 x 8px 덩이와 7 x 2px 입(단추 높이 44px 기준)
    expect(lit.nozzleSize[0]).toBeCloseTo(14, 0);
    expect(lit.nozzleSize[1]).toBeCloseTo(8, 0);
    expect(lit.mouthSize[0]).toBeCloseTo(7, 0);
    expect(lit.mouthSize[1]).toBeCloseTo(2, 0);
    // 분출 전: 입은 무채색 gray이고 번짐이 없다. 분출이 오르면 분출 색(primary 300, 파란 계열)으로 섞이고 번짐이 생긴다
    // color-mix 결과는 `color(srgb 0.39 0.7 0.96)`처럼 0~1로 올 수 있어 0~255로 맞춘다
    const channels = (color: string) =>
      (color.match(/[\d.]+/g) ?? [])
        .map(Number)
        .slice(0, 3)
        .map((v) => (color.startsWith('color(') ? v * 255 : v));
    const [qr, , qb] = channels(quiet.mouthColor);
    expect(Math.abs(qr - qb)).toBeLessThan(6);
    // 번짐 반지름이 모두 0px이다
    expect(quiet.mouthShadow).toMatch(/(^|\s)0px 0px 0px 0px/);
    const [lr, , lb] = channels(lit.mouthColor);
    expect(lb - lr).toBeGreaterThan(80);
    expect(lit.mouthShadow).not.toBe('none');
    expect(lit.mouthShadow).toMatch(/\d+px/);
    // 몸체 밑면 빛은 장식(레이어가 aria-hidden, inert)이고 아래에서 위로 비추는 그라디언트다
    expect(lit.glow).toContain('linear-gradient');
    expect(lit.glowAria).toBe(true);
    expect(lit.layerInert).toBe(true);
    // 심지와 DOM 빛무리는 복제본 안에 있다
    expect(await wickHeights(page)).toHaveLength(2);
  });

  test('분출 중 입 아래 픽셀이 분출 색 계열로 밝고(빛무리) 분출 전에는 그렇지 않다', async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await freeze(page);
    await send(page).evaluate((b) => (b as HTMLButtonElement).click());
    const to = clockTo(page);
    // 입 아래 6~26px, 입 폭의 두 배 상자의 파란 기운(b - r)과 밝기
    const glowBelow = async () => {
      const m = await mouthBox(page, 0);
      const px = await pixelsOf(page, {
        x: m.x - m.width / 2,
        y: m.y + m.height + 6,
        width: m.width * 2,
        height: 20,
      });
      let blue = 0;
      let bright = 0;
      const n = px.data.length / 4;
      for (let i = 0; i < px.data.length; i += 4) {
        blue += px.data[i + 2] - px.data[i];
        bright += (px.data[i] + px.data[i + 1] + px.data[i + 2]) / 3;
      }
      return { blue: blue / n, bright: bright / n };
    };
    await to(580);
    const before = await glowBelow();
    await to(2590);
    const during = await glowBelow();
    // 분출 전은 흰 바탕이라 파란 기운이 없고, 분출이 다 오르면 둘레가 분출 색(파랑)으로 물든 채 밝다
    expect(before.blue).toBeLessThan(5);
    expect(during.blue).toBeGreaterThan(before.blue + 12);
    expect(during.bright).toBeGreaterThan(150);
  });

  test('연기에 빛과 그늘이 있다: 쌓인 연기에 밝은 면과 그늘 면이 둘 다 뚜렷하다', async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await freeze(page);
    const slot = (await send(page).boundingBox())!;
    await send(page).evaluate((b) => (b as HTMLButtonElement).click());
    const to = clockTo(page);
    await to(2590);
    // 땅 연기가 구르는 띠(단추 중심 왼쪽 90~260px, 단추 밑면 -10~140px). 입 빛무리에서 멀어 연기 색이 그대로다
    const px = await pixelsOf(page, {
      x: slot.x + slot.width / 2 - 260,
      y: slot.y + slot.height - 10,
      width: 170,
      height: 150,
    });
    const lum = (i: number) =>
      0.2126 * px.data[i] + 0.7152 * px.data[i + 1] + 0.0722 * px.data[i + 2];
    // 흰 바탕(255)에서 연기가 있는 픽셀(조금이라도 어두운 것)만 모은다
    const ls: number[] = [];
    for (let i = 0; i < px.data.length; i += 4) {
      const l = lum(i);
      if (l < 250) ls.push(l);
    }
    expect(ls.length).toBeGreaterThan(5000);
    const mean = ls.reduce((a, b) => a + b) / ls.length;
    const std = Math.sqrt(
      ls.reduce((a, b) => a + (b - mean) ** 2, 0) / ls.length
    );
    // 그늘 면(회색 토큰 쪽)과 밝은 면(흰색 토큰 쪽)이 둘 다 뚜렷하다. 예전의 "테두리 gray, 속 흰" 방식은 같은 장면에서
    // 가장 어두운 픽셀이 229, 밝기 표준편차가 4.5였고 그늘 면(215 미만)이 하나도 없었다
    expect(ls.filter((l) => l < 215).length).toBeGreaterThan(ls.length * 0.02);
    expect(ls.filter((l) => l >= 235).length).toBeGreaterThan(ls.length * 0.3);
    expect(Math.min(...ls)).toBeLessThan(212);
    expect(std).toBeGreaterThan(8);
  });

  test('땅 연기는 비행 전에 쌓이고 비행 중에도 같은 땅에서 줄지 않고 계속 생긴다', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await open(page);
    const result = await send(page).evaluate(async (button) => {
      const region = button.closest('[role="region"]') as HTMLElement;
      const slot = (button as HTMLElement).getBoundingClientRect();
      const copy = document.createElement('canvas');
      // 땅 근처: 단추 아래 분사구와 심지를 지나 땅(단추 밑면 아래 약 50px)을 감싸는 띠(폭은 단추 중심 좌우 150px)
      const band = {
        left: slot.left + slot.width / 2 - 150,
        right: slot.left + slot.width / 2 + 150,
        top: slot.bottom + 20,
        bottom: slot.bottom + 130,
      };
      const alphaInBand = (canvas: HTMLCanvasElement) => {
        const c = canvas.getBoundingClientRect();
        const k = canvas.width / c.width;
        const x0 = Math.max(0, Math.floor((band.left - c.left) * k));
        const x1 = Math.min(canvas.width, Math.ceil((band.right - c.left) * k));
        const y0 = Math.max(0, Math.floor((band.top - c.top) * k));
        const y1 = Math.min(
          canvas.height,
          Math.ceil((band.bottom - c.top) * k)
        );
        copy.width = canvas.width;
        copy.height = canvas.height;
        const ctx = copy.getContext('2d')!;
        ctx.drawImage(canvas, 0, 0);
        const { data } = ctx.getImageData(x0, y0, x1 - x0, y1 - y0);
        let sum = 0;
        for (let i = 3; i < data.length; i += 4) sum += data[i];
        return sum / 255;
      };
      const frame = () =>
        new Promise((r) => requestAnimationFrame(() => r(null)));
      const t0 = performance.now();
      (button as HTMLButtonElement).click();
      const peak = { early: 0, beforeLaunch: 0, flight: 0 };
      let layerGone = false;
      while (performance.now() - t0 < 7000 && !layerGone) {
        await frame();
        const t = performance.now() - t0;
        const canvas = [...region.querySelectorAll('canvas')].find(
          (c) => !c.closest('[data-rocket-layer]')
        );
        layerGone = t > 1000 && !document.querySelector('[data-rocket-layer]');
        if (!canvas) continue;
        const a = alphaInBand(canvas);
        // 분출이 시작되기 전(분사구가 나오는 동안)
        if (t < 550) peak.early = Math.max(peak.early, a);
        // 분출이 한참 오른 발사 직전
        else if (t > 1800 && t < 2600)
          peak.beforeLaunch = Math.max(peak.beforeLaunch, a);
        // 비행 중반 이후(로켓이 한참 올라간 때)
        else if (t > 3400) peak.flight = Math.max(peak.flight, a);
      }
      return peak;
    });
    // 분출 전에는 땅에 연기가 없고
    expect(result.early).toBe(0);
    // 발사 직전에는 쌓여 있고
    expect(result.beforeLaunch).toBeGreaterThan(50);
    // 비행 중에도 줄지 않는다(땅이 사라지지 않는다)
    expect(result.flight).toBeGreaterThanOrEqual(result.beforeLaunch * 0.9);
  });

  test('비행 중 다시 눌러도 두 번째 비행은 없고 끝 모양이 같다', async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await freeze(page);
    await send(page).evaluate((b) => (b as HTMLButtonElement).click());
    const to = clockTo(page);
    await to(1100);
    // 날아가는 중 보이지 않는 원래 단추에 click이 와도(Enter 암묵 제출 등) 무시한다
    await original(page).evaluate((b) => (b as HTMLButtonElement).click());
    await to(1200);
    await expect(page.locator('[data-rocket-layer]')).toHaveCount(1);
    await expect(page.locator('[data-rocket-layer] button')).toHaveCount(1);
    await to(5600);
    await expect(page.locator('[data-rocket-layer]')).toHaveCount(0);
    await expect(mark(page)).toHaveCount(1);
    await expect(mark(page)).toHaveText('보냈어요');
    await expect(count(page, 1)).toBeVisible();
  });
});
