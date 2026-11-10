import { type Page } from '@playwright/test';

// WebGL2가 없는 환경으로 만든다. 엔진이 null이 되어 연기와 빛무리만 빠지고(심지, 분사구, 단추 움직임은 그대로) 셰이더 프레임을 안 돈다.
// 가짜 시계 한 걸음(50ms)마다 연기 셰이더가 프레임을 실제로 계산해, CI의 SwiftShader(소프트웨어 WebGL)에서는 한 걸음이 약 0.5초라 이 시험이 30초를 넘겼다.
// 연기를 보는 시험(빛·그늘, 땅 연기 등)에는 쓰지 않는다. freeze보다 먼저 부른다(페이지를 열기 전에 심어야 한다)
export const withoutSmoke = (page: Page) =>
  page.addInitScript(() => {
    Object.defineProperty(window, 'WebGL2RenderingContext', {
      value: undefined,
    });
  });
