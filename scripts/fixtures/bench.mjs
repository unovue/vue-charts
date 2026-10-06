import { compareSamples } from '#bench-verdict'
import { createApp, h, nextTick, ref } from 'vue'
import { Bar, BarChart, CalendarHeatmap, Heatmap, Line, LineChart, XAxis, YAxis } from '#bench-library'

let inject = false
let cpuFrame = 0
const host = document.getElementById('app')
const frame = () => new Promise(requestAnimationFrame)
async function flush() {
  await nextTick()
  await nextTick()
  host.getBoundingClientRect()
  host.querySelector('svg')?.getBoundingClientRect()
}
function dataFor(kind, n, phase = 0) {
  return Array.from({ length: n }, (_, i) => {
    const value = 1 + (i * 7 + phase * 19) % 97
    if (kind === 'Heatmap')
      return { x: i % 24, y: Math.floor(i / 24), value: phase + 1 }
    if (kind === 'CalendarHeatmap')
      return { date: new Date(Date.UTC(2025, 0, 1) + i * 86400000).toISOString().slice(0, 10), value: phase + 1 }
    return { name: String(i), value }
  })
}
function fixture(kind, n) {
  const data = ref(dataFor(kind, n))
  const active = ref(false)
  const component = { LineChart, BarChart, Heatmap, CalendarHeatmap }[kind]
  const cartesian = kind === 'LineChart' || kind === 'BarChart'
  const app = createApp({
    render: () => h(component, {
      width: 900,
      height: 400,
      data: data.value,
      isAnimationActive: active.value,
      ...(!cartesian ? { max: 2, colors: ['white', 'orange', 'navy'] } : {}),
      ...(kind === 'CalendarHeatmap' ? { start: '2025-01-01', end: '2025-12-31' } : {}),
    }, cartesian
      ? { default: () => [
          h(XAxis, { dataKey: 'name', interval: 'preserveStartEnd' }),
          h(YAxis),
          h(kind === 'LineChart' ? Line : Bar, { dataKey: 'value', isAnimationActive: active.value, ...(kind === 'LineChart' ? { dot: true } : {}) }),
        ] }
      : undefined),
  })
  return { app, data, active }
}
function observe(kind, n, phase = 0) {
  const selector = kind === 'LineChart' ? '.v-charts-line-dot' : kind === 'BarChart' ? '.v-charts-bar-rectangle' : '[data-slot="cell"], .v-charts-cell'
  const nodes = [...host.querySelectorAll(selector)]
  if (nodes.length !== n)
    throw new Error(`${kind}: expected ${n} shapes, got ${nodes.length}`)
  if (/NaN|Infinity/.test(host.querySelector('svg')?.outerHTML ?? ''))
    throw new Error(`${kind}: non-finite rendered geometry`)
  if (kind === 'LineChart') {
    const coordinates = nodes.map((node) => {
      const circle = node.matches('circle') ? node : node.querySelector('circle')
      if (!circle || ['cx', 'cy'].some(key => !circle.hasAttribute(key) || !Number.isFinite(Number(circle.getAttribute(key)))))
        throw new Error('LineChart: missing or invalid dot coordinates')
      return circle.getAttribute('cy')
    })
    return [host.querySelector('.v-charts-line-curve')?.getAttribute('d'), ...coordinates]
  }
  if (kind === 'BarChart')
    return nodes.map(node => (node.matches('path') ? node : node.querySelector('path'))?.getAttribute('d'))
  return nodes.map((node) => {
    const rect = node.querySelector('.v-charts-cell-rect')
    if (!rect || ['x', 'y', 'width', 'height'].some(key => !rect.hasAttribute(key) || !Number.isFinite(Number(rect.getAttribute(key)))) || Number(rect.getAttribute('width')) <= 0 || Number(rect.getAttribute('height')) <= 0)
      throw new Error(`${kind}: missing or invalid cell rectangle`)
    if (!node.getAttribute('aria-label')?.endsWith(`: ${phase + 1}`) || rect.style.fill !== (phase === 0 ? 'orange' : 'navy'))
      throw new Error(`${kind}: wrong cell value or fill in phase ${phase}`)
    return `${node.getAttribute('aria-label')}|${rect.style.fill}`
  })
}
function changed(kind, before, after) {
  if (before.length !== after.length || before.some((value, i) => !value || !after[i] || value === after[i]))
    throw new Error(`${kind}: intended all-values update did not change every observed shape/value`)
}
function busyWait(ms) {
  const started = performance.now()
  while (performance.now() - started < ms) { /* Deliberate CPU work proves the regression gate. */ }
  return performance.now() - started
}
function geometry(kind) {
  const node = host.querySelector(kind === 'LineChart' ? '.v-charts-line-curve' : '.v-charts-bar-rectangle')
  return (node?.matches('path') ? node : node?.querySelector('path'))?.getAttribute('d')
}

window.vccsBench = {
  verdict({ errors, summary, runs, sameBuild, selfTest }) {
    const acceptable = !errors.length && summary.length === 18 && summary.every(row => row.verdict !== 'FAIL')
    const inconclusive = acceptable && summary.some(row => row.verdict === 'INCONCLUSIVE')
    const passed = acceptable && !inconclusive
    const selfTestVerified = selfTest && !errors.length && summary.length === 18
      && summary.some(row => row.verdict === 'FAIL') && runs.filter(r => r.side === 'B').every(r =>
      r.mode === 'static' ? r.mountInjectedMs > 0 && r.updateInjectedMs > 0 : r.injectedMs > 0)
    return { passed, acceptable, inconclusive, selfTestVerified }
  },
  summarize({ runs, cases, compare, sameBuild }) {
    const summary = []
    for (const entry of cases) {
      for (const metric of entry.mode === 'static' ? ['mountMs', 'updateMs'] : ['cpuMsPerFrame']) {
        const values = side => runs.filter(r => r.side === side && r.kind === entry.kind
          && r.n === entry.n && r.mode === entry.mode).map(r => r[metric])
        const samples = values('B')
        const comparison = compareSamples(compare ? values('A') : samples, samples, sameBuild)
        summary.push({ ...entry, metric, ...comparison })
      }
    }
    return summary
  },
  configure(enabled, frameCost) {
    inject = enabled
    cpuFrame = frameCost
  },
  async static(kind, n) {
    const { app, data } = fixture(kind, n)
    try {
      await frame()
      const started = performance.now()
      app.mount(host)
      await flush()
      const mountInjectedMs = inject ? busyWait((performance.now() - started) * 0.3) : 0
      const mountMs = performance.now() - started
      const before = observe(kind, n)
      const next = dataFor(kind, n, 1)
      await frame()
      const updated = performance.now()
      data.value = next
      await flush()
      const updateInjectedMs = inject ? busyWait((performance.now() - updated) * 0.3) : 0
      const updateMs = performance.now() - updated
      await frame()
      const updateToRafMs = performance.now() - updated
      changed(kind, before, observe(kind, n, 1))
      return { mountMs, updateMs, updateToRafMs, mountInjectedMs, updateInjectedMs, shapes: n }
    }
    finally {
      app.unmount()
      await flush()
      await frame()
    }
  },
  async prepareAnimated(kind, n) {
    this.animated = fixture(kind, n)
    this.animated.app.mount(host)
    await flush()
    observe(kind, n)
    this.animated.active.value = true
    await flush()
    // Settle activation before measuring changed-data updates, excluding entrance CPU.
    await new Promise(resolve => setTimeout(resolve, 2200))
    this.animated.before = observe(kind, n)
    this.animated.beforeGeometry = geometry(kind)
  },
  async animatedUpdate(kind, n) {
    const busyMsPerFrame = inject ? cpuFrame * 0.3 : 0
    const next = dataFor(kind, n, 1)
    const times = []
    let running = true
    let injectedMs = 0
    const tick = (time) => {
      if (!running)
        return
      times.push(time)
      if (busyMsPerFrame)
        injectedMs += busyWait(busyMsPerFrame)
      requestAnimationFrame(tick)
    }
    await frame()
    requestAnimationFrame(tick)
    const started = performance.now()
    this.animated.data.value = next
    await flush()
    const initialUpdateMs = performance.now() - started
    this.animated.immediateGeometry = geometry(kind)
    await new Promise(resolve => setTimeout(resolve, 200))
    this.animated.middleGeometry = geometry(kind)
    await new Promise(resolve => setTimeout(resolve, 500))
    running = false
    await frame()
    await flush()
    return { initialUpdateMs, frames: times.length, intervals: times.slice(1).map((time, i) => time - times[i]), windowMs: performance.now() - started, injectedMs }
  },
  validateAnimated(kind, n) {
    changed(kind, this.animated.before, observe(kind, n, 1))
    const final = geometry(kind)
    const { beforeGeometry: before, immediateGeometry: immediate, middleGeometry: middle } = this.animated
    if (!before || !middle || !final || middle === before || middle === final || immediate === final)
      throw new Error(`${kind}: changed-data update snapped or produced no intermediate motion`)
    return { motionObserved: true, geometrySample: { before: before.slice(0, 150), immediate: immediate?.slice(0, 150), middle: middle.slice(0, 150), final: final.slice(0, 150) } }
  },
  async endAnimated() {
    this.animated?.app.unmount()
    this.animated = undefined
    await flush()
    await frame()
  },
}
