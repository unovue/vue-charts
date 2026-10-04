import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { $fetch, setup } from '@nuxt/test-utils/e2e'
import { JSDOM } from 'jsdom'
import { describe, expect, it } from 'vitest'

describe('nuxt auto-imported charts', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/nuxt-app', import.meta.url)),
    browser: false,
    nuxtConfig: {
      build: { transpile: process.env.VCCS_TEST_TRANSPILE === '1' ? ['vccs'] : [] },
    },
  })

  it('renders fixed and responsive SVG geometry with stable HTML across requests', async () => {
    const first = await $fetch<string>('/')
    const second = await $fetch<string>('/')
    if (process.env.VCCS_SSR_EVIDENCE)
      writeFileSync(process.env.VCCS_SSR_EVIDENCE, first)
    expect(second).toBe(first)

    const dom = new JSDOM(first)
    const document = dom.window.document
    expect(document.querySelectorAll('svg')).toHaveLength(6)
    for (const [sizing, viewBox] of [['fixed', '0 0 400 300'], ['responsive', '0 0 640 360']]) {
      const section = document.querySelector(`[data-sizing="${sizing}"]`)!
      expect(section.querySelectorAll('svg')).toHaveLength(3)
      expect(Array.from(section.querySelectorAll('svg'), svg => svg.getAttribute('viewBox'))).toEqual([viewBox, viewBox, viewBox])
      // Bars use SVG paths for rectangles, including rounded corners.
      expect(section.querySelectorAll('.v-charts-bar-rectangle path[d]')).toHaveLength(2)
      expect(section.querySelectorAll('.v-charts-area-area[d]')).toHaveLength(1)
      expect(section.querySelectorAll('.v-charts-pie .v-charts-sector[d]')).toHaveLength(2)
    }
    dom.window.close()
  })
})
