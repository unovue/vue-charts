import { expect, it } from 'vitest'
import { AreaChart, BarChart, ComposedChart, FunnelChart, LineChart, PieChart, RadarChart, RadialBarChart, ScatterChart } from '@/index'

const polar = ['cx', 'cy', 'innerRadius', 'outerRadius', 'startAngle', 'endAngle']
const bar = ['barSize', 'barGap', 'barCategoryGap', 'maxBarSize']

it.each([
  [AreaChart, polar],
  [BarChart, polar],
  [ComposedChart, polar],
  [LineChart, polar],
  [ScatterChart, polar],
  [PieChart, bar],
  [RadarChart, bar],
  [FunnelChart, [...bar, ...polar]],
  [RadialBarChart, []],
] as const)('declares only the supported prop family for %s', (Chart, removed) => {
  const names = Object.keys(Chart.props ?? {})
  for (const name of ['to', 'throttleDelay', ...removed])
    expect(names).not.toContain(name)
  expect(names).toContain('isAnimationActive')
  expect(names).toContain('transition')
})
