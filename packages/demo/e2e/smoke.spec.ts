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

  test('터뜨리면 캔버스에 알파가 0이 아닌 픽셀이 생긴다', async ({ page }) => {
    await open(page);
    // 만들고 터뜨리고 관찰까지 한 evaluate 안에서 한다(왕복 사이에 느린 부하로 연기가 먼저 끝나지 않게)
    const result = await page.evaluate(async () => {
      window.__smoke!.create({ preserve: true });
      const empty = window.__smoke!.alphaPixels();
      window.__smoke!.burst(720, 450);
      return { empty, drew: await window.__smoke!.untilAlpha() };
    });
    // 만들자마자는 비어 있다
    expect(result.empty).toBe(0);
    expect(result.drew).toBe(true);
    await page.evaluate(() => window.__smoke!.dispose());
  });

  test('터진 연기가 유체로 번진다(이류가 빠지면 주입 자리에 머문다)', async ({
    page,
  }) => {
    await open(page);
    // 주입은 중심에서 spreadPx(60) + 방울 반지름 최대 28 * 1.2 안쪽이다. 이류가 없으면 알파 외접
    // 상자가 그 지름(약 187)을 가우시안 꼬리만큼(약 225) 넘지 못하고, 있으면 300 이상으로 번진다.
    // 엔진 수명은 프레임당 상한 dt의 합(3초)이라 느려도 3초 몫의 프레임은 보장되고, 관찰은 페이지 안에서 한다
    const spread = await page.evaluate(
      async (limit) => {
        window.__smoke!.create({ preserve: true });
        window.__smoke!.burst(720, 450);
        return window.__smoke!.untilExtent(limit);
      },
      2 * (60 + 28 * 1.2) * 1.5
    );
    expect(spread).toBe(true);
    await page.evaluate(() => window.__smoke!.dispose());
  });

  test('분사한 자리에도 연기가 생긴다', async ({ page }) => {
    await open(page);
    const drew = await page.evaluate(async () => {
      window.__smoke!.create({ preserve: true });
      window.__smoke!.emit(400, 600, -400, 300);
      return window.__smoke!.untilAlpha();
    });
    expect(drew).toBe(true);
    await page.evaluate(() => window.__smoke!.dispose());
  });

  test('흩어지면 캔버스를 DOM에서 떼고 문맥을 놓는다', async ({ page }) => {
    test.setTimeout(90_000);
    // 프레임 비용은 캔버스 크기에 비례하고(1440x900은 4코어 두 작업자에서 프레임당 약 0.57초) 수명은 프레임 수(최소 90)로 정해진다.
    // 이 시험은 접힘 뒤 정리(캔버스 떼기, 문맥 놓기)만 보고 크기에 의존하는 단언이 없어, 제품 기본 경로(container 없음, body)는 두고 창만 줄인다
    await page.setViewportSize({ width: 480, height: 320 });
    await open(page);
    // 만든 순간에는 붙어 있다. 부하로 느려도 접히기 전에 확인하도록 같은 evaluate에서 본다
    const attachedAtStart = await page.evaluate(() => {
      window.__smoke!.create({ preserve: true });
      window.__smoke!.burst(240, 160);
      return window.__smoke!.attached();
    });
    expect(attachedAtStart).toBe(true);
    // 수명은 시뮬레이션 시간 3초(프레임당 최대 1/30초)라 최소 90프레임이다. 느린 소프트웨어 GL의
    // 병렬 부하에서 프레임당 수백 ms여도 끝나도록 넉넉히 기다린다
    await page.waitForFunction(() => !window.__smoke!.attached(), null, {
      timeout: 60_000,
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
    const stageBox = (await stage.boundingBox())!;
    // 만들고 터뜨리고 크기 확인과 관찰까지 한 evaluate 안에서 한다(왕복 사이에 연기가 먼저 끝나지 않게)
    const result = await page.evaluate(
      async ([x, y]) => {
        window.__smoke!.create({ stage: true, preserve: true });
        window.__smoke!.burst(x, y);
        const el = document.querySelector<HTMLElement>(
          '[data-testid="stage"]'
        )!;
        const cv = el.querySelector('canvas[aria-hidden="true"]')!;
        const rect = cv.getBoundingClientRect();
        return {
          canvasCount: el.querySelectorAll('canvas[aria-hidden="true"]').length,
          width: rect.width,
          height: rect.height,
          innerWidth: el.clientWidth,
          innerHeight: el.clientHeight,
          pointerEvents: getComputedStyle(cv).pointerEvents,
          drew: await window.__smoke!.untilAlpha(),
        };
      },
      [stageBox.x + stageBox.width / 2, stageBox.y + stageBox.height / 2]
    );
    expect(result.canvasCount).toBe(1);
    // 캔버스는 테두리 안쪽(padding box)을 덮는다
    expect(result.width).toBeCloseTo(result.innerWidth, 0);
    expect(result.height).toBeCloseTo(result.innerHeight, 0);
    expect(result.drew).toBe(true);
    // 상자 안에 갇혀 포인터를 가로채지 않는다
    expect(result.pointerEvents).toBe('none');
    await page.evaluate(() => window.__smoke!.dispose());
  });

  test('움직임 줄이기에서는 연기를 만들지 않는다', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page);
    expect(await page.evaluate(() => window.__smoke!.create({}))).toBe(false);
    await expect(page.locator('canvas[aria-hidden="true"]')).toHaveCount(0);
  });
});
