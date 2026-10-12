import { describe, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent, nextTick } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { Area, AreaChart, Bar, BarChart, Label, Line, LineChart, XAxis, YAxis } from '@/index'

const data = [{ name: 'A', value: 10 }, { name: 'B', value: 20 }]
const Charts = defineComponent({
  setup() {
    return () => (
      <div>
        <BarChart width={400} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis allowDataOverflow />
          <Bar dataKey="value" isAnimationActive={false} />
          <Label value="Radial" position="insideStart" viewBox={{ cx: 100, cy: 100, innerRadius: 20, outerRadius: 40, startAngle: 0, endAngle: 90 }} />
        </BarChart>
        <LineChart width={400} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis allowDataOverflow />
          <Line dataKey="value" isAnimationActive={false} />
        </LineChart>
        <AreaChart width={400} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis allowDataOverflow />
          <Area dataKey="value" isAnimationActive={false} />
        </AreaChart>
      </div>
    )
  },
})

describe('generated DOM ids during SSR', () => {
  const createApp = (idPrefix: string) => {
    const app = createSSRApp(Charts)
    app.config.idPrefix = idPrefix
    return app
  }

  it.each(['', 'nuxt: charts.'])('renders identical HTML for separate requests with prefix "%s"', async (idPrefix) => {
    const first = await renderToString(createApp(idPrefix))
    const second = await renderToString(createApp(idPrefix))
    expect(second).toBe(first)
    const container = document.createElement('div')
    container.innerHTML = first
    const ids = Array.from(container.querySelectorAll('[id]'), node => node.id)
    expect(ids.length).toBeGreaterThanOrEqual(4)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) {
      expect(id).toMatch(/^[\w-]+$/)
    }
    for (const node of Array.from(container.querySelectorAll('[clip-path], textPath'))) {
      const reference = node.getAttribute('clip-path')?.match(/^url\(#(.+)\)$/)?.[1]
        ?? node.getAttribute('xlink:href')?.slice(1)
      expect(ids).toContain(reference)
    }
    expect(container.querySelectorAll('.v-charts-bar-rectangle')).toHaveLength(2)
    expect(container.querySelector('.v-charts-line-curve')).not.toBeNull()
    expect(container.querySelector('.v-charts-area-area')).not.toBeNull()
  })

  it.each(['', 'nuxt: charts.'])('hydrates server HTML without hydration warnings with prefix "%s"', async (idPrefix) => {
    const html = await renderToString(createApp(idPrefix))
    const container = document.createElement('div')
    container.innerHTML = html
    document.body.append(container)
    const warn = vi.spyOn(console, 'warn')
    const app = createApp(idPrefix)
    try {
      app.mount(container)
      await nextTick()
      expect(warn.mock.calls.filter(args => args.some(arg => /hydration/i.test(String(arg))))).toEqual([])
    }
    finally {
      app.unmount()
      container.remove()
    }
  })
})
