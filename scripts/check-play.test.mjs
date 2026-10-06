import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
// eslint-disable-next-line test/no-import-node-test
import { test } from 'node:test'

// Transparent shapes must neither satisfy an entrance nor fail geometry checks.
test('the recorder judges only painted fill and stroke geometry', () => {
  const root = fileURLToPath(new URL('../', import.meta.url))
  const out = '.evidence/release-1.0/play-paint-regression'
  const result = spawnSync(process.execPath, [
    'scripts/check-play.mjs',
    '--skip-build',
    '--fixture-only',
    `--out=${out}`,
  ], { cwd: root, encoding: 'utf8' })
  assert.equal(result.status, 0, result.stdout + result.stderr)
  const { results } = JSON.parse(readFileSync(`${root}${out}/results.json`, 'utf8'))
  const flags = results[0].scenarios[0].flags
  const frames = JSON.parse(readFileSync(`${root}${out}/fixture-1280-load.json`, 'utf8'))
  for (const [control, painted] of [
    ['opaque', true],
    ['stroke', true],
    ['fill-opacity', false],
    ['fill-alpha', false],
    ['css-alpha', false],
    ['stroke-opacity', false],
    ['stroke-alpha', false],
    ['stroke-width', false],
    ['ancestor', false],
  ]) {
    const shapes = frames.flatMap(f => f.charts.flatMap(c => c.shapes))
      .filter(s => JSON.parse(s.geometry).some(([k, v]) => k === 'data-control' && v === control))
    assert.ok(shapes.length > 0, control)
    assert.ok(shapes.every(s => s.visible === painted), control)
    const { id, series } = shapes[0]
    assert.equal(flags.some(f => f.shape === id && f.flag === 'teleport'), painted, control)
    assert.equal(flags.some(f => f.shape === `series-${series}`), false, control)
  }
})
