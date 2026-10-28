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

    await page.keyboard.type('123456');
    await expect(input(page)).toHaveValue('123456');
    await expect(stage(page).getByText('확인했습니다')).toBeVisible();
    await expect(input(page)).toHaveAttribute('aria-invalid', 'false');
    // 합쳐짐 전이(slower)가 끝나면 모든 칸 사이 간격이 0이다
    await expect.poll(() => gapBetween(page, 0, 1)).toBeCloseTo(0, 0);
    await expect.poll(() => gapBetween(page, 4, 5)).toBeCloseTo(0, 0);
    // 합쳐진 뒤에는 칸별 포커스 링이 없고 알약 전체가 링 하나를 가진다
    const ring = await stage(page)
      .locator('input + div')
      .evaluate((el) => ({
        pill: getComputedStyle(el).outlineStyle,
        radius: parseFloat(getComputedStyle(el).borderTopLeftRadius),
        cells: [...el.children].map((c) => getComputedStyle(c).outlineStyle),
      }));
    expect(ring.pill).toBe('solid');
    expect(ring.radius).toBeGreaterThan(20);
    expect(ring.cells).toEqual(Array(6).fill('none'));
    // 합쳐진 알약은 바깥 모서리만 둥글다
    const radii = await slots(page).evaluateAll((els) =>
      els.map((el) => {
        const s = getComputedStyle(el);
        return [s.borderTopLeftRadius, s.borderTopRightRadius];
      })
    );
    expect(parseFloat(radii[0][0])).toBeGreaterThan(20);
    expect(parseFloat(radii[0][1])).toBe(0);
    expect(parseFloat(radii[5][0])).toBe(0);
    expect(parseFloat(radii[5][1])).toBeGreaterThan(20);
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
    await page.keyboard.type('111111');
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
    await open(page);
    // 프레임마다 숫자와 복사본의 세로 이동량(px)을 모은다. 시연 멈춤이어도 굴러야 한다
    await page.evaluate(() => {
      const w = window as unknown as { __ys: number[] };
      w.__ys = [];
      const tick = () => {
        const dy = (el: Element | null) =>
          el ? new DOMMatrix(getComputedStyle(el).transform).m42 : null;
        const d = dy(document.querySelector('input + div > span > span'));
        if (d !== null) w.__ys.push(d);
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    await page.keyboard.type('1');
    await page.waitForTimeout(500);
    const ys = await page.evaluate(
      () => (window as unknown as { __ys: number[] }).__ys
    );
    // 칸 높이 56px 가운데에 24px 글자: 위쪽에서 -24px 가까이 시작해 +로 넘쳤다가 0에 앉는다
    expect(Math.min(...ys)).toBeLessThan(-8);
    expect(Math.max(...ys)).toBeGreaterThan(0.5);
    expect(ys[ys.length - 1]).toBe(0);

    // 지우면 칸의 첫 자식이 아래로 빠지는 복사본이 된다(칸 높이 56px만큼 빠지고 끝나면 사라진다)
    const before = ys.length;
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(500);
    const after = await page.evaluate(
      () => (window as unknown as { __ys: number[] }).__ys
    );
    expect(Math.max(...after.slice(before))).toBeGreaterThan(40);
    await expect(slots(page).nth(0).locator('span')).toHaveCount(0);
  });

  test('붙여넣기로 한 번에 채워진다', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await open(page);
    await page.evaluate(() => navigator.clipboard.writeText('123456'));
    await page.keyboard.press('Control+V');
    await expect(input(page)).toHaveValue('123456');
    await expect(stage(page).getByText('확인했습니다')).toBeVisible();
  });

  test('구분자가 낀 번호를 붙여넣어도 숫자만 남아 채워진다', async ({
    page,
    context,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await open(page);
    await page.evaluate(() => navigator.clipboard.writeText('123 456'));
    await page.keyboard.press('Control+V');
    await expect(input(page)).toHaveValue('123456');
    await expect(stage(page).getByText('확인했습니다')).toBeVisible();
  });

  test('숫자가 아닌 글자는 버리고 지금 칸에 포커스 링이 있다', async ({
    page,
  }) => {
    await open(page);
    await page.keyboard.type('1a2-');
    await expect(input(page)).toHaveValue('12');
    // 지금 입력할 칸은 셋째 칸이고 그 칸만 포커스 링(outline)을 가진다
    const outlines = await slots(page).evaluateAll((els) =>
      els.map((el) => getComputedStyle(el).outlineStyle)
    );
    expect(outlines).toEqual(['none', 'none', 'solid', 'none', 'none', 'none']);
  });

  test('다시 단추가 칸을 비운다', async ({ page }) => {
    await open(page);
    await page.keyboard.type('123456');
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
    await page.keyboard.type('111111');
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
    await page.keyboard.type('123456');
    await expect(stage(page).getByText('확인했습니다')).toBeVisible();
    await expect.poll(() => gapBetween(page, 0, 1)).toBeCloseTo(0, 0);
  });
});
