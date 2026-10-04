// Audit the generated site, including lazy demos, without a Nuxt server.
/* eslint-disable no-console -- CLI summaries are the interface. */
import { spawnSync } from 'node:child_process'
import { createReadStream } from 'node:fs'
import { mkdir, readdir, realpath, stat, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { dirname, extname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = join(root, 'docs/.output/public')
const evidence = join(root, '.evidence/breakit/B6/docs')
const require = createRequire(await realpath(join(root, 'packages/vue/node_modules/@nuxt/test-utils/package.json')))
const playwright = require('playwright-core')

const engines = ['chromium', 'firefox', 'webkit']
if (process.argv.includes('--install-browsers')) {
  const install = spawnSync(process.execPath, [join(dirname(require.resolve('playwright-core')), 'cli.js'), 'install', 'chromium-headless-shell', 'firefox', 'webkit'], { stdio: 'inherit' })
  if (install.status !== 0)
    process.exit(install.status ?? 1)
}
if (spawnSync('git', ['check-ignore', '.evidence/breakit/B6/docs/summary.json'], { cwd: root }).status !== 0)
  throw new Error('Evidence must be git-ignored before running this check')
await mkdir(evidence, { recursive: true })

async function htmlFiles(dir) {
  const files = await readdir(dir, { withFileTypes: true })
  return (await Promise.all(files.map(file => file.isDirectory() ? htmlFiles(join(dir, file.name)) : file.name.endsWith('.html') ? [join(dir, file.name)] : []))).flat()
}
async function fileFor(pathname) {
  const decoded = decodeURIComponent(pathname)
  const path = resolve(publicDir, `.${decoded}`)
  if (path !== publicDir && !path.startsWith(`${publicDir}${sep}`))
    return null
  for (const candidate of [path, `${path}.html`, join(path, 'index.html')]) {
    if ((await stat(candidate).catch(() => null))?.isFile())
      return candidate
  }
  return null
}
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.wasm': 'application/wasm' }
const server = createServer(async (req, res) => {
  try {
    const file = await fileFor(new URL(req.url, 'http://localhost').pathname)
    if (!file) {
      res.writeHead(404).end('Not found')
      return
    }
    res.writeHead(200, { 'Content-Type': mime[extname(file)] ?? 'application/octet-stream' })
    if (req.method === 'HEAD')
      res.end()
    else
      createReadStream(file).on('error', () => res.destroy()).pipe(res)
  }
  catch {
    res.writeHead(400).end('Bad request')
  }
})
async function listen() {
  for (let port = 4600; port <= 4699; port++) {
    try {
      await new Promise((resolve, reject) => {
        server.once('error', reject)
        server.listen(port, '127.0.0.1', () => {
          server.removeListener('error', reject)
          resolve()
        })
      })
      return `http://127.0.0.1:${port}`
    }
    catch (error) {
      if (error.code !== 'EADDRINUSE')
        throw error
    }
  }
  throw new Error('No free port in 4600–4699')
}
const results = []
const errors = []
const links = new Map()
const routes = (await htmlFiles(publicDir)).map(file => `/${relative(publicDir, file).split(sep).join('/').replace(/(?:^|\/)index\.html$/, '').replace(/\.html$/, '')}`).sort()
const chartRoutes = routes.filter(route => route.startsWith('/charts/'))
let origin
async function audit(browser, engine, route, mobile) {
  const viewport = mobile ? { width: 375, height: 812 } : { width: 1280, height: 800 }
  const page = await browser.newPage({ viewport })
  const result = { route, browser: engine, viewport, mobile, findings: [], requests: [], demos: [], screenshot: `.evidence/breakit/B6/docs/${engine}/${route === '/' ? 'index' : route.slice(1).replaceAll('/', '__')}${mobile ? '--mobile' : ''}.png` }
  page.on('console', (message) => {
    if (message.type() === 'error' || /hydration/i.test(message.text()))
      result.findings.push({ kind: 'console', type: message.type(), text: message.text() })
  })
  page.on('pageerror', error => result.findings.push({ kind: 'pageerror', text: error.message }))
  page.on('response', (response) => {
    if (new URL(response.url()).origin === origin) {
      result.requests.push({ url: response.url().replace(origin, ''), status: response.status() })
      if (response.status() >= 400)
        result.findings.push({ kind: 'http', text: `${response.status()} ${response.url().replace(origin, '')}` })
    }
  })
  page.on('requestfailed', (request) => {
    if (new URL(request.url()).origin === origin)
      result.findings.push({ kind: 'requestfailed', text: `${request.url().replace(origin, '')}: ${request.failure()?.errorText}` })
  })
  try {
    await page.goto(`${origin}${route}`, { waitUntil: 'networkidle', timeout: 30000 })
    result.heading = await page.locator('h1').first().textContent({ timeout: 5000 }).catch(() => null)
    if (result.heading?.trim() === 'Page not found')
      result.findings.push({ kind: 'render', text: `Nuxt error screen: ${result.heading.trim()}` })
    const demos = page.locator('.chart-demo')
    for (let i = 0; i < await demos.count(); i++) {
      const demo = demos.nth(i)
      await demo.scrollIntoViewIfNeeded()
      try {
        await demo.locator('svg.v-charts-surface').first().waitFor({ state: 'visible', timeout: 10000 })
      }
      catch {
        result.findings.push({ kind: 'demo', text: `Demo ${i + 1}: no visible svg.v-charts-surface; ${(await demo.innerText()).slice(0, 300)}` })
      }
      await page.waitForTimeout(300)
      const surfaces = await demo.locator('svg.v-charts-surface').evaluateAll(nodes => nodes.map((node) => {
        const box = node.getBoundingClientRect()
        return { width: box.width, height: box.height, shapes: node.querySelectorAll('path,rect,circle,polygon,line,text').length }
      }))
      result.demos.push({ index: i + 1, surfaces })
      if (!surfaces.length || surfaces.some(surface => surface.width <= 0 || surface.height <= 0))
        result.findings.push({ kind: 'demo', text: `Demo ${i + 1}: missing or zero-sized surface ${JSON.stringify(surfaces)}` })
    }
    const hrefs = await page.locator('a[href]').evaluateAll(nodes => nodes.map(node => node.href))
    for (const href of new Set(hrefs)) {
      const url = new URL(href)
      if (url.origin !== origin)
        continue
      const key = `${url.pathname}${url.search}`
      if (!links.has(key))
        links.set(key, fetch(`${origin}${key}`, { method: 'HEAD' }).then(response => response.status))
      const status = await links.get(key)
      if (status >= 400)
        result.findings.push({ kind: 'link', text: `${status} ${key}` })
    }
    await page.evaluate(() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' }))
    await page.waitForTimeout(300)
  }
  catch (error) {
    result.findings.push({ kind: 'audit', text: error.message })
  }
  finally {
    try {
      await page.screenshot({ path: join(root, result.screenshot), fullPage: true, timeout: 30000 })
    }
    catch (error) {
      result.findings.push({ kind: 'screenshot', text: error.message })
    }
    await page.close()
  }
  result.passed = !result.findings.length
  results.push(result)
  console.log(`${route.padEnd(40)} ${engine.padEnd(8)} ${mobile ? 'mobile ' : 'desktop'} ${result.passed ? 'PASS' : 'FAIL'} demos=${result.demos.length} findings=${result.findings.length}`)
}
try {
  origin = await listen()
  console.log(`Static site: ${origin}; ${routes.length} HTML routes; ${chartRoutes.length} mobile chart routes`)
  for (const engine of engines) {
    let browser
    try {
      browser = await playwright[engine].launch({ headless: true, timeout: 30000 })
      // Two pages at a time bounds memory while keeping the run practical.
      const jobs = [...routes.map(route => [route, false]), ...chartRoutes.map(route => [route, true])]
      let next = 0
      await Promise.all(Array.from({ length: 2 }, async () => {
        while (next < jobs.length) {
          const [route, mobile] = jobs[next++]
          await audit(browser, engine, route, mobile)
        }
      }))
    }
    catch (error) {
      errors.push({ browser: engine, text: error.stack ?? String(error) })
    }
    finally {
      await browser?.close()
    }
  }
}
finally {
  server.closeAllConnections()
  if (server.listening)
    await new Promise(resolve => server.close(resolve))
  const passed = !errors.length && results.length === engines.length * (routes.length + chartRoutes.length) && results.every(result => result.passed)
  const summary = { passed, node: process.version, playwright: require('playwright-core/package.json').version, routes, chartRoutes, errors, results }
  await writeFile(join(evidence, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`)
  console.log('\nRoute × browser (desktop / mobile)')
  console.table(routes.map(route => Object.fromEntries([['route', route], ...engines.map(engine => [engine, results.filter(result => result.route === route && result.browser === engine).map(result => `${result.mobile ? 'M' : 'D'}:${result.passed ? 'PASS' : `FAIL(${result.findings.length})`}`).join(' / ') || 'NOT RUN'])])))
  console.log(`${passed ? 'PASS' : 'FAIL'}: ${results.length} visits, ${results.filter(result => !result.passed).length} failed, ${errors.length} engine errors. Summary: ${relative(root, join(evidence, 'summary.json'))}`)
  if (!passed)
    process.exitCode = 1
}
