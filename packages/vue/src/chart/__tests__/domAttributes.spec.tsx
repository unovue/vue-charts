import { fireEvent, render } from '@testing-library/vue'
import type { VNodeChild } from 'vue'
import { expect, it } from 'vitest'
import { nextTick } from 'vue'
import {
  Area,
  Bar,
  BarList,
  CohortChart,
  ComposedChart,
  Funnel,
  FunnelChart,
  Heatmap,
  LabelList,
  Line,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  RadialBar,
  RadialBarChart,
  Sankey,
  Sparkline,
  SunburstChart,
  Tooltip,
  Tracker,
  Treemap,
  XAxis,
  YAxis,
} from '@/index'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

const validMixedCase = new Set(['viewBox', 'preserveAspectRatio'])

/** Attributes that hold chart data ([object …], undefined, NaN) or React-style names SVG ignores. */
function badAttributes(container: Element) {
  return [...container.querySelectorAll('*')].flatMap(el => [...el.attributes]
    .filter(a => /\[object |^undefined$|^NaN$/.test(a.value) || (/[A-Z]/.test(a.name) && !validMixedCase.has(a.name)))
    .map(a => `${el.tagName} ${a.name}=${a.value.slice(0, 20)}`))
}

// Chart data passed between components (payload, dataKey, coordinate…) must never be written
// into the DOM, and React-style names (strokeWidth) must reach SVG as real attributes.
it('writes only valid SVG attributes, never chart data', async () => {
  mockGetBoundingClientRect({ width: 400, height: 300 })
  const data = [{ name: 'A', a: 10, b: 20 }, { name: 'B', a: 30, b: 15 }]
  const { container } = render(() => (
    <ComposedChart width={400} height={300} data={data}>
      <XAxis dataKey="name" />
      <YAxis />
      <Area dataKey="b" isAnimationActive={false} />
      <Bar dataKey="a" stroke="#000" strokeWidth={2} isAnimationActive={false}><LabelList /></Bar>
      <Line dataKey="b" strokeDasharray="4 2" isAnimationActive={false} />
      <Tooltip />
    </ComposedChart>
  ))
  await nextTick()
  await fireEvent(container.querySelector('.v-charts-wrapper')!, new MouseEvent('mousemove', { bubbles: true, clientX: 100, clientY: 100 }))
  await nextTick()
  await nextTick()
  expect(badAttributes(container)).toEqual([])
  expect(container.querySelector('.v-charts-bar-rectangle path')!.getAttribute('stroke-width')).toBe('2')
})

// The same rule for every chart outside the cartesian engine: these draw their own SVG (sectors,
// nodes, cells), so a raw camelCase prop or a data object on one of them would reach the DOM.
const rows = [{ name: 'A', value: 10 }, { name: 'B', value: 20 }, { name: 'C', value: 5 }]
const tree = { name: 'root', children: [{ name: 'A', children: [{ name: 'A1', value: 10 }] }, { name: 'B', value: 5 }] }
it.each<[string, () => VNodeChild]>([
  ['Pie', () => (
    <PieChart width={400} height={300}>
      <Pie data={rows} dataKey="value" nameKey="name" label isAnimationActive={false} />
      <Tooltip />
    </PieChart>
  )],
  ['Radar', () => (
    <RadarChart width={400} height={300} data={rows}>
      <PolarGrid />
      <PolarAngleAxis dataKey="name" />
      <PolarRadiusAxis />
      <Radar dataKey="value" dot isAnimationActive={false} />
      <Tooltip />
    </RadarChart>
  )],
  ['RadialBar', () => (
    <RadialBarChart width={400} height={300} data={rows} innerRadius={20} outerRadius={140}>
      <RadialBar dataKey="value" label isAnimationActive={false} />
      <Tooltip />
    </RadialBarChart>
  )],
  ['Funnel', () => (
    <FunnelChart width={400} height={300}>
      <Funnel data={rows} dataKey="value" nameKey="name" isAnimationActive={false}><LabelList /></Funnel>
      <Tooltip />
    </FunnelChart>
  )],
  ['Treemap', () => <Treemap width={400} height={300} data={rows} dataKey="value" isAnimationActive={false} />],
  ['Sankey', () => (
    <Sankey width={400} height={300} isAnimationActive={false} data={{ nodes: [{ name: 'A' }, { name: 'B' }, { name: 'C' }], links: [{ source: 0, target: 1, value: 5 }, { source: 0, target: 2, value: 3 }] }} />
  )],
  ['SunburstChart', () => <SunburstChart width={400} height={300} data={tree} isAnimationActive={false} />],
  ['BarList', () => <BarList data={rows} isAnimationActive={false} />],
  ['Sparkline', () => <Sparkline width={100} height={40} data={[1, 4, 2, 5]} isAnimationActive={false} />],
  ['Tracker', () => (
    <Tracker width={200} height={20} isAnimationActive={false} data={[{ date: '2026-08-21', status: 'down' }, { date: '2026-08-22', status: 'up' }]}>
      <Tooltip />
    </Tracker>
  )],
  ['Heatmap', () => (
    <Heatmap width={300} height={200} isAnimationActive={false} data={[{ x: 'Mon', y: 'AM', value: 1 }, { x: 'Tue', y: 'PM', value: 3 }]} />
  )],
  ['CohortChart', () => (
    <CohortChart width={400} height={100} isAnimationActive={false} data={[{ cohort: 'Jan', values: [10, 5] }]}>
      <Tooltip />
    </CohortChart>
  )],
])('%s writes only valid attributes, never chart data', async (_name, chart) => {
  mockGetBoundingClientRect({ width: 400, height: 300 })
  const { container } = render(chart)
  await nextTick()
  const wrapper = container.querySelector('.v-charts-wrapper')
  if (wrapper)
    await fireEvent(wrapper, new MouseEvent('mousemove', { bubbles: true, clientX: 200, clientY: 150 }))
  await nextTick()
  await nextTick()
  expect(container.querySelector('svg, .v-charts-bar-list')).not.toBeNull()
  expect(badAttributes(container)).toEqual([])
})
