// Runs every release check in turn, keeps going after a failure, and prints one verdict table.
/* eslint-disable no-console -- a command-line report */
// See VERIFY.md for what each check proves. `--quick` skips the browser sweeps.
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { seenVerdict } from './lib/check-verdicts.mjs'

const docsBrowsers = process.argv.find(arg => arg.startsWith('--docs-browser='))?.slice(15)
if (docsBrowsers && !/^(?:chromium|firefox|webkit)(?:,(?:chromium|firefox|webkit))*$/.test(docsBrowsers))
  throw new Error('Expected --docs-browser=chromium,firefox,webkit or a subset')
const docsCommand = `pnpm check:docs${docsBrowsers ? ` --browser=${docsBrowsers}` : ''}`

const quick = process.argv.includes('--quick')
const checks = [
  ['unit and regression tests', 'pnpm --filter vccs exec vitest run --maxWorkers=2'],
  ['tooling verdict regressions', 'node --test scripts/check-verdicts.test.mjs scripts/check-process.test.mjs scripts/benchmark-verdict.test.mjs scripts/benchmark-motion.test.mjs'],
  ['lint', 'pnpm lint'],
  ['typecheck', 'pnpm typecheck'],
  ['library build', 'pnpm --filter vccs build'],
  ['size budgets', 'pnpm --filter vccs size'],
  ['package exports and types', 'pnpm check:package'],
  ['packed consumers offline', 'node scripts/check-consumers.mjs'],
  ['code health', 'pnpm check:code'],
  ['standalone bundles', 'pnpm check:bundle --assert-standalone'],
  ['Nuxt SSR fixture', 'pnpm --filter vccs test:nuxt'],
  ...(quick ? [] : [['accessibility, contrast and hydration', 'pnpm check:a11y']]),
  ['motion guide tokens', 'node scripts/update-motion-docs.mjs --check'],
  ['motion metrics regressions', 'node --test packages/vue/test/lab/report-metrics.test.mjs'],
  ...(quick
    ? []
    : [
        ['production motion fixture', 'pnpm check:motion'],
        ['motion target error regression', 'node --test scripts/check-motion-report.test.mjs'],
        ['frame-exact motion (lab)', 'pnpm motion:report --prod --check --frames'],
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
  const { status, error, signal } = spawnSync(command, { shell: true, stdio: 'inherit' })
  let verdict = status === 0 ? 'PASS' : 'FAIL'
  let reason = error?.message ?? (signal ? `terminated by ${signal}` : '')
  if (status === 0 && name === 'entrances visitors actually see') {
    try {
      const summary = JSON.parse(readFileSync('.evidence/seen/summary.json', 'utf8'))
      if (!summary.acceptable || !['PASS', 'INCONCLUSIVE'].includes(summary.verdict)
        || summary.verdict !== seenVerdict(summary.rows, summary.recordings, summary.errors)) {
        throw new Error('Missing or invalid visitor-seen verdict')
      }
      verdict = summary.verdict
      if (verdict === 'INCONCLUSIVE') {
        const unreliable = summary.rows.filter(row => row.reliability === 'unreliable')
        if (!unreliable.length || !Number.isFinite(summary.thresholds?.unreliableGapMs))
          throw new Error('Inconclusive visitor-seen verdict has no declared unreliable rows')
        reason = `${unreliable.length} rows exceed the ${summary.thresholds.unreliableGapMs}ms timing gap; .evidence/seen/summary.json`
      }
    }
    catch (error) {
      verdict = 'FAIL'
      reason = error.message
    }
  }
  return { name, command, verdict, reason, seconds: Math.round((Date.now() - started) / 1000) }
})

console.log('\nVerification')
for (const r of results)
  console.log(`${r.verdict}  ${r.name.padEnd(36)} ${String(r.seconds).padStart(5)} s  ${r.command}${r.reason ? ` (${r.reason})` : ''}`)
process.exitCode = results.every(r => ['PASS', 'INCONCLUSIVE'].includes(r.verdict)) ? 0 : 1
