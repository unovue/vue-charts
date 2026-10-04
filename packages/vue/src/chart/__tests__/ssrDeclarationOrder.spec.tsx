import { renderToString } from 'vue/server-renderer'
import { describe, expect, it, vi } from 'vitest'
import { createApp, createSSRApp, nextTick } from 'vue'
import type { VNode } from 'vue'
import { Global } from '@/utils/Global'
import { Area, Bar, Brush, CartesianGrid, ComposedChart, ErrorBar, Funnel, FunnelChart, LabelList, Legend, Line, Pie, PieChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, RadialBar, RadialBarChart, ReferenceArea, ReferenceDot, ReferenceLine, Scatter, ScatterChart, XAxis, YAxis } from '@/index'

const data = [{ name: 'Alpha', value: 10, other: 15 }, { name: 'Beta', value: 20, other: 5 }, { name: 'Gamma', value: 15, other: 10 }]
const attributes = ['d', 'x', 'y', 'width', 'height', 'cx', 'cy', 'points', 'transform', 'x1', 'x2', 'y1', 'y2', 'r']

function geometry(container: HTMLElement) {
  // Teleports change DOM order after mount. Compare the complete multiset of geometry,
  // including duplicates, rather than requiring inline and layer trees to share order.
  return Array.from(container.querySelectorAll('[class]'))
    .filter(el => Array.from(el.classList).some(name => name.startsWith('v-charts-')))
    .map(el => ({
      tag: el.tagName,
      class: el.getAttribute('class'),
      ...Object.fromEntries(attributes.map(name => [name, el.getAttribute(name)])),
      text: el.matches('text') && el.closest('[class*="tick"]') ? el.textContent : null,
    }))
    .map(entry => JSON.stringify(entry))
    .sort()
}

function containerFor(html = '') {
  const container = document.createElement('div')
  container.innerHTML = html
  document.body.append(container)
  return container
}

async function settle() {
  await new Promise(resolve => setTimeout(resolve, 0))
  await new Promise(resolve => requestAnimationFrame(resolve))
  await nextTick()
}

const charts: { name: string, render: (reverse: boolean) => VNode }[] = [
  {
    name: 'ComposedChart',
    render(reverse) {
      const children = [
        <CartesianGrid />,
        <XAxis dataKey="name" />,
        <YAxis />,
        <Area dataKey="value" isAnimationActive={false} />,
        <Bar dataKey="other" isAnimationActive={false} />,
        <Line dataKey="value" isAnimationActive={false} />,
        <ReferenceLine y={12} />,
        <Legend />,
      ]
      return <ComposedChart width={400} height={300} data={data}>{reverse ? children.reverse() : children}</ComposedChart>
    },
  },
  {
    name: 'ComposedChart with errors, labels, reference domains and brush',
    render(reverse) {
      const rows = data.map(row => ({ ...row, error: 10 }))
      const children = [
        <XAxis dataKey="name" />,
        <YAxis />,
        <CartesianGrid />,
        <Bar dataKey="value" isAnimationActive={false} stroke="red" stroke-dasharray="3 2">
          {{ default: () => [<ErrorBar dataKey="error" />, <LabelList />] }}
        </Bar>,
        <Line dataKey="other" isAnimationActive={false} />,
        <ReferenceLine y={40} ifOverflow="extendDomain" />,
        <ReferenceArea y1={35} y2={45} ifOverflow="extendDomain" />,
        <ReferenceDot x="Beta" y={50} ifOverflow="extendDomain" />,
        <Brush height={30} />,
        <Legend />,
      ]
      return <ComposedChart width={400} height={300} data={rows}>{reverse ? children.reverse() : children}</ComposedChart>
    },
  },
  {
    name: 'ScatterChart with errors',
    render(reverse) {
      const rows = data.map(row => ({ ...row, error: 15 }))
      const children = [
        <XAxis type="number" dataKey="value" />,
        <YAxis dataKey="other" />,
        <Scatter data={rows} isAnimationActive={false}>
          {{ default: () => <ErrorBar dataKey="error" direction="y" /> }}
        </Scatter>,
        <Legend />,
      ]
      return <ScatterChart width={400} height={300}>{reverse ? children.reverse() : children}</ScatterChart>
    },
  },
  {
    name: 'FunnelChart with labels',
    render(reverse) {
      const children = [
        <Funnel data={data} dataKey="value" nameKey="name" isAnimationActive={false}>
          {{ default: () => <LabelList /> }}
        </Funnel>,
        <Legend />,
      ]
      return <FunnelChart width={400} height={300}>{reverse ? children.reverse() : children}</FunnelChart>
    },
  },
  {
    name: 'PieChart',
    render(reverse) {
      const children = [
        <Pie data={data} dataKey="value" nameKey="name" outerRadius={70} isAnimationActive={false} />,
        <Pie data={data} dataKey="other" nameKey="name" innerRadius={80} outerRadius={110} isAnimationActive={false} />,
        <Legend />,
      ]
      return <PieChart width={400} height={300}>{reverse ? children.reverse() : children}</PieChart>
    },
  },
  {
    name: 'RadarChart',
    render(reverse) {
      const children = [<PolarGrid />, <PolarAngleAxis dataKey="name" />, <PolarRadiusAxis />, <Radar dataKey="value" label isAnimationActive={false} />]
      return <RadarChart width={400} height={300} data={data}>{reverse ? children.reverse() : children}</RadarChart>
    },
  },
  {
    name: 'RadialBarChart',
    render(reverse) {
      const children = [<PolarAngleAxis type="number" />, <RadialBar dataKey="value" label isAnimationActive={false} />, <Legend />]
      return <RadialBarChart width={400} height={300} data={data}>{reverse ? children.reverse() : children}</RadialBarChart>
    },
  },
]

describe('first-render geometry is independent of declaration order', () => {
  for (const chart of charts) {
    for (const reverse of [false, true]) {
      it(`${chart.name}, ${reverse ? 'reversed' : 'forward'} children: SSR matches settled client and hydrates without warnings`, async () => {
        const render = () => chart.render(reverse)
        // Render twice to guard against a cached async wrapper becoming synchronous.
        await renderToString(createSSRApp({ render }))
        const html = await renderToString(createSSRApp({ render }))
        const server = containerFor(html)
        const client = containerFor()
        const hydrated = containerFor(html)
        const clientApp = createApp({ render })
        const hydratedApp = createSSRApp({ render })
        const warn = vi.spyOn(console, 'warn')
        const error = vi.spyOn(console, 'error')
        let didHydrate = false
        try {
          clientApp.mount(client)
          await settle()
          const expected = geometry(client)
          expect(expected.some(entry => /"d":"|"points":"/.test(entry))).toBe(true)
          expect(geometry(server)).toEqual(expected)
          hydratedApp.mount(hydrated)
          didHydrate = true
          await settle()
          expect(warn).not.toHaveBeenCalled()
          expect(error).not.toHaveBeenCalled()
          expect(geometry(hydrated)).toEqual(expected)
        }
        finally {
          clientApp.unmount()
          if (didHydrate)
            hydratedApp.unmount()
          server.remove()
          client.remove()
          hydrated.remove()
          warn.mockRestore()
          error.mockRestore()
        }
      })
    }
  }
})

// Catches real-font hydration mismatches hidden by JSDOM's default zero bounds.
describe('hydration with non-zero text measurements', () => {
  for (const chart of charts) {
    it(`${chart.name}: defers measured layout until the first frame`, async () => {
      const rect = vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(() => {
        return { x: 0, y: 0, top: 0, left: 0, right: 80, bottom: 20, width: 80, height: 20, toJSON: () => ({}) }
      })
      // Keep non-zero measurements separate from the zero-size matrix cache.
      const computedStyle = vi.spyOn(window, 'getComputedStyle').mockReturnValue({ fontSize: '17px', letterSpacing: '1px' } as CSSStyleDeclaration)
      const frames: FrameRequestCallback[] = []
      vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => frames.push(callback))
      const render = () => chart.render(false)
      const wasSsr = Global.isSsr
      Global.set('isSsr', true)
      const html = await renderToString(createSSRApp({ render }))
      Global.set('isSsr', false)
      const container = containerFor(html)
      const server = geometry(container)
      const app = createSSRApp({ render })
      const warn = vi.spyOn(console, 'warn')
      const error = vi.spyOn(console, 'error')
      try {
        app.mount(container)
        await new Promise(resolve => setTimeout(resolve, 0))
        await nextTick()
        expect(geometry(container)).toEqual(server)
        expect(warn).not.toHaveBeenCalled()
        expect(error).not.toHaveBeenCalled()
        if (chart.name === 'ComposedChart') {
          expect(container.querySelector('.v-charts-y-axis .v-charts-cartesian-axis-tick:last-child .v-charts-cartesian-axis-tick-value')?.getAttribute('y')).toBe('5')
        }
        await nextTick()
        frames.splice(0).forEach(callback => callback(0))
        await new Promise(resolve => setTimeout(resolve, 0))
        await nextTick()
        if (chart.name === 'ComposedChart') {
          // Tick selection uses the full SVG viewBox: a 20px label is inset to y=10.
          expect(container.querySelector('.v-charts-y-axis .v-charts-cartesian-axis-tick:last-child .v-charts-cartesian-axis-tick-value')?.getAttribute('y')).toBe('10')
          expect(geometry(container)).not.toEqual(server)
        }
        expect(warn).not.toHaveBeenCalled()
        expect(error).not.toHaveBeenCalled()
      }
      finally {
        app.unmount()
        container.remove()
        rect.mockRestore()
        computedStyle.mockRestore()
        Global.set('isSsr', wasSsr)
        warn.mockRestore()
        error.mockRestore()
        vi.unstubAllGlobals()
      }
    })
  }
})
