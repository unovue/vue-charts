import { writeFileSync } from 'node:fs'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it, vi } from 'vitest'
import { createSSRApp, nextTick } from 'vue'
import { flushPromises } from '@vue/test-utils'
import { Bar, BarChart, ResponsiveContainer, Sankey, SunburstChart, Treemap, XAxis, YAxis } from '@/index'
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
    MockResizeObserver.instances.at(-1)!.trigger(800, 400)
    await nextTick()
    expect(container.querySelector('svg')!.getAttribute('width')).toBe('800')
    expect(container.querySelector('svg')!.getAttribute('viewBox')).toBe('0 0 800 400')
    expect(container.querySelector('.v-charts-bar-rectangle path')!.outerHTML).not.toBe(before)
    app.unmount()
    container.remove()
  })
})

// These charts use separate layout engines but must share the public sizing contract.
describe('specialized responsive charts', () => {
  it.each([
    ['Sankey', () => <Sankey data={{ nodes: [{ name: 'A' }, { name: 'B' }], links: [{ source: 0, target: 1, value: 10 }] }} isAnimationActive={false} />, '.v-charts-sankey-node rect'],
    ['Treemap', () => <Treemap data={[{ name: 'A', value: 10 }, { name: 'B', value: 20 }]} isAnimationActive={false} />, '.v-charts-treemap rect'],
    ['Sunburst', () => <SunburstChart data={{ name: 'root', children: [{ name: 'A', value: 10 }, { name: 'B', value: 20 }] }} />, '.v-charts-sunburst-sector'],
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
