import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
// eslint-disable-next-line test/no-import-node-test
import { test } from 'node:test'

// An error in the independent target must fail even when recorded geometry is clean.
test('the motion CLI rejects an error from its static target page', () => {
  const evidence = resolve('.evidence/release-1.0/motion-target-error-control')
  assert.equal(spawnSync('git', ['check-ignore', evidence]).status, 0)
  mkdirSync(evidence, { recursive: true })
  const preload = `${evidence}/preload.mjs`
  // Use the real browser; inject only a deliberate error into static controls.
  writeFileSync(preload, `
import { realpath } from 'node:fs/promises'
import { createRequire } from 'node:module'
const require = createRequire(await realpath('packages/vue/node_modules/@nuxt/test-utils/package.json'))
const { chromium } = require('playwright-core')
const launch = chromium.launch.bind(chromium)
chromium.launch = async (options) => {
  const browser = await launch(options)
  const newContext = browser.newContext.bind(browser)
  browser.newContext = async (options) => {
    const context = await newContext(options)
    await context.addInitScript(() => {
      window.addEventListener('load', () => {
        if (new URL(location.href).searchParams.has('static'))
          setTimeout(() => { throw new Error('Deliberate static target error') }, 0)
      })
    })
    return context
  }
  return browser
}
`)
  const result = spawnSync(process.execPath, [
    '--import',
    preload,
    'packages/vue/test/lab/report.mjs',
    'bar',
    '--steps=values',
    '--prod',
    '--check',
    '--no-throttle',
    `--out=${evidence}/report`,
  ], { encoding: 'utf8' })
  assert.equal(result.status, 1, result.stdout + result.stderr)
  const rows = JSON.parse(readFileSync(`${evidence}/report/report.json`, 'utf8'))
  assert.equal(rows.length, 1)
  assert.deepEqual(rows[0].issues, [])
  assert.ok(rows[0].errors.some(error => error.includes('Deliberate static target error')))
})
