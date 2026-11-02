import { expect, test, type Page } from '@playwright/test';

const DETAIL = '[role="region"][aria-label="LuminousFlow 미리보기"] canvas';
const MINI = '[data-stage-mini="LuminousFlow 미리보기"] canvas';

const stage = (page: Page) =>
  page.getByRole('region', { name: 'LuminousFlow 미리보기' });

// 길이 단계 고르기. 칸이 좁으면 SegmentedButtons 대신 칩 줄로 바뀌므로 둘 다 받는다
const chooseLength = async (page: Page, value: string) => {
  const radios = page.getByRole('radiogroup', { name: '길이', exact: true });
  if (await radios.count())
    await radios
      .getByRole('radio', { name: value, exact: true })
      .locator('..')
      .click();
  else
    await page
      .getByRole('group', { name: '길이', exact: true })
      .getByRole('button', { name: value, exact: true })
      .click();
  // 단추를 누르려고 창이 스크롤되면 캔버스가 덮는 구간이 달라지므로 창을 맨 위로 되돌려 둔다
  await page.evaluate(() => window.scrollTo(0, 0));
};

const SVG =
  '[role="region"][aria-label="LuminousFlow 미리보기"] svg[viewBox^="0 0 492"]';
const scroller = (page: Page) =>
  stage(page).getByRole('group', { name: '물줄기 스크롤 상자' });

// 장면 높이 = 1445 + 520 * (굽이 수 - 5)
const bendsOf = async (page: Page) => {
  const viewBox = await page.locator(SVG).getAttribute('viewBox');
  return (Number(viewBox!.split(' ')[3]) - 1445) / 520 + 5;
};
// 물길 중심선 경로의 끝점이 왼쪽 밖(<0)인지 오른쪽 밖(>492)인지
const endSide = (page: Page) =>
  page
    .locator(SVG)
    .locator('defs path')
    .first()
    .evaluate((el) => {
      const x = Number(el.getAttribute('d')!.trim().split(' ').at(-2));
      return x < 0 ? '왼쪽' : x > 492 ? '오른쪽' : '안쪽';
    });

// 앱이 그려지기 전의 입력은 버려진다. canvas가 붙은 뒤에 단추를 누른다
const openDetail = async (page: Page) => {
  await page.goto('/motion/luminous-flow');
  await expect(page.locator(DETAIL)).toBeVisible();
};

// 정지 장면이 그려지도록 프레임 셋을 기다린 뒤 gap 간격으로 두 장을 찍는다. Playwright 왕복이 부하에 늘어져도 간격이 어긋나지 않도록
// 한 evaluate 안에서 한다. blank는 아무것도 안 그려진 canvas와 같은지다(빈 두 장이 같은 것을 "멈춤"으로 읽지 않게)
const twoFrames = (page: Page, selector: string, gap = 500) =>
  page.evaluate(
    async ({ selector, gap }) => {
      const canvas = document.querySelector<HTMLCanvasElement>(selector);
      if (!canvas) throw new Error('canvas 없음');
      const frame = () => new Promise((r) => requestAnimationFrame(r));
      for (let i = 0; i < 3; i++) await frame();
      const a = canvas.toDataURL();
      await new Promise((r) => setTimeout(r, gap));
      const b = canvas.toDataURL();
      const blank = document.createElement('canvas');
      blank.width = canvas.width;
      blank.height = canvas.height;
      return { same: a === b, blank: a === blank.toDataURL() };
    },
    { selector, gap }
  );

test.describe('빛 물줄기 상세 (1440px)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('배경이 무대 상자를 채우고 그 위에 흰 글자가 얹힌다', async ({
    page,
  }) => {
    await openDetail(page);
    const box = (await stage(page).boundingBox())!;
    const canvas = (await page.locator(DETAIL).boundingBox())!;
    expect(canvas.x).toBeGreaterThanOrEqual(box.x - 1);
    expect(canvas.y).toBeGreaterThanOrEqual(box.y - 1);
    expect(canvas.x + canvas.width).toBeLessThanOrEqual(box.x + box.width + 1);
    // 안쪽 22rem 상자가 아니라 무대 폭 전체를 채운다. 높이는 보이는 구간만 덮으므로 무대보다 클 수 있다(넘침은 잘린다)
    expect(canvas.width).toBeGreaterThan(box.width * 0.95);
    expect(canvas.height).toBeGreaterThan(box.height * 0.95);
    const line = stage(page).getByText('빛 물줄기', { exact: true });
    await expect(line).toBeVisible();
    expect(await line.evaluate((el) => getComputedStyle(el).color)).toBe(
      'rgb(255, 255, 255)'
    );
  });

  test('일시정지 단추가 흐름을 세우고 다시 누르면 흐른다', async ({ page }) => {
    await openDetail(page);
    const pause = stage(page).getByRole('button', { name: '시연 멈춤' });
    await pause.click();
    await page.mouse.move(2, 2);
    const still = await twoFrames(page, DETAIL);
    expect(still.blank).toBe(false);
    expect(still.same).toBe(true);

    await stage(page).getByRole('button', { name: '시연 다시 시작' }).click();
    await page.mouse.move(2, 2);
    const flowing = await twoFrames(page, DETAIL);
    expect(flowing.same).toBe(false);
  });

  test('일시정지 중에 상자 길이가 바뀌어 굽이 수가 달라져도 새 장면을 한 장 다시 그린다', async ({
    page,
  }) => {
    await openDetail(page);
    await stage(page).getByRole('button', { name: '시연 멈춤' }).click();
    await page.mouse.move(2, 2);
    const viewBox = () => page.locator(SVG).getAttribute('viewBox');
    const snapshot = () =>
      page
        .locator(DETAIL)
        .evaluate((el) => (el as HTMLCanvasElement).toDataURL());

    await expect.poll(viewBox).toBe('0 0 492 1445');
    await page.waitForTimeout(500);
    const short = await snapshot();
    // 짧게는 굽이 5, 보통은 굽이 6(마감이 반대쪽)이다
    await chooseLength(page, '보통');
    await expect.poll(viewBox).toBe('0 0 492 1965');
    await expect.poll(snapshot).not.toBe(short);
    const still = await twoFrames(page, DETAIL);
    expect(still.blank).toBe(false);
    expect(still.same).toBe(true);
  });

  // 되돌리면 빨개지는 것: 효과가 흐름 시계를 새로 만들면 굽이 수를 갔다 와도 같은 장면이 되지 않는다(시간 0 장면이 된다)
  test('굽이 수가 바뀌었다 돌아와도 흐름 시간이 0으로 돌아가지 않는다', async ({
    page,
  }) => {
    await openDetail(page);
    const viewBox = () => page.locator(SVG).getAttribute('viewBox');
    const snapshot = () =>
      page
        .locator(DETAIL)
        .evaluate((el) => (el as HTMLCanvasElement).toDataURL());
    // 흐름 시간이 쌓이도록 한동안 흐르게 둔 뒤 세운다
    await page.waitForTimeout(1500);
    await stage(page).getByRole('button', { name: '시연 멈춤' }).click();
    await page.mouse.move(2, 2);
    await expect.poll(viewBox).toBe('0 0 492 1445');
    await page.waitForTimeout(500);
    const before = await snapshot();
    await chooseLength(page, '보통');
    await expect.poll(viewBox).toBe('0 0 492 1965');
    await chooseLength(page, '짧게');
    await expect.poll(viewBox).toBe('0 0 492 1445');
    // 빛번짐 층 텍스처가 다시 들어올 때까지 기다려도 같은 흐름 시간의 같은 그림이다
    await expect.poll(snapshot).toBe(before);
  });

  test('길이 단계마다 굽이 수와 마감 방향이 바뀐다(짝수는 왼쪽, 홀수는 오른쪽)', async ({
    page,
  }) => {
    await openDetail(page);
    const sides = new Set<string>();
    for (const [name, bends, side] of [
      ['짧게', 5, '오른쪽'],
      ['보통', 6, '왼쪽'],
      ['길게', 7, '오른쪽'],
      ['아주 길게', 10, '왼쪽'],
    ] as const) {
      await chooseLength(page, name);
      await expect.poll(() => bendsOf(page)).toBe(bends);
      expect(await endSide(page)).toBe(side);
      sides.add(side);
    }
    expect(sides.size).toBe(2);
  });

  test('무대 안에서 스크롤해 맨 아래 마감 굽이까지 내려가면 그 구간이 그려진다', async ({
    page,
  }) => {
    await openDetail(page);
    await chooseLength(page, '아주 길게');
    await expect.poll(() => bendsOf(page)).toBe(10);
    const geometry = () =>
      page.locator(DETAIL).evaluate((el) => {
        const canvas = el as HTMLCanvasElement;
        const top = Number(
          /translateY\((-?[\d.]+)px\)/.exec(canvas.style.transform)?.[1] ?? 0
        );
        // 캔버스 맨 아래 8% 줄에 그려진 픽셀이 있는지
        const rows = Math.ceil(canvas.height * 0.08);
        const data = canvas
          .getContext('2d')!
          .getImageData(0, canvas.height - rows, canvas.width, rows).data;
        let ink = 0;
        for (let i = 3; i < data.length; i += 4) if (data[i] > 0) ink++;
        return {
          top,
          height: canvas.clientHeight,
          boxHeight: canvas.parentElement!.clientHeight,
          ink,
        };
      });
    // 맨 위에서는 캔버스가 상자 끝에 한참 못 미친다
    const first = await geometry();
    expect(first.top).toBe(0);
    expect(first.top + first.height).toBeLessThan(first.boxHeight / 2);
    // 맨 아래까지 스크롤하면 캔버스가 상자 끝에 닿고 거기에 마감 구간이 그려져 있다
    await scroller(page).evaluate((el) => (el.scrollTop = el.scrollHeight));
    await expect
      .poll(async () => {
        const g = await geometry();
        return g.top + g.height >= g.boxHeight - 1 && g.ink > 0;
      })
      .toBe(true);
    // 창은 그대로다
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });

  test('캔버스 크기는 상자 높이가 아니라 보이는 구간 기준이고 스크롤해도 같다', async ({
    page,
  }) => {
    await openDetail(page);
    await chooseLength(page, '아주 길게');
    await expect.poll(() => bendsOf(page)).toBe(10);
    const sizes = () =>
      page.evaluate(
        ({ selector, scrollerName }) => {
          const canvas = document.querySelector<HTMLCanvasElement>(selector)!;
          const view = document.querySelector<HTMLElement>(
            `[aria-label="${scrollerName}"]`
          )!;
          return {
            canvasHeight: canvas.clientHeight,
            canvasPixels: canvas.width * canvas.height,
            viewHeight: view.clientHeight,
            boxHeight: canvas.parentElement!.clientHeight,
          };
        },
        { selector: DETAIL, scrollerName: '물줄기 스크롤 상자' }
      );
    const top = await sizes();
    expect(top.boxHeight).toBeGreaterThan(top.viewHeight * 5);
    // 보이는 창 높이의 두 배(위아래 반 화면 여유)
    expect(Math.abs(top.canvasHeight - top.viewHeight * 2)).toBeLessThanOrEqual(
      1
    );
    // 픽셀 예산(긴 상자의 보이는 구간 캔버스는 4e5)
    expect(top.canvasPixels).toBeLessThanOrEqual(4e5 * 1.01);
    await scroller(page).evaluate((el) => (el.scrollTop = el.scrollHeight / 2));
    await page.waitForTimeout(300);
    const middle = await sizes();
    expect(middle.canvasHeight).toBe(top.canvasHeight);
    expect(middle.canvasPixels).toBe(top.canvasPixels);
  });

  // 흐름 시간은 캔버스 점선 오프셋 두 번의 차이에서 읽는다(첫 가닥은 시간에 127.27과 100을 곱해 빼므로 차이가 시간 x 27.27이다).
  // 오프셋 기록은 값을 그대로 넘기는 관찰이다. 되돌리면 빨개지는 것: 스크롤 위치에서 조상을 빼면 무대 스크롤에서 흐름이 빨라지지 않는다
  test('무대 안 스크롤로도 흐름이 빨라진다(창은 그대로)', async ({ page }) => {
    await page.addInitScript(() => {
      const proto = CanvasRenderingContext2D.prototype;
      const own = Object.getOwnPropertyDescriptor(proto, 'lineDashOffset')!;
      const log: [number, number][] = [];
      (window as unknown as { __dash: typeof log }).__dash = log;
      Object.defineProperty(proto, 'lineDashOffset', {
        configurable: true,
        get() {
          return own.get!.call(this);
        },
        set(value: number) {
          log.push([performance.now(), value]);
          own.set!.call(this, value);
        },
      });
    });
    await openDetail(page);
    await chooseLength(page, '아주 길게');
    await expect.poll(() => bendsOf(page)).toBe(10);
    await page.mouse.move(2, 2);
    // 구간의 평균 흐름 속도(흐름 시간 증가 / 벽시계 증가)
    const rate = (
      scrolling: boolean,
      ms = 2500
    ): Promise<{ rate: number; windowMoved: number }> =>
      page.evaluate(
        ({ scrolling, scrollerName, ms }) =>
          new Promise((resolve) => {
            const view = document.querySelector<HTMLElement>(
              `[aria-label="${scrollerName}"]`
            )!;
            const log = (window as unknown as { __dash: [number, number][] })
              .__dash;
            const start = log.length;
            const windowStart = window.scrollY;
            const began = performance.now();
            const tick = () => {
              if (scrolling) view.scrollTop += 150;
              if (performance.now() - began < ms) {
                requestAnimationFrame(tick);
                return;
              }
              // 한 프레임은 오프셋 쓰기 57번이고 끝에 0으로 되돌린다. 프레임의 처음 두 쓰기가 첫 가닥이다
              const frames: [number, number][] = [];
              let writes: [number, number][] = [];
              for (const entry of log.slice(start)) {
                if (entry[1] === 0) {
                  if (writes.length >= 2)
                    frames.push([
                      writes[0][0],
                      (writes[1][1] - writes[0][1]) / 27.27,
                    ]);
                  writes = [];
                } else writes.push(entry);
              }
              const first = frames[0];
              const last = frames[frames.length - 1];
              resolve({
                rate: (last[1] - first[1]) / ((last[0] - first[0]) / 1000),
                windowMoved: window.scrollY - windowStart,
              });
            };
            requestAnimationFrame(tick);
          }),
        { scrolling, scrollerName: '물줄기 스크롤 상자', ms }
      );
    // 앞선 스크롤(단추를 누르려 창이 움직인 것 포함)이 남긴 속도 꼬리가 쉬는 속도에 섞이지 않게, 쉬는 속도가 가라앉을 때까지
    // 짧은 구간으로 표집하며 기다린다(연속 두 표본이 문턱 아래, 상한 12표본). 고정 대기가 아니라 상태를 보고 기다린다
    let calm = 0;
    for (let attempt = 0; attempt < 12 && calm < 2; attempt++)
      calm = (await rate(false, 600)).rate < 0.6 ? calm + 1 : 0;
    expect(calm).toBe(2);
    const idle = await rate(false);
    await scroller(page).evaluate((el) => (el.scrollTop = 0));
    await page.waitForTimeout(800);
    const scrolled = await rate(true);
    expect(scrolled.windowMoved).toBe(0);
    // 쉬는 속도는 0.5배, 스크롤 중에는 그보다 눈에 띄게 빠르다
    expect(idle.rate).toBeGreaterThan(0.3);
    expect(idle.rate).toBeLessThan(0.8);
    expect(scrolled.rate).toBeGreaterThan(idle.rate * 1.8);
  });

  test('움직임 줄이기에서는 500ms 간격으로 찍어도 정지 장면이다', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openDetail(page);
    // 빛번짐 층 텍스처가 비동기로 들어와 한 번 다시 그린다. 그 뒤에 찍는다
    await page.waitForTimeout(1000);
    const result = await twoFrames(page, DETAIL);
    expect(result.blank).toBe(false);
    expect(result.same).toBe(true);
    // 움직임 줄이기에서는 멈출 움직임이 없으므로 일시정지 단추도 없다
    await expect(
      stage(page).getByRole('button', { name: '시연 멈춤' })
    ).toHaveCount(0);
  });
});

test.describe('빛 물줄기 모션 전체 보기 미니 (1440px)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  const centre = (page: Page) =>
    page.locator(MINI).evaluate((el) => el.scrollIntoView({ block: 'center' }));

  test('미니 배경이 카드 칸 안에 있다', async ({ page }) => {
    await page.goto('/motion');
    // 카드 순서가 바뀌어도 깨지지 않게 미니의 라벨로 카드를 고른다
    const card = page.locator('main section > div > div').filter({
      has: page.locator('[data-stage-mini="LuminousFlow 미리보기"]'),
    });
    await expect(card.locator('canvas')).toBeVisible();
    await centre(page);
    const box = (await card.boundingBox())!;
    const canvas = (await page.locator(MINI).boundingBox())!;
    expect(canvas.width).toBeGreaterThan(0);
    expect(canvas.height).toBeGreaterThan(0);
    expect(canvas.x).toBeGreaterThanOrEqual(box.x - 1);
    expect(canvas.y).toBeGreaterThanOrEqual(box.y - 1);
    expect(canvas.x + canvas.width).toBeLessThanOrEqual(box.x + box.width + 1);
    expect(canvas.y + canvas.height).toBeLessThanOrEqual(
      box.y + box.height + 1
    );
  });

  test('움직임 멈춤을 켜면 미니 흐름이 서고 끄면 다시 흐른다', async ({
    page,
  }) => {
    await page.goto('/motion');
    await expect(page.locator(MINI)).toBeAttached();
    const pause = page.getByRole('button', { name: '움직임 멈춤' });
    await pause.click();
    await expect(pause).toHaveAttribute('aria-pressed', 'true');
    await centre(page);
    const still = await twoFrames(page, MINI);
    expect(still.blank).toBe(false);
    expect(still.same).toBe(true);

    // 스크롤하면 미니가 화면 밖이 되므로 제자리에서 끈다
    await pause.evaluate((el: HTMLButtonElement) => el.click());
    await expect(pause).toHaveAttribute('aria-pressed', 'false');
    const flowing = await twoFrames(page, MINI);
    expect(flowing.same).toBe(false);
  });
});
