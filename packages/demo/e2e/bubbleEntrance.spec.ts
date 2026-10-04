import { test, expect, type Page } from '@playwright/test';

/**
 * M5 Task 7 fix-1: Tooltip과 Popover의 등장 트랜지션이 매번 실행되는지 잰다.
 *
 * jsdom은 트랜지션을 그리지 못하므로 단위 테스트로는 이 회귀를 못 잡는다.
 * 닫힘 클래스로 커밋한 뒤 열림 클래스로 바꾸는데, 브라우저가 닫힘 스타일을 한
 * 번도 계산하기 전에 바뀌면 트랜지션이 시작되지 않고 bubble이 처음부터 최종
 * 크기로 나타난다.
 *
 * 측정 방식: MutationObserver가 노드 삽입을 잡되 그 순간엔 아무것도 읽지
 * 않는다(읽으면 스타일 계산이 강제되어 경쟁 조건이 가려진다). rAF 두 번 뒤에
 * scale과 실행 중인 애니메이션 수를 읽는다. 열림 직전 계산 스타일을 읽는
 * 줄(useBubblePresence)이 없으면 Tooltip은 12회 중 대부분 scale 1로 나타난다.
 *
 * 고치기 전 실측: Vite dev(playwright.config.ts의 webServer)에서 Tooltip 1/12,
 * 빌드 후 `vite preview`에서 0/12. 어느 쪽이든 재현되므로 기본 설정(dev)으로 돈다.
 * Popover는 둘 다 고치기 전에도 12/12였다. 클릭 경로는 이 환경에서 경쟁에서
 * 이기므로 Popover 시나리오는 훅을 거치는 배선이 유지되는지만 지킨다.
 *
 * Tooltip 시나리오는 매 회 포인터를 치우고 SETTLE_MS + 300ms(900ms)를 기다린다.
 * _internal/tooltipWarmth.ts의 WARM_MS(300)보다 길어서 매 회 차가운 상태다.
 * 연달아 보는 툴팁은 따뜻한 상태에서 등장을 정당하게 건너뛰므로, 대기를
 * WARM_MS 이하로 줄이면 이 spec이 거짓으로 실패한다.
 */

const RUNS = 12;
const SETTLE_MS = 600;

interface Entrance {
  scale: number;
  animations: number;
}

const arm = (page: Page, role: 'tooltip' | 'dialog') =>
  page.evaluate((r) => {
    const w = window as unknown as { __entrance: Promise<Entrance> };
    w.__entrance = new Promise<Entrance>((resolve) => {
      const observer = new MutationObserver(() => {
        const node = document.querySelector(`[role="${r}"]`);
        if (!node) return;
        observer.disconnect();
        requestAnimationFrame(() =>
          requestAnimationFrame(() =>
            resolve({
              scale: new DOMMatrix(getComputedStyle(node).transform).a,
              animations: node.getAnimations().length,
            })
          )
        );
      });
      observer.observe(document.body, { childList: true, subtree: true });
    });
  }, role);

const result = (page: Page) =>
  page.evaluate(
    () => (window as unknown as { __entrance: Promise<Entrance> }).__entrance
  );

const entranceRan = ({ scale, animations }: Entrance) =>
  scale < 0.999 || animations > 0;

test.describe('bubble 등장 트랜지션', () => {
  test.describe.configure({ timeout: 60_000 });

  test(`Tooltip 등장이 ${RUNS}회 모두 실행된다`, async ({ page }) => {
    await page.goto('/components/tooltip');
    const trigger = page.getByRole('button', { name: 'hover me' });
    await trigger.waitFor();

    const runs: Entrance[] = [];
    for (let i = 0; i < RUNS; i++) {
      await arm(page, 'tooltip');
      await trigger.hover();
      runs.push(await result(page));
      await page.mouse.move(0, 0);
      await page.waitForTimeout(SETTLE_MS + 300);
      await expect(page.getByRole('tooltip')).toHaveCount(0);
    }

    console.log(
      `Tooltip ${runs.filter(entranceRan).length}/${RUNS} scale:`,
      runs.map((r) => r.scale.toFixed(2)).join(' ')
    );
    expect(runs.filter(entranceRan)).toHaveLength(RUNS);
  });

  test(`Popover 등장이 ${RUNS}회 모두 실행된다`, async ({ page }) => {
    await page.goto('/components/popover');
    const trigger = page.locator('[aria-haspopup="dialog"]').first();
    await trigger.waitFor();

    const runs: Entrance[] = [];
    for (let i = 0; i < RUNS; i++) {
      await arm(page, 'dialog');
      await trigger.click();
      runs.push(await result(page));
      await trigger.click();
      await page.waitForTimeout(SETTLE_MS);
      await expect(page.getByRole('dialog')).toHaveCount(0);
    }

    console.log(
      `Popover ${runs.filter(entranceRan).length}/${RUNS} scale:`,
      runs.map((r) => r.scale.toFixed(2)).join(' ')
    );
    expect(runs.filter(entranceRan)).toHaveLength(RUNS);
  });
});
