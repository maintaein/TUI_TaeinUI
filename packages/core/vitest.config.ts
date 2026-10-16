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
    // Switch도 같은 이유다. 채움이 테두리까지 덮는 음수 inset과 호버 부풂의
    // 포인터 게이트를 CSSOM으로 잠근다.
    // SegmentedButtons도 같은 이유다. 표시 층이 진짜 라벨 위에 쌓이는지, 진짜 라벨의
    // 글자색이 선택을 따르지 않는지를 CSSOM으로 잠근다.
    // Snackbar도 같은 이유다. 닫기 버튼의 호버·눌림 면 규칙이 IconButton의 같은 상태
    // 규칙보다 특이도가 높은지를 CSSOM으로 잠근다.
    // HeaderBar도 같은 이유다. 바의 기하(높이·최대 폭·모서리·그림자 토큰), 밑줄의 원점과
    // 호버 게이트, 좁은 화면 규칙이 어느 미디어 안에 있는지를 CSSOM으로 잠근다.
    // Divider도 같은 이유다. 세로가 줄 높이를 채우는 규칙과 spacing의 방향별 여백,
    // 어느 규칙에도 animation·transform이 없음을 CSSOM으로 잠근다.
    // List도 같은 이유다. 구분선 위 여백이 gap과 같은 변수를 읽는지, 라벨-값 항목이
    // 늘 가운데 정렬이고 children 항목에는 정렬이 걸리지 않는지를 CSSOM으로 잠근다.
    // Skeleton도 같은 이유다. 면 색 토큰과 두 애니메이션의 주기 식을 CSSOM으로 잠근다.
    // NumericSpinner도 같은 이유다. 입력칸 포커스가 테두리 색 한 겹뿐이고 바깥 상자에
    // 테두리가 없음을 CSSOM으로 잠근다.
    // Chip도 같은 이유다. 주 동작의 덮개가 루트의 테두리 두께만큼 바깥으로 나가는지,
    // 그 포커스 링이 눌리는 칩 루트의 것과 같은지를 CSSOM으로 잠근다.
    css: {
      include: [
        /Slider\.css/,
        /\/Button\.css/,
        /\/IconButton\.css/,
        /\/Border\.css/,
        /HeaderBarNav\.css/,
        /\/HeaderBar\.css/,
        /\/TextField\.css/,
        /\/Checkbox\.css/,
        /\/Switch\.css/,
        /\/SegmentedButtons\.css/,
        /\/Snackbar\.css/,
        /\/Divider\.css/,
        /\/List\.css/,
        /\/Skeleton\.css/,
        /\/NumericSpinner\.css/,
        /\/Chip\.css/,
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
