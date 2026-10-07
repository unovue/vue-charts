/* eslint-disable no-console -- command-line check */
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { createServer as createViteServer } from 'vite'
import { checkContrast } from './a11y/contrast.mjs'
import { checkKeyboard } from './a11y/keyboard.mjs'
import { launchBrowser } from './lib/browser.mjs'

const evidence = resolve('.evidence/release-1.0/a11y')

let vite
let server
let browser
const results = []

async function prepareFixture() {
  assert.equal(spawnSync('git', ['check-ignore', `${evidence}/results.json`]).status, 0)
  await mkdir(evidence, { recursive: true })
  vite = await createViteServer({
    root: resolve('.'),
    configFile: false,
    cacheDir: `${evidence}/.vite`,
    define: {
      __VUE_OPTIONS_API__: true,
      __VUE_PROD_DEVTOOLS__: false,
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: true,
    },
    resolve: { dedupe: ['vue'] },
    server: { middlewareMode: true, hmr: false, ws: false },
  })
  const module = await vite.ssrLoadModule('/scripts/a11y/fixture.mjs')
  const { renderToString } = await vite.ssrLoadModule('vue/server-renderer')
  const html = new Map()
  for (const name of module.names)
    html.set(name, await renderToString(module.app(name)))
  for (const variant of ['opaque', 'nested', 'translucent']) {
    const name = variant === 'opaque' ? 'Heatmap' : 'Treemap'
    html.set(`${name}-${variant}`, await renderToString(module.app(name, variant)))
  }
  await writeFile(`${evidence}/ssr.json`, JSON.stringify(Object.fromEntries(html), null, 2))
  const css = (await readFile('docs/app/assets/main.css', 'utf8'))
    .split('/* Match Recharts')[0]
    + await readFile('scripts/a11y/fixture.css', 'utf8')
  server = createServer((request, response) => {
    const url = new URL(request.url, 'http://localhost')
    if (url.pathname !== '/audit') {
      vite.middlewares(request, response)
      return
    }
    const name = url.searchParams.get('name')
    const variant = url.searchParams.get('variant') ?? 'default'
    const chartHtml = html.get(variant === 'default' ? name : `${name}-${variant}`)
    response.setHeader('Content-Type', 'text/html; charset=utf-8')
    response.end(`<!doctype html><html lang="en" class="${url.searchParams.get('theme')}">
<head><meta charset="utf-8"><title>Accessibility check</title><style>${css}
</style></head><body><main><h1>${name}</h1><div id="host" data-variant="${variant}">${chartHtml}</div></main>
<script>window.chartName=${JSON.stringify(name)};window.variant=${JSON.stringify(variant)}</script>
<script type="module" src="/scripts/a11y/client.mjs"></script></body></html>`)
  })
  for (let port = 4600; port <= 4699; port++) {
    try {
      await new Promise((resolve, reject) => {
        server.once('error', reject)
        server.listen(port, '127.0.0.1', resolve)
      })
      return { names: module.names, url: `http://127.0.0.1:${port}` }
    }
    catch (error) {
      if (error.code !== 'EADDRINUSE')
        throw error
    }
  }
  throw new Error('No free port in 4600–4699')
}

async function checkPage(url, name, theme, reducedMotion, variant = 'default') {
  const page = await browser.newPage({ reducedMotion, viewport: { width: 900, height: 800 } })
  const errors = []
  let measurements = {}
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', (message) => {
    if (/hydration.*mismatch|Hydration (?:node|text|children|attribute|style)/i.test(message.text()))
      errors.push(message.text())
  })
  try {
    await page.goto(`${url}/audit?name=${name}&theme=${theme}&variant=${variant}`)
    await page.waitForFunction(() => window.hydrate)
    await page.evaluate(() => window.hydrate())
    await page.waitForFunction(() => window.ready)
    await checkKeyboard(page, name)
    await page.addScriptTag({ path: resolve('node_modules/axe-core/axe.min.js') })
    const violations = await page.evaluate(async () => (await window.axe.run()).violations
      .filter(item => ['serious', 'critical'].includes(item.impact)))
    const contrast = await page.evaluate(checkContrast)
    measurements = { contrast, violations, errors }
    const failures = contrast.filter(item => item.ratio < item.minimum)
    assert.ok(contrast.length, `${name}: no contrast samples`)
    assert.deepEqual(errors, [], 'hydration / page errors')
    assert.deepEqual(failures, [], 'text contrast')
    assert.deepEqual(violations, [], 'serious / critical axe violations')
    results.push({ name, theme, reducedMotion, variant, contrast, passed: true })
    if (reducedMotion === 'reduce')
      await page.screenshot({ path: `${evidence}/${name}-${theme}-${variant}.png` })
    console.log(`PASS ${name} ${theme} ${reducedMotion}: ${contrast.length} text samples`)
  }
  catch (error) {
    results.push({ name, theme, reducedMotion, variant, ...measurements, passed: false, error: error.message })
    await page.screenshot({ path: `${evidence}/${name}-${theme}-${variant}-failure.png` })
    console.error(`FAIL ${name} ${theme} ${reducedMotion}: ${error.message}`)
  }
  finally {
    await page.close()
  }
}

try {
  assert.equal(spawnSync('pnpm', ['--filter', 'vccs', 'build'], { stdio: 'inherit' }).status, 0)
  const { names, url } = await prepareFixture()
  browser = await launchBrowser()
  for (const theme of ['light', 'dark']) {
    for (const reducedMotion of ['no-preference', 'reduce']) {
      for (const name of names)
        await checkPage(url, name, theme, reducedMotion)
      for (const variant of ['opaque', 'nested', 'translucent'])
        await checkPage(url, variant === 'opaque' ? 'Heatmap' : 'Treemap', theme, reducedMotion, variant)
    }
  }
  assert.equal(results.filter(item => !item.passed).length, 0)
}
catch (error) {
  console.error(error)
  process.exitCode = 1
}
finally {
  await writeFile(`${evidence}/results.json`, JSON.stringify(results, null, 2))
  await browser?.close()
  if (server?.listening)
    await new Promise(resolve => server.close(resolve))
  await vite?.close()
}
