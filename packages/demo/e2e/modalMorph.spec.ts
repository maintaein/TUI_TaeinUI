import { test, expect, type Page } from '@playwright/test';

type Timeline = {
  pause: (time?: number) => Timeline;
  time: (time: number, suppressEvents?: boolean) => Timeline;
  duration: () => number;
};
type Dialog = HTMLElement & { __modalTimeline: Timeline };

const stageSelector = '[role="region"][aria-label="Modal 시연"]';

async function prepare(page: Page, width: number) {
  await page.setViewportSize({ width, height: 900 });
  await page.clock.install();
  await page.goto('/components/modal');
  const stage = page.locator(stageSelector);
  await stage.scrollIntoViewIfNeeded();
  const pause = page.getByRole('button', { name: '시연 멈춤' });
  const reduced = await page.evaluate(
    () => matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  if (!reduced) {
    await pause.click();
    await expect(
      page.getByRole('button', { name: '시연 다시 시작' })
    ).toBeVisible();
  }
  await expect(stage.locator('[role="dialog"]')).toHaveCount(0);
  return stage;
}

// clip-path는 boundingClientRect에 반영되지 않으므로 실제 보이는 사각형을 읽는다.
async function frame(page: Page, time: number) {
  return page.evaluate(
    ({ selector, time }) => {
      const stage = document.querySelector(selector)!;
      const dialog = stage.querySelector('[role="dialog"]') as Dialog;
      dialog.__modalTimeline.pause().time(time, true);
      const rect = dialog.getBoundingClientRect();
      const clip = getComputedStyle(dialog).clipPath;
      const inset = /^inset\(([^r)]+)/
        .exec(clip)?.[1]
        .trim()
        .split(/\s+/)
        .map(Number.parseFloat);
      const top = inset?.[0] ?? 0;
      const right = inset?.[1] ?? top;
      const bottom = inset?.[2] ?? top;
      const left = inset?.[3] ?? right;
      const scaleX = rect.width / dialog.offsetWidth;
      const scaleY = rect.height / dialog.offsetHeight;
      return {
        x: rect.left + left * scaleX,
        y: rect.top + top * scaleY,
        width: rect.width - (right + left) * scaleX,
        height: rect.height - (top + bottom) * scaleY,
        color: getComputedStyle(dialog).backgroundColor,
        copyOpacity: getComputedStyle(
          dialog.querySelector('[data-modal-trigger-copy]')!
        ).opacity,
        backdropOpacity: getComputedStyle(
          stage.querySelector('[data-backdrop]')!
        ).opacity,
        hidden: getComputedStyle(
          stage.querySelector('[data-stage-target="trigger"]')!
        ).visibility,
        opacity: getComputedStyle(dialog.firstElementChild!).opacity,
      };
    },
    { selector: stageSelector, time }
  );
}

for (const width of [1440, 390]) {
  test(`Modal ${width}: 단추의 모양과 색에서 창으로 자랐다 돌아온다`, async ({
    page,
  }, testInfo) => {
    const stage = await prepare(page, width);
    const trigger = stage.locator('[data-stage-target="trigger"]');
    const button = (await trigger.boundingBox())!;
    const buttonColor = await trigger.evaluate(
      (el) => getComputedStyle(el).backgroundColor
    );
    // DOM click은 첫 페인트 전에 타임라인을 멈출 수 있어 시작 프레임을 놓치지 않는다.
    await trigger.evaluate((el) => {
      (el as HTMLElement).focus();
      (el as HTMLElement).click();
    });
    const first = await frame(page, 0);
    for (const key of ['x', 'y', 'width', 'height'] as const) {
      expect(Math.abs(first[key] - button[key]), key).toBeLessThan(3);
    }
    expect(first.hidden).toBe('hidden');
    expect(first.color).toBe(buttonColor);
    expect(first.opacity).toBe('0');
    expect(first.copyOpacity).toBe('1');
    const clearing = await frame(page, 0.15);
    for (const key of ['x', 'y', 'width', 'height'] as const) {
      expect(Math.abs(clearing[key] - first[key]), key).toBeLessThan(1);
    }
    expect(clearing.color).not.toBe(buttonColor);
    expect(Number(clearing.copyOpacity)).toBeGreaterThan(0);
    expect(Number(clearing.copyOpacity)).toBeLessThan(1);
    const empty = await frame(page, 0.3);
    expect(empty.copyOpacity).toBe('0');
    const growing = await frame(page, 0.6);
    expect(growing.width).toBeGreaterThan(button.width);
    expect(growing.color).toBe(empty.color);
    expect(growing.opacity).toBe('0');
    expect(growing.copyOpacity).toBe('0');
    expect(Number(growing.backdropOpacity)).toBeGreaterThan(
      Number(clearing.backdropOpacity)
    );
    expect((await frame(page, 0.9)).opacity).toBe('0');
    expect(Number((await frame(page, 1.05)).opacity)).toBeGreaterThan(0);
    for (let index = 0; index < 12; index++) {
      const time = (index + 1) / 10;
      await frame(page, time);
      await stage.screenshot({
        path: testInfo.outputPath(`open-${index}.png`),
      });
    }
    const final = await frame(page, 1.2);
    const stageBox = (await stage.boundingBox())!;
    expect(
      Math.abs(final.x + final.width / 2 - (stageBox.x + stageBox.width / 2))
    ).toBeLessThan(3);
    expect(final.opacity).toBe('1');
    expect(final.width).toBeGreaterThan(button.width);
    // GSAP을 seek해도 별도 퇴장 타이머는 흐르므로 함께 멈춰 캡처 부하와 분리한다.
    await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 1000);
    await stage
      .locator('[data-stage-target="close"]')
      .evaluate((el) => (el as HTMLElement).click());
    // 780ms 퇴장보다 긴 호스트 지연에도 첫 닫힘 프레임이 남는지 확인한다.
    await page.waitForTimeout(850);
    for (let index = 0; index < 8; index++) {
      const time = 1.2 - (index * 0.1) / 0.65;
      await frame(page, time);
      await stage.screenshot({
        path: testInfo.outputPath(`close-${index}.png`),
      });
    }
    const fading = await frame(page, 1.05);
    expect(Number(fading.opacity)).toBeGreaterThan(0);
    expect(fading.copyOpacity).toBe('0');
    const shrinking = await frame(page, 0.6);
    expect(shrinking.opacity).toBe('0');
    expect(shrinking.copyOpacity).toBe('0');
    expect(shrinking.color).toBe(empty.color);
    const returning = await frame(page, 0.15);
    expect(returning.opacity).toBe('0');
    expect(Number(returning.copyOpacity)).toBeGreaterThan(0);
    expect(returning.color).not.toBe(empty.color);
    for (const key of ['x', 'y', 'width', 'height'] as const) {
      expect(Math.abs(returning[key] - button[key]), key).toBeLessThan(3);
    }
    await stage.evaluate((el) => {
      (
        el.querySelector('[role="dialog"]') as Dialog | null
      )?.__modalTimeline.time(0);
    });
    await expect(stage.locator('[role="dialog"]')).toHaveCount(0);
    await expect(trigger).toBeVisible();
    await expect(trigger).toBeFocused();
  });
}

test('transform이 있는 container에서도 첫 사각형이 단추와 일치한다', async ({
  page,
}) => {
  const stage = await prepare(page, 1440);
  await stage.evaluate((el) => {
    (el as HTMLElement).style.transform = 'scale(0.8)';
  });
  const trigger = stage.locator('[data-stage-target="trigger"]');
  const button = (await trigger.boundingBox())!;
  await trigger.evaluate((el) => {
    (el as HTMLElement).focus();
    (el as HTMLElement).click();
  });
  const first = await frame(page, 0);
  for (const key of ['x', 'y', 'width', 'height'] as const) {
    expect(Math.abs(first[key] - button[key]), key).toBeLessThan(3);
  }
});

test('축소 모션에서는 단추를 숨기지 않고 즉시 창을 표시한다', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const stage = await prepare(page, 390);
  const trigger = stage.locator('[data-stage-target="trigger"]');
  await trigger.click();
  await expect(trigger).toBeVisible();
  const dialog = stage.locator('[role="dialog"]');
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate((el) => getComputedStyle(el).clipPath)).toBe(
    'none'
  );
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test('전체 컴포넌트 미니에서도 단추가 창으로 자란다', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.mouse.move(2, 2);
  await page.goto('/components/overview');
  const mini = page.locator('[data-stage-mini="Modal 시연"]');
  await mini.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await expect
    .poll(() =>
      mini
        .locator('[data-stage-target="trigger"]')
        .evaluate((el) => (el as HTMLElement).style.visibility)
    )
    .toBe('hidden');
  await mini.locator('[role="dialog"]').evaluate((el) => {
    (el as Dialog).__modalTimeline.pause().time(0.15, true);
  });
  await mini.screenshot({ path: testInfo.outputPath('mini-morph.png') });
  expect(
    await mini
      .locator('[role="dialog"]')
      .evaluate((el) => getComputedStyle(el).clipPath)
  ).toContain('inset(');
});

test('닫힐 때 이동한 단추의 현재 사각형과 색으로 돌아간다', async ({
  page,
}) => {
  const stage = await prepare(page, 1440);
  const trigger = stage.locator('[data-stage-target="trigger"]');
  await trigger.evaluate((el) => {
    (el as HTMLElement).focus();
    (el as HTMLElement).click();
  });
  await frame(page, 1.2);
  await trigger.evaluate((el) => {
    (el as HTMLElement).style.transition = 'none';
    (el as HTMLElement).style.transform = 'translate(40px, 30px)';
    (el as HTMLElement).style.backgroundColor = 'rgb(20, 40, 60)';
  });
  const target = (await trigger.boundingBox())!;
  await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 1000);
  await stage
    .locator('[data-stage-target="close"]')
    .evaluate((el) => (el as HTMLElement).click());
  const last = await frame(page, 0.000001);
  for (const key of ['x', 'y', 'width', 'height'] as const) {
    expect(Math.abs(last[key] - target[key]), key).toBeLessThan(3);
  }
  expect(last.color).toBe('rgb(20, 40, 60)');
});

test('자라는 중 축소 모션을 켜도 내용과 단추가 남는다', async ({ page }) => {
  const stage = await prepare(page, 1440);
  const trigger = stage.locator('[data-stage-target="trigger"]');
  await trigger.evaluate((el) => {
    (el as HTMLElement).focus();
    (el as HTMLElement).click();
  });
  await frame(page, 0.1);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(trigger).toBeVisible();
  const dialog = stage.locator('[role="dialog"]');
  await expect(dialog).toHaveCSS('clip-path', 'none');
  await expect(dialog.locator(':scope > div')).toHaveCSS('opacity', '1');
});

test('창보다 큰 단추의 배경 면도 시작 크기에 맞춘다', async ({ page }) => {
  const stage = await prepare(page, 1440);
  const trigger = stage.locator('[data-stage-target="trigger"]');
  await trigger.evaluate((el) => {
    (el as HTMLElement).style.width = '700px';
  });
  const target = (await trigger.boundingBox())!;
  await trigger.evaluate((el) => {
    (el as HTMLElement).focus();
    (el as HTMLElement).click();
  });
  const first = await frame(page, 0);
  expect(Math.abs(first.width - target.width)).toBeLessThan(3);
  const paintedWidth = await stage
    .locator('[role="dialog"]')
    .evaluate((el) => el.getBoundingClientRect().width);
  expect(paintedWidth).toBeGreaterThanOrEqual(target.width - 3);
});
