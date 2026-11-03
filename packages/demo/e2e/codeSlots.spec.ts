import { expect, test, type Page } from '@playwright/test';

const stage = (page: Page) =>
  page.getByRole('region', { name: 'CodeSlots 미리보기' });
const input = (page: Page) => stage(page).getByRole('textbox');
// 칸 그림(aria-hidden)의 칸들
const slots = (page: Page) => stage(page).locator('input + div > span');

// 앱이 그려지기 전의 입력은 버려진다. 입력이 보인 뒤에 시연을 멈추고 입력에 포커스를 둔다
const open = async (page: Page) => {
  await page.goto('/motion/code-slots');
  await expect(input(page)).toBeVisible();
  await stage(page).getByRole('button', { name: '시연 멈춤' }).click();
  await input(page).focus();
};

// 마우스가 무대에 들어와 시연이 넘어가기만 한 상태(멈춤 단추의 얼림은 CSS 키프레임을 처음 자세로 세운다)
const takeOver = async (page: Page) => {
  await page.goto('/motion/code-slots');
  await expect(input(page)).toBeVisible();
  await stage(page).hover();
  await input(page).focus();
};

// 칸 사이의 가로 간격(px)
const gapBetween = async (page: Page, a: number, b: number) => {
  const first = await slots(page).nth(a).boundingBox();
  const second = await slots(page).nth(b).boundingBox();
  return second!.x - (first!.x + first!.width);
};

// 칸 테두리 색을 rgb 정수로 읽는다(color-mix의 computed 값은 `color(srgb r g b)`나 oklab으로 온다)
const rgbOf = (c: string) => {
  const m = /^color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)\)$/.exec(c);
  return m ? m.slice(1, 4).map((v) => Math.round(Number(v) * 255)) : [c];
};
const borders = (page: Page) =>
  slots(page)
    .evaluateAll((els) => els.map((el) => getComputedStyle(el).borderTopColor))
    .then((all) => all.map(rgbOf));
// 기본 text.secondary(#717171), primary.main(#1976D2), error.main
const GRAY = [113, 113, 113];
const PRIMARY = [25, 118, 210];
const ERROR = [211, 47, 47];
// success.dark(#2E7D32)
const SUCCESS_DARK = 'rgb(46, 125, 50)';

// 색 문자열의 투명도. 불투명이면 알파가 적히지 않는다
const alphaOf = (color: string) => {
  const m =
    /\/\s*([\d.]+)\s*\)$/.exec(color) ??
    /^rgba\([^)]*,\s*([\d.]+)\)$/.exec(color);
  return m ? Number(m[1]) : 1;
};

interface Frame {
  t: number;
  cellBorder: number;
  cellBg: number;
  bundle: number;
  boxWidth: number;
  computedWidth: number;
  transform: string;
  gap: number;
  radius: number;
  outside: number;
}

// 프레임마다 첫 칸의 테두리·바탕 투명도, 묶음 불투명도·폭·변형, 칸 간격, 윤곽 밖으로 나온 칸의 길이를 모은다
const recordFrames = (page: Page) =>
  page.evaluate(() => {
    const w = window as unknown as { __frames: unknown[]; __stop: boolean };
    w.__frames = [];
    w.__stop = false;
    const alpha = (c: string) => {
      const m =
        /\/\s*([\d.]+)\s*\)$/.exec(c) ?? /^rgba\([^)]*,\s*([\d.]+)\)$/.exec(c);
      return m ? Number(m[1]) : 1;
    };
    const row = document.querySelector(
      '[aria-label="CodeSlots 미리보기"] input + div'
    ) as HTMLElement;
    const bundle = row.querySelector(':scope > div') as HTMLElement;
    const cells = [...row.querySelectorAll(':scope > span')] as HTMLElement[];
    const tick = () => {
      if (w.__stop) return;
      const bs = getComputedStyle(bundle);
      const box = bundle.getBoundingClientRect();
      const c0 = getComputedStyle(cells[0]);
      const gap =
        cells[1].getBoundingClientRect().left -
        cells[0].getBoundingClientRect().right;
      // 칸이 묶음 윤곽 밖으로 나온 가장 긴 길이
      const outside = Math.max(
        ...cells.map((c) => {
          const r = c.getBoundingClientRect();
          return Math.max(box.left - r.left, r.right - box.right, 0);
        })
      );
      w.__frames.push({
        t: performance.now(),
        cellBorder: alpha(c0.borderTopColor),
        cellBg: alpha(c0.backgroundColor),
        bundle: Number(bs.opacity) * alpha(bs.borderTopColor),
        boxWidth: box.width,
        computedWidth: parseFloat(bs.width),
        transform: bs.transform,
        gap,
        radius: parseFloat(bs.borderTopLeftRadius),
        outside,
      });
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

const takeFrames = (page: Page) =>
  page.evaluate(() => {
    const w = window as unknown as { __frames: unknown[]; __stop: boolean };
    w.__stop = true;
    return w.__frames;
  }) as Promise<Frame[]>;

test.describe('인증번호 슬롯 상세 (1440px)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('이름과 줄이기 글과 Props가 있다', async ({ page }) => {
    await page.goto('/motion/code-slots');
    await expect(
      page.getByRole('heading', { level: 1, name: 'CodeSlots' })
    ).toBeVisible();
    await expect(input(page)).toBeVisible();
    await expect(page.getByText('움직임 줄이기에서는').first()).toContainText(
      '맞으면 칸이 붙은 모양으로 바로 보입니다.'
    );
    await expect(page.getByText('onComplete').first()).toBeVisible();
  });

  test('키보드로 맞는 번호를 넣으면 성공 메시지가 서고 칸이 하나로 합쳐진다', async ({
    page,
  }) => {
    await open(page);
    await expect(slots(page)).toHaveCount(6);
    expect(await gapBetween(page, 0, 1)).toBeCloseTo(8, 0);

    await page.keyboard.type('111111');
    await expect(input(page)).toHaveValue('111111');
    await expect(stage(page).getByText('확인했습니다')).toBeVisible();
    await expect(input(page)).toHaveAttribute('aria-invalid', 'false');
    // 합쳐짐 전이(slower)가 끝나면 모든 칸 사이 간격이 0이다
    await expect.poll(() => gapBetween(page, 0, 1)).toBeCloseTo(0, 0);
    await expect.poll(() => gapBetween(page, 4, 5)).toBeCloseTo(0, 0);
    // 바깥 포커스 링은 없다(칸 줄도 칸도 outline이 없다). 합쳐진 뒤 칸은 투명해 포커스여도 테두리 색이 보이지 않는다
    const ring = await stage(page)
      .locator('input + div')
      .evaluate((el) => ({
        row: getComputedStyle(el).outlineStyle,
        radius: parseFloat(getComputedStyle(el).borderTopLeftRadius),
        cells: [...el.querySelectorAll(':scope > span')].map(
          (c) => getComputedStyle(c).outlineStyle
        ),
      }));
    expect(ring.row).toBe('none');
    expect(ring.radius).toBeGreaterThan(20);
    expect(ring.cells).toEqual(Array(6).fill('none'));
    // 합쳐진 알약: 칸의 테두리와 바탕은 투명하고 칸 뒤 묶음이 success 테두리와 알약 모서리를 가진다
    const end = await stage(page)
      .locator('input + div')
      .evaluate((el) => {
        const bundle = el.querySelector(':scope > div') as HTMLElement;
        const b = getComputedStyle(bundle);
        const cells = [...el.querySelectorAll(':scope > span')];
        return {
          cellBorders: cells.map((c) => getComputedStyle(c).borderTopColor),
          cellBgs: cells.map((c) => getComputedStyle(c).backgroundColor),
          bundleOpacity: b.opacity,
          bundleRadius: parseFloat(b.borderTopLeftRadius),
          bundleBorder: b.borderTopColor,
          bundleWidth: bundle.getBoundingClientRect().width,
          rowWidth: el.getBoundingClientRect().width,
        };
      });
    expect(end.cellBorders.every((c) => alphaOf(c) === 0)).toBe(true);
    expect(end.cellBgs.every((c) => alphaOf(c) === 0)).toBe(true);
    expect(end.bundleOpacity).toBe('1');
    expect(end.bundleRadius).toBeGreaterThan(20);
    expect(alphaOf(end.bundleBorder)).toBe(1);
    expect(end.bundleWidth).toBeCloseTo(6 * 48, 0);
    expect(end.bundleWidth).toBeCloseTo(end.rowWidth, 0);
  });

  test('합쳐진 뒤 포커스면 묶음 테두리가 success.dark 색 그대로 1px에서 2px로 굵어지고 링은 없다', async ({
    page,
  }) => {
    await open(page);
    await page.keyboard.type('111111');
    await expect.poll(() => gapBetween(page, 4, 5)).toBeCloseTo(0, 0);
    const bundle = stage(page).locator('input + div > div');
    const read = () =>
      bundle.evaluate((el) => {
        const s = getComputedStyle(el);
        return {
          width: s.borderTopWidth,
          color: s.borderTopColor,
          outline: s.outlineStyle,
          box: el.getBoundingClientRect().width,
        };
      });
    // 굵기 전이(fast)와 합쳐지며 줄어드는 폭이 끝나길 기다린다(폭이 아직 줄고 있으면 아래 비교가 그 차이를 잰다)
    await expect.poll(async () => (await read()).width).toBe('2px');
    await expect.poll(async () => (await read()).box).toBeCloseTo(6 * 48, 1);
    const focused = await read();
    expect(focused.color).toBe(SUCCESS_DARK);
    expect(focused.outline).toBe('none');
    await input(page).blur();
    await expect.poll(async () => (await read()).width).toBe('1px');
    const blurred = await read();
    expect(blurred.color).toBe(SUCCESS_DARK);
    expect(blurred.outline).toBe('none');
    // 굵기가 바뀌어도 레이아웃은 밀리지 않는다
    expect(blurred.box).toBe(focused.box);
  });

  test('합쳐지는 전이 어느 프레임에도 칸별 테두리와 묶음 테두리가 함께 불투명하지 않고, 폭이 scale 없이 줄며, 칸이 윤곽 밖으로 나오지 않는다', async ({
    page,
  }) => {
    await open(page);
    await recordFrames(page);
    await page.keyboard.type('111111');
    await expect(stage(page).getByText('확인했습니다')).toBeVisible();
    await page.waitForTimeout(1000);
    const frames = await takeFrames(page);
    // 칸 하나의 테두리·바탕 투명도 + 묶음 불투명도는 어느 프레임에서도 1을 넘지 않는다(둘이 겹쳐 짙어지는 프레임이 없다)
    for (const f of frames) {
      expect(f.cellBorder + f.bundle).toBeLessThanOrEqual(1.02);
      expect(f.cellBg + f.bundle).toBeLessThanOrEqual(1.02);
      expect(f.transform).toBe('none');
      expect(f.outside).toBeLessThanOrEqual(0.5);
      expect(f.computedWidth).toBeCloseTo(f.boxWidth, 0);
    }
    // 폭은 늘지 않고 줄기만 한다
    for (let i = 1; i < frames.length; i++)
      expect(frames[i].boxWidth).toBeLessThanOrEqual(
        frames[i - 1].boxWidth + 0.5
      );
    // 시작은 칸 테두리가 흐려지기 시작하는 첫 프레임이다
    const start = frames.find((f) => f.cellBorder < 0.99)!;
    const near = (ms: number) =>
      frames.reduce((best, f) =>
        Math.abs(f.t - start.t - ms) < Math.abs(best.t - start.t - ms)
          ? f
          : best
      );
    // ① 중간: 칸 테두리가 흐려지는 중이고 묶음이 나타나는 중이며 간격과 폭은 아직 그대로다
    const first = near(60);
    expect(first.cellBorder).toBeGreaterThan(0.02);
    expect(first.cellBorder).toBeLessThan(0.98);
    expect(first.bundle).toBeGreaterThan(0.02);
    expect(first.gap).toBeGreaterThan(7.5);
    expect(first.boxWidth).toBeGreaterThan(6 * 48 + 5 * 8 - 1);
    // ①과 ② 경계 근처: 칸 테두리는 거의 사라졌고 묶음은 거의 다 나타났으며 모임은 막 시작한다
    const edge = near(205);
    expect(edge.cellBorder).toBeLessThan(0.1);
    expect(edge.bundle).toBeGreaterThan(0.9);
    expect(edge.gap).toBeGreaterThan(3);
    // ② 중간: 간격이 줄고 묶음의 실제 폭이 그만큼 줄며 알약으로 둥글어지는 중이다
    const second = near(450);
    expect(second.cellBorder).toBeLessThan(0.02);
    expect(second.gap).toBeGreaterThan(0.05);
    expect(second.gap).toBeLessThan(6);
    expect(second.boxWidth).toBeLessThan(6 * 48 + 5 * 8 - 3);
    expect(second.boxWidth).toBeGreaterThan(6 * 48);
    expect(second.boxWidth).toBeCloseTo(6 * 48 + 5 * second.gap, 0);
    expect(second.radius).toBeGreaterThan(9);
    const last = frames[frames.length - 1];
    expect(last.gap).toBeCloseTo(0, 0);
    expect(last.boxWidth).toBeCloseTo(6 * 48, 0);
    expect(last.radius).toBeGreaterThan(20);
  });

  test('성공이 풀리면 같은 길을 거꾸로 간다(② 뒤 ①)', async ({ page }) => {
    await open(page);
    await page.keyboard.type('111111');
    await expect.poll(() => gapBetween(page, 0, 1)).toBeCloseTo(0, 0);
    await recordFrames(page);
    await page.keyboard.press('Backspace');
    await expect(input(page)).toHaveValue('11111');
    await page.waitForTimeout(1000);
    const frames = await takeFrames(page);
    for (const f of frames) {
      expect(f.cellBorder + f.bundle).toBeLessThanOrEqual(1.02);
      expect(f.transform).toBe('none');
      expect(f.outside).toBeLessThanOrEqual(0.5);
    }
    // 칸 테두리가 돌아오기(①) 시작할 때 간격은 이미 다 벌어져 있다(② 먼저)
    const returning = frames.find((f) => f.cellBorder > 0.05)!;
    expect(returning.gap).toBeGreaterThan(7.5);
    // 간격이 벌어지는 동안은 칸 테두리가 아직 투명하다
    const opening = frames.find((f) => f.gap > 1 && f.gap < 6)!;
    expect(opening.cellBorder).toBeLessThan(0.05);
    const last = frames[frames.length - 1];
    expect(last.gap).toBeCloseTo(8, 0);
    expect(last.cellBorder).toBeCloseTo(1, 1);
    expect(last.bundle).toBe(0);
  });

  test('틀린 번호는 오류 메시지와 aria-invalid로 알리고 칸이 물결친다', async ({
    page,
  }) => {
    await takeOver(page);
    // 칸마다 프레임별 가로 이동량(px)을 모은다. 흔들림은 0.5초라 끝난 뒤에는 못 본다
    await page.evaluate(() => {
      const w = window as unknown as { __xs: number[][] };
      w.__xs = [[], [], [], [], [], []];
      const cells = [...document.querySelectorAll('input + div > span')];
      const tick = () => {
        cells.forEach((el, i) =>
          w.__xs[i].push(new DOMMatrix(getComputedStyle(el).transform).m41)
        );
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    await page.keyboard.type('123456');
    await expect(input(page)).toHaveAttribute('aria-invalid', 'true');
    await expect(stage(page).getByText('번호가 맞지 않습니다')).toBeVisible();
    await page.waitForTimeout(900);
    // 물결이 끝나면 칸은 제자리로 돌아오고 간격은 그대로다
    expect(await gapBetween(page, 0, 1)).toBeCloseTo(8, 0);
    const xs = await page.evaluate(
      () => (window as unknown as { __xs: number[][] }).__xs
    );
    // 모든 칸이 좌우로 2.5px 넘게 흔들리고, 오른쪽 칸일수록 늦게 움직이기 시작한다
    const start = xs.map((col) => col.findIndex((x) => Math.abs(x) > 0.5));
    for (const col of xs) {
      expect(Math.min(...col)).toBeLessThan(-2.5);
      expect(Math.max(...col)).toBeGreaterThan(2.5);
    }
    for (let i = 1; i < 6; i++)
      expect(start[i]).toBeGreaterThanOrEqual(start[i - 1]);
    expect(start[5]).toBeGreaterThan(start[0]);

    // 지우면 오류가 걷히고 다시 맞는 번호를 넣으면 성공이다
    await page.keyboard.press('Backspace');
    await expect(input(page)).toHaveAttribute('aria-invalid', 'false');
    await page.keyboard.type('6');
    await expect(input(page)).toHaveAttribute('aria-invalid', 'true');
  });

  test('숫자는 위에서 내려와 살짝 넘친 뒤 칸에 앉고 지우면 아래로 빠진다', async ({
    page,
  }) => {
    // 가짜 시계로 16ms씩 정확히 보내 표집한다. 실시간 rAF는 부하에서 첫 프레임이 늦어 굴림의 앞부분을 놓친다
    await page.clock.install();
    await page.goto('/motion/code-slots');
    // 시연이 번호를 넣기 전에(시계를 거의 안 보낸 채) 멈춘다
    await expect(input(page)).toBeVisible();
    await stage(page).getByRole('button', { name: '시연 멈춤' }).click();
    await page.clock.runFor(100);
    // install만으로는 시계가 실시간으로 흐른다. 여기서 멈춰 runFor로만 흐르게 한다
    await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 1000);
    await input(page).focus();
    // 칸 안 숫자(첫 칸의 첫 자식)의 세로 이동량(px). 없으면 null
    const dy = () =>
      page.evaluate(() => {
        const el = document.querySelector('input + div > span > span');
        return el ? new DOMMatrix(getComputedStyle(el).transform).m42 : null;
      });
    const sample = async (ms: number) => {
      const ys: number[] = [];
      for (let t = 0; t < ms; t += 16) {
        await page.clock.runFor(16);
        const d = await dy();
        if (d !== null) ys.push(d);
      }
      return ys;
    };
    await page.keyboard.type('1');
    const ys = await sample(500);
    // 칸 높이 56px 가운데에 24px 글자: 위쪽에서 -24px 가까이 시작해 +로 넘쳤다가 0에 앉는다
    expect(Math.min(...ys)).toBeLessThan(-8);
    expect(Math.max(...ys)).toBeGreaterThan(0.5);
    expect(ys[ys.length - 1]).toBe(0);

    // 지우면 칸의 첫 자식이 아래로 빠지는 복사본이 된다(칸 높이 56px만큼 빠지고 끝나면 사라진다)
    await page.keyboard.press('Backspace');
    const after = await sample(500);
    expect(Math.max(...after)).toBeGreaterThan(40);
    await expect(slots(page).nth(0).locator('span')).toHaveCount(0);
  });

  test('붙여넣기로 한 번에 채워진다', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await open(page);
    await page.evaluate(() => navigator.clipboard.writeText('111111'));
    await page.keyboard.press('Control+V');
    await expect(input(page)).toHaveValue('111111');
    await expect(stage(page).getByText('확인했습니다')).toBeVisible();
  });

  test('구분자가 낀 번호를 붙여넣어도 숫자만 남아 채워진다', async ({
    page,
    context,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await open(page);
    await page.evaluate(() => navigator.clipboard.writeText('111 111'));
    await page.keyboard.press('Control+V');
    await expect(input(page)).toHaveValue('111111');
    await expect(stage(page).getByText('확인했습니다')).toBeVisible();
  });

  test('숫자가 아닌 글자는 버리고 지금 칸의 테두리 색이 포커스를 알린다(바깥 링 없음)', async ({
    page,
  }) => {
    await open(page);
    await page.keyboard.type('1a2-');
    await expect(input(page)).toHaveValue('12');
    // 지금 입력할 칸은 셋째 칸이다. 그 칸만 테두리가 primary 색이고 어느 칸도 outline이 없다
    await expect
      .poll(() => borders(page))
      .toEqual([GRAY, GRAY, PRIMARY, GRAY, GRAY, GRAY]);
    const outlines = await slots(page).evaluateAll((els) =>
      els.map((el) => getComputedStyle(el).outlineStyle)
    );
    expect(outlines).toEqual(Array(6).fill('none'));
  });

  test('오류면 포커스 중에도 활성 칸의 테두리가 error 색이다', async ({
    page,
  }) => {
    await open(page);
    await page.keyboard.type('123456');
    await expect(input(page)).toHaveAttribute('aria-invalid', 'true');
    await expect(input(page)).toBeFocused();
    // 다 찼으면 마지막 칸이 지금 칸이다
    await expect
      .poll(() => borders(page))
      .toEqual([ERROR, ERROR, ERROR, ERROR, ERROR, ERROR]);
    // 오류를 풀면 포커스 색으로 돌아온다
    await page.keyboard.press('Backspace');
    await expect
      .poll(() => borders(page))
      .toEqual([GRAY, GRAY, GRAY, GRAY, GRAY, PRIMARY]);
  });

  test('다시 단추가 칸을 비운다', async ({ page }) => {
    await open(page);
    await page.keyboard.type('111111');
    await expect(stage(page).getByText('확인했습니다')).toBeVisible();
    await stage(page)
      .getByRole('button', { name: '다시', exact: true })
      .click();
    await expect(input(page)).toHaveValue('');
    await expect(stage(page).getByText('확인했습니다')).toHaveCount(0);
    await expect.poll(() => gapBetween(page, 0, 1)).toBeCloseTo(8, 0);
  });

  test('움직임 줄이기에서는 굴러 들어옴과 물결 없이 바로 바뀌고 맞으면 붙은 모양이다', async ({
    page,
  }) => {
    // 움직임 줄이기에서는 자동 시연이 없어 멈춤 단추도 없다
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/motion/code-slots');
    await expect(input(page)).toBeVisible();
    await input(page).focus();
    await page.keyboard.type('123456');
    await expect(input(page)).toHaveAttribute('aria-invalid', 'true');
    // 칸과 그 안의 숫자에 도는 키프레임이 없다(전이는 뺀다)
    const running = await slots(page).evaluateAll((els) =>
      els
        .flatMap((el) => [el, ...el.children])
        .map(
          (el) =>
            el
              .getAnimations()
              .filter(
                (a) => a instanceof CSSAnimation && a.playState === 'running'
              ).length
        )
    );
    expect(running).toEqual(Array(12).fill(0));
    // 숫자는 처음부터 칸 가운데에 앉아 있다
    const offsets = await slots(page).evaluateAll((els) =>
      els.map((el) =>
        el.firstElementChild
          ? new DOMMatrix(getComputedStyle(el.firstElementChild).transform).m42
          : 0
      )
    );
    expect(offsets).toEqual(Array(6).fill(0));

    for (let i = 0; i < 6; i++) await page.keyboard.press('Backspace');
    await page.keyboard.type('111111');
    await expect(stage(page).getByText('확인했습니다')).toBeVisible();
    await expect.poll(() => gapBetween(page, 0, 1)).toBeCloseTo(0, 0);
  });
});
