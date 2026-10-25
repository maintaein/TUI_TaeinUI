import { test, expect } from '@playwright/test';
import { mountLive } from './livePreview';

/**
 * Border 빛 링이 테두리선과 겹치는지 실제 레이아웃으로 잰다.
 *
 * 링은 `position: absolute`라 inset 0의 기준이 padding box다. 예전엔 링의 바깥 가장자리가
 * 테두리선 안쪽 가장자리에 놓여, 빛이 테두리선 위가 아니라 선 안쪽 띠에 그려졌다. 지금은
 * 링 바깥이 Border의 border box와 같고, 링 안쪽 구멍(빛이 비는 자리)이 padding box와 같다.
 * jsdom은 레이아웃을 계산하지 않아 잴 수 없다. glow를 켜면 호버·포커스 없이도 빛이 켜져 있다.
 */

const widths = [
  { width: 'thin', px: 1 },
  { width: 'medium', px: 2 },
  { width: 'thick', px: 4 },
] as const;
const roundeds = ['none', 'md', 'full'] as const;

for (const { width, px } of widths) {
  for (const rounded of roundeds) {
    test(`${width} ${rounded}: 빛 링 바깥은 border box, 안쪽 구멍은 padding box와 같다`, async ({
      page,
    }) => {
      const code = `<Border id="b" glow width="${width}" rounded="${rounded}" padding="md"><span>내용</span></Border>`;
      await mountLive(page, code, '#b');

      const m = await page.evaluate(() => {
        const b = document.getElementById('b')!;
        const ring = b.querySelector<HTMLElement>('span[aria-hidden="true"]')!;
        const r = ring.getBoundingClientRect();
        const o = b.getBoundingClientRect();
        const cs = getComputedStyle(ring);
        const pad = (p: string) => parseFloat(cs.getPropertyValue(p));
        return {
          ring: [r.left, r.top, r.right, r.bottom],
          border: [o.left, o.top, o.right, o.bottom],
          // 링 안쪽 구멍 = 링 사각형에서 링 padding을 뺀 content box
          hole: [
            r.left + pad('padding-left'),
            r.top + pad('padding-top'),
            r.right - pad('padding-right'),
            r.bottom - pad('padding-bottom'),
          ],
          // Border의 padding box = border box에서 테두리 두께를 뺀 것
          inner: [
            o.left + b.clientLeft,
            o.top + b.clientTop,
            o.left + b.clientLeft + b.clientWidth,
            o.top + b.clientTop + b.clientHeight,
          ],
          opacity: Number(cs.opacity),
          masked: cs.maskImage !== 'none' || cs.webkitMaskImage !== 'none',
        };
      });

      expect(m.border[2] - m.border[0]).toBeGreaterThan(2 * px);
      m.ring.forEach((v, i) =>
        expect(Math.abs(v - m.border[i])).toBeLessThan(1)
      );
      m.hole.forEach((v, i) =>
        expect(Math.abs(v - m.inner[i])).toBeLessThan(1)
      );
      expect(m.hole[0] - m.ring[0]).toBeCloseTo(px, 0);
      // 포커스·호버 없이 링이 켜져 있고 마스크가 살아 있다(꽉 찬 사각형이 아니다)
      await expect
        .poll(() =>
          page.evaluate(() =>
            Number(
              getComputedStyle(
                document.querySelector('#b span[aria-hidden="true"]')!
              ).opacity
            )
          )
        )
        .toBe(1);
      expect(m.masked).toBe(true);
    });
  }
}
