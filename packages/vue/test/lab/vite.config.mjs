import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { defineConfig } from 'vite'

const src = fileURLToPath(new URL('../../src', import.meta.url))
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [vue(), vueJsx()],
  // Keep VNode keys observable on elements in production builds, so tooling can follow identity.
  define: { __VUE_PROD_DEVTOOLS__: true },
  resolve: {
    alias: [
      { find: /^vccs$/, replacement: `${src}/index.ts` },
      { find: /^@\//, replacement: `${src}/` },
    ],
    dedupe: ['vue'],
  },
})
