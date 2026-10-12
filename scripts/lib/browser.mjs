// The one place that loads Playwright for the browser checks, launches a browser, and installs
// the browser engines. CLI: `node scripts/lib/browser.mjs --install-browser [--with-deps] [engine…]`.
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import playwright from 'playwright-core'

export const { chromium } = playwright
export const playwrightVersion = createRequire(import.meta.url)('playwright-core/package.json').version

/**
 * Launches a headless `chromium`, `firefox` or `webkit`. `MOTION_EXECUTABLE_PATH` replaces the
 * Chromium binary, for example with a locally installed headless shell.
 */
export function launchBrowser({ browser = 'chromium', ...options } = {}) {
  const type = { chromium, firefox: playwright.firefox, webkit: playwright.webkit }[browser]
  if (!type)
    throw new Error(`Unknown browser ${browser}; expected chromium, firefox or webkit`)
  const executablePath = browser === 'chromium' ? process.env.MOTION_EXECUTABLE_PATH : undefined
  return type.launch({ headless: true, ...(executablePath ? { executablePath } : {}), ...options })
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2)
  if (!args.includes('--install-browser'))
    throw new Error('Usage: node scripts/lib/browser.mjs --install-browser [--with-deps] [chromium-headless-shell firefox webkit]')
  const engines = args.filter(arg => !arg.startsWith('--'))
  const cli = join(dirname(createRequire(import.meta.url).resolve('playwright-core')), 'cli.js')
  const install = spawnSync(process.execPath, [
    cli,
    'install',
    ...(args.includes('--with-deps') ? ['--with-deps'] : []),
    ...(engines.length ? engines : ['chromium-headless-shell', 'firefox', 'webkit']),
  ], { stdio: 'inherit' })
  process.exitCode = install.status ?? 1
}
