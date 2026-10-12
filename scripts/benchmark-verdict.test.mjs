import assert from 'node:assert/strict'
// eslint-disable-next-line test/no-import-node-test
import { test } from 'node:test'
import { compareSamples } from './lib/benchmark-verdict.mjs'

// Noise must not be printed as a pass; a repeatable regression must still fail.
test('paired benchmark spread distinguishes passes, regressions and uncertainty', () => {
  for (const [baseline, current, sameBuild, expected] of [
    [[10, 10, 10, 10, 10], [10, 10, 10, 10, 10], false, 'PASS'],
    [[10, 10, 10, 10, 10], [12, 12, 12, 12, 12], false, 'FAIL'],
    [[10, 10, 10, 10, 10], [8, 10, 11, 12, 14], false, 'INCONCLUSIVE'],
    [[10, 10, 10, 10, 10], [8, 8, 8, 8, 8], true, 'FAIL'],
  ]) {
    const result = compareSamples(baseline, current, sameBuild)
    assert.equal(result.verdict, expected)
    assert.equal(result.passed, expected === 'PASS')
  }
  assert.throws(() => compareSamples([], []), /Expected paired positive/)
  assert.throws(() => compareSamples([10], [0]), /Expected paired positive/)
})
