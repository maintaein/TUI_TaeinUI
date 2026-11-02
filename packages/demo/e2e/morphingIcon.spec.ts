import { expect, test, type Page } from '@playwright/test';
import { createRequire } from 'node:module';
import type { MorphingPair } from '../../core/src/components/MorphingIcon/morphPairs';

// core 소스는 CommonJS 패키지 안에 있어 import로 읽으면 Playwright 변환과 어긋나 require로 읽는다.
// 주의: 발행물(dist)이 아니라 소스에서 기대값을 만들고, morphPairs.ts가 다른 모듈을 import하게 되면 이 require가 깨진다
const { MORPH_PAIRS, pointsAttr } = createRequire(import.meta.url)(
  '../../core/src/components/MorphingIcon/morphPairs.ts'
) as typeof import('../../core/src/components/MorphingIcon/morphPairs');

const stage = (page: Page) =>
  page.getByRole('region', { name: 'MorphingIcon 미리보기' });
const button = (page: Page, pair: MorphingPair) =>
  stage(page).locator(`[data-stage-target="${pair}"]`);

const pairs = Object.keys(MORPH_PAIRS) as MorphingPair[];

/** 단추 안 아이콘의 선마다 그려진 points와 opacity를 읽는다 */
const drawn = (page: Page, pair: MorphingPair) =>
  button(page, pair)
    .locator('svg polyline')
    .evaluateAll((lines) =>
      lines.map((l) => ({
        points: l.getAttribute('points'),
        opacity: l.getAttribute('opacity'),
      }))
    );

// 단추 이름은 고정이고 상태 속성은 하나다. 메뉴와 펼침은 aria-expanded, 그 밖의 토글은 aria-pressed
const stateAttr = (pair: MorphingPair) =>
  pair === 'menu-close' || pair === 'expand-collapse'
    ? 'aria-expanded'
    : 'aria-pressed';
const isOn = async (page: Page, pair: MorphingPair) =>
  (await button(page, pair).getAttribute(stateAttr(pair))) === 'true';

/** 정의가 DOM에 그려지는 모양 */
const expected = (pair: MorphingPair, active: boolean) =>
  MORPH_PAIRS[pair][active ? 1 : 0].map((l) => ({
    points: pointsAttr(l.points),
    opacity: `${l.opacity}`,
  }));

/**
 * 가상 시계를 깔고 페이지가 그려진 뒤 세운다. 대본이 앞서가 눌러 두었을 수 있으니,
 * 마우스로 무대를 넘겨받은 뒤 모든 단추를 앞 모양으로 맞춘다
 */
const startFrozen = async (page: Page) => {
  await page.clock.install();
  await page.goto('/motion/morphing-icon');
  await expect(button(page, 'menu-close')).toBeVisible();
  await page.clock.pauseAt(new Date(Date.now() + 200));
  await button(page, 'menu-close').hover();
  for (const pair of pairs) {
    if (await isOn(page, pair)) {
      await button(page, pair).click();
    }
  }
  await page.clock.runFor(1000);
};

test.describe('모양 바뀌는 아이콘 상세', () => {
  for (const pair of pairs) {
    test(`${pair}: 누르면 300ms 안팎에 끝 좌표가 정의와 같아진다`, async ({
      page,
    }) => {
      await startFrozen(page);
      expect(await drawn(page, pair)).toEqual(expected(pair, false));

      await button(page, pair).click();
      await page.clock.runFor(100);
      const mid = await drawn(page, pair);
      expect(mid).not.toEqual(expected(pair, false));
      expect(mid).not.toEqual(expected(pair, true));

      // 박자가 300ms라 250ms 지점은 아직 끝 좌표가 아니고 310ms 지점은 정확히 끝 좌표다
      await page.clock.runFor(150);
      expect(await drawn(page, pair)).not.toEqual(expected(pair, true));
      await page.clock.runFor(60);
      expect(await drawn(page, pair)).toEqual(expected(pair, true));

      await button(page, pair).click();
      await page.clock.runFor(400);
      expect(await drawn(page, pair)).toEqual(expected(pair, false));
    });
  }

  for (const pair of pairs) {
    test(`${pair}: 누르면 ${stateAttr(pair)}만 바뀌고 이름은 그대로다`, async ({
      page,
    }) => {
      await startFrozen(page);
      const target = button(page, pair);
      const other =
        stateAttr(pair) === 'aria-expanded' ? 'aria-pressed' : 'aria-expanded';
      const name = await target.getAttribute('aria-label');
      expect(name).toBeTruthy();
      await expect(target).toHaveAttribute(stateAttr(pair), 'false');
      await target.click();
      await expect(target).toHaveAttribute(stateAttr(pair), 'true');
      await expect(target).toHaveAttribute('aria-label', name!);
      await expect(target).not.toHaveAttribute(other, /.*/);
      await expect(target.locator('svg')).toHaveAttribute(
        'aria-hidden',
        'true'
      );
      await expect(target.locator('svg')).toHaveAttribute('focusable', 'false');
    });
  }

  test('도중에 다시 누르면 지금 모양에서 되돌아간다', async ({ page }) => {
    await startFrozen(page);
    await button(page, 'play-pause').click();
    await page.clock.runFor(120);
    const mid = await drawn(page, 'play-pause');
    await button(page, 'play-pause').click();
    // 다시 누른 순간 앞이나 뒤 끝으로 튀지 않는다
    expect(await drawn(page, 'play-pause')).toEqual(mid);
    await page.clock.runFor(400);
    expect(await drawn(page, 'play-pause')).toEqual(
      expected('play-pause', false)
    );
  });

  test('IconButton 안 아이콘은 글자 크기(1em)이고 단추를 넘치지 않는다', async ({
    page,
  }) => {
    await startFrozen(page);
    for (const pair of pairs) {
      const m = await button(page, pair).evaluate((b) => {
        const svg = b.querySelector('svg')!;
        const box = b.getBoundingClientRect();
        const icon = svg.getBoundingClientRect();
        return {
          fontSize: parseFloat(getComputedStyle(svg).fontSize),
          width: icon.width,
          height: icon.height,
          inside:
            icon.left >= box.left &&
            icon.right <= box.right &&
            icon.top >= box.top &&
            icon.bottom <= box.bottom,
        };
      });
      expect(m.fontSize).toBeGreaterThan(0);
      expect(m.width).toBeCloseTo(m.fontSize, 1);
      expect(m.height).toBeCloseTo(m.fontSize, 1);
      expect(m.inside).toBe(true);
    }
  });
});

test.describe('모양 바뀌는 아이콘 상세 (움직임 줄이기)', () => {
  test('기다림 없이 바로 끝 좌표로 바뀐다', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await startFrozen(page);
    await button(page, 'plus-check').click();
    // 시계를 한 번도 돌리지 않았다
    expect(await drawn(page, 'plus-check')).toEqual(
      expected('plus-check', true)
    );
    await button(page, 'plus-check').click();
    expect(await drawn(page, 'plus-check')).toEqual(
      expected('plus-check', false)
    );
  });
});
