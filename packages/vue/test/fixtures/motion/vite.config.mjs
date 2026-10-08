import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue()],
  // Keep Vue diagnostics and VNode keys observable in the built consumer fixture.
  define: { 'process.env.NODE_ENV': JSON.stringify('development'), '__VUE_PROD_DEVTOOLS__': true },
  resolve: {
    alias: [
      { find: 'vccs', replacement: fileURLToPath(new URL('../../../dist/es/index.mjs', import.meta.url)) },
      { find: /^motion-v$/, replacement: fileURLToPath(new URL('./motion-spy.mjs', import.meta.url)) },
      { find: 'motion-v-original', replacement: fileURLToPath(import.meta.resolve('motion-v')) },
    ],
    dedupe: ['vue'],
  },
})
