import assert from 'node:assert/strict'
import { constants } from 'node:buffer'
import { mkdir, realpath, stat } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
// eslint-disable-next-line test/no-import-node-test
import { test } from 'node:test'
import { collectSeen } from './lib/seen-capture.mjs'

// A long recording must finish even when its total JSON exceeds Node's string limit.
test('visitor capture streams a recording larger than one transport string', async () => {
  const root = fileURLToPath(new URL('../', import.meta.url))
  const require = createRequire(await realpath(`${root}packages/vue/node_modules/@nuxt/test-utils/package.json`))
  const { chromium } = require('playwright-core')
  const browser = await chromium.launch({ headless: true })
  const out = `${root}.evidence/release-1.0/seen-stream-regression`
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
