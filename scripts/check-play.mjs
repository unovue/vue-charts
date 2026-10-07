import { Buffer } from 'node:buffer'
import { spawn, spawnSync } from 'node:child_process'
import { mkdir, readdir, writeFile } from 'node:fs/promises'
import { createServer } from 'node:net'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { launchBrowser } from './lib/browser.mjs'
import { stopProcess, waitForServer } from './lib/check-process.mjs'
import { checkPorts, portText } from './lib/ports.mjs'

const ports = checkPorts(4690, 4699)

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const evidence = resolve(root, process.argv.find(arg => arg.startsWith('--out='))?.slice(6) ?? '.evidence/breakit/B9')

const seriesSelector = '.v-charts-bar,.v-charts-line,.v-charts-area,.v-charts-pie,.v-charts-radar,.v-charts-radial-bar,.v-charts-funnel,.v-charts-sankey,.v-charts-treemap,.v-charts-sunburst'
const probeSelector = `${seriesSelector},.v-charts-scatter,.v-charts-tracker,.v-charts-calendar,.v-charts-heatmap,.v-charts-cohort,.v-charts-sparkline,.v-charts-journey`

// Bounding-box centres can be holes in donuts or whitespace beside a line.
// Choose the nearest painted mark whose shape actually receives the pointer.
async function dataMarkPoint(chart) {
  await chart.scrollIntoViewIfNeeded()
  // Scrolling can start a clipped entrance. Keep recording it while waiting for
  // a mark to receive the pointer rather than mistaking the empty clip for data.
  for (let attempt = 0; attempt < 50; attempt++) {
    const point = await chart.evaluate((svg, selector) => {
      const box = svg.getBoundingClientRect()
      const points = []
      for (const shape of svg.querySelectorAll('path,rect,circle,ellipse,polygon,polyline,line')) {
        if (!shape.closest(selector) || shape.closest('defs,clipPath,mask,.v-charts-label-list,.v-charts-pie-labels,.v-charts-active-dot'))
          continue
        // RadialBar backgrounds share the series group but have no item handlers.
        if (shape.closest('.v-charts-radial-bar') && !window.playItemSectors.has(shape))
          continue
        const radar = shape.closest('.v-charts-radar')
        if (radar?.querySelector('.v-charts-radar-dots circle') && !shape.closest('.v-charts-radar-dots'))
          continue
        // Without dots, Radar's outline carries values; its filled centre is not a datum.
        const radarOutline = !!radar && shape.tagName === 'path'
        const style = getComputedStyle(shape)
        if (!window.playHasPaint(style.fill, style.fillOpacity) && !(Number.parseFloat(style.strokeWidth) > 0 && window.playHasPaint(style.stroke, style.strokeOpacity)))
          continue
        let hidden = false
        for (let parent = shape; parent && parent !== svg; parent = parent.parentElement)
          hidden ||= Number(getComputedStyle(parent).opacity) === 0
        if (hidden)
          continue
        const cell = shape.closest('.v-charts-cell')
        const receivesPoint = (point) => {
          const hit = document.elementFromPoint(point.x, point.y)
          // Cells put a larger transparent gap target over their painted rect.
          return hit === shape || (cell && hit?.closest('.v-charts-cell') === cell)
        }
        const b = shape.getBoundingClientRect()
        for (let x = 1; x < (radarOutline ? 1 : 10); x++) {
          for (let y = 1; y < 10; y++) {
            const point = { x: b.x + b.width * x / 10, y: b.y + b.height * y / 10 }
            if (receivesPoint(point))
              points.push(point)
          }
        }
        // Thin stroked curves may fall between the fill sampling points.
        if ((style.fill === 'none' || radarOutline) && typeof shape.getTotalLength === 'function') {
          const length = shape.getTotalLength()
          for (let i = 1; i < 20; i++) {
            const local = shape.getPointAtLength(length * i / 20)
            const point = new DOMPoint(local.x, local.y).matrixTransform(shape.getScreenCTM())
            if (receivesPoint(point))
              points.push({ x: point.x, y: point.y })
          }
        }
      }
      const distance = p => (p.x - box.x - box.width / 2) ** 2 + (p.y - box.y - box.height / 2) ** 2
      return points.sort((a, b) => distance(a) - distance(b))[0] ?? null
    }, probeSelector)
    if (point)
      return point
    await chart.page().waitForTimeout(50)
  }
  return null
}

async function portAvailable(port) {
  const probe = createServer()
  try {
    await new Promise((resolve, reject) => {
      probe.once('error', reject)
      probe.listen(port, '127.0.0.1', resolve)
    })
    return true
  }
  catch (error) {
    if (error.code !== 'EADDRINUSE')
      throw error
    return false
  }
  finally {
    if (probe.listening)
      await new Promise(resolve => probe.close(resolve))
  }
}

// Runs before parser/hydration. WeakMap IDs survive updates but never merge replaced nodes.
function installRecorder(seriesSelector) {
  const ids = new WeakMap()
  let next = 0
  const id = (el) => {
    if (!ids.has(el))
      ids.set(el, ++next)
    return ids.get(el)
  }
  const rect = (el) => {
    const b = el.getBoundingClientRect()
    return [b.x + scrollX, b.y + scrollY, b.width, b.height].map(n => Math.round(n * 100) / 100)
  }
  let styles = new Map()
  const styleOf = (el) => {
    if (!styles.has(el))
      styles.set(el, getComputedStyle(el))
    return styles.get(el)
  }
  const visible = (el) => {
    for (let p = el; p && p.nodeType === 1; p = p.parentElement) {
      const s = styleOf(p)
      if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0)
        return false
    }
    return true
  }
  function hasPaint(color, opacity) {
    if (color === 'none' || color === 'transparent' || Number(opacity) <= 0)
      return false
    // Computed colors retain alpha in rgb/rgba and modern slash notation.
    const alpha = color.match(/\/\s*([\d.]+)%?\s*\)$/)
      ?? color.match(/^rgba\(.*?,\s*([\d.]+)\s*\)$/)
    return !alpha || Number(alpha[1]) > 0
  }
  window.playHasPaint = hasPaint
  let exemptions = new WeakSet()
  window.playItemSectors = new WeakSet()
  window.playReadOnlyLegends = new WeakSet()
  function updateExemptions() {
    exemptions = new WeakSet()
    window.playItemSectors = new WeakSet()
    window.playReadOnlyLegends = new WeakSet()
    const visited = new Map()
    // Production Vue omits __vueParentComponent, but keeps the renderer's root VNode.
    function walk(vnode, off = false, readOnlyLegend) {
      if (!vnode || typeof vnode !== 'object')
        return
      off ||= vnode.component?.props?.isAnimationActive === false || vnode.component?.props?.item?.isAnimationActive === false || vnode.props?.isAnimationActive === false || vnode.props?.['is-animation-active'] === false
      if (vnode.component?.type.name === 'Legend')
        readOnlyLegend = !vnode.component.slots.content && vnode.component.props.hidden === undefined && !vnode.props?.onClick
      const key = `${off}:${readOnlyLegend}`
      const states = visited.get(vnode) ?? new Set()
      if (states.has(key))
        return
      states.add(key)
      visited.set(vnode, states)
      if (readOnlyLegend && vnode.el?.nodeType === 1 && vnode.el.classList.contains('v-charts-legend-wrapper'))
        window.playReadOnlyLegends.add(vnode.el)
      if (vnode.component?.type.name === 'Sector' && vnode.props?.onMouseenter && vnode.el?.nodeType === 1)
        window.playItemSectors.add(vnode.el)
      if (off && vnode.el?.nodeType === 1)
        exemptions.add(vnode.el)
      walk(vnode.component?.subTree, off, readOnlyLegend)
      walk(vnode.suspense?.activeBranch, off, readOnlyLegend)
      walk(vnode.ssContent, off, readOnlyLegend)
      if (Array.isArray(vnode.children))
        vnode.children.forEach(child => walk(child, off, readOnlyLegend))
    }
    walk(document.getElementById('__nuxt')?._vnode)
  }
  const disabled = (el) => {
    for (let p = el; p; p = p.parentElement) {
      if (exemptions.has(p))
        return true
      for (let vm = p.__vueParentComponent; vm; vm = vm.parent) {
        if (vm.props?.isAnimationActive === false || vm.props?.item?.isAnimationActive === false)
          return true
      }
    }
    return el.closest('[data-animation="false"]') !== null
  }
  window.playPointer = null
  document.addEventListener('pointermove', (event) => { window.playPointer = [event.clientX + scrollX, event.clientY + scrollY] })
  window.playMotion = { frames: [], snapshots: [], start: performance.now(), duration: 3000, done: false }
  window.playMotionReset = (duration) => {
    window.playMotion = { frames: [], snapshots: [], start: performance.now(), duration, done: false }
  }
  function sample(now) {
    // Keep the loop alive after a sampling error; the pageerror still fails the capture.
    requestAnimationFrame(sample)
    const state = window.playMotion
    if (!state.done) {
      styles = new Map()
      updateExemptions()
      const charts = [...document.querySelectorAll('.v-charts-surface')].map(el => ({
        id: id(el),
        box: rect(el),
        visible: visible(el),
        inView: (() => {
          // Match provideChartInView: the wrapper, not its SVG, must be half visible.
          const b = (el.closest('.v-charts-wrapper') ?? el).getBoundingClientRect()
          const width = Math.max(0, Math.min(b.right, innerWidth) - Math.max(b.left, 0))
          const height = Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0))
          return b.width > 0 && b.height > 0 && (width * height / (b.width * b.height) >= 0.5 || (width > 0 && height >= innerHeight / 2))
        })(),
        seriesTypes: [...el.querySelectorAll(seriesSelector)].map(s => s.getAttribute('class')),
        tooltip: (() => {
          const tooltip = el.closest('.v-charts-wrapper')?.querySelector('.v-charts-tooltip-wrapper')
          return tooltip ? visible(tooltip) && tooltip.getBoundingClientRect().width > 0 : null
        })(),
        legend: !!el.closest('.v-charts-legend-item'),
        shapes: (() => {
          const texts = new Map()
          return [...el.querySelectorAll('path,rect,circle,ellipse,line,polyline,polygon,text,use,image')].map((shape) => {
            const series = shape.closest(seriesSelector)
            const text = shape.textContent
            const occurrence = texts.get(text) ?? 0
            if (shape.tagName === 'text')
              texts.set(text, occurrence + 1)
            const style = styleOf(shape)
            const ancestors = []
            let clippedOut = false
            for (let p = shape; p && p !== el; p = p.parentElement) {
              const clip = p.getAttribute('clip-path')
              const clipId = clip?.match(/#([^)]*)/)?.[1]
              const clipNode = clipId ? document.getElementById(clipId) : null
              const clipRects = [...(clipNode?.querySelectorAll('rect') ?? [])]
              if (clipRects.length && !clipNode.querySelector('path,circle,ellipse,polygon') && clipRects.every((rect) => {
                const box = rect.getBBox()
                return box.width <= 0 || box.height <= 0
              })) {
                clippedOut = true
              }
              ancestors.push([p.getAttribute('transform'), clip, clipId ? document.getElementById(clipId)?.innerHTML : null, styleOf(p).opacity])
            }
            const box = rect(shape)
            const fill = box[2] > 0 && box[3] > 0 && hasPaint(style.fill, style.fillOpacity)
            const stroke = (box[2] > 0 || box[3] > 0)
              && Number.parseFloat(style.strokeWidth) > 0
              && hasPaint(style.stroke, style.strokeOpacity)
            const painted = fill || stroke
            const core = !!series && !shape.closest('.v-charts-label-list,.v-charts-pie-labels') && shape.tagName !== 'text' && (series.classList.contains('v-charts-line') ? !!shape.closest('.v-charts-line-curve') : series.classList.contains('v-charts-area') ? !!shape.closest('.v-charts-area-area') : true)
            return {
              id: shape.tagName === 'text' ? `text:${text}:${occurrence}` : `${id(shape)}:${shape.tagName}`,
              box,
              core,
              visible: painted && !clippedOut && !shape.closest('defs,clipPath,mask') && visible(shape),
              series: series ? id(series) : null,
              disabled: disabled(shape),
              role: shape.closest('.v-charts-active-dot') ? 'hover-indicator' : null,
              bar: shape.matches('.v-charts-bar-rectangle path'),
              geometry: JSON.stringify([...shape.attributes].filter(a => !['class', 'id'].includes(a.name)).map(a => [a.name, a.value]).concat([['ancestors', ancestors], ['dash', style.strokeDasharray, style.strokeDashoffset], ['transform', style.transform]])),
            }
          })
        })(),
      }))
      if (state.duration >= 3000 && state.snapshots.length < 6 && now - state.start >= state.duration * [0, 0.1, 0.2, 0.4, 0.7, 1][state.snapshots.length]) {
        const svgs = [...document.querySelectorAll('.v-charts-surface')].filter(el => !el.closest('.v-charts-legend-item')).map((el) => {
          const clone = el.cloneNode(true)
          const originals = [el, ...el.querySelectorAll('*')]
          const copies = [clone, ...clone.querySelectorAll('*')]
          for (let i = 0; i < originals.length; i++) {
            const computed = styleOf(originals[i])
            for (const property of ['fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'stroke-dashoffset', 'opacity', 'visibility', 'font-size', 'font-family', 'transform', 'transform-origin'])
              copies[i].style.setProperty(property, computed.getPropertyValue(property))
          }
          clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
          return { id: id(el), svg: clone.outerHTML }
        })
        state.snapshots.push({ t: Math.round(now - state.start), svgs })
      }
      const target = window.playPointer ? document.elementFromPoint(window.playPointer[0] - scrollX, window.playPointer[1] - scrollY) : null
      state.frames.push({ pointer: window.playPointer, hit: target ? { tag: target.tagName, class: target.getAttribute('class'), series: target.closest(seriesSelector)?.getAttribute('class') ?? null, itemSector: window.playItemSectors.has(target) } : null, t: Math.round(now - state.start), overflow: document.documentElement.scrollWidth - innerWidth, charts })
      state.done = now - state.start >= state.duration
    }
  }
  requestAnimationFrame(sample)
}

function analyze(frames, entrance, settleMs = 2500, existingSeries = []) {
  const flags = []
  // Sub-thousandth-pixel serialization noise is not visible motion. Raw data stays exact.
  const signature = geometry => geometry.replace(/[-+]?(?:\d*\.\d+|\d+)(?:e[-+]?\d+)?/gi, value => String(Math.round(Number(value) * 1000) / 1000))
  // Opacity alone cannot satisfy a geometry entrance; labels and dots must not mask it.
  const geometricAttributes = new Set(['d', 'points', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'width', 'height', 'pathLength', 'transform', 'clip-path', 'stroke-dasharray', 'stroke-dashoffset', 'dash', 'ancestors'])
  const entranceGeometry = shape => signature(JSON.stringify(JSON.parse(shape.geometry).filter(([name]) => geometricAttributes.has(name)).map(([name, ...values]) => name === 'ancestors' ? [name, values[0].map(ancestor => ancestor.slice(0, 3))] : [name, ...values])))
  const seen = new Set()
  const add = (flag, chart, t, shape, numbers) => {
    const key = `${flag}:${chart}:${shape}`
    if (!seen.has(key)) {
      seen.add(key)
      flags.push({ flag, chart, t, shape, numbers })
    }
  }
  const first = new Map()
  const visible = new Set()
  const series = new Map()
  const disabledSeries = new Set()
  let previous = new Map()
  let previousTime = 0
  for (const frame of frames) {
    if (frame.overflow > 1)
      add('overflow', 'page', frame.t, 'document', { overflowPx: frame.overflow })
    const current = new Map()
    for (const chart of frame.charts) {
      if (!first.has(chart.id))
        first.set(chart.id, chart)
      if (chart.visible && chart.box[2] > 0 && chart.box[3] > 0)
        visible.add(chart.id)
      if (!chart.legend && (chart.box[2] <= 0 || chart.box[3] <= 0))
        add('zero-size', chart.id, frame.t, 'surface', { box: chart.box })
      const initial = first.get(chart.id)
      if (!chart.legend && chart.box.slice(2).some((n, i) => Math.abs(n - initial.box[i + 2]) > 1))
        add('slide', chart.id, frame.t, 'surface', { first: initial.box, current: chart.box })
      const bars = chart.shapes.filter(s => s.bar && s.visible && s.series)
      for (let i = 0; i < bars.length; i++) {
        for (const b of bars.slice(i + 1)) {
          const a = bars[i]
          if (a.series === b.series)
            continue
          const overlap = [0, 1].map(k => Math.min(a.box[k] + a.box[k + 2], b.box[k] + b.box[k + 2]) - Math.max(a.box[k], b.box[k]))
          if (overlap.every(n => n > 1))
            add('overlap', chart.id, frame.t, `${a.id}/${b.id}`, { overlapPx: overlap, a: a.box, b: b.box, series: [a.series, b.series] })
        }
      }
      for (const s of chart.shapes) {
        const key = `${chart.id}:${s.id}`
        current.set(key, s)
        const p = previous.get(key)
        if (p && p.visible && s.visible) {
          const delta = s.box.map((n, i) => Math.abs(n - p.box[i]))
          if (delta.some((n, i) => n > chart.box[2 + i % 2] * 0.3 && n > 1))
            add('teleport', chart.id, frame.t, s.id, { role: s.role, deltaTimeMs: frame.t - previousTime, deltaPx: delta, chartSize: chart.box.slice(2), previous: p.box, current: s.box })
          if (frame.t >= settleMs && (signature(s.geometry) !== signature(p.geometry) || delta.some(n => n > 0.1)))
            add('unsettled', chart.id, frame.t, s.id, { settleMs, deltaPx: delta, previousGeometry: p.geometry, currentGeometry: s.geometry })
        }
      }
      for (const s of chart.shapes.filter(s => s.series && s.disabled)) {
        const key = `${chart.id}:${s.series}`
        disabledSeries.add(key)
        series.delete(key)
      }
      if (entrance && chart.inView && !chart.legend) {
        for (const sid of new Set(chart.shapes.filter(s => s.series && s.core && !s.disabled && s.visible).map(s => s.series))) {
          const key = `${chart.id}:${sid}`
          if (existingSeries.includes(key) || disabledSeries.has(key))
            continue
          const shapes = chart.shapes.filter(s => s.series === sid && s.core && s.visible)
          const fingerprint = JSON.stringify(shapes.map(s => [s.id, s.box, entranceGeometry(s)]))
          const visual = JSON.stringify(shapes.map(s => s.geometry))
          if (!series.has(key))
            series.set(key, { chart: chart.id, sid, t: frame.t, first: fingerprint, last: fingerprint, firstVisual: visual, visualChanged: false })
          const entry = series.get(key)
          entry.last = fingerprint
          entry.visualChanged ||= visual !== entry.firstVisual
        }
      }
    }
    previous = current
    previousTime = frame.t
  }
  for (const [cid, chart] of first) {
    if (!chart.legend && !visible.has(cid))
      add('invisible', cid, frames.at(-1)?.t ?? 0, 'surface', { box: chart.box })
  }
  for (const s of series.values()) {
    if (s.first === s.last)
      add('no-entrance', s.chart, s.t, `series-${s.sid}`, { firstEqualsFinal: true, visualChanged: s.visualChanged, observedFrames: frames.length, firstFrameMs: s.t, finalFrameMs: frames.at(-1)?.t })
  }
  return flags
}

if (spawnSync('git', ['check-ignore', join(evidence, 'findings.md')], { cwd: root }).status !== 0)
  throw new Error('Evidence directory must be git-ignored')
await mkdir(evidence, { recursive: true })
const results = []
let browser
let server
let serverLog
let fixturePassed = false
try {
  for (const filter of process.argv.includes('--skip-build') ? [] : ['vccs', 'play']) {
    const build = spawnSync('pnpm', ['--filter', filter, 'build'], { cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 })
    await writeFile(join(evidence, `build-${filter}.log`), build.stdout + build.stderr)
    if (build.status !== 0)
      throw new Error(`${filter} build exited ${build.status}; see build-${filter}.log`)
  }
  let base
  for (const port of process.argv.includes('--fixture-only') ? [] : ports) {
    if (!await portAvailable(port))
      continue
    serverLog = ''
    server = spawn(process.execPath, ['.output/server/index.mjs'], { cwd: join(root, 'playground/nuxt'), env: { ...process.env, PORT: String(port), HOST: '127.0.0.1' }, stdio: ['ignore', 'pipe', 'pipe'] })
    server.stdout.on('data', chunk => serverLog += chunk)
    server.stderr.on('data', chunk => serverLog += chunk)
    if (await waitForServer(server, `http://127.0.0.1:${port}`, 10000, () => serverLog.includes('Listening'))) {
      base = `http://127.0.0.1:${port}`
      break
    }
    await stopProcess(server)
  }
  if (!base && !process.argv.includes('--fixture-only'))
    throw new Error(`No server started in ports ${portText(ports)}`)
  browser = await launchBrowser()
  async function run(route, width, fixture = false) {
    const name = `${fixture ? 'fixture' : route.replaceAll('/', '') || 'index'}-${width}`
    const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 800 }, reducedMotion: 'no-preference', recordVideo: { dir: join(evidence, 'videos'), size: { width, height: width === 390 ? 844 : 800 } } })
    await context.addInitScript(installRecorder, seriesSelector)
    const page = await context.newPage()
    let diagnosticStart = Date.now()
    let diagnostics = []
    page.on('pageerror', e => diagnostics.push({ flag: 'page-error', chart: 'page', shape: 'javascript', t: Date.now() - diagnosticStart, numbers: { message: e.message } }))
    page.on('console', (m) => {
      if (/hydration/i.test(m.text()) || m.type() === 'error')
        diagnostics.push({ flag: /hydration/i.test(m.text()) ? 'hydration' : 'console-error', chart: 'page', shape: 'console', t: Date.now() - diagnosticStart, numbers: { message: m.text() } })
    })
    const result = { name, route, width, scenarios: [] }
    results.push(result)
    const observedEntrances = new Set()
    const observedCharts = new Set()
    async function capture(label, duration, action, entrance = false) {
      const existingSeries = label.startsWith('scroll-') ? [...observedEntrances] : action ? await page.evaluate(() => window.playMotion.frames.at(-1)?.charts.flatMap(chart => chart.shapes.filter(s => s.series).map(s => `${chart.id}:${s.series}`)) ?? []) : []
      if (action) {
        diagnosticStart = Date.now()
        await page.evaluate(ms => window.playMotionReset(ms), duration)
        await action()
        await page.evaluate((ms) => {
          window.playMotion.duration = performance.now() - window.playMotion.start + ms
          window.playMotion.done = false
        }, duration)
      }
      await page.waitForFunction(() => window.playMotion?.done, null, { timeout: duration + 15000 })
      const frames = await page.evaluate(() => window.playMotion.frames)
      for (const chart of frames.flatMap(frame => frame.charts).filter(chart => chart.inView)) {
        observedCharts.add(chart.id)
        for (const shape of chart.shapes.filter(shape => shape.series))
          observedEntrances.add(`${chart.id}:${shape.series}`)
      }
      const actionOffsetMs = action ? await page.evaluate(ms => window.playMotion.duration - ms, duration) : 0
      const flags = [...analyze(frames, entrance, action && !label.startsWith('hover') ? actionOffsetMs + duration - 250 : 2500, existingSeries), ...diagnostics]
      diagnostics = []
      const file = `${name}-${label}`
      await writeFile(join(evidence, `${file}.json`), JSON.stringify(frames))
      const strip = label === 'load'
        ? await page.evaluate(async () => {
          const shots = window.playMotion.snapshots
          const ids = [...new Set(shots.flatMap(s => s.svgs.map(svg => svg.id)))]
          const canvas = document.createElement('canvas')
          canvas.width = 1320
          canvas.height = Math.max(1, ids.length) * 180
          const ctx = canvas.getContext('2d')
          ctx.fillStyle = 'white'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          ctx.font = '12px sans-serif'
          for (let column = 0; column < shots.length; column++) {
            for (let row = 0; row < ids.length; row++) {
              ctx.fillStyle = 'black'
              ctx.fillText(`chart ${ids[row]} / ${shots[column].t} ms`, column * 220 + 5, row * 180 + 15)
              const svg = shots[column].svgs.find(svg => svg.id === ids[row])
              if (!svg)
                continue
              const img = new Image()
              img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.svg)}`
              try {
                await img.decode()
                ctx.drawImage(img, column * 220 + 5, row * 180 + 25, 210, 150)
              }
              catch {
                ctx.fillText('SVG unavailable', column * 220 + 5, row * 180 + 40)
              }
            }
          }
          return canvas.toDataURL('image/png').split(',')[1]
        })
        : null
      if (strip)
        await writeFile(join(evidence, `${file}-strip.png`), Buffer.from(strip, 'base64'))
      await page.screenshot({ path: join(evidence, `${file}.png`), fullPage: label === 'load' })
      result.scenarios.push({ label, frames: frames.length, actionOffsetMs, maximumGapMs: Math.max(0, ...frames.slice(1).map((f, i) => f.t - frames[i].t)), flags, filmstrip: strip ? `${file}-strip.png` : undefined, data: `${file}.json`, screenshot: `${file}.png` })
      return frames
    }
    try {
      if (fixture)
        await page.goto(`file://${join(root, 'scripts/fixtures/play-motion.html')}`, { waitUntil: 'load' })
      else
        await page.goto(`${base}${route}`, { waitUntil: 'load' })
      await capture('load', 3000, null, true)
      {
        const charts = page.locator('.v-charts-surface')
        for (let i = 0; i < await charts.count(); i++) {
          const chart = charts.nth(i)
          if (await chart.evaluate(el => !!el.closest('.v-charts-legend-item')))
            continue
          if (!await chart.isVisible())
            continue
          const chartId = await page.evaluate(i => window.playMotion.frames.at(-1)?.charts[i]?.id, i)
          if (!observedCharts.has(chartId))
            await capture(`scroll-${i}`, 3000, () => chart.evaluate(el => (el.closest('.v-charts-wrapper') ?? el).scrollIntoView({ block: 'center', behavior: 'instant' })), true)
          const hoverFrames = await capture(`hover-${i}`, 500, async () => {
            await page.mouse.move(0, 0)
            const point = await dataMarkPoint(chart)
            if (!point)
              throw new Error(`Chart ${i}: no pointer-receiving data mark found`)
            await page.mouse.move(point.x, point.y)
          })
          const last = hoverFrames.at(-1)
          const sampledChart = last.charts[i]
          if (sampledChart?.tooltip === false)
            result.scenarios.at(-1).flags.push({ flag: 'tooltip', chart: sampledChart.id, shape: 'tooltip', t: last.t, numbers: { visible: false, pointer: last.pointer, hit: last.hit, chartBox: sampledChart.box, seriesTypes: sampledChart.seriesTypes } })
        }
        // Exercise controls, not presentational keys that have no activation contract.
        const legends = page.locator('button.v-charts-legend-item,.v-charts-legend-item:has(button),.v-charts-legend-wrapper [role="button"]')
        const count = await legends.count()
        for (let i = 0; i < count; i++) {
          const before = await legends.nth(i).evaluate(el => el.textContent)
          const readOnly = await legends.nth(i).evaluate(el => (el.tagName === 'DIV' && !el.getAttribute('role')) || window.playReadOnlyLegends.has(el.closest('.v-charts-legend-wrapper')))
          const geometry = () => legends.nth(i).evaluate((el, selector) => [...el.closest('.v-charts-wrapper').querySelectorAll(selector)].map(series => [...series.querySelectorAll('path,rect,circle,polygon')].map(s => [s.getAttribute('d'), s.getAttribute('points'), Math.round(s.getBoundingClientRect().width * 1000) / 1000, Math.round(s.getBoundingClientRect().height * 1000) / 1000])), seriesSelector)
          const original = await geometry()
          await capture(`legend-${i}-exit`, 1000, () => legends.nth(i).click())
          const exited = await geometry()
          if (JSON.stringify(original) === JSON.stringify(exited))
            result.scenarios.at(-1).flags.push({ flag: 'legend-exit', chart: i, t: 1000, shape: before, numbers: { readOnly, original, exited } })
          await capture(`legend-${i}-return`, 1000, () => legends.nth(i).click(), true)
          const returned = await geometry()
          if (JSON.stringify(returned) !== JSON.stringify(original))
            result.scenarios.at(-1).flags.push({ flag: 'legend-return', chart: i, t: 1000, shape: before, numbers: { readOnly, original, returned } })
          result.scenarios.at(-1).legend = before
        }
        const controls = page.locator('select,input[type="range"],input[type="checkbox"],button[role="combobox"],[role="switch"],[role="slider"],button[data-active="false"]')
        for (let i = 0; i < await controls.count(); i++) {
          const control = controls.nth(i)
          if (!await control.isVisible())
            continue
          await capture(`control-${i}`, 1500, async () => {
            const kind = await control.evaluate(el => ({ tag: el.tagName, type: el.getAttribute('type'), role: el.getAttribute('role') }))
            if (kind.tag === 'SELECT') {
              const value = await control.evaluate(el => [...el.options].find(o => o.value !== el.value)?.value)
              if (value !== undefined)
                await control.selectOption(value)
            }
            else if (kind.type === 'range' || kind.role === 'slider') {
              await control.focus()
              const atMax = await control.evaluate(el => el.value === el.max || el.getAttribute('aria-valuenow') === el.getAttribute('aria-valuemax'))
              await control.press(atMax ? 'ArrowLeft' : 'ArrowRight')
            }
            else {
              await control.click()
              if (kind.role === 'combobox') {
                await page.locator('[role="option"][data-state="unchecked"]').first().click()
              }
            }
          })
        }
      }
    }
    catch (error) {
      result.scenarios.push({ label: 'execution', flags: [{ flag: 'execution', chart: 'page', t: null, shape: 'runner', numbers: { message: String(error), recorder: await page.evaluate(() => ({ done: window.playMotion?.done, frames: window.playMotion?.frames.length, elapsed: performance.now() - window.playMotion?.start, duration: window.playMotion?.duration })).catch(() => null) } }, ...diagnostics] })
    }
    finally {
      result.video = await page.video().path()
      await context.close()
    }
    // eslint-disable-next-line no-console -- CLI progress contract.
    console.log(`${name}: ${result.scenarios.length} recordings, ${result.scenarios.reduce((n, s) => n + s.flags.length, 0)} flags`)
    await writeFile(join(evidence, `${name}-result.json`), JSON.stringify(result, null, 2))
    return result
  }
  const fixture = await run('/fixture', 1280, true)
  const fixtureFlags = new Set(fixture.scenarios.flatMap(s => s.flags.map(f => f.flag)))
  const expected = ['teleport', 'overlap', 'unsettled', 'slide', 'zero-size', 'invisible', 'no-entrance', 'overflow', 'hydration', 'console-error', 'page-error', 'tooltip', 'legend-exit', 'legend-return']
  fixturePassed = expected.every(flag => fixtureFlags.has(flag)) && fixture.scenarios[0].flags.some(f => f.flag === 'no-entrance' && f.numbers.visualChanged) && fixture.scenarios[0].flags.some(f => f.flag === 'no-entrance' && f.t >= 450)
  if (!fixturePassed)
    throw new Error(`Fixture missed: ${expected.filter(flag => !fixtureFlags.has(flag)).join(', ')}; fade-only and instantaneous clipped entrances must also fail`)
  if (!process.argv.includes('--fixture-only')) {
    const onlyRoute = process.argv.find(arg => arg.startsWith('--route='))?.slice(8)
    const routes = (await readdir(join(root, 'playground/nuxt/app/pages'))).filter(f => f.endsWith('.vue')).sort().map(f => f === 'index.vue' ? '/' : `/${f.slice(0, -4)}`).filter(route => !onlyRoute || route === onlyRoute)
    if (!routes.length)
      throw new Error(`No playground route found for ${onlyRoute}`)
    for (const route of routes)
      await run(route, 1280)
    for (const route of ['/bar-charts', '/line-charts', '/pie-charts'].filter(route => !onlyRoute || route === onlyRoute))
      await run(route, 390)
  }
}
catch (error) {
  console.error(error)
  process.exitCode = 1
}
finally {
  await browser?.close()
  if (server)
    await stopProcess(server)
  await writeFile(join(evidence, 'server.log'), serverLog ?? '')
  const lines = ['# Playground motion findings', '', `Fixture detectors verified: ${fixturePassed}. All times are milliseconds since navigation or interaction.`, '', 'Every scenario has raw frame JSON, a screenshot, and a context video. Load screenshots cover the full page; interaction screenshots show the current viewport. IDs are DOM identities; text IDs include content. Rectangles use document coordinates, so scrolling does not create teleports.', '', 'Classification: synthetic flags are check artifacts by design. Runtime errors, overflow and nonzero-area bar intersections are product bugs. Geometry flags initially classify as product bugs; review their consecutive frames and video for deliberate example behavior or sampling artifacts. Disabled Vue series are exempt from entrance checks. Effective clip definitions, opacity and dash state are included in geometry. This check cannot certify aesthetic quality.', '']
  for (const r of results) {
    lines.push(`## ${r.name}`, '', `Video: ${r.video}`, '')
    for (const s of r.scenarios) {
      lines.push(`### ${s.label} (${s.frames ?? 0} frames)`, '', `Frames: ${s.data ?? 'none'}; screenshot: ${s.screenshot ?? 'none'}; six-frame filmstrip: ${s.filmstrip ?? 'none'}`, '')
      for (const f of s.flags) {
        const emptyCenter = f.flag === 'tooltip' && /pie|radial-bar|sunburst/.test(f.numbers.seriesTypes?.join(' ') ?? '') && !f.numbers.hit?.series
        const hoverRetarget = f.flag === 'teleport' && f.numbers.role === 'hover-indicator' && s.label !== 'load'
        const sampledGap = f.flag === 'teleport' && f.numbers.deltaTimeMs > 100
        f.classification = r.name.startsWith('fixture') || f.numbers.readOnly || emptyCenter || hoverRetarget || sampledGap ? 'check artifact' : 'real product bug'
        f.reason = r.name.startsWith('fixture') ? 'Deliberate synthetic defect; detector positive control.' : f.numbers.readOnly ? 'Presentational custom legend, or default Legend without a hidden model/click handler. Frame geometry confirms there is no toggle to animate.' : emptyCenter ? 'Pointer hit SVG whitespace or center text, not a data sector. Item tooltips correctly remain hidden; pointer, hit target and chart geometry are recorded.' : hoverRetarget ? 'ActiveDot intentionally retargets cx/cy to the hovered datum immediately; only radius/opacity animate (animation/ActiveDot.tsx). This is a pointer selection change, not series geometry.' : sampledGap ? 'Consecutive samples are more than 100 ms apart; the jump cannot establish a one-frame product teleport. Inspect the video and recorded deltaTimeMs.' : 'Observed contract violation; raw frame data contains the measured change. Requires maintainer review before changing product code.'
        lines.push(`- **${f.flag} — ${f.classification}**: chart ${f.chart}, frame ${f.t}, shape ${f.shape}. ${f.reason} Numbers: \`${JSON.stringify(f.numbers)}\`. Evidence: ${s.data ?? r.video}, ${s.filmstrip ?? s.screenshot ?? r.video}.`)
      }
      if (!s.flags.length)
        lines.push('No flags.')
      lines.push('')
    }
  }
  await writeFile(join(evidence, 'findings.md'), `${lines.join('\n')}\n`)
  await writeFile(join(evidence, 'results.json'), JSON.stringify({ fixturePassed, results }, null, 2))
  const productFlags = results.filter(r => !r.name.startsWith('fixture')).flatMap(r => r.scenarios.flatMap(s => s.flags))
  if (!fixturePassed || productFlags.some(f => f.classification === 'real product bug'))
    process.exitCode = 1
}
