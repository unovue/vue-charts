import { renderToString } from 'vue/server-renderer'
import { describe, expect, it, vi } from 'vitest'
import { createApp, createSSRApp, nextTick } from 'vue'
import { Area, Bar, ComposedChart, Line, XAxis, YAxis } from '@/index'

const data = [{ name: 'Alpha', value: 10 }, { name: 'Beta', value: 20 }]

// Default props: animations are ON. Content that is already visible must not animate in.
function render() {
  return (
    <ComposedChart width={400} height={300} data={data}>
      <XAxis dataKey="name" />
      <YAxis />
      <Area dataKey="value" />
      <Bar dataKey="value" />
      <Line dataKey="value" />
    </ComposedChart>
  )
}

// Series that do not change the axis padding: server and client agree on geometry.
function renderLines() {
  return (
    <ComposedChart width={400} height={300} data={data}>
      <XAxis dataKey="name" />
      <YAxis />
      <Area dataKey="value" />
      <Line dataKey="value" />
    </ComposedChart>
  )
}

function parse(html: string) {
  const container = document.createElement('div')
  container.innerHTML = html
  return container
}

function geometry(container: HTMLElement) {
  return {
    bars: Array.from(container.querySelectorAll('.v-charts-bar-rectangle path'), p => p.getAttribute('d')),
    lineDrawn: container.querySelector('.v-charts-line-curve')?.getAttribute('stroke-dasharray') ?? 'complete',
    lineVisible: container.querySelector('.v-charts-line-curve') != null,
    area: container.querySelector('.v-charts-area-area')?.getAttribute('d') ?? null,
  }
}

describe('entrance animation and server rendering', () => {
  it('renders the final chart on the server with animations enabled', async () => {
    const shown = geometry(parse(await renderToString(createSSRApp({ render }))))
    expect(shown.bars).toHaveLength(2)
    expect(shown.area).not.toBeNull()
    // Lines draw themselves after hydration, like Recharts; the server sends them undrawn.
    expect(shown.lineVisible).toBe(true)
    expect(shown.lineDrawn).toBe('0 1')
  })

  it('keeps hydrated content in place and lets the line draw itself', async () => {
    const render = renderLines
    const html = await renderToString(createSSRApp({ render }))
    const container = parse(html)
    document.body.append(container)
    const app = createSSRApp({ render })
    app.mount(container)
    await nextTick()
    await new Promise(resolve => requestAnimationFrame(resolve))
    await nextTick()
    const server = geometry(parse(html))
    const hydrated = geometry(container)
    expect(hydrated.area).toBe(server.area)
    // Drawing has just begun.
    expect(Number(hydrated.lineDrawn.split(' ')[0])).toBeLessThan(0.1)
    app.unmount()
    container.remove()
  })

  // Vue mounts depth-first: without deferring geometry, the Area would be laid out before the
  // later-declared Bar registers its band padding.
  it('lays out a series with the padding of later-declared bars on the first render', async () => {
    const html = await renderToString(createSSRApp({ render }))
    const area = parse(html).querySelector('.v-charts-area-area')!.getAttribute('d')
    expect(area).toBe('M147.5,135L312.5,5L312.5,265L147.5,265Z')
  })

  it('keeps the ordering fix on every server render, not only the first', async () => {
    const areaOnly = () => (
      <ComposedChart width={400} height={300} data={data}>
        <XAxis dataKey="name" />
        <YAxis />
        <Area dataKey="value" />
      </ComposedChart>
    )
    await renderToString(createSSRApp({ render: areaOnly }))
    const html = await renderToString(createSSRApp({ render }))
    expect(parse(html).querySelector('.v-charts-area-area')!.getAttribute('d')).toBe('M147.5,135L312.5,5L312.5,265L147.5,265Z')
  })

  it('hydrates a series declared before a bar without warnings or layout change', async () => {
    const html = await renderToString(createSSRApp({ render }))
    const container = parse(html)
    document.body.append(container)
    const warn = vi.spyOn(console, 'warn')
    const app = createSSRApp({ render })
    app.mount(container)
    await new Promise(resolve => setTimeout(resolve, 0))
    await new Promise(resolve => requestAnimationFrame(resolve))
    await nextTick()
    expect(warn).not.toHaveBeenCalled()
    expect(container.querySelector('.v-charts-area-area')!.getAttribute('d')).toBe('M147.5,135L312.5,5L312.5,265L147.5,265Z')
    app.unmount()
    container.remove()
    warn.mockRestore()
  })

  it('still animates a chart that is first rendered on the client', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const app = createApp({ render })
    app.mount(container)
    await nextTick()
    // motion-v does not advance in JSDOM: an entering chart stays at its start frame.
    const start = geometry(container)
    expect(start.bars).toHaveLength(0)
    expect(start.lineDrawn).toBe('0 1')
    app.unmount()
    container.remove()
    vi.restoreAllMocks()
  })
})
