// Filmstrips of chart transitions on a fake clock: every frame captured, numeric flags for pops,
// jumps, late snaps, path topology changes and invalid attributes, plus contact sheets.
// pnpm motion:film [scenario...] [--steps=a,b] [--every=3] [--out=dir] [--window=900] [--browser=…]
/* eslint-disable no-console -- command-line output is the interface of these tools */
import { execFileSync } from 'node:child_process'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { installHTMLGeometry } from './html-geometry.mjs'
import { FRAME, advanceFrame, collectErrors, flag, launchBrowser, positional, repo, startServer } from './shared.mjs'

const dark = process.argv.includes('--dark')
const every = Number(flag('every', 3))
const out = flag('out', join(repo, '.evidence/motion-film'))
const WINDOW = Number(flag('window', 900))
const all = ['brush', 'bar', 'barStacked', 'barHorizontal', 'barNegative', 'line', 'lineMonotone', 'area', 'areaStacked', 'composed', 'scatter', 'pie', 'donut', 'radar', 'radial', 'funnel', 'treemap', 'sankey', 'journey', 'sunburst', 'resize']
const scenarios = positional()
const only = flag('steps', '')

// Runs in the page: every drawn shape with a stable identity and its numeric geometry.
function capture() {
  const keyOf = (el) => {
    const parts = []
    for (let n = el; n && n.tagName !== 'svg'; n = n.parentElement) {
      if (n.__vnode?.key != null)
        parts.push(String(n.__vnode.key))
      // Keys on components (Layer, Rectangle) live on the component vnode whose root is n.
      for (let c = n.__vueParentComponent; c && c.subTree?.el === n; c = c.parent) {
        if (c.vnode.key != null)
          parts.push(String(c.vnode.key))
      }
    }
    return parts.reverse().join('/')
  }
  const shapes = {}
  const counts = {}
  const svgs = [...document.querySelectorAll('svg.v-charts-surface')]
  const bad = []
  for (const el of svgs.flatMap(svg => [...svg.querySelectorAll('rect,path,circle,polygon,line,text,g[transform]')])) {
    if (el.closest('defs, clipPath'))
      continue
    const cls = el.getAttribute('class') || ''
    if (/axis|grid|legend|tick|recharts-layer$/.test(cls) && !/curve|area|bar|sector|dot/.test(cls))
      continue
    const surface = svgs.indexOf(el.ownerSVGElement)
    const prefix = surface > 0 ? `svg${surface}/` : ''
    const base = `${prefix}${el.tagName}.${cls.split(' ')[0]}#${keyOf(el)}`
    counts[base] = (counts[base] ?? 0) + 1
    const id = `${base}@${counts[base]}`
    const attrs = {}
    for (const name of ['x', 'y', 'width', 'height', 'cx', 'cy', 'r', 'd', 'points', 'transform', 'stroke-width', 'opacity', 'fill-opacity', 'x1', 'x2', 'y1', 'y2']) {
      const v = el.getAttribute(name)
      if (v == null)
        continue
      if (/NaN|Infinity|undefined/.test(v))
        bad.push(`${id} ${name}=${v.slice(0, 80)}`)
      attrs[name] = v
    }
    if (el.tagName === 'text') {
      attrs.text = el.textContent
      let o = 1
      for (let n = el; n && n.tagName !== 'svg'; n = n.parentElement)
        o *= Number(getComputedStyle(n).opacity)
      attrs.opacity = String(o)
    }
    shapes[id] = attrs
  }
  for (const [id, attrs] of Object.entries(window.__htmlGeometry())) {
    shapes[id] = attrs
    for (const [name, value] of Object.entries(attrs)) {
      if (/NaN|Infinity|undefined/.test(value))
        bad.push(`${id} ${name}=${value}`)
    }
  }
  const tip = document.querySelector('[role="tooltip"]')
  if (tip)
    shapes.tooltip = { transform: tip.style.transform, visibility: tip.style.visibility, opacity: getComputedStyle(tip).opacity }
  return { shapes, bad }
}

const nums = s => (String(s).match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi) || []).map(Number)

function analyse(frames) {
  const issues = []
  const ids = new Set(frames.flatMap(f => Object.keys(f.shapes)))
  for (const f of frames) {
    for (const b of f.bad)
      issues.push(`invalid @${f.t}ms ${b}`)
  }
  let lastChange = 0
  for (const id of ids) {
    if (id === 'tooltip')
      continue
    const present = frames.map(f => f.shapes[id])
    const firstIdx = present.findIndex(Boolean)
    const lastIdx = present.length - 1 - [...present].reverse().findIndex(Boolean)
    for (const attr of ['d', 'points', 'x', 'y', 'width', 'height', 'cx', 'cy', 'r', 'transform', 'stroke-width', 'opacity']) {
      const series = present.map(s => s?.[attr])
      if (series.every(v => v == null))
        continue
      // Path topology must not change mid-transition (morphs between different command lists flicker).
      const shapesOf = series.filter(v => v != null).map(v => attr === 'd' ? v.replace(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi, '#') : String(nums(v).length))
      const topo = new Set(shapesOf)
      if (topo.size > 2)
        issues.push(`topology ${id} ${attr}: ${topo.size} different command shapes`)
      // Per-frame displacement: max abs change over all numbers.
      const deltas = []
      for (let i = 1; i < series.length; i++) {
        const a = series[i - 1]
        const b = series[i]
        if (a == null || b == null) {
          deltas.push(null)
          continue
        }
        const na = nums(a)
        const nb = nums(b)
        if (na.length !== nb.length) {
          deltas.push(null)
          continue
        }
        deltas.push(Math.max(0, ...na.map((v, k) => Math.abs(v - nb[k]))))
      }
      deltas.forEach((d, i) => {
        if (d && d > 0.05)
          lastChange = Math.max(lastChange, frames[i + 1].t)
      })
      // A spike: a frame moves much more than the frame before it (after motion has started).
      for (let i = 2; i < deltas.length; i++) {
        const prev = deltas[i - 1]
        const d = deltas[i]
        if (d == null || prev == null)
          continue
        const scale = attr === 'opacity' ? 0.15 : 4
        if (d > scale && d > prev * 2.5 && prev > 0.01)
          issues.push(`spike ${id} ${attr} @${frames[i + 1].t}ms: ${prev.toFixed(2)} -> ${d.toFixed(2)}`)
        if (d > scale && prev <= 0.01 && i > 2 && deltas.slice(0, i).some(x => x > 0.01))
          issues.push(`restart/jump ${id} ${attr} @${frames[i + 1].t}ms: still -> ${d.toFixed(2)}`)
      }
      // Late snap: the last movement is large.
      const moving = deltas.map((d, i) => [d, i]).filter(([d]) => d && d > 0.01)
      if (moving.length > 3) {
        const [dl] = moving.at(-1)
        if (dl > (attr === 'opacity' ? 0.1 : 3))
          issues.push(`late snap ${id} ${attr}: final frame moves ${dl.toFixed(2)}`)
      }
    }
    // Pop in / pop out: element appears or vanishes at nearly full size.
    const size = s => s ? (Number(s.width ?? 0) * Number(s.height ?? 0)) || Number(s.r ?? 0) || (s.d ? s.d.length : 0) : 0
    if (firstIdx > 0 && !/text/.test(id)) {
      const first = present[firstIdx]
      const final = present[lastIdx]
      const op = Number(first.opacity ?? 1)
      if (first.d == null && size(first) > 0.6 * size(final) && size(final) > 4 && op > 0.6)
        issues.push(`pop-in ${id} @${frames[firstIdx].t}ms at ${Math.round(100 * size(first) / size(final))}% size`)
    }
    if (lastIdx < frames.length - 1 && firstIdx >= 0 && !/text/.test(id)) {
      const lastSeen = present[lastIdx]
      const max = Math.max(...present.filter(Boolean).map(size))
      const op = Number(lastSeen.opacity ?? 1)
      if (lastSeen.d == null && size(lastSeen) > 0.3 * max && max > 4 && op > 0.3)
        issues.push(`pop-out ${id} @${frames[lastIdx].t}ms at ${Math.round(100 * size(lastSeen) / max)}% size`)
    }
    if (firstIdx > 0 && /text/.test(id) && Number(present[firstIdx].opacity ?? 1) > 0.9)
      issues.push(`text pop-in ${id} "${present[firstIdx].text}" @${frames[firstIdx].t}ms`)
  }
  const before = Object.keys(frames[0].shapes).length
  const after = Object.keys(frames.at(-1).shapes).length
  return { issues, settledAt: lastChange, shapes: `${before}->${after}` }
}

async function film(page, name, dir, action, pointer, perFrame) {
  const frames = []
  const shots = []
  const box = await page.locator('.frame').boundingBox()
  if (action)
    await page.evaluate(action)
  if (pointer)
    await pointer()
  // One sample per fake-clock animation frame; see advanceFrame in shared.mjs.
  for (let t = 0, i = 0; t <= WINDOW; t += FRAME, i++) {
    const snap = await page.evaluate(capture)
    frames.push({ t: Math.round(t), ...snap })
    if (i % every === 0) {
      const file = join(dir, `${name}-${String(i).padStart(3, '0')}.png`)
      await page.screenshot({ path: file, clip: box })
      shots.push(file)
    }
    if (perFrame)
      await perFrame()
    await advanceFrame(page)
  }
  const sheet = join(out, `${dir.split('/').at(-1)}__${name}.png`)
  const cols = 5
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', '1', '-pattern_type', 'glob', '-i', join(dir, `${name}-*.png`), '-vf', `scale=iw/2:-1,tile=${cols}x${Math.ceil(shots.length / cols)}:padding=4:color=red`, '-frames:v', '1', sheet], { stdio: 'pipe' })
  return { ...analyse(frames), sheet, frames }
}

const browser = await launchBrowser()
let server
try {
  server = await startServer()
  const url = server.url

  mkdirSync(out, { recursive: true })
  const report = {}
  for (const s of scenarios.length ? scenarios : all) {
    const dir = join(out, '_frames', s + (dark ? '-dark' : ''))
    rmSync(dir, { recursive: true, force: true })
    mkdirSync(dir, { recursive: true })
    const page = await browser.newPage({ viewport: { width: 800, height: s === 'journey' ? 560 : 480 }, deviceScaleFactor: 1, colorScheme: dark ? 'dark' : 'light' })
    const errors = collectErrors(page)
    await page.addInitScript(installHTMLGeometry)
    await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') })
    await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'))
    await page.goto(`${url}?s=${s}${dark ? '&dark=1' : ''}`, { timeout: 120000 })
    await page.waitForSelector('svg.v-charts-surface, .v-charts-bar-list', { state: 'attached', timeout: 120000 })
    // Responsive charts reveal their measured layout on rAF; the paused clock must release it.
    await advanceFrame(page)
    await page.waitForSelector('svg.v-charts-surface, .v-charts-bar-list', { timeout: 15000 })
    report[s] = { entrance: await film(page, '00-entrance', dir), errors }
    if (s === 'tooltip') {
      const box = await page.locator('.v-charts-wrapper').boundingBox()
      await page.clock.runFor(1000)
      report[s].enter = await film(page, '01-pointer-enter', dir, null, () => page.mouse.move(box.x + 150, box.y + 150))
      report[s].move = await film(page, '02-pointer-move', dir, null, () => page.mouse.move(box.x + 520, box.y + 150))
      report[s].leave = await film(page, '03-pointer-leave', dir, null, () => page.mouse.move(box.x + 520, box.y + box.height + 60))
    }
    if (s === 'brush') {
      await page.clock.runFor(1000)
      const slide = await page.locator('.v-charts-brush-slide').boundingBox()
      const sx = slide.x + slide.width / 2
      const sy = slide.y + slide.height / 2
      await page.mouse.move(sx, sy)
      await page.mouse.down()
      let n = 0
      // Drag 8 px per frame for 24 frames, then hold.
      report[s].drag = await film(page, '01-drag', dir, null, async () => {}, async () => {
        if (n < 24) {
          n++
          await page.mouse.move(sx + n * 8, sy)
        }
      })
      await page.mouse.up()
    }
    const steps = await page.evaluate(() => window.lab.steps)
    for (const [i, step] of steps.entries()) {
      if (only && !only.split(',').includes(step))
        continue
      report[s][step] = await film(page, `${String(i + 1).padStart(2, '0')}-${step}`, dir, `window.lab.step(${JSON.stringify(step)})`)
    }
    // Interrupt: two changes 150 ms apart.
    if (['values', 'fromOne', 'removeMiddle'].every(step => steps.includes(step)) && (!only || only.includes('interrupt'))) {
      await page.evaluate(() => window.lab.step('fromOne'))
      await page.clock.runFor(1000)
      await page.evaluate(() => window.lab.step('values'))
      await page.clock.runFor(150)
      report[s].interrupt = await film(page, '99-interrupt', dir, `window.lab.step('removeMiddle')`)
    }
    await page.close()
    const summary = Object.entries(report[s]).filter(([k]) => k !== 'errors').map(([k, v]) => `  ${k.padEnd(13)} settle=${String(v.settledAt).padStart(4)}ms shapes=${v.shapes} issues=${v.issues.length}${v.issues.length ? `\n${v.issues.slice(0, 12).map(x => `      - ${x}`).join('\n')}${v.issues.length > 12 ? `\n      … +${v.issues.length - 12}` : ''}` : ''}`).join('\n')
    console.log(`== ${s}${errors.length ? `  ERRORS: ${[...new Set(errors)].slice(0, 5).join(' | ')}` : ''}\n${summary}`)
  }
  writeFileSync(join(out, `report${dark ? '-dark' : ''}.json`), JSON.stringify(report, (k, v) => k === 'frames' ? undefined : v, 2))
}
finally {
  await browser.close()
  await server?.close()
}
