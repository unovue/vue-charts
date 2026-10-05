import assert from 'node:assert/strict'
// This script also runs directly with node, without the app's browser test harness.
// eslint-disable-next-line test/no-import-node-test
import { test } from 'node:test'
import { installHTMLGeometry } from './html-geometry.mjs'
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

test('a cell that moves while folded to nothing is not a jump', () => {
  // Fold away at x=0, move to x=78 while under 2 px, unfold there.
  const frames = [[0, 12], [0, 6], [0, 1], [78, 1], [78, 6], [78, 12], [78, 12]].map(([x, size], i) => ({
    t: i * 16,
    shapes: { 'rect.v-charts-cell-rect#2025-01-12@1': `|${x}|0|${size}|${size}|||||` },
    overlap: 0,
  }))
  assert.deepEqual(flags(curves(frames), frames).issues.filter(issue => issue.startsWith('jump')), [])
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

// Catch HTML rows being lost/reidentified on rerank, or percent spans treated as pixels.
test('HTML bar list geometry keeps row identities and resolves widths to pixels', async () => {
  const browser = await launchBrowser()
  try {
    const page = await browser.newPage()
    await page.setContent(`<ul class="v-charts-bar-list">
      <li class="v-charts-bar-list-row" style="transform:translateY(0px);height:32px;opacity:1">
        <div style="width:400px"><div class="v-charts-bar-list-bar" style="width:25%"></div><span class="v-charts-bar-list-name">Alpha</span></div>
      </li>
      <li class="v-charts-bar-list-row" style="transform:translateY(36px);height:32px;opacity:1">
        <div style="width:400px"><div class="v-charts-bar-list-bar" style="width:50%"></div><span class="v-charts-bar-list-name">Beta</span></div>
      </li>
    </ul>`)
    await page.evaluate(installHTMLGeometry)
    const frames = []
    for (const [i, progress] of [0, 0.5, 1].entries()) {
      const shapes = await page.evaluate((progress) => {
        const list = document.querySelector('ul')
        const row = [...list.children].find(row => row.textContent.trim() === 'Alpha')
        row.style.transform = `translateY(${progress * 36}px)`
        row.querySelector('.v-charts-bar-list-bar').style.width = `${25 + progress * 50}%`
        list.append(row)
        return Object.fromEntries(Object.entries(window.__htmlGeometry()).map(([id, attrs]) => [id, [attrs.transform ?? '', attrs.width ?? ''].join('|')]))
      }, progress)
      frames.push({ t: i * 16, shapes, overlap: 0 })
    }
    assert.deepEqual(curves(frames).map(({ id, span, pts }) => ({ id, span, pts })), [
      { id: 'li.v-charts-bar-list-row#barList0/Alpha', span: 36, pts: [[0, 0], [16, 0.5], [32, 1]] },
      { id: 'div.v-charts-bar-list-bar#barList0/Alpha', span: 200, pts: [[0, 0], [16, 0.5], [32, 1]] },
    ])
  }
  finally {
    await browser.close()
  }
})
