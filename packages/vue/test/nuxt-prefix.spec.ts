import { fileURLToPath } from 'node:url'
import { $fetch, setup } from '@nuxt/test-utils/e2e'
import { JSDOM } from 'jsdom'
import { describe, expect, it } from 'vitest'

// The module registers prefixed names that still import the unprefixed export.
describe('nuxt auto-imported charts with a prefix', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/nuxt-app', import.meta.url)),
    browser: false,
    nuxtConfig: { vccs: { prefix: 'V' } },
  })

  it('renders <VBarChart> and <VBar>', async () => {
    const dom = new JSDOM(await $fetch<string>('/prefixed'))
    expect(dom.window.document.querySelectorAll('svg.v-charts-surface')).toHaveLength(1)
    expect(dom.window.document.querySelectorAll('.v-charts-bar-rectangle path[d]')).toHaveLength(1)
    dom.window.close()
  })
})
