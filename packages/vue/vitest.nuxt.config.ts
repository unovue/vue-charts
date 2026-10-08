import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/nuxt*.spec.ts'],
    testTimeout: 60_000,
    hookTimeout: 300_000,
    maxWorkers: 1,
  },
})
