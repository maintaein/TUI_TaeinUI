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
    // TextField도 같은 이유다. 클릭(:focus)과 키보드 포커스가 호버와 같은 테두리
    // 색을 쓰고 후광·링이 없는지를 CSSOM으로 잠근다.
    // Border도 같은 이유다. 호버 포인터 게이트와 :focus-within이 @media 안팎
    // 어디에 있는지, rotate 길이가 loop.slow인지를 CSSOM으로 잠근다.
    // IconButton도 같은 이유다(Button과 같은 누름·호버 규칙을 CSSOM으로 잠근다).
    // Checkbox도 같은 이유다. 채움 층의 원점·넘침 자름·색이 체크 여부를 따르지 않음을
    // CSSOM으로 잠근다.
    css: {
      include: [
        /Slider\.css/,
        /\/Button\.css/,
        /\/IconButton\.css/,
        /\/Border\.css/,
        /HeaderBarNav\.css/,
        /\/TextField\.css/,
        /\/Checkbox\.css/,
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
      // vitest 4에서 coverage.all이 사라졌다. include를 명시해야 로드되지 않은 파일도 집계된다.
      include: ['src/**/*.{ts,tsx}'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
});
