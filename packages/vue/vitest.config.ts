import { resolve } from 'node:path'
import { coverageConfigDefaults, defineConfig } from 'vitest/config'
import Vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

export default defineConfig({
  root: __dirname,
  plugins: [
    Vue(),
    vueJsx(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    restoreMocks: true,
    unstubGlobals: true,
    unstubEnvs: true,
    exclude: ['**/node_modules/**', 'test/**'],
    include: ['./**/*.{test,spec}.{ts,js,tsx}'],
    coverage: {
      provider: 'istanbul',
      reporter: ['text-summary', 'json', 'html'],
      include: ['src/**/*.{ts,tsx,vue}'],
      exclude: [...coverageConfigDefaults.exclude, '**/__tests__/**', 'src/test/**'],
    },
    server: {
      deps: {
        inline: ['vitest-canvas-mock'],
      },
    },
    environmentOptions: {
      jsdom: {
        resources: 'usable',
      },
    },
  },
})
