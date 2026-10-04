import { render } from '@testing-library/vue'
import { beforeEach, expect, it } from 'vitest'
import { CalendarHeatmap, CohortChart, Heatmap, JourneySankey, Sparkline, Tracker } from '@/index'
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
  expect(container.querySelector('[data-testid="chart"]')).not.toBeNull()
})
