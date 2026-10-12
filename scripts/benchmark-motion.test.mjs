import assert from 'node:assert/strict'
// eslint-disable-next-line test/no-import-node-test
import { test } from 'node:test'
import { animatedGeometry } from './lib/benchmark-motion.mjs'

test('late validation retains observed motion and rejects snapped or empty updates', () => {
  for (const row of [
    { frames: ['before', 'half', 'end', 'end'], immediate: 'before', valid: true },
    { frames: ['before', 'end', 'end'], immediate: 'end', valid: false },
    { frames: ['before', 'end', 'end'], immediate: 'before', valid: false },
    { frames: ['before', 'before'], immediate: 'before', valid: false },
    { frames: [], immediate: undefined, valid: false },
  ]) {
    const capture = animatedGeometry('BarChart', 'before')
    for (const frame of row.frames)
      capture.sample(frame)
    if (row.valid) {
      assert.deepEqual(capture.validate(row.immediate, 'end'), {
        before: 'before',
        immediate: 'before',
        middle: 'half',
        final: 'end',
      })
    }
    else {
      assert.throws(() => capture.validate(row.immediate, 'end'), /no intermediate motion/)
    }
  }
})
