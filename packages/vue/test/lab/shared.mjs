// Shared setup for the motion lab scripts: a server for the lab app and a browser.
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build, createServer, preview } from 'vite'
import { launchBrowser as launch } from '../../../../scripts/lib/browser.mjs'
import { checkPorts } from '../../../../scripts/lib/ports.mjs'

export const here = dirname(fileURLToPath(import.meta.url))
export const repo = join(here, '../../../..')

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
    const server = await preview({ configFile, logLevel: 'error', build: { outDir }, preview: { port: Number(flag('port', checkPorts(4680, 4689)[0])), strictPort: true, host: '127.0.0.1' } })
    return { url: server.resolvedUrls.local[0], close: () => new Promise(resolve => server.httpServer.close(resolve)) }
  }
  const server = await createServer({ configFile, logLevel: 'error', server: { port: Number(flag('port', checkPorts(4680, 4689)[0])), strictPort: true, host: '127.0.0.1' } })
  await server.listen()
  return { url: server.resolvedUrls.local[0], close: () => server.close() }
}

/** `--browser=chromium|firefox|webkit`; MOTION_EXECUTABLE_PATH overrides the Chromium binary. */
export function launchBrowser() {
  return launch({ browser: flag('browser', 'chromium') })
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
