import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import tseslint from 'typescript-eslint'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  {
    ignores: [
      '**/dist/**',
      '**/coverage/**',
      '**/node_modules/**',
      '**/.next/**',
      '**/.storybook-static/**',
      '**/sb-manager/**',
      '**/*.css.ts',
      // .claude/고도화/ex/*는 읽으려고 받아 둔 외부 참조 소스다(PillNav·Dock·
      // FlowingMenu·SplitFlapText). 발행하지도 빌드하지도 않고 .gitignore 대상이라
      // 우리 규칙으로 고칠 수 없다 — 린트 대상이 아니다.
      '.claude/**',
    ],
  },

  {
    // `.d.mts`도 대상에 넣는다 — 안 넣으면 flat config가 이 확장자를 아예 안 보고
    // 지나쳐 사실상 린트를 안 받는다(예: packages/core/scripts/build-easing.d.mts, M1 T8).
    files: ['**/*.{ts,tsx}', '**/*.d.mts'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      jsxA11y.flatConfigs.recommended,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // TypeScript
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],

      // React
      'react-refresh/only-export-components': 'off',

      // React Hooks
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
    },
  },

  // Storybook stories: relax a11y rules (illustrative code)
  {
    files: ['**/stories/**/*.{ts,tsx}', '**/*.stories.{ts,tsx}'],
    rules: {
      'jsx-a11y/anchor-is-valid': 'off',
      'jsx-a11y/label-has-associated-control': 'off',
      'jsx-a11y/click-events-have-key-events': 'off',
      'jsx-a11y/no-static-element-interactions': 'off',
    },
  },
])
