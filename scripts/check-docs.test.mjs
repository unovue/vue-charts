import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
// eslint-disable-next-line test/no-import-node-test
import { test } from 'node:test'

// A visible native HTML chart must not fail the same geometry gate as SVG charts.
test('the docs checker accepts the real BarList demo at both widths', () => {
  const root = fileURLToPath(new URL('../', import.meta.url))
  const out = '.evidence/tooling/docs-native-list-regression'
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

// Sized empty surfaces must fail both CLI coverage gates.
for (const [script, args, message] of [
  ['check-docs', ['--browser=chromium'], 'empty or zero-sized surface'],
  ['check-seen', ['--skip-build', '--only=docs', '--width=390'], 'No chart rows recorded'],
]) {
  test(`${script} rejects an empty chart page`, () => {
    const root = fileURLToPath(new URL('../', import.meta.url))
    const route = '/charts/__empty-control'
    const file = `${root}docs/.output/public${route}.html`
    assert.equal(spawnSync('git', ['check-ignore', file], { cwd: root }).status, 0)
    writeFileSync(file, '<h1>Empty control</h1><div class="chart-demo"><svg class="v-charts-surface" width="300" height="200"></svg></div>')
    try {
      const out = `.evidence/tooling/${script}-empty-regression`
      const result = spawnSync(process.execPath, [`scripts/${script}.mjs`, ...args, `--route=${route}`, `--out=${out}`], { cwd: root, encoding: 'utf8' })
      assert.equal(result.status, 1, result.stdout + result.stderr)
      const report = readFileSync(`${root}${out}/summary.json`, 'utf8')
      assert.ok(report.includes(message), report)
    }
    finally {
      unlinkSync(file)
    }
  })
}
