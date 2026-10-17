import { test, expect } from '@playwright/test';
import { mountLive } from './livePreview';

/**
 * NumericSpinner 눌림 트윈의 회귀 셋을 실제 브라우저로 잰다.
 *
 * jsdom은 GSAP 트윈의 중간 프레임을 그리지 못하고 타임라인의 "시작 안 한 2단계"가
 * 나중에 값을 덮는 일을 재현하지 못한다. 시험은 트윈 객체가 죽었는지를 볼 뿐이고
 * 화면의 scale은 보지 못한다. 그래서 계산된 transform의 scale을 프레임마다 읽는다.
 *
 * 1. 빠른 연타 뒤 크기가 남는 결함. `overwrite: 'auto'`는 누름 타임라인의 시작 안 한
 *    2단계를 죽이지 못한다. 고친 곳은 stopHold의 `__pressTween?.kill()`이다(lesson 26).
 * 2. 두 버튼을 함께 누르는 결함(e208492). 숫자 칸의 눌림은 두 버튼이 합쳐서 정하므로
 *    하나만 떼도 눌림이 유지되고 마지막을 뗄 때만 부풀었다 내려앉는다.
 * 3. 뗌 도중 반대 버튼을 누르는 결함(6e62f75). 뗌 타임라인의 2단계가 나중에 시작해
 *    새 눌림을 덮고 숫자를 1로 돌려놓았다.
 *
 * 시간 근거(packages/core/src/tokens/animation.css.ts, NumericSpinner.tsx): 뗌은
 * fast(150ms)로 부풀고 slow(300ms)로 내려앉아 450ms이다. 깊은 눌림(2단계)은
 * REPEAT_RAMP_MS(1200ms)에 걸친다. 결함이 남기는 값은 이 2단계가 끝나야 확정되므로
 * 정착 대기는 1200 + 450을 넘겨 2000ms로 둔다. 반복 시작은 REPEAT_DELAY_MS(400ms)다.
 *
 * 샘플은 requestAnimationFrame마다 읽는다. 프레임이 하나도 안 잡히면 단언이 비어 조용히
 * 통과하므로 표본 수의 하한도 단언한다(하한은 정상 60fps의 1/4 수준이라 부하에 느슨하다).
 */

const SETTLE_MS = 2000;
const CODE = `const [v, setV] = useState(5);

<div id="ns"><NumericSpinner label="수량" value={v} onChange={setV} /></div>`;

test.describe('NumericSpinner 눌림 (실제 트윈 프레임)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await mountLive(page, '/components/numeric-spinner', CODE, '#ns');
  });

  test('버튼을 빠르게 여러 번 눌렀다 떼도 정착하면 버튼 둘과 숫자의 scale이 1이다', async ({
    page,
  }) => {
    const ns = page.locator('#ns');
    const plus = ns.getByRole('button', { name: '값 증가', exact: true });
    const minus = ns.getByRole('button', { name: '값 감소', exact: true });
    const input = ns.getByRole('spinbutton');
    const scales = () =>
      page.evaluate(() => {
        const q = (sel: string) =>
          new DOMMatrix(
            getComputedStyle(document.querySelector(sel)!).transform
          ).a;
        return [
          q('#ns button[aria-label="값 증가"]'),
          q('#ns button[aria-label="값 감소"]'),
          q('#ns input'),
        ];
      });

    for (const button of [plus, minus]) {
      const box = (await button.boundingBox())!;
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      // 누름 1단계(150ms) 한가운데에서 떼는 간격(80ms 주기)과 더 빠른 간격(15ms 주기).
      for (const cycleMs of [80, 15]) {
        for (let i = 0; i < 6; i++) {
          await page.mouse.down();
          await page.waitForTimeout(cycleMs / 2);
          await page.mouse.up();
          await page.waitForTimeout(cycleMs / 2);
        }
      }
    }
    await page.mouse.move(5, 5);
    await page.waitForTimeout(SETTLE_MS);

    expect(await input.count()).toBe(1);
    for (const scale of await scales()) {
      expect(scale).toBeCloseTo(1, 3);
    }
  });

  /** 한 시나리오를 페이지 안에서 돌려 왕복 지연이 타이밍에 끼지 않게 한다. */
  test('두 버튼을 함께 누르면 하나를 떼어도 숫자는 눌린 채이고 마지막을 뗄 때만 부푼다', async ({
    page,
  }) => {
    const out = await page.evaluate(async () => {
      const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
      const button = (label: string) =>
        document.querySelector<HTMLButtonElement>(
          `#ns button[aria-label="${label}"]`
        )!;
      const input = document.querySelector<HTMLInputElement>('#ns input')!;
      const scale = () => new DOMMatrix(getComputedStyle(input).transform).a;
      const fire = (label: string, type: string, id: number) =>
        button(label).dispatchEvent(
          new PointerEvent(type, {
            bubbles: true,
            pointerId: id,
            pointerType: 'touch',
            isPrimary: id === 1,
          })
        );
      const sample = async (ms: number) => {
        const out: number[] = [];
        const t0 = performance.now();
        while (performance.now() - t0 < ms) {
          out.push(scale());
          await new Promise((r) => requestAnimationFrame(r));
        }
        return out;
      };

      fire('값 증가', 'pointerdown', 1);
      await wait(200);
      fire('값 감소', 'pointerdown', 2);
      const both = await sample(200);
      fire('값 증가', 'pointerup', 1);
      const oneLeft = await sample(400);
      fire('값 감소', 'pointerup', 2);
      const afterLast = await sample(700);
      await wait(1500);
      return { both, oneLeft, afterLast, end: scale() };
    });

    // 표본이 비면 max/min이 조용히 통과한다.
    expect(out.both.length).toBeGreaterThan(5);
    expect(out.oneLeft.length).toBeGreaterThan(8);
    expect(out.afterLast.length).toBeGreaterThan(10);

    // 눌림 1단계 깊이는 0.82, 2단계는 0.76까지다. 0.9는 그 위의 여유다.
    expect(Math.max(...out.both)).toBeLessThan(0.9);
    // 하나를 뗀 동안에도 숫자는 눌린 채이고, 부풀지 않는다.
    expect(Math.max(...out.oneLeft)).toBeLessThan(0.9);
    // 마지막을 떼면 1을 넘어 부풀었다가(정점 1.12) 1로 내려앉는다.
    expect(Math.max(...out.afterLast)).toBeGreaterThan(1.05);
    expect(out.end).toBeCloseTo(1, 3);
  });

  for (const releaseToPressMs of [60, 180]) {
    test(`증가를 떼고 ${releaseToPressMs}ms 뒤 감소를 누르면 숫자는 1로 튀지 않고 부푼 값에서 눌림 쪽으로 간다`, async ({
      page,
    }) => {
      const samples = await page.evaluate(async (gapMs) => {
        const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
        const button = (label: string) =>
          document.querySelector<HTMLButtonElement>(
            `#ns button[aria-label="${label}"]`
          )!;
        const input = document.querySelector<HTMLInputElement>('#ns input')!;
        const fire = (label: string, type: string, id: number) =>
          button(label).dispatchEvent(
            new PointerEvent(type, {
              bubbles: true,
              pointerId: id,
              pointerType: 'touch',
              isPrimary: true,
            })
          );

        fire('값 증가', 'pointerdown', 1);
        await wait(300);
        fire('값 증가', 'pointerup', 1);
        await wait(gapMs);
        fire('값 감소', 'pointerdown', 2);
        const out: number[] = [];
        const t0 = performance.now();
        while (performance.now() - t0 < 500) {
          out.push(new DOMMatrix(getComputedStyle(input).transform).a);
          await new Promise((r) => requestAnimationFrame(r));
        }
        fire('값 감소', 'pointerup', 2);
        return out;
      }, releaseToPressMs);

      expect(samples.length).toBeGreaterThan(10);
      // 부푼 자리에서 시작해 눌림 쪽으로만 간다. 뗌 2단계가 덮으면 눌림 도중에 1 쪽으로 되오른다.
      // 프레임 사이 증가가 아니라 지금까지의 최저값 대비로 본다(되오름이 프레임마다
      // 조금씩이면 프레임 간 비교는 놓친다). 0.005는 서브픽셀 반올림 여유다.
      let lowest = samples[0];
      samples.forEach((scale, i) => {
        expect(scale, `프레임 ${i}`).toBeLessThanOrEqual(lowest + 0.005);
        lowest = Math.min(lowest, scale);
      });
      expect(samples[0]).toBeGreaterThan(samples[samples.length - 1]);
      expect(samples[samples.length - 1]).toBeLessThan(0.9);
    });
  }
});
