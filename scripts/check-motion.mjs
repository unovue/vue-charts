import { spawnSync } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build, preview } from 'vite'
import { launchBrowser, playwrightVersion } from './lib/browser.mjs'
import { checkPorts, portText } from './lib/ports.mjs'

const ports = checkPorts(4600, 4699)

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const fixture = join(root, 'packages/vue/test/fixtures/motion')
const evidence = join(root, '.evidence/s21')

const ignored = spawnSync('git', ['check-ignore', '.evidence/s21/results.json'], { cwd: root })
if (ignored.status !== 0)
  throw new Error('Evidence must be git-ignored: add .evidence/ to .git/info/exclude before running')
await mkdir(evidence, { recursive: true })
const results = []
const errors = []
let server
let browser
try {
  const library = spawnSync('pnpm', ['--filter', 'vccs', 'build'], { cwd: root, stdio: 'inherit' })
  if (library.status !== 0)
    throw new Error(`Library build exited ${library.status}`)
  await build({ root: fixture, configFile: join(fixture, 'vite.config.mjs') })
  for (const port of ports) {
    try {
      server = await preview({ root: fixture, configFile: join(fixture, 'vite.config.mjs'), preview: { port, strictPort: true, host: '127.0.0.1' } })
      break
    }
    catch (error) {
      if (!String(error).includes('already in use'))
        throw error
    }
  }
  if (!server)
    throw new Error(`No free port in ${portText(ports)}`)
  // CI uses Playwright's installed executable. Locally an explicit override is optional.
  browser = await launchBrowser()
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 }, reducedMotion: 'no-preference' })
  let diagnostics = []
  page.on('pageerror', error => diagnostics.push(`Page error: ${error.message}`))
  page.on('console', (message) => {
    if (message.text().includes('[Vue warn]'))
      diagnostics.push(message.text())
  })
  for (const kind of ['bar', 'line', 'area', 'pie', 'radar', 'radial', 'funnel', 'treemap', 'sankey', 'hover']) {
    diagnostics = []
    await page.goto(`${server.resolvedUrls.local[0]}?scenario=${kind}`, { waitUntil: 'networkidle' })
    await page.waitForFunction(() => window.motionFixture && document.querySelector('svg.v-charts-surface'))
    await page.waitForTimeout(1000)
    for (const direction of ['line', 'area'].includes(kind) ? ['90-to-7', '7-to-90'] : ['change']) {
      const name = `${kind}-${direction}`
      let result
      try {
        result = await page.evaluate(hover => hover ? window.runHoverSweep() : window.runMotionScenario(), kind === 'hover')
      }
      catch (error) {
        result = { failures: [error.message] }
      }
      result = { name, ...result, diagnostics: [...diagnostics] }
      result.failures.push(...diagnostics)
      result.passed = result.failures.length === 0
      if (!result.passed) {
        result.screenshot = `.evidence/s21/${name}-failure.png`
        await page.screenshot({ path: join(root, result.screenshot) })
      }
      results.push(result)
      // eslint-disable-next-line no-console -- One summary line per scenario is the CLI contract.
      console.log(`${result.passed ? 'PASS' : 'FAIL'} ${name}: frames=${result.frames ?? '?'} worst=${result.worstFrameMs?.toFixed(2) ?? '?'}ms recreated=${result.recreatedElements ?? 'n/a'} ${result.failures.join('; ')}`)
      await page.waitForTimeout(400)
    }
  }
}
catch (error) {
  errors.push(error.stack || String(error))
  console.error(error)
}
finally {
  await browser?.close()
  if (server)
    await new Promise((resolve, reject) => server.httpServer.close(error => error ? reject(error) : resolve()))
  const passed = results.length === 12 && results.every(result => result.passed) && !errors.length
  await writeFile(join(evidence, 'results.json'), `${JSON.stringify({ passed, node: process.version, playwright: playwrightVersion, executableOverride: process.env.MOTION_EXECUTABLE_PATH ?? null, thresholds: { windowMs: 800, minimumFrames: 42, frameBudgetMs: 34, allowedSlowFrames: 1, maximumFrameMs: 50 }, results, errors }, null, 2)}\n`)
  if (!passed)
    process.exitCode = 1
}
