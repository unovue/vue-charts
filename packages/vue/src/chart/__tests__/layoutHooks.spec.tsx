import { render } from '@testing-library/vue'
import { expect, it } from 'vitest'
import { defineComponent, nextTick, ref } from 'vue'
import { AreaChart, BarChart, ComposedChart, FunnelChart, LineChart, PieChart, RadarChart, RadialBarChart, ScatterChart, useChartHeight, useChartWidth, usePlotArea } from '@/index'

// Missing providers or stale root dimensions must be visible through the public hooks.
it.each([
  ['AreaChart', AreaChart],
  ['BarChart', BarChart],
  ['ComposedChart', ComposedChart],
  ['FunnelChart', FunnelChart],
  ['LineChart', LineChart],
  ['PieChart', PieChart],
  ['RadarChart', RadarChart],
  ['RadialBarChart', RadialBarChart],
  ['ScatterChart', ScatterChart],
] as const)('%s exposes current dimensions and plot margins', async (_name, Chart) => {
  const width = ref(100)
  const Probe = defineComponent({
    setup() {
      const w = useChartWidth()
      const h = useChartHeight()
      const plot = usePlotArea()
      return () => <text data-testid="layout">{JSON.stringify([w.value, h.value, plot.value])}</text>
    },
  })
  const { container } = render(() => <Chart width={width.value} height={50}><Probe /></Chart>)
  expect(container.querySelector('[data-testid="layout"]')?.textContent).toBe('[100,50,{"x":5,"y":5,"width":90,"height":40}]')
  width.value = 200
  await nextTick()
  expect(container.querySelector('[data-testid="layout"]')?.textContent).toBe('[200,50,{"x":5,"y":5,"width":190,"height":40}]')
})
