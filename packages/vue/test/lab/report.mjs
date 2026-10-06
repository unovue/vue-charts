// Motion report: frame-exact videos (1x and 4x slow motion) of every transition, each
// moving shape's progress against the ideal easing, and real-clock frame timing at normal speed
// and with the CPU slowed 4x. Writes an HTML report.
// pnpm motion:report [scenario...] [--steps=a,b] [--out=dir] [--no-throttle] [--prod] [--browser=…] [--check]
// --check gates geometry and page errors; --strict-timing also gates real-clock slow frames.
/* eslint-disable no-console -- command-line output is the interface of these tools */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { motionTokens } from '../../src/animation/motion.ts'
import { checkReport, curves, flags } from './report-metrics.mjs'
import { installHTMLGeometry } from './html-geometry.mjs'
import { FRAME, advanceFrame, flag, has, launchBrowser, positional, repo, settle, startServer } from './shared.mjs'

const out = resolve(flag('out', join(repo, '.evidence/motion-report')))
const accepted = JSON.parse(readFileSync(new URL('./accepted-flags.json', import.meta.url), 'utf8'))
const only = flag('steps', '')
const throttle = !has('no-throttle')
const WINDOW = 900
const all = ['bar', 'barStacked', 'barHorizontal', 'barNegative', 'line', 'lineMonotone', 'area', 'areaStacked', 'composed', 'scatter', 'pie', 'donut', 'radar', 'radial', 'funnel', 'treemap', 'sankey', 'journey', 'tracker', 'calendar', 'heatmap', 'cohort', 'sparkline', 'barList', 'sunburst', 'tooltip', 'resize', 'barMany', 'lineMany']
const scenarios = positional()
if (scenarios.some(s => !all.includes(s)))
  throw new Error('Unknown motion scenario')
const evidence = realpathSync(join(repo, '.evidence'))
function assertContained(parent, path) {
  const child = relative(parent, path)
  if (!child || child === '..' || child.startsWith(`..${sep}`) || isAbsolute(child))
    throw new Error('Motion output must be contained in .evidence/')
}
assertContained(evidence, out)
let parent = out
while (!existsSync(parent))
  parent = dirname(parent)
if (realpathSync(parent) !== evidence)
  assertContained(evidence, realpathSync(parent))
mkdirSync(out, { recursive: true })
assertContained(evidence, realpathSync(out))

const ideal = {
  update: t => motionTokens.update.ease(Math.min(1, t / (motionTokens.update.duration * 1000))),
  enter: t => motionTokens.enter.ease(Math.min(1, t / (motionTokens.enter.duration * 1000))),
}

let server
let browser
let url

// In-page per-frame sampler: SVG attributes and HTML widths resolved against layout.
function SAMPLER() {
  // Effective opacity: a shape fading through under 35 % is on its way in or out, and a fully
  // transparent hit area is never seen; neither counts as a visible jump or overlap.
  const inkOf = (el) => {
    let ink = 1
    for (let n = el; n && n.tagName !== 'svg'; n = n.parentElement)
      ink *= Number(getComputedStyle(n).opacity)
    return ink
  }
  const faint = el => inkOf(el) < 0.35 ? '|~faint' : ''
  window.__snapshot = () => {
    const keyOf = (el) => {
      const parts = []
      for (let n = el; n && n.tagName !== 'svg'; n = n.parentElement) {
        if (n.__vnode?.key != null)
          parts.push(String(n.__vnode.key))
        for (let c = n.__vueParentComponent; c && c.subTree?.el === n; c = c.parent) {
          if (c.vnode.key != null)
            parts.push(String(c.vnode.key))
        }
        const cls = n.getAttribute?.('class') || ''
        const m = cls.match(/v-charts-(bar|line|area|pie|radar|radial-bar|funnel|scatter)(?![-\w])/)
        if (m)
          parts.push(`${m[1]}${[...document.querySelectorAll(`.v-charts-${m[1]}`)].indexOf(n)}`)
      }
      return parts.reverse().join('/')
    }
    const shapes = {}
    const counts = {}
    const svgs = [...document.querySelectorAll('svg.v-charts-surface')]
    for (const el of svgs.flatMap(svg => [...svg.querySelectorAll('rect,path,circle,polygon')])) {
      if (el.closest('defs, clipPath, .v-charts-cartesian-axis, .v-charts-cartesian-grid, .v-charts-polar-grid, .v-charts-polar-angle-axis, .v-charts-polar-radius-axis, .v-charts-legend-wrapper, .v-charts-tooltip-cursor'))
        continue
      if (el.getAttribute('fill') === 'transparent')
        continue
      const cls = (el.getAttribute('class') || '').split(' ')[0]
      const surface = svgs.indexOf(el.ownerSVGElement)
      const prefix = surface > 0 ? `svg${surface}/` : ''
      const base = `${prefix}${el.tagName}.${cls}#${keyOf(el)}`
      counts[base] = (counts[base] ?? 0) + 1
      shapes[`${base}@${counts[base]}`] = ['d', 'x', 'y', 'width', 'height', 'cx', 'cy', 'r', 'transform', 'points', 'stroke-width'].map(a => el.getAttribute(a) ?? '').join('|') + faint(el)
    }
    for (const [id, attrs] of Object.entries(window.__htmlGeometry()))
      shapes[id] = [attrs.transform ?? '', attrs.width ?? '', attrs.height ?? ''].join('|')
    const tip = document.querySelector('[role="tooltip"]')
    if (tip && tip.style.visibility === 'visible')
      shapes.tooltip = tip.style.transform
    return shapes
  }
  // The largest area (px²) two bars or cells cover at once; touching shapes do not count.
  window.__overlap = () => {
    const elements = [...document.querySelectorAll('svg.v-charts-surface .v-charts-bar-rectangle :is(path, rect), svg.v-charts-surface .v-charts-cell-rect, svg.v-charts-surface .v-charts-journey-node-continue, svg.v-charts-surface .v-charts-journey-node-exit')]
    let worst = 0
    for (const svg of document.querySelectorAll('svg.v-charts-surface')) {
      const boxes = elements.filter(el => el.ownerSVGElement === svg && inkOf(el) >= 0.35)
        .map(el => ['x', 'y', 'width', 'height'].map(a => Number(el.getAttribute(a))))
        .filter(([x, y, w, h]) => [x, y, w, h].every(Number.isFinite) && Math.abs(w) > 0.5 && Math.abs(h) > 0.5)
        .map(([x, y, w, h]) => [Math.min(x, x + w), Math.min(y, y + h), Math.max(x, x + w), Math.max(y, y + h)])
      for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
          const w = Math.min(boxes[i][2], boxes[j][2]) - Math.max(boxes[i][0], boxes[j][0])
          const h = Math.min(boxes[i][3], boxes[j][3]) - Math.max(boxes[i][1], boxes[j][1])
          if (w > 0.5 && h > 0.5)
            worst = Math.max(worst, w * h)
        }
      }
    }
    return worst
  }
  window.__sample = ms => new Promise((resolve) => {
    const keyOf = (el) => {
      const parts = []
      for (let n = el; n && n.tagName !== 'svg'; n = n.parentElement) {
        if (n.__vnode?.key != null)
          parts.push(String(n.__vnode.key))
        for (let c = n.__vueParentComponent; c && c.subTree?.el === n; c = c.parent) {
          if (c.vnode.key != null)
            parts.push(String(c.vnode.key))
        }
        const cls = n.getAttribute?.('class') || ''
        const m = cls.match(/v-charts-(bar|line|area|pie|radar|radial-bar|funnel|scatter)\b(?!-)/)
        if (m) {
          const series = [...document.querySelectorAll(`.v-charts-${m[1]}`)].indexOf(n)
          parts.push(`${m[1]}${series}`)
        }
      }
      return parts.reverse().join('/')
    }
    const frames = []
    const longtasks = []
    const po = new PerformanceObserver(list => list.getEntries().forEach(e => longtasks.push(Math.round(e.duration))))
    try { po.observe({ entryTypes: ['longtask'] }) }
    catch {}
    const t0 = performance.now()
    const tick = (now) => {
      const shapes = {}
      const counts = {}
      const svgs = [...document.querySelectorAll('svg.v-charts-surface')]
      for (const el of svgs.flatMap(svg => [...svg.querySelectorAll('rect,path,circle,polygon')])) {
        if (el.closest('defs, clipPath, .v-charts-cartesian-axis, .v-charts-cartesian-grid, .v-charts-polar-grid, .v-charts-polar-angle-axis, .v-charts-polar-radius-axis, .v-charts-legend-wrapper'))
          continue
        if (el.getAttribute('fill') === 'transparent')
          continue
        const cls = (el.getAttribute('class') || '').split(' ')[0]
        const surface = svgs.indexOf(el.ownerSVGElement)
        const prefix = surface > 0 ? `svg${surface}/` : ''
        const base = `${prefix}${el.tagName}.${cls}#${keyOf(el)}`
        counts[base] = (counts[base] ?? 0) + 1
        shapes[`${base}@${counts[base]}`] = ['d', 'x', 'y', 'width', 'height', 'cx', 'cy', 'r', 'transform', 'points', 'stroke-width'].map(a => el.getAttribute(a) ?? '').join('|') + faint(el)
      }
      for (const [id, attrs] of Object.entries(window.__htmlGeometry()))
        shapes[id] = [attrs.transform ?? '', attrs.width ?? '', attrs.height ?? ''].join('|')
      const tip = document.querySelector('[role="tooltip"]')
      if (tip && tip.style.visibility === 'visible')
        shapes.tooltip = tip.style.transform
      frames.push({ t: now - t0, shapes })
      if (now - t0 < ms) {
        requestAnimationFrame(tick)
      }
      else { po.disconnect(); resolve({ frames, longtasks }) }
    }
    requestAnimationFrame(tick)
  })
  window.__timing = ms => new Promise((resolve) => {
    const ts = []
    const longtasks = []
    const po = new PerformanceObserver(list => list.getEntries().forEach(e => longtasks.push(Math.round(e.duration))))
    try { po.observe({ entryTypes: ['longtask'] }) }
    catch {}
    const t0 = performance.now()
    const tick = (now) => {
      ts.push(now)
      if (now - t0 < ms) {
        requestAnimationFrame(tick)
      }
      else { po.disconnect(); resolve({ intervals: ts.slice(1).map((t, i) => t - ts[i]), longtasks }) }
    }
    requestAnimationFrame(tick)
  })
}

function stats(intervals) {
  const sorted = [...intervals].sort((a, b) => a - b)
  return { frames: intervals.length, worst: sorted.at(-1) ?? 0, p95: sorted[Math.floor(sorted.length * 0.95)] ?? 0, slow: intervals.filter(v => v > 20).length }
}

function svgCurves(curveList, kind) {
  const W = 380
  const H = 170
  const P = 22
  const x = t => P + (t / WINDOW) * (W - P - 6)
  const y = p => H - P - p * (H - 2 * P)
  const idealPts = Array.from({ length: 91 }, (_, i) => i * 10).map(t => `${x(t).toFixed(1)},${y(ideal[kind](t)).toFixed(1)}`).join(' ')
  const lines = curveList.slice(0, 120).map((c, i) => `<polyline fill="none" stroke="hsl(${(i * 47) % 360} 70% 45%)" stroke-opacity=".55" stroke-width="1.2" points="${c.pts.map(([t, p]) => `${x(t).toFixed(1)},${y(Math.max(-0.3, Math.min(1.3, p))).toFixed(1)}`).join(' ')}"><title>${c.id}</title></polyline>`).join('')
  const grid = [0, 0.5, 1].map(p => `<line x1="${P}" x2="${W - 6}" y1="${y(p)}" y2="${y(p)}" stroke="currentColor" stroke-opacity=".12"/><text x="2" y="${y(p) + 3}" font-size="9" fill="currentColor" opacity=".5">${p * 100}%</text>`).join('')
  const ticks = [0, 250, 500, 750].map(t => `<text x="${x(t) - 6}" y="${H - 6}" font-size="9" fill="currentColor" opacity=".5">${t}ms</text>`).join('')
  return `<svg viewBox="0 0 ${W} ${H}" class="curves">${grid}${ticks}${lines}<polyline fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="4 3" points="${idealPts}"/></svg>`
}

// Frame-exact rendering: advance to each fake-clock animation frame, one screenshot per frame.
// What each frame shows is exact; real-time cost is measured separately on a real clock.
async function record(page, dir, name, act) {
  const frameDir = join(dir, `${name}-frames`)
  mkdirSync(frameDir, { recursive: true })
  const clip = await page.locator('.frame').boundingBox()
  const frames = []
  const before = await page.evaluate(() => window.__snapshot())
  await act()
  const started = await page.evaluate(() => performance.now())
  for (let i = 0, t = 0; t <= WINDOW; i++) {
    frames.push({ t, ...await page.evaluate(() => ({ shapes: window.__snapshot(), overlap: window.__overlap() })) })
    await page.screenshot({ path: join(frameDir, `${String(i).padStart(4, '0')}.jpg`), clip, type: 'jpeg', quality: 88 })
    await advanceFrame(page)
    t = await page.evaluate(start => performance.now() - start, started)
  }
  frames[0].before = before
  const video = join(dir, `${name}.mp4`)
  const slow = join(dir, `${name}-slow.mp4`)
  const scale = 'scale=trunc(iw/2)*2:trunc(ih/2)*2'
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(1000 / FRAME), '-i', join(frameDir, '%04d.jpg'), '-vf', scale, '-pix_fmt', 'yuv420p', '-c:v', 'libx264', '-crf', '20', video])
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(1000 / FRAME / 4), '-i', join(frameDir, '%04d.jpg'), '-vf', `${scale},fps=60`, '-pix_fmt', 'yuv420p', '-c:v', 'libx264', '-crf', '20', slow])
  rmSync(frameDir, { recursive: true, force: true })
  if (has('frames'))
    writeFileSync(join(dir, `${name}.frames.json`), JSON.stringify(frames))
  return { frames, video, slow }
}

mkdirSync(out, { recursive: true })
const report = []
const JOURNEY_BACK = { top8: 'top15', top15: 'top8', steps3: 'steps4', steps4: 'steps3', addJourney: 'removeJourney', removeJourney: 'addJourney' }
const BACK = { values: 'refill', append2: 'fromOne', removeMiddle: 'fromOne', shift: 'fromOne', hideA: 'showA', showA: 'hideA', toOne: 'fromOne', fromOne: 'toOne', empty: 'refill', refill: 'empty', nullGap: 'fromOne', narrow: 'wide', wide: 'narrow', negative: 'positive', positive: 'negative', grow: 'reset', reset: 'grow' }
async function openPage(s, fake, reduced = false) {
  const context = await browser.newContext({ viewport: { width: 800, height: s === 'journey' ? 560 : 440 }, deviceScaleFactor: 1, reducedMotion: reduced ? 'reduce' : 'no-preference' })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', e => errors.push(e.message))
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning')
      errors.push(m.text().slice(0, 200))
  })
  await page.addInitScript(installHTMLGeometry)
  await page.addInitScript(SAMPLER)
  if (fake) {
    await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') })
    await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'))
  }
  await page.goto(`${url}?s=${s}${reduced ? '&static=1' : ''}`)
  if (fake) {
    // Responsive charts reveal their measured layout on rAF; the paused clock must release it.
    await page.waitForSelector('svg.v-charts-surface, .v-charts-bar-list', { state: 'attached' })
    await advanceFrame(page)
  }
  await page.waitForSelector('svg.v-charts-surface, .v-charts-bar-list')
  return { context, page, errors }
}
function actions(page, box) {
  return async (step) => {
    if (step === 'pointer-enter')
      return page.mouse.move(box.x + 150, box.y + 150)
    if (step === 'pointer-move')
      return page.mouse.move(box.x + 520, box.y + 150)
    if (step === 'pointer-leave')
      return page.mouse.move(box.x + 520, box.y + box.height + 60)
    if (step === 'interrupt')
      return page.evaluate(() => { window.lab.step('values'); setTimeout(() => window.lab.step('removeMiddle'), 150) })
    if (step !== 'entrance')
      return page.evaluate(name => window.lab.step(name), step)
  }
}

try {
  server = await startServer()
  url = server.url
  browser = await launchBrowser()
  for (const s of scenarios.length ? scenarios : all) {
    const backSteps = s === 'journey' ? { ...BACK, ...JOURNEY_BACK } : BACK
    const dir = join(out, s)
    if (existsSync(dir))
      assertContained(realpathSync(out), realpathSync(dir))
    rmSync(dir, { recursive: true, force: true })
    mkdirSync(dir, { recursive: true })
    const visual = await openPage(s, true)
    const timingPage = await openPage(s, false)
    const targetPage = await openPage(s, true, true)
    const labSteps = await visual.page.evaluate(() => window.lab.steps)
    const steps = s === 'tooltip' ? ['pointer-enter', 'pointer-move', 'pointer-leave'] : ['entrance', ...labSteps, ...(['values', 'removeMiddle', 'fromOne'].every(name => labSteps.includes(name)) ? ['interrupt'] : [])]
    const act = actions(visual.page, await visual.page.locator(s === 'barList' ? '.frame' : '.v-charts-wrapper').first().boundingBox())
    const actTarget = actions(targetPage.page, await targetPage.page.locator(s === 'barList' ? '.frame' : '.v-charts-wrapper').first().boundingBox())
    const actReal = actions(timingPage.page, await timingPage.page.locator(s === 'barList' ? '.frame' : '.v-charts-wrapper').first().boundingBox())
    for (const step of steps) {
      if (only && !only.split(',').includes(step))
        continue
      if (step === 'interrupt') {
        for (const p of [visual.page, timingPage.page, targetPage.page]) await p.evaluate(() => window.lab.step('fromOne'))
        await timingPage.page.waitForTimeout(900)
      }
      const settled = step === 'entrance' || await settle(visual.page)
      const recorded = await record(visual.page, dir, step, () => act(step))
      await actTarget(step)
      // The static control computes the target independently of the recorded curve.
      // Run pending interruption timers too; a stable early sample is not the target.
      await targetPage.page.clock.runFor(WINDOW)
      const targetSettled = await settle(targetPage.page)
      const target = await targetPage.page.evaluate(() => window.__snapshot())
      const curveList = curves(recorded.frames)
      let { issues } = flags(curveList, recorded.frames, target)
      if (!targetSettled)
        issues.push('target control did not settle (2s cap)')
      if (!settled)
        issues.push('did not settle before recording (2s cap)')

      // An interrupted change legitimately reverses direction.
      if (step === 'interrupt')
        issues = issues.filter(issue => !issue.startsWith('backwards'))

      // Real-clock frame timing of the same step, at normal speed and with the CPU slowed 4x.
      const timing = {}
      // Timing replays the step on a second page, so it needs a step that returns to the start.
      const replayable = step === 'interrupt' || step.startsWith('pointer') || labSteps.includes(backSteps[step])
      if (step !== 'entrance' && replayable && flag('browser', 'chromium') === 'chromium') {
        // Resolve fonts and exercise this replay once before comparing CPU rates.
        // The first pointer entry can otherwise include lazy layout/JIT work.
        await timingPage.page.evaluate(() => document.fonts.ready)
        for (const rate of [null, ...(throttle ? [1, 4] : [1])]) {
          // Each rate must start with the same tooltip selection and settled replay state.
          // Otherwise the second pointer action can be a no-op at the previous endpoint.
          await actReal('pointer-leave')
          if (step === 'pointer-move')
            await actReal('pointer-enter')
          if (step === 'pointer-leave')
            await actReal('pointer-move')
          await timingPage.page.waitForTimeout(900)
          const back = labSteps.includes(backSteps[step]) ? backSteps[step] : undefined
          if (back) {
            await timingPage.page.evaluate(name => window.lab.step(name), back)
            await timingPage.page.waitForTimeout(900)
          }
          if (step === 'interrupt') {
            await timingPage.page.evaluate(() => window.lab.step('fromOne'))
            await timingPage.page.waitForTimeout(900)
          }
          const beforeReplay = step.startsWith('pointer') ? await timingPage.page.evaluate(() => window.__snapshot()) : undefined
          const cdp = await timingPage.context.newCDPSession(timingPage.page)
          await cdp.send('Emulation.setCPUThrottlingRate', { rate: rate ?? 1 })
          const t = timingPage.page.evaluate(ms => window.__timing(ms), WINDOW)
          await actReal(step)
          const r = await t
          await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 })
          await cdp.detach()
          const afterReplay = beforeReplay ? await timingPage.page.evaluate(() => window.__snapshot()) : undefined
          if (rate !== null)
            timing[`${rate}x`] = { ...stats(r.intervals), longtasks: r.longtasks, ...(beforeReplay ? { replay: { before: beforeReplay, after: afterReplay } } : {}) }
          await timingPage.page.waitForTimeout(300)
        }
      }
      const kind = step === 'entrance' ? 'enter' : 'update'
      const errors = [...new Set([...visual.errors, ...timingPage.errors, ...targetPage.errors])]
      const settlement = issues.filter(issue => issue.startsWith('unsettled ')).map((issue) => {
        const id = issue.slice(10)
        return { id, recorded: recorded.frames.at(-1).shapes[id], target: target[id] }
      })
      report.push({ scenario: s, step, kind, issues, settlement, timing, curves: curveList.length, video: recorded.video, slow: recorded.slow, svg: svgCurves(curveList, kind), errors })
      const last = report.at(-1)
      console.log(`${s.padEnd(13)} ${step.padEnd(13)} curves=${String(last.curves).padStart(3)} issues=${String(issues.length).padStart(2)} 1x worst=${timing['1x']?.worst.toFixed(0) ?? '-'}ms slow=${timing['1x']?.slow ?? '-'} 4x worst=${timing['4x']?.worst.toFixed(0) ?? '-'}ms slow=${timing['4x']?.slow ?? '-'} lt=${JSON.stringify(timing['4x']?.longtasks ?? [])}${issues.length ? `\n    ${issues.slice(0, 6).join('\n    ')}` : ''}${errors.length ? `\n    ERR ${errors.slice(0, 3).join(' | ')}` : ''}`)
    }
    await visual.context.close()
    await timingPage.context.close()
    await targetPage.context.close()
  }
  if (!report.length)
    throw new Error(`No motion transitions matched --steps=${only}`)
  writeFileSync(join(out, 'report.json'), JSON.stringify(report.map(({ svg, ...r }) => r), null, 2))

  // HTML report.
  const rel = p => p.slice(out.length + 1)
  const rows = report.map(r => `
  <section class="step ${r.issues.length ? 'flagged' : ''}">
    <header><h3>${r.scenario} · ${r.step}</h3><span class="pill ${r.issues.length ? 'bad' : 'ok'}">${r.issues.length ? `${r.issues.length} flags` : 'clean'}</span>
    <span class="meta">${r.curves} moving shapes · 1x worst ${r.timing['1x']?.worst.toFixed(0) ?? '–'} ms · 4x CPU worst ${r.timing['4x']?.worst.toFixed(0) ?? '–'} ms, ${r.timing['4x']?.slow ?? '–'} slow frames</span></header>
    <div class="row">
      <figure><video src="${rel(r.slow)}" muted loop playsinline controls preload="none"></video><figcaption>4× slow motion</figcaption></figure>
      <figure><video src="${rel(r.video)}" muted loop playsinline controls preload="none"></video><figcaption>real time</figcaption></figure>
      <figure>${r.svg}<figcaption>progress per shape (colour) vs ideal ${r.kind} easing (dashed)</figcaption></figure>
    </div>
    ${r.issues.length ? `<ul class="issues">${r.issues.slice(0, 12).map(i => `<li>${i.replace(/</g, '&lt;')}</li>`).join('')}</ul>` : ''}
    ${r.errors.length ? `<ul class="issues">${r.errors.map(i => `<li>console: ${i.replace(/</g, '&lt;')}</li>`).join('')}</ul>` : ''}
  </section>`).join('')
  writeFileSync(join(out, 'index.html'), `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Motion Report</title>
  <style>
  :root{--bg:#fafafa;--fg:#111;--card:#fff;--line:#e5e5e5;--ok:#15803d;--bad:#b91c1c}
  @media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#0b0b0c;--fg:#eee;--card:#151517;--line:#2a2a2d;--ok:#4ade80;--bad:#f87171}}
  :root[data-theme="dark"]{--bg:#0b0b0c;--fg:#eee;--card:#151517;--line:#2a2a2d;--ok:#4ade80;--bad:#f87171}
  body{margin:0;padding:24px 16px;background:var(--bg);color:var(--fg);font:14px/1.45 system-ui,sans-serif}
  main{max-width:1240px;margin:0 auto}h1{font-size:22px;margin:0 0 4px}.lede{opacity:.7;margin:0 0 20px}
  .step{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px;margin:0 0 14px}
  .step header{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:baseline}.step h3{margin:0;font-size:15px}
  .meta{opacity:.65;font-size:12px}.pill{font-size:11px;padding:2px 8px;border-radius:99px;border:1px solid currentColor}.ok{color:var(--ok)}.bad{color:var(--bad)}
  .row{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:12px;margin-top:10px}
  figure{margin:0}video,.curves{width:100%;border-radius:8px;border:1px solid var(--line);background:#fff}.curves{background:var(--card)}
  figcaption{font-size:11px;opacity:.6;margin-top:4px}.issues{margin:8px 0 0;padding-left:18px;font:12px ui-monospace,monospace;color:var(--bad)}
  .filters{margin:0 0 16px}label{margin-right:12px}
  </style></head><body><main>
  <h1>Motion report</h1><p class="lede">${report.length} transitions across ${new Set(report.map(r => r.scenario)).size} scenarios, recorded in real time in headless Chromium. Curves show each moving shape's progress from start to end value; the dashed line is the ideal easing. Timing is measured without the sampler, at normal speed and with the CPU slowed 4×.</p>
  <p class="filters"><label><input type="checkbox" id="flagged"> only flagged</label></p>
  ${rows}
  <script>document.getElementById('flagged').addEventListener('change',e=>document.querySelectorAll('.step:not(.flagged)').forEach(s=>s.style.display=e.target.checked?'none':''));
  const io=new IntersectionObserver(es=>es.forEach(e=>{const v=e.target;if(e.isIntersecting){v.preload='auto';v.play().catch(()=>{})}else v.pause()}));document.querySelectorAll('video').forEach(v=>io.observe(v));</script>
  </main></body></html>`)
}
finally {
  try {
    await browser?.close()
  }
  finally {
    await server?.close()
  }
}

if (has('check')) {
  const { failed, stale } = checkReport(report, accepted, has('strict-timing'))
  for (const r of failed)
    console.error(`FAIL ${r.scenario} ${r.step}: ${r.failures.slice(0, 3).join(' | ')}`)
  for (const entry of stale)
    console.error(`STALE ${entry.scenario}: ${entry.kind} ${entry.element}`)
  console.log(`${report.length - failed.length}/${report.length} transitions clean · report: ${join(out, 'index.html')}`)
  if (failed.length || stale.length)
    process.exitCode = 1
}
