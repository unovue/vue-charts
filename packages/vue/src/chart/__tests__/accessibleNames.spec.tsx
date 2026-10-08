import { render } from '@testing-library/vue'
import { expect, it } from 'vitest'
import { nextTick, ref } from 'vue'
import { AreaChart, BarChart, BarList, CalendarHeatmap, CohortChart, ComposedChart, FunnelChart, Heatmap, JourneySankey, LineChart, PieChart, RadarChart, RadialBarChart, Sankey, ScatterChart, Sparkline, SunburstChart, Tracker, Treemap } from '@/index'

const size = { width: 400, height: 200, isAnimationActive: false }

// Catches machine-style default names and title props discarded by standalone wrappers.
it.each([
  ['Area chart', (title?: string) => <AreaChart {...size} title={title} />],
  ['Bar chart', (title?: string) => <BarChart {...size} title={title} />],
  ['Line chart', (title?: string) => <LineChart {...size} title={title} />],
  ['Chart', (title?: string) => <ComposedChart {...size} title={title} />],
  ['Scatter chart', (title?: string) => <ScatterChart {...size} title={title} />],
  ['Pie chart', (title?: string) => <PieChart {...size} title={title} />],
  ['Radar chart', (title?: string) => <RadarChart {...size} title={title} />],
  ['Radial bar chart', (title?: string) => <RadialBarChart {...size} title={title} />],
  ['Funnel chart', (title?: string) => <FunnelChart {...size} title={title} />],
  ['Treemap', (title?: string) => <Treemap {...size} title={title} data={[{ name: 'A', value: 1 }]} />],
  ['Sankey diagram', (title?: string) => <Sankey {...size} title={title} data={{ nodes: [{ name: 'A' }, { name: 'B' }], links: [{ source: 0, target: 1, value: 1 }] }} />],
  ['Sunburst chart', (title?: string) => <SunburstChart {...size} title={title} data={{ name: 'Root', children: [{ name: 'A', value: 1 }] }} />],
  ['Status history', (title?: string) => <Tracker {...size} title={title} data={[{ date: 'A', status: 'up' }]} />],
  ['Heatmap', (title?: string) => <Heatmap {...size} title={title} data={[{ x: 'A', y: 'B', value: 1 }]} />],
  ['Cohort retention', (title?: string) => <CohortChart {...size} title={title} data={[{ cohort: 'A', values: [2, 1] }]} />],
  ['Activity calendar', (title?: string) => <CalendarHeatmap {...size} title={title} start="2026-01-01" data={[{ date: '2026-01-01', value: 1 }]} />],
  ['Bar list', (title?: string) => <BarList title={title} data={[{ name: 'A', value: 1 }]} />],
  ['Journeys of 1 session over 2 steps', (title?: string) => <JourneySankey {...size} title={title} data={[{ path: ['A', 'B'], count: 1 }]} />],
  ['Journeys of 5 sessions over 1 step', (title?: string) => <JourneySankey {...size} title={title} data={[{ path: ['A'], count: 5 }]} />],
  ['Trend: 2 values from 1 to 2', (title?: string) => <Sparkline {...size} title={title} data={[1, 2]} />],
  ['Trend: 1 value from 5 to 5', (title?: string) => <Sparkline {...size} title={title} data={[5]} />],
])('%s supports a human default and a caller title', async (expected, view) => {
  const title = ref<string>()
  const { container } = render(() => view(title.value))
  expect(container.querySelector(`[aria-label="${expected}"]`)).not.toBeNull()
  title.value = 'My chart'
  await nextTick()
  expect(container.querySelector('[aria-label="My chart"]')).not.toBeNull()
})
