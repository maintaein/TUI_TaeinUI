import { expect, test, type Page } from '@playwright/test';

/**
 * M7 Task 14: core 내부 유체 연기 엔진(`_internal/fluidSmoke`)을 시험용 화면(/e2e/smoke)에서
 * 실제 Chromium으로 돌린다. jsdom에는 WebGL이 없어 셰이더 컴파일·그리기·문맥 놓기는 여기서만 본다.
 * headless는 SwiftShader(소프트웨어 GL)라 프레임 속도는 의미가 없고, 정확성만 본다.
 * 프레임 예산은 실제 GPU 브라우저에서 따로 쟀다(task-14-report).
 */

// 앱이 그려지기 전의 입력은 버려진다. 시험 화면이 하네스를 달 때까지 기다린다
const open = async (page: Page) => {
  await page.goto('/e2e/smoke');
  await page.waitForFunction(() => !!window.__smoke);
};

test.describe('유체 연기 엔진', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('WebGL2와 float 렌더 확장이 있다(없으면 연기 없는 길로 조용히 통과하지 않게 실패한다)', async ({
    page,
  }) => {
    await open(page);
    const support = await page.evaluate(() => window.__smoke!.support());
    expect(support.webgl2).toBe(true);
    expect(support.floatRender).toBe(true);
    console.log(`WebGL renderer: ${support.renderer}`);
  });

  test('터진 뒤 몇 프레임 안에 캔버스에 알파가 0이 아닌 픽셀이 생긴다', async ({
    page,
  }) => {
    await open(page);
    // 만들고 바로 터뜨리고 수명을 잇는다(수명은 벽시계 3초라 await를 끼우면 부하에서 먼저 접힌다)
    const before = await page.evaluate(() => {
      window.__smoke!.create({ preserve: true });
      const empty = window.__smoke!.alphaPixels();
      window.__smoke!.burst(720, 450);
      window.__smoke!.keepAlive(720, 450);
      return empty;
    });
    // 만들자마자는 비어 있다
    expect(before).toBe(0);
    await page.waitForFunction(() => window.__smoke!.alphaPixels() > 0, null, {
      timeout: 20_000,
    });
    await page.evaluate(() => window.__smoke!.dispose());
  });

  test('터진 연기가 유체로 번진다(이류가 빠지면 주입 자리에 머문다)', async ({
    page,
  }) => {
    await open(page);
    // 엔진 수명은 벽시계 3초(마지막 주입 뒤)라 느린 기계에서는 퍼지기 전에 접힌다. 제자리 속도 0의
    // 작은 주입으로 수명만 잇는다(외접 상자는 주입 범위 안이라 퍼짐 판정에 섞이지 않는다)
    await page.evaluate(() => {
      window.__smoke!.create({ preserve: true });
      window.__smoke!.burst(720, 450);
      window.__smoke!.keepAlive(720, 450);
    });
    // 주입은 중심에서 spreadPx(60) + 방울 반지름 최대 28 * 1.2 안쪽이다. 이류가 없으면 알파 외접
    // 상자가 그 지름(약 187)을 가우시안 꼬리만큼(약 225) 넘지 못하고, 있으면 300 이상으로 번진다.
    // 프레임 수가 아니라 "넘는 순간"을 기다린다(느려도 통과, 이류가 빠져 영영 못 넘으면 실패)
    await page.waitForFunction(
      (limit) => {
        const { width, height } = window.__smoke!.alphaExtent(8);
        return Math.max(width, height) > limit;
      },
      2 * (60 + 28 * 1.2) * 1.5,
      { timeout: 20_000, polling: 250 }
    );
    await page.evaluate(() => window.__smoke!.dispose());
  });

  test('분사한 자리에도 연기가 생긴다', async ({ page }) => {
    await open(page);
    await page.evaluate(() => {
      window.__smoke!.create({ preserve: true });
      window.__smoke!.emit(400, 600, -400, 300);
      window.__smoke!.keepAlive(400, 600);
    });
    await page.waitForFunction(() => window.__smoke!.alphaPixels() > 0, null, {
      timeout: 20_000,
    });
    await page.evaluate(() => window.__smoke!.dispose());
  });

  test('흩어지면 캔버스를 DOM에서 떼고 문맥을 놓는다', async ({ page }) => {
    await open(page);
    // 만든 순간에는 붙어 있다. 부하로 느려도 접히기 전에 확인하도록 같은 evaluate에서 본다
    const attachedAtStart = await page.evaluate(() => {
      window.__smoke!.create({ preserve: true });
      window.__smoke!.burst(720, 450);
      return window.__smoke!.attached();
    });
    expect(attachedAtStart).toBe(true);
    // 최대 3초(+ 마지막 주입 + 프레임 여유)
    await page.waitForFunction(() => !window.__smoke!.attached(), null, {
      timeout: 15_000,
    });
    expect(await page.evaluate(() => window.__smoke!.contextLost())).toBe(true);
    await expect(page.locator('canvas[aria-hidden="true"]')).toHaveCount(0);
  });

  test('탭이 숨겨지면 접고 문맥을 놓는다', async ({ page }) => {
    await open(page);
    await page.evaluate(() => window.__smoke!.create({}));
    await page.evaluate(() => {
      // 헤드리스 탭은 실제로 숨길 수 없어 숨김 상태를 흉내 내 이벤트를 보낸다
      Object.defineProperty(document, 'hidden', {
        value: true,
        configurable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(await page.evaluate(() => window.__smoke!.attached())).toBe(false);
    expect(await page.evaluate(() => window.__smoke!.contextLost())).toBe(true);
  });

  test('dispose는 즉시 캔버스를 떼고 문맥을 놓는다', async ({ page }) => {
    await open(page);
    await page.evaluate(() => window.__smoke!.create({}));
    await page.evaluate(() => window.__smoke!.burst(720, 450));
    await page.evaluate(() => window.__smoke!.dispose());
    expect(await page.evaluate(() => window.__smoke!.attached())).toBe(false);
    expect(await page.evaluate(() => window.__smoke!.contextLost())).toBe(true);
  });

  test('20회 연속 생성·소멸해도 문맥 상한 경고가 없다', async ({ page }) => {
    const warnings: string[] = [];
    page.on('console', (message) => {
      if (/Too many active WebGL contexts/i.test(message.text())) {
        warnings.push(message.text());
      }
    });
    await open(page);
    // 동시 상한은 약 16이다. 정리가 안 되면 17번째부터 경고가 난다. 경고는 GPU 프로세스에서
    // 늦게 도착할 수 있어, 먼저 스무 개가 모두 놓였는지(결정적)를 본다
    expect(await page.evaluate(() => window.__smoke!.churn(20))).toEqual({
      made: 20,
      lost: 20,
    });
    await page.waitForTimeout(1000);
    expect(warnings).toEqual([]);
  });

  test('container를 주면 그 상자를 덮고 그 안에서 그려진다', async ({
    page,
  }) => {
    await open(page);
    const stage = page.getByTestId('stage');
    const canvas = stage.locator('canvas[aria-hidden="true"]');
    const stageBox = (await stage.boundingBox())!;
    // 만들고 바로 터뜨리고 수명을 잇는다(엔진 수명은 벽시계 3초라 아래 검사 사이에 부하에서 먼저 접힐 수 있다)
    await page.evaluate(
      ([x, y]) => {
        window.__smoke!.create({ stage: true, preserve: true });
        window.__smoke!.burst(x, y);
        window.__smoke!.keepAlive(x, y);
      },
      [stageBox.x + stageBox.width / 2, stageBox.y + stageBox.height / 2]
    );
    await expect(canvas).toHaveCount(1);
    const canvasBox = (await canvas.boundingBox())!;
    // 캔버스는 테두리 안쪽(padding box)을 덮는다
    const inner = await stage.evaluate((el) => [
      el.clientWidth,
      el.clientHeight,
    ]);
    expect(canvasBox.width).toBeCloseTo(inner[0], 0);
    expect(canvasBox.height).toBeCloseTo(inner[1], 0);
    await page.waitForFunction(() => window.__smoke!.alphaPixels() > 0);
    // 상자 안에 갇혀 포인터를 가로채지 않는다
    expect(
      await canvas.evaluate((el) => getComputedStyle(el).pointerEvents)
    ).toBe('none');
    await page.evaluate(() => window.__smoke!.dispose());
  });

  test('움직임 줄이기에서는 연기를 만들지 않는다', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page);
    expect(await page.evaluate(() => window.__smoke!.create({}))).toBe(false);
    await expect(page.locator('canvas[aria-hidden="true"]')).toHaveCount(0);
  });
});
