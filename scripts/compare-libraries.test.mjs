import assert from 'node:assert/strict'
// eslint-disable-next-line test/no-import-node-test
import { test } from 'node:test'
import { animationVerdict, comparisonProblems, loadedOutputs } from './lib/compare-libraries.mjs'

test('a declared omission that animates fails, so a card cannot wrongly claim "no animation"', () => {
  assert.equal(animationVerdict({ enterFrames: 20, updateFrames: 1 }, true).ok, false)
})

test('a chart that should animate but snaps fails', () => {
  assert.equal(animationVerdict({ enterFrames: 1, updateFrames: 2 }, false).ok, false)
})

test('update-only animation counts, and a redraw without in-between frames does not', () => {
  assert.equal(animationVerdict({ enterFrames: 1, updateFrames: 19 }, false).animated, true)
  assert.equal(animationVerdict({ enterFrames: 2, updateFrames: 2 }, true).ok, true)
})

test('first-load size follows static imports and CSS but leaves lazy chunks out', () => {
  const metafile = {
    outputs: {
      'entry.js': { entryPoint: 'measure.js', cssBundle: 'entry.css', imports: [{ path: 'shared.js', kind: 'import-statement' }, { path: 'lazy.js', kind: 'dynamic-import' }, { path: 'vue', kind: 'import-statement', external: true }] },
      'shared.js': { imports: [] },
      'lazy.js': { imports: [] },
      'entry.css': { imports: [] },
    },
  }
  assert.deepEqual(loadedOutputs(metafile, 'measure.js').sort(), ['entry.css', 'entry.js', 'shared.js'])
})

const library = { id: 'one', packages: ['one'], builds: [{ id: 'default' }] }
const reference = { id: 'ref', packages: ['ref'], builds: [{ id: 'default' }] }
function valid() {
  return {
    libraries: [library],
    reference,
    sitePins: { one: '1.0.0' },
    bundleManifests: { one: { dependencies: { one: '1.0.0' } }, ref: { dependencies: { ref: '2.0.0' } } },
    lockfiles: ['one', 'ref'],
    chartFiles: ['one.vue'],
    results: { builds: [{ library: 'one', build: 'default', versions: { one: '1.0.0' } }, { library: 'ref', build: 'default', versions: { ref: '2.0.0' } }] },
  }
}

test('a consistent comparison has no problems', () => {
  assert.deepEqual(comparisonProblems(valid()), [])
})

test('each way the numbers can stop describing the cards is reported', () => {
  const cases = [
    [(input) => { input.sitePins.one = '1.1.0' }, /in the site/],
    [(input) => { input.results.builds[0].versions.one = '0.9.0' }, /measured versions differ/],
    [(input) => { input.results.builds.shift() }, /no measurement/],
    [(input) => { input.lockfiles = ['ref'] }, /no lockfile/],
    [(input) => { input.chartFiles = [] }, /no chart/],
    [(input) => { delete input.bundleManifests.one }, /no benchmark\/bundles/],
    [(input) => { input.libraries = [{ ...library, omits: ['animation'] }] }, /omits animation without a note/],
    [(input) => { input.libraries = [{ ...library, omits: ['animation'], note: 'No animation.' }] }, /omits animation without a source/],
  ]
  for (const [mutate, expected] of cases) {
    const input = valid()
    mutate(input)
    assert.match(comparisonProblems(input).join('\n'), expected)
  }
})
