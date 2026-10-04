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
    line: container.querySelector('.v-charts-line-curve')?.getAttribute('stroke-dashoffset') ?? null,
    lineVisible: container.querySelector('.v-charts-line-curve') != null,
    area: container.querySelector('.v-charts-area-area')?.getAttribute('d') ?? null,
  }
}

describe('entrance animation and server rendering', () => {
  it('renders the final chart on the server with animations enabled', async () => {
    const shown = geometry(parse(await renderToString(createSSRApp({ render }))))
    expect(shown.bars).toHaveLength(2)
    expect(shown.lineVisible).toBe(true)
    expect(shown.line).toBeNull()
    expect(shown.area).not.toBeNull()
  })

  it('keeps hydrated content in place instead of replaying the entrance', async () => {
    const render = renderLines
    const html = await renderToString(createSSRApp({ render }))
    const container = parse(html)
    document.body.append(container)
    const app = createSSRApp({ render })
    app.mount(container)
    await nextTick()
    await new Promise(resolve => requestAnimationFrame(resolve))
    await nextTick()
    expect(geometry(container)).toEqual(geometry(parse(html)))
    app.unmount()
    container.remove()
  })

  // Known limitation until chart registration moves to Vue (GOAL.md Phase 2): the server and the
  // first client render compute a series before later siblings register, so an Area declared
  // before a Bar is laid out without band padding and moves after mount.
  it.fails('lays out a series with the padding of later-declared bars on the first render', async () => {
    const html = await renderToString(createSSRApp({ render }))
    const area = parse(html).querySelector('.v-charts-area-area')!.getAttribute('d')
    expect(area).toBe('M147.5,135L312.5,5L312.5,265L147.5,265Z')
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
    expect(start.line).toBe('1')
    app.unmount()
    container.remove()
    vi.restoreAllMocks()
  })
})
