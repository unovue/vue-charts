import assert from 'node:assert/strict'
import { constants } from 'node:buffer'
import { spawnSync } from 'node:child_process'
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
// eslint-disable-next-line test/no-import-node-test
import { test } from 'node:test'
import { launchBrowser } from './lib/browser.mjs'
import { collectSeen } from './lib/seen-capture.mjs'
import { installSeenRecorder } from './lib/seen-recorder.mjs'

// A pending external asset must not stop a fully rendered chart from being checked.
test('visitor CLI captures charts while an external resource is still loading', async () => {
  const root = fileURLToPath(new URL('../', import.meta.url))
  const out = `${root}.evidence/release-1.0/seen-resource-control`
  await mkdir(out, { recursive: true })
  const preload = `${out}/preload.mjs`
  await writeFile(preload, `
import { chromium } from '${root}scripts/lib/browser.mjs'
const launch = chromium.launch.bind(chromium)
chromium.launch = async (options) => {
  const browser = await launch(options)
  const newContext = browser.newContext.bind(browser)
  browser.newContext = async (options) => {
    const context = await newContext(options)
    await context.route('https://external.invalid/pending.svg', () => new Promise(() => {}))
    await context.addInitScript(() => {
      document.addEventListener('DOMContentLoaded', () => {
        const image = new Image()
        image.src = 'https://external.invalid/pending.svg'
        image.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0'
        document.body.append(image)
      })
    })
    return context
  }
  return browser
}
`)
  const result = spawnSync(process.execPath, [
    '--import',
    preload,
    'scripts/check-seen.mjs',
    '--fixture',
    `--out=${out}`,
  ], { cwd: root, encoding: 'utf8' })
  assert.equal(result.status, 0, result.stdout + result.stderr)
  const summary = JSON.parse(await readFile(`${out}/fixture-summary.json`, 'utf8'))
  assert.equal(summary.fixturePassed, true)
  assert.deepEqual(summary.errors, [])
  assert.equal(summary.rows.length, 6)
})

// A navigation index has no entrance; empty chart coverage must still fail.
test('visitor CLI checks chart routes without requiring charts in the navigation index', async () => {
  const root = fileURLToPath(new URL('../', import.meta.url))
  const out = `${root}.evidence/release-1.0/seen-route-control`
  const args = [
    'scripts/check-seen.mjs',
    '--only=play',
    '--width=390',
    '--skip-build',
    `--out=${out}`,
  ]
  const result = spawnSync(process.execPath, [...args, '--route=/,/journey-charts'], {
    cwd: root,
    encoding: 'utf8',
  })
  assert.equal(result.status, 0, result.stdout + result.stderr)
  const summary = JSON.parse(await readFile(`${out}/summary.json`, 'utf8'))
  assert.deepEqual(summary.errors, [])
  assert.ok(summary.rows.length > 0)
  assert.ok(summary.rows.every(row => row.page === '/journey-charts'))
  const empty = spawnSync(process.execPath, [...args, '--route=/'], { cwd: root, encoding: 'utf8' })
  assert.equal(empty.status, 1, empty.stdout + empty.stderr)
})

// A long recording must finish even when its total JSON exceeds Node's string limit.
test('visitor capture streams a recording larger than one transport string', async () => {
  const root = fileURLToPath(new URL('../', import.meta.url))
  const browser = await launchBrowser()
  const out = `${root}.evidence/tooling/seen-stream-regression`
  await mkdir(out, { recursive: true })
  try {
    const page = await browser.newPage()
    await page.evaluate(() => {
      const d = 'M'.repeat(1024 * 1024)
      window.seenRecording = {
        frames: Array.from({ length: 520 }, (_, t) => ({
          t,
          charts: [{ id: 1, geometry: [{ id: 2, values: { d } }] }],
        })),
        shots: { 1: [{ t: 0, svg: '<svg/>', box: [0, 0, 20, 20] }] },
      }
    })
    const file = `${out}/recording.json`
    const finish = await collectSeen(page, file)
    const { frames, shots } = await finish()
    assert.equal(frames.length, 520)
    assert.deepEqual(frames.map(f => f.t), Array.from({ length: 520 }, (_, i) => i))
    assert.ok(frames.every(f => f.charts[0].geometry[0].values.d.length === 1048576))
    assert.deepEqual(shots, { 1: [{ t: 0, svg: '<svg/>', box: [0, 0, 20, 20] }] })
    assert.ok((await stat(file)).size > constants.MAX_STRING_LENGTH)
  }
  finally {
    await browser.close()
  }
})

// A paused recording must not mistake a newly rotated outgoing chart for the clicked chart.
test('tab reset returns live chart identities after a paused replacement', async () => {
  const browser = await launchBrowser()
  try {
    const page = await browser.newPage()
    await page.evaluate(installSeenRecorder)
    await page.setContent('<div class="v-charts-wrapper"><svg class="v-charts-surface"><rect width="20" height="20"/></svg></div>')
    await page.waitForFunction(() => window.seenRecording.lastFrame?.charts.length === 1)
    const result = await page.evaluate(async () => {
      window.seenRecording.done = true
      document.querySelector('.v-charts-wrapper').replaceWith(document.querySelector('.v-charts-wrapper').cloneNode(true))
      const ids = window.seenReset('tab:Area')
      const frames = await new Promise(resolve => requestAnimationFrame(() => resolve(window.seenRecording.frames.length)))
      return { ids, frames }
    })
    assert.deepEqual(result, { ids: [3], frames: 1 })
    await page.waitForFunction(() => window.seenRecording.lastFrame?.charts[0]?.id === 3)
  }
  finally {
    await browser.close()
  }
})
