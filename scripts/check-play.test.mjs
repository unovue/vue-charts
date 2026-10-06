import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
// eslint-disable-next-line test/no-import-node-test
import { test } from 'node:test'

// Transparent shapes must neither satisfy an entrance nor fail geometry checks.
test('the recorder judges only painted fill and stroke geometry', () => {
  const root = fileURLToPath(new URL('../', import.meta.url))
  const out = '.evidence/tooling/play-paint-regression'
  const result = spawnSync(process.execPath, [
    'scripts/check-play.mjs',
    '--skip-build',
    '--fixture-only',
    `--out=${out}`,
  ], { cwd: root, encoding: 'utf8' })
  assert.equal(result.status, 0, result.stdout + result.stderr)
  const { results } = JSON.parse(readFileSync(`${root}${out}/results.json`, 'utf8'))
  const flags = results[0].scenarios[0].flags
  // A hidden tooltip while hovering a real mark must still fail after probe retargeting.
  const hover = results[0].scenarios.find(s => s.label === 'hover-0')
  const tooltip = hover.flags.find(f => f.flag === 'tooltip')
  assert.ok(tooltip, 'missing-tooltip positive control')
  assert.ok(tooltip.numbers.hit.series, 'probe must hit a data series, not SVG whitespace')
  const cellHover = results[0].scenarios.find(s => s.label === 'hover-2')
  assert.equal(cellHover.flags.find(f => f.flag === 'tooltip')?.numbers.hit.class, 'cell-hit', 'cell overlay must receive a probe inside its painted mark')
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

// Background sectors and polygon centres must not stand in for interactive data items.
test('polar hover probes select interactive data marks', () => {
  const root = fileURLToPath(new URL('../', import.meta.url))
  for (const [route, hovers] of [
    ['/radial-charts', 6],
    ['/radar-charts', 11],
    ['/dashboard-charts', 6],
  ]) {
    const out = `.evidence/tooling/polar-mark-regression${route}`
    const result = spawnSync(process.execPath, ['scripts/check-play.mjs', '--skip-build', `--route=${route}`, `--out=${out}`], { cwd: root, encoding: 'utf8' })
    // The full checker still gates product flags; this regression checks probe selection.
    assert.ok([0, 1].includes(result.status), result.stdout + result.stderr)
    assert.ok(result.stdout.includes(`${route.slice(1)}-1280:`), result.stderr)
    const { fixturePassed, results } = JSON.parse(readFileSync(`${root}${out}/results.json`, 'utf8'))
    assert.equal(fixturePassed, true)
    const page = results.find(r => r.route === route)
    const probes = page.scenarios.filter(s => s.label.startsWith('hover-'))
    assert.equal(probes.length, hovers, route)
    const flags = page.scenarios.flatMap(s => s.flags)
    assert.deepEqual(flags.filter(f => f.flag === 'execution'), [], route)
    const lastFrame = probe => JSON.parse(readFileSync(`${root}${out}/${probe.data}`, 'utf8')).at(-1)
    if (route === '/radial-charts')
      assert.ok(probes.every(probe => lastFrame(probe).hit.itemSector === true), 'radial probes must hit interactive sectors, not backgrounds')
    if (route === '/dashboard-charts') {
      const frame = lastFrame(probes[3])
      assert.equal(frame.hit.tag, 'path', 'Pie probe must hit a sector, not centre text')
      assert.ok(frame.hit.class.includes('v-charts-sector'))
      assert.equal(frame.charts[3].tooltip, true, 'sector probe must activate the Pie tooltip')
    }
    if (route === '/radar-charts') {
      assert.equal(lastFrame(probes[1]).hit.tag, 'circle', 'prefer datum dots when available')
      assert.equal(lastFrame(probes[6]).charts[6].tooltip, true, 'outline probe must activate the filled Radar tooltip')
    }
  }
})
