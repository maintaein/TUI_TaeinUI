import { test, expect } from '@playwright/test';

/**
 * M3 Task 9: 조밀한 그리드(24개 인스턴스)를 일괄 토글하는 동안 프레임이
 * 끊기지 않는지 측정한다 (Ruling 65). 기존 데모 예제(Dense Grid)를 그대로
 * 쓴다. 새 예제를 추가하지 않는다(Ruling 76).
 *
 * 측정: rAF 콜백 60회의 프레임 간격(ms)을 기록하면서, 그 사이 "전체 선택/해제"
 * 버튼을 주기적으로 눌러 24개 인스턴스의 GSAP 트윈을 동시에 재트리거한다.
 * 중앙값 ≤ 20ms 그리고 50ms 넘는 프레임이 2개 이하여야 한다.
 */

interface FrameBudgetResult {
  intervals: number[];
  median: number;
  overBudgetCount: number;
}

const FRAME_COUNT = 60;
const TOGGLE_EVERY_N_FRAMES = 10;
const MEDIAN_BUDGET_MS = 20;
const OVER_BUDGET_THRESHOLD_MS = 50;
const MAX_OVER_BUDGET_FRAMES = 2;

const measureFrameBudget = async (
  page: import('@playwright/test').Page,
  toggleButtonName: RegExp
): Promise<FrameBudgetResult> => {
  const toggleButton = page.getByRole('button', { name: toggleButtonName });
  await toggleButton.click(); // 최초 1회 눌러 24개 트윈을 즉시 구동 상태로 만든다

  const intervals = await page.evaluate(
    ({ frameCount, toggleEvery, buttonPattern }) => {
      return new Promise<number[]>((resolve) => {
        const re = new RegExp(buttonPattern);
        const button = Array.from(document.querySelectorAll('button')).find(
          (b) => re.test(b.textContent ?? '')
        );

        const measured: number[] = [];
        let last = performance.now();
        let frame = 0;

        const tick = (now: number): void => {
          measured.push(now - last);
          last = now;
          frame += 1;
          if (frame % toggleEvery === 0) {
            button?.click();
          }
          if (frame < frameCount) {
            requestAnimationFrame(tick);
          } else {
            resolve(measured);
          }
        };

        requestAnimationFrame(tick);
      });
    },
    {
      frameCount: FRAME_COUNT,
      toggleEvery: TOGGLE_EVERY_N_FRAMES,
      buttonPattern: toggleButtonName.source,
    }
  );

  const sorted = [...intervals].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  const overBudgetCount = intervals.filter(
    (interval) => interval > OVER_BUDGET_THRESHOLD_MS
  ).length;

  return { intervals, median, overBudgetCount };
};

test.describe('조밀한 그리드 프레임 예산 (Ruling 65)', () => {
  test('Checkbox 24개 그리드를 일괄 토글해도 프레임 중앙값이 20ms 이하다', async ({
    page,
  }) => {
    await page.goto('/components/checkbox');
    // 페이지에는 Dense Grid 외에도 다른 예제의 Checkbox가 더 있으므로, "전체
    // 선택/해제" 버튼의 부모(그리드를 감싼 flex 컨테이너)로 범위를 좁힌다.
    const toggleButton = page.getByRole('button', { name: /전체 (선택|해제)/ });
    const section = toggleButton.locator('xpath=..');
    const checkboxes = section.getByRole('checkbox');
    await expect(checkboxes).toHaveCount(24, { timeout: 10_000 });

    const result = await measureFrameBudget(page, /전체 (선택|해제)/);

    console.log(
      `[frameBudget] Checkbox median=${result.median.toFixed(2)}ms overBudget=${result.overBudgetCount}/${FRAME_COUNT} intervals=${JSON.stringify(result.intervals.map((n) => Number(n.toFixed(2))))}`
    );

    expect(result.median).toBeLessThanOrEqual(MEDIAN_BUDGET_MS);
    expect(result.overBudgetCount).toBeLessThanOrEqual(MAX_OVER_BUDGET_FRAMES);
  });

  test('Switch 24개 그리드를 일괄 토글해도 프레임 중앙값이 20ms 이하다', async ({
    page,
  }) => {
    await page.goto('/components/switch');
    const toggleButton = page.getByRole('button', { name: /전체 (켜기|끄기)/ });
    const section = toggleButton.locator('xpath=..');
    const switches = section.getByRole('switch');
    await expect(switches).toHaveCount(24, { timeout: 10_000 });

    const result = await measureFrameBudget(page, /전체 (켜기|끄기)/);

    console.log(
      `[frameBudget] Switch median=${result.median.toFixed(2)}ms overBudget=${result.overBudgetCount}/${FRAME_COUNT} intervals=${JSON.stringify(result.intervals.map((n) => Number(n.toFixed(2))))}`
    );

    expect(result.median).toBeLessThanOrEqual(MEDIAN_BUDGET_MS);
    expect(result.overBudgetCount).toBeLessThanOrEqual(MAX_OVER_BUDGET_FRAMES);
  });
});
