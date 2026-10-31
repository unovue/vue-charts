// Bundles one identical chart with each library in the comparison (benchmark/libraries.mjs), each
// from its own lockfile, and proves each build works in a browser. Writes benchmark/results/latest.json,
// which the comparison site and the docs read. An instrument, never a gate: it needs the network
// and measures other projects' releases. Usage: pnpm compare:libraries [--only=vccs,chartjs].
/* eslint-disable no-console -- the table is the interface */
import { spawnSync } from 'node:child_process'
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'
import vuePlugin from '@vitejs/plugin-vue'
import { build as esbuild, version as esbuildVersion } from 'esbuild'
import { build as viteBuild, version as viteVersion } from 'vite'
import { compileScript, parse } from 'vue/compiler-sfc'
import { libraries, reference } from '../benchmark/libraries.mjs'
import { launchBrowser } from './lib/browser.mjs'
import { animationVerdict, loadedOutputs } from './lib/compare-libraries.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const benchmark = join(root, 'benchmark')
const evidence = join(root, '.evidence/libraries')
const chartsDir = join(benchmark, 'site/src/charts')
const only = process.argv.find(arg => arg.startsWith('--only='))?.slice(7).split(',')
const gzip = text => gzipSync(text, { level: 9 }).length

// The flags from the ticket. Splitting keeps a library's lazy chunks out of the first-load size.
const settings = { bundle: true, minify: true, format: 'esm', target: 'es2020', splitting: true, platform: 'browser', define: { 'process.env.NODE_ENV': '"production"' } }

/** Compiles a Vue SFC for esbuild; the copy in .build means imports resolve from this library's own install. */
const vueSfc = {
  name: 'vue-sfc',
  setup(build) {
    build.onLoad({ filter: /\.vue$/ }, async ({ path }) => {
      const { descriptor, errors } = parse(await readFile(path, 'utf8'), { filename: path })
      if (errors.length)
        throw errors[0]
      return { contents: compileScript(descriptor, { id: 'chart', inlineTemplate: true, isProd: true }).content, loader: 'ts', resolveDir: dirname(path) }
    })
  },
}

const measureEntry = source => `export { default } from './${source}'\n`
function verifyEntry(source, react) {
  return react
    ? `import { createElement, useState } from 'react'
import { createRoot } from 'react-dom/client'
import Chart from './${source}'
import { lineData } from './data.ts'
function App() {
  const [data, setData] = useState(lineData)
  window.__setData = setData
  return createElement(Chart, { data })
}
window.__mount = () => createRoot(document.getElementById('app')).render(createElement(App))
`
    : `import { createApp, h, shallowRef } from 'vue'
import Chart from './${source}'
import { lineData } from './data.ts'
const data = shallowRef(lineData)
window.__setData = value => { data.value = value }
window.__mount = () => createApp({ render: () => h(Chart, { data: data.value, dark: false }) }).mount('#app')
`
}

async function runEsbuild(dir, entry, name, external) {
  const outdir = join(dir, 'out', name)
  // tsconfigRaw: the repo's tsconfig sets Vue's JSX, which must not reach the React reference build.
  const result = await esbuild({ ...settings, entryPoints: [join(dir, entry)], outdir, external, plugins: [vueSfc], metafile: true, write: true, logLevel: 'silent', jsx: 'automatic', jsxImportSource: 'react', tsconfigRaw: '{}', absWorkingDir: dir })
  return { outdir, metafile: result.metafile }
}

async function measureEsbuild(dir, external) {
  const { metafile } = await runEsbuild(dir, 'measure.js', 'measure', external)
  const loaded = loadedOutputs(metafile, 'measure.js')
  const size = { minBytes: 0, gzipBytes: 0 }
  for (const file of loaded) {
    const bytes = await readFile(join(dir, file))
    size.minBytes += bytes.length
    size.gzipBytes += gzip(bytes)
  }
  return size
}

async function measureVite(dir, external) {
  const result = await viteBuild({
    root: dir,
    configFile: false,
    logLevel: 'silent',
    plugins: [vuePlugin()],
    define: { 'process.env.NODE_ENV': '"production"' },
    build: { write: false, minify: true, target: 'es2020', lib: { entry: join(dir, 'measure.js'), formats: ['es'], fileName: 'measure' }, rollupOptions: { external } },
  })
  const { output } = Array.isArray(result) ? result[0] : result
  const entry = output.find(file => file.type === 'chunk' && file.isEntry)
  const loaded = new Set([entry.fileName])
  for (const name of loaded) {
    for (const dep of output.find(file => file.fileName === name)?.imports ?? [])
      loaded.add(dep)
  }
  let gzipBytes = 0
  for (const file of output) {
    if (loaded.has(file.fileName) || (file.type === 'asset' && file.fileName.endsWith('.css')))
      gzipBytes += gzip(file.type === 'chunk' ? file.code : file.source)
  }
  return { gzipBytes }
}

/** Loads the built chart in a real page; only pixels count, because libraries animate by attributes, CSS or Web Animations. */
async function verify(browser, dir, outdir, id) {
  const page = await browser.newPage({ viewport: { width: 760, height: 420 } })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  const host = 'http://bench.test/'
  await page.route(`${host}**`, async (route) => {
    const path = new URL(route.request().url()).pathname
    if (path === '/') {
      const css = await readFile(join(outdir, 'verify.css'), 'utf8').catch(() => '')
      return route.fulfill({ contentType: 'text/html', body: `<!doctype html><meta charset="utf-8"><style>body{margin:16px;font:12px sans-serif}${css}</style><div id="app" style="width:720px"></div><script type="module" src="/verify.js"></script>` })
    }
    return route.fulfill({ contentType: 'text/javascript', body: await readFile(join(outdir, path)) }).catch(() => route.abort())
  })
  await page.goto(host, { waitUntil: 'load' })
  const blank = await page.screenshot()
  const frames = async (action) => {
    const seen = new Set()
    await action()
    const end = Date.now() + 1500
    while (Date.now() < end)
      seen.add((await page.screenshot()).toString('base64'))
    return seen.size
  }
  const enterFrames = await frames(() => page.evaluate(() => { window.__mount() }))
  await page.waitForTimeout(1500)
  const settled = await page.screenshot()
  const updateFrames = await frames(() => page.evaluate(() => { window.__setData(window.__next) }))
  await page.waitForTimeout(800)
  await page.mouse.move(380, 180)
  await page.mouse.move(420, 180)
  await page.waitForTimeout(600)
  const hovered = await page.screenshot({ path: join(evidence, `${id}-hover.png`) })
  await page.close()
  return { rendered: !settled.equals(blank), hover: !hovered.equals(settled), enterFrames, updateFrames, errors }
}

function install(dir) {
  const result = spawnSync('pnpm', ['install', '--ignore-workspace', '--frozen-lockfile', '--silent'], { cwd: dir, encoding: 'utf8' })
  if (result.status !== 0)
    throw new Error(`pnpm install failed in ${dir}: ${result.stderr || result.stdout}`)
}

await mkdir(evidence, { recursive: true })
const browser = await launchBrowser()
const lineSource = join(chartsDir, 'line')
const nextRows = Array.from({ length: 12 }, (_, index) => ({ month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][index], desktop: 320 - index * 15, mobile: 90 + index * 14, tablet: 60 + (index % 3) * 30 }))
const rows = []
const failures = []
for (const library of [...libraries, reference]) {
  if (only && !only.includes(library.id))
    continue
  const dir = join(benchmark, 'bundles', library.id)
  install(dir)
  const manifest = JSON.parse(await readFile(join(dir, 'package.json'), 'utf8'))
  for (const build of library.builds) {
    const label = `${library.id}/${build.id}`
    const react = build.framework === 'react'
    const work = join(dir, '.build', build.id)
    await rm(work, { recursive: true, force: true })
    await mkdir(work, { recursive: true })
    await cp(join(lineSource, 'data.ts'), join(work, 'data.ts'))
    const source = build.source ?? `${library.id}.vue`
    await cp(build.source ? join(dir, build.source) : join(lineSource, source), join(work, source))
    await writeFile(join(work, 'measure.js'), measureEntry(source))
    await writeFile(join(work, 'verify.js'), verifyEntry(source, react))
    const external = react ? ['react', 'react-dom', 'react/jsx-runtime', 'react-is'] : ['vue', ...(build.external ?? [])]
    const size = await measureEsbuild(work, external)
    const vite = react ? null : await measureVite(work, external)
    const { outdir } = await runEsbuild(work, 'verify.js', 'verify', [])
    await writeFile(join(outdir, 'verify.js'), `window.__next = (${JSON.stringify(nextRows)});\n${await readFile(join(outdir, 'verify.js'), 'utf8')}`)
    const render = await verify(browser, work, outdir, `${library.id}-${build.id}`)
    const omits = build.omits ?? library.omits
    const animation = animationVerdict(render, omits.includes('animation'))
    const problems = [
      ...render.errors.map(text => `page error: ${text}`),
      ...(render.rendered ? [] : ['nothing rendered']),
      ...(render.hover ? [] : ['hover changed nothing']),
      ...(animation.ok ? [] : [animation.message]),
    ]
    failures.push(...problems.map(text => `${label}: ${text}`))
    const versions = Object.fromEntries(Object.entries(manifest.dependencies).filter(([name]) => name !== 'vue'))
    rows.push({ library: library.id, build: build.id, reference: Boolean(build.reference), label: build.label, versions, ...size, viteGzipBytes: vite?.gzipBytes ?? null, animated: animation.animated, enterFrames: render.enterFrames, updateFrames: render.updateFrames, rendered: render.rendered, hover: render.hover, omits })
    console.log(`${label.padEnd(30)} ${(size.gzipBytes / 1024).toFixed(1).padStart(7)} KB gzip  vite ${vite ? (vite.gzipBytes / 1024).toFixed(1).padStart(7) : '      –'}  frames ${render.enterFrames}/${render.updateFrames}  ${problems.length ? `FAIL ${problems.join('; ')}` : 'ok'}`)
  }
}
await browser.close()

if (failures.length) {
  console.error(`\n${failures.length} problem(s); results not written:\n${failures.join('\n')}`)
  process.exit(1)
}
if (only) {
  console.log('\n--only run; results not written.')
  process.exit(0)
}
const results = {
  updatedAt: new Date().toISOString().slice(0, 10),
  settings: { esbuild: esbuildVersion, vite: viteVersion, format: settings.format, target: settings.target, minify: settings.minify, gzipLevel: 9, external: 'vue (react for Recharts)', counts: 'first-load JavaScript and CSS; lazy chunks excluded' },
  builds: rows,
}
await writeFile(join(benchmark, 'results/latest.json'), `${JSON.stringify(results, null, 2)}\n`)
console.log('\nWrote benchmark/results/latest.json')
