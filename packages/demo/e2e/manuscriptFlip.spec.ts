import { expect, test, type Page } from '@playwright/test';

const stage = (page: Page) =>
  page.getByRole('region', { name: 'ManuscriptFlip 미리보기' });
const toggle = (page: Page) =>
  stage(page).getByRole('button', { name: '설명 보기' });

/** 상자의 두 면과 타일 층 상태를 한 번에 읽는다. 타일의 돈 각도는 GSAP이 인라인 transform에 쓴 rotateY다 */
const snap = (page: Page, selector = '[data-stage-target="card"]') =>
  page.evaluate((sel) => {
    const root = document.querySelector(sel)!.firstElementChild as HTMLElement;
    const [front, back, layer] = [...root.children] as HTMLElement[];
    const turn = (el: HTMLElement) =>
      Number(/rotateY\((-?[\d.]+)deg\)/.exec(el.style.transform)?.[1] ?? 0);
    const view = (el: HTMLElement) => getComputedStyle(el);
    return {
      frontInert: front.hasAttribute('inert'),
      backInert: back.hasAttribute('inert'),
      frontVisibility: view(front).visibility,
      backVisibility: view(back).visibility,
      // 인라인 값을 읽는다. 움직임 줄이기의 전역 규칙이 모든 요소에 0.01ms 전이를 걸어 계산값은 한 프레임 늦는다
      frontOpacity: Number(front.style.opacity),
      backOpacity: Number(back.style.opacity),
      frontClip: front.style.clipPath,
      backClip: back.style.clipPath,
      tiles: layer
        ? ([...layer.children] as HTMLElement[]).map((tile) => ({
            turn: turn(tile),
            opacity: Number(view(tile).opacity),
          }))
        : [],
    };
  }, selector);

/**
 * 가상 시계를 깔고 페이지가 그려진 뒤 세운다(세운 채로 불러오면 느린 불러오기가 멈춘다).
 * 대본이 앞서가 이미 넘겨 두었을 수 있으니, 첫 클릭으로 무대를 넘겨받은 뒤 앞면에서 시작하도록 맞춘다
 */
const startFrozen = async (page: Page) => {
  await page.clock.install();
  await page.goto('/motion/manuscript-flip');
  await expect(toggle(page)).toBeVisible();
  await page.clock.pauseAt(new Date(Date.now() + 200));
  // 칸 나누기는 ResizeObserver가 하므로 시계와 무관하게 선다
  await expect
    .poll(async () => (await snap(page)).tiles.length)
    .toBeGreaterThan(1);
  await toggle(page).hover();
  if ((await toggle(page).getAttribute('aria-pressed')) === 'true') {
    await toggle(page).click();
  }
  await page.clock.runFor(1000);
};

test.describe('원고지 넘김 상세', () => {
  test('넘기면 칸이 글 쓰는 순서로 뒤집히고 700ms 안팎에 뒷면만 남는다', async ({
    page,
  }) => {
    await startFrozen(page);

    const rest = await snap(page);
    expect(rest.frontInert).toBe(false);
    expect(rest.backInert).toBe(true);
    expect(rest.backVisibility).toBe('hidden');
    expect(rest.tiles.every((t) => t.turn === 0 && t.opacity === 0)).toBe(true);

    await toggle(page).click();
    await page.clock.runFor(150);
    const early = await snap(page);
    // 넘기는 도중에는 두 면이 모두 보이고 inert이다
    expect(early.frontInert && early.backInert).toBe(true);
    expect(early.frontVisibility).toBe('visible');
    expect(early.backVisibility).toBe('visible');
    // 첫 칸은 돌고 있고 마지막 칸은 아직 시작 전이다(마지막 칸은 500ms에 시작)
    expect(early.tiles[0].turn).toBeGreaterThan(0);
    expect(early.tiles.at(-1)!.turn).toBe(0);

    await page.clock.runFor(250);
    const mid = await snap(page);
    // 앞 칸일수록 많이 돌았다(글 쓰는 순서)
    for (let i = 1; i < mid.tiles.length; i++)
      expect(mid.tiles[i].turn).toBeLessThanOrEqual(mid.tiles[i - 1].turn);
    expect(mid.tiles[0].turn).toBeGreaterThan(mid.tiles.at(-1)!.turn);
    // 마스크는 뒤집힌 칸만 뒷면을 드러내는 다각형이다
    expect(mid.backClip).toContain('polygon');
    expect(mid.frontClip).toContain('polygon');

    await page.clock.runFor(240);
    // 700ms 직전: 아직 넘기는 중이다
    expect((await snap(page)).backInert).toBe(true);

    await page.clock.runFor(120);
    const end = await snap(page);
    expect(end.backInert).toBe(false);
    expect(end.frontInert).toBe(true);
    expect(end.frontVisibility).toBe('hidden');
    expect(end.backVisibility).toBe('visible');
    expect(end.backClip).toBe('none');
    expect(end.tiles.every((t) => t.opacity === 0)).toBe(true);
  });

  test('넘기는 도중에 되넘기면 지금 상태에서 거꾸로 가 앞면으로 끝난다', async ({
    page,
  }) => {
    await startFrozen(page);
    await toggle(page).click();
    await page.clock.runFor(350);
    const going = await snap(page);
    expect(going.tiles[0].turn).toBeGreaterThan(going.tiles.at(-1)!.turn);

    await toggle(page).click();
    await page.clock.runFor(100);
    const back = await snap(page);
    // 앞 칸이 먼저 시작했으니 되넘길 때는 뒷 칸부터 걷힌다. 첫 칸은 이미 다 돌아 있다
    expect(back.frontInert && back.backInert).toBe(true);

    await page.clock.runFor(450);
    const end = await snap(page);
    expect(end.frontInert).toBe(false);
    expect(end.backInert).toBe(true);
    expect(end.frontVisibility).toBe('visible');
    expect(end.backVisibility).toBe('hidden');
    expect(end.frontClip).toBe('none');
    expect(end.tiles.every((t) => t.opacity === 0)).toBe(true);
    await expect(toggle(page)).toHaveAttribute('aria-pressed', 'false');
  });

  test('앞면과 뒷면의 내용이 한 벌씩만 있고 넘기는 동안에도 늘지 않는다', async ({
    page,
  }) => {
    await startFrozen(page);
    const count = () => stage(page).getByText('장바구니 담기').count();
    expect(await count()).toBe(1);
    await expect(stage(page).getByText('러닝화', { exact: true })).toHaveCount(
      1
    );
    await toggle(page).click();
    await page.clock.runFor(300);
    expect(await count()).toBe(1);
    await expect(stage(page).getByText('러닝화', { exact: true })).toHaveCount(
      1
    );
  });

  test('큰 상자에서는 칸 수가 상한(48)을 넘지 않고 칸이 커진다', async ({
    page,
  }) => {
    await startFrozen(page);
    const small = (await snap(page)).tiles.length;
    await page.addStyleTag({
      content: `
        [data-stage-target="card"] { width: 1200px !important; }
        [data-stage-target="card"] > div > div:not([aria-hidden="true"]) > div { min-height: 800px !important; }
      `,
    });
    await expect
      .poll(async () => (await snap(page)).tiles.length)
      .not.toBe(small);
    const big = (await snap(page)).tiles.length;
    expect(big).toBeLessThanOrEqual(48);
    expect(big).toBeGreaterThan(small);
  });

  test('단추 하나로 키보드에서도 넘기고 보이는 면만 탭으로 닿는다', async ({
    page,
  }) => {
    await startFrozen(page);
    await toggle(page).focus();
    await page.keyboard.press('Enter');
    await page.clock.runFor(800);
    await expect(toggle(page)).toHaveAttribute('aria-pressed', 'true');
    const end = await snap(page);
    expect(end.backInert).toBe(false);
    expect(end.frontInert).toBe(true);
    // 뒷면의 단추는 이제 살아 있다
    await stage(page).getByRole('button', { name: '장바구니 담기' }).focus();
    await expect(
      stage(page).getByRole('button', { name: '장바구니 담기' })
    ).toBeFocused();
  });
});

test.describe('원고지 넘김 상세 (움직임 줄이기)', () => {
  test('칸 없이 두 면이 교차해 흐려지고 결과는 같다', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.clock.install();
    await page.goto('/motion/manuscript-flip');
    await expect(toggle(page)).toBeVisible();
    await page.clock.pauseAt(new Date(Date.now() + 200));
    await toggle(page).hover();
    if ((await toggle(page).getAttribute('aria-pressed')) === 'true') {
      await toggle(page).click();
    }
    await page.clock.runFor(1000);

    expect((await snap(page)).tiles).toHaveLength(0);
    await toggle(page).click();
    await page.clock.runFor(100);
    const mid = await snap(page);
    expect(mid.tiles).toHaveLength(0);
    expect(mid.frontOpacity).toBeGreaterThan(0);
    expect(mid.frontOpacity).toBeLessThan(1);
    expect(mid.backOpacity).toBeGreaterThan(0);
    expect(mid.backOpacity).toBeLessThan(1);
    expect(mid.frontClip).toBe('');
    expect(mid.backClip).toBe('');

    await page.clock.runFor(300);
    const end = await snap(page);
    expect(end.backInert).toBe(false);
    expect(end.frontInert).toBe(true);
    expect(end.frontVisibility).toBe('hidden');
  });
});
