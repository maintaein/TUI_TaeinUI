import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import { resolve } from 'path';
import {
  USE_CLIENT_DIRECTIVE,
  needsUseClientDirective,
} from './scripts/useClientDirective';

export default defineConfig({
  plugins: [react(), vanillaExtractPlugin()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'TaeinUICore',
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => {
        const ext = format === 'es' ? 'mjs' : 'cjs';
        // vanilla-extract의 파일 감지 패턴(/\.css\.(js|cjs|mjs|...)$/)은 소스뿐 아니라
        // 이미 컴파일된 산출물도 매칭한다. 소비자가 자기 빌드에도 vanilla-extract
        // 플러그인을 쓰면, 이 산출물을 "새 소스"로 착각해 재처리하다 recipe()의
        // 함수 export를 만나 실패한다(Invalid exports). 산출물 파일명에서 ".css"
        // 접미사를 제거해 이 감지 패턴 자체를 피한다.
        const safeName = entryName.endsWith('.css')
          ? entryName.replace(/\.css$/, '.vanilla')
          : entryName;
        return `${safeName}.${ext}`;
      },
    },
    rollupOptions: {
      external: (id) =>
        ['react', 'react-dom', 'react/jsx-runtime', 'clsx', 'gsap'].includes(
          id
        ) ||
        // 서브패스 플러그인(gsap/MorphSVGPlugin 등)은 위 정확 일치를 통과하지
        // 못한다. 아래 @vanilla-extract/recipes 주석이 경고하는 바로 그 증상이
        // gsap에서도 났다 — Checkbox가 쓰는 MorphSVGPlugin이 번들에 딸려
        // 들어가 dist/node_modules/.pnpm/gsap@.../ 로 356KB가 새어나갔고,
        // files:["dist"]라 npm 타르볼에까지 실렸다. gsap의 package.json
        // exports가 "./*" 와일드카드를 갖고 있어 서브패스도 소비자 쪽에서
        // 정상 resolve된다(확인함).
        id.startsWith('gsap/') ||
        // recipe()가 컴파일되면 @vanilla-extract/recipes의 런타임 헬퍼
        // (createRuntimeFn)를 참조한다. external 목록에 없으면 Rollup이 이걸
        // 번들에 포함시키면서 preserveModulesRoot('src') 밖에 있는 모듈이라
        // pnpm 스토어의 로컬 절대 경로 구조를 그대로 dist에 복사해버린다
        // (dist/node_modules/.pnpm/... 형태로 새어나감).
        // 이 패키지는 이미 core의 dependencies에 선언되어 있으므로
        // 번들링하지 않고 외부 참조로 남긴다.
        id.includes('@vanilla-extract/recipes'),
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'react/jsx-runtime',
        },
        // 위에서 external 처리한 @vanilla-extract/recipes는 실제로는 로컬 절대/
        // 상대 경로로 resolve되므로, 산출물의 import문에는 패키지명 그대로
        // 남도록 재매핑한다. createRuntimeFn은 메인 진입점(".")이 아니라
        // "@vanilla-extract/recipes/createRuntimeFn" 서브패스에서만 export되므로
        // (package.json exports 확인함) 정확히 그 경로로 매핑해야 한다
        // 메인 진입점으로 잘못 매핑하면 빌드는 성공해도 실제로는 존재하지 않는
        // named export를 참조하게 된다.
        paths: (id) =>
          id.includes('@vanilla-extract/recipes')
            ? '@vanilla-extract/recipes/createRuntimeFn'
            : id,
        // Next.js App Router는 모든 모듈을 서버 컴포넌트로 취급하므로, 훅이나
        // 컨텍스트를 쓰는 청크는 'use client' 지시문이 없으면 렌더 시점에 터진다.
        // 주입은 renderChunk 대신 banner로 한다. renderChunk에서 코드 앞에 한 줄을
        // 붙이면 모든 매핑이 한 줄씩 밀려 sourcemap이 깨지고(Rollup이 경고를 낸다)
        // 이를 보정하려면 magic-string 의존성이 필요한데, banner는 Rollup이
        // sourcemap 오프셋을 알아서 보정해준다. 또 banner는 import문보다 먼저
        // 출력되므로 "지시문이 첫 줄"이라는 요건도 자연히 충족된다.
        // preserveModules 덕에 청크 = 소스 모듈 1:1이므로, chunk.modules의 코드가
        // 곧 그 모듈의 코드다. 판별 로직은 scripts/useClientDirective.ts 참고.
        banner: (chunk) => {
          const code = Object.values(chunk.modules)
            .map((module) => module.code ?? '')
            .join('\n');

          return needsUseClientDirective(chunk.fileName, code)
            ? USE_CLIENT_DIRECTIVE
            : '';
        },
      },
    },
    sourcemap: true,
    emptyOutDir: true,
  },
});
