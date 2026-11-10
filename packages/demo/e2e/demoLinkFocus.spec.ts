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

/**
 * 링크 상자의 x·폭, 첫 글자의 x, 안쪽 내용(글자와 그림) 전체의 가로 범위.
 * 포커스가 자리를 옮기는지, 안쪽 2px 테두리가 내용에 닿는지 본다.
 */
const place = (page: Page, selector: string) =>
  page
    .locator(selector)
    .first()
    .evaluate((el) => {
      const r = el.getBoundingClientRect();
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      const text = walker.nextNode() as Text;
      const range = document.createRange();
      range.setStart(text, 0);
      range.setEnd(text, 1);
      const all = document.createRange();
      all.selectNodeContents(el);
      const c = all.getBoundingClientRect();
      return {
        x: r.x,
        y: r.y,
        width: r.width,
        height: r.height,
        textX: range.getBoundingClientRect().x,
        contentLeft: c.left,
        contentRight: c.right,
        contentTop: c.top,
        contentBottom: c.bottom,
        // 바로 뒤 이웃(아랫줄 글, 뒤따르는 글자, 옆 링크)의 글자 상자
        next: (() => {
          const n = el.nextSibling;
          if (!n) return null;
          const rg = document.createRange();
          if (n.nodeType === Node.TEXT_NODE) {
            if (!n.textContent?.trim()) return null;
            rg.setStart(n, 0);
            rg.setEnd(n, 1);
          } else {
            rg.selectNodeContents(n);
          }
          const q = rg.getBoundingClientRect();
          return { left: q.left, right: q.right, top: q.top, bottom: q.bottom };
        })(),
      };
    });

/** 포커스 표시(안쪽 테두리) 두께 */
const RING = 2;

/**
 * 안쪽 테두리를 받는 링크들. 어느 것이든 포커스가 자리를 옮기지 않고, 이웃 글자가 테두리 상자에 들지 않는다.
 * room은 링크가 스스로 둔 여유 방향이다(all 사방, inline 가로, none 없음). 있는 방향은 내용이 테두리에 닿지 않아야 한다.
 * 아랫줄과 틈이 없는 FrameCard 제목은 가로만, 글 흐름 속 본문 링크는 이웃 글자를 위해 세로만.
 */
type Room = 'all' | 'inline' | 'block' | 'none';
const LINKS: { name: string; url: string; selector: string; room: Room }[] = [
  {
    name: '건너뛰기 링크',
    url: '/',
    selector: 'a[href="#main-content"]',
    room: 'all',
  },
  {
    name: '사이드바',
    url: '/components/switch',
    selector: '#site-nav a[href="/components/switch"]',
    room: 'all',
  },
  { name: '헤더 brand', url: '/', selector: 'header a[href="/"]', room: 'all' },
  {
    name: '헤더 nav 시작하기',
    url: '/',
    selector: 'header nav a[href="/getting-started"]',
    room: 'all',
  },
  {
    name: '헤더 nav GitHub',
    url: '/',
    selector: 'header nav a[href^="https://github.com"]',
    room: 'all',
  },
  {
    name: 'FrameCard 링크(전체 컴포넌트)',
    url: '/components/overview',
    selector: 'main a[href="/components/switch"]',
    room: 'inline',
  },
  {
    name: 'FrameCard 링크(모션)',
    url: '/motion',
    selector: 'main a[href^="/motion/"]',
    room: 'inline',
  },
  {
    name: '랜딩 moreLink',
    url: '/',
    selector: 'main a[href="/components/overview"]',
    room: 'all',
  },
  {
    name: '본문 글 링크(뒤에 에서)',
    url: '/getting-started',
    selector: 'main p a[href="/components/overview"]',
    room: 'block',
  },
  {
    name: '본문 글 링크(뒤에 에 남겨)',
    url: '/getting-started',
    selector: 'main p a[href^="https://github.com"]',
    room: 'block',
  },
];

test.describe('데모 자체 링크 포커스', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('건너뛰기 링크: 파랑 면 위 짙은 2px와 안쪽 흰 2px, 바깥 링 없음', async ({
    page,
  }) => {
    await page.goto('/');
    // load 직후에는 React가 아직 링크를 그리지 않았을 수 있다. 그리기 전의 Tab은 body에서 허공으로 간다
    await page
      .locator('a[href="#main-content"]')
      .waitFor({ state: 'attached' });
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

  for (const { name, url, selector, room } of LINKS) {
    test(`${name}: 포커스가 상자와 글자를 옮기지 않고 테두리가 글자에 닿지 않는다`, async ({
      page,
    }) => {
      await page.goto(url);
      const link = page.locator(selector).first();
      await link.waitFor();
      let reached = false;
      for (let i = 0; i < 300 && !reached; i += 1) {
        await page.keyboard.press('Tab');
        reached = await link.evaluate((el) => el === document.activeElement);
      }
      expect(reached, `Tab으로 ${selector}에 닿지 않았다`).toBe(true);
      const focused = await place(page, selector);
      await page.evaluate(() => (document.activeElement as HTMLElement).blur());
      const rest = await place(page, selector);
      // (1) 자리 그대로
      expect(focused.x).toBeCloseTo(rest.x, 1);
      expect(focused.width).toBeCloseTo(rest.width, 1);
      expect(focused.textX).toBeCloseTo(rest.textX, 1);
      // (2) 스스로 둔 여유 방향은 내용이 안쪽 RING px 테두리 띠 밖에 있다
      if (room === 'all' || room === 'inline') {
        expect(focused.contentLeft).toBeGreaterThanOrEqual(focused.x + RING);
        expect(focused.contentRight).toBeLessThanOrEqual(
          focused.x + focused.width - RING
        );
      }
      if (room === 'all' || room === 'block') {
        expect(focused.contentTop).toBeGreaterThanOrEqual(focused.y + RING);
        expect(focused.contentBottom).toBeLessThanOrEqual(
          focused.y + focused.height - RING
        );
      }
      // (3) 이웃 글자(아랫줄, 뒤따르는 글자)가 링크 상자 안에 들지 않는다: 테두리 띠와 겹치지 않는다
      const n = focused.next;
      if (n) {
        const overlapX =
          Math.min(n.right, focused.x + focused.width) -
          Math.max(n.left, focused.x);
        const overlapY =
          Math.min(n.bottom, focused.y + focused.height) -
          Math.max(n.top, focused.y);
        expect(
          overlapX > 0.01 && overlapY > 0.01,
          `이웃 글자가 링크 상자와 겹친다(가로 ${overlapX}, 세로 ${overlapY})`
        ).toBe(false);
      }
    });
  }
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
