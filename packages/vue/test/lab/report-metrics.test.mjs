import assert from 'node:assert/strict'
// This script also runs directly with node, without the app's browser test harness.
// eslint-disable-next-line test/no-import-node-test
import { test } from 'node:test'
import { curves, flags } from './report-metrics.mjs'
import { advanceFrame, launchBrowser } from './shared.mjs'

// Catch a gate regression that silently stops detecting a real one-frame discontinuity.
test('a bar that skips 40px in one frame is flagged', () => {
  const frames = [0, 2, 4, 44, 80, 100, 100].map((x, i) => ({
    t: i * 16,
    shapes: { 'rect.#bar0/Apr@1': `|${x}|0|10|20|||||` },
    overlap: 0,
  }))
  assert.ok(flags(curves(frames), frames).issues.includes('jump rect.#bar0/Apr@1 @48ms +40% (40px)'))
})

// Catch sampling two rAF callbacks as one frame after earlier steps change the clock phase.
test('each clock advance samples exactly one animation frame at every phase', async () => {
  const browser = await launchBrowser()
  try {
    const page = await browser.newPage()
    await page.clock.install({ time: 0 })
    await page.clock.pauseAt(1000)
    await page.evaluate(() => {
      window.framesSeen = 0
      const tick = () => {
        window.framesSeen++
        requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    })
    for (let phase = 0; phase < 16; phase++) {
      await page.clock.runFor(phase)
      let previous = await page.evaluate(() => window.framesSeen)
      for (let i = 0; i < 20; i++) {
        await advanceFrame(page)
        const current = await page.evaluate(() => window.framesSeen)
        assert.equal(current - previous, 1, `phase ${phase}, frame ${i}`)
        previous = current
      }
    }
  }
  finally {
    await browser.close()
  }
})
