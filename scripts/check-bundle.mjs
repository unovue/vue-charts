import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'
import { build, version as esbuildVersion } from 'esbuild'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
if (args.some(arg => arg !== '--assert-standalone' && !arg.startsWith('--dist=')))
  throw new Error('Usage: node scripts/check-bundle.mjs [--dist=<directory>] [--assert-standalone]')
if (args.filter(arg => arg.startsWith('--dist=')).length > 1)
  throw new Error('Supply --dist only once')
const distArg = args.find(arg => arg.startsWith('--dist='))?.slice(7)
if (distArg === '')
  throw new Error('--dist requires a directory')
const dist = resolve(root, distArg ?? 'packages/vue/dist')
const entry = join(dist, 'es/index.mjs')
await readFile(entry)

const charts = [
  'AreaChart',
  'BarChart',
  'LineChart',
  'ComposedChart',
  'ScatterChart',
  'PieChart',
  'RadarChart',
  'RadialBarChart',
  'FunnelChart',
  'Treemap',
  'Sankey',
  'SunburstChart',
  'Tracker',
  'Heatmap',
  'CohortChart',
  'CalendarHeatmap',
  'JourneySankey',
  'BarList',
  'Sparkline',
]
const standalone = new Set([
  'Tracker',
  'Heatmap',
  'CohortChart',
  'CalendarHeatmap',
  'BarList',
  'Sparkline',
  'JourneySankey',
  'Treemap',
  'Sankey',
  'SunburstChart',
])
const external = ['vue', 'vue/*', 'motion-v', 'motion-v/*']
// Modules only the cartesian engine needs. A standalone chart that keeps one of them pulls in axis code.
const forbidden = /\/core\/axis\/|decimal\.js-light|d3-time-format/
const assertStandalone = args.includes('--assert-standalone')
const evidenceRoot = join(root, '.evidence/bundle')
await mkdir(evidenceRoot, { recursive: true })
const evidence = await mkdtemp(join(evidenceRoot, `${new Date().toISOString().replaceAll(':', '-')}-`))
const source = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' })
if (source.status !== 0)
  throw new Error(`Cannot identify source commit: ${source.stderr}`)
const sourceState = spawnSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' })
if (sourceState.status !== 0)
  throw new Error(`Cannot identify working tree state: ${sourceState.stderr}`)
const files = (await readdir(dist, { recursive: true })).filter(file => file.endsWith('.mjs')).sort()
const hash = createHash('sha256')
for (const file of files) {
  hash.update(`${file}\0`)
  hash.update(await readFile(join(dist, file)))
  hash.update('\0')
}
const report = {
  createdAt: new Date().toISOString(),
  sourceCommit: source.stdout.trim(),
  workingTreeDirty: sourceState.stdout.length > 0,
  dist: relative(root, dist),
  distJavaScriptSha256: hash.digest('hex'),
  distJavaScriptFiles: files.length,
  tools: { node: process.version, esbuild: esbuildVersion },
  settings: { format: 'esm', platform: 'browser', target: 'es2022', minify: true, gzipLevel: 9, external },
  assertStandalone,
  results: [],
  passed: false,
}

try {
  // eslint-disable-next-line no-console -- Compact CLI size table.
  console.log(`${'Chart'.padEnd(20)} ${'Minified B'.padStart(11)} ${'gzip B'.padStart(9)}`)
  for (const chart of charts) {
    const bundle = await build({
      stdin: { contents: `export { ${chart} } from ${JSON.stringify(entry)}`, resolveDir: root, sourcefile: `${chart}.mjs` },
      nodePaths: [join(root, 'packages/vue/node_modules'), join(root, 'node_modules')],
      bundle: true,
      minify: true,
      format: 'esm',
      platform: 'browser',
      target: 'es2022',
      external,
      metafile: true,
      write: false,
      outfile: join(evidence, `${chart}.mjs`),
    })
    const output = bundle.outputFiles[0]
    const modules = Object.values(bundle.metafile.outputs).flatMap(file => Object.entries(file.inputs)
      .filter(([, input]) => input.bytesInOutput > 0)
      .map(([path, input]) => ({ path: path.replaceAll('\\', '/'), bytesInOutput: input.bytesInOutput })))
      .sort((a, b) => a.path.localeCompare(b.path))
    const offendingModules = standalone.has(chart) ? modules.filter(module => forbidden.test(module.path)) : []
    const result = {
      chart,
      standalone: standalone.has(chart),
      minifiedBytes: output.contents.length,
      gzipBytes: gzipSync(output.contents, { level: 9 }).length,
      offendingModules,
      modules,
    }
    report.results.push(result)
    await writeFile(join(evidence, `${chart}.meta.json`), `${JSON.stringify(bundle.metafile, null, 2)}\n`)
    await writeFile(output.path, output.contents)
    // eslint-disable-next-line no-console -- Compact CLI size table.
    console.log(`${chart.padEnd(20)} ${String(result.minifiedBytes).padStart(11)} ${String(result.gzipBytes).padStart(9)}`)
  }
  const offenders = report.results.filter(result => result.offendingModules.length > 0)
  const barList = report.results.find(result => result.chart === 'BarList')
  const oversizedBarList = assertStandalone && barList.gzipBytes > 8947
  if (oversizedBarList)
    console.error(`BarList: ${barList.gzipBytes} gzip bytes exceeds the 8947-byte baseline`)
  report.passed = !assertStandalone || (offenders.length === 0 && !oversizedBarList)
  if (!report.passed) {
    for (const result of offenders) {
      for (const module of result.offendingModules) {
        console.error(`${result.chart}: forbidden retained module ${module.path} (${module.bytesInOutput} B)`)
      }
    }
    process.exitCode = 1
  }
}
finally {
  await writeFile(join(evidence, 'results.json'), `${JSON.stringify(report, null, 2)}\n`)
  // eslint-disable-next-line no-console -- Locate durable evidence for either verdict.
  console.log(`Evidence: ${relative(root, evidence)}/results.json`)
}
