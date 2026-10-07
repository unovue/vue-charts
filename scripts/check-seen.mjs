/* eslint-disable no-console -- CLI verdicts and progress. */
import { spawn, spawnSync } from 'node:child_process'
import { createReadStream } from 'node:fs'
import { mkdir, readdir, stat, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { dirname, extname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { analyzeSeen, installSeenRecorder } from './lib/seen-recorder.mjs'
import { filmstrip } from './lib/seen-filmstrip.mjs'
import { collectSeen } from './lib/seen-capture.mjs'

import { launchBrowser } from './lib/browser.mjs'
import { stopProcess, waitForServer } from './lib/check-process.mjs'
import { seenVerdict } from './lib/check-verdicts.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const evidence = resolve(root, process.argv.find(arg => arg.startsWith('--out='))?.slice(6) ?? '.evidence/seen')

const option = name => process.argv.find(a => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=')
const fixture = process.argv.includes('--fixture')
const only = option('only')
// `--route=/a,/b` checks only these routes.
const routeFilter = option('route')?.split(',')
const widths = option('width') ? [Number(option('width'))] : [1440, 390]
if (only && !['docs', 'landing', 'play'].includes(only))
  throw new Error('Expected --only=docs|landing|play')
if (widths.some(w => !Number.isFinite(w) || w <= 0))
  throw new Error('Expected a positive --width')
if (spawnSync('git', ['check-ignore', join(evidence, 'summary.json')], { cwd: root }).status !== 0)
  throw new Error('Evidence must be git-ignored')
await mkdir(evidence, { recursive: true })
const rows = []
const recordings = []
const errors = []
const servers = []
let browser
let docsBase
let serial = 0

async function htmlFiles(dir) {
  return (await Promise.all((await readdir(dir, { withFileTypes: true })).map(f => f.isDirectory() ? htmlFiles(join(dir, f.name)) : f.name.endsWith('.html') ? [join(dir, f.name)] : []))).flat()
}
async function serve(dir) {
  const mime = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2' }
  const server = createServer(async (req, res) => {
    try {
      const path = resolve(dir, `.${decodeURIComponent(new URL(req.url, 'http://localhost').pathname)}`)
      if (path !== dir && !path.startsWith(`${dir}${sep}`)) {
        res.writeHead(403).end()
        return
      }
      for (const file of [path, `${path}.html`, join(path, 'index.html')]) {
        if ((await stat(file).catch(() => null))?.isFile()) {
          res.writeHead(200, { 'Content-Type': mime[extname(file)] ?? 'application/octet-stream' })
          createReadStream(file).pipe(res)
          return
        }
      }
      res.writeHead(404).end('Not found')
    }
    catch {
      res.writeHead(400).end()
    }
  })
  for (let port = 4690; port <= 4699; port++) {
    try {
      await new Promise((resolve, reject) => {
        server.once('error', reject)
        server.listen(port, '127.0.0.1', () => {
          server.removeListener('error', reject)
          resolve()
        })
      })
      servers.push(async () => {
        server.closeAllConnections()
        await new Promise(resolve => server.close(resolve))
      })
      return `http://127.0.0.1:${port}`
    }
    catch (e) {
      if (e.code !== 'EADDRINUSE')
        throw e
    }
  }
  throw new Error('No free port in 4690–4699')
}
async function servePlay() {
  for (let port = 4690; port <= 4699; port++) {
    let log = ''
    const child = spawn(process.execPath, ['.output/server/index.mjs'], { cwd: join(root, 'playground/nuxt'), env: { ...process.env, PORT: String(port), HOST: '127.0.0.1' }, stdio: ['ignore', 'pipe', 'pipe'] })
    child.stdout.on('data', chunk => log += chunk)
    child.stderr.on('data', chunk => log += chunk)
    const stop = async () => {
      await stopProcess(child)
      await writeFile(join(evidence, `server-${port}.log`), log)
    }
    servers.push(stop)
    const base = `http://127.0.0.1:${port}`
    if (await waitForServer(child, base, 10000, () => log.includes('Listening')))
      return base
    await stop()
  }
  throw new Error('Play server did not become ready on 4690–4699')
}

async function run(base, route, width, tabs = false) {
  const height = width === 390 ? 844 : 900
  const name = `${++serial}-${base.includes('fixture') ? 'fixture' : tabs ? 'tabs' : 'scroll'}-${route.replaceAll('/', '_')}-${width}`
  const video = tabs || route === '/charts/area-chart'
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'no-preference', ...(video ? { recordVideo: { dir: join(evidence, 'videos'), size: { width, height } } } : {}) })
  await context.addInitScript(installSeenRecorder)
  const page = await context.newPage()
  page.on('pageerror', e => errors.push({ page: route, width, error: e.message }))
  let finishRecording
  function recordingLabel(trigger) {
    return `${name}-${trigger.replaceAll(':', '-')}`
  }
  async function startRecording(trigger) {
    finishRecording = await collectSeen(page, join(evidence, `${recordingLabel(trigger)}.json`))
  }
  async function capture(trigger, previousIds = []) {
    const finish = finishRecording
    finishRecording = null
    const { frames, shots } = await finish()
    const label = recordingLabel(trigger)
    const found = analyzeSeen(frames, { page: route, site: fixture ? 'fixture' : tabs || base === docsBase ? 'docs' : 'play', width, height, ...(trigger === 'scroll' ? {} : { trigger }) }).filter(row => !previousIds.includes(row.id))
    if (!found.length)
      throw new Error(`No chart rows recorded for ${route} ${trigger}`)
    const recording = { name: label, page: route, width, frames: frames.length, maximumGapMs: Math.max(0, ...frames.slice(1).map((f, i) => f.t - frames[i].t)), data: `${label}.json` }
    recordings.push(recording)
    for (const [index, row] of found.entries()) {
      if (tabs && index > 0)
        row.trigger = `auto-rotation-during-${trigger}`
      row.recording = label
      await filmstrip(page, row, shots[row.id] ?? [], frames, label, evidence)
      rows.push(row)
      console.log(`${row.site} ${route} ${width} ${row.chart} ${row.trigger}: ${row.reliability === 'unreliable' ? `INCONCLUSIVE (near-seen gap ${row.nearSeenGapMs.toFixed(1)}ms exceeds 50ms)` : row.flags.length ? `FAIL ${row.flags.join(',')}` : 'PASS'} progress=${row.progressAtSeen?.toFixed(3) ?? 'never-seen'} seenMotion=${row.seenMotionMs.toFixed(1)}ms delay=${row.startDelayMs === null ? 'none' : `${row.startDelayMs.toFixed(1)}ms`} strayFrames=${row.strayHoverFrames} gap=${row.maximumGapMs.toFixed(1)}ms ${row.reliability}`)
    }
  }
  try {
    await page.goto(`${base}${route}`, { waitUntil: 'commit' })
    // Entrances begin before every external resource loads; wait for recorded charts.
    try {
      await page.waitForFunction(() => window.seenRecording?.lastFrame?.charts.length > 0)
    }
    catch (error) {
      if (error.name !== 'TimeoutError')
        throw error
      throw new Error(`No chart rows recorded for ${route}: ${error.message}`, { cause: error })
    }
    await page.mouse.move(width - 1, 1)
    if (tabs) {
      await page.getByRole('tab', { name: 'Area', exact: true }).waitFor()
      await page.getByRole('tab', { name: 'Area', exact: true }).evaluate(el => el.closest('figure').scrollIntoView({ block: 'center', behavior: 'instant' }))
      // Begin on another tab so the first Area click is an entrance, not a no-op.
      await page.getByRole('tab', { name: 'Radar', exact: true }).evaluate(el => el.click())
      await page.waitForTimeout(1200)
      for (const tab of ['Area', 'Bar', 'Pie', 'Radar', 'Area']) {
        await page.mouse.move(width - 1, 1)
        let previousIds
        while (!previousIds) {
          previousIds = await page.evaluate((label) => {
            const buttons = [...document.querySelectorAll('[role="tab"]')]
            const target = buttons.find(el => el.textContent.trim() === label)
            if (target.getAttribute('aria-selected') === 'true') {
              buttons.find(el => el.textContent.trim() === (label === 'Area' ? 'Radar' : 'Area')).click()
              return null
            }
            const ids = window.seenReset(`tab:${label}`)
            // Selection check and click share one task, so rotation cannot intervene.
            // DOM click keeps the pointer away throughout the chart entrance.
            target.click()
            return ids
          }, tab)
          if (!previousIds)
            await page.waitForTimeout(700)
        }
        const trigger = `tab:${tab}-${recordings.length}`
        await startRecording(trigger)
        await page.waitForTimeout(2500)
        await capture(trigger, previousIds)
      }
    }
    else {
      await startRecording('scroll')
      await page.evaluate(() => {
        window.seenScrollDone = false
        const paused = new Set()
        let previous = performance.now()
        let pauseUntil = previous + 1200
        let bottomAt = null
        function step(now) {
          for (const chart of window.seenRecording.lastFrame?.charts ?? []) {
            if (chart.visibleRatio >= 0.5 && !paused.has(chart.id)) {
              paused.add(chart.id)
              pauseUntil = now + 1200
            }
          }
          if (now >= pauseUntil)
            scrollBy({ top: (now - previous) * 0.6, behavior: 'instant' })
          previous = now
          const bottom = scrollY + innerHeight >= document.documentElement.scrollHeight - 2
          if (bottom && bottomAt === null)
            bottomAt = now
          if (!bottom)
            bottomAt = null
          if (bottomAt !== null && now - bottomAt >= 2000 && now >= pauseUntil) {
            window.seenScrollDone = true
            return
          }
          requestAnimationFrame(step)
        }
        requestAnimationFrame(step)
      })
      await page.waitForFunction(() => window.seenScrollDone, null, { timeout: 300000 })
      await capture('scroll')
    }
  }
  catch (error) {
    errors.push({ page: route, width, scenario: tabs ? 'tabs' : 'scroll', error: String(error) })
    console.error(`${route} ${width}: ${error}`)
  }
  finally {
    if (finishRecording)
      await finishRecording().catch(error => errors.push({ page: route, width, error: String(error) }))
    if (video) {
      const file = await page.video().path()
      recordings.filter(r => r.name.startsWith(name)).forEach(r => r.video = relative(evidence, file))
    }
    await context.close()
  }
}
try {
  if (!fixture && !process.argv.includes('--skip-build')) {
    for (const filter of ['vccs', ...(only === 'play' ? [] : ['docs']), ...(!only || only === 'play' ? ['play'] : [])]) {
      console.log(`Building ${filter}`)
      const build = spawnSync('pnpm', ['--filter', filter, 'build'], { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
      await writeFile(join(evidence, `build-${filter}.log`), build.stdout + build.stderr)
      if (build.status !== 0)
        throw new Error(`${filter} build exited ${build.status}`)
    }
  }
  browser = await launchBrowser()
  if (fixture) {
    const base = await serve(join(root, 'scripts/fixtures'))
    await run(base, '/seen-motion.html', 1440)
  }
  else {
    if (!only || only !== 'play') {
      const publicDir = join(root, 'docs/.output/public')
      docsBase = await serve(publicDir)
      const routes = (await htmlFiles(publicDir)).map(file => `/${relative(publicDir, file).split(sep).join('/').replace(/(?:^|\/)index\.html$/, '').replace(/\.html$/, '')}`).filter(r => r === '/' || r.startsWith('/charts/')).sort()
      for (const width of widths) {
        if (only !== 'landing') {
          for (const route of routes.filter(r => !routeFilter || routeFilter.includes(r)))
            await run(docsBase, route, width)
        }
        if ((!only || only === 'landing' || only === 'docs') && (!routeFilter || routeFilter.includes('/')))
          await run(docsBase, '/', width, true)
      }
    }
    if (!only || only === 'play') {
      const base = await servePlay()
      // The index is navigation only; every chart example route must still produce rows.
      const routes = (await readdir(join(root, 'playground/nuxt/app/pages')))
        .filter(f => f.endsWith('.vue') && f !== 'index.vue')
        .sort().map(f => `/${f.slice(0, -4)}`)
      for (const width of widths) {
        for (const route of routes.filter(r => !routeFilter || routeFilter.includes(r)))
          await run(base, route, width)
      }
    }
  }
}
catch (e) {
  console.error(e)
  errors.push({ error: String(e) })
}
finally {
  await browser?.close()
  for (const stop of servers.reverse())
    await stop()
  const expected = { a: ['unseen-entrance'], b: ['unseen-entrance'], c: ['no-entrance'], d: ['stray-hover'], e: [], f: ['unseen-entrance'] }
  const fixturePassed = fixture && rows.length === Object.keys(expected).length && Object.entries(expected).every(([chart, flags]) => {
    const row = rows.find(r => r.chart === chart)
    return row && JSON.stringify([...row.flags].sort()) === JSON.stringify([...flags].sort()) && row.reliability === 'reliable'
  })
  const distribution = key => rows.map(r => r[key]).filter(v => v !== null).sort((a, b) => a - b)
  const verdict = seenVerdict(rows, recordings, errors)
  const passed = fixture ? fixturePassed && !errors.length : verdict === 'PASS'
  const acceptable = fixture ? passed : verdict !== 'FAIL'
  const summary = { passed, acceptable, verdict: fixture ? passed ? 'PASS' : 'FAIL' : verdict, fixture, fixturePassed, head: spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).stdout.trim(), thresholds: { visibleRatio: 0.5, effectiveOpacity: 0.95, progressAtSeen: 0.15, seenMotionMs: 400, lateStartMs: 250, unreliableGapMs: 50 }, distributions: { progressAtSeen: distribution('progressAtSeen'), seenMotionMs: distribution('seenMotionMs') }, rows, recordings, errors }
  const escape = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;')
  await writeFile(join(evidence, fixture ? 'fixture-summary.json' : 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`)
  const html = `<!doctype html><meta charset="utf-8"><title>Seen motion evidence</title><style>body{font:14px system-ui;margin:24px;background:#fafafa}article{background:white;border:1px solid #ddd;margin:16px 0;padding:16px}img{width:100%;max-width:1500px}.flag{border-color:#d33}pre{white-space:pre-wrap}</style><h1>Seen motion: ${fixture ? passed ? 'PASS' : 'FAIL' : verdict}</h1><p>${rows.length} chart/trigger rows. ${rows.filter(r => r.flags.length).length} flagged. Filmstrips freeze computed SVG appearance, ancestor opacity and blur; labels give actual sample offsets. Never-seen charts use first half-visible frame as evidence anchor. Raw rAF data and real-time videos are linked below.</p><a href="${fixture ? 'fixture-summary.json' : 'summary.json'}">Summary and full distributions</a>${errors.map(e => `<pre>${escape(JSON.stringify(e))}</pre>`).join('')}${[...rows].sort((a, b) => b.flags.length - a.flags.length).map(r => `<article class="${r.flags.length ? 'flag' : ''}"><h2>${escape(`${r.site} ${r.page} ${r.width} ${r.chart} ${r.trigger}`)}</h2><pre>${escape(JSON.stringify(r, null, 2))}</pre><a href="${r.recording}.json">Frame data</a>${recordings.find(rec => rec.name === r.recording)?.video ? ` · <a href="${recordings.find(rec => rec.name === r.recording).video}">1× video</a>` : ''}<br><img loading="lazy" src="${r.filmstrip}"></article>`).join('')}`
  await writeFile(join(evidence, fixture ? 'fixture-index.html' : 'index.html'), html)
  console.log(`${fixture ? passed ? 'PASS' : 'FAIL' : verdict}: ${rows.length} rows; ${rows.filter(r => r.flags.length).length} flagged; ${rows.filter(r => r.reliability === 'unreliable').length} unreliable; ${errors.length} errors`)
  if (!acceptable)
    process.exitCode = 1
}
