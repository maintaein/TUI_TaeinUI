import { expect, test, type Locator, type Page } from '@playwright/test';

const choose = async (page: Page, prop: string, value: string) => {
  const radios = page.getByRole('radiogroup', { name: prop, exact: true });
  if (await radios.count())
    await radios
      .getByRole('radio', { name: value, exact: true })
      .locator('..')
      .click();
  else
    await page
      .getByRole('group', { name: prop, exact: true })
      .getByRole('button', { name: value, exact: true })
      .click();
};

// 가상 요소의 CSS 애니메이션도 포함해야 Skeleton wave의 회귀를 잡는다.
const sample = (root: Locator) =>
  root.evaluate((el) =>
    el
      .getAnimations({ subtree: true })
      .filter((a) => a.effect?.getTiming().iterations === Infinity)
      .map((a) => ({ time: a.currentTime, state: a.playState }))
  );

const expectFrozen = async (root: Locator) => {
  const before = await sample(root);
  expect(before.length).toBeGreaterThan(0);
  expect(before.every((a) => a.state === 'paused')).toBe(true);
  await root.page().waitForTimeout(500);
  expect(await sample(root)).toEqual(before);
  return before;
};

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.mouse.move(2, 2);
});

for (const name of [
  'Border',
  'Loader',
  'Skeleton',
  'BottomSheet',
  'SideSheet',
]) {
  test(`${name} 미니의 반복은 멈춘 자세에서 0.5초 동안 서고 재개된다`, async ({
    page,
  }) => {
    await page.goto('/components/overview');
    const pause = page.getByRole('button', { name: '움직임 멈춤' });
    await pause.click();
    const root = page.locator(`[data-stage-mini="${name} 시연"]`);
    await root.evaluate((el) => el.scrollIntoView({ block: 'center' }));
    // inert 미니를 직접 조작할 수 없으므로 대본과 같은 합성 클릭으로 로딩 장면을 연다.
    if (name === 'Skeleton')
      await root
        .locator('[data-stage-target="reload"]')
        .evaluate((el: HTMLButtonElement) => el.click());
    await page.waitForTimeout(650);
    const before = await expectFrozen(root);
    // 머리 단추로 스크롤하면 미니가 화면 밖이 되어 대본이 멈추므로 제자리에서 토글한다.
    await pause.evaluate((el: HTMLButtonElement) => el.click());
    await expect(pause).toHaveAttribute('aria-pressed', 'false');
    // 시트는 대표 장면을 닫은 뒤 대본으로 다시 열려야 둥실거림이 시작된다.
    await expect
      .poll(async () => (await sample(root)).some((a) => a.state === 'running'))
      .toBe(true);
    await page.waitForTimeout(500);
    const after = await sample(root);
    expect(after.length).toBeGreaterThan(0);
    expect(after.some((a, i) => a.time !== before[i]?.time)).toBe(true);
    expect(after.every((a) => a.state === 'running')).toBe(true);
  });
}

for (const type of ['orbit', 'spinner', 'dots', 'bar', 'wave']) {
  test(`상세 Loader ${type}도 일시정지와 재개가 된다`, async ({ page }) => {
    await page.goto('/components/loader');
    const root = page.getByRole('region', { name: 'Loader 시연', exact: true });
    await root.getByRole('button', { name: '시연 멈춤', exact: true }).click();
    await choose(page, 'type', type);
    await page.mouse.move(2, 2);
    const before = await expectFrozen(root);
    await root
      .getByRole('button', { name: '시연 다시 시작', exact: true })
      .click();
    await page.mouse.move(2, 2);
    await page.waitForTimeout(500);
    const after = await sample(root);
    expect(after.some((a, i) => a.time !== before[i]?.time)).toBe(true);
    expect(after.every((a) => a.state === 'running')).toBe(true);
  });
}

test('상세 Skeleton pulse도 일시정지와 재개가 된다', async ({ page }) => {
  await page.goto('/components/skeleton');
  const root = page.getByRole('region', { name: 'Skeleton 시연', exact: true });
  await root.getByRole('button', { name: '시연 멈춤', exact: true }).click();
  await choose(page, 'animation', 'pulse');
  await page.mouse.move(2, 2);
  const before = await expectFrozen(root);
  await root
    .getByRole('button', { name: '시연 다시 시작', exact: true })
    .click();
  await page.mouse.move(2, 2);
  await page.waitForTimeout(500);
  expect((await sample(root)).some((a, i) => a.time !== before[i]?.time)).toBe(
    true
  );
});
