import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';

export default defineConfig({
  plugins: [react(), vanillaExtractPlugin()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    // 기본값은 CSS를 빈 문자열로 목킹한다. Slider의 썸 :hover·:active
    // transform 크기 순서를 jsdom에 주입된 실제 생성 CSS로 검증해야 해서
    // Slider.css.ts만 범위를 좁혀 처리한다(다른 컴포넌트는 그대로 목킹됨).
    // HeaderBarNav도 같은 이유(가드 2 — 히트 영역에 transform이 없음을 CSSOM으로
    // 잠근다, Task 8)로 추가한다.
    // Button도 같은 이유다. 호버 포인터 게이트와 축소 모드 규칙이 @media 안에
    // 있는지를 CSSOM으로 잠근다.
    // mirrorOverlay도 같은 이유다 — hiddenText가 실제 input에 붙는데 color만
    // transparent로 두면 캐럿까지 같이 투명해진다(F1). 캐럿 색이 따로 살아 있는지를
    // CSSOM 규칙으로 잠근다.
    css: {
      include: [
        /Slider\.css/,
        /\/Button\.css/,
        /HeaderBarNav\.css/,
        /mirrorOverlay\.css/,
      ],
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.test.{ts,tsx}',
        '**/*.css.ts',
        'dist/',
        '**/index.ts',
      ],
      all: true,
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
});
