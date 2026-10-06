import { render } from '@testing-library/vue'
import { beforeEach, expect, it } from 'vitest'
import { defineComponent } from 'vue'
import { CalendarHeatmap, CohortChart, Heatmap, JourneySankey, Sparkline, Tracker, useChartHeight, useChartWidth, useMargin, usePlotArea } from '@/index'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

beforeEach(() => {
  mockGetBoundingClientRect({ width: 400, height: 200 })
})

it.each([
  ['Tracker', () => <Tracker class="mine" style={{ '--v-charts-status-up': 'teal' }} data-testid="chart" width={400} height={20} data={[{ date: 'a', status: 'up' }]} />],
  ['CalendarHeatmap', () => <CalendarHeatmap class="mine" style={{ '--v-charts-status-up': 'teal' }} data-testid="chart" width={400} height={100} start="2026-01-01" data={[{ date: '2026-01-01', value: 1 }]} />],
  ['Heatmap', () => <Heatmap class="mine" style={{ '--v-charts-status-up': 'teal' }} data-testid="chart" width={400} height={100} data={[{ x: 'a', y: 'b', value: 1 }]} />],
  ['CohortChart', () => <CohortChart class="mine" style={{ '--v-charts-status-up': 'teal' }} data-testid="chart" width={400} height={100} data={[{ cohort: 'Jan', values: [2, 1] }]} />],
  ['Sparkline', () => <Sparkline class="mine" style={{ '--v-charts-status-up': 'teal' }} data-testid="chart" width={400} height={30} data={[1, 2]} />],
  ['JourneySankey', () => <JourneySankey class="mine" style={{ '--v-charts-status-up': 'teal' }} data-testid="chart" width={400} height={200} data={[{ path: ['a', 'b'], count: 1 }]} />],
])('%s keeps the caller\'s class, style and data attributes', (_name, view) => {
  const { container } = render(view)
  const box = container.querySelector<HTMLElement>('.v-charts-wrapper')!
  expect(box.classList.contains('mine')).toBe(true)
  expect(box.style.getPropertyValue('--v-charts-status-up')).toBe('teal')
  expect(container.querySelectorAll('[data-testid="chart"]')).toHaveLength(1)
  expect(container.querySelector('[data-testid="chart"]')?.tagName).toBe('svg')
})

// Catches public layout hooks trying to read the Cartesian adapter in a standalone chart.
it('preserves the standalone public layout viewport', () => {
  const Viewport = defineComponent({
    setup() {
      const width = useChartWidth()
      const height = useChartHeight()
      const margin = useMargin()
      const area = usePlotArea()
      return () => <span data-testid="viewport">{JSON.stringify({ width: width.value, height: height.value, margin: margin.value, area: area.value })}</span>
    },
  })
  const { getByTestId } = render(() => (
    <Tracker width={400} height={32} data={[{ date: 'A', status: 'up' }]}>
      <Viewport />
    </Tracker>
  ))
  expect(JSON.parse(getByTestId('viewport').textContent!)).toEqual({
    width: 0,
    height: 0,
    margin: { top: 5, right: 5, bottom: 5, left: 5 },
    area: { x: 5, y: 5, width: 0, height: 0 },
  })
})
