import { defineConfig } from '@playwright/test';

// 발행되는 빌드물(dist)에 대고 잰다. dev 서버는 HMR 래퍼와 비해시 클래스를 끼워
// 소비자가 받는 CSS와 다르다. 옛 빌드를 모르고 재지 않도록 서버를 띄울 때마다
// core와 demo를 먼저 빌드한다(약 25초). 포트는 사용자가 쓰는 3000번대·8765와
// 겹치지 않게 고정하고, 남이 띄운 서버는 재용하지 않는다(점유 중이면 실패한다).
const PORT = 4793;

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 1,
  use: {
    baseURL: `http://localhost:${PORT}`,
    headless: true,
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
  webServer: {
    command: `pnpm --filter @taein-ui/core build && pnpm build && pnpm preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
