import { test, expect, type Page } from '@playwright/test';

/**
 * TextField 무대: 클릭 0회로 틀린 이메일을 쓰고 확인을 누르면 입력칸이 좌우로 흔들리고 빨개지며 오류 문구가
 * 내려온다. 고쳐 쓰고 다시 누르면 초록 확인 문구가 보인다. 전체 컴포넌트의 미니도 같은 대본을 돈다.
 * 흔들림은 입력칸 transform의 translateX가 프레임마다 바뀌는 것으로 잰다(jsdom은 프레임을 그리지 않는다).
 */

interface Run {
  /** 흔들림 중 본 translateX 값들 */
  xs: number[];
  /** 오류 순간의 입력칸 */
  invalid: boolean;
  errorColor: string;
  errorText: string;
  /** 성공 순간 */
  successText: string;
  successBorder: string;
  successInvalid: boolean;
  /** 문구 아래 끝이 무대 아래 끝 안에 든다 */
  errorFits: boolean;
  successFits: boolean;
}

/** 무대 안 입력칸을 프레임마다 읽으며 대본이 실패에서 성공까지 가는 것을 기다린다 */
const watch = (page: Page, root: string) =>
  page.evaluate(
    (sel) =>
      new Promise<Run>((resolve, reject) => {
        const stage = document.querySelector(sel)!;
        const input = stage.querySelector('input')!;
        const run: Run = {
          xs: [],
          invalid: false,
          errorColor: '',
          errorText: '',
          successText: '',
          successBorder: '',
          successInvalid: true,
          errorFits: false,
          successFits: false,
        };
        const fits = () => {
          const msg = input.parentElement!.querySelector<HTMLElement>(
            'span[id]:not([for])'
          );
          return (
            !!msg &&
            msg.getBoundingClientRect().bottom <=
              stage.getBoundingClientRect().bottom + 0.5
          );
        };
        const end = performance.now() + 40_000;
        const tick = () => {
          if (performance.now() > end) return reject(new Error('시간 초과'));
          const cs = getComputedStyle(input);
          const m = new DOMMatrix(cs.transform === 'none' ? '' : cs.transform);
          if (input.getAttribute('aria-invalid') === 'true') {
            run.invalid = true;
            // 테두리 색 전이(150ms)가 끝난 뒤의 값이 남도록 매 프레임 덮어쓴다
            run.errorColor = cs.borderTopColor;
            run.xs.push(m.m41);
            const msg = input.parentElement!.querySelector(
              'span[id]:not([for])'
            );
            if (msg) {
              run.errorText = msg.textContent ?? '';
              run.errorFits = fits();
            }
          }
          const done = [...input.parentElement!.querySelectorAll('span[id]')]
            .map((s) => s.textContent ?? '')
            .find((s) => s.includes('사용할 수 있는'));
          if (done && run.invalid) {
            // 테두리 색 전이가 끝나도록 잠시 뒤에 읽는다
            return void setTimeout(() => {
              run.successText = done;
              run.successBorder = getComputedStyle(input).borderTopColor;
              run.successInvalid =
                input.getAttribute('aria-invalid') === 'true';
              run.successFits = fits();
              resolve(run);
            }, 500);
          }
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }),
    root
  );

const verify = (run: Run) => {
  // 오류: 빨강 테두리, 문구, 좌우 흔들림(양쪽으로 6px 넘게)
  expect(run.invalid).toBe(true);
  expect(run.errorText).toContain('이메일 형식이 아닙니다');
  expect(run.errorColor).toBe('rgb(211, 47, 47)');
  expect(Math.min(...run.xs)).toBeLessThan(-5);
  expect(Math.max(...run.xs)).toBeGreaterThan(5);
  expect(run.errorFits).toBe(true);
  // 성공: success.dark(rgb 46,125,50) 테두리, aria-invalid 아님, 문구
  expect(run.successBorder).toBe('rgb(46, 125, 50)');
  expect(run.successInvalid).toBe(false);
  expect(run.successFits).toBe(true);
};

for (const [width, height] of [
  [1280, 800],
  [375, 812],
] as const) {
  test(`${width}px: 상세 무대가 클릭 없이 흔들리며 실패하고 고치면 성공한다`, async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width, height });
    await page.mouse.move(2, 2);
    await page.goto('/components/text-field');
    const stage = page.getByRole('region', { name: 'TextField 시연' });
    await stage.scrollIntoViewIfNeeded();
    verify(await watch(page, '[role="region"][aria-label="TextField 시연"]'));
  });
}

test('전체 컴포넌트의 TextField 미니도 흔들리며 실패하고 성공한다, 문구가 잘리지 않는다', async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.mouse.move(2, 2);
  await page.goto('/components/overview');
  const mini = page.locator('[data-stage-mini="TextField 시연"]');
  await mini.evaluate((e) => e.scrollIntoView({ block: 'center' }));
  verify(await watch(page, '[data-stage-mini="TextField 시연"]'));
});

test('축소 모션: 오류에 흔들림 없이 색만 바뀐다', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/components/text-field');
  await page.getByText('error', { exact: true }).first().click();
  const input = page
    .getByRole('region', { name: 'TextField 시연' })
    .locator('input');
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  const m = await input.evaluate((el) => {
    const cs = getComputedStyle(el);
    return {
      duration: parseFloat(cs.animationDuration),
      iterations: cs.animationIterationCount,
      transform: cs.transform,
      color: cs.borderTopColor,
    };
  });
  // 흔들림은 0.01ms 1회로 끝나 제자리다
  expect(m.duration).toBeLessThan(0.001);
  expect(m.iterations).toBe('1');
  expect(m.transform).toBe('none');
  expect(m.color).toBe('rgb(211, 47, 47)');
});
