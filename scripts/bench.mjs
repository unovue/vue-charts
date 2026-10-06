/* eslint-disable no-console, antfu/consistent-list-newline -- Compact CLI options and table output. */
import { createHash } from 'node:crypto'
import { mkdir, readFile, readdir, realpath, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build, version as esbuildVersion } from 'esbuild'

const root = fileURLToPath(new URL('../', import.meta.url))
const option = name => process.argv.find(arg => arg.startsWith(`--${name}=`))?.slice(name.length + 3)
const dist = resolve(root, option('dist') ?? 'packages/vue/dist')
const compare = option('compare') && resolve(root, option('compare'))
const rounds = Number(option('rounds') ?? 21)
const selfTest = process.argv.includes('--self-test')
if (!Number.isInteger(rounds) || rounds < 1 || rounds > 21 || (selfTest && !compare))
  throw new Error('Use --rounds=1..21; --self-test requires --compare')
const fixture = join(root, 'scripts/fixtures/bench.mjs')
const output = join(root, '.evidence/bench', `${new Date().toISOString().replaceAll(':', '-')}-${process.pid}`)
const peers = join(root, 'packages/vue/node_modules')
const libraryRequire = createRequire(join(root, 'packages/vue/package.json'))
const require = createRequire(await realpath(join(peers, '@nuxt/test-utils/package.json')))
const { chromium } = require('playwright-core')

const sides = compare ? ['A', 'B'] : ['B']
const cases = ['LineChart', 'BarChart'].flatMap(kind => [100, 1000, 10000].map(n => ({ kind, n, mode: 'static' })))
cases.push({ kind: 'Heatmap', n: 168, mode: 'static' }, { kind: 'CalendarHeatmap', n: 365, mode: 'static' })
cases.push(...['LineChart', 'BarChart'].map(kind => ({ kind, n: 1000, mode: 'animated' })))
const result = { rounds, selfTest, dist, compare, warmups: [], runs: [], summary: [], errors: [], references: {} }
const calibration = new Map()
let browser, page, session, server
async function bundle() {
  const source = await readFile(fixture, 'utf8')
  for (const side of sides) {
    const directory = side === 'A' ? compare : dist
    const hash = createHash('sha256')
    for (const file of (await readdir(directory, { recursive: true })).filter(f => f.endsWith('.mjs')).sort())
      hash.update(file).update(await readFile(join(directory, file)))
    result.references[side] = hash.digest('hex')
    const library = side === 'B' && result.references.A === result.references.B ? compare : directory
    const entry = JSON.stringify(join(library, 'es/index.mjs'))
    const body = source.replace(/'#bench-library'/, entry)
    await writeFile(join(output, `${side}.mjs`), `${body}\nwindow.benches.${side} = window.vccsBench`)
  }
  await build({
    entryPoints: sides.map(side => join(output, `${side}.mjs`)), nodePaths: [peers], outdir: output,
    bundle: true, minify: true, format: 'esm', splitting: true, platform: 'browser', target: 'es2022',
    alias: {
      '#bench-verdict': join(root, 'scripts/lib/benchmark-verdict.mjs'),
      '#bench-motion': join(root, 'scripts/lib/benchmark-motion.mjs'),
      'vue': libraryRequire.resolve('vue').replace('/index.js', '/dist/vue.runtime.esm-bundler.js'),
      'motion-v': join(await realpath(join(peers, 'motion-v')), 'dist/es/index.mjs'),
    },
    define: {
      'process.env.NODE_ENV': '"production"', '__VUE_OPTIONS_API__': 'true',
      '__VUE_PROD_DEVTOOLS__': 'false', '__VUE_PROD_HYDRATION_MISMATCH_DETAILS__': 'false',
    },
  })
}
async function openBrowser() {
  const scripts = sides.map(side => `<script type="module" src="/${side}.js"></script>`).join('')
  const routes = { '/': `<div id="app"></div><script>window.benches = {}</script>${scripts}` }
  for (const file of (await readdir(output)).filter(f => f.endsWith('.js')))
    routes[`/${file}`] = await readFile(join(output, file))
  server = createServer((req, res) => {
    res.setHeader('Content-Type', req.url === '/' ? 'text/html' : 'text/javascript')
    res.writeHead(routes[req.url] ? 200 : 404).end(routes[req.url])
  })
  const port = Number(process.env.BENCH_PORT ?? 4600)
  if (port < 4600 || port > 4699)
    throw new Error('BENCH_PORT must be in 4600–4699')
  await new Promise((resolve, reject) => server.once('error', reject).listen(port, '127.0.0.1', resolve))
  const executablePath = process.env.MOTION_EXECUTABLE_PATH
  browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) })
  page = await browser.newPage({ viewport: { width: 1100, height: 700 }, reducedMotion: 'no-preference' })
  page.on('pageerror', error => result.errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error' || message.text().includes('[Vue warn]'))
      result.errors.push(message.text())
  })
  await page.goto(`http://127.0.0.1:${server.address().port}/`)
  session = await page.context().newCDPSession(page)
  await session.send('Performance.enable')
  result.browser = await browser.version()
}
async function measure(side, entry, inject = false) {
  await page.evaluate(({ side, inject, cpuFrame }) => {
    window.vccsBench = window.benches[side]
    window.vccsBench.configure(inject, cpuFrame)
  }, { side, inject, cpuFrame: calibration.get(`${side}:${entry.kind}`) ?? 0 })
  if (entry.mode === 'static')
    return page.evaluate(e => window.vccsBench.static(e.kind, e.n), entry)
  await page.evaluate(e => window.vccsBench.prepareAnimated(e.kind, e.n), entry)
  const cpu = async () => (await session.send('Performance.getMetrics')).metrics
    .find(m => m.name === 'TaskDuration').value
  try {
    const before = await cpu()
    const row = await page.evaluate(e => window.vccsBench.animatedUpdate(e.kind, e.n), entry)
    const cpuMs = ((await cpu()) - before) * 1000
    const validation = await page.evaluate(e => window.vccsBench.validateAnimated(e.kind, e.n), entry)
    if (!row.frames || !Number.isFinite(cpuMs) || cpuMs <= 0)
      throw new Error('Invalid animated metrics')
    return { ...row, ...validation, cpuMs, cpuMsPerFrame: cpuMs / row.frames }
  }
  finally { await page.evaluate(() => window.vccsBench.endAnimated()) }
}
async function sample() {
  const workloads = cases.flatMap(entry => sides.map(side => ({ side, entry })))
  for (const { side, entry } of workloads) {
    const row = await measure(side, entry)
    result.warmups.push({ side, ...entry, ...row })
    if (entry.mode === 'animated')
      calibration.set(`${side}:${entry.kind}`, row.cpuMsPerFrame)
  }
  for (let round = 0; round < rounds; round++) {
    const offset = (round % cases.length) * sides.length
    const order = [...workloads.slice(offset), ...workloads.slice(0, offset)]
    for (const { side, entry } of round % 2 ? order.reverse() : order)
      result.runs.push({ round, side, ...entry, ...await measure(side, entry, selfTest && side === 'B') })
    console.log(`Round ${round + 1}/${rounds} complete`)
  }
  result.sameBuild = !selfTest && result.references.A === result.references.B
  result.summary = await page.evaluate(input => window.vccsBench.summarize(input), {
    runs: result.runs, cases, compare: !!compare, sameBuild: result.sameBuild,
  })
}
try {
  await mkdir(output, { recursive: true })
  const playwright = require('playwright-core/package.json').version
  result.tools = { node: process.version, esbuild: esbuildVersion, playwright }
  await bundle()
  await openBrowser()
  await sample()
  Object.assign(result, await page.evaluate(r => window.vccsBench.verdict(r), result))
  console.table(result.summary)
  console.log(result.inconclusive ? 'INCONCLUSIVE: paired timing spread crosses a gate boundary; inspect intervals' : result.passed ? 'PASS' : 'FAIL')
  process.exitCode = result.acceptable ? 0 : 1
}
catch (error) { result.errors.push(error.stack ?? String(error)); process.exitCode = 1 }
finally {
  await browser?.close()
  if (server?.listening)
    await new Promise(resolve => server.close(resolve))
  await writeFile(join(output, 'results.json'), `${JSON.stringify(result, null, 2)}\n`)
  console.log(`Evidence: ${relative(root, output)}/results.json`)
}
