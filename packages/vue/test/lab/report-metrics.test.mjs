import assert from 'node:assert/strict'
// This script also runs directly with node, without the app's browser test harness.
// eslint-disable-next-line test/no-import-node-test
import { test } from 'node:test'
import { installHTMLGeometry } from './html-geometry.mjs'
import { checkReport, curves, flags } from './report-metrics.mjs'
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

test('a shape that moves while folded or faded out is not a jump', () => {
  // Fold away at x=0, move to x=78 while under 2 px, unfold there.
  const frames = [[0, 12], [0, 6], [0, 1], [78, 1], [78, 6], [78, 12], [78, 12]].map(([x, size], i) => ({
    t: i * 16,
    shapes: { 'rect.v-charts-cell-rect#2025-01-12@1': `|${x}|0|${size}|${size}|||||` },
    overlap: 0,
  }))
  assert.deepEqual(flags(curves(frames), frames).issues.filter(issue => issue.startsWith('jump')), [])
  // A full-size node crossfading to its new rank: faint on both sides of the move.
  const faded = [[0, ''], [0, ''], [0, '|~faint'], [84, '|~faint'], [84, ''], [84, ''], [84, '']].map(([y, mark], i) => ({
    t: i * 16,
    shapes: { 'rect.v-charts-journey-node-continue#n:1/pricing@1': `|0|${y}|8|28|||||${mark}` },
    overlap: 0,
  }))
  assert.deepEqual(flags(curves(faded), faded).issues.filter(issue => issue.startsWith('jump')), [])
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

// Catch acceptance hiding a new flag, a stale entry or page errors; real-clock timing never gates.
test('the report gate accepts only current listed identities', () => {
  const row = {
    scenario: 'journey',
    step: 'top8',
    issues: ['jump rect.node @112ms +30% (7px)'],
    errors: [],
    timing: { '1x': { slow: 3 } },
  }
  const accepted = [{ scenario: 'journey top8', kind: 'jump', element: 'rect.node' }]
  for (const [name, report, entries, failures, stale] of [
    ['unlisted', [row], [], 1, 0],
    ['listed with slow real-clock frames', [row], accepted, 0, 0],
    ['different element', [{ ...row, issues: ['jump rect.other @112ms +30% (7px)'] }], accepted, 1, 1],
    ['stale', [{ ...row, issues: [] }], accepted, 0, 1],
    ['page error', [{ ...row, errors: ['SVG height is negative'] }], accepted, 1, 0],
    ['focused run', [{ ...row, scenario: 'bar', step: 'values', issues: [] }], accepted, 0, 0],
  ]) {
    const result = checkReport(report, entries)
    assert.equal(result.failed.length, failures, name)
    assert.equal(result.stale.length, stale, name)
  }
})

// Catch a list that snaps its container height before its first recorded frame.
test('a synchronous bar list height change is flagged', () => {
  const id = 'ul.v-charts-bar-list#barList0'
  const frames = [176, 176, 176].map((height, i) => ({
    t: i * 16,
    shapes: { [id]: `||${height}` },
    overlap: 0,
    ...(i === 0 ? { before: { [id]: '||212' } } : {}),
  }))
  assert.deepEqual(flags(curves(frames), frames).issues, [
    'height jump ul.v-charts-bar-list#barList0 @0ms 212→176px',
  ])
})

// Normalizing to the final recorded sample must not hide a cut-off transition.
test('a cut-off recording fails against the independently settled target', () => {
  const frames = [0, 5, 10, 15, 20, 25, 30].map((x, i) => ({
    t: i * 16,
    shapes: { bar: `|${x}|0|10|20` },
    overlap: 0,
  }))
  assert.deepEqual(flags(curves(frames), frames, { bar: '|100|0|10|20' }).issues, ['unsettled bar'])
  assert.deepEqual(flags(curves(frames), frames, { bar: '|30|0|10|20' }).issues, [])
})

// A typo in a focused release check must not produce a successful empty report.
test('the motion CLI rejects an unknown step filter', async () => {
  const { spawnSync } = await import('node:child_process')
  const result = spawnSync(process.execPath, [
    'packages/vue/test/lab/report.mjs',
    'bar',
    '--steps=missing-step',
    '--out=.evidence/release-1.0/phase-4/unknown-step',
  ], { cwd: new URL('../../../../', import.meta.url), encoding: 'utf8', timeout: 60000 })
  assert.equal(result.status, 1, result.stdout + result.stderr)
  assert.ok(result.stderr.includes('No motion transitions matched'), result.stderr)
})

// User arguments must never permit deletion outside the evidence directory.
test('the motion CLI rejects unsafe output paths and scenario names', async () => {
  const { spawnSync } = await import('node:child_process')
  for (const [args, message] of [
    [['bar', '--out=.'], 'Motion output must be contained'],
    [['../bar'], 'Unknown motion scenario'],
  ]) {
    const result = spawnSync(process.execPath, ['packages/vue/test/lab/report.mjs', ...args], {
      cwd: new URL('../../../../', import.meta.url),
      encoding: 'utf8',
      timeout: 60000,
    })
    assert.equal(result.status, 1, result.stdout + result.stderr)
    assert.ok(result.stderr.includes(message), result.stderr)
  }
})
