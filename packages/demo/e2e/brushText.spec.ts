import { expect, test, type Page } from '@playwright/test';

const FONT = 'Nanum Brush Script';
const SENTENCE = '한 획 한 획 씁니다';

const stage = (page: Page) =>
  page.getByRole('region', { name: 'BrushText 미리보기' });

/** 쓰는 동안 칸에 붙어 있는 캔버스 수 */
const canvasCount = (page: Page) => page.locator('[data-brush-canvas]').count();

/** 칸 캔버스들에 지금 그려진 잉크(알파 > 0 픽셀) 수의 합. 다 쓴 칸의 캔버스는 숨겨질 뿐 지워지지 않아 합이 줄지 않는다 */
const inkPixels = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll<HTMLCanvasElement>('[data-brush-canvas]')]
      .map((c) => {
        const ctx = c.getContext('2d') as CanvasRenderingContext2D;
        const { data } = ctx.getImageData(0, 0, c.width, c.height);
        let n = 0;
        for (let i = 3; i < data.length; i += 4) if (data[i] > 0) n++;
        return n;
      })
      .reduce((a, b) => a + b, 0)
  );

/** 완성 글자(진짜 글자 span) 중 가장 투명한 값 */
const minGlyphOpacity = (page: Page) =>
  stage(page)
    .locator('[data-brush-glyph]')
    .evaluateAll((els) =>
      Math.min(...els.map((el) => Number(getComputedStyle(el).opacity)))
    );

/** 폰트를 받아 둔 뒤 가상 시계를 세우고 "다시 쓰기"를 눌러 0ms에서 멈춘 상태로 돌려준다 */
const startFrozen = async (page: Page, fontPx?: number) => {
  await page.clock.install();
  await page.goto('/motion/brush-text');
  await page.waitForSelector('[data-brush-word]');
  await page.evaluate(
    (family) => document.fonts.load(`40px "${family}"`, '붓'),
    FONT
  );
  await page.clock.runFor(12000);
  await page.clock.pauseAt(new Date(Date.now() + 1_000_000));
  if (fontPx)
    await page.addStyleTag({
      content: `main h2[class] { font-size: ${fontPx}px !important; max-width: 1200px; }`,
    });
  await page.getByRole('button', { name: '다시 쓰기' }).click();
  await page.clock.runFor(1);
};

test.describe('붓글씨 글자 상세', () => {
  test('쓰는 중에는 칸마다 캔버스가 있고 잉크가 늘며 획 사이 쉼에는 늘지 않고, 다 쓰면 캔버스가 걷혀 진짜 글자만 남는다', async ({
    page,
  }) => {
    await startFrozen(page);

    expect(await canvasCount(page)).toBe(
      [...SENTENCE.replace(/\s/g, '')].length
    );
    expect(await minGlyphOpacity(page)).toBe(0);

    const samples: number[] = [];
    for (let t = 0; t < 30000 && (await canvasCount(page)) > 0; t += 40) {
      samples.push(await inkPixels(page));
      await page.clock.runFor(40);
    }

    // 늘어난다
    expect(samples.at(-1) as number).toBeGreaterThan(samples[0]);
    for (let i = 1; i < samples.length; i++)
      expect(samples[i]).toBeGreaterThanOrEqual(samples[i - 1]);
    // 쉼: 아직 다 쓰기 전인데 40ms 사이 하나도 안 늘어난 구간이 있다(획 사이 쉼 60ms 이상)
    const last = samples.at(-1) as number;
    const plateau = samples.some(
      (n, i) => i > 0 && n > 0 && n < last && n === samples[i - 1]
    );
    expect(plateau).toBe(true);

    // 끝: 캔버스가 없고 진짜 글자만 보이고 인라인 값이 남지 않는다
    expect(await canvasCount(page)).toBe(0);
    expect(await minGlyphOpacity(page)).toBe(1);
    expect(
      await stage(page)
        .locator('[data-brush-glyph]')
        .evaluateAll(
          (els) =>
            els.filter((el) => (el as HTMLElement).style.opacity !== '').length
        )
    ).toBe(0);
    await expect(
      stage(page).getByRole('heading', { level: 2, name: SENTENCE })
    ).toBeVisible();
  });

  test('캔버스가 진짜 글자로 바뀌는 순간 글자가 튀지 않는다 (기준선이 1px 넘게 어긋나면 빨개진다)', async ({
    browser,
  }) => {
    test.setTimeout(120_000);
    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();
    await startFrozen(page, 96);

    const cell = page.locator('[data-brush-cell]').first();
    const glyph = cell.locator('[data-brush-glyph]');
    // 가상 시계가 멈춰 있어 요소 스크린샷의 안정 대기가 걸린다. 영역을 직접 줘서 찍는다
    const clip = (await cell.boundingBox()) as NonNullable<
      Awaited<ReturnType<typeof cell.boundingBox>>
    >;
    let before: Buffer | null = null;
    for (let i = 0; i < 1000; i++) {
      const swapped = await glyph.evaluate(
        (el) => (el as HTMLElement).style.opacity === '1'
      );
      if (swapped) break;
      // 바뀌기 직전 프레임을 계속 갱신해 둔다
      before = await page.screenshot({ clip });
      await page.clock.runFor(4);
    }
    const after = await page.screenshot({ clip });
    expect(before).not.toBeNull();

    const { diff, ink } = await page.evaluate(
      async ([a, b]) => {
        const load = async (b64: string) => {
          const bmp = await createImageBitmap(
            new Blob([Uint8Array.from(atob(b64), (ch) => ch.charCodeAt(0))], {
              type: 'image/png',
            })
          );
          const c = new OffscreenCanvas(bmp.width, bmp.height);
          const ctx = c.getContext('2d') as OffscreenCanvasRenderingContext2D;
          ctx.drawImage(bmp, 0, 0);
          return ctx.getImageData(0, 0, bmp.width, bmp.height).data;
        };
        const [x, y] = [await load(a), await load(b)];
        let d = 0;
        let n = 0;
        for (let i = 0; i < x.length; i += 4) {
          if (y[i] < 128) n++;
          if (Math.abs(x[i] - y[i]) > 96) d++;
        }
        return { diff: d, ink: n };
      },
      [(before as Buffer).toString('base64'), after.toString('base64')] as const
    );
    expect(ink).toBeGreaterThan(1000);
    // 바뀌기 4ms 전 캔버스와 바뀐 직후 진짜 글자의 잉크가 거의 같다. 맞을 때 96px에서 약 4%(마지막 획 끝 4ms 몫과 안티앨리어싱),
    // 캔버스 기준선을 1px만 어긋나게 하면 약 20%라 10%를 선으로 둔다(44px에서는 0.25%와 45%)
    expect(diff / ink).toBeLessThan(0.1);
    await context.close();
  });

  test('나눔붓글씨가 실제로 적용된다', async ({ page }) => {
    await page.goto('/motion/brush-text');
    const sentence = stage(page).getByRole('heading', { level: 2 });
    await expect(sentence).toHaveCSS('font-family', /Nanum Brush Script/);
    // 글꼴 파일이 실제로 내려와 로드됐다(대체 글꼴이 그려진 것이 아니다)
    await expect
      .poll(() =>
        page.evaluate(
          (family) =>
            [...document.fonts].some(
              (f) =>
                f.family.replace(/["']/g, '') === family &&
                f.status === 'loaded'
            ),
          FONT
        )
      )
      .toBe(true);
    expect(
      await page.evaluate(
        (family) => document.fonts.check(`40px "${family}"`, '붓'),
        FONT
      )
    ).toBe(true);
  });

  test('붓 글꼴은 그 글꼴을 쓰는 화면에서만 내려받는다', async ({ page }) => {
    const fontRequests: string[] = [];
    page.on('request', (r) => {
      if (r.url().includes('NanumBrushScript')) fontRequests.push(r.url());
    });
    await page.goto('/components/button');
    await page.waitForLoadState('networkidle');
    expect(fontRequests).toEqual([]);
  });

  test('축소 모션에서는 처음부터 완성 문장이고 캔버스를 만들지 않는다', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/motion/brush-text');
    await expect(
      stage(page).locator('[data-brush-glyph]').first()
    ).toBeVisible();
    expect(await minGlyphOpacity(page)).toBe(1);
    expect(await canvasCount(page)).toBe(0);
    await page.waitForTimeout(300);
    expect(await minGlyphOpacity(page)).toBe(1);
    expect(await canvasCount(page)).toBe(0);
  });
});
