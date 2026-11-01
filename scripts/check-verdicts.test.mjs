import assert from 'node:assert/strict'
// eslint-disable-next-line test/no-import-node-test
import { test } from 'node:test'
import { droppedPrefetch, emptySurface, seenVerdict } from './lib/check-verdicts.mjs'

// A filter that is too wide would hide a page whose real script failed to load.
test('only a dropped prefetch is forgiven, not an aborted script or another error', () => {
  for (const [errorText, resourceType, expected] of [
    ['NS_BINDING_ABORTED', 'other', true],
    ['NS_BINDING_ABORTED', 'script', false],
    ['NS_BINDING_ABORTED', 'fetch', false],
    ['NS_ERROR_NET_RESET', 'other', false],
    ['net::ERR_ABORTED', 'other', false],
  ])
    assert.equal(droppedPrefetch(errorText, resourceType), expected, `${errorText} ${resourceType}`)
})

// Empty recordings and reliable defects must fail even alongside noisy rows.
test('visitor verdict distinguishes missing coverage, defects and timing uncertainty', () => {
  const reliable = { reliability: 'reliable', flags: [] }
  const unreliable = { reliability: 'unreliable', flags: ['unseen-entrance'] }
  for (const [rows, recordings, errors, expected] of [
    [[], [{}], [], 'FAIL'],
    [[reliable], [], [], 'FAIL'],
    [[reliable], [{}], ['page error'], 'FAIL'],
    [[reliable], [{}], [], 'PASS'],
    [[unreliable], [{}], [], 'INCONCLUSIVE'],
    [[unreliable, { ...reliable, flags: ['no-entrance'] }], [{}], [], 'FAIL'],
  ])
    assert.equal(seenVerdict(rows, recordings, errors), expected)
})

// A sized SVG with no geometry is not a rendered chart.
test('docs rejects empty and zero-sized chart surfaces', () => {
  for (const [surface, expected] of [
    [{ width: 300, height: 200, shapes: 0 }, true],
    [{ width: 0, height: 200, shapes: 1 }, true],
    [{ width: 300, height: 0, shapes: 1 }, true],
    [{ width: 300, height: 200, shapes: 1 }, false],
  ])
    assert.equal(emptySurface(surface), expected)
})
