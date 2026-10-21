import { test, expect, type Page } from '@playwright/test';
import { mountLive } from './livePreview';

/**
 * M5 task-3 round 6: 누름 효과 때 버튼 안 글자가 튀는지 버튼별로 잰다.
 *
 * 사용자 보고: 호버는 가만한데 클릭할 때 글자가 튄다. 데모의 Weak, Sizes,
 * Custom Color 섹션은 안 그렇다. 섹션이 아니라 버튼별로 재야 변수가 드러난다.
 *
 * 측정: 실제 마우스로 누르고 뗀다. 그 구간을 CDP Page.screencast로 프레임 단위로
 * 받아, 프레임마다 버튼 안쪽(테두리 제외)의 "잉크"(배경색과 다른 픽셀)의 가중
 * 중심을 구한다. scale은 버튼 중심 기준이고 spring의 꼬리 구간은 s가 1에 아주
 * 가까워 scale 때문의 이동이 0.01px 미만이라, 그 구간에서 프레임 사이의 큰 점프는
 * 전부 래스터 위치 변화(레이어가 사라지며 글자가 다시 그려질 때)다.
 *
 * 실측 결과(Chrome, 라운드 6): will-change가 없으면 버튼 대부분에서 전이 끝 프레임에
 * 글자가 세로로 약 1px 튄다(레이어가 있을 때 글자가 1px 아래에 그려지다가 레이어가
 * 사라지며 위로 올라간다). 튀지 않는 버튼은 글자의 세로 오프셋이 정수에 가까운
 * Sizes 의 sm과 xl뿐이다(변수는 섹션이나 색이 아니라 글자 상자의 세로 소수 위치).
 * base에 will-change: transform을 영구로 두면 전부 0.2px 이내다.
 * backface-visibility: hidden은 레이어를 만들지 못해 효과가 없다.
 */

interface ButtonInfo {
  section: string;
  index: number;
  label: string;
  /** 구별되는 속성 */
  bg: string;
  color: string;
  filter: string;
  width: number;
  height: number;
  chars: number;
}

interface Frame {
  t: number;
  data: string;
}

interface InkPoint {
  t: number;
  cx: number;
  cy: number;
}

interface Result extends ButtonInfo {
  /** 휴지 대비 정착 후(해제 후) 잉크 중심 차이 */
  settledDx: number;
  settledDy: number;
  /** 꼬리 구간(해제 후 마지막 프레임들) 프레임 사이 최대 점프 */
  tailJump: number;
  /**
   * 해제 전체 구간 프레임 사이 최대 점프 (참고). 눌린 동안은 버튼이 줄어 둥근 모서리
   * 밖이 크롭에 들어와 잉크 중심이 1~2px 흔들리므로 판정에는 쓰지 않고 꼬리만 쓴다.
   */
  maxJump: number;
  frames: number;
  /** 해제 구간 프레임별 잉크 중심 x (진단용) */
  seq: string;
}

/**
 * 옛 /components/button 문서 페이지의 예제 섹션 여섯 개를 같은 코드로 한 화면에 모은 구성.
 * 섹션마다 h3 제목과 버튼을 한 부모에 둔다(옛 페이지 구조와 같다).
 * 바깥 paddingTop 0.5px는 옛 페이지에서 버튼의 세로 위치가 소수였던 조건을 만든다.
 * 글자 튐은 글자 상자의 세로 소수 위치에 달려 있어(위 설명), 정수 위치에 놓으면 구성 D가
 * 튀지 않아 가드가 진공이 된다.
 */
const row = `display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center'`;
const section = (title: string, body: string) =>
  `<div><h3>${title}</h3>${body}</div>`;
const CODE = `<div style={{ paddingTop: '0.5px' }}>${[
  section(
    'Variants (Fill)',
    `<div style={{ ${row} }}>
  <Button variant="primary">Primary</Button>
  <Button variant="dark">Dark</Button>
  <Button variant="danger">Danger</Button>
  <Button variant="light">Light</Button>
</div>`
  ),
  section(
    'Variants (Weak)',
    `<div style={{ ${row} }}>
  <Button variant="primary" buttonStyle="weak">Primary</Button>
  <Button variant="dark" buttonStyle="weak">Dark</Button>
  <Button variant="danger" buttonStyle="weak">Danger</Button>
  <Button variant="light" buttonStyle="weak">Light</Button>
</div>`
  ),
  section(
    'Sizes',
    `<div style={{ ${row} }}>
  <Button size="sm">Small</Button>
  <Button size="md">Medium</Button>
  <Button size="lg">Large</Button>
  <Button size="xl">X-Large</Button>
</div>`
  ),
  section(
    'With Icons',
    `<div style={{ ${row} }}>
  <Button leftIcon={<Plus size={16} />} variant="primary">추가</Button>
  <Button rightIcon={<ArrowRight size={16} />} variant="dark">다음</Button>
  <Button rightIcon={<Download size={16} />} variant="light">다운로드</Button>
  <Button leftIcon={<Trash size={16} />} variant="danger">삭제</Button>
</div>`
  ),
  section(
    'Full Width',
    `<div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
  <Button fullWidth>전체 너비 버튼</Button>
  <Button fullWidth variant="light">전체 너비 Light</Button>
</div>`
  ),
  section(
    'Custom Color',
    `<div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
  <div style={{ ${row} }}>
    <Button customColor={{ bg: '#8b5cf6', text: '#fff' }}>보라색</Button>
    <Button customColor={{ bg: '#059669', text: '#fff', hoverBg: '#047857', activeBg: '#065f46' }}>초록색</Button>
    <Button customColor={{ bg: '#ea580c', text: '#fff' }}>오렌지</Button>
    <Button customColor={{ bg: '#0ea5e9', text: '#fff' }}>하늘색</Button>
  </div>
  <div style={{ ${row} }}>
    <Button variant="light" customColor={{ bg: '#8b5cf6', text: '' }}>보라색</Button>
    <Button variant="light" customColor={{ bg: '#059669', text: '' }}>초록색</Button>
    <Button variant="light" customColor={{ bg: '#ea580c', text: '' }}>오렌지</Button>
    <Button variant="light" customColor={{ bg: '#e11d48', text: '', hoverBg: '#fce7f3', activeBg: '#fbcfe8' }}>핑크</Button>
  </div>
</div>`
  ),
].join('\n')}</div>`;

const SECTIONS: Array<{ heading: string; name: string }> = [
  { heading: 'Variants (Fill)', name: 'Variants(Fill)' },
  { heading: 'Variants (Weak)', name: 'Weak' },
  { heading: 'Sizes', name: 'Sizes' },
  { heading: 'With Icons', name: 'Icons' },
  { heading: 'Full Width', name: 'FullWidth' },
  { heading: 'Custom Color', name: 'CustomColor' },
];

/** 이론상 scale 때문의 이동은 꼬리에서 0.01px 미만이다. 그 위는 래스터 이동이다. */
const MAX_TAIL_JUMP = 0.3;
const MAX_SETTLED_DRIFT = 0.3;

/** 예제 섹션의 프리뷰 버튼. 편집기의 "코드 복사" 버튼은 뺀다. */
const sectionButtons = (page: Page, heading: string) =>
  page
    .getByRole('heading', { name: heading, exact: true, level: 3 })
    .locator('..')
    .getByRole('button')
    .filter({ hasNotText: '복사' });

/** 프레임 배열을 페이지에서 디코드해 버튼 안쪽 잉크의 가중 중심을 구한다. */
const inkOf = (
  page: Page,
  frames: Frame[],
  crop: { x: number; y: number; w: number; h: number }
): Promise<InkPoint[]> =>
  page.evaluate(
    async ({ frames, crop }) => {
      const out: Array<{ t: number; cx: number; cy: number }> = [];
      for (const f of frames) {
        const img = new Image();
        img.src = 'data:image/png;base64,' + f.data;
        await img.decode();
        const scale = img.width / window.innerWidth;
        const c = document.createElement('canvas');
        const w = Math.round(crop.w * scale);
        const h = Math.round(crop.h * scale);
        c.width = w;
        c.height = h;
        const x = c.getContext('2d', { willReadFrequently: true })!;
        x.drawImage(
          img,
          crop.x * scale,
          crop.y * scale,
          crop.w * scale,
          crop.h * scale,
          0,
          0,
          w,
          h
        );
        const d = x.getImageData(0, 0, w, h).data;
        // 버튼 안쪽만 본다(테두리 6px와 모서리 제외). 배경은 안쪽 좌상단 픽셀 색.
        const m = Math.round(6 * scale);
        const bgI = (m * w + m) * 4;
        const bg = [d[bgI], d[bgI + 1], d[bgI + 2]];
        let sw = 0;
        let sx = 0;
        let sy = 0;
        for (let yy = m; yy < h - m; yy++) {
          for (let xx = m; xx < w - m; xx++) {
            const i = (yy * w + xx) * 4;
            const dist =
              Math.abs(d[i] - bg[0]) +
              Math.abs(d[i + 1] - bg[1]) +
              Math.abs(d[i + 2] - bg[2]);
            if (dist > 40) {
              sw += dist;
              sx += dist * xx;
              sy += dist * yy;
            }
          }
        }
        out.push({
          t: f.t,
          cx: sw ? sx / sw / scale : NaN,
          cy: sw ? sy / sw / scale : NaN,
        });
      }
      return out;
    },
    { frames, crop }
  );

const measureButton = async (
  page: Page,
  section: string,
  index: number
): Promise<Result> => {
  const button = sectionButtons(
    page,
    SECTIONS.find((s) => s.name === section)!.heading
  ).nth(index);
  await button.scrollIntoViewIfNeeded();
  await page.mouse.move(2, 2);
  await page.waitForTimeout(350);

  const info = await button.evaluate(
    (el): Omit<ButtonInfo, 'section' | 'index'> => {
      const s = getComputedStyle(el);
      return {
        label: (el.textContent ?? '').trim(),
        bg: s.backgroundColor,
        color: s.color,
        filter: s.filter,
        width: el.getBoundingClientRect().width,
        height: el.getBoundingClientRect().height,
        chars: (el.textContent ?? '').trim().length,
      };
    }
  );

  const box = (await button.boundingBox())!;
  const crop = { x: box.x, y: box.y, w: box.width, h: box.height };
  const cdp = await page.context().newCDPSession(page);
  const frames: Frame[] = [];
  let releasedAt = Infinity;
  cdp.on('Page.screencastFrame', (e) => {
    frames.push({ t: e.metadata.timestamp ?? 0, data: e.data });
    void cdp.send('Page.screencastFrameAck', { sessionId: e.sessionId });
  });

  // 휴지(호버 상태). 정지 프레임을 하나 얻는다.
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(450);
  await cdp.send('Page.startScreencast', {
    format: 'png',
    everyNthFrame: 1,
  });
  await page.waitForTimeout(150);
  const restShot = (await page.screenshot()).toString('base64');

  await page.mouse.down();
  await page.waitForTimeout(450);
  const pressedFrames = frames.length;
  await page.mouse.up();
  releasedAt = frames.length;
  await page.waitForTimeout(800);
  await cdp.send('Page.stopScreencast');
  await cdp.detach();

  const [rest] = await inkOf(page, [{ t: 0, data: restShot }], crop);
  const ink = await inkOf(page, frames, crop);
  const restCx = rest.cx;
  const restCy = rest.cy;
  void pressedFrames;

  const release = ink.slice(releasedAt);
  const tail = release.slice(-Math.max(4, Math.floor(release.length * 0.5)));
  const jumps = (pts: InkPoint[]) =>
    pts.slice(1).map((p, i) => Math.hypot(p.cx - pts[i].cx, p.cy - pts[i].cy));
  const last = release[release.length - 1] ?? ink[ink.length - 1];

  return {
    section,
    index,
    ...info,
    settledDx: +(last.cx - restCx).toFixed(3),
    settledDy: +(last.cy - restCy).toFixed(3),
    tailJump: +Math.max(0, ...jumps(tail)).toFixed(3),
    maxJump: +Math.max(0, ...jumps(release)).toFixed(3),
    frames: release.length,
    seq: ink.map((p) => `${p.cx.toFixed(2)},${p.cy.toFixed(2)}`).join(' '),
  };
};

const measureAll = async (
  page: Page,
  css = '',
  only?: Set<string>
): Promise<Result[]> => {
  await mountLive(page, CODE, 'h3:has-text("Custom Color")');
  if (css) await page.addStyleTag({ content: css });
  const results: Result[] = [];
  for (const { heading, name } of SECTIONS) {
    const n = await sectionButtons(page, heading).count();
    // 선택자가 아무것도 못 잡으면 아래 단언들이 빈 배열로 조용히 통과한다.
    expect(n, `${heading} 버튼 수`).toBeGreaterThan(0);
    for (let i = 0; i < n; i++) {
      if (only && !only.has(`${name}${i}`)) continue;
      results.push(await measureButton(page, name, i));
    }
  }
  if (only) expect(results).toHaveLength(only.size);
  return results;
};

const table = (rs: Result[]): string =>
  rs
    .map(
      (r) =>
        `${r.section.padEnd(13)}${String(r.index)} ${r.label.slice(0, 10).padEnd(10)} ` +
        `bg=${r.bg.padEnd(18)} fg=${r.color.padEnd(18)} filter=${r.filter.padEnd(5)} ` +
        `${r.width.toFixed(2)}x${r.height} chars=${r.chars} | settled(${r.settledDx},${r.settledDy}) ` +
        `tailJump=${r.tailJump} maxJump=${r.maxJump} frames=${r.frames}
      cx,cy: ${r.seq}`
    )
    .join('\n');

/**
 * 구성 비교용: 소스(최종, will-change: transform 영구)에 덮어쓰는 CSS.
 * D = 라운드 5 상태(backface-visibility hidden, will-change 없음)
 * E = backface-visibility hidden + will-change 둘 다
 * 최종 구성(F = will-change만)은 덮어쓰지 않는다.
 */
/** 비교 CSS를 덮어쓸 대상. 빌드물은 클래스가 해시라 Button이 다는 aria-busy로 고른다. */
const PREVIEW_BUTTON = 'main button[aria-busy]';

const CONFIGS: Record<string, string> = {
  D: `${PREVIEW_BUTTON}{will-change:auto !important;backface-visibility:hidden !important}`,
  E: `${PREVIEW_BUTTON}{will-change:transform !important;backface-visibility:hidden !important}`,
};

/** 비교용 부분 집합: 튀는 것(Medium, Large, Light)과 안 튀는 것(Small, X-Large). */
const SAMPLE = new Set([
  'FullWidth1',
  'Variants(Fill)0',
  'Variants(Fill)3',
  'Sizes0',
  'Sizes1',
  'Sizes2',
  'Sizes3',
]);

test.describe('Button 누름 때 글자 튐 (버튼별 실측)', () => {
  test.skip(
    ({ browserName }) => browserName !== 'chromium',
    'CDP screencast는 chromium 전용이다'
  );

  test('구성 D(backface-visibility만): 비교용 표본에서 전이 끝에 글자가 튄다', async ({
    page,
  }) => {
    test.setTimeout(240_000);
    await page.setViewportSize({ width: 1100, height: 900 });
    const results = await measureAll(page, CONFIGS.D, SAMPLE);
    console.log(`
=== 구성 D
${table(results)}`);
    // 이 가드가 진공이 아니라는 증거: 레이어를 못 만드는 구성에서는 실제로 튄다.
    expect(Math.max(...results.map((r) => r.tailJump))).toBeGreaterThan(0.5);
  });

  test('구성 E(backface + will-change): 비교용 표본에서 튀지 않는다', async ({
    page,
  }) => {
    test.setTimeout(240_000);
    await page.setViewportSize({ width: 1100, height: 900 });
    const results = await measureAll(page, CONFIGS.E, SAMPLE);
    console.log(`
=== 구성 E
${table(results)}`);
    expect(Math.max(...results.map((r) => r.tailJump))).toBeLessThanOrEqual(
      MAX_TAIL_JUMP
    );
  });

  test('최종 구성: 모든 버튼이 정착 후 제자리이고 꼬리에 점프가 없다', async ({
    page,
  }) => {
    test.setTimeout(240_000);
    await page.setViewportSize({ width: 1100, height: 900 });
    const results = await measureAll(page);
    console.log(`\n=== 최종\n${table(results)}`);
    for (const r of results) {
      const id = `${r.section}#${r.index} ${r.label}`;
      expect(Math.abs(r.settledDx), `${id} settledDx`).toBeLessThanOrEqual(
        MAX_SETTLED_DRIFT
      );
      expect(Math.abs(r.settledDy), `${id} settledDy`).toBeLessThanOrEqual(
        MAX_SETTLED_DRIFT
      );
      expect(r.tailJump, `${id} tailJump`).toBeLessThanOrEqual(MAX_TAIL_JUMP);
    }
  });
});
