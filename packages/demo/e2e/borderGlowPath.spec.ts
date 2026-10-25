import { test, expect, type Locator, type Page } from '@playwright/test';
import sharp from 'sharp';
import { mountLive } from './livePreview';

async function seek(page: Page, time: number) {
  return page.evaluate(async (time) => {
    const ring = document.querySelector('#b span[aria-hidden="true"]')!;
    const animations = ring.getAnimations({ subtree: true });
    if (animations.length !== 1)
      throw new Error('빛 애니메이션은 하나여야 한다');
    animations[0].pause();
    animations[0].currentTime = time;
    await new Promise(requestAnimationFrame);
    const cs = getComputedStyle(ring, '::before');
    return {
      distance: parseFloat(cs.offsetDistance),
      path: cs.offsetPath,
      rotate: cs.offsetRotate,
      duration: cs.animationDuration,
      fill: cs.animationFillMode,
    };
  }, time);
}

async function pixels(border: Locator) {
  return sharp(await border.screenshot({ animations: 'allow' }))
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
}

// 둥근 테두리의 중심선을 1px 간격으로 훑어 양쪽 마스크 경계의 안티앨리어싱도 함께 잰다.
function perimeter(
  width: number,
  height: number,
  radius: number,
  stroke: number
) {
  const points: [number, number][] = [];
  const half = stroke / 2;
  const r = Math.max(0, Math.min(radius, width / 2, height / 2) - half);
  const w = width - stroke;
  const h = height - stroke;
  for (const [cx, cy, angle, length] of [
    [w - r, r, -Math.PI / 2, w - 2 * r],
    [w - r, h - r, 0, h - 2 * r],
    [r, h - r, Math.PI / 2, w - 2 * r],
    [r, r, Math.PI, h - 2 * r],
  ]) {
    for (let d = 0; d < length; d++) {
      points.push([
        half +
          cx -
          (length - d) * Math.cos(angle + Math.PI / 2) +
          r * Math.cos(angle),
        half +
          cy -
          (length - d) * Math.sin(angle + Math.PI / 2) +
          r * Math.sin(angle),
      ]);
    }
    for (let d = 0; d < (Math.PI * r) / 2; d++) {
      points.push([
        half + cx + r * Math.cos(angle + d / r),
        half + cy + r * Math.sin(angle + d / r),
      ]);
    }
  }
  return points;
}

for (const rounded of ['none', 'sm', 'md', 'lg', 'full']) {
  for (const stroke of [1, 2, 4]) {
    test(`${rounded} ${stroke}px: 넓은 상자와 카드의 둘레 화소에 빛이 한 덩어리다`, async ({
      page,
    }) => {
      test.setTimeout(60_000);
      const width = { 1: 'thin', 2: 'medium', 4: 'thick' }[stroke];
      await mountLive(
        page,
        `<Border id="b" glow rounded="${rounded}" width="${width}" style={{width: 640, height: 80}} />`,
        '#b'
      );
      const border = page.locator('#b');
      for (const [w, h] of [
        [640, 80],
        [240, 120],
      ]) {
        await border.evaluate(
          (b, [w, h]) => {
            b.style.width = `${w}px`;
            b.style.height = `${h}px`;
          },
          [w, h]
        );
        const radius = await border.evaluate((b) =>
          parseFloat(getComputedStyle(b).borderTopLeftRadius)
        );
        await seek(page, 0);
        await page.addStyleTag({ content: '#b > span { visibility: hidden }' });
        const baseline = await pixels(border);
        await page.addStyleTag({
          content: '#b > span { visibility: visible }',
        });
        const points = perimeter(
          baseline.info.width,
          baseline.info.height,
          radius,
          stroke
        );
        const positions: number[] = [];
        for (const time of [0, 300, 750, 1200, 1500, 1800, 2250, 2700]) {
          await seek(page, time);
          const frame = await pixels(border);
          const lit = points.map(([x, y]) => {
            let difference = 0;
            for (
              let dy = -Math.ceil(stroke / 2);
              dy <= Math.ceil(stroke / 2);
              dy++
            ) {
              for (
                let dx = -Math.ceil(stroke / 2);
                dx <= Math.ceil(stroke / 2);
                dx++
              ) {
                const px = Math.round(x + dx);
                const py = Math.round(y + dy);
                if (
                  px < 0 ||
                  py < 0 ||
                  px >= frame.info.width ||
                  py >= frame.info.height
                )
                  continue;
                const index = (py * frame.info.width + px) * 3;
                for (let c = 0; c < 3; c++) {
                  difference = Math.max(
                    difference,
                    Math.abs(frame.data[index + c] - baseline.data[index + c])
                  );
                }
              }
            }
            return difference > 25;
          });
          // 모서리의 반올림으로 생기는 3px 이하 틈만 메운다. 멀리 떨어진 두 빛은 합치지 않는다.
          const joined = lit.map(
            (value, i) =>
              value ||
              [1, 2, 3].some(
                (gap) =>
                  lit[(i - gap + lit.length) % lit.length] &&
                  Array.from(
                    { length: 4 - gap },
                    (_, ahead) => lit[(i + ahead + 1) % lit.length]
                  ).some(Boolean)
              )
          );
          const blobs = joined.filter(
            (value, i) =>
              value && !joined[(i - 1 + joined.length) % joined.length]
          ).length;
          expect(blobs, `${w}x${h}, ${time}ms의 밝은 덩어리 수`).toBe(1);
          expect(lit.filter(Boolean).length).toBeGreaterThan(2);
          let x = 0;
          let y = 0;
          lit.forEach((value, i) => {
            if (!value) return;
            x += Math.cos((i / lit.length) * Math.PI * 2);
            y += Math.sin((i / lit.length) * Math.PI * 2);
          });
          positions.push((Math.atan2(y, x) / (Math.PI * 2) + 1) % 1);
        }
        for (let i = 1; i < positions.length; i++) {
          const advance = (positions[i] - positions[i - 1] + 1) % 1;
          expect(
            advance,
            '화소로 잰 빛의 위치가 둘레를 따라 전진한다'
          ).toBeGreaterThan(0.005);
          expect(advance).toBeLessThan(0.3);
        }
      }
    });
  }
}

test('빛은 둥근 둘레를 돌며 두 반바퀴마다 느리게 빨라지고 다시 느려진다', async ({
  page,
}) => {
  await mountLive(
    page,
    '<Border id="b" glow rounded="full" style={{width: 640, height: 80}} />',
    '#b'
  );
  const samples = [];
  for (const time of [
    0, 150, 600, 750, 1350, 1500, 1650, 2100, 2250, 2850, 3000,
  ]) {
    samples.push(await seek(page, time));
  }
  expect(samples[0].path).toBe('border-box');
  expect(samples[0].rotate).toBe('auto 0deg');
  expect(samples[0].duration).toBe('3s');
  expect(samples[0].fill).toBe('none');
  expect(samples[0].distance).toBe(0);
  expect(samples[5].distance).toBeCloseTo(50);
  expect(samples[10].distance).toBeCloseTo(0);
  for (const start of [0, 5]) {
    const slow = samples[start + 1].distance - samples[start].distance;
    const fast = samples[start + 3].distance - samples[start + 2].distance;
    const endSlow = (start === 0 ? 50 : 100) - samples[start + 4].distance;
    expect(fast).toBeGreaterThan(slow * 3);
    expect(endSlow).toBeCloseTo(slow, 1);
  }
});
