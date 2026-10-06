import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
// eslint-disable-next-line test/no-import-node-test
import { test } from 'node:test'
import { stopProcess, waitForServer } from './lib/check-process.mjs'

// A child that ignores SIGTERM must not keep a release check running forever.
test('shutdown kills a server that ignores SIGTERM', async () => {
  const child = spawn(process.execPath, ['-e', 'process.on(\'SIGTERM\', () => {}); console.log(\'ready\'); setInterval(() => {}, 1000)'])
  await once(child.stdout, 'data')
  try {
    await stopProcess(child, 100)
    assert.equal(child.signalCode, 'SIGKILL')
  }
  finally {
    child.kill('SIGKILL')
  }
})

// A slow start must be polled, and an exited server must not be considered ready.
test('readiness waits for an HTTP response and rejects an exited child', async () => {
  const child = spawn(process.execPath, ['-e', 'setTimeout(() => require(\'node:http\').createServer((req, res) => res.end(\'ready\')).listen(4669, \'127.0.0.1\'), 1500)'])
  try {
    assert.equal(await waitForServer(child, 'http://127.0.0.1:4669', 5000), true)
  }
  finally {
    await stopProcess(child)
  }
  assert.equal(await waitForServer(child, 'http://127.0.0.1:4669'), false)
})
