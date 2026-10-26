import { test, expect } from '@playwright/test';
import { type gsap } from 'gsap';

const CASES = [
  { name: 'BoardRow', slug: 'board-row', key: '__boardRow' },
  { name: 'BottomSheet', slug: 'bottom-sheet', key: '__bottomSheet' },
  { name: 'SideSheet', slug: 'side-sheet', key: '__sideSheet' },
] as const;

for (const { name, slug, key } of CASES) {
  test(`${name}: 내용 전체가 함께 페이드인하고 위치는 움직이지 않는다`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.mouse.move(2, 2);
    await page.goto(`/components/${slug}`);
    const stage = page.getByRole('region', { name: `${name} 시연` });
    await stage.scrollIntoViewIfNeeded();
    const trigger = stage
      .locator(
        name === 'BoardRow' ? '[data-stage-target="header"]' : '[role="dialog"]'
      )
      .first();

    await expect
      .poll(async () =>
        trigger
          .evaluate((node, prefix) => {
            const host =
              prefix === '__boardRow'
                ? document.getElementById(node.getAttribute('aria-controls')!)!
                    .parentElement!
                : node;
            return !!(host as unknown as Record<string, gsap.core.Timeline>)[
              `${prefix}Fade`
            ];
          }, key)
          .catch(() => false)
      )
      .toBe(true);

    const frames = await trigger.evaluate((node, prefix) => {
      const host =
        prefix === '__boardRow'
          ? document.getElementById(node.getAttribute('aria-controls')!)!
              .parentElement!
          : node;
      const timelines = host as unknown as Record<string, gsap.core.Timeline>;
      const entrance = timelines[`${prefix}Timeline`];
      const fade = timelines[`${prefix}Fade`];
      // 등장 시점은 그대로 두고 내용만 두 중간 프레임에서 비교한다.
      entrance.pause().time(0.2);
      const targets = (
        fade.getChildren()[0] as gsap.core.Tween
      ).targets() as HTMLElement[];
      const body =
        prefix === '__boardRow'
          ? document.getElementById(node.getAttribute('aria-controls')!)!
              .firstElementChild!
          : node.querySelector('p')!.parentElement!;
      const items = Array.from(body.children);
      return [0.25, 0.5].map((progress) => {
        fade.pause().progress(progress);
        return {
          targetsBody: targets.length === 1 && targets[0] === body,
          opacity: Number(getComputedStyle(body).opacity),
          transform: getComputedStyle(body).transform,
          items: items.map((item) => ({
            opacity: getComputedStyle(item).opacity,
            transform: getComputedStyle(item).transform,
          })),
        };
      });
    }, key);

    for (const frame of frames) {
      expect(frame.targetsBody).toBe(true);
      expect(frame.opacity).toBeGreaterThan(0);
      expect(frame.opacity).toBeLessThan(1);
      expect(frame.transform).toBe('none');
      expect(frame.items.length).toBeGreaterThan(1);
      for (const item of frame.items) {
        expect(item.transform).toBe('none');
      }
    }
    expect(frames[1].opacity).toBeGreaterThan(frames[0].opacity);
    expect(frames[1].items).toEqual(frames[0].items);
    await page.screenshot({
      path: testInfo.outputPath(`${slug}-midpoint-1440.png`),
    });
  });
}
