import { writeFileSync } from 'node:fs'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it, vi } from 'vitest'
import { createApp, createSSRApp, nextTick, ref } from 'vue'
import { flushPromises } from '@vue/test-utils'
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Sankey, SunburstChart, Treemap, XAxis, YAxis } from '@/index'
import { MockResizeObserver } from '@/test/MockResizeObserver'

const data = [{ name: 'Alpha', value: 10 }, { name: 'Beta', value: 20 }]
function chart(props = {}) {
  return (
    <BarChart data={data} {...props}>
      <XAxis dataKey="name" />
      <YAxis />
      <Bar dataKey="value" isAnimationActive={false} />
    </BarChart>
  )
}

describe('responsive server rendering', () => {
  it.each([
    ['default', () => chart(), '0 0 640 360'],
    ['container', () => <ResponsiveContainer height={300}>{chart()}</ResponsiveContainer>, '0 0 640 360'],
    ['aspect', () => chart({ aspect: 2 }), '0 0 640 320'],
    ['initialDimension', () => <ResponsiveContainer initialDimension={{ width: 700, height: 350 }}>{chart()}</ResponsiveContainer>, '0 0 700 350'],
  ])('renders full SVG for %s', async (name, render, viewBox) => {
    const html = await renderToString(createSSRApp({ render }))
    if (name === 'default' && process.env.S08_EVIDENCE)
      writeFileSync(process.env.S08_EVIDENCE, html)
    expect(html).toContain('<svg')
    expect(html).toContain(`viewBox="${viewBox}"`)
    const rendered = document.createElement('div')
    rendered.innerHTML = html
    expect(rendered.querySelectorAll('.v-charts-bar-rectangle path')).toHaveLength(2)
    expect(html).toContain('Alpha')
    expect(html).toContain('Beta')
  })

  it('hydrates without warnings and relays out bars after measurement', async () => {
    class DeferredObserver extends MockResizeObserver {
      observe() {}
    }
    MockResizeObserver.instances = []
    vi.stubGlobal('ResizeObserver', DeferredObserver)
    const render = () => chart()
    const html = await renderToString(createSSRApp({ render }))
    const container = document.createElement('div')
    container.innerHTML = html
    document.body.append(container)
    const warnings = vi.spyOn(console, 'warn')
    const errors = vi.spyOn(console, 'error')
    const app = createSSRApp({ render })
    app.mount(container)
    await flushPromises()
    await nextTick()
    expect(warnings).not.toHaveBeenCalled()
    expect(errors).not.toHaveBeenCalled()
    const before = container.querySelector('.v-charts-bar-rectangle path')!.outerHTML
    // Shown only at its real size: the server's guessed size would draw a squashed chart.
    const box = container.querySelector('svg')!.parentElement as HTMLElement
    expect(box.style.visibility).toBe('hidden')
    MockResizeObserver.instances.at(-1)!.trigger(800, 400)
    await nextTick()
    // Shown a frame later, once layout that follows the size has caught up.
    expect(box.style.visibility).toBe('hidden')
    await new Promise(resolve => requestAnimationFrame(resolve))
    await nextTick()
    expect(box.style.visibility).toBe('')
    expect(container.querySelector('svg')!.getAttribute('width')).toBe('800')
    expect(container.querySelector('svg')!.getAttribute('viewBox')).toBe('0 0 800 400')
    expect(container.querySelector('.v-charts-bar-rectangle path')!.outerHTML).not.toBe(before)
    app.unmount()
    container.remove()
  })
})

// A hydrated chart is already on screen at the initial size; sliding from there to the measured
// size drew the line and ticks far outside a narrow box for half a second. An update that is
// still animating when the size arrives (axis offsets settling after mount) must not count as
// the entrance either.
it('snaps hydrated geometry to the first measured size', async () => {
  class DeferredObserver extends MockResizeObserver {
    observe() {}
  }
  MockResizeObserver.instances = []
  vi.stubGlobal('ResizeObserver', DeferredObserver)
  const rows = ref(data)
  const render = () => (
    <LineChart data={rows.value}>
      <XAxis dataKey="name" />
      <Line dataKey="value" />
      <Bar dataKey="value" />
    </LineChart>
  )
  const container = document.createElement('div')
  container.innerHTML = await renderToString(createSSRApp({ render }))
  document.body.append(container)
  const app = createSSRApp({ render })
  app.mount(container)
  await flushPromises()
  await nextTick()
  rows.value = [...data, { name: 'Gamma', value: 15 }]
  await nextTick()
  MockResizeObserver.instances.at(-1)!.trigger(320, 250)
  await nextTick()
  await nextTick()
  const xs = (container.querySelector('.v-charts-line-curve')!.getAttribute('d')!.match(/[ML]\s*(-?[\d.]+)/g) ?? []).map(part => Number(part.slice(1)))
  expect(Math.max(...xs)).toBeLessThanOrEqual(320)
  const ticks = [...container.querySelectorAll('.v-charts-cartesian-axis-tick-value')].map(tick => Number(tick.getAttribute('x')))
  expect(ticks.length).toBeGreaterThan(0)
  expect(Math.max(...ticks)).toBeLessThanOrEqual(320)
  app.unmount()
  container.remove()
})

// A scrollbar appearing while a line draws itself resized the chart and snapped the line to
// fully drawn in one frame. A resize moves the line but lets it keep drawing.
it('keeps drawing a line through a resize during its entrance', async () => {
  MockResizeObserver.instances = []
  vi.stubGlobal('ResizeObserver', MockResizeObserver)
  const container = document.createElement('div')
  document.body.append(container)
  const app = createApp({ render: () => (
    <LineChart data={data}>
      <XAxis dataKey="name" />
      <Line dataKey="value" />
    </LineChart>
  ) })
  app.mount(container)
  await nextTick()
  MockResizeObserver.instances.at(-1)!.trigger(400, 300)
  await nextTick()
  MockResizeObserver.instances.at(-1)!.trigger(380, 300)
  await nextTick()
  await nextTick()
  const curve = container.querySelector('.v-charts-line-curve')!
  expect(curve.getAttribute('stroke-dasharray')).not.toBeNull()
  const xs = (curve.getAttribute('d')!.match(/[ML]\s*(-?[\d.]+)/g) ?? []).map(part => Number(part.slice(1)))
  expect(Math.max(...xs)).toBeLessThanOrEqual(380)
  app.unmount()
  container.remove()
})

// These charts use separate layout engines but must share the public sizing contract.
describe('specialized responsive charts', () => {
  it.each([
    ['Sankey', () => <Sankey data={{ nodes: [{ name: 'A' }, { name: 'B' }], links: [{ source: 0, target: 1, value: 10 }] }} isAnimationActive={false} />, '.v-charts-sankey-node rect'],
    ['Treemap', () => <Treemap data={[{ name: 'A', value: 10 }, { name: 'B', value: 20 }]} isAnimationActive={false} />, '.v-charts-treemap rect'],
    ['Sunburst', () => <SunburstChart data={{ name: 'root', children: [{ name: 'A', value: 10 }, { name: 'B', value: 20 }] }} isAnimationActive={false} />, '.v-charts-sunburst-sector'],
  ])('renders and hydrates %s at initial geometry, then resizes', async (_name, render, selector) => {
    class DeferredObserver extends MockResizeObserver {
      observe() {}
    }
    MockResizeObserver.instances = []
    vi.stubGlobal('ResizeObserver', DeferredObserver)
    const html = await renderToString(createSSRApp({ render }))
    expect(html).toContain('viewBox="0 0 640 360"')
    const container = document.createElement('div')
    container.innerHTML = html
    document.body.append(container)
    expect(container.querySelectorAll(selector)).toHaveLength(2)
    const warnings = vi.spyOn(console, 'warn')
    const errors = vi.spyOn(console, 'error')
    const app = createSSRApp({ render })
    app.mount(container)
    await nextTick()
    expect(warnings).not.toHaveBeenCalled()
    expect(errors).not.toHaveBeenCalled()
    const before = container.querySelector(selector)!.outerHTML
    MockResizeObserver.instances.at(-1)!.trigger(800, 400)
    await nextTick()
    expect(container.querySelector('svg')!.getAttribute('viewBox')).toBe('0 0 800 400')
    expect(container.querySelector(selector)!.outerHTML).not.toBe(before)
    app.unmount()
    container.remove()
  })
})

// The most common sizing: a fixed height, the width follows the container.
describe('one fixed dimension', () => {
  it('keeps a fixed height while the width follows the box', async () => {
    class DeferredObserver extends MockResizeObserver {
      observe() {}
    }
    MockResizeObserver.instances = []
    vi.stubGlobal('ResizeObserver', DeferredObserver)
    const render = () => chart({ height: 300 })
    const html = await renderToString(createSSRApp({ render }))
    expect(html).toContain('viewBox="0 0 640 300"')
    const container = document.createElement('div')
    container.innerHTML = html
    document.body.append(container)
    const app = createSSRApp({ render })
    app.mount(container)
    await nextTick()
    const wrapper = container.querySelector<HTMLElement>('.v-charts-wrapper')!
    expect(wrapper.style.height).toBe('300px')
    expect(wrapper.style.width).toBe('100%')
    MockResizeObserver.instances.at(-1)!.trigger(800, 0)
    await nextTick()
    expect(container.querySelector('svg')!.getAttribute('viewBox')).toBe('0 0 800 300')
    app.unmount()
    container.remove()
  })
})

// A measured chart below the viewport retained its server-width entrance geometry until
// intersection. Even hidden fallback SVGs must not enlarge the page's scrollable area.
it('relays out an unseen hydrated entrance before revealing its measured box', async () => {
  class DeferredObserver extends MockResizeObserver {
    observe() {}
  }
  vi.stubGlobal('ResizeObserver', DeferredObserver)
  vi.stubGlobal('IntersectionObserver', class {
    observe() {}
    disconnect() {}
  })
  const render = () => <LineChart data={data}><Line dataKey="value" /></LineChart>
  const container = document.createElement('div')
  container.innerHTML = await renderToString(createSSRApp({ render }))
  document.body.append(container)
  const app = createSSRApp({ render })
  app.mount(container)
  await flushPromises()
  const box = container.querySelector<HTMLElement>('.v-charts-wrapper')!
  expect(box.style.visibility).toBe('hidden')
  expect(box.style.overflow).toBe('hidden')
  MockResizeObserver.instances.at(-1)!.trigger(320, 250)
  await nextTick()
  await new Promise(resolve => requestAnimationFrame(resolve))
  await nextTick()
  expect(box.style.visibility).toBe('')
  expect(box.style.overflow).toBe('')
  const curve = container.querySelector('.v-charts-line-curve')!
  expect(curve.getAttribute('d')).toBe('M5,125L315,5')
  expect(curve.getAttribute('stroke-dasharray')).toBe('0 1')
  app.unmount()
  container.remove()
  vi.unstubAllGlobals()
})
