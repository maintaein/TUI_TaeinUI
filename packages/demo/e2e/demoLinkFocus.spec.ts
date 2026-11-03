import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect, type Page } from '@playwright/test';

/**
 * 데모 사이트 자체 링크의 키보드 포커스도 바깥 링이 아니라 가장자리 안쪽이다(사용자 결정, M7.2 T4 수정 2).
 * 본문 링크(면·테두리 없음)는 옅은 면과 primary 2px, 건너뛰기 링크(파랑 면)는 짙은 단계 2px와 안쪽 흰 2px.
 * 색은 계산값 rgb다: primary.main #1976D2, primary[900] #0D47A1, 흰색.
 */
const PRIMARY = 'rgb(25, 118, 210)';
const PRIMARY_DARK = 'rgb(13, 71, 161)';
const WHITE = 'rgb(255, 255, 255)';

const read = (page: Page) =>
  page.evaluate(() => {
    const el = document.activeElement as HTMLElement;
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      href: el.getAttribute('href'),
      outline: s.outlineStyle,
      shadow: s.boxShadow,
      bg: s.backgroundColor,
      cx: r.x + r.width / 2,
      cy: r.y + r.height / 2,
      h: r.height,
    };
  });

test.describe('데모 자체 링크 포커스', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('건너뛰기 링크: 파랑 면 위 짙은 2px와 안쪽 흰 2px, 바깥 링 없음', async ({
    page,
  }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const skip = await read(page);
    expect(skip.href).toBe('#main-content');
    expect(skip.outline).toBe('none');
    expect(skip.shadow).toBe(
      `${PRIMARY_DARK} 0px 0px 0px 2px inset, ${WHITE} 0px 0px 0px 4px inset`
    );
  });

  test('본문 링크: 옅은 면과 안쪽 primary 2px, 바깥 링 없음, 글자 자리 그대로', async ({
    page,
  }) => {
    await page.goto('/getting-started');
    // 문단 안 글 링크(사이드바에도 같은 주소의 링크가 있어 문단으로 좁힌다)
    const link = page.locator('main p a[href="/components/overview"]').first();
    await link.waitFor();
    let reached = false;
    for (let i = 0; i < 80 && !reached; i += 1) {
      await page.keyboard.press('Tab');
      reached = await link.evaluate((el) => el === document.activeElement);
    }
    expect(reached, 'Tab으로 본문 링크에 닿지 않았다').toBe(true);
    const seen = await read(page);
    expect(seen.outline).toBe('none');
    expect(seen.shadow).toBe(`${PRIMARY} 0px 0px 0px 2px inset`);
    expect(seen.bg).not.toBe('rgba(0, 0, 0, 0)');
    // 포커스를 풀고 같은 자리에서 다시 잰다(Tab이 스크롤을 옮기므로 포커스 전 값과 비교하지 않는다)
    await page.evaluate(() => (document.activeElement as HTMLElement).blur());
    const before = await link.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { cx: r.x + r.width / 2, cy: r.y + r.height / 2, h: r.height };
    });
    expect(Math.abs(seen.cx - before.cx)).toBeLessThan(0.6);
    expect(Math.abs(seen.cy - before.cy)).toBeLessThan(0.6);
    expect(seen.h).toBeCloseTo(before.h, 0);
  });
});

test('데모 소스에 바깥 링(outlineOffset, none 아닌 outline)이 없다', () => {
  // 한계: 소스 문자열 검사다. 데모는 포커스 헬퍼를 두지 않아 이걸로 충분하다(core는 빌드된 CSS를 본다).
  const files = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory()
        ? files(join(dir, e.name))
        : e.name.endsWith('.css.ts')
          ? [join(dir, e.name)]
          : []
    );
  const root = fileURLToPath(new URL('../src', import.meta.url));
  const found = files(root).flatMap((f) => {
    const css = readFileSync(f, 'utf-8');
    return [
      ...(css.match(/outlineOffset/g) ?? []),
      ...(css.match(/outline: (?!'none')[^\n]*/g) ?? []),
    ].map((m) => `${f}: ${m}`);
  });
  expect(found).toEqual([]);
});
