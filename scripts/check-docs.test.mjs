import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
// eslint-disable-next-line test/no-import-node-test
import { test } from 'node:test'

// A visible native HTML chart must not fail the same geometry gate as SVG charts.
test('the docs checker accepts the real BarList demo at both widths', () => {
  const root = fileURLToPath(new URL('../', import.meta.url))
  const out = '.evidence/release-1.0/docs-native-list-regression'
  const result = spawnSync(process.execPath, [
    'scripts/check-docs.mjs',
    '--browser=chromium',
    '--route=/charts/bar-list',
    `--out=${out}`,
  ], { cwd: root, encoding: 'utf8' })
  assert.equal(result.status, 0, result.stdout + result.stderr)
  const summary = JSON.parse(readFileSync(new URL(`../${out}/summary.json`, import.meta.url), 'utf8'))
  assert.equal(summary.results.length, 2)
  assert.deepEqual(summary.results.map(r => r.demos[0].surfaces[0].shapes), [5, 5])
})
