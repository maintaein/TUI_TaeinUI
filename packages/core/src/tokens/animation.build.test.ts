/**
 * animation.css.ts가 scripts/build-easing.mjs의 출력과 어긋나지 않는지 검사한다.
 *
 * easing 값은 GSAP 이징을 구워 만든 산출물이라 손으로 고치기 쉽다. 소스와
 * 생성기가 갈라지면 `node scripts/build-easing.mjs`로 다시 구운 결과가
 * 커밋된 파일과 달라진다 — 이 테스트가 그 차이를 잡는다.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import { generateAnimationSource } from '../../scripts/build-easing.mjs';

describe('animation.css.ts와 build-easing.mjs 일치 검사', () => {
  it('커밋된 animation.css.ts가 GSAP 이징 생성기의 출력과 같다', async () => {
    const filePath = resolve(__dirname, 'animation.css.ts');
    expect(readFileSync(filePath, 'utf-8')).toBe(
      await generateAnimationSource()
    );
  });
});
