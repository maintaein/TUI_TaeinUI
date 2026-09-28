import { test, expect, type Page } from '@playwright/test';

/**
 * M3 Task 9 — TextField 타이핑 미러 오버레이의 최종 정착 좌표가, 애니메이션이
 * 실제로 도는 경로(일반)와 `gateMotion`이 즉시 정착시키는 경로(reduced motion)
 * 사이에서 일치하는지 비교한다. 스크린샷 비교(`toHaveScreenshot`)는 쓰지 않고
 * `boundingBox()`/`getBoundingClientRect()` 좌표 diff로만 판정한다(허용 오차 0.5px).
 *
 * 두 경로 모두 `settled` span으로 병합되면 순수 텍스트 레이아웃이 되므로,
 * 이 비교는 "애니메이션이 최종 위치에 잔여 변형(transform)을 남기지 않는다"를
 * 좌표로 확인하는 것이다. 기존 데모 예제(Basic TextField, label="이름")를
 * 그대로 쓴다 — 새 예제를 추가하지 않는다(Ruling 76).
 *
 * **인용 범위에 대한 정정(Task 9 수정 라운드 1, F2).** 이 스펙이 비교하는 건
 * 일반 경로의 미러 vs reduced 경로의 미러다 — **양쪽 다 미러가 켜져 있다.**
 * 「미러를 표시한 상태 vs 숨긴 상태」의 대조는 이 구현에서 불가능하다 — 미러
 * 자체를 끄는 경로가 없다(reduced motion에서 `gateMotion`이 하는 일은 트윈을
 * 즉시 정착시키는 것뿐이고, 미러는 그대로 렌더된다). 그러므로 여기서 나오는
 * 0px은 "정착 후 잔여 transform이 남지 않는다"의 증거이지, Ruling 47이 주장한
 * "미러로 교체되는 것이 눈에 보이지 않는다"의 증거가 아니다.
 */

const TYPED_TEXT = 'abc';

interface CharRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** 마지막 글자가 `settled` span으로 병합된 뒤의 경계 사각형을 읽는다. */
const typeAndMeasureLastCharRect = async (
  page: Page,
  label: string,
  text: string
): Promise<CharRect> => {
  const input = page.getByLabel(label);
  const mirror = input.locator('xpath=..').locator('[aria-hidden="true"]');

  await input.click();
  await input.pressSequentially(text, { delay: 30 });

  // incoming(두 번째 span)이 비워질 때까지 기다린다 — 트윈이 실제로 도는
  // 일반 경로에서는 완료를 기다리는 것이고, reduced 경로에서는 gateMotion이
  // 생성 즉시 정착시키므로 이 대기가 곧바로 통과한다.
  await mirror.evaluate(
    (root) =>
      new Promise<void>((resolve) => {
        const check = (): void => {
          const incoming = root.children[1];
          if (!incoming || incoming.childElementCount === 0) {
            resolve();
          } else {
            requestAnimationFrame(check);
          }
        };
        check();
      })
  );

  return mirror.evaluate((root, expectedLength) => {
    const settled = root.children[0];
    const textNode = settled.firstChild;
    if (
      !textNode ||
      textNode.textContent === null ||
      textNode.textContent.length !== expectedLength
    ) {
      throw new Error(
        `settled 텍스트 노드가 기대와 다르다: ${textNode?.textContent ?? 'null'}`
      );
    }
    const length = textNode.textContent.length;
    const range = document.createRange();
    range.setStart(textNode, length - 1);
    range.setEnd(textNode, length);
    const rect = range.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  }, text.length);
};

test.describe('TextField 미러 오버레이 좌표 (일반 vs reduced motion)', () => {
  test('마지막 글자의 정착 좌표가 두 경로에서 0.5px 이내로 일치한다', async ({
    browser,
  }) => {
    const normalContext = await browser.newContext();
    const normalPage = await normalContext.newPage();
    await normalPage.goto('/components/text-field');
    const normalRect = await typeAndMeasureLastCharRect(
      normalPage,
      '이름',
      TYPED_TEXT
    );
    await normalContext.close();

    const reducedContext = await browser.newContext({
      reducedMotion: 'reduce',
    });
    const reducedPage = await reducedContext.newPage();
    await reducedPage.goto('/components/text-field');
    const reducedRect = await typeAndMeasureLastCharRect(
      reducedPage,
      '이름',
      TYPED_TEXT
    );
    await reducedContext.close();

    console.log(
      `[mirrorOverlay] normal=${JSON.stringify(normalRect)} reduced=${JSON.stringify(reducedRect)}`
    );

    expect(normalRect.width).toBeGreaterThan(0);
    expect(reducedRect.width).toBeGreaterThan(0);
    expect(Math.abs(normalRect.x - reducedRect.x)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(normalRect.y - reducedRect.y)).toBeLessThanOrEqual(0.5);
  });
});
