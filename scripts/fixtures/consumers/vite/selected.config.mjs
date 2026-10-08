import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    outDir: 'selected-dist',
    minify: false,
    lib: { entry: 'src/selected.ts', formats: ['es'], fileName: () => 'selected.js' },
  },
})
