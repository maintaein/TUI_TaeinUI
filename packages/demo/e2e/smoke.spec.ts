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
    expect(
      await page.evaluate(() => window.__smoke!.create({ preserve: true }))
    ).toBe(true);
    // 만들자마자는 비어 있다
    expect(await page.evaluate(() => window.__smoke!.alphaPixels())).toBe(0);
    await page.evaluate(() => window.__smoke!.burst(720, 450));
    await page.waitForFunction(() => window.__smoke!.alphaPixels() > 0, null, {
      timeout: 2000,
    });
  });

  test('분사한 자리에도 연기가 생긴다', async ({ page }) => {
    await open(page);
    await page.evaluate(() => window.__smoke!.create({ preserve: true }));
    await page.evaluate(() => window.__smoke!.emit(400, 600, -400, 300));
    await page.waitForFunction(() => window.__smoke!.alphaPixels() > 0, null, {
      timeout: 2000,
    });
  });

  test('흩어지면 캔버스를 DOM에서 떼고 문맥을 놓는다', async ({ page }) => {
    await open(page);
    await page.evaluate(() => window.__smoke!.create({ preserve: true }));
    await page.evaluate(() => window.__smoke!.burst(720, 450));
    await page.waitForFunction(() => window.__smoke!.alphaPixels() > 0);
    expect(await page.evaluate(() => window.__smoke!.attached())).toBe(true);
    // 최대 3초(+ 마지막 주입 + 프레임 여유)
    await page.waitForFunction(() => !window.__smoke!.attached(), null, {
      timeout: 8000,
    });
    expect(await page.evaluate(() => window.__smoke!.contextLost())).toBe(true);
    await expect(page.locator('canvas[aria-hidden="true"]')).toHaveCount(0);
    // 그 뒤의 burst는 아무것도 하지 않는다(던지지도 되살리지도 않는다)
    await page.evaluate(() => window.__smoke!.burst(720, 450));
    await expect(page.locator('canvas[aria-hidden="true"]')).toHaveCount(0);
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
    await page.evaluate(() =>
      window.__smoke!.create({ stage: true, preserve: true })
    );
    const stage = page.getByTestId('stage');
    const canvas = stage.locator('canvas[aria-hidden="true"]');
    await expect(canvas).toHaveCount(1);
    const stageBox = (await stage.boundingBox())!;
    const canvasBox = (await canvas.boundingBox())!;
    // 캔버스는 테두리 안쪽(padding box)을 덮는다
    const inner = await stage.evaluate((el) => [
      el.clientWidth,
      el.clientHeight,
    ]);
    expect(canvasBox.width).toBeCloseTo(inner[0], 0);
    expect(canvasBox.height).toBeCloseTo(inner[1], 0);
    await page.evaluate(
      ([x, y]) => window.__smoke!.burst(x, y),
      [stageBox.x + stageBox.width / 2, stageBox.y + stageBox.height / 2]
    );
    await page.waitForFunction(() => window.__smoke!.alphaPixels() > 0);
    // 상자 안에 갇혀 포인터를 가로채지 않는다
    expect(
      await canvas.evaluate((el) => getComputedStyle(el).pointerEvents)
    ).toBe('none');
  });

  test('움직임 줄이기에서는 연기를 만들지 않는다', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page);
    expect(await page.evaluate(() => window.__smoke!.create({}))).toBe(false);
    await expect(page.locator('canvas[aria-hidden="true"]')).toHaveCount(0);
  });
});
