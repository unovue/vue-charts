// Shared setup for the motion lab scripts: a server for the lab app and a browser.
import { realpathSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build, createServer, preview } from 'vite'

export const here = dirname(fileURLToPath(import.meta.url))
export const repo = join(here, '../../../..')
// The locked Playwright of the Nuxt test tooling, as scripts/check-motion.mjs uses it.
const require = createRequire(realpathSync(join(repo, 'packages/vue/node_modules/@nuxt/test-utils/package.json')))
const playwright = require('playwright-core')

// `--install-browser` installs the locked engine(s), as `pnpm check:motion --install-browser` does.
if (process.argv.includes('--install-browser')) {
  const { spawnSync } = await import('node:child_process')
  const cli = join(dirname(require.resolve('playwright-core')), 'cli.js')
  const engines = ['chromium-headless-shell', 'firefox', 'webkit']
  const install = spawnSync(process.execPath, [cli, 'install', ...engines], { stdio: 'inherit' })
  process.exit(install.status ?? 1)
}

export const args = process.argv.slice(2)
export function flag(name, fallback) {
  const hit = args.find(a => a.startsWith(`--${name}=`))
  return hit ? hit.slice(name.length + 3) : fallback
}
export const has = name => args.includes(`--${name}`)
export const positional = () => args.filter(a => !a.startsWith('--'))

/**
 * Serves the lab app. `--prod` (or LAB_PROD=1) measures a production build, as users ship it;
 * VNode keys stay observable through __VUE_PROD_DEVTOOLS__ so identity can be followed.
 */
export async function startServer() {
  const configFile = join(here, 'vite.config.mjs')
  if (has('prod') || process.env.LAB_PROD) {
    const outDir = join(here, 'dist')
    await build({ configFile, logLevel: 'error', mode: 'production', build: { outDir, emptyOutDir: true, minify: false } })
    const server = await preview({ configFile, logLevel: 'error', build: { outDir }, preview: { port: Number(flag('port', 4680)), strictPort: true, host: '127.0.0.1' } })
    return { url: server.resolvedUrls.local[0], close: () => new Promise(resolve => server.httpServer.close(resolve)) }
  }
  const server = await createServer({ configFile, logLevel: 'error', server: { port: Number(flag('port', 4680)), strictPort: true, host: '127.0.0.1' } })
  await server.listen()
  return { url: server.resolvedUrls.local[0], close: () => server.close() }
}

/** `--browser=chromium|firefox|webkit`; MOTION_EXECUTABLE_PATH overrides the Chromium binary. */
export async function launchBrowser() {
  const name = flag('browser', 'chromium')
  const type = playwright[name]
  if (!type)
    throw new Error(`Unknown browser ${name}`)
  return type.launch({ headless: true, ...(name === 'chromium' && process.env.MOTION_EXECUTABLE_PATH ? { executablePath: process.env.MOTION_EXECUTABLE_PATH } : {}) })
}

/** Collects page errors, console errors/warnings and Vue warnings for a page. */
export function collectErrors(page) {
  const errors = []
  page.on('pageerror', e => errors.push(`pageerror: ${e.message}`))
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning' || m.text().includes('[Vue warn]'))
      errors.push(`${m.type()}: ${m.text().slice(0, 300)}`)
  })
  return errors
}

// Playwright schedules rAF on 16 ms boundaries and rounds runFor up to whole ms.
// Advancing 1000/60 therefore occasionally executes TWO animation frames per sample.
export const FRAME = 16
export async function advanceFrame(page) {
  const now = await page.evaluate(() => performance.now())
  await page.clock.runFor(FRAME - now % FRAME)
}
export async function settle(page) {
  let previous = JSON.stringify(await page.evaluate(() => window.__snapshot()))
  let still = 0
  for (let elapsed = 0; elapsed < 2000; elapsed += FRAME) {
    await advanceFrame(page)
    const current = JSON.stringify(await page.evaluate(() => window.__snapshot()))
    still = current === previous ? still + 1 : 0
    if (still === 3)
      return true
    previous = current
  }
  return false
}
