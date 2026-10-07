// Compares this branch with the upstream release vccs 0.6.0 (upstream main f8c27e7): bundle sizes,
// runtime dependencies, and production and spec line counts. Writes .evidence/upstream/summary.json.
// Usage: pnpm compare:upstream (needs network access for the first npm install).
/* eslint-disable no-console -- the comparison table is the interface */
import { spawnSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { measureBundles, settings } from './check-bundle.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const upstream = { version: '0.6.0', commit: 'f8c27e7' }
const evidence = join(root, '.evidence/upstream')
const install = join(evidence, 'install')

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, ...options })
  if (result.status !== 0)
    throw new Error(`${command} ${args.join(' ')} failed: ${result.stderr}`)
  return result.stdout
}

if (spawnSync('git', ['check-ignore', '-q', evidence], { cwd: root }).status !== 0)
  throw new Error('.evidence/ must be git-ignored')

// The published package with the dependencies a user installs today. Peers (Vue, motion-v) stay
// external in the measurement, as in check-bundle.
await mkdir(install, { recursive: true })
await writeFile(join(install, 'package.json'), '{ "private": true }\n')
run('npm', ['install', `vccs@${upstream.version}`, '--no-audit', '--no-fund', '--ignore-scripts', '--legacy-peer-deps', '--no-package-lock'], { cwd: install })
const upstreamDist = join(install, 'node_modules/vccs/dist')
const head = run('git', ['rev-parse', '--short', 'HEAD']).trim()
console.log(`Comparing vccs ${upstream.version} (${upstream.commit}) with HEAD ${head}`)
run('pnpm', ['--filter', 'vccs', 'build'])

const [before, after] = await Promise.all([measureBundles(upstreamDist), measureBundles(join(root, 'packages/vue/dist'))])
const bundles = after.map((row, index) => {
  const old = before[index]
  return {
    name: row.name,
    kind: row.kind,
    beforeGzip: old.missing ? null : old.gzipBytes,
    afterGzip: row.missing ? null : row.gzipBytes,
    changePercent: old.missing || row.missing ? null : Math.round((row.gzipBytes / old.gzipBytes - 1) * 1000) / 10,
  }
})

const upstreamPackage = JSON.parse(await readFile(join(install, 'node_modules/vccs/package.json'), 'utf8'))
const headPackage = JSON.parse(await readFile(join(root, 'packages/vue/package.json'), 'utf8'))
const names = manifest => Object.keys(manifest.dependencies ?? {}).sort()
const dependencies = {
  before: names(upstreamPackage),
  after: names(headPackage),
  removed: names(upstreamPackage).filter(name => !headPackage.dependencies?.[name]),
  added: names(headPackage).filter(name => !upstreamPackage.dependencies?.[name]),
  peersBefore: upstreamPackage.peerDependencies,
  peersAfter: headPackage.peerDependencies,
}

/** Lines in the library source at a commit: production code, and tests (specs, test helpers, type probes). */
function lineCounts(commit) {
  const files = run('git', ['ls-tree', '-r', '--name-only', commit, '--', 'packages/vue/src']).split('\n')
    .filter(file => /\.(?:ts|tsx|vue)$/.test(file) && !/(?:^|\/)(?:__stories__|storybook)\//.test(file) && !file.endsWith('.d.ts'))
  const count = { production: { files: 0, lines: 0 }, tests: { files: 0, lines: 0 } }
  for (const file of files) {
    const kind = /(?:^|\/)(?:__tests__|test)\/|\.(?:spec|test)\./.test(file) ? 'tests' : 'production'
    count[kind].files++
    count[kind].lines += run('git', ['show', `${commit}:${file}`]).split('\n').length - 1
  }
  return count
}
const lines = { before: lineCounts(upstream.commit), after: lineCounts('HEAD') }

const summary = { createdAt: new Date().toISOString(), upstream, head, settings, bundles, dependencies, lines }
await writeFile(join(evidence, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`)

const cell = value => value == null ? '–' : String(value)
console.log(`\n${'Bundle (gzip B)'.padEnd(24)} ${upstream.version.padStart(9)} ${'HEAD'.padStart(9)} ${'change'.padStart(8)}`)
for (const row of bundles)
  console.log(`${row.name.padEnd(24)} ${cell(row.beforeGzip).padStart(9)} ${cell(row.afterGzip).padStart(9)} ${(row.changePercent == null ? '–' : `${row.changePercent > 0 ? '+' : ''}${row.changePercent} %`).padStart(8)}`)
console.log(`\nRuntime dependencies removed: ${dependencies.removed.join(', ') || 'none'}`)
console.log(`Runtime dependencies added: ${dependencies.added.join(', ') || 'none'}`)
console.log(`Peers: ${JSON.stringify(dependencies.peersBefore)} → ${JSON.stringify(dependencies.peersAfter)}`)
for (const kind of ['production', 'tests'])
  console.log(`${kind} lines: ${lines.before[kind].lines} in ${lines.before[kind].files} files → ${lines.after[kind].lines} in ${lines.after[kind].files} files`)
console.log(`\nSummary: ${join('.evidence/upstream', 'summary.json')}`)
