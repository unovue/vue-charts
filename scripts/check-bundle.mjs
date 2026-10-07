// Measures what a user's bundler keeps for each chart (esbuild, minified, gzip level 9, Vue and
// motion-v external) and, with --assert-standalone, proves that standalone charts leave the
// cartesian engine out. scripts/compare-upstream.mjs reuses measureBundles() for vccs 0.6.0.
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { gzipSync } from 'node:zlib'
import { build, version as esbuildVersion } from 'esbuild'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
// One chart list for size budgets and this check: size-limit owns the budgets.
const { charts, presets } = await import(pathToFileURL(join(root, 'packages/vue/.size-limit.mjs')).href)
const external = ['vue', 'vue/*', 'motion-v', 'motion-v/*']
// Modules only the cartesian engine needs. A standalone chart that keeps one of them pulls in axis code.
const forbidden = /\/core\/axis\/|decimal\.js-light|d3-time-format/
export const settings = { format: 'esm', platform: 'browser', target: 'es2022', minify: true, gzipLevel: 9, external }

async function bundle(contents, name, resolveDir) {
  const result = await build({
    stdin: { contents, resolveDir, sourcefile: `${name}.mjs` },
    nodePaths: [join(root, 'packages/vue/node_modules'), join(root, 'node_modules')],
    bundle: true,
    minify: true,
    format: 'esm',
    platform: 'browser',
    target: 'es2022',
    external,
    metafile: true,
    write: false,
    outfile: `${name}.mjs`,
    logLevel: 'silent',
  })
  const output = result.outputFiles[0]
  const modules = Object.values(result.metafile.outputs).flatMap(file => Object.entries(file.inputs)
    .filter(([, input]) => input.bytesInOutput > 0)
    .map(([path, input]) => ({ path: path.replaceAll('\\', '/'), bytesInOutput: input.bytesInOutput })))
    .sort((a, b) => a.path.localeCompare(b.path))
  return { contents: output.contents, metafile: result.metafile, modules }
}

/**
 * Measures the size presets, every chart export and the whole entry (`export *`) of a built
 * library. Rows whose exports the entry does not have (charts added after that release) are
 * returned with `missing: true` and no sizes.
 */
export async function measureBundles(dist) {
  const entry = join(dist, 'es/index.mjs')
  const exported = new Set(Object.values((await bundle(`export * from ${JSON.stringify(entry)}`, 'exports', root)).metafile.outputs)[0].exports)
  const rows = [
    ...presets.map(row => ({ name: row.name, kind: 'preset', names: row.import.replace(/[{}\s]/g, '').split(',') })),
    ...charts.map(row => ({ name: row.name, kind: 'chart', names: [row.name], standalone: !!row.standalone })),
    { name: 'Everything (export *)', kind: 'all', names: null },
  ]
  const results = []
  for (const row of rows) {
    if (row.names && row.names.some(name => !exported.has(name))) {
      results.push({ ...row, missing: true })
      continue
    }
    const contents = row.names ? `export { ${row.names.join(', ')} } from ${JSON.stringify(entry)}` : `export * from ${JSON.stringify(entry)}`
    const output = await bundle(contents, row.name.replace(/\W+/g, '-'), root)
    results.push({
      ...row,
      minifiedBytes: output.contents.length,
      gzipBytes: gzipSync(output.contents, { level: 9 }).length,
      offendingModules: row.standalone ? output.modules.filter(module => forbidden.test(module.path)) : [],
      modules: output.modules,
      bundle: output,
    })
  }
  return results
}

async function main() {
  const args = process.argv.slice(2)
  if (args.some(arg => arg !== '--assert-standalone' && !arg.startsWith('--dist=')))
    throw new Error('Usage: node scripts/check-bundle.mjs [--dist=<directory>] [--assert-standalone]')
  if (args.filter(arg => arg.startsWith('--dist=')).length > 1)
    throw new Error('Supply --dist only once')
  const distArg = args.find(arg => arg.startsWith('--dist='))?.slice(7)
  if (distArg === '')
    throw new Error('--dist requires a directory')
  const dist = resolve(root, distArg ?? 'packages/vue/dist')
  const assertStandalone = args.includes('--assert-standalone')
  const evidenceRoot = join(root, '.evidence/bundle')
  await mkdir(evidenceRoot, { recursive: true })
  const evidence = await mkdtemp(join(evidenceRoot, `${new Date().toISOString().replaceAll(':', '-')}-`))
  const source = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' })
  const sourceState = spawnSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' })
  if (source.status !== 0 || sourceState.status !== 0)
    throw new Error(`Cannot identify the source commit: ${source.stderr}${sourceState.stderr}`)
  const files = (await readdir(dist, { recursive: true })).filter(file => file.endsWith('.mjs')).sort()
  const hash = createHash('sha256')
  for (const file of files)
    hash.update(`${file}\0`).update(await readFile(join(dist, file))).update('\0')
  const report = {
    createdAt: new Date().toISOString(),
    sourceCommit: source.stdout.trim(),
    workingTreeDirty: sourceState.stdout.length > 0,
    dist: relative(root, dist),
    distJavaScriptSha256: hash.digest('hex'),
    distJavaScriptFiles: files.length,
    tools: { node: process.version, esbuild: esbuildVersion },
    settings,
    assertStandalone,
    results: [],
    passed: false,
  }
  try {
    const results = await measureBundles(dist)
    // eslint-disable-next-line no-console -- Compact CLI size table.
    console.log(`${'Bundle'.padEnd(24)} ${'Minified B'.padStart(11)} ${'gzip B'.padStart(9)}`)
    for (const { bundle, ...result } of results) {
      report.results.push(result)
      if (result.missing)
        continue
      await writeFile(join(evidence, `${result.name.replace(/\W+/g, '-')}.meta.json`), `${JSON.stringify(bundle.metafile, null, 2)}\n`)
      // eslint-disable-next-line no-console -- Compact CLI size table.
      console.log(`${result.name.padEnd(24)} ${String(result.minifiedBytes).padStart(11)} ${String(result.gzipBytes).padStart(9)}`)
    }
    const missing = report.results.filter(result => result.missing)
    const offenders = report.results.filter(result => result.offendingModules?.length)
    report.passed = !assertStandalone || (offenders.length === 0 && missing.length === 0)
    if (!report.passed) {
      for (const result of missing)
        console.error(`${result.name}: the entry does not export ${result.names.join(', ')}`)
      for (const result of offenders) {
        for (const module of result.offendingModules)
          console.error(`${result.name}: forbidden retained module ${module.path} (${module.bytesInOutput} B)`)
      }
      process.exitCode = 1
    }
  }
  finally {
    await writeFile(join(evidence, 'results.json'), `${JSON.stringify(report, null, 2)}\n`)
    // eslint-disable-next-line no-console -- Locate durable evidence for either verdict.
    console.log(`Evidence: ${relative(root, evidence)}/results.json`)
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url))
  await main()
