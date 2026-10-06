// Runs every release check in turn, keeps going after a failure, and prints one verdict table.
/* eslint-disable no-console -- a command-line report */
// See VERIFY.md for what each check proves. `--quick` skips the browser sweeps.
import { spawnSync } from 'node:child_process'

const docsBrowsers = process.argv.find(arg => arg.startsWith('--docs-browser='))?.slice(15)
if (docsBrowsers && !/^(?:chromium|firefox|webkit)(?:,(?:chromium|firefox|webkit))*$/.test(docsBrowsers))
  throw new Error('Expected --docs-browser=chromium,firefox,webkit or a subset')
const docsCommand = `pnpm check:docs${docsBrowsers ? ` --browser=${docsBrowsers}` : ''}`

const quick = process.argv.includes('--quick')
const checks = [
  ['unit and regression tests', 'pnpm --filter vccs exec vitest run --maxWorkers=2'],
  ['lint', 'pnpm exec eslint .'],
  ['code health', 'pnpm check:code'],
  ['library build', 'pnpm --filter vccs build'],
  ['package exports and types', 'pnpm check:package'],
  ...(quick
    ? []
    : [
        ['accessibility, contrast and hydration', 'pnpm check:a11y'],
        ['frame-exact motion (lab)', 'pnpm motion:report --prod --check'],
        ['playground pages in a browser', 'pnpm check:play'],
        ['playground recorder regression', 'node --test scripts/check-play.test.mjs'],
        ['docs pages in selected browsers', docsCommand],
        ['docs checker regression', 'node --test scripts/check-docs.test.mjs'],
        ['entrances visitors actually see', 'pnpm check:seen'],
        ['visitor recorder regression', 'node --test scripts/check-seen.test.mjs'],
      ]),
]

const results = checks.map(([name, command]) => {
  console.log(`\n▶ ${name}: ${command}`)
  const started = Date.now()
  const { status } = spawnSync(command, { shell: true, stdio: 'inherit' })
  return { name, command, passed: status === 0, seconds: Math.round((Date.now() - started) / 1000) }
})

console.log('\nVerification')
for (const r of results)
  console.log(`${r.passed ? 'PASS' : 'FAIL'}  ${r.name.padEnd(36)} ${String(r.seconds).padStart(5)} s  ${r.command}`)
process.exitCode = results.every(r => r.passed) ? 0 : 1
