import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';

export default defineConfig({
  plugins: [react(), vanillaExtractPlugin()],
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    cssMinify: true,
    modulePreload: { polyfill: false },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes('react-syntax-highlighter') ||
            id.includes('prismjs')
          ) {
            return 'syntax-highlight';
          }
          if (id.includes('react-router-dom') || id.includes('@remix-run')) {
            return 'router';
          }
          if (
            id.includes('/react@') ||
            id.includes('/react-dom@') ||
            id.includes('/scheduler@')
          ) {
            return 'react-vendor';
          }
          if (
            id.includes('@taein-ui') ||
            id.includes('packages/core') ||
            id.includes('packages\\core')
          ) {
            return 'tui-core';
          }
        },
      },
    },
  },
});
