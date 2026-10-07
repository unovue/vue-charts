// Runs every release check in turn, keeps going after a failure, and prints one verdict table.
/* eslint-disable no-console -- a command-line report */
// See VERIFY.md for what each check proves and which tier runs it.
import { spawnSync } from 'node:child_process'

const docsBrowsers = process.argv.find(arg => arg.startsWith('--docs-browser='))?.slice(15)
if (docsBrowsers && !/^(?:chromium|firefox|webkit)(?:,(?:chromium|firefox|webkit))*$/.test(docsBrowsers))
  throw new Error('Expected --docs-browser=chromium,firefox,webkit or a subset')
const docsCommand = `pnpm check:docs${docsBrowsers ? ` --browser=${docsBrowsers}` : ''}`

// Tiers: default (about 15 min), --release adds the slow browser gates, --quick skips the browser sweeps.
const quick = process.argv.includes('--quick')
const release = process.argv.includes('--release')
if (quick && release)
  throw new Error('Use --quick or --release, not both')
const checks = [
  ['unit and regression tests', 'pnpm --filter vccs exec vitest run --maxWorkers=2'],
  ['tooling verdict regressions', 'node --test scripts/check-verdicts.test.mjs scripts/check-process.test.mjs scripts/benchmark-verdict.test.mjs scripts/benchmark-motion.test.mjs'],
  ['lint', 'pnpm lint'],
  ['typecheck', 'pnpm typecheck'],
  ['library build', 'pnpm --filter vccs build'],
  ['size budgets', 'pnpm --filter vccs size'],
  ['package exports and types', 'pnpm check:package'],
  ['packed consumers', `node scripts/check-consumers.mjs${quick ? ' --skip-dev' : ''}`],
  ['code health', 'pnpm check:code'],
  ['docs cover every public component', 'node scripts/check-docs-coverage.mjs'],
  ['standalone bundles', 'pnpm check:bundle --assert-standalone'],
  ['Nuxt SSR fixture', 'pnpm --filter vccs test:nuxt'],
  ...(quick ? [] : [['accessibility, contrast and hydration', 'pnpm check:a11y']]),
  ['motion guide tokens', 'node scripts/update-motion-docs.mjs --check'],
  ['motion metrics regressions', 'node --test packages/vue/test/lab/report-metrics.test.mjs'],
  ...(quick
    ? []
    : [
        ['production motion fixture', 'pnpm check:motion'],
        ['motion recorder regressions', 'node --test scripts/check-motion-report.test.mjs'],
        // check:docs audits the generated site in docs/.output/public; build it from this checkout.
        ['docs site build', 'pnpm --filter docs build'],
        ['docs pages in selected browsers', docsCommand],
        ['docs checker regression', 'node --test scripts/check-docs.test.mjs'],
      ]),
  ...(release
    ? [
        ['motion geometry, every transition (lab)', 'node packages/vue/test/lab/report.mjs --prod --check'],
        ['playground pages in a browser', 'pnpm check:play'],
        ['playground recorder regression', 'node --test scripts/check-play.test.mjs'],
      ]
    : []),
]

const results = checks.map(([name, command]) => {
  console.log(`\n▶ ${name}: ${command}`)
  const started = Date.now()
  const { status, error, signal } = spawnSync(command, { shell: true, stdio: 'inherit' })
  // pnpm reports a child killed by SIGTERM as exit code 143; verify sets no time limit itself.
  const stopped = signal ?? (status === 143 ? 'SIGTERM' : status === 137 ? 'SIGKILL' : '')
  const reason = error?.message ?? (stopped ? `stopped by ${stopped} from outside verify` : '')
  return { name, command, verdict: status === 0 ? 'PASS' : 'FAIL', reason, seconds: Math.round((Date.now() - started) / 1000) }
})

console.log('\nVerification')
for (const r of results)
  console.log(`${r.verdict}  ${r.name.padEnd(40)} ${String(r.seconds).padStart(5)} s  ${r.command}${r.reason ? ` (${r.reason})` : ''}`)
process.exitCode = results.every(r => r.verdict === 'PASS') ? 0 : 1
